# Sessões — Projeto SCUA

Diário do projeto: o que foi feito, por que foi feito e o que ficou pendente.
Ler no início de cada sessão, depois do `CLAUDE.md` e do `regras.md`. As regras de registro estão em `regras.md` §3.

---

## Onde paramos (atualizado em 2026-11-23)

- **Branch atual:** `main`, atualizada em 23/11 com o merge de `abismo/pilares`. A `main` remota tem os 5 pilares junto com o visual novo do Miguel (commit `690f777`: paleta cinza frio, layout sem caixas, casca refeita). Trabalho novo parte da `main`.
- **App (`app/`):** redesign completo do Scua Logon em React + Vite com API simulada (MSW). Áreas em `app/src/features/`: assistente, auditoria, ausências, carga, configurações, dossie, extensões, início, jornadas, liberações, meus-dados, passivo, pausas, previsao, relatórios, sobre e usuários.
- **Sistema de design (`design-system/`):** tokens Scua, componentes e página de documentação.
- **Última entrega (23/11, sem commit):** os 5 pilares do "Abismo competitivo": Previsão de jornada (`/previsao`, com semáforo no pedido de extensão), Radar de passivo em R$ (`/radar-de-passivo`), Dossiê do colaborador (`/dossie`), Assistente proativo (resumo do dia numa caixa do cabeçalho e na conversa, aprovação em lote com confirmação) e Meus dados (`/meus-dados`).
- **Verificação em 23/11:** unitários 1039/1039, e2e 215/215, typecheck, lint e build sem erros, Lighthouse de acessibilidade 100 em Radar, Previsão, Dossiê e Meus dados. Não medido: Lighthouse de performance, Core Web Vitals, e os comandos do `design-system/` (que não foi alterado).
- **Entrega de 23/11 (16h):** dois ZIPs na raiz do projeto, fora do git: `Apresentacao_Final_Scua.zip` (slides com o sistema ao vivo, no modelo da apresentação da Bulbe) e `Sistema_Scua_Logon.zip` (código-fonte). A pasta `Apresentacao_Final_Scua/` é a origem do primeiro. A entrega final é um ZIP único em `ENTREGA/` (`Projeto_Scua_Logon_Pedro_Miguel_Enrico_Bernardo.zip`), com apresentação, código, documentação e repositório.
- **Próximo passo:** olhar as 5 telas novas com a paleta do Miguel (os testes passaram, mas a aparência não foi conferida) e unificar a conta do limite mensal.
- **Pendências abertas:**
  - Perguntas 61–67 para a Scua (ponto oficial ou complementar, custo-hora, o que o agente coleta, minutos evitados, aprovação pelo assistente, integridade no servidor). A lista do que o Scua NÃO registra em Meus dados é premissa do protótipo.
  - **O ZIP entregue em 23/11 tem o visual anterior** (creme e laranja). A `main` tem o visual do Miguel. As funções são as mesmas.
  - **Achado da revisão ainda aberto:** o "já usado no mês" do limite de extensão é calculado de três jeitos (barra de limite pela API de extensões; semáforo e Meus dados pelos registros de exemplo de `mock/jornadaReal.ts`). Na mesma tela, a barra pode dizer "ok" e o semáforo dizer que estoura. Correção: o semáforo e Meus dados usarem o mesmo `minutosAprovadosNoMes` da barra.
  - **Reforço sugerido pela checagem automática de segurança:** o Dossiê só é protegido pela rota (`pessoas`, isto é, RH e administração, que veem todos). Se um dia abrir para gestores, a API do Dossiê precisa do mesmo filtro por equipe de `app/src/lib/visibilidade.ts`.
  - Limites da previsão e do semáforo (cortes de 50/25/10%, margens de 15 min e 90%) foram escolhidos na implementação e precisam de validação de quem conhece o produto.
  - Teste do assistente ao vivo com uma chave real (`app/.env.local`). Até agora, só no modo demonstração.
  - Respostas da Scua: perguntas 52–55 (bloqueio, liberação automática, hora extra paga, "Libera regra") e 56–60 (assistente: preço, LGPD, chave, auditoria, limites). Ver `perguntas-para-scua.md`.
  - Decisões da Fase 0 que dependem da Scua: stack (pergunta 35), 3 telas prioritárias (pergunta 42), fusões de relatórios (46, 47 e 49).
  - Exportar gera CSV. Trocar por .xlsx se a Scua tiver JFrog (`design-system/src/lib/planilha.ts`).
  - Logo em 191×50 px fica borrado em telas de alta densidade: pedir o SVG à Scua.

