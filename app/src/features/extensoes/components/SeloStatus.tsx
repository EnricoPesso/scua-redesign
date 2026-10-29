import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { Status } from '../domain/types';

const SELO: Record<Status, { rotulo: string; status: NonNullable<BadgeProps['status']> }> = {
  pendente: { rotulo: 'Pendente', status: 'warning' },
  aprovado: { rotulo: 'Aprovado', status: 'success' },
  reprovado: { rotulo: 'Reprovado', status: 'danger' },
  cancelado: { rotulo: 'Cancelado', status: 'neutral' },
};

/** Sempre texto + cor: a cor nunca aparece sozinha. */
export function SeloStatus({ status }: { status: Status }) {
  return <Badge status={SELO[status].status}>{SELO[status].rotulo}</Badge>;
}
