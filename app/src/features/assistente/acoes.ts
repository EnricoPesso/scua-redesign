import { CONFIGURACOES } from '../configuracoes/catalogo';
import type { Permissoes } from '../extensoes/domain/types';
import { telasPara, tem, type Permissao } from '../../layout/menu';
import type { Acao, Alvo, CampoAlvo, NomeFerramenta } from './contrato';
import { caminhoInterno } from './rotas';

/**
 * O que o assistente pode fazer para cada pessoa, e a conferência de tudo o que a IA devolve.
 * Regra geral: o robô só faz o que a pessoa logada já pode fazer; na dúvida, recusa.
 */

export interface FormularioAbrivel { id: string; titulo: string; rota: string; permissao: Permissao }

/** Configurações que são só de editar ou não são cadastro (não têm "novo"). */
const SEM_CRIAR = new Set(['parametros', 'mensagens', 'notificacoes', 'assistente-ia']);

/** Cadastros que o robô pode abrir para criar. O id é o mesmo do alvo que o formulário registra. */
export const FORMULARIOS: FormularioAbrivel[] = [
  { id: 'jornada', titulo: 'Jornada de trabalho', rota: '/jornadas/nova', permissao: 'pessoas' },
  { id: 'cadastro:pausas', titulo: 'Perfil de pausas', rota: '/pausas?novo=1', permissao: 'pessoas' },
  { id: 'cadastro:liberacoes', titulo: 'Liberação por diretoria', rota: '/liberacoes-por-diretoria?novo=1', permissao: 'pessoas' },
  ...CONFIGURACOES.filter((c) => !SEM_CRIAR.has(c.slug)).map((c): FormularioAbrivel => ({
    id: `cadastro:${c.slug}`, titulo: c.titulo, rota: `/configuracoes/${c.slug}?novo=1`, permissao: 'administracao',
  })),
];

const formulariosDe = (p: Permissoes) => FORMULARIOS.filter((f) => tem(p, f.permissao));

export function formulariosPara(p: Permissoes): { id: string; titulo: string }[] {
  return formulariosDe(p).map(({ id, titulo }) => ({ id, titulo }));
}

export const formularioPorId = (id: string): FormularioAbrivel | undefined => FORMULARIOS.find((f) => f.id === id);

/** Telas que vão no contexto do pedido: as da busca da pessoa + as de criação dos cadastros que ela pode abrir. */
export function telasDoContexto(p: Permissoes): { titulo: string; para: string }[] {
  return [
    ...telasPara(p).map((t) => ({ titulo: t.titulo, para: t.para })),
    ...formulariosDe(p).map((f) => ({ titulo: `Criar: ${f.titulo}`, para: f.rota })),
  ];
}

/** Filtros que cada tela já lê da URL. Qualquer outro parâmetro é recusado. */
const FILTROS_DA_URL: Record<string, string[]> = {
  '/inicio': ['periodo', 'dia'],
  '/ausencias': ['de', 'ate', 'dia', 'visao', 'gestor', 'colaboradores'],
  '/auditoria': ['de', 'ate', 'quem', 'busca'],
  '/extensoes': ['status', 'de', 'ate', 'busca'],
};
const FILTROS_DE_RELATORIO = ['inicio', 'fim'];

function parametrosPermitidos(caminho: string, rota: string, p: Permissoes): boolean {
  const consulta = new URLSearchParams(rota.split('#')[0].split('?')[1] ?? '');
  const chaves = [...consulta.keys()];
  if (chaves.length === 0) return true;
  // "?novo=1" só nas rotas de criação que a pessoa pode abrir.
  if (chaves.length === 1 && chaves[0] === 'novo') return consulta.get('novo') === '1' && formulariosDe(p).some((f) => f.rota === `${caminho}?novo=1`);
  const aceitos = caminho.startsWith('/relatorios/') ? FILTROS_DE_RELATORIO : FILTROS_DA_URL[caminho] ?? [];
  return chaves.every((c) => aceitos.includes(c));
}

export function rotaPermitida(rota: string, p: Permissoes): boolean {
  const caminho = caminhoInterno(rota);
  if (caminho === null) return false;
  const telas = new Set([...telasPara(p).map((t) => t.para), ...formulariosDe(p).map((f) => f.rota.split('?')[0])]);
  return telas.has(caminho) && parametrosPermitidos(caminho, rota, p);
}

export function ferramentasPara(p: Permissoes, alvo: Alvo | null): NomeFerramenta[] {
  const f: NomeFerramenta[] = [];
  if (alvo?.tipo === 'formulario') f.push('preencher_formulario');
  f.push('navegar');
  if (formulariosDe(p).length > 0) f.push('abrir_formulario');
  return f;
}

/** Confere cada ação devolvida pela IA contra as permissões e a tela aberta. O que não passa é recusado. */
const FERRAMENTA_DA_ACAO: Record<Acao['tipo'], NomeFerramenta> = { preencher: 'preencher_formulario', navegar: 'navegar', abrir_formulario: 'abrir_formulario' };

