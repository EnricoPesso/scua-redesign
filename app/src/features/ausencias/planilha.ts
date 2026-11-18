import type { ColunaPlanilha } from '@/lib/planilha';
import { nomeDe } from '../../mock/diretorio';
import { duracaoEmMinutos, formatarData, formatarDuracao, type Ausencia } from './domain/ausencias';

/** Mesmas colunas da tabela de ausências. */
export const COLUNAS_PLANILHA: ColunaPlanilha<Ausencia>[] = [
  { header: 'Pessoa', texto: (a) => nomeDe(a.pessoaId) },
  { header: 'Dia', texto: (a) => formatarData(a.dia) },
  { header: 'Início', texto: (a) => a.inicio },
  { header: 'Fim', texto: (a) => a.fim },
  { header: 'Duração', texto: (a) => formatarDuracao(duracaoEmMinutos(a)) },
  { header: 'Motivo', texto: (a) => a.motivo },
];
