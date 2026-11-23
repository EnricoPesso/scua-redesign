import { Route, Routes } from 'react-router';
import { DossiePage } from './components/DossiePage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<DossiePage />} />
    </Routes>
  );
}
