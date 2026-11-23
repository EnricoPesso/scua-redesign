import { somarDias } from '../../../mock/datas';
import { CUSTO_HORA, type DiaDeJornada } from '../../../mock/jornadaReal';
import { custoDaOcorrencia, emHoras, emReais, extraDoDia, ocorrenciasDe } from '../../../lib/conformidade';
import type { EstacaoDiretorio } from '../../../mock/diretorio';
import { formatarPeriodo, mesDe } from '../../extensoes/domain/formatacao';
import { formatarDuracao, totalMinutos } from '../../extensoes/domain/horas';
import { avaliarLimite } from '../../extensoes/domain/limite';
import type { Pedido, Permissoes, ResumoBeneficiario } from '../../extensoes/domain/types';

/**
 * Resumo do dia: o que precisa da atenção de quem está logado, em ordem de importância.
 * São regras puras (sem rede, sem relógio): quem busca os dados e passa para cá é `useResumoDoDia`.
 * Quem é só colaborador recebe apenas o que é dele; dados de outras pessoas nunca entram.
 */

export type Gravidade = 'alta' | 'media' | 'baixa';
export type IdDoItem = 'pedidos' | 'passivo' | 'previsao' | 'estacoes' | 'meu-pedido';

export interface ItemDoResumo {
  id: IdDoItem;
  /** Frase curta: "3 pedidos de extensão esperam você". */
  titulo: string;
  detalhe: string;
  gravidade: Gravidade;
  /** Tela que resolve o assunto. */
  rota: string;
  /** Nome do botão que abre a tela ("Ver pedidos"). */
  rotuloDaRota: string;
  /** Só o item dos pedidos: há o que aprovar em lote pelo assistente. */
  aprovarEmLote?: boolean;
}

export const TUDO_EM_ORDEM = 'Tudo em ordem por aqui.';

export const ROTULO_DA_GRAVIDADE: Record<Gravidade, string> = { alta: 'Prioridade alta', media: 'Prioridade média', baixa: 'Prioridade baixa' };
const PESO: Record<Gravidade, number> = { alta: 0, media: 1, baixa: 2 };

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

/* ---------- Pedidos esperando a decisão ---------- */

export interface PedidoParaDecidir {
  id: string;
  nome: string;
  minutos: number;
  /** "13–15/10 · 18:00–20:00". */
  periodo: string;
  /** Cabe no limite mensal do grupo: só estes entram na aprovação em lote. */
  dentroDoLimite: boolean;
  /** Por que ficou de fora do lote. */
  motivoFora?: string;
  diasEsperando: number;
}

const chaveDoResumo = (beneficiarioId: string, mes: string) => `${beneficiarioId}|${mes}`;
export { chaveDoResumo };

/**
 * Separa os pedidos pendentes entre os que cabem no limite mensal do grupo e os que passam dele.
 * Os pedidos da mesma pessoa no mesmo mês se somam, do mais antigo ao mais novo: o primeiro que estoura o limite
 * (e os seguintes que também não cabem) ficam de fora. Sem o dado do limite, não dá para garantir: fica de fora.
 * `resumos` tem a chave `chaveDoResumo(pessoa, mês)`; `null` = a API não tem o dado.
 */
export function classificarPedidos(pedidos: Pedido[], resumos: Map<string, ResumoBeneficiario | null>, hoje: string): PedidoParaDecidir[] {
  const acumulado = new Map<string, number>();
  const decididos = new Map<string, Pick<PedidoParaDecidir, 'dentroDoLimite' | 'motivoFora'>>();
  const antigosPrimeiro = [...pedidos].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm) || a.id.localeCompare(b.id));

  for (const p of antigosPrimeiro) {
    const minutos = totalMinutos(p.dataInicial, p.dataFinal, p.horario);
    const chave = chaveDoResumo(p.beneficiario.id, mesDe(p.dataInicial));
    const resumo = resumos.get(chave) ?? null;
    if (!resumo) {
      decididos.set(p.id, { dentroDoLimite: false, motivoFora: 'não consegui conferir o limite do grupo' });
      continue;
    }
    const usado = resumo.minutosAprovadosNoMes + (acumulado.get(chave) ?? 0);
    const avaliacao = avaliarLimite(usado, minutos, resumo.limiteMensalMin);
    if (avaliacao.faixa === 'excedido' && resumo.limiteMensalMin !== null) {
      const grupo = p.grupo ? ` do grupo ${p.grupo}` : ' do grupo';
      decididos.set(p.id, { dentroDoLimite: false, motivoFora: `passaria do limite mensal${grupo} (${formatarDuracao(avaliacao.totalMin)} de ${formatarDuracao(resumo.limiteMensalMin)})` });
    } else {
      acumulado.set(chave, (acumulado.get(chave) ?? 0) + minutos);
      decididos.set(p.id, { dentroDoLimite: true });
    }
  }

  return pedidos.map((p) => ({
    id: p.id,
    nome: p.beneficiario.nome,
    minutos: totalMinutos(p.dataInicial, p.dataFinal, p.horario),
    periodo: formatarPeriodo(p.dataInicial, p.dataFinal, p.horario),
    ...decididos.get(p.id)!,
    diasEsperando: Math.max(0, Math.round((new Date(`${hoje}T12:00:00`).getTime() - new Date(`${p.criadoEm.slice(0, 10)}T12:00:00`).getTime()) / 86_400_000)),
  }));
}

