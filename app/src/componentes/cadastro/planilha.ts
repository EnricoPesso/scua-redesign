import { isValidElement, type ReactNode } from 'react';
import type { ColunaPlanilha } from '@/lib/planilha';
import type { ColunaCadastro } from './tipos';

/** Texto visível de um conteúdo de célula: texto puro, número ou o texto dos filhos de um elemento (Badge, span). */
function textoDe(no: ReactNode): string {
  if (no === null || no === undefined || typeof no === 'boolean') return '';
  if (typeof no === 'string' || typeof no === 'number') return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join('');
  if (isValidElement<{ children?: ReactNode }>(no)) return textoDe(no.props.children);
  return '';
}

/** Valor guardado no item, como texto: booleano vira "Sim"/"Não". */
function textoDoValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
  return '';
}

/**
 * Colunas da planilha a partir das colunas da tabela. Para cada célula, nesta ordem:
 * o `texto` declarado na coluna, o texto que a coluna mostra na tela (string ou o texto de um Badge),
 * e por último o valor guardado no item (para componentes como `SimNao`, que não têm texto nos filhos).
 */
export function colunasDaPlanilha<T>(colunas: ColunaCadastro<T>[]): ColunaPlanilha<T>[] {
  return colunas.map((c) => ({
    header: c.header,
    texto: (item: T) => {
      if (c.texto) return c.texto(item);
      if (c.render) {
        const visivel = textoDe(c.render(item)).trim();
        if (visivel) return visivel;
      }
      return textoDoValor((item as Record<string, unknown>)[c.key]);
    },
  }));
}
