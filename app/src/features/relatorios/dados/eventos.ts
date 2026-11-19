/**
 * Dicionário único dos eventos do sistema: o código técnico nunca chega à tela.
 * Código desconhecido vira texto genérico (o código só aparece no console).
 */
import type { BadgeProps } from '@/components/ui/badge';

type StatusSelo = NonNullable<BadgeProps['status']>;

export const EVENTOS: Record<string, { rotulo: string; status: StatusSelo }> = {
  EVT_LOGON_ALLOWED: { rotulo: 'Logon permitido', status: 'success' },
  EVT_LOGON_DENIED: { rotulo: 'Logon negado', status: 'danger' },
  EVT_LOGOFF: { rotulo: 'Logoff', status: 'neutral' },
  EVT_SCREEN_LOCKED: { rotulo: 'Estação bloqueada', status: 'warning' },
  EVT_SCREEN_UNLOCKED: { rotulo: 'Estação desbloqueada', status: 'info' },
  EVT_BLOCK_OUT_OF_JOURNEY: { rotulo: 'Bloqueio fora da jornada', status: 'danger' },
  EVT_BLOCK_INACTIVITY: { rotulo: 'Bloqueio por inatividade', status: 'warning' },
  EVT_OUT_OF_JOURNEY_LOGON: { rotulo: 'Logon fora da jornada', status: 'warning' },
  EVT_OUT_OF_JOURNEY_UNLOCK: { rotulo: 'Desbloqueio fora da jornada', status: 'info' },
  EVT_CONTROL_STARTED: { rotulo: 'Controle iniciado', status: 'success' },
  EVT_CONTROL_RENEWED: { rotulo: 'Controle renovado', status: 'info' },
  EVT_CONTROL_ENDED: { rotulo: 'Controle encerrado', status: 'neutral' },
};

/** Eventos de acesso, na ordem em que aparecem no filtro "Tipo de evento". */
export const CODIGOS_DE_ACESSO = ['EVT_LOGON_ALLOWED', 'EVT_LOGON_DENIED', 'EVT_LOGOFF', 'EVT_SCREEN_LOCKED', 'EVT_SCREEN_UNLOCKED'] as const;

export const TEXTO_EVENTO_DESCONHECIDO = 'Evento não identificado';

export function rotuloEvento(codigo: string): string {
  const e = EVENTOS[codigo];
  if (!e) {
    console.error(`Evento sem tradução: ${codigo}`);
    return TEXTO_EVENTO_DESCONHECIDO;
  }
  return e.rotulo;
}

export function statusEvento(codigo: string): StatusSelo {
  return EVENTOS[codigo]?.status ?? 'neutral';
}
