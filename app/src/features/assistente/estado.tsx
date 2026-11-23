import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { hoje } from '../../mock/datas';
import { textoLoteOk } from '../extensoes/components/BarraLote';
import { mensagemParaUsuario } from '../extensoes/domain/erros';
import { formatarDuracao } from '../extensoes/domain/horas';
import { useDecidirEmLote } from '../extensoes/hooks/mutations';
import { usePermissoes } from '../extensoes/hooks/queries';
import { conferirAcoes, ferramentasPara, formularioPorId, formulariosPara, telasDoContexto, type ResultadoAplicar } from './acoes';
import { ErroDoAssistente, perguntar } from './api';
import type { Acao, Alvo, Mensagem, NomeFerramenta, PedidoAssistente } from './contrato';
import { assinarConfig, lerAutomatica, lerConfig, salvarAutomatica } from './preferencias';
import type { CartaoDaConversa, EstadoDoLote } from './resumo/tiposDeCartao';
import { entenderPedido, type Intencao } from './resumo/intencao';
import { fraseDeAbertura, type ItemDoResumo, type ResumoDoDia } from './resumo/resumoDoDia';
import { carregarPedidosParaDecidir, useResumoDoDia } from './resumo/useResumoDoDia';

/**
 * Estado do assistente: a conversa, a tela aberta (alvo) e a aplicação das ações que a IA devolve.
 * Cada tela com formulário ou relatório se registra com `useAlvoDoAssistente`.
 */

export interface RegistroAlvo {
  alvo: Alvo;
  /** Coloca os valores no formulário e diz o que entrou e o que não serviu. */
  aplicar?: (campos: Record<string, unknown>) => ResultadoAplicar;
  /** Valida e salva o formulário (aprovação automática). */
  salvar?: () => Promise<{ ok: boolean; mensagem: string }>;
}

export interface MensagemDaConversa extends Mensagem {
  id: number;
  erro?: boolean;
  /** Mensagem do próprio app (a abertura do dia): aparece na conversa, mas não vai para a IA. */
  local?: boolean;
  cartao?: CartaoDaConversa;
}
type NovaMensagem = Omit<MensagemDaConversa, 'id'>;

interface Assistente {
  ativo: boolean;
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
  conversa: MensagemDaConversa[];
  pensando: boolean;
  simulado: boolean;
  /** Tipo da tela aberta, para as sugestões da janela. */
  tipoDoAlvo: Alvo['tipo'] | null;
  enviar: (texto: string) => Promise<void>;
  tentarDeNovo: () => Promise<void>;
  limpar: () => void;
  /** O resumo do dia de quem está logado; null enquanto carrega. */
  resumo: ResumoDoDia | null;
  /** Quantos itens precisam da pessoa hoje (0 enquanto carrega). */
  contador: number;
  /** Abre a conversa já no assunto do item (ou propõe a aprovação em lote, para o item dos pedidos). */
  resolverItem: (item: ItemDoResumo) => void;
  /** Trata o item dentro da conversa já aberta. */
  tratarItem: (item: ItemDoResumo) => Promise<void>;
  confirmarLote: (mensagemId: number) => Promise<void>;
  cancelarLote: (mensagemId: number) => void;
  automatica: boolean;
  podeAutomatica: boolean;
  definirAutomatica: (ligada: boolean) => void;
}

interface Registrador { registrar: (dono: object, registro: RegistroAlvo | null) => void; remover: (dono: object) => void }

const ContextoAssistente = createContext<Assistente | null>(null);
const ContextoRegistro = createContext<Registrador | null>(null);

/** Ajustes que os testes podem encurtar. */
export const AJUSTES = { prazoDoPendenteMs: 8000 };

