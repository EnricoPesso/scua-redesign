# Assistente de IA do Scua Logon: design

Data: 18/11/2026 · Branch: `redesign/completo` · Status: aguardando aprovação

## 1. Intenção e porquê

O Scua Logon tem muito trabalho braçal: montar uma jornada de trabalho dia por dia e horário por horário, preencher cadastros, ler relatórios grandes para achar o que importa. A única automação hoje é a **Carga de dados** (importar planilha), que o responsável considera ruim para o dia a dia.

A proposta é um **assistente de IA** presente em todas as telas. A pessoa pede em português comum e ele faz: preenche formulários, analisa relatórios, tira dúvidas sobre o sistema e leva até a tela certa. É uma automação mais prática que a planilha.

**A Carga de dados continua como está.** Esta entrega só acrescenta.

## 2. Decisões do responsável

| Tema | Decisão |
|---|---|
| Papel | Assistente completo, não só um preenchedor de formulário. Preenche, analisa relatórios, responde dúvidas e faz tarefas. |
| Escopo | Só assuntos do Scua Logon. Qualquer coisa fora do sistema é recusada com educação. |
| Limites | Só faz o que a **pessoa logada** já pode fazer (mesmas permissões). |
| Preenchimento | O robô preenche e **mostra o que fez**; a pessoa confere e clica em Salvar. Quem quiser pode ligar a **aprovação automática** (o robô salva sozinho). |
| Aparência | **Bolha flutuante no canto inferior direito** (opção B dos esboços). Clicar abre uma janelinha de conversa por cima da tela. Nos formulários aparece também o atalho "Preencher com IA". |
| Chave da IA | A empresa cliente pode usar a **própria chave** (Claude, ChatGPT ou Gemini) **ou a chave da Scua**. Usar a da Scua provavelmente custa mais; o preço é decisão da Scua. |
| Primeira versão | Conversa com uma **IA de verdade**, usando uma chave de teste que o responsável coloca em `app/.env.local`. |
| Modelos | Leves para o dia a dia (Haiku 5.5, linha Flash do Gemini, linha mini do ChatGPT), com um segundo modelo opcional para análises. |
| Carga de dados | Fica no sistema, sem nenhuma mudança. |
| Pedido fora do formulário | Se a pessoa pede um cadastro estando em outra tela (ex.: no Início, "cria uma jornada…"), o robô **abre a tela do formulário sozinho e já preenche**, sem a pessoa repetir o pedido. |

## 3. Objetivos, não objetivos e o que seria um fracasso

**Objetivos**
1. Cadastrar uma jornada por texto ("seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H") em menos de um minuto, conferindo antes de salvar.
2. Pedir "analisa esse relatório" num relatório aberto e receber um resumo útil: números principais, destaques e pontos de atenção, citando os dados.
3. Tirar dúvidas de uso ("como aprovo uma extensão?") e ir até a tela certa ("me leva para Ausências de ontem").
4. Funcionar com qualquer um dos três provedores, escolhido por configuração.

**Não objetivos (nesta versão)**
- Excluir registros pelo robô.
- Tarefas em lote ("aprova todos os pedidos da semana").
- Memória de conversas entre sessões.
- Voz, anexos e upload de planilha pela conversa (para isso continua a Carga de dados).
- Cobrança e controle de custo por cliente. Ficam com a Scua.

**Seria um fracasso, mesmo funcionando:**
- A chave de API chegar ao navegador, aparecer no código ou ir para o git.
- O robô fazer ou mostrar algo que a pessoa não tem permissão para ver ou fazer.
- O robô salvar algo sem a pessoa ter ligado a aprovação automática, ou excluir qualquer coisa.
- O robô inventar dados ("a Ana fez 12h extras") que não estão no que ele recebeu.
- Os testes automáticos dependerem de internet ou gastarem a chave.
- Dados pessoais (nomes, horários) irem para a IA sem a empresa saber. Ver o item 9.

