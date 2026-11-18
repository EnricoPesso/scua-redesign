import { hoje } from '../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { permissoesAtuais, todosOsPedidos } from '../extensoes/api/mocks/db';
import { totalMinutos } from '../extensoes/domain/horas';
import type { Pedido } from '../extensoes/domain/types';
import { inicioDaJanela, ultimosMeses, type ContagemPorStatus, type Janela, type MesDoHistorico } from './domain';

/**
 * Dados do painel inicial (simulados; contrato a definir com a Scua).
 * As extensões vêm da mesma base da tela "Extensões de jornada", para os números baterem
 * (no sistema atual o painel mostrava 2h aprovadas e a tela de extensões mostrava 0).
 */

export interface ResumoDoPainel {
  usuarios: number;
  presentes: number;
  ausentes: number;
  /** Pedidos esperando a decisão de quem está logado. */
  pendentesParaMim: number;
  minutosAprovadosNoMes: number;
  /** YYYY-MM do mês atual. */
  mes: string;
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

/** Histórico dos meses anteriores (o mês atual é calculado a partir dos pedidos). */
const MESES_ANTERIORES_MIN = [540, 720, 390, 960, 660];

export const inicioApi = {
  resumo: (): Promise<ResumoDoPainel> => rede(() => {
    const mes = hoje().slice(0, 7);
    const pessoas = pessoasVisiveis();
    // Sem dado real de presença: 1 em cada 6 pessoas aparece como ausente no exemplo.
    const ausentes = pessoas.filter((_, i) => i % 6 === 5).length;
    const eu = permissoesAtuais().usuario.id;
    const pedidos = pedidosVisiveis();
    return {
      usuarios: pessoas.length,
      presentes: pessoas.length - ausentes,
      ausentes,
      pendentesParaMim: todosOsPedidos().filter((x) => x.status === 'pendente' && x.gestor?.id === eu).length,
      minutosAprovadosNoMes: pedidos.filter((x) => x.status === 'aprovado' && x.dataInicial.startsWith(mes)).reduce((s, x) => s + minutosDe(x), 0),
      mes,
    };
  }),

  /** Pedidos criados na janela, contados por status. */
  pedidosPorStatus: (janela: Janela): Promise<ContagemPorStatus> => rede(() => {
    const de = inicioDaJanela(janela, hoje());
    const contagem: ContagemPorStatus = { pendente: 0, aprovado: 0, reprovado: 0, cancelado: 0 };
    for (const x of pedidosVisiveis()) {
      const criado = x.criadoEm.slice(0, 10);
      if (criado >= de && criado <= hoje()) contagem[x.status] += 1;
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
