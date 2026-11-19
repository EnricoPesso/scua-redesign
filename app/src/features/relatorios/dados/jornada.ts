/** Dados de exemplo da jornada: controle, batidas de ponto e produtividade. */
import { dia } from '../../../mock/datas';
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { sessoes } from './acesso';
import { ehDiaUtil, identidade, instante, ruido, type Identidade } from './base';

const JORNADAS = [
  'Segunda a sexta, 08:00 às 17:00',
  'Segunda a sexta, 09:00 às 18:00',
  'Segunda a sexta, 08:00 às 18:00',
  'Segunda a sexta, 07:30 às 16:30',
];

export interface Controle extends Identidade {
  id: string;
  jornada: string;
  liberada: boolean;
  controlado: boolean;
  /** Código técnico do último evento de controle. */
  ultimoEvento: string;
  ultimoEventoEm: string;
}

/** Quem não é controlado teve o último evento de controle há mais de 30 dias. */
export function controles(): Controle[] {
  return PESSOAS_DIRETORIO.map((p, i) => {
    const controlado = i % 8 !== 7;
    const dias = controlado ? (i * 3) % 18 : 31 + i * 2;
    return {
      ...identidade(p),
      id: p.id,
      jornada: JORNADAS[i % JORNADAS.length],
      liberada: i % 6 === 5,
      controlado,
      ultimoEvento: !controlado ? 'EVT_CONTROL_ENDED' : i % 3 === 0 ? 'EVT_CONTROL_RENEWED' : 'EVT_CONTROL_STARTED',
      ultimoEventoEm: instante(-dias, 8 * 60 + ((i * 13) % 60)),
    };
  });
}

export interface Batida extends Identidade {
  id: string;
  quando: string;
  tipo: 'Entrada' | 'Saída';
  considerada: boolean;
  /** Batida anterior da mesma pessoa (null na primeira do período de exemplo). */
  anterior: string | null;
  justificativa: string;
}

const JUSTIFICATIVAS_DE_BATIDA = ['Batida duplicada', 'Falha no relógio de ponto', 'Esquecimento de saída'];

export function batidas(): Batida[] {
  const out: Batida[] = [];
  PESSOAS_DIRETORIO.forEach((p, i) => {
    let anterior: string | null = null;
    for (let n = -29; n <= 0; n++) {
      if (!ehDiaUtil(n) || ruido(30, i, n) < 0.1) continue;
      const pares: Array<{ tipo: Batida['tipo']; minutos: number }> = [
        { tipo: 'Entrada', minutos: 7 * 60 + 30 + Math.floor(ruido(31, i, n) * 100) },
        { tipo: 'Saída', minutos: 17 * 60 + Math.floor(ruido(32, i, n) * 120) },
      ];
      for (const [k, par] of pares.entries()) {
        const considerada = ruido(33, i, n, k) >= 0.08;
        const quando = instante(n, par.minutos);
        out.push({
          ...identidade(p),
          id: `${p.id}-${n}-${k}`,
          quando,
          tipo: par.tipo,
          considerada,
          anterior,
          justificativa: considerada ? '' : JUSTIFICATIVAS_DE_BATIDA[Math.floor(ruido(34, i, n, k) * JUSTIFICATIVAS_DE_BATIDA.length)],
        });
        anterior = quando;
      }
    }
  });
  return out.sort((a, b) => b.quando.localeCompare(a.quando));
}

export interface DiaProdutivo extends Identidade {
  id: string;
  /** YYYY-MM-DD. */
  dia: string;
  produtivoMin: number;
  ociosoMin: number;
  /** % do tempo conectado que foi produtivo. */
  eficiencia: number;
}

/** Percentual produtivo do tempo conectado, com uma casa (0 sem tempo). */
export function eficiencia(produtivoMin: number, ociosoMin: number): number {
  const total = produtivoMin + ociosoMin;
  return total === 0 ? 0 : Math.round((produtivoMin / total) * 1000) / 10;
}

/** Cada sessão encerrada vira um dia de trabalho: parte do tempo conectado foi ociosa. */
export function diasProdutivos(): DiaProdutivo[] {
  const indice = new Map(PESSOAS_DIRETORIO.map((p, i) => [p.id, i]));
  return sessoes()
    .filter((s) => s.minutos !== null)
    .map((s) => {
      const i = indice.get(s.pessoaId)!;
      const total = s.minutos!;
      const ociosoMin = Math.round(total * (0.08 + ruido(40, i, s.dia.length + Number(s.dia.slice(8, 10))) * 0.22));
      const produtivoMin = total - ociosoMin;
      return { ...s, id: `${s.id}-p`, dia: s.dia, produtivoMin, ociosoMin, eficiencia: eficiencia(produtivoMin, ociosoMin) };
    });
}

export interface ResumoProdutivo extends Identidade {
  id: string;
  dias: number;
  produtivoMin: number;
  ociosoMin: number;
  mediaProdutivaMin: number;
  mediaOciosaMin: number;
  eficiencia: number;
}

/** Soma os dias de cada pessoa e calcula as médias diárias. */
export function resumirPorPessoa(dias: DiaProdutivo[]): ResumoProdutivo[] {
  const porPessoa = new Map<string, DiaProdutivo[]>();
  for (const d of dias) porPessoa.set(d.pessoaId, [...(porPessoa.get(d.pessoaId) ?? []), d]);
  return [...porPessoa.values()]
    .map((lista) => {
      const produtivoMin = lista.reduce((s, d) => s + d.produtivoMin, 0);
      const ociosoMin = lista.reduce((s, d) => s + d.ociosoMin, 0);
      const { id: _id, dia: _dia, produtivoMin: _p, ociosoMin: _o, eficiencia: _e, ...pessoa } = lista[0];
      return {
        ...pessoa,
        id: lista[0].pessoaId,
        dias: lista.length,
        produtivoMin,
        ociosoMin,
        mediaProdutivaMin: Math.round(produtivoMin / lista.length),
        mediaOciosaMin: Math.round(ociosoMin / lista.length),
        eficiencia: eficiencia(produtivoMin, ociosoMin),
      };
    })
    .sort((a, b) => a.colaborador.localeCompare(b.colaborador, 'pt-BR'));
}

/** Hoje, como YYYY-MM-DD (para calcular "dias desde"). */
export const hojeIso = (): string => dia(0);
