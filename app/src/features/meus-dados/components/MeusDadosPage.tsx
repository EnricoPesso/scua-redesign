import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BanIcon, CircleCheckIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ColunaPlanilha } from '@/lib/planilha';
import { BotaoExportar } from '../../../componentes/BotaoExportar';
import { EstadoErro } from '../../../componentes/EstadoErro';
import { Pagina } from '../../../componentes/Pagina';
import { hoje } from '../../../mock/datas';
import { emHoras } from '../../../lib/conformidade';
import { BarraLimite } from '../../extensoes/components/BarraLimite';
import { usePermissoes } from '../../extensoes/hooks/queries';
import { meusDadosApi, type MeusDados } from '../api';
import {
  CONTATO_DIREITOS, DIREITOS, O_QUE_NAO_REGISTRA, O_QUE_REGISTRA, QUEM_VE, type ItemDeConteudo,
} from '../conteudo';
import {
  diasDoMes, jornadaCombinada, linhaDoDia, resumoDoPeriodo, ultimaSemana, ultimosDias, usoDoLimiteMensal,
  type LinhaDoDia, type ResumoDoPeriodo,
} from '../domain/meusDados';

const CARTAO = 'grid content-start gap-3 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-1)]';
const H2 = 'font-heading text-lg font-semibold text-foreground';
const LINK_EXTENSAO = '/extensoes/meus/novo';

const COLUNAS_ARQUIVO: ColunaPlanilha<LinhaDoDia>[] = [
  { header: 'Dia', texto: (l) => l.dia },
  { header: 'Jornada prevista', texto: (l) => l.previsto },
  { header: 'Entrada', texto: (l) => l.entrada },
  { header: 'Saída', texto: (l) => l.saida },
  { header: 'Intervalo', texto: (l) => l.intervalo },
  { header: 'Além da jornada', texto: (l) => l.alemDaJornada },
];

