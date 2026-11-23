# Matriz feature × concorrente

Síntese da pesquisa de 2026-11-23. Fontes e detalhes: um arquivo por produto em `perfis/`, mais `dores.md` e `lente-legal.md`.

**Como ler:** "ninguém" quer dizer **não encontrado em página aberta** nos 36 perfis. Não é prova de que não existe. Itens marcados com (nc) vêm de resumo de busca ou de material do fornecedor e não foram confirmados numa página aberta.

## Quem foi pesquisado (36 perfis)

| Camada | Produtos |
|---|---|
| **A. Diretos** (controle do computador pela jornada) | Monitoo, VkLock, Conecta Control, UserLock, Adere.IA, TSplus, Pulsus, Jibble, WorkTime, Hexnode |
| **B. Ponto e jornada no Brasil** | Sólides, Pontomais (2 arquivos: `pontomais.md` e `pontomais-vr.md`), Ahgora/TOTVS (2 arquivos), Oitchau, Pontotel, Secullum, Senior, Kairos, Control iD RHiD, Flash, Genyo, FlitApp |
| **C. Exterior** | Deputy, Connecteam, UKG, Rippling, Factorial, Personio, When I Work, Hubstaff, Time Doctor, ActivTrak, Insightful, Teramind |

Só **Monitoo** e **VkLock** travam a estação Windows pela jornada, como o Scua Logon. Perfis fracos por bloqueio de leitura: Ahgora/TOTVS, UKG e Personio.

## Matriz

Classe: **P** = paridade (comum) · **D** = diferencial (poucos têm) · **I** = inédito na amostra.

| # | Feature | Scua hoje | Quem tem | Classe |
|---|---|---|---|---|
| 1 | Bloqueio da estação fora da jornada | Sim (produto) | Monitoo, VkLock; UserLock e Pulsus por política de logon | D |
| 2 | Pedido e aprovação de extensão/hora extra | Sim, com lote e limite por grupo | Monitoo, VkLock, Ahgora (app do líder), Flash, Adere.IA | P |
| 3 | Aprovação por WhatsApp | Produto atual cita Teams/WhatsApp; não está no protótipo | Monitoo, Sólides (espelho de ponto) | D |
| 4 | Aprovação por Teams | Idem | Ninguém | I |
| 5 | Painel personalizável | Sim | Comum (e todos os grupos da liga) | P |
| 6 | Relatórios e exportação | Sim (17 relatórios, CSV) | Todos | P |
| 7 | Trilha de auditoria | Sim, com painel geral | Maioria | P |
| 8 | Pausas (NR-17) | Sim (cadastro) | Flash; Deputy e When I Work (atestação de pausa) | D |
| 9 | Assistente de IA que **responde** perguntas sobre os dados | Sim | Monitoo, Sólides Start, Pontotel, Rippling, Personio (nc), Teramind | P em 2026 |
| 10 | Assistente de IA que **executa** ações com confirmação | Sim (preenche jornada e cadastros) | Deputy (aprova timesheet, edita turno); Senior via MCP | D (I no Brasil dentro do produto) |
| 11 | IA que audita a jornada e aponta inconsistências | Parcial (analisa o relatório aberto) | Genyo, FlitApp, Secullum (anunciado), Senior (insights) | D virando P |
| 12 | Dados abertos para IAs externas (MCP) | Não | Senior, Hubstaff, Time Doctor | D |
| 13 | Painel de risco trabalhista por **pontuação** | Não | Pontomais (pesos ajustáveis, ranking) | D |
| 14 | Risco ou custo em **R$** | Não | Monitoo cita "custo estimado" das horas fora da jornada, sem detalhe | D (quase I) |
| 15 | "Quanto o bloqueio **evitou**" em R$ | Não | Ninguém (Monitoo só alega no marketing) | I |
| 16 | Alerta ao atingir limite de hora extra | Parcial (barra de limite) | Pontotel, Genyo, Senior, Connecteam (nc), When I Work (nc) | P |
| 17 | **Previsão** de estouro (hora extra, interjornada, limite mensal) antes de acontecer | Não | Ninguém confirmado. O "30 min antes" da Pontotel só aparece em tela ilustrativa | I |
| 18 | Regra violada e custo mostrados **no pedido** de extensão | Não | Ninguém | I |
| 19 | Corretor de escalas com aprovação em lote | Não | Pontotel | D |
| 20 | Dossiê de defesa por colaborador e período | Não | Ninguém. Monitoo e pontos geram AFD/AEJ e "documentos para fiscalização" | I |
| 21 | Prontidão para fiscalização (AFD/AEJ) | Não (Scua não é ponto oficial) | Todos os de ponto, Monitoo | P entre os de ponto |
| 22 | Resumo diário do que precisa de atenção | Não | Deputy (o gestor puxa o resumo) | D |
| 23 | Sinais de burnout / equilíbrio de carga | Não | ActivTrak, Time Doctor, Rippling, UKG (nc), Insightful | D (I no Brasil) |
| 24 | Comparação com pares ou setor | Não | Time Doctor, UKG (nc) | D |
| 25 | Transparência para o colaborador ("o que é coletado") | Não | Hubstaff (remove as próprias entradas, sem keylogger), Insightful (promessa) | D (I no Brasil) |
| 26 | Saúde do agente e da estação (parou de reportar) | Parcial (Estações) | Pedido não atendido em `dores.md` | I como experiência pronta |
| 27 | Cota de tempo conectado por semana ou mês | Não | UserLock | D |
| 28 | Bloqueio automático em férias, feriados e afastamentos | A confirmar com a Scua | Conecta Control | D |
| 29 | Medição de uso de ferramentas de IA | Não | Monitoo, ActivTrak | D |
| 30 | Antifraude de marcação | Não se aplica (logon) | Oitchau, Senior, Control iD, Hubstaff | P entre os de ponto |

## O que a matriz diz

1. **O assistente de IA sozinho deixou de ser raro.** Em 2026, pelo menos seis produtos têm chat sobre os dados. O nosso continua na frente porque **age** (preenche telas), o que no Brasil só a Senior faz, e por fora do produto.
2. **O espaço vazio está em antecipar e pôr preço.** Linhas 15, 17, 18 e 20 não têm dono. Todas dependem de algo que só quem controla o logon tem: o registro real de uso da máquina e o bloqueio.
3. **Pontuação de risco já existe** (Pontomais). O salto é sair de pontuação para **R$**, e de "o que aconteceu" para "o que vai acontecer".
4. **Privacidade é dor do colaborador e exigência da LGPD**, e nenhum concorrente brasileiro mostra ao colaborador o que coleta. O Scua controla só a jornada, o que permite usar isso a favor.

## Correções feitas na conferência das fontes

Cinco páginas foram abertas de novo para conferir as afirmações que sustentam os pilares:
- **Pontomais, Painel de Risco:** confirmado. Só pontuação e ranking, nenhum valor em R$.
- **Monitoo:** confirmado bloqueio no fim do expediente com aviso, aprovação por WhatsApp e "Pergunte ao Monitoo". A página cita "custo estimado" para horas fora da jornada. Sem previsão e sem dossiê de defesa.
- **Pontotel:** Regularizador e aprovação em lote confirmados. O alerta de **30 minutos não está confirmado** como função (só em painel ilustrativo).
- **Genyo:** confirmado, em plano específico. Página de 2023/2024.
- **Deputy:** confirmação obrigatória confirmada. O resumo diário é **puxado** pelo gestor, não enviado.
