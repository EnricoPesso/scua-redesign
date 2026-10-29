import { Badge } from "@/components/ui/badge"
import type { ConfigRelatorio } from "@/modelos/relatorio"
import { colaboradores, formatarHorario, gestores, tentativas, type Tentativa } from "./dados"
import { lista, noPeriodo, simular } from "./simular"

// Relatório 8 do inventário, configurado no modelo único.
export const configTentativas: ConfigRelatorio<Tentativa> = {
  titulo: "Tentativas de acesso fora da jornada",
  grupo: "Bloqueios e liberações",
  arquivo: "tentativas-fora-da-jornada",
  vazio: "Nenhuma tentativa fora da jornada nesse período.",
  filtros: [
    { tipo: "multi", chave: "colaboradores", rotulo: "Colaboradores", opcoes: colaboradores },
    { tipo: "multi", chave: "gestores", rotulo: "Gestores", opcoes: gestores },
    { tipo: "periodo", dias: 7 },
  ],
  kpis: [
    { rotulo: "Tentativas", valor: (rows) => rows.length },
    { rotulo: "Colaboradores", valor: (rows) => new Set(rows.map((r) => r.colaborador)).size },
    { rotulo: "Gestores com equipe envolvida", valor: (rows) => new Set(rows.map((r) => r.gestor)).size },
    {
      rotulo: "Média por colaborador",
      decimais: 1,
      valor: (rows) => {
        const pessoas = new Set(rows.map((r) => r.colaborador)).size
        return pessoas ? rows.length / pessoas : 0
      },
    },
  ],
  colunas: [
    { key: "colaborador", header: "Colaborador" },
    { key: "gestor", header: "Gestor" },
    { key: "estacao", header: "Estação", render: (r) => <span className="whitespace-nowrap">{r.estacao}</span> },
    { key: "evento", header: "Evento", render: (r) => <Badge status={r.evento.startsWith("Logon") ? "warning" : "info"}>{r.evento}</Badge> },
    {
      key: "horario",
      header: "Data e hora",
      render: (r) => <span className="whitespace-nowrap tabular-nums">{formatarHorario(r.horario)}</span>,
      texto: (r) => formatarHorario(r.horario),
    },
  ],
  buscar: simular((rows, f) => {
    const cs = lista(f, "colaboradores")
    const gs = lista(f, "gestores")
    return rows.filter((r) => noPeriodo(r.horario, f) && (!cs.length || cs.includes(r.colaborador)) && (!gs.length || gs.includes(r.gestor)))
  }, tentativas),
}