## 4. Como a pessoa usa

### 4.1 A bolha e a janelinha
- Um botão redondo com o ícone de robô fica **fixo no canto inferior direito** de todas as telas do sistema (dentro do `AppShell`). Ele tem nome acessível ("Assistente Scua").
- Clicar abre uma **janelinha de conversa** ancorada no canto, por cima da tela, sem tapar o conteúdo inteiro. No **celular**, ela ocupa a tela toda.
- **Conteúdo da janelinha:**
  - título "Assistente Scua";
  - aviso curto de que as respostas são geradas por IA e podem errar;
  - histórico da conversa;
  - campo de texto com o botão Enviar;
  - botão para limpar a conversa.
- **Os avisos (toasts) passam a ficar acima da bolha**, já que hoje também ficam no canto inferior direito.
- **Teclado:** Esc fecha a janelinha e devolve o foco à bolha. Ao abrir, o foco vai para o campo de texto.
- A conversa **continua quando a pessoa troca de tela** e é apagada ao recarregar ou sair. Não fica guardada.
- **Estados da janelinha:**
  - **Pensando:** indicador visível e anunciado para leitor de tela.
  - **Erro:** "Não consegui responder agora", com o botão Tentar de novo.
  - **Assistente desligado:** se o administrador desligou, a bolha não aparece.

### 4.2 Preencher formulários
- **Pedido feito em outra tela:** se não houver formulário aberto e o pedido for de cadastro ("cria uma jornada seg a sex 8 às 17"), o robô navega até o formulário certo (ex.: `/jornadas/nova`) e, quando a tela nova registrar o alvo, **continua o mesmo pedido sozinho** e preenche. A pessoa não repete nada. Se a tela não abrir ou a pessoa não puder cadastrar ali, o robô explica e não preenche.
- Nos formulários aparece o botão **"Preencher com IA"** (ícone de robô), que abre a janelinha já ligada àquele formulário. Pedir pela bolha com o formulário aberto tem o mesmo efeito.
- O robô devolve **valores para os campos**, e o app os coloca no formulário. Os campos preenchidos pelo robô ficam **destacados até a pessoa mexer neles**.
- Na conversa, ele resume o que fez ("Preenchi segunda a sexta, 08:00–17:00, intervalo 12:00–13:00, nome ADM-8H. Sábado e domingo ficaram de folga.") e diz o que não conseguiu preencher ou ficou em dúvida.
- **A validação do formulário continua valendo.** Se o robô preencher algo inválido, a pessoa vê o erro normal do campo.
- **Sem aprovação automática:** quem salva é a pessoa, pelo botão Salvar normal.
- **Com aprovação automática:**
  - o app salva logo depois de preencher, desde que a validação passe;
  - o robô avisa "Salvei a jornada ADM-8H";
  - se a validação falhar, não salva, e mostra o problema.
- **Formulários da primeira versão:**
  1. Jornada de trabalho (nova e editar): `features/jornadas/components/FormularioJornada.tsx`. Os campos são identificador, descrição, tipo, ativa, padrão, libera regra, informativa e semana com entrada, saída e intervalo de cada dia.
  2. Todos os formulários do modelo único de cadastro (`componentes/cadastro/ModeloCadastro.tsx`): Pausas, Liberações por diretoria e as configurações. Como os campos já são descritos pela configuração, um encaixe só cobre todos.
  3. Usuários › Dados, se couber no plano. Senão, fica para depois (decisão do construtor).

### 4.3 Analisar relatórios
- Com um relatório aberto e filtrado, a pessoa pede "analisa esse relatório" ou faz perguntas ("quem mais ficou bloqueado?").
- O robô recebe o **título, os filtros aplicados, os indicadores e as linhas carregadas** do relatório aberto. Se forem muitas linhas, recebe um resumo calculado pelo app mais uma amostra (o limite fica com o construtor).
- **A resposta traz:**
  - um resumo em poucas linhas;
  - destaques com números;
  - pontos de atenção.
  Tudo citando só dados que recebeu. Se a pergunta exigir dados que ele não tem, ele diz isso e sugere o filtro.
