import { normalizarCampo, normalizarHora, textoDoValor, type ResultadoAplicar } from '../assistente/acoes';
import type { CampoAlvo } from '../assistente/contrato';
import { resumirHorario } from './domain/horario';
import { DIAS, NOME_LONGO, TIPOS_DE_JORNADA, type DadosJornada, type Dia, type HorarioDia } from './domain/tipos';

/** Os campos da jornada, como o assistente os enxerga. */
export const CAMPOS_DA_JORNADA: CampoAlvo[] = [
  { chave: 'identificador', rotulo: 'Identificador', tipo: 'texto', obrigatorio: true, maximo: 20, dica: 'Código curto e único, como ADM-8H' },
  { chave: 'descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: true, maximo: 80 },
  { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true, opcoes: TIPOS_DE_JORNADA.map((t) => ({ value: t, label: t })) },
  { chave: 'ativa', rotulo: 'Ativa', tipo: 'alternar' },
  { chave: 'padrao', rotulo: 'Padrão', tipo: 'alternar', dica: 'Só uma jornada pode ser a padrão' },
  { chave: 'liberaRegra', rotulo: 'Libera regra', tipo: 'alternar' },
  { chave: 'informativa', rotulo: 'Informativa', tipo: 'alternar' },
  { chave: 'semana', rotulo: 'Horários da semana', tipo: 'semana', dica: 'Entrada, saída e intervalo de cada dia' },
];

const FOLGA: HorarioDia = { trabalha: false, entrada: '', saida: '', intervaloInicio: '', intervaloFim: '' };
const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Um dia vindo da IA → HorarioDia. Qualquer hora fora do formato invalida o dia inteiro. */
function lerDia(atual: HorarioDia, valor: unknown): HorarioDia | null {
  if (!ehObjeto(valor)) return null;
  if (valor.trabalha === false) return { ...FOLGA };
  if (valor.trabalha !== undefined && valor.trabalha !== true) return null;
  const novo: HorarioDia = { ...atual, trabalha: true };
  for (const chave of ['entrada', 'saida', 'intervaloInicio', 'intervaloFim'] as const) {
    if (!Object.hasOwn(valor, chave)) continue;
    const hora = normalizarHora(valor[chave]);
    if (hora === null) return null;
    novo[chave] = hora;
  }
  return novo;
}

/** Texto do que entrou na semana: horários por grupo de dias e o intervalo, quando é o mesmo em todos. */
function descreverSemana(semana: DadosJornada['semana']): string {
  const intervalos = new Set(DIAS.filter((d) => semana[d].trabalha).map((d) => (semana[d].intervaloInicio && semana[d].intervaloFim ? `${semana[d].intervaloInicio}–${semana[d].intervaloFim}` : 'sem intervalo')));
  const intervalo = intervalos.size === 1 ? `, ${[...intervalos][0] === 'sem intervalo' ? 'sem intervalo' : `intervalo ${[...intervalos][0]}`}` : '';
  return `${resumirHorario(semana)}${intervalo}`;
}

/**
 * Aplica na jornada os valores que o assistente mandou. Devolve os dados novos, o que entrou,
 * o que não serviu e as chaves tocadas (para destacar na tela): 'identificador', 'semana.seg'…
 */
export function aplicarNaJornada(atual: DadosJornada, campos: Record<string, unknown>): { dados: DadosJornada; resultado: ResultadoAplicar; chaves: string[] } {
  const dados: DadosJornada = { ...atual, semana: { ...atual.semana } };
  const resultado: ResultadoAplicar = { aplicados: [], ignorados: [] };
  const chaves: string[] = [];

  for (const campo of CAMPOS_DA_JORNADA) {
    if (!Object.hasOwn(campos, campo.chave)) continue;
    const valor = campos[campo.chave];

    if (campo.tipo === 'semana') {
      if (!ehObjeto(valor)) { resultado.ignorados.push(campo.rotulo); continue; }
      let mudou = false;
      for (const dia of DIAS) {
        if (!Object.hasOwn(valor, dia)) continue;
        const novo = lerDia(dados.semana[dia], valor[dia]);
        if (!novo) { resultado.ignorados.push(NOME_LONGO[dia as Dia]); continue; }
        dados.semana[dia] = novo;
        chaves.push(`semana.${dia}`);
        mudou = true;
      }
      if (mudou) resultado.aplicados.push({ rotulo: campo.rotulo, valor: descreverSemana(dados.semana) });
      continue;
    }

    const n = normalizarCampo(campo, valor);
    if (!n.ok) { resultado.ignorados.push(campo.rotulo); continue; }
    const final = campo.chave === 'identificador' ? String(n.valor).toUpperCase() : n.valor;
    (dados as unknown as Record<string, unknown>)[campo.chave] = final;
    chaves.push(campo.chave);
    resultado.aplicados.push({ rotulo: campo.rotulo, valor: textoDoValor(campo, final) });
  }
  return { dados, resultado, chaves };
}
