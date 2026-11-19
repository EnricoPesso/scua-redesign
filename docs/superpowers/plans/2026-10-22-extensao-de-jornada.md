# Fluxo de Extensão de Jornada — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a tela "Extensões de jornada" (pedir, aprovar/reprovar individual e em lote, histórico, estados de erro) em React, funcionando com uma API simulada até a API real da Scua estar disponível.

**Architecture:** Front-end em `app/` (React 18 + Vite + TypeScript). A feature fica em `app/src/features/extensoes/`, dividida em `domain/` (regras puras, sem React), `api/` (cliente HTTP + mock MSW), `hooks/` (TanStack Query) e `components/` (telas). Estado de filtros e de qual pedido está aberto vive na URL (React Router). O visual usa o sistema de design do @PhLima07 (`design-system/*.css`, classes `.sc-*`); o CSS próprio da feature (`extensoes.module.css`) cuida só de layout e do que o sistema de design ainda não tem.

**Tech Stack:** React 18.3, Vite 5, TypeScript 5, React Router 6.26, TanStack Query 5.59, MSW 2.4 (mock da API), Vitest 2.1 + Testing Library (testes), Playwright 1.48 (ponta a ponta).

**Spec:** `docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md`

## ⚠ Adendo (29/10) — sistema de design em React

O plano foi escrito em cima do PR #1 (CSS puro, classes `.sc-*`), que foi **fechado**. Entrou na `main` o PR #3: `design-system/` com componentes **React 19 + Tailwind 4 + base-ui**. Onde o texto abaixo divergir deste adendo, **vale o adendo**.

**Stack (igual à do `design-system/`):** React 19, Vite 8, TypeScript 6, Tailwind 4 (`@tailwindcss/vite`), oxlint. Mais: React Router 7 (pacote `react-router`), TanStack Query 5, MSW 2, Vitest compatível com Vite 8, Testing Library, Playwright. A lógica de `domain/`, `api/` e `hooks/` (Tasks 2–8) não muda.

**Integração com o design system (Task 1):**
- Sem `git merge origin/p1/tokens`. Antes de tudo: `cd design-system && npm ci` (os componentes do DS resolvem as dependências deles em `design-system/node_modules`).
- `app/vite.config.ts`: alias `@` → `../design-system/src` (os componentes do DS importam `@/lib/utils`); `resolve.dedupe: ['react', 'react-dom']`; `server.fs.allow: ['..']`; plugins `react()` e `tailwindcss()`.
- `app/tsconfig.app.json`: `paths` com `"@/*": ["../design-system/src/*"]` e `react`, `react/*`, `react-dom`, `react-dom/*` fixados em `./node_modules/@types/...`, para existir um único tipo de React.
- O código do `app/` importa o DS como `@/components/ui/button` e o próprio código por caminho relativo.
- `app/src/index.css`: `@import "../../design-system/src/index.css";` + `@source "../../design-system/src/components";`. A fonte vem do `@fontsource-variable/montserrat` do DS (sem Google Fonts). `<html lang="pt-BR">`.

**Visual:** nada de `.sc-*` nem `extensoes.module.css`. Use utilitários do Tailwind com tokens semânticos (`var(--color-*)`), como fazem os componentes do DS. Regras do README do DS: botão primário laranja com texto escuro, sem `dark:`, alvo de 40px (a feature sobe para **44px no celular**).

| Precisa de | Usa |
|---|---|
| Botões | `Button` (`@/components/ui/button`) |
| Status | `Badge` com `status` success/warning/danger/neutral + texto |
| Contadores | `KpiCard` (com `period`, `loading`) |
| Campos | `Field` (texto e hora, via `inputProps`), `DateField`, `Select`, `Checkbox` |
| Formulário e detalhe | `Drawer` |
| Confirmações | `ConfirmDialog` |
| Avisos | `ToastProvider` + `useToast` (substitui `Avisos.tsx`) |
| Vazio, erro e carregando | `EmptyState`, `ErrorState`, `Skeleton` |
| Paginação | `paginate()` de `@/lib/paginate` |

**Não existe no DS, então a feature cria localmente** (cada um com o comentário `// pedir ao @PhLima07`): abas, tabela com seleção e paginação no servidor (o `DataTable` pagina no cliente e não seleciona), barra de limite, linha do tempo, barra de lote e grupo de rádio.

**Tasks que faltavam (11–15), em resumo:**
- **Task 11, Formulário:** novo, editar e "pedir de novo" no `Drawer` (`/extensoes/meus/novo`, `/extensoes/meus/:id/editar`); resumo ao vivo com horas, barra de limite e aprovador; validação no blur e no envio, com foco no primeiro campo inválido; envio único em duplo clique; erro mantém os dados.
- **Task 12, Detalhe e decisão:** `/extensoes/:aba/:id`; conteúdo da seção 7.1, histórico (seção 8), aprovar em 1 clique, reprovar com motivo, próximo da fila, conflito, sem permissão, não encontrado, editar e cancelar (com confirmação). No celular: tela cheia, rodapé preso, 44px. Esc fecha e devolve o foco à linha.
- **Task 13, Lote e exportar:** seleção da página, barra de lote presa, confirmação com nomes e total, reprovação em lote com motivo, resultado parcial com nome e motivo de cada falha; Exportar CSV na aba Todos.
- **Task 14, Ponta a ponta:** Playwright contra `npm run dev:mock` cobrindo os critérios 1–13 da spec, screenshots em 1440×900, 768×1024 e 390×844, e zero erros no console.
- **Task 15, Fechamento:** README do `app/`, comandos do `app/` na seção 3.5 do `CLAUDE.md` e checklist ✅/❌ para o PR.

## Global Constraints

- Textos em português do Brasil, com acentos. **Nenhuma mensagem técnica** (`[object ProgressEvent]`, código HTTP, stack trace) chega ao usuário; detalhes técnicos só no `console.error`.
- Termo do produto: **"Extensão de jornada"** (não "hora extra").
- Mensagens **neutras em gênero**: "Ana Souza vai receber o aviso" (não "será avisada").
- Status sempre com **texto + cor** (`.sc-badge`), nunca só cor.
- Paginação em português, **25 itens por página** por padrão, opções 10/25/50; o tamanho nunca muda sozinho.
- No celular (< 768px): **sem rolagem horizontal** em 390×844 e **alvos de toque ≥ 44px**.
- Datas como texto `YYYY-MM-DD` (dia local), horas `HH:MM`, durações sempre em **minutos** internamente.
- Partes que dependem de dado opcional da API (limite do grupo, aprovador, histórico) **somem** quando o dado não vem; o resto continua funcionando.
- **Sem cores fora dos tokens** do sistema de design (`var(--color-*)`, `var(--scua-*)`).
- Dependências: só as listadas na Task 1.

## Decisões tomadas no plano (diferem ou detalham a spec)

1. **Para aprovar** não filtra por data por padrão: mostra todos os pendentes (um pendente de setembro não pode sumir da fila).
2. **Meus pedidos** mostra do 1º dia do mês atual em diante, sem data final (quem pede para o mês que vem vê o pedido logo após enviar).
3. **Todos** usa o mês atual.
4. "Para outra pessoa" usa uma lista (`select`) da equipe, não uma busca com digitação.
5. Filtros no celular abrem num painel que expande abaixo do botão "Filtros (n)".
6. O sistema de design ainda não tem **abas, barra de limite, linha do tempo e barra de lote**; a feature cria esses estilos localmente e marca com comentário "pedir ao @PhLima07". O `--hit` dele é 40px; a feature sobe para 44px no celular.

## Review Focus

1. **Pendente de mês anterior** precisa aparecer na fila "Para aprovar" → teste na Task 10.
2. **Pedido para o mês que vem** precisa aparecer em "Meus pedidos" logo depois de enviado → teste na Task 10.
3. **URL editada à mão** (`pagina=abc`, `tamanho=9999`, `status=xyz`, página além do fim) → valores padrão, nunca "9999 itens" → testes na Task 10.
4. **Duplo clique** em "Enviar pedido" ou "Aprovar" → uma única requisição → testes nas Tasks 11 e 12.
5. **Limite igual a 0 ou resumo ausente** (404/501) → sem divisão por zero, parte escondida → testes nas Tasks 3, 7 e 11.

## Mapa de arquivos

Tudo dentro de `app/`:

| Arquivo | Responsabilidade |
|---|---|
| `src/features/extensoes/domain/types.ts` | Tipos do domínio |
| `domain/horas.ts` | Contar dias, minutos por dia, total, formatar duração |
| `domain/limite.ts` | Faixa do limite (ok / atenção / excedido / sem limite) |
| `domain/validacao.ts` | Validação do formulário |
| `domain/formatacao.ts` | Datas, períodos, rótulos, canal, "há 2 horas" |
| `domain/erros.ts` | `ApiError` e mensagens para o usuário |
| `domain/abas.ts` | Quais abas cada perfil vê |
| `domain/motivos.ts` | Motivos de reprovação |
| `api/client.ts` | `fetch` → `ApiError` |
| `api/extensoesApi.ts` | Funções da API (contrato provisório) |
| `api/mocks/db.ts`, `handlers.ts`, `browser.ts` | API simulada (MSW) e dados de exemplo |
| `hooks/queries.ts`, `hooks/mutations.ts` | TanStack Query |
| `components/*` | Telas e componentes |
| `extensoes.module.css` | Layout da feature |
| `src/app/*` | Provedores, rotas, QueryClient |
| `src/test/*` | Setup, servidor MSW, `renderApp` |
| `e2e/extensoes.spec.ts` | Playwright |

## Contrato provisório da API (implementado pelo mock)

| Método e rota | Retorno | Erros |
|---|---|---|
| `GET /api/me/permissoes` | `Permissoes` | |
| `GET /api/extensoes?aba&de&ate&status&pessoa&gestor&grupo&pagina&tamanho` | `Pagina<Pedido>` (sem `historico`) | 403 |
| `GET /api/extensoes/totais?(mesmos filtros, sem página)` | `Totais` | 403 |
| `GET /api/extensoes/exportar?(filtros)` | CSV | 403 |
| `GET /api/extensoes/:id` | `Pedido` com `historico` | 403, 404 |
| `POST /api/extensoes` | `Pedido` | 400, 409 `PERIODO_CONFLITANTE` |
| `PUT /api/extensoes/:id` | `Pedido` | 404, 409 `NAO_EDITAVEL` / `PERIODO_CONFLITANTE` |
| `POST /api/extensoes/:id/cancelar` | `Pedido` | 404, 409 `NAO_PENDENTE` |
| `POST /api/extensoes/:id/decisao` | `Pedido` | 403, 404, 409 `JA_DECIDIDO` (com `dados`) / `NAO_PENDENTE` |
| `POST /api/extensoes/decisao-em-lote` | `ResultadoLote` | |
| `GET /api/justificativas` | `Justificativa[]` | |
| `GET /api/colaboradores` | `Pessoa[]` (equipe do usuário) | |
| `GET /api/beneficiarios/:id/resumo?mes=YYYY-MM` | `ResumoBeneficiario` | 404/501 = dado não existe (tela esconde) |

Corpo de erro: `{ "codigo": "JA_DECIDIDO", "dados": { "status": "aprovado", "por": "Carlos Mendes", "canal": "whatsapp", "em": "<ISO>" } }`.

---

## PARTE 1 — Base (sem tela)

### Task 1: Projeto base em `app/`

**Files:**
- Create: `app/` (via create-vite), `app/.env.mock`, `app/src/test/setup.ts`, `app/src/App.test.tsx`
- Modify: `app/vite.config.ts`, `app/package.json`, `app/index.html`, `app/src/main.tsx`, `app/src/App.tsx`, `app/src/index.css`, `app/.gitignore`
- Delete: `app/src/App.css`

**Interfaces:**
- Produces: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev:mock`; data fixa nos testes = **segunda, 12/10/2026 às 10:00** (só o `Date` é falso).

- [ ] **Step 1: Branch com o sistema de design do Pedro**

```bash
cd C:/Users/jmpes/IBTECHS/SCUA
git fetch origin
git checkout -b p3/extensao-jornada origin/main
git merge --no-edit origin/p1/tokens   # pule se o design-system/ já estiver na main
ls design-system   # deve listar tokens.css, base.css, components.css
```

- [ ] **Step 2: Criar o projeto e instalar dependências**

```bash
npm create vite@5.5.3 app -- --template react-ts
cd app
npm install
npm install react-router-dom@6.26.2 @tanstack/react-query@5.59.0
npm install -D vitest@2.1.2 jsdom@25.0.1 @testing-library/react@16.0.1 @testing-library/user-event@14.5.2 @testing-library/jest-dom@6.5.0 msw@2.4.9 @playwright/test@1.48.0
npx msw init public --save
rm src/App.css
```

- [ ] **Step 3: Configurar Vite/Vitest** — substituir `app/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // O sistema de design fica em ../design-system (fora de app/).
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 4: Scripts** — em `app/package.json`, deixar `"scripts"` assim:

```json
"scripts": {
  "dev": "vite",
  "dev:mock": "vite --mode mock",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b",
  "e2e": "playwright test"
}
```

Criar `app/.env.mock`:

```
VITE_API_MOCK=true
```

Adicionar ao fim de `app/.gitignore`:

```
e2e/screenshots/
test-results/
playwright-report/
```

- [ ] **Step 5: HTML com fontes e `sc-root`** — substituir `app/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scua Logon · Extensões de jornada</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Instrument+Sans:wght@400;600;700&display=swap" />
  </head>
  <body class="sc-root">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: CSS global e App provisório**

`app/src/index.css` (substituir tudo):

```css
#root { min-height: 100vh; }
```

`app/src/main.tsx` (substituir tudo):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../design-system/tokens.css';
import '../../design-system/base.css';
import '../../design-system/components.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`app/src/App.tsx` (substituir tudo):

```tsx
export default function App() {
  return <h1>Scua Logon</h1>;
}
```

- [ ] **Step 7: Setup dos testes** — criar `app/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Data fixa: segunda, 12/10/2026 às 10:00 (hora local). Só o Date é falso; timers continuam reais.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-12T10:00:00'));

// jsdom não implementa showModal/close do <dialog>.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => cleanup());
```

- [ ] **Step 8: Teste de fumaça** — criar `app/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import App from './App';

it('renderiza o título', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Scua Logon' })).toBeInTheDocument();
});
```

- [ ] **Step 9: Rodar tudo**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: 1 teste PASS; typecheck, lint e build sem erros.

- [ ] **Step 10: Commit**

```bash
cd ..
git add app
git commit -m "Cria projeto React + Vite da feature de extensões"
```

---

### Task 2: Tipos e cálculo de horas

**Files:**
- Create: `app/src/features/extensoes/domain/types.ts`, `domain/horas.ts`
- Test: `app/src/features/extensoes/domain/horas.test.ts`

**Interfaces:**
- Produces (types.ts): `Status`, `Canal`, `Aba`, `MotivoReprovacao`, `TipoEvento`, `JUSTIFICATIVA_OUTRA`, `Pessoa`, `Horario`, `Justificativa`, `Evento`, `DecisaoRegistrada`, `Pedido`, `Permissoes`, `Filtros`, `FiltrosSemPagina`, `Pagina<T>`, `Totais`, `ResumoBeneficiario`, `NovoPedido`, `Decisao`, `ResultadoLote`.
- Produces (horas.ts): `ehDataValida(d: string): boolean`, `contarDias(dataInicial: string, dataFinal: string): number`, `paraMinutos(hora: string): number | null`, `minutosPorDia(h: Horario): number`, `totalMinutos(dataInicial: string, dataFinal: string, h: Horario): number`, `formatarDuracao(min: number): string`.

- [ ] **Step 1: Tipos** — criar `domain/types.ts`:

```ts
export type Status = 'pendente' | 'aprovado' | 'reprovado' | 'cancelado';
export type Canal = 'painel' | 'teams' | 'whatsapp';
export type Aba = 'aprovar' | 'meus' | 'todos';
export type MotivoReprovacao = 'nao_necessario' | 'outro_horario' | 'periodo_errado' | 'outro';
export type TipoEvento = 'criado' | 'editado' | 'avisado' | 'aprovado' | 'reprovado' | 'cancelado';

