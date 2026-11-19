import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { ultimosLogins, type UltimoLogin } from '../dados/acesso';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { dia, diasEntre } from '../../../mock/datas';

const semLoginHaMaisDe = (dias: number) => (rows: UltimoLogin[]) =>
  rows.filter((r) => diasEntre(r.ultimoLogin.slice(0, 10), dia(0)) > dias).length;

const config: ConfigRelatorio<UltimoLogin> = {
  titulo: 'Último login por usuário',
  grupo: 'Acesso',
  arquivo: 'ultimo-login',
  vazio: 'Nenhuma pessoa encontrada para os filtros escolhidos.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'texto', chave: 'estacao', rotulo: 'Estação', placeholder: 'Ex.: SCUA-NB-014' },
  ],
  kpis: [
    { rotulo: 'Pessoas', valor: (rows) => rows.length },
    { rotulo: 'Estações', valor: (rows) => new Set(rows.map((r) => r.estacao)).size },
    { rotulo: 'Entraram hoje', valor: (rows) => rows.filter((r) => r.ultimoLogin.slice(0, 10) === dia(0)).length },
    { rotulo: 'Sem login há mais de 7 dias', valor: semLoginHaMaisDe(7) },
  ],
  colunas: [
    { key: 'matricula', header: 'Matrícula' },
    { key: 'colaborador', header: 'Colaborador' },
    colunaSemQuebra('estacao', 'Estação'),
    colunaSemQuebra('versaoCliente', 'Versão do cliente'),
    { key: 'gestor', header: 'Gestor' },
    { key: 'departamento', header: 'Departamento' },
    colunaDataHora('ultimoLogin', 'Último login'),
  ],
  buscar: buscarEm((f) => {
    const estacao = lerTexto(f, 'estacao').trim().toUpperCase();
    return porPessoa(ultimosLogins(), f).filter((r) => !estacao || r.estacao.includes(estacao));
  }),
};

export default config;
