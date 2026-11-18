import { Suspense, useEffect, useRef, useState } from 'react';
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SearchIcon, XIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../componentes/EstadoErro';
import type { Permissoes } from '../features/extensoes/domain/types';
import { usePermissoes } from '../features/extensoes/hooks/queries';
import { BuscaDeTelas } from './BuscaDeTelas';
import { ErroGlobal } from './ErroGlobal';
import { menuPara, papelDe, type GrupoMenu } from './menu';

const CHAVE_RECOLHIDO = 'scua.menu.recolhido';

function lerRecolhido(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_RECOLHIDO) === '1';
  } catch {
    return false;
  }
}

/** Marca do produto em texto: não há arquivo de logotipo no repositório. */
function Marca({ curta = false }: { curta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-heading text-lg font-bold text-foreground">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--color-brand)] text-[var(--color-on-brand)]">S</span>
      <span className={cn(curta && 'sr-only')}>Scua <span className="text-[var(--color-brand-text)]">Logon</span></span>
    </span>
  );
}

function Navegacao({ grupos, recolhido = false, aoNavegar }: { grupos: GrupoMenu[]; recolhido?: boolean; aoNavegar?: () => void }) {
  return (
    <nav aria-label="Menu principal" className="grid gap-5">
      {grupos.map((g) => (
        <div key={g.titulo} className="grid gap-1">
          <h2 className={cn('px-3 text-xs font-bold tracking-wide text-muted-foreground uppercase', recolhido && 'sr-only')}>{g.titulo}</h2>
          <ul className="grid gap-0.5">
            {g.itens.map((i) => (
              <li key={i.para}>
                <NavLink
                  to={i.para}
                  onClick={aoNavegar}
                  title={recolhido ? i.rotulo : undefined}
                  className={({ isActive }) => cn(
                    'flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring lg:min-h-10',
                    recolhido && 'justify-center px-0',
                    isActive
                      ? 'border-[var(--color-brand)] bg-[var(--color-surface-muted)] text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-[var(--color-row-hover)] hover:text-foreground',
                  )}
                >
                  <i.icone aria-hidden="true" className="size-5 shrink-0" />
                  <span className={cn(recolhido && 'sr-only')}>{i.rotulo}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const MenuCarregando = () => (
  <div role="status" aria-label="Carregando menu" className="grid gap-2">
    {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-9" />)}
  </div>
);

const TelaCarregando = () => (
  <div role="status" aria-label="Carregando tela" className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:px-6">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-24" />
    <Skeleton className="h-64" />
  </div>
);

/** Casca do app: menu lateral (recolhível no desktop, gaveta no celular e no tablet), cabeçalho e a tela atual. */
export function AppShell() {
  const permissoes = usePermissoes();
  const { pathname } = useLocation();
  const [recolhido, setRecolhido] = useState(lerRecolhido);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const gaveta = useRef<HTMLDialogElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);

  const alternarRecolhido = () => {
    setRecolhido((r) => {
      try {
        window.localStorage.setItem(CHAVE_RECOLHIDO, r ? '0' : '1');
      } catch {
        // sem localStorage (modo privado): a preferência só não é lembrada
      }
      return !r;
    });
  };

  // Ctrl+K (ou ⌘K) abre a busca de telas.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBuscaAberta(true);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  // Trocar de tela fecha a gaveta do menu.
  useEffect(() => {
    if (gaveta.current?.open) gaveta.current.close();
  }, [pathname]);

  const grupos = permissoes.data ? menuPara(permissoes.data) : [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#conteudo"
        onClick={(e) => { e.preventDefault(); conteudo.current?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-[var(--shadow-3)] focus:outline-none focus:ring-3 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>

      {/* Menu fixo: só no desktop. */}
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-surface)] p-3 lg:flex', recolhido ? 'w-[4.5rem]' : 'w-64')}>
        <div className={cn('flex min-h-10 items-center px-2', recolhido && 'justify-center px-0')}><Marca curta={recolhido} /></div>
        <div className="flex-1">{permissoes.isPending ? <MenuCarregando /> : <Navegacao grupos={grupos} recolhido={recolhido} />}</div>
        <Button
          variant="ghost"
          size={recolhido ? 'icon' : 'default'}
          className={cn(!recolhido && 'justify-start', recolhido && 'mx-auto')}
          aria-expanded={!recolhido}
          aria-label={recolhido ? 'Expandir menu' : undefined}
          onClick={alternarRecolhido}
        >
          {recolhido ? <PanelLeftOpenIcon aria-hidden="true" /> : <><PanelLeftCloseIcon aria-hidden="true" />Recolher menu</>}
        </Button>
      </aside>

      {/* Menu em gaveta: celular e tablet. */}
      <dialog
        ref={gaveta}
        aria-label="Menu"
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        className="m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none border-r border-[var(--color-line)] bg-[var(--color-surface)] p-0 text-foreground backdrop:bg-[var(--color-backdrop)] lg:hidden"
      >
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <Marca />
            <Button variant="ghost" size="icon" className="size-11" aria-label="Fechar menu" onClick={() => gaveta.current?.close()}><XIcon aria-hidden="true" /></Button>
          </div>
          {permissoes.isPending ? <MenuCarregando /> : <Navegacao grupos={grupos} aoNavegar={() => gaveta.current?.close()} />}
        </div>
      </dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 sm:px-6">
          <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label="Abrir menu" onClick={() => gaveta.current?.showModal()}><MenuIcon aria-hidden="true" /></Button>
          <span className="lg:hidden"><Marca curta /></span>
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            className="ml-auto inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground outline-none hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring sm:ml-0 sm:w-72 sm:justify-start lg:h-10"
          >
            <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="max-sm:sr-only">Buscar tela</span>
            <kbd className="ml-auto hidden rounded border border-[var(--color-line)] px-1.5 text-xs sm:inline">Ctrl K</kbd>
          </button>
          {permissoes.data && <Usuario permissoes={permissoes.data} />}
        </header>

        <div id="conteudo" ref={conteudo} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {permissoes.isError ? (
            <div className="mx-auto max-w-3xl px-4 py-10"><EstadoErro erro={permissoes.error} aoTentar={() => void permissoes.refetch()} /></div>
          ) : (
            <ErroGlobal chave={pathname}>
              <Suspense fallback={<TelaCarregando />}><Outlet /></Suspense>
            </ErroGlobal>
          )}
        </div>
      </div>

      {buscaAberta && permissoes.data && <BuscaDeTelas permissoes={permissoes.data} aoFechar={() => setBuscaAberta(false)} />}
    </div>
  );
}

function Usuario({ permissoes }: { permissoes: Permissoes }) {
  const { nome } = permissoes.usuario;
  const iniciais = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="ml-auto flex items-center gap-2 max-sm:ml-0">
      <span className="grid text-right leading-tight max-sm:hidden">
        <span className="text-sm font-semibold text-foreground">{nome}</span>
        <span className="text-xs text-muted-foreground">{papelDe(permissoes)}</span>
      </span>
      <span className="sr-only sm:hidden">{nome}, {papelDe(permissoes)}</span>
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[var(--color-surface-muted)] text-sm font-bold text-foreground">
        {iniciais}
      </span>
    </div>
  );
}
