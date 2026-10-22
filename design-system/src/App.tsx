import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"

export default function App() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <section aria-labelledby="botoes" className="flex flex-col gap-3">
        <h2 id="botoes" className="text-lg font-bold">Botões</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Salvar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="destructive">Excluir</Button>
          <Button variant="ghost">Mais</Button>
          <Button loading>Enviando</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="icon" aria-label="Adicionar"><PlusIcon /></Button>
        </div>
      </section>

      <section aria-labelledby="campos" className="flex flex-col gap-3">
        <h2 id="campos" className="text-lg font-bold">Campos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" inputProps={{ placeholder: "Nome completo" }} />
          <Field label="Nome com dica" hint="Como aparece no relatório" />
          <Field label="E-mail" error="Informe um e-mail válido" inputProps={{ defaultValue: "maria@" }} />
          <Field label="Matrícula" inputProps={{ disabled: true, defaultValue: "000123" }} />
        </div>
      </section>
    </main>
  )
}
