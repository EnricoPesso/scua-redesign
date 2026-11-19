import { formatarHora, nomeCanal } from './formatacao';
import type { Canal } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly dados: Record<string, string>;

  constructor(status: number, codigo: string, dados: Record<string, string> = {}) {
    super(`API ${status} ${codigo}`);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.dados = dados;
  }
}

export type Contexto = 'carregar' | 'enviar' | 'decidir';

const GENERICA: Record<Contexto, string> = {
  carregar: 'Não conseguimos carregar os pedidos. Verifique sua conexão. Se continuar, fale com o TI da sua empresa.',
  enviar: 'Não conseguimos enviar. Seus dados estão salvos aqui.',
  decidir: 'Não conseguimos registrar a decisão. Tente de novo.',
};

export function mensagemJaDecidido(dados: Record<string, string>): string {
  const acao = dados.status === 'reprovado' ? 'reprovado' : 'aprovado';
  const por = dados.por ? ` por ${dados.por}` : '';
  const canal = dados.canal ? ` via ${nomeCanal(dados.canal as Canal)}` : '';
  const hora = dados.em ? ` às ${formatarHora(dados.em)}` : '';
  return `Este pedido já foi ${acao}${por}${canal}${hora}.`;
}

/** Texto amigável para qualquer erro. Nunca devolve a mensagem técnica do erro. */
export function mensagemParaUsuario(erro: unknown, contexto: Contexto): string {
  if (!(erro instanceof ApiError)) return GENERICA[contexto];
  if (erro.status === 403) return 'Você não tem acesso a este pedido.';
  if (erro.status === 404) return 'Este pedido não existe ou foi removido.';
  if (erro.status === 409) {
    if (erro.codigo === 'JA_DECIDIDO') return mensagemJaDecidido(erro.dados);
    if (erro.codigo === 'PERIODO_CONFLITANTE') return 'Já existe um pedido pendente para esse período.';
    if (erro.codigo === 'NAO_EDITAVEL') return 'Este pedido não pode mais ser editado.';
    if (erro.codigo === 'NAO_PENDENTE') return 'Este pedido não está mais pendente.';
  }
  return GENERICA[contexto];
}
