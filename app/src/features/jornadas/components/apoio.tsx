import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { listarJornadas } from '../api';

export const CHAVE_JORNADAS = ['jornadas', 'lista'] as const;

export const useJornadas = () => useQuery({ queryKey: CHAVE_JORNADAS, queryFn: listarJornadas });

export const Carregando = ({ rotulo = 'Carregando' }: { rotulo?: string }) => (
  <div role="status" aria-busy="true" aria-label={rotulo} className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
    <Skeleton className="h-5 w-3/5" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-4/5" />
  </div>
);

/**
 * Leva o foco (e a rolagem) até um aviso no topo de um painel rolável cujos botões ficam no rodapé.
 * Muda `gatilho` sempre que um aviso novo aparece; o elemento precisa de `tabIndex={-1}`.
 */
export function useFocarAviso<T extends HTMLElement>(gatilho: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!gatilho || !ref.current) return;
    ref.current.scrollIntoView({ block: 'nearest' });
    ref.current.focus();
  }, [gatilho]);
  return ref;
}

/** Fecha o painel voltando para a lista (com a busca da URL) e devolve o foco a quem o abriu. */
export function useFecharPainel() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [gatilho] = useState(() => document.activeElement as HTMLElement | null);
  return () => {
    void navigate({ pathname: '/jornadas', search });
    setTimeout(() => {
      if (gatilho && gatilho !== document.body && gatilho.isConnected) gatilho.focus();
    }, 0);
  };
}
