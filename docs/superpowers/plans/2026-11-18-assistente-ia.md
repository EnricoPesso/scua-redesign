# Assistente de IA do Scua Logon — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um assistente de IA em todas as telas (bolha no canto) que preenche formulários, analisa relatórios, tira dúvidas e navega, só com as permissões da pessoa logada.

**Architecture:** O navegador monta um pedido (conversa + contexto da tela + ferramentas permitidas) e chama `POST /api/assistente`. Um plugin do Vite (só no servidor de desenvolvimento) lê a chave do `.env.local`, traduz o pedido para Claude, OpenAI ou Gemini e devolve texto + ações. O app confere e aplica as ações. Sem chave, e sempre nos testes, um modo simulado determinístico responde pelo mesmo contrato.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind 4, React Router 7, TanStack Query 5, Vitest + Testing Library, Playwright. Nenhuma dependência nova; chamadas aos provedores com `fetch`.

**Spec:** `docs/superpowers/specs/2026-11-18-assistente-ia-design.md`

## Global Constraints

- **Nenhum pacote novo** (política JFrog bloqueia instalação). Sem SDK de provedor.
- A chave só existe em `app/.env.local` (`SCUA_IA_PROVEDOR`, `SCUA_IA_CHAVE`, `SCUA_IA_MODELO`, `SCUA_IA_MODELO_ANALISE`), **sem prefixo `VITE_`**. Nunca no navegador, no `localStorage`, em log, em teste ou no git.
- Testes de unidade e e2e **nunca** chamam a rede: sempre modo simulado.
- O robô não exclui, não aprova nem reprova pedidos, e só age com as permissões da pessoa logada. Toda ação é conferida pelo app antes de aplicar.
- Só tokens do design system (claro e escuro). Sem `dark:` e sem cor fora dos tokens.
- Textos em português do Brasil, sem termo técnico na tela.
- Carga de dados: nenhum arquivo de `features/carga/` muda.
- Critérios de pronto do `CLAUDE.md` seção 3. Comandos: em `app/`, `npx tsc -b`, `npm run lint`, `npx vitest run`, `PW_CANAL=chrome npx playwright test`; em `design-system/`, `npm run build`, `npm run lint`, `npx tsc -b`, `npm test`, `npm run contrast`.
- Commits só locais; abrir o app no navegador para o responsável ver antes de cada commit de tela.

## Review Focus

1. **Resposta malformada do provedor** (JSON inválido nos argumentos da ferramenta, ferramenta desconhecida, campo que não existe): o app ignora a ação, não quebra, e o robô diz que não conseguiu. → teste na Tarefa 1 (`lerResposta` com argumentos inválidos) e na Tarefa 4 (`conferirAcoes`).
2. **Valor do tipo errado para um campo** (texto em campo numérico, hora "8h" em vez de "08:00", opção de select inexistente): o campo é ignorado ou normalizado e listado como "não preenchi". → Tarefa 6 e 7 (`aplicarCampos`).
3. **Pedido pendente que nunca encontra o formulário** (rota não abre, pessoa fecha o painel, troca de usuário): o pendente expira e o robô avisa; não preenche um formulário diferente depois. → Tarefa 4.
4. **Aprovação automática com formulário inválido ou proibida pelo administrador**: não salva e explica. → Tarefa 6.
5. **Falha de rede, chave inválida (401), limite (429) ou tempo esgotado**: mensagem humana com "Tentar de novo", sem vazar o texto do erro do provedor nem a chave. → Tarefa 2 (`responder`) e Tarefa 5 (janela).

---

## Estrutura de arquivos

```
app/src/features/assistente/
  contrato.ts            tipos do pedido, resposta, alvo e ações (compartilhado navegador/servidor)
  ferramentas.ts         definição das 3 ferramentas (JSON Schema) + quais oferecer
  servidor/provedores.ts adaptadores Anthropic/OpenAI/Gemini: montarChamada + lerResposta (puro)
  servidor/instrucoes.ts instrução fixa + texto de referência do sistema
  servidor/responder.ts  responder(pedido, env, fetch) → RespostaAssistente | erro
  servidor/plugin.ts     plugin do Vite: POST /api/assistente, GET /api/assistente/estado
  simulado.ts            respostas determinísticas pelo mesmo contrato
  api.ts                 perguntar(pedido) → escolhe servidor ou simulado
  acoes.ts               conferirAcoes, rotasPermitidas, formularios abríveis, aplicarCampos
  estado.tsx             AssistenteProvider, useAssistente, useAlvoDoAssistente
  preferencias.ts        aprovação automática por pessoa + config do administrador (mock)
  Bolha.tsx / Janela.tsx UI
  ConfigAssistentePage.tsx  Configurações › Assistente de IA
app/src/mock/auditoriaExtra.ts   registros criados em tempo de uso (via assistente)
docs/contrato-assistente.md      contrato /api/assistente para o back-end
```

---

### Task 1: Contrato, ferramentas e adaptadores dos provedores

**Files:**
- Create: `app/src/features/assistente/contrato.ts`, `ferramentas.ts`, `servidor/provedores.ts`
- Test: `app/src/features/assistente/servidor/provedores.test.ts`

**Interfaces:**
- Produces (`contrato.ts`):

```ts
export type Papel = 'usuario' | 'assistente';
export interface Mensagem { papel: Papel; texto: string }
export type TipoCampo = 'texto' | 'textoLongo' | 'numero' | 'hora' | 'data' | 'select' | 'alternar' | 'semana';
export interface CampoAlvo { chave: string; rotulo: string; tipo: TipoCampo; obrigatorio?: boolean; opcoes?: { value: string; label: string }[]; minimo?: number; maximo?: number; dica?: string }
export interface AlvoFormulario { tipo: 'formulario'; id: string; titulo: string; campos: CampoAlvo[]; valores: Record<string, unknown> }
export interface AlvoRelatorio { tipo: 'relatorio'; titulo: string; filtros: Record<string, string>; indicadores: { rotulo: string; valor: string }[]; colunas: string[]; linhas: string[][]; totalDeLinhas: number }
export type Alvo = AlvoFormulario | AlvoRelatorio;
export interface ContextoTela { rota: string; pessoa: string; hoje: string; telas: { titulo: string; para: string }[]; formularios: { id: string; titulo: string }[]; alvo: Alvo | null }
export type NomeFerramenta = 'preencher_formulario' | 'navegar' | 'abrir_formulario';
export interface PedidoAssistente { mensagens: Mensagem[]; contexto: ContextoTela; ferramentas: NomeFerramenta[] }
export type Acao =
  | { tipo: 'preencher'; campos: Record<string, unknown> }
  | { tipo: 'navegar'; rota: string }
  | { tipo: 'abrir_formulario'; formulario: string };
export interface RespostaAssistente { texto: string; acoes: Acao[]; simulado?: boolean }
export type Provedor = 'anthropic' | 'openai' | 'gemini';
```

