import { BrowserRouter } from 'react-router';
import { AppRoutes } from './app/AppRoutes';
import { Provedores } from './app/Provedores';
import { criarQueryClient } from './app/queryClient';

const client = criarQueryClient();

export default function App() {
  return (
    <Provedores client={client}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provedores>
  );
}
