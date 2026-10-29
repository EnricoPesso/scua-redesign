import { test } from "node:test"
import assert from "node:assert/strict"
import { erroPeriodo, formatarDataBr, lerLista, lerTexto, nomeArquivo, periodoDe, somarDias, valoresPadrao, type FiltroDef } from "./relatorio.ts"

const filtros: FiltroDef[] = [
  { tipo: "multi", chave: "colaboradores", rotulo: "Colaboradores", opcoes: [] },
  { tipo: "select", chave: "tipo", rotulo: "Tipo", opcoes: [] },
  { tipo: "texto", chave: "estacao", rotulo: "Estação" },
  { tipo: "periodo", dias: 7 },
]

test("valores padrão: multi vazio, select e texto em branco, período de 7 dias terminando hoje", () => {
  assert.deepEqual(valoresPadrao(filtros, "2026-10-29"), {
    colaboradores: [], tipo: "", estacao: "", inicio: "2026-10-23", fim: "2026-10-29",
  })
})

test("somarDias atravessa a virada de mês", () => {
  assert.equal(somarDias("2026-11-02", -3), "2026-10-30")
})

test("período invertido ou incompleto dá erro; relatório sem período nunca dá", () => {
  assert.equal(erroPeriodo(filtros, { inicio: "2026-10-23", fim: "2026-10-29" }), undefined)
  assert.match(erroPeriodo(filtros, { inicio: "2026-10-30", fim: "2026-10-29" }) ?? "", /posterior/)
  assert.match(erroPeriodo(filtros, { inicio: "", fim: "2026-10-29" }) ?? "", /duas datas/)
  assert.equal(erroPeriodo([{ tipo: "texto", chave: "nome", rotulo: "Nome" }], {}), undefined)
})

test("periodoDe só devolve o período com as duas datas", () => {
  assert.deepEqual(periodoDe({ inicio: "2026-10-23", fim: "2026-10-29" }), { inicio: "2026-10-23", fim: "2026-10-29" })
  assert.equal(periodoDe({ inicio: "2026-10-23", fim: "" }), undefined)
  assert.equal(periodoDe({}), undefined)
})

test("lerTexto e lerLista tratam tipo errado e chave ausente", () => {
  assert.equal(lerTexto({ a: ["x"] }, "a"), "")
  assert.deepEqual(lerLista({ a: "x" }, "a"), [])
  assert.deepEqual(lerLista({ a: ["x"] }, "a"), ["x"])
  assert.equal(lerTexto({}, "b"), "")
})

test("nome do arquivo leva o período quando existe", () => {
  assert.equal(nomeArquivo("tentativas", { inicio: "2026-10-23", fim: "2026-10-29" }), "tentativas_2026-10-23_a_2026-10-29.csv")
  assert.equal(nomeArquivo("estacoes", {}), "estacoes.csv")
})

test("formatarDataBr", () => {
  assert.equal(formatarDataBr("2026-10-05"), "05/10/2026")
})
