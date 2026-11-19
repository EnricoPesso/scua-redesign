import { Route, Routes } from 'react-router';
import { AuditoriaPage } from './components/AuditoriaPage';

export default function Rotas() {
  return (
    <Routes>
      <Route path=":aba?" element={<AuditoriaPage />} />
    </Routes>
  );
}
