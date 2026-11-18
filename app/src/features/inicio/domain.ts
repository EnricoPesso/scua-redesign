import type { Status } from '../extensoes/domain/types';

export type Janela = 'hoje' | '7dias' | 'mes';

export const JANELAS: { valor: Janela; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: 'mes', rotulo: 'Este mês' },
];

export const ehJanela = (v: string | null): v is Janela => v === 'hoje' || v === '7dias' || v === 'mes';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dois = (n: number) => String(n).padStart(2, '0');

/** "2026-10" → "outubro de 2026". */
export function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${ano}`;
}

/** "2026-10" → "out/26" (rótulo curto do eixo). */
export function mesCurto(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1].slice(0, 3)}/${dois(ano % 100)}`;
}

/** Os `n` meses que terminam em `mes` (YYYY-MM), do mais antigo para o mais recente. */
export function ultimosMeses(mes: string, n: number): string[] {
  const [ano, m] = mes.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(ano, m - 1 - (n - 1 - i), 1);
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}`;
  });
}

/** Primeiro dia (YYYY-MM-DD) da janela que termina em `hoje`. */
export function inicioDaJanela(janela: Janela, hoje: string): string {
  if (janela === 'hoje') return hoje;
  if (janela === 'mes') return `${hoje.slice(0, 7)}-01`;
  const d = new Date(`${hoje}T12:00:00`);
  d.setDate(d.getDate() - 6);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/** Texto do período da janela, sempre visível ao lado do gráfico: "hoje, 12/10" · "de 06/10 a 12/10". */
export function textoDaJanela(janela: Janela, hoje: string): string {
  if (janela === 'hoje') return `hoje, ${ddmm(hoje)}`;
  if (janela === 'mes') return `em ${nomeDoMes(hoje.slice(0, 7))}`;
  return `de ${ddmm(inicioDaJanela(janela, hoje))} a ${ddmm(hoje)}`;
}

export interface MesDoHistorico { mes: string; minutos: number }

export interface ResumoHistorico {
  totalMin: number;
  mediaMin: number;
  pico: MesDoHistorico | null;
}

/** Total, média mensal e mês de pico do histórico. Histórico vazio ou zerado não tem pico. */
export function resumirHistorico(meses: MesDoHistorico[]): ResumoHistorico {
  const totalMin = meses.reduce((s, m) => s + m.minutos, 0);
  if (meses.length === 0 || totalMin === 0) return { totalMin: 0, mediaMin: 0, pico: null };
  const pico = meses.reduce((a, b) => (b.minutos > a.minutos ? b : a));
  return { totalMin, mediaMin: Math.round(totalMin / meses.length), pico };
}

export type ContagemPorStatus = Record<Status, number>;

export const totalDePedidos = (c: ContagemPorStatus): number => c.pendente + c.aprovado + c.reprovado + c.cancelado;

/** Largura da barra em %, proporcional ao maior valor (o maior ocupa 100%). Zero não tem barra. */
export function larguraDaBarra(valor: number, maior: number): number {
  if (valor <= 0 || maior <= 0) return 0;
  return Math.max(2, Math.round((valor / maior) * 100));
}
