import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { OPCOES_PESSOAS } from '../../../mock/diretorio';
import type { FiltroRegistros } from '../domain/auditoria';
import type { ChaveFiltro } from './useFiltros';

// Campos com 44px de altura no celular.
const ALVO = 'max-md:[&_input]:h-11 max-md:[&_button]:h-11';
const PESSOAS = [{ value: 'todos', label: 'Todas as pessoas' }, ...OPCOES_PESSOAS];

/** Texto livre que só vai para a URL (e para a consulta) 300 ms depois da última tecla. */
function CampoTextoAtrasado({ rotulo, valor, aoMudar, className }: { rotulo: string; valor: string; aoMudar: (v: string) => void; className?: string }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto === valor) return;
    const t = window.setTimeout(() => aoMudar(texto), 300);
    return () => window.clearTimeout(t);
  }, [texto, valor, aoMudar]);
  return <Field label={rotulo} className={className} inputProps={{ type: 'search', value: texto, onValueChange: (v: string) => setTexto(v) }} />;
}

interface Props {
  filtros: FiltroRegistros;
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
        <DateField label="De" className={cn('w-full md:w-40', ALVO)} value={filtros.de} onChange={(v) => atualizar({ de: v })} />
        <DateField label="Até" className={cn('w-full md:w-40', ALVO)} value={filtros.ate} onChange={(v) => atualizar({ ate: v })} />
        <Select
          label="Quem alterou"
          options={PESSOAS}
          value={filtros.pessoa || 'todos'}
          onValueChange={(v) => atualizar({ quem: v && v !== 'todos' ? v : '' })}
          className={cn('w-full md:w-52', ALVO)}
        />
        <CampoTextoAtrasado rotulo="Buscar item" valor={filtros.busca} aoMudar={(v) => atualizar({ busca: v })} className={cn('w-full md:w-60', ALVO)} />
        {ativos > 0 && <Button variant="ghost" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>}
      </div>
    </div>
  );
}
