import { Route, Routes } from 'react-router';
import { ExtensoesPage } from './components/ExtensoesPage';
import { PainelPedido } from './components/PainelPedido';

/**
 * A página fica montada enquanto o painel muda (a lista não recarrega ao abrir um pedido).
 * Os filhos ainda não têm `element`: o formulário (Task 11) e o detalhe (Task 12) entram aqui
 * e aparecem no `<Outlet />` de `ExtensoesPage`.
 */
export function RotasExtensoes() {
  return (
    <Routes>
      <Route index element={<ExtensoesPage />} />
      <Route path=":aba" element={<ExtensoesPage />}>
        <Route path="novo" element={<PainelPedido />} />
        <Route path=":id" />
        <Route path=":id/editar" element={<PainelPedido />} />
      </Route>
    </Routes>
  );
}
