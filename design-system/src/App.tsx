import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    </main>
  )
}
