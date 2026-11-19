import type { ConfigRelatorio } from '@/modelos/relatorio';
import { OPCOES_DIRETORIAS } from '../../../mock/diretorio';
import { buscarEm } from '../dados/base';
import { liberacoesPorArea, type LinhaAgrupada } from '../dados/liberacoes';

// "Área" é a diretoria da pessoa. A soma bate com "Liberações e bloqueios" (tipo liberação).
const config: ConfigRelatorio<LinhaAgrupada> = {
  titulo: 'Liberações por área',
  grupo: 'Bloqueios e liberações',
  arquivo: 'liberacoes-por-area',
  vazio: 'Nenhuma área teve liberação nesse período.',
  filtros: [{ tipo: 'multi', chave: 'areas', rotulo: 'Áreas', opcoes: OPCOES_DIRETORIAS }, { tipo: 'periodo', dias: 30 }],
  kpis: [
    { rotulo: 'Liberações', valor: (rows) => rows.reduce((s, r) => s + r.total, 0) },
    { rotulo: 'Áreas com liberação', valor: (rows) => rows.length },
    { rotulo: 'Média por área', decimais: 1, valor: (rows) => (rows.length ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0) },
    { rotulo: 'Maior número em uma área', valor: (rows) => Math.max(0, ...rows.map((r) => r.total)) },
  ],
  colunas: [
    { key: 'grupo', header: 'Área' },
    { key: 'total', header: 'Liberações', numeric: true },
    { key: 'participacao', header: 'Participação (%)', numeric: true, render: (r) => r.participacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }), texto: (r) => r.participacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) },
  ],
  buscar: buscarEm(liberacoesPorArea),
};

export default config;