/** `ferramentas`: as que foram oferecidas neste pedido. Ação de ferramenta não oferecida é recusada. */
export function conferirAcoes(acoes: Acao[], ctx: { permissoes: Permissoes; alvo: Alvo | null; ferramentas?: NomeFerramenta[] }): { validas: Acao[]; recusadas: string[] } {
  const validas: Acao[] = [];
  const recusadas: string[] = [];
  for (const a of acoes) {
    const oferecida = !ctx.ferramentas || (typeof a?.tipo === 'string' && Object.hasOwn(FERRAMENTA_DA_ACAO, a.tipo) && ctx.ferramentas.includes(FERRAMENTA_DA_ACAO[a.tipo]));
    if (!oferecida) {
      recusadas.push(String((a as { tipo?: unknown } | null)?.tipo ?? 'desconhecida'));
    } else if (a?.tipo === 'preencher' && ctx.alvo?.tipo === 'formulario' && typeof a.campos === 'object' && a.campos !== null) {
      const chaves = new Set(ctx.alvo.campos.map((c) => c.chave));
      const campos = Object.fromEntries(Object.entries(a.campos).filter(([k]) => chaves.has(k)));
      if (Object.keys(campos).length > 0) validas.push({ tipo: 'preencher', campos });
      else recusadas.push('preencher');
    } else if (a?.tipo === 'navegar' && typeof a.rota === 'string' && rotaPermitida(a.rota, ctx.permissoes)) {
      validas.push({ tipo: 'navegar', rota: a.rota });
    } else if (a?.tipo === 'abrir_formulario' && formulariosDe(ctx.permissoes).some((f) => f.id === a.formulario)) {
      validas.push({ tipo: 'abrir_formulario', formulario: a.formulario });
    } else {
      recusadas.push(String((a as { tipo?: unknown } | null)?.tipo ?? 'desconhecida'));
    }
  }
  return { validas, recusadas };
}

/* ---------- Valores dos campos ---------- */

const dois = (n: number) => String(n).padStart(2, '0');
const simples = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** "8h", "8:5", "17:30" → "HH:MM". Vazio continua vazio. */
export function normalizarHora(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const t = valor.trim().toLowerCase();
  if (t === '') return '';
  const m = /^(\d{1,2})(?:(?::|h)(\d{1,2})|h)?$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  return h <= 23 && min <= 59 ? `${dois(h)}:${dois(min)}` : null;
}

function normalizarData(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : t;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00`);
  // new Date "arruma" datas impossíveis (31/02 vira 03/03): confere de volta.
  const volta = `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  return volta === iso ? iso : null;
}

/** Converte o valor que a IA mandou para o tipo do campo. Fora do formato ou dos limites: não vale. */
export function normalizarCampo(campo: CampoAlvo, valor: unknown): { ok: true; valor: unknown } | { ok: false } {
  const nao = { ok: false } as const;
  switch (campo.tipo) {
    case 'numero': {
      const n = typeof valor === 'number' ? valor : typeof valor === 'string' && valor.trim() !== '' ? Number(valor.trim().replace(',', '.')) : Number.NaN;
      if (!Number.isFinite(n)) return nao;
      if ((campo.minimo !== undefined && n < campo.minimo) || (campo.maximo !== undefined && n > campo.maximo)) return nao;
      return { ok: true, valor: n };
    }
    case 'hora': {
      const h = normalizarHora(valor);
      return h === null ? nao : { ok: true, valor: h };
    }
    case 'data': {
      const d = normalizarData(valor);
      return d === null ? nao : { ok: true, valor: d };
    }
    case 'select': {
      if (typeof valor !== 'string') return nao;
      const alvo = simples(valor);
      const opcao = campo.opcoes?.find((o) => o.value === valor) ?? campo.opcoes?.find((o) => simples(o.label) === alvo || simples(o.value) === alvo);
      return opcao ? { ok: true, valor: opcao.value } : nao;
    }
    case 'alternar': {
      if (typeof valor === 'boolean') return { ok: true, valor };
      if (typeof valor !== 'string') return nao;
      const t = simples(valor);
      if (['sim', 'true', 'ligado', 'ligada', 'ativo', 'ativa'].includes(t)) return { ok: true, valor: true };
      if (['nao', 'false', 'desligado', 'desligada', 'inativo', 'inativa'].includes(t)) return { ok: true, valor: false };
      return nao;
    }
    case 'texto':
    case 'textoLongo': {
      if (typeof valor !== 'string' && typeof valor !== 'number') return nao;
      const t = String(valor).trim();
      return { ok: true, valor: campo.maximo !== undefined ? t.slice(0, campo.maximo) : t };
    }
    default:
      // 'semana' tem regra própria (jornadas/assistente.ts).
      return nao;
  }
}

export interface ResultadoAplicar {
  /** O que foi colocado no formulário, em texto para a pessoa conferir. */
  aplicados: { rotulo: string; valor: string }[];
  /** Rótulos dos campos que a IA mandou, mas com valor que não serve. */
  ignorados: string[];
}

/** Texto de um valor para mostrar na conversa. */
export function textoDoValor(campo: CampoAlvo, valor: unknown): string {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (campo.tipo === 'select') return campo.opcoes?.find((o) => o.value === valor)?.label ?? String(valor);
  if (campo.tipo === 'data' && typeof valor === 'string') return valor.split('-').reverse().join('/');
  return valor === '' ? '(vazio)' : String(valor);
}

/** Normaliza os valores para os campos simples de um formulário (cadastros do modelo único). */
export function aplicarCampos(campos: CampoAlvo[], valores: Record<string, unknown>): { validos: Record<string, unknown>; resultado: ResultadoAplicar } {
  const validos: Record<string, unknown> = {};
  const resultado: ResultadoAplicar = { aplicados: [], ignorados: [] };
  for (const campo of campos) {
    if (!Object.hasOwn(valores, campo.chave)) continue;
    const n = normalizarCampo(campo, valores[campo.chave]);
    if (n.ok) {
      validos[campo.chave] = n.valor;
      resultado.aplicados.push({ rotulo: campo.rotulo, valor: textoDoValor(campo, n.valor) });
    } else {
      resultado.ignorados.push(campo.rotulo);
    }
  }
  return { validos, resultado };
}