function ListaDoQueRegistra({ titulo, itens, registra }: { titulo: string; itens: ItemDeConteudo[]; registra: boolean }) {
  const Icone = registra ? CircleCheckIcon : BanIcon;
  return (
    <section aria-labelledby={registra ? 'md-registra' : 'md-nao-registra'} className={CARTAO}>
      <h3
        id={registra ? 'md-registra' : 'md-nao-registra'}
        className={cn(
          'flex w-fit items-center gap-2 rounded-md px-2.5 py-1 text-base font-semibold',
          registra ? 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]' : 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
        )}
      >
        <Icone aria-hidden="true" className="size-5 shrink-0" />
        {titulo}
      </h3>
      <ul className="grid gap-3">
        {itens.map((i) => (
          <li key={i.titulo} className="flex gap-2.5">
            <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">{i.titulo}.</strong> {i.explicacao}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="text-base font-semibold text-foreground tabular-nums">{valor}</dd>
    </div>
  );
}

function Periodo({ id, titulo, resumo }: { id: string; titulo: string; resumo: ResumoDoPeriodo }) {
  return (
    <section aria-labelledby={id} className={CARTAO}>
      <h3 id={id} className="text-base font-semibold text-foreground">{titulo}</h3>
      <dl className="grid gap-3 sm:grid-cols-3">
        <Indicador rotulo="Dias com uso" valor={String(resumo.diasComUso)} />
        <Indicador rotulo="Horas além da jornada" valor={resumo.extraMin > 0 ? emHoras(resumo.extraMin) : 'Nenhuma'} />
        <Indicador rotulo="Pausas feitas" valor={`${resumo.pausasFeitas} de ${resumo.pausasPrevistas}`} />
      </dl>
    </section>
  );
}

function TabelaDeDias({ linhas }: { linhas: LinhaDoDia[] }) {
  const TH = 'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground';
  const TD = 'px-3 py-2.5 text-sm whitespace-nowrap text-foreground tabular-nums';
  return (
    <div
      role="region"
      aria-label="Últimos 14 dias, role para o lado se precisar"
      tabIndex={0}
      className="overflow-x-auto rounded-lg border border-border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <table className="w-full min-w-[34rem] border-collapse">
        <caption className="sr-only">Seus últimos 14 dias: jornada prevista, entrada, saída, intervalo e hora além da jornada</caption>
        <thead className="border-b border-border bg-muted">
          <tr>
            <th scope="col" className={TH}>Dia</th>
            <th scope="col" className={TH}>Previsto</th>
            <th scope="col" className={TH}>Entrada</th>
            <th scope="col" className={TH}>Saída</th>
            <th scope="col" className={TH}>Intervalo</th>
            <th scope="col" className={TH}>Além da jornada</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.dia} className="border-b border-border last:border-b-0">
              <th scope="row" className={cn(TD, 'text-left font-semibold')}>{l.rotulo}</th>
              <td className={TD}>{l.previsto}</td>
              <td className={TD}>{l.entrada}</td>
              <td className={TD}>{l.saida}</td>
              <td className={TD}>{l.intervalo}</td>
              <td className={cn(TD, l.alemMin > 0 && 'font-semibold')}>{l.alemDaJornada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Conteudo({ dados, linhas }: { dados: MeusDados; linhas: LinhaDoDia[] }) {
  const mes = useMemo(() => diasDoMes(dados.dias, hoje()), [dados.dias]);
  const semana = useMemo(() => resumoDoPeriodo(ultimaSemana(dados.dias)), [dados.dias]);
  const limite = usoDoLimiteMensal(mes, dados.limiteHoras);
  const jornada = jornadaCombinada(dados.dias);
  return (
    <>
      <section aria-labelledby="md-transparencia" className="grid gap-3">
        <h2 id="md-transparencia" className={H2}>O que o Scua registra e o que não registra</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ListaDoQueRegistra titulo="O Scua registra" itens={O_QUE_REGISTRA} registra />
          <ListaDoQueRegistra titulo="O Scua não registra" itens={O_QUE_NAO_REGISTRA} registra={false} />
        </div>
      </section>

      <section aria-labelledby="md-jornada" className="grid gap-4">
        <h2 id="md-jornada" className={H2}>Minha jornada</h2>
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">Jornada combinada: </span>
          <strong className="font-semibold">{jornada ?? 'ainda não definida'}</strong>
          <span className="text-muted-foreground">. Estação principal: </span>
          <strong className="font-semibold">{dados.estacao}</strong>.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Periodo id="md-semana" titulo="Últimos 7 dias" resumo={semana} />
          <Periodo id="md-mes" titulo="Neste mês" resumo={resumoDoPeriodo(mes)} />
        </div>
        <div className={CARTAO}>
          <p className="text-sm text-muted-foreground">
            Extensões aprovadas neste mês{dados.grupo ? `, no grupo ${dados.grupo}` : ''}.
          </p>
          <BarraLimite avaliacao={limite.avaliacao} limiteMin={limite.limiteMin} />
        </div>
        <h3 className="text-base font-semibold text-foreground">Últimos 14 dias</h3>
        {linhas.length === 0
          ? <p className="text-sm text-muted-foreground">Ainda não há dias registrados.</p>
          : <TabelaDeDias linhas={linhas} />}
      </section>

      <section aria-labelledby="md-quem-ve" className={CARTAO}>
        <h2 id="md-quem-ve" className={H2}>Quem vê meus dados</h2>
        <ul className="grid gap-3">
          <li className="text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">{dados.gestor ? `Seu gestor, ${dados.gestor}.` : 'Seu gestor.'}</strong>{' '}
            {dados.gestor ? 'Acompanha a jornada da equipe e decide os pedidos de extensão.' : 'Você não tem gestor acima de você no cadastro.'}
          </li>
          <li className="text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{QUEM_VE.rh.titulo}.</strong> {QUEM_VE.rh.explicacao}</li>
          <li className="text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{QUEM_VE.administracao.titulo}.</strong> {QUEM_VE.administracao.explicacao}</li>
        </ul>
        <p className="text-sm text-foreground"><strong className="font-semibold">Por quanto tempo:</strong> {QUEM_VE.prazo}.</p>
      </section>

      <section aria-labelledby="md-direitos" className={CARTAO}>
        <h2 id="md-direitos" className={H2}>Meus direitos</h2>
        <ul className="grid gap-3">
          {DIREITOS.map((d) => (
            <li key={d.titulo} className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">{d.titulo}.</strong> {d.explicacao}
            </li>
          ))}
        </ul>
        <p className="text-sm font-semibold text-foreground">{CONTATO_DIREITOS}</p>
      </section>
    </>
  );
}

function Carregando() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function MeusDadosPage() {
  const permissoes = usePermissoes();
  const pessoaId = permissoes.data?.usuario.id;
  const consulta = useQuery({
    queryKey: ['meus-dados', pessoaId],
    queryFn: () => meusDadosApi.obter(pessoaId!),
    enabled: !!pessoaId,
  });
  const linhas = useMemo(() => (consulta.data ? ultimosDias(consulta.data.dias, 14).map(linhaDoDia) : []), [consulta.data]);

  const erro = permissoes.isError ? permissoes : consulta.isError ? consulta : null;
  let conteudo;
  if (erro) {
    conteudo = <EstadoErro erro={erro.error} aoTentar={() => void (permissoes.isError ? permissoes : consulta).refetch()} />;
  } else if (!consulta.data) {
    conteudo = <Carregando />;
  } else {
    conteudo = <Conteudo dados={consulta.data} linhas={linhas} />;
  }

  return (
    <Pagina
      titulo="Meus dados"
      descricao="O Scua controla a jornada, não espia: você vê exatamente o que é registrado sobre você."
      acoes={(
        <>
          {permissoes.data?.podePedir && (
            <Link to={LINK_EXTENSAO} className={cn(buttonVariants(), 'max-md:h-11')}>Pedir extensão de jornada</Link>
          )}
          <BotaoExportar arquivo="meus-dados" rotulo="Baixar meus dados" colunas={COLUNAS_ARQUIVO} linhas={linhas} desabilitado={!consulta.data} />
        </>
      )}
    >
      {conteudo}
    </Pagina>
  );
}
