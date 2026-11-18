import { useId, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PessoaDiretorio } from '../../../mock/diretorio';
import {
  EXPEDIENTE, MOTIVOS, formatarDuracao, paraMinutos, posicaoDaBarra, rotuloDoDia, textoDaAusencia, totaisPorPessoa,
  type Ausencia,
} from '../domain/ausencias';
import { ESTILO_MOTIVO } from './estiloMotivo';

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
        aria-label={texto}
        aria-describedby={dica ? idDica : undefined}
        onMouseEnter={() => setDica(true)}
        onMouseLeave={() => setDica(false)}
        onFocus={() => setDica(true)}
        onBlur={() => setDica(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setDica(false); }}
        className="absolute inset-y-1.5 min-w-2 cursor-default overflow-hidden rounded-sm text-xs font-semibold outline-none focus-visible:z-20 focus-visible:ring-3 focus-visible:ring-ring"
        style={{ left: `${pos.esquerda}%`, width: `${pos.largura}%`, ...ESTILO_MOTIVO[ausencia.motivo] }}
      >
        {/* O texto interno é só um reforço visual quando a barra é larga; o nome acessível é o aria-label. */}
        {pos.largura >= 9 && <span aria-hidden="true" className="mx-0.5 truncate rounded-sm bg-[var(--color-surface)] px-1 text-foreground">{ausencia.motivo}</span>}
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
}

/** Uma linha por pessoa; o eixo horizontal é o expediente (08h às 18h) do dia escolhido. */
export function LinhaDoTempo({ pessoas, ausencias, dia, diasUteis, aoMudarDia }: Props) {
  const i = diasUteis.indexOf(dia);
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
          {pessoas.map((p) => (
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
