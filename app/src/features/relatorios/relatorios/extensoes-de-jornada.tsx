import { Badge, type BadgeProps } from '@/components/ui/badge';
import { lerLista, lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { todosOsPedidos } from '../../extensoes/api/mocks/db';
import { totalMinutos } from '../../extensoes/domain/horas';
import type { Status } from '../../extensoes/domain/types';
import { FILTRO_GESTORES, buscarEm, noPeriodo } from '../dados/base';
import { colunaData, colunaDataHora, colunaSemQuebra, colunaTexto } from '../dados/colunas';
import { formatarDuracao } from '../dados/formatacao';
import { OPCOES_PESSOAS } from '../../../mock/diretorio';

const SELO: Record<Status, { rotulo: string; status: NonNullable<BadgeProps['status']> }> = {
  pendente: { rotulo: 'Pendente', status: 'warning' },
  aprovado: { rotulo: 'Aprovado', status: 'success' },
  reprovado: { rotulo: 'Reprovado', status: 'danger' },
  cancelado: { rotulo: 'Cancelado', status: 'neutral' },
};

interface LinhaExtensao {
  id: string;
  solicitante: string;
  beneficiarioId: string;
  beneficiario: string;
  gestorId: string;
  gestor: string;
  inicio: string;
  fim: string;
  horario: string;
  status: Status;
  solicitadoEm: string;
  justificativa: string;
  minutos: number;
}

/** Mesma base da tela de Extensões de jornada: os números sempre batem com ela. */
function linhas(): LinhaExtensao[] {
  return todosOsPedidos()
    .map((p) => ({
      id: p.id,
      solicitante: p.solicitante.nome,
      beneficiarioId: p.beneficiario.id,
      beneficiario: p.beneficiario.nome,
      gestorId: p.gestor?.id ?? '',
      gestor: p.gestor?.nome ?? 'Sem gestor',
      inicio: p.dataInicial,
      fim: p.dataFinal,
      horario: `${p.horario.inicio} às ${p.horario.fim}`,
      status: p.status,
      solicitadoEm: p.criadoEm,
      justificativa: p.justificativa.descricao,
      minutos: totalMinutos(p.dataInicial, p.dataFinal, p.horario),
    }))
    .sort((a, b) => b.solicitadoEm.localeCompare(a.solicitadoEm));
}

const config: ConfigRelatorio<LinhaExtensao> = {
  titulo: 'Extensões de jornada',
  grupo: 'Jornada e horas',
  arquivo: 'extensoes-de-jornada',
  vazio: 'Nenhum pedido de extensão foi feito nesse período.',
  filtros: [
    { tipo: 'multi', chave: 'colaboradores', rotulo: 'Colaboradores', opcoes: OPCOES_PESSOAS },
    FILTRO_GESTORES,
    { tipo: 'select', chave: 'status', rotulo: 'Situação', opcoes: (Object.keys(SELO) as Status[]).map((s) => ({ value: s, label: SELO[s].rotulo })) },
    // O período vale para a data da solicitação do pedido.
    { tipo: 'periodo', dias: 30 },
  ],
  kpis: [
    { rotulo: 'Pedidos', valor: (rows) => rows.length },
    { rotulo: 'Aprovados', valor: (rows) => rows.filter((r) => r.status === 'aprovado').length },
    { rotulo: 'Pendentes', valor: (rows) => rows.filter((r) => r.status === 'pendente').length },
    { rotulo: 'Horas aprovadas', decimais: 1, unidade: 'h', valor: (rows) => rows.filter((r) => r.status === 'aprovado').reduce((s, r) => s + r.minutos, 0) / 60 },
  ],
  colunas: [
    { key: 'solicitante', header: 'Solicitante' },
    { key: 'beneficiario', header: 'Colaborador' },
    colunaData('inicio', 'Início'),
    colunaData('fim', 'Fim'),
    colunaSemQuebra('horario', 'Horário'),
    { key: 'minutos', header: 'Duração total', numeric: true, render: (r) => formatarDuracao(r.minutos), texto: (r) => formatarDuracao(r.minutos) },
    { key: 'status', header: 'Situação', render: (r) => <Badge status={SELO[r.status].status}>{SELO[r.status].rotulo}</Badge>, texto: (r) => SELO[r.status].rotulo },
    colunaDataHora('solicitadoEm', 'Solicitado em'),
    colunaTexto('justificativa', 'Justificativa'),
  ],
  buscar: buscarEm((f) => {
    const cs = lerLista(f, 'colaboradores');
    const gs = lerLista(f, 'gestores');
    const status = lerTexto(f, 'status');
    return linhas().filter(
      (r) => noPeriodo(r.solicitadoEm, f) && (!cs.length || cs.includes(r.beneficiarioId)) && (!gs.length || gs.includes(r.gestorId)) && (!status || r.status === status),
    );
  }),
};

export default config;
