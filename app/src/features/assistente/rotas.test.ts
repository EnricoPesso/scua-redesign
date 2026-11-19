import { describe, expect, it } from 'vitest';
import { caminhoInterno, rotaEntre } from './rotas';

describe('caminhoInterno', () => {
  it('aceita caminho interno simples, com ou sem filtros', () => {
    expect(caminhoInterno('/ausencias')).toBe('/ausencias');
    expect(caminhoInterno('/ausencias?de=2026-10-11&ate=2026-10-11')).toBe('/ausencias');
    expect(caminhoInterno('/relatorios/tempo-de-bloqueio')).toBe('/relatorios/tempo-de-bloqueio');
  });

  it.each([
    'https://exemplo.com/x',
    'http://exemplo.com',
    '//exemplo.com',
    '/\\exemplo.com',
    '\\\\exemplo.com',
    'javascript:alert(1)',
    'data:text/html,x',
    'ausencias',
    '',
    '/ausencias/../auditoria',
    '/ausencias/./x',
    '/a\tb',
    '/a\nb',
    `/${'a'.repeat(600)}`,
  ])('recusa %j', (rota) => {
    expect(caminhoInterno(rota)).toBeNull();
  });

  it('recusa o que não é texto', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(caminhoInterno(42 as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(caminhoInterno(null as any)).toBeNull();
  });
});

describe('rotaEntre', () => {
  const permitidos = ['/ausencias', '/pausas?novo=1'];
  it('só passa caminho que está na lista', () => {
    expect(rotaEntre('/ausencias?de=2026-10-11', permitidos)).toBe(true);
    expect(rotaEntre('/pausas?novo=1', permitidos)).toBe(true);
    expect(rotaEntre('/auditoria', permitidos)).toBe(false);
    expect(rotaEntre('/ausencias/extra', permitidos)).toBe(false);
    expect(rotaEntre('//exemplo.com/ausencias', permitidos)).toBe(false);
  });
});
