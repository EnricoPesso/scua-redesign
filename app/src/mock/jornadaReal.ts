import { dia as diaRelativo } from './datas';
import { PESSOAS_DIRETORIO } from './diretorio';

/**
 * O que o agente do Scua Logon registrou em cada dia de cada pessoa: jornada prevista, uso real da estação,
 * horas além da jornada (com e sem aprovação) e o que o bloqueio impediu.
 * É a base comum da Previsão de jornada, do Radar de passivo, do Dossiê e de Meus dados.
 * Dados de exemplo, determinísticos e relativos a hoje. Ainda não existe contrato de API para isto.
 */
export interface DiaDeJornada {
  pessoaId: string;
  /** YYYY-MM-DD. */
  dia: string;
  /** 0 = domingo … 6 = sábado. */
  diaDaSemana: number;
  /** Jornada combinada. Em dia sem jornada (fim de semana), `previstoInicio` e `previstoFim` são null. */
  previstoInicio: string | null;
  previstoFim: string | null;
  intervaloPrevistoMin: number;
  /** Primeiro logon e último logoff do dia ("HH:MM"). null = não usou a estação. */
  primeiroLogon: string | null;
  ultimoLogoff: string | null;
  /** Intervalo de almoço que a pessoa fez de fato. */
  intervaloRealMin: number;
  /** Minutos além da jornada cobertos por extensão aprovada. */
  extraAprovadaMin: number;
  /** Minutos além da jornada sem extensão aprovada (estação liberada por exceção ou por diretoria). */
  extraSemAprovacaoMin: number;
  /** Tentativas de uso fora da jornada que o bloqueio barrou. */
  tentativasBloqueadas: number;
  /** Estimativa de minutos de trabalho fora da jornada que o bloqueio impediu. */
  minutosEvitados: number;
  pausasPrevistas: number;
  pausasFeitas: number;
}

