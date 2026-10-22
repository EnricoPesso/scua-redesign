import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function ToastSection() {
  const toast = useToast()
  return (
    <DocSection id="toast" title="Toast" description="Aviso curto que some sozinho, depois de uma ação. Exige o ToastProvider na raiz (já está em main.tsx).">
      <StateGrid className="sm:grid-cols-3">
        <StateCell label="Sucesso"><div><Button variant="secondary" onClick={() => toast.success("Escala publicada com sucesso")}>Disparar</Button></div></StateCell>
        <StateCell label="Erro"><div><Button variant="secondary" onClick={() => toast.error("Não foi possível salvar. Tente de novo.")}>Disparar</Button></div></StateCell>
        <StateCell label="Informação"><div><Button variant="secondary" onClick={() => toast.info("Você tem 3 solicitações pendentes")}>Disparar</Button></div></StateCell>
      </StateGrid>
      <CodeBlock
        code={`import { useToast } from "@/components/ui/use-toast"

const toast = useToast()
toast.success("Escala publicada com sucesso")
toast.error("Não foi possível salvar. Tente de novo.")
toast.info("Você tem 3 solicitações pendentes")`}
      />
    </DocSection>
  )
}
