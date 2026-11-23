# Plano — "Abismo competitivo" do Scua Logon

## Contexto

O diretor da liga sugeriu o dashboard personalizado a todos os grupos, então ele deixou de ser diferencial. Hoje o único diferencial do nosso grupo é o Assistente de IA (entregue em 19/11). O objetivo é abrir uma distância muito grande de qualidade para os outros grupos. Para isso: mapear os concorrentes da Scua no Brasil e no exterior, descobrir quais features seriam realmente inovadoras e construir de 3 a 5 "pilares" que nenhum outro grupo (e de preferência nenhum concorrente) tem.

Estado atual (de `sessoes.md`): app React + Vite com API simulada (MSW), 13 áreas em `app/src/features/`, design system próprio, e2e 199/199. Trabalho novo parte da `main`.

## Skills e plugins (regras.md §2)

- A busca externa da `find-skills` usa `npx skills find`. Ela está **bloqueada**: a política do JFrog proíbe `npx`/npm enquanto o roteamento não estiver configurado. A busca foi feita, então, entre as skills já instaladas.
- **Pesquisa (Fase 1):** `competitor-profiling` (perfil por concorrente), `customer-research` (dores em avaliações), `anthropic-skills:deep-research` (busca com várias fontes), `WebSearch` e o agente `web-fetch`.
- **Síntese (Fase 2):** `product-management:competitive-brief` (matriz e posicionamento).
- **Desenho (Fase 3):** `superpowers:brainstorming` → spec; `design-shotgun`.
- **Construção (Fase 4):** `superpowers:writing-plans` → `superpowers:executing-plans`, `frontend-design:frontend-design`, `superpowers:test-driven-development`.
- **Fechamento (Fase 5):** `design-review`, `code-review`, `superpowers:verification-before-completion`, `Artifact`.
- **Plugins fora do CLAUDE.md §1** (ex.: `nimble:competitor-intel`, Firecrawl, Exa): não usar sem perguntar. O plano não depende deles.
- **Skill nova:** se a pesquisa por concorrente se mostrar repetitiva, criar a skill `scua-perfil-concorrente` com a `skill-creator` e usá-la nos lotes seguintes.

## Fase 1 — Mapa da concorrência (só pesquisa, nenhum código)

**1.1 Lista de concorrentes (cerca de 30, em 3 camadas).** Um subagente Sonnet confirma e completa a lista:
- **A. Brasil, concorrência direta** (bloqueio de estação / controle de logon por jornada): descobrir quem faz o mesmo que o Scua Logon.
- **B. Brasil, ponto e gestão de jornada:** Sólides/Tangerino, Pontomais, Ahgora, Secullum, Oitchau, Kairos, PontoTel, Senior, TOTVS, Dimep, Control iD e outros.
- **C. Exterior:** gestão de força de trabalho (Deputy, Connecteam, UKG, Rippling, Factorial, Personio, When I Work) e monitoramento/produtividade (Hubstaff, Time Doctor, ActivTrak, Insightful, Teramind).

**1.2 Features por concorrente.** Quatro subagentes Sonnet em paralelo (A, B em duas metades, C), cada um seguindo a `competitor-profiling`:
- Fontes: site, central de ajuda, changelog/notas de versão, páginas de IA e de novidades.
- Saída padronizada por empresa: features, o que é novo em 2025–2026, o que usa IA, preço quando público, links das fontes.
- Arquivos: `analise-sistema/concorrencia/perfis/<empresa>.md`.

**1.3 Dores dos clientes.** Um subagente Sonnet com a `customer-research`: Reclame Aqui, G2, Capterra, lojas de apps. Saída: `analise-sistema/concorrencia/dores.md` (dor, frequência, citações com link). Aproveitar o que já existe em `analise-sistema/progresso.md` (seção Reclame Aqui e os 24 problemas de UX).

**1.4 Lente legal do Brasil.** Um subagente Sonnet: Portaria 671 (AFD/AEJ), direito à desconexão, NR-17, teletrabalho, LGPD, causas comuns de passivo trabalhista. Saída: `analise-sistema/concorrencia/lente-legal.md`.

**Regra de qualidade:** toda afirmação sobre concorrente tem link de fonte. Sem fonte, fica marcada como "não confirmado".

## Fase 2 — Síntese e escolha (Fable/Opus, contexto principal)