- O mesmo vale para o painel do **Início** e da **Auditoria**, se couber no plano. O mínimo é o modelo de relatório.

### 4.4 Dúvidas e navegação
- **Dúvidas** sobre como usar o sistema são respondidas com base num texto de referência curto, mantido no código, que descreve as telas e as regras principais (extensões, ausências, jornadas, relatórios).
- **"Me leva para…"**: o robô devolve uma rota do sistema e o app navega. **Rotas permitidas:** as telas que aparecem na busca de telas da pessoa (`telasPara`, que já respeita as permissões e inclui telas internas como relatórios, configurações e "Nova jornada"), mais os parâmetros de filtro que cada tela já lê da URL (ex.: `/ausencias?de=…&ate=…`). Rota ou parâmetro fora dessa lista é recusado. *(decisão minha)*

### 4.5 Configurações (administrador)
Nova tela em **Configurações › Assistente de IA**, só para quem administra:
- **Liga e desliga** o assistente para a empresa.
- **De quem é a chave:** "Chave da Scua" ou "Chave própria" (escolhendo Claude, ChatGPT ou Gemini).
- **Permitir aprovação automática:** se estiver desligado aqui, ninguém consegue ligar.
- A tela **nunca mostra a chave inteira**, no máximo "termina em …abcd".
- **Nesta versão a tela é simulada:** ela não guarda nenhuma chave de verdade (ver 5.3).

**Por pessoa:** "Aprovação automática" é ligada ou desligada pela própria pessoa, na janelinha ou no menu dela. Fica guardada no navegador, como a preferência do Início.

## 5. Como é construído

### 5.1 Peças
```
Navegador (app)                         Servidor de desenvolvimento (Vite)          IA
───────────────                         ─────────────────────────────────           ──
Bolha + janelinha  ──POST /api/assistente──►  intermediário  ──HTTPS + chave──►  Claude / OpenAI / Gemini
  ▲  contexto da tela                         (lê SCUA_IA_* do .env.local)
  │  ferramentas permitidas                   não guarda nada
  └── ações devolvidas (preencher, navegar, responder) ◄──────────────────────────
```

1. **No navegador**, um provedor de contexto global guarda:
   - a conversa;
   - a tela atual: rota, título e permissões da pessoa;
   - o "alvo" registrado pela tela aberta: o formulário aberto (com a descrição dos campos e os valores atuais) ou o relatório aberto (com os dados).

   As telas se registram com um hook, por exemplo `useAlvoDoAssistente(...)`. O nome final fica com o construtor.
2. **O contrato `/api/assistente`** é o mesmo que o servidor real da Scua vai implementar.
   - **Entrada:** mensagens, contexto da tela e lista de ferramentas permitidas.
   - **Saída:** texto da resposta e uma lista de ações (`preencher`, `navegar`).

   Fica documentado em `docs/` como contrato com o back-end.
3. **O intermediário** é um plugin do Vite (`configureServer`). Ele só existe no servidor de desenvolvimento.
   - Lê `SCUA_IA_PROVEDOR`, `SCUA_IA_CHAVE`, `SCUA_IA_MODELO` e `SCUA_IA_MODELO_ANALISE` do `.env.local`, **sem prefixo `VITE_`**: assim o Vite nunca coloca esses valores no pacote do navegador.
   - Chama a API do provedor com `fetch`, **sem instalar SDK nem pacote novo** (a instalação de pacotes está bloqueada pela política JFrog).
   - Tem um adaptador por provedor (Anthropic, OpenAI, Gemini) que traduz o mesmo pedido para o formato de cada API, inclusive as "ferramentas" (tool use / function calling).
