import { ehDataValida, paraMinutos } from './horas';
import { JUSTIFICATIVA_OUTRA } from './types';

export interface FormPedido {
  paraQuem: 'mim' | 'outro';
  beneficiarioId: string;
  dataInicial: string;
  dataFinal: string;
  inicio: string;
  fim: string;
  justificativaCodigo: string;
  detalhes: string;
}

export type ErrosForm = Partial<Record<keyof FormPedido, string>>;

export const LIMITE_DETALHES = 500;

export function validarPedido(f: FormPedido, hoje: string): ErrosForm {
  const e: ErrosForm = {};

  if (f.paraQuem === 'outro' && !f.beneficiarioId) e.beneficiarioId = 'Escolha para quem é a extensão';

  if (!f.dataInicial) e.dataInicial = 'Informe o primeiro dia';
  else if (!ehDataValida(f.dataInicial)) e.dataInicial = 'Data inválida';
  else if (f.dataInicial < hoje) e.dataInicial = 'A data não pode estar no passado';

  if (f.dataFinal) {
    if (!ehDataValida(f.dataFinal)) e.dataFinal = 'Data inválida';
    else if (f.dataInicial && f.dataFinal < f.dataInicial) e.dataFinal = 'O último dia precisa ser igual ou depois do primeiro';
  }

  const inicio = paraMinutos(f.inicio);
  const fim = paraMinutos(f.fim);
  if (!f.inicio) e.inicio = 'Informe o horário de início';
  else if (inicio === null) e.inicio = 'Horário inválido';
  if (!f.fim) e.fim = 'Informe o horário de fim';
  else if (fim === null) e.fim = 'Horário inválido';
  else if (inicio !== null && fim <= inicio) e.fim = 'A hora final precisa ser depois da inicial';

  if (!f.justificativaCodigo) e.justificativaCodigo = 'Escolha um motivo';

  if (f.justificativaCodigo === JUSTIFICATIVA_OUTRA && !f.detalhes.trim()) e.detalhes = 'Descreva o motivo';
  else if (f.detalhes.length > LIMITE_DETALHES) e.detalhes = `Use no máximo ${LIMITE_DETALHES} caracteres`;

  return e;
}
