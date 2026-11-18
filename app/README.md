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
| Dia a dia | `/inicio` (painel), `/extensoes` (pedir, aprovar, lote), `/ausencias` (linha do tempo e tabela) |
| Pessoas e jornadas | `/usuarios` (lista + painel com Dados, Feriados, Substituto, Exceções, Férias), `/jornadas`, `/pausas`, `/liberacoes-por-diretoria` |
| Análise | `/relatorios` (entrada por assunto) e `/relatorios/<slug>`: 17 relatórios no modelo único |
| Administração | `/configuracoes` e `/configuracoes/<slug>` (12 cadastros no modelo único), `/carga-de-dados`, `/auditoria`, `/sobre` |

O menu mostra só o que o perfil pode usar (`?como=ana` vê só Extensões; `?como=olga` vê o dia a dia e os relatórios; `?como=renata` também os cadastros de pessoas; o padrão, Carlos, vê tudo). **Ctrl K** abre a busca de telas, que acha qualquer relatório ou configuração pelo nome.

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
e2e/            Playwright: extensoes.spec.ts (critérios de aceite) e telas.spec.ts (todas as telas × 3 tamanhos)
```

- **Dados:** só Extensões de jornada tem contrato de API (provisório, simulado com MSW). As outras telas usam uma camada simulada em memória (`mock/`), isolada no `api.ts` de cada feature: quando a API real existir, só esse arquivo muda. As datas de exemplo acompanham o dia de hoje.
- **Dois modelos únicos:** relatório (`@/modelos/relatorio`, filtros → KPIs → tabela → Exportar CSV) e cadastro (`componentes/cadastro`, lista → painel de formulário → exclusão com confirmação; cartões no celular). Uma tela nova desses tipos é só uma configuração.
- Filtros, aba, página e painel aberto vivem na **URL**: todo estado da tela pode ser compartilhado por link.
- Nenhuma mensagem técnica chega ao usuário; os detalhes vão para o `console.error`. Se uma tela quebrar, o erro global mostra um texto amigável e o menu continua funcionando.
- O que o sistema de design ainda não tem foi criado na feature com o comentário `// pedir ao @PhLima07`.
- Guia de implementação das telas: [`docs/superpowers/plans/2026-11-17-redesign-completo.md`](../docs/superpowers/plans/2026-11-17-redesign-completo.md).

Spec: [`docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md`](../docs/superpowers/specs/2026-10-22-extensao-de-jornada-design.md) · Plano: [`docs/superpowers/plans/2026-10-22-extensao-de-jornada.md`](../docs/superpowers/plans/2026-10-22-extensao-de-jornada.md)
