import { describe, expect, it } from 'vitest';
import { diasUteisEntre } from './ausencias';

describe('diasUteisEntre: datas absurdas vindas da URL', () => {
  it('período gigante (ano digitado pela metade, link errado) não percorre séculos dia a dia', () => {
    const inicio = performance.now();
    expect(diasUteisEntre('0002-10-06', '2026-10-12')).toEqual([]);
    expect(diasUteisEntre('2026-10-06', '9999-12-31')).toEqual([]);
    expect(diasUteisEntre('abc', '2026-10-12')).toEqual([]);
    expect(performance.now() - inicio).toBeLessThan(200);
    expect(diasUteisEntre('2026-10-09', '2026-10-13')).toEqual(['2026-10-09', '2026-10-12', '2026-10-13']);
  });
});
