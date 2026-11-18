import type { ConfigRelatorio } from '@/modelos/relatorio';

/** A configuração de cada relatório, carregada só quando ele é aberto (a página de entrada fica leve). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConfigQualquer = ConfigRelatorio<any>;

export const CARREGADORES: Record<string, () => Promise<{ default: ConfigQualquer }>> = {
  'logon-e-logoff': () => import('./relatorios/logon-e-logoff'),
  'ultimo-login': () => import('./relatorios/ultimo-login'),
  'ultimo-ip': () => import('./relatorios/ultimo-ip'),
  'eventos-de-acesso': () => import('./relatorios/eventos-de-acesso'),
  'liberacoes-e-bloqueios': () => import('./relatorios/liberacoes-e-bloqueios'),
  'liberacoes-por-area': () => import('./relatorios/liberacoes-por-area'),
  'liberacoes-por-gestor': () => import('./relatorios/liberacoes-por-gestor'),
  'tempo-de-bloqueio': () => import('./relatorios/tempo-de-bloqueio'),
  'ranking-de-excecoes': () => import('./relatorios/ranking-de-excecoes'),
  'tentativas-fora-da-jornada': () => import('./relatorios/tentativas-fora-da-jornada'),
  'extensoes-de-jornada': () => import('./relatorios/extensoes-de-jornada'),
  'ultimo-controle': () => import('./relatorios/ultimo-controle'),
  'jornada-e-controle': () => import('./relatorios/jornada-e-controle'),
  'batidas-de-ponto': () => import('./relatorios/batidas-de-ponto'),
  produtividade: () => import('./relatorios/produtividade'),
  'acompanhamento-de-jornada': () => import('./relatorios/acompanhamento-de-jornada'),
  estacoes: () => import('./relatorios/estacoes'),
};