4. **Modo simulado:** sem chave configurada, e sempre nos testes, o app usa respostas prontas e determinísticas para os casos principais:
   - preencher a jornada do exemplo;
   - analisar um relatório;
   - responder uma dúvida;
   - navegar;
   - recusar um pedido fora do sistema.

   O modo simulado obedece ao mesmo contrato, então a tela não sabe se a resposta veio de uma IA real ou não.

### 5.2 Ferramentas que o robô pode usar
Em cada pedido, o app manda só as ferramentas que fazem sentido **e** que a pessoa tem permissão de usar:

| Ferramenta | Quando é oferecida | O que faz |
|---|---|---|
| `preencher_formulario(campos)` | Há um formulário aberto que a pessoa pode salvar | Devolve valores; o app aplica, valida e destaca |
| `navegar(rota)` | Sempre | O app confere se a rota é permitida e navega |
| `abrir_formulario(tipo)` | A pessoa pode cadastrar aquele tipo | Navega até o formulário de criação e deixa o pedido **pendente**; quando o formulário registra o alvo, o app reenvia o pedido com o novo contexto e o robô preenche |
| (só texto) | Sempre | Responder dúvida ou analisar o que foi enviado |

O que o robô **não** tem: excluir, aprovar ou reprovar pedidos, salvar fora de um formulário aberto, e ler dados de telas que não estão abertas. Toda ação devolvida é conferida de novo pelo app antes de aplicar: campo existe, rota permitida, permissão. A ação inválida é ignorada e o robô avisa.

### 5.3 A chave
- **Na primeira versão**, a chave fica só em `app/.env.local`. O `.gitignore` já ignora `*.local`. A chave nunca vai para o navegador, para o `localStorage`, para os logs nem para o git.
- **Não colar a chave na conversa com o assistente de código.** O responsável coloca a chave ele mesmo no arquivo.
- **No sistema real**, a chave de cada empresa (ou a da Scua) fica no servidor da Scua, e o app só chama `/api/assistente`. A tela de Configurações apenas envia a chave nova ao servidor, que não a devolve.
- **`npm run build` / `preview`** não têm o intermediário. Sem servidor, o app cai no modo simulado e avisa isso na janelinha.

### 5.4 Instruções fixas para o robô
O robô recebe uma instrução fixa:
- é o assistente do Scua Logon, responde em português do Brasil e recusa o que estiver fora do sistema;
- nunca inventa dados: só usa o que recebeu no contexto;
- deixa claro quando está em dúvida;
- para preencher, usa só a ferramenta e não descreve valores que não aplicou.

O texto fica num arquivo próprio, revisável.

### 5.5 Auditoria
- Toda gravação feita com o robô (com ou sem aprovação automática) registra quem pediu e que foi "via assistente".
- **Hoje a Auditoria só exibe dados de exemplo** e não há função para registrar ações. Esta entrega cria o registro nos dados simulados, para Jornadas e para os cadastros. Na Auditoria, os registros mostram a etiqueta "Assistente".
- O formato vira um pedido para a API real (ver item 9).

## 6. Restrições
- Stack existente: React 19, Vite, TypeScript, Tailwind 4, React Router 7, TanStack Query e o design system em `design-system/`. **Nenhuma dependência nova.**
- Só tokens de cor do design system, nos temas claro e escuro, e a identidade laranja da Scua.
- Critérios de pronto do `CLAUDE.md`, seção 3:
  - 3 tamanhos de tela, sem erro no console, teclado, WCAG AA e Lighthouse a11y ≥ 95;
  - build, lint, tipos e testes passando, incluindo e2e sem chave (modo simulado).
- O app hoje roda com dados simulados (`app/src/mock/`). O assistente não pode quebrar o modo `dev:mock` nem os testes.
- Commits só locais. Abrir o app no navegador para o responsável ver antes de cada commit.

