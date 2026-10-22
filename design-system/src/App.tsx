import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Field } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { DateField } from "@/components/ui/date-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Toggle } from "@/components/ui/toggle"
import { Badge } from "@/components/ui/badge"
import { KpiCard } from "@/components/ui/kpi-card"
import { Drawer } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"

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

const jornadas = [
  { value: "44h", label: "44h semanais" },
  { value: "12x36", label: "12x36" },
  { value: "6x1", label: "6x1" },
  { value: "5x2", label: "5x2" },
]

export default function App() {
  const [jornada, setJornada] = useState<string | null>(null)
  const [turnos, setTurnos] = useState<string[]>([])
  const [drawerAberto, setDrawerAberto] = useState(false)
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

      <section aria-labelledby="selects" className="flex flex-col gap-3">
        <h2 id="selects" className="text-lg font-bold">Select</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Padrão (vazio)" options={jornadas} value={jornada} onValueChange={setJornada} placeholder="Escolha a jornada" />
          <Select label="Com valor" options={jornadas} defaultOpen={false} value="12x36" />
          <Select label="Aberto" options={jornadas} defaultOpen value="6x1" />
          <Select label="Desabilitado" options={jornadas} value="44h" disabled />
          <Select label="Com erro" options={jornadas} value={null} error="Escolha uma jornada" />
        </div>
      </section>

      <section aria-labelledby="multiselects" className="flex flex-col gap-3">
        <h2 id="multiselects" className="text-lg font-bold">Multi-select</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MultiSelect label="Padrão (vazio)" options={jornadas} values={turnos} onValuesChange={setTurnos} placeholder="Buscar jornadas" />
          <MultiSelect label="Vários selecionados" options={jornadas} values={["44h", "12x36", "6x1"]} />
          <MultiSelect label="Aberto" options={jornadas} defaultOpen values={["5x2"]} />
          <MultiSelect label="Sem resultado (digite xyz)" options={jornadas} defaultOpen />
          <MultiSelect label="Com erro" options={jornadas} values={[]} error="Escolha ao menos uma jornada" />
        </div>
      </section>

      <section aria-labelledby="datas" className="flex flex-col gap-3">
        <h2 id="datas" className="text-lg font-bold">Campo de data</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="Início" hint="Use o formato do navegador" min="2026-01-01" max="2026-12-31" />
          <DateField label="Fim com erro" error="A data final é anterior à inicial" defaultValue="2026-01-01" />
          <DateField label="Desabilitado" disabled defaultValue="2026-10-22" />
        </div>
      </section>

      <section aria-labelledby="checkboxes" className="flex flex-col gap-1">
        <h2 id="checkboxes" className="text-lg font-bold">Checkbox</h2>
        <Checkbox label="Desmarcado" />
        <Checkbox label="Marcado" defaultChecked />
        <Checkbox label="Indeterminado" indeterminate />
        <Checkbox label="Desabilitado" disabled />
        <Checkbox label="Marcado e desabilitado" disabled defaultChecked />
      </section>

      <section aria-labelledby="toggles" className="flex flex-col gap-1">
        <h2 id="toggles" className="text-lg font-bold">Toggle</h2>
        <Toggle label="Desligado" />
        <Toggle label="Ligado" defaultChecked />
        <Toggle label="Desabilitado" disabled />
        <Toggle label="Ligado e desabilitado" disabled defaultChecked />
      </section>

      <section aria-labelledby="badges" className="flex flex-col gap-3">
        <h2 id="badges" className="text-lg font-bold">Badge</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge status="success">Aprovado</Badge>
          <Badge status="warning">Pendente</Badge>
          <Badge status="danger">Recusado</Badge>
          <Badge status="info">Em análise</Badge>
          <Badge status="neutral">Rascunho</Badge>
        </div>
      </section>

      <section aria-labelledby="kpis" className="flex flex-col gap-3">
        <h2 id="kpis" className="text-lg font-bold">Card de KPI</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Horas extras" value={1234.5} decimals={1} unit="h" period="Setembro de 2026" />
          <KpiCard label="Marcações" value={0} period="Setembro de 2026" loading />
          <KpiCard label="Faltas" value={0} period="Setembro de 2026" empty />
        </div>
      </section>

      <section aria-labelledby="skeletons" className="flex flex-col gap-3">
        <h2 id="skeletons" className="text-lg font-bold">Skeleton</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2" aria-busy="true">
            <p className="text-sm text-muted-foreground">Linha</p>
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex flex-col gap-2" aria-busy="true">
            <p className="text-sm text-muted-foreground">Bloco</p>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5" aria-busy="true">
            <p className="text-sm text-muted-foreground">Card</p>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </section>

      <section aria-labelledby="drawer" className="flex flex-col gap-3">
        <h2 id="drawer" className="text-lg font-bold">Drawer</h2>
        <div>
          <Button variant="secondary" onClick={() => setDrawerAberto(true)}>Abrir painel</Button>
        </div>
        <Drawer
          open={drawerAberto}
          onOpenChange={setDrawerAberto}
          title="Detalhes do colaborador"
          description="Edite os dados e salve para aplicar."
          footer={
            <>
              <Button variant="secondary" onClick={() => setDrawerAberto(false)}>Cancelar</Button>
              <Button onClick={() => setDrawerAberto(false)}>Salvar</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Nome" inputProps={{ defaultValue: "Colaborador 01" }} />
            <Select label="Jornada" options={jornadas} value={jornada} onValueChange={setJornada} placeholder="Escolha a jornada" />
            <Toggle label="Ativo" defaultChecked />
          </div>
        </Drawer>
      </section>
    </main>
  )
}
