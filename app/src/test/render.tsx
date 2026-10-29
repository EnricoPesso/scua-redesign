import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../app/AppRoutes';
import { Provedores } from '../app/Provedores';
import { criarQueryClient } from '../app/queryClient';

export function renderApp(rota: string) {
  const client = criarQueryClient({ semRetry: true });
  const user = userEvent.setup();
  const resultado = render(
    <Provedores client={client}>
      <MemoryRouter initialEntries={[rota]}>
        <AppRoutes />
      </MemoryRouter>
    </Provedores>,
  );
  return { user, client, ...resultado };
}
