import { Badge } from '@/components/ui/badge';
import { hoje } from '../../mock/datas';
import { OPCOES_DIRETORIAS } from '../../mock/diretorio';
import type { ConfigCadastro } from '../../componentes/cadastro/tipos';
import { liberacoes, type Liberacao } from './api';
import { formatarHorario, formatarPeriodo, ROTULO_SITUACAO, situacaoDaLiberacao, validarPeriodo, type SituacaoLiberacao } from './domain/liberacao';

const STATUS: Record<SituacaoLiberacao, 'success' | 'info' | 'neutral'> = { 'em-vigor': 'success', agendada: 'info', encerrada: 'neutral' };

export const configLiberacoes: ConfigCadastro<Liberacao> = {
  chave: 'liberacoes',
  titulo: 'Liberações por diretoria',
  descricao: 'Períodos em que uma diretoria inteira, ou uma área dela, fica liberada do controle de jornada.',
  trilha: [],
  singular: 'liberação',
  genero: 'a',
  colecao: liberacoes,
  colunas: [
    { key: 'diretoria', header: 'Diretoria' },
    { key: 'area', header: 'Área', render: (x) => x.area.trim() || 'Toda a diretoria' },
    { key: 'periodo', header: 'Período', render: (x) => formatarPeriodo(x.de, x.ate) },
    { key: 'horario', header: 'Horário', render: (x) => formatarHorario(x.horaDe, x.horaAte) },
    { key: 'motivo', header: 'Motivo' },
    {
      key: 'situacao',
      header: 'Situação',
      render: (x) => {
        const s = situacaoDaLiberacao(x, hoje());
        return <Badge status={STATUS[s]}>{ROTULO_SITUACAO[s]}</Badge>;
      },
    },
  ],
  campos: [
    { chave: 'diretoria', rotulo: 'Diretoria', tipo: 'select', opcoes: OPCOES_DIRETORIAS, obrigatorio: true },
    { chave: 'area', rotulo: 'Área (opcional)', tipo: 'texto', maximo: 60, dica: 'Deixe vazio para liberar a diretoria toda.' },
    { chave: 'de', rotulo: 'De', tipo: 'data', obrigatorio: true },
    { chave: 'ate', rotulo: 'Até', tipo: 'data', obrigatorio: true },
    { chave: 'horaDe', rotulo: 'Horário inicial (opcional)', tipo: 'hora', dica: 'Sem horário, a liberação vale o dia todo.' },
    { chave: 'horaAte', rotulo: 'Horário final (opcional)', tipo: 'hora' },
    { chave: 'motivo', rotulo: 'Motivo', tipo: 'texto', obrigatorio: true, maximo: 120 },
  ],
  novo: () => ({ diretoria: '', area: '', de: '', ate: '', horaDe: '', horaAte: '', motivo: '' }),
  nomeDe: (x) => `${x.diretoria}${x.area.trim() ? ` (${x.area.trim()})` : ''}`,
  textoDeBusca: (x) => `${x.diretoria} ${x.area} ${x.motivo}`,
  validar: (d) => validarPeriodo(d),
};
