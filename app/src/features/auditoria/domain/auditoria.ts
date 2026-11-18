export type Aba = 'parametros' | 'jornadas' | 'excecoes' | 'liberacoes' | 'whatsapp';
export const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'parametros', rotulo: 'Parâmetros' },
  { valor: 'jornadas', rotulo: 'Jornadas' },
  { valor: 'excecoes', rotulo: 'Exceções' },
  { valor: 'liberacoes', rotulo: 'Liberações de regra' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
];

export type Acao = 'Criou' | 'Alterou' | 'Excluiu';

export interface Registro {
  id: string;
  aba: Aba;
  /** Nome amigável do item, nunca um código. */
  item: string;
  acao: Acao;
  /** null = não havia valor (mostra "vazio"). */
  anterior: string | null;
  novo: string | null;
  pessoaId: string;
  /** YYYY-MM-DDTHH:MM:00, hora local. */
  quando: string;
}

export interface FiltroRegistros {
  de: string;
  ate: string;
  /** Id de quem alterou; vazio = qualquer pessoa. */
  pessoa: string;
  busca: string;
}

export const ehAba = (v: string | undefined): v is Aba => ABAS.some((a) => a.valor === v);
/** Aba inválida cai na primeira. */
export const abaOuPrimeira = (v: string | undefined): Aba => (ehAba(v) ? v : ABAS[0].valor);
export const rotuloDaAba = (aba: Aba): string => ABAS.find((a) => a.valor === aba)!.rotulo;

/** Minúsculas e sem acento, para a busca achar "excecao" em "Exceção". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Aplica período, pessoa e busca por item. De e Até vazios não limitam. Mais recentes primeiro. */
export function filtrarRegistros(registros: Registro[], f: FiltroRegistros): Registro[] {
  const busca = normalizar(f.busca);
  return registros
    .filter((r) => {
      const dia = r.quando.slice(0, 10);
      return (!f.de || dia >= f.de) && (!f.ate || dia <= f.ate) && (!f.pessoa || r.pessoaId === f.pessoa) && (!busca || normalizar(r.item).includes(busca));
    })
    .sort((a, b) => b.quando.localeCompare(a.quando) || a.id.localeCompare(b.id));
}

/** "2026-10-11T08:30:00" → "11/10/2026 08:30". */
export function formatarDataHora(quando: string): string {
  const [dia, hora] = quando.split('T');
  const [a, m, d] = dia.split('-');
  return `${d}/${m}/${a} ${hora.slice(0, 5)}`;
}

/** Nome do arquivo exportado: "auditoria-liberacoes-de-regra-2026-10-12.csv". */
export function nomeDoArquivo(aba: Aba, hoje: string): string {
  return `auditoria-${normalizar(rotuloDaAba(aba)).replaceAll(' ', '-')}-${hoje}.csv`;
}
