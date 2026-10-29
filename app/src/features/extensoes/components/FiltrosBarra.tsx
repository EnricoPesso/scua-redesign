import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { extensoesApi } from '../api/extensoesApi';
import type { Aba, Filtros } from '../domain/types';
import { semPaginacao, type ChaveFiltro } from './useFiltros';

// Campos com 44px de altura no celular.
const ALVO = 'max-md:[&_input]:h-11 max-md:[&_button]:h-11';
const CAMPO = cn('w-full md:w-44', ALVO);

const STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'cancelado', label: 'Cancelado' },
];

/** Texto livre que só vai para a URL (e para a API) 300 ms depois da última tecla. */
function CampoTextoAtrasado({ rotulo, valor, aoMudar }: { rotulo: string; valor: string; aoMudar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto === valor) return;
    const t = window.setTimeout(() => aoMudar(texto), 300);
    return () => window.clearTimeout(t);
  }, [texto, valor, aoMudar]);
  return <Field label={rotulo} className={CAMPO} inputProps={{ type: 'search', value: texto, onValueChange: (v: string) => setTexto(v) }} />;
}

interface Props {
  aba: Aba;
  filtros: Filtros;
  ativos: number;
  atualizar: (m: Partial<Record<ChaveFiltro, string>>) => void;
  limpar: () => void;
}

export function FiltrosBarra({ aba, filtros, ativos, atualizar, limpar }: Props) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();

  return (
    <div className="grid gap-3">
      {/* Celular (< 768px): os filtros ficam num painel que expande abaixo deste botão. */}
      <Button variant="secondary" className="justify-self-start max-md:h-11 md:hidden" aria-expanded={aberto} aria-controls={idPainel} onClick={() => setAberto((a) => !a)}>
        Filtros{ativos > 0 ? ` (${ativos})` : ''}
      </Button>
      <div id={idPainel} className={cn('grid gap-3 md:flex md:flex-wrap md:items-end', !aberto && 'max-md:hidden')}>
        <DateField label="De" className={CAMPO} value={filtros.de} onChange={(v) => atualizar({ de: v })} />
        <DateField label="Até" className={CAMPO} value={filtros.ate} onChange={(v) => atualizar({ ate: v })} />
        {aba !== 'aprovar' && (
          <Select
            label="Status"
            options={STATUS}
            value={filtros.status ?? 'todos'}
            onValueChange={(v) => atualizar({ status: v && v !== 'todos' ? v : '' })}
            className={CAMPO}
          />
        )}
        <CampoTextoAtrasado rotulo="Pessoa" valor={filtros.pessoa ?? ''} aoMudar={(v) => atualizar({ pessoa: v })} />
        {aba === 'todos' && (
          <>
            <CampoTextoAtrasado rotulo="Gestor" valor={filtros.gestor ?? ''} aoMudar={(v) => atualizar({ gestor: v })} />
            <CampoTextoAtrasado rotulo="Grupo" valor={filtros.grupo ?? ''} aoMudar={(v) => atualizar({ grupo: v })} />
            <a className={cn(buttonVariants({ variant: 'secondary' }), 'max-md:h-11')} href={extensoesApi.exportarUrl(semPaginacao(filtros))} download>Exportar</a>
          </>
        )}
        {ativos > 0 && <Button variant="ghost" className="max-md:h-11" onClick={limpar}>Limpar filtros</Button>}
      </div>
    </div>
  );
}
