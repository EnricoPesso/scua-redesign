import { test } from "node:test"
import assert from "node:assert/strict"
import { paginate } from "./paginate.ts"

test("primeira página de 25 itens, 10 por página", () => {
  assert.deepEqual(paginate({ total: 25, page: 1, pageSize: 10 }), {
    page: 1, pageCount: 3, from: 1, to: 10, hasPrev: false, hasNext: true,
  })
})

test("última página é parcial", () => {
  assert.deepEqual(paginate({ total: 25, page: 3, pageSize: 10 }), {
    page: 3, pageCount: 3, from: 21, to: 25, hasPrev: true, hasNext: false,
  })
})

test("lista vazia", () => {
  assert.deepEqual(paginate({ total: 0, page: 1, pageSize: 10 }), {
    page: 1, pageCount: 1, from: 0, to: 0, hasPrev: false, hasNext: false,
  })
})

test("página fora do intervalo é limitada", () => {
  assert.equal(paginate({ total: 25, page: 99, pageSize: 10 }).page, 3)
  assert.equal(paginate({ total: 25, page: -4, pageSize: 10 }).page, 1)
})
