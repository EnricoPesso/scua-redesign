import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_GESTORES, buscarEm } from '../dados/base';
import { liberacoesPorGestor, type LinhaAgrupada } from '../dados/liberacoes';

// Cada liberação conta para o gestor de quem foi liberado. A soma bate com "Liberações e bloqueios".
const config: ConfigRelatorio<LinhaAgrupada> = {
  titulo: 'Liberações por gestor',
  grupo: 'Bloqueios e liberações',
  arquivo: 'liberacoes-por-gestor',
  vazio: 'Nenhuma equipe teve liberação nesse período.',
  filtros: [FILTRO_GESTORES, { tipo: 'periodo', dias: 30 }],
  kpis: [
    { rotulo: 'Liberações', valor: (rows) => rows.reduce((s, r) => s + r.total, 0) },
    { rotulo: 'Gestores com liberação', valor: (rows) => rows.length },
    { rotulo: 'Média por gestor', decimais: 1, valor: (rows) => (rows.length ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0) },
    { rotulo: 'Maior número em uma equipe', valor: (rows) => Math.max(0, ...rows.map((r) => r.total)) },
  ],
  colunas: [
    { key: 'grupo', header: 'Gestor' },
    { key: 'total', header: 'Liberações', numeric: true },
    { key: 'participacao', header: 'Participação (%)', numeric: true, render: (r) => r.participacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }), texto: (r) => r.participacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) },
  ],
  buscar: buscarEm(liberacoesPorGestor),
};

export default config;
