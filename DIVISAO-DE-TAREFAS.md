# Divisão de tarefas — Redesign Scua Logon

Equipe de 4 pessoas, dividida **por área**. Cada pessoa é dona de uma parte do sistema, do wireframe até o código pronto, e revisa o trabalho de outra pessoa.

Equipe: [@EnricoPesso](https://github.com/EnricoPesso), [@bpaolucci](https://github.com/bpaolucci), [@Chokokito](https://github.com/Chokokito) (Miguel), [@PhLima07](https://github.com/PhLima07) (Pedro).

| Quem | Área | Revisa o trabalho de |
|---|---|---|
| **Pessoa 1** — @PhLima07 (Pedro) | Sistema de design e componentes base | Pessoa 4 |
| **Pessoa 2** — @Chokokito (Miguel) | Navegação, layout e Dashboard | Pessoa 3 |
| **Pessoa 3** — @EnricoPesso (Enrico) | Fluxos principais: Usuários, Jornada, Extensão de jornada | Pessoa 2 |
| **Pessoa 4** — @bpaolucci | Relatórios e Administração | Pessoa 1 |

Na prática, as revisões ficam assim: Pedro revisa o bpaolucci · Miguel revisa o Enrico · Enrico revisa o Miguel · bpaolucci revisa o Pedro.

Material de base (leia antes de começar):
- [`analise-sistema/progresso.md`](analise-sistema/progresso.md): todas as telas atuais, rotas e os **20 problemas de UX** encontrados (citados abaixo como #1, #2…).
- [`perguntas-para-scua.md`](perguntas-para-scua.md): perguntas enviadas à Scua. As respostas podem mudar prioridades.
- [`CLAUDE.md`](CLAUDE.md): skills por etapa e **critérios de pronto** (seção 3), que valem para todo mundo.

---

## Fase 0 — Decisões em conjunto (todos, antes de codar)

- [ ] **Stack do front-end**: continuar em Angular (o sistema atual usa Angular) ou outra? Depende da resposta da Scua (pergunta 35).
- [ ] **Arquitetura de informação**: o novo menu agrupado por tarefa, liderado pela Pessoa 2.
- [ ] **Glossário**: um termo por conceito ("Estação" ou "Máquina", "Extensão de jornada" ou "Hora extra", "Batidas de ponto" ou "REP").
- [ ] **3 telas prioritárias** para o primeiro protótipo (pergunta 42 para a Scua).
- [ ] Criar o projeto base (build, lint, typecheck) e preencher os comandos na seção 3.5 do `CLAUDE.md`.

---

## Pessoa 1 — Sistema de design e componentes base (@PhLima07)

**Por que vem primeiro:** todo mundo depende dos tokens e componentes. Enquanto eles não ficam prontos, as outras pessoas trabalham em wireframes.

**Entregas**
- [ ] Tokens: cores (laranja Scua ~`#E96B0A`, creme `#FBE9DA`, cinza quente `#F4F2EF`, cores de status), tipografia, espaçamento, raio, sombra, modo claro/escuro (se a Scua quiser).
- [ ] Componentes: botão (primário, secundário, perigo, só ícone), campo, select, multi-select, data, checkbox/toggle, badge de status, card de KPI, **tabela com paginação**, painel lateral (drawer), modal de confirmação, toast, estado vazio, estado de erro, skeleton de carregamento.
- [ ] Página de documentação dos componentes (Storybook ou página simples) com todos os estados: padrão, hover, foco, desabilitado, carregando, vazio e erro.

**Problemas da análise que resolve:** #3 e #7 (paginação), #9 (identidade), #10 e #16 (botões e rótulos), #19 (ação de excluir com confirmação).

**Skills:** `design-consultation` → `frontend-design:frontend-design` → `chrome-devtools-mcp:a11y-debugging` (contraste AA).

---

## Pessoa 2 — Navegação, layout e Dashboard (@Chokokito)

**Entregas**
- [ ] **Novo menu**: hoje são 13 itens + 18 relatórios + 13 de administração, tudo solto. Agrupar por tarefa e por perfil (gestor, RH, admin).
- [ ] Layout geral: barra lateral recolhível, cabeçalho, busca, breadcrumb, versão mobile/tablet.
- [ ] Cada tela com **endereço próprio** (link que abre em nova aba). Hoje o menu não tem `href`.
- [ ] Tratamento de erro global: nada de mensagem técnica crua para o usuário.
- [ ] **Dashboard** (`#/dashboard`): KPIs, gráfico de status com estado vazio, histórico de HE, com o período sempre visível.
- [ ] Telas: Gráfico de Ausência (`#/gantt`), Logs (`#/logs`), Sobre (`#/logon-about`).

**Problemas da análise que resolve:** #1 (`[object ProgressEvent]`), #4 (gráfico vazio), #5 (período do Dashboard ≠ Extensão), #6 e #11 (nome do menu ≠ título), #15 (menu Estações vazio), #20 (menu longo).

**Skills:** `superpowers:brainstorming` (arquitetura de informação) → `design-shotgun` (variações do Dashboard) → `frontend-design:frontend-design`.

---

## Pessoa 3 — Fluxos principais (@EnricoPesso)

As telas mais usadas no dia a dia. É o coração do produto.

**Entregas**
- [ ] **Usuários** (`#/users`): lista, busca, filtros e painel de detalhe com as abas Usuário, Feriados, Substituto, Exceção e Férias.
- [ ] **Jornada de trabalho** (`#/workhours`): lista e cadastro de jornadas. Investigar o erro que às vezes impede a tela de abrir.
- [ ] **Extensão de jornada** (`#/overtime`): pedir, aprovar e reprovar, com contadores e filtros. Fluxo ponta a ponta pensado também para o **celular do gestor**.
- [ ] Telas ligadas: Pausas (`#/breaks`), Liberações por Diretoria (`#/releaseboard`), Carga de Dados (`#/load`), com feedback claro quando a carga falha.

**Problemas da análise que resolve:** #2 (Jornada não abre), #3 (paginação de Usuários), #5 (contador de aprovadas), #18 (erros de console nessas telas, incluindo `administraTelaLiberacaoDiretoria`).

**Skills:** `superpowers:brainstorming` (fluxo de aprovação) → `frontend-design:frontend-design` → `qa` (fluxos ponta a ponta).

---

## Pessoa 4 — Relatórios e Administração (@bpaolucci)

**Entregas**
- [ ] **Um modelo único de relatório**: filtros → KPIs → tabela → exportar. Partir dos relatórios novos (Tentativas fora da jornada, Produtividade, Acompanhamento de Jornada), que já são o melhor padrão do sistema.
- [ ] Aplicar o modelo aos **18 relatórios**. Antes, propor quais juntar ou remover (pergunta 18 para a Scua).
- [ ] **Administração**: Domínio, Tipo de jornada, Parâmetros, Mensagens, Mensagens por tempo, Justificativas, Feriados, Templates WhatsApp, Grupos, Notificações, Localidade por IP, Notificações de Recorrência. Um padrão único de lista e formulário.
- [ ] Traduzir códigos técnicos (`EVT_*`, SID) para texto amigável e revisar todos os textos (acentos, erros, inglês misturado).

**Problemas da análise que resolve:** #6 e #11 (títulos dos relatórios), #8 e #17 (padrões diferentes), #12 (códigos crus), #13 (textos), #14 (descrições de notificação invertidas: avisar a Scua).

**Skills:** `design-shotgun` (modelo de relatório) → `frontend-design:frontend-design` → `web-design-guidelines`.

---

## Como trabalhar juntos

- **Branch por tarefa**: `p1/botao`, `p3/extensao-aprovacao` etc. Nada direto na `main`.
- **Pull Request** sempre revisado pela pessoa da tabela lá em cima antes do merge.
- **Antes de pedir revisão**, rodar os critérios de pronto do `CLAUDE.md` (seção 3) e listar ✅/❌ no PR, com screenshots em desktop, tablet e mobile.
- **Componente novo?** Peça para a Pessoa 1, ou crie e avise, para não haver dois botões diferentes.
- **Dúvida de negócio?** Anote em `perguntas-para-scua.md` (seção nova no fim) e não invente regra.
- **Sincronização**: conversa rápida 2×/semana. Cada um diz o que fez, o que vai fazer e onde está travado.

## Ordem sugerida

1. **Fase 0** (todos) → decisões e projeto base.
2. **Pessoa 1** entrega tokens e componentes essenciais (botão, campo, tabela). Ao mesmo tempo, 2, 3 e 4 fazem wireframes das suas telas.
3. 2, 3 e 4 implementam as telas usando os componentes. A Pessoa 1 completa o resto dos componentes e ajuda quem estiver travado.
4. Revisão final cruzada: `design-review`, acessibilidade, Lighthouse, `code-review`.
