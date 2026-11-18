import { test } from "node:test"
import assert from "node:assert/strict"
import { EXTENSAO_PLANILHA, conteudoDaPlanilha, nomeDaPlanilha } from "./planilha.ts"

type Linha = { nome: string; ativo: boolean }
const colunas = [
  { header: "Nome", texto: (r: Linha) => r.nome },
  { header: "Ativo", texto: (r: Linha) => (r.ativo ? "Sim" : "Não") },
]

test("nome do arquivo: troca qualquer extensão pela da planilha", () => {
  assert.equal(nomeDaPlanilha("usuarios"), `usuarios.${EXTENSAO_PLANILHA}`)
  assert.equal(nomeDaPlanilha("auditoria-jornadas-2026-10-12.csv"), `auditoria-jornadas-2026-10-12.${EXTENSAO_PLANILHA}`)
  assert.equal(nomeDaPlanilha("relatorio_2026-10-01_a_2026-10-31.csv"), `relatorio_2026-10-01_a_2026-10-31.${EXTENSAO_PLANILHA}`)
})

test("conteúdo: cabeçalho e uma linha por item, com o texto de cada coluna", () => {
  const { dados, tipo } = conteudoDaPlanilha(colunas, [{ nome: "Ana", ativo: true }, { nome: "João", ativo: false }])
  assert.match(tipo, /csv|spreadsheet/)
  const texto = String(dados).replace("﻿", "")
  assert.deepEqual(texto.split("\r\n"), ["Nome;Ativo", "Ana;Sim", "João;Não"])
})

test("conteúdo: neutraliza fórmula (herdado de gerarCsv)", () => {
  const { dados } = conteudoDaPlanilha(colunas, [{ nome: "=1+1", ativo: true }])
  assert.match(String(dados), /'=1\+1/)
})
