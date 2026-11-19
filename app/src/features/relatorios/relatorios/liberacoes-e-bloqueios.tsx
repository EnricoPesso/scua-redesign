import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { MOTIVOS, eventosLiberacao, type EventoLiberacao } from '../dados/liberacoes';

const config: ConfigRelatorio<EventoLiberacao> = {
  titulo: 'Liberações e bloqueios',
  grupo: 'Bloqueios e liberações',
  arquivo: 'liberacoes-e-bloqueios',
  vazio: 'Nenhuma liberação ou bloqueio para os filtros escolhidos.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'texto', chave: 'estacao', rotulo: 'Estação', placeholder: 'Ex.: SCUA-NB-014' },
    { tipo: 'select', chave: 'tipo', rotulo: 'Tipo de evento', opcoes: [{ value: 'Liberação', label: 'Liberações' }, { value: 'Bloqueio', label: 'Bloqueios' }] },
    { tipo: 'select', chave: 'motivo', rotulo: 'Motivo', opcoes: MOTIVOS.map((m) => ({ value: m, label: m })) },
    { tipo: 'periodo', dias: 30 },
  ],
  kpis: [
    { rotulo: 'Eventos', valor: (rows) => rows.length },
    { rotulo: 'Bloqueios', valor: (rows) => rows.filter((r) => r.tipo === 'Bloqueio').length },
    { rotulo: 'Liberações', valor: (rows) => rows.filter((r) => r.tipo === 'Liberação').length },
    { rotulo: 'Pessoas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
  ],
  colunas: [
    colunaDataHora('quando', 'Data e hora'),
    { key: 'tipo', header: 'Evento', render: (r) => <Badge status={r.tipo === 'Bloqueio' ? 'danger' : 'success'}>{r.tipo}</Badge>, texto: (r) => r.tipo },
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    colunaSemQuebra('estacao', 'Estação'),
    { key: 'motivo', header: 'Motivo' },
  ],
  buscar: buscarEm((f) => {
    const estacao = lerTexto(f, 'estacao').trim().toUpperCase();
    const tipo = lerTexto(f, 'tipo');
    const motivo = lerTexto(f, 'motivo');
    return porPessoa(eventosLiberacao(), f).filter(
      (e) => noPeriodo(e.quando, f) && (!estacao || e.estacao.includes(estacao)) && (!tipo || e.tipo === tipo) && (!motivo || e.motivo === motivo),
    );
  }),
};

export default config;
