export type PageInput = { total: number; page: number; pageSize: number }
export type PageInfo = {
  page: number
  pageCount: number
  from: number
  to: number
  hasPrev: boolean
  hasNext: boolean
}

export function paginate({ total, page, pageSize }: PageInput): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)
  return { page: current, pageCount, from, to, hasPrev: current > 1, hasNext: current < pageCount }
}