- Produces (`ferramentas.ts`): `FERRAMENTAS: Record<NomeFerramenta, { descricao: string; parametros: object /* JSON Schema */ }>`. `preencher_formulario` recebe `{ campos: object }`; `navegar` recebe `{ rota: string }`; `abrir_formulario` recebe `{ formulario: string }`.
- Produces (`servidor/provedores.ts`):

```ts
export interface Chamada { url: string; headers: Record<string, string>; body: unknown }
export interface EntradaProvedor { provedor: Provedor; chave: string; modelo: string; sistema: string; mensagens: Mensagem[]; ferramentas: NomeFerramenta[] }
export function montarChamada(e: EntradaProvedor): Chamada;
export function lerResposta(provedor: Provedor, json: unknown): { texto: string; acoes: Acao[] };
```

Valores fixos por provedor:
- **anthropic:** `POST https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`; body `{ model, max_tokens: 2048, system, messages: [{role:'user'|'assistant', content}], tools: [{name, description, input_schema}] }`; resposta: blocos `content[]` de `type: 'text'` e `type: 'tool_use'` (`name`, `input`).
- **openai:** `POST https://api.openai.com/v1/chat/completions`, header `Authorization: Bearer`; body `{ model, messages: [{role:'system',content:sistema}, ...], tools: [{type:'function', function:{name, description, parameters}}] }`; resposta: `choices[0].message.content` e `.tool_calls[].function.{name, arguments}` (arguments é texto JSON).
- **gemini:** `POST https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent`, header `x-goog-api-key`; body `{ systemInstruction:{parts:[{text}]}, contents:[{role:'user'|'model', parts:[{text}]}], tools:[{functionDeclarations:[{name, description, parameters}]}] }`; resposta: `candidates[0].content.parts[]` com `text` ou `functionCall.{name, args}`.
- Sem ferramentas na lista, o campo `tools` é omitido.

- [ ] **Step 1: Teste falhando** (`provedores.test.ts`), um `describe` por provedor:

```ts
const base = { chave: 'k-teste', modelo: 'm', sistema: 'S', mensagens: [{ papel: 'usuario', texto: 'oi' }, { papel: 'assistente', texto: 'olá' }], ferramentas: ['navegar'] } as const;
it('anthropic: url, cabeçalhos, sistema, papéis e ferramenta', () => {
  const c = montarChamada({ ...base, provedor: 'anthropic' });
  expect(c.url).toBe('https://api.anthropic.com/v1/messages');
  expect(c.headers).toMatchObject({ 'x-api-key': 'k-teste', 'anthropic-version': '2023-06-01' });
  expect(c.body).toMatchObject({ model: 'm', system: 'S', messages: [{ role: 'user', content: 'oi' }, { role: 'assistant', content: 'olá' }] });
  expect((c.body as any).tools[0]).toMatchObject({ name: 'navegar', input_schema: { type: 'object' } });
});
it('anthropic: lê texto e tool_use', () => {
  expect(lerResposta('anthropic', { content: [{ type: 'text', text: 'Indo.' }, { type: 'tool_use', name: 'navegar', input: { rota: '/ausencias' } }] }))
    .toEqual({ texto: 'Indo.', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] });
});
// openai: Authorization 'Bearer k-teste'; messages[0] = {role:'system',content:'S'}; tools[0].function.name === 'navegar';
//   lê { choices:[{message:{content:null, tool_calls:[{function:{name:'preencher_formulario', arguments:'{"campos":{"nome":"X"}}'}}]}}] }
//   → { texto: '', acoes: [{ tipo:'preencher', campos:{ nome:'X' } }] }
// gemini: url termina em '/models/m:generateContent'; header 'x-goog-api-key'; contents[1].role === 'model';
//   lê functionCall { name:'abrir_formulario', args:{ formulario:'jornada' } } → acao abrir_formulario
it.each(['anthropic', 'openai', 'gemini'] as const)('%s: resposta malformada não quebra', (p) => {
  expect(lerResposta(p, { qualquer: 'coisa' })).toEqual({ texto: '', acoes: [] });
  expect(lerResposta(p, null)).toEqual({ texto: '', acoes: [] });
});
it('openai: argumentos com JSON inválido e ferramenta desconhecida são ignorados', () => {
  const r = lerResposta('openai', { choices: [{ message: { content: 'ok', tool_calls: [{ function: { name: 'navegar', arguments: '{rota' } }, { function: { name: 'apagar_tudo', arguments: '{}' } }] } }] });
  expect(r).toEqual({ texto: 'ok', acoes: [] });
});
it('sem ferramentas, não manda o campo tools', () => {
  expect(montarChamada({ ...base, provedor: 'anthropic', ferramentas: [] }).body).not.toHaveProperty('tools');
});
```

- [ ] **Step 2:** `cd app && npx vitest run src/features/assistente/servidor/provedores.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `contrato.ts`, `ferramentas.ts`, `provedores.ts`. `lerResposta` converte nome de ferramenta → `Acao` e descarta o que não tiver a forma certa (`campos` objeto, `rota`/`formulario` texto).
- [ ] **Step 4:** mesmo comando → PASS. `npx tsc -b` sem erros.
- [ ] **Step 5:** Commit `Assistente: contrato e adaptadores dos provedores`.

### Task 2: Intermediário no servidor de desenvolvimento

**Files:**
- Create: `servidor/instrucoes.ts`, `servidor/responder.ts`, `servidor/plugin.ts`
- Modify: `app/vite.config.ts` (adicionar o plugin)
- Test: `servidor/responder.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:

```ts
// instrucoes.ts
export function instrucoes(contexto: ContextoTela): string;  // instrução fixa + referência + contexto da tela em texto
// responder.ts
export interface EnvIA { SCUA_IA_PROVEDOR?: string; SCUA_IA_CHAVE?: string; SCUA_IA_MODELO?: string; SCUA_IA_MODELO_ANALISE?: string }
export type Resultado = { ok: true; resposta: RespostaAssistente } | { ok: false; status: number; motivo: 'sem-chave' | 'configuracao' | 'chave-recusada' | 'limite' | 'indisponivel' };
export function configurado(env: EnvIA): boolean;
export function responder(pedido: PedidoAssistente, env: EnvIA, buscar: typeof fetch): Promise<Resultado>;
// plugin.ts
export function assistentePlugin(): import('vite').Plugin;   // usa loadEnv(mode, cwd, 'SCUA_IA_')
```

