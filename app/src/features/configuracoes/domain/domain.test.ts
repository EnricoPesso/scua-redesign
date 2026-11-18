import { describe, expect, it } from 'vitest';
import { dataComDiaDaSemana, feriadosNacionaisDoAno } from './feriados';
import { validarDominio, validarIpv4 } from './rede';
import { resumoRecorrencia } from './recorrencia';
import { validarVariaveis, variaveisDoTexto } from './templates';

describe('validarIpv4', () => {
  it.each(['10.20.0.0', '192.168.1.1', '0.0.0.0', '255.255.255.255', ' 172.16.10.0 '])('aceita %s', (ip) => {
    expect(validarIpv4(ip)).toBeUndefined();
  });
  it.each(['', '10.20.0', '10.20.0.0.1', '256.1.1.1', '10.20.0.300', 'a.b.c.d', '10.020.0.0', '10..0.0', '10.20.0.-1'])('recusa "%s"', (ip) => {
    expect(validarIpv4(ip)).toEqual(expect.any(String));
  });
});

describe('validarDominio', () => {
  it.each(['scua.local', 'homolog.scua.local', 'empresa-x.com.br'])('aceita %s', (d) => {
    expect(validarDominio(d)).toBeUndefined();
  });
  it.each(['scua', 'scua local.com', '-scua.local', 'scua..local', 'scua.local.', 'sc_ua.local'])('recusa "%s"', (d) => {
    expect(validarDominio(d)).toEqual(expect.any(String));
  });
});

describe('resumoRecorrencia', () => {
  it('escreve "N vezes em H h"', () => {
    expect(resumoRecorrencia({ minimo: 5, janelaHoras: 2 })).toBe('5 vezes em 2 h');
    expect(resumoRecorrencia({ minimo: 3, janelaHoras: 24 })).toBe('3 vezes em 24 h');
  });
});

describe('feriadosNacionaisDoAno', () => {
  it('traz os 10 feriados em ordem de data', () => {
    const f = feriadosNacionaisDoAno(2026);
    expect(f).toHaveLength(10);
    expect(f.map((x) => x.data)).toEqual(f.map((x) => x.data).sort());
    expect(f[0]).toEqual({ data: '2026-01-01', nome: 'Confraternização Universal' });
    expect(f.at(-1)).toEqual({ data: '2026-12-25', nome: 'Natal' });
  });
  it('calcula a Sexta-feira Santa a partir da Páscoa', () => {
    expect(feriadosNacionaisDoAno(2026).find((x) => x.nome === 'Sexta-feira Santa')?.data).toBe('2026-04-03');
    expect(feriadosNacionaisDoAno(2027).find((x) => x.nome === 'Sexta-feira Santa')?.data).toBe('2027-03-26');
  });
});

describe('dataComDiaDaSemana', () => {
  it('mostra dd/mm/aaaa e o dia da semana', () => {
    expect(dataComDiaDaSemana('2026-10-12')).toBe('12/10/2026 (segunda-feira)');
  });
  it('data vazia vira travessão', () => {
    expect(dataComDiaDaSemana('')).toBe('—');
  });
});

describe('variáveis de template', () => {
  it('lista as variáveis sem repetir', () => {
    expect(variaveisDoTexto('Olá {{1}}, {{2}} e {{1}}')).toEqual([1, 2]);
  });
  it('exige sequência a partir de 1', () => {
    expect(validarVariaveis('Olá {{1}} e {{2}}')).toBeUndefined();
    expect(validarVariaveis('Sem variáveis')).toBeUndefined();
    expect(validarVariaveis('Olá {{2}}')).toEqual(expect.any(String));
    expect(validarVariaveis('Olá {{1}} e {{3}}')).toEqual(expect.any(String));
  });
});
