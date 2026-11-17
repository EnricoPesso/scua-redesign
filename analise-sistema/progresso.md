# Análise do sistema Scua Logon — progresso

Sistema: https://atendimento.scua.com.br:8085/ (Angular, título "LogonControl", ambiente demo, usuário `admin`)
Como acessar: **Claude in Chrome** (usa a sessão logada do usuário). Somente navegar/ler — nunca salvar, aprovar ou excluir.
Obs.: a rede do Ibmec bloqueia o sistema (erro `[object ProgressEvent]`); usar outra rede.

## Menu completo
Home · Usuários · Jornada de trabalho · Extensão de jornada · Relatórios (18 subitens) · Carga de Dados · Estações · Administrador (Domínio, Tipo de jornada, Parâmetros, Mensagens, Mensagens por tempo, Justificativas, Feriados, Templates WhatsApp, Grupos, Notificações, Localidade por IP, Notificações de Recorrência, Sobre) · Pausas · Liberações por Diretoria · Gráfico de Ausência · Logs · Sair

## Já analisado
| Tela | Rota | Notas |
|---|---|---|
| Home / Dashboard | `#/dashboard` | 4 KPIs (cadastrados, presentes, ausentes, HE aprovadas no mês); gráfico de status de solicitações (Hoje / 7 dias); histórico de HE aprovadas por mês com total, pico e média |
| Usuários | `#/users` | Tabela nome / gestor imediato / login. Painel lateral com sub-abas Usuário (envia e-mail, liberar regra, WhatsApp, gerente, departamento, jornada, admin, RH aprovador, sustentação, produção), Feriados, Substituto, Exceção, Férias |
| Jornada de trabalho | ? | **Não abre** ao clicar (nem em rede boa). Console: `ReferenceError: Cannot access 'e' before initialization` em `186.fbdbd26c0be1f334.js` |
| Extensão de jornada | `#/overtime` | 3 contadores (em aprovação, reprovadas, aprovadas), tabela beneficiário/solicitante/início/fim/status, filtros (solicitante, beneficiário, datas, status), botão "+ Adicionar extensão" |
| Rel. Eventos | `#/reports/events` | Filtros login, workstation, datas; exportar; exibir colunas |
| Rel. Horas extras | `#/reports/extrahour` | Título interno "Extensão de Jornada" (inconsistente com o nome do menu) |
| Rel. Logon logoff | `#/reports/logon` | Login, datas |
| Rel. Ranking por exceções | `#/reports/rankingexception` | Datas |
| Rel. Liberações e bloqueios | `#/reports/release` | Login, workstation, datas, tipo de evento, motivo |
| Rel. Liberações por área | `#/reports/releasearea` | Datas |
| Rel. Tentativas de acesso fora da jornada | `#/reports/access-outside-journey` | **Mais moderno**: filtros por colaborador/gestor, total, ranking top colaboradores, tabela |

