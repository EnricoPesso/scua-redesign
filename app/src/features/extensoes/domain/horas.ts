import type { Horario } from './types';

const DIA_MS = 86_400_000;

/** Converte YYYY-MM-DD para milissegundos UTC (evita problema de horário de verão). null se a data não existe. */
function paraUTC(data: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(ano, mes - 1, dia);
  const d = new Date(t);
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return t;
}

export function ehDataValida(data: string): boolean {
  return paraUTC(data) !== null;
}

/** Dias do intervalo, contando os dois extremos. dataFinal vazia = um dia só. 0 se inválido. */
export function contarDias(dataInicial: string, dataFinal: string): number {
  const inicio = paraUTC(dataInicial);
  if (inicio === null) return 0;
  if (dataFinal === '') return 1;
  const fim = paraUTC(dataFinal);
  if (fim === null || fim < inicio) return 0;
  return Math.round((fim - inicio) / DIA_MS) + 1;
}

export function paraMinutos(hora: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutos de extensão em cada dia. 0 se o horário for inválido ou o fim não for depois do início. */
export function minutosPorDia(horario: Horario): number {
  const inicio = paraMinutos(horario.inicio);
  const fim = paraMinutos(horario.fim);
  if (inicio === null || fim === null || fim <= inicio) return 0;
  return fim - inicio;
}

export function totalMinutos(dataInicial: string, dataFinal: string, horario: Horario): number {
  return contarDias(dataInicial, dataFinal) * minutosPorDia(horario);
}

/** 120 → "2h", 90 → "1h30", 30 → "30min", 0 → "0h". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
