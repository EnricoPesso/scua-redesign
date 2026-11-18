import { afterEach, describe, expect, it, vi } from 'vitest';
import { CODIGOS_DE_ACESSO, EVENTOS, TEXTO_EVENTO_DESCONHECIDO, rotuloEvento, statusEvento } from './eventos';

afterEach(() => vi.restoreAllMocks());

describe('dicionário de eventos', () => {
  it('traduz o código para texto', () => {
    expect(rotuloEvento('EVT_LOGON_ALLOWED')).toBe('Logon permitido');
    expect(statusEvento('EVT_LOGON_DENIED')).toBe('danger');
  });

  it('nenhum rótulo expõe código técnico', () => {
    for (const { rotulo } of Object.values(EVENTOS)) expect(rotulo).not.toMatch(/EVT_|_/);
  });

  it('todo evento de acesso existe no dicionário', () => {
    for (const c of CODIGOS_DE_ACESSO) expect(EVENTOS[c]).toBeDefined();
  });

  it('código desconhecido vira texto genérico e o código vai para o console', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(rotuloEvento('EVT_NOVO')).toBe(TEXTO_EVENTO_DESCONHECIDO);
    expect(erro).toHaveBeenCalledWith(expect.stringContaining('EVT_NOVO'));
  });
});
