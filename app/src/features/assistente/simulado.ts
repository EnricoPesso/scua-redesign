import { DIAS, DIAS_UTEIS, TIPOS_DE_JORNADA, type DadosJornada, type Dia, type HorarioDia, type Semana } from '../jornadas/domain/tipos';
import type { Acao, AlvoFormulario, AlvoRelatorio, CampoAlvo, ContextoTela, PedidoAssistente, RespostaAssistente } from './contrato';

/**
 * Modo de demonstração: respostas prontas e previsíveis, sem IA, pelo mesmo contrato do servidor.
 * É o que roda quando não há chave configurada e em todos os testes automáticos.
 * Entende só as formas mais comuns de pedir; a IA de verdade entende o resto.
 */

/** Minúsculas e sem acento, mantendo o mesmo tamanho do texto (os índices batem com o original). */
const simples = (t: string) => t.normalize('NFC').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dois = (n: number) => String(n).padStart(2, '0');

/* ---------- Jornada ---------- */

const HORA = String.raw`(\d{1,2})(?:(?::|h)(\d{2})|h)?`;
const FAIXA = new RegExp(String.raw`${HORA}\s*(?:as|a|ate|-|–)\s*${HORA}(?![\d/])`);
const NOME_DO_DIA: [RegExp, Dia][] = [
  [/^seg(unda)?/, 'seg'], [/^ter(ca)?/, 'ter'], [/^qua(rta)?/, 'qua'], [/^qui(nta)?/, 'qui'], [/^sex(ta)?/, 'sex'], [/^sab(ado)?/, 'sab'], [/^dom(ingo)?/, 'dom'],
];
const PALAVRA_DIA = String.raw`\b(seg(?:unda)?|ter(?:ca)?|qua(?:rta)?|qui(?:nta)?|sex(?:ta)?|sab(?:ado)?|dom(?:ingo)?)(?:-feira)?s?\b`;

function hora(h: string, m: string | undefined): string | null {
  const hh = Number(h);
  const mm = Number(m ?? 0);
  return hh <= 23 && mm <= 59 ? `${dois(hh)}:${dois(mm)}` : null;
}

/** Primeira faixa "X às Y" do texto: as duas horas e onde ela está. */
function faixa(texto: string): { inicio: string; fim: string; de: number; ate: number } | null {
  const m = FAIXA.exec(texto);
  if (!m) return null;
  const inicio = hora(m[1], m[2]);
  const fim = hora(m[3], m[4]);
  return inicio && fim ? { inicio, fim, de: m.index, ate: m.index + m[0].length } : null;
}

const diaDe = (palavra: string): Dia | undefined => NOME_DO_DIA.find(([re]) => re.test(palavra))?.[1];

function diasCitados(texto: string): Dia[] {
  if (/todos os dias|a semana (toda|inteira)|de domingo a domingo/.test(texto)) return [...DIAS];
  if (/dias uteis/.test(texto)) return [...DIAS_UTEIS];
  const dias = new Set<Dia>();
  const intervalo = new RegExp(String.raw`${PALAVRA_DIA}\s+(?:a|ate)\s+${PALAVRA_DIA}`, 'g');
  for (const m of texto.matchAll(intervalo)) {
    const de = DIAS.indexOf(diaDe(m[1])!);
    const ate = DIAS.indexOf(diaDe(m[2])!);
    if (de <= ate) for (let i = de; i <= ate; i++) dias.add(DIAS[i]);
  }
  for (const m of texto.matchAll(new RegExp(PALAVRA_DIA, 'g'))) {
    // "ter" sozinho só conta como terça quando vem numa lista de dias ("seg, ter e qua"), não em "preciso ter".
    if (m[1] === 'ter' && !new RegExp(String.raw`(${PALAVRA_DIA}[\s,e]+)ter\b|\bter[\s,e]+${PALAVRA_DIA}`).test(texto)) continue;
    const d = diaDe(m[1]);
    if (d) dias.add(d);
  }
  return DIAS.filter((d) => dias.has(d));
}

