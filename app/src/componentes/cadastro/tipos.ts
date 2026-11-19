import type { ReactNode } from 'react';
import type { Colecao, ComId } from '../../mock/colecao';
import type { PassoTrilha } from '../Pagina';

type Opcao = { value: string; label: string };
type Chave<T> = Extract<keyof Omit<T, 'id'>, string>;

interface CampoBase<T> {
  chave: Chave<T>;
  rotulo: string;
  obrigatorio?: boolean;
  /** Texto de ajuda abaixo do campo. */
  dica?: string;
  /** Não pode ser alterado ao editar (ex.: código de um parâmetro). */
  fixoAoEditar?: boolean;
}

export type CampoCadastro<T> =
  | (CampoBase<T> & { tipo: 'texto' | 'textoLongo' | 'hora' | 'data'; maximo?: number })
  | (CampoBase<T> & { tipo: 'numero'; minimo?: number; maximo?: number })
  | (CampoBase<T> & { tipo: 'select'; opcoes: Opcao[] })
  | (CampoBase<T> & { tipo: 'alternar' });

export interface ColunaCadastro<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  numeric?: boolean;
  /** Cabeçalho só para leitor de tela. */
  cabecalhoOculto?: boolean;
  /** Texto da coluna na planilha exportada. Sem ele, usa o texto que a coluna mostra ou o valor do item. */
  texto?: (item: T) => string;
}

export type ErrosCadastro<T> = Partial<Record<Chave<T>, string>>;

/**
 * Modelo único de cadastro: cada tela declara só a coleção, as colunas e os campos.
 * Lista, busca, formulário em painel, confirmação de exclusão e estados vêm do modelo.
 */
export interface ConfigCadastro<T extends ComId> {
  /** Chave do cache (única por cadastro). */
  chave: string;
  titulo: string;
  descricao?: string;
  trilha: PassoTrilha[];
  /** Nome do item no singular, em minúsculas: "justificativa", "grupo". */
  singular: string;
  /** Gênero do nome, para os textos: "Nova justificativa", "Novo grupo". */
  genero: 'a' | 'o';
  colecao: Colecao<T>;
  colunas: ColunaCadastro<T>[];
  campos: CampoCadastro<T>[];
  /** Valores iniciais de um item novo. */
  novo: () => Omit<T, 'id'>;
  /** Como o item é chamado nas mensagens ("Excluir a justificativa Curso?"). */
  nomeDe: (item: T) => string;
  /** Texto usado pela busca. Sem ele, a tela não mostra o campo de busca. */
  textoDeBusca?: (item: T) => string;
  /** Regras além de "obrigatório". */
  validar?: (dados: Omit<T, 'id'>) => ErrosCadastro<T>;
  /** Padrão: tudo permitido. Listas fixas do sistema (ex.: parâmetros) só permitem editar. */
  podeCriar?: boolean;
  podeExcluir?: boolean;
  /** Aviso extra na confirmação de exclusão (ex.: "Os usuários deste grupo ficam sem grupo."). */
  avisoAoExcluir?: string;
  itensPorPagina?: number;
}
