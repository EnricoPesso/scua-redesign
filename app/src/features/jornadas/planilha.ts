import type { ColunaPlanilha } from '@/lib/planilha';
import { cargaSemanal, resumirHorario } from './domain/horario';
import type { Jornada } from './domain/tipos';

/** Situação em texto, igual à coluna da tabela: "Ativa, Padrão, Libera regra". */
export function textoDaSituacao(j: Jornada): string {
  return [j.ativa ? 'Ativa' : 'Inativa', j.padrao && 'Padrão', j.liberaRegra && 'Libera regra', j.informativa && 'Informativa'].filter(Boolean).join(', ');
}

export const COLUNAS_PLANILHA: ColunaPlanilha<Jornada>[] = [
  { header: 'Identificador', texto: (j) => j.identificador },
  { header: 'Descrição', texto: (j) => j.descricao },
  { header: 'Horário', texto: (j) => resumirHorario(j.semana) },
  { header: 'Carga semanal', texto: (j) => cargaSemanal(j.semana) },
  { header: 'Situação', texto: textoDaSituacao },
];
