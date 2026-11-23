import { custoDaHoraExtra, emHoras, extraDoDia, descansoEntre, LIMITES, REGRAS } from '../../../lib/conformidade';
import { somarDias } from '../../../mock/datas';
import { emMinutos, type DiaDeJornada } from '../../../mock/jornadaReal';

/**
 * Previsão de jornada: a partir dos últimos dias úteis registrados, projeta os próximos 7 dias de cada pessoa
 * e avisa ANTES de uma regra ser quebrada. São regras puras (sem rede, sem relógio): quem chama informa "hoje".
 * É uma estimativa para priorizar a gestão, não uma garantia.
 */

export type Nivel = 'alto' | 'medio' | 'baixo';
export type TipoRisco = 'extraDiaria' | 'interjornada' | 'limiteMensal' | 'intervalo';

export const ROTULO_NIVEL: Record<Nivel, string> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const PESO_NIVEL: Record<Nivel, number> = { alto: 3, medio: 2, baixo: 1 };
const ORDEM_TIPO: TipoRisco[] = ['extraDiaria', 'limiteMensal', 'interjornada', 'intervalo'];

/** Título e base legal de cada risco. O limite mensal é política do grupo, não lei. */
export const REGRA_DO_RISCO: Record<TipoRisco, { titulo: string; base: string }> = {
  extraDiaria: { titulo: REGRAS.extraDiaria.titulo, base: REGRAS.extraDiaria.base },
  interjornada: { titulo: REGRAS.interjornada.titulo, base: REGRAS.interjornada.base },
  intervalo: { titulo: REGRAS.intervalo.titulo, base: REGRAS.intervalo.base },
  limiteMensal: { titulo: 'Estouro do limite mensal de extensão', base: 'Política do grupo' },
};

export const JANELA_DIAS = 7;
const DIAS_UTEIS_HISTORICO = 15;
const DIAS_RECENTES = 10;
/** Quanto da tendência entra na projeção (ela perde força com a distância). */
const FORCA_DA_TENDENCIA = 0.5;
const MAX_EXTRA_MIN = 300;

export const SEMANA_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export interface Risco {
  tipo: TipoRisco;
  nivel: Nivel;
  /** YYYY-MM-DD. */
  dia: string;
  /** Explicação em texto simples, pronta para mostrar. */
  motivo: string;
  /** Minutos fora da regra, quando faz sentido (0 se não se aplica). */
  minutos: number;
}

export interface DiaPrevisto {
  dia: string;
  diaDaSemana: number;
  /** Dia com jornada (segunda a sexta). */
  util: boolean;
  /** Hora extra provável, em minutos. */
  extraMin: number;
  /** "HH:MM" prováveis; null em dia sem jornada. */
  entrada: string | null;
  saida: string | null;
  riscos: Risco[];
  /** Maior nível entre os riscos do dia; null = sem risco. */
  nivel: Nivel | null;
}

export interface PrevisaoPessoa {
  pessoaId: string;
  dias: DiaPrevisto[];
  riscos: Risco[];
  nivel: Nivel | null;
  /** Soma dos pesos dos riscos: desempata quem tem o mesmo nível. */
  pontuacao: number;
  motivoPrincipal: string;
  /** Hora extra prevista na janela, em minutos. */
  extraSemanaMin: number;
  /** Custo estimado dessa hora extra, em R$. */
  custoSemana: number;
  /** Menos de 5 dias úteis registrados: não dá para projetar. */
  poucosDados: boolean;
}

export interface EntradaPrevisao {
  pessoaId: string;
  /** Dias registrados, do mais antigo ao mais recente, até ontem. Precisa cobrir o mês corrente. */
  dias: DiaDeJornada[];
  /** YYYY-MM-DD. */
  hoje: string;
  /** Limite mensal de extensão do grupo, em horas. '' = sem limite. */
  limiteHoras: number | '';
  grupoNome?: string;
  custoHora: number;
}

