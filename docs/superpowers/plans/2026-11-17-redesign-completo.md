# Redesign completo do Scua Logon — guia de implementação das telas

> Guia para quem implementa as telas que faltam (P2, P3 e P4 da `DIVISAO-DE-TAREFAS.md`). Leia inteiro antes de escrever código.
> Base: `analise-sistema/progresso.md` (telas atuais e os 24 problemas de UX), `analise-sistema/inventario-relatorios.md`, `CLAUDE.md` (critérios de pronto).

## 1. Onde as coisas ficam

Tudo em `app/` (React 19 + Vite + TypeScript + Tailwind 4 + React Router 7 + TanStack Query 5). Componentes visuais vêm de `design-system/src/components/ui/*` (import `@/components/ui/...`).

| Caminho (em `app/src/`) | O que é |
|---|---|
| `app/AppRoutes.tsx` | Rotas. Cada área é carregada sob demanda a partir de `features/<área>/routes.tsx` (**export default** de um componente com as rotas internas). **Não edite**: o endereço e a permissão de cada área já estão lá |
| `layout/` | Casca (menu, cabeçalho, busca de telas, erro global). **Não edite** |
| `componentes/Pagina.tsx` | Moldura de toda tela: `<Pagina titulo trilha descricao acoes>`. Renderiza o `<main>`, o `<h1>` e define o título da aba |
| `componentes/Abas.tsx` | Abas acessíveis: `<Abas rotulo abas ativa aoMudar>conteúdo</Abas>` |
| `componentes/EstadoErro.tsx` | Falha ao carregar: `<EstadoErro erro aoTentar />` |
| `componentes/cadastro/` | **Modelo único de cadastro** (`ModeloCadastro` + `ConfigCadastro`): lista, busca, formulário em painel, confirmação de exclusão e todos os estados. Uma tela de cadastro simples é só uma configuração |
| `mock/rede.ts` | `rede(() => valor)` simula uma chamada (atraso + falha simulada). `redeCancelavel(fn, signal)` para o `buscar` dos relatórios |
| `mock/colecao.ts` | `criarColecao(prefixo, () => semente, validar?)` → `listar/obter/criar/editar/excluir/resetar`. `ErroDeValidacao` leva texto pronto para a tela |
| `mock/datas.ts` | `hoje()`, `dia(n)`, `quando(n, 'HH:MM')`, `somarDias`. **Toda data de exemplo é relativa a hoje** |
| `mock/diretorio.ts` | 24 pessoas (`PESSOAS_DIRETORIO`), gestores, diretorias, estações e as opções prontas para filtros. **Use sempre estes nomes** |
| `lib/mensagens.ts` | `mensagemDeErro(erro, 'carregar' | 'salvar' | 'excluir' | 'enviar')` |
| `features/extensoes/` | Feature pronta. Serve de **referência de qualidade** (testes, estados, celular). Não edite |
| `features/relatorios/catalogo.ts`, `features/configuracoes/catalogo.ts` | Nome, endereço e grupo de cada relatório e de cada tela de configuração. **Os slugs e títulos são contrato: não mude** |

Modelo de relatório (já existe, da P4): `@/modelos/relatorio` → `ModeloRelatorio`, `ConfigRelatorio`, `FiltroDef` (`design-system/src/modelos/relatorio/`, com exemplos em `design-system/src/prototipos/`).

## 2. Dados

Estas telas ainda **não têm contrato de API** com a Scua. Cada feature tem um `api.ts` com funções assíncronas sobre dados em memória (`rede`, `criarColecao`); quando a API real existir, só esse arquivo muda. Não use `fetch` nem MSW nas telas novas.

- Semente sempre como **função** (`() => [...]`), com datas de `mock/datas.ts`. Nunca escreva uma data fixa.
- Pessoas, gestores, diretorias e estações vêm de `mock/diretorio.ts`.
- Dados plausíveis e em quantidade suficiente para a tela parecer real (paginação aparecendo onde faz sentido), mas a tela precisa ter estado vazio de verdade quando o filtro não acha nada.
- Leituras com TanStack Query (`useQuery`), escritas com `useMutation` + `invalidateQueries`.

