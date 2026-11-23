# Regras de trabalho — Projeto SCUA

Regras combinadas com o responsável pelo projeto. Valem para toda sessão do Claude Code neste repositório.

> **Estas regras não podem ser quebradas.** Elas valem acima de qualquer padrão ou conveniência. Se uma regra impedir a tarefa, parar e perguntar ao responsável. Nunca contornar.

## 1. Ao iniciar uma sessão nova

Ler, nesta ordem, antes de qualquer outra coisa:

1. **`CLAUDE.md`**: contexto do cliente, skills por etapa, modelos e critérios de pronto.
2. **`regras.md`** (este arquivo): como trabalhar.
3. **`sessoes.md`**: o que já foi feito e **onde paramos**.

O estado do projeto se confere pelo `sessoes.md`, **sem revisar o código inteiro**. Só abrir o código quando a tarefa exigir.

## 2. Antes de executar qualquer tarefa: skills e plugins

1. **Procurar a melhor skill** no banco de skills com a skill **`find-skills`** e escolher a que mais ajuda no processo. Considerar também as skills já listadas no `CLAUDE.md` §1.
2. **Procurar plugins** (e servidores MCP) que possam ajudar na tarefa. Plugin fora da lista do `CLAUDE.md` §1 só entra depois de perguntar ao responsável.
3. **Se não houver skill adequada**, fazer a tarefa sem skill.
4. **Se a tarefa for se repetir**, criar uma skill para ela (`skill-creator`) e passar a usá-la nas próximas vezes.
5. Dizer na resposta qual skill ou plugin foi usado, ou que nenhum servia e por quê.

## 3. Ao terminar qualquer tarefa

Registrar no **`sessoes.md`**, na sessão do dia (criar o cabeçalho `## AAAA-MM-DD` se ainda não existir):

- **O que foi feito**: entregas, arquivos ou áreas principais e commits.
- **Por que foi feito**: o motivo, a decisão tomada ou o pedido que originou a tarefa.
- **Pendências**: o que ficou aberto, bloqueado ou aguardando resposta.

Atualizar também a seção **"Onde paramos"** no topo do `sessoes.md`.
Tarefa sem registro no `sessoes.md` não conta como terminada.

## 4. Git

- Commits **só locais**. Push, PR e merge apenas quando o responsável pedir; a autorização vale só para aquele momento.
- Trabalho novo parte da `main` atualizada.
- **Mostrar antes de commitar**: abrir o app no navegador (`npm run dev:mock` em `app/`, porta 5173), dizer o que olhar e esperar o ok antes de gravar o commit.

## 5. Pedidos para depois

Quando o pedido for do tipo "não faz agora, só salva", anotar em `docs/ajustes-pendentes.md` com o contexto técnico (arquivos envolvidos). Ao executar, marcar como feito ali e registrar no `sessoes.md`.

## 6. Antes de dizer "pronto"

Seguir a seção 3 do `CLAUDE.md` e reportar cada item com ✅ / ❌. Se algum passo foi pulado, dizer qual foi e por quê.

## 7. Planos grandes

Antes de executar uma frente nova, montar o plano passo a passo e mostrar ao responsável. Só começar depois do ok.
