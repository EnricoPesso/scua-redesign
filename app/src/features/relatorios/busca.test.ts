import { describe, expect, it } from 'vitest';
import { filtrarRelatorios, normalizar } from './busca';
import { RELATORIOS } from './catalogo';

describe('busca de relatórios', () => {
  it('ignora acento e maiúsculas', () => {
    expect(normalizar('  Liberações ')).toBe('liberacoes');
    const titulos = filtrarRelatorios('LIBERACOES').map((r) => r.titulo);
    expect(titulos).toContain('Liberações e bloqueios');
    expect(titulos).toContain('Liberações por área');
  });
  it('busca vazia devolve todos', () => {
    expect(filtrarRelatorios('')).toHaveLength(RELATORIOS.length);
  });
  it('sem acerto devolve lista vazia', () => {
    expect(filtrarRelatorios('xyzxyz')).toEqual([]);
  });
});