## 7. Como saber que deu certo
- **Com a chave de teste**, no navegador:
  - cadastrar a jornada do exemplo por texto, conferir e salvar;
  - pedir a análise de "Tempo de bloqueio" e receber números que batem com a tela;
  - pedir algo fora do sistema e ser recusado;
  - entrar como a Olga (`?como=olga`) e confirmar que o robô não oferece o que ela não pode fazer.
- **Sem chave**, o mesmo roteiro funciona no modo simulado, e é assim que rodam os testes automáticos:
  - preencher;
  - aprovação automática;
  - não salvar o que é inválido;
  - não navegar para tela proibida;
  - foco e Esc;
  - celular.

## 8. Decisões que deixei para o construtor
- Nome dos hooks e componentes e a estrutura de pastas (sugestão: `app/src/features/assistente/`).
- Limite de linhas de relatório enviadas e a forma do resumo calculado.
- Se Usuários › Dados entra nesta versão.
- O formato exato das mensagens do contrato `/api/assistente`, desde que seja igual para os três provedores e o documento do contrato fique em `docs/`.
- Respostas por streaming (o texto aparecendo aos poucos) ou de uma vez. **Minha preferência é de uma vez**, que é mais simples. Streaming fica como melhoria.

## 8.1 Decisões que tomei depois da revisão do construtor
- **LGPD nesta versão:** os dados do app são todos fictícios. A janelinha e a tela Configurações › Assistente de IA mostram o aviso "O conteúdo da conversa e os dados da tela aberta são enviados ao provedor de IA configurado." Trocar nomes por apelidos fica fora desta versão e depende da resposta da Scua (item 9.2). *(decisão minha)*
- **Três provedores, uma chave:** só o provedor da chave de teste é verificado com chamada real. Os outros dois adaptadores são verificados por testes de tradução de pedido e resposta, e o relatório final os marca como "não testados ao vivo". *(decisão minha)*
- **Proxy da rede:** a conexão é testada quando a chave chegar. Se houver proxy corporativo, a configuração é tratada nesse momento, sem pacote novo. *(decisão minha)*
- **Testes nunca usam a chave:** o e2e e os testes de unidade forçam o modo simulado, mesmo com `.env.local` presente (variável própria de teste e servidor do Playwright sem reaproveitar um servidor com chave). *(decisão minha)*
- **Modelo de análise:** é usado quando o pedido envia dados de relatório ou painel; o resto usa o modelo padrão. *(decisão minha)*

## 9. Perguntas para a Scua (a acrescentar em `perguntas-para-scua.md`)
1. **Preço:** quanto custa para o cliente usar a chave da Scua? Por uso, pacote ou incluso no plano?
2. **Dados pessoais (LGPD):** a Scua aceita enviar nomes, horários e ausências de funcionários para um provedor de IA externo? O contrato com os clientes precisa citar isso? Há algum provedor exigido ou proibido?
3. **Onde a chave fica:** o back-end da Scua vai guardar a chave de cada cliente? Com que criptografia?
4. **Auditoria:** a API real aceita a marcação "via assistente" nos registros?
5. **Limites:** precisa de limite de uso por empresa ou por pessoa (para controlar custo)?

## 10. Calls que fiz sem perguntar (para você conferir)
- **A bolha fica no canto inferior direito e os avisos (toasts) sobem para cima dela.**
- **A conversa não fica guardada:** apaga ao recarregar ou sair.
- **Aprovação automática:** é ligada por pessoa, mas o administrador pode proibir. Nunca vale para excluir.
- **Primeira versão de preenchimento:** Jornadas mais todos os cadastros do modelo único. Usuários fica opcional.
- **Configurações › Assistente de IA:** é uma tela simulada nesta versão, sem guardar chave.
- **Modelos:** dois modelos configuráveis, um padrão e um opcional para análises.
- **Auditoria:** o registro "via assistente" é criado nos dados simulados.
