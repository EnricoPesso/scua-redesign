import { DateField } from "@/components/ui/date-field"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function CampoDeDataSection() {
  return (
    <DocSection id="campo-de-data" title="Campo de data" description="Data única no formato nativo do navegador, com limites opcionais.">
      <StateGrid>
        <StateCell label="Padrão, com dica e limites"><DateField label="Início" hint="Use o formato do navegador" min="2026-01-01" max="2026-12-31" /></StateCell>
        <StateCell label="Erro"><DateField label="Fim" error="A data final é anterior à inicial. Escolha uma data a partir da data inicial." defaultValue="2026-01-01" /></StateCell>
        <StateCell label="Desabilitado"><DateField label="Fechamento" disabled defaultValue="2026-10-22" /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { DateField } from "@/components/ui/date-field"

// value e min/max usam o formato AAAA-MM-DD
<DateField label="Início" value={inicio} onChange={setInicio} min="2026-01-01" />`}
      />
    </DocSection>
  )
}