/* ---------- Equipe ---------- */

interface PessoaDaEquipe { id: string; gestorId: string | null }

/**
 * Quem a pessoa pode ver: RH e administração veem todos; gestão, a própria equipe (direta e indireta);
 * colaborador, ninguém além dela mesma (que fica de fora da lista: o resumo da equipe não é sobre ela).
 */
export function equipeVisivel(p: Permissoes, pessoas: PessoaDaEquipe[]): Set<string> {
  const eu = p.usuario.id;
  if (p.podeVerTodos || p.podeGerirPessoas || p.podeAdministrar) return new Set(pessoas.map((x) => x.id).filter((id) => id !== eu));
  if (!p.podeAprovar && !p.podeVerRelatorios) return new Set();
  const equipe = new Set<string>();
  let achou = true;
  while (achou) {
    achou = false;
    for (const x of pessoas) {
      if (!equipe.has(x.id) && x.gestorId !== null && (x.gestorId === eu || equipe.has(x.gestorId))) {
        equipe.add(x.id);
        achou = true;
      }
    }
  }
  equipe.delete(eu);
  return equipe;
}

/* ---------- Montagem ---------- */

export interface EntradaDoResumo {
  permissoes: Permissoes;
  /** Hoje, AAAA-MM-DD. */
  hoje: string;
  /** Pedidos esperando a decisão da pessoa (só vem algo para quem aprova). */
  pedidos: PedidoParaDecidir[];
  /** Pedidos da própria pessoa ainda sem resposta. */
  meusPendentes: number;
  /** Quem a pessoa pode ver (ver `equipeVisivel`). */
  equipe: Set<string>;
  /** Dias registrados dos últimos 14 dias (dados de qualquer pessoa: o filtro pela equipe é feito aqui). */
  dias: DiaDeJornada[];
  estacoes: EstacaoDiretorio[];
}

export interface ResumoDoDia {
  itens: ItemDoResumo[];
  /** "Tudo em ordem por aqui." quando não há itens. */
  tudoEmOrdem: boolean;
}

/** Hora extra "subindo": a última semana passa de 25% sobre a anterior, com pelo menos 45 min a mais e 2h no total. */
export const SUBIDA = { razao: 1.25, diferencaMin: 45, minimoMin: 120 } as const;

