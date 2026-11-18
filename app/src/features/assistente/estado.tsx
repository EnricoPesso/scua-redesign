import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { hoje } from '../../mock/datas';
import { usePermissoes } from '../extensoes/hooks/queries';
import { conferirAcoes, ferramentasPara, formularioPorId, formulariosPara, telasDoContexto, type ResultadoAplicar } from './acoes';
import { ErroDoAssistente, perguntar } from './api';
import type { Acao, Alvo, Mensagem, NomeFerramenta, PedidoAssistente } from './contrato';
import { assinarConfig, lerAutomatica, lerConfig, salvarAutomatica } from './preferencias';

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

export interface MensagemDaConversa extends Mensagem { erro?: boolean }

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

  // Sempre o valor mais recente, para funções chamadas depois de uma espera.
  const registro = useRef<{ dono: object; registro: RegistroAlvo } | null>(null);
  const conversaRef = useRef<MensagemDaConversa[]>([]);
  const ocupado = useRef(false);
  const ultimoTexto = useRef('');
  const pendente = useRef<{ formulario: string; mensagens: Mensagem[]; relogio: ReturnType<typeof setTimeout> } | null>(null);
  const rota = useRef(local.pathname + local.search);
  rota.current = local.pathname + local.search;

  const acrescentar = useCallback((m: MensagemDaConversa) => {
    conversaRef.current = [...conversaRef.current, m];
    setConversa(conversaRef.current);
  }, []);

  const cancelarPendente = useCallback(() => {
    if (pendente.current) clearTimeout(pendente.current.relogio);
    pendente.current = null;
  }, []);

  const limpar = useCallback(() => {
    cancelarPendente();
    conversaRef.current = [];
    setConversa([]);
  }, [cancelarPendente]);

  // Trocou de pessoa: conversa nova e a preferência dela.
  useEffect(() => {
    limpar();
    setAutomatica(usuarioId ? lerAutomatica(usuarioId) : false);
  }, [usuarioId, limpar]);

  const podeAutomatica = config.permitirAutomatica;

  /** Pergunta à IA com as mensagens dadas e aplica o que voltar. `repetido`: segunda volta de um pedido pendente. */
  const perguntarEAplicar = useCallback(async (mensagens: Mensagem[], repetido: boolean) => {
    if (!permissoes) return;
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
    setSimulado(resposta.simulado === true);
    const { validas, recusadas } = conferirAcoes(resposta.acoes, { permissoes, alvo });
    const partes: string[] = resposta.texto ? [resposta.texto] : [];

    for (const acao of validas as Acao[]) {
      if (acao.tipo === 'preencher') {
        if (!atual?.aplicar) { partes.push(SEM_ACESSO); continue; }
        const resultado = atual.aplicar(acao.campos);
        const descricao = descrever(resultado);
        if (descricao) partes.push(descricao);
        if (resultado.aplicados.length === 0) continue;
        // A função de salvar é lida de novo: a tela se registra outra vez a cada mudança.
        const salvar = registro.current?.registro.salvar;
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
        if (alvo?.tipo === 'formulario' && alvo.id === formulario.id) { partes.push('O formulário já está aberto. Diga os valores que eu preencho.'); continue; }
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

  /** Mensagens que vão para a IA: a conversa sem os avisos de erro. */
  const paraEnviar = () => conversaRef.current.filter((m) => !m.erro).map(({ papel, texto }) => ({ papel, texto }));

  const enviar = useCallback(async (texto: string) => {
    const limpo = texto.trim();
    if (!limpo || ocupado.current || !permissoes) return;
    cancelarPendente();
    ultimoTexto.current = limpo;
    acrescentar({ papel: 'usuario', texto: limpo });
    await rodar(paraEnviar(), false);
  }, [permissoes, acrescentar, cancelarPendente, rodar]);

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
      setIdDoAlvo(atual ? (atual.tipo === 'formulario' ? atual.id : `relatorio:${atual.titulo}`) : null);
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

  const definirAutomatica = useCallback((ligada: boolean) => {
    setAutomatica(ligada);
    if (usuarioId) salvarAutomatica(usuarioId, ligada);
  }, [usuarioId]);

  const valor = useMemo<Assistente>(() => ({
    ativo: config.ativo && Boolean(permissoes),
    aberto,
    abrir: () => setAberto(true),
    fechar: () => setAberto(false),
    conversa,
    pensando,
    simulado,
    tipoDoAlvo,
    enviar,
    tentarDeNovo,
    limpar,
    automatica: automatica && podeAutomatica,
    podeAutomatica,
    definirAutomatica,
  }), [config.ativo, permissoes, aberto, conversa, pensando, simulado, tipoDoAlvo, enviar, tentarDeNovo, limpar, automatica, podeAutomatica, definirAutomatica]);

  return (
    <ContextoRegistro.Provider value={registrador}>
      <ContextoAssistente.Provider value={valor}>{children}</ContextoAssistente.Provider>
    </ContextoRegistro.Provider>
  );
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
