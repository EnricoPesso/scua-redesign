# Perguntas para a Scua — redesign de UI/UX do Scua Logon

Objetivo: entender quem usa o sistema, o que mais incomoda hoje e quais são os limites técnicos e de negócio antes de redesenhar.

**Como usar:** as perguntas marcadas com ⭐ são as mais importantes. Se o tempo for curto, faça só essas.
Se der, peça também os **materiais** da seção 9, porque eles valem mais que muitas respostas.

---

## 1. Usuários e perfis

1. ⭐ Quem usa o painel web no dia a dia? (RH, gestor, TI, diretoria, o próprio colaborador?) Qual desses perfis é o mais importante?
2. ⭐ O que cada perfil faz no sistema? Quais são as 3 tarefas mais comuns de cada um?
3. O colaborador comum entra no painel ou só vê o bloqueio/aviso na estação e responde pelo Teams/WhatsApp?
4. Quantos usuários do painel um cliente típico tem? E quantos colaboradores controlados? (pequeno, médio, grande)
5. Os usuários acessam mais pelo computador ou pelo celular? O gestor aprova hora extra pelo celular?
6. Quem é o comprador (quem decide a contratação) e quem é o usuário final? São pessoas diferentes?

## 2. Dores e reclamações

7. ⭐ Quais são as reclamações e dúvidas mais frequentes no suporte sobre o painel?
8. ⭐ Que tela ou tarefa os clientes mais pedem ajuda para usar?
9. Algum cliente já cancelou ou deixou de contratar por causa da interface?
10. Existe algo que os clientes fazem fora do sistema (planilha, e-mail, print) porque no sistema é difícil?
11. Que funcionalidades existem mas quase ninguém usa? Por quê? (não sabem que existe, é difícil de achar, não serve?)

## 3. Problemas que encontrei na análise (confirmar)

12. ⭐ A tela **Jornada de trabalho** às vezes não abre (erro de JavaScript no console). Vocês já sabiam? Clientes reclamam?
13. Aparece para o usuário o erro técnico `[object ProgressEvent]` quando a rede bloqueia o sistema. Acontece com clientes (proxy/firewall corporativo)?
14. Em **Administrador → Notificações**, as descrições de `EVT_AD_USER_DISABLED` e `EVT_AD_USER_ENABLED` estão invertidas ("desbloqueada" e "bloqueada"). É erro de texto ou de lógica?
15. O item **Estações** do menu principal tem a seta de submenu, mas não abre nada. Era para ter alguma tela ali?
16. Em **Usuários**, a paginação passa sozinha para "9999 itens por página" depois de fechar o painel lateral. Já sabiam?
17. O Dashboard mostra 2h de hora extra aprovada no mês, mas a tela Extensão de jornada mostra 0 aprovadas. Qual período cada uma usa?

## 4. Navegação e telas

18. ⭐ Dos 18 relatórios, quais são **realmente usados**? Algum pode ser juntado com outro ou removido?
19. Os relatórios mais novos (Tentativas fora da jornada, Produtividade, Acompanhamento de Jornada) são o padrão que vocês querem seguir daqui para frente?
20. "Estação" ou "Máquina"? "Horas extras" ou "Extensão de jornada"? "Batidas de ponto" ou "REP"? Qual termo o cliente usa e entende?
21. O que o usuário precisa ver **assim que entra** no sistema? O Dashboard atual responde isso?
22. As telas de Administrador são usadas pelo cliente ou só pela equipe da Scua (implantação/suporte)?
23. Faz sentido o menu mudar conforme o perfil (o gestor vê só o que é dele, o RH vê tudo)? Hoje existe controle de permissão por perfil?
24. Os códigos técnicos (`EVT_LOGON_ALLOWED`, SID do Windows) precisam aparecer para o cliente ou podem virar texto amigável?

## 5. Fluxos principais

