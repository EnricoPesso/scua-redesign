# UserLock (IS Decisions, França)

## O que é (2 linhas)
Software de controle de acesso para Active Directory/Windows que restringe horários de logon, encerra sessões fora da janela e limita cota de tempo conectado. É vendido no Brasil pela Symmetry (distribuidora oficial), que o posiciona como controle de jornada que complementa o ponto. [1][2][6]

## Features (lista)

**Bloqueio/controle**
- Restrição de horário por usuário, grupo ou OU: janelas "Autorizado" ou "Negado", por tipo de sessão (estação, terminal, Wi-Fi, VPN, IIS, SaaS, UAC). [3][4]
- Ação ao estourar o horário: não fazer nada, forçar logoff ou bloquear a sessão (menos disruptivo). [3]
- Aviso configurável antes do logoff (padrão 1 minuto). [3]
- Cota de tempo conectado por dia, semana ou mês, com várias cotas por política; duração máxima de sessão; tempo máximo bloqueado; logoff por ociosidade. [3][5]
- Restrições por simultaneidade e origem (estação, IP, OU, país); avalia horário pelo relógio da máquina cliente ou do servidor. [4][7]
- Segundo a Symmetry: bloqueio em feriados/férias, exceções temporárias para plantões, vale em home office, VPN e RDP. [1]

**Aprovações**
- Não há fluxo de pedido/aprovação de hora extra descrito; exceções são feitas pelo administrador (não confirmado em páginas de produto). [1][3]

**Painéis e relatórios**
- Dashboard por usuário, máquina, grupo e OU; relatórios ao vivo e históricos, com tempo ativo x tela bloqueada; views personalizáveis e salvas; agendador de relatórios e envio por link seguro; exportação em PDF. [2][4][6]

**Alertas**
- Política de "Alerts & notifications" existe (mensagem de boas-vindas com cota restante); detalhes dos alertas não confirmados. [5][4]

**Integrações**
- MFA (Windows, VPN, RDP, IIS, SaaS), SSO com AD e Microsoft 365, OIDC (Zoom, OpenAI, Snowflake pré-configurados), PowerShell e API. [6][7][9]

**Mobile**
- Não descrito (não confirmado).

**Conformidade legal**
- Logs de sessão e painel de ações de administradores em tempo real; no Brasil, usado como prova de controle de jornada (argumento do revendedor). [1][6]

**Outros**
- Painel traduzido, incluindo português, a partir da versão 13.1. [7]

## Novidades 2025–2026
- UserLock 13.0: lançado em 29/10/2025 (changelog) e anunciado em 03/12/2025: novo layout, páginas de AD, dashboards por entidade, assistente de políticas, painel de ações de admin, views personalizáveis, mais relatórios, autenticação por certificado, UserLock Anywhere Cloud (beta, relay hospedado). [8][9]
- UserLock 13.1: 12/11/2026: FIDO2, controle de sessões UAC, SSO OIDC, clonar políticas, busca global, exportar PDF, SQLite como banco padrão, idiomas alemão, holandês, português e árabe. [7]

## Uso de IA
- Não mencionado. [6][7]

## Preço (se público)
- Assinatura sem valores na página oficial (orçamento sob consulta). Teste de 30 dias, usuários ilimitados. Listagens de terceiros indicam cerca de US$ 2 por usuário/mês (não confirmado na página oficial). [10][6]

## O que chama atenção (features incomuns ou inovadoras)
- Cota de tempo conectado (diária/semanal/mensal) em vez de só janela de horário. [5]
- Bloquear (em vez de deslogar) para não perder trabalho não salvo. [3]
- Cobre UAC/elevação e SaaS na mesma política de horário. [3][7]
- Relatório que separa tempo ativo de tela bloqueada. [1]
- Gestão de políticas fora da LAN via relay em nuvem (beta). [9]

## Fontes (URLs)
1. https://symmetry.com.br/controle-de-jornada-de-trabalho/
2. https://www.isdecisions.com/products/userlock/restrict-user-logon-hours-force-logoff-windows-domain.htm
3. https://www.isdecisions.com/en/userlock/docs/reference/access-policies/time-restriction.md
4. https://www.isdecisions.com/en/userlock/help/console/server_administration/protected_accounts/time_restrictions.htm
5. https://www.isdecisions.com/en/userlock/help/Use-cases/assign-logon-time-quota.htm
6. https://www.isdecisions.com/products/userlock/pricing.htm
7. https://www.isdecisions.com/en/blog/news/userlock-release-notes
8. https://www.isdecisions.com/en/userlock/docs/support/changelog (citado em resultado de busca; página não aberta)
9. https://www.isdecisions.com/en/blog/news/is-decisions-userlock-simplifies-active-directory-iam
10. https://www.softwareadvice.com/identity-management/userlock-profile/ (citado em resultado de busca; página não aberta)
