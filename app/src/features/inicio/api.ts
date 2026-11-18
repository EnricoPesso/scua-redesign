import { valoresPadrao } from '@/lib/relatorio';
import { dia, hoje } from '../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { permissoesAtuais, todosOsPedidos } from '../extensoes/api/mocks/db';
import { ausenciasApi } from '../ausencias/api';
import { duracaoEmMinutos } from '../ausencias/domain/ausencias';
import { totalMinutos } from '../extensoes/domain/horas';
import { CARREGADORES } from '../relatorios/carregadores';
import { tentativas } from '../relatorios/dados/tentativas';
import { listarUsuarios } from '../usuarios/api';
import type { Pedido } from '../extensoes/domain/types';
import { diasUteisDoPeriodo, minutosNoPeriodo, ultimosMeses, type ContagemPorStatus, type MesDoHistorico, type Periodo } from './domain';

/**
 * Dados do painel inicial (simulados; contrato a definir com a Scua).
 * As extensões vêm da mesma base da tela "Extensões de jornada", para os números baterem
 * (no sistema atual o painel mostrava 2h aprovadas e a tela de extensões mostrava 0).
 */

export interface ResumoDoPainel {
  usuarios: number;
  /** Presentes e ausentes no dia, ou a média por dia útil num período de vários dias. null = sem dia útil (fim de semana). */
  presentes: number | null;
  ausentes: number | null;
  diasUteis: number;
  /** Pedidos esperando a decisão de quem está logado (estado atual, não depende do período). */
  pendentesParaMim: number;
  /** Minutos de extensão aprovada que caem dentro do período. */
  minutosAprovados: number;
}

/** Administração e RH veem a empresa toda; gestão vê a própria equipe. */
function pedidosVisiveis(): Pedido[] {
  const p = permissoesAtuais();
  const todos = todosOsPedidos();
  if (p.podeAdministrar || p.podeVerTodos) return todos;
  return todos.filter((x) => x.gestor?.id === p.usuario.id || x.beneficiario.id === p.usuario.id);
}

function pessoasVisiveis() {
  const p = permissoesAtuais();
  if (p.podeAdministrar || p.podeGerirPessoas) return PESSOAS_DIRETORIO;
  return PESSOAS_DIRETORIO.filter((x) => x.gestorId === p.usuario.id);
}

const minutosDe = (p: Pedido) => totalMinutos(p.dataInicial, p.dataFinal, p.horario);

