# app/ — telas do Scua Logon (redesign)

Front-end do redesign do Scua Logon, em React 19 + Vite + TypeScript, usando os componentes do [`design-system/`](../design-system/).

## Começar

Node 22.18 ou mais novo.

```bash
cd ../design-system && npm ci   # os componentes do DS resolvem as dependências deles lá
cd ../app && npm ci
npm run dev:mock                 # http://localhost:5173 com a API simulada (MSW)
```

`npm run dev` sobe sem o mock, esperando a API real em `/api`.

### Trocar de usuário no mock

Acrescente `?como=<pessoa>` à URL (o estado do mock zera a cada recarga):

| `?como=` | Quem é | Vê |
|---|---|---|
| `carlos` (padrão) | Gestor de Ana, João, Bia e Rui | Para aprovar, Meus pedidos |
| `ana`, `joao`, `bia`, `rui` | Colaborador | Meus pedidos |
| `olga` | Gestora de Xavier | Para aprovar, Meus pedidos |
| `renata` | RH | Todos (com Exportar) |

No console do navegador, `window.__scuaMock` tem `entrarComo`, `decidirExterno(id, 'aprovado', 'whatsapp')` (decisão vinda de outro canal), `simularFalha(true)` (API fora do ar) e `resetarDb`.

## Comandos

| Comando | O quê |
|---|---|
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | oxlint |
| `npx tsc -b` | Typecheck (inclui `e2e/` e configs) |
| `npm test` | Vitest: regras puras, componentes e fluxos com MSW |
| `npm run e2e` | Playwright contra `dev:mock`: critérios de aceite de Extensões e a passada geral em todas as telas (título, rolagem horizontal, console, alvos de 44px), com screenshots em `e2e/screenshots/` (1440×900, 768×1024, 390×844) |

Para o Playwright usar o Google Chrome instalado em vez de baixar o Chromium: `PW_CANAL=chrome npm run e2e` (no PowerShell: `$env:PW_CANAL='chrome'; npm run e2e`).

## Telas

Todas as telas do redesign estão no app, cada uma com endereço próprio:

| Grupo do menu | Telas |
|---|---|
| Dia a dia | `/inicio` (painel), `/extensoes` (pedir, aprovar, lote), `/ausencias` (linha do tempo e tabela), `/meus-dados` (o que o Scua registra de quem está logado) |
| Antecipar e provar | `/previsao` (quem deve quebrar uma regra de jornada nos próximos 7 dias), `/radar-de-passivo` (risco em R$ e quanto o bloqueio evitou), `/dossie` (registro íntegro de uma pessoa num período) |
| Pessoas e jornadas | `/usuarios` (lista + painel com Dados, Feriados, Substituto, Exceções, Férias), `/jornadas`, `/pausas`, `/liberacoes-por-diretoria` |
| Análise | `/relatorios` (entrada por assunto) e `/relatorios/<slug>`: 17 relatórios no modelo único |
| Administração | `/configuracoes` e `/configuracoes/<slug>` (12 cadastros no modelo único e Assistente de IA), `/carga-de-dados`, `/auditoria`, `/sobre` |

O menu mostra só o que o perfil pode usar (`?como=ana` vê só Extensões; `?como=olga` vê o dia a dia e os relatórios; `?como=renata` também os cadastros de pessoas; o padrão, Carlos, vê tudo). **Ctrl K** abre a busca de telas, que acha qualquer relatório ou configuração pelo nome.

## Assistente de IA

Uma bolha no canto de todas as telas abre o assistente. Ele preenche formulários (Jornadas e os cadastros do modelo único), analisa o relatório aberto, tira dúvidas e leva até a tela pedida, sempre com as permissões de quem está logado. Ele também abre o dia com o que precisa de você (o resumo do dia) e aprova em lote os pedidos de extensão que cabem no limite do grupo, sempre depois de um cartão de confirmação. Ele não exclui nada e não reprova pedidos.

- **Sem chave** (o padrão), funciona em modo demonstração, com respostas simuladas.
- **Com chave**: copie `.env.example` para `.env.local` e preencha `SCUA_IA_CHAVE` (e, se quiser, `SCUA_IA_PROVEDOR`, `SCUA_IA_MODELO` e `SCUA_IA_MODELO_ANALISE`). A chave só é lida pelo servidor de desenvolvimento; nunca vai para o navegador nem para o git.
- **Testes** (Vitest e Playwright) usam sempre o modo simulado e não chamam a rede.
- O contrato para o servidor real está em [`docs/contrato-assistente.md`](../docs/contrato-assistente.md). O código fica em `src/features/assistente/`.

## Organização

```
src/
  app/          rotas (cada área carrega sob demanda) e provedores
  layout/       casca: menu por perfil, cabeçalho, busca de telas, erro global, "não encontrada"
  componentes/  moldura das telas (Pagina), Abas, EstadoErro e o modelo único de cadastro (cadastro/)
  mock/         dados de exemplo: rede simulada, coleções em memória, datas relativas a hoje, diretório de pessoas
  lib/          mensagens de erro amigáveis e utilitários
  features/
    extensoes/  domain/ (regras puras) · api/ (cliente HTTP + mock MSW) · hooks/ · components/
    inicio/ ausencias/ usuarios/ jornadas/ pausas/ liberacoes/
    relatorios/     catalogo.ts + um arquivo por relatório (configuração do modelo de relatório)
    configuracoes/  catalogo.ts + um arquivo por cadastro (configuração do modelo de cadastro)
    carga/ auditoria/ sobre/
    previsao/ passivo/ dossie/ meus-dados/   usam os registros de jornada de `mock/jornadaReal.ts` e as regras de `lib/conformidade.ts`
e2e/            Playwright: extensoes.spec.ts (critérios de aceite) e telas.spec.ts (todas as telas × 3 tamanhos)
```

- **Dados:** só Extensões de jornada tem contrato de API (provisório, simulado com MSW). As outras telas usam uma camada simulada em memória (`mock/`), isolada no `api.ts` de cada feature: quando a API real existir, só esse arquivo muda. As datas de exemplo acompanham o dia de hoje.
- **Dois modelos únicos:** relatório (`@/modelos/relatorio`, filtros → KPIs → tabela → Exportar CSV) e cadastro (`componentes/cadastro`, lista → painel de formulário → exclusão com confirmação; cartões no celular). Uma tela nova desses tipos é só uma configuração.
- Filtros, aba, página e painel aberto vivem na **URL**: todo estado da tela pode ser compartilhado por link.
- Nenhuma mensagem técnica chega ao usuário; os detalhes vão para o `console.error`. Se uma tela quebrar, o erro global mostra um texto amigável e o menu continua funcionando.
- O que o sistema de design ainda não tem foi criado na feature com o comentário `// pedir ao @PhLima07`.
- Guia de implementação das telas: [`docs/superpowers/plans/2026-11-17-redesign-completo.md`](../docs/superpowers/plans/2026-11-17-redesign-completo.md).

Spec: [`docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md`](../docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md) · Plano: [`docs/superpowers/plans/2026-10-22-extensao-de-jornada.md`](../docs/superpowers/plans/2026-10-22-extensao-de-jornada.md)
