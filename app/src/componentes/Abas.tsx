import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AbaDef<V extends string> { valor: V; rotulo: string }

// pedir ao @PhLima07: abas (o sistema de design ainda não tem).
/** Abas acessíveis (tablist): setas, Home e End trocam de aba; só a aba ativa entra no Tab. */
export function Abas<V extends string>({ rotulo, abas, ativa, aoMudar, children, className }: {
  rotulo: string;
  abas: AbaDef<V>[];
  ativa: V;
  aoMudar: (v: V) => void;
  /** Conteúdo da aba ativa. */
  children: ReactNode;
  className?: string;
}) {
  const base = useId();
  const idAba = (v: string) => `${base}-aba-${v}`;
  const idPainel = `${base}-painel`;

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = abas.findIndex((a) => a.valor === ativa);
    let novo = -1;
    if (e.key === 'ArrowRight') novo = (i + 1) % abas.length;
    else if (e.key === 'ArrowLeft') novo = (i - 1 + abas.length) % abas.length;
    else if (e.key === 'Home') novo = 0;
    else if (e.key === 'End') novo = abas.length - 1;
    if (novo < 0) return;
    e.preventDefault();
    aoMudar(abas[novo].valor);
    document.getElementById(idAba(abas[novo].valor))?.focus();
  };

  return (
    <div className={cn('grid min-w-0 gap-4', className)}>
      <div role="tablist" aria-label={rotulo} onKeyDown={aoTeclar} className="flex min-w-0 gap-1 overflow-x-auto border-b border-[var(--color-line)]">
        {abas.map((a) => {
          const selecionada = a.valor === ativa;
          return (
            <button
              key={a.valor}
              type="button"
              role="tab"
              id={idAba(a.valor)}
              aria-selected={selecionada}
              aria-controls={idPainel}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => aoMudar(a.valor)}
              className={cn(
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset',
                selecionada ? 'border-[var(--color-brand)] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {a.rotulo}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={idPainel} aria-labelledby={idAba(ativa)} className="grid min-w-0 gap-4">{children}</div>
    </div>
  );
}
