import { useState } from "react"
import { MultiSelect, type MultiSelectProps } from "@/components/ui/multi-select"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"
import { jornadas } from "./shared"

function Demo({ initial, ...props }: { initial: string[] } & Omit<MultiSelectProps, "values" | "onValuesChange" | "label" | "options">) {
  const [values, setValues] = useState<string[]>(initial)
  return <MultiSelect label="Jornadas" options={jornadas} values={values} onValuesChange={setValues} {...props} />
}

export function MultiSelectSection() {
  const [turnos, setTurnos] = useState<string[]>([])
  return (
    <DocSection id="multi-select" title="Multi-select" description="Escolha de várias opções, com busca por digitação.">
      <StateGrid>
        <StateCell label="Padrão (vazio)"><MultiSelect label="Jornadas" options={jornadas} values={turnos} onValuesChange={setTurnos} placeholder="Buscar jornadas" /></StateCell>
        <StateCell label="Vários selecionados"><Demo initial={["44h", "12x36", "6x1"]} /></StateCell>
        <StateCell label="Aberto"><Demo initial={["5x2"]} defaultOpen modal={false} /></StateCell>
        <StateCell label="Sem resultado (digite xyz)"><Demo initial={[]} defaultOpen modal={false} /></StateCell>
        <StateCell label="Erro"><Demo initial={[]} error="Escolha ao menos uma jornada" /></StateCell>
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
