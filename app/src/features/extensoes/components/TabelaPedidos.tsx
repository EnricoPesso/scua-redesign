import { Link, useLocation, useNavigate } from 'react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatarPeriodo } from '../domain/formatacao';
import { formatarDuracao, totalMinutos } from '../domain/horas';
import type { Aba, Pedido } from '../domain/types';
import { SeloStatus } from './SeloStatus';

/** Coluna de seleção opcional (a barra de lote entra na Task 13). */
export interface SelecaoTabela {
  selecionados: ReadonlySet<string>;
  aoAlternar: (id: string, marcado: boolean) => void;
  aoAlternarTodos: (ids: string[], marcado: boolean) => void;
}

// Texto do rótulo some da tela mas continua para leitores de tela.
// pedir ao @PhLima07: Checkbox com rótulo oculto (hoje o rótulo sempre aparece).
const CAIXA = 'min-h-11 min-w-11 justify-center [&]:text-[0px]';

const TH = 'px-4 py-3 text-left font-semibold whitespace-nowrap text-[var(--color-text)]';
// Desktop: célula de tabela. Celular: cada linha vira um cartão (grade de 2 colunas).
const TD = 'px-4 py-3 align-middle max-md:p-0';
const COM_ROTULO = "max-md:before:mr-1 max-md:before:font-semibold max-md:before:text-[var(--color-text-muted)] max-md:before:content-[attr(data-rotulo)_':']";

// pedir ao @PhLima07: tabela com seleção e paginação no servidor (o DataTable do sistema de design
// pagina no cliente e não seleciona).
export function TabelaPedidos({ aba, pedidos, selecao }: { aba: Aba; pedidos: Pedido[]; selecao?: SelecaoTabela }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const linkDe = (id: string) => `/extensoes/${aba}/${id}${search}`;
  const ids = pedidos.map((p) => p.id);
  const marcados = selecao ? ids.filter((id) => selecao.selecionados.has(id)).length : 0;

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] max-md:border-0 max-md:bg-transparent">
      <table className="w-full border-collapse text-left text-sm max-md:block">
        <caption className="sr-only">Pedidos de extensão</caption>
        <thead className="bg-[var(--color-surface-muted)] max-md:sr-only">
          <tr>
            {selecao && (
              <th scope="col" className="w-12 px-4 py-1">
                <Checkbox
                  label="Selecionar todos desta página"
                  className={CAIXA}
                  checked={marcados > 0 && marcados === ids.length}
                  indeterminate={marcados > 0 && marcados < ids.length}
                  onCheckedChange={(c) => selecao.aoAlternarTodos(ids, c)}
                />
              </th>
            )}
            <th scope="col" className={TH}>Beneficiário</th>
            {aba === 'todos' && <><th scope="col" className={TH}>Solicitante</th><th scope="col" className={TH}>Gestor</th></>}
            <th scope="col" className={TH}>Período</th>
            <th scope="col" className={TH}>Horas</th>
            <th scope="col" className={TH}>Justificativa</th>
            <th scope="col" className={TH}>Status</th>
          </tr>
        </thead>
        <tbody className="max-md:grid max-md:gap-3">
          {pedidos.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer border-t border-[var(--color-line)] hover:bg-[var(--color-row-hover)] max-md:grid max-md:grid-cols-[1fr_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-1 max-md:rounded-lg max-md:border max-md:bg-[var(--color-surface)] max-md:p-4 max-md:shadow-[var(--shadow-1)]"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a, input, button, label, [role="checkbox"]')) return;
                void navigate(linkDe(p.id));
              }}
            >
              {selecao && (
                <td className="w-12 px-4 py-1 max-md:order-1 max-md:col-span-2 max-md:p-0">
                  <Checkbox
                    label={`Selecionar ${p.beneficiario.nome}`}
                    className={CAIXA}
                    checked={selecao.selecionados.has(p.id)}
                    onCheckedChange={(c) => selecao.aoAlternar(p.id, c)}
                  />
                </td>
              )}
              <td className={cn(TD, 'max-md:order-2')}>
                <Link to={linkDe(p.id)} className="inline-flex min-h-11 items-center rounded-sm font-semibold text-[var(--color-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring md:min-h-0">
                  {p.beneficiario.nome}
                </Link>
              </td>
              {aba === 'todos' && (
                <>
                  <td data-rotulo="Solicitante" className={cn(TD, COM_ROTULO, 'max-md:order-4 max-md:col-span-2')}>{p.solicitante.nome}</td>
                  <td data-rotulo="Gestor" className={cn(TD, COM_ROTULO, 'max-md:order-4 max-md:col-span-2')}>{p.gestor?.nome ?? '—'}</td>
                </>
              )}
              <td className={cn(TD, 'whitespace-nowrap max-md:order-4 max-md:col-span-2 max-md:font-semibold')}>
                {formatarPeriodo(p.dataInicial, p.dataFinal, p.horario)}
              </td>
              <td data-rotulo="Horas" className={cn(TD, COM_ROTULO, 'tabular-nums max-md:order-4 max-md:col-span-2')}>
                {formatarDuracao(totalMinutos(p.dataInicial, p.dataFinal, p.horario))}
              </td>
              <td data-rotulo="Justificativa" className={cn(TD, COM_ROTULO, 'max-md:order-4 max-md:col-span-2')}>{p.justificativa.descricao}</td>
              <td className={cn(TD, 'max-md:order-3 max-md:justify-self-end')}><SeloStatus status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
