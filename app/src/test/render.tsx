import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AppRoutes } from '../app/AppRoutes';
import { Provedores } from '../app/Provedores';
import { criarQueryClient } from '../app/queryClient';

/** Mostra a rota atual (caminho + query) para os testes conferirem a navegação. Fica escondido da tela. */
function LocalAtual() {
  const { pathname, search } = useLocation();
  return <output hidden data-testid="local-atual">{pathname + search}</output>;
}

export function renderApp(rota: string) {
  const client = criarQueryClient({ semRetry: true });
  const user = userEvent.setup();
  const resultado = render(
    <Provedores client={client}>
      <MemoryRouter initialEntries={[rota]}>
        <AppRoutes />
        <LocalAtual />
      </MemoryRouter>
    </Provedores>,
  );
  return { user, client, ...resultado };
}