---

## Histórico

### 2026-10-12 a 2026-10-15 — Descoberta
- **Feito:** análise da home scua.com.br e início da análise aba por aba do sistema (`atendimento.scua.com.br:8085`). Identidade registrada: laranja ~`#E96B0A`, creme `#FBE9DA`, cinza quente `#F4F2EF`, Montserrat.
- **Por quê:** a tarefa é refazer a UI/UX do Scua Logon, e era preciso entender o sistema atual e a marca antes de desenhar.

### 2026-10-22 — Análise concluída, divisão de tarefas e sistema de design
- **Feito:**
  - Análise de todas as telas: **24 problemas de UX** e checagem do Reclame Aqui (`analise-sistema/progresso.md`).
  - `perguntas-para-scua.md`.
  - `DIVISAO-DE-TAREFAS.md` (4 pessoas por área: P1 design system, P2 navegação/Dashboard, P3 fluxos principais, P4 relatórios/admin).
  - Inventário dos 18 relatórios com proposta de junção (17 comprovados) em `analise-sistema/inventario-relatorios.md`.
  - Spec da Extensão de jornada.
  - **Design system React** (`design-system/`): tokens em 3 camadas, contraste WCAG AA testado por script, botão, campo, select, multi-select, data, checkbox, toggle, badge, KPI, tabela paginada, drawer, modal, toast, estados vazio/erro, skeleton e página de documentação. Revisões de código aplicadas.
- **Por quê:** todo mundo depende dos tokens e componentes. A análise define o que corrigir, e as perguntas destravam decisões que só a Scua pode tomar.

### 2026-10-23 a 2026-10-29 — Base React, extensão e modelo de relatório
- **Feito:**
  - PRs #2 (inventário de relatórios) e #3 (base React) mesclados.
  - Projeto React + Vite da Extensão de jornada: domínio, cálculo de horas, limite mensal, validação, cliente HTTP, mock MSW, abas por perfil, lista com filtros na URL.
  - **Modelo único de relatório**: protótipos A/B/C, com o A escolhido. Componente `ModeloRelatorio`, exportação CSV protegida contra injeção de fórmula. PR #4 mesclado.
- **Por quê:** os 18 relatórios atuais repetiam layout e filtros. Um modelo único resolve a inconsistência de uma vez. A Extensão de jornada é o fluxo principal do produto.

### 2026-11-17 — Extensão completa e redesign do app inteiro
- **Feito:**
  - Extensão de jornada: formulário (novo, editar, pedir de novo), detalhe com aprovar em 1 clique e reprovar com motivo, lote com confirmação, e2e Playwright dos critérios de aceite 1–13.
  - Branch `redesign/completo`: casca com menu por perfil e busca de telas, Painel inicial, 17 relatórios no modelo único, 12 cadastros de Configurações, Pausas, Liberações por diretoria, Carga de dados, Ausências, Auditoria, Sobre, Usuários e Jornadas. Lazy load (build de 186 para 123 kB).
  - Correções da revisão final.
- **Por quê:** o responsável pediu "pode fazer tudo você mesmo, vai fazendo e vai me mostrando", ou seja, as 4 áreas da divisão de tarefas, uma por vez, com commits locais.

### 2026-11-18 — Lapidação (blocos A–D) e início do assistente
- **Feito:**
  - Os 9 ajustes do bloco de notas do responsável (`docs/ajustes-pendentes.md`):
    - A: ações no fim das tabelas, Exportar em todas as listas, menos rolagem, limite da extensão vindo de Grupos.
    - B: logo e modo claro/escuro.
    - C: seletor de período no Início e painel geral na Auditoria.
    - D: Início personalizável.
  - Correções da revisão: e2e 184/184, unit 715/715, a11y 100.
  - Primeiro push e PR #5 em rascunho.
  - Design e plano do **Assistente de IA** (10 tarefas), contrato, adaptadores, intermediário no servidor de desenvolvimento e modo simulado.
