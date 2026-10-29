import { useMemo, useState } from "react"
import { diasAtras, HOJE, tentativas, type Tentativa } from "./dados"

// Estado comum às três variantes: filtros em edição, filtros aplicados e a simulação de estado.
// A diferença entre as variantes é só de layout; o comportamento é o mesmo.

export type Simulacao = "normal" | "carregando" | "vazio" | "erro"

export type Filtros = {
  colaboradores: string[]
  gestores: string[]
  inicio: string
  fim: string
}

export const filtrosPadrao: Filtros = { colaboradores: [], gestores: [], inicio: diasAtras(6), fim: HOJE }

const ATRASO_MS = 700

function noPeriodo(rows: Tentativa[], f: Filtros) {
  return rows.filter((r) => {
    const dia = r.horario.slice(0, 10)
    if (dia < f.inicio || dia > f.fim) return false
    if (f.colaboradores.length && !f.colaboradores.includes(r.colaborador)) return false
    if (f.gestores.length && !f.gestores.includes(r.gestor)) return false
    return true
  })
}

function resumir(rows: Tentativa[]) {
  const pessoas = new Set(rows.map((r) => r.colaborador)).size
  return {
    total: rows.length,
    colaboradores: pessoas,
    gestores: new Set(rows.map((r) => r.gestor)).size,
    media: pessoas ? rows.length / pessoas : 0,
  }
}

// Período imediatamente anterior, com a mesma duração.
function periodoAnterior(f: Filtros): Filtros {
  const ini = new Date(`${f.inicio}T12:00:00`)
  const fim = new Date(`${f.fim}T12:00:00`)
  const dias = Math.round((fim.getTime() - ini.getTime()) / 86_400_000) + 1
  const novoFim = new Date(ini)
  novoFim.setDate(novoFim.getDate() - 1)
  const novoIni = new Date(novoFim)
  novoIni.setDate(novoIni.getDate() - (dias - 1))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { ...f, inicio: iso(novoIni), fim: iso(novoFim) }
}

export const simulacoes: Simulacao[] = ["normal", "carregando", "vazio", "erro"]

// ?estado=carregando|vazio|erro força um estado para revisão e screenshot.
function lerSimulacao(): Simulacao {
  const e = new URLSearchParams(location.search).get("estado")
  return simulacoes.find((s) => s === e) ?? "normal"
}

export function useRelatorio() {
  const [rascunho, setRascunho] = useState<Filtros>(filtrosPadrao)
  const [aplicados, setAplicados] = useState<Filtros>(filtrosPadrao)
  const [buscando, setBuscando] = useState(false)
  const [simulacao, setSimulacao] = useState<Simulacao>(lerSimulacao)

  const dados = useMemo(() => {
    const rows = simulacao === "vazio" ? [] : noPeriodo(tentativas, aplicados)
    const anterior = simulacao === "vazio" ? [] : noPeriodo(tentativas, periodoAnterior(aplicados))
    return { rows, kpis: resumir(rows), kpisAnteriores: resumir(anterior) }
  }, [aplicados, simulacao])

  function filtrar(f: Filtros = rascunho) {
    setRascunho(f)
    setBuscando(true)
    window.setTimeout(() => {
      setAplicados(f)
      setBuscando(false)
    }, ATRASO_MS)
  }

  function limpar() {
    filtrar(filtrosPadrao)
  }

  const periodoInvalido = rascunho.inicio > rascunho.fim
  const pendente = JSON.stringify(rascunho) !== JSON.stringify(aplicados)
  const qtdFiltrosAtivos = aplicados.colaboradores.length + aplicados.gestores.length

  return {
    rascunho,
    setRascunho,
    aplicados,
    filtrar,
    limpar,
    periodoInvalido,
    pendente,
    qtdFiltrosAtivos,
    carregando: buscando || simulacao === "carregando",
    erro: simulacao === "erro",
    simulacao,
    setSimulacao,
    ...dados,
  }
}

export type Relatorio = ReturnType<typeof useRelatorio>