const SEM_ACESSO = 'Não posso fazer isso com o seu acesso.';
const FORMULARIO_MUDOU = 'O formulário mudou enquanto eu respondia, então não preenchi nada. Peça de novo.';
const PENDENTE_FALHOU = 'Abri a tela, mas não consegui preencher. Peça de novo com o formulário aberto.';
const TEXTO_DO_ERRO: Record<string, string> = {
  'chave-recusada': 'A chave da IA foi recusada. Avise o administrador.',
  limite: 'O limite de uso da IA foi atingido. Tente daqui a pouco.',
};
const ERRO_PADRAO = 'Não consegui responder agora.';

function descrever(r: ResultadoAplicar): string {
  const partes: string[] = [];
  if (r.aplicados.length > 0) partes.push(`Preenchi:\n${r.aplicados.map((a) => `- ${a.rotulo}: ${a.valor}`).join('\n')}`);
  if (r.ignorados.length > 0) partes.push(`Não preenchi: ${r.ignorados.join(', ')}.`);
  return partes.join('\n\n');
}

export function AssistenteProvider({ children }: { children: ReactNode }) {
  const permissoes = usePermissoes().data;
  const navigate = useNavigate();
  const local = useLocation();
  const config = useSyncExternalStore(assinarConfig, lerConfig, lerConfig);

  const [aberto, setAberto] = useState(false);
  const [conversa, setConversa] = useState<MensagemDaConversa[]>([]);
  const [pensando, setPensando] = useState(false);
  const [simulado, setSimulado] = useState(false);
  const [idDoAlvo, setIdDoAlvo] = useState<string | null>(null);
  const [tipoDoAlvo, setTipoDoAlvo] = useState<Alvo['tipo'] | null>(null);

  const usuarioId = permissoes?.usuario.id;
  const [automatica, setAutomatica] = useState(false);
  const dadosDoDia = useResumoDoDia();
  const resumoDoDia = dadosDoDia.resumo;
  const erroDoResumo = dadosDoDia.erro;
  const client = useQueryClient();
  const decidirEmLote = useDecidirEmLote();
  // A abertura do dia aparece uma vez por vez que a janela abre (e não volta depois de "Limpar conversa").
  const saudou = useRef(false);

  // Sempre o valor mais recente, para funções chamadas depois de uma espera.
  const registro = useRef<{ dono: object; registro: RegistroAlvo } | null>(null);
  const conversaRef = useRef<MensagemDaConversa[]>([]);
  const ocupado = useRef(false);
  // Muda quando a conversa é limpa ou a pessoa troca: resposta de um pedido anterior é descartada.
  const geracao = useRef(0);
  const ultimoTexto = useRef('');
  const pendente = useRef<{ formulario: string; mensagens: Mensagem[]; relogio: ReturnType<typeof setTimeout> } | null>(null);
  const rota = useRef(local.pathname + local.search);
  rota.current = local.pathname + local.search;

  const proximoId = useRef(0);
  const acrescentar = useCallback((m: NovaMensagem): number => {
    const id = ++proximoId.current;
    conversaRef.current = [...conversaRef.current, { ...m, id }];
    setConversa(conversaRef.current);
    return id;
  }, []);
  const atualizar = useCallback((id: number, mudar: (m: MensagemDaConversa) => MensagemDaConversa) => {
    conversaRef.current = conversaRef.current.map((m) => (m.id === id ? mudar(m) : m));
    setConversa(conversaRef.current);
  }, []);

  const cancelarPendente = useCallback(() => {
    if (pendente.current) clearTimeout(pendente.current.relogio);
    pendente.current = null;
  }, []);

  const limpar = useCallback(() => {
    cancelarPendente();
    geracao.current += 1;
    conversaRef.current = [];
    setConversa([]);
  }, [cancelarPendente]);

  const limparConversa = useCallback(() => {
    limpar();
    saudou.current = true;
  }, [limpar]);

  // Trocou de pessoa: conversa nova e a preferência dela.
  useEffect(() => {
    limpar();
    saudou.current = false;
    setAutomatica(usuarioId ? lerAutomatica(usuarioId) : false);
  }, [usuarioId, limpar]);

  const podeAutomatica = config.permitirAutomatica;

  /** Pergunta à IA com as mensagens dadas e aplica o que voltar. `repetido`: segunda volta de um pedido pendente. */
  const perguntarEAplicar = useCallback(async (mensagens: Mensagem[], repetido: boolean) => {
    if (!permissoes) return;
    const minhaGeracao = geracao.current;
    // O formulário (ou relatório) da hora do pedido. A resposta só vale para ele.
    const dono = registro.current?.dono ?? null;
    const atual = registro.current?.registro ?? null;
    const alvo = atual?.alvo ?? null;
    // Na segunda volta o formulário já está aberto: não oferece abrir de novo (evita ficar em círculo).
    const ferramentas: NomeFerramenta[] = ferramentasPara(permissoes, alvo).filter((f) => !(repetido && f === 'abrir_formulario'));
    const pedido: PedidoAssistente = {
      mensagens,
      contexto: {
        rota: rota.current,
        pessoa: permissoes.usuario.nome.split(' ')[0],
        hoje: hoje(),
        telas: telasDoContexto(permissoes),
        formularios: ferramentas.includes('abrir_formulario') ? formulariosPara(permissoes) : [],
        alvo,
      },
      ferramentas,
    };

    const resposta = await perguntar(pedido);
    // A conversa foi limpa ou a pessoa trocou enquanto a IA respondia: a resposta não vale mais.
    if (geracao.current !== minhaGeracao) return;
    setSimulado(resposta.simulado === true);
    const { validas, recusadas } = conferirAcoes(resposta.acoes, { permissoes, alvo, ferramentas });
    const partes: string[] = resposta.texto ? [resposta.texto] : [];

    for (const acao of validas as Acao[]) {
      if (acao.tipo === 'preencher') {
        if (!atual?.aplicar) { partes.push(SEM_ACESSO); continue; }
        // A pessoa fechou ou trocou de formulário durante a espera: não preenche (nem salva) outro no lugar.
        if (registro.current?.dono !== dono) { partes.push(FORMULARIO_MUDOU); continue; }
        const resultado = atual.aplicar(acao.campos);
        const descricao = descrever(resultado);
        if (descricao) partes.push(descricao);
        if (resultado.aplicados.length === 0) continue;
        // A função de salvar é lida de novo: a tela se registra outra vez a cada mudança.
        const salvar = registro.current?.dono === dono ? registro.current.registro.salvar : undefined;
        if (automatica && podeAutomatica && salvar) {
          const salvo = await salvar();
          partes.push(salvo.mensagem);
        } else {
          partes.push('Confira e clique em Salvar.');
        }
      } else if (acao.tipo === 'navegar') {
        navigate(acao.rota);
        if (!resposta.texto) {
          const caminho = acao.rota.split('?')[0];
          const tela = telasDoContexto(permissoes).find((t) => t.para.split('?')[0] === caminho);
          partes.push(tela ? `Abri ${tela.titulo.replace(/^Criar: /, '')}.` : 'Abri a tela.');
        }
      } else {
        const formulario = formularioPorId(acao.formulario);
        if (!formulario) continue;
        cancelarPendente();
        // O formulário pedido já é o que está na tela: não há o que abrir.
        // (Um formulário de edição não conta: criar é outro formulário.)
        if (alvo?.tipo === 'formulario' && alvo.id === formulario.id && !alvo.editando) { partes.push('O formulário já está aberto. Diga os valores que eu preencho.'); continue; }
        const relogio = setTimeout(() => {
          if (pendente.current?.formulario !== formulario.id) return;
          pendente.current = null;
          acrescentar({ papel: 'assistente', texto: PENDENTE_FALHOU });
        }, AJUSTES.prazoDoPendenteMs);
        pendente.current = { formulario: formulario.id, mensagens, relogio };
        navigate(formulario.rota);
        if (!resposta.texto) partes.push(`Abrindo ${formulario.titulo}…`);
      }
    }
    if (recusadas.length > 0) partes.push(SEM_ACESSO);
    if (partes.length === 0) partes.push('Não entendi. Pode dizer de outro jeito?');
    acrescentar({ papel: 'assistente', texto: partes.join('\n\n') });
  }, [permissoes, automatica, podeAutomatica, navigate, acrescentar, cancelarPendente]);

  const rodar = useCallback(async (mensagens: Mensagem[], repetido: boolean) => {
    ocupado.current = true;
    setPensando(true);
    try {
      await perguntarEAplicar(mensagens, repetido);
    } catch (e) {
      const texto = e instanceof ErroDoAssistente ? TEXTO_DO_ERRO[e.motivo] ?? ERRO_PADRAO : ERRO_PADRAO;
      acrescentar({ papel: 'assistente', texto, erro: true });
    } finally {
      ocupado.current = false;
      setPensando(false);
    }
  }, [perguntarEAplicar, acrescentar]);

  // A versão mais recente de `rodar`, para o pedido pendente (que dispara fora de um evento da pessoa).
  const rodarRef = useRef(rodar);
  rodarRef.current = rodar;

  /** Mensagens que vão para a IA: a conversa sem os avisos de erro e sem o que o próprio app escreveu (resumo do dia e lote, que citam nomes e valores de colegas). */
  const paraEnviar = () => conversaRef.current.filter((m) => !m.erro && !m.local).map(({ papel, texto }) => ({ papel, texto }));

  /* ---------- Resumo do dia e aprovação em lote (feitos pelo app, sem IA) ---------- */

  /** Roda uma tarefa do app com o "Pensando…" e o envio travado. Falha vira aviso curto, sem texto técnico. */
  const trabalhando = useCallback(async (tarefa: () => Promise<void>) => {
    ocupado.current = true;
    setPensando(true);
    try {
      await tarefa();
    } catch {
      acrescentar({ local: true, papel: 'assistente', texto: ERRO_PADRAO });
    } finally {
      ocupado.current = false;
      setPensando(false);
    }
  }, [acrescentar]);

  const mudarEstadoDoLote = useCallback((id: number, estado: EstadoDoLote) => {
    atualizar(id, (m) => (m.cartao?.tipo === 'lote' ? { ...m, cartao: { ...m.cartao, estado } } : m));
  }, [atualizar]);

  /** Mostra o cartão de confirmação com o que seria aprovado. Não grava nada. */
  const proporLote = useCallback(async () => {
    if (!permissoes?.podeAprovar) {
      acrescentar({ local: true, papel: 'assistente', texto: 'Você não tem acesso para aprovar pedidos.' });
      return;
    }
    const minhaGeracao = geracao.current;
    // Sempre a fila de agora: um lote antigo não vale.
    const pedidos = await client.fetchQuery({
      queryKey: ['extensoes', 'assistente', 'lote', permissoes.usuario.id],
      queryFn: () => carregarPedidosParaDecidir(hoje()),
      staleTime: 0,
    });
    if (geracao.current !== minhaGeracao) return;
    // Um cartão anterior que ainda esperava confirmação perde o efeito.
    for (const m of conversaRef.current) {
      if (m.cartao?.tipo === 'lote' && m.cartao.estado === 'aguardando') mudarEstadoDoLote(m.id, 'substituido');
    }
    if (pedidos.length === 0) {
      acrescentar({ local: true, papel: 'assistente', texto: 'Não há pedidos esperando a sua decisão.' });
      return;
    }
    const dentro = pedidos.filter((x) => x.dentroDoLimite);
    const fora = pedidos.filter((x) => !x.dentroDoLimite);
    if (dentro.length === 0) {
      const lista = fora.map((f) => `- ${f.nome}: ${f.motivoFora}`).join('\n');
      acrescentar({
        local: true, papel: 'assistente',
        texto: `${pedidos.length === 1 ? 'O pedido não cabe' : `Nenhum dos ${pedidos.length} pedidos cabe`} no limite do grupo, então não aprovo nada em lote:\n${lista}\n\nDecida ${fora.length === 1 ? 'esse' : 'esses'} na tela de pedidos.`,
        cartao: { tipo: 'abrir', rota: '/extensoes/aprovar', rotulo: 'Ver pedidos' },
      });
      return;
    }
    const total = dentro.reduce((soma, x) => soma + x.minutos, 0);
    acrescentar({
      local: true, papel: 'assistente',
      texto: `Posso aprovar ${dentro.length} ${dentro.length === 1 ? 'pedido dentro do limite' : 'pedidos dentro do limite'}, ${formatarDuracao(total)} no total. Nada é aprovado até você confirmar.`,
      cartao: { tipo: 'lote', dentro, fora, estado: 'aguardando' },
    });
  }, [permissoes, client, acrescentar, mudarEstadoDoLote]);

  const confirmarLote = useCallback(async (id: number) => {
    const m = conversaRef.current.find((x) => x.id === id);
    // Só um toque vale: depois do primeiro, o cartão sai do estado "aguardando".
    if (!m || m.cartao?.tipo !== 'lote' || m.cartao.estado !== 'aguardando' || !permissoes?.podeAprovar) return;
    const { dentro } = m.cartao;
    mudarEstadoDoLote(id, 'enviando');
    try {
      // O cartão pode ter ficado aberto enquanto a fila mudava (ex.: outro pedido da mesma pessoa aprovado na tela).
      // Confere de novo: se algum pedido saiu da fila ou deixou de caber no limite, nada é aprovado.
      const atuais = await client.fetchQuery({
        queryKey: ['extensoes', 'assistente', 'lote', permissoes.usuario.id],
        queryFn: () => carregarPedidosParaDecidir(hoje()),
        staleTime: 0,
      });
      const aindaCabem = new Set(atuais.filter((x) => x.dentroDoLimite).map((x) => x.id));
      if (dentro.some((x) => !aindaCabem.has(x.id))) {
        mudarEstadoDoLote(id, 'substituido');
        acrescentar({ local: true, papel: 'assistente', texto: 'A fila mudou desde que montei esta lista, então não aprovei nada. Peça de novo para eu conferir os pedidos de agora.' });
        return;
      }
      const r = await decidirEmLote.mutateAsync({ ids: dentro.map((x) => x.id), decisao: { acao: 'aprovar' } });
      mudarEstadoDoLote(id, 'concluido');
      const partes: string[] = [];
      if (r.sucesso.length > 0) partes.push(textoLoteOk(r.sucesso.length, 'aprovar'));
      if (r.falhas.length > 0) {
        partes.push(`${r.falhas.length} ${r.falhas.length === 1 ? 'não foi aprovado' : 'não foram aprovados'}:\n${r.falhas.map((f) => `- ${f.nome}: ${f.motivo}`).join('\n')}`);
      }
      acrescentar({ local: true, papel: 'assistente', texto: partes.join('\n\n') || 'Nenhum pedido foi aprovado.' });
    } catch (e) {
      mudarEstadoDoLote(id, 'aguardando');
      acrescentar({ local: true, papel: 'assistente', texto: `${mensagemParaUsuario(e, 'decidir')} Nada foi aprovado. Você pode tentar de novo.` });
    }
  }, [permissoes, client, decidirEmLote, mudarEstadoDoLote, acrescentar]);

  const cancelarLote = useCallback((id: number) => {
    const m = conversaRef.current.find((x) => x.id === id);
    if (!m || m.cartao?.tipo !== 'lote' || m.cartao.estado !== 'aguardando') return;
    mudarEstadoDoLote(id, 'cancelado');
    acrescentar({ local: true, papel: 'assistente', texto: 'Cancelado. Nada foi aprovado.' });
  }, [mudarEstadoDoLote, acrescentar]);

  const tratarItem = useCallback(async (item: ItemDoResumo) => {
    if (ocupado.current) return;
    cancelarPendente();
    acrescentar({ local: true, papel: 'usuario', texto: item.titulo });
    await trabalhando(async () => {
      if (item.id === 'pedidos' && item.aprovarEmLote) await proporLote();
      else acrescentar({ local: true, papel: 'assistente', texto: item.detalhe, cartao: { tipo: 'abrir', rota: item.rota, rotulo: item.rotuloDaRota } });
    });
  }, [cancelarPendente, acrescentar, trabalhando, proporLote]);

  const seguirIntencao = useCallback(async (intencao: Intencao) => {
    if (!permissoes) return;
    if (intencao === 'aprovar-lote') {
      await trabalhando(proporLote);
    } else if (intencao === 'reprovar') {
      acrescentar({
        local: true, papel: 'assistente',
        texto: 'Eu não reprovo pedidos nem excluo nada. Quem decide esses casos é você, na tela de pedidos.',
        cartao: permissoes.podeAprovar ? { tipo: 'abrir', rota: '/extensoes/aprovar', rotulo: 'Ver pedidos' } : undefined,
      });
    } else {
      const resumo = resumoDoDia;
      const erro = erroDoResumo;
      if (!resumo) {
        acrescentar({ local: true, papel: 'assistente', texto: erro ? 'Não consegui montar o resumo agora. Tente de novo em instantes.' : 'Ainda estou conferindo o seu dia. Pergunte de novo em instantes.' });
        return;
      }
      acrescentar({
        local: true, papel: 'assistente',
        texto: fraseDeAbertura(permissoes.usuario.nome.split(' ')[0], resumo.itens.length, new Date().getHours()),
        cartao: resumo.itens.length > 0 ? { tipo: 'resumo', itens: resumo.itens } : undefined,
      });
    }
  }, [permissoes, resumoDoDia, erroDoResumo, trabalhando, proporLote, acrescentar]);

  const enviar = useCallback(async (texto: string) => {
    const limpo = texto.trim();
    if (!limpo || ocupado.current || !permissoes) return;
    cancelarPendente();
    ultimoTexto.current = limpo;
    acrescentar({ papel: 'usuario', texto: limpo });
    // O resumo do dia e a aprovação em lote são do app (não da IA): sempre passam pelo cartão de confirmação.
    const intencao = entenderPedido(limpo);
    if (intencao) {
      await seguirIntencao(intencao);
      return;
    }
    await rodar(paraEnviar(), false);
  }, [permissoes, acrescentar, cancelarPendente, rodar, seguirIntencao]);

  const tentarDeNovo = useCallback(async () => {
    if (ocupado.current || !ultimoTexto.current) return;
    // Tira o aviso de erro e pergunta de novo com a mesma conversa.
    conversaRef.current = conversaRef.current.filter((m) => !m.erro);
    setConversa(conversaRef.current);
    await rodar(paraEnviar(), false);
  }, [rodar]);

  const registrador = useMemo<Registrador>(() => ({
    registrar(dono, novo) {
      if (!novo) { if (registro.current?.dono === dono) registro.current = null; }
      else registro.current = { dono, registro: novo };
      const atual = registro.current?.registro.alvo ?? null;
      // A edição ganha um sufixo: um pedido pendente de criação só continua num formulário de criação.
      setIdDoAlvo(atual ? (atual.tipo === 'formulario' ? `${atual.id}${atual.editando ? '#editar' : ''}` : `relatorio:${atual.titulo}`) : null);
      setTipoDoAlvo(atual?.tipo ?? null);
    },
    remover(dono) {
      if (registro.current?.dono !== dono) return;
      registro.current = null;
      setIdDoAlvo(null);
      setTipoDoAlvo(null);
    },
  }), []);

  // Pedido pendente: quando o formulário esperado aparece, o mesmo pedido continua sozinho.
  useEffect(() => {
    const p = pendente.current;
    if (!p || idDoAlvo === null) return;
    clearTimeout(p.relogio);
    pendente.current = null;
    if (idDoAlvo === p.formulario) void rodarRef.current(p.mensagens, true);
    else acrescentar({ papel: 'assistente', texto: PENDENTE_FALHOU });
  }, [idDoAlvo, acrescentar]);

  useEffect(() => cancelarPendente, [cancelarPendente]);

  // Abriu a conversa vazia (fora de um formulário): a primeira mensagem é o resumo do dia.
  const resumoPronto = resumoDoDia;
  useEffect(() => {
    if (!aberto) { saudou.current = false; return; }
    if (saudou.current) return;
    if (conversaRef.current.length > 0) { saudou.current = true; return; }
    if (tipoDoAlvo === 'formulario' || !permissoes || !resumoPronto) return;
    saudou.current = true;
    acrescentar({
      local: true, papel: 'assistente',
      texto: fraseDeAbertura(permissoes.usuario.nome.split(' ')[0], resumoPronto.itens.length, new Date().getHours()),
      cartao: resumoPronto.itens.length > 0 ? { tipo: 'resumo', itens: resumoPronto.itens } : undefined,
    });
  }, [aberto, conversa.length, tipoDoAlvo, permissoes, resumoPronto, acrescentar]);

  const definirAutomatica = useCallback((ligada: boolean) => {
    setAutomatica(ligada);
    if (usuarioId) salvarAutomatica(usuarioId, ligada);
  }, [usuarioId]);

  const valor = useMemo<Assistente>(() => ({
    ativo: config.ativo && Boolean(permissoes),
    aberto,
    abrir: () => setAberto(true),
    // Fechar a conversa desiste do pedido que esperava um formulário abrir.
    fechar: () => { cancelarPendente(); setAberto(false); },
    conversa,
    pensando,
    simulado,
    tipoDoAlvo,
    enviar,
    tentarDeNovo,
    limpar: limparConversa,
    resumo: resumoDoDia,
    contador: resumoDoDia?.itens.length ?? 0,
    resolverItem: (item) => { setAberto(true); void tratarItem(item); },
    tratarItem,
    confirmarLote,
    cancelarLote,
    automatica: automatica && podeAutomatica,
    podeAutomatica,
    definirAutomatica,
  }), [config.ativo, permissoes, aberto, conversa, pensando, simulado, tipoDoAlvo, enviar, tentarDeNovo, limparConversa, resumoDoDia, tratarItem, confirmarLote, cancelarLote, automatica, podeAutomatica, definirAutomatica, cancelarPendente]);

  return (
    <ContextoRegistro.Provider value={registrador}>
      <ContextoAssistente.Provider value={valor}>{children}</ContextoAssistente.Provider>
    </ContextoRegistro.Provider>
  );
}

/** Como `useAssistente`, mas devolve null fora do provedor (telas que só oferecem o botão quando o assistente existe). */
export function useAssistenteOuNulo(): Assistente | null {
  return useContext(ContextoAssistente);
}

export function useAssistente(): Assistente {
  const v = useContext(ContextoAssistente);
  if (!v) throw new Error('useAssistente precisa estar dentro de AssistenteProvider');
  return v;
}

/**
 * A tela diz ao assistente o que está aberto (um formulário ou um relatório). `null` = nada.
 * Pode ser chamado a cada render com um objeto novo: só o conteúdo mais recente é guardado.
 * Fora do AssistenteProvider (ex.: teste de um componente isolado), não faz nada.
 */
export function useAlvoDoAssistente(registro: RegistroAlvo | null): void {
  const registrador = useContext(ContextoRegistro);
  const dono = useRef({}).current;
  useEffect(() => {
    registrador?.registrar(dono, registro);
  });
  useEffect(() => () => registrador?.remover(dono), [registrador, dono]);
}
