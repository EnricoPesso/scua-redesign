import { useId, useState, type ReactNode } from 'react';
import { PencilIcon } from 'lucide-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { DateField } from '@/components/ui/date-field';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../../componentes/EstadoErro';
import { Pagina } from '../../componentes/Pagina';
import { hoje } from '../../mock/datas';
import { formatarDuracao } from '../extensoes/domain/horas';
import type { Status } from '../extensoes/domain/types';
import { usePermissoes } from '../extensoes/hooks/queries';
import { inicioApi } from './api';
import { agruparParaExibir, BLOCOS_PADRAO, chaveDaPreferencia, infoDoBloco, lerIdRelatorio, sanitizarPreferencia } from './blocos';
import { BlocoResumoDoDia } from './BlocoResumoDoDia';
import { BlocoAusentes, BlocoFerias, BlocoForaDaJornada, BlocoIndicador, BlocoParados } from './BlocosNovos';
import { PersonalizarInicio } from './PersonalizarInicio';
import {
  ATALHOS, fraseDoPeriodo, larguraDaBarra, lerPeriodo, mesCurto, nomeDoMes, resumirHistorico, textoDoPeriodo, totalDePedidos,
  type Atalho, type ContagemPorStatus, type MesDoHistorico, type Periodo,
} from './domain';

/** O texto do período sai em minúsculas ("hoje, 12/10") e aparece com a primeira letra maiúscula no cartão. */
const PRIMEIRA_MAIUSCULA = '[&>p:last-child]:first-letter:uppercase';
const KPI_SUPERFICIE = 'rounded-none border-0 bg-transparent px-5 py-4 shadow-none';
const CARTAO = 'grid min-w-0 content-start gap-5 border-t border-[var(--color-line)] pt-6';

