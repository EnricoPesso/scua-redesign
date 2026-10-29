# Inventário dos relatórios — Scua Logon

Responsável: Pessoa 4 (@bpaolucci). Base: [`progresso.md`](progresso.md) + leitura dos 18 relatórios em 2026-10-22 (Claude in Chrome, só leitura, ambiente demo).
Objetivo: conhecer os 18 relatórios atuais e propor quais **juntar** ou **remover** antes de aplicar o modelo único (filtros → KPIs → tabela → exportar).

> As decisões da seção 3 seguem a regra "só junta dados correlatos". Remover relatórios depende da pergunta 18 para a Scua (quais são realmente usados).

---

## 1. Os 18 relatórios

Legenda da geração: **N** = padrão novo (multi-select, KPIs, empty state) · **A** = padrão antigo (filtros soltos + tabela).
Colunas entre *[ ]* ficam escondidas por padrão ("Exibir colunas").

| # | Nome no menu | Rota | Título na tela | Filtros | Colunas | Ger. |
|---|---|---|---|---|---|---|
| 1 | Eventos | `events` | Relatório Logon | Login, Workstation, Data inicial/final | Data, Evento, Login, Estação, Motivo, *[Domínio, Data de registro]* | A |
| 2 | Horas extras | `extrahour` | Extensão de Jornada | Beneficiário, Data inicial/final, Status | Solicitante, Início, Fim, Beneficiário, Status, Data solicitação, Justificativa | A |
| 3 | Logon logoff | `logon` | Relatório Logon e Logoff | Login, Data inicial/final | Data, Login, Domínio, Estação, Primeiro logon, *[Último logoff]* | A |
| 4 | Ranking por exceções | `rankingexception` | Relatório de Ranking por Exceções | Data inicial/final | Quantidade de exceções, Colaborador | A |
| 5 | Liberações e bloqueios | `release` | Relatório de Liberações e Bloqueios | Login, Workstation, Data inicial/final, Tipo de evento (Liberações / Bloqueios), Motivo | Data, Evento, Login, Domínio, Estação, Motivo | A |
| 6 | Liberações por área | `releasearea` | Relatório de Liberações por **Areas** | Data inicial/final | Área, Liberações | A |
| 7 | Liberações por gestores | `releasemanager` | Relatório de Liberações por Gestores | Data inicial/final | **MANAGER**, Liberações | A |
| 8 | Tentativas de acesso fora da jornada | `access-outside-journey` | Tentativas de Acesso Fora da Jornada | Colaboradores, Gestores (multi-select), Data inicial/final | KPI de total + Colaborador, Gestor, Estação, Evento, Horário | **N** |
| 9 | Estações | `workstation` | Relatório de **Máquinas** | Nome, Domínio, Versão agente, SID, Liberado | Nome, Domínio, Versão agente, **SID**, Liberada | A |
| 10 | Estações inativas | `innactiveWorkstations` | Relatório de **Máquinas** Inativas | Nome, Domínio, Versão agente, busca | Nome, Domínio, Versão agente, Último registro | A |
| 11 | Usuários x Última data controle | `lastcontrol` | Relatório Usuários x **Ultima** data de controle | Login, Dias desde o **ultimo** controle | Login, Data, Evento (`EVT_*` cru), Dias desde o último controle | A |
| 12 | Jornada e Controle | `usersControl` | Relatório Jornada e Controle | Login, Data inicial/final, busca | Login, Jornada, Jornada liberada, Usuário controlado, *[Nome do último evento de controle, Data do último evento de controle, Workstation]* | A |
| 13 | Batidas de Ponto | `reps` | Relatório **REP** | Login, Data inicial/final, busca | Nome, Login, Data, Considerado, REP real anterior, REP real, Justificativa | A |
| 14 | Tempo de bloqueio | `lockedTime` | Relatório Tempo de bloqueio | Login colaborador, Nome gestor, Data inicial/final | Colaborador, Gestor, Evento, Mensagem, Estação, Data bloqueio, Data liberação, Tempo bloqueado | A |
| 15 | Último Login e Usuários | `lastLoginAndUser` | Último Login e Usuários | Nome, Login, Estação, Gestor, Data **inicio**/final, busca | Matrícula, Login, Nome, Estação, Versão client, Gestor, Departamento, **Ultimo** login | A |
| 16 | Último IP logado | `last-workstation-ip` | Relatório Último IP logado | Login, Endereço de IP, Nome, **Máquina**, Data inicial/final, busca | Login, Nome, **Máquina**, Endereço de IP, Localidade, Data da coleta | A |
| 17 | Produtividade | `productivity-report` | **(sem título, só "Filtros")** | Colaboradores, Gestores (multi-select), Data inicial/final | KPI "Período analisado" + tabela "Dados detalhados" (colunas só aparecem com dados) | **N** |
| 18 | Acompanhamento de Jornada | `journey-tracking` | Acompanhamento de Jornada | Colaboradores, Gestores (multi-select), Data inicial/final | KPIs: total de colaboradores, média produtiva/dia, média ociosa/dia, eficiência geral + tabela "Dados detalhados" | **N** |

