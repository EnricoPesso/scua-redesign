import { vi } from 'vitest';

/**
 * Captura os downloads feitos pela tela (jsdom não baixa arquivos): nome de cada arquivo e o conteúdo do último.
 * Use no começo do teste, antes de clicar em "Exportar para Excel".
 */
export function capturarDownloads() {
  const blobs: Blob[] = [];
  const arquivos: string[] = [];
  URL.createObjectURL = vi.fn((b: Blob) => {
    blobs.push(b);
    return `blob:teste-${blobs.length}`;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    arquivos.push(this.download);
  });
  return {
    arquivos,
    /** Linhas do último arquivo baixado (sem o BOM). */
    linhas: async (): Promise<string[]> => (await blobs.at(-1)!.text()).replace('﻿', '').split('\r\n'),
  };
}