/** Código da opção "Outra" no campo Motivo (não vem da API; a tela acrescenta). */
export const JUSTIFICATIVA_OUTRA = 'OUTRA';

export interface Pessoa { id: string; nome: string }
/** Horas no formato HH:MM. Vale para cada dia do intervalo. */
export interface Horario { inicio: string; fim: string }
export interface Justificativa { codigo: string; descricao: string }

export interface Evento {
  tipo: TipoEvento;
  por: Pessoa | null;
  canal: Canal;
  /** Data/hora ISO. */
  em: string;
  /** Em "editado": o que mudou, ex.: "horário 18:00–21:00 → 18:00–20:00". */
  detalhe?: string;
}

export interface DecisaoRegistrada {
  status: 'aprovado' | 'reprovado';
  por: Pessoa;
  canal: Canal;
  em: string;
  comentario?: string;
  motivo?: MotivoReprovacao;
  mensagem?: string;
}

export interface Pedido {
  id: string;
  beneficiario: Pessoa;
  solicitante: Pessoa;
  gestor: Pessoa | null;
  grupo: string | null;
  /** YYYY-MM-DD. dataFinal é igual a dataInicial quando é um dia só. */
  dataInicial: string;
  dataFinal: string;
  horario: Horario;
  justificativa: Justificativa;
  detalhes: string;
  status: Status;
  criadoEm: string;
  decisao: DecisaoRegistrada | null;
  /** Só vem no GET de um pedido; ausente se a API não registrar. */
  historico?: Evento[];
}

export interface Permissoes {
  usuario: Pessoa;
  podePedir: boolean;
  podePedirParaOutros: boolean;
  podeAprovar: boolean;
  podeVerTodos: boolean;
}

export interface Filtros {
  aba: Aba;
  /** '' = sem limite. */
  de: string;
  ate: string;
  status?: Status;
  pessoa?: string;
  gestor?: string;
  grupo?: string;
  pagina: number;
  tamanho: number;
}
export type FiltrosSemPagina = Omit<Filtros, 'pagina' | 'tamanho'>;

export interface Pagina<T> { itens: T[]; total: number }
export interface Totais { pendentes: number; minutosAprovados: number; reprovados: number }

export interface ResumoBeneficiario {
  minutosAprovadosNoMes: number;
  /** null = grupo sem limite. */
  limiteMensalMin: number | null;
  aprovador: Pessoa | null;
}

export interface NovoPedido {
  beneficiarioId: string;
  dataInicial: string;
  dataFinal: string;
  horario: Horario;
  justificativaCodigo: string;
  detalhes: string;
}

export type Decisao =
  | { acao: 'aprovar'; comentario?: string }
  | { acao: 'reprovar'; motivo: MotivoReprovacao; mensagem?: string };

export interface ResultadoLote {
  sucesso: string[];
  falhas: { id: string; nome: string; motivo: string }[];
}
```

- [ ] **Step 2: Teste que falha** — criar `domain/horas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contarDias, ehDataValida, formatarDuracao, minutosPorDia, paraMinutos, totalMinutos } from './horas';

describe('contarDias', () => {
  it('conta os dois extremos', () => expect(contarDias('2026-10-13', '2026-10-15')).toBe(3));
  it('data final vazia é um dia só', () => expect(contarDias('2026-10-13', '')).toBe(1));
  it('mesmo dia é um dia', () => expect(contarDias('2026-10-13', '2026-10-13')).toBe(1));
  it('atravessa o mês', () => expect(contarDias('2026-09-30', '2026-10-02')).toBe(3));
  it('final antes do início é 0', () => expect(contarDias('2026-10-15', '2026-10-13')).toBe(0));
  it('data impossível é 0', () => expect(contarDias('2026-02-30', '')).toBe(0));
  it('data vazia é 0', () => expect(contarDias('', '')).toBe(0));
});

describe('ehDataValida', () => {
  it('aceita data real', () => expect(ehDataValida('2026-10-12')).toBe(true));
  it('recusa 30 de fevereiro', () => expect(ehDataValida('2026-02-30')).toBe(false));
  it('recusa formato errado', () => expect(ehDataValida('12/10/2026')).toBe(false));
});

describe('minutos', () => {
  it('converte HH:MM', () => expect(paraMinutos('18:30')).toBe(1110));
  it('recusa hora inválida', () => expect(paraMinutos('25:00')).toBeNull());
  it('2h por dia', () => expect(minutosPorDia({ inicio: '18:00', fim: '20:00' })).toBe(120));
  it('fim igual ao início é 0', () => expect(minutosPorDia({ inicio: '18:00', fim: '18:00' })).toBe(0));
  it('fim antes do início é 0', () => expect(minutosPorDia({ inicio: '20:00', fim: '18:00' })).toBe(0));
  it('3 dias × 2h = 360 min', () => expect(totalMinutos('2026-10-13', '2026-10-15', { inicio: '18:00', fim: '20:00' })).toBe(360));
});

describe('formatarDuracao', () => {
  it.each([
    [0, '0h'],
    [30, '30min'],
    [120, '2h'],
    [90, '1h30'],
    [750, '12h30'],
    [65, '1h05'],
  ])('%i min → %s', (min, texto) => expect(formatarDuracao(min)).toBe(texto));
});
```

- [ ] **Step 3: Ver falhar**

Run: `cd app && npx vitest run src/features/extensoes/domain/horas.test.ts`
Expected: FAIL — `Failed to resolve import "./horas"`.

- [ ] **Step 4: Implementar** — criar `domain/horas.ts`:

```ts
import type { Horario } from './types';

const DIA_MS = 86_400_000;

/** Converte YYYY-MM-DD para milissegundos UTC (evita problema de horário de verão). null se a data não existe. */
function paraUTC(data: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(ano, mes - 1, dia);
  const d = new Date(t);
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return t;
}

export function ehDataValida(data: string): boolean {
  return paraUTC(data) !== null;
}

/** Dias do intervalo, contando os dois extremos. dataFinal vazia = um dia só. 0 se inválido. */
export function contarDias(dataInicial: string, dataFinal: string): number {
  const inicio = paraUTC(dataInicial);
  if (inicio === null) return 0;
  if (dataFinal === '') return 1;
  const fim = paraUTC(dataFinal);
  if (fim === null || fim < inicio) return 0;
  return Math.round((fim - inicio) / DIA_MS) + 1;
}

export function paraMinutos(hora: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutos de extensão em cada dia. 0 se o horário for inválido ou o fim não for depois do início. */
export function minutosPorDia(horario: Horario): number {
  const inicio = paraMinutos(horario.inicio);
  const fim = paraMinutos(horario.fim);
  if (inicio === null || fim === null || fim <= inicio) return 0;
  return fim - inicio;
}

export function totalMinutos(dataInicial: string, dataFinal: string, horario: Horario): number {
  return contarDias(dataInicial, dataFinal) * minutosPorDia(horario);
}

/** 120 → "2h", 90 → "1h30", 30 → "30min", 0 → "0h". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
```

- [ ] **Step 5: Ver passar**

Run: `npx vitest run src/features/extensoes/domain/horas.test.ts`
Expected: PASS (todos).

- [ ] **Step 6: Commit**

```bash
git add src/features/extensoes/domain
git commit -m "Tipos do domínio e cálculo de horas da extensão"
```

---

### Task 3: Faixa do limite do grupo

**Files:**
- Create: `app/src/features/extensoes/domain/limite.ts`
- Test: `app/src/features/extensoes/domain/limite.test.ts`

**Interfaces:**
- Produces: `type Faixa = 'ok' | 'atencao' | 'excedido' | 'sem-limite'`; `interface AvaliacaoLimite { faixa: Faixa; totalMin: number; excessoMin: number; percentual: number | null }`; `avaliarLimite(usadoMin: number, pedidoMin: number, limiteMin: number | null): AvaliacaoLimite`.

- [ ] **Step 1: Teste que falha** — criar `domain/limite.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { avaliarLimite } from './limite';

describe('avaliarLimite', () => {
  it('até 80% é ok', () => expect(avaliarLimite(240, 240, 600)).toMatchObject({ faixa: 'ok', totalMin: 480, percentual: 80 }));
  it('acima de 80% até 100% é atenção', () => expect(avaliarLimite(360, 240, 600).faixa).toBe('atencao'));
  it('exatamente 100% ainda é atenção', () => expect(avaliarLimite(300, 300, 600)).toMatchObject({ faixa: 'atencao', excessoMin: 0 }));
  it('acima de 100% é excedido com o excesso', () =>
    expect(avaliarLimite(360, 360, 600)).toEqual({ faixa: 'excedido', totalMin: 720, excessoMin: 120, percentual: 120 }));
  it('sem limite (null)', () =>
    expect(avaliarLimite(360, 120, null)).toEqual({ faixa: 'sem-limite', totalMin: 480, excessoMin: 0, percentual: null }));
  it('limite 0 com pedido é excedido, sem dividir por zero', () =>
    expect(avaliarLimite(0, 60, 0)).toEqual({ faixa: 'excedido', totalMin: 60, excessoMin: 60, percentual: 100 }));
  it('limite 0 sem nada pedido é ok', () => expect(avaliarLimite(0, 0, 0)).toMatchObject({ faixa: 'ok', percentual: 0 }));
});
```

- [ ] **Step 2: Ver falhar**

Run: `npx vitest run src/features/extensoes/domain/limite.test.ts`
Expected: FAIL — `Failed to resolve import "./limite"`.

- [ ] **Step 3: Implementar** — criar `domain/limite.ts`:

```ts
export type Faixa = 'ok' | 'atencao' | 'excedido' | 'sem-limite';

export interface AvaliacaoLimite {
  faixa: Faixa;
  /** Já usado + este pedido, em minutos. */
  totalMin: number;
  excessoMin: number;
  /** Sem teto (pode passar de 100). null quando não há limite. */
  percentual: number | null;
}

/** Verde até 80%, laranja de 80% a 100%, vermelho acima de 100% (spec, seção 6). */
export function avaliarLimite(usadoMin: number, pedidoMin: number, limiteMin: number | null): AvaliacaoLimite {
  const totalMin = usadoMin + pedidoMin;
  if (limiteMin === null) return { faixa: 'sem-limite', totalMin, excessoMin: 0, percentual: null };
  const excessoMin = Math.max(0, totalMin - limiteMin);
  if (limiteMin <= 0) {
    return { faixa: totalMin > 0 ? 'excedido' : 'ok', totalMin, excessoMin, percentual: totalMin > 0 ? 100 : 0 };
  }
  const percentual = (totalMin / limiteMin) * 100;
  const faixa: Faixa = percentual > 100 ? 'excedido' : percentual > 80 ? 'atencao' : 'ok';
  return { faixa, totalMin, excessoMin, percentual };
}
```

- [ ] **Step 4: Ver passar**

Run: `npx vitest run src/features/extensoes/domain/limite.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/extensoes/domain/limite.ts src/features/extensoes/domain/limite.test.ts
git commit -m "Avaliação do limite mensal de extensão"
```

---

### Task 4: Validação do formulário

**Files:**
- Create: `app/src/features/extensoes/domain/validacao.ts`
- Test: `app/src/features/extensoes/domain/validacao.test.ts`

**Interfaces:**
- Consumes: `ehDataValida`, `paraMinutos` (Task 2); `JUSTIFICATIVA_OUTRA` (Task 2).
- Produces: `interface FormPedido { paraQuem: 'mim' | 'outro'; beneficiarioId: string; dataInicial: string; dataFinal: string; inicio: string; fim: string; justificativaCodigo: string; detalhes: string }`; `type ErrosForm = Partial<Record<keyof FormPedido, string>>`; `LIMITE_DETALHES = 500`; `validarPedido(f: FormPedido, hoje: string): ErrosForm`.

- [ ] **Step 1: Teste que falha** — criar `domain/validacao.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { JUSTIFICATIVA_OUTRA } from './types';
import { validarPedido, type FormPedido } from './validacao';

const HOJE = '2026-10-12';
const valido: FormPedido = {
  paraQuem: 'mim', beneficiarioId: '', dataInicial: '2026-10-13', dataFinal: '2026-10-15',
  inicio: '18:00', fim: '20:00', justificativaCodigo: '3', detalhes: '',
};

describe('validarPedido', () => {
  it('formulário completo não tem erro', () => expect(validarPedido(valido, HOJE)).toEqual({}));
  it('último dia vazio é permitido', () => expect(validarPedido({ ...valido, dataFinal: '' }, HOJE)).toEqual({}));
  it('hoje é permitido', () => expect(validarPedido({ ...valido, dataInicial: HOJE, dataFinal: '' }, HOJE)).toEqual({}));
  it('"para mim" ignora o beneficiário', () => expect(validarPedido({ ...valido, beneficiarioId: '' }, HOJE).beneficiarioId).toBeUndefined());
  it('"para outra pessoa" exige escolher', () =>
    expect(validarPedido({ ...valido, paraQuem: 'outro' }, HOJE).beneficiarioId).toBe('Escolha para quem é a extensão'));
  it('exige o primeiro dia', () => expect(validarPedido({ ...valido, dataInicial: '' }, HOJE).dataInicial).toBe('Informe o primeiro dia'));
  it('recusa data impossível', () => expect(validarPedido({ ...valido, dataInicial: '2026-02-30' }, HOJE).dataInicial).toBe('Data inválida'));
  it('recusa passado', () =>
    expect(validarPedido({ ...valido, dataInicial: '2026-10-10' }, HOJE).dataInicial).toBe('A data não pode estar no passado'));
  it('último dia antes do primeiro', () =>
    expect(validarPedido({ ...valido, dataFinal: '2026-10-12' }, HOJE).dataFinal).toBe('O último dia precisa ser igual ou depois do primeiro'));
  it('exige início e fim', () => {
    const e = validarPedido({ ...valido, inicio: '', fim: '' }, HOJE);
    expect(e.inicio).toBe('Informe o horário de início');
    expect(e.fim).toBe('Informe o horário de fim');
  });
  it('fim precisa ser depois do início', () =>
    expect(validarPedido({ ...valido, inicio: '20:00', fim: '18:00' }, HOJE).fim).toBe('A hora final precisa ser depois da inicial'));
  it('exige motivo', () => expect(validarPedido({ ...valido, justificativaCodigo: '' }, HOJE).justificativaCodigo).toBe('Escolha um motivo'));
  it('"Outra" exige detalhes', () =>
    expect(validarPedido({ ...valido, justificativaCodigo: JUSTIFICATIVA_OUTRA, detalhes: '   ' }, HOJE).detalhes).toBe('Descreva o motivo'));
  it('detalhes com mais de 500 caracteres', () =>
    expect(validarPedido({ ...valido, detalhes: 'a'.repeat(501) }, HOJE).detalhes).toBe('Use no máximo 500 caracteres'));
});
```

- [ ] **Step 2: Ver falhar**

Run: `npx vitest run src/features/extensoes/domain/validacao.test.ts`
Expected: FAIL — `Failed to resolve import "./validacao"`.

- [ ] **Step 3: Implementar** — criar `domain/validacao.ts`:

```ts
import { ehDataValida, paraMinutos } from './horas';
import { JUSTIFICATIVA_OUTRA } from './types';

