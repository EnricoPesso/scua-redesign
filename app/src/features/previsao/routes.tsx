import { Route, Routes } from 'react-router';
import { PrevisaoPage } from './components/PrevisaoPage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<PrevisaoPage />} />
    </Routes>
  );
}
