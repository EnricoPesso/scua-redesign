import { ErroDeValidacao } from '../mock/colecao';

export type AcaoComErro = 'carregar' | 'salvar' | 'excluir' | 'enviar';

const GENERICA: Record<AcaoComErro, string> = {
  carregar: 'Não conseguimos carregar os dados. Verifique sua conexão. Se continuar, fale com o TI da sua empresa.',
  salvar: 'Não conseguimos salvar. O que você preencheu continua aqui.',
  excluir: 'Não conseguimos excluir. Tente de novo.',
  enviar: 'Não conseguimos enviar. Tente de novo.',
};

/** Texto amigável para qualquer erro. Nunca devolve a mensagem técnica (o detalhe vai para o console). */
export function mensagemDeErro(erro: unknown, acao: AcaoComErro): string {
  if (erro instanceof ErroDeValidacao) return erro.message;
  return GENERICA[acao];
}
