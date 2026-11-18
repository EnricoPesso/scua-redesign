import { baixarArquivo } from '@/components/exportar-planilha';
/** Lê o arquivo escolhido como texto. Tenta UTF-8; se não for (Excel antigo salva em Windows-1252), cai para ele. */
export function lerArquivo(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(leitor.error);
    leitor.onload = () => {
      const bytes = new Uint8Array(leitor.result as ArrayBuffer);
      try {
        resolve(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch {
        resolve(new TextDecoder('windows-1252').decode(bytes));
      }
    };
    leitor.readAsArrayBuffer(arquivo);
  });
}

/** Baixa um texto (o modelo CSV da carga) como arquivo. Usa o mesmo download do resto do sistema. */
export function baixarTexto(nome: string, conteudo: string): void {
  baixarArquivo(conteudo, nome, 'text/csv;charset=utf-8');
}
