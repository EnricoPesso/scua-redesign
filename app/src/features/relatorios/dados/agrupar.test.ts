import { describe, expect, it } from 'vitest';
import { agruparPor, participacao } from './agrupar';

describe('agruparPor', () => {
  it('conta por grupo, maior primeiro', () => {
    const r = agruparPor(['b', 'a', 'b', 'c', 'b', 'a'], (x) => x);
    expect(r).toEqual([{ grupo: 'b', total: 3 }, { grupo: 'a', total: 2 }, { grupo: 'c', total: 1 }]);
  });

  it('desempata em ordem alfabética', () => {
    expect(agruparPor(['Pessoas', 'Ação'], (x) => x).map((g) => g.grupo)).toEqual(['Ação', 'Pessoas']);
  });

  it('lista vazia não gera grupos', () => {
    expect(agruparPor([], (x: string) => x)).toEqual([]);
  });
});

describe('participacao', () => {
  it('arredonda para uma casa', () => {
    expect(participacao(1, 3)).toBe(33.3);
  });
  it('sem total devolve zero', () => {
    expect(participacao(0, 0)).toBe(0);
  });
});
