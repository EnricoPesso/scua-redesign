import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { emHoras, emReais } from '../../../lib/conformidade';
import { pessoaPorId } from '../../../mock/diretorio';
import { grupoCompletoDaPessoa } from '../../../mock/grupos';
import { CUSTO_HORA, diasDaPessoa } from '../../../mock/jornadaReal';
import { avaliarExtensao, type CorSemaforo } from '../domain/previsao';

const VISUAL: Record<CorSemaforo, { simbolo: string; titulo: string; classe: string }> = {
  verde: { simbolo: '✓', titulo: 'Dentro das regras', classe: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]' },
  amarelo: { simbolo: '◆', titulo: 'Atenção: perto do limite', classe: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]' },
  vermelho: { simbolo: '▲', titulo: 'Vai quebrar uma regra', classe: 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' },
};
const COR_AVISO = { amarelo: 'text-[var(--color-warning-text)]', vermelho: 'text-[var(--color-danger-text)]' } as const;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
/** Dias lidos para trás: cobre o mês corrente inteiro e a jornada habitual. */
const DIAS_LIDOS = -40;

interface Props {
  pessoaId: string;
  /** Primeiro dia da extensão, YYYY-MM-DD. */
  dia: string;
  /** Minutos de extensão em cada dia. */
  minutos: number;
  /** Quantos dias o pedido cobre (padrão 1). */
  dias?: number;
  className?: string;
}

/** Verde, amarelo ou vermelho para um pedido de extensão: qual regra seria violada e quanto custa. Some se faltar dado. */
export function SemaforoConformidade({ pessoaId, dia, minutos, dias = 1, className }: Props) {
  const avaliacao = useMemo(() => {
    if (!pessoaId || !pessoaPorId(pessoaId) || !DATA.test(dia) || minutos <= 0) return null;
    const grupo = grupoCompletoDaPessoa(pessoaId);
    return avaliarExtensao({
      dias: diasDaPessoa(pessoaId, DIAS_LIDOS, -1),
      dia,
      minutosPorDia: minutos,
      diasDoPedido: dias,
      limiteHoras: grupo?.limiteHoras ?? '',
      custoHora: CUSTO_HORA[pessoaId] ?? 30,
    });
  }, [pessoaId, dia, minutos, dias]);
  if (!avaliacao) return null;

  const v = VISUAL[avaliacao.cor];
  return (
    <section aria-label="Conformidade do pedido" className={cn('grid gap-2 rounded-lg border border-[var(--color-line)] bg-card p-3', className)}>
      <p role="status" className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold', v.classe)}>
        <span aria-hidden="true">{v.simbolo}</span>
        {v.titulo}
      </p>
      {avaliacao.avisos.length > 0 && (
        <ul className="grid gap-2">
          {avaliacao.avisos.map((a) => (
            <li key={a.tipo} className="grid gap-0.5 text-sm">
              <p className={cn('font-semibold', COR_AVISO[a.cor])}>{a.titulo} <span className="font-normal text-muted-foreground">({a.base})</span></p>
              <p className="text-foreground">{a.detalhe}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-foreground">
        Custo estimado: <strong>{emReais(avaliacao.custo)}</strong> para {emHoras(avaliacao.totalMin)} de hora extra.
      </p>
      <p className="text-xs text-muted-foreground">Estimativa com adicional de hora extra e encargos, para apoiar a decisão.</p>
    </section>
  );
}
