import { useState } from "react"
import { Select } from "@/components/ui/select"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"
import { jornadas } from "./shared"

export function SelectSection() {
  const [jornada, setJornada] = useState<string | null>(null)
  return (
    <DocSection id="select" title="Select" description="Escolha de uma opção em uma lista curta.">
      <StateGrid>
        <StateCell label="Padrão (vazio)"><Select label="Jornada" options={jornadas} value={jornada} onValueChange={setJornada} placeholder="Escolha a jornada" /></StateCell>
        <StateCell label="Com valor"><Select label="Jornada" options={jornadas} value="12x36" /></StateCell>
        <StateCell label="Aberto"><Select label="Jornada" options={jornadas} defaultOpen value="6x1" /></StateCell>
        <StateCell label="Desabilitado"><Select label="Jornada" options={jornadas} value="44h" disabled /></StateCell>
        <StateCell label="Erro"><Select label="Jornada" options={jornadas} value={null} error="Escolha uma jornada" /></StateCell>
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