export interface FormPedido {
  paraQuem: 'mim' | 'outro';
  beneficiarioId: string;
  dataInicial: string;
  dataFinal: string;
  inicio: string;
  fim: string;
  justificativaCodigo: string;
  detalhes: string;
}

export type ErrosForm = Partial<Record<keyof FormPedido, string>>;

export const LIMITE_DETALHES = 500;

export function validarPedido(f: FormPedido, hoje: string): ErrosForm {
  const e: ErrosForm = {};

  if (f.paraQuem === 'outro' && !f.beneficiarioId) e.beneficiarioId = 'Escolha para quem é a extensão';

  if (!f.dataInicial) e.dataInicial = 'Informe o primeiro dia';
  else if (!ehDataValida(f.dataInicial)) e.dataInicial = 'Data inválida';
  else if (f.dataInicial < hoje) e.dataInicial = 'A data não pode estar no passado';

  if (f.dataFinal) {
    if (!ehDataValida(f.dataFinal)) e.dataFinal = 'Data inválida';
    else if (f.dataInicial && f.dataFinal < f.dataInicial) e.dataFinal = 'O último dia precisa ser igual ou depois do primeiro';
  }

  const inicio = paraMinutos(f.inicio);
  const fim = paraMinutos(f.fim);
  if (!f.inicio) e.inicio = 'Informe o horário de início';
  else if (inicio === null) e.inicio = 'Horário inválido';
  if (!f.fim) e.fim = 'Informe o horário de fim';
  else if (fim === null) e.fim = 'Horário inválido';
  else if (inicio !== null && fim <= inicio) e.fim = 'A hora final precisa ser depois da inicial';

  if (!f.justificativaCodigo) e.justificativaCodigo = 'Escolha um motivo';

  if (f.justificativaCodigo === JUSTIFICATIVA_OUTRA && !f.detalhes.trim()) e.detalhes = 'Descreva o motivo';
  else if (f.detalhes.length > LIMITE_DETALHES) e.detalhes = `Use no máximo ${LIMITE_DETALHES} caracteres`;

  return e;
}
```

- [ ] **Step 4: Ver passar**

Run: `npx vitest run src/features/extensoes/domain/validacao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/extensoes/domain/validacao.ts src/features/extensoes/domain/validacao.test.ts
git commit -m "Validação do formulário de pedido de extensão"
```

---

### Task 5: Formatação de datas, períodos e canal

**Files:**
- Create: `app/src/features/extensoes/domain/formatacao.ts`
- Test: `app/src/features/extensoes/domain/formatacao.test.ts`

**Interfaces:**
- Consumes: `Canal`, `Horario` (Task 2).
- Produces: `hojeLocal(agora?: Date): string`, `periodoDoMes(dia: string): { de: string; ate: string }`, `mesDe(dia: string): string` (YYYY-MM), `formatarPeriodo(dataInicial, dataFinal, horario): string`, `formatarHora(iso): string`, `formatarDataHora(iso): string`, `tempoDesde(iso, agora?): string`, `rotuloPeriodo(de, ate, hoje): string`, `nomeCanal(c: Canal): string`.

- [ ] **Step 1: Teste que falha** — criar `domain/formatacao.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  formatarDataHora, formatarHora, formatarPeriodo, hojeLocal, mesDe, nomeCanal, periodoDoMes, rotuloPeriodo, tempoDesde,
} from './formatacao';

const H = { inicio: '18:00', fim: '20:00' };
const HOJE = '2026-10-12';

describe('datas', () => {
  it('hoje vem do relógio local', () => expect(hojeLocal()).toBe('2026-10-12'));
  it('período do mês', () => expect(periodoDoMes('2026-02-10')).toEqual({ de: '2026-02-01', ate: '2026-02-28' }));
  it('mês de uma data', () => expect(mesDe('2026-10-13')).toBe('2026-10'));
});

describe('formatarPeriodo', () => {
  it('um dia', () => expect(formatarPeriodo('2026-10-16', '2026-10-16', H)).toBe('16/10 · 18:00–20:00'));
  it('data final vazia', () => expect(formatarPeriodo('2026-10-16', '', H)).toBe('16/10 · 18:00–20:00'));
  it('vários dias no mesmo mês', () => expect(formatarPeriodo('2026-10-13', '2026-10-15', H)).toBe('13–15/10 · 18:00–20:00'));
  it('atravessa o mês', () => expect(formatarPeriodo('2026-09-30', '2026-10-02', H)).toBe('30/09–02/10 · 18:00–20:00'));
});

describe('horas', () => {
  it('hora', () => expect(formatarHora('2026-10-12T08:31:00')).toBe('08:31'));
  it('data e hora', () => expect(formatarDataHora('2026-10-12T08:31:00')).toBe('12/10 às 08:31'));
  it('há poucos minutos', () => expect(tempoDesde('2026-10-12T09:45:00')).toBe('há 15 min'));
  it('há 1 hora', () => expect(tempoDesde('2026-10-12T08:30:00')).toBe('há 1 hora'));
  it('há várias horas', () => expect(tempoDesde('2026-10-12T06:00:00')).toBe('há 4 horas'));
  it('mais de um dia mostra a data', () => expect(tempoDesde('2026-10-10T09:00:00')).toBe('em 10/10 às 09:00'));
});

describe('rotuloPeriodo', () => {
  it('sem datas', () => expect(rotuloPeriodo('', '', HOJE)).toBe('no total'));
  it('mês atual inteiro', () => expect(rotuloPeriodo('2026-10-01', '2026-10-31', HOJE)).toBe('no mês'));
  it('outro mês inteiro', () => expect(rotuloPeriodo('2026-09-01', '2026-09-30', HOJE)).toBe('em setembro/2026'));
  it('intervalo', () => expect(rotuloPeriodo('2026-10-01', '2026-10-15', HOJE)).toBe('de 01/10 a 15/10'));
  it('um dia', () => expect(rotuloPeriodo('2026-10-05', '2026-10-05', HOJE)).toBe('em 05/10'));
  it('só início', () => expect(rotuloPeriodo('2026-10-01', '', HOJE)).toBe('a partir de 01/10'));
  it('só fim', () => expect(rotuloPeriodo('', '2026-10-15', HOJE)).toBe('até 15/10'));
});

it('nome do canal', () => {
  expect(nomeCanal('whatsapp')).toBe('WhatsApp');
  expect(nomeCanal('teams')).toBe('Teams');
  expect(nomeCanal('painel')).toBe('painel');
});
```

- [ ] **Step 2: Ver falhar**

Run: `npx vitest run src/features/extensoes/domain/formatacao.test.ts`
Expected: FAIL — `Failed to resolve import "./formatacao"`.

- [ ] **Step 3: Implementar** — criar `domain/formatacao.ts`:

```ts
import type { Canal, Horario } from './types';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dois = (n: number) => String(n).padStart(2, '0');

export function hojeLocal(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function periodoDoMes(dia: string): { de: string; ate: string } {
  const [ano, mes] = dia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { de: `${ano}-${dois(mes)}-01`, ate: `${ano}-${dois(mes)}-${dois(ultimo)}` };
}

export function mesDe(dia: string): string {
  return dia.slice(0, 7);
}

function ddmm(dia: string): string {
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

/** "13–15/10 · 18:00–20:00", "16/10 · 18:00–20:00" ou "30/09–02/10 · 18:00–20:00". */
export function formatarPeriodo(dataInicial: string, dataFinal: string, horario: Horario): string {
  const horas = `${horario.inicio}–${horario.fim}`;
  if (!dataFinal || dataFinal === dataInicial) return `${ddmm(dataInicial)} · ${horas}`;
  const dias = mesDe(dataInicial) === mesDe(dataFinal)
    ? `${dataInicial.slice(8, 10)}–${ddmm(dataFinal)}`
    : `${ddmm(dataInicial)}–${ddmm(dataFinal)}`;
  return `${dias} · ${horas}`;
}

export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${formatarHora(iso)}`;
}

export function tempoDesde(iso: string, agora: Date = new Date()): string {
  const minutos = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
  return `em ${formatarDataHora(iso)}`;
}

/** Texto do período ativo, para contadores e mensagens: "no mês", "de 01/10 a 15/10", "no total"… */
export function rotuloPeriodo(de: string, ate: string, hoje: string): string {
  if (!de && !ate) return 'no total';
  if (de && ate) {
    const mes = periodoDoMes(de);
    if (mes.de === de && mes.ate === ate) {
      if (mesDe(de) === mesDe(hoje)) return 'no mês';
      const [ano, m] = de.split('-').map(Number);
      return `em ${MESES[m - 1]}/${ano}`;
    }
    if (de === ate) return `em ${ddmm(de)}`;
    return `de ${ddmm(de)} a ${ddmm(ate)}`;
  }
  return de ? `a partir de ${ddmm(de)}` : `até ${ddmm(ate)}`;
}

const NOMES_CANAL: Record<Canal, string> = { painel: 'painel', teams: 'Teams', whatsapp: 'WhatsApp' };

export function nomeCanal(canal: Canal): string {
  return NOMES_CANAL[canal] ?? canal;
}
```

- [ ] **Step 4: Ver passar**

Run: `npx vitest run src/features/extensoes/domain/formatacao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/extensoes/domain/formatacao.ts src/features/extensoes/domain/formatacao.test.ts
git commit -m "Formatação de datas, períodos e canais"
```

---

### Task 6: Erros e cliente HTTP

**Files:**
- Create: `app/src/features/extensoes/domain/erros.ts`, `app/src/features/extensoes/api/client.ts`, `app/src/test/server.ts`
- Modify: `app/src/test/setup.ts`
- Test: `app/src/features/extensoes/domain/erros.test.ts`, `app/src/features/extensoes/api/client.test.ts`

**Interfaces:**
- Consumes: `formatarHora`, `nomeCanal` (Task 5).
- Produces: `class ApiError extends Error { status: number; codigo: string; dados: Record<string, string> }` (status 0 + codigo `'REDE'` = falha de rede); `type Contexto = 'carregar' | 'enviar' | 'decidir'`; `mensagemParaUsuario(erro: unknown, contexto: Contexto): string`; `mensagemJaDecidido(dados: Record<string, string>): string`; `request<T>(caminho: string, init?: RequestInit): Promise<T>` (prefixa `/api`); `server` (MSW `setupServer`).

- [ ] **Step 1: Servidor de teste** — criar `app/src/test/server.ts`:

```ts
import { setupServer } from 'msw/node';

export const server = setupServer();
```

Substituir `app/src/test/setup.ts` pelo conteúdo abaixo (igual ao da Task 1 + MSW):

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './server';

// Data fixa: segunda, 12/10/2026 às 10:00 (hora local). Só o Date é falso; timers continuam reais.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-12T10:00:00'));

// jsdom não implementa showModal/close do <dialog>.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

- [ ] **Step 2: Testes que falham** — criar `domain/erros.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ApiError, mensagemParaUsuario } from './erros';

describe('mensagemParaUsuario', () => {
  it('nunca repassa texto técnico', () => {
    const m = mensagemParaUsuario(new Error('[object ProgressEvent]'), 'carregar');
    expect(m).toBe('Não conseguimos carregar os pedidos. Verifique sua conexão. Se continuar, fale com o TI da sua empresa.');
  });
  it('falha de rede ao enviar', () =>
    expect(mensagemParaUsuario(new ApiError(0, 'REDE'), 'enviar')).toBe('Não conseguimos enviar. Seus dados estão salvos aqui.'));
  it('erro 500 ao decidir', () =>
    expect(mensagemParaUsuario(new ApiError(500, 'X'), 'decidir')).toBe('Não conseguimos registrar a decisão. Tente de novo.'));
  it('403', () => expect(mensagemParaUsuario(new ApiError(403, 'PROIBIDO'), 'carregar')).toBe('Você não tem acesso a este pedido.'));
  it('404', () => expect(mensagemParaUsuario(new ApiError(404, 'NAO_ENCONTRADO'), 'carregar')).toBe('Este pedido não existe ou foi removido.'));
  it('conflito de período', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'PERIODO_CONFLITANTE'), 'enviar')).toBe('Já existe um pedido pendente para esse período.'));
  it('não editável', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'NAO_EDITAVEL'), 'enviar')).toBe('Este pedido não pode mais ser editado.'));
  it('não pendente', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'NAO_PENDENTE'), 'decidir')).toBe('Este pedido não está mais pendente.'));
  it('já decidido em outro canal', () => {
    const e = new ApiError(409, 'JA_DECIDIDO', { status: 'aprovado', por: 'Carlos Mendes', canal: 'whatsapp', em: '2026-10-12T17:42:00' });
    expect(mensagemParaUsuario(e, 'decidir')).toBe('Este pedido já foi aprovado por Carlos Mendes via WhatsApp às 17:42.');
  });
});
```

Criar `api/client.test.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server';
import { request } from './client';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('request', () => {
  it('devolve o JSON', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ ok: true })));
    await expect(request('/ping')).resolves.toEqual({ ok: true });
  });
  it('erro HTTP vira ApiError com código e dados', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ codigo: 'JA_DECIDIDO', dados: { por: 'Carlos' } }, { status: 409 })));
    await expect(request('/ping')).rejects.toMatchObject({ status: 409, codigo: 'JA_DECIDIDO', dados: { por: 'Carlos' } });
  });
  it('erro sem JSON vira DESCONHECIDO', async () => {
    server.use(http.get('*/api/ping', () => new HttpResponse('oops', { status: 500 })));
    await expect(request('/ping')).rejects.toMatchObject({ status: 500, codigo: 'DESCONHECIDO' });
  });
  it('falha de rede vira REDE', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.error()));
    await expect(request('/ping')).rejects.toMatchObject({ status: 0, codigo: 'REDE' });
  });
  it('204 devolve undefined', async () => {
    server.use(http.post('*/api/ping', () => new HttpResponse(null, { status: 204 })));
    await expect(request('/ping', { method: 'POST' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Ver falhar**

Run: `npx vitest run src/features/extensoes/domain/erros.test.ts src/features/extensoes/api/client.test.ts`
Expected: FAIL — imports `./erros` e `./client` não resolvem.

- [ ] **Step 4: Implementar** — criar `domain/erros.ts`:

```ts
import { formatarHora, nomeCanal } from './formatacao';
import type { Canal } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    public readonly dados: Record<string, string> = {},
  ) {
    super(`API ${status} ${codigo}`);
    this.name = 'ApiError';
  }
}

export type Contexto = 'carregar' | 'enviar' | 'decidir';

const GENERICA: Record<Contexto, string> = {
  carregar: 'Não conseguimos carregar os pedidos. Verifique sua conexão. Se continuar, fale com o TI da sua empresa.',
  enviar: 'Não conseguimos enviar. Seus dados estão salvos aqui.',
  decidir: 'Não conseguimos registrar a decisão. Tente de novo.',
};

export function mensagemJaDecidido(dados: Record<string, string>): string {
  const acao = dados.status === 'reprovado' ? 'reprovado' : 'aprovado';
  const por = dados.por ? ` por ${dados.por}` : '';
  const canal = dados.canal ? ` via ${nomeCanal(dados.canal as Canal)}` : '';
  const hora = dados.em ? ` às ${formatarHora(dados.em)}` : '';
  return `Este pedido já foi ${acao}${por}${canal}${hora}.`;
}