- **Por quê:** os ajustes vieram da revisão do responsável no navegador. O assistente foi escolhido como diferencial do grupo.

### 2026-11-19 — Assistente de IA entregue
- **Feito:**
  - O assistente preenche a Jornada de trabalho e os cadastros do modelo único, analisa o relatório aberto, navega até telas permitidas e grava na Auditoria com a etiqueta "Assistente".
  - Configurações › Assistente (só administração).
  - Contrato para o servidor em `docs/contrato-assistente.md`. Chave só em `app/.env.local`, sem `VITE_`.
  - e2e 199/199, 879 testes unitários, a11y 100.
  - PR #5 mesclado na `main` a pedido do responsável.
- **Por quê:** é o diferencial do grupo em relação aos outros da liga.
- **Pendente:** teste ao vivo com chave real.

### 2026-11-23 — Frente "Abismo competitivo" (planejamento) e criação deste diário
- **Feito:**
  - Proposto o plano em 5 fases:
    1. Mapear cerca de 30 concorrentes (BR direto, BR ponto/jornada, exterior) e montar a matriz feature × concorrente, com as dores do Reclame Aqui, G2 e Capterra e a lente legal (Portaria 671, desconexão, LGPD).
    2. Classificar as features (paridade/diferencial/inédito) e escolher 3–5 pilares. **Checkpoint 1.**
    3. Spec e variações de layout por pilar. **Checkpoint 2.**
    4. Construção com TDD/e2e, mostrando antes do commit.
    5. Verificação completa e entregáveis: relatório de concorrência em Artifact e roteiro de demonstração.
  - Hipóteses a validar: radar de passivo trabalhista em R$, previsão de estouro de jornada/burnout, assistente proativo, dossiê de fiscalização em 1 clique, aprovação por Teams/Slack/WhatsApp ou app de gestor, comparação com o setor.
  - Criados `regras.md` e `sessoes.md`. `CLAUDE.md` passou a apontar a ordem de leitura no início da sessão.
- **Por quê:** o diretor da liga sugeriu o dashboard personalizado a todos os grupos, então ele deixou de ser diferencial. O responsável quer um diferencial grande além do assistente. O diário evita revisar o código inteiro a cada sessão.
- **Pendente:** ok do plano, data da apresentação e se o plano deve ser salvo em `docs/superpowers/plans/`.
- **Atualização (mesma sessão):** `regras.md` passou a ser **inquebrável** e ganhou o §2: antes de toda tarefa, procurar a melhor skill com `find-skills` e plugins que ajudem. Sem skill adequada, fazer sem. Se a tarefa for se repetir, criar uma skill (`skill-creator`) e usá-la. As seções seguintes foram renumeradas (registro no diário agora é o §3).
  - **Por quê:** pedido do responsável, para garantir que o melhor ferramental seja usado em cada tarefa e que trabalho repetido vire skill reutilizável.
- **Fases 1 e 2 do plano (mesma sessão):**
  - **Feito:** plano aprovado e salvo em `docs/superpowers/plans/2026-11-23-abismo-competitivo.md`. Seis pesquisadores (Sonnet, busca na web) geraram 36 perfis em `analise-sistema/concorrencia/perfis/`, mais `dores.md` e `lente-legal.md`. Cinco fontes-chave foram abertas de novo para conferência. Síntese em `matriz.md` (30 features classificadas) e `pilares-propostos.md` (5 pilares com nota).
  - **Achados principais:** só Monitoo e VkLock travam a estação no Brasil; chat de IA sobre os dados já é comum em 2026; ninguém mostra previsão de estouro, "quanto o bloqueio evitou" em R$, regra violada no pedido de extensão nem dossiê de defesa. A Pontomais tem painel de risco só por pontuação; o Monitoo cita "custo estimado".
  - **Por quê:** escolher os diferenciais com base em evidência, e não em palpite, para abrir distância dos outros grupos.
  - **Skills (regras §2):** a busca externa da `find-skills` (`npx`) está bloqueada pela política do JFrog; a skill `product-management:competitive-brief` foi barrada por tempo esgotado da governança do JFrog. A síntese foi feita sem skill.
  - **Pendências:** escolha dos pilares e data da apresentação (Checkpoint 1). Perfis fracos: Ahgora/TOTVS, UKG, Personio. Arquivos duplicados a unir: `pontomais.md`/`pontomais-vr.md` e `ahgora.md`/`totvs-rh-ponto-ahgora.md`. Três perguntas novas para a Scua estão no fim de `pilares-propostos.md` (ainda não levadas ao `perguntas-para-scua.md`). Nada foi commitado.
