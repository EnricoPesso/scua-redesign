import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { usePermissoes } from '../features/extensoes/hooks/queries';
import { RotasExtensoes } from '../features/extensoes/routes';
import { AppShell } from '../layout/AppShell';
import { NaoEncontrada, SemAcesso } from '../layout/ErroGlobal';
import { tem, telaInicial, type Permissao } from '../layout/menu';

// Cada área carrega só quando é aberta (o primeiro carregamento fica leve).
const Inicio = lazy(() => import('../features/inicio/routes'));
const Ausencias = lazy(() => import('../features/ausencias/routes'));
const Usuarios = lazy(() => import('../features/usuarios/routes'));
const Jornadas = lazy(() => import('../features/jornadas/routes'));
const Pausas = lazy(() => import('../features/pausas/routes'));
const Liberacoes = lazy(() => import('../features/liberacoes/routes'));
const Relatorios = lazy(() => import('../features/relatorios/routes'));
const Configuracoes = lazy(() => import('../features/configuracoes/routes'));
const Carga = lazy(() => import('../features/carga/routes'));
const Auditoria = lazy(() => import('../features/auditoria/routes'));
const Sobre = lazy(() => import('../features/sobre/routes'));

/** Só mostra a tela se o perfil permitir; senão, "Sem acesso" (o menu nem mostra o item). */
function Protegida({ permissao, tela: Tela }: { permissao: Permissao; tela: LazyExoticComponent<ComponentType> }) {
  const permissoes = usePermissoes();
  if (!permissoes.data) return null; // a casca mostra o carregamento e o erro
  return tem(permissoes.data, permissao) ? <Tela /> : <SemAcesso />;
}

/** "/" leva à primeira tela que a pessoa pode usar. */
function Entrada() {
  const permissoes = usePermissoes();
  if (!permissoes.data) return null;
  const destino = telaInicial(permissoes.data);
  return destino ? <Navigate to={destino} replace /> : <SemAcesso />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Entrada />} />
        <Route path="/inicio/*" element={<Protegida permissao="relatorios" tela={Inicio} />} />
        <Route path="/extensoes/*" element={<RotasExtensoes />} />
        <Route path="/ausencias/*" element={<Protegida permissao="relatorios" tela={Ausencias} />} />
        <Route path="/usuarios/*" element={<Protegida permissao="pessoas" tela={Usuarios} />} />
        <Route path="/jornadas/*" element={<Protegida permissao="pessoas" tela={Jornadas} />} />
        <Route path="/pausas/*" element={<Protegida permissao="pessoas" tela={Pausas} />} />
        <Route path="/liberacoes-por-diretoria/*" element={<Protegida permissao="pessoas" tela={Liberacoes} />} />
        <Route path="/relatorios/*" element={<Protegida permissao="relatorios" tela={Relatorios} />} />
        <Route path="/configuracoes/*" element={<Protegida permissao="administracao" tela={Configuracoes} />} />
        <Route path="/carga-de-dados/*" element={<Protegida permissao="administracao" tela={Carga} />} />
        <Route path="/auditoria/*" element={<Protegida permissao="administracao" tela={Auditoria} />} />
        <Route path="/sobre/*" element={<Protegida permissao="administracao" tela={Sobre} />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  );
}
