# Contrato do assistente de IA (`/api/assistente`)

Este documento é para quem vai construir o lado do servidor do assistente de IA do Scua Logon.
Ele descreve o que o app manda, o que espera de volta e o que o servidor precisa conferir.

Hoje esse papel é feito por um intermediário que só existe no servidor de desenvolvimento
(`app/src/features/assistente/servidor/plugin.ts`). O app publicado não tem servidor e, por isso,
funciona em modo demonstração. Quando o servidor real existir, basta publicar o app com
`VITE_ASSISTENTE_API=1` e atender aos dois endereços abaixo.

Os tipos oficiais estão em `app/src/features/assistente/contrato.ts`. Se este documento e o
arquivo divergirem, vale o arquivo.

## 1. Endereços

### `GET /api/assistente/estado`

Diz se há uma IA conectada. O app consulta antes de cada pergunta, para a falta de chave não virar erro.

Resposta `200`:

```json
{ "ativo": true, "provedor": "anthropic" }
```

- `ativo`: `true` quando há chave configurada para a empresa.
- `provedor`: `"anthropic"`, `"openai"`, `"gemini"` ou `null` quando `ativo` é `false`.

A resposta nunca traz a chave nem parte dela.

### `POST /api/assistente`

Recebe a conversa e o contexto da tela. Devolve o texto do assistente e as ações que o app deve conferir e aplicar.

Corpo do pedido (`PedidoAssistente`):

```ts
interface PedidoAssistente {
  mensagens: { papel: 'usuario' | 'assistente'; texto: string }[];
  contexto: ContextoTela;
  /** Só as ferramentas que a pessoa pode usar nesta tela. */
  ferramentas: ('preencher_formulario' | 'navegar' | 'abrir_formulario')[];
}

interface ContextoTela {
  rota: string;                                  // caminho atual, com os filtros da URL
  pessoa: string;                                // primeiro nome de quem está logado
  hoje: string;                                  // AAAA-MM-DD
  telas: { titulo: string; para: string }[];     // telas que a pessoa pode abrir
  formularios: { id: string; titulo: string }[]; // cadastros que a pessoa pode criar
  alvo: AlvoFormulario | AlvoRelatorio | null;   // o que está aberto na tela
}

interface AlvoFormulario {
  tipo: 'formulario';
  id: string;                                    // 'jornada' ou 'cadastro:<chave>'
  titulo: string;
  editando?: boolean;                            // o formulário altera um registro que já existe
  campos: CampoAlvo[];
  valores: Record<string, unknown>;
}

interface CampoAlvo {
  chave: string;
  rotulo: string;
  tipo: 'texto' | 'textoLongo' | 'numero' | 'hora' | 'data' | 'select' | 'alternar' | 'semana';
  obrigatorio?: boolean;
  opcoes?: { value: string; label: string }[];
  minimo?: number;
  maximo?: number;
  dica?: string;
}

interface AlvoRelatorio {
  tipo: 'relatorio';
  titulo: string;
  filtros: Record<string, string>;               // já em texto legível
  indicadores: { rotulo: string; valor: string }[];
  colunas: string[];
  linhas: string[][];                            // só uma amostra (até 60 linhas)
  totalDeLinhas: number;                         // pode ser maior que linhas.length
}
```

Resposta `200` (`RespostaAssistente`):

```ts
interface RespostaAssistente {
  texto: string;
  acoes: Acao[];
}

type Acao =
  | { tipo: 'preencher'; campos: Record<string, unknown> }   // valores para o formulário aberto
  | { tipo: 'navegar'; rota: string }                        // abrir uma tela
  | { tipo: 'abrir_formulario'; formulario: string };        // abrir o formulário de criação
```

Formato dos valores em `preencher`: horas `"HH:MM"`, datas `"AAAA-MM-DD"`, liga/desliga `true` ou `false`,
`select` com o `value` de uma das opções. O campo do tipo `semana` é um objeto com os dias
(`seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`), cada um com `trabalha`, `entrada`, `saida`,
`intervaloInicio` e `intervaloFim`.

## 2. Erros

