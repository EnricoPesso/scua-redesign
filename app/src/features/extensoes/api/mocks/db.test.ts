import { describe, expect, it, vi } from 'vitest';
import { criarPedidoDb, entrarComo } from './db';

describe('mock de extensões: datas', () => {
  it('a data de criação é gravada no horário local, para um pedido feito à noite não cair no dia seguinte', () => {
    vi.setSystemTime(new Date('2026-10-12T22:30:00'));
    try {
      entrarComo('ana');
      const novo = criarPedidoDb({ beneficiarioId: 'u-ana', dataInicial: '2026-10-28', dataFinal: '2026-10-28', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '5', detalhes: '' });
      expect(typeof novo).toBe('object');
      if (typeof novo !== 'object') return;
      expect(novo.criadoEm).toBe('2026-10-12T22:30:00');
    } finally {
      vi.setSystemTime(new Date('2026-10-12T10:00:00'));
    }
  });
});
