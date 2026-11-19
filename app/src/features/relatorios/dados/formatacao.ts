/** Formatação de datas e durações dos relatórios (pt-BR). Funções puras. */

const dois = (n: number) => String(n).padStart(2, '0');

/** "2026-10-12" ou "2026-10-12T08:30:00" → "12/10/2026". */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** "2026-10-12T08:30:00" → "12/10/2026 08:30". */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** 80 → "1h20", 120 → "2h", 45 → "45min", 0 → "0min". */
export function formatarDuracao(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${dois(m)}`;
}

/** Minutos inteiros entre dois instantes ISO (b depois de a). */
export function minutosEntre(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000);
}

/** Minutos do dia → "HH:MM". */
export function horaDe(minutosDoDia: number): string {
  return `${dois(Math.floor(minutosDoDia / 60))}:${dois(minutosDoDia % 60)}`;
}
