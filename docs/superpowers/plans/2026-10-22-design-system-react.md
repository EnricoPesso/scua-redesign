# Design system Scua em React: plano de implementação

> **Para quem executa:** usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans`. Passos com `- [ ]`. Spec em `docs/superpowers/specs/2026-10-22-design-system-react-design.md`.

**Goal:** tokens e 15 componentes base do Scua Logon em React, com página de documentação, prontos para as Pessoas 2, 3 e 4.

**Architecture:** shadcn sobre `@base-ui/react` e Tailwind v4. Tokens em 3 camadas (primitivo, semântico, componente) em `src/styles/tokens.css`; o `index.css` só liga os tokens às variáveis do shadcn. Um componente por arquivo em `src/components/ui/`.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Tailwind 4, `@base-ui/react` 1.9, `class-variance-authority`, `lucide-react`, `oxlint`, `node --test` (Node 26 roda `.ts` direto).

**Estado de partida (verificado):** branch `p1/react-base`, tudo em `design-system/` não rastreado; só existe `src/components/ui/button.tsx`; scripts `build` e `lint` já existem. Sem vitest: a lógica pura é testada com `node --test`, e o resto com `tsc -b`, `oxlint`, `scripts/contrast.mjs` e verificação no Chrome.

**Honestidade sobre o nível de detalhe:** as Tarefas 1 a 6 trazem código completo. As Tarefas 7 a 18 trazem arquivo, primitivo do base-ui, props e estados exatos, mas o código é escrito na execução, componente a componente, sob `frontend-design`, e cada fase termina com sua confirmação. Estender este arquivo ao entrar na Fase 3.

Todos os caminhos abaixo são relativos a `~/Projetos/scua-redesign/design-system/` salvo indicação.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/styles/tokens.css` | Primitivos e semânticos Scua, tipografia, espaço, raio, sombra, movimento |
| `src/index.css` | Importa fontes e tokens, liga tokens às variáveis do shadcn, base do `body` |
| `scripts/contrast.mjs` | Confere 32 pares de contraste WCAG AA lendo `tokens.css` |
| `src/lib/paginate.ts` | Função pura que calcula as páginas da tabela |
| `src/lib/paginate.test.ts` | Testes da função, rodam com `node --test` |
| `src/components/ui/*.tsx` | Um componente por arquivo |
| `src/docs/` | Página de documentação com todos os estados |
| `../CLAUDE.md` seção 3.5 | Comandos reais de build, lint e typecheck |

---

## Fase 1: tokens

### Task 1: Fonte Montserrat e esqueleto de tokens

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `package.json` (dependência)

- [ ] **Step 1: Instalar a fonte**

Run: `cd ~/Projetos/scua-redesign/design-system && npm install @fontsource-variable/montserrat@latest`
Expected: `added 1 package`, sem erro.

- [ ] **Step 2: Criar `src/styles/tokens.css`**

Paleta reaproveitada do PR #1 (já passou nos 32 pares AA), com Montserrat no lugar das fontes antigas.

