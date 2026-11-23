import type { CSSProperties } from 'react';
import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { emHoras } from '../../../lib/conformidade';
import {
  ESCALA, barraDoDia, rotuloDoDia, textoDaBarra,
  type DiaDoDossie, type TipoDeFaixa,
} from '../domain/dossie';

/**
 * Cada tipo de faixa se distingue por padrão e borda, além da cor (e na impressão em preto e branco).
 * As cores vêm de `currentColor`, que usa só tokens do sistema de design.
 */
const ESTILO: Record<TipoDeFaixa, CSSProperties> = {
  normal: {
    color: 'var(--color-brand)',
    backgroundImage: 'linear-gradient(currentColor, currentColor)',
    border: '2px solid currentColor',
  },
  extraAprovada: {
    color: 'var(--color-warning-text)',
    backgroundColor: 'var(--color-warning-bg)',
    backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0 1.5px, transparent 1.5px 7px)',
    border: '2px solid currentColor',
  },
  extraSemAprovacao: {
    color: 'var(--color-danger-text)',
    backgroundColor: 'var(--color-danger-bg)',
    backgroundImage: 'radial-gradient(currentColor 1.2px, transparent 1.6px)',
    backgroundSize: '6px 6px',
    border: '2px dashed currentColor',
  },
};

const NOME_DA_FAIXA: Record<TipoDeFaixa, string> = {
  normal: 'Dentro da jornada',
  extraAprovada: 'Além da jornada, com aprovação',
  extraSemAprovacao: 'Além da jornada, sem aprovação',
};

const FAIXA_BASE = 'absolute inset-y-1.5 rounded-sm print:bg-transparent! [print-color-adjust:exact]';

/** Legenda: cada faixa com a mesma amostra da barra e o nome por escrito. */
export function Legenda() {
  return (
    <ul aria-label="Legenda da barra do dia" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-4 w-8 rounded-sm border border-input bg-muted print:border-black" />
        Jornada prevista
      </li>
      {(Object.keys(ESTILO) as TipoDeFaixa[]).map((tipo) => (
        <li key={tipo} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-4 w-8 rounded-sm print:bg-transparent! [print-color-adjust:exact]" style={ESTILO[tipo]} />
          {NOME_DA_FAIXA[tipo]}
        </li>
      ))}
    </ul>
  );
}

const HORAS_DA_ESCALA = [6, 9, 12, 15, 18, 21];

/** Barra do dia: a jornada prevista ao fundo e o uso real por cima. O texto alternativo conta o mesmo em palavras. */
function BarraDoDia({ dia }: { dia: DiaDoDossie }) {
  const { previsto, faixas } = barraDoDia(dia);
  return (
    <div className="grid gap-1">
      <div role="img" aria-label={textoDaBarra(dia)} className="relative h-8 rounded-sm bg-card">
        {previsto && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 rounded-sm border border-input bg-muted print:border-black print:bg-transparent!"
            style={{ left: `${previsto.esquerda}%`, width: `${previsto.largura}%` }}
          />
        )}
        {faixas.map((f, i) => (
          <span key={i} aria-hidden="true" className={FAIXA_BASE} style={{ left: `${f.esquerda}%`, width: `${f.largura}%`, ...ESTILO[f.tipo] }} />
        ))}
      </div>
      <div aria-hidden="true" className="relative h-4 text-xs text-muted-foreground print:text-black">
        {HORAS_DA_ESCALA.map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h * 60 - ESCALA.inicio) / (ESCALA.fim - ESCALA.inicio)) * 100}%` }}>
            {h}h
          </span>
        ))}
      </div>
    </div>
  );
}

/** Os fatos do dia, em palavras. */
function eventos(d: DiaDoDossie): { rotulo: string; valor: string }[] {
  const usou = d.primeiroLogon !== null;
  return [
    { rotulo: 'Jornada prevista', valor: d.previstoInicio && d.previstoFim ? `${d.previstoInicio} às ${d.previstoFim}` : 'Sem jornada' },
    { rotulo: 'Primeiro logon', valor: d.primeiroLogon ?? 'Sem uso' },
    { rotulo: 'Último logoff', valor: d.ultimoLogoff ?? 'Sem uso' },
    { rotulo: 'Intervalo', valor: usou && d.previstoInicio ? `${emHoras(d.intervaloRealMin)} (previsto ${emHoras(d.intervaloPrevistoMin)})` : '—' },
    { rotulo: 'Extensões (com aprovação)', valor: d.extraAprovadaMin > 0 ? emHoras(d.extraAprovadaMin) : 'Nenhuma' },
    { rotulo: 'Além da jornada sem aprovação', valor: d.extraSemAprovacaoMin > 0 ? emHoras(d.extraSemAprovacaoMin) : 'Nenhuma' },
    { rotulo: 'Bloqueios', valor: d.tentativasBloqueadas > 0 ? `${d.tentativasBloqueadas} ${d.tentativasBloqueadas === 1 ? 'tentativa barrada' : 'tentativas barradas'}` : 'Nenhum' },
    { rotulo: 'Pausas', valor: d.pausasPrevistas > 0 ? `${d.pausasFeitas} de ${d.pausasPrevistas}` : '—' },
  ];
}

function DiaDaLinha({ d }: { d: DiaDoDossie }) {
  const temOcorrencia = d.ocorrencias.length > 0;
  return (
    <li
      className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-1)] print:break-inside-avoid print:border-black print:shadow-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{rotuloDoDia(d)}</h3>
        {temOcorrencia ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning-text)] bg-[var(--color-warning-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-warning-text)] print:border-black print:text-black">
            <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
            {d.ocorrencias.length === 1 ? '1 ocorrência' : `${d.ocorrencias.length} ocorrências`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground print:text-black">
            <CircleCheckIcon aria-hidden="true" className="size-3.5" />
            Sem ocorrência
          </span>
        )}
      </div>
      <BarraDoDia dia={d} />
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm min-[480px]:grid-cols-2 lg:grid-cols-4">
        {eventos(d).map((e) => (
          <div key={e.rotulo} className="min-w-0">
            <dt className="text-xs text-muted-foreground print:text-black">{e.rotulo}</dt>
            <dd className="font-medium text-foreground">{e.valor}</dd>
          </div>
        ))}
      </dl>
      {temOcorrencia && (
        <ul aria-label="Ocorrências do dia" className="grid gap-2 border-t border-border pt-3 print:border-black">
          {d.ocorrencias.map((o) => (
            <li key={o.regra} className="flex flex-wrap items-baseline gap-x-2 text-sm text-foreground">
              <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0 translate-y-0.5 text-[var(--color-warning-text)] print:text-black" />
              <span className="font-semibold">{o.titulo}</span>
              <span className="text-muted-foreground print:text-black">({o.base}, {emHoras(o.minutos)} fora da regra)</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Um bloco por dia, do mais recente ao mais antigo (a ordem já vem do dossiê). */
export function LinhaDoTempo({ dias }: { dias: DiaDoDossie[] }) {
  return (
    <ol aria-label="Dias do período" className="grid gap-3">
      {dias.map((d) => <DiaDaLinha key={d.dia} d={d} />)}
    </ol>
  );
}
