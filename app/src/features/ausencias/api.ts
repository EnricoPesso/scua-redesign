import { dia } from '../../mock/datas';
import { PESSOAS_DIRETORIO, type PessoaDiretorio } from '../../mock/diretorio';
import { rede } from '../../mock/rede';
import { deMinutos, diaDaSemana, type Ausencia, type Motivo } from './domain/ausencias';

/** Ainda não existe contrato de API: dados em memória, determinísticos e relativos a hoje. Quando a API existir, só este arquivo muda. */

/** Número entre 0 e 1 que depende só das entradas (mesma entrada, mesma ausência). */
function ruido(...n: number[]): number {
  let x = 2166136261;
  for (const v of n) {
    x ^= v;
    x = Math.imul(x, 16777619);
    x ^= x >>> 13;
  }
  return ((x >>> 0) % 10000) / 10000;
}

/** Janelas do expediente onde cabe uma ausência: manhã, almoço e tarde (minutos desde a meia-noite). */
const JANELAS = [
  { de: 560, ate: 690 },
  { de: 720, ate: 810 },
  { de: 870, ate: 1050 },
];
const DIAS_UTEIS_DE_HISTORICO = 30;

function arredondar5(min: number): number {
  return Math.round(min / 5) * 5;
}

function ausenciasDoDia(pessoa: PessoaDiretorio, indice: number, deslocamento: number, data: string): Ausencia[] {
  // Algumas pessoas nunca saem da estação.
  if (indice % 7 === 3) return [];
  const forte = ruido(indice, 99) > 0.7;
  const r = ruido(indice, deslocamento, 1) + (forte ? 0.25 : 0);
  const quantidade = r < 0.25 ? 0 : r < 0.6 ? 1 : r < 0.88 ? 2 : 3;
  const ordem = ruido(indice, deslocamento, 2) < 0.5 ? [1, 0, 2] : [0, 1, 2];
  return ordem
    .slice(0, quantidade)
    .sort()
    .map((j): Ausencia => {
      const sorte = ruido(indice, deslocamento, 10 + j);
      let motivo: Motivo;
      let duracao: number;
      if (j === 1 && sorte < 0.8) {
        motivo = 'Almoço';
        duracao = arredondar5(55 + ruido(indice, deslocamento, 20) * 20);
      } else if (sorte < 0.45) {
        motivo = 'Pausa';
        duracao = arredondar5(10 + ruido(indice, deslocamento, 21) * 15);
      } else if (sorte < 0.75) {
        motivo = 'Sem atividade';
        duracao = arredondar5(10 + ruido(indice, deslocamento, 22) * 35);
      } else {
        motivo = 'Reunião externa';
        duracao = arredondar5(30 + ruido(indice, deslocamento, 23) * 60);
      }
      const { de, ate } = JANELAS[j];
      const folga = Math.max(0, ate - de - duracao);
      const inicio = arredondar5(de + ruido(indice, deslocamento, 30 + j) * folga);
      return { id: `a-${pessoa.id}-${data}-${j}`, pessoaId: pessoa.id, dia: data, inicio: deMinutos(inicio), fim: deMinutos(inicio + duracao), motivo };
    });
}

/** Ausências dos últimos 30 dias úteis de todas as pessoas. */
function gerarAusencias(): Ausencia[] {
  const todas: Ausencia[] = [];
  let uteis = 0;
  for (let n = 0; uteis < DIAS_UTEIS_DE_HISTORICO; n++) {
    const data = dia(-n);
    const s = diaDaSemana(data);
    if (s === 0 || s === 6) continue;
    uteis++;
    PESSOAS_DIRETORIO.forEach((pessoa, i) => todas.push(...ausenciasDoDia(pessoa, i, n, data)));
  }
  return todas;
}

export interface FiltroAusencias {
  de: string;
  ate: string;
  /** Ids das pessoas; vazio = todas. */
  colaboradores: string[];
  /** Id do gestor; vazio = todos. */
  gestor: string;
}

export interface ResultadoAusencias {
  /** Pessoas que entram na consulta (depois dos filtros de colaborador e gestor). */
  pessoas: PessoaDiretorio[];
  ausencias: Ausencia[];
}

export const ausenciasApi = {
  listar(f: FiltroAusencias): Promise<ResultadoAusencias> {
    return rede(() => {
      const pessoas = PESSOAS_DIRETORIO.filter((p) => (f.colaboradores.length === 0 || f.colaboradores.includes(p.id)) && (!f.gestor || p.gestorId === f.gestor));
      const ids = new Set(pessoas.map((p) => p.id));
      const ausencias = gerarAusencias()
        .filter((a) => ids.has(a.pessoaId) && a.dia >= f.de && a.dia <= f.ate)
        .sort((x, y) => x.dia.localeCompare(y.dia) || x.inicio.localeCompare(y.inicio));
      return { pessoas, ausencias };
    });
  },
};
