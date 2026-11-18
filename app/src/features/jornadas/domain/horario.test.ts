import { describe, expect, it } from 'vitest';
import { cargaDoDia, cargaSemanal, copiarSegundaParaDiasUteis, formatarCarga, paraMinutos, resumirHorario } from './horario';
import { DIAS, type HorarioDia, type Semana } from './tipos';

const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
const dia = (entrada: string, saida: string, ini = '', fim = ''): HorarioDia => ({ trabalha: true, entrada, saida, intervaloInicio: ini, intervaloFim: fim });
const semana = (dias: Partial<Semana>): Semana => Object.fromEntries(DIAS.map((d) => [d, dias[d] ?? folga])) as Semana;
const uteis = (h: HorarioDia): Partial<Semana> => ({ seg: h, ter: h, qua: h, qui: h, sex: h });

describe('paraMinutos', () => {
  it('converte HH:MM e rejeita o que não é hora', () => {
    expect(paraMinutos('08:30')).toBe(510);
    expect(paraMinutos('00:00')).toBe(0);
    expect(paraMinutos('')).toBeNull();
    expect(paraMinutos('25:00')).toBeNull();
    expect(paraMinutos('08:75')).toBeNull();
  });
});

describe('carga', () => {
  it('desconta o intervalo', () => {
    expect(cargaDoDia(dia('08:00', '17:00', '12:00', '13:00'))).toBe(480);
  });
  it('sem intervalo, conta o expediente todo', () => {
    expect(cargaDoDia(dia('08:00', '14:00'))).toBe(360);
  });
  it('dia de folga ou horário invertido vale zero', () => {
    expect(cargaDoDia(folga)).toBe(0);
    expect(cargaDoDia(dia('17:00', '08:00'))).toBe(0);
  });
  it('soma a semana e formata', () => {
    expect(cargaSemanal(semana(uteis(dia('08:00', '17:00', '12:00', '13:00'))))).toBe('40h');
    expect(cargaSemanal(semana(uteis(dia('06:00', '14:00', '09:30', '10:00'))))).toBe('37h30');
    expect(cargaSemanal(semana({}))).toBe('0h');
  });
  it('formatarCarga completa os minutos com zero', () => {
    expect(formatarCarga(2405)).toBe('40h05');
    expect(formatarCarga(59)).toBe('0h59');
  });
});

describe('resumirHorario', () => {
  it('agrupa dias seguidos com o mesmo horário', () => {
    expect(resumirHorario(semana(uteis(dia('08:00', '17:00', '12:00', '13:00'))))).toBe('Seg a sex, 08:00–17:00');
  });
  it('separa horários diferentes com ponto e vírgula', () => {
    const s = semana({ ...uteis(dia('08:00', '17:00')), sab: dia('08:00', '12:00') });
    expect(resumirHorario(s)).toBe('Seg a sex, 08:00–17:00; Sáb, 08:00–12:00');
  });
  it('dois dias viram "e" e dias soltos são listados', () => {
    expect(resumirHorario(semana({ sab: dia('08:00', '20:00'), dom: dia('08:00', '20:00') }))).toBe('Sáb e dom, 08:00–20:00');
    expect(resumirHorario(semana({ seg: dia('09:00', '18:00'), qua: dia('09:00', '18:00'), sex: dia('09:00', '18:00') }))).toBe('Seg, qua e sex, 09:00–18:00');
  });
  it('trechos de três ou mais dias seguidos viram "a"', () => {
    expect(resumirHorario(semana({ seg: dia('09:00', '18:00'), ter: dia('09:00', '18:00'), qua: dia('09:00', '18:00'), sex: dia('09:00', '18:00') }))).toBe('Seg a qua e sex, 09:00–18:00');
  });
  it('sem dia de trabalho avisa', () => {
    expect(resumirHorario(semana({}))).toBe('Sem dias de trabalho');
  });
});

describe('copiarSegundaParaDiasUteis', () => {
  it('copia a segunda para terça a sexta e preserva sábado e domingo', () => {
    const origem = semana({ seg: dia('07:00', '16:00'), sab: dia('08:00', '12:00') });
    const copia = copiarSegundaParaDiasUteis(origem);
    for (const d of ['ter', 'qua', 'qui', 'sex'] as const) expect(copia[d]).toEqual(origem.seg);
    expect(copia.sab).toEqual(origem.sab);
    expect(copia.dom.trabalha).toBe(false);
    expect(origem.ter.trabalha).toBe(false);
  });
});
