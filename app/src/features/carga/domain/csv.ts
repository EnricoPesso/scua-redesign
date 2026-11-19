export interface LinhaCsv {
  /** Número da linha no arquivo (a primeira linha, o cabeçalho, é a 1). É o número que a pessoa vê no Excel. */
  linha: number;
  celulas: string[];
}

/** Escolhe ";" (padrão do Excel em português) ou "," pela primeira linha do arquivo. */
export function detectarSeparador(texto: string): ';' | ',' {
  const primeira = texto.replace(/^﻿/, '').split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  const pontoEVirgula = (primeira.match(/;/g) ?? []).length;
  const virgulas = (primeira.match(/,/g) ?? []).length;
  return virgulas > pontoEVirgula ? ',' : ';';
}

/** Lê CSV com aspas ("a;b" e "" dentro de aspas), BOM e quebras \r\n. Linhas totalmente vazias são ignoradas. */
export function lerCsv(texto: string): LinhaCsv[] {
  const sep = detectarSeparador(texto);
  const t = texto.replace(/^﻿/, '');
  const linhas: LinhaCsv[] = [];
  let celulas: string[] = [];
  let atual = '';
  let aspas = false;
  let linhaAtual = 1;
  let inicio = 1;

  const fecharCelula = () => { celulas.push(atual); atual = ''; };
  const fecharLinha = () => {
    fecharCelula();
    if (celulas.some((c) => c.trim() !== '')) linhas.push({ linha: inicio, celulas: celulas.map((c) => c.trim()) });
    celulas = [];
  };

  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (aspas) {
      if (c === '"') {
        if (t[i + 1] === '"') { atual += '"'; i += 1; } else aspas = false;
      } else {
        if (c === '\n') linhaAtual += 1;
        atual += c;
      }
    } else if (c === '"' && atual === '') {
      aspas = true;
    } else if (c === sep) {
      fecharCelula();
    } else if (c === '\n') {
      fecharLinha();
      linhaAtual += 1;
      inicio = linhaAtual;
    } else if (c !== '\r') {
      atual += c;
    }
  }
  if (atual !== '' || celulas.length > 0) fecharLinha();
  return linhas;
}

const celula = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV para o Excel em português: separador ";", quebra \r\n e BOM UTF-8 (sem ele os acentos quebram). */
export function gerarCsv(linhas: string[][]): string {
  return `﻿${linhas.map((l) => l.map(celula).join(';')).join('\r\n')}\r\n`;
}
