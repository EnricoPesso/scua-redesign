import { useEffect, useMemo, useState } from "react"
import { contarFiltrosAtivos, erroPeriodo, valoresPadrao } from "@/lib/relatorio"
import type { ConfigRelatorio, ValoresFiltro } from "./tipos"

type Status = "carregando" | "erro" | "pronto"

// Filtros em edição (rascunho) x aplicados: a busca só roda ao clicar em Filtrar.
// Cada busca cancela a anterior, então uma resposta lenta nunca sobrescreve uma mais nova.
export function useModeloRelatorio<T>(config: ConfigRelatorio<T>, hoje: string) {
  const padrao = useMemo(() => valoresPadrao(config.filtros, hoje), [config.filtros, hoje])
  const [rascunho, setRascunho] = useState<ValoresFiltro>(padrao)
  const [aplicados, setAplicados] = useState<ValoresFiltro>(padrao)
  const [tentativa, setTentativa] = useState(0)
  const [status, setStatus] = useState<Status>("carregando")
  const [rows, setRows] = useState<T[]>([])

  const { buscar } = config
  useEffect(() => {
    const controle = new AbortController()
    buscar(aplicados, controle.signal).then(
      (dados) => {
        if (controle.signal.aborted) return
        setRows(dados)
        setStatus("pronto")
      },
      () => {
        if (!controle.signal.aborted) setStatus("erro")
      },
    )
    return () => controle.abort()
  }, [buscar, aplicados, tentativa])

  function aplicar(v: ValoresFiltro) {
    setRascunho(v)
    setAplicados(v)
    setStatus("carregando")
  }

  return {
    rascunho,
    setRascunho,
    aplicados,
    status,
    rows,
    erroPeriodo: erroPeriodo(config.filtros, rascunho),
    filtrosAtivos: contarFiltrosAtivos(config.filtros, aplicados),
    filtrar: () => aplicar(rascunho),
    limpar: () => aplicar(padrao),
    tentarDeNovo: () => {
      setStatus("carregando")
      setTentativa((n) => n + 1)
    },
  }
}

export type EstadoRelatorio<T> = ReturnType<typeof useModeloRelatorio<T>>
