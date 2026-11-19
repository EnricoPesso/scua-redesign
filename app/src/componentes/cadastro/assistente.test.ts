import { describe, expect, it } from 'vitest';
import { abaDaAuditoria } from './assistente';

describe('abaDaAuditoria', () => {
  it('liga cada cadastro à aba da Auditoria que mostra as alterações dele', () => {
    expect(abaDaAuditoria('parametros')).toBe('parametros');
    expect(abaDaAuditoria('liberacoes')).toBe('liberacoes');
    expect(abaDaAuditoria('templates-whatsapp')).toBe('whatsapp');
  });

  it('cadastro sem aba na Auditoria não registra', () => {
    expect(abaDaAuditoria('pausas')).toBeNull();
    expect(abaDaAuditoria('grupos')).toBeNull();
    // Nome de propriedade herdada não vira aba.
    expect(abaDaAuditoria('constructor')).toBeNull();
  });
});