/** Texto amigável para qualquer erro. Nunca devolve a mensagem técnica do erro. */
export function mensagemParaUsuario(erro: unknown, contexto: Contexto): string {
  if (!(erro instanceof ApiError)) return GENERICA[contexto];
  if (erro.status === 403) return 'Você não tem acesso a este pedido.';
  if (erro.status === 404) return 'Este pedido não existe ou foi removido.';
  if (erro.status === 409) {
    if (erro.codigo === 'JA_DECIDIDO') return mensagemJaDecidido(erro.dados);
    if (erro.codigo === 'PERIODO_CONFLITANTE') return 'Já existe um pedido pendente para esse período.';
    if (erro.codigo === 'NAO_EDITAVEL') return 'Este pedido não pode mais ser editado.';
    if (erro.codigo === 'NAO_PENDENTE') return 'Este pedido não está mais pendente.';
  }
  return GENERICA[contexto];
}
```

Criar `api/client.ts`:

```ts
import { ApiError } from '../domain/erros';

/** Chama /api<caminho>. Erros viram ApiError; o detalhe técnico vai só para o console. */
export async function request<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(new URL(`/api${caminho}`, window.location.origin), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (e) {
    console.error('[extensoes] falha de rede', e);
    throw new ApiError(0, 'REDE');
  }
  if (!resposta.ok) {
    let corpo: { codigo?: string; dados?: Record<string, string> } = {};
    try {
      corpo = await resposta.json();
    } catch {
      // corpo vazio ou não-JSON
    }
    console.error('[extensoes] erro da API', resposta.status, corpo);
    throw new ApiError(resposta.status, corpo.codigo ?? 'DESCONHECIDO', corpo.dados ?? {});
  }
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}
```

- [ ] **Step 5: Ver passar**

Run: `npx vitest run src/features/extensoes/domain/erros.test.ts src/features/extensoes/api/client.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/test src/features/extensoes/domain/erros* src/features/extensoes/api/client*
git commit -m "Cliente HTTP e mensagens de erro amigáveis"
```

---

### Task 7: API da feature e mock (MSW)

**Files:**
- Create: `app/src/features/extensoes/api/extensoesApi.ts`, `api/mocks/db.ts`, `api/mocks/handlers.ts`
- Modify: `app/src/test/server.ts`, `app/src/test/setup.ts`
- Test: `app/src/features/extensoes/api/extensoesApi.test.ts`

**Interfaces:**
- Consumes: `request` (Task 6), tipos (Task 2), `totalMinutos`, `contarDias`, `minutosPorDia` (Task 2), `formatarHora`, `nomeCanal` (Task 5).
- Produces: `extensoesApi.{permissoes, listar, totais, exportarUrl, obter, criar, editar, cancelar, decidir, decidirEmLote, justificativas, colaboradores, resumo}` (assinaturas no código); mock: `PESSOAS`, `ChavePessoa`, `resetarDb()`, `entrarComo(chave)`, `simularFalha(ligado)`, `decidirExterno(id, status, canal?)`, `todosOsPedidos()`, `handlers`.

**Dados de exemplo** (hoje = 12/10/2026; usuário padrão = Carlos Mendes, gestor de Ana, João, Bia e Rui):

| id | Beneficiário | Período | Horário | Motivo | Status | Criado em |
|---|---|---|---|---|---|---|
| p-1 | Ana Souza | 13–15/10 | 18–20h | Janela de deploy ("Atualização do ERP") | pendente | 12/10 08:30 |
| p-2 | João Lima | 13–14/10 | 18–19h | Fechamento mensal | pendente | 11/10 17:00 |
| p-3 | Bia Rocha | 16/10 | 18–21h | Incidente crítico | pendente | 12/10 09:00 |
| p-4 | Rui Alves | 17/10 | 18–19h | Curso | pendente | 12/10 09:30 |
| p-5 | Ana Souza | 06–08/10 | 18–20h | Janela de deploy | aprovado (Carlos, painel) | 05/10 15:00 |
| p-6 | João Lima | 01/10 | 18–20h | Demanda de projeto | reprovado ("Combinar outro horário") | 30/09 16:00 |
| p-7 | Ana Souza | 20/10 | 18–19h | Curso | cancelado | 09/10 10:00 |
| p-8 | Bia Rocha | 29/09 | 18–20h | Janela de deploy | pendente | 28/09 11:00 |
| p-9 | Xavier Pinto (gestora Olga) | 14/10 | 18–19h | Curso | pendente | 10/10 10:00 |

Limites mensais: Ana e João 10h, Rui 0h, Bia sem limite. Perfis: Carlos e Olga = gestores; Ana, João, Bia, Rui, Xavier = colaboradores; Renata Dias = RH (só "Todos").

- [ ] **Step 1: Mock — dados e regras** — criar `api/mocks/db.ts`:

```ts
import { formatarHora, nomeCanal } from '../../domain/formatacao';
import { contarDias, minutosPorDia, totalMinutos } from '../../domain/horas';
import { JUSTIFICATIVA_OUTRA } from '../../domain/types';
import type {
  Canal, Decisao, Evento, Justificativa, NovoPedido, Pedido, Permissoes, Pessoa, ResultadoLote, ResumoBeneficiario, Totais,
} from '../../domain/types';

export const PESSOAS = {
  carlos: { id: 'u-carlos', nome: 'Carlos Mendes' },
  ana: { id: 'u-ana', nome: 'Ana Souza' },
  joao: { id: 'u-joao', nome: 'João Lima' },
  bia: { id: 'u-bia', nome: 'Bia Rocha' },
  rui: { id: 'u-rui', nome: 'Rui Alves' },
  xavier: { id: 'u-xavier', nome: 'Xavier Pinto' },
  olga: { id: 'u-olga', nome: 'Olga Prado' },
  renata: { id: 'u-renata', nome: 'Renata Dias' },
} satisfies Record<string, Pessoa>;
export type ChavePessoa = keyof typeof PESSOAS;

const { carlos, ana, joao, bia, rui, xavier, olga, renata } = PESSOAS;

const GESTOR: Record<string, Pessoa | null> = {
  [ana.id]: carlos, [joao.id]: carlos, [bia.id]: carlos, [rui.id]: carlos, [xavier.id]: olga,
};
const GRUPO: Record<string, string> = {
  [ana.id]: 'GRP-COMERCIAL', [joao.id]: 'GRP-COMERCIAL', [bia.id]: 'GRP-OPERATIONS', [rui.id]: 'GRP-COMERCIAL', [xavier.id]: 'GRP-FINANCEIRO',
};
/** Limite mensal em minutos. null = sem limite. Pessoa fora da tabela = API sem o dado (resumo 404). */
const LIMITE: Record<string, number | null> = {
  [ana.id]: 600, [joao.id]: 600, [bia.id]: null, [rui.id]: 0, [xavier.id]: 600, [carlos.id]: null,
};
const COLABORADOR = { podePedir: true, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false };
const GESTOR_PERFIL = { podePedir: true, podePedirParaOutros: true, podeAprovar: true, podeVerTodos: false };
const PERFIL: Record<string, Omit<Permissoes, 'usuario'>> = {
  [carlos.id]: GESTOR_PERFIL,
  [olga.id]: GESTOR_PERFIL,
  [renata.id]: { podePedir: false, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: true },
};

export const JUSTIFICATIVAS: Justificativa[] = [
  { codigo: '2', descricao: 'Atendimento a incidente crítico' },
  { codigo: '5', descricao: 'Curso' },
  { codigo: '4', descricao: 'Demanda de projeto' },
  { codigo: '1', descricao: 'Fechamento mensal' },
  { codigo: '3', descricao: 'Janela de deploy' },
];
const J = (codigo: string) => JUSTIFICATIVAS.find((j) => j.codigo === codigo)!;

type Semente = Partial<Pedido> & Pick<Pedido, 'id' | 'beneficiario' | 'dataInicial' | 'horario' | 'justificativa' | 'criadoEm'>;

function pedido(d: Semente): Pedido {
  return {
    solicitante: d.beneficiario,
    gestor: GESTOR[d.beneficiario.id] ?? null,
    grupo: GRUPO[d.beneficiario.id] ?? null,
    dataFinal: d.dataInicial,
    detalhes: '',
    status: 'pendente',
    decisao: null,
    historico: [{ tipo: 'criado', por: d.solicitante ?? d.beneficiario, canal: 'painel', em: d.criadoEm }],
    ...d,
  };
}

function estadoInicial() {
  return {
    usuarioId: carlos.id,
    falhar: false,
    seq: 9,
    pedidos: [
      pedido({
        id: 'p-1', beneficiario: ana, dataInicial: '2026-10-13', dataFinal: '2026-10-15', horario: { inicio: '18:00', fim: '20:00' },
        justificativa: J('3'), detalhes: 'Atualização do ERP', criadoEm: '2026-10-12T08:30:00',
        historico: [
          { tipo: 'criado', por: ana, canal: 'painel', em: '2026-10-12T08:30:00' },
          { tipo: 'avisado', por: carlos, canal: 'whatsapp', em: '2026-10-12T08:31:00' },
        ],
      }),
      pedido({ id: 'p-2', beneficiario: joao, dataInicial: '2026-10-13', dataFinal: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('1'), criadoEm: '2026-10-11T17:00:00' }),
      pedido({ id: 'p-3', beneficiario: bia, dataInicial: '2026-10-16', horario: { inicio: '18:00', fim: '21:00' }, justificativa: J('2'), criadoEm: '2026-10-12T09:00:00' }),
      pedido({ id: 'p-4', beneficiario: rui, dataInicial: '2026-10-17', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-12T09:30:00' }),
      pedido({
        id: 'p-5', beneficiario: ana, dataInicial: '2026-10-06', dataFinal: '2026-10-08', horario: { inicio: '18:00', fim: '20:00' },
        justificativa: J('3'), criadoEm: '2026-10-05T15:00:00', status: 'aprovado',
        decisao: { status: 'aprovado', por: carlos, canal: 'painel', em: '2026-10-05T19:00:00' },
      }),
      pedido({
        id: 'p-6', beneficiario: joao, dataInicial: '2026-10-01', horario: { inicio: '18:00', fim: '20:00' }, justificativa: J('4'),
        criadoEm: '2026-09-30T16:00:00', status: 'reprovado',
        decisao: { status: 'reprovado', por: carlos, canal: 'painel', em: '2026-09-30T19:05:00', motivo: 'outro_horario', mensagem: 'Pode ser na quinta? Segunda tem reunião cedo.' },
        historico: [
          { tipo: 'criado', por: joao, canal: 'painel', em: '2026-09-30T16:00:00' },
          { tipo: 'avisado', por: carlos, canal: 'whatsapp', em: '2026-09-30T16:01:00' },
          { tipo: 'reprovado', por: carlos, canal: 'painel', em: '2026-09-30T19:05:00' },
        ],
      }),
      pedido({ id: 'p-7', beneficiario: ana, dataInicial: '2026-10-20', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-09T10:00:00', status: 'cancelado' }),
      pedido({ id: 'p-8', beneficiario: bia, dataInicial: '2026-09-29', horario: { inicio: '18:00', fim: '20:00' }, justificativa: J('3'), criadoEm: '2026-09-28T11:00:00' }),
      pedido({ id: 'p-9', beneficiario: xavier, dataInicial: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativa: J('5'), criadoEm: '2026-10-10T10:00:00' }),
    ],
  };
}

let estado = estadoInicial();

export function resetarDb(): void { estado = estadoInicial(); }
export function entrarComo(chave: ChavePessoa): void { estado.usuarioId = PESSOAS[chave].id; }
export function simularFalha(ligado: boolean): void { estado.falhar = ligado; }
export function estaFalhando(): boolean { return estado.falhar; }
export function todosOsPedidos(): Pedido[] { return estado.pedidos; }

function pessoaPorId(id: string): Pessoa | undefined {
  return Object.values(PESSOAS).find((p) => p.id === id);
}
export function usuarioAtual(): Pessoa { return pessoaPorId(estado.usuarioId)!; }
export function permissoesAtuais(): Permissoes {
  return { usuario: usuarioAtual(), ...(PERFIL[estado.usuarioId] ?? COLABORADOR) };
}

const agoraIso = () => new Date().toISOString();
const acharPedido = (id: string) => estado.pedidos.find((p) => p.id === id);
function semHistorico(p: Pedido): Pedido {
  const { historico, ...resto } = p;
  void historico;
  return resto;
}

const STATUS_VALIDOS = ['pendente', 'aprovado', 'reprovado', 'cancelado'];

function filtrar(params: URLSearchParams): Pedido[] | 'proibido' {
  const perm = permissoesAtuais();
  const u = estado.usuarioId;
  const aba = params.get('aba') ?? 'meus';
  if ((aba === 'todos' && !perm.podeVerTodos) || (aba === 'aprovar' && !perm.podeAprovar)) return 'proibido';
  const de = params.get('de') ?? '';
  const ate = params.get('ate') ?? '';
  const status = params.get('status') ?? '';
  const pessoa = (params.get('pessoa') ?? '').toLowerCase();
  const gestor = (params.get('gestor') ?? '').toLowerCase();
  const grupo = (params.get('grupo') ?? '').toLowerCase();
  const lista = estado.pedidos.filter((p) => {
    if (aba === 'aprovar' && !(p.status === 'pendente' && p.gestor?.id === u)) return false;
    if (aba === 'meus' && p.beneficiario.id !== u && p.solicitante.id !== u) return false;
    if (de && p.dataFinal < de) return false;
    if (ate && p.dataInicial > ate) return false;
    if (STATUS_VALIDOS.includes(status) && p.status !== status) return false;
    if (pessoa && !`${p.beneficiario.nome} ${p.solicitante.nome}`.toLowerCase().includes(pessoa)) return false;
    if (gestor && !(p.gestor?.nome ?? '').toLowerCase().includes(gestor)) return false;
    if (grupo && !(p.grupo ?? '').toLowerCase().includes(grupo)) return false;
    return true;
  });
  const sentido = aba === 'aprovar' ? 1 : -1; // fila: mais antigo primeiro; resto: mais recente primeiro
  return lista.sort((a, b) => sentido * (new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()));
}

export function listarDb(params: URLSearchParams): { itens: Pedido[]; total: number } | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const tamanho = Math.max(1, Number(params.get('tamanho')) || 25);
  return { itens: r.slice((pagina - 1) * tamanho, pagina * tamanho).map(semHistorico), total: r.length };
}

export function totaisDb(params: URLSearchParams): Totais | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  return {
    pendentes: r.filter((p) => p.status === 'pendente').length,
    minutosAprovados: r.filter((p) => p.status === 'aprovado').reduce((s, p) => s + totalMinutos(p.dataInicial, p.dataFinal, p.horario), 0),
    reprovados: r.filter((p) => p.status === 'reprovado').length,
  };
}

export function exportarCsvDb(params: URLSearchParams): string | 'proibido' {
  const r = filtrar(params);
  if (r === 'proibido') return r;
  const linhas = r.map((p) => [p.beneficiario.nome, p.solicitante.nome, p.dataInicial, p.dataFinal, p.horario.inicio, p.horario.fim, p.justificativa.descricao, p.status].join(';'));
  return ['beneficiario;solicitante;data_inicial;data_final;inicio;fim;justificativa;status', ...linhas].join('\n');
}

export function obterDb(id: string): Pedido | 'nao-encontrado' | 'proibido' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  const u = estado.usuarioId;
  const visivel = p.beneficiario.id === u || p.solicitante.id === u || p.gestor?.id === u || permissoesAtuais().podeVerTodos;
  return visivel ? p : 'proibido';
}

function justificativaDe(codigo: string): Justificativa | undefined {
  return codigo === JUSTIFICATIVA_OUTRA ? { codigo: JUSTIFICATIVA_OUTRA, descricao: 'Outra' } : JUSTIFICATIVAS.find((j) => j.codigo === codigo);
}
function dadosValidos(d: NovoPedido): boolean {
  return contarDias(d.dataInicial, d.dataFinal) > 0 && minutosPorDia(d.horario) > 0 && !!justificativaDe(d.justificativaCodigo) && !!pessoaPorId(d.beneficiarioId);
}
function temConflito(beneficiarioId: string, inicio: string, fim: string, ignorarId?: string): boolean {
  return estado.pedidos.some((p) => p.id !== ignorarId && p.status === 'pendente' && p.beneficiario.id === beneficiarioId && p.dataInicial <= fim && inicio <= p.dataFinal);
}

export function criarPedidoDb(d: NovoPedido): Pedido | 'conflito' | 'invalido' {
  if (!dadosValidos(d)) return 'invalido';
  if (temConflito(d.beneficiarioId, d.dataInicial, d.dataFinal)) return 'conflito';
  const beneficiario = pessoaPorId(d.beneficiarioId)!;
  const u = usuarioAtual();
  const em = agoraIso();
  const gestor = GESTOR[beneficiario.id] ?? null;
  const historico: Evento[] = [{ tipo: 'criado', por: u, canal: 'painel', em }];
  if (gestor) historico.push({ tipo: 'avisado', por: gestor, canal: 'whatsapp', em });
  const novo: Pedido = {
    id: `p-${++estado.seq}`, beneficiario, solicitante: u, gestor, grupo: GRUPO[beneficiario.id] ?? null,
    dataInicial: d.dataInicial, dataFinal: d.dataFinal, horario: d.horario, justificativa: justificativaDe(d.justificativaCodigo)!,
    detalhes: d.detalhes, status: 'pendente', criadoEm: em, decisao: null, historico,
  };
  estado.pedidos.push(novo);
  return novo;
}

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
function descreverMudancas(a: Pedido, d: NovoPedido): string {
  const m: string[] = [];
  if (a.dataInicial !== d.dataInicial || a.dataFinal !== d.dataFinal) m.push(`dias ${ddmm(a.dataInicial)}–${ddmm(a.dataFinal)} → ${ddmm(d.dataInicial)}–${ddmm(d.dataFinal)}`);
  if (a.horario.inicio !== d.horario.inicio || a.horario.fim !== d.horario.fim) m.push(`horário ${a.horario.inicio}–${a.horario.fim} → ${d.horario.inicio}–${d.horario.fim}`);
  if (a.justificativa.codigo !== d.justificativaCodigo) m.push(`motivo ${a.justificativa.descricao} → ${justificativaDe(d.justificativaCodigo)?.descricao}`);
  if (a.detalhes !== d.detalhes) m.push('detalhes alterados');
  return m.join('; ') || 'sem mudanças';
}

export function editarPedidoDb(id: string, d: NovoPedido): Pedido | 'nao-encontrado' | 'nao-editavel' | 'conflito' | 'invalido' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  if (p.status !== 'pendente' || p.solicitante.id !== estado.usuarioId) return 'nao-editavel';
  if (!dadosValidos(d)) return 'invalido';
  if (temConflito(d.beneficiarioId, d.dataInicial, d.dataFinal, id)) return 'conflito';
  const detalhe = descreverMudancas(p, d);
  const beneficiario = pessoaPorId(d.beneficiarioId)!;
  Object.assign(p, {
    beneficiario, gestor: GESTOR[beneficiario.id] ?? null, grupo: GRUPO[beneficiario.id] ?? null,
    dataInicial: d.dataInicial, dataFinal: d.dataFinal, horario: d.horario, justificativa: justificativaDe(d.justificativaCodigo)!, detalhes: d.detalhes,
  });
  p.historico = [...(p.historico ?? []), { tipo: 'editado', por: usuarioAtual(), canal: 'painel', em: agoraIso(), detalhe }];
  return p;
}

