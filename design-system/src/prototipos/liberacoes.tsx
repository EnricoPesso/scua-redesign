import { Badge } from "@/components/ui/badge"
import { lerLista as lista, lerTexto as texto } from "@/lib/relatorio"
import type { ConfigRelatorio } from "@/modelos/relatorio"
import { colaboradores, formatarHorario, tentativas } from "./dados"
import { noPeriodo, simular } from "./simular"

// Relatório 5 do inventário: filtros de outro tipo (texto e seleção única), para provar o modelo.

type Liberacao = {
  id: number
  horario: string
  evento: "Liberação" | "Bloqueio"
  login: string
  dominio: string
  estacao: string
  motivo: string
}

const motivos = ["Fora da jornada", "Hora extra aprovada", "Pedido do gestor", "Feriado trabalhado", "Inatividade"]

const login = (nome: string) => nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ").slice(0, 2).join(".")

// Deriva das tentativas fictícias: cada tentativa vira um bloqueio e parte delas, uma liberação.
const liberacoes: Liberacao[] = tentativas.flatMap((t, i) => {
  const base = { login: login(t.colaborador), dominio: "SCUA", estacao: t.estacao }
  const bloqueio: Liberacao = { id: i * 2, horario: t.horario, evento: "Bloqueio", motivo: i % 2 === 0 ? motivos[0] : motivos[4], ...base }
  if (i % 3 !== 0) return [bloqueio]
  // i é múltiplo de 3 aqui; (i / 3) % 3 distribui as liberações entre os motivos 1, 2 e 3.
  return [bloqueio, { id: i * 2 + 1, horario: t.horario, evento: "Liberação", motivo: motivos[1 + ((i / 3) % 3)], ...base }]
})

const opcoesLogin = colaboradores.map((c) => ({ value: login(c.value), label: `${c.label} (${login(c.value)})` }))

export const configLiberacoes: ConfigRelatorio<Liberacao> = {
  titulo: "Liberações e bloqueios",
  grupo: "Bloqueios e liberações",
  arquivo: "liberacoes-e-bloqueios",
  vazio: "Nenhuma liberação ou bloqueio para os filtros escolhidos.",
  filtros: [
    { tipo: "multi", chave: "logins", rotulo: "Colaboradores", opcoes: opcoesLogin },
    { tipo: "texto", chave: "estacao", rotulo: "Estação", placeholder: "Ex.: DEMO-WS05" },
    { tipo: "select", chave: "evento", rotulo: "Tipo de evento", opcoes: [{ value: "Liberação", label: "Liberações" }, { value: "Bloqueio", label: "Bloqueios" }] },
    { tipo: "select", chave: "motivo", rotulo: "Motivo", opcoes: motivos.map((m) => ({ value: m, label: m })) },
    { tipo: "periodo", dias: 7 },
  ],
  kpis: [
    { rotulo: "Eventos", valor: (rows) => rows.length },
    { rotulo: "Bloqueios", valor: (rows) => rows.filter((r) => r.evento === "Bloqueio").length },
    { rotulo: "Liberações", valor: (rows) => rows.filter((r) => r.evento === "Liberação").length },
    { rotulo: "Estações envolvidas", valor: (rows) => new Set(rows.map((r) => r.estacao)).size },
  ],
  colunas: [
    { key: "horario", header: "Data e hora", render: (r) => <span className="whitespace-nowrap tabular-nums">{formatarHorario(r.horario)}</span>, texto: (r) => formatarHorario(r.horario) },
    { key: "evento", header: "Evento", render: (r) => <Badge status={r.evento === "Bloqueio" ? "danger" : "success"}>{r.evento}</Badge> },
    { key: "login", header: "Login" },
    { key: "dominio", header: "Domínio" },
    { key: "estacao", header: "Estação", render: (r) => <span className="whitespace-nowrap">{r.estacao}</span> },
    { key: "motivo", header: "Motivo" },
  ],
  buscar: simular((rows, f) => {
    const logins = lista(f, "logins")
    const estacao = texto(f, "estacao").trim().toUpperCase()
    const evento = texto(f, "evento")
    const motivo = texto(f, "motivo")
    return rows.filter(
      (r) =>
        noPeriodo(r.horario, f) &&
        (!logins.length || logins.includes(r.login)) &&
        (!estacao || r.estacao.includes(estacao)) &&
        (!evento || r.evento === evento) &&
        (!motivo || r.motivo === motivo),
    )
  }, liberacoes),
}
