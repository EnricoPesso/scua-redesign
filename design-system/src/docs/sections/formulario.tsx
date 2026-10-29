import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DateField } from "@/components/ui/date-field"
import { Field } from "@/components/ui/field"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { CodeBlock, DocSection, StateCell } from "../primitives"
import { jornadas } from "./shared"

const VAZIO = "Nada enviado ainda. Preencha e use Enviar."

function serializar(data: FormData) {
  const linhas = Array.from(data.entries(), ([chave, valor]) => `${chave} = ${typeof valor === "string" ? valor : valor.name}`)
  return linhas.length ? linhas.join("\n") : "(nenhum campo enviou valor)"
}

export function FormularioSection() {
  const [resultado, setResultado] = useState(VAZIO)
  const [rodada, setRodada] = useState(0)

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResultado(serializar(new FormData(e.currentTarget)))
  }

  const limpar = () => {
    setRodada((r) => r + 1)
    setResultado(VAZIO)
  }

  return (
    <DocSection
      id="formulario"
      title="Formulário"
      description="Select, MultiSelect, Checkbox e Toggle aceitam name, required e id e participam do envio nativo do formulário, sem estado controlado."
    >
      <StateCell label="Formulário real, com FormData">
        <form key={rodada} onSubmit={enviar} className="flex flex-col gap-4">
          <Field label="Matrícula" name="matricula" inputProps={{ required: true, autoComplete: "off" }} />
          <DateField label="Data de admissão" name="admissao" defaultValue="2026-01-01" />
          <Select label="Jornada" name="jornada" options={jornadas} defaultValue="12x36" required />
          <MultiSelect label="Jornadas permitidas" name="permitidas" options={jornadas} defaultValues={["44h", "5x2"]} />
          <Checkbox label="Receber aviso de escala" name="aviso" defaultChecked />
          <Toggle label="Banco de horas ativo" name="bancoDeHoras" defaultChecked />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Enviar</Button>
            <Button type="button" variant="secondary" onClick={limpar}>Limpar</Button>
          </div>
        </form>
        <pre
          role="region"
          tabIndex={0}
          aria-label="Dados enviados (FormData)"
          aria-live="polite"
          className="overflow-x-auto rounded-md border border-border bg-[var(--color-surface-muted)] p-3 font-mono text-sm leading-relaxed"
        >
          {resultado}
        </pre>
        <p className="text-sm text-muted-foreground">
          Checkbox e Toggle desmarcados não enviam nada, como no HTML nativo. Matrícula e Jornada são obrigatórios: o navegador impede o envio se estiverem vazios.
        </p>
      </StateCell>
      <CodeBlock
        code={`<form onSubmit={(e) => { e.preventDefault(); salvar(new FormData(e.currentTarget)) }}>
  <Field label="Matrícula" name="matricula" inputProps={{ required: true }} />
  <DateField label="Data de admissão" name="admissao" />
  <Select label="Jornada" name="jornada" options={jornadas} defaultValue="12x36" required />
  <MultiSelect label="Jornadas permitidas" name="permitidas" options={jornadas} defaultValues={["44h"]} />
  <Checkbox label="Receber aviso" name="aviso" defaultChecked />
  <Toggle label="Banco de horas" name="bancoDeHoras" defaultChecked />
  <Button type="submit">Enviar</Button>
</form>

// Select: onValueChange recebe string | null
// MultiSelect envia um campo por valor (permitidas = 44h, permitidas = 5x2)`}
      />
    </DocSection>
  )
}
