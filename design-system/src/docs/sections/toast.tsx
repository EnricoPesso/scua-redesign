import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function ToastSection() {
  const toast = useToast()
  return (
    <DocSection id="toast" title="Toast" description="Aviso curto depois de uma ação. Sucesso e informação somem em 5 segundos; o de erro fica até a pessoa fechar. Exige o ToastProvider na raiz (já está em main.tsx).">
      <StateGrid className="sm:grid-cols-3">
        <StateCell label="Sucesso"><div><Button variant="secondary" onClick={() => toast.success("Escala publicada com sucesso")}>Mostrar toast de sucesso</Button></div></StateCell>
        <StateCell label="Erro (fica até fechar)"><div><Button variant="secondary" onClick={() => toast.error("Não foi possível salvar. Tente de novo.")}>Mostrar toast de erro</Button></div></StateCell>
        <StateCell label="Informação"><div><Button variant="secondary" onClick={() => toast.info("Você tem 3 solicitações pendentes")}>Mostrar toast de informação</Button></div></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { useToast } from "@/components/ui/use-toast"

const toast = useToast()
toast.success("Escala publicada com sucesso")
toast.error("Não foi possível salvar. Tente de novo.") // não some sozinho: fica até fechar
toast.info("Você tem 3 solicitações pendentes")`}
      />
    </DocSection>
  )
}
