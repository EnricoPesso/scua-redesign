import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { paginate } from '@/lib/paginate';

export const TAMANHOS_PAGINA = [10, 25, 50];
const OPCOES = TAMANHOS_PAGINA.map((t) => ({ value: String(t), label: String(t) }));

interface Props { total: number; pagina: number; tamanho: number; aoMudar: (pagina: number, tamanho: number) => void }

// Paginação comum das listas (Extensões, Usuários, Ausências, Auditoria): "Itens por página" e "1–24 de 24".
// pedir ao @PhLima07: paginação com seletor de tamanho (o DataTable do sistema de design pagina no cliente e não tem seletor).
export function Paginacao({ total, pagina, tamanho, aoMudar }: Props) {
  const info = paginate({ total, page: pagina, pageSize: tamanho });
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-end justify-between gap-3">
      <Select
        label="Itens por página"
        options={OPCOES}
        value={String(tamanho)}
        onValueChange={(v) => v && aoMudar(1, Number(v))}
        className="w-36 max-md:[&_button]:h-11"
      />
      <span className="pb-2.5 text-sm tabular-nums text-[var(--color-text-muted)]">{info.from}–{info.to} de {total}</span>
      <div className="flex gap-2">
        <Button variant="secondary" className="max-md:h-11" disabled={!info.hasPrev} onClick={() => aoMudar(info.page - 1, tamanho)}>Anterior</Button>
        <Button variant="secondary" className="max-md:h-11" disabled={!info.hasNext} onClick={() => aoMudar(info.page + 1, tamanho)}>Próxima</Button>
      </div>
    </nav>
  );
}
