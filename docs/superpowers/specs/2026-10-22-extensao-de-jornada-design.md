# Spec — Fluxo de Extensão de Jornada

- **Data:** 2026-10-22
- **Responsável:** @EnricoPesso (Pessoa 3, fluxos principais)
- **Revisor:** @Chokokito (Pessoa 2)
- **Status:** aguardando revisão
- **Tela atual:** `#/overtime` (ver `analise-sistema/progresso.md`)

---

## 1. Contexto

O Scua Logon **bloqueia o computador** do colaborador fora da jornada de trabalho. Quando alguém precisa trabalhar além do horário, pede uma **extensão de jornada**. Um gestor aprova ou reprova, e o RH acompanha.

**Como é hoje:**
- A tela tem 3 contadores (em aprovação, reprovadas, aprovadas), uma tabela (beneficiário, solicitante, início, fim, status), filtros escondidos atrás de um botão e "+ Adicionar extensão".
- O formulário é um painel lateral com 7 campos soltos: beneficiário, justificativa, data inicial, data final, hora inicial, hora final e outra justificativa.
- A aprovação também acontece **fora do painel**, via Teams/WhatsApp.
- Existem **grupos** com regras próprias; por exemplo, o GRP-OPERATIONS tem extensão sem limite.

**Problemas da análise que esta spec resolve:**
- **#1:** erro técnico cru para o usuário.
- **#5:** contadores sem período (o Dashboard diz 2h aprovadas, esta tela diz 0).
- **#7:** paginação misturando idiomas.
- **#10:** botão quebrando em 3 linhas.
- **#16:** rótulos de botão inconsistentes.
- **#18:** erros de console nesta tela.

**Problemas encontrados ao abrir o formulário:**
- Não mostra o total de horas pedidas nem o limite do grupo.
- Data e hora em 4 campos, sem deixar claro se o horário vale por dia.
- "Outra justificativa" é ambíguo.
- O botão de enviar tem o mesmo texto do botão que abre o formulário.
- A lista vazia não tem mensagem.

## 2. Objetivo e critério de sucesso

Uma tela única onde:
- **quem pede** consegue pedir sabendo quantas horas está pedindo e se passa do limite;
- **o gestor** decide rápido, sozinho ou em lote, inclusive no celular, com contexto suficiente para não errar;
- **o RH** vê tudo, com histórico auditável.

**Sucesso:**
- Um gestor aprova um pedido em **até 2 cliques** a partir da lista.
- Um colaborador sabe **por que** um pedido foi reprovado sem perguntar a ninguém.
- Nenhuma mensagem técnica chega ao usuário.

## 3. Perfis

| Perfil | O que faz | Aba inicial |
|---|---|---|
| **Colaborador** | Pede extensão para si; acompanha, edita e cancela os próprios pedidos pendentes | Meus pedidos |
| **Gestor** | Pede para si ou para a equipe; aprova ou reprova os pedidos de quem gerencia | Para aprovar |
| **RH / admin** | Vê todos os pedidos, filtra, exporta e consulta o histórico (somente leitura) | Todos |

Uma pessoa pode ter mais de um perfil. Ela vê todas as abas a que tem acesso e começa na primeira da ordem **Para aprovar → Meus pedidos → Todos**.

## 4. Escopo

**Entra nesta versão:**
- Pedir, editar e cancelar (só pendentes)
- Aprovar e reprovar (individual e em lote)
- Lista com filtros e contadores
- Prévia de horas e do limite do grupo no formulário
- Histórico do pedido
- Estados de carregando, vazio, erro, conflito e sem permissão
- Versões para desktop, tablet e celular

**Fica de fora (de propósito):**
- **Desfazer aprovação.** O computador já pode ter sido liberado e a pessoa já foi avisada. Erros são corrigidos com cancelamento ou pelo RH.
- **Mudar as mensagens de Teams/WhatsApp.** O painel só reflete o que acontece nesses canais.
- **Mudar regras de negócio** (quem aprova, limites). Muda a experiência, não a regra.
- **Pedido recorrente** (ex.: toda sexta).

## 5. Estrutura da tela (Seção 1)

**Rotas** (cada aba e cada pedido têm link próprio, que dá para abrir em nova aba e compartilhar):

