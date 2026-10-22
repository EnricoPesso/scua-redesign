# Inventário dos relatórios — Scua Logon

Responsável: Pessoa 4 (@bpaolucci). Base: [`progresso.md`](progresso.md) + leitura dos 18 relatórios em 2026-10-22 (Claude in Chrome, só leitura, ambiente demo).
Objetivo: conhecer os 18 relatórios atuais e propor quais **juntar** ou **remover** antes de aplicar o modelo único (filtros → KPIs → tabela → exportar).

> A proposta da seção 3 é uma **hipótese**. Ela depende da pergunta 18 para a Scua (quais relatórios são realmente usados).

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

## 3. Proposta: juntar e remover (hipótese)

Critério (decidido com @bpaolucci): **só junta quando os dados são correlatos**, ou seja, vêm da mesma fonte e mudam só o filtro ou o agrupamento. Nesse caso a diferença vira um filtro ou um "agrupar por". Se não der para comprovar a relação, os relatórios **ficam separados**.

| Novo relatório | Junta | Como | Confiança | Evidência |
|---|---|---|---|---|
| **Liberações e bloqueios** | 1 + 5 + 6 + 7 | Lista de eventos com filtro "tipo de evento" e **"agrupar por: nenhum / área / gestor"** (agrupado = contagem de liberações) | **Alta** | 1 e 5 têm as mesmas colunas; 6 e 7 são só a contagem de liberações por área e por gestor |
| **Estações** | 9 + 10 | Filtro "status: ativa / inativa" + coluna "Último registro" | **Alta** | Mesmas colunas, exceto SID/Liberada × Último registro |
| **Situação de controle** | 11 + 12 | Uma linha por colaborador: jornada, se é controlado, último evento de controle, dias desde o último controle | **Média-alta** | O 12 já tem as colunas escondidas "Nome/Data do último evento de controle", que é o conteúdo do 11 |
| **Último acesso** | 15 + 16 | Uma linha por colaborador: último login, estação, IP e localidade | Média | Ambos mostram o "último" acesso, um pelo login e outro pelo IP. Conferir se o 16 guarda histórico (tem filtro de data) |
| Ranking por exceções | 4 | **Mantém separado** do 8 | — | Fontes diferentes: `report/rankingexception` × `report/outofjourney/ranking`. O 8 já tem ranking próprio, então "exceção" ≠ "tentativa fora da jornada" |
| Tentativas fora da jornada | 8 | Mantém. É a referência do modelo único | — | — |
| Produtividade | 17 | **Mantém separado** do 18 | — | Fontes diferentes: `report/productivity` × `report/journeytracking`. Só a estrutura da tela é parecida |
| Acompanhamento de Jornada | 18 | Mantém | — | — |
| Logon e logoff | 3 | Mantém. É um resumo diário: primeiro logon e último logoff | — | Não é igual ao 1 (hipótese anterior descartada) |
| Tempo de bloqueio | 14 | Mantém, ou vira uma visão "duração" dentro de Liberações e bloqueios | Média | Cada linha liga um bloqueio à sua liberação |
| Batidas de ponto | 13 | Mantém. Tirar "REP" do título ou explicar a sigla | — | — |
| Horas extras | 2 | **Candidato a sair do menu de relatórios.** As colunas são as mesmas da tela Extensão de jornada (Pessoa 3), que poderia ganhar o "Exportar" | Média | Combinar com o @EnricoPesso |

**Resultado:** de **18 para 12** relatórios, ou **11** se Horas extras virar exportação da tela Extensão de jornada. As fusões de "Situação de controle" (11 + 12) e "Último acesso" (15 + 16) ainda precisam da mesma checagem de fonte antes de virar decisão.

---

## 4. Ainda falta

- [ ] Formato do arquivo exportado (CSV, XLSX ou PDF). Exige clicar em Exportar, que baixa um arquivo.
- [ ] Colunas de Produtividade (17) e Acompanhamento de Jornada (18) com dados. O ambiente demo não retornou registros no período padrão.
- [ ] Ver se o 16 (Último IP) guarda histórico ou só o último registro.

## 5. Perguntas que dependem da Scua

- Pergunta 18: quais relatórios são realmente usados? Pode virar remoção.
- Pergunta 29: para onde vai o arquivo exportado? Isso define formato e colunas.
- Nova: o que conta como "exceção" no relatório 4? (Os dados não são os mesmos das tentativas fora da jornada.)
- Nova: o relatório Horas extras tem alguma diferença em relação à tela Extensão de jornada (ex.: inclui registros antigos ou de outros status)?
