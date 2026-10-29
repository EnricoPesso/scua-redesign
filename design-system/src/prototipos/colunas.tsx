import { Badge } from "@/components/ui/badge"
import type { Column } from "@/components/ui/data-table"
import { formatarData, formatarHorario, type Tentativa } from "./dados"
import type { Relatorio } from "./use-relatorio"

export const TITULO = "Tentativas de acesso fora da jornada"

export const colunas: Column<Tentativa>[] = [
  { key: "colaborador", header: "Colaborador" },
  { key: "gestor", header: "Gestor" },
  { key: "estacao", header: "Estação", render: (r) => <span className="whitespace-nowrap">{r.estacao}</span> },
  {
    key: "evento",
    header: "Evento",
    render: (r) => <Badge status={r.evento.startsWith("Logon") ? "warning" : "info"}>{r.evento}</Badge>,
  },
  { key: "horario", header: "Data e hora", render: (r) => <span className="whitespace-nowrap tabular-nums">{formatarHorario(r.horario)}</span> },
]

export function periodoTexto(r: Relatorio) {
  return `${formatarData(r.aplicados.inicio)} a ${formatarData(r.aplicados.fim)}`
}
