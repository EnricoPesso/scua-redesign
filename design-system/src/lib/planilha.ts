// Exportação de listas para abrir no Excel: regras puras (sem DOM, testadas com node --test).
// O download fica em `components/exportar-planilha.ts`. Ponto único: todas as telas usam estas funções.
//
// Hoje gera CSV (separador ";", BOM UTF-8, abre direto no Excel em português). A decisão é gerar .xlsx;
// quando a biblioteca de planilha puder ser instalada, só `conteudoDaPlanilha` e `EXTENSAO_PLANILHA` mudam.
import { gerarCsv, type ColunaCsv } from "./csv.ts"

export type ColunaPlanilha<T> = ColunaCsv<T>

export const EXTENSAO_PLANILHA = "csv"

/** Nome final do arquivo: tira a extensão que vier e põe a da planilha. */
export function nomeDaPlanilha(base: string): string {
  return `${base.replace(/\.[a-z0-9]+$/i, "")}.${EXTENSAO_PLANILHA}`
}

/** Conteúdo e tipo do arquivo. Puro (sem DOM), para poder ser testado em Node. */
export function conteudoDaPlanilha<T>(colunas: ColunaPlanilha<T>[], linhas: T[]): { dados: string | Uint8Array; tipo: string } {
  return { dados: gerarCsv(colunas, linhas), tipo: "text/csv;charset=utf-8" }
}
