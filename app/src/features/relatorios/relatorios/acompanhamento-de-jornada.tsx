import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { formatarDuracao } from '../dados/formatacao';
import { diasProdutivos, eficiencia, resumirPorPessoa, type ResumoProdutivo } from '../dados/jornada';

const pct = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`;

const somaDias = (rows: ResumoProdutivo[]) => rows.reduce((s, r) => s + r.dias, 0);
const mediaPorDia = (campo: 'produtivoMin' | 'ociosoMin') => (rows: ResumoProdutivo[]) => {
  const dias = somaDias(rows);
  return dias ? rows.reduce((s, r) => s + r[campo], 0) / dias / 60 : 0;
};

const config: ConfigRelatorio<ResumoProdutivo> = {
  titulo: 'Acompanhamento de jornada',
  grupo: 'Jornada e horas',
  arquivo: 'acompanhamento-de-jornada',
  vazio: 'Nenhuma jornada acompanhada nesse período para as pessoas escolhidas.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 7 }],
  kpis: [
    { rotulo: 'Colaboradores', valor: (rows) => rows.length },
    { rotulo: 'Média produtiva por dia', decimais: 1, unidade: 'h', valor: mediaPorDia('produtivoMin') },
    { rotulo: 'Média ociosa por dia', decimais: 1, unidade: 'h', valor: mediaPorDia('ociosoMin') },
    {
      rotulo: 'Eficiência geral',
      decimais: 1,
      unidade: '%',
      valor: (rows) => eficiencia(rows.reduce((s, r) => s + r.produtivoMin, 0), rows.reduce((s, r) => s + r.ociosoMin, 0)),
    },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    { key: 'dias', header: 'Dias acompanhados', numeric: true },
    { key: 'mediaProdutivaMin', header: 'Média produtiva por dia', numeric: true, render: (r) => formatarDuracao(r.mediaProdutivaMin), texto: (r) => formatarDuracao(r.mediaProdutivaMin) },
    { key: 'mediaOciosaMin', header: 'Média ociosa por dia', numeric: true, render: (r) => formatarDuracao(r.mediaOciosaMin), texto: (r) => formatarDuracao(r.mediaOciosaMin) },
    { key: 'eficiencia', header: 'Eficiência', numeric: true, render: (r) => pct(r.eficiencia), texto: (r) => pct(r.eficiencia) },
  ],
  buscar: buscarEm((f) => resumirPorPessoa(porPessoa(diasProdutivos(), f).filter((d) => noPeriodo(d.dia, f)))),
};

export default config;