/** Lê uma jornada escrita em texto livre. Só devolve o que conseguiu ler; sem horário, não devolve semana. */
export function interpretarJornada(textoOriginal: string): Partial<DadosJornada> {
  let texto = simples(textoOriginal);
  const saida: Partial<DadosJornada> = {};

  const id = /\b(?:nome|identificador|chamad[ao])\s*[:=]?\s*([a-z0-9][a-z0-9_-]{0,19})/.exec(texto);
  if (id) {
    saida.identificador = id[1].toUpperCase();
    texto = texto.slice(0, id.index) + ' '.repeat(id[0].length) + texto.slice(id.index + id[0].length);
  }
  const tipo = TIPOS_DE_JORNADA.find((t) => new RegExp(String.raw`\b${simples(t)}\b`).test(texto));
  if (tipo) saida.tipo = tipo;

  // Intervalo primeiro ("almoço 12 às 13"), para a faixa dele não ser confundida com o horário de trabalho.
  let intervalo: { inicio: string; fim: string } | null = null;
  const marca = /\b(almoco|intervalo|pausa|descanso)\b/.exec(texto);
  const semIntervalo = /sem (intervalo|almoco|pausa)/.test(texto);
  if (marca && !semIntervalo) {
    const resto = texto.slice(marca.index);
    const f = faixa(resto);
    // A faixa precisa estar logo depois da palavra ("almoço das 12 às 13"), não em outra frase.
    if (f && f.de <= marca[0].length + 8) {
      intervalo = { inicio: f.inicio, fim: f.fim };
      texto = texto.slice(0, marca.index) + ' '.repeat(f.ate) + resto.slice(f.ate);
    }
  }

  const trabalho = faixa(texto);
  if (!trabalho) return saida;

  const citados = diasCitados(texto);
  const dias = citados.length > 0 ? citados : DIAS_UTEIS;
  const folga: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
  const dia: HorarioDia = { trabalha: true, entrada: trabalho.inicio, saida: trabalho.fim, intervaloInicio: intervalo?.inicio ?? '', intervaloFim: intervalo?.fim ?? '' };
  saida.semana = Object.fromEntries(DIAS.map((d) => [d, dias.includes(d) ? { ...dia } : { ...folga }])) as Semana;
  return saida;
}

/* ---------- Cadastro genérico ---------- */

function valorDoCampo(campo: CampoAlvo, bruto: string): unknown {
  const s = simples(bruto).trim();
  switch (campo.tipo) {
    case 'numero': {
      const m = /-?\d+(?:[.,]\d+)?/.exec(s);
      return m ? Number(m[0].replace(',', '.')) : undefined;
    }
    case 'alternar':
      if (/^(sim|s|true|ligad[ao]|ativ[ao]|verdadeiro)\b/.test(s)) return true;
      if (/^(nao|n|false|desligad[ao]|inativ[ao]|falso)\b/.test(s)) return false;
      return undefined;
    case 'select':
      return campo.opcoes?.find((o) => simples(o.label) === s || simples(o.value) === s)?.value;
    case 'hora': {
      const m = new RegExp(`^${HORA}`).exec(s);
      return m ? hora(m[1], m[2]) ?? undefined : undefined;
    }
    case 'data': {
      const iso = /\d{4}-\d{2}-\d{2}/.exec(s);
      if (iso) return iso[0];
      const br = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
      return br ? `${br[3]}-${br[2]}-${br[1]}` : undefined;
    }
    case 'semana':
      return undefined;
    default:
      return bruto.trim() || undefined;
  }
}

/** Procura "rótulo: valor" (ou "rótulo valor") para cada campo; o valor vai até a vírgula, ponto e vírgula ou fim. */
function lerCampos(alvo: AlvoFormulario, textoOriginal: string): Record<string, unknown> {
  const original = textoOriginal.normalize('NFC');
  const texto = simples(original);
  const campos: Record<string, unknown> = {};
  // Rótulos mais compridos primeiro, para "Tipo de pausa" não ser lido como "Tipo".
  for (const campo of [...alvo.campos].sort((a, b) => b.rotulo.length - a.rotulo.length)) {
    const rotulo = simples(campo.rotulo).replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const m = new RegExp(String.raw`(?:^|[\s,;])${rotulo}\s*[:=]?\s+([^,;\n]+)`).exec(texto);
    if (!m) continue;
    const inicio = m.index + m[0].length - m[1].length;
    const valor = valorDoCampo(campo, original.slice(inicio, inicio + m[1].length));
    if (valor !== undefined) campos[campo.chave] = valor;
  }
  return campos;
}

