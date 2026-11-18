import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra, colunaSimNao } from '../dados/colunas';
import { rotuloEvento, statusEvento } from '../dados/eventos';
import { controles, type Controle } from '../dados/jornada';

const config: ConfigRelatorio<Controle> = {
  titulo: 'Jornada e controle',
  grupo: 'Jornada e horas',
  arquivo: 'jornada-e-controle',
  vazio: 'Nenhuma pessoa encontrada para os filtros escolhidos.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'select', chave: 'controlado', rotulo: 'Controlado', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
  ],
  kpis: [
    { rotulo: 'Pessoas', valor: (rows) => rows.length },
    { rotulo: 'Controladas', valor: (rows) => rows.filter((r) => r.controlado).length },
    { rotulo: 'Sem controle', valor: (rows) => rows.filter((r) => !r.controlado).length },
    { rotulo: 'Com jornada liberada', valor: (rows) => rows.filter((r) => r.liberada).length },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    colunaSemQuebra('jornada', 'Jornada'),
    colunaSimNao('liberada', 'Jornada liberada'),
    colunaSimNao('controlado', 'Usuário controlado'),
    { key: 'ultimoEvento', header: 'Último evento de controle', render: (r) => <Badge status={statusEvento(r.ultimoEvento)}>{rotuloEvento(r.ultimoEvento)}</Badge>, texto: (r) => rotuloEvento(r.ultimoEvento) },
    colunaDataHora('ultimoEventoEm', 'Data do último evento'),
    colunaSemQuebra('estacao', 'Estação'),
  ],
  buscar: buscarEm((f) => {
    const controlado = lerTexto(f, 'controlado');
    return porPessoa(controles(), f).filter((c) => !controlado || c.controlado === (controlado === 'sim'));
  }),
};

export default config;