| Rota | Conteúdo |
|---|---|
| `/extensoes` | Redireciona para a primeira aba permitida |
| `/extensoes/aprovar` | Aba Para aprovar |
| `/extensoes/meus` | Aba Meus pedidos |
| `/extensoes/todos` | Aba Todos |
| `/extensoes/<aba>/<id>` | Mesma aba com o painel de detalhe do pedido aberto. É o destino dos links vindos do Teams/WhatsApp |
| `/extensoes/meus/novo` | Mesma aba com o formulário de novo pedido aberto |

```
┌────────────────────────────────────────────────────────────────┐
│ Extensões de jornada                         [+ Nova extensão] │
│ [Para aprovar (4)]  [Meus pedidos]  [Todos]                    │
├────────────────────────────────────────────────────────────────┤
│ Período: [Este mês ▾]  Status: [Todos ▾]  Pessoa: [Buscar…]    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │ 4  pedidos  │ │ 12h30 apro- │ │ 2 reprova-  │  ← do período  │
│ │ em aprovação│ │ vadas no mês│ │ dos no mês  │    filtrado    │
│ └─────────────┘ └─────────────┘ └─────────────┘                │
├────────────────────────────────────────────────────────────────┤
│ ☐ Beneficiário   Período            Horas  Justificativa Status│
│ ☐ Ana Souza      13–15/10 18–20h    6h     Deploy      ● Pend. │
│ ☐ João Lima      13–14/10 18–19h    2h     Fechamento  ● Pend. │
├────────────────────────────────────────────────────────────────┤
│ 2 selecionados · 8h no total        [Reprovar]  [  Aprovar  ]  │
└────────────────────────────────────────────────────────────────┘
```

**Regras:**
- **Contadores** (pedidos em aprovação, horas aprovadas, pedidos reprovados) sempre refletem o **período e os filtros ativos**, e o rótulo diz qual é o período ("no mês", "de 01/10 a 15/10").
- **Filtros sempre visíveis:**
  - Período (padrão: este mês)
  - Status
  - Pessoa (beneficiário ou solicitante)
  - Na aba **Todos**, também gestor e grupo
- **Colunas da tabela:**
  - Beneficiário
  - Período (data e horário juntos)
  - **Horas** (total)
  - Justificativa
  - Status
  - Na aba **Todos**, também Solicitante e Gestor
- **Ordenação padrão:**
  - Para aprovar: o mais antigo primeiro (fila)
  - As outras abas: o mais recente primeiro
