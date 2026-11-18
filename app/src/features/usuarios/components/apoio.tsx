import { useEffect, useRef, type RefObject } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { listarUsuarios, obterUsuario } from '../api';
import type { Usuario } from '../domain/tipos';

export const CHAVE_USUARIOS = ['usuarios'] as const;

export const useUsuarios = () => useQuery({ queryKey: [...CHAVE_USUARIOS, 'lista'], queryFn: listarUsuarios });
export const useUsuario = (id: string) => useQuery({ queryKey: [...CHAVE_USUARIOS, 'detalhe', id], queryFn: () => obterUsuario(id) });

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

/** Foca o primeiro campo marcado como inválido. Espera a tela pintar os `aria-invalid` antes de procurar. */
export function focarPrimeiroInvalido(area: RefObject<HTMLElement | null>) {
  setTimeout(() => area.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
}

export const AVISO_DE_FALHA = 'rounded-md bg-[var(--color-danger-bg)] p-3 text-sm font-semibold text-[var(--color-danger-text)] outline-none focus-visible:ring-3 focus-visible:ring-ring';

/** Id do formulário da aba ativa: o botão "Salvar" fica no rodapé do painel, fora do formulário. */
export const ID_FORM_ABA = 'form-aba-usuario';

/** Depois de gravar: o detalhe já mostra o valor novo e a lista é recarregada. */
export function useGravar(id: string) {
  const client = useQueryClient();
  return (salvo: Usuario) => {
    client.setQueryData([...CHAVE_USUARIOS, 'detalhe', id], salvo);
    void client.invalidateQueries({ queryKey: [...CHAVE_USUARIOS, 'lista'] });
  };
}

export interface PropsAba {
  usuario: Usuario;
  /** A aba tem alterações que ainda não foram salvas (o painel pede confirmação antes de sair). */
  aoMudarSujo: (sujo: boolean) => void;
  /** Um salvamento está em andamento (o botão "Salvar" do rodapé mostra o carregando). */
  aoSalvando: (salvando: boolean) => void;
}
