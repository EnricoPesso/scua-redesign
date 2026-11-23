import { describe, expect, it } from 'vitest';
import { somarDias } from '../../../mock/datas';
import type { DiaDeJornada } from '../../../mock/jornadaReal';
import {
  avaliarExtensao, compararPrevisoes, filtrarPrevisoes, preverPessoa, resumirPrevisoes, rotuloDoDia,
  type EntradaPrevisao, type PrevisaoPessoa,
} from './previsao';

/** Segunda, 12/10/2026 (o relógio fixo dos testes). */
const HOJE = '2026-10-12';

interface Ajuste { extra?: number; logon?: string; logoff?: string; intervalo?: number }

/** Histórico de 15 dias úteis antes de HOJE; `extraDe(i)` devolve os ajustes do dia i (0 = mais antigo). */
function historico(extraDe: (i: number) => Ajuste, quantos = 15): DiaDeJornada[] {
  const dias: DiaDeJornada[] = [];
  for (let n = -1; dias.length < quantos; n--) {
    const dia = somarDias(HOJE, n);
    const semana = new Date(`${dia}T12:00:00`).getDay();
    if (semana === 0 || semana === 6) continue;
    dias.unshift({ pessoaId: 'u-x', dia, diaDaSemana: semana } as DiaDeJornada);
  }
  return dias.map((d, i) => {
    const a = extraDe(i);
    const extra = a.extra ?? 0;
    return {
      ...d, previstoInicio: '08:00', previstoFim: '17:00', intervaloPrevistoMin: 60,
      primeiroLogon: a.logon ?? '08:00', ultimoLogoff: a.logoff ?? `${String(17 + Math.floor(extra / 60)).padStart(2, '0')}:${String(extra % 60).padStart(2, '0')}`,
      intervaloRealMin: a.intervalo ?? 60, extraAprovadaMin: extra, extraSemAprovacaoMin: 0,
      tentativasBloqueadas: 0, minutosEvitados: 0, pausasPrevistas: 2, pausasFeitas: 2,
    };
  });
}

const prever = (dias: DiaDeJornada[], extra: Partial<EntradaPrevisao> = {}) =>
  preverPessoa({ pessoaId: 'u-x', dias, hoje: HOJE, limiteHoras: '', custoHora: 30, ...extra });

