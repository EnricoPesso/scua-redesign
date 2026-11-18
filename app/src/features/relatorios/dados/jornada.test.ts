import { describe, expect, it } from 'vitest';
import { diasProdutivos, eficiencia, resumirPorPessoa } from './jornada';

describe('eficiencia', () => {
  it('é a parte produtiva do tempo conectado', () => {
    expect(eficiencia(420, 60)).toBe(87.5);
  });
  it('sem tempo devolve zero', () => {
    expect(eficiencia(0, 0)).toBe(0);
  });
});

describe('resumirPorPessoa', () => {
  it('soma os dias e calcula as médias diárias', () => {
    const dias = diasProdutivos();
    const resumo = resumirPorPessoa(dias);
    const uma = resumo[0];
    const dela = dias.filter((d) => d.pessoaId === uma.pessoaId);
    expect(uma.dias).toBe(dela.length);
    expect(uma.produtivoMin).toBe(dela.reduce((s, d) => s + d.produtivoMin, 0));
    expect(uma.mediaProdutivaMin).toBe(Math.round(uma.produtivoMin / uma.dias));
    expect(resumo.reduce((s, r) => s + r.dias, 0)).toBe(dias.length);
  });
});
