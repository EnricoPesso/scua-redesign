import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/format-number';
import { exportarPlanilha } from '@/components/exportar-planilha';
import type { ColunaPlanilha } from '@/lib/planilha';

/**
 * "Exportar para Excel": baixa as linhas que a tela está mostrando (todas as filtradas, não só a página)
 * e avisa quantas foram. Fica desabilitado enquanto carrega ou quando não há linhas.
 */
export function BotaoExportar<T>({ arquivo, colunas, linhas, desabilitado = false }: {
  /** Nome do arquivo, sem extensão. */
  arquivo: string;
  colunas: ColunaPlanilha<T>[];
  linhas: T[];
  desabilitado?: boolean;
}) {
  const toast = useToast();
  const exportar = () => {
    const nome = exportarPlanilha({ arquivo, colunas, linhas });
    toast.success(`${formatNumber(linhas.length)} ${linhas.length === 1 ? 'registro exportado' : 'registros exportados'} em ${nome}`);
  };
  return (
    <Button variant="secondary" disabled={desabilitado || linhas.length === 0} onClick={exportar}>
      <DownloadIcon aria-hidden="true" />
      Exportar para Excel
    </Button>
  );
}
