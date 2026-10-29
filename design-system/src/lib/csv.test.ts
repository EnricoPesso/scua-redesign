import { test } from "node:test"
import assert from "node:assert/strict"
import { gerarCsv } from "./csv.ts"

type Linha = { nome: string; qtd: number }
const colunas = [
  { header: "Nome", texto: (r: Linha) => r.nome },
  { header: "Quantidade", texto: (r: Linha) => String(r.qtd) },
]

test("começa com BOM e usa ; e CRLF", () => {
  const csv = gerarCsv(colunas, [{ nome: "Ana", qtd: 2 }])
  assert.equal(csv, "﻿Nome;Quantidade\r\nAna;2")
})

test("sem linhas gera só o cabeçalho", () => {
  assert.equal(gerarCsv(colunas, []), "﻿Nome;Quantidade")
})

test("valor com ; aspas ou quebra de linha vai entre aspas, com aspas dobradas", () => {
  const csv = gerarCsv(colunas, [
    { nome: "Silva; Ana", qtd: 1 },
    { nome: 'Disse "oi"', qtd: 1 },
    { nome: "linha\nnova", qtd: 1 },
  ])
  const [, a, b, c] = csv.slice(1).split("\r\n")
  assert.equal(a, '"Silva; Ana";1')
  assert.equal(b, '"Disse ""oi""";1')
  assert.equal(c, '"linha\nnova";1')
})

test("texto que o Excel leria como fórmula ganha apóstrofo", () => {
  const linhas = gerarCsv(colunas, [
    { nome: '=HYPERLINK("http://x","clique")', qtd: 1 },
    { nome: "+55 11 9999", qtd: 1 },
    { nome: "@SUM(A1)", qtd: 1 },
    { nome: "-cmd", qtd: 1 },
  ]).slice(1).split("\r\n")
  assert.equal(linhas[1], `"'=HYPERLINK(""http://x"",""clique"")";1`)
  assert.equal(linhas[2], "'+55 11 9999;1")
  assert.equal(linhas[3], "'@SUM(A1);1")
  assert.equal(linhas[4], "'-cmd;1")
})

test("número negativo não é tratado como fórmula", () => {
  assert.equal(gerarCsv(colunas, [{ nome: "-3", qtd: -2 }]).split("\r\n")[1], "-3;-2")
  assert.equal(gerarCsv(colunas, [{ nome: "-1,5", qtd: 0 }]).split("\r\n")[1], "-1,5;0")
})

test("acentos passam sem alteração", () => {
  assert.equal(gerarCsv(colunas, [{ nome: "João Estação", qtd: 0 }]).split("\r\n")[1], "João Estação;0")
})
