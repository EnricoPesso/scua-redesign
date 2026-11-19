import { Field } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import { DIAS, NOME_LONGO, type Dia, type HorarioDia, type Semana } from '../domain/tipos';
import type { ErrosDia } from '../domain/validacao';

const CAMPOS_HORA = [
  { chave: 'entrada', rotulo: 'Entrada' },
  { chave: 'saida', rotulo: 'Saída' },
  { chave: 'intervaloInicio', rotulo: 'Início do intervalo' },
  { chave: 'intervaloFim', rotulo: 'Fim do intervalo' },
] as const;

/** Uma linha por dia: "Trabalha" e os quatro horários (que ficam desabilitados nos dias de folga). */
export function GradeSemana({ semana, erros, aoMudar }: {
  semana: Semana;
  erros: Partial<Record<Dia, ErrosDia>>;
  aoMudar: (dia: Dia, mudancas: Partial<HorarioDia>) => void;
}) {
  return (
    <div className="grid gap-3">
      {DIAS.map((dia) => {
        const d = semana[dia];
        return (
          <fieldset key={dia} className="grid gap-3 rounded-lg border border-[var(--color-line)] p-3">
            <legend className="px-1 text-sm font-bold text-foreground">{NOME_LONGO[dia]}</legend>
            <Toggle label="Trabalha" checked={d.trabalha} onCheckedChange={(c) => aoMudar(dia, { trabalha: c })} className="max-md:min-h-11" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CAMPOS_HORA.map((c) => (
                <Field
                  key={c.chave}
                  label={c.rotulo}
                  error={erros[dia]?.[c.chave]}
                  disabled={!d.trabalha}
                  inputProps={{ type: 'time', value: d[c.chave], onValueChange: (v: string) => aoMudar(dia, { [c.chave]: v }), className: 'max-md:h-11' }}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
