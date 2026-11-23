import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, CopyIcon, PrinterIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { ColunaPlanilha } from '@/lib/planilha';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { REGRAS, emHoras } from '../../../lib/conformidade';
import { OPCOES_PESSOAS } from '../../../mock/diretorio';
import { dossieApi } from '../api';
import {
  PERIODOS, PERIODO_PADRAO, dataBr, ehPeriodo, nomeDoArquivo, rotuloDoDia,
  type DiaDoDossie, type Dossie, type Periodo,
} from '../domain/dossie';
import { Legenda, LinhaDoTempo } from './LinhaDoTempo';

const IDS_VALIDOS = new Set(OPCOES_PESSOAS.map((o) => o.value));
const OPCOES_PERIODO = PERIODOS.map((p) => ({ value: String(p), label: `Últimos ${p} dias` }));
const ALVO = 'max-md:[&_button]:h-11';
const SECAO = 'grid gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)] print:break-inside-avoid print:border-black print:shadow-none';
const TITULO_SECAO = 'text-lg font-semibold text-foreground';

const COLUNAS: ColunaPlanilha<DiaDoDossie>[] = [
  { header: 'Data', texto: (d) => dataBr(d.dia) },
  { header: 'Dia da semana', texto: (d) => rotuloDoDia(d).split(',')[0] },
  { header: 'Jornada prevista', texto: (d) => (d.previstoInicio && d.previstoFim ? `${d.previstoInicio} às ${d.previstoFim}` : 'Sem jornada') },
  { header: 'Primeiro logon', texto: (d) => d.primeiroLogon ?? '' },
  { header: 'Último logoff', texto: (d) => d.ultimoLogoff ?? '' },
  { header: 'Intervalo (min)', texto: (d) => (d.primeiroLogon && d.previstoInicio ? String(d.intervaloRealMin) : '') },
  { header: 'Extensões com aprovação (min)', texto: (d) => String(d.extraAprovadaMin) },
  { header: 'Além da jornada sem aprovação (min)', texto: (d) => String(d.extraSemAprovacaoMin) },
  { header: 'Tentativas barradas', texto: (d) => String(d.tentativasBloqueadas) },
  { header: 'Pausas feitas', texto: (d) => String(d.pausasFeitas) },
  { header: 'Pausas previstas', texto: (d) => String(d.pausasPrevistas) },
  { header: 'Ocorrências', texto: (d) => d.ocorrencias.map((o) => `${o.titulo} (${o.base})`).join(' | ') },
];

const DATA_E_HORA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-4">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card p-4 print:border-black">
      <dt className="text-sm font-semibold text-muted-foreground print:text-black">{rotulo}</dt>
      <dd className="text-2xl font-bold text-foreground">{valor}</dd>
      {detalhe && <dd className="text-xs text-muted-foreground print:text-black">{detalhe}</dd>}
    </div>
  );
}

