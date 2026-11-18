export interface DadosLiberacao {
  diretoria: string;
  area: string;
  de: string;
  ate: string;
  horaDe: string;
  horaAte: string;
  motivo: string;
}

export type SituacaoLiberacao = 'em-vigor' | 'agendada' | 'encerrada';

/** Situação em relação a `hoje` (YYYY-MM-DD): o último dia ainda conta como em vigor. */
export function situacaoDaLiberacao(l: Pick<DadosLiberacao, 'de' | 'ate'>, hoje: string): SituacaoLiberacao {
  if (l.ate < hoje) return 'encerrada';
  if (l.de > hoje) return 'agendada';
  return 'em-vigor';
}

export const ROTULO_SITUACAO: Record<SituacaoLiberacao, string> = {
  'em-vigor': 'Em vigor',
  agendada: 'Agendada',
  encerrada: 'Encerrada',
};

/** "12/10 a 20/10/2026". Datas inválidas ou vazias viram "—". */
export function formatarPeriodo(de: string, ate: string): string {
  const ok = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!ok(de) || !ok(ate)) return '—';
  return `${de.slice(8)}/${de.slice(5, 7)} a ${ate.slice(8)}/${ate.slice(5, 7)}/${ate.slice(0, 4)}`;
}

/** "08:00 às 12:00" ou "O dia todo" quando não há horário. */
export function formatarHorario(horaDe: string, horaAte: string): string {
  return horaDe && horaAte ? `${horaDe} às ${horaAte}` : 'O dia todo';
}

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Duas liberações da mesma diretoria e da mesma área (vazio = toda a diretoria) com dias e horários que se cruzam. */
export function sobrepoe(a: DadosLiberacao, b: DadosLiberacao): boolean {
  if (a.diretoria !== b.diretoria || norm(a.area) !== norm(b.area)) return false;
  if (a.ate < b.de || b.ate < a.de) return false;
  const temHorarios = a.horaDe && a.horaAte && b.horaDe && b.horaAte;
  if (temHorarios && (a.horaAte <= b.horaDe || b.horaAte <= a.horaDe)) return false;
  return true;
}

/** Mensagem amigável quando há conflito com outra liberação; nada quando está livre. */
export function conflitoDaLiberacao(nova: DadosLiberacao, existentes: (DadosLiberacao & { id: string })[], idAtual?: string): string | undefined {
  const outra = existentes.find((e) => e.id !== idAtual && sobrepoe(nova, e));
  if (!outra) return undefined;
  const onde = norm(nova.area) ? `${nova.diretoria}, área ${nova.area.trim()}` : `${nova.diretoria} (toda a diretoria)`;
  return `Já existe uma liberação para ${onde} em ${formatarPeriodo(outra.de, outra.ate)}. Ajuste as datas ou os horários.`;
}

export type ErrosLiberacao = Partial<Record<keyof DadosLiberacao, string>>;

/** Regras de data e horário (obrigatórios simples ficam por conta do modelo de cadastro). */
export function validarPeriodo(d: DadosLiberacao): ErrosLiberacao {
  const erros: ErrosLiberacao = {};
  if (d.de && d.ate && d.ate < d.de) erros.ate = 'A data final não pode ser anterior à inicial';
  if (d.horaDe && !d.horaAte) erros.horaAte = 'Informe o horário final ou apague o inicial';
  else if (d.horaAte && !d.horaDe) erros.horaDe = 'Informe o horário inicial ou apague o final';
  else if (d.horaDe && d.horaAte && d.horaAte <= d.horaDe) erros.horaAte = 'O horário final precisa ser depois do inicial';
  return erros;
}