25. ⭐ Como funciona hoje, passo a passo, o fluxo de **pedir e aprovar uma extensão de jornada**? Onde ele trava ou demora?
26. O que acontece quando o colaborador é bloqueado fora do horário e precisa trabalhar? Quanto tempo leva para ser liberado?
27. Como é a **implantação** de um cliente novo (cadastrar domínio, jornadas, usuários, cargas)? Quanto tempo leva e quem faz?
28. A **Carga de Dados** (planilhas) é muito usada? Dá muito erro? O que o usuário vê quando a carga falha?
29. Exportar relatório: para onde vai esse arquivo depois? (Folha de pagamento, auditoria, diretoria?) Qual formato é usado hoje (CSV, XLSX, PDF) e qual deveria ser?

## 6. Identidade visual e marca

30. ⭐ Existe manual de marca (logo, cores, fontes)? Podem enviar?
31. O laranja do site (~#E96B0A) deve ser a cor principal do sistema também?
32. O sistema precisa aceitar a marca do cliente (white-label, com logo e cor do cliente)?
33. Querem modo escuro?
34. Há algum sistema ou concorrente cuja interface vocês admiram ou que os clientes citam como referência?

## 7. Restrições técnicas

35. ⭐ O redesign pode mudar o front-end inteiro ou precisa continuar em **Angular** sobre a API atual?
36. A API atual atende o que a tela precisa, ou o back-end também pode mudar?
37. Que navegadores e resoluções os clientes usam? Precisa funcionar em monitor pequeno ou em celular?
38. O sistema roda instalado no cliente (on-premise), na nuvem da Scua ou nos dois? Isso afeta o acesso (rede, proxy)?
39. Precisa de suporte a outros idiomas (inglês, espanhol)?
40. Há exigências de acessibilidade ou de LGPD que a interface precisa mostrar (consentimento, mascarar dados)?

## 8. Negócio e prioridades

41. ⭐ O que seria **sucesso** para esse redesign? (menos chamados, vender mais, implantação mais rápida, parecer mais moderno?)
42. ⭐ Se fosse para melhorar só 3 telas primeiro, quais seriam?
43. Tem prazo ou evento (feira, renovação de contrato grande, lançamento) ligado a essa entrega?
44. Vai ter funcionalidade nova no roadmap que o redesign já deveria prever?
45. Quem aprova o design do lado da Scua? Dá para ter um ou dois clientes reais para testar protótipos?

## 9. Materiais para pedir

- [ ] ⭐ Exportação dos **chamados de suporte** dos últimos 6–12 meses (mesmo sem dados pessoais, só assunto e categoria)
- [ ] ⭐ Manual de marca / logo em vetor (SVG)
- [ ] Dados de uso, se existirem (telas mais acessadas, relatórios mais exportados)
- [ ] Apresentação comercial ou demo que o time de vendas usa
- [ ] Documentação da API ou acesso ao repositório do front-end
- [ ] Lista de perfis e permissões do sistema
- [ ] Contato de 2–3 clientes dispostos a uma conversa rápida (15–20 min)

## 10. Relatórios (adicionadas por @bpaolucci em 2026-10-22)

Contexto: [`analise-sistema/inventario-relatorios.md`](analise-sistema/inventario-relatorios.md).

46. ⭐ Os relatórios **Eventos** e **Liberações e bloqueios** mostram as mesmas colunas. Existe diferença entre os dados deles? Podemos juntar os dois em um só, com um filtro de tipo de evento? (O Eventos parece ser a versão detalhada do **Logon logoff**. Ele mostra todos os eventos de logon ou só liberações e bloqueios?)
47. **Liberações por área** e **Liberações por gestores** contam as mesmas liberações do relatório Liberações e bloqueios, só que agrupadas? Se sim, viram uma opção "agrupar por" dentro dele.
48. O que conta como **"exceção"** no Ranking por exceções? É a exceção cadastrada na aba Exceção do usuário? (Os dados não batem com as Tentativas fora da jornada.)
49. O relatório **Horas extras** tem alguma diferença em relação à tela **Extensão de jornada** (registros antigos, outros status)? Se não tiver, pode virar só um botão "Exportar" naquela tela?
50. Em **Jornada e Controle**, de onde vem o "último evento de controle"? No demo ele aparece vazio para um usuário que tem evento em 05/10 no relatório Usuários x Última data de controle.
51. A estação DEMO-WS05 aparece com a versão do agente **em branco** em Estações e como **"Não instalado"** em Estações inativas. Qual dos dois está certo? Versão em branco significa que o agente não está instalado?

## 11. Bloqueio da estação e extensão de jornada (adicionadas em 2026-11-18)

Contexto: o redesign da tela de Extensão de jornada parte de que o Scua Logon bloqueia o computador fora da jornada e de que a extensão aprovada libera esse acesso. O sistema atual indica isso (relatórios de bloqueio, tempo de bloqueio e tentativas fora da jornada), mas nada foi confirmado com vocês.

52. ⭐ O bloqueio da estação fora da jornada vale para todo mundo ou depende da jornada? O que muda numa jornada marcada como **"Informativa"**: ela só registra os horários, sem bloquear?
53. ⭐ Quando o gestor aprova uma extensão de jornada, o computador da pessoa é **liberado automaticamente** naqueles dias e horários, ou alguém precisa liberar de outro jeito?
54. ⭐ A extensão aprovada vira **hora extra paga** na folha, ou serve só para liberar o acesso ao computador? Isso define se o sistema deve falar em "hora extra" ou só em "extensão de jornada".
55. O que a opção **"Libera regra"** faz? Ela aparece no cadastro da jornada e nas permissões do usuário. O que a pessoa (ou a jornada) com essa opção consegue fazer?

## 12. Assistente de IA (adicionadas em 2026-11-19)

Contexto: o redesign traz um assistente de IA em todas as telas. Ele preenche formulários, analisa o relatório aberto, tira dúvidas e leva a pessoa até a tela pedida, sempre com as permissões de quem está logado. O contrato para o servidor está em [`docs/contrato-assistente.md`](docs/contrato-assistente.md).

56. ⭐ **Preço:** quanto custa para o cliente usar a chave da Scua? É por uso, por pacote ou incluso no plano?
57. ⭐ **Dados pessoais (LGPD):** a Scua aceita enviar nomes, horários e ausências de funcionários para um provedor de IA externo? O contrato com os clientes precisa citar isso? Existe provedor exigido ou proibido?
58. **Onde a chave fica:** o servidor da Scua vai guardar a chave de cada cliente? Com que criptografia?
59. **Auditoria:** a API real aceita a marcação "via assistente" nos registros?
60. **Limites:** precisa de limite de uso por empresa ou por pessoa, para controlar o custo?

## 13. Previsão, radar de passivo, dossiê e Meus dados (adicionadas em 2026-11-23)

Contexto: o redesign ganhou cinco frentes novas, escolhidas a partir da pesquisa de concorrência em [`analise-sistema/concorrencia/`](analise-sistema/concorrencia/): Previsão de jornada, Radar de passivo em R$, Dossiê do colaborador, Assistente proativo e Meus dados. No protótipo elas rodam sobre dados de exemplo.

61. ⭐ **Ponto oficial ou controle complementar:** algum cliente usa o Scua Logon como registro de ponto oficial (REP-P, Portaria 671), ou ele é sempre um controle complementar ao ponto? Isso muda o texto do Dossiê e o que ele pode prometer.
62. ⭐ **Custo-hora:** o cliente informa salário ou custo-hora em algum lugar do sistema? O Radar de passivo precisa desse valor para estimar em R$. Sem ele, o radar pode trabalhar só em horas.
63. ⭐ **O que o agente registra:** além de logon, logoff, bloqueios e pausas, o agente coleta imagem da tela, teclas digitadas, sites, aplicativos, webcam ou localização? A tela Meus dados afirma ao colaborador que **não** coleta. É uma premissa do protótipo (`app/src/features/meus-dados/conteudo.ts`) e precisa da confirmação da Scua.
64. **Minutos evitados:** o agente registra as tentativas de uso barradas pelo bloqueio (quantas e por quanto tempo)? O indicador "evitado pelo bloqueio" depende disso.
65. **Férias, feriados e afastamentos:** o bloqueio já considera esses dias automaticamente?
66. **Aprovação pelo assistente:** a Scua aceita que o assistente aprove pedidos em lote depois de uma confirmação explícita do gestor, com a marcação "via assistente" na auditoria?
67. **Integridade do registro:** a API guarda os registros de logon de forma que não possam ser alterados depois (assinatura ou código de verificação)? O Dossiê mostra um código de integridade calculado no navegador; o ideal é que ele venha do servidor.
