import { RELATORIOS, type ItemRelatorio } from './catalogo';

/** Sem acento e sem diferenciar maiúsculas, para a busca achar "liberacoes" em "Liberações". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrarRelatorios(busca: string): ItemRelatorio[] {
  const q = normalizar(busca);
  if (!q) return RELATORIOS;
  return RELATORIOS.filter((r) => normalizar(`${r.titulo} ${r.resumo}`).includes(q));
}
