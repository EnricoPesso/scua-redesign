import { cn } from '@/lib/utils';
import { emHoras, emReais } from '../../../lib/conformidade';
import { Paginacao } from '../../../componentes/Paginacao';
import type { LinhaDoRanking } from '../domain/radar';

const CELULA = 'px-4 py-3';
/** Colunas que somem no celular: o nome e o valor em risco bastam, o resto aparece ao abrir a pessoa. */
const SO_DESKTOP = 'max-lg:hidden';

export function RankingPessoas({ linhas, pagina, tamanho, aoMudarPagina, aoAbrir }: {
  linhas: LinhaDoRanking[];
  pagina: number;
  tamanho: number;
  aoMudarPagina: (pagina: number, tamanho: number) => void;
  aoAbrir: (pessoaId: string) => void;
}) {
  const visiveis = linhas.slice((pagina - 1) * tamanho, pagina * tamanho);
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border bg-card">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Pessoas com mais valor em risco, da maior para a menor</caption>
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                <th scope="col" className={cn(CELULA, 'font-semibold whitespace-nowrap')}>Pessoa</th>
                <th scope="col" className={cn(CELULA, 'font-semibold whitespace-nowrap', SO_DESKTOP)}>Diretoria</th>
                <th scope="col" className={cn(CELULA, 'font-semibold whitespace-nowrap', SO_DESKTOP)}>Gestor</th>
                <th scope="col" className={cn(CELULA, 'text-right font-semibold whitespace-nowrap tabular-nums')}>Ocorrências</th>
                <th scope="col" className={cn(CELULA, 'text-right font-semibold whitespace-nowrap tabular-nums', SO_DESKTOP)}>Horas sem aprovação</th>
                <th scope="col" className={cn(CELULA, 'text-right font-semibold whitespace-nowrap tabular-nums')}>Em risco</th>
                <th scope="col" className={cn(CELULA, 'text-right font-semibold whitespace-nowrap tabular-nums', SO_DESKTOP)}>Evitado</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <tr key={l.pessoaId} className="border-t border-border hover:bg-[var(--color-row-hover)]">
                  <th scope="row" className="px-2 py-1 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => aoAbrir(l.pessoaId)}
                      aria-label={`Ver ocorrências de ${l.nome}`}
                      className="inline-flex min-h-9 items-center rounded-md px-2 text-left font-semibold text-[var(--color-brand-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring max-md:min-h-11"
                    >
                      {l.nome}
                    </button>
                  </th>
                  <td className={cn(CELULA, SO_DESKTOP)}>{l.diretoria}</td>
                  <td className={cn(CELULA, SO_DESKTOP)}>{l.gestorNome}</td>
                  <td className={cn(CELULA, 'text-right tabular-nums')}>{l.ocorrencias}</td>
                  <td className={cn(CELULA, 'text-right tabular-nums', SO_DESKTOP)}>{l.minutosSemAprovacao > 0 ? emHoras(l.minutosSemAprovacao) : '—'}</td>
                  <td className={cn(CELULA, 'text-right font-semibold tabular-nums')}>{emReais(l.custo)}</td>
                  <td className={cn(CELULA, 'text-right tabular-nums', SO_DESKTOP)}>{emReais(l.evitado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Paginacao total={linhas.length} pagina={pagina} tamanho={tamanho} aoMudar={aoMudarPagina} />
    </div>
  );
}