```css
/* Scua Logon: tokens em 3 camadas. Componentes consomem só os semânticos (--color-*). */
:root {
  /* Camada 1: primitivos */
  --scua-orange-50: #fef3ea;
  --scua-orange-100: #fbe9da;
  --scua-orange-200: #f8cfae;
  --scua-orange-400: #f08a3a;
  --scua-orange-500: #e96b0a;
  --scua-orange-600: #a34607;
  --scua-orange-700: #8f3d06;

  --scua-gray-0: #ffffff;
  --scua-gray-50: #f4f2ef;
  --scua-gray-100: #ebe7e2;
  --scua-gray-200: #ddd7d0;
  --scua-gray-400: #8d857c;
  --scua-gray-600: #5d564f;
  --scua-gray-800: #2e2924;
  --scua-gray-900: #1f1a17;

  --scua-green-100: #dff3e4;
  --scua-green-400: #58c274;
  --scua-green-700: #17692f;
  --scua-red-100: #fbe0dd;
  --scua-red-400: #ff7b6e;
  --scua-red-600: #c0291b;
  --scua-red-700: #9c1f13;
  --scua-yellow-100: #fcefc4;
  --scua-yellow-800: #6b4e00;
  --scua-blue-100: #dbeafb;
  --scua-blue-700: #1a569e;

  /* Camada 2: semânticos */
  --color-bg: var(--scua-gray-50);
  --color-surface: var(--scua-gray-0);
  --color-surface-muted: var(--scua-orange-50);
  --color-text: var(--scua-gray-900);
  --color-text-muted: var(--scua-gray-600);
  --color-border: var(--scua-gray-200);
  --color-border-strong: var(--scua-gray-400);
  --color-accent: var(--scua-orange-500);
  --color-accent-text: var(--scua-orange-600);
  --color-on-accent: var(--scua-gray-900); /* branco sobre #E96B0A dá 3,2:1 e reprova AA */
  --color-focus: var(--scua-gray-900);
  --color-backdrop: rgb(31 26 23 / 0.5);
  --color-danger: var(--scua-red-600);
  --color-danger-hover: var(--scua-red-700);

  /* Camada 3: componente (só onde o semântico não basta) */
  --button-height: 2.5rem;
  --hit: 2.5rem;

  /* Tipografia: Montserrat medida no Logon e em scua.com.br em 2026-10-22 */
  --font-display: "Montserrat Variable", Roboto, "Segoe UI", sans-serif;
  --font-body: "Montserrat Variable", Roboto, "Segoe UI", sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.625rem;
  --text-2xl: 2.25rem;
  --leading-tight: 1.2;
  --leading-body: 1.5;

  /* Espaço (base 4px) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;

  /* Raio e sombra */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 999px;
  --shadow-1: 0 1px 2px rgb(31 26 23 / 0.08);
  --shadow-2: 0 4px 14px rgb(31 26 23 / 0.1);
  --shadow-3: 0 16px 40px rgb(31 26 23 / 0.18);

  /* Movimento */
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --dur-fast: 120ms;
  --dur: 200ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0ms;
    --dur: 0ms;
  }
}
```

- [ ] **Step 3: Commit (somente se Pedro autorizou commits locais; senão deixar sem commit)**

```bash
git add design-system/src/styles/tokens.css design-system/package.json design-system/package-lock.json
git commit -m "feat(design-system): tokens Scua em 3 camadas com Montserrat"
```

### Task 2: Script de contraste (teste dos tokens)

**Files:**
- Create: `scripts/contrast.mjs`

- [ ] **Step 1: Trazer o script do PR #1 e apontar para o novo arquivo**

```bash
cd ~/Projetos/scua-redesign/design-system && mkdir -p scripts
git show origin/p1/tokens:design-system/scripts/contrast.mjs \
  | sed 's#"../tokens.css"#"../src/styles/tokens.css"#; s#node design-system/scripts/contrast.mjs#node scripts/contrast.mjs#' > scripts/contrast.mjs
grep -n 'tokens.css' scripts/contrast.mjs
```
Expected: uma linha com `../src/styles/tokens.css`.

- [ ] **Step 2: Rodar e ver passar**

Run: `node scripts/contrast.mjs`
Expected: 32 linhas `OK` e `32 pares aprovados`, exit code 0.

- [ ] **Step 3: Provar que o teste pega regressão**

Editar temporariamente `src/styles/tokens.css`, trocando `--color-on-accent: var(--scua-gray-900)` por `--color-on-accent: var(--scua-gray-0)`, e rodar `node scripts/contrast.mjs`.
Expected: `FALHA  3.xx:1 (min 4.5)  color-on-accent sobre color-accent` e exit code 1. Reverter a edição e rodar de novo: `32 pares aprovados`.

- [ ] **Step 4: Adicionar o script ao `package.json`**

Em `scripts`, incluir `"contrast": "node scripts/contrast.mjs"`. Run: `npm run contrast`. Expected: `32 pares aprovados`.

