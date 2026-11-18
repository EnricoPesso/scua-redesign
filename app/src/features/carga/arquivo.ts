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

/** Baixa um texto como arquivo. */
export function baixarTexto(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
