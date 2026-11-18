const dois = (n: number) => String(n).padStart(2, '0');
const iso = (ano: number, mes: number, dia: number) => `${ano}-${dois(mes)}-${dois(dia)}`;

/** Domingo de Páscoa (algoritmo gregoriano anônimo). */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia, 12);
}

/** Feriados nacionais do ano, em ordem de data. */
export function feriadosNacionaisDoAno(ano: number): { data: string; nome: string }[] {
  const sexta = pascoa(ano);
  sexta.setDate(sexta.getDate() - 2);
  const lista = [
    { data: iso(ano, 1, 1), nome: 'Confraternização Universal' },
    { data: iso(sexta.getFullYear(), sexta.getMonth() + 1, sexta.getDate()), nome: 'Sexta-feira Santa' },
    { data: iso(ano, 4, 21), nome: 'Tiradentes' },
    { data: iso(ano, 5, 1), nome: 'Dia do Trabalho' },
    { data: iso(ano, 9, 7), nome: 'Independência do Brasil' },
    { data: iso(ano, 10, 12), nome: 'Nossa Senhora Aparecida' },
    { data: iso(ano, 11, 2), nome: 'Finados' },
    { data: iso(ano, 11, 15), nome: 'Proclamação da República' },
    { data: iso(ano, 11, 20), nome: 'Dia da Consciência Negra' },
    { data: iso(ano, 12, 25), nome: 'Natal' },
  ];
  return lista.sort((x, y) => x.data.localeCompare(y.data));
}

/** "12/10/2026 (segunda-feira)". Data inválida ou vazia vira travessão. */
export function dataComDiaDaSemana(isoData: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoData)) return '—';
  const [a, m, d] = isoData.split('-');
  const semana = new Date(`${isoData}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${d}/${m}/${a} (${semana})`;
}
