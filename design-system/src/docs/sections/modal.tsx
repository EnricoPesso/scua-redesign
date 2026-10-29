import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function ModalSection() {
  const [excluirAberto, setExcluirAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [publicarAberto, setPublicarAberto] = useState(false)

  const excluir = () => {
    setExcluindo(true)
    window.setTimeout(() => {
      setExcluindo(false)
      setExcluirAberto(false)
    }, 1500)
  }

  return (
    <DocSection id="modal" title="Modal de confirmação" description="Pede confirmação antes de uma ação que não se desfaz ou que alcança outras pessoas.">
      <StateGrid>
        <StateCell label="Destrutivo, com carregando (confirme para ver)">
          <div><Button variant="destructive" onClick={() => setExcluirAberto(true)}>Excluir usuário</Button></div>
        </StateCell>
        <StateCell label="Padrão">
          <div><Button variant="secondary" onClick={() => setPublicarAberto(true)}>Publicar escala</Button></div>
        </StateCell>
      </StateGrid>
      <ConfirmDialog
        open={excluirAberto}
        onOpenChange={setExcluirAberto}
        title="Excluir usuário?"
        description="O usuário perde o acesso ao sistema. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={excluindo}
        onConfirm={excluir}
      />
      <ConfirmDialog
        open={publicarAberto}
        onOpenChange={setPublicarAberto}
        title="Publicar escala?"
        description="Os colaboradores recebem a escala de outubro por e-mail."
        confirmLabel="Publicar"
        onConfirm={() => setPublicarAberto(false)}
      />
      <CodeBlock
        code={`import { ConfirmDialog } from "@/components/ui/confirm-dialog"

<ConfirmDialog
  open={aberto}
  onOpenChange={setAberto}
  title="Excluir usuário?"
  description="Essa ação não pode ser desfeita."
  confirmLabel="Excluir"
  destructive
  loading={excluindo}
  onConfirm={excluir}
/>`}
      />
    </DocSection>
  )
}
