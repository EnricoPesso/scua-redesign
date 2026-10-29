// CSV para o "Exportar" dos relatórios. Separador ";" e BOM porque o Excel em pt-BR
// abre assim sem quebrar colunas nem acentos.

type ColunaCsv<T> = { header: string; texto: (row: T) => string }

const SEPARADOR = ";"
const BOM = "﻿"

function escapar(valor: string): string {
  return /[";\r\n]/.test(valor) ? `"${valor.replaceAll('"', '""')}"` : valor
}

export function gerarCsv<T>(colunas: ColunaCsv<T>[], rows: T[]): string {
  const linhas = [colunas.map((c) => escapar(c.header)), ...rows.map((r) => colunas.map((c) => escapar(c.texto(r))))]
  return BOM + linhas.map((l) => l.join(SEPARADOR)).join("\r\n")
}

export type { ColunaCsv }
