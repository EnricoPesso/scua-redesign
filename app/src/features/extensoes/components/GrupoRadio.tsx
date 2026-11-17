import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface OpcaoRadio<V extends string> { valor: V; rotulo: string }

// pedir ao @PhLima07: grupo de rádio (o sistema de design ainda não tem). Usa <input type="radio"> nativo,
// então setas, Tab e leitor de tela funcionam sem código extra.
export function GrupoRadio<V extends string>({ legenda, opcoes, valor, aoMudar, className }: {
  legenda: string;
  opcoes: OpcaoRadio<V>[];
  valor: V;
  aoMudar: (v: V) => void;
  className?: string;
}) {
  const nome = useId();
  return (
    <fieldset className={cn('m-0 grid min-w-0 gap-1.5 border-0 p-0', className)}>
      <legend className="p-0 text-sm font-semibold text-foreground">{legenda}</legend>
      <div className="flex flex-wrap gap-x-5">
        {opcoes.map((o) => (
          <label key={o.valor} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground md:min-h-10">
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="size-4 accent-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
