/**
 * Catálogo dos relatórios: nome, endereço e tema. É a fonte única para o menu, a busca de telas,
 * a página "Relatórios" e as rotas. Cada relatório tem um arquivo em `relatorios/<slug>.tsx` com a
 * configuração do modelo único (filtros, KPIs, colunas).
 *
 * Decisões (analise-sistema/inventario-relatorios.md):
 * - "Estações" e "Estações inativas" viraram um só, com o filtro "Situação" (fusão comprovada).
 * - As demais fusões dependem de resposta da Scua (perguntas 46, 47 e 49) e ficaram separadas.
 * - O nome do menu é igual ao título da tela, e o glossário é único: "Estação" (não "Máquina"),
 *   "Extensão de jornada" (não "Hora extra"), "Batidas de ponto" (não "REP"), "Gestor" (não "Manager").
 */

export type TemaRelatorio = 'acesso' | 'bloqueios' | 'jornada' | 'estacoes';

export interface Tema { id: TemaRelatorio; titulo: string; pergunta: string }

export const TEMAS: Tema[] = [
  { id: 'acesso', titulo: 'Acesso', pergunta: 'Quem entrou, quando e de onde?' },
  { id: 'bloqueios', titulo: 'Bloqueios e liberações', pergunta: 'Quem foi bloqueado, quem liberou e por quê?' },
  { id: 'jornada', titulo: 'Jornada e horas', pergunta: 'A jornada está sendo cumprida? Quanto de extensão?' },
  { id: 'estacoes', titulo: 'Estações', pergunta: 'Quais estações têm o agente e estão ativas?' },
];

export interface ItemRelatorio {
  slug: string;
  titulo: string;
  tema: TemaRelatorio;
  /** Uma frase sobre o que o relatório responde (aparece na página "Relatórios" e na busca). */
  resumo: string;
}

export const RELATORIOS: ItemRelatorio[] = [
  { slug: 'logon-e-logoff', titulo: 'Logon e logoff', tema: 'acesso', resumo: 'Primeiro logon e último logoff de cada pessoa, por dia.' },
  { slug: 'ultimo-login', titulo: 'Último login por usuário', tema: 'acesso', resumo: 'Quando e em qual estação cada pessoa entrou pela última vez.' },
  { slug: 'ultimo-ip', titulo: 'Último IP por usuário', tema: 'acesso', resumo: 'Último endereço IP e localidade de cada pessoa.' },

  { slug: 'eventos-de-acesso', titulo: 'Eventos de acesso', tema: 'bloqueios', resumo: 'Todos os eventos de logon, um a um.' },
  { slug: 'liberacoes-e-bloqueios', titulo: 'Liberações e bloqueios', tema: 'bloqueios', resumo: 'Cada liberação e cada bloqueio, com o motivo.' },
  { slug: 'liberacoes-por-area', titulo: 'Liberações por área', tema: 'bloqueios', resumo: 'Quantas liberações cada área teve no período.' },
  { slug: 'liberacoes-por-gestor', titulo: 'Liberações por gestor', tema: 'bloqueios', resumo: 'Quantas liberações a equipe de cada gestor teve.' },
  { slug: 'tempo-de-bloqueio', titulo: 'Tempo de bloqueio', tema: 'bloqueios', resumo: 'Quanto tempo cada pessoa ficou bloqueada até ser liberada.' },
  { slug: 'ranking-de-excecoes', titulo: 'Ranking de exceções', tema: 'bloqueios', resumo: 'Quem mais teve exceções de jornada no período.' },
  { slug: 'tentativas-fora-da-jornada', titulo: 'Tentativas de acesso fora da jornada', tema: 'bloqueios', resumo: 'Quem tentou entrar fora do horário, e quando.' },

  { slug: 'extensoes-de-jornada', titulo: 'Extensões de jornada', tema: 'jornada', resumo: 'Pedidos de extensão com solicitante, período, status e justificativa.' },
  { slug: 'ultimo-controle', titulo: 'Último controle por usuário', tema: 'jornada', resumo: 'Há quantos dias cada pessoa teve o último evento de controle.' },
  { slug: 'jornada-e-controle', titulo: 'Jornada e controle', tema: 'jornada', resumo: 'Jornada de cada pessoa e se ela está sendo controlada.' },
  { slug: 'batidas-de-ponto', titulo: 'Batidas de ponto', tema: 'jornada', resumo: 'Batidas registradas e as que foram consideradas.' },
  { slug: 'produtividade', titulo: 'Produtividade', tema: 'jornada', resumo: 'Tempo produtivo e ocioso por pessoa no período.' },
  { slug: 'acompanhamento-de-jornada', titulo: 'Acompanhamento de jornada', tema: 'jornada', resumo: 'Médias diárias de tempo produtivo e ocioso e a eficiência geral.' },

  { slug: 'estacoes', titulo: 'Estações', tema: 'estacoes', resumo: 'Estações com o agente instalado, ativas e inativas.' },
];

export const temaDe = (id: TemaRelatorio): Tema => TEMAS.find((t) => t.id === id)!;
export const relatorioPorSlug = (slug: string | undefined): ItemRelatorio | undefined => RELATORIOS.find((r) => r.slug === slug);
