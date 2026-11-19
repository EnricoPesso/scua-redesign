import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

type Props =
  | { tipo: 'carregando' }
  | { tipo: 'vazio'; titulo: string; texto?: string; acao?: ReactNode }
  | { tipo: 'erro'; mensagem: string; onTentarDeNovo: () => void };

export function EstadoLista(props: Props) {
  if (props.tipo === 'carregando') {
    return (
      <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  }
  if (props.tipo === 'erro') {
    // A mensagem vem pronta (domain/erros): primeira frase vira título e o resto, descrição.
    const fim = props.mensagem.indexOf('. ');
    const titulo = fim < 0 ? props.mensagem : props.mensagem.slice(0, fim + 1);
    const descricao = fim < 0 ? undefined : props.mensagem.slice(fim + 2);
    return (
      <ErrorState
        title={titulo}
        description={descricao}
        action={<Button className="max-md:h-11" onClick={props.onTentarDeNovo}>Tentar de novo</Button>}
      />
    );
  }
  return <EmptyState title={props.titulo} description={props.texto} action={props.acao} />;
}