## Analisado em 2026-10-22 (rede de casa, Claude in Chrome)
| Tela | Rota | Notas |
|---|---|---|
| Jornada de trabalho | `#/workhours` | **Abriu desta vez** (erro de 15/10 era intermitente). Tabela identificador/descrição/ativo/default/libera regra/informativa, ícones ✓/✗, "+ Adicionar jornada", lixeira vermelha por linha |
| Rel. Liberações por gestores | `#/reports/releasemanager` | Datas. Coluna "MANAGER" em inglês |
| Rel. Estações | `#/reports/workstation` | Título "Relatório de Máquinas". Filtros nome, domínio, versão agente, SID, liberado. Mostra SID cru |
| Rel. Estações Inativas | `#/reports/innactiveWorkstations` | Título "Relatório de Máquinas Inativas". Coluna "Último registro" vazia; versão "Não instalado" |
| Rel. Usuários x Última data controle | `#/reports/lastcontrol` | Mostra código cru `EVT_LOGON_ALLOWED`; textos sem acento ("Ultima", "ultimo") |
| Rel. Jornada e Controle | `#/reports/usersControl` | Login, datas; jornada, jornada liberada, usuário controlado (Sim/Não) |
| Rel. Batidas de Ponto | `#/reports/reps` | Título "Relatório REP" (sigla sem explicação) |
| Rel. Tempo de bloqueio | `#/reports/lockedTime` | Colaborador, gestor, datas; botão "Exportar relatório" (outros dizem só "Exportar") |
| Rel. Último Login e Usuários | `#/reports/lastLoginAndUser` | 6 filtros; matrícula, versão client, departamento |
| Rel. Último IP logado | `#/reports/last-workstation-ip` | Login, IP, nome, máquina, datas; localidade |
| Rel. Produtividade | `#/reports/productivity-report` | **Padrão novo** (multi-select colaboradores/gestores, período analisado, empty state "Nenhum registro encontrado…") |
| Rel. Acompanhamento de Jornada | `#/reports/journey-tracking` | **Padrão novo**: KPIs total colaboradores, média produtiva/ociosa por dia, eficiência geral |
| Carga de Dados | `#/load` | 6 cargas (Exceções p/ Diretorias, Férias, Feriado, Extensões, Usuário x Feriado, Telefones/WhatsApp CSV), cada uma com "Exportar template" + "Enviar carga" |
| Estações (menu principal) | — | Tem seta de submenu mas **não abre nada** (submenu vazio). O relatório de estações está só dentro de Relatórios |
| Adm. Domínio | `#/admin/domain` | Vazio; identificador, domínio, categoria, sinc. auto, deploy |
| Adm. Tipo de jornada | `#/admin/workhourstype` | Vazio; botão "+ Tipo de jornada" |
| Adm. Parâmetros | `#/admin/parameters` | 15 parâmetros código/nome/valor/descrição (sem botão de adicionar) |
| Adm. Mensagens | `#/admin/messages` | 42 mensagens código/tipo/mensagem/timeout |
| Adm. Mensagens por tempo | `#/admin/messagestime` | 16 itens; tempo(seg), timeout(seg) |
| Adm. Justificativas | `#/overtimereason` | 5 justificativas de HE (rota fora de /admin) |
| Adm. Feriados | `#/holiday` | 1 identificador "Nacional"; botão "+ Adicionar identificador" |
| Adm. Templates WhatsApp | `#/wa-template` | **Padrão novo**: subtítulo explicativo, Atualizar / Importar da Meta / Novo Template, bom empty state |
| Adm. Grupos | `#/groups` | 2 grupos |
| Adm. Notificações | `#/notification` | Lista de códigos `EVT_*` com descrições com erros ("pendented", "Requisiçào", "extensào") e **descrições invertidas** (`EVT_AD_USER_DISABLED` = "desbloqueada", `EVT_AD_USER_ENABLED` = "bloqueada") |
| Adm. Localidade por IP | `#/workstationip` | 75 faixas; localidade/máscara; botão "+ Localidade X IP" |
| Adm. Notificações de Recorrência | `#/admin/recurrence-notif` | **Padrão novo**: regras (mín. eventos, janela h, deduplicação min), empty state "Nenhuma regra cadastrada." |
| Adm. Sobre | `#/logon-about` | 4 licenças usadas, app v2.0.10.80, banco 3.02.16.114 |
| Pausas | `#/breaks` | 1 perfil "Pausas Comercial"; botão "+ Pausas" |
| Liberações por Diretoria | `#/releaseboard` | Diretoria/área, vazio. Console: `TypeError ... 'administraTelaLiberacaoDiretoria'` |
| Gráfico de Ausência | `#/gantt` | Título "Gráficos / Tempo de Ausência"; login + datas; **sem nada antes de filtrar** (sem empty state) |
| Logs | `#/logs` | Abas Parâmetros / Jornada / Exceções / Liberação de regra / WhatsApp; nome, ação, valor antigo→novo, modificado por, data |

**Mapeamento de todas as telas concluído.** Próximo passo: consolidar achados → arquitetura de informação / brainstorming do redesign.

## Andamento do redesign
| Data | O quê | Onde |
|---|---|---|
| 2026-10-22 | Divisão da equipe por área (P1 design system, P2 navegação/dashboard, P3 fluxos principais, P4 relatórios/administração) e revisões cruzadas | [`DIVISAO-DE-TAREFAS.md`](../DIVISAO-DE-TAREFAS.md) |
| 2026-10-22 | Inventário dos 18 relatórios + proposta de junção. Regra: só junta dados correlatos. **17 comprovado** (Estações + Estações inativas ✅); **14** se as fusões ⚠️ se confirmarem (Eventos + Liberações e bloqueios; por área + por gestores → Liberações e bloqueios); **13** se Horas extras virar "Exportar" em Extensão de jornada | [`inventario-relatorios.md`](inventario-relatorios.md) — PR #2 (mergeado) |
| 2026-10-22 | Perguntas 46–51 sobre relatórios adicionadas para a Scua (fusões, "exceção", Horas extras, último evento de controle, versão da DEMO-WS05) | [`perguntas-para-scua.md`](../perguntas-para-scua.md) |
| 2026-10-23 | PR #3 do Pedro (sistema de design em React, `p1/react-base`) revisado, aprovado e mergeado; ajustes em `data-table.tsx` e `field.tsx` ainda em aberto | PR #3 |
| 2026-10-29 | Início do modelo único de relatório (filtros → KPIs → tabela → exportar) | branch `p4/modelo-relatorio` |
| 2026-10-29 | 3 protótipos do modelo de relatório (A barra no topo, B filtros na lateral, C resposta primeiro). **Escolhido: A**. Lighthouse Acessibilidade 100 (mobile) | `design-system/prototipos.html` (A virou o componente `ModeloRelatorio`) |

