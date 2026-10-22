import { Toggle } from "@/components/ui/toggle"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function ToggleSection() {
  return (
    <DocSection id="toggle" title="Toggle" description="Liga ou desliga uma configuração com efeito imediato.">
      <StateGrid>
        <StateCell label="Desligado"><Toggle label="Ativo" /></StateCell>
        <StateCell label="Ligado"><Toggle label="Ativo" defaultChecked /></StateCell>
        <StateCell label="Desabilitado"><Toggle label="Ativo" disabled /></StateCell>
        <StateCell label="Ligado e desabilitado"><Toggle label="Ativo" disabled defaultChecked /></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { Toggle } from "@/components/ui/toggle"

<Toggle label="Ativo" checked={ativo} onCheckedChange={setAtivo} />`}
      />
    </DocSection>
  )
}
