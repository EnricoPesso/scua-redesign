import { CodeBlock, DocSection, SwatchGrid } from "../primitives"

const primitivos = {
  Laranja: ["--scua-orange-50", "--scua-orange-100", "--scua-orange-200", "--scua-orange-400", "--scua-orange-500", "--scua-orange-600", "--scua-orange-700"],
  Cinza: ["--scua-gray-0", "--scua-gray-50", "--scua-gray-100", "--scua-gray-200", "--scua-gray-400", "--scua-gray-600", "--scua-gray-800", "--scua-gray-900"],
  Status: ["--scua-green-100", "--scua-green-400", "--scua-green-700", "--scua-red-100", "--scua-red-400", "--scua-red-600", "--scua-red-700", "--scua-yellow-100", "--scua-yellow-800", "--scua-blue-100", "--scua-blue-300", "--scua-blue-700"],
}

const semanticos = {
  "Superfícies e texto": ["--color-bg", "--color-surface", "--color-surface-muted", "--color-text", "--color-text-muted", "--color-line", "--color-line-strong", "--color-row-hover"],
  "Marca e foco": ["--color-brand", "--color-brand-text", "--color-brand-hover", "--color-on-brand", "--color-focus"],
  "Perigo": ["--color-danger", "--color-danger-hover", "--color-on-danger", "--color-danger-text"],
  "Status (badge)": ["--color-success-bg", "--color-success-text", "--color-warning-bg", "--color-warning-text", "--color-danger-bg", "--color-info-bg", "--color-info-text", "--color-neutral-bg", "--color-neutral-text"],
  "Toast": ["--color-toast-bg", "--color-toast-text", "--color-toast-success", "--color-toast-danger", "--color-toast-info", "--color-toast-brand"],
}

const escalaTexto = [
  { cls: "text-xs", nome: "text-xs", medida: "12px" },
  { cls: "text-sm", nome: "text-sm", medida: "14px" },
  { cls: "text-base", nome: "text-base", medida: "16px" },
  { cls: "text-lg", nome: "text-lg", medida: "20px" },
  { cls: "text-xl", nome: "text-xl", medida: "26px" },
  { cls: "text-2xl", nome: "text-2xl", medida: "36px" },
]

const raios = [
  { cls: "rounded-sm", nome: "rounded-sm", medida: "4px" },
  { cls: "rounded-md", nome: "rounded-md", medida: "8px" },
  { cls: "rounded-lg", nome: "rounded-lg", medida: "14px" },
  { cls: "rounded-xl", nome: "rounded-xl", medida: "18px" },
  { cls: "rounded-2xl", nome: "rounded-2xl", medida: "24px" },
  { cls: "rounded-full", nome: "rounded-full", medida: "pílula" },
]

const sombras = [
  { token: "--shadow-1", uso: "Elevação mínima: card em repouso" },
  { token: "--shadow-2", uso: "Popover, select aberto, toast" },
  { token: "--shadow-3", uso: "Drawer e modal" },
]

const regras = [
  <>Botão primário é fundo laranja com texto escuro (<code className="font-mono">--color-on-brand</code>), nunca branco: branco sobre o laranja dá 3,2:1 e reprova AA.</>,
  <>Texto ou ícone laranja sobre o fundo da página usa <code className="font-mono">--color-brand-text</code>. Ícone ou borda laranja (<code className="font-mono">--color-brand</code>) só sobre branco (<code className="font-mono">--color-surface</code>).</>,
  <>Componente consome só tokens semânticos (<code className="font-mono">--color-*</code>), nunca <code className="font-mono">--scua-*</code>.</>,
  <>Sem modo escuro. Não use <code className="font-mono">dark:</code>.</>,
  <>Alvo clicável mínimo de 40px, em altura e largura.</>,
  <>Animação sempre respeita <code className="font-mono">prefers-reduced-motion</code>: use as durações <code className="font-mono">--dur</code> e <code className="font-mono">--dur-fast</code>, que zeram nesse modo.</>,
]

export function TokensSection() {
  return (
    <DocSection id="tokens" title="Tokens" description="Cores, tipografia, raio e sombra. Tudo vive em src/styles/tokens.css e src/index.css.">
      <p className="rounded-lg border border-border bg-card p-4 text-sm">
        <strong>Fonte:</strong> medida no login do Logon e em scua.com.br (Montserrat). Telas internas do Logon não foram medidas: exigem login.
      </p>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">Regras de uso</h3>
        <ol className="flex list-decimal flex-col gap-2 pl-6 text-sm">
          {regras.map((r, i) => <li key={i} className="pl-1">{r}</li>)}
        </ol>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">Paleta semântica</h3>
        <p className="text-sm text-muted-foreground">É isto que os componentes usam. O valor hex é lido do CSS em tempo de execução.</p>
        {Object.entries(semanticos).map(([grupo, nomes]) => (
          <div key={grupo} className="flex flex-col gap-2">
            <h4 className="text-base font-semibold">{grupo}</h4>
            <SwatchGrid names={nomes} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">Paleta primitiva</h3>
        <p className="text-sm text-muted-foreground">Base dos semânticos. Só a documentação mostra estes valores; no código de tela, não use.</p>
        {Object.entries(primitivos).map(([grupo, nomes]) => (
          <div key={grupo} className="flex flex-col gap-2">
            <h4 className="text-base font-semibold">{grupo}</h4>
            <SwatchGrid names={nomes} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">Tipografia</h3>
        <p className="text-sm text-muted-foreground">Montserrat variável em títulos e corpo. Não existem <code className="font-mono">text-md</code> nem <code className="font-mono">text-3xl</code>: o corpo é <code className="font-mono">text-base</code>.</p>
        <ul role="list" className="flex list-none flex-col divide-y divide-border rounded-lg border border-border bg-card p-0">
          {escalaTexto.map((t) => (
            <li key={t.nome} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
              <span className={t.cls}>Folha de ponto de outubro</span>
              <code className="font-mono text-xs text-muted-foreground">{t.nome} · {t.medida}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">Raio</h3>
        <ul role="list" className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {raios.map((r) => (
            <li key={r.nome} className="flex flex-col items-start gap-2">
              <div className={`h-14 w-full border border-[var(--color-line-strong)] bg-card ${r.cls}`} aria-hidden="true" />
              <code className="font-mono text-xs">{r.nome}</code>
              <span className="text-xs text-muted-foreground">{r.medida}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">Sombras</h3>
        <ul role="list" className="grid list-none gap-4 p-0 sm:grid-cols-3">
          {sombras.map((s) => (
            <li key={s.token} className="flex flex-col gap-2">
              <div className="h-16 rounded-lg bg-card" style={{ boxShadow: `var(${s.token})` }} aria-hidden="true" />
              <code className="font-mono text-xs">{s.token}</code>
              <span className="text-xs text-muted-foreground">{s.uso}</span>
            </li>
          ))}
        </ul>
      </div>

      <CodeBlock
        code={`/* Em CSS ou em classe arbitrária do Tailwind */
background: var(--color-surface);
color: var(--color-brand-text);

<p className="text-[var(--color-brand-text)]">Ver detalhes</p>`}
      />
    </DocSection>
  )
}
