// CSV para o "Exportar" dos relatórios. Separador ";" e BOM porque o Excel em pt-BR
// abre assim sem quebrar colunas nem acentos.

type ColunaCsv<T> = { header: string; texto: (row: T) => string }

const SEPARADOR = ";"
const BOM = "﻿"

// Texto livre (justificativas, motivos) pode começar com "=", "+", "-" ou "@" e o Excel
// executaria como fórmula. O apóstrofo força texto. Número puro (ex.: -3) passa direto.
function neutralizarFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) && !/^-?\d+([.,]\d+)?$/.test(valor) ? `'${valor}` : valor
}

function escapar(bruto: string): string {
  const valor = neutralizarFormula(bruto)
  return /[";\r\n]/.test(valor) ? `"${valor.replaceAll('"', '""')}"` : valor
}

export function gerarCsv<T>(colunas: ColunaCsv<T>[], rows: T[]): string {
  const linhas = [colunas.map((c) => escapar(c.header)), ...rows.map((r) => colunas.map((c) => escapar(c.texto(r))))]
  return BOM + linhas.map((l) => l.join(SEPARADOR)).join("\r\n")
}

export type { ColunaCsv }