### Task 3: Ligar tokens ao shadcn e remover o modo escuro

**Files:**
- Modify: `src/index.css` (129 linhas hoje; reescrito)

- [ ] **Step 1: Substituir o conteúdo de `src/index.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/montserrat";
@import "./styles/tokens.css";

@theme inline {
  --font-heading: var(--font-display);
  --font-sans: var(--font-body);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
}

/* Variáveis do shadcn apontam para os semânticos Scua. Sem modo escuro (fora do escopo). */
:root {
  --background: var(--color-bg);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --card-foreground: var(--color-text);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-text);
  --primary: var(--color-accent);
  --primary-foreground: var(--color-on-accent);
  --secondary: var(--scua-orange-100);
  --secondary-foreground: var(--color-text);
  --muted: var(--scua-gray-100);
  --muted-foreground: var(--color-text-muted);
  --accent: var(--scua-orange-100);
  --accent-foreground: var(--color-text);
  --destructive: var(--color-danger);
  --border: var(--color-border);
  --input: var(--color-border-strong);
  --ring: var(--color-focus);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans;
    font-size: var(--text-md);
    line-height: var(--leading-body);
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 2: Buildar**

Run: `npm run build`
Expected: `tsc -b` sem erro e `vite build` termina com `built in`. Se o `tsc` reclamar do `App.tsx` do template, isso é tratado na Task 4.

- [ ] **Step 3: Conferir contraste de novo**

Run: `npm run contrast`. Expected: `32 pares aprovados`.

**Confirmação da Fase 1:** relatar a Pedro com tabela (arquivos criados, saída do `contrast`, saída do `build`). Parar e esperar o ok.

---

## Fase 2: botão, campo, tabela

### Task 4: Botão (primário, secundário, perigo, só ícone, carregando)

**Files:**
- Modify: `src/components/ui/button.tsx` (57 linhas hoje; reescrito)
- Modify: `src/App.tsx` (trocar o template por uma página mínima de teste)

- [ ] **Step 1: Reescrever `button.tsx`**

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"
import { cn } from "cn"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-semibold whitespace-nowrap select-none outline-none transition-colors duration-[var(--dur-fast)] focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-[var(--scua-orange-400)]",
        secondary: "border-[var(--color-border-strong)] bg-card text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-white hover:bg-[var(--color-danger-hover)]",
        ghost: "text-foreground hover:bg-muted",
        link: "text-[var(--color-accent-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-10 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }

function Button({ className, variant, size, loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled}
      focusableWhenDisabled={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2Icon className="animate-spin motion-reduce:animate-none" aria-hidden /> : null}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
```

Observações: todos os tamanhos têm 40px de altura mínima (alvo de toque). O botão só ícone exige `aria-label` do chamador; o Step 3 cobre isso na documentação.

- [ ] **Step 2: Página mínima para testar em `src/App.tsx`**

```tsx
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-wrap gap-3 p-8">
      <Button>Salvar</Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="destructive">Excluir</Button>
      <Button variant="ghost">Mais</Button>
      <Button loading>Enviando</Button>
      <Button disabled>Desabilitado</Button>
      <Button size="icon" aria-label="Adicionar"><PlusIcon /></Button>
    </main>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build && npm run lint`
Expected: ambos sem erro.

Run: `npm run dev` em segundo plano e abrir `http://localhost:5173` no Chrome. Expected: 7 botões; o primário laranja com texto escuro; foco por Tab mostra anel escuro de 3px; o `loading` mostra o spinner. Zero erros no console.

### Task 5: Campo (rótulo, dica, erro)

**Files:**
- Create: `src/components/ui/field.tsx`

- [ ] **Step 1: Criar o componente sobre `@base-ui/react/field` (partes `Root`, `Label`, `Control`, `Description`, `Error`)**

