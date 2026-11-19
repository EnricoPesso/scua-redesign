import { contarDias, minutosPorDia } from '../extensoes/domain/horas';
import type { Horario, Status } from '../extensoes/domain/types';

/** Atalhos do período do resumo. "dia" é uma data escolhida no calendário. */
export type Atalho = 'hoje' | 'ontem' | '7dias' | 'mes';
export type TipoPeriodo = Atalho | 'dia';

export const ATALHOS: { valor: Atalho; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'ontem', rotulo: 'Ontem' },
  { valor: '7dias', rotulo: '7 dias' },
  { valor: 'mes', rotulo: 'Este mês' },
];

/** Período do resumo, sempre terminando no máximo em hoje. Datas YYYY-MM-DD (dia local). */
export interface Periodo { de: string; ate: string; tipo: TipoPeriodo }

const ehAtalho = (v: string | null): v is Atalho => v === 'hoje' || v === 'ontem' || v === '7dias' || v === 'mes';
const DATA = /^\d{4}-\d{2}-\d{2}$/;

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

function somarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export function periodoDoAtalho(atalho: Atalho, hoje: string): Periodo {
  if (atalho === 'ontem') {
    const ontem = somarDias(hoje, -1);
    return { de: ontem, ate: ontem, tipo: 'ontem' };
  }
  if (atalho === '7dias') return { de: somarDias(hoje, -6), ate: hoje, tipo: '7dias' };
  if (atalho === 'mes') return { de: `${hoje.slice(0, 7)}-01`, ate: hoje, tipo: 'mes' };
  return { de: hoje, ate: hoje, tipo: 'hoje' };
}

/** Período a partir da URL: `?dia=YYYY-MM-DD` (até hoje) ou `?periodo=hoje|ontem|7dias|mes`. Inválido vira "hoje". */
export function lerPeriodo(params: URLSearchParams, hoje: string): Periodo {
  const dia = params.get('dia');
  if (dia && DATA.test(dia) && !Number.isNaN(new Date(`${dia}T12:00:00`).getTime()) && dia <= hoje) return { de: dia, ate: dia, tipo: 'dia' };
  const atalho = params.get('periodo');
  return periodoDoAtalho(ehAtalho(atalho) ? atalho : 'hoje', hoje);
}

const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/** Texto do período, sempre visível ao lado dos números: "hoje, 12/10" · "de 06/10 a 12/10" · "em 07/10/2026". */
export function textoDoPeriodo(p: Periodo): string {
  if (p.tipo === 'hoje') return `hoje, ${ddmm(p.de)}`;
  if (p.tipo === 'ontem') return `ontem, ${ddmm(p.de)}`;
  if (p.tipo === 'mes') return `em ${nomeDoMes(p.de.slice(0, 7))}`;
  if (p.tipo === 'dia') return `em ${ddmm(p.de)}/${p.de.slice(0, 4)}`;
  return `de ${ddmm(p.de)} a ${ddmm(p.ate)}`;
}

/** Como o período entra na frase "Este é o resumo de …". */
export function fraseDoPeriodo(p: Periodo): string {
  if (p.tipo === 'hoje') return `de hoje, ${ddmm(p.de)}/${p.de.slice(0, 4)}`;
  if (p.tipo === 'ontem') return `de ontem, ${ddmm(p.de)}/${p.de.slice(0, 4)}`;
  if (p.tipo === 'dia') return `de ${ddmm(p.de)}/${p.de.slice(0, 4)}`;
  if (p.tipo === 'mes') return `de ${nomeDoMes(p.de.slice(0, 7))} até hoje`;
  return `de ${ddmm(p.de)} a ${ddmm(p.ate)}`;
}

/** Dia útil (segunda a sexta). */
export function ehDiaUtil(dia: string): boolean {
  const s = new Date(`${dia}T12:00:00`).getDay();
  return s !== 0 && s !== 6;
}

/** Dias úteis do período (no máximo um mês, que é o maior atalho). */
export function diasUteisDoPeriodo(p: Periodo): string[] {
  const dias: string[] = [];
  for (let d = p.de, n = 0; d <= p.ate && n < 62; d = somarDias(d, 1), n++) if (ehDiaUtil(d)) dias.push(d);
  return dias;
}

/** Minutos de uma extensão que caem dentro do período (só os dias em comum contam). */
export function minutosNoPeriodo(pedido: { dataInicial: string; dataFinal: string; horario: Horario }, de: string, ate: string): number {
  const inicio = pedido.dataInicial > de ? pedido.dataInicial : de;
  const fim = pedido.dataFinal < ate ? pedido.dataFinal : ate;
  if (inicio > fim) return 0;
  return contarDias(inicio, fim) * minutosPorDia(pedido.horario);
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