- **Seleção e barra de ações em lote** existem **só na aba Para aprovar**.
- **Botão Exportar** só na aba Todos.
- **Status:** Pendente, Aprovado, Reprovado, Cancelado. Cada status tem cor e texto; a cor nunca aparece sozinha.
- **Paginação toda em português**, 25 itens por página por padrão. O tamanho escolhido **não muda sozinho** (bug #3 da tela Usuários).

**Celular (< 768px):**
- Cada linha vira um cartão (nome e status em cima; período, horas e justificativa embaixo).
- Os contadores ficam numa faixa com rolagem lateral.
- Os filtros vão para um botão "Filtros (n)" que abre uma folha por baixo.
- A barra de lote fica presa no rodapé.

## 6. Fazer um pedido (Seção 2)

Abre em painel lateral pelo botão **"+ Nova extensão"**. **Editar** usa o mesmo painel já preenchido e só existe para pedidos **pendentes** de quem os criou.

```
┌─ Nova extensão ─────────────────────── ✕ ┐
│ Para quem?                               │
│ (•) Para mim   ( ) Para outra pessoa     │
│     [Buscar colaborador…           ▾]    │
│                                          │
│ Quando?                                  │
│ Dias     [13/10/2026] até [15/10/2026]   │
│ Horário  [18:00] às [20:00]  (todo dia)  │
│                                          │
│ Por quê?                                 │
│ [Janela de deploy                   ▾]   │
│ Detalhes (opcional) [                ]   │
│                                          │
│ ┌ Resumo ───────────────────────────────┐│
│ │ 3 dias × 2h = 6h de extensão          ││
│ │ Limite do grupo: ▓▓▓▓▓▓░░░ 6h de 10h  ││
│ │ Quem aprova: Carlos Mendes (gestor)   ││
│ └───────────────────────────────────────┘│
│               [Cancelar] [Enviar pedido] │
└──────────────────────────────────────────┘
```

**Regras dos campos:**

| Campo | Regra |
|---|---|
| Para quem | Padrão "Para mim" para o colaborador e "Para outra pessoa" para o gestor. A busca só lista quem o usuário pode indicar (a equipe, no caso do gestor). Para quem só pode pedir para si, o campo não aparece |
| Dias | Data inicial obrigatória; data final opcional (vazia = um dia só). Final ≥ inicial. Não aceita data no passado |
| Horário | Início e fim obrigatórios, fim > início. Vale **para cada dia** do intervalo* |
| Por quê | Lista vinda de Administração → Justificativas, mais a opção **"Outra"** |
| Detalhes | Opcional; **obrigatório se "Outra"**. Máximo de 500 caracteres |

\* A confirmar com a Scua (seção 11).

**Resumo (atualiza enquanto a pessoa preenche):**
- **Total de horas:** `dias × horas por dia`, ex.: "3 dias × 2h = 6h".
- **Limite do grupo:** barra com o uso do mês **incluindo** este pedido:
  - verde: até 80%;
  - laranja: de 80% a 100%;
  - vermelha: acima de 100%, com o texto "Passa o limite em Xh, vai precisar de aprovação especial". **Não bloqueia o envio.***
  - Grupo sem limite: "Sem limite de extensão".
- **Quem aprova:** nome do gestor responsável pelo beneficiário.
- Se a API não fornecer limite ou aprovador, a linha correspondente **não aparece**. O resto funciona.

**Validação:**
- A mensagem aparece no próprio campo, quando a pessoa sai dele e ao tentar enviar.
- Exemplos: "A hora final precisa ser depois da inicial", "Escolha um motivo", "Já existe um pedido pendente para esse período".
- O botão **Enviar pedido** fica ativo sempre. Ao clicar com erro, a tela leva até o primeiro campo inválido.

**Depois de enviar:**
- Aparece o aviso "Pedido enviado. Carlos será avisado."
- O painel fecha e o pedido aparece em **Meus pedidos** como Pendente.
- Na edição, o aviso é "Pedido atualizado. Carlos será avisado da mudança."

## 7. Aprovar ou reprovar (Seção 3)

### 7.1 Individual

Clicar numa linha abre o **painel de detalhe** à direita (a lista continua visível no desktop):

```
┌──────────────────────────────────┬─────────────────────────────────────┐
│ Extensões de jornada             │ Pedido de Ana Souza            ✕    │
│ [Para aprovar (4)] [Meus] [Todos]│─────────────────────────────────────│
│                                  │ ● Pendente · pedido há 2 horas      │
│ ☐ Ana Souza    13–15/10  6h  ◀── │                                     │
│ ☐ João Lima    13–14/10  2h      │ QUANDO                              │
│ ☐ Bia Rocha    16/10     3h      │ Seg 13 a Qua 15/10 · 18:00–20:00    │
│ ☐ Rui Alves    17/10     1h      │ 3 dias × 2h = 6 horas               │
│                                  │                                     │
│                                  │ POR QUÊ                             │
│                                  │ Janela de deploy                    │
│                                  │ "Atualização do ERP"                │
│                                  │                                     │
│                                  │ ANA NESTE MÊS                       │
│                                  │ ▓▓▓▓▓▓░░░░ 6h de 10h já aprovadas   │
│                                  │ Com este pedido: 12h ⚠ passa 2h     │
│                                  │                                     │
│                                  │ PEDIDO POR                          │
│                                  │ Ana Souza (ela mesma)               │
│                                  │─────────────────────────────────────│
│                                  │ Comentário (opcional) [           ] │
│                                  │        [Reprovar]  [   Aprovar   ]  │
└──────────────────────────────────┴─────────────────────────────────────┘
```

- **Conteúdo do painel:**
  - status e há quanto tempo foi pedido;
  - período e total de horas;
  - justificativa e detalhes;
  - uso do mês do beneficiário, com o impacto deste pedido;
  - quem pediu;
  - outros pedidos pendentes da mesma pessoa, se houver;
  - histórico (seção 8).
- **Aprovar:** um clique; o comentário é opcional.
- **Reprovar:** abre o passo de motivo (obrigatório):

```
┌─────────────────────────────────────┐
│ Reprovar pedido de Ana Souza   ✕    │
│─────────────────────────────────────│
│ Motivo *                            │
│ ( ) Não é necessário                │
│ (•) Combinar outro horário          │
│ ( ) Período errado                  │
│ ( ) Outro                           │
│                                     │
│ Mensagem para Ana (opcional)        │
│ [Pode ser na quinta? Segunda tem  ] │
│ [reunião cedo.                    ] │
│                                     │
│         [Voltar]  [Confirmar reprovação] │
└─────────────────────────────────────┘
```

- "Outro" torna a mensagem obrigatória.
- **Depois de decidir:**
  - aparece o aviso "Pedido aprovado. Ana será avisada." (ou "reprovado");
  - o pedido sai da fila;
  - o painel abre **o próximo pedido da fila**, ou fecha se a fila acabou.
- Os botões Aprovar e Reprovar **só aparecem para quem pode decidir aquele pedido**. Nas abas Meus pedidos e Todos, o painel é só de leitura (com Editar e Cancelar em Meus pedidos, quando pendente).

### 7.2 Em lote (só na aba Para aprovar)

- Marcar linhas mostra a barra no rodapé: "**N selecionados · Xh no total** · [Reprovar] [Aprovar]".
- A caixa do cabeçalho seleciona todos **da página atual**.
- **Aprovar** abre uma confirmação com a lista de nomes, horas e o total:

```
        ┌───────────────────────────────────────┐
        │ Aprovar 2 pedidos?                    │
        │                                       │
        │ • Ana Souza — 6h (13 a 15/10)         │
        │ • João Lima — 2h (13 e 14/10)         │
        │ Total: 8 horas                        │
        │                                       │
        │ Eles serão avisados e os computadores │
        │ liberados nesses horários.            │
        │                                       │
        │           [Cancelar]  [Aprovar 2]     │
        └───────────────────────────────────────┘
```

- **Reprovar em lote:** um motivo (e uma mensagem opcional) para todos.
- **Resultado parcial:** cada pedido é decidido de forma independente. Ao final, o sistema mostra quantos deram certo e, para cada falha, **o nome e o motivo**:

```
        ┌───────────────────────────────────────┐
        │ ✓ 1 pedido aprovado                   │
        │ ✕ 1 não foi aprovado                  │
        │   João Lima — já tinha sido aprovado  │
        │   por você via WhatsApp às 17:42      │
        │                              [Ok]     │
        └───────────────────────────────────────┘
```

### 7.3 Teams / WhatsApp

O papel do painel em relação a esses canais ainda não está definido (seção 11). O desenho funciona nos dois casos:
- Uma decisão tomada em outro canal **tira o pedido da fila** na próxima atualização e aparece no histórico com o canal.
- O link enviado pelo canal abre `/extensoes/aprovar/<id>`.

### 7.4 Celular

```
┌─────────────────────────┐    ┌─────────────────────────┐
│ ☰  Extensões            │    │ ←  Pedido de Ana        │
│ [Aprovar 4][Meus][Todos]│    │─────────────────────────│
│─────────────────────────│    │ ● Pendente · há 2h      │
│ ┌─────────────────────┐ │    │                         │
│ │ ☐ Ana Souza   ● Pend│ │    │ Seg 13 a Qua 15/10      │
│ │ 13–15/10 · 18–20h   │ │    │ 18:00–20:00 · 6 horas   │
│ │ 6h · Janela deploy  │ │    │                         │
│ └─────────────────────┘ │    │ Janela de deploy        │
│ ┌─────────────────────┐ │    │ "Atualização do ERP"    │
│ │ ☐ João Lima   ● Pend│ │    │                         │
│ │ 13–14/10 · 18–19h   │ │    │ Ana neste mês           │
│ │ 2h · Fechamento     │ │    │ ▓▓▓▓▓▓░░░░ 6h de 10h    │
│ └─────────────────────┘ │    │ ⚠ Com este: 12h         │
│                         │    │                         │
│                         │    │─────────────────────────│
│                         │    │ [Reprovar] [ Aprovar  ] │
└─────────────────────────┘    └─────────────────────────┘
```

- O detalhe ocupa a tela inteira.
- Aprovar e Reprovar ficam presos no rodapé, com pelo menos 44px de altura.

## 8. Histórico (Seção 4A)

Fica no painel de detalhe, abaixo das informações, do evento mais recente para o mais antigo:

```
│ ● Reprovado                         │
│ ┌ Motivo da reprovação ───────────┐ │
│ │ Combinar outro horário          │ │
│ │ "Pode ser na quinta?" — Carlos  │ │
│ └─────────────────────────────────┘ │
│        [Pedir de novo com outra data]│
│                                     │
│ HISTÓRICO                           │
│ ✕ Reprovado por Carlos Mendes       │
│ │ via painel · 12/10 às 19:05       │
│ ✎ Editado por você                  │
│ │ horário 18–21h → 18–20h · 16:40   │
│ ✉ Carlos foi avisado                │
│ │ via WhatsApp · 12/10 às 16:31     │
│ + Pedido criado por você            │
│   via painel · 12/10 às 16:30       │
```

- **Tipos de evento:** criado, editado (com o que mudou), aviso enviado, aprovado, reprovado (com motivo), cancelado.
- Cada evento mostra **quem, o quê, canal e quando**.
- Num pedido reprovado, o **motivo fica em destaque** acima do histórico, com o botão **"Pedir de novo com outra data"**. Ele abre o formulário preenchido com os mesmos dados, menos as datas.
- O RH vê o mesmo histórico (auditoria).
- Se a API não tiver algum tipo de evento (canal, edições, avisos), ele simplesmente não aparece.

## 9. Estados e erros (Seção 4B)

| Situação | O que a tela mostra |
|---|---|
| **Carregando** | Linhas "esqueleto" no lugar da tabela e dos contadores. Nada de tela em branco nem spinner solto |
| **Vazio: Para aprovar** | "Tudo em dia! Nenhum pedido esperando sua aprovação." |
| **Vazio: Meus pedidos** | "Você ainda não pediu nenhuma extensão." + [+ Nova extensão] |
| **Vazio: Todos** | "Nenhum pedido no período." |
| **Vazio por causa do filtro** | "Nenhum pedido em <período> com esses filtros." + [Limpar filtros] |
| **Falha ao carregar** | "Não conseguimos carregar os pedidos. Verifique sua conexão. Se continuar, fale com o TI da sua empresa." + [Tentar de novo]. Detalhes técnicos só no console |
| **Falha ao enviar o pedido** | Formulário continua aberto **e preenchido**, aviso no topo: "Não conseguimos enviar. Seus dados estão salvos aqui." + [Tentar de novo] |
| **Falha ao aprovar ou reprovar** | Aviso no painel com o motivo + [Tentar de novo]; o pedido continua na fila |
| **Conflito** (decidido em outro canal ou por outra pessoa) | Aviso "Este pedido já foi aprovado por <nome> via <canal> às <hora>"; botões desativados. Se a resposta da API indicar conflito ao decidir, mostra o mesmo aviso |
| **Sem permissão** (link de pedido de outra equipe) | "Você não tem acesso a este pedido." + [Voltar para minhas extensões] |
| **Pedido não encontrado** | "Este pedido não existe ou foi removido." + [Voltar] |
| **Cancelar pedido** | Confirmação "Cancelar o pedido de <período>? <gestor> será avisado." [Voltar] [Cancelar pedido] |

**Regra geral:** nenhuma mensagem técnica (`[object ProgressEvent]`, códigos HTTP, stack trace) chega ao usuário.

## 10. Dados que a tela precisa (contrato com a API)

A stack e a API ainda não estão definidas (Fase 0 e pergunta 36). Esta é a **lista do que a tela precisa**. Marcado com ⚠ o que provavelmente **não existe hoje** e tem que ser confirmado:

| Necessidade | Uso | Existe hoje? |
|---|---|---|
| Listar pedidos com filtros (aba, período, status, pessoa, gestor, grupo) e paginação | Lista | Provável (a tela atual filtra) |
| Totais do período filtrado (pendentes, horas aprovadas, reprovados) | Contadores | ⚠ Hoje mostra contagem, não horas |
| Criar pedido (beneficiário, datas, horário, justificativa, detalhes) | Formulário | Sim |
| Editar e cancelar pedido pendente | Meus pedidos | ⚠ |
| Aprovar e reprovar com motivo e comentário | Decisão | Aprovar/reprovar sim; ⚠ motivo |
| Uso do mês e limite do grupo do beneficiário | Resumo e painel | ⚠ |
| Gestor aprovador do beneficiário | Resumo | ⚠ |
| Histórico de eventos com canal | Histórico | ⚠ |
| Lista de justificativas | Formulário | Sim (`#/overtimereason`) |
| Permissões do usuário logado (pode pedir para outros, aprovar, ver todos) | Abas e botões | ⚠ |

Se faltar algo, a parte correspondente da tela **é escondida** (como descrito em cada seção), e não quebra.

## 11. Pontos a confirmar com a Scua

1. **Canal principal de aprovação:** o painel é principal ou complementar ao Teams/WhatsApp? (pergunta 25)
2. **Horário por dia:** "13 a 15/10, 18h–20h" significa 2h por dia (suposição desta spec) ou um bloco contínuo?
3. **Acima do limite:** bloqueia ou só avisa? (suposição: só avisa, e a regra fica no servidor)
4. **Motivo de reprovação:** hoje é exigido? A lista de motivos ("Não é necessário", "Combinar outro horário", "Período errado", "Outro") faz sentido?
5. **Quem pode pedir para quem:** o gestor pode pedir para qualquer pessoa ou só para a própria equipe? O colaborador pode pedir para colegas?
6. **Pedido no passado:** existe extensão retroativa (registrar depois)? A spec bloqueia datas passadas.
7. **Editar pedido:** é permitido hoje? Editar reinicia a aprovação?

## 12. Dependências

- **@PhLima07 (Pessoa 1), componentes:**
  - abas;
  - tabela com seleção e paginação;
  - painel lateral;
  - modal de confirmação;
  - aviso (toast);
  - estado vazio e de erro;
  - esqueleto de carregamento;
  - badge de status;
  - card de contador;
  - barra de progresso (limite);
  - campos de data, hora, select e rádio;
  - linha do tempo (histórico): **componente novo, pedir à Pessoa 1**.
- **@Chokokito (Pessoa 2):** item "Extensões" no novo menu e tratamento de erro global.
- **Fase 0:** stack e glossário (este documento usa "Extensão de jornada", e não "Hora extra").

Enquanto os componentes não existem, os wireframes deste documento servem de referência.

## 13. Critérios de aceite

Além dos critérios de pronto do `CLAUDE.md` (seção 3):

1. Colaborador cria um pedido de 3 dias × 2h e o resumo mostra "6h" antes de enviar.
2. Escolher "Outra" sem preencher Detalhes impede o envio e mostra a mensagem no campo.
3. O pedido criado aparece em **Meus pedidos** como Pendente, e na aba **Para aprovar** do gestor dele.
4. O gestor aprova pelo painel de detalhe em 2 cliques (abrir pedido → Aprovar) e o próximo pedido da fila abre sozinho.
5. Reprovar sem motivo não é possível; o motivo aparece em destaque para quem pediu.
6. Aprovação em lote de N pedidos mostra a confirmação com o total de horas; em caso de falha parcial, lista cada pedido que falhou com o motivo.
7. Um pedido decidido em outro canal mostra o aviso de conflito e os botões desativados.
8. Os contadores mudam quando o período muda, e o rótulo mostra o período.
9. Cada aba vazia mostra a mensagem correspondente; um filtro sem resultado oferece "Limpar filtros".
10. Com a API fora do ar, a tela mostra a mensagem amigável e "Tentar de novo". Nenhum texto técnico aparece.
11. O link `/extensoes/aprovar/<id>` abre direto no painel do pedido; um link de pedido sem permissão mostra a mensagem de acesso negado.
12. Fluxo completo no celular (390×844): pedir, aprovar individual e aprovar em lote, sem rolagem horizontal, com botões de pelo menos 44px.
13. Tudo funciona só com o teclado: Tab pelas linhas, Enter abre o pedido, Esc fecha o painel e o foco volta para a linha.

## 14. Testes

- **Unidade:**
  - cálculo de horas (dias × horas/dia, um dia só, intervalos inválidos);
  - faixas da barra de limite (≤80%, 80–100%, >100%, sem limite);
  - validações do formulário.
- **Componente:**
  - cada estado da seção 9 renderiza a mensagem certa;
  - partes que dependem da API somem quando o dado não vem.
- **Ponta a ponta (Playwright):** critérios de aceite 1–13, com a API simulada (mock) enquanto não houver ambiente de teste da Scua.
- **Acessibilidade:** contraste AA, nome acessível em todos os botões (incluindo as caixas de seleção das linhas), foco visível, anúncio dos avisos para leitores de tela.
