import type { FormPedido } from './validacao';
import type { NovoPedido, Pedido, Permissoes } from './types';

export function formVazio(p: Permissoes): FormPedido {
  return {
    paraQuem: p.podePedirParaOutros ? 'outro' : 'mim',
    beneficiarioId: '',
    dataInicial: '',
    dataFinal: '',
    inicio: '',
    fim: '',
    justificativaCodigo: '',
    detalhes: '',
  };
}

/** Preenche o formulário com um pedido existente (editar). Dia único vira "último dia" vazio. */
export function formDoPedido(pedido: Pedido, p: Permissoes): FormPedido {
  const paraOutro = p.podePedirParaOutros && pedido.beneficiario.id !== p.usuario.id;
  return {
    paraQuem: paraOutro ? 'outro' : 'mim',
    beneficiarioId: paraOutro ? pedido.beneficiario.id : '',
    dataInicial: pedido.dataInicial,
    dataFinal: pedido.dataFinal === pedido.dataInicial ? '' : pedido.dataFinal,
    inicio: pedido.horario.inicio,
    fim: pedido.horario.fim,
    justificativaCodigo: pedido.justificativa.codigo,
    detalhes: pedido.detalhes,
  };
}

/** "Pedir de novo": mesmos dados, menos as datas. */
export function formPedirDeNovo(pedido: Pedido, p: Permissoes): FormPedido {
  return { ...formDoPedido(pedido, p), dataInicial: '', dataFinal: '' };
}

export function paraNovoPedido(f: FormPedido, usuarioId: string): NovoPedido {
  return {
    beneficiarioId: f.paraQuem === 'mim' ? usuarioId : f.beneficiarioId,
    dataInicial: f.dataInicial,
    dataFinal: f.dataFinal || f.dataInicial,
    horario: { inicio: f.inicio, fim: f.fim },
    justificativaCodigo: f.justificativaCodigo,
    detalhes: f.detalhes.trim(),
  };
}
