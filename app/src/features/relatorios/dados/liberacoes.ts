/**
 * Base única de bloqueios e liberações. "Liberações e bloqueios", "Liberações por área",
 * "Liberações por gestor" e "Tempo de bloqueio" saem todos daqui, então as somas sempre batem.
 */
import { lerLista, type ValoresFiltro } from '@/lib/relatorio';
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { agruparPor, participacao, type Grupo } from './agrupar';
import { ehDiaUtil, identidade, instante, noPeriodo, porPessoa, ruido, type Identidade } from './base';
import { minutosEntre } from './formatacao';

export const MOTIVOS_BLOQUEIO = ['Fora da jornada', 'Inatividade'] as const;
export const MOTIVOS_LIBERACAO = ['Extensão aprovada', 'Pedido do gestor', 'Feriado trabalhado'] as const;
export const MOTIVOS = [...MOTIVOS_BLOQUEIO, ...MOTIVOS_LIBERACAO];

const MENSAGEM_DO_BLOQUEIO: Record<string, string> = {
  'Fora da jornada': 'Sua jornada de hoje terminou. Fale com seu gestor para continuar.',
  Inatividade: 'A estação foi bloqueada por falta de uso. Informe sua senha para voltar.',
};
const EVENTO_DO_BLOQUEIO: Record<string, string> = {
  'Fora da jornada': 'EVT_BLOCK_OUT_OF_JOURNEY',
  Inatividade: 'EVT_BLOCK_INACTIVITY',
};

/** Um bloqueio e, quando houve, a liberação que o encerrou. */
export interface Ocorrencia extends Identidade {
  id: string;
  /** Código técnico do bloqueio (traduzido pelo dicionário de eventos). */
  evento: string;
  bloqueioEm: string;
  liberacaoEm: string | null;
  motivoBloqueio: string;
  motivoLiberacao: string | null;
  mensagem: string;
  /** Minutos bloqueado; null quando ainda não houve liberação. */
  minutos: number | null;
}

export function ocorrencias(): Ocorrencia[] {
  const out: Ocorrencia[] = [];
  PESSOAS_DIRETORIO.forEach((p, i) => {
    for (let n = 0; n > -30; n--) {
      if (!ehDiaUtil(n) || ruido(10, i, n) >= 0.14) continue;
      const inicio = 17 * 60 + 30 + Math.floor(ruido(11, i, n) * 210);
      const duracao = 10 + Math.floor(ruido(12, i, n) * 170);
      const motivoBloqueio = ruido(13, i, n) < 0.7 ? MOTIVOS_BLOQUEIO[0] : MOTIVOS_BLOQUEIO[1];
      const liberada = ruido(14, i, n) >= 0.12;
      const bloqueioEm = instante(n, inicio);
      const liberacaoEm = liberada ? instante(n, Math.min(inicio + duracao, 1439)) : null;
      out.push({
        ...identidade(p),
        id: `${p.id}-${n}`,
        evento: EVENTO_DO_BLOQUEIO[motivoBloqueio],
        bloqueioEm,
        liberacaoEm,
        motivoBloqueio,
        motivoLiberacao: liberada ? MOTIVOS_LIBERACAO[Math.floor(ruido(15, i, n) * MOTIVOS_LIBERACAO.length)] : null,
        mensagem: MENSAGEM_DO_BLOQUEIO[motivoBloqueio],
        minutos: liberacaoEm ? minutosEntre(bloqueioEm, liberacaoEm) : null,
      });
    }
  });
  return out.sort((a, b) => b.bloqueioEm.localeCompare(a.bloqueioEm));
}

export type TipoEventoLiberacao = 'Bloqueio' | 'Liberação';

export interface EventoLiberacao extends Identidade {
  id: string;
  quando: string;
  tipo: TipoEventoLiberacao;
  motivo: string;
}

/** Cada ocorrência vira um evento de bloqueio e, se foi liberada, um de liberação. */
export function eventosLiberacao(): EventoLiberacao[] {
  return ocorrencias()
    .flatMap((o): EventoLiberacao[] => {
      const { evento: _evento, bloqueioEm, liberacaoEm, motivoBloqueio, motivoLiberacao, mensagem: _m, minutos: _min, ...pessoa } = o;
      const eventos: EventoLiberacao[] = [{ ...pessoa, id: `${o.id}-b`, quando: bloqueioEm, tipo: 'Bloqueio', motivo: motivoBloqueio }];
      if (liberacaoEm && motivoLiberacao) eventos.push({ ...pessoa, id: `${o.id}-l`, quando: liberacaoEm, tipo: 'Liberação', motivo: motivoLiberacao });
      return eventos;
    })
    .sort((a, b) => b.quando.localeCompare(a.quando));
}

/** As liberações no período, de quem os filtros de colaborador, gestor e área deixarem. */
export function liberacoesDoPeriodo(f: ValoresFiltro): EventoLiberacao[] {
  const areas = lerLista(f, 'areas');
  return porPessoa(eventosLiberacao(), f).filter((e) => e.tipo === 'Liberação' && noPeriodo(e.quando, f) && (!areas.length || areas.includes(e.area)));
}

export interface LinhaAgrupada extends Grupo { participacao: number }

function comParticipacao(grupos: Grupo[]): LinhaAgrupada[] {
  const soma = grupos.reduce((s, g) => s + g.total, 0);
  return grupos.map((g) => ({ ...g, participacao: participacao(g.total, soma) }));
}

export const liberacoesPorArea = (f: ValoresFiltro): LinhaAgrupada[] => comParticipacao(agruparPor(liberacoesDoPeriodo(f), (e) => e.area));
export const liberacoesPorGestor = (f: ValoresFiltro): LinhaAgrupada[] => comParticipacao(agruparPor(liberacoesDoPeriodo(f), (e) => e.gestor));
