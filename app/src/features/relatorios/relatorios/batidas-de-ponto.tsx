import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSimNao, colunaTexto } from '../dados/colunas';
import { batidas, type Batida } from '../dados/jornada';

const config: ConfigRelatorio<Batida> = {
  titulo: 'Batidas de ponto',
  grupo: 'Jornada e horas',
  arquivo: 'batidas-de-ponto',
  vazio: 'Nenhuma batida de ponto nesse período para as pessoas escolhidas.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'select', chave: 'considerada', rotulo: 'Considerada', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
    { tipo: 'periodo', dias: 7 },
  ],
  kpis: [
    { rotulo: 'Batidas', valor: (rows) => rows.length },
    { rotulo: 'Pessoas', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    { rotulo: 'Consideradas', valor: (rows) => rows.filter((r) => r.considerada).length },
    { rotulo: 'Não consideradas', valor: (rows) => rows.filter((r) => !r.considerada).length },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    colunaDataHora('quando', 'Data e hora'),
    { key: 'tipo', header: 'Tipo', render: (r) => <Badge status={r.tipo === 'Entrada' ? 'info' : 'neutral'}>{r.tipo}</Badge>, texto: (r) => r.tipo },
    colunaSimNao('considerada', 'Considerada'),
    colunaDataHora('anterior', 'Batida anterior'),
    colunaTexto('justificativa', 'Justificativa'),
  ],
  buscar: buscarEm((f) => {
    const considerada = lerTexto(f, 'considerada');
    return porPessoa(batidas(), f).filter((b) => noPeriodo(b.quando, f) && (!considerada || b.considerada === (considerada === 'sim')));
  }),
};

export default config;