Regras de `responder`:
- Sem `SCUA_IA_CHAVE` → `{ ok:false, status:503, motivo:'sem-chave' }`.
- Provedor fora de `anthropic|openai|gemini`, ou `openai`/`gemini` sem `SCUA_IA_MODELO` → `configuracao` (status 500). Padrão só para anthropic: modelo `claude-haiku-5-5`, análise `claude-sonnet-5-5`.
- Modelo de análise quando `pedido.contexto.alvo?.tipo === 'relatorio'` e `SCUA_IA_MODELO_ANALISE` (ou o padrão do anthropic) existe.
- HTTP 401/403 do provedor → `chave-recusada`; 429 → `limite`; outro erro, exceção de rede ou mais de 60 s (`AbortSignal.timeout(60_000)`) → `indisponivel` (status 502). **O corpo do erro do provedor nunca é repassado.**
- Só as ferramentas de `pedido.ferramentas` vão para o provedor; ações de ferramenta não oferecida são descartadas da resposta.

Plugin: `POST /api/assistente` (corpo JSON até 400 kB; inválido → 400) responde `resposta` ou `{ motivo }` com o status; `GET /api/assistente/estado` → `{ ativo: boolean, provedor: string | null }`. Nada é logado além de `motivo`.

Instrução fixa (conteúdo obrigatório, redação livre): assistente do Scua Logon; português do Brasil; texto simples sem markdown pesado (listas com "- "); só assuntos do sistema, recusando o resto em uma frase; nunca inventar dados, usar só o contexto; para preencher usar só `preencher_formulario` com as chaves dadas; horas "HH:MM", datas "AAAA-MM-DD"; campo `semana` = objeto `{seg..dom: {trabalha, entrada, saida, intervaloInicio, intervaloFim}}`; se não houver formulário aberto e o pedido for de cadastro, usar `abrir_formulario`; rotas só da lista `telas`.

- [ ] **Step 1: Teste falhando** (`responder.test.ts`), com `buscar` falso (`vi.fn`):

```ts
const pedido = { mensagens: [{ papel: 'usuario', texto: 'me leva para ausências' }], contexto: { rota: '/inicio', pessoa: 'Carlos', hoje: '2026-10-12', telas: [{ titulo: 'Ausências', para: '/ausencias' }], formularios: [], alvo: null }, ferramentas: ['navegar'] } as PedidoAssistente;
it('sem chave: 503 sem chamar a rede', async () => {
  const buscar = vi.fn();
  expect(await responder(pedido, {}, buscar)).toEqual({ ok: false, status: 503, motivo: 'sem-chave' });
  expect(buscar).not.toHaveBeenCalled();
});
it('anthropic: chama a API com o modelo padrão e devolve texto e ações', async () => {
  const buscar = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'navegar', input: { rota: '/ausencias' } }] }), { status: 200 }));
  const r = await responder(pedido, { SCUA_IA_PROVEDOR: 'anthropic', SCUA_IA_CHAVE: 'k' }, buscar);
  expect(r).toEqual({ ok: true, resposta: { texto: '', acoes: [{ tipo: 'navegar', rota: '/ausencias' }] } });
  expect(JSON.parse(buscar.mock.calls[0][1].body).model).toBe('claude-haiku-5-5');
});
it('relatório aberto usa o modelo de análise', …  // alvo relatorio → model 'claude-sonnet-5-5'; com SCUA_IA_MODELO_ANALISE='x' → 'x'
it.each([[401, 'chave-recusada'], [429, 'limite'], [500, 'indisponivel']])('HTTP %i do provedor vira %s, sem repassar o corpo', async (status, motivo) => {
  const buscar = vi.fn().mockResolvedValue(new Response('{"error":"sk-segredo vazou"}', { status }));
  const r = await responder(pedido, { SCUA_IA_PROVEDOR: 'openai', SCUA_IA_CHAVE: 'k', SCUA_IA_MODELO: 'm' }, buscar);
  expect(r).toMatchObject({ ok: false, motivo });
  expect(JSON.stringify(r)).not.toContain('segredo');
});
it('falha de rede vira indisponivel', …   // buscar rejeita
it('openai sem modelo é erro de configuração', …
it('ação de ferramenta não oferecida é descartada', …  // resposta traz preencher_formulario, pedido só ofereceu navegar → acoes: []
it('instrucoes incluem as telas, a pessoa e os campos do formulário aberto', …  // contém '/ausencias', 'Carlos', rótulo e chave do campo
```

- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Implementar os três arquivos e registrar `assistentePlugin()` em `vite.config.ts` (`plugins: [react(), tailwindcss(), assistentePlugin()]`).
- [ ] **Step 4:** teste → PASS; `npx tsc -b`; `npm run build` continua passando; com o servidor `dev:mock` rodando, `curl -s localhost:5173/api/assistente/estado` → `{"ativo":false,"provedor":null}` enquanto não houver chave.
- [ ] **Step 5:** Commit `Assistente: intermediário no servidor de desenvolvimento`.

### Task 3: Modo simulado

**Files:**
- Create: `simulado.ts`, `api.ts`
- Test: `simulado.test.ts`

**Interfaces:**
- Produces:

```ts
// simulado.ts
export function interpretarJornada(texto: string): Partial<DadosJornada>;   // puro
export function responderSimulado(pedido: PedidoAssistente): RespostaAssistente;  // sempre simulado: true
// api.ts
export function forcarSimulado(): boolean;  // import.meta.env.MODE === 'test' || globalThis.__SCUA_IA_SIMULADO__ === true
export async function perguntar(pedido: PedidoAssistente, signal?: AbortSignal): Promise<RespostaAssistente>;
export class ErroDoAssistente extends Error { motivo: 'chave-recusada' | 'limite' | 'indisponivel' | 'configuracao' }
```

`perguntar`: se `forcarSimulado()` → simulado. Senão `POST /api/assistente`; 503 `sem-chave` ou 404 (build sem servidor) → simulado; outros erros → `ErroDoAssistente`.

Regras do simulado (última mensagem da pessoa, sem acento e minúscula), na ordem:
1. **Formulário aberto** e ferramenta `preencher_formulario`: se `alvo.id === 'jornada'` → `interpretarJornada`; senão, para cada campo do alvo, procura `"<rótulo>: valor"` ou `"<rótulo> valor"` até vírgula/ponto e vírgula (número, hora, "sim/não" para `alternar`, rótulo da opção para `select`). Achou algo → ação `preencher`.
2. **Sem formulário** e o texto pede cadastro ("cria", "criar", "nova", "novo", "cadastra", "adiciona") de um título em `contexto.formularios` → ação `abrir_formulario`.
3. **Relatório aberto** e texto com "analis", "resum", "destaq", "quem mais" → texto com título, total de linhas, cada indicador e as 3 primeiras linhas; sem linhas → "Não há dados com esses filtros."
4. **Navegar** ("me leva", "abre", "abrir", "ir para", "vai para") → primeira tela de `contexto.telas` cujo título aparece no texto; "ontem"/"hoje" em Ausências acrescenta `?de=&ate=` a partir de `contexto.hoje`.
5. **Dúvida** com palavra de `extens`, `ausenc`, `jornada`, `relatorio`, `grupo`, `pausa`, `auditoria`, `carga` → parágrafo fixo de referência do tema.
6. Qualquer outra coisa → `"Só consigo ajudar com o Scua Logon: preencher cadastros, analisar relatórios, tirar dúvidas e abrir telas."` sem ações.

