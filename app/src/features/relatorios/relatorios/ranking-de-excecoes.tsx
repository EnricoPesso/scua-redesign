import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa, type Identidade } from '../dados/base';
import { eventosLiberacao } from '../dados/liberacoes';
import { tentativas } from '../dados/tentativas';

interface LinhaRanking extends Identidade {
  id: string;
  posicao: number;
  excecoes: number;
  foraDaJornada: number;
  liberacoes: number;
}

// Exceção = tentativa de acesso fora da jornada ou liberação concedida (pergunta 48 para a Scua confirma a definição).
const config: ConfigRelatorio<LinhaRanking> = {
  titulo: 'Ranking de exceções',
  grupo: 'Bloqueios e liberações',
  arquivo: 'ranking-de-excecoes',
  vazio: 'Ninguém teve exceção de jornada nesse período.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 30 }],
  kpis: [
    { rotulo: 'Exceções', valor: (rows) => rows.reduce((s, r) => s + r.excecoes, 0) },
    { rotulo: 'Pessoas com exceção', valor: (rows) => rows.length },
    { rotulo: 'Média por pessoa', decimais: 1, valor: (rows) => (rows.length ? rows.reduce((s, r) => s + r.excecoes, 0) / rows.length : 0) },
    { rotulo: 'Maior número por pessoa', valor: (rows) => Math.max(0, ...rows.map((r) => r.excecoes)) },
  ],
  colunas: [
    { key: 'posicao', header: 'Posição', numeric: true },
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    { key: 'foraDaJornada', header: 'Acessos fora da jornada', numeric: true },
    { key: 'liberacoes', header: 'Liberações', numeric: true },
    { key: 'excecoes', header: 'Total de exceções', numeric: true },
  ],
  buscar: buscarEm((f) => {
    const fora = porPessoa(tentativas(), f).filter((t) => noPeriodo(t.quando, f));
    const liberacoes = porPessoa(eventosLiberacao(), f).filter((e) => e.tipo === 'Liberação' && noPeriodo(e.quando, f));
    const porId = new Map<string, LinhaRanking>();
    const linha = (p: Identidade) => {
      if (!porId.has(p.pessoaId)) {
        porId.set(p.pessoaId, { pessoaId: p.pessoaId, colaborador: p.colaborador, gestorId: p.gestorId, gestor: p.gestor, area: p.area, departamento: p.departamento, estacao: p.estacao, id: p.pessoaId, posicao: 0, excecoes: 0, foraDaJornada: 0, liberacoes: 0 });
      }
      return porId.get(p.pessoaId)!;
    };
    for (const t of fora) linha(t).foraDaJornada += 1;
    for (const e of liberacoes) linha(e).liberacoes += 1;
    return [...porId.values()]
      .map((l) => ({ ...l, excecoes: l.foraDaJornada + l.liberacoes }))
      .sort((a, b) => b.excecoes - a.excecoes || a.colaborador.localeCompare(b.colaborador, 'pt-BR'))
      .map((l, i) => ({ ...l, posicao: i + 1 }));
  }),
};

export default config;