Em caso de erro, o corpo é `{ "motivo": "<motivo>" }`. O app mostra uma mensagem própria para cada motivo
e nunca exibe texto vindo do provedor de IA.

| Status | Motivo | Quando |
|---|---|---|
| `503` | `sem-chave` | Não há chave configurada. O app passa para o modo demonstração. |
| `400` | `configuracao` | Pedido malformado ou grande demais. |
| `403` | `configuracao` | Pedido vindo de outra origem. |
| `500` | `configuracao` | Provedor ou modelo configurado errado no servidor. |
| `502` | `chave-recusada` | O provedor recusou a chave (401 ou 403). |
| `429` | `limite` | O provedor ou a Scua limitou o uso. |
| `502` | `indisponivel` | Rede, tempo esgotado (60 s) ou resposta ilegível do provedor. |

O detalhe do erro do provedor não deve ser repassado ao navegador nem gravado em log:
ele pode conter a chave ou dados de pessoas.

## 3. O que o servidor real precisa conferir de novo

O app confere tudo antes de aplicar uma ação, mas o navegador não é confiável.
O servidor deve repetir as conferências com os dados dele, e não com os que vieram no pedido.

1. **Quem é a pessoa e o que ela pode.** Usar a sessão para identificar a pessoa. As listas `contexto.telas`,
   `contexto.formularios` e `ferramentas` devem ser recalculadas ou validadas no servidor com as permissões reais.
2. **Ações devolvidas pela IA.** Descartar a ação cuja ferramenta não foi oferecida, a rota que não é interna
   ou não está entre as telas da pessoa, e o formulário que não está na lista dela. A lógica de referência
   está em `servidor/responder.ts` e `rotas.ts`.
3. **Tamanho do pedido.** O intermediário aceita corpo de até 400.000 caracteres e usa só as últimas 20 mensagens.
   O servidor real deve ter limites equivalentes.
4. **Origem.** Aceitar só chamadas da própria aplicação.
5. **Limite de uso.** Por empresa ou por pessoa, respondendo `429` com o motivo `limite` (ver a pergunta 60
   em `perguntas-para-scua.md`).
6. **Gravações.** O assistente não grava nada pelo `/api/assistente`. Quem grava é o formulário, pelas
   mesmas APIs de sempre, com as validações de sempre. O servidor não deve criar um caminho de gravação
   exclusivo do assistente.

O assistente não exclui registros e não aprova nem reprova pedidos. Não existe ferramenta para isso,
e o servidor não deve criar uma.

## 4. Auditoria

Toda gravação feita com o assistente precisa registrar quem pediu e que foi feita com ele.
No app, o registro de auditoria ganhou o campo opcional `viaAssistente`:

```ts
interface Registro {
  id: string;
  aba: string;            // área da Auditoria (ex.: 'jornadas')
  item: string;           // o que foi alterado
  acao: string;           // 'Criou', 'Alterou'…
  anterior: string | null;
  novo: string | null;
  pessoaId: string;       // quem pediu
  viaAssistente?: boolean;
  quando: string;         // AAAA-MM-DDTHH:MM:00, hora local
}
```

Pedido para a API real: as APIs de gravação (jornadas e cadastros) precisam aceitar a marcação
"via assistente" e a API da Auditoria precisa devolvê-la. Na tela, esses registros aparecem com a etiqueta
"Assistente" e a exportação tem a coluna "Via assistente".

Hoje, no app de demonstração, só as gravações feitas com o assistente criam registro
(`app/src/mock/auditoriaExtra.ts`). No sistema real, toda gravação é registrada pela API.

## 5. Onde a chave fica

- No desenvolvimento, só em `app/.env.local` (modelo em `app/.env.example`), nas variáveis `SCUA_IA_*`.
  Elas não têm o prefixo `VITE_`, então nunca entram no pacote do navegador.
- No sistema real, no servidor da Scua, por empresa ou uma chave única da Scua.
- A chave nunca vai para o navegador, para o `localStorage`, para a URL, para os logs nem para o git.
- A tela **Configurações › Assistente de IA** só envia a chave nova ao servidor. O servidor nunca a devolve:
  no máximo informa os 4 últimos caracteres. Na versão de demonstração a tela não guarda a chave.

