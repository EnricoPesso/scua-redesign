import { useId, type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { buttonVariants } from '@/components/ui/button-variants';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EstadoErro } from '../../componentes/EstadoErro';
import { Pagina } from '../../componentes/Pagina';
import { hoje } from '../../mock/datas';
import { formatarDuracao } from '../extensoes/domain/horas';
import type { Status } from '../extensoes/domain/types';
import { usePermissoes } from '../extensoes/hooks/queries';
import { inicioApi } from './api';
import {
  ehJanela, JANELAS, larguraDaBarra, mesCurto, nomeDoMes, resumirHistorico, textoDaJanela, totalDePedidos,
  type ContagemPorStatus, type Janela, type MesDoHistorico,
} from './domain';

const CARTAO = 'grid min-w-0 content-start gap-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]';

function Cartao({ titulo, periodo, acoes, children }: { titulo: string; periodo: string; acoes?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={CARTAO}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id={id} className="text-base font-bold text-foreground">{titulo}</h2>
          {/* O período fica sempre à vista: o sistema atual mostrava números sem dizer de quando eram. */}
          <p className="text-sm text-muted-foreground first-letter:uppercase">{periodo}</p>
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
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
  { chave: 'pendente', rotulo: 'Pendentes', cor: 'bg-[var(--color-warning-text)]' },
  { chave: 'aprovado', rotulo: 'Aprovados', cor: 'bg-[var(--color-success-text)]' },
  { chave: 'reprovado', rotulo: 'Reprovados', cor: 'bg-[var(--color-danger)]' },
  { chave: 'cancelado', rotulo: 'Cancelados', cor: 'bg-[var(--color-line-strong)]' },
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
function SeletorDeJanela({ valor, aoMudar }: { valor: Janela; aoMudar: (j: Janela) => void }) {
  return (
    <div role="group" aria-label="Período do gráfico" className="inline-flex rounded-md border border-input p-0.5">
      {JANELAS.map((j) => (
        <button
          key={j.valor}
          type="button"
          aria-pressed={j.valor === valor}
          onClick={() => aoMudar(j.valor)}
          className={cn(
            'inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring md:min-h-9',
            j.valor === valor ? 'bg-[var(--color-surface-muted)] text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {j.rotulo}
        </button>
      ))}
    </div>
  );
}

export function InicioPage() {
  const permissoes = usePermissoes();
  const [params, setParams] = useSearchParams();
  const bruto = params.get('periodo');
  const janela: Janela = ehJanela(bruto) ? bruto : '7dias';
  const dia = hoje();

  const resumo = useQuery({ queryKey: ['inicio', 'resumo'], queryFn: inicioApi.resumo });
  const porStatus = useQuery({ queryKey: ['inicio', 'status', janela], queryFn: () => inicioApi.pedidosPorStatus(janela) });
  const historico = useQuery({ queryKey: ['inicio', 'historico'], queryFn: inicioApi.historico });

  const r = resumo.data;
  const carregando = resumo.isPending;
  const primeiroNome = permissoes.data?.usuario.nome.split(' ')[0];
  const mes = r ? `em ${nomeDoMes(r.mes)}` : '';
  const horas = (r?.minutosAprovadosNoMes ?? 0) / 60;
  const periodoDaJanela = textoDaJanela(janela, dia);

  return (
    <Pagina titulo="Início" descricao={primeiroNome ? `Olá, ${primeiroNome}. Este é o resumo de hoje, ${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}.` : undefined}>
      {permissoes.data?.podeAprovar && r && r.pendentesParaMim > 0 && (
        <section aria-label="Para você resolver" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-sm text-foreground">
            <strong>{r.pendentesParaMim} {r.pendentesParaMim === 1 ? 'pedido de extensão espera' : 'pedidos de extensão esperam'}</strong> a sua aprovação.
          </p>
          <Link to="/extensoes/aprovar" className={cn(buttonVariants(), 'max-md:h-11 max-md:w-full')}>Ver pedidos</Link>
        </section>
      )}

      {resumo.isError ? (
        <EstadoErro erro={resumo.error} aoTentar={() => void resumo.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Usuários cadastrados" value={r?.usuarios ?? 0} period="Situação atual" loading={carregando} />
          <KpiCard label="Presentes" value={r?.presentes ?? 0} period="Agora" loading={carregando} />
          <KpiCard label="Ausentes" value={r?.ausentes ?? 0} period="Agora" loading={carregando} />
          <KpiCard
            className="[&>p:last-child]:first-letter:uppercase"
            label="Horas de extensão aprovadas"
            value={horas}
            decimals={Number.isInteger(horas) ? 0 : 1}
            unit="h"
            period={mes}
            loading={carregando}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Cartao
          titulo="Pedidos de extensão por status"
          periodo={`Pedidos feitos ${periodoDaJanela}`}
          acoes={<SeletorDeJanela valor={janela} aoMudar={(j) => setParams((p) => { const n = new URLSearchParams(p); n.set('periodo', j); return n; }, { replace: true })} />}
        >
          <Bloco consulta={porStatus} rotulo="Carregando pedidos por status">
            {(contagem) => <BarrasPorStatus contagem={contagem} periodo={periodoDaJanela} />}
          </Bloco>
          <Link to="/extensoes" className="w-fit rounded-sm text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring max-md:inline-flex max-md:min-h-11 max-md:items-center">
            Abrir extensões de jornada
          </Link>
        </Cartao>

        <Cartao titulo="Horas de extensão aprovadas por mês" periodo="Últimos 6 meses">
          <Bloco consulta={historico} rotulo="Carregando histórico">
            {(meses) => <Historico meses={meses} />}
          </Bloco>
        </Cartao>
      </div>
    </Pagina>
  );
}
