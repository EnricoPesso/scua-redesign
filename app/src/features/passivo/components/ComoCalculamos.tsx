import { useEffect, useId, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { CUSTO_PADRAO, type ParametrosDeCusto } from '../../../lib/conformidade';
import { ehPadrao, LIMITE_PERCENTUAL } from './useParametrosDeCusto';

const pct = (v: number) => String(Math.round(v * 100));

/** Campo de percentual: aceita apagar e digitar de novo; só valores válidos (0 a 500) chegam aos números da tela. */
function CampoPercentual({ rotulo, dica, valor, aoMudar }: { rotulo: string; dica: string; valor: number; aoMudar: (v: number) => void }) {
  const [texto, setTexto] = useState(pct(valor));
  useEffect(() => setTexto(pct(valor)), [valor]);
  const numero = Number(texto);
  const invalido = texto.trim() === '' || !Number.isFinite(numero) || numero < 0 || numero > LIMITE_PERCENTUAL;
  return (
    <Field
      label={rotulo}
      hint={dica}
      error={invalido ? `Informe um valor de 0 a ${LIMITE_PERCENTUAL}.` : undefined}
      inputProps={{
        type: 'number', inputMode: 'decimal', min: 0, max: LIMITE_PERCENTUAL, step: 5, value: texto,
        className: 'max-md:h-11',
        onValueChange: (v: string) => {
          setTexto(v);
          const n = Number(v);
          if (v.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= LIMITE_PERCENTUAL) aoMudar(n / 100);
        },
        onBlur: () => { if (invalido) setTexto(pct(valor)); },
      }}
    />
  );
}

/** Seção recolhível com a fórmula em linguagem simples e os percentuais ajustáveis. */
export function ComoCalculamos({ parametros, alterar, voltarAoPadrao }: {
  parametros: ParametrosDeCusto;
  alterar: (m: Partial<ParametrosDeCusto>) => void;
  voltarAoPadrao: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="min-w-0 rounded-lg border border-border bg-card shadow-[var(--shadow-1)]">
      <h2 id={idTitulo} className="text-base font-bold text-foreground">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={idPainel}
          onClick={() => setAberto((a) => !a)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-5 py-3 text-left outline-none hover:bg-[var(--color-row-hover)] focus-visible:ring-3 focus-visible:ring-ring max-md:min-h-14"
        >
          Como calculamos
          <ChevronDownIcon aria-hidden="true" className={cn('size-5 shrink-0 transition-transform motion-reduce:transition-none', aberto && 'rotate-180')} />
        </button>
      </h2>
      <div id={idPainel} hidden={!aberto} className="grid gap-5 border-t border-border p-5">
        <div className="grid max-w-3xl gap-2 text-sm text-foreground">
          <p>
            Para cada hora além da jornada, o valor estimado é:{' '}
            <strong>horas × custo-hora × (1 + adicional de hora extra) × (1 + encargos)</strong>.
          </p>
          <p>No domingo, o adicional usado é o de domingo (feriados ainda não entram no cálculo). Quando o intervalo foi menor que 1 hora, o tempo que faltou é pago com 50% a mais. Quando faltou descanso entre duas jornadas, as horas que faltaram contam como hora extra.</p>
          <p>Dias com mais de 2 horas extras aparecem como ocorrência, mas sem valor: essas horas ou já foram pagas (extensão aprovada) ou já estão somadas como hora sem aprovação.</p>
          <p>O custo-hora é o valor de uma hora normal de cada pessoa (salário dividido por 220). Já o &quot;Evitado pelo bloqueio&quot; é o que a hora extra teria custado se as tentativas barradas tivessem virado trabalho.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <CampoPercentual rotulo="Adicional de hora extra (%)" dica="Dia comum. O padrão é 50." valor={parametros.adicionalHoraExtra} aoMudar={(v) => alterar({ adicionalHoraExtra: v })} />
          <CampoPercentual rotulo="Adicional de domingo (%)" dica="O padrão é 100." valor={parametros.adicionalDescanso} aoMudar={(v) => alterar({ adicionalDescanso: v })} />
          <CampoPercentual rotulo="Encargos e reflexos (%)" dica="Estimativa da empresa. O padrão é 35." valor={parametros.encargos} aoMudar={(v) => alterar({ encargos: v })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="max-md:h-11" disabled={ehPadrao(parametros)} onClick={voltarAoPadrao}>Voltar ao padrão</Button>
          <p className="text-sm text-muted-foreground" role="status">
            {ehPadrao(parametros)
              ? `Usando o padrão: ${pct(CUSTO_PADRAO.adicionalHoraExtra)}%, ${pct(CUSTO_PADRAO.adicionalDescanso)}% e ${pct(CUSTO_PADRAO.encargos)}%.`
              : 'Seus percentuais ficam guardados neste navegador.'}
          </p>
        </div>
      </div>
    </section>
  );
}
