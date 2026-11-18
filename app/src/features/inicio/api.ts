import { hoje } from '../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { permissoesAtuais, todosOsPedidos } from '../extensoes/api/mocks/db';
import { totalMinutos } from '../extensoes/domain/horas';
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
};
