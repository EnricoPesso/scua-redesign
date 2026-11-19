import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { eventosDeAcesso, type EventoAcesso } from '../dados/acesso';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { CODIGOS_DE_ACESSO, rotuloEvento, statusEvento } from '../dados/eventos';

const config: ConfigRelatorio<EventoAcesso> = {
  titulo: 'Eventos de acesso',
  grupo: 'Bloqueios e liberações',
  arquivo: 'eventos-de-acesso',
  vazio: 'Nenhum evento de acesso para os filtros escolhidos.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'texto', chave: 'estacao', rotulo: 'Estação', placeholder: 'Ex.: SCUA-NB-014' },
    { tipo: 'select', chave: 'evento', rotulo: 'Tipo de evento', opcoes: CODIGOS_DE_ACESSO.map((c) => ({ value: c, label: rotuloEvento(c) })) },
    { tipo: 'periodo', dias: 7 },
  ],
  kpis: [
    { rotulo: 'Eventos', valor: (rows) => rows.length },
    { rotulo: 'Pessoas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    { rotulo: 'Logons negados', valor: (rows) => rows.filter((r) => r.evento === 'EVT_LOGON_DENIED').length },
    { rotulo: 'Estações', valor: (rows) => new Set(rows.map((r) => r.estacao)).size },
  ],
  colunas: [
    colunaDataHora('quando', 'Data e hora'),
    { key: 'evento', header: 'Evento', render: (r) => <Badge status={statusEvento(r.evento)}>{rotuloEvento(r.evento)}</Badge>, texto: (r) => rotuloEvento(r.evento) },
    { key: 'colaborador', header: 'Colaborador' },
    colunaSemQuebra('estacao', 'Estação'),
    { key: 'motivo', header: 'Motivo' },
  ],
  buscar: buscarEm((f) => {
    const estacao = lerTexto(f, 'estacao').trim().toUpperCase();
    const evento = lerTexto(f, 'evento');
    return porPessoa(eventosDeAcesso(), f).filter((e) => noPeriodo(e.quando, f) && (!estacao || e.estacao.includes(estacao)) && (!evento || e.evento === evento));
  }),
};

export default config;
