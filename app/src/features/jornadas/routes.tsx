import { Route, Routes } from 'react-router';
import { JornadasPage } from './components/JornadasPage';
import { PainelJornada } from './components/PainelJornada';

/** A lista fica montada enquanto o painel abre e fecha (busca e rolagem não se perdem). */
export default function Rotas() {
  return (
    <Routes>
      <Route element={<JornadasPage />}>
        <Route index element={null} />
        <Route path="nova" element={<PainelJornada />} />
        <Route path=":id" element={<PainelJornada />} />
      </Route>
    </Routes>
  );
}
