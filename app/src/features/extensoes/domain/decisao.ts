import { formatarDataHora, nomeCanal } from './formatacao';
import type { Evento, MotivoReprovacao, TipoEvento } from './types';

export const MOTIVOS: { valor: MotivoReprovacao; rotulo: string }[] = [
  { valor: 'nao_necessario', rotulo: 'Não é necessário' },
  { valor: 'outro_horario', rotulo: 'Combinar outro horário' },
  { valor: 'periodo_errado', rotulo: 'Período errado' },
  { valor: 'outro', rotulo: 'Outro' },
];

export function rotuloMotivo(m: MotivoReprovacao): string {
  return MOTIVOS.find((o) => o.valor === m)?.rotulo ?? m;
}

export interface ErrosReprovacao { motivo?: string; mensagem?: string }

/** Motivo é obrigatório; "Outro" torna a mensagem obrigatória (spec, seção 7.1). */
export function validarReprovacao(motivo: MotivoReprovacao | null, mensagem: string): ErrosReprovacao {
  if (!motivo) return { motivo: 'Escolha um motivo' };
  if (motivo === 'outro' && !mensagem.trim()) return { mensagem: 'Escreva uma mensagem explicando o motivo' };
  return {};
}

const ACAO: Record<Exclude<TipoEvento, 'avisado'>, string> = {
  criado: 'Pedido criado',
  editado: 'Editado',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado',
};

/** Texto de um evento do histórico: quem e o quê no título; o que mudou, canal e quando no detalhe. */
export function descreverEvento(e: Evento, usuarioId: string): { titulo: string; detalhe: string } {
  const quem = e.por ? (e.por.id === usuarioId ? 'você' : e.por.nome) : null;
  let titulo: string;
  if (e.tipo === 'avisado') {
    titulo = quem === 'você' ? 'Você recebeu o aviso' : quem ? `${quem} recebeu o aviso` : 'Aviso enviado';
  } else {
    titulo = quem ? `${ACAO[e.tipo]} por ${quem}` : ACAO[e.tipo];
  }
  const detalhe = [e.detalhe, `via ${nomeCanal(e.canal)}`, formatarDataHora(e.em)].filter(Boolean).join(' · ');
  return { titulo, detalhe };
}

export function eventosRecentesPrimeiro(eventos: readonly Evento[]): Evento[] {
  return [...eventos].sort((a, b) => b.em.localeCompare(a.em));
}

/** Depois de decidir: o seguinte da fila; no último, o anterior; fila vazia, null (fecha o painel). */
export function proximoDaFila(ids: readonly string[], atual: string): string | null {
  const i = ids.indexOf(atual);
  const resto = ids.filter((id) => id !== atual);
  if (resto.length === 0) return null;
  if (i === -1) return resto[0];
  return resto[Math.min(i, resto.length - 1)];
}
