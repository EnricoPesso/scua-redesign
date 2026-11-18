import { gerarCsv } from '@/lib/csv';
import { nomeDe } from '../../mock/diretorio';
import { formatarDataHora, type Registro } from './domain/auditoria';

/** CSV da aba atual, com as mesmas linhas que os filtros mostram (não só a página). Neutraliza fórmulas em `gerarCsv`. */
export function csvDosRegistros(registros: Registro[]): string {
  return gerarCsv<Registro>(
    [
      { header: 'Item alterado', texto: (r) => r.item },
      { header: 'Ação', texto: (r) => r.acao },
      { header: 'Valor anterior', texto: (r) => r.anterior ?? '' },
      { header: 'Valor novo', texto: (r) => r.novo ?? '' },
      { header: 'Quem alterou', texto: (r) => nomeDe(r.pessoaId) },
      { header: 'Data e hora', texto: (r) => formatarDataHora(r.quando) },
    ],
    registros,
  );
}

/** Mesmo download do modelo de relatório. */
export function baixarCsv(csv: string, arquivo: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  // Safari e Firefox só baixam com o link no DOM e a URL ainda válida durante o clique.
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
