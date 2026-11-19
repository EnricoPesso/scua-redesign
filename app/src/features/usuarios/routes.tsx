import { Route, Routes } from 'react-router';
import { DetalheUsuario } from './components/DetalheUsuario';
import { UsuariosPage } from './components/UsuariosPage';

/** A lista (com busca, filtros e página da URL) fica montada enquanto o painel de um usuário abre e fecha. */
export default function Rotas() {
  return (
    <Routes>
      <Route element={<UsuariosPage />}>
        <Route index element={null} />
        <Route path=":id/:aba?" element={<DetalheUsuario />} />
      </Route>
    </Routes>
  );
}