/** Ausência simulada e estável: a mesma pessoa falta sempre nos mesmos dias (cerca de 1 dia em 7). */
function estaAusente(pessoaId: string, dia: string): boolean {
  let h = 0;
  for (const c of `${pessoaId}|${dia}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 7 === 0;
}

/** Histórico dos meses anteriores (o mês atual é calculado a partir dos pedidos). */
const MESES_ANTERIORES_MIN = [540, 720, 390, 960, 660];

export const inicioApi = {
  resumo: (periodo: Periodo): Promise<ResumoDoPainel> => rede(() => {
    const pessoas = pessoasVisiveis();
    const dias = diasUteisDoPeriodo(periodo);
    // Presença simulada (ainda não há dado real): cada pessoa falta em alguns dias, sempre os mesmos.
    let ausencias = 0;
    for (const dia of dias) ausencias += pessoas.filter((p) => estaAusente(p.id, dia)).length;
    const mediaAusentes = dias.length ? Math.round(ausencias / dias.length) : null;
    const eu = permissoesAtuais().usuario.id;
    return {
      usuarios: pessoas.length,
      presentes: mediaAusentes === null ? null : pessoas.length - mediaAusentes,
      ausentes: mediaAusentes,
      diasUteis: dias.length,
      pendentesParaMim: todosOsPedidos().filter((x) => x.status === 'pendente' && x.gestor?.id === eu).length,
      minutosAprovados: pedidosVisiveis().filter((x) => x.status === 'aprovado').reduce((s, x) => s + minutosNoPeriodo(x, periodo.de, periodo.ate), 0),
    };
  }),

  /** Pedidos criados no período, contados por status. */
  pedidosPorStatus: (periodo: Periodo): Promise<ContagemPorStatus> => rede(() => {
    const contagem: ContagemPorStatus = { pendente: 0, aprovado: 0, reprovado: 0, cancelado: 0 };
    for (const x of pedidosVisiveis()) {
      const criado = x.criadoEm.slice(0, 10);
      if (criado >= periodo.de && criado <= periodo.ate) contagem[x.status] += 1;
    }
    return contagem;
  }),

  /** Horas de extensão aprovadas nos últimos 6 meses (o último é o mês atual). */
  historico: (): Promise<MesDoHistorico[]> => rede(() => {
    const meses = ultimosMeses(hoje().slice(0, 7), 6);
    const pedidos = pedidosVisiveis().filter((x) => x.status === 'aprovado');
    return meses.map((mes, i) => ({
      mes,
      minutos: i < 5 ? MESES_ANTERIORES_MIN[i] : pedidos.filter((x) => x.dataInicial.startsWith(mes)).reduce((s, x) => s + minutosDe(x), 0),
    }));
  }),

  /** As pessoas com mais tempo ausente no período (até 5). */
  async ausentesNoPeriodo(periodo: Periodo): Promise<{ pessoaId: string; nome: string; minutos: number }[]> {
    const visiveis = new Set(pessoasVisiveis().map((p) => p.id));
    const r = await ausenciasApi.listar({ de: periodo.de, ate: periodo.ate, colaboradores: [], gestor: '' });
    const total = new Map<string, number>();
    for (const a of r.ausencias) if (visiveis.has(a.pessoaId)) total.set(a.pessoaId, (total.get(a.pessoaId) ?? 0) + duracaoEmMinutos(a));
    return [...total]
      .map(([pessoaId, minutos]) => ({ pessoaId, nome: r.pessoas.find((p) => p.id === pessoaId)?.nome ?? pessoaId, minutos }))
      .sort((a, b) => b.minutos - a.minutos || a.nome.localeCompare(b.nome, 'pt-BR'))
      .slice(0, 5);
  },

  /** Pedidos esperando a decisão de quem está logado, do mais antigo para o mais novo (até 5). */
  pedidosParados: (): Promise<{ id: string; nome: string; criadoEm: string; minutos: number }[]> => rede(() => {
    const eu = permissoesAtuais().usuario.id;
    return todosOsPedidos()
      .filter((x) => x.status === 'pendente' && x.gestor?.id === eu)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
      .slice(0, 5)
      .map((x) => ({ id: x.id, nome: x.beneficiario.nome, criadoEm: x.criadoEm, minutos: minutosDe(x) }));
  }),

  /** Tentativas de acesso fora da jornada no período: total e quem mais tentou (até 3). */
  foraDaJornada: (periodo: Periodo): Promise<{ total: number; pessoas: number; maiores: { pessoaId: string; nome: string; total: number }[] }> => rede(() => {
    const visiveis = new Set(pessoasVisiveis().map((p) => p.id));
    const lista = tentativas().filter((t) => visiveis.has(t.pessoaId) && t.quando.slice(0, 10) >= periodo.de && t.quando.slice(0, 10) <= periodo.ate);
    const porPessoa = new Map<string, { nome: string; total: number }>();
    for (const t of lista) {
      const atual = porPessoa.get(t.pessoaId) ?? { nome: t.colaborador, total: 0 };
      porPessoa.set(t.pessoaId, { nome: atual.nome, total: atual.total + 1 });
    }
    const maiores = [...porPessoa].map(([pessoaId, v]) => ({ pessoaId, ...v })).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR')).slice(0, 3);
    return { total: lista.length, pessoas: porPessoa.size, maiores };
  }),

  /** Quem entra de férias nos próximos 30 dias, a partir de hoje. */
  async proximasFerias(): Promise<{ pessoaId: string; nome: string; inicio: string; fim: string }[]> {
    const visiveis = new Set(pessoasVisiveis().map((p) => p.id));
    const de = hoje();
    const ate = dia(30);
    const usuarios = await listarUsuarios();
    return usuarios
      .filter((u) => visiveis.has(u.id))
      .flatMap((u) => u.ferias.filter((f) => f.inicio >= de && f.inicio <= ate).map((f) => ({ pessoaId: u.id, nome: u.nome, inicio: f.inicio, fim: f.fim })))
      .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  /** Indicadores de cada relatório (nome e índice), para a pessoa escolher no "Personalizar início". */
  async indicadoresDosRelatorios(): Promise<Record<string, string[]>> {
    const pares = await Promise.all(Object.entries(CARREGADORES).map(async ([slug, carregar]) => [slug, (await carregar()).default.kpis.map((k) => k.rotulo)] as const));
    return Object.fromEntries(pares);
  },

  /**
   * Um indicador de relatório calculado com os filtros padrão do relatório e o período do Início
   * (relatórios de "situação atual" não têm período e mostram o estado de hoje).
   */
  async indicadorDeRelatorio(slug: string, indice: number, periodo: Periodo): Promise<{ rotulo: string; valor: number; decimais?: number; unidade?: string; temPeriodo: boolean } | null> {
    const carregar = CARREGADORES[slug];
    if (!carregar) return null;
    const config = (await carregar()).default;
    const kpi = config.kpis[indice];
    if (!kpi) return null;
    const temPeriodo = config.filtros.some((f) => f.tipo === 'periodo');
    const valores = { ...valoresPadrao(config.filtros, hoje()), ...(temPeriodo ? { inicio: periodo.de, fim: periodo.ate } : {}) };
    const linhas = await config.buscar(valores, new AbortController().signal);
    return { rotulo: kpi.rotulo, valor: kpi.valor(linhas), decimais: kpi.decimais, unidade: kpi.unidade, temPeriodo };
  },
};
