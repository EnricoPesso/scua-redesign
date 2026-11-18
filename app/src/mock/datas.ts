/**
 * Datas dos dados de exemplo, sempre relativas a "hoje": a demonstração nunca fica vazia por causa do calendário.
 * Nos testes o relógio é fixo (12/10/2026), então os valores são previsíveis.
 */
const dois = (n: number) => String(n).padStart(2, '0');

export function isoDia(d: Date): string {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Hoje, como YYYY-MM-DD (dia local). */
export function hoje(): string {
  return isoDia(new Date());
}

/** O dia a `n` dias de hoje (negativo = passado), como YYYY-MM-DD. */
export function dia(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return isoDia(d);
}

/** Data e hora local a `n` dias de hoje: `quando(-1, '08:30')` → "2026-10-11T08:30:00". */
export function quando(n: number, hora: string): string {
  return `${dia(n)}T${hora}:00`;
}

/** Soma dias a uma data YYYY-MM-DD (aceita data com hora: a hora é mantida). */
export function somarDias(data: string, dias: number): string {
  const [parteDia, ...resto] = data.split('T');
  const d = new Date(`${parteDia}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return [isoDia(d), ...resto].join('T');
}

/** Dias inteiros de `de` até `ate` (YYYY-MM-DD). */
export function diasEntre(de: string, ate: string): number {
  const a = new Date(`${de}T12:00:00`).getTime();
  const b = new Date(`${ate}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

const DATA = /^\d{4}-\d{2}-\d{2}(T[\d:.]+)?$/;

/** Desloca todas as datas (YYYY-MM-DD, com ou sem hora) de um objeto de exemplo. */
export function deslocarDatas<T>(valor: T, dias: number): T {
  if (dias === 0) return valor;
  if (typeof valor === 'string') return (DATA.test(valor) ? somarDias(valor, dias) : valor) as T;
  if (Array.isArray(valor)) return valor.map((v) => deslocarDatas(v, dias)) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, deslocarDatas(v, dias)])) as T;
  }
  return valor;
}
