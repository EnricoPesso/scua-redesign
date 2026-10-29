import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { Field } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { CodeBlock, DocSection, StateCell } from "../primitives"
import { jornadas } from "./shared"

export function DrawerSection() {
  const [aberto, setAberto] = useState(false)
  const [jornada, setJornada] = useState<string | null>(null)
  return (
    <DocSection id="drawer" title="Drawer" description="Painel lateral para ver ou editar um registro sem sair da lista.">
      <StateCell label="Fechado e aberto (clique para abrir)">
        <div><Button variant="secondary" onClick={() => setAberto(true)}>Abrir painel</Button></div>
      </StateCell>
      <Drawer
        open={aberto}
        onOpenChange={setAberto}
        title="Detalhes do colaborador"
        description="Edite os dados e salve para aplicar."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={() => setAberto(false)}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nome" inputProps={{ defaultValue: "Colaborador 01" }} />
          <Select label="Jornada" options={jornadas} value={jornada} onValueChange={setJornada} placeholder="Escolha a jornada" />
          <Toggle label="Ativo" defaultChecked />
        </div>
      </Drawer>
      <CodeBlock
        code={`import { Drawer } from "@/components/ui/drawer"

<Drawer
  open={aberto}
  onOpenChange={setAberto}
  title="Detalhes do colaborador"
  description="Edite os dados e salve para aplicar."
  footer={<Button onClick={salvar}>Salvar</Button>}
>
  {/* campos */}
</Drawer>`}
      />
    </DocSection>
  )
}