## 6. Provedores e modelos

O intermediário de desenvolvimento fala com Claude (Anthropic), ChatGPT (OpenAI) e Gemini (Google)
por `fetch`, sem biblioteca do provedor (`servidor/provedores.ts`).

| Variável | Para quê |
|---|---|
| `SCUA_IA_PROVEDOR` | `anthropic` (padrão), `openai` ou `gemini` |
| `SCUA_IA_CHAVE` | Chave de API do provedor |
| `SCUA_IA_MODELO` | Modelo das conversas e do preenchimento. Só o Claude tem padrão. |
| `SCUA_IA_MODELO_ANALISE` | Modelo para analisar relatórios (opcional) |

## 7. Resumo do dia e aprovação em lote (feitos pelo app)

Estas duas funções **não passam pelo servidor de IA**: o app as resolve sozinho, com os mesmos dados e as mesmas
chamadas das telas (`src/features/assistente/resumo/`). Por isso o contrato das seções anteriores não muda.
O servidor real só precisa continuar atendendo `GET /extensoes`, `GET /beneficiarios/:id/resumo` e
`POST /extensoes/decisao-em-lote`, que a tela de Extensões já usa.

### Resumo do dia

Lista do que precisa de quem está logado, do mais importante ao menos (prioridade alta, média ou baixa). Cada item tem
título, detalhe e a tela que resolve:

| Item | Quem recebe | Abre |
|---|---|---|
| Pedidos de extensão esperando a decisão (quantos, e quantos estão dentro do limite do grupo) | quem aprova | `/extensoes/aprovar` |
| Horas além da jornada sem aprovação nos últimos 7 dias, na equipe, com o valor estimado em R$ | quem vê relatórios | `/radar-de-passivo` |
| Pessoas da equipe com hora extra subindo (a última semana passa de 25% sobre a anterior) | quem vê relatórios | `/previsao` |
| Estações ativas sem registro há mais de 3 dias | administração | `/relatorios/estacoes` |
| Pedidos da própria pessoa ainda sem resposta | todos | `/extensoes/meus` |

- A equipe é a de quem está logado (direta e indireta). RH e administração veem todos. Quem é só colaborador vê apenas o que é seu: nenhum dado de outra pessoa entra no resumo.
- Sem itens, a resposta é "Tudo em ordem por aqui."
- O resumo aparece numa caixa do cabeçalho, ao lado do modo claro/escuro (botão **Resumo do dia** com contador, em todas as telas), como primeira mensagem ao abrir a conversa vazia e num contador na bolha. Quem quiser também pode ligá-lo como bloco do Início em Personalizar. Quem pede "resumo do dia", "o que precisa de mim" ou "o que tenho para hoje" recebe o mesmo resumo.
- As mensagens de abertura são só do app: não vão para a IA (`mensagens` do pedido nunca começa por elas).

### Aprovação em lote com confirmação

1. A pessoa pede ("aprovar os pedidos dentro do limite") ou toca no item dos pedidos. O app busca a fila **de novo** e separa os pedidos que cabem no limite mensal do grupo (somando, na ordem de criação, os pedidos da mesma pessoa no mês) dos que passam dele. Sem o dado do limite, o pedido fica de fora.
2. O assistente mostra um cartão com os nomes, as horas, o total e os botões **Aprovar N pedidos** e **Cancelar**. Os pedidos fora do limite nunca entram; o cartão diz quais ficaram de fora e por quê.
3. **Nada é gravado antes do toque em Aprovar.** Só então o app chama a mesma aprovação em lote da tela de Extensões (`POST /extensoes/decisao-em-lote`, `{ ids, decisao: { acao: 'aprovar' } }`) e mostra quantos foram e quais falharam. Um toque só vale uma vez; Cancelar não chama nada.
4. Só quem pode aprovar recebe essa opção. O assistente continua sem reprovar e sem excluir: pedidos de reprovar ou excluir são recusados com um atalho para a tela de pedidos.
