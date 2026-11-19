import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export interface PassoTrilha { rotulo: string; para?: string }

const LINK = 'rounded-sm text-[var(--color-brand-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring';

/** Trilha de navegação: os passos com `para` são links; o último é a página atual. */
export function Trilha({ passos }: { passos: PassoTrilha[] }) {
  if (passos.length === 0) return null;
  return (
    <nav aria-label="Trilha" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {passos.map((p, i) => (
          <li key={p.rotulo} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {p.para ? <Link to={p.para} className={cn(LINK, 'inline-flex min-h-6 items-center max-md:min-h-11')}>{p.rotulo}</Link> : <span>{p.rotulo}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Título da aba do navegador: "<tela> · Scua Logon". */
export function useTituloDaAba(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · Scua Logon`;
  }, [titulo]);
}

/**
 * Moldura comum das telas: trilha, título (h1), descrição e ações à direita.
 * Mesmas medidas do modelo de relatório, para todas as telas alinharem.
 */
export function Pagina({ titulo, trilha = [], descricao, acoes, children, className }: {
  titulo: string;
  trilha?: PassoTrilha[];
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  useTituloDaAba(titulo);
  return (
    <main className={cn('mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8', className)}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Trilha passos={trilha} />
          <h1 className="font-heading text-xl font-bold text-foreground">{titulo}</h1>
          {descricao && <p className="max-w-2xl text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2 max-md:w-full max-md:flex-col max-md:[&>*]:w-full max-md:[&>a]:h-11 max-md:[&>button]:h-11">{acoes}</div>}
      </header>
      {children}
    </main>
  );
}
