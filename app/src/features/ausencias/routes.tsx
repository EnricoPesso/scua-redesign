import { Route, Routes } from 'react-router';
import { AusenciasPage } from './components/AusenciasPage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<AusenciasPage />} />
    </Routes>
  );
}
