import { DIRETORIAS, PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import type { ColunaCarga, DefinicaoCarga } from './cargas';
import { lerCsv } from './csv';

export const TAMANHO_MAXIMO = 2 * 1024 * 1024;
export const LINHAS_MAXIMAS = 5000;
export const LIMITE_DE_PROBLEMAS = 20;

export type LinhaDeCarga = Record<string, string>;
export interface ProblemaLinha { linha: number; mensagem: string }

export type ResultadoArquivo =
  | { ok: false; erro: string }
  | { ok: true; total: number; validas: LinhaDeCarga[]; problemas: ProblemaLinha[] };

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** "dd/mm/aaaa" → "aaaa-mm-dd" se for uma data que existe no calendário; senão null. */
export function dataParaIso(texto: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(ano, mes - 1, dia, 12);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** "h:mm" ou "hh:mm" → "hh:mm"; senão null. */
export function horaValida(texto: string): string | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(texto.trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

/** Telefone brasileiro com DDD: 10 ou 11 números (aceita parênteses, espaço, hífen e +55). */
export function telefoneValido(texto: string): boolean {
  let numeros = texto.replace(/\D/g, '');
  if (/^\+?\s*55/.test(texto.trim()) && numeros.length >= 12) numeros = numeros.slice(2);
  if (numeros.length !== 10 && numeros.length !== 11) return false;
  if (numeros[0] === '0' || numeros[1] === '0') return false;
  return numeros.length === 10 || numeros[2] === '9';
}

const loginExiste = (valor: string) => PESSOAS_DIRETORIO.some((p) => p.login === valor.trim().toLowerCase());

/** Texto do problema de uma célula (sem o prefixo "Linha N:"), ou nada se estiver certa. */
export function problemaDaCelula(coluna: ColunaCarga, valor: string): string | undefined {
  const v = valor.trim();
  if (!v) return `a coluna "${coluna.nome}" está vazia`;
  switch (coluna.tipo) {
    case 'data':
      return dataParaIso(v) ? undefined : `"${coluna.nome}" tem uma data que não existe (${v}). Use dd/mm/aaaa`;
    case 'hora':
      return horaValida(v) ? undefined : `"${coluna.nome}" tem uma hora inválida (${v}). Use hh:mm`;
    case 'login':
      return loginExiste(v) ? undefined : `o login ${v} não existe`;
    case 'telefone':
      return telefoneValido(v) ? undefined : `o telefone ${v} precisa ter DDD e 10 ou 11 números`;
    case 'diretoria':
      return DIRETORIAS.some((d) => norm(d) === norm(v)) ? undefined : `a diretoria ${v} não existe`;
    default:
      return undefined;
  }
}

function problemaDoIntervalo(carga: DefinicaoCarga, linha: LinhaDeCarga): string[] {
  const out: string[] = [];
  for (const i of carga.intervalos) {
    const ini = i.tipo === 'data' ? dataParaIso(linha[i.inicio]) : horaValida(linha[i.inicio]);
    const fim = i.tipo === 'data' ? dataParaIso(linha[i.fim]) : horaValida(linha[i.fim]);
    if (!ini || !fim) continue; // o problema da célula já foi apontado
    if (i.tipo === 'data' && fim < ini) out.push('a data final é anterior à inicial');
    if (i.tipo === 'hora' && fim <= ini) out.push('a hora final precisa ser depois da inicial');
  }
  return out;
}

export interface EntradaArquivo { nome: string; tamanho: number; texto: string }

const MB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;

/** Confere o arquivo inteiro: extensão, tamanho, cabeçalho e cada linha. Nada aqui chega ao servidor. */
export function validarArquivo(arquivo: EntradaArquivo, carga: DefinicaoCarga): ResultadoArquivo {
  if (!arquivo.nome.toLowerCase().endsWith('.csv')) {
    return { ok: false, erro: 'Este arquivo não é um CSV. No Excel, use Salvar como e escolha "CSV (separado por vírgulas)".' };
  }
  if (arquivo.tamanho > TAMANHO_MAXIMO) {
    return { ok: false, erro: `O arquivo tem ${MB(arquivo.tamanho)} e o máximo é ${MB(TAMANHO_MAXIMO)}. Divida em arquivos menores.` };
  }
  if (arquivo.tamanho === 0 || arquivo.texto.trim() === '') {
    return { ok: false, erro: 'O arquivo está vazio. Baixe o modelo, preencha e envie de novo.' };
  }
  if (arquivo.texto.includes('\u0000')) {
    return { ok: false, erro: 'O conteúdo do arquivo não é texto. Salve a planilha como CSV e envie de novo.' };
  }

  const [cabecalho, ...dados] = lerCsv(arquivo.texto);
  const esperado = carga.colunas.map((c) => c.nome);
  const confere = cabecalho.celulas.length === esperado.length && esperado.every((nome, i) => norm(nome) === norm(cabecalho.celulas[i]));
  if (!confere) {
    return { ok: false, erro: 'O arquivo não tem as colunas do modelo. Baixe o modelo e copie os dados para ele.' };
  }
  if (dados.length === 0) {
    return { ok: false, erro: 'O arquivo só tem o cabeçalho. Preencha ao menos uma linha de dados.' };
  }
  if (dados.length > LINHAS_MAXIMAS) {
    return { ok: false, erro: `O arquivo tem mais de ${LINHAS_MAXIMAS.toLocaleString('pt-BR')} linhas. Divida em arquivos menores.` };
  }

  const validas: LinhaDeCarga[] = [];
  const problemas: ProblemaLinha[] = [];
  for (const { linha, celulas } of dados) {
    if (celulas.length !== esperado.length) {
      problemas.push({ linha, mensagem: `a linha tem ${celulas.length} colunas e o modelo tem ${esperado.length}` });
      continue;
    }
    const valores: LinhaDeCarga = Object.fromEntries(esperado.map((nome, i) => [nome, celulas[i]]));
    const erros = carga.colunas.flatMap((c) => problemaDaCelula(c, valores[c.nome]) ?? []);
    erros.push(...problemaDoIntervalo(carga, valores));
    if (erros.length > 0) problemas.push({ linha, mensagem: erros.join('; ') });
    else validas.push(valores);
  }
  return { ok: true, total: dados.length, validas, problemas };
}