## 3. Regras que valem para toda tela (critérios de pronto)

**Texto**
- Português do Brasil com acentos. **Nenhuma mensagem técnica** chega à pessoa (nem código `EVT_*`, nem SID, nem stack): traduza para texto amigável. Detalhe técnico só no `console.error`.
- Glossário único: **Estação** (não "máquina" nem "workstation"), **Extensão de jornada** (não "hora extra"), **Batidas de ponto** (não "REP"), **Gestor** (não "manager" nem "gerente"), **Usuário** para a conta e **pessoa/colaborador** no texto corrido.
- Mensagens neutras em gênero: "Ana Souza vai receber o aviso".
- Título da tela = nome no menu. Botão de criar sempre **"Adicionar <coisa>"**. Exportar sempre **"Exportar CSV"**.
- Sem travessão (—) em texto de interface para separar orações; use ponto ou vírgula. (O travessão só aparece como "valor vazio" em tabela.)

**Visual**
- Só tokens do sistema de design: `var(--color-*)` e as classes semânticas (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`…). **Nenhuma cor fora dos tokens**, sem `dark:`.
- Status sempre com **texto + cor** (`Badge` com `status`), nunca só cor ou só ícone (nada de ✓/✗ soltos: use "Sim"/"Não").
- Sem rolagem horizontal da página em 390×844, 768×1024 e 1440×900. Tabela larga rola **dentro** do próprio contêiner (o `DataTable` já faz isso).
- No celular (< 768px) todo alvo de toque tem **≥ 44px** (`max-md:h-11` em botões e campos).

**Estados** (todos, quando se aplicam): carregando (esqueleto, nunca tela em branco), vazio (com orientação e ação), vazio por filtro (com "Limpar filtros"), erro ao carregar (`EstadoErro` + "Tentar de novo"), erro ao salvar (aviso com foco, dados preservados), sucesso (toast), desabilitado.

**Comportamento**
- Cada tela, aba e painel aberto tem **endereço próprio** (rota ou parâmetro na URL). Nada de estado importante só na memória.
- Paginação em português; o tamanho da página **nunca muda sozinho**.
- Excluir **sempre** pede confirmação (`ConfirmDialog` destrutivo). Nada de lixeira que apaga direto.
- Tudo funciona pelo teclado, com foco visível. Campo com rótulo, botão de ícone com `aria-label`, imagem com `alt`.
- Ao abrir, a tela já mostra dados ou um estado vazio que explica o que fazer. Nunca uma tabela vazia sem explicação.

**Código**
- Não instale pacotes. Não mexa em `package.json`, configs, `layout/`, `app/`, `componentes/`, `mock/`, `lib/` nem em outra feature. Se faltar algo no que é compartilhado, **anote no relatório final** em vez de editar.
- O que o sistema de design não tem e você precisar criar fica dentro da sua feature, com o comentário `// pedir ao @PhLima07: <o quê>`.
- Regras de negócio em funções puras (`domain/*.ts`) com teste de unidade; telas com teste de componente (Testing Library) cobrindo o fluxo principal e os estados de vazio e erro. Veja `features/extensoes/components/*.test.tsx` e `src/test/render.tsx` (`renderApp('/rota')` monta o app inteiro; o usuário padrão do mock é Carlos Mendes, que vê tudo; `entrarComo('ana')` troca).
- Nos testes, chame `colecao.resetar()` no `afterEach` de quem alterou dados. O relógio dos testes é fixo em 12/10/2026 10:00.
- Comentários em português, só onde o porquê não é óbvio.

## 4. Como verificar antes de entregar

Dentro de `app/`:

```bash
npx tsc -b                                   # sem erros
npm run lint                                 # sem erros
npx vitest run src/features/<sua-área>       # seus testes passando
```

Não rode `git add`, `git commit` nem `npm install`. Não suba servidor de desenvolvimento (outras pessoas estão usando as portas).

## 5. O que entregar no relatório final

1. Arquivos criados.
2. Resultado dos três comandos acima (com os números).
3. Decisões que você tomou onde este guia e a análise não diziam o que fazer.
4. O que faltou ou ficou diferente do pedido, e por quê.
5. Qualquer coisa que precise mudar no código compartilhado.
