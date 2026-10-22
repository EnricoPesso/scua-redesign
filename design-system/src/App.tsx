import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Field } from "@/components/ui/field"

type Pessoa = { nome: string; cargo: string; jornada: string }

const cargos = ["Operador", "Motorista", "Analista", "Supervisor", "Técnico"]
const pessoas: Pessoa[] = Array.from({ length: 25 }, (_, i) => ({
  nome: `Colaborador ${String(i + 1).padStart(2, "0")}`,
  cargo: cargos[i % cargos.length],
  jornada: i % 3 === 0 ? "12x36" : "44h semanais",
}))

const colunas = [
  { key: "nome", header: "Nome" },
  { key: "cargo", header: "Cargo" },
  { key: "jornada", header: "Jornada" },
]

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

      <section aria-labelledby="tabelas" className="flex flex-col gap-6">
        <h2 id="tabelas" className="text-lg font-bold">Tabelas</h2>
        <DataTable columns={colunas} rows={pessoas} caption="Colaboradores (25 linhas)" />
        <DataTable columns={colunas} rows={pessoas} caption="Colaboradores carregando" loading />
        <DataTable columns={colunas} rows={[] as Pessoa[]} caption="Colaboradores sem registros" />
      </section>
    </main>
  )
}
