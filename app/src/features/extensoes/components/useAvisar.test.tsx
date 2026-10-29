import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ToastProvider } from '@/components/ui/toaster';
import { useAvisar } from './useAvisar';

function Botao() {
  const avisar = useAvisar();
  return <button onClick={() => avisar('Pedido enviado.')}>Avisar</button>;
}

it('mostra o aviso de sucesso e deixa fechar', async () => {
  const user = userEvent.setup();
  render(<ToastProvider><Botao /></ToastProvider>);
  await user.click(screen.getByRole('button', { name: 'Avisar' }));
  expect(await screen.findByText('Pedido enviado.')).toBeInTheDocument();
  // O botão fechar vem com aria-hidden do base-ui; por isso a busca é pelo rótulo.
  await user.click(screen.getByLabelText('Fechar notificação'));
  await waitFor(() => expect(screen.queryByText('Pedido enviado.')).not.toBeInTheDocument());
});
