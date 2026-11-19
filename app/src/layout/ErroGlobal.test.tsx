import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErroGlobal } from './ErroGlobal';

let quebrar: Error | null = null;
function Tela() {
  if (quebrar) throw quebrar;
  return <p>Tela ok</p>;
}
const montar = (chave = '/a') => render(<MemoryRouter><ErroGlobal chave={chave}><Tela /></ErroGlobal></MemoryRouter>);

describe('erro global', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    quebrar = null;
  });

  it('tela que quebra mostra texto amigável, sem o erro técnico, e "Tentar de novo" recupera', async () => {
    quebrar = new TypeError("Cannot read properties of undefined (reading 'x')");
    montar();
    expect(screen.getByRole('alert')).toHaveTextContent('Esta tela teve um problema');
    expect(document.body.textContent).not.toMatch(/TypeError|undefined|Cannot read/);
    quebrar = null;
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(screen.getByText('Tela ok')).toBeInTheDocument();
  });

  it('trocar de tela limpa o erro', () => {
    quebrar = new Error('x');
    const { rerender } = montar('/a');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    quebrar = null;
    rerender(<MemoryRouter><ErroGlobal chave="/b"><Tela /></ErroGlobal></MemoryRouter>);
    expect(screen.getByText('Tela ok')).toBeInTheDocument();
  });

  it('falha ao baixar o código da tela (versão nova publicada) oferece recarregar a página', () => {
    quebrar = new TypeError('Failed to fetch dynamically imported module: http://x/assets/routes-abc.js');
    montar();
    expect(screen.getByRole('alert')).toHaveTextContent('O Scua Logon foi atualizado');
    expect(screen.getByRole('button', { name: 'Recarregar a página' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument();
  });
});
