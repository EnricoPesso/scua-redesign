/**
 * Catálogo das telas de Configurações (o antigo menu "Administrador"). Fonte única para a página
 * "Configurações", a busca de telas e as rotas. Cada tela tem um arquivo em `cadastros/<slug>.tsx`
 * com a configuração do modelo único de cadastro (colunas e campos).
 *
 * Todas ficam em /configuracoes/<slug> (no sistema atual, Justificativas e Feriados ficavam fora de /admin).
 */

export type AreaConfiguracao = 'jornada' | 'comunicacao' | 'sistema';

export const AREAS: { id: AreaConfiguracao; titulo: string }[] = [
  { id: 'jornada', titulo: 'Jornada' },
  { id: 'comunicacao', titulo: 'Mensagens e avisos' },
  { id: 'sistema', titulo: 'Sistema' },
];

export interface ItemConfiguracao {
  slug: string;
  titulo: string;
  area: AreaConfiguracao;
  resumo: string;
}

export const CONFIGURACOES: ItemConfiguracao[] = [
  { slug: 'tipos-de-jornada', titulo: 'Tipos de jornada', area: 'jornada', resumo: 'Categorias usadas para classificar as jornadas de trabalho.' },
  { slug: 'justificativas', titulo: 'Justificativas', area: 'jornada', resumo: 'Motivos que a pessoa escolhe ao pedir uma extensão de jornada.' },
  { slug: 'feriados', titulo: 'Feriados', area: 'jornada', resumo: 'Calendários de feriados e as datas de cada um.' },

  { slug: 'mensagens', titulo: 'Mensagens', area: 'comunicacao', resumo: 'Textos que aparecem para a pessoa na estação (bloqueio, aviso, liberação).' },
  { slug: 'mensagens-por-tempo', titulo: 'Mensagens por tempo', area: 'comunicacao', resumo: 'Avisos mostrados quando falta pouco para o fim da jornada.' },
  { slug: 'templates-whatsapp', titulo: 'Templates de WhatsApp', area: 'comunicacao', resumo: 'Modelos de mensagem aprovados na Meta para os avisos por WhatsApp.' },
  { slug: 'notificacoes', titulo: 'Notificações', area: 'comunicacao', resumo: 'Quais acontecimentos geram aviso, e por qual canal.' },
  { slug: 'notificacoes-de-recorrencia', titulo: 'Notificações de recorrência', area: 'comunicacao', resumo: 'Regras para avisar quando o mesmo evento se repete muitas vezes.' },

  { slug: 'dominios', titulo: 'Domínios', area: 'sistema', resumo: 'Domínios de rede sincronizados com o Scua Logon.' },
  { slug: 'grupos', titulo: 'Grupos', area: 'sistema', resumo: 'Grupos de usuários e o limite mensal de extensão de cada um.' },
  { slug: 'localidades-por-ip', titulo: 'Localidades por IP', area: 'sistema', resumo: 'De qual localidade é cada faixa de endereços IP.' },
  { slug: 'parametros', titulo: 'Parâmetros', area: 'sistema', resumo: 'Ajustes gerais de funcionamento do sistema.' },
];

export const configuracaoPorSlug = (slug: string | undefined): ItemConfiguracao | undefined => CONFIGURACOES.find((c) => c.slug === slug);
