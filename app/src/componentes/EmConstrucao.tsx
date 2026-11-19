import { EmptyState } from '@/components/ui/empty-state';
import { Pagina } from './Pagina';

/** Marcador de tela ainda não implementada (some quando a tela entra). */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <Pagina titulo={titulo}>
      <EmptyState title="Tela em construção" description="Esta tela ainda está sendo feita." />
    </Pagina>
  );
}
