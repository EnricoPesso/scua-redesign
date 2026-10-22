import { useState } from "react"
import { MultiSelect } from "@/components/ui/multi-select"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"
import { jornadas } from "./shared"

export function MultiSelectSection() {
  const [turnos, setTurnos] = useState<string[]>([])
  return (
    <DocSection id="multi-select" title="Multi-select" description="Escolha de várias opções, com busca por digitação.">
      <StateGrid>
        <StateCell label="Padrão (vazio)"><MultiSelect label="Jornadas" options={jornadas} values={turnos} onValuesChange={setTurnos} placeholder="Buscar jornadas" /></StateCell>
        <StateCell label="Vários selecionados"><MultiSelect label="Jornadas" options={jornadas} values={["44h", "12x36", "6x1"]} /></StateCell>
        <StateCell label="Aberto"><MultiSelect label="Jornadas" options={jornadas} defaultOpen values={["5x2"]} /></StateCell>
        <StateCell label="Sem resultado (digite xyz)"><MultiSelect label="Jornadas" options={jornadas} defaultOpen /></StateCell>
        <StateCell label="Erro"><MultiSelect label="Jornadas" options={jornadas} values={[]} error="Escolha ao menos uma jornada" /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { MultiSelect } from "@/components/ui/multi-select"

<MultiSelect
  label="Jornadas"
  options={jornadas}
  values={turnos}
  onValuesChange={setTurnos}
  placeholder="Buscar jornadas"
/>`}
      />
    </DocSection>
  )
}