`interpretarJornada`: dias por "seg(unda) a sex(ta)", "todos os dias", "sábado", lista "seg, qua e sex"; horário "8h às 17h", "das 08:00 às 17:00", "8 as 17"; intervalo "almoço/intervalo (das) 12 às 13"; "sem intervalo" → intervalo vazio; identificador por `nome X` / `identificador X` / `chamada X` (maiúsculas, até 20); tipo se o texto citar um de `TIPOS_DE_JORNADA`; dias não citados → `trabalha: false`.

- [ ] **Step 1: Teste falhando**:

```ts
it('jornada do exemplo da spec', () => {
  const j = interpretarJornada('seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H');
  expect(j.identificador).toBe('ADM-8H');
  expect(j.semana?.seg).toEqual({ trabalha: true, entrada: '08:00', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' });
  expect(j.semana?.sex.saida).toBe('17:00');
  expect(j.semana?.sab.trabalha).toBe(false);
});
it('lista de dias, meia hora e sem intervalo', () => {
  const j = interpretarJornada('seg, qua e sex das 07:30 às 13:30 sem intervalo');
  expect(j.semana?.qua).toMatchObject({ trabalha: true, entrada: '07:30', saida: '13:30', intervaloInicio: '', intervaloFim: '' });
  expect(j.semana?.ter.trabalha).toBe(false);
});
it('texto sem horário não inventa nada', () => { expect(interpretarJornada('oi tudo bem')).toEqual({}); });
// responderSimulado:
//  - alvo jornada + 'preencher_formulario' → acoes[0].tipo 'preencher', simulado true
//  - alvo cadastro { campos:[{chave:'nome',rotulo:'Nome',tipo:'texto'},{chave:'minutos',rotulo:'Duração',tipo:'numero'},{chave:'ativo',rotulo:'Ativa',tipo:'alternar'}] }
//      texto 'nome: Café, duração 15, ativa: sim' → campos { nome:'Café', minutos:15, ativo:true }
//  - sem alvo, formularios [{id:'jornada',titulo:'Jornada de trabalho'}], 'cria uma jornada seg a sex 8 às 17' → [{tipo:'abrir_formulario', formulario:'jornada'}]
//  - mesmo texto SEM 'abrir_formulario' em ferramentas → acoes [] e texto dizendo que a pessoa não pode cadastrar
//  - alvo relatorio com 2 indicadores e 5 linhas, 'analisa esse relatório' → texto contém o título, '5' e os rótulos dos indicadores; acoes []
//  - 'me leva para ausências de ontem' com hoje 2026-10-12 → [{tipo:'navegar', rota:'/ausencias?de=2026-10-11&ate=2026-10-11'}]
//  - 'qual a capital da França?' → texto começa com 'Só consigo ajudar com o Scua Logon', acoes []
//  - 'como aprovo uma extensão?' → texto menciona 'Extensões de jornada', acoes []
it('perguntar: em teste, não chama fetch', async () => {
  const espia = vi.spyOn(globalThis, 'fetch');
  const r = await perguntar({ mensagens: [{ papel: 'usuario', texto: 'oi' }], contexto: { rota: '/', pessoa: 'x', hoje: '2026-10-12', telas: [], formularios: [], alvo: null }, ferramentas: [] });
  expect(r.simulado).toBe(true); expect(espia).not.toHaveBeenCalled();
});
```

- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar. **Step 4:** PASS + `npx tsc -b`.
- [ ] **Step 5:** Commit `Assistente: modo simulado`.

### Task 4: Estado no navegador, conferência de ações e pedido pendente

**Files:**
- Create: `acoes.ts`, `estado.tsx`, `preferencias.ts`
- Modify: `app/src/app/Provedores.tsx` ou `layout/AppShell.tsx` (envolver o conteúdo com `AssistenteProvider`; precisa estar dentro do Router e do QueryClient)
- Test: `acoes.test.ts`, `estado.test.tsx`

**Interfaces:**
- Consumes: Tasks 1 e 3; `telasPara`, `tem` de `layout/menu.ts`; `usePermissoes`.
- Produces:

```ts
// acoes.ts
export const FORMULARIOS: { id: string; titulo: string; rota: string; permissao: Permissao }[];
//   'jornada' → '/jornadas/nova' ('pessoas'); 'cadastro:<chave>' → '<rota da lista>?novo=1' para Pausas, Liberações ('pessoas') e cada item de CONFIGURACOES ('administracao')
export function formulariosPara(p: Permissoes): { id: string; titulo: string }[];
export function rotaPermitida(rota: string, p: Permissoes): boolean;
//   caminho (sem query) ∈ telasPara(p).para ∪ rotas de FORMULARIOS permitidos; query só com chaves de FILTROS_DA_URL[caminho]
export function ferramentasPara(p: Permissoes, alvo: Alvo | null): NomeFerramenta[];
export function conferirAcoes(acoes: Acao[], ctx: { permissoes: Permissoes; alvo: Alvo | null }): { validas: Acao[]; recusadas: string[] };
export interface ResultadoAplicar { aplicados: { rotulo: string; valor: string }[]; ignorados: string[] }
export function normalizarCampo(campo: CampoAlvo, valor: unknown): { ok: true; valor: unknown } | { ok: false };
//   numero: aceita número ou texto numérico dentro de minimo/maximo; hora: 'HH:MM' (aceita '8h', '8:5' → '08:05'); data 'AAAA-MM-DD';
//   select: value ou label de uma opção; alternar: boolean ou 'sim'/'não'; texto: string cortada em maximo
// preferencias.ts
export interface ConfigAssistente { ativo: boolean; origemDaChave: 'scua' | 'propria'; provedor: Provedor; permitirAutomatica: boolean }
export function lerConfig(): ConfigAssistente; export function salvarConfig(c: ConfigAssistente): void; export function resetarConfigAssistente(): void;
//   padrão { ativo: true, origemDaChave: 'scua', provedor: 'anthropic', permitirAutomatica: true }; guardado em memória do mock (como mock/grupos.ts)
export function lerAutomatica(usuarioId: string): boolean; export function salvarAutomatica(usuarioId: string, ligada: boolean): void;  // localStorage 'scua.assistente.auto.<id>', try/catch
// estado.tsx
export interface RegistroAlvo { alvo: Alvo; aplicar?: (campos: Record<string, unknown>) => ResultadoAplicar; salvar?: () => Promise<{ ok: boolean; mensagem: string }> }
export function AssistenteProvider(props: { children: ReactNode }): JSX.Element;
export function useAlvoDoAssistente(registro: RegistroAlvo | null): void;      // registra enquanto montado; null = sem alvo
export function useAssistente(): {
  ativo: boolean; aberto: boolean; abrir(): void; fechar(): void;
  conversa: (Mensagem & { erro?: boolean })[]; pensando: boolean; simulado: boolean;
  enviar(texto: string): Promise<void>; tentarDeNovo(): Promise<void>; limpar(): void;
  automatica: boolean; podeAutomatica: boolean; definirAutomatica(ligada: boolean): void;
};
```

