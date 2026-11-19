# CLAUDE.md — Projeto SCUA (redesign de UI/UX)

Cliente: **Scua** (https://scua.com.br/), empresa de gestão de jornada de trabalho. Produto principal: **Scua Logon**.
Tarefa: refazer a UI e a UX do sistema.

Este documento cresce aos poucos. Por enquanto ele define só três coisas: **skills e plugins**, **modelos por etapa** e **critérios de pronto**.

---

## 1. Skills e plugins

### Regra geral
- Antes de começar uma etapa, verifique na tabela abaixo qual skill se aplica e invoque-a com a ferramenta `Skill`. Se ela não servir para o caso, pode descartar.
- Skill de processo vem antes de skill de implementação (ex.: `brainstorming` → `frontend-design`).
- Não use plugins fora desta lista sem perguntar antes (Vercel, Stripe, Supabase etc. não fazem parte do escopo por enquanto).

### Por etapa

| Etapa | Skill / plugin | Para quê |
|---|---|---|
| Entender o site/sistema atual | **Playwright MCP** (`mcp__plugin_playwright_playwright__*`) | Abrir páginas, tirar screenshots, ler o DOM. **É o navegador padrão deste projeto.** |
| Descobrir requisitos / ideias | `superpowers:brainstorming` | Explorar o problema antes de desenhar qualquer coisa |
| Planejar uma entrega | `superpowers:writing-plans` → `superpowers:executing-plans` | Quebrar em passos verificáveis |
| Sistema de design (cores, tipografia, tokens) | `design-consultation` | Definir a base visual a partir da identidade da Scua |
| Variações de layout | `design-shotgun` | Gerar e comparar alternativas de uma tela |
| Implementar telas | `frontend-design:frontend-design` | Código de UI com qualidade de produção |
| Componentes React/shadcn (se a stack for essa) | `vercel:shadcn`, `vercel:react-best-practices` | Padrões de componente |
| Revisar a UI pronta | `design-review`, `web-design-guidelines` | Auditoria visual e de boas práticas |
| Acessibilidade | `chrome-devtools-mcp:a11y-debugging` | Contraste, foco, leitores de tela |
| Performance | `chrome-devtools-mcp:chrome-devtools` (Lighthouse) | Core Web Vitals |
| QA funcional | `qa` / `qa-only` | Testar fluxos ponta a ponta |
| Revisão de código | `code-review`, `simplify` | Bugs e limpeza antes de fechar a entrega |
| Antes de dizer "pronto" | `superpowers:verification-before-completion` | **Obrigatório** — ver a seção 3 |
| Bug inesperado | `superpowers:systematic-debugging` | Achar a causa antes de corrigir |
| Entregável para o cliente | `Artifact` (página publicada) | Relatórios, apresentações de proposta |

---

## 2. Modelos por etapa

Use o modelo mais barato que dá conta da etapa. Para subagentes, o modelo é escolhido com o parâmetro `model` da ferramenta `Agent`.

| Etapa | Modelo | Motivo |
|---|---|---|
| Descoberta, arquitetura de informação, decisões de UX, sistema de design | **Opus 5.5** (`opus`) | Raciocínio e julgamento de design |
| Planejamento de entregas e revisão final (design-review, code-review) | **Opus 5.5** (`opus`) | Detectar problemas sutis |
| Implementação de telas e componentes | **Sonnet 5.5** (`sonnet`) | Bom equilíbrio entre qualidade e custo para codar |
| Testes, QA e correções pontuais | **Sonnet 5.5** (`sonnet`) | Execução repetitiva com algum julgamento |
| Tarefas mecânicas: buscar arquivos, tirar screenshots em lote, renomear, extrair textos | **Haiku 4.5** (`haiku`) | Rápido e barato |

Regras:
- Exploração ampla do código vai para um subagente `Explore` (Haiku ou Sonnet), não para o contexto principal.
- Nunca use Haiku para decidir design ou aprovar uma entrega.
- Workflows com muitos agentes só rodam se o usuário pedir explicitamente.

---

## 3. Critérios de pronto (verificação)

Uma tela ou componente **só está pronto** quando passar em **todos** os itens abaixo. Se algum falhar, a entrega fica marcada como **não pronta**, com o motivo.

### 3.1 Visual (Playwright)
- [ ] Screenshot nos 3 tamanhos: **desktop 1440×900**, **tablet 768×1024**, **mobile 390×844**.
- [ ] Nenhum texto quebrando de forma errada (ex.: itens do menu empilhados), nada cortado e nenhuma rolagem horizontal.
- [ ] Segue a identidade da Scua: laranja principal (~`#E96B0A`), fundos creme/cinza quente, destaque de palavra-chave em laranja. **Sem cores fora dos tokens** (o azul-marinho do rodapé atual não vale como referência).
- [ ] Estados cobertos: padrão, hover, foco, desabilitado, carregando, vazio e erro (quando se aplicam).

### 3.2 Funcional
- [ ] Todos os fluxos principais da tela funcionam de ponta a ponta no Playwright (clicar, preencher, enviar).
- [ ] **Zero erros no console** do navegador.
- [ ] Nenhum link quebrado (404).

### 3.3 Acessibilidade
- [ ] Contraste **WCAG AA** (4.5:1 para texto normal e 3:1 para texto grande e ícones).
- [ ] Dá para navegar tudo só com o teclado, com foco visível.
- [ ] Imagens com `alt`, campos com `label` e botões com nome acessível.
- [ ] Lighthouse Accessibility **≥ 95**.

### 3.4 Performance
- [ ] Lighthouse Performance **≥ 90** no mobile.
- [ ] LCP < 2,5 s · CLS < 0,1 · INP < 200 ms.

### 3.5 Código
- [ ] Build, lint e typecheck passam sem erros. Na pasta `design-system/`: `npm run build`, `npm run lint` e `npx tsc -b`. Node 22.18 ou mais novo.
- [ ] Contraste dos tokens: `npm run contrast` (todos os pares aprovados).
- [ ] Testes automatizados passam: `npm test`.
- [ ] Na pasta `app/`: `npm run build`, `npm run lint`, `npx tsc -b`, `npm test` e `npm run e2e` (Playwright contra a API simulada; `PW_CANAL=chrome` usa o Chrome instalado).
- [ ] Assistente de IA: a chave fica só em `app/.env.local`, nas variáveis `SCUA_IA_PROVEDOR`, `SCUA_IA_CHAVE`, `SCUA_IA_MODELO` e `SCUA_IA_MODELO_ANALISE` (modelo em `app/.env.example`), **sem o prefixo `VITE_`**. Nunca no git, no navegador ou em log. Os testes sempre usam o modo simulado e não chamam a rede.
- [ ] `code-review` rodado, sem nenhum achado crítico em aberto.

### 3.6 Como reportar
- Ao fechar uma entrega, liste cada item como ✅ / ❌ e anexe os screenshots.
- Nunca diga "pronto" sem ter rodado as verificações. Se algum passo foi pulado, diga qual foi e por quê.
