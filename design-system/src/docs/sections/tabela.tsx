import { DataTable } from "@/components/ui/data-table"
import { CodeBlock, DocSection, StateCell } from "../primitives"

type Pessoa = { nome: string; cargo: string; jornada: string; horas: number }

// Tipos declarados com interface também servem como linha.
interface Escala {
  turno: string
  equipe: string
  vagas: number
}

const escalas: Escala[] = [
  { turno: "Manhã", equipe: "Operação", vagas: 12 },
  { turno: "Tarde", equipe: "Operação", vagas: 9 },
  { turno: "Noite", equipe: "Plantão", vagas: 4 },
]

const colunasEscala = [
  { key: "turno", header: "Turno" },
  { key: "equipe", header: "Equipe" },
  { key: "vagas", header: "Vagas", numeric: true },
]

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
      <StateCell label="Linhas tipadas com interface"><DataTable columns={colunasEscala} rows={escalas} caption="Escalas por turno" /></StateCell>
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

// rows aceita type ou interface (T extends object)
// Trocar a referência de rows volta para a página 1; mantenha o array estável (useMemo/estado)
// Anterior/Próxima ficam aria-disabled no limite e mantêm o foco no botão
// Column: { key, header, render?, numeric? }
// numeric: alinha cabeçalho e células à direita, com dígitos tabulares`}
      />
    </DocSection>
  )
}
