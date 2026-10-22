import { useState } from "react"
import { Select, type SelectProps } from "@/components/ui/select"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"
import { jornadas } from "./shared"

function Demo({ initial, ...props }: { initial: string | null } & Omit<SelectProps, "value" | "onValueChange" | "label" | "options">) {
  const [value, setValue] = useState<string | null>(initial)
  return <Select label="Jornada" options={jornadas} value={value} onValueChange={setValue} {...props} />
}

export function SelectSection() {
  const [jornada, setJornada] = useState<string | null>(null)
  return (
    <DocSection id="select" title="Select" description="Escolha de uma opção em uma lista curta.">
      <StateGrid>
        <StateCell label="Padrão (vazio)"><Select label="Jornada" options={jornadas} value={jornada} onValueChange={setJornada} placeholder="Escolha a jornada" /></StateCell>
        <StateCell label="Com valor"><Demo initial="12x36" /></StateCell>
        <StateCell label="Aberto"><Demo initial="6x1" defaultOpen modal={false} /></StateCell>
        <StateCell label="Desabilitado"><Select label="Jornada" options={jornadas} value="44h" disabled /></StateCell>
        <StateCell label="Erro"><Demo initial={null} error="Escolha uma jornada" /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { Select } from "@/components/ui/select"

const jornadas = [
  { value: "44h", label: "44h semanais" },
  { value: "12x36", label: "12x36" },
]

<Select
  label="Jornada"
  options={jornadas}
  value={jornada}
  onValueChange={setJornada}
  placeholder="Escolha a jornada"
  error={erro}
/>`}
      />
    </DocSection>
  )
}
