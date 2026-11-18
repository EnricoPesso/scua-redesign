# Ajustes pendentes do redesign

Lista de alterações combinadas com o responsável pela revisão (bloco de notas de 2026-11-18), na **ordem de aplicação** combinada.
Ao terminar cada etapa: rodar testes e verificações, **mostrar no navegador antes do commit** e marcar como feito aqui.
Os números entre parênteses são os itens do bloco de notas.

## Ordem de aplicação

- [x] **1. Padrão das tabelas** (7, 9, 10)
  - Coluna de ações sempre a **última** (depois de Horário, Situação etc.), sem o texto "Ações" visível no cabeçalho (manter o nome só para leitor de tela, `sr-only`).
  - Primeiro no modelo de cadastro (`app/src/componentes/cadastro/ModeloCadastro.tsx`), o que cobre Pausas, Liberações por diretoria e as 12 configurações. Depois em Jornadas (`features/jornadas/components/TabelaJornadas.tsx`) e Usuários.

- [x] **2. Exportar para Excel** (3, 6, 8, 9, 12)
  - Um botão e uma função compartilhados (hoje o download está copiado em auditoria, carga e no modelo de relatório).
  - Telas: Ausências, Usuários, Jornadas de trabalho (item 8 confirmado), Pausas, Liberações por diretoria e todas as Configurações. Relatórios e Auditoria passam a usar o mesmo botão.
  - Formato: fica em **CSV** por enquanto (decidido em 18/11): não há JFrog, e o responsável vai perguntar à Scua se eles têm um. Se tiverem, instalar a biblioteca e trocar só `conteudoDaPlanilha` em `design-system/src/lib/planilha.ts` para gerar .xlsx.
  - Carga de dados continua com modelos em **CSV** (arquivo para importar em sistema).

- [x] **3. Menos rolagem** (4, 6)
  - Usuários: menos itens por página por padrão (ex.: 10), mantendo o seletor de quantidade.
  - Ausências: seletor de quantas pessoas mostrar, ao lado da navegação de dia.

- [x] **4. Barras de Ausências sem o nome dentro** (5)
  - A legenda já explica cada símbolo. Manter o passar do mouse e o foco mostrando motivo e horário.

- [x] **5. Logo da Scua** (1)
  - Arquivo: `app/src/assets/scua-logo.png` (191×50 px, recorte de tela com fundo transparente).
  - Hoje a marca é texto (quadrado laranja com "S" + "Scua Logon") em `app/src/layout/AppShell.tsx` (componente `Marca`): menu lateral, gaveta do celular e cabeçalho.
  - Trocar pelo logo com `alt="Scua"` e "Logon" ao lado em texto. No menu recolhido e no cabeçalho do celular, só o símbolo.
  - 191×50 fica borrado em tela de alta densidade: pedir o SVG à Scua (seção 9 de `perguntas-para-scua.md`).

- [x] **6. Modo claro/escuro** (15)
  - Botão no **cabeçalho**, que aparece em todas as telas (confirmado).
  - Valores escuros para todos os tokens semânticos do sistema de design, com a checagem de contraste (`npm run contrast` em `design-system/`). Conferir o logo nos dois fundos.
  - Fazer antes das etapas 7 a 9, para os painéis novos já nascerem nos dois temas.

- [ ] **7. Início: seletor de data** (2)
  - Manter o "resumo de hoje" e colocar ao lado um seletor com **atalhos** (Hoje, Ontem, Últimos 7 dias, Este mês) mais **"Escolher data"**, que abre o calendário (confirmado). Os indicadores passam a ser do período escolhido, e o período fica na URL.

- [ ] **8. Auditoria: painel com o panorama geral** (14)
  - Indicadores e gráficos **antes** das tabelas (ex.: alterações no período, por tipo de ação, quem mais alterou, área mais alterada, alterações por dia). As abas e tabelas atuais continuam abaixo.

- [ ] **9. Início personalizável** (16)
  - Ícone de caneta no Início para a pessoa escolher quais blocos aparecem no painel dela (e a ordem). Preferência guardada por pessoa.
  - Por último porque depende das etapas 6, 7 e 8.

- [x] **Extensão de jornada usa o limite do cadastro de Grupos** (combinado antes do bloco de notas)
  - Hoje o limite vem de uma tabela própria do mock de extensões (`app/src/features/extensoes/api/mocks/db.ts`, `LIMITE` e `GRUPO`), separada de **Configurações › Grupos** (`features/configuracoes/cadastros/grupos.tsx`, campo `limiteHoras`).
  - A barra de limite (formulário e detalhe do pedido) passa a ler o limite do grupo da pessoa no cadastro de Grupos. Limite vazio = "Sem limite de extensão"; sem dado, a seção some.
  - Feito no bloco A: grupos e vínculo pessoa → grupo em `app/src/mock/grupos.ts`; campo Grupo em Usuários › Dados.

Sem alteração: Relatórios (11) e Carga de dados (13).

## Aguardando a Scua

Perguntas 52 a 55 de `perguntas-para-scua.md` (bloqueio da estação, liberação automática ao aprovar, hora extra paga, "Libera regra"). As respostas podem mudar textos da Extensão de jornada, de Jornadas e de Usuários.