```tsx
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cn } from "cn"

type FieldProps = FieldPrimitive.Root.Props & {
  label: string
  hint?: string
  error?: string
  inputProps?: FieldPrimitive.Control.Props
}

function Field({ label, hint, error, inputProps, className, ...props }: FieldProps) {
  return (
    <FieldPrimitive.Root invalid={Boolean(error)} className={cn("flex flex-col gap-1.5", className)} {...props}>
      <FieldPrimitive.Label className="text-sm font-semibold text-foreground">{label}</FieldPrimitive.Label>
      <FieldPrimitive.Control
        {...inputProps}
        className={cn(
          "h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground focus-visible:ring-3 focus-visible:ring-ring data-[invalid]:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
          inputProps?.className
        )}
      />
      {hint && !error ? (
        <FieldPrimitive.Description className="text-xs text-muted-foreground">{hint}</FieldPrimitive.Description>
      ) : null}
      {error ? (
        <FieldPrimitive.Error match className="text-xs font-medium text-[var(--scua-red-700)]">{error}</FieldPrimitive.Error>
      ) : null}
    </FieldPrimitive.Root>
  )
}

export { Field }
```

- [ ] **Step 2: Conferir os nomes reais da API antes de seguir**

Run: `cat node_modules/@base-ui/react/field/index.parts.d.ts | head -20`
Expected: exporta `Root`, `Label`, `Control`, `Description`, `Error`. Se algum nome diferir, ajustar o componente (a Tarefa não está pronta com o nome errado).

- [ ] **Step 3: Verificar no `App.tsx`**

Acrescentar `<Field label="Nome" hint="Como aparece no relatório" />`, `<Field label="E-mail" error="Informe um e-mail válido" />` e `<Field label="Matrícula" inputProps={{ disabled: true }} />`.
Run: `npm run build && npm run lint`. Expected: sem erro. No Chrome: o erro aparece em vermelho com a borda vermelha, o desabilitado fica acinzentado, Tab mostra o foco, e clicar no rótulo foca o campo.

### Task 6: Tabela com paginação

**Files:**
- Create: `src/lib/paginate.ts`
- Create: `src/lib/paginate.test.ts`
- Create: `src/components/ui/data-table.tsx`

- [ ] **Step 1: Escrever o teste que falha**

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test src/lib/paginate.test.ts`
Expected: FAIL com `Cannot find module './paginate.ts'`.

- [ ] **Step 3: Implementar**

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test src/lib/paginate.test.ts`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Criar `data-table.tsx`**

Props: `columns: { key: string; header: string; render?: (row) => ReactNode }[]`, `rows: T[]`, `pageSize?: number` (padrão 10), `loading?: boolean` (mostra 5 linhas de skeleton), `empty?: ReactNode` (padrão: texto "Nenhum registro encontrado"), `caption: string` (obrigatório, vira `<caption class="sr-only">`). Usa `paginate` para o rodapé "Mostrando 21 a 25 de 25" e os botões "Anterior" e "Próxima" (componente `Button` `variant="secondary"`, `disabled` quando não há página). Cabeçalho com fundo `bg-[var(--color-surface-muted)]`, linha em hover `hover:bg-[var(--scua-gray-50)]`, `<th scope="col">`, rolagem horizontal só dentro do contêiner (`overflow-x-auto`), nunca na página.

- [ ] **Step 6: Verificar**

Run: `npm run build && npm run lint`. Expected: sem erro. No Chrome, com 25 linhas de exemplo: 3 páginas, "Anterior" desabilitado na primeira, texto "Mostrando 1 a 10 de 25"; com `loading` aparecem as linhas de skeleton; com `rows=[]` aparece o texto vazio. Navegação inteira por teclado.

**Confirmação da Fase 2:** tabela ✅/❌ por item (build, lint, `node --test`, `contrast`, console zerado) e 3 screenshots (1440×900, 768×1024, 390×844). Esperar o ok de Pedro.

---

## Fase 3: componentes restantes

