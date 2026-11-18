import { diasEntre, somarDias } from '../../../mock/datas';

export type Motivo = 'Pausa' | 'Almoço' | 'Reunião externa' | 'Sem atividade';
export const MOTIVOS: Motivo[] = ['Pausa', 'Almoço', 'Reunião externa', 'Sem atividade'];

export interface Ausencia {
  id: string;
  pessoaId: string;
  /** YYYY-MM-DD */
  dia: string;
  /** HH:MM */
  inicio: string;
  /** HH:MM */
  fim: string;
  motivo: Motivo;
}

/** Expediente exibido na linha do tempo, em minutos desde a meia-noite (08:00 a 18:00). */
export const EXPEDIENTE = { inicio: 8 * 60, fim: 18 * 60 } as const;
export const MAX_DIAS_PERIODO = 31;

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function deMinutos(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export const duracaoEmMinutos = (a: Pick<Ausencia, 'inicio' | 'fim'>): number => paraMinutos(a.fim) - paraMinutos(a.inicio);

/** 65 → "1h05", 120 → "2h", 45 → "45min". */
export function formatarDuracao(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Posição e largura da barra em % do expediente. O que passa das bordas é cortado; fora do expediente devolve null. */
export function posicaoDaBarra(inicioMin: number, fimMin: number): { esquerda: number; largura: number } | null {
  const total = EXPEDIENTE.fim - EXPEDIENTE.inicio;
  const ini = Math.max(inicioMin, EXPEDIENTE.inicio);
  const fim = Math.min(fimMin, EXPEDIENTE.fim);
  if (fim <= ini) return null;
  return { esquerda: ((ini - EXPEDIENTE.inicio) / total) * 100, largura: ((fim - ini) / total) * 100 };
}

/** Texto único da barra: nome acessível e dica ao passar o mouse ou focar. */
export const textoDaAusencia = (a: Ausencia): string => `${a.motivo}, ${a.inicio} a ${a.fim}, ${formatarDuracao(duracaoEmMinutos(a))}`;

export interface Resumo {
  totalMin: number;
  pessoasComAusencia: number;
  mediaMinPorPessoaDia: number;
  maiorContinuaMin: number;
}

/** Maior ausência contínua: ausências encostadas ou sobrepostas, da mesma pessoa no mesmo dia, contam como uma só. */
export function maiorContinua(ausencias: Ausencia[]): number {
  const grupos = new Map<string, Ausencia[]>();
  for (const a of ausencias) {
    const chave = `${a.pessoaId}|${a.dia}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), a]);
  }
  let maior = 0;
  for (const lista of grupos.values()) {
    const ordenada = [...lista].sort((x, y) => paraMinutos(x.inicio) - paraMinutos(y.inicio));
    let ini = paraMinutos(ordenada[0].inicio);
    let fim = paraMinutos(ordenada[0].fim);
    for (const a of ordenada.slice(1)) {
      if (paraMinutos(a.inicio) <= fim) {
        fim = Math.max(fim, paraMinutos(a.fim));
      } else {
        maior = Math.max(maior, fim - ini);
        ini = paraMinutos(a.inicio);
        fim = paraMinutos(a.fim);
      }
    }
    maior = Math.max(maior, fim - ini);
  }
  return maior;
}

export function resumir(ausencias: Ausencia[], totalPessoas: number, diasUteis: number): Resumo {
  const totalMin = ausencias.reduce((s, a) => s + duracaoEmMinutos(a), 0);
  const base = totalPessoas * diasUteis;
  return {
    totalMin,
    pessoasComAusencia: new Set(ausencias.map((a) => a.pessoaId)).size,
    mediaMinPorPessoaDia: base > 0 ? totalMin / base : 0,
    maiorContinuaMin: maiorContinua(ausencias),
  };
}

/** Total de minutos por pessoa. */
export function totaisPorPessoa(ausencias: Ausencia[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const a of ausencias) mapa.set(a.pessoaId, (mapa.get(a.pessoaId) ?? 0) + duracaoEmMinutos(a));
  return mapa;
}

/** Mensagem amigável quando o período não serve; null quando está bom. */
export function validarPeriodo(de: string, ate: string): string | null {
  if (!de || !ate) return 'Preencha as duas datas, De e Até, para ver as ausências.';
  if (de > ate) return 'A data De não pode ser depois da data Até.';
  if (diasEntre(de, ate) + 1 > MAX_DIAS_PERIODO) return `Escolha um período de no máximo ${MAX_DIAS_PERIODO} dias.`;
  return null;
}

export function diaDaSemana(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

/** Segunda a sexta dentro do período, em ordem. */
export function diasUteisEntre(de: string, ate: string): string[] {
  const dias: string[] = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) {
    const s = diaDaSemana(d);
    if (s !== 0 && s !== 6) dias.push(d);
  }
  return dias;
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** "2026-10-12" → "12/10/2026". */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** "2026-10-12" → "12/10". */
export const formatarDiaMes = (iso: string): string => formatarData(iso).slice(0, 5);

/** "2026-10-12" → "Seg 12/10". */
export const rotuloDoDia = (iso: string): string => `${SEMANA[diaDaSemana(iso)]} ${formatarDiaMes(iso)}`;
