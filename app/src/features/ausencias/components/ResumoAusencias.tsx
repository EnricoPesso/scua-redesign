import { KpiCard } from '@/components/ui/kpi-card';
import type { Resumo } from '../domain/ausencias';

interface Props {
  resumo: Resumo | undefined;
  totalPessoas: number;
  /** Texto do período, ex.: "06/10 a 12/10". Vai no rótulo de cada cartão. */
  periodo: string;
  carregando: boolean;
}

export function ResumoAusencias({ resumo, totalPessoas, periodo, carregando }: Props) {
  const vazio = !carregando && (!resumo || resumo.totalMin === 0);
  const r = resumo ?? { totalMin: 0, pessoasComAusencia: 0, mediaMinPorPessoaDia: 0, maiorContinuaMin: 0 };
  const comum = { period: periodo, loading: carregando, empty: vazio };
  return (
    <section aria-label="Resumo das ausências" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Horas ausentes" value={r.totalMin / 60} decimals={1} unit="h" {...comum} />
      <KpiCard label="Pessoas com ausência" value={r.pessoasComAusencia} unit={`de ${totalPessoas}`} {...comum} />
      <KpiCard label="Média por pessoa por dia" value={Math.round(r.mediaMinPorPessoaDia)} unit="min" {...comum} />
      <KpiCard label="Maior ausência contínua" value={r.maiorContinuaMin} unit="min" {...comum} />
    </section>
  );
}
