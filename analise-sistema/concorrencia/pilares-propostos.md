# Pilares propostos — Checkpoint 1

Base: `matriz.md` (linhas citadas como M#), `dores.md` e `lente-legal.md`. Situação: **aguardando a escolha do responsável.**

## Ideia central

Os concorrentes mostram **o que aconteceu**. A proposta é o Scua mostrar **o que vai acontecer, quanto custa e como provar**. Isso só é possível para quem controla o logon, e só Monitoo e VkLock fazem isso no Brasil.

## Os pilares

### 1. Jornada preditiva (previsão e semáforo de conformidade)
- **Frase:** "O Scua avisa na terça quem vai estourar a jornada na quinta."
- **O que é:**
  - Painel "Próximos 7 dias": quem deve passar de 2 h extras por dia, quebrar as 11 h de interjornada ou estourar o limite mensal do grupo, com o motivo.
  - No pedido de extensão: semáforo com a regra que seria violada e o custo em R$, antes de o gestor aprovar.
- **Evidência:** M17 e M18, sem nenhum concorrente confirmado. Hora extra e intrajornada são os dois temas mais julgados no TST em 2024 (`lente-legal.md`).
- **Reuso:** limite por grupo e barra de limite da Extensão; dados de `app/src/mock/`.
- **Risco:** a previsão no protótipo é uma projeção simples sobre dados simulados. Tem de ser apresentada como tal.

### 2. Radar de passivo em R$ (e quanto o bloqueio evitou)
- **Frase:** "Este mês o Scua evitou R$ X em hora extra não autorizada. Ainda há R$ Y em risco, e é nestes três gestores."
- **O que é:** exposição por setor e gestor (extras sem aprovação, intervalos suprimidos), economia gerada pelos bloqueios, e a fórmula aberta e configurável pelo cliente.
- **Evidência:** M13 a M15. A Pontomais dá só pontuação; o Monitoo cita "custo estimado" sem detalhe; "quanto evitou" ninguém mostra.
- **Reuso:** cartões de KPI e gráficos do Início e do painel da Auditoria.
- **Risco:** não há valor médio de condenação confiável, e os reflexos (DSR, férias, 13º, FGTS) não foram confirmados. O cálculo usa salário-hora e adicional informados pelo cliente, com aviso de que é estimativa.

### 3. Dossiê de defesa em 1 clique
- **Frase:** "Chegou uma reclamação trabalhista? O dossiê do colaborador sai em 10 segundos."
- **O que é:** por pessoa e período, uma linha do tempo com logons, bloqueios aplicados, pedidos de extensão, quem aprovou, pausas e alterações de jornada, com código de integridade e exportação.
- **Evidência:** M20, sem concorrente. A Súmula 338 do TST põe o ônus da prova em quem controla a jornada.
- **Reuso:** Auditoria, linha do tempo de Ausências, painel do usuário com abas, exportação.
- **Risco:** o log pode servir contra a empresa também. O texto da tela precisa ser neutro ("registro íntegro"), sem prometer vitória em processo.

### 4. Assistente proativo
- **Frase:** "O assistente não espera a pergunta: abre o dia com o que precisa de você e resolve com um ok."
- **O que é:** resumo do dia no Início (pedidos parados, pessoas perto do limite, estações sem reportar), aprovação em lote pela conversa com confirmação, e explicação do risco de cada item usando os pilares 1 e 2.
- **Evidência:** M10 e M22. Só o Deputy executa ações, e o resumo dele é puxado pelo gestor. No Brasil, nenhum faz dentro do produto.
- **Reuso:** tudo de `app/src/features/assistente/` e o contrato em `docs/contrato-assistente.md`.
- **Risco:** depende dos pilares 1 e 2 para ter o que dizer. Vem depois deles.

### 5. Meus dados (transparência para o colaborador)
- **Frase:** "O Scua controla a jornada, não espia: o colaborador vê exatamente o que é registrado."
- **O que é:** tela do colaborador com o que é coletado e o que não é, a jornada e o saldo dele, e o pedido de extensão.
- **Evidência:** M25. Monitoramento invasivo é a principal dor do colaborador (`dores.md`), e o guia da ANPD trata monitorar tela e digitação como excessivo.
- **Reuso:** perfis de acesso e formulário de extensão.
- **Risco:** efeito visual menor na demonstração. O valor está no argumento de LGPD.

## Priorização

Notas de 1 a 5. Em esforço, 5 é o mais barato.

| Pilar | Impacto na banca | Efeito na demo | Esforço | Ineditismo | Total |
|---|---|---|---|---|---|
| 1. Jornada preditiva | 5 | 5 | 3 | 5 | **18** |
| 2. Radar de passivo em R$ | 5 | 5 | 3 | 4 | **17** |
| 3. Dossiê de defesa | 4 | 4 | 4 | 5 | **17** |
| 4. Assistente proativo | 4 | 5 | 3 | 4 | **16** |
| 5. Meus dados | 3 | 2 | 5 | 4 | **14** |

## Recomendação

- **Fazer os pilares 1, 2, 3 e 4, nesta ordem.** O 4 fecha a demonstração, porque usa os outros três.
- **O pilar 5 entra se sobrar prazo.** É o mais barato e reforça o argumento de privacidade.

## Ficou de fora, e por quê

- **Aprovação por Teams/WhatsApp (M3, M4):** o produto atual da Scua já anuncia isso. No protótipo seria só uma simulação.
- **Abrir dados via MCP (M12):** Senior, Hubstaff e Time Doctor já têm, e não aparece numa demonstração de interface.
- **Sinais de burnout por pessoa (M23):** risco com LGPD e NR-1 se for diagnóstico individual. A versão agregada cabe dentro do pilar 1.
- **Saúde das estações (M26):** vira um item do resumo do pilar 4.
- **Corretor de escalas (M19):** a Pontotel já tem, e o Scua não gerencia escala.

## Limites desta pesquisa

- "Ninguém tem" significa não encontrado em página aberta nos 36 perfis.
- Ahgora/TOTVS, UKG e Personio bloquearam a leitura.
- Reclame Aqui, Capterra, Reddit e Google Play não puderam ser lidos direto: as dores vêm de trechos de busca.
- A parte legal é pesquisa de produto, não parecer jurídico.
- Não sabemos o que os outros grupos da liga estão construindo.

## Perguntas novas para a Scua

- O Scua Logon é usado como ponto oficial (REP-P, Portaria 671) ou como controle complementar?
- O cliente informa salário ou custo-hora em algum lugar? O radar em R$ depende disso.
- O bloqueio já considera férias, feriados e afastamentos?
