import { Link, useLocation } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { nomeDe } from '../../../mock/diretorio';
import type { Usuario } from '../domain/tipos';

const TH = 'px-4 py-3 text-left font-semibold whitespace-nowrap text-[var(--color-text)]';
// Desktop: célula de tabela. Celular: cada linha vira um cartão.
const TD = 'px-4 py-3 align-middle max-md:p-0';
const COM_ROTULO = "max-md:before:mr-1 max-md:before:font-semibold max-md:before:text-[var(--color-text-muted)] max-md:before:content-[attr(data-rotulo)_':']";

// pedir ao @PhLima07: tabela que vira cartões no celular (o DataTable do sistema de design só rola na horizontal).
export function TabelaUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  const { search } = useLocation();
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] max-md:border-0 max-md:bg-transparent">
      <div className="overflow-x-auto max-md:overflow-visible">
        <table className="w-full border-collapse text-left text-sm max-md:block">
          <caption className="sr-only">Usuários</caption>
          <thead className="bg-[var(--color-surface-muted)] max-md:sr-only">
            <tr>
              <th scope="col" className={TH}>Nome</th>
              <th scope="col" className={TH}>Login</th>
              <th scope="col" className={TH}>Gestor</th>
              <th scope="col" className={TH}>Departamento</th>
              <th scope="col" className={TH}>Jornada</th>
              <th scope="col" className={TH}>Situação</th>
            </tr>
          </thead>
          <tbody className="max-md:grid max-md:gap-3">
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className="border-t border-[var(--color-line)] hover:bg-[var(--color-row-hover)] max-md:grid max-md:grid-cols-[1fr_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-1 max-md:rounded-lg max-md:border max-md:bg-[var(--color-surface)] max-md:p-4 max-md:shadow-[var(--shadow-1)]"
              >
                <td className={cn(TD, 'max-md:order-1')}>
                  <Link
                    to={{ pathname: `/usuarios/${u.id}`, search }}
                    className="inline-flex min-h-11 items-center rounded-sm font-semibold text-[var(--color-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring md:min-h-0"
                  >
                    {u.nome}
                  </Link>
                </td>
                <td data-rotulo="Login" className={cn(TD, COM_ROTULO, 'max-md:order-3 max-md:col-span-2')}>{u.login}</td>
                <td data-rotulo="Gestor" className={cn(TD, COM_ROTULO, 'max-md:order-3 max-md:col-span-2')}>{nomeDe(u.gestorId)}</td>
                <td data-rotulo="Departamento" className={cn(TD, COM_ROTULO, 'max-md:order-3 max-md:col-span-2')}>{u.departamento}</td>
                <td data-rotulo="Jornada" className={cn(TD, COM_ROTULO, 'max-md:order-3 max-md:col-span-2')}>{u.jornadaNome}</td>
                <td className={cn(TD, 'max-md:order-2 max-md:justify-self-end')}>
                  <Badge status={u.ativo ? 'success' : 'neutral'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
