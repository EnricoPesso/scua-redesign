import { Route, Routes } from 'react-router';
import { NaoEncontrada } from '../../layout/ErroGlobal';
import { InicioPage } from './InicioPage';

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<InicioPage />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
