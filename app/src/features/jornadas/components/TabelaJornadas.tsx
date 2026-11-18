import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cargaSemanal, resumirHorario } from '../domain/horario';
import type { Jornada } from '../domain/tipos';

const TH = 'px-4 py-3 text-left font-semibold whitespace-nowrap text-[var(--color-text)]';
// Desktop: célula de tabela. Celular: cada linha vira um cartão.
const TD = 'px-4 py-3 align-middle max-md:p-0';
const COM_ROTULO = "max-md:before:mr-1 max-md:before:font-semibold max-md:before:text-[var(--color-text-muted)] max-md:before:content-[attr(data-rotulo)_':']";

const Sim = ({ valor, destaque = 'info' }: { valor: boolean; destaque?: 'info' | 'success' }) => (
  <Badge status={valor ? destaque : 'neutral'}>{valor ? 'Sim' : 'Não'}</Badge>
);

// pedir ao @PhLima07: tabela que vira cartões no celular (o DataTable do sistema de design só rola na horizontal).
export function TabelaJornadas({ jornadas, aoExcluir }: { jornadas: Jornada[]; aoExcluir: (j: Jornada) => void }) {
  const { search } = useLocation();
  const linkDe = (id: string) => ({ pathname: `/jornadas/${id}`, search });

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] max-md:border-0 max-md:bg-transparent">
      <div className="overflow-x-auto max-md:overflow-visible">
        <table className="w-full border-collapse text-left text-sm max-md:block">
          <caption className="sr-only">Jornadas de trabalho</caption>
          <thead className="bg-[var(--color-surface-muted)] max-md:sr-only">
            <tr>
              <th scope="col" className={TH}>Identificador</th>
              <th scope="col" className={TH}>Descrição</th>
              <th scope="col" className={TH}>Horário</th>
              <th scope="col" className={TH}>Carga semanal</th>
              <th scope="col" className={TH}>Ativa</th>
              <th scope="col" className={TH}>Padrão</th>
              <th scope="col" className={TH}>Libera regra</th>
              <th scope="col" className={TH}>Informativa</th>
              <th scope="col" className={cn(TH, 'text-right')}>Ações</th>
            </tr>
          </thead>
          <tbody className="max-md:grid max-md:gap-3">
            {jornadas.map((j) => (
              <tr
                key={j.id}
                className="border-t border-[var(--color-line)] hover:bg-[var(--color-row-hover)] max-md:grid max-md:grid-cols-2 max-md:items-center max-md:gap-x-3 max-md:gap-y-2 max-md:rounded-lg max-md:border max-md:bg-[var(--color-surface)] max-md:p-4 max-md:shadow-[var(--shadow-1)]"
              >
                <td className={cn(TD, 'max-md:col-span-2')}>
                  <Link to={linkDe(j.id)} className="inline-flex min-h-11 items-center rounded-sm font-semibold text-[var(--color-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring md:min-h-0">
                    {j.identificador}
                  </Link>
                </td>
                <td className={cn(TD, 'max-md:col-span-2')}>{j.descricao}</td>
                <td className={cn(TD, 'whitespace-nowrap max-md:col-span-2 max-md:font-semibold')}>{resumirHorario(j.semana)}</td>
                <td data-rotulo="Carga semanal" className={cn(TD, COM_ROTULO, 'tabular-nums max-md:col-span-2')}>{cargaSemanal(j.semana)}</td>
                <td data-rotulo="Ativa" className={cn(TD, COM_ROTULO)}><Sim valor={j.ativa} destaque="success" /></td>
                <td data-rotulo="Padrão" className={cn(TD, COM_ROTULO)}><Sim valor={j.padrao} /></td>
                <td data-rotulo="Libera regra" className={cn(TD, COM_ROTULO)}><Sim valor={j.liberaRegra} /></td>
                <td data-rotulo="Informativa" className={cn(TD, COM_ROTULO)}><Sim valor={j.informativa} /></td>
                <td className={cn(TD, 'max-md:col-span-2')}>
                  <span className="flex justify-end gap-1 max-md:justify-start">
                    <Link
                      to={linkDe(j.id)}
                      aria-label={`Editar ${j.identificador}`}
                      className="inline-flex size-10 items-center justify-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring max-md:size-11"
                    >
                      <PencilIcon className="size-4" aria-hidden="true" />
                    </Link>
                    <Button variant="ghost" size="icon" className="max-md:size-11" aria-label={`Excluir ${j.identificador}`} onClick={() => aoExcluir(j)}>
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
