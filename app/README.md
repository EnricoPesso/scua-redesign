# app/ — telas do Scua Logon (redesign)

Front-end das telas novas, em React 19 + Vite + TypeScript, usando os componentes do [`design-system/`](../design-system/). A primeira feature é **Extensões de jornada** (`/extensoes`).

## Começar

Node 22.18 ou mais novo.

```bash
cd ../design-system && npm ci   # os componentes do DS resolvem as dependências deles lá
cd ../app && npm ci
npm run dev:mock                 # http://localhost:5173/extensoes com a API simulada (MSW)
```

`npm run dev` sobe sem o mock, esperando a API real em `/api`.

### Trocar de usuário no mock

Acrescente `?como=<pessoa>` à URL (o estado do mock zera a cada recarga):

| `?como=` | Quem é | Vê |
|---|---|---|
| `carlos` (padrão) | Gestor de Ana, João, Bia e Rui | Para aprovar, Meus pedidos |
| `ana`, `joao`, `bia`, `rui` | Colaborador | Meus pedidos |
| `olga` | Gestora de Xavier | Para aprovar, Meus pedidos |
| `renata` | RH | Todos (com Exportar) |

No console do navegador, `window.__scuaMock` tem `entrarComo`, `decidirExterno(id, 'aprovado', 'whatsapp')` (decisão vinda de outro canal), `simularFalha(true)` (API fora do ar) e `resetarDb`.

## Comandos

| Comando | O quê |
|---|---|
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | oxlint |
| `npx tsc -b` | Typecheck (inclui `e2e/` e configs) |
| `npm test` | Vitest: regras puras, componentes e fluxos com MSW |
| `npm run e2e` | Playwright contra `dev:mock`: critérios de aceite 1–13 e screenshots em `e2e/screenshots/` (1440×900, 768×1024, 390×844) |

Para o Playwright usar o Google Chrome instalado em vez de baixar o Chromium: `PW_CANAL=chrome npm run e2e` (no PowerShell: `$env:PW_CANAL='chrome'; npm run e2e`).

## Organização

```
src/features/extensoes/
  domain/      regras puras, sem React (horas, limite, validação, formatação, erros, decisão)
  api/         cliente HTTP, funções da API e mock MSW (mocks/db.ts tem os dados de exemplo)
  hooks/       TanStack Query (consultas e mutações)
  components/  telas: lista, filtros, formulário, detalhe, lote
e2e/           Playwright
```

- Filtros, aba e pedido aberto vivem na **URL**: todo estado da tela pode ser compartilhado por link.
- Nenhuma mensagem técnica chega ao usuário; os detalhes vão para o `console.error`.
- O que o sistema de design ainda não tem (abas, tabela com seleção, barra de limite, barra de lote, grupo de rádio, diálogo com conteúdo livre) foi criado na feature com o comentário `// pedir ao @PhLima07`.

Spec: [`docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md`](../docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md) · Plano: [`docs/superpowers/plans/2026-10-22-extensao-de-jornada.md`](../docs/superpowers/plans/2026-10-22-extensao-de-jornada.md)
