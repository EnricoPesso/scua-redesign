import { Field } from "@/components/ui/field"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function CampoSection() {
  return (
    <DocSection id="campo" title="Campo" description="Texto de uma linha com rótulo, dica e mensagem de erro.">
      <StateGrid>
        <StateCell label="Padrão"><Field label="Nome" inputProps={{ placeholder: "Nome completo" }} /></StateCell>
        <StateCell label="Com dica"><Field label="Nome com dica" hint="Como aparece no relatório" /></StateCell>
        <StateCell label="Erro"><Field label="E-mail" error="Informe um e-mail válido" inputProps={{ defaultValue: "maria@" }} /></StateCell>
        <StateCell label="Desabilitado"><Field label="Matrícula" inputProps={{ disabled: true, defaultValue: "000123" }} /></StateCell>
      </StateGrid>
      <p className="text-sm text-muted-foreground">Foco: clique ou use Tab para ver o anel.</p>
      <CodeBlock
        code={`import { Field } from "@/components/ui/field"

<Field
  label="E-mail"
  hint="Usado para avisos"
  error={erro}
  inputProps={{ type: "email", value, onChange }}
/>`}
      />
    </DocSection>
  )
}
