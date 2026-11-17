import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { abasPermitidas, ehAba } from '../domain/abas';
import { mensagemParaUsuario } from '../domain/erros';
import { usePermissoes } from '../hooks/queries';
import { AbasExtensoes, ID_PAINEL_ABA, idAba } from './AbasExtensoes';
import { EstadoLista } from './EstadoLista';
import { ListaPedidos } from './ListaPedidos';

const PAGINA = 'mx-auto grid w-full grid-cols-[minmax(0,1fr)] max-w-[75rem] gap-4 px-4 pt-5 pb-10 md:px-6';

export function ExtensoesPage() {
  const { aba } = useParams();
  const { search } = useLocation();
  const permissoes = usePermissoes();

  if (permissoes.isPending) return <main className={PAGINA}><EstadoLista tipo="carregando" /></main>;
  if (permissoes.isError) {
    return (
      <main className={PAGINA}>
        <EstadoLista tipo="erro" mensagem={mensagemParaUsuario(permissoes.error, 'carregar')} onTentarDeNovo={() => void permissoes.refetch()} />
      </main>
    );
  }
  const abas = abasPermitidas(permissoes.data);
  if (abas.length === 0) {
    return <main className={PAGINA}><p role="status" className="text-[var(--color-text-muted)]">Você não tem acesso às extensões de jornada.</p></main>;
  }
  if (!ehAba(aba) || !abas.includes(aba)) return <Navigate to={`/extensoes/${abas[0]}`} replace />;

  return (
    <main className={PAGINA}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Extensões de jornada</h1>
        {permissoes.data.podePedir && (
          <Link to={{ pathname: '/extensoes/meus/novo', search: aba === 'meus' ? search : '' }} className={cn(buttonVariants(), 'max-md:h-11')}>+ Nova extensão</Link>
        )}
      </header>
      <AbasExtensoes abas={abas} ativa={aba} />
      <div role="tabpanel" id={ID_PAINEL_ABA} aria-labelledby={idAba(aba)} className="grid min-w-0 gap-4">
        <ListaPedidos key={aba} aba={aba} />
      </div>
      {/* Ponto de encaixe dos painéis: formulário (Task 11) e detalhe (Task 12). */}
      <Outlet />
    </main>
  );
}