const dois = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${dois(Math.floor(min / 60) % 24)}:${dois(min % 60)}`;
export const emMinutos = (hora: string): number => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/** Número de 0 a 99, sempre o mesmo para o mesmo par (pessoa, dia). */
function ruido(i: number, k: number, sal = 0): number {
  let x = (Math.imul(i + 1, 73856093) ^ Math.imul(k + 101, 19349663) ^ Math.imul(sal + 7, 83492791)) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x5bd1e995) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; // sem o >>> 0 o XOR devolve número com sinal, e o resto poderia ser negativo
  return x % 100;
}

/**
 * Perfis de exemplo, para as telas terem o que mostrar:
 * - "crescente": a hora extra vem subindo nas últimas semanas (a previsão deve acusar).
 * - "semAprovacao": trabalha além da jornada sem pedido aprovado (o radar deve acusar).
 * - "intervaloCurto": almoça em menos de 1 hora com frequência.
 * - "tardeENoite": sai tarde e volta cedo (risco de interjornada).
 */
type Perfil = 'regular' | 'crescente' | 'semAprovacao' | 'intervaloCurto' | 'tardeENoite';
const PERFIS: Record<string, Perfil> = {
  'u-ana': 'crescente',
  'u-joao': 'semAprovacao',
  'u-heitor': 'tardeENoite',
  'u-leo': 'crescente',
  'u-xavier': 'intervaloCurto',
  'u-paula': 'semAprovacao',
  'u-iara': 'crescente',
  'u-otavio': 'intervaloCurto',
  'u-sara': 'tardeENoite',
};
/** Quem entra às 9h (os demais entram às 8h). A jornada é de 8 horas mais 1 hora de intervalo. */
const ENTRA_AS_9 = new Set(['u-iara', 'u-nina', 'u-heitor', 'u-julio', 'u-sara', 'u-marcos']);

/** Custo de uma hora normal de trabalho, em R$ (salário ÷ 220). Exemplo: o cliente informa o valor real. */
export const CUSTO_HORA: Record<string, number> = Object.fromEntries(
  PESSOAS_DIRETORIO.map((p, i) => [p.id, p.gestorId === null ? 62 + (i % 3) * 9 : 24 + ((i * 7) % 9) * 3.5]),
);

function gerarDia(pessoaId: string, i: number, n: number): DiaDeJornada {
  const data = diaRelativo(n);
  const d = new Date(`${data}T12:00:00`);
  const semana = d.getDay();
  const perfil = PERFIS[pessoaId] ?? 'regular';
  const inicio = ENTRA_AS_9.has(pessoaId) ? 9 * 60 : 8 * 60;
  const fim = inicio + 9 * 60;
  // `k` identifica o dia sem depender de "hoje": o mesmo dia do calendário dá sempre o mesmo resultado.
  const k = Math.floor(d.getTime() / 86_400_000);
  const r = (sal: number) => ruido(i, k, sal);
  const base: DiaDeJornada = {
    pessoaId, dia: data, diaDaSemana: semana,
    previstoInicio: null, previstoFim: null, intervaloPrevistoMin: 0,
    primeiroLogon: null, ultimoLogoff: null, intervaloRealMin: 0,
    extraAprovadaMin: 0, extraSemAprovacaoMin: 0, tentativasBloqueadas: 0, minutosEvitados: 0,
    pausasPrevistas: 0, pausasFeitas: 0,
  };

  if (semana === 0 || semana === 6) {
    // Fim de semana: quase sempre só tentativas barradas; quem trabalha sem aprovação às vezes usa a estação liberada.
    if (perfil === 'semAprovacao' && semana === 6 && r(1) < 35) {
      const minutos = 120 + (r(2) % 4) * 30;
      return { ...base, primeiroLogon: hhmm(9 * 60), ultimoLogoff: hhmm(9 * 60 + minutos), extraSemAprovacaoMin: minutos };
    }
    if (r(3) < 12) return { ...base, tentativasBloqueadas: 1 + (r(4) % 2), minutosEvitados: 30 + (r(5) % 4) * 15 };
    return base;
  }

  // Ausência ocasional (férias, atestado): dia sem uso da estação.
  if (r(6) < 4) return { ...base, previstoInicio: hhmm(inicio), previstoFim: hhmm(fim), intervaloPrevistoMin: 60, pausasPrevistas: 2 };

  // Quanto mais perto de hoje, maior o peso (0 a 1) — usado pelo perfil "crescente".
  const recente = Math.max(0, Math.min(1, (30 + n) / 30));
  let aprovada = 0;
  let semAprovacao = 0;
  if (perfil === 'crescente') {
    if (r(7) < 35 + recente * 50) aprovada = Math.round((20 + recente * 95 + (r(8) % 30)) / 5) * 5;
  } else if (perfil === 'semAprovacao') {
    if (r(7) < 45) semAprovacao = 30 + (r(8) % 5) * 15;
    if (r(9) < 15) aprovada = 30 + (r(10) % 3) * 15;
  } else if (perfil === 'tardeENoite') {
    if (r(7) < 55) aprovada = 150 + (r(8) % 4) * 30;
  } else if (r(7) < 14) {
    aprovada = 30 + (r(8) % 4) * 15;
  }

  const atraso = r(11) < 20 ? r(12) % 12 : 0;
  // Depois de uma noite longa, quem tem o perfil "tardeENoite" volta mais cedo no dia seguinte.
  const antecipa = perfil === 'tardeENoite' && r(13) < 60 ? 90 + (r(14) % 3) * 30 : 0;
  const logon = inicio + atraso - antecipa;
  const logoff = fim + aprovada + semAprovacao;
  const intervalo = perfil === 'intervaloCurto' && r(15) < 55 ? 30 + (r(16) % 3) * 10 : r(15) < 8 ? 45 : 60;
  const tentativas = r(17) < 22 ? 1 + (r(18) % 3) : 0;

  return {
    ...base,
    previstoInicio: hhmm(inicio), previstoFim: hhmm(fim), intervaloPrevistoMin: 60,
    primeiroLogon: hhmm(logon), ultimoLogoff: hhmm(logoff), intervaloRealMin: intervalo,
    extraAprovadaMin: aprovada + antecipa, extraSemAprovacaoMin: semAprovacao,
    tentativasBloqueadas: tentativas, minutosEvitados: tentativas === 0 ? 0 : 20 + (r(19) % 5) * 15,
    pausasPrevistas: 2, pausasFeitas: r(20) < 70 ? 2 : r(20) < 92 ? 1 : 0,
  };
}

/**
 * Dias de uma pessoa, do mais antigo ao mais recente.
 * `deN` e `ateN` são dias relativos a hoje (negativo = passado): `(-30, -1)` são os últimos 30 dias fechados.
 * Só existem dados até ontem (`ateN` máximo de -1): hoje ainda está em andamento.
 */
export function diasDaPessoa(pessoaId: string, deN = -30, ateN = -1): DiaDeJornada[] {
  const i = PESSOAS_DIRETORIO.findIndex((p) => p.id === pessoaId);
  if (i < 0) return [];
  const fim = Math.min(ateN, -1);
  const dias: DiaDeJornada[] = [];
  for (let n = deN; n <= fim; n++) dias.push(gerarDia(pessoaId, i, n));
  return dias;
}

/** Dias de todas as pessoas no intervalo (mesma regra de `diasDaPessoa`). */
export function diasDeTodos(deN = -30, ateN = -1): DiaDeJornada[] {
  return PESSOAS_DIRETORIO.flatMap((p) => diasDaPessoa(p.id, deN, ateN));
}