describe('preverPessoa', () => {
  it('projeta 7 dias corridos a partir de hoje, só os úteis com jornada', () => {
    const p = prever(historico(() => ({})));
    expect(p.dias.map((d) => d.dia)).toEqual(Array.from({ length: 7 }, (_, i) => somarDias(HOJE, i)));
    expect(p.dias.map((d) => d.util)).toEqual([true, true, true, true, true, false, false]);
    expect(p.dias[5].extraMin).toBe(0);
    expect(p.dias[5].saida).toBeNull();
    expect(p.dias[0].entrada).toBe('08:00');
  });

  it('quem não faz hora extra não tem risco e a mensagem diz isso', () => {
    const p = prever(historico(() => ({})));
    expect(p.nivel).toBeNull();
    expect(p.riscos).toEqual([]);
    expect(p.extraSemanaMin).toBe(0);
    expect(p.custoSemana).toBe(0);
    expect(p.motivoPrincipal).toMatch(/Nenhum risco previsto/);
  });

  it('hora extra subindo 10 min por dia vira risco alto de passar de 2 h, com o motivo em texto simples', () => {
    const p = prever(historico((i) => ({ extra: 40 + i * 10 })));
    expect(p.nivel).toBe('alto');
    const diario = p.riscos.find((r) => r.tipo === 'extraDiaria' && r.nivel === 'alto')!;
    expect(diario.motivo).toMatch(/Média de .* de hora extra nos últimos 5 dias úteis, subindo 10 min por dia/);
    expect(diario.motivo).toContain('Passou de 2 h em');
    expect(p.extraSemanaMin).toBeGreaterThan(0);
    expect(p.custoSemana).toBeGreaterThan(0);
  });

  it('a tendência de subida faz o risco crescer ao longo da semana', () => {
    const p = prever(historico((i) => ({ extra: 30 + i * 6 })));
    const uteis = p.dias.filter((d) => d.util);
    expect(uteis[4].extraMin).toBeGreaterThan(uteis[0].extraMin);
  });

  it('tendência de queda não acusa quem já chegou a passar de 2 h', () => {
    const p = prever(historico((i) => ({ extra: i < 5 ? 150 : 0 })));
    // As 5 horas extras mais antigas ficam fora da janela recente de 10 dias.
    expect(p.riscos.filter((r) => r.tipo === 'extraDiaria')).toEqual([]);
  });

  it('descanso curto habitual entre jornadas vira risco de interjornada só em dia precedido de dia útil', () => {
    const p = prever(historico((i) => (i % 2 === 0 ? { extra: 180, logoff: '20:00' } : { logon: '06:00' })));
    const inter = p.riscos.filter((r) => r.tipo === 'interjornada');
    expect(inter.length).toBeGreaterThan(0);
    // Segunda (hoje) vem depois de domingo: não entra.
    expect(inter.some((r) => r.dia === HOJE)).toBe(false);
    expect(inter[0].motivo).toMatch(/descanso entre jornadas ficou abaixo de 11 h/);
  });

  it('intervalo curto habitual vira risco de intervalo', () => {
    const p = prever(historico((i) => ({ intervalo: i % 2 === 0 ? 30 : 60 })));
    const r = p.riscos.find((x) => x.tipo === 'intervalo')!;
    expect(r.nivel).toBe('alto');
    expect(r.motivo).toMatch(/Almoçou em menos de 1 hora em \d+ dos últimos 10 dias/);
  });

  it('passar do limite mensal do grupo: soma o já feito no mês com a projeção', () => {
    // Todo dia útil do mês (até ontem) com 1 h de extra: 10 dias de 1 h = 10 h; limite de 10 h.
    const p = prever(historico(() => ({ extra: 60 })), { limiteHoras: 10, grupoNome: 'Comercial' });
    const limite = p.riscos.find((r) => r.tipo === 'limiteMensal')!;
    expect(limite.nivel).toBe('alto');
    expect(limite.motivo).toContain('Limite mensal de 10 h do grupo Comercial');
  });

  it('limite zero (estágio) avisa para qualquer hora extra prevista', () => {
    const p = prever(historico(() => ({ extra: 30 })), { limiteHoras: 0, grupoNome: 'Estágio' });
    expect(p.riscos.find((r) => r.tipo === 'limiteMensal')?.motivo).toContain('não permite extensão sem aprovação especial');
  });

  it('sem limite no grupo não há risco mensal', () => {
    const p = prever(historico(() => ({ extra: 60 })), { limiteHoras: '' });
    expect(p.riscos.some((r) => r.tipo === 'limiteMensal')).toBe(false);
  });

  it('perto do limite (90%) sem estourar é risco médio', () => {
    // Sem extras no mês até ontem e projeção de 1 h por dia útil: 5 h previstas contra limite de 5,5 h.
    const dias = historico(() => ({ extra: 60 })).map((d) => ({ ...d, dia: somarDias(d.dia, -40) }));
    const p = prever(dias, { limiteHoras: 5.5 });
    const limite = p.riscos.find((r) => r.tipo === 'limiteMensal')!;
    expect(limite.nivel).toBe('medio');
  });

  it('poucos dias registrados: não projeta nem acusa', () => {
    const p = prever(historico(() => ({ extra: 200 }), 3));
    expect(p.poucosDados).toBe(true);
    expect(p.riscos).toEqual([]);
    expect(p.motivoPrincipal).toMatch(/poucos dias/);
  });

  it('dias de ausência (sem logon) não entram na média', () => {
    const dias = historico(() => ({ extra: 60 })).map((d, i) => (i % 3 === 0 ? { ...d, primeiroLogon: null, ultimoLogoff: null, extraAprovadaMin: 0 } : d));
    const p = prever(dias);
    expect(p.dias[0].extraMin).toBe(60);
  });

  it('o custo usa a hora extra com adicional e encargos', () => {
    const p = prever(historico(() => ({ extra: 60 })), { custoHora: 40 });
    // 5 dias úteis × 1 h × R$ 40 × 1,5 × 1,35
    expect(p.custoSemana).toBeCloseTo(5 * 40 * 1.5 * 1.35, 5);
  });

  it('o dia mostra o maior nível entre os riscos', () => {
    const p = prever(historico((i) => ({ extra: 40 + i * 8, intervalo: i % 2 === 0 ? 30 : 60 })));
    for (const d of p.dias) {
      if (d.riscos.length === 0) expect(d.nivel).toBeNull();
      else expect(d.riscos.some((r) => r.nivel === d.nivel)).toBe(true);
    }
  });
});

const previsao = (o: Partial<PrevisaoPessoa> & { pessoaId: string }): PrevisaoPessoa => ({
  dias: [], riscos: [], nivel: null, pontuacao: 0, motivoPrincipal: '', extraSemanaMin: 0, custoSemana: 0, poucosDados: false, ...o,
});

