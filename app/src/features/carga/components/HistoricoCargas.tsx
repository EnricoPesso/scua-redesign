import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { historico, type RegistroCarga } from '../api';
import { formatarQuando, resultadoDoHistorico } from '../domain/textos';

const COLUNAS = [
  { key: 'carga', header: 'Carga' },
  { key: 'arquivo', header: 'Arquivo' },
  { key: 'quando', header: 'Quando', render: (r: RegistroCarga) => formatarQuando(r.quando) },
  { key: 'quem', header: 'Quem' },
  { key: 'resultado', header: 'Resultado', render: (r: RegistroCarga) => resultadoDoHistorico(r.importadas, r.ignoradas) },
];

/** "Últimas cargas": a semente mais o que foi importado nesta sessão, da mais recente para a mais antiga. */
export function HistoricoCargas() {
  const lista = useQuery({
    queryKey: ['carga', 'historico'],
    queryFn: async () => (await historico.listar()).sort((a, b) => b.quando.localeCompare(a.quando)),
  });

  let corpo;
  if (lista.isError) corpo = <EstadoErro erro={lista.error} aoTentar={() => void lista.refetch()} />;
  else if (lista.isSuccess && lista.data.length === 0) {
    corpo = <EmptyState title="Nenhuma carga feita ainda" description="Quando você importar um arquivo, ele aparece aqui." />;
  } else {
    corpo = <DataTable columns={COLUNAS} rows={lista.data ?? []} caption="Últimas cargas" pageSize={5} loading={lista.isPending} />;
  }

  return (
    <section aria-labelledby="titulo-historico" className="flex flex-col gap-3">
      <h2 id="titulo-historico" className="font-heading text-lg font-bold text-foreground">Últimas cargas</h2>
      {corpo}
    </section>
  );
}
