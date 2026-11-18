import { useId, type ReactNode } from 'react';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Aba } from '../domain/auditoria';
import type { ResumoAuditoria } from '../domain/painel';

const CARTAO = 'grid min-w-0 content-start gap-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]';
const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const plural = (n: number) => `${n} ${n === 1 ? 'alteração' : 'alterações'}`;

function Cartao({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn(CARTAO, className)}>
      <h2 id={id} className="text-base font-bold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

/** Largura proporcional ao maior valor; um valor pequeno ainda aparece. */
const largura = (valor: number, maior: number) => (valor <= 0 || maior <= 0 ? 0 : Math.max(2, Math.round((valor / maior) * 100)));

/** Uma linha por item: rótulo, barra e o número escrito (a cor nunca é a única informação). */
function Barras({ rotulo, itens }: { rotulo: string; itens: { chave: string; nome: string; total: number; aoClicar?: () => void }[] }) {
  const maior = Math.max(0, ...itens.map((i) => i.total));
  const grade = 'grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm';
  return (
    <ul aria-label={rotulo} className="grid gap-2">
      {itens.map((i) => {
        const conteudo = (
          <>
            <span className="truncate text-left text-foreground">{i.nome}</span>
            <span aria-hidden="true" className="h-3 rounded-sm bg-[var(--color-neutral-bg)]">
              <span className="block h-full rounded-sm bg-[var(--color-brand)]" style={{ width: `${largura(i.total, maior)}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-foreground">{i.total}</span>
          </>
        );
        return (
          <li key={i.chave}>
            {i.aoClicar ? (
              <button
                type="button"
                aria-label={`${i.nome}, ${plural(i.total)}`}
                onClick={i.aoClicar}
                className={cn(grade, 'min-h-11 w-full rounded-md px-1 outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring md:min-h-9')}
              >
                {conteudo}
              </button>
            ) : (
              <div className={cn(grade, 'px-1')}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Colunas por dia. Cada coluna tem o texto completo para leitor de tela e na dica; o eixo mostra só algumas datas. */
function PorDia({ dias }: { dias: ResumoAuditoria['porDia'] }) {
  const maior = Math.max(0, ...dias.map((d) => d.total));
  if (maior === 0) {
    return <p className="rounded-md border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma alteração nesse período.</p>;
  }
  const passo = Math.max(1, Math.ceil(dias.length / 6));
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">Dia com mais alterações: <strong className="text-foreground">{plural(maior)}</strong></p>
      <ol aria-label="Alterações por dia" className="grid h-36 grid-flow-col auto-cols-fr items-end gap-0.5 border-b border-[var(--color-line)]">
        {dias.map((d) => (
          <li key={d.dia} title={`${ddmm(d.dia)}: ${plural(d.total)}`} className="flex h-full flex-col justify-end">
            <span className="sr-only">{`${ddmm(d.dia)}: ${plural(d.total)}`}</span>
            <span aria-hidden="true" className="block w-full rounded-t-sm bg-[var(--color-brand)]" style={{ height: `${largura(d.total, maior)}%` }} />
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="grid grid-flow-col auto-cols-fr gap-0.5 text-xs text-muted-foreground tabular-nums">
        {dias.map((d, i) => <span key={d.dia} className="whitespace-nowrap">{i % passo === 0 ? ddmm(d.dia) : ''}</span>)}
      </div>
    </div>
  );
}

/** Panorama geral da auditoria: vem antes das tabelas e respeita os filtros (período, quem alterou, busca). */
export function PainelAuditoria({ resumo, carregando, periodo, aoAbrirArea }: {
  resumo: ResumoAuditoria | undefined;
  carregando: boolean;
  /** Texto do período, sempre visível ("19/10 a 17/11"). */
  periodo: string;
  aoAbrirArea: (aba: Aba) => void;
}) {
  const r = resumo;
  return (
    <section aria-label="Panorama geral" className="grid min-w-0 gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Alterações" value={r?.total ?? 0} period={periodo} loading={carregando} />
        <KpiCard label="Criações" value={r?.criacoes ?? 0} period={periodo} loading={carregando} />
        <KpiCard label="Exclusões" value={r?.exclusoes ?? 0} period={periodo} loading={carregando} />
        <KpiCard label="Pessoas que alteraram" value={r?.pessoas ?? 0} period={periodo} loading={carregando} />
      </div>
      {carregando || !r ? (
        <div role="status" aria-label="Carregando panorama" className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao titulo="Alterações por dia">
            <PorDia dias={r.porDia} />
          </Cartao>
          <Cartao titulo="Por área">
            {r.areaMaisAlterada && <p className="text-sm text-muted-foreground">Mais alterada: <strong className="text-foreground">{r.areaMaisAlterada}</strong>. Clique numa área para ver a lista.</p>}
            <Barras rotulo="Alterações por área" itens={r.porArea.map((a) => ({ chave: a.aba, nome: a.rotulo, total: a.total, aoClicar: () => aoAbrirArea(a.aba) }))} />
          </Cartao>
          <Cartao titulo="Quem mais alterou">
            {r.quemMaisAlterou.length === 0
              ? <p className="text-sm text-muted-foreground">Ninguém alterou nada nesse período.</p>
              : <Barras rotulo="Quem mais alterou" itens={r.quemMaisAlterou.map((q) => ({ chave: q.pessoaId, nome: q.nome, total: q.total }))} />}
          </Cartao>
        </div>
      )}
    </section>
  );
}
