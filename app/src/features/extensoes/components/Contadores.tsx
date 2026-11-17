import type { UseQueryResult } from '@tanstack/react-query';
import { KpiCard } from '@/components/ui/kpi-card';
import type { Totais } from '../domain/types';

// O período aparece com a 1ª letra maiúscula só na tela ("no mês" → "No mês").
const CARTAO = 'relative min-w-[13.5rem] shrink-0 snap-start md:min-w-0 [&>p:last-child]:first-letter:uppercase';
// Celular: faixa com rolagem lateral só dentro dela; a página não rola. Desktop: 3 colunas.
const FAIXA = 'flex min-w-0 snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible md:pb-0';

/** Horas aprovadas em horas decimais: 90 min → 1,5 h (o KpiCard anima um número). */
const emHoras = (minutos: number) => ({ valor: minutos / 60, casas: minutos % 60 === 0 ? 0 : 1 });

/** `soPendentes`: na fila "Para aprovar" só existem pendentes, então aprovadas e reprovadas ficariam sempre em 0. */
export function Contadores({ totais, rotulo, soPendentes = false }: { totais: UseQueryResult<Totais>; rotulo: string; soPendentes?: boolean }) {
  if (totais.isError) return null;
  const carregando = totais.isPending;
  const t = totais.data;
  const horas = emHoras(t?.minutosAprovados ?? 0);
  return (
    <div className={FAIXA}>
      <KpiCard className={CARTAO} label="Em aprovação" value={t?.pendentes ?? 0} period={rotulo} loading={carregando} />
      {!soPendentes && <>
      <KpiCard className={CARTAO} label="Horas aprovadas" value={horas.valor} decimals={horas.casas} unit="h" period={rotulo} loading={carregando} />
      <KpiCard className={CARTAO} label="Reprovados" value={t?.reprovados ?? 0} period={rotulo} loading={carregando} />
      </>}
    </div>
  );
}
