import { DataTable } from "@/components/ui/data-table"
import { CodeBlock, DocSection, StateCell } from "../primitives"

type Pessoa = { nome: string; cargo: string; jornada: string; horas: number }

const cargos = ["Operador", "Motorista", "Analista", "Supervisor", "Técnico"]
const pessoas: Pessoa[] = Array.from({ length: 25 }, (_, i) => ({
  nome: `Colaborador ${String(i + 1).padStart(2, "0")}`,
  cargo: cargos[i % cargos.length],
  jornada: i % 3 === 0 ? "12x36" : "44h semanais",
  horas: 160 + (i % 5) * 8,
}))

const colunas = [
  { key: "nome", header: "Nome" },
  { key: "cargo", header: "Cargo" },
  { key: "jornada", header: "Jornada" },
  { key: "horas", header: "Horas", numeric: true },
]

export function TabelaSection() {
  return (
    <DocSection id="tabela" title="Tabela" description="Lista de registros com paginação. Toda tabela precisa de legenda (caption).">
      <StateCell label="Padrão, com paginação (25 linhas)"><DataTable columns={colunas} rows={pessoas} caption="Colaboradores (25 linhas)" /></StateCell>
      <StateCell label="Carregando"><DataTable columns={colunas} rows={pessoas} caption="Colaboradores carregando" loading /></StateCell>
      <StateCell label="Vazia"><DataTable columns={colunas} rows={[] as Pessoa[]} caption="Colaboradores sem registros" /></StateCell>
      <CodeBlock
        code={`import { DataTable } from "@/components/ui/data-table"

const colunas = [
  { key: "nome", header: "Nome" },
  { key: "cargo", header: "Cargo", render: (p) => <strong>{p.cargo}</strong> },
  { key: "horas", header: "Horas", numeric: true }, // alinha à direita, dígitos tabulares
]

<DataTable
  columns={colunas}
  rows={pessoas}
  caption="Colaboradores"
  pageSize={10}
  loading={carregando}
  empty={<EmptyState title="Nenhum colaborador" />}
/>

// Column: { key, header, render?, numeric? }
// numeric: alinha cabeçalho e células à direita, com dígitos tabulares`}
      />
    </DocSection>
  )
}