Fluxo de `enviar`: monta `ContextoTela` (rota atual com query, primeiro nome, `hoje()`, `telasPara`, `formulariosPara`, alvo registrado) → `perguntar` → `conferirAcoes` → aplica na ordem:
- `preencher`: `registro.aplicar(campos)`; o texto final = texto do modelo (se houver) + `"Preenchi: <rótulo>: <valor>; …"` + `"Não preenchi: …"` quando houver ignorados. Se `automatica && podeAutomatica && registro.salvar` → chama `salvar()` e acrescenta a mensagem devolvida; senão acrescenta `"Confira e clique em Salvar."`.
- `navegar`: `navigate(rota)`; texto padrão `"Abri <título da tela>."` se o modelo não mandou texto.
- `abrir_formulario`: navega para a rota do formulário e guarda **pendente** `{ formulario, texto, expira: agora + 8 s }`. Quando um alvo com `alvo.id === formulario` se registra antes de expirar, reenvia o mesmo texto (uma vez) já com o novo contexto. Se expirar, ou outro alvo se registrar, limpa o pendente e acrescenta `"Abri a tela, mas não consegui preencher. Peça de novo com o formulário aberto."`.
- Ações recusadas → acrescenta `"Não posso fazer isso com o seu acesso."`.
- `ErroDoAssistente` → mensagem com `erro: true`: `chave-recusada` "A chave da IA foi recusada. Avise o administrador."; `limite` "O limite de uso da IA foi atingido. Tente daqui a pouco."; demais "Não consegui responder agora."
- Envio com `pensando` verdadeiro é ignorado; texto vazio é ignorado. Trocar de pessoa (`usuario.id`) limpa a conversa e o pendente.

- [ ] **Step 1: Testes falhando.**

`acoes.test.ts`:
```ts
// permissões de exemplo: admin (tudo true) e colaborador (só podePedir)
expect(rotaPermitida('/ausencias?de=2026-10-11&ate=2026-10-11', admin)).toBe(true);
expect(rotaPermitida('/relatorios/tempo-de-bloqueio', admin)).toBe(true);
expect(rotaPermitida('/jornadas/nova', admin)).toBe(true);
expect(rotaPermitida('/auditoria', colaborador)).toBe(false);
expect(rotaPermitida('/ausencias?perigo=1', admin)).toBe(false);
expect(rotaPermitida('https://exemplo.com', admin)).toBe(false);
expect(rotaPermitida('//exemplo.com', admin)).toBe(false);
expect(formulariosPara(colaborador)).toEqual([]);
expect(ferramentasPara(colaborador, null)).toEqual(['navegar']);
expect(ferramentasPara(admin, alvoFormulario)).toEqual(['preencher_formulario', 'navegar', 'abrir_formulario']);
// conferirAcoes: preencher sem formulário aberto → recusada; preencher com chave inexistente → a chave some, as outras ficam;
//   navegar proibido → recusada; abrir_formulario desconhecido ou sem permissão → recusada
// normalizarCampo: hora '8h' → '08:00', '25:00' → ok:false; numero '15' → 15, 61 com maximo 60 → ok:false, 'abc' → ok:false;
//   select por label 'Comercial' → value; opção inexistente → ok:false; alternar 'sim' → true
```

`estado.test.tsx` (com `renderApp`, um componente de teste que registra um alvo de formulário com `aplicar`/`salvar` espiões):
```ts
// 1. enviar('nome: Café') chama aplicar({ nome:'Café' }) e a conversa termina com texto contendo 'Preenchi: Nome: Café' e 'Confira e clique em Salvar.'; salvar NÃO é chamado
// 2. com salvarAutomatica('u-carlos', true): salvar é chamado uma vez e a mensagem devolvida aparece
// 3. com config permitirAutomatica false: salvar não é chamado mesmo com a preferência ligada, e podeAutomatica === false
// 4. 'me leva para auditoria' como olga → conversa contém 'Não posso fazer isso com o seu acesso.' e a rota não muda
// 5. pendente: no /inicio, 'cria uma jornada seg a sex 8 às 17' → navega para /jornadas/nova; quando o alvo 'jornada' se registra, aplicar é chamado com semana.seg.entrada '08:00' sem novo envio da pessoa
// 6. pendente que expira (vi.useFakeTimers, avança 9 s sem alvo) → mensagem 'Abri a tela, mas não consegui preencher…' e um alvo registrado depois NÃO recebe aplicar
// 7. perguntar rejeitando ErroDoAssistente('limite') → última mensagem com erro true e o texto do limite; tentarDeNovo reenvia
```

- [ ] **Step 2:** rodar os dois arquivos → FAIL. **Step 3:** implementar. **Step 4:** PASS, `npx tsc -b`, `npm run lint`.
- [ ] **Step 5:** Commit `Assistente: estado, conferência de ações e pedido pendente`.

### Task 5: Bolha e janelinha

**Files:**
- Create: `Bolha.tsx`, `Janela.tsx`
- Modify: `layout/AppShell.tsx` (montar `<Bolha />` no fim do contêiner raiz); `design-system/src/components/ui/toaster.tsx` (posição `bottom-[var(--toaster-bottom,1rem)]`); `app/src/index.css` (`:root:has([data-assistente]) { --toaster-bottom: 5rem; }`)
- Test: `Janela.test.tsx`

**Interfaces:**
- Consumes: `useAssistente` (Task 4).
- Produces: `<Bolha />` (não renderiza nada se `!ativo`); `export function BotaoPreencherComIA(): JSX.Element` (botão "Preencher com IA" que chama `abrir()`), usado nas Tasks 6 e 7.

