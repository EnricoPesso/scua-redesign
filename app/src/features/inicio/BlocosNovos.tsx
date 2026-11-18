import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { KpiCard } from '@/components/ui/kpi-card';
import { RELATORIOS } from '../relatorios/catalogo';
import { formatarDuracao } from '../extensoes/domain/horas';
import { tempoDesde } from '../extensoes/domain/formatacao';
import { EstadoErro } from '../../componentes/EstadoErro';
import { inicioApi } from './api';
import { textoDoPeriodo, type Periodo } from './domain';

const LINK = 'w-fit rounded-sm text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring max-md:inline-flex max-md:min-h-11 max-md:items-center';
const ITEM = 'flex min-h-11 items-center justify-between gap-3 border-b border-[var(--color-line)] py-2 text-sm last:border-b-0 md:min-h-0';
const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

function Vazio({ texto }: { texto: string }) {
  return <p className="rounded-md border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

/** Quem mais esteve ausente no período. */
export function BlocoAusentes({ periodo }: { periodo: Periodo }) {
  const q = useQuery({ queryKey: ['inicio', 'ausentes', periodo.de, periodo.ate], queryFn: () => inicioApi.ausentesNoPeriodo(periodo) });
  if (q.isPending) return <p role="status" className="text-sm text-muted-foreground">Carregando…</p>;
  if (q.isError) return <EstadoErro erro={q.error} aoTentar={() => void q.refetch()} />;
  return (
    <>
      {q.data.length === 0 ? <Vazio texto={`Ninguém esteve ausente ${textoDoPeriodo(periodo)}.`} /> : (
        <ul aria-label="Quem mais esteve ausente">
          {q.data.map((p) => (
            <li key={p.pessoaId} className={ITEM}>
              <span className="text-foreground">{p.nome}</span>
              <span className="font-semibold tabular-nums text-foreground">{formatarDuracao(p.minutos)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/ausencias?de=${periodo.de}&ate=${periodo.ate}`} className={LINK}>Abrir ausências</Link>
    </>
  );
}

/** Pedidos esperando a decisão de quem está logado há mais tempo. */
export function BlocoParados() {
  const q = useQuery({ queryKey: ['inicio', 'parados'], queryFn: inicioApi.pedidosParados });
  if (q.isPending) return <p role="status" className="text-sm text-muted-foreground">Carregando…</p>;
  if (q.isError) return <EstadoErro erro={q.error} aoTentar={() => void q.refetch()} />;
  if (q.data.length === 0) return <Vazio texto="Nenhum pedido esperando a sua decisão." />;
  return (
    <ul aria-label="Pedidos parados">
      {q.data.map((p) => (
        <li key={p.id} className={ITEM}>
          <Link to={`/extensoes/aprovar/${p.id}`} className="rounded-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring">
            {p.nome}
          </Link>
          <span className="text-right text-muted-foreground">{formatarDuracao(p.minutos)} · pedido {tempoDesde(p.criadoEm)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Tentativas de acesso fora da jornada no período. */
export function BlocoForaDaJornada({ periodo }: { periodo: Periodo }) {
  const q = useQuery({ queryKey: ['inicio', 'fora-jornada', periodo.de, periodo.ate], queryFn: () => inicioApi.foraDaJornada(periodo) });
  if (q.isPending) return <p role="status" className="text-sm text-muted-foreground">Carregando…</p>;
  if (q.isError) return <EstadoErro erro={q.error} aoTentar={() => void q.refetch()} />;
  const { total, pessoas, maiores } = q.data;
  return (
    <>
      {total === 0 ? <Vazio texto={`Nenhuma tentativa de acesso fora da jornada ${textoDoPeriodo(periodo)}.`} /> : (
        <>
          <p className="text-sm text-foreground">
            <strong className="text-2xl tabular-nums">{total}</strong> {total === 1 ? 'tentativa' : 'tentativas'} de {pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}
          </p>
          <ul aria-label="Quem mais tentou acessar fora da jornada">
            {maiores.map((p) => (
              <li key={p.pessoaId} className={ITEM}>
                <span className="text-foreground">{p.nome}</span>
                <span className="font-semibold tabular-nums text-foreground">{p.total}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to={`/relatorios/tentativas-fora-da-jornada?inicio=${periodo.de}&fim=${periodo.ate}`} className={LINK}>Abrir o relatório</Link>
    </>
  );
}

/** Quem entra de férias nos próximos 30 dias. */
export function BlocoFerias() {
  const q = useQuery({ queryKey: ['inicio', 'ferias'], queryFn: inicioApi.proximasFerias });
  if (q.isPending) return <p role="status" className="text-sm text-muted-foreground">Carregando…</p>;
  if (q.isError) return <EstadoErro erro={q.error} aoTentar={() => void q.refetch()} />;
  if (q.data.length === 0) return <Vazio texto="Ninguém entra de férias nos próximos 30 dias." />;
  return (
    <ul aria-label="Próximas férias">
      {q.data.map((f) => (
        <li key={`${f.pessoaId}-${f.inicio}`} className={ITEM}>
          <Link to={`/usuarios/${f.pessoaId}/ferias`} className="rounded-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring">
            {f.nome}
          </Link>
          <span className="tabular-nums text-muted-foreground">{ddmm(f.inicio)} a {ddmm(f.fim)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Um indicador de qualquer relatório, no período do Início. */
export function BlocoIndicador({ slug, indice, periodo }: { slug: string; indice: number; periodo: Periodo }) {
  const relatorio = RELATORIOS.find((r) => r.slug === slug);
  const q = useQuery({
    queryKey: ['inicio', 'indicador', slug, indice, periodo.de, periodo.ate],
    queryFn: () => inicioApi.indicadorDeRelatorio(slug, indice, periodo),
  });
  const d = q.data;
  const periodoTexto = d && !d.temPeriodo ? 'Situação atual' : textoDoPeriodo(periodo);
  return (
    <div className="relative">
      <KpiCard
        className="h-full [&>p:last-child]:first-letter:uppercase"
        label={d?.rotulo ?? relatorio?.titulo ?? 'Indicador'}
        value={d?.valor ?? 0}
        decimals={d?.decimais}
        unit={d?.unidade}
        period={q.isError ? 'Não conseguimos calcular agora' : d && relatorio && d.rotulo !== relatorio.titulo ? `${periodoTexto} · ${relatorio.titulo}` : periodoTexto}
        loading={q.isPending}
        empty={q.isError || d === null}
      />
    </div>
  );
}