export function cancelarDb(id: string): Pedido | 'nao-encontrado' | 'nao-cancelavel' {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  const u = estado.usuarioId;
  if (p.status !== 'pendente' || (p.solicitante.id !== u && p.beneficiario.id !== u)) return 'nao-cancelavel';
  p.status = 'cancelado';
  p.historico = [...(p.historico ?? []), { tipo: 'cancelado', por: usuarioAtual(), canal: 'painel', em: agoraIso() }];
  return p;
}

export type ResultadoDecisao = Pedido | 'nao-encontrado' | 'proibido' | 'invalido' | { conflito: 'JA_DECIDIDO' | 'NAO_PENDENTE'; pedido: Pedido };

export function decidirDb(id: string, decisao: Decisao, canal: Canal = 'painel', por: Pessoa = usuarioAtual()): ResultadoDecisao {
  const p = acharPedido(id);
  if (!p) return 'nao-encontrado';
  if (p.gestor?.id !== por.id) return 'proibido';
  if (decisao.acao === 'reprovar' && !decisao.motivo) return 'invalido';
  if (p.status === 'cancelado') return { conflito: 'NAO_PENDENTE', pedido: p };
  if (p.status !== 'pendente') return { conflito: 'JA_DECIDIDO', pedido: p };
  const em = agoraIso();
  const status = decisao.acao === 'aprovar' ? 'aprovado' : 'reprovado';
  p.status = status;
  p.decisao = decisao.acao === 'aprovar'
    ? { status, por, canal, em, comentario: decisao.comentario }
    : { status, por, canal, em, motivo: decisao.motivo, mensagem: decisao.mensagem };
  p.historico = [...(p.historico ?? []), { tipo: status, por, canal, em }];
  return p;
}

/** Simula a decisão tomada fora do painel (Teams/WhatsApp) pelo gestor do pedido. */
export function decidirExterno(id: string, status: 'aprovado' | 'reprovado', canal: Canal = 'whatsapp'): void {
  const p = acharPedido(id);
  if (!p?.gestor) return;
  decidirDb(id, status === 'aprovado' ? { acao: 'aprovar' } : { acao: 'reprovar', motivo: 'outro_horario' }, canal, p.gestor);
}

export function decidirEmLoteDb(ids: string[], decisao: Decisao): ResultadoLote {
  const r: ResultadoLote = { sucesso: [], falhas: [] };
  for (const id of ids) {
    const res = decidirDb(id, decisao);
    const nome = acharPedido(id)?.beneficiario.nome ?? id;
    if (typeof res === 'string') {
      const motivo = res === 'proibido' ? 'você não pode decidir este pedido' : res === 'nao-encontrado' ? 'o pedido não existe mais' : 'dados inválidos';
      r.falhas.push({ id, nome, motivo });
    } else if ('conflito' in res) {
      const d = res.pedido.decisao;
      const motivo = res.conflito === 'NAO_PENDENTE' || !d
        ? 'o pedido foi cancelado'
        : `já tinha sido ${d.status} por ${d.por.nome} via ${nomeCanal(d.canal)} às ${formatarHora(d.em)}`;
      r.falhas.push({ id, nome, motivo });
    } else {
      r.sucesso.push(id);
    }
  }
  return r;
}

export function colaboradoresDb(): Pessoa[] {
  return Object.values(PESSOAS).filter((p) => GESTOR[p.id]?.id === estado.usuarioId);
}

export function resumoDb(beneficiarioId: string, mes: string): ResumoBeneficiario | null {
  if (!(beneficiarioId in LIMITE)) return null;
  const minutos = estado.pedidos
    .filter((p) => p.beneficiario.id === beneficiarioId && p.status === 'aprovado' && p.dataInicial.startsWith(mes))
    .reduce((s, p) => s + totalMinutos(p.dataInicial, p.dataFinal, p.horario), 0);
  return { minutosAprovadosNoMes: minutos, limiteMensalMin: LIMITE[beneficiarioId], aprovador: GESTOR[beneficiarioId] ?? null };
}
```

- [ ] **Step 2: Mock — rotas** — criar `api/mocks/handlers.ts`:

```ts
import { http, HttpResponse } from 'msw';
import type { Decisao, NovoPedido, Pedido } from '../../domain/types';
import * as db from './db';

const API = '*/api';
const erro = (status: number, codigo: string, dados?: Record<string, string>) => HttpResponse.json({ codigo, dados }, { status });
const indisponivel = () => erro(503, 'INDISPONIVEL');
const parametros = (request: Request) => new URL(request.url).searchParams;

function dadosDoConflito(p: Pedido): Record<string, string> {
  const d = p.decisao;
  return d ? { status: d.status, por: d.por.nome, canal: d.canal, em: d.em } : { status: p.status };
}

