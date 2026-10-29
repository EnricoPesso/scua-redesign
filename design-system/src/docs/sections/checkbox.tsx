import { Checkbox } from "@/components/ui/checkbox"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function CheckboxSection() {
  return (
    <DocSection id="checkbox" title="Checkbox" description="Marcar itens independentes ou selecionar vários em uma lista.">
      <StateGrid>
        <StateCell label="Desmarcado"><Checkbox label="Receber aviso" /></StateCell>
        <StateCell label="Marcado"><Checkbox label="Receber aviso" defaultChecked /></StateCell>
        <StateCell label="Indeterminado"><Checkbox label="Selecionar todos" indeterminate /></StateCell>
        <StateCell label="Desabilitado"><Checkbox label="Receber aviso" disabled /></StateCell>
        <StateCell label="Marcado e desabilitado"><Checkbox label="Receber aviso" disabled defaultChecked /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { Checkbox } from "@/components/ui/checkbox"

<Checkbox label="Receber aviso" checked={aviso} onCheckedChange={setAviso} />`}
      />
    </DocSection>
  )
}
