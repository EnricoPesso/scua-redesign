import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SearchIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import type { Permissoes } from '../features/extensoes/domain/types';
import { buscarTelas, telasPara } from './menu';

/** Busca de telas (Ctrl+K): encontra qualquer tela pelo nome, inclusive cada relatório e cada configuração. */
export function BuscaDeTelas({ permissoes, aoFechar }: { permissoes: Permissoes; aoFechar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const idTitulo = useId();
  const [termo, setTermo] = useState('');
  const telas = useMemo(() => telasPara(permissoes), [permissoes]);
  const resultados = buscarTelas(telas, termo);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const aoTeclarNoCampo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && resultados[0]) {
      e.preventDefault();
      void navigate(resultados[0].para);
      aoFechar();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      lista.current?.querySelector<HTMLElement>('a')?.focus();
    }
  };
  const aoTeclarNaLista = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const links = Array.from(lista.current?.querySelectorAll<HTMLElement>('a') ?? []);
    const i = links.indexOf(document.activeElement as HTMLElement);
    const alvo = e.key === 'ArrowDown' ? links[i + 1] : links[i - 1];
    if (alvo) alvo.focus();
    else if (e.key === 'ArrowUp') dialogo.current?.querySelector<HTMLElement>('input')?.focus();
  };

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onClose={aoFechar}
      onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}
      className="mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--shadow-3)] backdrop:bg-[var(--color-backdrop)]"
    >
      <div className="grid max-h-[70vh] grid-rows-[auto_1fr]">
        <div className="grid gap-2 border-b border-[var(--color-line)] p-4">
          <h2 id={idTitulo} className="text-sm font-bold text-foreground">Buscar tela</h2>
          <label className="flex h-11 items-center gap-2 rounded-md border border-input bg-card px-3 focus-within:ring-3 focus-within:ring-ring">
            <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Nome da tela</span>
            <input
              type="search"
              autoFocus
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={aoTeclarNoCampo}
              placeholder="Ex.: feriados, tempo de bloqueio, usuários"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <p role="status" className="text-xs text-muted-foreground">
            {resultados.length === 0 ? 'Nenhuma tela encontrada.' : `${resultados.length} ${resultados.length === 1 ? 'tela' : 'telas'}. Enter abre a primeira.`}
          </p>
        </div>
        <ul ref={lista} onKeyDown={aoTeclarNaLista} className="grid content-start gap-0.5 overflow-y-auto p-2">
          {resultados.map((t) => (
            <li key={t.para}>
              <Link
                to={t.para}
                onClick={aoFechar}
                className="grid min-h-11 content-center gap-0.5 rounded-md px-3 py-2 outline-none hover:bg-[var(--color-row-hover)] focus-visible:bg-[var(--color-surface-muted)] focus-visible:ring-3 focus-visible:ring-ring"
              >
                <span className="text-sm font-semibold text-foreground">{t.titulo}</span>
                <span className="text-xs text-muted-foreground">{t.onde}{t.resumo ? ` · ${t.resumo}` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
