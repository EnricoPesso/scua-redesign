import { useRef, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { ROTULO_ABA } from '../domain/abas';
import type { Aba } from '../domain/types';
import { useTotais } from '../hooks/queries';

export const idAba = (aba: Aba) => `aba-${aba}`;
export const ID_PAINEL_ABA = 'painel-aba';

// pedir ao @PhLima07: abas (o sistema de design ainda não tem este componente).
// Cada aba é uma rota e um link de verdade; as setas trocam de aba (ativação automática).
export function AbasExtensoes({ abas, ativa }: { abas: Aba[]; ativa: Aba }) {
  const navigate = useNavigate();
  const refs = useRef(new Map<Aba, HTMLAnchorElement>());
  const pendentes = useTotais({ aba: 'aprovar', de: '', ate: '' }, abas.includes('aprovar'));

  function aoTeclar(e: KeyboardEvent) {
    const atual = abas.indexOf(ativa);
    const destino =
      e.key === 'ArrowRight' ? (atual + 1) % abas.length
      : e.key === 'ArrowLeft' ? (atual - 1 + abas.length) % abas.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? abas.length - 1
      : -1;
    if (destino < 0) return;
    e.preventDefault();
    refs.current.get(abas[destino])?.focus();
    void navigate(`/extensoes/${abas[destino]}`);
  }

  return (
    <div role="tablist" aria-label="Abas de extensões" onKeyDown={aoTeclar}
      className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
      {abas.map((aba) => {
        const selecionada = aba === ativa;
        return (
          <Link
            key={aba}
            ref={(el) => { if (el) refs.current.set(aba, el); else refs.current.delete(aba); }}
            id={idAba(aba)}
            role="tab"
            to={`/extensoes/${aba}`}
            aria-selected={selecionada}
            aria-controls={ID_PAINEL_ABA}
            tabIndex={selecionada ? 0 : -1}
            className={cn(
              '-mb-px inline-flex min-h-11 items-center border-b-[3px] px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset md:min-h-10',
              selecionada
                ? 'border-[var(--color-brand)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            {ROTULO_ABA[aba]}{aba === 'aprovar' && pendentes.data ? ` (${pendentes.data.pendentes})` : ''}
          </Link>
        );
      })}
    </div>
  );
}
