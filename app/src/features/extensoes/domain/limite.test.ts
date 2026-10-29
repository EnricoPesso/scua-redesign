import { describe, expect, it } from 'vitest';
import { avaliarLimite } from './limite';

describe('avaliarLimite', () => {
  it('até 80% é ok', () => expect(avaliarLimite(240, 240, 600)).toMatchObject({ faixa: 'ok', totalMin: 480, percentual: 80 }));
  it('acima de 80% até 100% é atenção', () => expect(avaliarLimite(360, 240, 600).faixa).toBe('atencao'));
  it('exatamente 100% ainda é atenção', () => expect(avaliarLimite(300, 300, 600)).toMatchObject({ faixa: 'atencao', excessoMin: 0 }));
  it('acima de 100% é excedido com o excesso', () =>
    expect(avaliarLimite(360, 360, 600)).toEqual({ faixa: 'excedido', totalMin: 720, excessoMin: 120, percentual: 120 }));
  it('sem limite (null)', () =>
    expect(avaliarLimite(360, 120, null)).toEqual({ faixa: 'sem-limite', totalMin: 480, excessoMin: 0, percentual: null }));
  it('limite 0 com pedido é excedido, sem dividir por zero', () =>
    expect(avaliarLimite(0, 60, 0)).toEqual({ faixa: 'excedido', totalMin: 60, excessoMin: 60, percentual: 100 }));
  it('limite 0 sem nada pedido é ok', () => expect(avaliarLimite(0, 0, 0)).toMatchObject({ faixa: 'ok', percentual: 0 }));
});