describe('ordem, filtros e indicadores', () => {
  it('ordena por nível, depois pontuação, depois hora extra, depois nome', () => {
    const a = { ...previsao({ pessoaId: 'a', nivel: 'medio', pontuacao: 4 }), nome: 'Ana' };
    const b = { ...previsao({ pessoaId: 'b', nivel: 'alto', pontuacao: 3 }), nome: 'Bia' };
    const c = { ...previsao({ pessoaId: 'c', nivel: 'alto', pontuacao: 9 }), nome: 'Caio' };
    const d = { ...previsao({ pessoaId: 'd', nivel: null }), nome: 'Dani' };
    expect([a, b, c, d].sort(compararPrevisoes).map((x) => x.pessoaId)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('filtra por gestor, diretoria e nível e ignora quem não tem risco', () => {
    const l = [
      { pessoaId: '1', nivel: 'alto' as const, gestorId: 'g1', diretoria: 'Comercial' },
      { pessoaId: '2', nivel: 'baixo' as const, gestorId: 'g2', diretoria: 'Financeiro' },
      { pessoaId: '3', nivel: null, gestorId: 'g1', diretoria: 'Comercial' },
    ];
    expect(filtrarPrevisoes(l, { gestor: '', diretoria: '', nivel: '' }).map((x) => x.pessoaId)).toEqual(['1', '2']);
    expect(filtrarPrevisoes(l, { gestor: 'g1', diretoria: '', nivel: '' }).map((x) => x.pessoaId)).toEqual(['1']);
    expect(filtrarPrevisoes(l, { gestor: '', diretoria: 'Financeiro', nivel: '' }).map((x) => x.pessoaId)).toEqual(['2']);
    expect(filtrarPrevisoes(l, { gestor: '', diretoria: '', nivel: 'baixo' }).map((x) => x.pessoaId)).toEqual(['2']);
  });

  it('resume: pessoas em risco alto, regras distintas, horas e custo', () => {
    const risco = (tipo: 'extraDiaria' | 'intervalo', dia: string) => ({ tipo, nivel: 'alto' as const, dia, motivo: '', minutos: 0 });
    const r = resumirPrevisoes([
      previsao({ pessoaId: 'a', nivel: 'alto', riscos: [risco('extraDiaria', '2026-10-12'), risco('extraDiaria', '2026-10-13'), risco('intervalo', '2026-10-13')], extraSemanaMin: 90, custoSemana: 100 }),
      previsao({ pessoaId: 'b', nivel: 'baixo', riscos: [risco('intervalo', '2026-10-14')], extraSemanaMin: 30, custoSemana: 20 }),
    ]);
    expect(r).toEqual({ pessoasEmRiscoAlto: 1, regrasEmRisco: 3, extraMin: 120, custo: 120 });
  });

  it('escreve o dia em português', () => {
    expect(rotuloDoDia('2026-10-12')).toBe('seg, 12/10');
  });
});

describe('avaliarExtensao (semáforo)', () => {
  const dias = historico(() => ({}));
  const base = { dias, dia: '2026-10-14', minutosPorDia: 60, limiteHoras: 10 as number | '', custoHora: 30 };

  it('verde: 1 h num dia, longe do limite e com 15 h de descanso', () => {
    const a = avaliarExtensao(base);
    expect(a.cor).toBe('verde');
    expect(a.avisos).toEqual([]);
    expect(a.custo).toBeCloseTo(1 * 30 * 1.5 * 1.35, 5);
  });

  it('vermelho: mais de 2 h no dia cita a regra e a base legal', () => {
    const a = avaliarExtensao({ ...base, minutosPorDia: 150 });
    expect(a.cor).toBe('vermelho');
    const aviso = a.avisos.find((x) => x.tipo === 'extraDiaria')!;
    expect(aviso.titulo).toBe('Mais de 2 horas extras no dia');
    expect(aviso.base).toBe('CLT art. 59');
    expect(aviso.detalhe).toContain('30 min acima');
  });

  it('amarelo: a 15 min do limite de 2 h', () => {
    const a = avaliarExtensao({ ...base, minutosPorDia: 110 });
    expect(a.cor).toBe('amarelo');
    expect(a.avisos[0].tipo).toBe('extraDiaria');
  });

  it('vermelho: estourar o limite mensal do grupo, somando o que já foi feito e os dias do pedido', () => {
    const feitoNoMes = historico(() => ({ extra: 60 })); // 1 h por dia útil
    const a = avaliarExtensao({ ...base, dias: feitoNoMes, limiteHoras: 8, diasDoPedido: 2 });
    expect(a.cor).toBe('vermelho');
    expect(a.avisos.find((x) => x.tipo === 'limiteMensal')?.base).toBe('Política do grupo');
    expect(a.totalMin).toBe(120);
  });

  it('vermelho: grupo com limite zero não aceita extensão', () => {
    const a = avaliarExtensao({ ...base, limiteHoras: 0 });
    expect(a.avisos.find((x) => x.tipo === 'limiteMensal')?.detalhe).toContain('aprovação especial');
  });

  it('vermelho: menos de 11 h até a próxima jornada (4 h 10 min de extensão terminam às 21h10 e a jornada recomeça às 8h)', () => {
    const a = avaliarExtensao({ ...base, minutosPorDia: 250, limiteHoras: '' });
    expect(a.avisos.map((x) => x.tipo)).toContain('interjornada');
    expect(a.avisos.find((x) => x.tipo === 'interjornada')?.base).toBe('CLT art. 66');
  });

  it('sexta-feira não acusa interjornada (sábado sem jornada) e domingo custa mais', () => {
    const sexta = avaliarExtensao({ ...base, dia: '2026-10-16', minutosPorDia: 100, limiteHoras: '' });
    expect(sexta.avisos.some((x) => x.tipo === 'interjornada')).toBe(false);
    const domingo = avaliarExtensao({ ...base, dia: '2026-10-18', limiteHoras: '' });
    expect(domingo.custo).toBeCloseTo(1 * 30 * 2 * 1.35, 5);
  });
});
