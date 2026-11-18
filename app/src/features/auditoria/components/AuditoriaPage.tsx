import { Navigate, useNavigate, useParams } from 'react-router';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Abas } from '../../../componentes/Abas';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { hoje } from '../../../mock/datas';
import { Paginacao } from '../../../componentes/Paginacao';
import { auditoriaApi } from '../api';
import { ABAS, ehAba, nomeDoArquivo, rotuloDaAba, type Aba } from '../domain/auditoria';
import { COLUNAS_PLANILHA } from '../exportar';
import { resumirAuditoria } from '../domain/painel';
import { FiltrosBarra } from './FiltrosBarra';
import { PainelAuditoria } from './PainelAuditoria';
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

const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
/** Período escrito ao lado dos números: "19/10 a 17/11". */
function textoDoPeriodo(de: string, ate: string): string {
  if (de && ate) return `${ddmm(de)} a ${ddmm(ate)}`;
  if (de) return `a partir de ${ddmm(de)}`;
  if (ate) return `até ${ddmm(ate)}`;
  return 'Todo o histórico';
}

export function AuditoriaPage() {
  const { aba: abaUrl } = useParams();
  const navegar = useNavigate();
  const telaLarga = useTelaLarga();
  const { filtros, pagina, tamanho, ativos, search, atualizar, limpar } = useFiltros();
  const aba: Aba = ehAba(abaUrl) ? abaUrl : ABAS[0].valor;

  const consulta = useQuery({
    queryKey: ['auditoria', aba, filtros.de, filtros.ate, filtros.pessoa, filtros.busca],
    queryFn: () => auditoriaApi.listar(aba, filtros),
  });
  const registros = consulta.data ?? [];
  // Panorama de todas as áreas, com os mesmos filtros da tabela.
  const todas = useQuery({
    queryKey: ['auditoria', 'todas', filtros.de, filtros.ate, filtros.pessoa, filtros.busca],
    queryFn: () => auditoriaApi.todas(filtros),
  });
  const resumo = useMemo(() => (todas.data ? resumirAuditoria(todas.data, filtros.de, filtros.ate) : undefined), [todas.data, filtros.de, filtros.ate]);
  const textoPeriodo = textoDoPeriodo(filtros.de, filtros.ate);

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

  let conteudo;
  if (consulta.isPending) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => { void consulta.refetch(); if (todas.isError) void todas.refetch(); }} />;
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
        <BotaoExportar arquivo={nomeDoArquivo(aba, hoje())} colunas={COLUNAS_PLANILHA} linhas={registros} desabilitado={consulta.isPending || consulta.isError} />
      )}
    >
      {/* Os filtros valem para o panorama e para a lista de cada área. */}
      <FiltrosBarra filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      {/* Se a lista também falhou, o aviso dela basta (um aviso só, e o "Tentar de novo" dela recarrega os dois). */}
      {todas.isError ? (
        consulta.isError ? null : <EstadoErro erro={todas.error} aoTentar={() => void todas.refetch()} titulo="Não conseguimos carregar o panorama" />
      ) : (
        <PainelAuditoria resumo={resumo} carregando={todas.isPending} periodo={textoPeriodo} aoAbrirArea={trocarAba} />
      )}
      <Abas rotulo="Tipos de alteração" abas={ABAS} ativa={aba} aoMudar={trocarAba}>
        <div aria-busy={consulta.isFetching || undefined} className="grid min-w-0 gap-4">{conteudo}</div>
      </Abas>
    </Pagina>
  );
}
