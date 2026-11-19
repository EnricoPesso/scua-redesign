import { nomeDe } from '../../../mock/diretorio';
import { Paginacao } from '../../../componentes/Paginacao';
import { duracaoEmMinutos, formatarData, formatarDuracao, type Ausencia } from '../domain/ausencias';
import { ESTILO_MOTIVO } from './estiloMotivo';

interface Props {
  ausencias: Ausencia[];
  pagina: number;
  tamanho: number;
  aoMudarPagina: (pagina: number, tamanho: number) => void;
}

export function TabelaAusencias({ ausencias, pagina, tamanho, aoMudarPagina }: Props) {
  // Mesma regra do paginar() do sistema de design: página fora do intervalo vale a última.
  const ultima = Math.max(1, Math.ceil(ausencias.length / tamanho));
  const atual = Math.min(pagina, ultima);
  const visiveis = ausencias.slice((atual - 1) * tamanho, atual * tamanho);
  return (
    <section aria-label="Ausências em tabela" className="grid min-w-0 gap-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Ausências por pessoa, dia e horário</caption>
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              {['Pessoa', 'Dia', 'Início', 'Fim', 'Duração', 'Motivo'].map((c) => (
                <th key={c} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap text-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-[var(--color-row-hover)]">
                <th scope="row" className="px-4 py-3 font-semibold whitespace-nowrap text-foreground">{nomeDe(a.pessoaId)}</th>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatarData(a.dia)}</td>
                <td className="px-4 py-3 tabular-nums">{a.inicio}</td>
                <td className="px-4 py-3 tabular-nums">{a.fim}</td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatarDuracao(duracaoEmMinutos(a))}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm" style={ESTILO_MOTIVO[a.motivo]} />
                    {a.motivo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacao total={ausencias.length} pagina={atual} tamanho={tamanho} aoMudar={aoMudarPagina} />
    </section>
  );
}