Requisitos de tela (spec 4.1):
- Bolha: `button` fixo `right-4 bottom-4 z-50`, 56 px, fundo `--color-brand`, ícone `BotIcon`, `aria-label="Assistente Scua"`, `aria-expanded`, `data-assistente`.
- Janela: `role="dialog"` não modal, `aria-label="Assistente Scua"`; desktop `fixed right-4 bottom-20 w-96 max-h-[min(36rem,calc(100dvh-6rem))]`; em `max-md` ocupa a tela toda (`inset-0`). Cabeçalho com título, botão "Limpar conversa" e "Fechar". Aviso fixo: "Respostas geradas por IA. Confira antes de salvar. O conteúdo da conversa e os dados da tela aberta são enviados ao provedor de IA configurado." Quando `simulado`: selo "Modo demonstração (sem IA conectada)".
- Conversa: `role="log"` com `aria-live="polite"`; mensagens da pessoa à direita em `--color-brand` com texto de contraste AA; do assistente à esquerda em `--color-surface-muted`; quebra de linha preservada (`whitespace-pre-wrap`), sem HTML vindo da resposta (texto puro).
- Vazia: 3 sugestões clicáveis conforme o alvo (formulário: "Preencher este cadastro"; relatório: "Analisar este relatório"; sempre: "Como aprovo uma extensão?").
- Pensando: linha `role="status"` "Pensando…". Erro: mensagem + botão "Tentar de novo".
- Entrada: `textarea` com `label` sr-only "Mensagem para o assistente", Enter envia, Shift+Enter quebra linha, botão "Enviar" desabilitado com texto vazio ou pensando.
- Controle "Aprovação automática" (Toggle) dentro da janela, só quando `podeAutomatica`; dica "O assistente salva sozinho depois de preencher. Nunca exclui nada."
- Foco: abrir → textarea; Esc ou Fechar → volta para a bolha. Alvos de toque ≥ 44 px no celular.

- [ ] **Step 1: Teste falhando** (`Janela.test.tsx`, via `renderApp('/inicio')`):

```ts
// 1. bolha tem nome 'Assistente Scua' e aria-expanded false; clicar abre o dialog 'Assistente Scua' e o foco está no campo 'Mensagem para o assistente'
// 2. Esc fecha e document.activeElement é a bolha
// 3. digitar 'qual a capital da França?' + Enter → aparece a mensagem da pessoa e depois o texto 'Só consigo ajudar com o Scua Logon'; o campo fica vazio
// 4. Shift+Enter não envia
// 5. selo 'Modo demonstração' visível (teste = simulado); aviso de envio de dados ao provedor visível
// 6. 'Limpar conversa' esvazia o log
// 7. com lerConfig().ativo === false a bolha não existe
// 8. erro: perguntar mockado rejeitando → 'Não consegui responder agora.' e botão 'Tentar de novo'
// 9. resposta com '<img src=x onerror=…>' aparece como texto, sem criar elemento img
// 10. troca de tela (clicar em 'Usuários' no menu) mantém a conversa
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS; `cd design-system && npm run build && npx tsc -b && npm run lint`; `cd app && npx tsc -b && npm run lint`.
- [ ] **Step 5:** Abrir `http://localhost:5173/inicio` (claro e escuro, 1440/768/390), conferir que o toast aparece acima da bolha, mostrar ao responsável. Commit `Assistente: bolha e janela de conversa`.

### Task 6: Preencher a Jornada de trabalho + Auditoria "via assistente"

**Files:**
- Create: `app/src/mock/auditoriaExtra.ts`, `app/src/features/jornadas/assistente.ts`
- Modify: `features/jornadas/components/FormularioJornada.tsx`, `features/jornadas/api.ts` (registrar na auditoria), `features/auditoria/domain/auditoria.ts` (`viaAssistente?: boolean` em `Registro`), `features/auditoria/api.ts` (somar os extras), tabela da Auditoria (etiqueta), `test/setup.ts` (reset)
- Test: `features/jornadas/assistente.test.ts`, `features/jornadas/components/FormularioJornada.assistente.test.tsx`

**Interfaces:**
- Consumes: `useAlvoDoAssistente`, `RegistroAlvo`, `normalizarCampo`, `BotaoPreencherComIA`.
- Produces:

```ts
// mock/auditoriaExtra.ts
export function registrarAuditoria(r: Omit<Registro, 'id' | 'quando'> & { viaAssistente?: boolean }): void;  // quando = agora local 'YYYY-MM-DDTHH:MM:00'
export function registrosExtras(): Registro[]; export function resetarAuditoriaExtra(): void;
// features/jornadas/assistente.ts
export const CAMPOS_DA_JORNADA: CampoAlvo[];   // identificador, descricao, tipo(select TIPOS_DE_JORNADA), ativa, padrao, liberaRegra, informativa, semana('semana')
export function aplicarNaJornada(atual: DadosJornada, campos: Record<string, unknown>): { dados: DadosJornada; resultado: ResultadoAplicar; chaves: string[] };
// salvarJornada ganha um 3º parâmetro opcional
export function salvarJornada(id: string | null, dados: DadosJornada, opcoes?: { viaAssistente?: boolean }): Promise<Jornada>;
```

Regras:
- `aplicarNaJornada`: campos simples por `normalizarCampo`; `semana` aceita objeto parcial por dia, cada hora normalizada; dia com forma inválida vai para `ignorados` ("Terça"); `aplicados` descreve a semana em uma linha por grupo de dias iguais ("Seg a Sex: 08:00–17:00, intervalo 12:00–13:00"; "Sáb e Dom: folga"). `chaves` = chaves tocadas (`'identificador'`, `'semana.seg'`…).
- `FormularioJornada`: registra `{ alvo: { tipo:'formulario', id:'jornada', titulo, campos: CAMPOS_DA_JORNADA, valores: dados }, aplicar, salvar }`. `aplicar` faz `setDados` e guarda as chaves em `preenchidosPelaIA`; cada campo com chave marcada ganha `data-ia="true"` e anel `ring-2 ring-[var(--color-brand)]` até a pessoa alterar aquele campo. Faixa no topo enquanto houver marcados: "Preenchido pelo assistente. Confira antes de salvar." `salvar()` valida com `validarJornada`: com erros → `setErros`, devolve `{ ok:false, mensagem:'Não salvei: há campos para corrigir no formulário.' }`; sem erros → `salvarJornada(id, dados, { viaAssistente: true })` e devolve `{ ok:true, mensagem:'Salvei a jornada <identificador>.' }`. O Salvar manual passa `viaAssistente: true` só se ainda houver campo marcado.
- `BotaoPreencherComIA` no topo do formulário.
- `salvarJornada` registra na auditoria (aba `jornadas`, item = identificador, ação `Criou`/`Alterou`, `novo` = resumo da carga, `pessoaId` = pessoa logada, `viaAssistente` conforme a opção). Tabela e cartões da Auditoria mostram `Badge` "Assistente" quando `viaAssistente`; a exportação ganha a coluna "Via assistente" (Sim/Não).

- [ ] **Step 1: Testes falhando.**