- **Fases 3 a 5 do plano (mesma sessão): construção dos 5 pilares**
  - **Feito:**
    - Base comum: `app/src/mock/jornadaReal.ts` (registros de jornada de exemplo por pessoa e dia) e `app/src/lib/conformidade.ts` (regras da CLT, ocorrências e custo em R$), com testes.
    - Menu com o grupo novo "Antecipar e provar" e "Meus dados" em "Dia a dia"; rotas em `app/src/app/AppRoutes.tsx`; testes do menu e lista de telas do e2e atualizados.
    - Pilar 1 `features/previsao/`, pilar 2 `features/passivo/`, pilar 3 `features/dossie/`, pilar 5 `features/meus-dados/`, pilar 4 em `features/assistente/resumo/` e `features/inicio/BlocoResumoDoDia.tsx`. Cada um foi feito por um subagente Sonnet em paralelo, em pasta própria.
    - Ajustes meus depois de ver no navegador: valor "evitado" negativo (defeito no gerador de dados), tamanho dos números do Radar, nomes cortados nos gráficos, barra do Dossiê em laranja da marca, rolagem horizontal no Início em celular e no Radar em tablet, impressão sem menu e cabeçalho, rótulo "Baixar meus dados", descrição do contador da bolha fora do botão.
    - `perguntas-para-scua.md`: perguntas 61 a 67. `app/README.md` e `docs/contrato-assistente.md` atualizados.
  - **Por quê:** o responsável escolheu os 5 pilares no Checkpoint 1 e pediu velocidade para a entrega das 16h. Por isso o Checkpoint 2 (spec e layout por pilar) foi pulado.
  - **Mudança de comportamento:** o assistente passou a aprovar pedidos em lote, só depois de confirmação explícita e só os que estão dentro do limite. Antes ele não aprovava nada.
  - **Skills (regras §2):** governança do JFrog bloqueou a busca externa da `find-skills` e a chamada de skills por tempo esgotado. Usados: Playwright MCP (telas), chrome-devtools MCP (Lighthouse) e subagentes.
  - **Pendências:** ver "Onde paramos".
- **Revisão de código (Opus, mesma sessão):** nada crítico; 5 achados importantes e 3 menores.
  - **Corrigidos:** (1) gestor via previsão, R$ e custo-hora da empresa inteira: agora as APIs de Previsão e Radar filtram pela equipe (`app/src/lib/visibilidade.ts`); (2) cartão de lote antigo podia aprovar acima do limite: a confirmação confere a fila de novo e, se mudou, não aprova nada; (3) as mesmas horas contavam duas vezes no valor em risco: "mais de 2 horas extras" ficou como ocorrência sem valor; (5) resumo do dia e lote, que citam nomes e valores de colegas, não vão mais para o provedor de IA; (6), (7) e (8) textos do Dossiê, de Meus dados e de "Como calculamos" ajustados ao que o protótipo faz.
  - **Aberto:** (4) três contas diferentes do limite mensal (ver "Onde paramos").
  - **Por quê:** a seção 3.5 do `CLAUDE.md` exige revisão sem achado crítico em aberto antes de fechar a entrega.
- **Resumo do dia foi para o cabeçalho (mesma sessão):**
  - **Feito:** `app/src/layout/ResumoNoCabecalho.tsx`: botão com contador ao lado do modo claro/escuro, que abre uma caixa com os itens (fecha com Esc, clique fora, ao escolher um item e ao trocar de tela). O bloco saiu do padrão do Início (`BLOCOS_PADRAO` em `features/inicio/blocos.ts`) e continua disponível em Personalizar. Testes do Início reescritos; `personalizar.test.tsx` voltou à versão original.
  - **Por quê:** o responsável viu no navegador e disse que o bloco ocupava muito a tela de Início.
