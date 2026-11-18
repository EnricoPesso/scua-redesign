import type { CSSProperties } from 'react';
import type { Motivo } from '../domain/ausencias';

/**
 * Cada motivo se distingue por padrão e borda, além da cor, e tem texto na legenda e na dica.
 * Só tokens de cor do sistema de design.
 */
export const ESTILO_MOTIVO: Record<Motivo, CSSProperties> = {
  // Liso, azul.
  Pausa: {
    backgroundColor: 'var(--color-info-bg)',
    color: 'var(--color-info-text)',
    border: '2px solid var(--color-info-text)',
  },
  // Listras diagonais, amarelo.
  Almoço: {
    backgroundColor: 'var(--color-warning-bg)',
    backgroundImage: 'repeating-linear-gradient(45deg, var(--color-warning-text) 0 1.5px, transparent 1.5px 7px)',
    color: 'var(--color-warning-text)',
    border: '2px solid var(--color-warning-text)',
  },
  // Borda tracejada, cinza.
  'Reunião externa': {
    backgroundColor: 'var(--color-neutral-bg)',
    color: 'var(--color-neutral-text)',
    border: '2px dashed var(--color-neutral-text)',
  },
  // Pontilhado, vermelho.
  'Sem atividade': {
    backgroundColor: 'var(--color-danger-bg)',
    backgroundImage: 'radial-gradient(var(--color-danger-text) 1.2px, transparent 1.6px)',
    backgroundSize: '6px 6px',
    color: 'var(--color-danger-text)',
    border: '2px solid var(--color-danger-text)',
  },
};
