import { RELATORIOS } from '../relatorios/catalogo';

/**
 * Blocos que a pessoa pode colocar no Início (personalização com o ícone de caneta).
 * Além dos fixos, qualquer indicador de qualquer relatório pode virar um bloco: o id é `rel:<slug>:<índice do indicador>`.
 */

export type TipoBloco = 'aviso' | 'kpi' | 'cartao';

export interface InfoBloco {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoBloco;
  /** Só aparece para quem aprova extensões. */
  soQuemAprova?: boolean;
}

export const BLOCOS_FIXOS: InfoBloco[] = [
  { id: 'resumo-dia', titulo: 'Resumo do dia', descricao: 'O que precisa de você hoje, com um atalho para resolver com o assistente.', tipo: 'aviso' },
  { id: 'aviso', titulo: 'Pedidos para aprovar', descricao: 'Aviso quando há pedidos de extensão esperando a sua aprovação.', tipo: 'aviso', soQuemAprova: true },
  { id: 'kpi-usuarios', titulo: 'Usuários cadastrados', descricao: 'Quantas pessoas estão cadastradas.', tipo: 'kpi' },
  { id: 'kpi-presentes', titulo: 'Presentes', descricao: 'Quantas pessoas estiveram presentes no período.', tipo: 'kpi' },
  { id: 'kpi-ausentes', titulo: 'Ausentes', descricao: 'Quantas pessoas faltaram no período.', tipo: 'kpi' },
  { id: 'kpi-horas', titulo: 'Horas de extensão aprovadas', descricao: 'Horas de extensão de jornada aprovadas no período.', tipo: 'kpi' },
  { id: 'status', titulo: 'Pedidos de extensão por status', descricao: 'Pendentes, aprovados, reprovados e cancelados no período.', tipo: 'cartao' },
  { id: 'historico', titulo: 'Horas de extensão por mês', descricao: 'Horas aprovadas nos últimos 6 meses.', tipo: 'cartao' },
  { id: 'ausentes', titulo: 'Quem mais esteve ausente', descricao: 'As pessoas com mais tempo longe da estação no período.', tipo: 'cartao' },
  { id: 'parados', titulo: 'Pedidos parados', descricao: 'Pedidos de extensão esperando a sua decisão há mais tempo.', tipo: 'cartao', soQuemAprova: true },
  { id: 'fora-jornada', titulo: 'Acessos fora da jornada', descricao: 'Tentativas de acesso fora do horário no período e quem mais tentou.', tipo: 'cartao' },
  { id: 'ferias', titulo: 'Próximas férias', descricao: 'Quem entra de férias nos próximos 30 dias.', tipo: 'cartao' },
];

/**
 * Como o Início vem antes de a pessoa personalizar: igual ao painel original.
 * O "Resumo do dia" fica na caixa do cabeçalho (ocupava muito espaço aqui); quem quiser pode ligá-lo em Personalizar.
 */
export const BLOCOS_PADRAO = ['aviso', 'kpi-usuarios', 'kpi-presentes', 'kpi-ausentes', 'kpi-horas', 'status', 'historico'];

const PREFIXO = 'rel:';
const SLUGS = new Set(RELATORIOS.map((r) => r.slug));

export const idDeRelatorio = (slug: string, indice: number) => `${PREFIXO}${slug}:${indice}`;

export function lerIdRelatorio(id: string): { slug: string; indice: number } | null {
  if (!id.startsWith(PREFIXO)) return null;
  const [slug, indice] = id.slice(PREFIXO.length).split(':');
  const n = Number(indice);
  return slug && Number.isInteger(n) && n >= 0 ? { slug, indice: n } : null;
}

export const infoDoBloco = (id: string): InfoBloco | undefined => BLOCOS_FIXOS.find((b) => b.id === id);

export function tipoDoBloco(id: string): TipoBloco {
  if (lerIdRelatorio(id)) return 'kpi';
  return infoDoBloco(id)?.tipo ?? 'cartao';
}

/** Id que ainda existe: bloco fixo conhecido ou indicador de um relatório do catálogo. */
function existe(id: string): boolean {
  const rel = lerIdRelatorio(id);
  return rel ? SLUGS.has(rel.slug) : Boolean(infoDoBloco(id));
}

/**
 * Lê a preferência salva (texto JSON). Sem preferência ou com lixo, usa o padrão.
 * Tira repetidos, ids que não existem mais e o que a pessoa não pode ver. Lista vazia salva continua vazia.
 */
export function sanitizarPreferencia(salvo: string | null, permitido: (id: string) => boolean): string[] {
  let lista: unknown = null;
  try {
    lista = salvo === null ? null : JSON.parse(salvo);
  } catch {
    lista = null;
  }
  const base = Array.isArray(lista) ? lista : BLOCOS_PADRAO;
  const vistos = new Set<string>();
  return base.filter((id): id is string => {
    if (typeof id !== 'string' || vistos.has(id) || !existe(id) || !permitido(id)) return false;
    vistos.add(id);
    return true;
  });
}

/** Sobe (-1) ou desce (+1) um bloco na lista. */
export function mover(ids: string[], id: string, delta: -1 | 1): string[] {
  const i = ids.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const novo = [...ids];
  [novo[i], novo[j]] = [novo[j], novo[i]];
  return novo;
}

/** Junta blocos vizinhos do mesmo tipo: indicadores numa faixa, cartões numa grade de duas colunas. */
export function agruparParaExibir(ids: string[]): { tipo: TipoBloco; ids: string[] }[] {
  const grupos: { tipo: TipoBloco; ids: string[] }[] = [];
  for (const id of ids) {
    const tipo = tipoDoBloco(id);
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.tipo === tipo && tipo !== 'aviso') ultimo.ids.push(id);
    else grupos.push({ tipo, ids: [id] });
  }
  return grupos;
}

export const chaveDaPreferencia = (usuarioId: string) => `scua.inicio.${usuarioId}`;
