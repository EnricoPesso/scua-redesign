import { Badge } from '@/components/ui/badge';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { rotuloEvento, statusEvento } from '../dados/eventos';
import { formatarDuracao } from '../dados/formatacao';
import { ocorrencias, type Ocorrencia } from '../dados/liberacoes';

// Cada linha pareia um bloqueio com a liberação dele. Bloqueios ainda sem liberação ficam de fora.
const liberadas = (): Ocorrencia[] => ocorrencias().filter((o) => o.liberacaoEm !== null);
const tempo = (r: Ocorrencia) => (r.minutos === null ? '—' : formatarDuracao(r.minutos));

const config: ConfigRelatorio<Ocorrencia> = {
  titulo: 'Tempo de bloqueio',
  grupo: 'Bloqueios e liberações',
  arquivo: 'tempo-de-bloqueio',
  vazio: 'Nenhum bloqueio com liberação nesse período.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 30 }],
  kpis: [
    { rotulo: 'Bloqueios liberados', valor: (rows) => rows.length },
    { rotulo: 'Pessoas bloqueadas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    { rotulo: 'Tempo médio bloqueado', unidade: 'min', valor: (rows) => (rows.length ? rows.reduce((s, r) => s + (r.minutos ?? 0), 0) / rows.length : 0) },
    { rotulo: 'Maior tempo bloqueado', unidade: 'min', valor: (rows) => Math.max(0, ...rows.map((r) => r.minutos ?? 0)) },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    { key: 'evento', header: 'Evento', render: (r) => <Badge status={statusEvento(r.evento)}>{rotuloEvento(r.evento)}</Badge>, texto: (r) => rotuloEvento(r.evento) },
    // Texto longo: largura mínima para a linha não ficar com uma palavra por linha.
    { key: 'mensagem', header: 'Mensagem', render: (r) => <span className="block min-w-[18rem]">{r.mensagem}</span>, texto: (r) => r.mensagem },
    colunaSemQuebra('estacao', 'Estação'),
    colunaDataHora('bloqueioEm', 'Bloqueado em'),
    colunaDataHora('liberacaoEm', 'Liberado em'),
    { key: 'minutos', header: 'Tempo bloqueado', numeric: true, render: (r) => <span className="whitespace-nowrap">{tempo(r)}</span>, texto: tempo },
  ],
  buscar: buscarEm((f) => porPessoa(liberadas(), f).filter((o) => noPeriodo(o.bloqueioEm, f))),
};

export default config;
