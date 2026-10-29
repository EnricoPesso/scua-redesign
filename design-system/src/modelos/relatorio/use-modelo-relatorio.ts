import { useEffect, useRef, useState } from "react"
import { erroPeriodo, valoresPadrao } from "@/lib/relatorio"
import type { ConfigRelatorio, ValoresFiltro } from "./tipos"

type Status = "carregando" | "erro" | "pronto"

// Filtros em edição (rascunho) x aplicados: a busca só roda ao clicar em Filtrar.
// Cada busca cancela a anterior, então uma resposta lenta nunca sobrescreve uma mais nova.
export function useModeloRelatorio<T>(config: ConfigRelatorio<T>, hoje: string) {
  const [padrao, setPadrao] = useState(() => valoresPadrao(config.filtros, hoje))
  const [rascunho, setRascunho] = useState<ValoresFiltro>(padrao)
  const [aplicados, setAplicados] = useState<ValoresFiltro>(padrao)
  // Cada Filtrar/Limpar/Tentar de novo incrementa: a busca roda mesmo com filtros iguais.
  const [busca, setBusca] = useState(0)
  const [status, setStatus] = useState<Status>("carregando")
  const [rows, setRows] = useState<T[]>([])

  // Trocou de relatório (outros filtros) sem remontar: volta aos padrões do novo.
  const [filtrosAnteriores, setFiltrosAnteriores] = useState(config.filtros)
  if (filtrosAnteriores !== config.filtros) {
    const novo = valoresPadrao(config.filtros, hoje)
    setFiltrosAnteriores(config.filtros)
    setPadrao(novo)
    setRascunho(novo)
    setAplicados(novo)
    setStatus("carregando")
    setBusca((n) => n + 1)
  }

  // A busca mais recente fica numa ref: um config recriado a cada render não dispara nova busca.
  const buscarRef = useRef(config.buscar)
  useEffect(() => {
    buscarRef.current = config.buscar
  })

  useEffect(() => {
    const controle = new AbortController()
    buscarRef.current(aplicados, controle.signal).then(
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
  }, [aplicados, busca])

  function aplicar(v: ValoresFiltro) {
    setRascunho(v)
    setAplicados(v)
    setStatus("carregando")
    setBusca((n) => n + 1)
  }

  return {
    rascunho,
    setRascunho,
    aplicados,
    status,
    rows,
    erroPeriodo: erroPeriodo(config.filtros, rascunho),
    // Qualquer diferença do padrão, inclusive só o período, permite "Limpar filtros".
    alterado: JSON.stringify(aplicados) !== JSON.stringify(padrao),
    filtrar: () => aplicar(rascunho),
    limpar: () => aplicar(padrao),
    tentarDeNovo: () => aplicar(aplicados),
  }
}

export type EstadoRelatorio<T> = ReturnType<typeof useModeloRelatorio<T>>
