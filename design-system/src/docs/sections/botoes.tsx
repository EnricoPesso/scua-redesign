import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeBlock, DocSection, StateCell, StateGrid } from "../primitives"

export function BotoesSection() {
  return (
    <DocSection id="botoes" title="Botões" description="Use para ações. Um primário por tela; o resto é secundário, fantasma ou destrutivo.">
      <StateGrid>
        <StateCell label="Primário (padrão)"><div><Button>Salvar</Button></div></StateCell>
        <StateCell label="Secundário"><div><Button variant="secondary">Cancelar</Button></div></StateCell>
        <StateCell label="Destrutivo"><div><Button variant="destructive">Excluir</Button></div></StateCell>
        <StateCell label="Fantasma"><div><Button variant="ghost">Mais ações</Button></div></StateCell>
        <StateCell label="Link"><div><Button variant="link">Ver detalhes</Button></div></StateCell>
        <StateCell label="Carregando"><div><Button loading>Enviando…</Button></div></StateCell>
        <StateCell label="Desabilitado"><div><Button disabled>Desabilitado</Button></div></StateCell>
        <StateCell label="Só ícone (exige aria-label)"><div><Button size="icon" aria-label="Adicionar"><PlusIcon /></Button></div></StateCell>
        <StateCell label="Tamanhos: padrão, lg">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Padrão</Button>
            <Button size="lg">Grande</Button>
          </div>
        </StateCell>
      </StateGrid>
      <p className="text-sm text-muted-foreground">Hover e foco: passe o mouse ou use Tab em qualquer botão acima.</p>
      <CodeBlock
        code={`import { Button } from "@/components/ui/button"

<Button onClick={salvar}>Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="destructive" loading={excluindo}>Excluir</Button>
// variant: primary | secondary | destructive | ghost | link
// size: default | lg | icon`}
      />
    </DocSection>
  )
}
