import { LIMITE_DE_PROBLEMAS, type ProblemaLinha } from './validacao';

const linhas = (n: number) => `${n} ${n === 1 ? 'linha' : 'linhas'}`;

/** "18 linhas prontas para importar, 2 com problema". */
export function resumoDaPrevia(prontas: number, comProblema: number): string {
  const a = prontas === 0 ? 'Nenhuma linha pronta para importar' : `${prontas} ${prontas === 1 ? 'linha pronta' : 'linhas prontas'} para importar`;
  const b = comProblema === 0 ? 'nenhuma com problema' : `${comProblema} com problema`;
  return `${a}, ${b}`;
}

/** "Linha 7: a data final é anterior à inicial", no máximo `limite` itens, e quantos ficaram de fora. */
export function listaDeProblemas(problemas: ProblemaLinha[], limite = LIMITE_DE_PROBLEMAS): { itens: string[]; restantes: number } {
  return {
    itens: problemas.slice(0, limite).map((p) => `Linha ${p.linha}: ${p.mensagem}`),
    restantes: Math.max(0, problemas.length - limite),
  };
}

/** "17/11 às 14:32", a partir de "2026-11-17T14:32:00". */
export function formatarQuando(iso: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[2]}/${m[1]} às ${m[3]}:${m[4]}` : '—';
}

/** "18 linhas importadas em 17/11 às 14:32. 2 linhas ignoradas." */
export function resumoDaImportacao(importadas: number, ignoradas: number, quando: string): string {
  const base = `${linhas(importadas)} ${importadas === 1 ? 'importada' : 'importadas'} em ${formatarQuando(quando)}.`;
  return ignoradas > 0 ? `${base} ${linhas(ignoradas)} ${ignoradas === 1 ? 'ignorada' : 'ignoradas'}.` : base;
}

/** Texto curto para o histórico: "18 importadas, 2 ignoradas". */
export function resultadoDoHistorico(importadas: number, ignoradas: number): string {
  const a = `${importadas} ${importadas === 1 ? 'importada' : 'importadas'}`;
  return ignoradas > 0 ? `${a}, ${ignoradas} ${ignoradas === 1 ? 'ignorada' : 'ignoradas'}` : a;
}
