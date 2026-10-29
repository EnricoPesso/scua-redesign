import { test } from "node:test"
import assert from "node:assert/strict"
import { formatNumber } from "./format-number.ts"

// O Intl pt-BR do Node 26 devolve ponto como milhar, vírgula como decimal e o menos ASCII (U+002D).
test("milhar com ponto e decimal com vírgula", () => {
  assert.equal(formatNumber(1234.5, 1), "1.234,5")
})

test("zero sem decimais", () => {
  assert.equal(formatNumber(0), "0")
})

test("milhões", () => {
  assert.equal(formatNumber(1234567), "1.234.567")
})

test("completa casas decimais com zero", () => {
  assert.equal(formatNumber(0.5, 2), "0,50")
})

test("negativo usa o menos ASCII", () => {
  assert.equal(formatNumber(-1234.5, 1), "-1.234,5")
})
