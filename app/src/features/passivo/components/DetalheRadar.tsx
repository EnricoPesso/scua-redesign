import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button-variants';
import { Drawer } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { emHoras, emReais, REGRAS } from '../../../lib/conformidade';
import { nomeDe } from '../../../mock/diretorio';
import { ocorrenciasDoAlvo, SEM_GESTOR, type AlvoDoDetalhe, type ResumoRadar } from '../domain/radar';

const dataCompleta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
const LINK = 'rounded-sm text-[var(--color-brand-text)] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring';

/** Painel lateral: as ocorrências que formam o valor de um gestor (todos os liderados) ou de uma pessoa. */
export function DetalheRadar({ alvo, resumo, aoFechar }: { alvo: AlvoDoDetalhe; resumo: ResumoRadar; aoFechar: () => void }) {
  const lista = ocorrenciasDoAlvo(resumo, alvo);
  const total = lista.reduce((t, o) => t + o.custo, 0);
  const ehGestor = alvo.tipo === 'gestor';
  const nome = alvo.id === SEM_GESTOR ? 'Sem gestor definido' : nomeDe(alvo.id);
  const titulo = ehGestor ? `Equipe de ${nome}` : nome;
  const descricao = `${lista.length} ${lista.length === 1 ? 'ocorrência' : 'ocorrências'} no período, somando ${emReais(total)} em risco.`;

  const rodape = alvo.tipo === 'pessoa'
    ? <Link to={`/dossie?pessoa=${encodeURIComponent(alvo.id)}`} className={cn(buttonVariants(), 'max-md:h-11')}>Abrir dossiê</Link>
    : undefined;

  return (
    <Drawer open onOpenChange={(aberto) => { if (!aberto) aoFechar(); }} title={titulo} description={descricao} footer={rodape} className="max-w-[32rem]">
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ocorrência neste período.</p>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Cada linha é uma ocorrência que entrou no valor em risco, da mais recente para a mais antiga.</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Ocorrências que formam o valor em risco de {nome}</caption>
              <thead className="bg-[var(--color-surface-muted)]">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">Dia</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Regra</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">Tempo</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold whitespace-nowrap">Custo</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => (
                  <tr key={`${o.pessoaId}-${o.dia}-${o.regra}`} className="border-t border-border align-top">
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">{dataCompleta(o.dia)}</td>
                    <td className="px-3 py-2">
                      <span className="block">{REGRAS[o.regra].titulo}</span>
                      <span className="block text-xs text-muted-foreground">{REGRAS[o.regra].base}</span>
                      {ehGestor && (
                        <Link to={`/dossie?pessoa=${encodeURIComponent(o.pessoaId)}`} className={cn('text-xs', LINK)}>{nomeDe(o.pessoaId)}</Link>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{emHoras(o.minutos)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold tabular-nums">{emReais(o.custo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-[var(--color-surface-muted)]">
                  <th scope="row" colSpan={3} className="px-3 py-2 text-left font-semibold">Total em risco</th>
                  <td className="px-3 py-2 text-right font-bold whitespace-nowrap tabular-nums">{emReais(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Drawer>
  );
}