- **Entrega (mesma sessão): apresentação e ZIPs**
  - **Feito:** `Apresentacao_Final_Scua/`: 16 slides em HTML (`apresentacao/`), o sistema compilado com a API simulada (`sistema/`), `servidor.js`, `INICIAR-APRESENTACAO.bat`, 18 capturas reais para o plano B, e `README.md`, `ROTEIRO.md`, `PERGUNTAS-BANCA.md` e `VERIFICACAO.md`. Os slides 13 e 14 listam o que funciona, o que é simulado e o que não foi feito.
  - **Por quê:** a entrega pede uma apresentação e um ZIP do sistema; o responsável pediu o mesmo modelo da apresentação da Bulbe e que nada do que não foi implementado ficasse escondido.
  - **Decisão:** entregar a branch `abismo/pilares` com o visual anterior e juntar o visual do Miguel depois (escolha do responsável, por causa do prazo).
  - **Skills (regras §2):** nenhuma skill usada (a governança do JFrog segue bloqueando); Playwright para capturas e conferência dos slides.
  - **Pendências:** os nomes da equipe na capa vieram de `DIVISAO-DE-TAREFAS.md` e precisam da conferência do responsável.
- **Ajustes na apresentação a pedido do responsável (mesma sessão):**
  - **Feito:** reforço visual (capa com o sistema ao vivo, moldura de navegador, animação de entrada, slides do problema, da pesquisa e dos pilares refeitos, placar nos slides 13 e 14); palco ocupando a janela inteira e barra escondida em tela cheia; destaque laranja sobre a feature em cada tela ao vivo (tecla D); tela do sistema maior; botão "Semáforo no pedido" abrindo direto um pedido. Pasta `ENTREGA/` com os dois ZIPs e o `COMO-ABRIR.txt`.
  - **Por quê:** o responsável achou a primeira versão fraca, viu bordas pretas em tela cheia, pediu destaque nas features e tela maior, e pediu os arquivos separados com o passo a passo.
  - **Pendências:** tela cheia não conferida em monitor real; `.bat` não executado com dois cliques; ZIP do sistema não rodado do zero; nomes da equipe na capa a confirmar.
- **Versão final da entrega (mesma sessão): 72 slides e ZIP único**
  - **Feito:** Parte 2 da apresentação, com 55 slides de passo a passo (uma captura real por passo, com o destaque no ponto exato), gerados por automação. Total: 72 slides. ZIP único com quatro pastas: `1_Apresentacao`, `2_Sistema_codigo`, `3_Documentacao` e `4_Repositorio` (histórico do git em arquivo `.bundle`), mais `COMO-ABRIR.txt` e `INTEGRANTES.txt`.
  - **Por quê:** o enunciado do envio final pede tudo num único .zip, com o nome dos integrantes, e slides de 60 a 90. O responsável confirmou os integrantes e que Figma só vale para quem tem.
  - **Pendências:** a entrega saiu depois das 16h. Passo a passo de rodar o código do zero não executado; `.bat` não testado com dois cliques; tela cheia não conferida em monitor real.
- **Merge na `main` (mesma sessão):**
  - **Feito:** merge de `origin/main` em `abismo/pilares` e envio para a `main`. Oito arquivos do Miguel entraram sem conflito. Três tiveram conflito (`Pagina.tsx`, `Bolha.tsx`, `AppShell.tsx`): ficou o visual dele e voltaram as funções da branch (esconder menu, cabeçalho e bolha na impressão; botão "Resumo do dia" no cabeçalho; contador na bolha do assistente).
  - **Verificação com o merge:** unitários 1040/1040, e2e 215/215, typecheck, lint e build sem erros.
  - **Por quê:** o responsável pediu a `main` atualizada para enviar o link do repositório junto com a entrega.
  - **Pendências:** a aparência das telas novas com a paleta do Miguel não foi olhada; `npm run contrast` não cobre a sobrescrita de cores em `app/src/index.css`.