**Pendências da P4 (relatórios):** formato do arquivo exportado; colunas de Produtividade e Acompanhamento de Jornada com dados; confirmar as fusões ⚠️ com dados reais; combinar Horas extras com o @EnricoPesso (P3). Depende das perguntas 18, 29 e 46–51.

## Problemas de UX já encontrados
1. Erro técnico cru para o usuário: `[object ProgressEvent]`.
2. "Jornada de trabalho" não abre (erro JS).
3. Paginação de Usuários muda sozinha para "9999 itens por página · 1 – 1 of 1" depois de fechar o painel.
4. Gráfico de status vazio sem empty state (só eixos 0–1,0).
5. Dashboard mostra 2h de HE aprovadas no mês, mas Extensão de jornada mostra 0 aprovadas (sem indicar o período).
6. Nome do menu ≠ título da tela ("Horas extras" → "Extensão de Jornada").
7. Paginação misturando idiomas ("Itens por página" + "0 of 0").
8. Relatórios com padrões visuais diferentes (o de tentativas fora da jornada é bem mais rico que os demais).
9. Identidade visual (sidebar escura + azul/verde) não segue o laranja da Scua.
10. Botão "+ Adicionar extensão" quebrando em 3 linhas.
11. Nome do menu ≠ título da tela em vários lugares: Eventos → "Relatório Logon", Estações → "Relatório de Máquinas", Batidas de Ponto → "Relatório REP", Gráfico de Ausência → "Gráficos". Terminologia "Estação" vs "Máquina" misturada.
12. Códigos técnicos crus para o usuário (`EVT_LOGON_ALLOWED`, `EVT_*`, SID do Windows).
13. Textos sem acento e com erros ("Ultima", "ultimo", "pendented", "Requisiçào"); inglês misturado ("MANAGER", "of").
14. Descrições de notificação invertidas (usuário desabilitado = "desbloqueada").
15. Menu "Estações" com seta de submenu que não abre nada.
16. Rótulos de botão inconsistentes ("+ Adicionar jornada", "+ Tipo de jornada", "+ Pausas", "+ Localidade X IP", "Exportar" vs "Exportar relatório").
17. Duas gerações de UI convivendo: relatórios antigos (filtros soltos + tabela) vs. novos (Tentativas fora da jornada, Produtividade, Acompanhamento de Jornada, Templates WhatsApp, Notificações de Recorrência) com KPIs, multi-select e empty states — os novos são a melhor referência para o redesign.
18. Erros no console em várias telas: `TypeError: Cannot set properties of null (setting 'value')` (repetido), `Cannot read properties of null (reading '_rawValidators')`, `administraTelaLiberacaoDiretoria` indefinido em Liberações por Diretoria.
19. Lixeira vermelha de exclusão direto na linha da tabela (risco de clique acidental).
20. Menu longo e plano (13 itens + 18 relatórios + 13 de administração) sem agrupamento por tarefa; rotas inconsistentes (`#/overtimereason`, `#/holiday` ficam fora de `/admin`).
21. Produtividade não tem título: a tela começa direto em "Filtros" (ver [`inventario-relatorios.md`](inventario-relatorios.md)).
22. Eventos e Liberações e bloqueios mostram as mesmas colunas; não fica claro qual usar.
23. Comportamento ao abrir relatório varia: alguns carregam dados, outros ficam vazios sem orientação.
24. Versão do agente inconsistente: DEMO-WS05 em branco em Estações e "Não instalado" em Estações inativas.

## Reclame Aqui (verificado em 2026-10-22)
A Scua **não tem página nem reclamações** no Reclame Aqui. Buscas feitas: "scua", "scua logon", "scua tecnologia", "scua.com.br", "logon control".
- "scua": 69 reclamações, todas de antena parabólica (SCUA é um código de receptor de satélite, ex.: Vivensis, Elsys, Century). Nenhuma tem relação com a empresa.
- Os demais termos: 0 reclamações relacionadas. A única de "logon control" é sobre o Windows 10.
Conclusão: o Reclame Aqui não serve de fonte de feedback de UI/UX. Fontes melhores: chamados de suporte da Scua, entrevistas com gestores/RH/colaboradores usuários, avaliações B2B.