```ts
// assistente.test.ts
const r = aplicarNaJornada(novaJornada(), { identificador: 'adm-8h', tipo: 'Comercial', semana: { seg: { trabalha: true, entrada: '8h', saida: '17:00', intervaloInicio: '12:00', intervaloFim: '13:00' }, sab: { trabalha: false } }, cor: 'azul' });
expect(r.dados.identificador).toBe('ADM-8H'); expect(r.dados.semana.seg.entrada).toBe('08:00'); expect(r.dados.semana.sab.trabalha).toBe(false);
expect(r.resultado.ignorados).toContain('cor'); expect(r.chaves).toEqual(expect.arrayContaining(['identificador', 'tipo', 'semana.seg', 'semana.sab']));
// tipo inexistente 'Noturna' → ignorado, dados.tipo inalterado; semana.ter = 'das 8 às 17' (texto) → 'Terça' em ignorados; hora '25:99' → dia ignorado

// FormularioJornada.assistente.test.tsx (renderApp('/jornadas/nova'), entrarComo('carlos'))
// 1. botão 'Preencher com IA' abre o dialog; enviar 'seg a sex, 7h às 16h, almoço 11 às 12, nome TESTE-7H'
//    → campo Identificador tem valor 'TESTE-7H' e data-ia 'true'; faixa 'Preenchido pelo assistente' visível; conversa contém 'Confira e clique em Salvar.'; a jornada NÃO existe em listarJornadas()
// 2. editar o Identificador tira o data-ia só dele
// 3. clicar em Salvar grava; registrosExtras() tem { aba:'jornadas', item:'TESTE-7H', acao:'Criou', viaAssistente:true, pessoaId:'u-carlos' }
// 4. aprovação automática ligada: depois do envio, listarJornadas() contém 'TESTE-7H' e a conversa diz 'Salvei a jornada TESTE-7H.'
// 5. automática + identificador que já existe ('ADM-8H' da semente) → não salva, conversa contém 'Não salvei: há campos para corrigir no formulário.' e o erro do campo aparece
// 6. no /inicio, enviar 'cria uma jornada seg a sex 8 às 17 nome NOVA-1' → local vira /jornadas/nova e o Identificador recebe 'NOVA-1'
// 7. como olga (sem 'pessoas'): no /inicio, mesmo pedido → rota não muda e a conversa explica que ela não pode cadastrar
// 8. Auditoria: depois do item 3, /auditoria/jornadas mostra a linha TESTE-7H com a etiqueta 'Assistente'
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + suíte de Jornadas e Auditoria inteira (`npx vitest run src/features/jornadas src/features/auditoria`), `npx tsc -b`, `npm run lint`.
- [ ] **Step 5:** Abrir `/jornadas/nova`, mostrar ao responsável. Commit `Assistente: preenche a jornada de trabalho e registra na auditoria`.

### Task 7: Preencher os cadastros do modelo único

**Files:**
- Modify: `componentes/cadastro/ModeloCadastro.tsx` (`FormularioCadastro`)
- Test: `componentes/cadastro/ModeloCadastro.assistente.test.tsx`

**Interfaces:**
- Consumes: Tasks 4–6. `ConfigCadastro<T>.campos` já descreve os campos (`CampoCadastro<T>` com `tipo`, `rotulo`, `opcoes`, `minimo`, `maximo`, `obrigatorio`, `dica`, `fixoAoEditar`).
- Produces: alvo `{ tipo:'formulario', id: 'cadastro:' + config.chave, titulo: config.singular, campos, valores }`. Os ids de `FORMULARIOS` (Task 4) usam a mesma chave.

Regras: `CampoCadastro` → `CampoAlvo` direto (mesmos nomes de tipo). Campo `fixoAoEditar` na edição fica fora do alvo. `aplicar` usa `normalizarCampo` por campo, marca os preenchidos (mesmo `data-ia` e faixa da Task 6). `salvar()` usa `validarCadastro` e o salvamento que o formulário já faz; mensagem `'Salvei <singular> <nomeDe(item)>.'` ou a de erro da Task 6. `BotaoPreencherComIA` no topo. Auditoria: registra só quando `config.chave` corresponde a uma aba existente (`parametros`, `excecoes`, `liberacoes`, `whatsapp`); os demais cadastros não registram (a Auditoria não tem onde mostrar).

- [ ] **Step 1: Teste falhando** (Pausas como exemplo real, `renderApp('/pausas?novo=1')`):

```ts
// 1. enviar '<rótulo do nome>: Café da tarde, <rótulo da duração>: 15' (rótulos lidos da config de Pausas) → os dois campos preenchidos com data-ia, nada salvo
// 2. valor fora do limite do campo numérico → campo não muda e a conversa lista 'Não preenchi: <rótulo>'
// 3. automática ligada → o item aparece na lista e a conversa diz 'Salvei'
// 4. no /inicio: 'cria uma pausa <rótulo>: Lanche' → abre /pausas?novo=1 e preenche
// 5. teste parametrizado: para cada entrada de FORMULARIOS, a rota abre um formulário que registra um alvo com o mesmo id (garante que nenhum id ficou órfão)
// 6. ModeloCadastro.test.tsx existente continua passando
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + `npx vitest run src/componentes src/features/pausas src/features/liberacoes src/features/configuracoes`.
- [ ] **Step 5:** Abrir `/pausas?novo=1`, mostrar. Commit `Assistente: preenche os cadastros do modelo único`.

### Task 8: Analisar relatórios

**Files:**
- Modify: `design-system/src/modelos/relatorio/modelo-relatorio.tsx` e `tipos.ts` (nova prop opcional), página de relatório do app que usa `ModeloRelatorio` (`features/relatorios/...`)
- Create: `app/src/features/relatorios/assistente.ts`
- Test: `app/src/features/relatorios/assistente.test.ts` + caso em teste de tela de relatório

**Interfaces:**
- Produces:

```ts
// design-system: ModeloRelatorioProps<T> ganha
aoCarregar?: (dados: { aplicados: ValoresFiltro; rows: T[]; status: 'carregando' | 'erro' | 'pronto' }) => void;   // chamada em efeito quando rows/status mudam
// app
export const MAX_LINHAS_PARA_IA = 60;
export function alvoDoRelatorio<T extends object>(config: ConfigRelatorio<T>, aplicados: ValoresFiltro, rows: T[]): AlvoRelatorio;
```

`alvoDoRelatorio`: `titulo`; `filtros` como texto legível (período "de … a …", nomes em vez de ids quando o filtro tem opções); `indicadores` = cada `config.kpis` com `valor(rows)` formatado (decimais e unidade); `colunas` = cabeçalhos; `linhas` = texto de cada célula das primeiras `MAX_LINHAS_PARA_IA` linhas (o mesmo texto que a exportação usa); `totalDeLinhas = rows.length`. A página registra o alvo só com `status === 'pronto'`.

- [ ] **Step 1: Teste falhando:**

