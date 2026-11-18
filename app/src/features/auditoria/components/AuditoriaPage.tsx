import { DownloadIcon } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/format-number';
import { Abas } from '../../../componentes/Abas';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { hoje } from '../../../mock/datas';
import { Paginacao } from '../../extensoes/components/Paginacao';
import { auditoriaApi } from '../api';
import { ABAS, ehAba, nomeDoArquivo, rotuloDaAba, type Aba } from '../domain/auditoria';
import { baixarCsv, csvDosRegistros } from '../exportar';
import { FiltrosBarra } from './FiltrosBarra';
import { CartoesRegistros, TabelaRegistros } from './ListaRegistros';
import { useFiltros, useTelaLarga } from './useFiltros';

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-5 w-3/5" />
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
    </div>
  );
}

export function AuditoriaPage() {
  const { aba: abaUrl } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const telaLarga = useTelaLarga();
  const { filtros, pagina, tamanho, ativos, search, atualizar, limpar } = useFiltros();
  const aba: Aba = ehAba(abaUrl) ? abaUrl : ABAS[0].valor;

  const consulta = useQuery({
    queryKey: ['auditoria', aba, filtros.de, filtros.ate, filtros.pessoa, filtros.busca],
    queryFn: () => auditoriaApi.listar(aba, filtros),
  });
  const registros = consulta.data ?? [];

  // Aba inválida na URL cai na primeira.
  if (abaUrl !== undefined && !ehAba(abaUrl)) return <Navigate to={{ pathname: `/auditoria/${ABAS[0].valor}`, search }} replace />;

  const ultima = Math.max(1, Math.ceil(registros.length / tamanho));
  const atual = Math.min(pagina, ultima);
  const visiveis = registros.slice((atual - 1) * tamanho, atual * tamanho);

  const trocarAba = (nova: Aba) => {
    // A busca e o período valem para qualquer aba; a página volta para a primeira.
    const params = new URLSearchParams(search);
    params.delete('pagina');
    const resto = params.toString();
    void navegar({ pathname: `/auditoria/${nova}`, search: resto ? `?${resto}` : '' });
  };

  const exportar = () => {
    const arquivo = nomeDoArquivo(aba, hoje());
    baixarCsv(csvDosRegistros(registros), arquivo);
    toast.success(`${formatNumber(registros.length)} ${registros.length === 1 ? 'registro exportado' : 'registros exportados'} em ${arquivo}`);
  };

  let conteudo;
  if (consulta.isPending) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  } else if (registros.length === 0) {
    conteudo = (
      <EmptyState
        title={`Nenhuma alteração em ${rotuloDaAba(aba)} nesse período.`}
        description={ativos > 0 ? 'Tente outro período ou mude os filtros.' : undefined}
        action={ativos > 0 ? <Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button> : undefined}
      />
    );
  } else {
    conteudo = (
      <>
        {telaLarga ? <TabelaRegistros registros={visiveis} /> : <CartoesRegistros registros={visiveis} />}
        <Paginacao total={registros.length} pagina={atual} tamanho={tamanho} aoMudar={(p, t) => atualizar({ pagina: String(p), tamanho: String(t) })} />
      </>
    );
  }

  return (
    <Pagina
      titulo="Auditoria"
      descricao="Registro de quem mudou o quê no sistema."
      acoes={(
        <Button variant="secondary" disabled={consulta.isPending || consulta.isError || registros.length === 0} onClick={exportar}>
          <DownloadIcon aria-hidden="true" />
          Exportar CSV
        </Button>
      )}
    >
      <Abas rotulo="Tipos de alteração" abas={ABAS} ativa={aba} aoMudar={trocarAba}>
        <FiltrosBarra filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
        <div aria-busy={consulta.isFetching || undefined} className="grid min-w-0 gap-4">{conteudo}</div>
      </Abas>
    </Pagina>
  );
}
