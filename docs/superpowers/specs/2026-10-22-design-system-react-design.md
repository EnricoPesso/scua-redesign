# Design system Scua em React: spec

Autor: Pedro (Pessoa 1). Branch: `p1/react-base`. Aprovado por Pedro em 2026-10-22 (abordagem A).

## Objetivo

Entregar tokens e componentes base do redesign do Scua Logon, em React, para as Pessoas 2, 3 e 4 construírem as telas em cima. Substitui o PR #1 (CSS puro, fechado).

## Escopo

Dentro:
- Tokens: cores, tipografia, espaçamento, raio, sombra.
- 15 componentes: botão (primário, secundário, perigo, só ícone), campo, select, multi-select, data, checkbox e toggle, badge de status, card de KPI, tabela com paginação, drawer, modal de confirmação, toast, estado vazio, estado de erro, skeleton.
- Página de documentação em React com todos os estados: padrão, hover, foco, desabilitado, carregando, vazio e erro.
- Seção 3.5 do `CLAUDE.md` do repo com os comandos reais.

Fora:
- Modo escuro (a Scua nunca pediu).
- Storybook.
- Menu, glossário e 3 telas prioritárias (Fase 0 de grupo, dependem da Scua).

## Abordagem

shadcn sobre `@base-ui/react`, com Tailwind v4. Tokens em 3 camadas como variáveis CSS: primitivo, semântico, componente. Cada componente é um arquivo fino em `design-system/src/components/ui/`.

## Identidade

| Token | Valor | Observação |
|---|---|---|
| Laranja Scua | `#E96B0A` | Fundo do botão primário com texto escuro (branco dá 3,2:1 e reprova AA) |
| Laranja texto | `#a34607` | Texto laranja sobre fundo claro |
| Creme | `#FBE9DA` | Fundo de destaque |
| Cinza quente | `#F4F2EF` | Fundo de página |
| Fonte única | Montserrat (pesos 400, 500, 600, 700) | Medida em 2026-10-22: o app Logon usa Montserrat em campos e rótulos da tela de login (sem logar), e o site scua.com.br usa Montserrat 600 nos títulos |
| Fallback | Roboto, pilha do sistema | O Logon atual cai em Roboto no corpo |

Dado que falta: telas internas do Logon, que exigem login. Se elas usarem outra fonte, os tokens de tipografia mudam em um arquivo só.

## Fontes externas

- ReactBits: no máximo 2 ou 3 itens sem risco, cada um aprovado à parte, respeitando `prefers-reduced-motion`.
- Uiverse via repositório `galaxy` (MIT): só loaders, toggle e checkbox, e só se superarem o shadcn.
- Mobbin: referência visual no plano grátis, lida pelo Chrome.


## Critérios de pronto

Seção 3 do `CLAUDE.md` do repo: screenshots em 3 tamanhos (1440×900, 768×1024, 390×844), WCAG AA, Lighthouse a11y ≥95 e perf ≥90 no mobile (rodar 2 vezes), console sem erro, `build`, `lint` e `tsc -b` passando, `code-review` sem crítico em aberto.

## Fases

| # | Fase | Skills |
|---|---|---|
| 1 | Tokens e `contrast.mjs` portado (32 pares AA) | `ui-ux-pro-max:design-system`, `theme-factory` |
| 2 | Botão, campo, tabela com paginação | `frontend-design`, `vercel:shadcn`, `vercel:react-best-practices` |
| 3 | Os 12 componentes restantes | as mesmas |
| 4 | Página de documentação | `frontend-design` |
| 5 | Verificação | `verification-before-completion`, Lighthouse CLI, Chrome |
| 6 | Revisão | `code-review`, `simplify`, `web-design-guidelines`, `/codex:review` |
| 7 | Commit e PR | `push`, só depois de Pedro dizer sim |

Pedro confere ao fim de cada fase.

## Riscos

| Risco | Mitigação |
|---|---|
| ReactBits e Uiverse trazem animação e contraste fora do padrão | Aprovação item a item, teste com `prefers-reduced-motion` |
| Stack final depende da pergunta 35 para a Scua | Pedro avisa o grupo; componentes ficam isolados em `design-system/` |
| Skills do `CLAUDE.md` do repo ausentes aqui | Usar equivalentes; as ausentes são instaladas depois |
