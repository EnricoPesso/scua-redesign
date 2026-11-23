import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { OPCOES_DIRETORIAS, OPCOES_GESTORES } from '../../../mock/diretorio';
import { pessoasVisiveis } from '../../../lib/visibilidade';
import { usePermissoes } from '../../extensoes/hooks/queries';
import { previsaoApi, type LinhaPrevisao } from '../api';
import { filtrarPrevisoes, resumirPrevisoes, ROTULO_NIVEL } from '../domain/previsao';
import { FaixaDeDias, STATUS_BADGE } from './FaixaDeDias';
import { PainelPessoa } from './PainelPessoa';
import { useFiltros, type ChaveFiltro } from './useFiltros';

const ALVO = 'max-md:[&_[role=combobox]]:h-11 max-md:[&_button]:h-11';
const GESTORES = [{ value: 'todos', label: 'Todos os gestores' }, ...OPCOES_GESTORES];
const DIRETORIAS = [{ value: 'todos', label: 'Todas as diretorias' }, ...OPCOES_DIRETORIAS];
const NIVEIS = [
  { value: 'todos', label: 'Todos os níveis' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: 'Baixo' },
];
const PERIODO = 'Próximos 7 dias';

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-3">
      {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}
    </div>
  );
}

function Filtros({ filtros, ativos, atualizar, limpar }: Pick<ReturnType<typeof useFiltros>, 'filtros' | 'ativos' | 'atualizar' | 'limpar'>) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const mudar = (chave: ChaveFiltro) => (v: string | null) => atualizar({ [chave]: v && v !== 'todos' ? v : '' });
  return (
    <div className="grid gap-3">
      {/* Celular (< 768px): os filtros ficam num painel que expande abaixo deste botão. */}
      <Button variant="secondary" className="justify-self-start max-md:h-11 md:hidden" aria-expanded={aberto} aria-controls={idPainel} onClick={() => setAberto((a) => !a)}>
        Filtros{ativos > 0 ? ` (${ativos})` : ''}
      </Button>
      <div id={idPainel} className={cn('grid gap-3 md:flex md:flex-wrap md:items-end', !aberto && 'max-md:hidden')}>
        <Select label="Gestor" options={GESTORES} value={filtros.gestor || 'todos'} onValueChange={mudar('gestor')} className={cn('w-full md:w-52', ALVO)} />
        <Select label="Diretoria" options={DIRETORIAS} value={filtros.diretoria || 'todos'} onValueChange={mudar('diretoria')} className={cn('w-full md:w-52', ALVO)} />
        <Select label="Nível de risco" options={NIVEIS} value={filtros.nivel || 'todos'} onValueChange={mudar('nivel')} className={cn('w-full md:w-48', ALVO)} />
        {ativos > 0 && <Button variant="ghost" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>}
      </div>
    </div>
  );
}

function ItemPessoa({ linha, aoAbrir }: { linha: LinhaPrevisao; aoAbrir: () => void }) {
  const nivel = linha.nivel!;
  return (
    <li className="grid min-w-0 gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)] md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-5">
      <div className="grid min-w-0 content-start gap-1.5">
        <button
          type="button"
          onClick={aoAbrir}
          aria-label={`Ver a previsão de ${linha.nome}`}
          className="min-h-11 w-fit max-w-full rounded-sm text-left text-base font-bold text-[var(--color-brand-text)] underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring md:min-h-0"
        >
          <span className="truncate">{linha.nome}</span>
        </button>
        <p className="text-sm text-muted-foreground">{linha.diretoria}{linha.gestorNome ? ` · gestor: ${linha.gestorNome}` : ''}</p>
        <p><Badge status={STATUS_BADGE[nivel]}>Risco {ROTULO_NIVEL[nivel].toLowerCase()}</Badge></p>
      </div>
      <div className="grid min-w-0 gap-2">
        <FaixaDeDias dias={linha.dias} rotulo={`Próximos 7 dias de ${linha.nome}`} />
        <p className="text-sm text-foreground">{linha.motivoPrincipal}</p>
      </div>
    </li>
  );
}

export function PrevisaoPage() {
  const { filtros, ativos, pessoaAberta, atualizar, limpar, abrir } = useFiltros();
  const permissoes = usePermissoes();
  const consulta = useQuery({
    queryKey: ['previsao', permissoes.data?.usuario.id],
    queryFn: () => previsaoApi.listar(pessoasVisiveis(permissoes.data!)),
    enabled: !!permissoes.data,
  });
  const todas = consulta.data;
  const lista = useMemo(() => (todas ? filtrarPrevisoes(todas, filtros) : []), [todas, filtros]);
  const resumo = useMemo(() => resumirPrevisoes(lista), [lista]);
  const semRisco = todas ? todas.filter((l) => l.nivel === null).length : 0;
  const aberta = pessoaAberta && todas ? todas.find((l) => l.pessoaId === pessoaAberta) : undefined;
  const carregando = consulta.isPending;

  let conteudo;
  if (carregando) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  } else if (lista.length === 0) {
    conteudo = (
      <EmptyState
        title={ativos > 0 ? 'Ninguém com esse filtro tem risco previsto.' : 'Nenhum risco previsto para os próximos 7 dias.'}
        description={ativos > 0 ? 'Tente outro gestor, diretoria ou nível.' : 'Ninguém deve passar das regras de jornada nesta semana.'}
        action={ativos > 0 ? <Button variant="secondary" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button> : undefined}
      />
    );
  } else {
    conteudo = (
      <>
        <ul aria-label="Pessoas com risco previsto" className="grid gap-3">
          {lista.map((l) => <ItemPessoa key={l.pessoaId} linha={l} aoAbrir={() => abrir(l.pessoaId)} />)}
        </ul>
        {semRisco > 0 && ativos === 0 && <p className="text-sm text-muted-foreground">{semRisco} {semRisco === 1 ? 'pessoa' : 'pessoas'} sem risco previsto nos próximos 7 dias.</p>}
      </>
    );
  }

  return (
    <Pagina titulo="Previsão de jornada" descricao="Quem deve estourar a jornada nos próximos 7 dias, avisado antes de acontecer.">
      <section aria-label="Resumo da semana" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Pessoas em risco alto" value={resumo.pessoasEmRiscoAlto} period={PERIODO} loading={carregando} />
        <KpiCard label="Regras em risco" value={resumo.regrasEmRisco} period={PERIODO} loading={carregando} />
        <KpiCard label="Horas extras previstas" value={Math.round((resumo.extraMin / 60) * 10) / 10} decimals={1} unit="h" period={PERIODO} loading={carregando} />
        <KpiCard label="Custo previsto (R$)" value={Math.round(resumo.custo)} period={PERIODO} loading={carregando} />
      </section>
      <Filtros filtros={filtros} ativos={ativos} atualizar={atualizar} limpar={limpar} />
      <div aria-busy={consulta.isFetching || undefined} className="grid min-w-0 gap-3">
        <p className="text-sm text-muted-foreground">Projeção feita a partir dos últimos dias registrados. É uma estimativa.</p>
        {conteudo}
      </div>
      {aberta && <PainelPessoa linha={aberta} aoFechar={() => abrir(null)} />}
    </Pagina>
  );
}
