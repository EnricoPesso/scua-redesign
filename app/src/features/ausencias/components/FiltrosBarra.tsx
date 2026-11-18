import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OPCOES_GESTORES, OPCOES_PESSOAS } from '../../../mock/diretorio';
import type { ChaveFiltro } from './useFiltros';

// Campos com 44px de altura no celular.
const ALVO = 'max-md:[&_input]:h-11 max-md:[&_button]:h-11';
const GESTORES = [{ value: 'todos', label: 'Todos os gestores' }, ...OPCOES_GESTORES];

interface Props {
  filtros: { de: string; ate: string; colaboradores: string[]; gestor: string };
  ativos: number;
  atualizar: (m: Partial<Record<ChaveFiltro, string>>) => void;
  limpar: () => void;
}

export function FiltrosBarra({ filtros, ativos, atualizar, limpar }: Props) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  return (
    <div className="grid gap-3">
      {/* Celular (< 768px): os filtros ficam num painel que expande abaixo deste botão. */}
      <Button variant="secondary" className="justify-self-start max-md:h-11 md:hidden" aria-expanded={aberto} aria-controls={idPainel} onClick={() => setAberto((a) => !a)}>
        Filtros{ativos > 0 ? ` (${ativos})` : ''}
      </Button>
      <div id={idPainel} className={cn('grid gap-3 md:flex md:flex-wrap md:items-end', !aberto && 'max-md:hidden')}>
        <MultiSelect
          label="Colaboradores"
          options={OPCOES_PESSOAS}
          values={filtros.colaboradores}
          onValuesChange={(v) => atualizar({ colaboradores: v.join(',') })}
          placeholder="Todos os colaboradores"
          className={cn('w-full md:w-64', ALVO)}
        />
        <Select
          label="Gestor"
          options={GESTORES}
          value={filtros.gestor || 'todos'}
          onValueChange={(v) => atualizar({ gestor: v && v !== 'todos' ? v : '' })}
          className={cn('w-full md:w-52', ALVO)}
        />
        <DateField label="De" className={cn('w-full md:w-40', ALVO)} value={filtros.de} onChange={(v) => atualizar({ de: v })} />
        <DateField label="Até" className={cn('w-full md:w-40', ALVO)} value={filtros.ate} onChange={(v) => atualizar({ ate: v })} />
        {ativos > 0 && <Button variant="ghost" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>}
      </div>
    </div>
  );
}
