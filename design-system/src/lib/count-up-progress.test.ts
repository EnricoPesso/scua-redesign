import { test } from "node:test"
import assert from "node:assert/strict"
import { countUpProgress, easeOutCubic } from "./count-up-progress.ts"

test("easeOutCubic vai de 0 a 1", () => {
  assert.equal(easeOutCubic(0), 0)
  assert.equal(easeOutCubic(1), 1)
  assert.ok(easeOutCubic(0.5) > 0.5)
})

test("progresso a meio caminho", () => {
  assert.equal(countUpProgress(600, 0, 1200), 0.5)
})

test("progresso nunca passa de 1", () => {
  assert.equal(countUpProgress(5000, 0, 1200), 1)
})

test("progresso nunca fica negativo (relógio anterior ao início)", () => {
  assert.equal(countUpProgress(-50, 0, 1200), 0)
  assert.ok(Object.is(countUpProgress(0, 0, 1200), 0))
})

test("duração zero conclui de imediato", () => {
  assert.equal(countUpProgress(0, 0, 0), 1)
})