```ts
// alvoDoRelatorio com a config 'tempo-de-bloqueio' e as linhas reais do mock:
//   titulo === 'Tempo de bloqueio'; indicadores.length === config.kpis.length; indicadores[0].rotulo === 'Bloqueios liberados';
//   linhas.length === Math.min(rows.length, 60); totalDeLinhas === rows.length; nenhuma célula contém '[object Object]' nem 'undefined'
// 200 linhas falsas → linhas.length === 60, totalDeLinhas === 200
// tela: renderApp('/relatorios/tempo-de-bloqueio'), abrir o assistente, enviar 'analisa esse relatório'
//   → conversa contém 'Tempo de bloqueio' e 'Bloqueios liberados' e o mesmo número do KpiCard da tela
// tela: com período sem dados → 'Não há dados com esses filtros.'
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + `cd design-system && npm test && npm run build && npx tsc -b && npm run lint`; `cd app && npx vitest run src/features/relatorios`.
- [ ] **Step 5:** Abrir `/relatorios/tempo-de-bloqueio`, mostrar. Commit `Assistente: analisa o relatório aberto`.

### Task 9: Configurações › Assistente de IA

**Files:**
- Create: `ConfigAssistentePage.tsx`
- Modify: catálogo e rotas de Configurações (`features/configuracoes/catalogo.ts` e `routes`), `test/setup.ts` (`resetarConfigAssistente`)
- Test: `ConfigAssistentePage.test.tsx`

**Interfaces:**
- Consumes: `lerConfig`, `salvarConfig` (Task 4), `GET /api/assistente/estado` (Task 2; em teste não é chamado).

Tela (spec 4.5), rota `/configuracoes/assistente-ia`, só para `administracao`, aparece no catálogo e na busca de telas:
- Toggle "Assistente ligado".
- Opção "De quem é a chave": "Chave da Scua" / "Chave própria"; com "própria", Select "Provedor" (Claude, ChatGPT, Gemini) e campo "Chave de API" tipo senha, **que nunca é lido de volta nem guardado**: ao salvar, o campo esvazia e aparece "Chave cadastrada (termina em …XXXX)" com os 4 últimos caracteres mantidos só em memória da tela.
- Toggle "Permitir aprovação automática".
- Aviso: "Nesta versão de demonstração a chave não é guardada. A conexão real usa a configuração do servidor." e o aviso de envio de dados ao provedor (mesmo texto da janela).
- Situação da conexão: "IA conectada (<provedor>)" ou "Modo demonstração" conforme `/api/assistente/estado` (simulado nos testes).
- Salvar → toast "Configurações do assistente salvas."

- [ ] **Step 1: Teste falhando:**

```ts
// 1. como carlos: a tela abre com 'Assistente ligado' marcado; desligar + Salvar → lerConfig().ativo === false e a bolha some
// 2. desligar 'Permitir aprovação automática' + Salvar → na janela o controle 'Aprovação automática' não existe
// 3. chave própria: digitar 'sk-abcdef1234' + Salvar → campo vazio, texto 'termina em …1234' visível; 'sk-abcdef1234' não aparece em localStorage, sessionStorage nem em document.body.innerHTML
// 4. como olga: /configuracoes/assistente-ia mostra 'Sem acesso'
// 5. telasPara(admin) inclui 'Assistente de IA'
```

- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS + `npx vitest run src/features/configuracoes src/layout`.
- [ ] **Step 5:** Abrir a tela, mostrar. Commit `Assistente: tela de configurações`.

### Task 10: Ponta a ponta, documentos e verificação final

**Files:**
- Create: `app/e2e/assistente.spec.ts`, `docs/contrato-assistente.md`, `app/.env.example`
- Modify: `app/e2e/telas.spec.ts` (tela nova na lista), `perguntas-para-scua.md` (5 perguntas da spec item 9), `docs/ajustes-pendentes.md`, `CLAUDE.md` (variáveis `SCUA_IA_*` na seção 3.5)

- [ ] **Step 1:** `assistente.spec.ts`: todo teste começa com `await page.addInitScript(() => { (globalThis as any).__SCUA_IA_SIMULADO__ = true; })` e falha se houver requisição para `**/api/assistente` (`page.on('request')`). Casos, nos 3 tamanhos onde fizer sentido:
  1. No Início, abrir a bolha, pedir "cria uma jornada seg a sex, 8h às 17h, almoço 12 às 13, nome E2E-8H" → abre Nova jornada preenchida; Salvar; a jornada aparece na lista.
  2. Em "Tempo de bloqueio", "analisa esse relatório" → resposta cita o título.
  3. "me leva para ausências de ontem" → URL `/ausencias?de=…&ate=…`.
  4. Como Olga (`?como=olga`): "me leva para auditoria" → continua na mesma tela, com a recusa.
  5. Celular 390×844: janela ocupa a tela, sem rolagem horizontal, controles ≥ 44 px; Esc/Fechar devolve o foco.
  6. Tema escuro: bolha e janela visíveis; screenshot.
  7. Zero erros no console em todos.
- [ ] **Step 2:** `PW_CANAL=chrome npx playwright test e2e/assistente.spec.ts` → PASS.
- [ ] **Step 3:** `docs/contrato-assistente.md`: os tipos da Task 1, os dois endpoints, os motivos de erro e status, o que o servidor real deve conferir de novo (permissões, tamanho do pedido, registro em auditoria com `viaAssistente`), e onde a chave fica. `app/.env.example` com as 4 variáveis vazias e comentários.
- [ ] **Step 4:** Suíte completa: `app` (`npm run build`, `npm run lint`, `npx tsc -b`, `npx vitest run`, `PW_CANAL=chrome npx playwright test`) e `design-system` (`npm run build`, `npm run lint`, `npx tsc -b`, `npm test`, `npm run contrast`). Lighthouse acessibilidade ≥ 95 com a janela aberta (claro e escuro) em `/inicio` e `/jornadas/nova`.
- [ ] **Step 5:** `git grep -n "SCUA_IA_CHAVE=" -- . ':!*.example' ':!docs' ':!CLAUDE.md'` sem resultado com valor; `git status` sem `.env.local`.
- [ ] **Step 6:** **Teste ao vivo com a chave** (quando o responsável avisar que colocou em `app/.env.local`): reiniciar o servidor, `curl -s localhost:5173/api/assistente/estado` → `ativo: true`; no navegador repetir os roteiros 1–4 do Step 1 sem o modo simulado. Registrar no relatório final qual provedor foi testado ao vivo e quais não. Se a chave ainda não tiver chegado, a entrega fica marcada "não testada ao vivo" neste item.
- [ ] **Step 7:** Revisão final de código (subagente no modelo mais capaz), correção de críticos e importantes com teste, mostrar ao responsável e commit `Assistente: ponta a ponta, contrato e documentação`.
