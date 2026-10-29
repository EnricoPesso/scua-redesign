import { KpiCard } from "@/components/ui/kpi-card"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function KpiCardSection() {
  return (
    <DocSection id="kpi-card" title="Card de KPI" description="Um número-chave do período, com contagem animada (Count Up) que respeita prefers-reduced-motion.">
      <StateGrid className="sm:grid-cols-3">
        <StateCell label="Padrão (Count Up)"><KpiCard label="Horas extras" value={1234.5} decimals={1} unit="h" period="Setembro de 2026" /></StateCell>
        <StateCell label="Carregando"><KpiCard label="Marcações" value={0} period="Setembro de 2026" loading /></StateCell>
        <StateCell label="Vazio"><KpiCard label="Faltas" value={0} period="Setembro de 2026" empty /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { KpiCard } from "@/components/ui/kpi-card"

<KpiCard
  label="Horas extras"
  value={1234.5}
  decimals={1}
  unit="h"
  period="Setembro de 2026"
  loading={carregando}
  empty={semDados}
/>`}
      />
    </DocSection>
  )
}