function Cartao({ titulo, periodo, acoes, children }: { titulo: string; periodo: string; acoes?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={CARTAO}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id={id} className="text-base font-semibold tracking-tight text-foreground">{titulo}</h2>
          {/* O período fica sempre à vista: o sistema atual mostrava números sem dizer de quando eram. */}
          <p className="text-xs text-muted-foreground first-letter:uppercase">{periodo}</p>
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-sm text-muted-foreground">{children}</p>;
}

const Carregando = ({ rotulo }: { rotulo: string }) => (
  <div role="status" aria-label={rotulo} className="grid gap-3">
    <Skeleton className="h-6" />
    <Skeleton className="h-6 w-4/5" />
    <Skeleton className="h-6 w-3/5" />
  </div>
);

/** Carregando, erro ou o conteúdo de um bloco do painel. */
function Bloco<T>({ consulta, rotulo, children }: { consulta: UseQueryResult<T>; rotulo: string; children: (dados: T) => ReactNode }) {
  if (consulta.isPending) return <Carregando rotulo={rotulo} />;
  if (consulta.isError) return <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  return <>{children(consulta.data)}</>;
}

// Status é "estado": cor reservada + rótulo em texto + valor escrito, nunca só a cor.
const STATUS: { chave: Status; rotulo: string; cor: string }[] = [
  { chave: 'pendente', rotulo: 'Pendentes', cor: 'bg-[#d97706] dark:bg-[var(--color-warning-text)]' },
  { chave: 'aprovado', rotulo: 'Aprovados', cor: 'bg-[#16a34a] dark:bg-[var(--color-success-text)]' },
  { chave: 'reprovado', rotulo: 'Reprovados', cor: 'bg-[#dc2626] dark:bg-[var(--color-danger)]' },
  { chave: 'cancelado', rotulo: 'Cancelados', cor: 'bg-[#94a3b8] dark:bg-[var(--color-line-strong)]' },
];

function BarrasPorStatus({ contagem, periodo }: { contagem: ContagemPorStatus; periodo: string }) {
  const total = totalDePedidos(contagem);
  if (total === 0) return <Vazio>Nenhum pedido de extensão {periodo}.</Vazio>;
  const maior = Math.max(...STATUS.map((s) => contagem[s.chave]));
  return (
    <div className="grid gap-3">
      <ul className="grid gap-3" aria-label={`Pedidos por status, ${periodo}`}>
        {STATUS.map((s) => (
          <li key={s.chave} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="text-foreground">{s.rotulo}</span>
            <span aria-hidden="true" className="h-3 rounded-sm bg-[var(--color-neutral-bg)]">
              <span className={cn('block h-full rounded-sm', s.cor)} style={{ width: `${larguraDaBarra(contagem[s.chave], maior)}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-foreground">{contagem[s.chave]}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Total: <strong className="text-foreground">{total} {total === 1 ? 'pedido' : 'pedidos'}</strong></p>
    </div>
  );
}

function Historico({ meses }: { meses: MesDoHistorico[] }) {
  const resumo = resumirHistorico(meses);
  if (!resumo.pico) return <Vazio>Nenhuma hora de extensão aprovada nesses meses.</Vazio>;
  const maior = resumo.pico.minutos;
  return (
    <div className="grid gap-4">
      {/* Uma série só, um matiz: a cor não precisa de legenda. O valor vai escrito em cima de cada coluna. */}
      <ol aria-label="Horas aprovadas por mês" className="grid h-44 grid-flow-col auto-cols-fr items-end gap-2">
        {meses.map((m) => (
          <li key={m.mes} className="grid h-full grid-rows-[1fr_auto] gap-1 text-center" title={`${nomeDoMes(m.mes)}: ${formatarDuracao(m.minutos)}`}>
            <span className="flex flex-col justify-end gap-1">
              <span className="text-xs font-semibold tabular-nums text-foreground">{formatarDuracao(m.minutos)}</span>
              <span aria-hidden="true" className="mx-auto block w-full max-w-10 rounded-t-sm bg-[var(--color-brand)]" style={{ height: `${larguraDaBarra(m.minutos, maior)}%` }} />
            </span>
            <span className="border-t border-[var(--color-line)] pt-1 text-xs text-muted-foreground">
              <span aria-hidden="true">{mesCurto(m.mes)}</span>
              <span className="sr-only">{nomeDoMes(m.mes)}</span>
            </span>
          </li>
        ))}
      </ol>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-muted-foreground">Total</dt><dd className="font-bold text-foreground">{formatarDuracao(resumo.totalMin)}</dd></div>
        <div><dt className="text-muted-foreground">Média por mês</dt><dd className="font-bold text-foreground">{formatarDuracao(resumo.mediaMin)}</dd></div>
        <div><dt className="text-muted-foreground">Pico</dt><dd className="font-bold text-foreground">{formatarDuracao(resumo.pico.minutos)} <span className="font-normal text-muted-foreground">em {mesCurto(resumo.pico.mes)}</span></dd></div>
      </dl>
    </div>
  );
}

// pedir ao @PhLima07: controle segmentado (o sistema de design ainda não tem).
/** Período do resumo: atalhos (Hoje, Ontem, 7 dias, Este mês) ou um dia escolhido no calendário. */
function SeletorDePeriodo({ periodo, hoje, aoMudar }: { periodo: Periodo; hoje: string; aoMudar: (mudanca: { periodo?: Atalho; dia?: string }) => void }) {
  return (
    <div role="group" aria-label="Período do resumo" className="flex flex-wrap items-end gap-2.5 max-md:w-full">
      <div className="inline-flex flex-wrap rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-0.5 max-md:w-full">
        {ATALHOS.map((a) => (
          <button
            key={a.valor}
            type="button"
            aria-pressed={periodo.tipo === a.valor}
            onClick={() => aoMudar({ periodo: a.valor })}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-sm px-3 text-sm whitespace-nowrap transition-colors duration-[var(--dur-fast)] outline-none focus-visible:ring-3 focus-visible:ring-ring max-md:flex-1 max-md:px-2 md:min-h-8',
              periodo.tipo === a.valor ? 'bg-[var(--color-surface-muted)] font-semibold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground',
            )}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <DateField
        label="Escolher data"
        className="w-44 max-md:w-full max-md:[&_input]:h-11"
        max={hoje}
        value={periodo.tipo === 'dia' ? periodo.de : ''}
        onChange={(v) => { if (v) aoMudar({ dia: v }); }}
      />
    </div>
  );
}

/** Preferência de blocos de cada pessoa, guardada no navegador (no sistema real, vai para a API). */
function usePreferencia(usuarioId: string | undefined, permitido: (id: string) => boolean) {
  const chave = usuarioId ? chaveDaPreferencia(usuarioId) : null;
  const ler = () => {
    if (!chave) return BLOCOS_PADRAO.filter(permitido);
    let salvo: string | null = null;
    try {
      salvo = window.localStorage.getItem(chave);
    } catch {
      salvo = null;
    }
    return sanitizarPreferencia(salvo, permitido);
  };
  const [estado, setEstado] = useState(() => ({ chave, ids: ler() }));
  // Trocou de pessoa (ou as permissões chegaram): relê a preferência dela.
  if (estado.chave !== chave) setEstado({ chave, ids: ler() });
  const salvar = (ids: string[]) => {
    if (chave) {
      try {
        window.localStorage.setItem(chave, JSON.stringify(ids));
      } catch {
        // sem localStorage (modo privado): vale só até recarregar
      }
    }
    setEstado({ chave, ids });
  };
  return { ids: estado.ids, salvar };
}

export function InicioPage() {
  const permissoes = usePermissoes();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [personalizando, setPersonalizando] = useState(false);
  const dia = hoje();
  const periodo = lerPeriodo(params, dia);
  const texto = textoDoPeriodo(periodo);
  const chave = [periodo.de, periodo.ate];

  const podeAprovar = Boolean(permissoes.data?.podeAprovar);
  const permitido = (id: string) => !infoDoBloco(id)?.soQuemAprova || podeAprovar;
  const preferencia = usePreferencia(permissoes.data?.usuario.id, permitido);
  const ids = preferencia.ids;
  const usa = (...alvo: string[]) => alvo.some((id) => ids.includes(id));

  const resumo = useQuery({ queryKey: ['inicio', 'resumo', ...chave], queryFn: () => inicioApi.resumo(periodo), enabled: usa('aviso', 'kpi-usuarios', 'kpi-presentes', 'kpi-ausentes', 'kpi-horas') });
  const porStatus = useQuery({ queryKey: ['inicio', 'status', ...chave], queryFn: () => inicioApi.pedidosPorStatus(periodo), enabled: usa('status') });
  const historico = useQuery({ queryKey: ['inicio', 'historico'], queryFn: inicioApi.historico, enabled: usa('historico') });

  const r = resumo.data;
  const carregando = resumo.isPending;
  const primeiroNome = permissoes.data?.usuario.nome.split(' ')[0];
  const horas = (r?.minutosAprovados ?? 0) / 60;
  // Presença: o número do dia, ou a média por dia útil quando o período tem vários dias.
  const semExpediente = r !== undefined && r.presentes === null;
  const periodoPresenca = semExpediente ? `${texto}: fim de semana, sem expediente` : r && r.diasUteis > 1 ? `média por dia útil, ${texto}` : texto;
  const mudarPeriodo = (m: { periodo?: Atalho; dia?: string }) => {
    const n = new URLSearchParams();
    if (m.dia) n.set('dia', m.dia);
    else if (m.periodo && m.periodo !== 'hoje') n.set('periodo', m.periodo);
    setParams(n, { replace: true });
  };

  const KPIS_DO_RESUMO = ['kpi-usuarios', 'kpi-presentes', 'kpi-ausentes', 'kpi-horas'];
  const bloco = (id: string): ReactNode => {
    switch (id) {
      case 'resumo-dia':
        return <Cartao key={id} titulo="Resumo do dia" periodo="O que precisa de você hoje"><BlocoResumoDoDia /></Cartao>;
      case 'aviso':
        if (carregando) return <Skeleton key={id} className="h-[4.25rem] rounded-md max-md:h-[8rem]" />;
        if (!r || r.pendentesParaMim === 0) return null;
        return (
          <section key={id} aria-label="Para você resolver" className="flex flex-wrap items-center justify-between gap-4 border-l-2 border-[var(--color-brand)] bg-[var(--color-surface)] px-5 py-3.5">
            <p className="text-sm text-foreground">
              <strong>{r.pendentesParaMim} {r.pendentesParaMim === 1 ? 'pedido de extensão espera' : 'pedidos de extensão esperam'}</strong> a sua aprovação.
            </p>
            <Link to="/extensoes/aprovar" className={cn(buttonVariants(), 'max-md:h-11 max-md:w-full')}>Ver pedidos</Link>
          </section>
        );
      case 'kpi-usuarios':
        return <KpiCard key={id} className={KPI_SUPERFICIE} label="Usuários cadastrados" value={r?.usuarios ?? 0} period="Situação atual" loading={carregando} />;
      case 'kpi-presentes':
        return <KpiCard key={id} className={cn(KPI_SUPERFICIE, PRIMEIRA_MAIUSCULA)} label="Presentes" value={r?.presentes ?? 0} period={periodoPresenca} loading={carregando} empty={semExpediente} />;
      case 'kpi-ausentes':
        return <KpiCard key={id} className={cn(KPI_SUPERFICIE, PRIMEIRA_MAIUSCULA)} label="Ausentes" value={r?.ausentes ?? 0} period={periodoPresenca} loading={carregando} empty={semExpediente} />;
      case 'kpi-horas':
        return <KpiCard key={id} className={cn(KPI_SUPERFICIE, PRIMEIRA_MAIUSCULA)} label="Horas de extensão aprovadas" value={horas} decimals={Number.isInteger(horas) ? 0 : 1} unit="h" period={texto} loading={carregando} />;
      case 'status':
        return (
          <Cartao key={id} titulo="Pedidos de extensão por status" periodo={`Pedidos feitos ${texto}`}>
            <div className="min-h-[11.5rem]">
              <Bloco consulta={porStatus} rotulo="Carregando pedidos por status">
                {(contagem) => <BarrasPorStatus contagem={contagem} periodo={texto} />}
              </Bloco>
            </div>
            <Link to="/extensoes" className="w-fit rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-[var(--color-brand-text)] hover:underline focus-visible:ring-3 focus-visible:ring-ring max-md:inline-flex max-md:min-h-11 max-md:items-center">
              Abrir extensões de jornada
            </Link>
          </Cartao>
        );
      case 'historico':
        return (
          <Cartao key={id} titulo="Horas de extensão aprovadas por mês" periodo="Últimos 6 meses">
            <div className="min-h-[15.5rem]">
              <Bloco consulta={historico} rotulo="Carregando histórico">
                {(meses) => <Historico meses={meses} />}
              </Bloco>
            </div>
          </Cartao>
        );
      case 'ausentes':
        return <Cartao key={id} titulo="Quem mais esteve ausente" periodo={texto}><BlocoAusentes periodo={periodo} /></Cartao>;
      case 'parados':
        return <Cartao key={id} titulo="Pedidos parados" periodo="Esperando a sua decisão, os mais antigos primeiro"><BlocoParados /></Cartao>;
      case 'fora-jornada':
        return <Cartao key={id} titulo="Acessos fora da jornada" periodo={texto}><BlocoForaDaJornada periodo={periodo} /></Cartao>;
      case 'ferias':
        return <Cartao key={id} titulo="Próximas férias" periodo="Nos próximos 30 dias"><BlocoFerias /></Cartao>;
      default: {
        const rel = lerIdRelatorio(id);
        return rel ? <BlocoIndicador key={id} slug={rel.slug} indice={rel.indice} periodo={periodo} /> : null;
      }
    }
  };

  const grupos = agruparParaExibir(ids);

  return (
    <Pagina
      titulo="Início"
      descricao={`Olá${primeiroNome ? `, ${primeiroNome}` : ''}. Este é o resumo ${fraseDoPeriodo(periodo)}.`}
      acoes={(
        <div className="flex flex-wrap items-end gap-2 max-md:w-full">
          <SeletorDePeriodo periodo={periodo} hoje={dia} aoMudar={mudarPeriodo} />
          <Button variant="secondary" size="icon" className="max-md:h-11 max-md:w-full" aria-label="Personalizar início" title="Personalizar início" onClick={() => setPersonalizando(true)}>
            <PencilIcon aria-hidden="true" />
          </Button>
        </div>
      )}
    >
      {ids.length === 0 && (
        <EmptyState
          title="Seu início está vazio"
          description="Escolha os blocos que você quer ver aqui: indicadores, gráficos e qualquer número dos relatórios."
          action={<Button className="max-md:h-11" onClick={() => setPersonalizando(true)}><PencilIcon aria-hidden="true" />Escolher blocos</Button>}
        />
      )}

      {grupos.map((g, i) => {
        const chaveGrupo = `${g.tipo}-${i}-${g.ids.join(',')}`;
        if (g.tipo === 'aviso') return <div key={chaveGrupo}>{g.ids.map(bloco)}</div>;
        if (g.tipo === 'kpi') {
          // Se o resumo falhou, um aviso só no lugar dos indicadores que dependem dele.
          if (resumo.isError && g.ids.some((id) => KPIS_DO_RESUMO.includes(id))) {
            return (
              <div key={chaveGrupo} className="grid gap-4">
                <EstadoErro erro={resumo.error} aoTentar={() => void resumo.refetch()} />
                {g.ids.some((id) => !KPIS_DO_RESUMO.includes(id)) && (
                  <div className="grid grid-cols-2 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] bg-[var(--color-surface)] sm:divide-y-0 sm:divide-x lg:grid-cols-4">{g.ids.filter((id) => !KPIS_DO_RESUMO.includes(id)).map(bloco)}</div>
                )}
              </div>
            );
          }
          return <div key={chaveGrupo} className="grid grid-cols-2 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] bg-[var(--color-surface)] sm:divide-y-0 sm:divide-x lg:grid-cols-4">{g.ids.map(bloco)}</div>;
        }
        return <div key={chaveGrupo} className="grid gap-x-10 gap-y-8 lg:grid-cols-2">{g.ids.map(bloco)}</div>;
      })}

      {personalizando && (
        <PersonalizarInicio
          atuais={ids}
          permitido={permitido}
          aoFechar={() => setPersonalizando(false)}
          aoSalvar={(novos) => {
            preferencia.salvar(novos);
            setPersonalizando(false);
            toast.success('Início personalizado.');
          }}
        />
      )}
    </Pagina>
  );
}
