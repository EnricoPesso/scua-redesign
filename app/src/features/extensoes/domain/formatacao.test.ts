import { describe, expect, it } from 'vitest';
import {
  formatarDataHora, formatarHora, formatarPeriodo, hojeLocal, mesDe, nomeCanal, periodoDoMes, rotuloPeriodo, tempoDesde,
} from './formatacao';

const H = { inicio: '18:00', fim: '20:00' };
const HOJE = '2026-10-12';

describe('datas', () => {
  it('hoje vem do relógio local', () => expect(hojeLocal()).toBe('2026-10-12'));
  it('período do mês', () => expect(periodoDoMes('2026-02-10')).toEqual({ de: '2026-02-01', ate: '2026-02-28' }));
  it('mês de uma data', () => expect(mesDe('2026-10-13')).toBe('2026-10'));
});

describe('formatarPeriodo', () => {
  it('um dia', () => expect(formatarPeriodo('2026-10-16', '2026-10-16', H)).toBe('16/10 · 18:00–20:00'));
  it('data final vazia', () => expect(formatarPeriodo('2026-10-16', '', H)).toBe('16/10 · 18:00–20:00'));
  it('vários dias no mesmo mês', () => expect(formatarPeriodo('2026-10-13', '2026-10-15', H)).toBe('13–15/10 · 18:00–20:00'));
  it('atravessa o mês', () => expect(formatarPeriodo('2026-09-30', '2026-10-02', H)).toBe('30/09–02/10 · 18:00–20:00'));
});

describe('horas', () => {
  it('hora', () => expect(formatarHora('2026-10-12T08:31:00')).toBe('08:31'));
  it('data e hora', () => expect(formatarDataHora('2026-10-12T08:31:00')).toBe('12/10 às 08:31'));
  it('há poucos minutos', () => expect(tempoDesde('2026-10-12T09:45:00')).toBe('há 15 min'));
  it('há 1 hora', () => expect(tempoDesde('2026-10-12T08:30:00')).toBe('há 1 hora'));
  it('há várias horas', () => expect(tempoDesde('2026-10-12T06:00:00')).toBe('há 4 horas'));
  it('mais de um dia mostra a data', () => expect(tempoDesde('2026-10-10T09:00:00')).toBe('em 10/10 às 09:00'));
});

describe('rotuloPeriodo', () => {
  it('sem datas', () => expect(rotuloPeriodo('', '', HOJE)).toBe('no total'));
  it('mês atual inteiro', () => expect(rotuloPeriodo('2026-10-01', '2026-10-31', HOJE)).toBe('no mês'));
  it('outro mês inteiro', () => expect(rotuloPeriodo('2026-09-01', '2026-09-30', HOJE)).toBe('em setembro/2026'));
  it('intervalo', () => expect(rotuloPeriodo('2026-10-01', '2026-10-15', HOJE)).toBe('de 01/10 a 15/10'));
  it('um dia', () => expect(rotuloPeriodo('2026-10-05', '2026-10-05', HOJE)).toBe('em 05/10'));
  it('só início', () => expect(rotuloPeriodo('2026-10-01', '', HOJE)).toBe('a partir de 01/10'));
  it('só fim', () => expect(rotuloPeriodo('', '2026-10-15', HOJE)).toBe('até 15/10'));
});

it('nome do canal', () => {
  expect(nomeCanal('whatsapp')).toBe('WhatsApp');
  expect(nomeCanal('teams')).toBe('Teams');
  expect(nomeCanal('painel')).toBe('painel');
});