/* ---------- Relatório, navegação e dúvidas ---------- */

function analisar(alvo: AlvoRelatorio): string {
  if (alvo.totalDeLinhas === 0) return `${alvo.titulo}: Não há dados com esses filtros. Tente ampliar o período.`;
  const filtros = Object.entries(alvo.filtros).map(([k, v]) => `${k}: ${v}`).join('; ');
  const linhas = alvo.linhas.slice(0, 3).map((l) => `- ${l.join(' · ')}`).join('\n');
  return [
    `${alvo.titulo}: ${alvo.totalDeLinhas} ${alvo.totalDeLinhas === 1 ? 'linha' : 'linhas'}${filtros ? ` (${filtros})` : ''}.`,
    alvo.indicadores.length > 0 ? `Indicadores:\n${alvo.indicadores.map((i) => `- ${i.rotulo}: ${i.valor}`).join('\n')}` : '',
    `Primeiras linhas:\n${linhas}`,
    'Este é o resumo do modo demonstração. Com a IA conectada, a análise aponta destaques e pontos de atenção.',
  ].filter(Boolean).join('\n\n');
}

const significativas = (titulo: string) => simples(titulo).split(/[^a-z0-9]+/).filter((p) => p.length > 3);
/** Palavra do título no texto, aceitando plural e singular ("pausa" acha "Pausas"). */
const aparece = (palavra: string, texto: string) => new RegExp(String.raw`\b${palavra.replace(/s$/, '')}s?\b`).test(texto);

/** Item cujo título mais aparece no texto (título inteiro vale mais que palavras soltas). */
function melhorPorTitulo<T extends { titulo: string }>(itens: T[], texto: string): T | undefined {
  let melhor: { item: T; pontos: number } | undefined;
  for (const item of itens) {
    const inteiro = texto.includes(simples(item.titulo)) ? 10 + item.titulo.length : 0;
    const pontos = inteiro + significativas(item.titulo).filter((p) => aparece(p, texto)).length;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { item, pontos };
  }
  return melhor?.item;
}

/**
 * Qual cadastro a pessoa quer criar: o que tem a palavra principal do título citada primeiro no pedido.
 * "cria uma jornada … tipo Comercial" é uma Jornada de trabalho, não um Tipo de jornada.
 */
function formularioPedido<T extends { titulo: string }>(itens: T[], texto: string): T | undefined {
  let melhor: { item: T; posicao: number } | undefined;
  for (const item of itens) {
    const principal = significativas(item.titulo)[0];
    if (!principal) continue;
    const posicao = texto.search(new RegExp(String.raw`\b${principal.replace(/s$/, '')}s?\b`));
    if (posicao >= 0 && (!melhor || posicao < melhor.posicao)) melhor = { item, posicao };
  }
  return melhor?.item;
}