function listarNomes(nomes: string[], max = 3): string {
  if (nomes.length <= max) return nomes.length <= 1 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`;
  return `${nomes.slice(0, max).join(', ')} e mais ${nomes.length - max}`;
}

export function montarResumo(e: EntradaDoResumo, nomeDe: (id: string) => string): ResumoDoDia {
  const { permissoes: p } = e;
  const itens: ItemDoResumo[] = [];

  // 1. Pedidos esperando a decisão.
  if (p.podeAprovar && e.pedidos.length > 0) {
    const n = e.pedidos.length;
    const dentro = e.pedidos.filter((x) => x.dentroDoLimite).length;
    const fora = n - dentro;
    const partes = [`${dentro} dentro do limite do grupo`];
    if (fora > 0) partes.push(`${fora} ${plural(fora, 'passa', 'passam')} do limite`);
    const maisAntigo = Math.max(...e.pedidos.map((x) => x.diasEsperando));
    if (maisAntigo >= 2) partes.push(`o mais antigo espera há ${maisAntigo} dias`);
    itens.push({
      id: 'pedidos',
      titulo: `${n} ${plural(n, 'pedido de extensão espera', 'pedidos de extensão esperam')} a sua decisão`,
      detalhe: `${partes.join(', ')}.`,
      gravidade: maisAntigo >= 2 || n >= 5 ? 'alta' : 'media',
      rota: '/extensoes/aprovar',
      rotuloDaRota: 'Ver pedidos',
      aprovarEmLote: dentro > 0,
    });
  }

  const dias = e.dias.filter((d) => e.equipe.has(d.pessoaId));
  const inicioDaSemana = somarDias(e.hoje, -7);
  const recentes = dias.filter((d) => d.dia >= inicioDaSemana);

  // 2. Horas além da jornada sem aprovação (últimos 7 dias): vale R$ para a empresa.
  if (p.podeVerRelatorios) {
    const porPessoa = new Map<string, { minutos: number; valor: number }>();
    for (const id of e.equipe) {
      const dasPessoa = recentes.filter((d) => d.pessoaId === id).sort((a, b) => a.dia.localeCompare(b.dia));
      const achados = ocorrenciasDe(dasPessoa).filter((o) => o.regra === 'semAprovacao');
      if (achados.length === 0) continue;
      const custo = CUSTO_HORA[id] ?? 30;
      porPessoa.set(id, { minutos: achados.reduce((s, o) => s + o.minutos, 0), valor: achados.reduce((s, o) => s + custoDaOcorrencia(o, custo), 0) });
    }
    if (porPessoa.size > 0) {
      const ordem = [...porPessoa.entries()].sort((a, b) => b[1].minutos - a[1].minutos);
      const minutos = ordem.reduce((s, [, v]) => s + v.minutos, 0);
      const valor = ordem.reduce((s, [, v]) => s + v.valor, 0);
      itens.push({
        id: 'passivo',
        titulo: `${emHoras(minutos)} além da jornada sem aprovação nos últimos 7 dias`,
        detalhe: `${listarNomes(ordem.map(([id, v]) => `${nomeDe(id)} (${emHoras(v.minutos)})`))}. Valor estimado: ${emReais(valor, true)}.`,
        gravidade: ordem.length >= 3 || valor >= 1000 ? 'alta' : 'media',
        rota: '/radar-de-passivo',
        rotuloDaRota: 'Abrir o Radar de passivo',
      });
    }

    // 3. Hora extra subindo: a última semana contra a anterior.
    const subindo: { id: string; recente: number; anterior: number }[] = [];
    for (const id of e.equipe) {
      let recente = 0;
      let anterior = 0;
      for (const d of dias) {
        if (d.pessoaId !== id) continue;
        if (d.dia >= inicioDaSemana) recente += extraDoDia(d);
        else anterior += extraDoDia(d);
      }
      if (recente >= SUBIDA.minimoMin && recente - anterior >= SUBIDA.diferencaMin && recente >= anterior * SUBIDA.razao) subindo.push({ id, recente, anterior });
    }
    if (subindo.length > 0) {
      subindo.sort((a, b) => (b.recente - b.anterior) - (a.recente - a.anterior));
      const n = subindo.length;
      itens.push({
        id: 'previsao',
        titulo: `${n} ${plural(n, 'pessoa com hora extra subindo', 'pessoas com hora extra subindo')}`,
        detalhe: `${listarNomes(subindo.map((x) => `${nomeDe(x.id)} (${emHoras(x.recente)} na semana, antes ${emHoras(x.anterior)})`))}.`,
        gravidade: n >= 3 ? 'alta' : 'media',
        rota: '/previsao',
        rotuloDaRota: 'Abrir a Previsão de jornada',
      });
    }
  }

  // 4. Estações que pararam de reportar (só para quem administra). Estação desativada não conta.
  if (p.podeAdministrar) {
    const paradas = e.estacoes.filter((x) => x.ativa && x.diasSemRegistro > 3);
    if (paradas.length > 0) {
      const n = paradas.length;
      itens.push({
        id: 'estacoes',
        titulo: `${n} ${plural(n, 'estação parou de reportar', 'estações pararam de reportar')} há mais de 3 dias`,
        detalhe: `${listarNomes(paradas.map((x) => x.nome))}.`,
        gravidade: 'alta',
        rota: '/relatorios/estacoes',
        rotuloDaRota: 'Ver as estações',
      });
    }
  }

  // 5. O que é da própria pessoa.
  if (e.meusPendentes > 0) {
    const n = e.meusPendentes;
    itens.push({
      id: 'meu-pedido',
      titulo: `${n} ${plural(n, 'pedido seu aguarda', 'pedidos seus aguardam')} resposta`,
      detalhe: 'Você será avisado quando for decidido.',
      gravidade: 'baixa',
      rota: '/extensoes/meus',
      rotuloDaRota: 'Ver meus pedidos',
    });
  }

  // Mais grave primeiro; entre iguais, vale a ordem em que as regras foram aplicadas.
  const ordenados = itens.map((item, i) => ({ item, i })).sort((a, b) => PESO[a.item.gravidade] - PESO[b.item.gravidade] || a.i - b.i).map((x) => x.item);
  return { itens: ordenados, tudoEmOrdem: ordenados.length === 0 };
}

/* ---------- Texto ---------- */

export function saudacao(hora: number): string {
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}

/** "Bom dia, Carlos. 3 coisas precisam de você hoje:" ou "Bom dia, Carlos. Tudo em ordem por aqui." */
export function fraseDeAbertura(nome: string, n: number, hora: number): string {
  const inicio = `${saudacao(hora)}, ${nome}.`;
  if (n === 0) return `${inicio} ${TUDO_EM_ORDEM}`;
  return `${inicio} ${n} ${plural(n, 'coisa precisa', 'coisas precisam')} de você hoje:`;
}

/** Texto para leitor de tela da bolha: "3 itens precisam de você". */
export function textoDoContador(n: number): string {
  return `${n} ${plural(n, 'item precisa', 'itens precisam')} de você`;
}
