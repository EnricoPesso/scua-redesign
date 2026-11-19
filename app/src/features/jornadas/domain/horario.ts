import { DIAS, DIAS_UTEIS, NOME_CURTO, type Dia, type HorarioDia, type Semana } from './tipos';

/** "08:30" vira 510. Texto vazio ou inválido vira null. */
export function paraMinutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutos trabalhados no dia, já descontado o intervalo. Dia sem trabalho ou com horário inválido vale 0. */
export function cargaDoDia(d: HorarioDia): number {
  if (!d.trabalha) return 0;
  const entrada = paraMinutos(d.entrada);
  const saida = paraMinutos(d.saida);
  if (entrada === null || saida === null || saida <= entrada) return 0;
  let total = saida - entrada;
  const ini = paraMinutos(d.intervaloInicio);
  const fim = paraMinutos(d.intervaloFim);
  if (ini !== null && fim !== null && fim > ini) total -= fim - ini;
  return Math.max(0, total);
}

export function cargaSemanalEmMinutos(semana: Semana): number {
  return DIAS.reduce((soma, dia) => soma + cargaDoDia(semana[dia]), 0);
}

/** 2400 vira "40h"; 2250 vira "37h30". */
export function formatarCarga(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

export const cargaSemanal = (semana: Semana): string => formatarCarga(cargaSemanalEmMinutos(semana));

/** Junta dias seguidos: [seg, ter, qua] vira "Seg a qua"; dois dias viram "Seg e ter". */
function rotularDias(dias: Dia[]): string {
  const posicoes = dias.map((d) => DIAS.indexOf(d));
  const trechos: Dia[][] = [];
  posicoes.forEach((p, i) => {
    if (i > 0 && p === posicoes[i - 1] + 1) trechos[trechos.length - 1].push(DIAS[p]);
    else trechos.push([DIAS[p]]);
  });
  const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const nomes = trechos.map((t) => {
    if (t.length >= 3) return `${NOME_CURTO[t[0]]} a ${minuscula(NOME_CURTO[t[t.length - 1]])}`;
    return t.map((d, i) => (i === 0 ? NOME_CURTO[d] : minuscula(NOME_CURTO[d]))).join(' e ');
  }).map((n, i) => (i === 0 ? n : minuscula(n)));
  if (nomes.length <= 1) return nomes[0] ?? '';
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

/**
 * "Seg a sex, 08:00–17:00". Dias com o mesmo horário (entrada e saída) ficam juntos;
 * horários diferentes são separados por ponto e vírgula.
 */
export function resumirHorario(semana: Semana): string {
  const grupos = new Map<string, Dia[]>();
  for (const dia of DIAS) {
    const d = semana[dia];
    if (!d.trabalha || !d.entrada || !d.saida) continue;
    const chave = `${d.entrada}–${d.saida}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), dia]);
  }
  if (grupos.size === 0) return 'Sem dias de trabalho';
  return [...grupos.entries()].map(([horario, dias]) => `${rotularDias(dias)}, ${horario}`).join('; ');
}

/** Copia o horário da segunda para terça a sexta (os outros dias ficam como estão). */
export function copiarSegundaParaDiasUteis(semana: Semana): Semana {
  const novo = { ...semana };
  for (const dia of DIAS_UTEIS) if (dia !== 'seg') novo[dia] = { ...semana.seg };
  return novo;
}