function Cabecalho({ dossie }: { dossie: Dossie }) {
  const { pessoa, periodo } = dossie;
  const campos = [
    ['Matrícula', pessoa.matricula],
    ['Departamento', pessoa.departamento],
    ['Gestor', pessoa.gestor ?? 'Sem gestor'],
    ['Estação', pessoa.estacao],
    ['Período', `${dataBr(periodo.de)} a ${dataBr(periodo.ate)}`],
    ['Gerado em', DATA_E_HORA.format(new Date(dossie.geradoEm))],
  ];
  return (
    <section aria-labelledby="dossie-colaborador" className={SECAO}>
      <h2 id="dossie-colaborador" className={TITULO_SECAO}>Dossiê de {pessoa.nome}</h2>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-xs text-muted-foreground print:text-black">{rotulo}</dt>
            <dd className="font-medium text-foreground">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Resumo({ dossie }: { dossie: Dossie }) {
  const r = dossie.resumo;
  const comOcorrencia = (Object.keys(REGRAS) as (keyof typeof REGRAS)[]).filter((k) => r.ocorrenciasPorRegra[k] > 0);
  return (
    <section aria-labelledby="dossie-resumo" className="grid gap-3">
      <h2 id="dossie-resumo" className={TITULO_SECAO}>Resumo do período</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Indicador rotulo="Dias com uso da estação" valor={String(r.diasComUso)} detalhe={`de ${r.diasNoPeriodo} dias no período`} />
        <Indicador rotulo="Além da jornada, com aprovação" valor={emHoras(r.extraAprovadaMin)} />
        <Indicador rotulo="Além da jornada, sem aprovação" valor={emHoras(r.extraSemAprovacaoMin)} />
        <Indicador rotulo="Tentativas barradas pelo bloqueio" valor={String(r.tentativasBloqueadas)} />
        <Indicador rotulo="Pausas feitas" valor={`${r.pausasFeitas} de ${r.pausasPrevistas}`} detalhe="pausas previstas no período" />
        <Indicador rotulo="Ocorrências" valor={String(r.totalOcorrencias)} detalhe="dias ou situações que fogem das regras de jornada" />
      </dl>
      {comOcorrencia.length === 0 ? (
        <p className="text-sm text-muted-foreground print:text-black">Nenhuma ocorrência registrada no período.</p>
      ) : (
        <ul aria-label="Ocorrências por regra" className="grid gap-1 text-sm text-foreground">
          {comOcorrencia.map((k) => (
            <li key={k}>
              <span className="font-semibold">{r.ocorrenciasPorRegra[k]}</span>{' '}
              {r.ocorrenciasPorRegra[k] === 1 ? 'registro' : 'registros'} de &ldquo;{REGRAS[k].titulo}&rdquo;{' '}
              <span className="text-muted-foreground print:text-black">({REGRAS[k].base})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Integridade({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setFalhou(false);
      setCopiado(true);
    } catch {
      setCopiado(false);
      setFalhou(true);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setCopiado(false); setFalhou(false); }, 4000);
  };
  return (
    <section aria-labelledby="dossie-integridade" className={SECAO}>
      <h2 id="dossie-integridade" className={`${TITULO_SECAO} flex items-center gap-2`}>
        <ShieldCheckIcon aria-hidden="true" className="size-5 text-[var(--color-brand-text)] print:text-black" />
        Integridade do registro
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm break-all text-foreground print:border-black print:bg-transparent">{codigo}</code>
        <Button variant="secondary" className="max-md:h-11 max-md:w-full print:hidden" onClick={() => void copiar()}>
          {copiado ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copiado ? 'Copiado' : 'Copiar código'}
        </Button>
      </div>
      <p role="status" className="sr-only">{copiado ? 'Código copiado.' : falhou ? 'Não foi possível copiar. Selecione o código e copie.' : ''}</p>
      {falhou && <p aria-hidden="true" className="text-sm text-[var(--color-danger-text)] print:hidden">Não foi possível copiar. Selecione o código e copie.</p>}
      <p className="max-w-3xl text-sm text-muted-foreground print:text-black">
        Este código funciona como uma impressão digital do conteúdo do dossiê. Se qualquer informação mudar, o código muda.
        Guarde-o junto com o arquivo ou a impressão: ele permite conferir depois que o conteúdo não foi alterado.
        O código depende só do conteúdo (pessoa, período e registros), não da hora em que o dossiê foi gerado.
        Nesta versão o período é sempre "os últimos dias até ontem", então gerar de novo em outro dia produz outro código.
      </p>
    </section>
  );
}

function Vazio() {
  return (
    <EmptyState
      title="Escolha uma pessoa para gerar o dossiê"
      description="O dossiê reúne, num só registro, o que o Scua Logon guardou de uma pessoa no período: jornada prevista, logon e logoff, extensões, bloqueios, pausas e ocorrências. Serve para comprovar o que aconteceu quando chega uma reclamação ou uma fiscalização."
    />
  );
}

export function DossiePage() {
  const [params, setParams] = useSearchParams();
  const pessoaUrl = params.get('pessoa') ?? '';
  const pessoa = IDS_VALIDOS.has(pessoaUrl) ? pessoaUrl : '';
  const periodoUrl = params.get('periodo');
  const periodo: Periodo = ehPeriodo(periodoUrl) ? (Number(periodoUrl) as Periodo) : PERIODO_PADRAO;
  const soOcorrencias = params.get('ocorrencias') === '1';

  const atualizar = (mudancas: Record<string, string | null>) => {
    setParams((atual) => {
      const novo = new URLSearchParams(atual);
      for (const [k, v] of Object.entries(mudancas)) {
        if (v === null || v === '') novo.delete(k);
        else novo.set(k, v);
      }
      return novo;
    }, { replace: true });
  };

  const consulta = useQuery({
    queryKey: ['dossie', pessoa, periodo],
    queryFn: () => dossieApi.gerar(pessoa, periodo),
    enabled: pessoa !== '',
  });
  const dossie = consulta.data;
  const dias = dossie ? (soOcorrencias ? dossie.dias.filter((d) => d.ocorrencias.length > 0) : dossie.dias) : [];

  let conteudo;
  if (pessoa === '') {
    conteudo = <Vazio />;
  } else if (consulta.isPending) {
    conteudo = <Carregando />;
  } else if (consulta.isError) {
    conteudo = <EstadoErro erro={consulta.error} aoTentar={() => void consulta.refetch()} />;
  } else {
    conteudo = (
      <div className="grid gap-6">
        <Cabecalho dossie={consulta.data} />
        <Resumo dossie={consulta.data} />
        <section aria-labelledby="dossie-linha" className="grid gap-3">
          <h2 id="dossie-linha" className={TITULO_SECAO}>Linha do tempo</h2>
          <Legenda />
          {dias.length === 0 ? (
            <EmptyState
              title="Nenhum dia com ocorrência no período"
              description="Nenhum dia fugiu das regras de jornada. Desmarque o filtro para ver todos os dias."
              action={<Button variant="secondary" className="max-md:h-11 print:hidden" onClick={() => atualizar({ ocorrencias: null })}>Mostrar todos os dias</Button>}
            />
          ) : (
            <LinhaDoTempo dias={dias} />
          )}
        </section>
        <Integridade codigo={consulta.data.codigo} />
        <p className="text-sm text-muted-foreground print:text-black">
          O dossiê reúne os registros do Scua Logon. Ele não substitui o controle de ponto oficial da empresa.
        </p>
      </div>
    );
  }

  const login = dossie?.pessoa.login ?? '';
  return (
    <Pagina
      titulo="Dossiê do colaborador"
      descricao="Chegou uma reclamação trabalhista ou uma fiscalização? O dossiê de uma pessoa sai em segundos: um registro único e exportável do que o Scua guardou."
      acoes={(
        <div className="contents print:hidden max-md:[&>button]:h-11 max-md:[&>button]:w-full">
          <BotaoExportar
            arquivo={dossie ? nomeDoArquivo(login, dossie.periodo.de, dossie.periodo.ate) : 'dossie'}
            colunas={COLUNAS}
            linhas={dossie?.dias ?? []}
            desabilitado={!dossie}
          />
          <Button variant="secondary" disabled={!dossie} onClick={() => window.print()}>
            <PrinterIcon aria-hidden="true" />
            Imprimir ou salvar em PDF
          </Button>
        </div>
      )}
    >
      <div className="grid gap-3 md:flex md:flex-wrap md:items-end print:hidden">
        <Select
          label="Pessoa"
          options={OPCOES_PESSOAS}
          value={pessoa || null}
          placeholder="Escolha uma pessoa"
          onValueChange={(v) => atualizar({ pessoa: v })}
          className={`w-full md:w-64 ${ALVO}`}
        />
        <Select
          label="Período"
          options={OPCOES_PERIODO}
          value={String(periodo)}
          onValueChange={(v) => atualizar({ periodo: v && ehPeriodo(v) && Number(v) !== PERIODO_PADRAO ? v : null })}
          className={`w-full md:w-48 ${ALVO}`}
        />
        <Checkbox
          label="Só dias com ocorrência"
          checked={soOcorrencias}
          onCheckedChange={(c) => atualizar({ ocorrencias: c ? '1' : null })}
          className="max-md:min-h-11"
        />
      </div>
      <div aria-busy={consulta.isFetching || undefined}>{conteudo}</div>
    </Pagina>
  );
}
