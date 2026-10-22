import { Badge } from "@/components/ui/badge"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function BadgeSection() {
  return (
    <DocSection id="badge" title="Badge" description="Mostra o status de um registro em uma palavra.">
      <StateGrid>
        <StateCell label="Sucesso"><div><Badge status="success">Aprovado</Badge></div></StateCell>
        <StateCell label="Atenção"><div><Badge status="warning">Pendente</Badge></div></StateCell>
        <StateCell label="Perigo"><div><Badge status="danger">Recusado</Badge></div></StateCell>
        <StateCell label="Informação"><div><Badge status="info">Em análise</Badge></div></StateCell>
        <StateCell label="Neutro"><div><Badge status="neutral">Rascunho</Badge></div></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { Badge } from "@/components/ui/badge"

<Badge status="success">Aprovado</Badge>
// status: success | warning | danger | info | neutral`}
      />
    </DocSection>
  )
}
