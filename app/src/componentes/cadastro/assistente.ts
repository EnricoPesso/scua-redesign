import { aplicarCampos, textoDoValor, type ResultadoAplicar } from '../../features/assistente/acoes';
import type { CampoAlvo } from '../../features/assistente/contrato';
import type { Aba } from '../../features/auditoria/domain/auditoria';
import type { ComId } from '../../mock/colecao';
import type { ConfigCadastro } from './tipos';

/**
 * Os campos do cadastro, como o assistente os enxerga. Na edição, o que é fixo (`fixoAoEditar`) fica de fora:
 * a pessoa não pode mudar, então a IA também não.
 */
export function camposDoAlvo<T extends ComId>(config: Pick<ConfigCadastro<T>, 'campos'>, editando: boolean): CampoAlvo[] {
  return config.campos
    .filter((c) => !(editando && c.fixoAoEditar))
    .map((c): CampoAlvo => ({
      chave: c.chave, rotulo: c.rotulo, tipo: c.tipo, obrigatorio: c.obrigatorio, dica: c.dica,
      ...(c.tipo === 'select' ? { opcoes: c.opcoes } : {}),
      ...(c.tipo === 'numero' ? { minimo: c.minimo } : {}),
      ...(c.tipo === 'numero' || c.tipo === 'texto' || c.tipo === 'textoLongo' || c.tipo === 'hora' || c.tipo === 'data' ? { maximo: c.maximo } : {}),
    }));
}

/** Coloca no formulário os valores que o assistente mandou. `chaves` são os campos que mudaram (para destacar). */
export function aplicarNoCadastro(campos: CampoAlvo[], atual: Record<string, unknown>, recebidos: Record<string, unknown>): { dados: Record<string, unknown>; resultado: ResultadoAplicar; chaves: string[] } {
  const { validos, resultado } = aplicarCampos(campos, recebidos);
  return { dados: { ...atual, ...validos }, resultado, chaves: Object.keys(validos) };
}

/** Abas da Auditoria que têm um cadastro correspondente (a de Jornadas é registrada pela própria tela de jornadas). */
const ABA_DO_CADASTRO: Record<string, Aba> = { parametros: 'parametros', liberacoes: 'liberacoes', 'templates-whatsapp': 'whatsapp' };
export const abaDaAuditoria = (chave: string): Aba | null => (Object.hasOwn(ABA_DO_CADASTRO, chave) ? ABA_DO_CADASTRO[chave] : null);

const vazio = (v: unknown) => v === '' || v === null || v === undefined;

/** "Rótulo: valor; Rótulo: valor", para a Auditoria. Só os campos dados (na edição, só os que mudaram). */
export function resumoDosCampos(campos: CampoAlvo[], valores: Record<string, unknown>, chaves?: string[]): string | null {
  const partes = campos
    .filter((c) => (chaves ? chaves.includes(c.chave) : !vazio(valores[c.chave])))
    .map((c) => `${c.rotulo}: ${vazio(valores[c.chave]) ? '(vazio)' : textoDoValor(c, valores[c.chave])}`);
  return partes.length > 0 ? partes.join('; ') : null;
}

/** Chaves dos campos que mudaram entre dois conjuntos de valores. */
export const chavesQueMudaram = (campos: CampoAlvo[], antes: Record<string, unknown>, depois: Record<string, unknown>): string[] =>
  campos.filter((c) => !Object.is(antes[c.chave] ?? '', depois[c.chave] ?? '')).map((c) => c.chave);
