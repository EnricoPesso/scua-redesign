import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagina } from '../../../componentes/Pagina';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { ausenciasApi } from '../api';
import { diasUteisEntre, formatarDiaMes, resumir, validarPeriodo } from '../domain/ausencias';
import { FiltrosBarra } from './FiltrosBarra';
import { LinhaDoTempo } from './LinhaDoTempo';
import { ResumoAusencias } from './ResumoAusencias';
import { TabelaAusencias } from './TabelaAusencias';
import { useFiltros } from './useFiltros';

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-3 rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  );
}

export function AusenciasPage() {
  const { filtros, visao, dia, diasUteis, pagina, tamanho, ativos, atualizar, limpar } = useFiltros();
  const erroPeriodo = validarPeriodo(filtros.de, filtros.ate);
  const chave = [filtros.de, filtros.ate, filtros.colaboradores.join(','), filtros.gestor];
  const consulta = useQuery({
    queryKey: ['ausencias', ...chave],
    queryFn: () => ausenciasApi.listar(filtros),
    enabled: !erroPeriodo,
  });
  const dados = consulta.data;
  // O resumo usa todos os dias úteis do período, não só os que têm ausência.
  const resumo = useMemo(() => (dados ? resumir(dados.ausencias, dados.pessoas.length, diasUteisEntre(filtros.de, filtros.ate).length) : undefined), [dados, filtros.de, filtros.ate]);
  const periodo = erroPeriodo ? 'Período inválido' : `${formatarDiaMes(filtros.de)} a ${formatarDiaMes(filtros.ate)}`;
  const carregando = !erroPeriodo && consulta.isPending;

  let conteudo;
  if (erroPeriodo) {
    conteudo = <EmptyState title="Ajuste o período" description={erroPeriodo} />;
  } else if (consulta.isPending) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  } else if (dados!.pessoas.length === 0 || dados!.ausencias.length === 0) {
    conteudo = (
      <EmptyState
        title={`Nenhuma ausência entre ${formatarDiaMes(filtros.de)} e ${formatarDiaMes(filtros.ate)}.`}
        description={ativos > 0 ? 'Tente outro período ou mude os filtros.' : undefined}
        action={ativos > 0 ? <Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button> : undefined}
      />
    );
  } else if (visao === 'tabela') {
    conteudo = <TabelaAusencias ausencias={dados!.ausencias} pagina={pagina} tamanho={tamanho} aoMudarPagina={(p, t) => atualizar({ pagina: String(p), tamanho: String(t) })} />;
  } else {
    conteudo = <LinhaDoTempo pessoas={dados!.pessoas} ausencias={dados!.ausencias} dia={dia} diasUteis={diasUteis} aoMudarDia={(d) => atualizar({ dia: d })} />;
  }

  const podeAlternar = !erroPeriodo && !consulta.isPending && !consulta.isError && (dados?.ausencias.length ?? 0) > 0;

  return (
    <Pagina
      titulo="Ausências"
      descricao="Períodos em que cada pessoa esteve longe da estação durante a jornada, por dia."
      acoes={podeAlternar ? (
        <Button variant="secondary" aria-pressed={visao === 'tabela'} onClick={() => atualizar({ visao: visao === 'tabela' ? 'linha' : 'tabela' })}>
          {visao === 'tabela' ? 'Ver linha do tempo' : 'Ver como tabela'}
        </Button>
      ) : undefined}
    >
      <FiltrosBarra filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      <ResumoAusencias resumo={erroPeriodo ? undefined : resumo} totalPessoas={dados?.pessoas.length ?? 0} periodo={periodo} carregando={carregando} />
      <div aria-busy={consulta.isFetching || undefined} className="grid min-w-0 gap-4">{conteudo}</div>
    </Pagina>
  );
}
