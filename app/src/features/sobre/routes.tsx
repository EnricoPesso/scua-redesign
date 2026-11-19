import { Route, Routes } from 'react-router';
import { SobrePage } from './components/SobrePage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<SobrePage />} />
    </Routes>
  );
}