// A ordem importa: rotas fixas (/totais, /exportar, /decisao-em-lote) antes de /:id.
export const handlers = [
  http.get(`${API}/me/permissoes`, () => (db.estaFalhando() ? indisponivel() : HttpResponse.json(db.permissoesAtuais()))),

  http.get(`${API}/extensoes/totais`, ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.totaisDb(parametros(request));
    return r === 'proibido' ? erro(403, 'PROIBIDO') : HttpResponse.json(r);
  }),

  http.get(`${API}/extensoes/exportar`, ({ request }) => {
    const r = db.exportarCsvDb(parametros(request));
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    return new HttpResponse(r, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="extensoes.csv"' } });
  }),

  http.post(`${API}/extensoes/decisao-em-lote`, async ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const corpo = (await request.json()) as { ids: string[]; decisao: Decisao };
    return HttpResponse.json(db.decidirEmLoteDb(corpo.ids, corpo.decisao));
  }),

  http.get(`${API}/extensoes/:id`, ({ params }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.obterDb(String(params.id));
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    return HttpResponse.json(r);
  }),

  http.get(`${API}/extensoes`, ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.listarDb(parametros(request));
    return r === 'proibido' ? erro(403, 'PROIBIDO') : HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes`, async ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.criarPedidoDb((await request.json()) as NovoPedido);
    if (r === 'conflito') return erro(409, 'PERIODO_CONFLITANTE');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    return HttpResponse.json(r, { status: 201 });
  }),

  http.put(`${API}/extensoes/:id`, async ({ params, request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.editarPedidoDb(String(params.id), (await request.json()) as NovoPedido);
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'nao-editavel') return erro(409, 'NAO_EDITAVEL');
    if (r === 'conflito') return erro(409, 'PERIODO_CONFLITANTE');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    return HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes/:id/cancelar`, ({ params }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.cancelarDb(String(params.id));
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'nao-cancelavel') return erro(409, 'NAO_PENDENTE');
    return HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes/:id/decisao`, async ({ params, request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.decidirDb(String(params.id), (await request.json()) as Decisao);
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    if ('conflito' in r) return erro(409, r.conflito, dadosDoConflito(r.pedido));
    return HttpResponse.json(r);
  }),

  http.get(`${API}/justificativas`, () => HttpResponse.json(db.JUSTIFICATIVAS)),
  http.get(`${API}/colaboradores`, () => HttpResponse.json(db.colaboradoresDb())),

  http.get(`${API}/beneficiarios/:id/resumo`, ({ params, request }) => {
    const r = db.resumoDb(String(params.id), parametros(request).get('mes') ?? '');
    return r ? HttpResponse.json(r) : erro(404, 'NAO_ENCONTRADO');
  }),
];
```

- [ ] **Step 3: Usar o mock nos testes** — substituir `app/src/test/server.ts`:

```ts
import { setupServer } from 'msw/node';
import { handlers } from '../features/extensoes/api/mocks/handlers';

export const server = setupServer(...handlers);
```

Em `app/src/test/setup.ts`, adicionar o import e o reset no `afterEach`:

```ts
import { resetarDb } from '../features/extensoes/api/mocks/db';
```

```ts
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetarDb();
});
```

- [ ] **Step 4: Teste que falha** — criar `api/extensoesApi.test.ts`:

```ts
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server';
import { extensoesApi } from './extensoesApi';
import { decidirExterno, entrarComo } from './mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const FILA = { aba: 'aprovar' as const, de: '', ate: '', pagina: 1, tamanho: 25 };

describe('extensoesApi (contra o mock)', () => {
  it('fila do gestor: mais antigo primeiro, inclui pendente de setembro', async () => {
    const r = await extensoesApi.listar(FILA);
    expect(r.itens.map((p) => p.id)).toEqual(['p-8', 'p-2', 'p-1', 'p-3', 'p-4']);
    expect(r.total).toBe(5);
    expect(r.itens[0].historico).toBeUndefined();
  });

  it('totais do RH no mês somam minutos aprovados', async () => {
    entrarComo('renata');
    await expect(extensoesApi.totais({ aba: 'todos', de: '2026-10-01', ate: '2026-10-31' })).resolves.toEqual({ pendentes: 5, minutosAprovados: 360, reprovados: 1 });
  });

  it('decidir pedido já decidido devolve JA_DECIDIDO com os dados', async () => {
    await expect(extensoesApi.decidir('p-5', { acao: 'aprovar' })).rejects.toMatchObject({
      status: 409, codigo: 'JA_DECIDIDO', dados: { status: 'aprovado', por: 'Carlos Mendes', canal: 'painel' },
    });
  });

  it('pedido sobreposto a um pendente devolve PERIODO_CONFLITANTE', async () => {
    const novo = { beneficiarioId: 'u-ana', dataInicial: '2026-10-14', dataFinal: '2026-10-14', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '3', detalhes: '' };
    await expect(extensoesApi.criar(novo)).rejects.toMatchObject({ status: 409, codigo: 'PERIODO_CONFLITANTE' });
  });

  it('resumo devolve null quando a pessoa não tem o dado (404)', async () => {
    await expect(extensoesApi.resumo('u-desconhecido', '2026-10')).resolves.toBeNull();
  });

  it('resumo devolve null quando a API não implementa (501)', async () => {
    server.use(http.get('*/api/beneficiarios/:id/resumo', () => new HttpResponse(null, { status: 501 })));
    await expect(extensoesApi.resumo('u-ana', '2026-10')).resolves.toBeNull();
  });

  it('resumo de quem tem limite 0', async () => {
    await expect(extensoesApi.resumo('u-rui', '2026-10')).resolves.toEqual({ minutosAprovadosNoMes: 0, limiteMensalMin: 0, aprovador: { id: 'u-carlos', nome: 'Carlos Mendes' } });
  });

  it('lote informa sucesso e falha de cada pedido', async () => {
    decidirExterno('p-2', 'aprovado', 'whatsapp');
    const r = await extensoesApi.decidirEmLote(['p-1', 'p-2'], { acao: 'aprovar' });
    expect(r.sucesso).toEqual(['p-1']);
    expect(r.falhas).toEqual([{ id: 'p-2', nome: 'João Lima', motivo: 'já tinha sido aprovado por Carlos Mendes via WhatsApp às 10:00' }]);
  });

  it('link de exportação leva os filtros', () => {
    expect(extensoesApi.exportarUrl({ aba: 'todos', de: '2026-10-01', ate: '2026-10-31' })).toBe('/api/extensoes/exportar?aba=todos&de=2026-10-01&ate=2026-10-31');
  });
});
```

- [ ] **Step 5: Ver falhar**

Run: `npx vitest run src/features/extensoes/api/extensoesApi.test.ts`
Expected: FAIL — `Failed to resolve import "./extensoesApi"`.

- [ ] **Step 6: Implementar** — criar `api/extensoesApi.ts`:

```ts
import { ApiError } from '../domain/erros';
import type {
  Decisao, Filtros, FiltrosSemPagina, Justificativa, NovoPedido, Pagina, Pedido, Permissoes, Pessoa, ResultadoLote, ResumoBeneficiario, Totais,
} from '../domain/types';
import { request } from './client';

type Parametros = Record<string, string | number | undefined>;

function qs(p: Parametros): string {
  const s = new URLSearchParams();
  for (const [chave, valor] of Object.entries(p)) if (valor !== undefined && valor !== '') s.set(chave, String(valor));
  const texto = s.toString();
  return texto ? `?${texto}` : '';
}

const corpo = (method: string, dados: unknown): RequestInit => ({ method, body: JSON.stringify(dados) });
const id = (valor: string) => encodeURIComponent(valor);

export const extensoesApi = {
  permissoes: () => request<Permissoes>('/me/permissoes'),
  listar: (f: Filtros) => request<Pagina<Pedido>>(`/extensoes${qs({ ...f })}`),
  totais: (f: FiltrosSemPagina) => request<Totais>(`/extensoes/totais${qs({ ...f })}`),
  exportarUrl: (f: FiltrosSemPagina) => `/api/extensoes/exportar${qs({ ...f })}`,
  obter: (pedidoId: string) => request<Pedido>(`/extensoes/${id(pedidoId)}`),
  criar: (p: NovoPedido) => request<Pedido>('/extensoes', corpo('POST', p)),
  editar: (pedidoId: string, p: NovoPedido) => request<Pedido>(`/extensoes/${id(pedidoId)}`, corpo('PUT', p)),
  cancelar: (pedidoId: string) => request<Pedido>(`/extensoes/${id(pedidoId)}/cancelar`, { method: 'POST' }),
  decidir: (pedidoId: string, d: Decisao) => request<Pedido>(`/extensoes/${id(pedidoId)}/decisao`, corpo('POST', d)),
  decidirEmLote: (ids: string[], decisao: Decisao) => request<ResultadoLote>('/extensoes/decisao-em-lote', corpo('POST', { ids, decisao })),
  justificativas: () => request<Justificativa[]>('/justificativas'),
  colaboradores: () => request<Pessoa[]>('/colaboradores'),
  /** null quando a API não tem o dado (404) ou não implementa a rota (501): a tela esconde a parte de limite. */
  async resumo(beneficiarioId: string, mes: string): Promise<ResumoBeneficiario | null> {
    try {
      return await request<ResumoBeneficiario>(`/beneficiarios/${id(beneficiarioId)}/resumo${qs({ mes })}`);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 501)) return null;
      throw e;
    }
  },
};
```

- [ ] **Step 7: Ver passar (e nada quebrou)**

Run: `npm test && npm run typecheck`
Expected: todos PASS; typecheck sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/test src/features/extensoes/api
git commit -m "API de extensões com mock MSW e dados de exemplo"
```

---

### Task 8: Abas por perfil, QueryClient e hooks

**Files:**
- Create: `app/src/features/extensoes/domain/abas.ts`, `app/src/app/queryClient.ts`, `app/src/features/extensoes/hooks/queries.ts`, `hooks/mutations.ts`
- Test: `app/src/features/extensoes/domain/abas.test.ts`, `app/src/features/extensoes/hooks/hooks.test.tsx`

**Interfaces:**
- Consumes: `extensoesApi` (Task 7), `ApiError` (Task 6), tipos (Task 2).
- Produces:
  - `ORDEM_ABAS`, `ROTULO_ABA: Record<Aba, string>`, `abasPermitidas(p: Permissoes): Aba[]`, `ehAba(v: string | undefined): v is Aba`
  - `criarQueryClient(opcoes?: { semRetry?: boolean }): QueryClient` (não repete erros 4xx)
  - `chaves`, `usePermissoes()`, `useListaPedidos(f: Filtros)`, `useTotais(f: FiltrosSemPagina, habilitado = true)`, `usePedido(id: string | undefined)`, `useJustificativas()`, `useColaboradores(habilitado: boolean)`, `useResumo(beneficiarioId: string | undefined, mes: string)`
  - `useCriarPedido()` (vars `NovoPedido`), `useEditarPedido()` (vars `{ id, pedido }`), `useCancelarPedido()` (vars `id`), `useDecidir()` (vars `{ id, decisao }`), `useDecidirEmLote()` (vars `{ ids, decisao }`). Todas invalidam `['extensoes']` sem esperar o refetch.

- [ ] **Step 1: Testes que falham** — criar `domain/abas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { abasPermitidas, ehAba } from './abas';
import type { Permissoes } from './types';

const base: Permissoes = { usuario: { id: 'u', nome: 'U' }, podePedir: false, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false };

describe('abasPermitidas', () => {
  it('gestor', () => expect(abasPermitidas({ ...base, podePedir: true, podeAprovar: true })).toEqual(['aprovar', 'meus']));
  it('colaborador', () => expect(abasPermitidas({ ...base, podePedir: true })).toEqual(['meus']));
  it('RH', () => expect(abasPermitidas({ ...base, podeVerTodos: true })).toEqual(['todos']));
  it('ninguém', () => expect(abasPermitidas(base)).toEqual([]));
});

it('ehAba', () => {
  expect(ehAba('meus')).toBe(true);
  expect(ehAba('xyz')).toBe(false);
  expect(ehAba(undefined)).toBe(false);
});
```

Criar `hooks/hooks.test.tsx`:

```tsx
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { criarQueryClient } from '../../../app/queryClient';
import { server } from '../../../test/server';
import { useDecidir } from './mutations';
import { useListaPedidos, usePedido, useResumo } from './queries';

const FILA = { aba: 'aprovar' as const, de: '', ate: '', pagina: 1, tamanho: 25 };
const envolver = (client: QueryClient) => ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('hooks de extensões', () => {
  it('decidir atualiza a fila', async () => {
    const { result } = renderHook(() => ({ lista: useListaPedidos(FILA), decidir: useDecidir() }), { wrapper: envolver(criarQueryClient({ semRetry: true })) });
    await waitFor(() => expect(result.current.lista.data?.total).toBe(5));
    await act(() => result.current.decidir.mutateAsync({ id: 'p-1', decisao: { acao: 'aprovar' } }));
    await waitFor(() => expect(result.current.lista.data?.total).toBe(4));
  });

  it('resumo sem dado vira null', async () => {
    const { result } = renderHook(() => useResumo('u-desconhecido', '2026-10'), { wrapper: envolver(criarQueryClient({ semRetry: true })) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('não repete erro 4xx', async () => {
    let chamadas = 0;
    server.use(http.get('*/api/extensoes/:id', () => {
      chamadas += 1;
      return HttpResponse.json({ codigo: 'NAO_ENCONTRADO' }, { status: 404 });
    }));
    const { result } = renderHook(() => usePedido('p-x'), { wrapper: envolver(criarQueryClient()) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(chamadas).toBe(1);
  });
});
```

- [ ] **Step 2: Ver falhar**

Run: `npx vitest run src/features/extensoes/domain/abas.test.ts src/features/extensoes/hooks`
Expected: FAIL — imports não resolvem.

- [ ] **Step 3: Implementar** — criar `domain/abas.ts`:

```ts
import type { Aba, Permissoes } from './types';

export const ORDEM_ABAS: Aba[] = ['aprovar', 'meus', 'todos'];

export const ROTULO_ABA: Record<Aba, string> = { aprovar: 'Para aprovar', meus: 'Meus pedidos', todos: 'Todos' };

/** Abas que a pessoa vê, na ordem da spec. A primeira é a aba inicial. */
export function abasPermitidas(p: Permissoes): Aba[] {
  return ORDEM_ABAS.filter((aba) => (aba === 'aprovar' ? p.podeAprovar : aba === 'meus' ? p.podePedir : p.podeVerTodos));
}

export function ehAba(valor: string | undefined): valor is Aba {
  return valor === 'aprovar' || valor === 'meus' || valor === 'todos';
}
```

Criar `app/src/app/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../features/extensoes/domain/erros';

/** Erros 4xx (sem acesso, não existe, conflito) não melhoram tentando de novo. */
export function criarQueryClient(opcoes: { semRetry?: boolean } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: opcoes.semRetry ? false : (tentativas, erro) => !(erro instanceof ApiError && erro.status >= 400 && erro.status < 500) && tentativas < 2,
      },
      mutations: { retry: false },
    },
  });
}
```

Criar `hooks/queries.ts`:

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { extensoesApi } from '../api/extensoesApi';
import type { Filtros, FiltrosSemPagina } from '../domain/types';

export const chaves = {
  tudo: ['extensoes'] as const,
  lista: (f: Filtros) => ['extensoes', 'lista', f] as const,
  totais: (f: FiltrosSemPagina) => ['extensoes', 'totais', f] as const,
  pedido: (id: string) => ['extensoes', 'pedido', id] as const,
  resumo: (beneficiarioId: string, mes: string) => ['extensoes', 'resumo', beneficiarioId, mes] as const,
};

export function usePermissoes() {
  return useQuery({ queryKey: ['permissoes'], queryFn: extensoesApi.permissoes, staleTime: 5 * 60_000 });
}

export function useListaPedidos(f: Filtros) {
  return useQuery({
    queryKey: chaves.lista(f),
    queryFn: () => extensoesApi.listar(f),
    placeholderData: keepPreviousData,
    // A fila do gestor se atualiza sozinha: decisões tomadas no Teams/WhatsApp tiram o pedido da fila.
    refetchInterval: f.aba === 'aprovar' ? 60_000 : false,
  });
}

export function useTotais(f: FiltrosSemPagina, habilitado = true) {
  return useQuery({ queryKey: chaves.totais(f), queryFn: () => extensoesApi.totais(f), enabled: habilitado });
}

export function usePedido(id: string | undefined) {
  return useQuery({ queryKey: chaves.pedido(id ?? ''), queryFn: () => extensoesApi.obter(id!), enabled: !!id });
}

export function useJustificativas() {
  return useQuery({ queryKey: ['justificativas'], queryFn: extensoesApi.justificativas, staleTime: Infinity });
}

export function useColaboradores(habilitado: boolean) {
  return useQuery({ queryKey: ['colaboradores'], queryFn: extensoesApi.colaboradores, enabled: habilitado, staleTime: 5 * 60_000 });
}

export function useResumo(beneficiarioId: string | undefined, mes: string) {
  return useQuery({
    queryKey: chaves.resumo(beneficiarioId ?? '', mes),
    queryFn: () => extensoesApi.resumo(beneficiarioId!, mes),
    enabled: !!beneficiarioId,
  });
}
```

Criar `hooks/mutations.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extensoesApi } from '../api/extensoesApi';
import type { Decisao, NovoPedido } from '../domain/types';
import { chaves } from './queries';

/** Invalida tudo de extensões sem esperar o refetch: o callback de sucesso da tela roda antes da lista mudar. */
function useInvalidar() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: chaves.tudo });
  };
}

export function useCriarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (p: NovoPedido) => extensoesApi.criar(p), onSettled: invalidar });
}

export function useEditarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ id, pedido }: { id: string; pedido: NovoPedido }) => extensoesApi.editar(id, pedido), onSettled: invalidar });
}

export function useCancelarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (id: string) => extensoesApi.cancelar(id), onSettled: invalidar });
}

export function useDecidir() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ id, decisao }: { id: string; decisao: Decisao }) => extensoesApi.decidir(id, decisao), onSettled: invalidar });
}

export function useDecidirEmLote() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ ids, decisao }: { ids: string[]; decisao: Decisao }) => extensoesApi.decidirEmLote(ids, decisao), onSettled: invalidar });
}
```

- [ ] **Step 4: Ver passar**

Run: `npm test && npm run typecheck`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app src/features/extensoes/domain/abas* src/features/extensoes/hooks
git commit -m "Abas por perfil, QueryClient e hooks de dados"
```

---

## PARTE 2 — Telas

> Classes `sc-*` vêm do sistema de design (`design-system/components.css`). Em testes o CSS não é carregado; os testes usam papéis e textos acessíveis.

### Task 9: Casca da página, abas, avisos e rotas

**Files:**
- Create: `app/src/features/extensoes/extensoes.module.css`, `components/Avisos.tsx`, `components/EstadoLista.tsx`, `components/AbasExtensoes.tsx`, `components/ExtensoesPage.tsx`, `features/extensoes/routes.tsx`, `api/mocks/browser.ts`, `app/src/app/Provedores.tsx`, `app/src/app/AppRoutes.tsx`, `app/src/test/render.tsx`
- Modify: `app/src/App.tsx`, `app/src/main.tsx`
- Delete: `app/src/App.test.tsx`
- Test: `components/ExtensoesPage.test.tsx`, `components/Avisos.test.tsx`

**Interfaces:**
- Consumes: `usePermissoes`, `useTotais` (Task 8), `abasPermitidas`, `ehAba`, `ROTULO_ABA` (Task 8), `mensagemParaUsuario` (Task 6), `criarQueryClient` (Task 8), mock (Task 7).
- Produces: `AvisosProvider`, `useAvisar(): (texto: string) => void`; `EstadoLista` (props `{tipo:'carregando'} | {tipo:'vazio'; titulo; texto?; acao?; icone?} | {tipo:'erro'; mensagem; onTentarDeNovo}`); `ExtensoesPage` (sem props nesta task); `RotasExtensoes`; `AppRoutes`; `Provedores({ client, children })`; `renderApp(rota: string): { user, client, ...RenderResult }`; no navegador: `npm run dev:mock` com `?como=ana|carlos|renata…` e `window.__scuaMock`.

- [ ] **Step 1: CSS da feature** — criar `extensoes.module.css`:

```css
.pagina { max-width: 75rem; margin: 0 auto; padding: var(--space-5) var(--space-4) var(--space-7); display: grid; gap: var(--space-4); }
.cabecalho { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.cabecalho h1 { margin: 0; font: 700 var(--text-xl)/var(--leading-tight) var(--font-display); }

/* Abas: o sistema de design ainda não tem este componente (pedir ao @PhLima07). */
.abas { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); overflow-x: auto; }
.aba { display: inline-flex; align-items: center; min-height: var(--hit); padding: 0 var(--space-4); color: var(--color-text-muted); font-weight: 600; text-decoration: none; border-bottom: 3px solid transparent; white-space: nowrap; }
.aba:hover { color: var(--color-text); }
.aba:focus-visible { outline: 3px solid var(--color-focus); outline-offset: -3px; }
.abaAtiva { color: var(--color-text); border-bottom-color: var(--color-accent); }
```

- [ ] **Step 2: Testes que falham** — criar `components/Avisos.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { AvisosProvider, useAvisar } from './Avisos';

function Botao() {
  const avisar = useAvisar();
  return <button onClick={() => avisar('Pedido enviado.')}>Avisar</button>;
}

it('mostra o aviso e deixa fechar', async () => {
  const user = userEvent.setup();
  render(<AvisosProvider><Botao /></AvisosProvider>);
  await user.click(screen.getByRole('button', { name: 'Avisar' }));
  expect(screen.getByText('Pedido enviado.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));
  expect(screen.queryByText('Pedido enviado.')).not.toBeInTheDocument();
});
```

Criar `app/src/test/render.tsx`:

```tsx
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../app/AppRoutes';
import { Provedores } from '../app/Provedores';
import { criarQueryClient } from '../app/queryClient';

export function renderApp(rota: string) {
  const client = criarQueryClient({ semRetry: true });
  const user = userEvent.setup();
  const resultado = render(
    <Provedores client={client}>
      <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </MemoryRouter>
    </Provedores>,
  );
  return { user, client, ...resultado };
}
```

Criar `components/ExtensoesPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { entrarComo } from '../api/mocks/db';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Página de extensões', () => {
  it('gestor cai em "Para aprovar" com a contagem de pendentes', async () => {
    renderApp('/extensoes');
    const aba = await screen.findByRole('link', { name: 'Para aprovar (5)' });
    expect(aba).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Extensões de jornada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Nova extensão' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Todos' })).not.toBeInTheDocument();
  });

  it('colaborador cai em "Meus pedidos" e não vê "Para aprovar"', async () => {
    entrarComo('ana');
    renderApp('/extensoes');
    expect(await screen.findByRole('link', { name: 'Meus pedidos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: /Para aprovar/ })).not.toBeInTheDocument();
  });

  it('RH cai em "Todos" e não tem "Nova extensão"', async () => {
    entrarComo('renata');
    renderApp('/extensoes');
    expect(await screen.findByRole('link', { name: 'Todos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: '+ Nova extensão' })).not.toBeInTheDocument();
  });

  it('aba não permitida volta para a aba inicial', async () => {
    entrarComo('ana');
    renderApp('/extensoes/todos');
    expect(await screen.findByRole('link', { name: 'Meus pedidos' })).toHaveAttribute('aria-current', 'page');
  });

  it('quem não tem nenhuma aba vê um aviso', async () => {
    server.use(http.get('*/api/me/permissoes', () => HttpResponse.json({
      usuario: { id: 'u-x', nome: 'X' }, podePedir: false, podePedirParaOutros: false, podeAprovar: false, podeVerTodos: false,
    })));
    renderApp('/extensoes');
    expect(await screen.findByText('Você não tem acesso às extensões de jornada.')).toBeInTheDocument();
  });

  it('falha ao carregar permissões mostra mensagem amigável e tenta de novo', async () => {
    server.use(http.get('*/api/me/permissoes', () => HttpResponse.json({ codigo: 'X' }, { status: 500 }), { once: true }));
    const { user } = renderApp('/extensoes');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar os pedidos');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: /Para aprovar/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Ver falhar**

Run: `npx vitest run src/features/extensoes/components`
Expected: FAIL — imports não resolvem.

- [ ] **Step 4: Implementar**

`components/Avisos.tsx`:

```tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Avisar = (texto: string) => void;
const AvisosContexto = createContext<Avisar>(() => {});

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<{ id: number; texto: string }[]>([]);
  const proximoId = useRef(0);
  const remover = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);
  const avisar = useCallback<Avisar>((texto) => {
    const id = ++proximoId.current;
    setAvisos((lista) => [...lista, { id, texto }]);
    window.setTimeout(() => remover(id), 5000);
  }, [remover]);

  return (
    <AvisosContexto.Provider value={avisar}>
      {children}
      <div className="sc-toasts" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="sc-toast sc-toast--success">
            <span>{a.texto}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => remover(a.id)}>×</button>
          </div>
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}

export const useAvisar = () => useContext(AvisosContexto);
```

`components/EstadoLista.tsx`:

```tsx
import type { ReactNode } from 'react';

type Props =
  | { tipo: 'carregando' }
  | { tipo: 'vazio'; titulo: string; texto?: string; acao?: ReactNode; icone?: string }
  | { tipo: 'erro'; mensagem: string; onTentarDeNovo: () => void };

export function EstadoLista(props: Props) {
  if (props.tipo === 'carregando') {
    return (
      <div className="sc-state" role="status" aria-busy="true" aria-label="Carregando" style={{ justifyItems: 'stretch' }}>
        <span className="sc-skeleton" style={{ width: '60%' }} />
        <span className="sc-skeleton" />
        <span className="sc-skeleton" />
        <span className="sc-skeleton" style={{ width: '80%' }} />
      </div>
    );
  }
  if (props.tipo === 'erro') {
    return (
      <div className="sc-state sc-state--error" role="alert">
        <span className="sc-state__icon" aria-hidden="true">!</span>
        <p className="sc-state__text">{props.mensagem}</p>
        <button type="button" className="sc-btn sc-btn--primary" onClick={props.onTentarDeNovo}>Tentar de novo</button>
      </div>
    );
  }
  return (
    <div className="sc-state">
      <span className="sc-state__icon" aria-hidden="true">{props.icone ?? '∅'}</span>
      <h3 className="sc-state__title">{props.titulo}</h3>
      {props.texto && <p className="sc-state__text">{props.texto}</p>}
      {props.acao}
    </div>
  );
}
```

`components/AbasExtensoes.tsx`:

```tsx
import { NavLink } from 'react-router-dom';
import { ROTULO_ABA } from '../domain/abas';
import type { Aba } from '../domain/types';
import { useTotais } from '../hooks/queries';
import s from '../extensoes.module.css';

export function AbasExtensoes({ abas }: { abas: Aba[] }) {
  const pendentes = useTotais({ aba: 'aprovar', de: '', ate: '' }, abas.includes('aprovar'));
  return (
    <nav aria-label="Abas de extensões" className={s.abas}>
      {abas.map((aba) => (
        <NavLink key={aba} to={`/extensoes/${aba}`} className={({ isActive }) => (isActive ? `${s.aba} ${s.abaAtiva}` : s.aba)}>
          {ROTULO_ABA[aba]}{aba === 'aprovar' && pendentes.data ? ` (${pendentes.data.pendentes})` : ''}
        </NavLink>
      ))}
    </nav>
  );
}
```

`components/ExtensoesPage.tsx`:

```tsx
import { Link, Navigate, useParams } from 'react-router-dom';
import { abasPermitidas, ehAba } from '../domain/abas';
import { mensagemParaUsuario } from '../domain/erros';
import { usePermissoes } from '../hooks/queries';
import { AbasExtensoes } from './AbasExtensoes';
import { EstadoLista } from './EstadoLista';
import s from '../extensoes.module.css';

export function ExtensoesPage() {
  const { aba } = useParams();
  const permissoes = usePermissoes();

  if (permissoes.isPending) return <main className={s.pagina}><EstadoLista tipo="carregando" /></main>;
  if (permissoes.isError) {
    return (
      <main className={s.pagina}>
        <EstadoLista tipo="erro" mensagem={mensagemParaUsuario(permissoes.error, 'carregar')} onTentarDeNovo={() => void permissoes.refetch()} />
      </main>
    );
  }
  const abas = abasPermitidas(permissoes.data);
  if (abas.length === 0) return <main className={s.pagina}><p role="status">Você não tem acesso às extensões de jornada.</p></main>;
  if (!ehAba(aba) || !abas.includes(aba)) return <Navigate to={`/extensoes/${abas[0]}`} replace />;

  return (
    <main className={s.pagina}>
      <header className={s.cabecalho}>
        <h1>Extensões de jornada</h1>
        {permissoes.data.podePedir && <Link to="/extensoes/meus/novo" className="sc-btn sc-btn--primary">+ Nova extensão</Link>}
      </header>
      <AbasExtensoes abas={abas} />
    </main>
  );
}
```

`features/extensoes/routes.tsx`:

```tsx
import { Route, Routes } from 'react-router-dom';
import { ExtensoesPage } from './components/ExtensoesPage';

export function RotasExtensoes() {
  return (
    <Routes>
      <Route index element={<ExtensoesPage />} />
      <Route path=":aba" element={<ExtensoesPage />} />
    </Routes>
  );
}
```

`app/src/app/Provedores.tsx`:

```tsx
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AvisosProvider } from '../features/extensoes/components/Avisos';

export function Provedores({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AvisosProvider>{children}</AvisosProvider>
    </QueryClientProvider>
  );
}
```

`app/src/app/AppRoutes.tsx`:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { RotasExtensoes } from '../features/extensoes/routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/extensoes/*" element={<RotasExtensoes />} />
      <Route path="*" element={<Navigate to="/extensoes" replace />} />
    </Routes>
  );
}
```

`app/src/App.tsx` (substituir):

```tsx
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/AppRoutes';
import { Provedores } from './app/Provedores';
import { criarQueryClient } from './app/queryClient';

const client = criarQueryClient();

export default function App() {
  return (
    <Provedores client={client}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </Provedores>
  );
}
```

`api/mocks/browser.ts`:

```ts
import { setupWorker } from 'msw/browser';
import { decidirExterno, entrarComo, PESSOAS, resetarDb, simularFalha, type ChavePessoa } from './db';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// ?como=ana troca o usuário simulado (útil no navegador e no Playwright).
const como = new URLSearchParams(window.location.search).get('como');
if (como && como in PESSOAS) entrarComo(como as ChavePessoa);

Object.assign(window, { __scuaMock: { entrarComo, decidirExterno, simularFalha, resetarDb } });
```

`app/src/main.tsx` (substituir):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../design-system/tokens.css';
import '../../design-system/base.css';
import '../../design-system/components.css';
import './index.css';
import App from './App';

async function iniciar() {
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { worker } = await import('./features/extensoes/api/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void iniciar();
```

Apagar `app/src/App.test.tsx` (o teste de fumaça da Task 1 deixa de valer; a página tem testes próprios).

- [ ] **Step 5: Ver passar**

Run: `npm test && npm run typecheck && npm run lint`
Expected: todos PASS (avisos de `react-refresh/only-export-components` em `Avisos.tsx` são aceitáveis).

- [ ] **Step 6: Conferir no navegador**

Run: `npm run dev:mock`. Abrir `http://localhost:5173/extensoes` → abas "Para aprovar (5)" e "Meus pedidos". Abrir `http://localhost:5173/extensoes?como=renata` → só "Todos".

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "Casca da página de extensões com abas por perfil"
```

---

### Task 10: Lista — filtros, contadores, tabela, paginação e estados

**Files:**
- Create: `components/useFiltros.ts`, `components/ListaPedidos.tsx`, `components/FiltrosBarra.tsx`, `components/Contadores.tsx`, `components/TabelaPedidos.tsx`, `components/SeloStatus.tsx`, `components/Paginacao.tsx`
- Modify: `components/ExtensoesPage.tsx`, `extensoes.module.css`
- Test: `components/ListaPedidos.test.tsx`

**Interfaces:**
- Consumes: `useListaPedidos`, `useTotais` (Task 8), `extensoesApi.exportarUrl` (Task 7), formatação (Task 5), horas (Task 2), `EstadoLista` (Task 9).
- Produces: `periodoPadrao(aba, hoje)`, `semPaginacao(f: Filtros): FiltrosSemPagina`, `useFiltros(aba): { filtros: Filtros; atualizar(m: Partial<Record<ChaveFiltro, string>>): void; limpar(): void; ativos: number }`; `TAMANHOS_PAGINA = [10, 25, 50]`; `SeloStatus({ status })`; `TabelaPedidos({ aba, pedidos })` (cada linha tem link `/extensoes/<aba>/<id><search>`); `ListaPedidos({ aba })`.

- [ ] **Step 1: Teste que falha** — criar `components/ListaPedidos.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { server } from '../../../test/server';
import { extensoesApi } from '../api/extensoesApi';
import { entrarComo } from '../api/mocks/db';

const NOMES = /Ana Souza|João Lima|Bia Rocha|Rui Alves|Xavier Pinto/;
const kpi = (nome: string) => screen.findByRole('article', { name: nome });
const linhaDe = (nome: string) => screen.getAllByRole('link', { name: nome })[0].closest('tr')!;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Lista de pedidos', () => {
  it('fila mostra pendente de setembro primeiro (mais antigo primeiro)', async () => {
    renderApp('/extensoes/aprovar');
    await screen.findByRole('link', { name: 'Rui Alves' });
    const nomes = screen.getAllByRole('link', { name: NOMES }).map((l) => l.textContent);
    expect(nomes).toEqual(['Bia Rocha', 'João Lima', 'Ana Souza', 'Bia Rocha', 'Rui Alves']);
    expect(linhaDe('Bia Rocha')).toHaveTextContent('29/09 · 18:00–20:00');
  });

  it('linha mostra horas, motivo e status; contadores mostram o período', async () => {
    renderApp('/extensoes/aprovar');
    await screen.findByRole('link', { name: 'Ana Souza' });
    const ana = linhaDe('Ana Souza');
    expect(ana).toHaveTextContent('13–15/10 · 18:00–20:00');
    expect(within(ana).getByText('6h')).toBeInTheDocument();
    expect(within(ana).getByText('Janela de deploy')).toBeInTheDocument();
    expect(within(ana).getByText('Pendente')).toBeInTheDocument();
    const emAprovacao = await kpi('Em aprovação');
    expect(emAprovacao).toHaveTextContent('5');
    expect(emAprovacao).toHaveTextContent('no total');
  });

  it('"Meus pedidos" mostra pedido do mês que vem e o rótulo do período', async () => {
    await extensoesApi.criar({ beneficiarioId: 'u-ana', dataInicial: '2026-11-05', dataFinal: '2026-11-05', horario: { inicio: '18:00', fim: '19:00' }, justificativaCodigo: '5', detalhes: '' });
    entrarComo('ana');
    renderApp('/extensoes/meus');
    expect(await screen.findByText('05/11 · 18:00–19:00')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ana Souza' })).toHaveLength(4);
    const horas = await kpi('Horas aprovadas');
    expect(horas).toHaveTextContent('6h');
    expect(horas).toHaveTextContent('a partir de 01/10');
  });

  it('RH filtra por status e o link de exportar leva o filtro', async () => {
    entrarComo('renata');
    const { user } = renderApp('/extensoes/todos');
    await screen.findByRole('link', { name: 'Xavier Pinto' });
    await user.selectOptions(screen.getByLabelText('Status'), 'reprovado');
    await waitFor(() => expect(screen.getAllByRole('link', { name: NOMES })).toHaveLength(1));
    expect(screen.getByRole('link', { name: 'João Lima' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Exportar' })).toHaveAttribute('href', '/api/extensoes/exportar?aba=todos&de=2026-10-01&ate=2026-10-31&status=reprovado');
  });

  it('aba vazia mostra a mensagem própria', async () => {
    renderApp('/extensoes/meus');
    expect(await screen.findByText('Você ainda não pediu nenhuma extensão.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '+ Nova extensão' })).toHaveLength(2);
  });

  it('filtro sem resultado oferece limpar filtros', async () => {
    entrarComo('renata');
    const { user } = renderApp('/extensoes/todos');
    await screen.findByRole('link', { name: 'Xavier Pinto' });
    await user.type(screen.getByLabelText('Pessoa'), 'zzz');
    const vazio = await screen.findByText('Nenhum pedido no mês com esses filtros.');
    await user.click(within(vazio.closest('.sc-state') as HTMLElement).getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('link', { name: 'Xavier Pinto' })).toBeInTheDocument();
  });

  it('erro ao carregar mostra mensagem amigável e tenta de novo', async () => {
    server.use(http.get('*/api/extensoes', () => HttpResponse.json({ codigo: 'X' }, { status: 500 }), { once: true }));
    const { user } = renderApp('/extensoes/aprovar');
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não conseguimos carregar os pedidos');
    expect(alerta).not.toHaveTextContent('500');
    await user.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Rui Alves' })).toBeInTheDocument();
  });

  it('ignora paginação e status inválidos na URL', async () => {
    renderApp('/extensoes/aprovar?pagina=abc&tamanho=9999&status=xyz');
    await screen.findByRole('link', { name: 'Rui Alves' });
    expect(screen.getByLabelText('Itens por página')).toHaveValue('25');
    expect(screen.getByText('1–5 de 5')).toBeInTheDocument();
  });

  it('volta para a página 1 quando a página pedida não existe', async () => {
    renderApp('/extensoes/aprovar?pagina=9');
    expect(await screen.findByRole('link', { name: 'Rui Alves' })).toBeInTheDocument();
    expect(screen.getByText('1–5 de 5')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ver falhar**

Run: `npx vitest run src/features/extensoes/components/ListaPedidos.test.tsx`
Expected: FAIL — a página ainda não mostra tabela.

- [ ] **Step 3: Implementar**

`components/Paginacao.tsx`:

```tsx
export const TAMANHOS_PAGINA = [10, 25, 50];

interface Props { total: number; pagina: number; tamanho: number; aoMudar: (pagina: number, tamanho: number) => void }

export function Paginacao({ total, pagina, tamanho, aoMudar }: Props) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanho + 1;
  const fim = Math.min(total, pagina * tamanho);
  return (
    <nav aria-label="Paginação" className="sc-pager">
      <label className="sc-pager__size">
        Itens por página
        <select className="sc-select" value={tamanho} onChange={(e) => aoMudar(1, Number(e.target.value))}>
          {TAMANHOS_PAGINA.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <span className="sc-num">{inicio}–{fim} de {total}</span>
      <div className="sc-pager__nav">
        <button type="button" className="sc-btn sc-btn--secondary" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1, tamanho)}>Anterior</button>
        <button type="button" className="sc-btn sc-btn--secondary" disabled={fim >= total} onClick={() => aoMudar(pagina + 1, tamanho)}>Próxima</button>
      </div>
    </nav>
  );
}
```

`components/useFiltros.ts`:

```ts
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hojeLocal, periodoDoMes } from '../domain/formatacao';
import type { Aba, Filtros, FiltrosSemPagina, Status } from '../domain/types';
import { TAMANHOS_PAGINA } from './Paginacao';

const STATUS: Status[] = ['pendente', 'aprovado', 'reprovado', 'cancelado'];
const CHAVES_FILTRO = ['de', 'ate', 'status', 'pessoa', 'gestor', 'grupo'] as const;
export type ChaveFiltro = (typeof CHAVES_FILTRO)[number] | 'pagina' | 'tamanho';

/** Ver "Decisões tomadas no plano" 1–3. */
export function periodoPadrao(aba: Aba, hoje: string): { de: string; ate: string } {
  const mes = periodoDoMes(hoje);
  if (aba === 'aprovar') return { de: '', ate: '' };
  if (aba === 'meus') return { de: mes.de, ate: '' };
  return mes;
}

export function semPaginacao(f: Filtros): FiltrosSemPagina {
  const { pagina, tamanho, ...resto } = f;
  void pagina;
  void tamanho;
  return resto;
}

/** Filtros vivem na URL. Valores inválidos viram o padrão. */
export function useFiltros(aba: Aba) {
  const [params, setParams] = useSearchParams();
  const padrao = periodoPadrao(aba, hojeLocal());
  const pagina = Number(params.get('pagina'));
  const tamanho = Number(params.get('tamanho'));
  const status = params.get('status') as Status | null;

  const filtros: Filtros = {
    aba,
    de: params.get('de') ?? padrao.de,
    ate: params.get('ate') ?? padrao.ate,
    status: status && STATUS.includes(status) ? status : undefined,
    pessoa: params.get('pessoa') || undefined,
    gestor: params.get('gestor') || undefined,
    grupo: params.get('grupo') || undefined,
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : 25,
  };
  const ativos = CHAVES_FILTRO.filter((c) => params.has(c)).length;

  const atualizar = useCallback((mudancas: Partial<Record<ChaveFiltro, string>>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === undefined) continue;
        // "De"/"Até" vazios são escolha do usuário (sem limite), então ficam na URL.
        if (valor === '' && chave !== 'de' && chave !== 'ate') novo.delete(chave);
        else novo.set(chave, valor);
      }
      if (!('pagina' in mudancas)) novo.delete('pagina');
      return novo;
    }, { replace: true });
  }, [setParams]);

  const limpar = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return { filtros, atualizar, limpar, ativos };
}
```

`components/SeloStatus.tsx`:

```tsx
import type { Status } from '../domain/types';

const SELO: Record<Status, { rotulo: string; classe: string }> = {
  pendente: { rotulo: 'Pendente', classe: 'sc-badge--warning' },
  aprovado: { rotulo: 'Aprovado', classe: 'sc-badge--success' },
  reprovado: { rotulo: 'Reprovado', classe: 'sc-badge--danger' },
  cancelado: { rotulo: 'Cancelado', classe: 'sc-badge--neutral' },
};

export function SeloStatus({ status }: { status: Status }) {
  return <span className={`sc-badge ${SELO[status].classe}`}>{SELO[status].rotulo}</span>;
}
```

`components/Contadores.tsx`:

```tsx
import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import { formatarDuracao } from '../domain/horas';
import type { Totais } from '../domain/types';
import s from '../extensoes.module.css';

function Kpi({ rotulo, valor, periodo }: { rotulo: string; valor: string; periodo: string }) {
  const id = useId();
  return (
    <article className="sc-kpi" aria-labelledby={id}>
      <h3 className="sc-kpi__label" id={id}>{rotulo}</h3>
      <p className="sc-kpi__value">{valor}</p>
      <p className={`sc-kpi__period ${s.periodo}`}>{periodo}</p>
    </article>
  );
}

export function Contadores({ totais, rotulo }: { totais: UseQueryResult<Totais>; rotulo: string }) {
  if (totais.isPending) {
    return (
      <div className={s.contadores} aria-hidden="true">
        {[0, 1, 2].map((i) => <div key={i} className="sc-kpi"><span className="sc-skeleton" /></div>)}
      </div>
    );
  }
  if (totais.isError) return null;
  const t = totais.data;
  return (
    <div className={s.contadores}>
      <Kpi rotulo="Em aprovação" valor={String(t.pendentes)} periodo={rotulo} />
      <Kpi rotulo="Horas aprovadas" valor={formatarDuracao(t.minutosAprovados)} periodo={rotulo} />
      <Kpi rotulo="Reprovados" valor={String(t.reprovados)} periodo={rotulo} />
    </div>
  );
}
```

`components/TabelaPedidos.tsx`:

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatarPeriodo } from '../domain/formatacao';
import { formatarDuracao, totalMinutos } from '../domain/horas';
import type { Aba, Pedido } from '../domain/types';
import { SeloStatus } from './SeloStatus';
import s from '../extensoes.module.css';

export function TabelaPedidos({ aba, pedidos }: { aba: Aba; pedidos: Pedido[] }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const linkDe = (id: string) => `/extensoes/${aba}/${id}${search}`;

  return (
    <div className="sc-table-wrap">
      <div className="sc-table-scroll">
        <table className={`sc-table ${s.tabela}`}>
          <caption className="sc-sr-only">Pedidos de extensão</caption>
          <thead>
            <tr>
              <th scope="col">Beneficiário</th>
              {aba === 'todos' && <><th scope="col">Solicitante</th><th scope="col">Gestor</th></>}
              <th scope="col">Período</th>
              <th scope="col">Horas</th>
              <th scope="col">Justificativa</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className={s.linha}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('a, input, button, label')) return;
                  navigate(linkDe(p.id));
                }}>
                <td data-rotulo="Beneficiário"><Link to={linkDe(p.id)}>{p.beneficiario.nome}</Link></td>
                {aba === 'todos' && (
                  <>
                    <td data-rotulo="Solicitante">{p.solicitante.nome}</td>
                    <td data-rotulo="Gestor">{p.gestor?.nome ?? '—'}</td>
                  </>
                )}
                <td data-rotulo="Período">{formatarPeriodo(p.dataInicial, p.dataFinal, p.horario)}</td>
                <td data-rotulo="Horas" className="sc-num">{formatarDuracao(totalMinutos(p.dataInicial, p.dataFinal, p.horario))}</td>
                <td data-rotulo="Justificativa">{p.justificativa.descricao}</td>
                <td data-rotulo="Status"><SeloStatus status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

`components/FiltrosBarra.tsx`:

```tsx
import { useEffect, useId, useState } from 'react';
import { extensoesApi } from '../api/extensoesApi';
import type { Aba, Filtros } from '../domain/types';
import { semPaginacao, type ChaveFiltro } from './useFiltros';
import s from '../extensoes.module.css';

function CampoTextoAtrasado({ rotulo, valor, aoMudar }: { rotulo: string; valor: string; aoMudar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor);
  const id = useId();
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto === valor) return;
    const t = window.setTimeout(() => aoMudar(texto), 300);
    return () => window.clearTimeout(t);
  }, [texto, valor, aoMudar]);
  return (
    <div className={`sc-field ${s.filtro}`}>
      <label className="sc-label" htmlFor={id}>{rotulo}</label>
      <input id={id} className="sc-input" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} />
    </div>
  );
}

interface Props {
  aba: Aba;
  filtros: Filtros;
  ativos: number;
  atualizar: (m: Partial<Record<ChaveFiltro, string>>) => void;
  limpar: () => void;
}

export function FiltrosBarra({ aba, filtros, ativos, atualizar, limpar }: Props) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const idDe = useId();
  const idAte = useId();
  const idStatus = useId();

  return (
    <div className={s.filtros}>
      <button type="button" className={`sc-btn sc-btn--secondary ${s.botaoFiltros}`} aria-expanded={aberto} aria-controls={idPainel} onClick={() => setAberto((a) => !a)}>
        Filtros{ativos > 0 ? ` (${ativos})` : ''}
      </button>
      <div id={idPainel} className={s.painelFiltros} data-aberto={aberto}>
        <div className={`sc-field ${s.filtro}`}>
          <label className="sc-label" htmlFor={idDe}>De</label>
          <input id={idDe} className="sc-input" type="date" value={filtros.de} onChange={(e) => atualizar({ de: e.target.value })} />
        </div>
        <div className={`sc-field ${s.filtro}`}>
          <label className="sc-label" htmlFor={idAte}>Até</label>
          <input id={idAte} className="sc-input" type="date" value={filtros.ate} onChange={(e) => atualizar({ ate: e.target.value })} />
        </div>
        {aba !== 'aprovar' && (
          <div className={`sc-field ${s.filtro}`}>
            <label className="sc-label" htmlFor={idStatus}>Status</label>
            <select id={idStatus} className="sc-select" value={filtros.status ?? ''} onChange={(e) => atualizar({ status: e.target.value })}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}
        <CampoTextoAtrasado rotulo="Pessoa" valor={filtros.pessoa ?? ''} aoMudar={(v) => atualizar({ pessoa: v })} />
        {aba === 'todos' && (
          <>
            <CampoTextoAtrasado rotulo="Gestor" valor={filtros.gestor ?? ''} aoMudar={(v) => atualizar({ gestor: v })} />
            <CampoTextoAtrasado rotulo="Grupo" valor={filtros.grupo ?? ''} aoMudar={(v) => atualizar({ grupo: v })} />
            <a className="sc-btn sc-btn--secondary" href={extensoesApi.exportarUrl(semPaginacao(filtros))} download>Exportar</a>
          </>
        )}
        {ativos > 0 && <button type="button" className="sc-btn sc-btn--secondary" onClick={limpar}>Limpar filtros</button>}
      </div>
    </div>
  );
}
```

`components/ListaPedidos.tsx`:

```tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mensagemParaUsuario } from '../domain/erros';
import { hojeLocal, rotuloPeriodo } from '../domain/formatacao';
import type { Aba } from '../domain/types';
import { useListaPedidos, useTotais } from '../hooks/queries';
import { Contadores } from './Contadores';
import { EstadoLista } from './EstadoLista';
import { FiltrosBarra } from './FiltrosBarra';
import { Paginacao } from './Paginacao';
import { TabelaPedidos } from './TabelaPedidos';
import { semPaginacao, useFiltros } from './useFiltros';
import s from '../extensoes.module.css';

export function ListaPedidos({ aba }: { aba: Aba }) {
  const { filtros, atualizar, limpar, ativos } = useFiltros(aba);
  const lista = useListaPedidos(filtros);
  const totais = useTotais(semPaginacao(filtros));
  const rotulo = rotuloPeriodo(filtros.de, filtros.ate, hojeLocal());
  const dados = lista.data;

  // Página além do fim (URL antiga ou itens que sumiram): volta para a primeira.
  useEffect(() => {
    if (dados && dados.itens.length === 0 && dados.total > 0 && filtros.pagina > 1) atualizar({ pagina: '1' });
  }, [dados, filtros.pagina, atualizar]);

  let conteudo;
  if (lista.isPending) {
    conteudo = <EstadoLista tipo="carregando" />;
  } else if (lista.isError) {
    conteudo = <EstadoLista tipo="erro" mensagem={mensagemParaUsuario(lista.error, 'carregar')} onTentarDeNovo={() => void lista.refetch()} />;
  } else if (lista.data.itens.length === 0 && ativos > 0) {
    conteudo = (
      <EstadoLista tipo="vazio" titulo={`Nenhum pedido ${rotulo} com esses filtros.`}
        acao={<button type="button" className="sc-btn sc-btn--secondary" onClick={limpar}>Limpar filtros</button>} />
    );
  } else if (lista.data.itens.length === 0) {
    conteudo =
      aba === 'aprovar' ? <EstadoLista tipo="vazio" icone="✓" titulo="Tudo em dia!" texto="Nenhum pedido esperando sua aprovação." />
      : aba === 'meus' ? <EstadoLista tipo="vazio" titulo="Você ainda não pediu nenhuma extensão." acao={<Link to="/extensoes/meus/novo" className="sc-btn sc-btn--primary">+ Nova extensão</Link>} />
      : <EstadoLista tipo="vazio" titulo={`Nenhum pedido ${rotulo}.`} />;
  } else {
    conteudo = (
      <>
        <TabelaPedidos aba={aba} pedidos={lista.data.itens} />
        <Paginacao total={lista.data.total} pagina={filtros.pagina} tamanho={filtros.tamanho}
          aoMudar={(pagina, tamanho) => atualizar({ pagina: String(pagina), tamanho: String(tamanho) })} />
      </>
    );
  }

  return (
    <section aria-label="Pedidos" className={s.lista}>
      <FiltrosBarra aba={aba} filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      <Contadores totais={totais} rotulo={rotulo} />
      {conteudo}
    </section>
  );
}
```

Em `components/ExtensoesPage.tsx`, importar e renderizar a lista logo depois das abas:

```tsx
import { ListaPedidos } from './ListaPedidos';
```

```tsx
      <AbasExtensoes abas={abas} />
      <ListaPedidos key={aba} aba={aba} />
```

Acrescentar ao fim de `extensoes.module.css`:

```css
.lista { display: grid; gap: var(--space-4); }
.filtros { display: grid; gap: var(--space-3); }
.botaoFiltros { justify-self: start; }
.painelFiltros { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-3); }
.filtro { width: 11rem; }
.contadores { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); }
.periodo::first-letter { text-transform: uppercase; }
.tabela .linha { cursor: pointer; }
.tabela .linha a { color: var(--color-text); font-weight: 600; }
@media (min-width: 768px) { .botaoFiltros { display: none; } }
```

- [ ] **Step 4: Ver passar**

Run: `npm test && npm run typecheck`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "Lista de extensões com filtros na URL, contadores e paginação"
```
