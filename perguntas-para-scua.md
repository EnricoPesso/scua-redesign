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
29. Exportar relatório: para onde vai esse arquivo depois? (Folha de pagamento, auditoria, diretoria?) Qual formato é usado?

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
