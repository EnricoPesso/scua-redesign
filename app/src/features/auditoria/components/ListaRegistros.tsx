import { Badge } from '@/components/ui/badge';
import { nomeDe } from '../../../mock/diretorio';
import { formatarDataHora, type Acao, type Registro } from '../domain/auditoria';

const STATUS_ACAO: Record<Acao, 'success' | 'info' | 'danger'> = { Criou: 'success', Alterou: 'info', Excluiu: 'danger' };

export function SeloAcao({ acao }: { acao: Acao }) {
  return <Badge status={STATUS_ACAO[acao]}>{acao}</Badge>;
}

function Valor({ texto }: { texto: string | null }) {
  return texto === null ? <em className="text-muted-foreground">vazio</em> : <span>{texto}</span>;
}

/** Valor anterior → valor novo. A seta é decorativa; o leitor de tela ouve "para". */
export function Mudanca({ anterior, novo }: { anterior: string | null; novo: string | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <Valor texto={anterior} />
      <span aria-hidden="true" className="text-muted-foreground">→</span>
      <span className="sr-only">para</span>
      <Valor texto={novo} />
    </span>
  );
}

export function TabelaRegistros({ registros }: { registros: Registro[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Alterações registradas</caption>
        <thead className="bg-[var(--color-surface-muted)]">
          <tr>
            {['Item alterado', 'Ação', 'Valor anterior e novo', 'Quem alterou', 'Data e hora'].map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-[var(--color-row-hover)]">
              <th scope="row" className="px-4 py-3 font-semibold text-foreground">{r.item}</th>
              <td className="px-4 py-3"><SeloAcao acao={r.acao} /></td>
              <td className="px-4 py-3"><Mudanca anterior={r.anterior} novo={r.novo} /></td>
              <td className="px-4 py-3 whitespace-nowrap">{nomeDe(r.pessoaId)}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatarDataHora(r.quando)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Celular: um cartão por registro. */
export function CartoesRegistros({ registros }: { registros: Registro[] }) {
  return (
    <ul aria-label="Alterações registradas" className="grid gap-3">
      {registros.map((r) => (
        <li key={r.id} className="grid gap-2 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-foreground">{r.item}</p>
            <SeloAcao acao={r.acao} />
          </div>
          <p><Mudanca anterior={r.anterior} novo={r.novo} /></p>
          <p className="text-xs text-muted-foreground">
            {nomeDe(r.pessoaId)} · <span className="tabular-nums">{formatarDataHora(r.quando)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
