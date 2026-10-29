import { Navigate, Route, Routes } from 'react-router';
import { RotasExtensoes } from '../features/extensoes/routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/extensoes/*" element={<RotasExtensoes />} />
      <Route path="*" element={<Navigate to="/extensoes" replace />} />
    </Routes>
  );
}
