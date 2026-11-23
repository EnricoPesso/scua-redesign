import { Route, Routes } from 'react-router';
import { MeusDadosPage } from './components/MeusDadosPage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<MeusDadosPage />} />
    </Routes>
  );
}
