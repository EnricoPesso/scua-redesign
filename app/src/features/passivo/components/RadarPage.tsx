import { useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { TAMANHOS_PAGINA } from '../../../componentes/Paginacao';
import { emHoras, emReais } from '../../../lib/conformidade';
import { dia, hoje } from '../../../mock/datas';
import { OPCOES_DIRETORIAS, PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import type { ColunaPlanilha } from '@/lib/planilha';
import { pessoasVisiveis } from '../../../lib/visibilidade';
import { usePermissoes } from '../../extensoes/hooks/queries';
import { radarApi } from '../api';
import { calcularRadar, lerAlvo, PERIODO_PADRAO, PERIODOS, principaisGestores, type LinhaDoRanking, type Periodo } from '../domain/radar';
import { ComoCalculamos } from './ComoCalculamos';
import { DetalheRadar } from './DetalheRadar';
import { Barras, Cartao, ddmm, EvolucaoSemanal } from './Graficos';
import { RankingPessoas } from './RankingPessoas';
import { useParametrosDeCusto } from './useParametrosDeCusto';

const OPCOES_PERIODO = PERIODOS.map((p) => ({ value: String(p), label: `Últimos ${p} dias` }));
const OPCOES_DIRETORIA = [{ value: 'todas', label: 'Todas as diretorias' }, ...OPCOES_DIRETORIAS];
const DIRETORIAS_VALIDAS = new Set<string>(OPCOES_DIRETORIAS.map((o) => o.value));
const ALVO = 'max-md:[&_button]:h-11';
const valorEmTexto = (v: number) => v.toFixed(2).replace('.', ',');

const COLUNAS_PLANILHA: ColunaPlanilha<LinhaDoRanking>[] = [
  { header: 'Pessoa', texto: (l) => l.nome },
  { header: 'Diretoria', texto: (l) => l.diretoria },
  { header: 'Gestor', texto: (l) => l.gestorNome },
  { header: 'Ocorrências', texto: (l) => String(l.ocorrencias) },
  { header: 'Horas sem aprovação', texto: (l) => emHoras(l.minutosSemAprovacao) },
  { header: 'Em risco (R$)', texto: (l) => valorEmTexto(l.custo) },
  { header: 'Evitado pelo bloqueio (R$)', texto: (l) => valorEmTexto(l.evitado) },
];

function Indicador({ rotulo, valor, ajuda }: { rotulo: string; valor: ReactNode; ajuda: string }) {
  return (
    <div role="group" aria-label={rotulo} className="grid content-start gap-1 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)]">
      <p className="text-sm font-semibold text-muted-foreground">{rotulo}</p>
      <p className="text-xl font-bold tabular-nums text-foreground">{valor}</p>
      <p className="text-xs text-muted-foreground">{ajuda}</p>
    </div>
  );
}

function Destaque({ titulo, valor, texto, cor, icone }: { titulo: string; valor: string; texto: string; cor: 'perigo' | 'sucesso'; icone: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={titulo}
      className={cn(
        'grid content-start gap-2 rounded-lg border border-border p-5 shadow-[var(--shadow-1)]',
        cor === 'perigo' ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
      )}
    >
      <p className="flex items-center gap-2 text-sm font-bold">{icone}{titulo}</p>
      <p className="text-2xl font-bold tabular-nums">{valor}</p>
      <p className="text-sm">{texto}</p>
    </div>
  );
}

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function RadarPage() {
  const [params, setParams] = useSearchParams();
  const { parametros, alterar, voltarAoPadrao } = useParametrosDeCusto();

  const dias = Number(params.get('dias'));
  const periodo: Periodo = (PERIODOS as readonly number[]).includes(dias) ? (dias as Periodo) : PERIODO_PADRAO;
  const diretoriaUrl = params.get('diretoria') ?? '';
  const diretoria = DIRETORIAS_VALIDAS.has(diretoriaUrl) ? diretoriaUrl : '';
  const alvo = lerAlvo(params.get('abrir'));
  const tamanhoUrl = Number(params.get('tamanho'));
  const tamanho = TAMANHOS_PAGINA.includes(tamanhoUrl) ? tamanhoUrl : 10;
  const paginaUrl = Number(params.get('pagina'));

  const atualizar = useCallback((mudancas: Record<string, string>, opcoes?: { replace?: boolean }) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === '') novo.delete(chave);
        else novo.set(chave, valor);
      }
      if (!('pagina' in mudancas) && !('abrir' in mudancas)) novo.delete('pagina');
      return novo;
    }, { replace: opcoes?.replace ?? true });
  }, [setParams]);

  const permissoes = usePermissoes();
  const consulta = useQuery({
    queryKey: ['radar', periodo, permissoes.data?.usuario.id],
    queryFn: () => radarApi.carregar(periodo, pessoasVisiveis(permissoes.data!)),
    enabled: !!permissoes.data,
  });
  const resumo = useMemo(
    () => (consulta.data ? calcularRadar({ dias: consulta.data.dias, custoHora: consulta.data.custoHora, pessoas: PESSOAS_DIRETORIO, parametros, diretoria }) : undefined),
    [consulta.data, parametros, diretoria],
  );

  const textoPeriodo = `${ddmm(dia(-periodo))} a ${ddmm(dia(-1))}`;
  const ultima = Math.max(1, Math.ceil((resumo?.ranking.length ?? 0) / tamanho));
  const pagina = Number.isInteger(paginaUrl) && paginaUrl >= 1 ? Math.min(paginaUrl, ultima) : 1;
  const abrir = (tipo: 'gestor' | 'pessoa', id: string) => atualizar({ abrir: `${tipo}:${id}` }, { replace: false });
  const fechar = () => atualizar({ abrir: '' });

  let conteudo: ReactNode;
  if (consulta.isPending) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  } else if (resumo) {
    const r = resumo;
    const gestores = principaisGestores(r);
    conteudo = (
      <>
        <section aria-label="Resumo do período" className="grid min-w-0 gap-4">
          <p className="max-w-3xl text-base text-foreground">
            Neste período o Scua evitou <strong>{emReais(r.evitado, true)}</strong> em hora extra não autorizada. Ainda há{' '}
            <strong>{emReais(r.emRisco, true)}</strong> em risco
            {gestores.length > 0 ? <>, e é {gestores.length === 1 ? 'neste gestor' : `nestes ${gestores.length} gestores`}: <strong>{gestores.map((g) => g.nome).join(', ')}</strong>.</> : '.'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Destaque
              titulo="Em risco"
              valor={emReais(r.emRisco, true)}
              texto={`Estimativa do que pode virar passivo trabalhista, de ${textoPeriodo}.`}
              cor="perigo"
              icone={<TriangleAlertIcon aria-hidden="true" className="size-5" />}
            />
            <Destaque
              titulo="Evitado pelo bloqueio"
              valor={emReais(r.evitado, true)}
              texto="Hora extra que não aconteceu porque o Scua barrou o uso fora da jornada."
              cor="sucesso"
              icone={<ShieldCheckIcon aria-hidden="true" className="size-5" />}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Indicador rotulo="Horas sem aprovação" valor={emHoras(r.minutosSemAprovacao)} ajuda="Trabalho além da jornada sem pedido aprovado" />
            <Indicador rotulo="Pessoas envolvidas" valor={r.pessoasEnvolvidas} ajuda="Com pelo menos uma ocorrência" />
            <Indicador rotulo="Tentativas barradas" valor={r.tentativasBarradas} ajuda="Usos fora da jornada que o bloqueio impediu" />
          </div>
          <p className="text-xs text-muted-foreground">
            Valores estimados a partir dos registros do Scua e do custo-hora informado. Não substitui o cálculo da folha nem uma avaliação jurídica.
          </p>
        </section>

        {r.ocorrencias.length === 0 ? (
          <EmptyState
            title="Nenhuma ocorrência neste período."
            description={diretoria ? 'Não há valor em risco nessa diretoria. Tente outro período ou veja todas as diretorias.' : 'Nada fugiu das regras de jornada. Tente um período maior.'}
            action={diretoria ? <Button variant="secondary" className="max-md:h-11" onClick={() => atualizar({ diretoria: '' })}>Ver todas as diretorias</Button> : undefined}
          />
        ) : (
          <>
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <Cartao titulo="Em risco por regra" descricao="Cada regra com a sua base legal.">
                <Barras rotulo="Valor em risco por regra" itens={r.porRegra.map((x) => ({ chave: x.regra, nome: x.titulo, detalhe: x.base, valor: x.custo }))} />
              </Cartao>
              <Cartao titulo="Evolução por semana" descricao="Valor em risco em cada semana do período.">
                <EvolucaoSemanal semanas={r.porSemana} />
              </Cartao>
              <Cartao titulo="Em risco por gestor" descricao="Clique num gestor para ver as ocorrências da equipe.">
                <Barras rotulo="Valor em risco por gestor" itens={r.porGestor.map((g) => ({ chave: g.gestorId, nome: g.nome, valor: g.custo, aoClicar: () => abrir('gestor', g.gestorId) }))} />
              </Cartao>
              <Cartao titulo="Em risco por diretoria">
                <Barras rotulo="Valor em risco por diretoria" itens={r.porDiretoria.map((d) => ({ chave: d.diretoria, nome: d.diretoria, valor: d.custo }))} />
              </Cartao>
            </div>

            <section aria-labelledby="titulo-ranking" className="grid min-w-0 gap-3">
              <h2 id="titulo-ranking" className="text-base font-bold text-foreground">Pessoas com mais valor em risco</h2>
              <RankingPessoas
                linhas={r.ranking}
                pagina={pagina}
                tamanho={tamanho}
                aoMudarPagina={(p, t) => atualizar({ pagina: String(p), tamanho: String(t) })}
                aoAbrir={(id) => abrir('pessoa', id)}
              />
            </section>
          </>
        )}
      </>
    );
  }

  return (
    <Pagina
      titulo="Radar de passivo"
      descricao="Quanto o risco trabalhista custa, quanto o bloqueio já evitou e onde agir primeiro."
      acoes={(
        <BotaoExportar
          arquivo={`radar-de-passivo-${hoje()}`}
          colunas={COLUNAS_PLANILHA}
          linhas={resumo?.ranking ?? []}
          desabilitado={consulta.isPending || consulta.isError}
        />
      )}
    >
      <div className="flex flex-wrap items-end gap-3 max-md:grid">
        <Select
          label="Período"
          options={OPCOES_PERIODO}
          value={String(periodo)}
          onValueChange={(v) => v && atualizar({ dias: v === String(PERIODO_PADRAO) ? '' : v })}
          className={cn('w-full md:w-48', ALVO)}
        />
        <Select
          label="Diretoria"
          options={OPCOES_DIRETORIA}
          value={diretoria || 'todas'}
          onValueChange={(v) => atualizar({ diretoria: v && v !== 'todas' ? v : '' })}
          className={cn('w-full md:w-56', ALVO)}
        />
        <p className="pb-2.5 text-sm text-muted-foreground max-md:pb-0">Dias fechados, de {textoPeriodo}.</p>
      </div>

      <div aria-busy={consulta.isFetching || undefined} className="grid min-w-0 gap-6">{conteudo}</div>

      <ComoCalculamos parametros={parametros} alterar={alterar} voltarAoPadrao={voltarAoPadrao} />

      {alvo && resumo && <DetalheRadar alvo={alvo} resumo={resumo} aoFechar={fechar} />}
    </Pagina>
  );
}
