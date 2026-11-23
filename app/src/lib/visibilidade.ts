import { equipeVisivel } from '../features/assistente/resumo/resumoDoDia';
import type { Permissoes } from '../features/extensoes/domain/types';
import { PESSOAS_DIRETORIO } from '../mock/diretorio';

/**
 * De quem a pessoa logada pode ver previsão, valores em R$ e custo-hora.
 * RH e administração veem todos (`null` = sem filtro); a gestão vê só a própria equipe, direta e indireta.
 * É a mesma regra do resumo do dia do assistente.
 */
export function pessoasVisiveis(p: Permissoes): Set<string> | null {
  if (p.podeVerTodos || p.podeGerirPessoas || p.podeAdministrar) return null;
  return equipeVisivel(p, PESSOAS_DIRETORIO);
}
