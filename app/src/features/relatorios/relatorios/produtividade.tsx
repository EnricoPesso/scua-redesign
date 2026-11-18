import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaData } from '../dados/colunas';
import { formatarDuracao } from '../dados/formatacao';
import { diasProdutivos, eficiencia, type DiaProdutivo } from '../dados/jornada';

const pct = (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`;
const horas = (min: number) => formatarDuracao(min);

const config: ConfigRelatorio<DiaProdutivo> = {
  titulo: 'Produtividade',
  grupo: 'Jornada e horas',
  arquivo: 'produtividade',
  vazio: 'Nenhum dia de trabalho registrado nesse período para as pessoas escolhidas.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 7 }],
  kpis: [
    { rotulo: 'Dias de trabalho', valor: (rows) => rows.length },
    { rotulo: 'Pessoas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    { rotulo: 'Tempo produtivo total', decimais: 1, unidade: 'h', valor: (rows) => rows.reduce((s, r) => s + r.produtivoMin, 0) / 60 },
    {
      rotulo: 'Eficiência média',
      decimais: 1,
      unidade: '%',
      valor: (rows) => eficiencia(rows.reduce((s, r) => s + r.produtivoMin, 0), rows.reduce((s, r) => s + r.ociosoMin, 0)),
    },
  ],
  colunas: [
    colunaData('dia', 'Data'),
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    { key: 'produtivoMin', header: 'Tempo produtivo', numeric: true, render: (r) => horas(r.produtivoMin), texto: (r) => horas(r.produtivoMin) },
    { key: 'ociosoMin', header: 'Tempo ocioso', numeric: true, render: (r) => horas(r.ociosoMin), texto: (r) => horas(r.ociosoMin) },
    { key: 'eficiencia', header: 'Eficiência', numeric: true, render: (r) => pct(r.eficiencia), texto: (r) => pct(r.eficiencia) },
  ],
  buscar: buscarEm((f) => porPessoa(diasProdutivos(), f).filter((d) => noPeriodo(d.dia, f))),
};

export default config;
