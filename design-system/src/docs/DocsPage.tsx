import type { ComponentType } from "react"
import { TokensSection } from "./sections/tokens"
import { BotoesSection } from "./sections/botoes"
import { CampoSection } from "./sections/campo"
import { SelectSection } from "./sections/select"
import { MultiSelectSection } from "./sections/multi-select"
import { CampoDeDataSection } from "./sections/campo-de-data"
import { CheckboxSection } from "./sections/checkbox"
import { ToggleSection } from "./sections/toggle"
import { BadgeSection } from "./sections/badge"
import { KpiCardSection } from "./sections/kpi-card"
import { TabelaSection } from "./sections/tabela"
import { DrawerSection } from "./sections/drawer"
import { ModalSection } from "./sections/modal"
import { ToastSection } from "./sections/toast"
import { EstadosSection } from "./sections/estados"
import { SkeletonSection } from "./sections/skeleton"

const secoes: { id: string; titulo: string; Componente: ComponentType }[] = [
  { id: "tokens", titulo: "Tokens", Componente: TokensSection },
  { id: "botoes", titulo: "Botões", Componente: BotoesSection },
  { id: "campo", titulo: "Campo", Componente: CampoSection },
  { id: "select", titulo: "Select", Componente: SelectSection },
  { id: "multi-select", titulo: "Multi-select", Componente: MultiSelectSection },
  { id: "campo-de-data", titulo: "Campo de data", Componente: CampoDeDataSection },
  { id: "checkbox", titulo: "Checkbox", Componente: CheckboxSection },
  { id: "toggle", titulo: "Toggle", Componente: ToggleSection },
  { id: "badge", titulo: "Badge", Componente: BadgeSection },
  { id: "kpi-card", titulo: "Card de KPI", Componente: KpiCardSection },
  { id: "tabela", titulo: "Tabela", Componente: TabelaSection },
  { id: "drawer", titulo: "Drawer", Componente: DrawerSection },
  { id: "modal", titulo: "Modal de confirmação", Componente: ModalSection },
  { id: "toast", titulo: "Toast", Componente: ToastSection },
  { id: "estados", titulo: "Estado vazio e erro", Componente: EstadosSection },
  { id: "skeleton", titulo: "Skeleton", Componente: SkeletonSection },
]

const linkClasse =
  "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-[var(--color-brand-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"

export default function DocsPage() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only rounded-md bg-card px-4 py-2 text-sm font-semibold text-[var(--color-brand-text)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus-visible:ring-3 focus-visible:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-2 lg:col-span-2">
          <h1 className="text-2xl font-bold">Design system Scua Logon</h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Tokens e componentes do Logon. Ache o componente, veja os estados e copie o uso.
          </p>
        </header>
        <nav
          aria-label="Componentes"
          className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto"
        >
          <ul className="flex list-none flex-wrap gap-x-1 gap-y-0 p-0 lg:flex-col">
            {secoes.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={linkClasse}>{s.titulo}</a>
              </li>
            ))}
          </ul>
        </nav>
        <main id="conteudo" tabIndex={-1} className="flex min-w-0 flex-col gap-14 outline-none">
          {secoes.map(({ id, Componente }) => <Componente key={id} />)}
        </main>
      </div>
    </>
  )
}