Todas as rotas começam com `#/reports/`.

### O que se repete (e vira regra do modelo único)
- **Todos têm Filtrar + Exportar.** O 14 diz "Exportar relatório" (#16). O formato do arquivo não foi verificado: exportar baixa um arquivo e não clicamos.
- **Paginação antiga** em 15 relatórios: "Itens por página 15 · 0 of 0", com idiomas misturados (#7). Os 3 novos usam "Anterior / Próximos".
- **Ao abrir a tela, o comportamento muda de um relatório para outro.** Alguns já carregam dados (9, 10, 11, 12, 8). Os outros mostram uma tabela vazia sem nenhuma explicação, e só os novos têm a mensagem "Nenhum registro encontrado para os filtros selecionados".
- **Os mesmos filtros aparecem com nomes diferentes:** "Login" / "Login colaborador" / "Colaboradores"; "Workstation" / "Estação" / "Máquina"; "Data Inicial" / "Data Inicio"; "Gestor" / "Nome Gestor" / "MANAGER" / "Gerente".
- **"Exibir colunas"** existe em vários relatórios antigos (1, 3, 6, 7, 11, 12), mas sem padrão de quais colunas vêm escondidas.

### Problemas novos (não estavam na análise)
- **#21** — Produtividade (17) **não tem título**: a tela começa direto em "Filtros".
- **#22** — Eventos (1) e Liberações e bloqueios (5) mostram **as mesmas colunas**. A diferença é que o 5 tem mais filtros. Para o usuário, não fica claro qual dos dois usar.
- **#23** — O comportamento ao abrir varia: alguns relatórios carregam dados e outros ficam vazios sem nenhuma orientação.
- **#24** — A mesma estação mostra a versão do agente de formas diferentes: DEMO-WS05 aparece com a versão **em branco** em Estações (9) e como **"Não instalado"** em Estações inativas (10). Ver pergunta 51.

---

## 2. Agrupamento por pergunta do usuário

| Tema | Pergunta que responde | Relatórios |
|---|---|---|
| **Acesso** | Quem entrou, quando e de onde? | 3 Logon logoff · 15 Último login · 16 Último IP |
| **Bloqueios e liberações** | Quem foi bloqueado, quem liberou e por quê? | 1 Eventos · 5 Liberações e bloqueios · 6 por área · 7 por gestores · 14 Tempo de bloqueio · 4 Ranking por exceções · 8 Tentativas fora da jornada |
| **Jornada e horas** | A jornada está sendo cumprida? Quanto de hora extra? | 2 Horas extras · 11 Última data de controle · 12 Jornada e Controle · 13 Batidas de Ponto · 17 Produtividade · 18 Acompanhamento de Jornada |
| **Estações** | Quais máquinas têm o agente e estão ativas? | 9 Estações · 10 Estações inativas |

Esse agrupamento é a entrada para a arquitetura de informação da Pessoa 2 (submenu de Relatórios).

---

## 3. Proposta: juntar ou manter separado

Critério (decidido com @bpaolucci): **só junta quando os dados são correlatos**, ou seja, a mesma entidade com os mesmos valores, mudando só o filtro ou o agrupamento. Se não der para comprovar, **mantém separado**.

**Como a correlação foi verificada** (2026-10-22, só leitura): para cada relatório, clicamos em "Filtrar" e anotamos o endpoint chamado e os campos devolvidos. Quando havia dados, comparamos os valores do mesmo registro nos dois relatórios.
Atenção: **cada relatório tem um endpoint próprio**, inclusive os que são claramente o mesmo dado. Então endpoint diferente não prova nada sozinho. O que conta é ter os mesmos campos e os mesmos valores.

| Relatório(s) | Decisão | Evidência |
|---|---|---|
| 9 Estações + 10 Estações inativas | **Juntar** — filtro "status: ativa / inativa" | `report/workstation` e `report/innactiveworkstations` devolvem os mesmos campos (nome, domínio, versão do agente). As 3 inativas estão todas na lista geral, com os mesmos valores. ✅ comprovado |
| 1 Eventos + 5 Liberações e bloqueios | **Juntar (provável)**: filtro "tipo de evento" | As colunas são idênticas (data, evento, login, domínio, estação, motivo). Endpoints `report/logon` e `report/blockedallowed`. O 3 Logon logoff chama `report/logonsint`: pelo nome, o 3 é o **sintético** (um resumo por dia) e o 1 é o **analítico** (evento a evento) da mesma base de logon. Isso não muda a fusão com o 5, porque o 3 continua sendo outra granularidade, mas o 1 pode ser mais amplo que o 5 (todos os eventos de logon, não só liberações e bloqueios). ⚠️ Sem dados no demo para comparar valores |
| 6 por área + 7 por gestores | **Juntar ao 5 só se a contagem bater** como "agrupar por: área / gestor". Até lá, separados | Os dois são a contagem de liberações (`report/areaallowed`, `report/managerallowed`), e o 5 é linha a linha. Granularidade diferente sozinha não basta para juntar (ver o 14). A diferença está no tipo de dado. Se o 6 e o 7 forem **só a soma** das linhas do 5 (tipo = liberação) agrupadas por área ou gestor, o dado é o mesmo e dá para provar somando. O 14 não é uma soma: ele **pareia** cada bloqueio com a sua liberação e **calcula** o tempo bloqueado, coisa que o 5 não tem. ⚠️ Sem dados no demo para fazer a soma (pergunta 47) |
| 11 Última data de controle × 12 Jornada e Controle | **Separados** | Os campos parecem iguais (data e evento de controle), mas os valores não batem: user02 tem evento em 05/10 no 11 e nenhum no 12 |
| 15 Último login × 16 Último IP | **Separados** | Colunas diferentes (matrícula, departamento, client × IP, localidade). Sem dados para comparar |
| 4 Ranking por exceções × 8 Tentativas fora da jornada | **Separados** | O 8 tem ranking próprio (`report/outofjourney/ranking`), diferente de `report/rankingexception`. "Exceção" ≠ "tentativa fora da jornada" |
| 17 Produtividade × 18 Acompanhamento de Jornada | **Separados** | Só a estrutura da tela é parecida. Sem dados no demo para comparar campos (`report/productivity` × `report/journeytracking`) |
| 3 Logon logoff | Mantém | Resumo diário (primeiro logon / último logoff), diferente do 1 |
| 13 Batidas de ponto | Mantém | Tirar "REP" do título ou explicar a sigla |
| 14 Tempo de bloqueio | Mantém | Cada linha liga um bloqueio à liberação dele. É outra granularidade, diferente do 5 |
| 2 Horas extras | **Candidato a virar "Exportar" na tela Extensão de jornada** | As colunas são as mesmas da tela de Extensão de jornada (Pessoa 3). Combinar com o @EnricoPesso |

**Resultado** (pela regra acima, só conta o que está comprovado):
- **17 comprovado hoje**: só 9+10 → 1.
- **14 se as ⚠️ se confirmarem**: 1+5 → 1 (pergunta 46) e 6+7 → 5 (pergunta 47).
- **13** se, além disso, Horas extras sair do menu (pergunta 49).

As fusões com ⚠️ precisam de dados reais (de um cliente ou de um demo com mais registros) ou da resposta da Scua antes de virar decisão final.

---

## 4. Ainda falta

- [ ] Formato do arquivo exportado (CSV, XLSX ou PDF). Exige clicar em Exportar, que baixa um arquivo.
- [ ] Colunas de Produtividade (17) e Acompanhamento de Jornada (18) com dados. O ambiente demo não retornou registros no período padrão.
- [ ] Confirmar as fusões marcadas com ⚠️ com dados reais (o demo não tem registros de eventos e liberações).

## 5. Perguntas que dependem da Scua

- P18: quais relatórios são realmente usados? Pode virar remoção.
- P29: para onde vai o arquivo exportado e em qual formato? Isso define formato e colunas.
- P46 a P51, na seção 10 de [`perguntas-para-scua.md`](../perguntas-para-scua.md): fusões com ⚠️ (P46, P47), "exceção" no relatório 4 (P48), Horas extras (P49), último evento de controle (P50) e versão do agente da DEMO-WS05 (P51).