Cada tarefa abaixo segue o mesmo ciclo: criar o arquivo, montar no `App.tsx` todos os estados que se aplicam, rodar `npm run build && npm run lint && npm run contrast`, conferir no Chrome com teclado, e só então passar à próxima. Cor nova entra em `tokens.css` e no `contrast.mjs` antes de ser usada.

| Task | Arquivo | Primitivo base-ui | Props e comportamento | Estados a mostrar |
|---|---|---|---|---|
| 7 | `select.tsx` | `@base-ui/react/select` | `options`, `value`, `onValueChange`, `label`, `placeholder` | padrão, foco, aberto, desabilitado, erro |
| 8 | `multi-select.tsx` | `@base-ui/react/combobox` com `multiple` | mesmas props, `values[]`, chips removíveis com `aria-label` | padrão, aberto, vários selecionados, vazio, erro |
| 9 | `date-field.tsx` | `Field` + `input type="date"` nativo | `label`, `min`, `max`, `error` (sem calendário próprio, YAGNI) | padrão, foco, erro, desabilitado |
| 10 | `checkbox.tsx` | `@base-ui/react/checkbox` | `label`, `checked`, indeterminado | marcado, desmarcado, indeterminado, foco, desabilitado |
| 11 | `toggle.tsx` | `@base-ui/react/switch` | `label`, `checked` | ligado, desligado, foco, desabilitado |
| 12 | `badge.tsx` | nenhum (`span`) | `status`: `success`, `warning`, `danger`, `info`, `neutral`; ponto colorido + texto, nunca só cor | 5 status |
| 13 | `kpi-card.tsx` | nenhum | `label`, `value`, `period` sempre visível (problema #5 da análise), `loading` | padrão, carregando, vazio ("sem dados no período") |
| 14 | `drawer.tsx` | `@base-ui/react/drawer` | `open`, `onOpenChange`, `title`, `children`; fecha com Esc e no backdrop | aberto, fechado, foco preso |
| 15 | `confirm-dialog.tsx` | `@base-ui/react/alert-dialog` | `title`, `description`, `confirmLabel`, `destructive`; resolve problema #19 (excluir com confirmação) | aberto, destrutivo, carregando |
| 16 | `toaster.tsx` | `@base-ui/react/toast` | `success`, `error`, `info`; fundo escuro, texto branco (pares já no `contrast.mjs`); `aria-live` | 3 tipos, fecha sozinho em 5 s, fecha por botão |
| 17 | `empty-state.tsx` e `error-state.tsx` | nenhum | `title`, `description`, `action?`; o erro nunca mostra texto técnico cru (problema #1) | padrão, com ação |
| 18 | `skeleton.tsx` | nenhum | bloco com `animate-pulse motion-reduce:animate-none`, `aria-hidden` | linha, bloco, card |

Fonte de componentes animados: ReactBits e Uiverse só entram aqui com aprovação de Pedro item a item. Candidatos já levantados: contador animado no `kpi-card` (Task 13) e loader do galaxy (Task 18), ambos só se passarem em `prefers-reduced-motion` e contraste.

**Confirmação da Fase 3:** tabela com os 12 componentes, cada um com ✅/❌ nos itens da seção 3 do `CLAUDE.md` do repo. Esperar o ok.

---

## Fase 4: documentação

### Task 19: Página de documentação

**Files:**
- Create: `src/docs/DocsPage.tsx` e um arquivo por seção em `src/docs/sections/`
- Modify: `src/App.tsx` (renderiza `DocsPage`)

- [ ] **Step 1:** uma seção por componente, com título, uma frase de uso e todos os estados da tabela da Fase 3, mais seção de tokens (paleta, tipografia, espaço) e a nota "Fonte medida no Logon e em scua.com.br; telas internas do Logon não foram medidas".
- [ ] **Step 2:** navegação lateral por âncora (`<nav aria-label="Componentes">`), links com contraste AA.
- [ ] **Step 3:** `npm run build && npm run lint && npm run contrast`. Expected: sem erro.

**Confirmação da Fase 4:** URL local e screenshots. Esperar o ok.

---

## Fase 5: verificação

### Task 20: Critérios de pronto da seção 3 do `CLAUDE.md`

Skill obrigatória: `verification-before-completion`. Cada item abaixo exige comando rodado e saída lida.

- [ ] **Build, lint, typecheck:** `npm run build && npm run lint && npx tsc -b`. Expected: sem erro.
- [ ] **Testes:** `node --test src/lib/paginate.test.ts`. Expected: `# fail 0`.
- [ ] **Contraste:** `npm run contrast`. Expected: todos os pares aprovados.
- [ ] **Lighthouse mobile, 2 rodadas** (o LCP oscila com a rede das fontes): `npm run build && npx vite preview --port 4173 &` e `npx lighthouse http://localhost:4173 --only-categories=accessibility,performance --form-factor=mobile --output=json --quiet`. Expected: accessibility ≥ 95, performance ≥ 90, LCP < 2,5 s, CLS < 0,1.
- [ ] **Screenshots em 3 tamanhos** pelo Chrome: 1440×900, 768×1024, 390×844, sem rolagem horizontal. Procedimento em `ferramentas/verificacao-ui-sem-playwright` (iframe para larguras, teclado via JS).
- [ ] **Console:** zero erros e nenhum 404.
- [ ] **Relatório:** tabela ✅/❌ com todos os itens e os screenshots; se algum foi pulado, dizer qual e por quê.

---

## Fase 6: revisão

### Task 21: Revisão de código e de UI

- [ ] `code-review` (nível high), `simplify`, `web-design-guidelines`; agente `design-review` do `ui-ux-pro-max` se disponível.
- [ ] `/codex:review`; trazer os achados e as divergências do Codex a Pedro sem filtrar. Não aplicar correção do Codex sem confirmar.
- [ ] Corrigir achados críticos, rodar a Task 20 de novo.

---

## Fase 7: fechamento

### Task 22: `CLAUDE.md` do repo, commit e PR

**Files:**
- Modify: `../CLAUDE.md` seção 3.5 (autorizado por Pedro em 2026-10-22)

- [ ] **Step 1:** em 3.5, preencher: build `npm run build` · lint `npm run lint` · typecheck `npx tsc -b` · contraste `npm run contrast` · testes `node --test src/lib/paginate.test.ts` (todos a partir de `design-system/`).
- [ ] **Step 2:** avisar o Enrico, por Pedro, que o `CLAUDE.md` promete skills não instaladas (`design-consultation`, `qa`, `a11y-debugging`, Playwright MCP).
- [ ] **Step 3:** **perguntar a Pedro se pode abrir o PR**. Só com o sim, abrir o PR no nome de Pedro, revisor `@bpaolucci`, corpo com a lista ✅/❌ e o que ficou fora.

---

## Auto-revisão do plano

| Requisito do spec | Onde está |
|---|---|
| Tokens (cores, tipografia, espaço, raio, sombra) | Tasks 1 a 3 |
| Botão com 4 variantes e carregando | Task 4 |
| Campo, select, multi-select, data | Tasks 5, 7, 8, 9 |
| Checkbox e toggle | Tasks 10, 11 |
| Badge, KPI | Tasks 12, 13 |
| Tabela com paginação | Task 6 |
| Drawer, modal, toast | Tasks 14, 15, 16 |
| Estado vazio, erro, skeleton | Tasks 17, 18 |
| Página de documentação | Task 19 |
| Critérios de pronto | Task 20 |
| Revisão (code-review, simplify, web-design-guidelines, Codex) | Task 21 |
| Seção 3.5 do `CLAUDE.md` e PR com pergunta | Task 22 |

Lacuna conhecida: o código das Tasks 7 a 18 não está escrito aqui, e isso é declarado no topo. Nenhum nome de função é usado antes de ser definido: `paginate` (Task 6) alimenta `data-table`; `Button` (Task 4) alimenta a tabela e os diálogos.
