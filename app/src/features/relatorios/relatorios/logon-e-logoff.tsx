import type { ConfigRelatorio } from '@/modelos/relatorio';
import { sessoes, type Sessao } from '../dados/acesso';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaData, colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { formatarDuracao } from '../dados/formatacao';

const config: ConfigRelatorio<Sessao> = {
  titulo: 'Logon e logoff',
  grupo: 'Acesso',
  arquivo: 'logon-e-logoff',
  vazio: 'Nenhum logon registrado nesse período para as pessoas escolhidas.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 7 }],
  kpis: [
    { rotulo: 'Dias com logon', valor: (rows) => rows.length },
    { rotulo: 'Pessoas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    {
      rotulo: 'Tempo médio conectado',
      decimais: 1,
      unidade: 'h',
      valor: (rows) => {
        const com = rows.filter((r) => r.minutos !== null);
        return com.length ? com.reduce((s, r) => s + (r.minutos ?? 0), 0) / com.length / 60 : 0;
      },
    },
    { rotulo: 'Sem logoff registrado', valor: (rows) => rows.filter((r) => r.ultimoLogoff === null).length },
  ],
  colunas: [
    colunaData('dia', 'Data'),
    { key: 'colaborador', header: 'Colaborador' },
    colunaSemQuebra('estacao', 'Estação'),
    colunaDataHora('primeiroLogon', 'Primeiro logon'),
    colunaDataHora('ultimoLogoff', 'Último logoff'),
    { key: 'minutos', header: 'Tempo conectado', numeric: true, render: (r) => (r.minutos === null ? '—' : formatarDuracao(r.minutos)), texto: (r) => (r.minutos === null ? '—' : formatarDuracao(r.minutos)) },
  ],
  buscar: buscarEm((f) => porPessoa(sessoes(), f).filter((s) => noPeriodo(s.dia, f))),
};

export default config;
