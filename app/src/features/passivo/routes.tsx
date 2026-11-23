import { Route, Routes } from 'react-router';
import { RadarPage } from './components/RadarPage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<RadarPage />} />
    </Routes>
  );
}