function diaAnterior(dia: string): string {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

const DUVIDAS: [RegExp, string][] = [
  [/extens/, 'Extensões de jornada: quem precisa trabalhar além do horário faz o pedido em Extensões de jornada > Novo pedido. O gestor aprova ou reprova em Extensões de jornada > Para aprovar. Cada grupo tem um limite mensal de horas.'],
  [/ausenc/, 'Ausências: mostra, por dia, quando cada pessoa esteve longe da estação. Dá para filtrar por período, pessoa e gestor, e ver como linha do tempo ou tabela.'],
  [/jornada/, 'Jornadas de trabalho: em Jornadas de trabalho > Nova jornada você define o horário de cada dia da semana e o intervalo. Uma jornada pode ser marcada como padrão.'],
  [/relatorio/, 'Relatórios: escolha um relatório, ajuste os filtros e clique em Filtrar. Os indicadores ficam no topo e dá para exportar para planilha.'],
  [/grupo/, 'Grupos: em Configurações > Grupos você define o limite mensal de horas de extensão. O grupo de cada pessoa fica em Usuários > Dados.'],
  [/pausa/, 'Pausas: cadastro das pausas permitidas durante a jornada, com a duração de cada uma.'],
  [/auditoria/, 'Auditoria: registra quem alterou o quê e quando, com um panorama geral e o detalhe por área.'],
  [/carga/, 'Carga de dados: importa uma planilha para cadastrar muitos registros de uma vez. Baixe o modelo, preencha e envie.'],
];

const FORA = 'Só consigo ajudar com o Scua Logon: preencher cadastros, analisar relatórios, tirar dúvidas e abrir telas.';
const PEDE_CADASTRO = /\b(cri[ae]r?|nov[ao]|cadastr\w*|adicion\w*|inclu\w*)\b/;
const PEDE_ANALISE = /analis|resum|destaq|quem mais|o que (voce )?(acha|ve)|explica/;
const PEDE_TELA = /\b(me leva|abr[aei]r?|ir para|vai para|va para|mostra|quero ver)\b/;

function navegar(contexto: ContextoTela, texto: string): Acao | null {
  const tela = melhorPorTitulo(contexto.telas, texto);
  if (!tela) return null;
  if (tela.para === '/ausencias' && /\b(ontem|hoje)\b/.test(texto)) {
    const dia = /\bontem\b/.test(texto) ? diaAnterior(contexto.hoje) : contexto.hoje;
    return { tipo: 'navegar', rota: `/ausencias?de=${dia}&ate=${dia}` };
  }
  return { tipo: 'navegar', rota: tela.para };
}

export function responderSimulado(pedido: PedidoAssistente): RespostaAssistente {
  const original = pedido.mensagens.findLast((m) => m.papel === 'usuario')?.texto ?? '';
  const texto = simples(original);
  const { contexto, ferramentas } = pedido;
  const pode = (f: (typeof ferramentas)[number]) => ferramentas.includes(f);
  const resposta = (t: string, acoes: Acao[] = []): RespostaAssistente => ({ texto: t, acoes, simulado: true });
  const alvo = contexto.alvo;

  // 1. Formulário aberto: tenta preencher.
  if (alvo?.tipo === 'formulario' && pode('preencher_formulario')) {
    const campos = alvo.id === 'jornada' ? (interpretarJornada(original) as Record<string, unknown>) : lerCampos(alvo, original);
    if (Object.keys(campos).length > 0) return resposta('', [{ tipo: 'preencher', campos }]);
  }

  // 2. Pedido de cadastro sem o formulário aberto: abre o formulário.
  if (PEDE_CADASTRO.test(texto) && alvo?.tipo !== 'formulario') {
    const formulario = formularioPedido(contexto.formularios, texto);
    if (formulario && pode('abrir_formulario')) return resposta('', [{ tipo: 'abrir_formulario', formulario: formulario.id }]);
    if (!pode('abrir_formulario')) return resposta('Você não tem acesso para criar esse cadastro.');
  }

  // 3. Relatório aberto: resumo.
  if (alvo?.tipo === 'relatorio' && PEDE_ANALISE.test(texto)) return resposta(analisar(alvo));

  // 4. Abrir uma tela.
  if (PEDE_TELA.test(texto) && pode('navegar')) {
    const acao = navegar(contexto, texto);
    return acao ? resposta('', [acao]) : resposta('Não encontrei essa tela entre as que você tem acesso.');
  }

  // 5. Dúvida de uso.
  const duvida = DUVIDAS.find(([re]) => re.test(texto));
  if (duvida) return resposta(duvida[1]);

  // Formulário aberto e nada reconhecido: ensina a pedir.
  if (alvo?.tipo === 'formulario') {
    const exemplo = alvo.id === 'jornada'
      ? '"seg a sex, 8h às 17h, almoço 12 às 13, nome ADM-8H"'
      : `"${alvo.campos.filter((c) => c.tipo !== 'semana').slice(0, 2).map((c) => `${c.rotulo}: …`).join(', ')}"`;
    return resposta(`Não entendi o que preencher. Diga os valores, por exemplo: ${exemplo}.`);
  }

  // 6. Fora do sistema.
  return resposta(FORA);
}
