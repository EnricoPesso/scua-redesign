import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';

describe('relatório: filtros na URL', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('o link reabre o relatório já filtrado', async () => {
    renderApp('/relatorios/tempo-de-bloqueio?inicio=2020-01-01&fim=2020-01-31');
    expect(await screen.findByLabelText('Data inicial', {}, { timeout: 20_000 })).toHaveValue('2020-01-01');
    expect(screen.getByLabelText('Data final')).toHaveValue('2020-01-31');
    // Nada em janeiro de 2020: o estado vazio oferece limpar os filtros.
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Limpar filtros' })).toHaveLength(2));
  });

  it('filtrar grava os filtros na URL, e "Limpar filtros" tira', async () => {
    const { user } = renderApp('/relatorios/tempo-de-bloqueio');
    const inicio = await screen.findByLabelText('Data inicial', {}, { timeout: 20_000 });
    fireEvent.change(inicio, { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() => expect(screen.getByTestId('local-atual').textContent).toContain('inicio=2026-10-01'));
    await user.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]);
    await waitFor(() => expect(screen.getByTestId('local-atual').textContent).toBe('/relatorios/tempo-de-bloqueio'));
  });
});
