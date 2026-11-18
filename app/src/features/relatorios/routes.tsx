import { Suspense, lazy, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link, Route, Routes, useParams, useSearchParams } from 'react-router';
import { buttonVariants } from '@/components/ui/button-variants';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeloRelatorio, type ConfigRelatorio, type ValoresFiltro } from '@/modelos/relatorio';
import { cn } from '@/lib/utils';
import { NaoEncontrada } from '../../layout/ErroGlobal';
import { Pagina, Trilha, useTituloDaAba } from '../../componentes/Pagina';
import { CARREGADORES } from './carregadores';
import { filtrarRelatorios } from './busca';
import { TEMAS, relatorioPorSlug, temaDe, type ItemRelatorio } from './catalogo';

function Entrada() {
  const [params, setParams] = useSearchParams();
  const busca = params.get('q') ?? '';
  const achados = filtrarRelatorios(busca);
  const limpar = () => setParams({}, { replace: true });

  return (
    <Pagina titulo="Relatórios" descricao="Escolha pelo assunto ou busque pelo nome do relatório.">
      <div className="max-w-md">
        <Field
          label="Buscar relatório"
          inputProps={{
            type: 'search',
            value: busca,
            placeholder: 'Ex.: liberações, estações',
            className: 'max-md:h-11',
            onChange: (e) => {
              const v = e.currentTarget.value;
              setParams(v ? { q: v } : {}, { replace: true });
            },
          }}
        />
      </div>
      <p className="sr-only" role="status">
        {achados.length === 1 ? '1 relatório encontrado' : `${achados.length} relatórios encontrados`}
      </p>
      {achados.length === 0 ? (
        <EmptyState
          title="Nenhum relatório encontrado"
          description="Tente outra palavra, como o nome da tela ou o assunto."
          action={
            <button type="button" onClick={limpar} className={cn(buttonVariants({ variant: 'secondary' }), 'max-md:h-11')}>
              Limpar busca
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {TEMAS.map((tema) => {
            const itens = achados.filter((r) => r.tema === tema.id);
            if (itens.length === 0) return null;
            return (
              <section key={tema.id} aria-labelledby={`tema-${tema.id}`} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)] sm:p-5">
                <div className="flex flex-col gap-0.5">
                  <h2 id={`tema-${tema.id}`} className="font-heading text-base font-bold text-foreground">{tema.titulo}</h2>
                  <p className="text-sm text-muted-foreground">{tema.pergunta}</p>
                </div>
                <ul className="flex flex-col gap-1">
                  {itens.map((r) => (
                    <li key={r.slug}>
                      <Link
                        to={`/relatorios/${r.slug}`}
                        className="flex min-h-11 flex-col justify-center rounded-md px-3 py-2 outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring"
                      >
                        <span className="text-sm font-semibold text-[var(--color-brand-text)]">{r.titulo}</span>
                        <span className="text-sm text-muted-foreground">{r.resumo}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Pagina>
  );
}

type TelaDoRelatorio = ComponentType<{ trilha: ReactNode }>;
/**
 * Liga o modelo de relatório à URL: os filtros aplicados viram parâmetros (o link reabre o relatório
 * já filtrado, como nas outras telas), e "Limpar filtros" tira os parâmetros.
 */
function RelatorioNaUrl<T extends object>({ config, trilha }: { config: ConfigRelatorio<T>; trilha: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const [iniciais] = useState<ValoresFiltro>(() => {
    const v: ValoresFiltro = {};
    for (const f of config.filtros) {
      if (f.tipo === 'periodo') {
        for (const chave of ['inicio', 'fim']) {
          const data = params.get(chave);
          if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) v[chave] = data;
        }
      } else if (f.tipo === 'multi') {
        const validos = params.getAll(f.chave).filter((x) => f.opcoes.some((o) => o.value === x));
        if (validos.length > 0) v[f.chave] = validos;
      } else if (params.has(f.chave)) {
        const texto = params.get(f.chave) ?? '';
        if (f.tipo === 'texto' || f.opcoes.some((o) => o.value === texto)) v[f.chave] = texto;
      }
    }
    return v;
  });
  return (
    <ModeloRelatorio
      config={config}
      trilha={trilha}
      valoresIniciais={iniciais}
      aoAplicar={(aplicados, padrao) => {
        const novo = new URLSearchParams();
        if (!padrao) {
          for (const [chave, valor] of Object.entries(aplicados)) {
            if (Array.isArray(valor)) valor.forEach((x) => novo.append(chave, x));
            else if (valor) novo.set(chave, valor);
          }
        }
        setParams(novo, { replace: true });
      }}
    />
  );
}

const telas = new Map<string, ReturnType<typeof lazy<TelaDoRelatorio>>>();

/** Uma tela por relatório, criada uma só vez: a configuração entra no pacote só quando é aberta. */
function telaDe(slug: string) {
  let tela = telas.get(slug);
  if (!tela) {
    tela = lazy<TelaDoRelatorio>(async () => {
      const { default: config } = await CARREGADORES[slug]();
      return { default: ({ trilha }) => <RelatorioNaUrl config={config} trilha={trilha} /> };
    });
    telas.set(slug, tela);
  }
  return tela;
}

function Relatorio() {
  const { slug } = useParams();
  const item = relatorioPorSlug(slug);
  if (!item || !CARREGADORES[item.slug]) return <NaoEncontrada />;
  return <RelatorioAberto key={item.slug} item={item} />;
}

function RelatorioAberto({ item }: { item: ItemRelatorio }) {
  useTituloDaAba(item.titulo);
  const Tela = useMemo(() => telaDe(item.slug), [item.slug]);
  const trilha = <Trilha passos={[{ rotulo: 'Relatórios', para: '/relatorios' }, { rotulo: temaDe(item.tema).titulo }]} />;
  return (
    <Suspense
      fallback={
        <Pagina titulo={item.titulo} trilha={[{ rotulo: 'Relatórios', para: '/relatorios' }, { rotulo: temaDe(item.tema).titulo }]}>
          <Skeleton className="h-64 w-full" />
        </Pagina>
      }
    >
      <Tela trilha={trilha} />
    </Suspense>
  );
}

export default function Rotas() {
  return (
    <Routes>
      <Route index element={<Entrada />} />
      <Route path=":slug" element={<Relatorio />} />
    </Routes>
  );
}
