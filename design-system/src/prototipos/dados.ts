// Dados fictícios do relatório "Tentativas de acesso fora da jornada" (8), base dos protótipos.
// Gerados de forma determinística para os screenshots saírem sempre iguais.

export type Tentativa = {
  id: number
  colaborador: string
  gestor: string
  estacao: string
  evento: "Logon fora da jornada" | "Desbloqueio fora da jornada"
  horario: string // ISO local, sem fuso
}

const equipes: Record<string, string[]> = {
  "Marina Costa": ["Ana Ribeiro", "Bruno Lima", "Carla Souza", "Diego Martins"],
  "Rafael Nunes": ["Eduarda Alves", "Felipe Rocha", "Gabriela Dias"],
  "Patrícia Gomes": ["Henrique Moura", "Isabela Freitas", "João Pedro Cardoso de Albuquerque"],
}

export const gestores = Object.keys(equipes).map((g) => ({ value: g, label: g }))
export const colaboradores = Object.values(equipes)
  .flat()
  .map((c) => ({ value: c, label: c }))

const gestorDe = new Map(Object.entries(equipes).flatMap(([g, cs]) => cs.map((c) => [c, g] as const)))

// Hoje fixo para o protótipo; 60 dias cobrem até "Este mês" e o período anterior (variante C).
export const HOJE = "2026-10-29"

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function gerar(): Tentativa[] {
  const rnd = seeded(42)
  const nomes = colaboradores.map((c) => c.value)
  const horasFora = [6, 7, 19, 20, 21, 22, 23]
  const rows: Tentativa[] = []
  for (let dia = 0; dia < 60; dia++) {
    const data = new Date(`${HOJE}T12:00:00`)
    data.setDate(data.getDate() - dia)
    // período atual um pouco mais movimentado que o anterior
    const qtd = Math.floor(rnd() * 4) + (dia < 7 ? 3 : 2)
    for (let i = 0; i < qtd; i++) {
      const colaborador = nomes[Math.floor(rnd() * nomes.length)]
      const hora = horasFora[Math.floor(rnd() * horasFora.length)]
      const min = Math.floor(rnd() * 60)
      const d = new Date(data)
      d.setHours(hora, min, 0, 0)
      rows.push({
        id: rows.length + 1,
        colaborador,
        gestor: gestorDe.get(colaborador)!,
        estacao: `DEMO-WS${String(Math.floor(rnd() * 12) + 1).padStart(2, "0")}`,
        evento: rnd() < 0.7 ? "Logon fora da jornada" : "Desbloqueio fora da jornada",
        horario: toLocalIso(d),
      })
    }
  }
  return rows.sort((a, b) => b.horario.localeCompare(a.horario))
}

function toLocalIso(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export const tentativas = gerar()

export function diasAtras(n: number) {
  const d = new Date(`${HOJE}T12:00:00`)
  d.setDate(d.getDate() - n)
  return toLocalIso(d).slice(0, 10)
}

export function formatarHorario(iso: string) {
  const [data, hora] = iso.split("T")
  const [a, m, d] = data.split("-")
  return `${d}/${m}/${a} ${hora}`
}

export function formatarData(iso: string) {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}
