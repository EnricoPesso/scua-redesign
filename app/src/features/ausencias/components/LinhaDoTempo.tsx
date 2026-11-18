import { useId, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { paginate } from '@/lib/paginate';
import type { PessoaDiretorio } from '../../../mock/diretorio';
import {
  EXPEDIENTE, MOTIVOS, formatarDuracao, paraMinutos, posicaoDaBarra, rotuloDoDia, textoDaAusencia, totaisPorPessoa,
  type Ausencia,
} from '../domain/ausencias';
import { ESTILO_MOTIVO } from './estiloMotivo';
import { OPCOES_PESSOAS_POR_VEZ, type PessoasPorVez } from './useFiltros';

const HORAS = Array.from({ length: (EXPEDIENTE.fim - EXPEDIENTE.inicio) / 60 + 1 }, (_, i) => EXPEDIENTE.inicio / 60 + i);
const GRADE = { backgroundImage: 'repeating-linear-gradient(to right, var(--color-line) 0 1px, transparent 1px 10%)' };

/** Legenda: cada motivo com a mesma amostra (cor e padrão) das barras e o nome por escrito. */
export function Legenda() {
  return (
    <ul aria-label="Legenda dos motivos" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
      {MOTIVOS.map((m) => (
        <li key={m} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-4 w-8 rounded-sm" style={ESTILO_MOTIVO[m]} />
          {m}
        </li>
      ))}
    </ul>
  );
}

// pedir ao @PhLima07: gráfico de linha do tempo (Gantt) no sistema de design.
function Barra({ ausencia }: { ausencia: Ausencia }) {
  const [dica, setDica] = useState(false);
  const idDica = useId();
  const pos = posicaoDaBarra(paraMinutos(ausencia.inicio), paraMinutos(ausencia.fim));
  if (!pos) return null;
  const texto = textoDaAusencia(ausencia);
  // Barras perto das bordas ancoram a dica no próprio lado, para ela não sair da área.
  const meio = pos.esquerda + pos.largura / 2;
  const posicaoDica = pos.esquerda > 65 ? { right: `${100 - pos.esquerda - pos.largura}%` } : meio < 15 ? { left: `${pos.esquerda}%` } : { left: `${meio}%`, transform: 'translateX(-50%)' };
  return (
    <>
      <button
        type="button"
        data-alvo-livre
        aria-label={texto}
        aria-describedby={dica ? idDica : undefined}
        onMouseEnter={() => setDica(true)}
        onMouseLeave={() => setDica(false)}
        onFocus={() => setDica(true)}
        onBlur={() => setDica(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setDica(false); }}
        className="absolute inset-y-1.5 min-w-2 cursor-default overflow-hidden rounded-sm outline-none focus-visible:z-20 focus-visible:ring-3 focus-visible:ring-ring"
        style={{ left: `${pos.esquerda}%`, width: `${pos.largura}%`, ...ESTILO_MOTIVO[ausencia.motivo] }}
      >
        {/* Sem texto dentro da barra: a legenda explica cada padrão, e o passar do mouse (ou o foco) mostra motivo e horário. */}
      </button>
      {dica && (
        <span
          id={idDica}
          role="tooltip"
          className="pointer-events-none absolute bottom-full z-30 mb-1 rounded-md bg-[var(--color-toast-bg)] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[var(--color-toast-text)] shadow-[var(--shadow-1)]"
          style={posicaoDica}
        >
          {texto}
        </span>
      )}
    </>
  );
}

interface Props {
  pessoas: PessoaDiretorio[];
  ausencias: Ausencia[];
  dia: string;
  diasUteis: string[];
  aoMudarDia: (dia: string) => void;
  pessoasPorVez: PessoasPorVez;
  paginaPessoas: number;
  aoMudarPessoasPorVez: (valor: PessoasPorVez) => void;
  aoMudarPaginaPessoas: (pagina: number) => void;
}

const ROTULO_POR_VEZ = (v: PessoasPorVez) => (v === 'todas' ? 'Todas' : String(v));

/** Quantas pessoas aparecem por vez e qual grupo delas: evita rolar a página inteira com muita gente. */
function PessoasExibidas({ total, porVez, pagina, aoMudarPorVez, aoMudarPagina }: {
  total: number;
  porVez: PessoasPorVez;
  pagina: number;
  aoMudarPorVez: (v: PessoasPorVez) => void;
  aoMudarPagina: (p: number) => void;
}) {
  const tamanho = porVez === 'todas' ? Math.max(total, 1) : porVez;
  const info = paginate({ total, page: pagina, pageSize: tamanho });
  return (
    <div role="group" aria-label="Pessoas exibidas" className="flex flex-wrap items-end gap-2">
      <Select
        label="Pessoas por vez"
        className="w-32"
        options={OPCOES_PESSOAS_POR_VEZ.map((v) => ({ value: String(v), label: ROTULO_POR_VEZ(v) }))}
        value={String(porVez)}
        onValueChange={(v) => aoMudarPorVez((v === 'todas' ? 'todas' : Number(v)) as PessoasPorVez)}
      />
      {porVez !== 'todas' && total > tamanho && (
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" aria-label="Pessoas anteriores" disabled={!info.hasPrev} onClick={() => aoMudarPagina(info.page - 1)}>
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="icon" aria-label="Próximas pessoas" disabled={!info.hasNext} onClick={() => aoMudarPagina(info.page + 1)}>
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
      )}
      <span aria-live="polite" className="pb-2.5 text-sm text-muted-foreground tabular-nums">{`${info.from}–${info.to} de ${total}`}</span>
    </div>
  );
}

/** Uma linha por pessoa; o eixo horizontal é o expediente (08h às 18h) do dia escolhido. */
export function LinhaDoTempo({ pessoas, ausencias, dia, diasUteis, aoMudarDia, pessoasPorVez, paginaPessoas, aoMudarPessoasPorVez, aoMudarPaginaPessoas }: Props) {
  const i = diasUteis.indexOf(dia);
  const tamanho = pessoasPorVez === 'todas' ? Math.max(pessoas.length, 1) : pessoasPorVez;
  const faixa = paginate({ total: pessoas.length, page: paginaPessoas, pageSize: tamanho });
  const visiveis = pessoas.slice(Math.max(0, faixa.from - 1), faixa.to);
  const totais = totaisPorPessoa(ausencias);
  const doDia = ausencias.filter((a) => a.dia === dia);

  return (
    <section aria-label="Linha do tempo das ausências" className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Dia exibido" className="flex items-center gap-1">
          <Button variant="secondary" aria-label="Dia anterior" disabled={i <= 0} onClick={() => aoMudarDia(diasUteis[i - 1])} className="max-md:size-11">
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <span aria-live="polite" className="min-w-28 text-center text-base font-semibold text-foreground tabular-nums">{dia ? rotuloDoDia(dia) : 'Sem dia útil'}</span>
          <Button variant="secondary" aria-label="Próximo dia" disabled={i < 0 || i >= diasUteis.length - 1} onClick={() => aoMudarDia(diasUteis[i + 1])} className="max-md:size-11">
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
        <PessoasExibidas total={pessoas.length} porVez={pessoasPorVez} pagina={faixa.page} aoMudarPorVez={aoMudarPessoasPorVez} aoMudarPagina={aoMudarPaginaPessoas} />
        <Legenda />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card max-md:pt-8 md:overflow-visible">
        <div className="min-w-[44rem] md:min-w-0">
          <div className="grid grid-cols-[11rem_minmax(0,1fr)] items-end border-b border-border bg-[var(--color-surface-muted)] text-xs font-semibold text-muted-foreground" aria-hidden="true">
            <span className="px-4 py-2">Pessoa</span>
            <div className="relative h-7">
              {HORAS.map((h, k) => (
                <span key={h} className="absolute bottom-1 -translate-x-1/2 tabular-nums" style={{ left: `${(k / (HORAS.length - 1)) * 100}%` }}>{String(h).padStart(2, '0')}h</span>
              ))}
            </div>
          </div>
          <div role="list" aria-label={`Ausências em ${dia ? rotuloDoDia(dia) : ''}`}>
          {visiveis.map((p) => (
            <div key={p.id} role="listitem" className="grid grid-cols-[11rem_minmax(0,1fr)] items-center border-b border-border last:border-b-0">
              <div className="min-w-0 px-4 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{p.nome}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatarDuracao(totais.get(p.id) ?? 0)} no período</p>
              </div>
              <div className="relative h-11" style={GRADE}>
                {doDia.filter((a) => a.pessoaId === p.id).map((a) => <Barra key={a.id} ausencia={a} />)}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