const semanaDe = (dia: string): number => new Date(`${dia}T12:00:00`).getDay();
export const ehDiaUtil = (semana: number): boolean => semana >= 1 && semana <= 5;
const dois = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${dois(Math.floor(((min % 1440) + 1440) % 1440 / 60))}:${dois(Math.round(((min % 1440) + 1440) % 60))}`;
const arredondar5 = (m: number) => Math.round(m / 5) * 5;
const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const media = (v: number[]) => (v.length === 0 ? 0 : v.reduce((a, b) => a + b, 0) / v.length);

/** Média em que o dia mais recente pesa mais (cada dia anterior vale 85% do seguinte). */
function mediaPonderada(valores: number[]): number {
  let soma = 0;
  let pesos = 0;
  valores.forEach((v, i) => {
    const peso = 0.85 ** (valores.length - 1 - i);
    soma += v * peso;
    pesos += peso;
  });
  return pesos === 0 ? 0 : soma / pesos;
}

/** Quanto a série sobe (ou cai) por dia, em minutos: inclinação da reta de melhor ajuste. */
function inclinacao(valores: number[]): number {
  const n = valores.length;
  if (n < 2) return 0;
  const mx = (n - 1) / 2;
  const my = media(valores);
  let num = 0;
  let den = 0;
  valores.forEach((y, x) => {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/** Nível pela chance de acontecer (parte dos dias recentes em que aconteceu). */
function nivelDaChance(chance: number): Nivel | null {
  if (chance >= 0.5) return 'alto';
  if (chance >= 0.25) return 'medio';
  if (chance >= 0.1) return 'baixo';
  return null;
}

const maiorNivel = (niveis: (Nivel | null)[]): Nivel | null =>
  niveis.reduce<Nivel | null>((a, n) => (n && (!a || PESO_NIVEL[n] > PESO_NIVEL[a]) ? n : a), null);

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function textoTendencia(tendencia: number): string {
  if (Math.abs(tendencia) < 5) return '';
  return `, ${tendencia > 0 ? 'subindo' : 'caindo'} ${emHoras(Math.round(Math.abs(tendencia)))} por dia`;
}

/** Projeta os próximos 7 dias (a partir de hoje) de uma pessoa e aponta os riscos de cada dia. */
export function preverPessoa(e: EntradaPrevisao): PrevisaoPessoa {
  const usados = e.dias.filter((d) => d.primeiroLogon !== null && d.previstoInicio !== null).slice(-DIAS_UTEIS_HISTORICO);
  const poucosDados = usados.length < 5;
  const recentes = usados.slice(-DIAS_RECENTES);
  const extras = usados.map(extraDoDia);
  const extrasRecentes = recentes.map(extraDoDia);

  const mediaExtra = mediaPonderada(extras);
  const tendencia = limitar(inclinacao(extrasRecentes), -30, 30);
  const media5 = media(extras.slice(-5));
  const ultimo = usados[usados.length - 1];
  const fimBase = ultimo?.previstoFim ? emMinutos(ultimo.previstoFim) : null;
  const entradaProvavel = poucosDados ? null : Math.round(mediaPonderada(usados.map((d) => emMinutos(d.primeiroLogon as string))));

  // Janela de 7 dias corridos: hoje e os 6 seguintes.
  let k = 0;
  const dias: DiaPrevisto[] = Array.from({ length: JANELA_DIAS }, (_, i) => {
    const dia = somarDias(e.hoje, i);
    const diaDaSemana = semanaDe(dia);
    const util = ehDiaUtil(diaDaSemana);
    if (util) k += 1;
    const extraMin = util && !poucosDados ? arredondar5(limitar(mediaExtra + tendencia * FORCA_DA_TENDENCIA * k, 0, MAX_EXTRA_MIN)) : 0;
    const saida = util && fimBase !== null && !poucosDados ? hhmm(fimBase + extraMin) : null;
    const entrada = util && entradaProvavel !== null ? hhmm(entradaProvavel) : null;
    return { dia, diaDaSemana, util, extraMin, entrada, saida, riscos: [], nivel: null };
  });

  const riscos: Risco[] = [];
  const somar = (r: Risco) => {
    riscos.push(r);
    const alvo = dias.find((d) => d.dia === r.dia);
    if (alvo) alvo.riscos.push(r);
  };

  if (!poucosDados) {
    // 1) Mais de 2 h extras no dia: parte dos dias recentes que passaria de 2 h, já somada a tendência.
    const passou = extrasRecentes.filter((x) => x > LIMITES.extraDiariaMin).length;
    let k2 = 0;
    for (const d of dias) {
      if (!d.util) continue;
      k2 += 1;
      const deslocamento = tendencia * FORCA_DA_TENDENCIA * k2;
      const chance = extrasRecentes.filter((x) => x + deslocamento > LIMITES.extraDiariaMin).length / Math.max(1, extrasRecentes.length);
      const nivel = nivelDaChance(chance);
      if (!nivel) continue;
      const parte = passou > 0
        ? ` Passou de 2 h em ${passou} dos últimos ${plural(extrasRecentes.length, 'dia útil', 'dias úteis')}.`
        : ' Ainda não passou de 2 h, mas a tendência é de subida.';
      somar({
        tipo: 'extraDiaria', nivel, dia: d.dia,
        motivo: `Média de ${emHoras(Math.round(media5))} de hora extra nos últimos 5 dias úteis${textoTendencia(tendencia)}.${parte}`,
        minutos: Math.max(0, d.extraMin - LIMITES.extraDiariaMin),
      });
    }

    // 2) Menos de 11 h entre jornadas: pares de dias seguidos, nos últimos dias.
    const descansos: number[] = [];
    for (let i = 1; i < usados.length; i++) {
      const d = descansoEntre(usados[i - 1], usados[i]);
      if (d !== null && d < 24 * 60) descansos.push(d);
    }
    const ultimos = descansos.slice(-DIAS_RECENTES);
    const curtos = ultimos.filter((d) => d < LIMITES.interjornadaMin);
    const nivelInter = nivelDaChance(curtos.length / Math.max(1, ultimos.length));
    if (nivelInter) {
      const falta = LIMITES.interjornadaMin - media(curtos);
      for (const d of dias) {
        // Só vale se a pessoa também trabalha no dia anterior.
        if (!d.util || !ehDiaUtil(semanaDe(somarDias(d.dia, -1)))) continue;
        somar({
          tipo: 'interjornada', nivel: nivelInter, dia: d.dia,
          motivo: `Em ${curtos.length} dos últimos ${plural(ultimos.length, 'dia', 'dias')} o descanso entre jornadas ficou abaixo de 11 h (em média ${emHoras(Math.round(media(curtos)))}).`,
          minutos: Math.round(falta),
        });
      }
    }

    // 3) Intervalo curto habitual.
    const curtosAlmoco = recentes.filter((d) => d.intervaloRealMin < LIMITES.intervaloMinimoMin);
    const nivelIntervalo = nivelDaChance(curtosAlmoco.length / Math.max(1, recentes.length));
    if (nivelIntervalo) {
      const mediaIntervalo = Math.round(media(curtosAlmoco.map((d) => d.intervaloRealMin)));
      for (const d of dias) {
        if (!d.util) continue;
        somar({
          tipo: 'intervalo', nivel: nivelIntervalo, dia: d.dia,
          motivo: `Almoçou em menos de 1 hora em ${curtosAlmoco.length} dos últimos ${plural(recentes.length, 'dia', 'dias')} (em média ${emHoras(mediaIntervalo)}).`,
          minutos: LIMITES.intervaloMinimoMin - mediaIntervalo,
        });
      }
    }

    // 4) Limite mensal do grupo: o que já foi feito no mês somado à projeção.
    if (e.limiteHoras !== '') {
      const limiteMin = e.limiteHoras * 60;
      const mesDeHoje = e.hoje.slice(0, 7);
      const feito = e.dias.filter((d) => d.dia.startsWith(mesDeHoje)).reduce((s, d) => s + extraDoDia(d), 0);
      const grupo = e.grupoNome ? ` do grupo ${e.grupoNome}` : ' do grupo';
      const acumulado = new Map<string, number>([[mesDeHoje, feito]]);
      const jaAvisado = new Set<string>();
      const ultimoUtilDoMes = new Map<string, DiaPrevisto>();
      for (const d of dias) {
        if (!d.util) continue;
        const mes = d.dia.slice(0, 7);
        const antes = acumulado.get(mes) ?? 0;
        const depois = antes + d.extraMin;
        acumulado.set(mes, depois);
        ultimoUtilDoMes.set(mes, d);
        if (depois > limiteMin && !jaAvisado.has(mes)) {
          jaAvisado.add(mes);
          const prevista = dias.filter((x) => x.util && x.dia.startsWith(mes)).reduce((s, x) => s + x.extraMin, 0);
          const limiteTxt = limiteMin === 0 ? 'O grupo não permite extensão sem aprovação especial' : `Limite mensal de ${e.limiteHoras} h${grupo}`;
          somar({
            tipo: 'limiteMensal', nivel: 'alto', dia: d.dia,
            motivo: antes > limiteMin || limiteMin === 0
              ? `${limiteTxt}. Já fez ${emHoras(Math.round(antes))} de hora extra neste mês e a previsão é de mais ${emHoras(prevista)}.`
              : `${limiteTxt}. Já fez ${emHoras(Math.round(antes))} neste mês; com a previsão de ${emHoras(prevista)} nos próximos dias, passa do limite.`,
            minutos: Math.round(depois - limiteMin),
          });
        }
      }
      // Sem estouro previsto, mas perto do limite: avisa no último dia útil do mês na janela.
      if (limiteMin > 0) {
        for (const [mes, d] of ultimoUtilDoMes) {
          if (jaAvisado.has(mes)) continue;
          const total = acumulado.get(mes) ?? 0;
          const uso = total / limiteMin;
          const nivel: Nivel | null = uso >= 0.9 ? 'medio' : uso >= 0.75 ? 'baixo' : null;
          if (!nivel) continue;
          somar({
            tipo: 'limiteMensal', nivel, dia: d.dia,
            motivo: `Chega perto do limite mensal de ${e.limiteHoras} h${grupo}: ${emHoras(Math.round(total))} de hora extra no mês, contando a previsão (${Math.round(uso * 100)}% do limite).`,
            minutos: 0,
          });
        }
      }
    }
  }

  for (const d of dias) d.nivel = maiorNivel(d.riscos.map((r) => r.nivel));
  const nivel = maiorNivel(riscos.map((r) => r.nivel));
  const pontuacao = riscos.reduce((s, r) => s + PESO_NIVEL[r.nivel], 0);
  const principal = [...riscos].sort(
    (a, b) => PESO_NIVEL[b.nivel] - PESO_NIVEL[a.nivel] || ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo) || a.dia.localeCompare(b.dia),
  )[0];
  const extraSemanaMin = dias.reduce((s, d) => s + d.extraMin, 0);
  const custoSemana = dias.reduce((s, d) => s + custoDaHoraExtra(d.extraMin, e.custoHora), 0);

  return {
    pessoaId: e.pessoaId, dias, riscos, nivel, pontuacao,
    motivoPrincipal: principal?.motivo ?? (poucosDados ? 'Ainda há poucos dias registrados para projetar.' : 'Nenhum risco previsto para os próximos 7 dias.'),
    extraSemanaMin, custoSemana, poucosDados,
  };
}

/** Mais arriscado primeiro: nível, depois pontuação, depois hora extra prevista, depois nome. */
export function compararPrevisoes<T extends { nivel: Nivel | null; pontuacao: number; extraSemanaMin: number; nome?: string }>(a: T, b: T): number {
  const peso = (n: Nivel | null) => (n ? PESO_NIVEL[n] : 0);
  return peso(b.nivel) - peso(a.nivel) || b.pontuacao - a.pontuacao || b.extraSemanaMin - a.extraSemanaMin || (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR');
}

export interface FiltroPrevisao { gestor: string; diretoria: string; nivel: '' | Nivel }

/** Só entram na lista as pessoas com algum risco; os filtros vazios não restringem nada. */
export function filtrarPrevisoes<T extends { nivel: Nivel | null; gestorId: string | null; diretoria: string }>(linhas: T[], f: FiltroPrevisao): T[] {
  return linhas.filter((l) => l.nivel !== null
    && (!f.gestor || l.gestorId === f.gestor)
    && (!f.diretoria || l.diretoria === f.diretoria)
    && (!f.nivel || l.nivel === f.nivel));
}

export interface ResumoPrevisao {
  pessoasEmRiscoAlto: number;
  /** Combinações distintas de pessoa e regra em risco na janela. */
  regrasEmRisco: number;
  extraMin: number;
  custo: number;
}

export function resumirPrevisoes(previsoes: PrevisaoPessoa[]): ResumoPrevisao {
  const regras = new Set<string>();
  for (const p of previsoes) for (const r of p.riscos) regras.add(`${p.pessoaId}:${r.tipo}`);
  return {
    pessoasEmRiscoAlto: previsoes.filter((p) => p.nivel === 'alto').length,
    regrasEmRisco: regras.size,
    extraMin: previsoes.reduce((s, p) => s + p.extraSemanaMin, 0),
    custo: previsoes.reduce((s, p) => s + p.custoSemana, 0),
  };
}

/** "seg, 12/10". */
export function rotuloDoDia(dia: string): string {
  return `${SEMANA_CURTA[semanaDe(dia)]}, ${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

// ───────────────────────── Semáforo do pedido de extensão ─────────────────────────

export type CorSemaforo = 'verde' | 'amarelo' | 'vermelho';

export interface AvisoDoSemaforo {
  tipo: TipoRisco;
  cor: 'amarelo' | 'vermelho';
  titulo: string;
  base: string;
  detalhe: string;
}

export interface AvaliacaoExtensao {
  cor: CorSemaforo;
  avisos: AvisoDoSemaforo[];
  /** Custo estimado da extensão inteira, em R$. */
  custo: number;
  totalMin: number;
}

export interface EntradaExtensao {
  /** Dias registrados da pessoa, até ontem. */
  dias: DiaDeJornada[];
  /** Primeiro dia da extensão (YYYY-MM-DD). */
  dia: string;
  /** Minutos de extensão em cada dia. */
  minutosPorDia: number;
  /** Quantos dias o pedido cobre (padrão 1). */
  diasDoPedido?: number;
  limiteHoras: number | '';
  custoHora: number;
}

/** O que a extensão pedida quebraria: mais de 2 h no dia, limite mensal do grupo e menos de 11 h até a próxima jornada. */
export function avaliarExtensao(e: EntradaExtensao): AvaliacaoExtensao {
  const dias = Math.max(1, e.diasDoPedido ?? 1);
  const totalMin = e.minutosPorDia * dias;
  const avisos: AvisoDoSemaforo[] = [];
  const aviso = (tipo: TipoRisco, cor: 'amarelo' | 'vermelho', detalhe: string) => avisos.push({ tipo, cor, ...REGRA_DO_RISCO[tipo], detalhe });
  const semana = semanaDe(e.dia);

  // 1) Mais de 2 h no dia.
  const jaNoDia = e.dias.find((d) => d.dia === e.dia);
  const noDia = (jaNoDia ? extraDoDia(jaNoDia) : 0) + e.minutosPorDia;
  if (noDia > LIMITES.extraDiariaMin) aviso('extraDiaria', 'vermelho', `${emHoras(noDia)} de hora extra no dia: ${emHoras(noDia - LIMITES.extraDiariaMin)} acima do limite de 2 h.`);
  else if (noDia >= LIMITES.extraDiariaMin - 15) aviso('extraDiaria', 'amarelo', `${emHoras(noDia)} de hora extra no dia: ${noDia === LIMITES.extraDiariaMin ? 'no limite de 2 h' : `faltam ${emHoras(LIMITES.extraDiariaMin - noDia)} para o limite de 2 h`}.`);

  // 2) Limite mensal do grupo.
  if (e.limiteHoras !== '') {
    const limiteMin = e.limiteHoras * 60;
    const mes = e.dia.slice(0, 7);
    const feito = e.dias.filter((d) => d.dia.startsWith(mes)).reduce((s, d) => s + extraDoDia(d), 0);
    const total = feito + totalMin;
    if (total > limiteMin) {
      aviso('limiteMensal', 'vermelho', limiteMin === 0
        ? 'O grupo não permite extensão sem aprovação especial.'
        : `Com este pedido o mês chega a ${emHoras(total)}, acima do limite de ${e.limiteHoras} h do grupo.`);
    } else if (limiteMin > 0 && total >= limiteMin * 0.9) {
      aviso('limiteMensal', 'amarelo', `Com este pedido o mês chega a ${emHoras(total)}, perto do limite de ${e.limiteHoras} h do grupo.`);
    }
  }

  // 3) Descanso até a próxima jornada: o fim habitual da jornada mais a extensão, contra o começo habitual do dia seguinte.
  const habitual = [...e.dias].reverse().find((d) => d.previstoInicio && d.previstoFim);
  if (habitual && ehDiaUtil(semana) && ehDiaUtil(semanaDe(somarDias(e.dia, 1)))) {
    const saida = emMinutos(habitual.previstoFim as string) + e.minutosPorDia;
    const descanso = 24 * 60 - saida + emMinutos(habitual.previstoInicio as string);
    const detalhe = `A extensão termina por volta de ${hhmm(saida)} e a próxima jornada começa às ${habitual.previstoInicio}: ${emHoras(descanso)} de descanso.`;
    if (descanso < LIMITES.interjornadaMin) aviso('interjornada', 'vermelho', detalhe);
    else if (descanso < LIMITES.interjornadaMin + 30) aviso('interjornada', 'amarelo', detalhe);
  }

  const cor: CorSemaforo = avisos.some((a) => a.cor === 'vermelho') ? 'vermelho' : avisos.length > 0 ? 'amarelo' : 'verde';
  return { cor, avisos, totalMin, custo: custoDaHoraExtra(totalMin, e.custoHora, undefined, semana === 0) };
}