**2.1 Matriz feature × concorrente** em `analise-sistema/concorrencia/matriz.md`, incluindo a coluna "Scua hoje" (as 13 áreas + assistente).

**2.2 Classificação:** paridade (todo mundo tem) · diferencial (poucos têm) · inédito (ninguém tem, ou ninguém no Brasil).

**2.3 Candidatos a pilar:** cruzar inédito/diferencial × dor frequente × exigência legal. Hipóteses que a pesquisa confirma ou derruba:
- Radar de passivo trabalhista em R$ (exposição atual e quanto o Scua evitou).
- Previsão de estouro de jornada e risco de burnout, com alerta antecipado.
- Assistente proativo ("3 coisas que precisam de você hoje", ação em lote com aprovação).
- Dossiê de fiscalização em 1 clique (AFD/AEJ, trilha de auditoria, linha do tempo da pessoa).
- Aprovação de extensão por Teams/Slack/WhatsApp ou app de gestor (PWA).
- Comparação com a média do setor.

**2.4 Priorização:** nota por impacto na banca/cliente, efeito na demonstração (dá para mostrar em 30 s?), esforço e viabilidade com a API simulada. Saída: `analise-sistema/concorrencia/pilares-propostos.md` com 3 a 5 pilares, cada um com frase de venda, evidência da pesquisa e esboço da tela.

**🛑 Checkpoint 1:** mostrar matriz, classificação e pilares. O responsável escolhe os pilares e informa a data da apresentação (define se cabem 3 ou 5).

## Fase 3 — Desenho (por pilar aprovado)

- `superpowers:brainstorming` → spec em `docs/superpowers/specs/2026-11-XX-<pilar>-design.md`.
- `design-shotgun` nas telas principais: 2 ou 3 variações.
- Reusar o que já existe: `app/src/componentes/` (modelo de cadastro e de relatório), componentes do `design-system/` (KPI, tabela, drawer, toast), o estado e o contrato do assistente em `app/src/features/assistente/` e `docs/contrato-assistente.md`, os mocks em `app/src/mock/`.

**🛑 Checkpoint 2:** aprovação de spec e layout de cada pilar.

## Fase 4 — Construção

- Branch nova a partir da `main` atualizada.
- `superpowers:writing-plans` → um plano por pilar em `docs/superpowers/plans/`.
- Execução com subagentes Sonnet, TDD, mock MSW e e2e Playwright, no mesmo formato do assistente.
- A cada bloco visível: abrir no navegador (`npm run dev:mock`, porta 5173) e esperar o ok **antes do commit**. Commits só locais.

## Fase 5 — Verificação e entrega

- Critérios da seção 3 do `CLAUDE.md` para cada tela nova, reportados com ✅ / ❌.
- `design-review` e `code-review` com Opus.
- Entregáveis para a apresentação:
  - Relatório de concorrência publicado como Artifact (matriz "nós × mercado" e os pilares).
  - Roteiro de demonstração de 3 minutos em `docs/roteiro-demo.md`.

## Registro (regras.md §3)

Ao fim de cada fase e de cada pilar: entrada no `sessoes.md` (o que, por quê, pendências) e atualização de "Onde paramos". Salvar também este plano em `docs/superpowers/plans/2026-11-23-abismo-competitivo.md` no início da execução.

## Verificação

- **Fase 1:** cada perfil tem fontes com link; a lista cobre as 3 camadas; amostra de 5 afirmações conferida abrindo a fonte.
- **Fase 2:** todo pilar proposto aponta para linhas da matriz e para pelo menos uma dor ou exigência legal documentada.
- **Fases 4–5:** em `app/`: `npm run build`, `npm run lint`, `npx tsc -b`, `npm test`, `npm run e2e`; em `design-system/`: os mesmos mais `npm run contrast`; screenshots nos 3 tamanhos, console sem erros, Lighthouse a11y ≥ 95 e performance ≥ 90 no mobile.

## Custo e limites

- A Fase 1 é a mais cara: cerca de 7 subagentes Sonnet com busca na web. Não é um Workflow.
- "Todas as plataformas" vira cerca de 30 empresas relevantes nas 3 camadas; a lista pode crescer se a pesquisa achar concorrentes diretos novos.
- Este plano aprovado autoriza as Fases 1 e 2. As Fases 3 a 5 dependem dos checkpoints.
