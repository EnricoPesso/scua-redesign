import { useCallback, useState } from 'react';
import { CUSTO_PADRAO, type ParametrosDeCusto } from '../../../lib/conformidade';

const CHAVE = 'scua.radar-de-passivo.custo';
const CAMPOS = ['adicionalHoraExtra', 'adicionalDescanso', 'encargos'] as const;
const LIMITE = 5; // 500%

export const LIMITE_PERCENTUAL = LIMITE * 100;
const valido = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= LIMITE;

/** Lê a preferência guardada; qualquer coisa fora do formato (ou sem acesso ao armazenamento) volta ao padrão. */
export function lerParametros(): ParametrosDeCusto {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return CUSTO_PADRAO;
    const lido: unknown = JSON.parse(bruto);
    if (typeof lido !== 'object' || lido === null) return CUSTO_PADRAO;
    const objeto = lido as Record<string, unknown>;
    if (!CAMPOS.every((c) => valido(objeto[c]))) return CUSTO_PADRAO;
    return { adicionalHoraExtra: objeto.adicionalHoraExtra as number, adicionalDescanso: objeto.adicionalDescanso as number, encargos: objeto.encargos as number };
  } catch {
    return CUSTO_PADRAO;
  }
}

function guardar(p: ParametrosDeCusto | null) {
  try {
    if (p === null) window.localStorage.removeItem(CHAVE);
    else window.localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // Sem armazenamento (janela privada, dados bloqueados): a tela continua valendo nesta visita.
  }
}

export const ehPadrao = (p: ParametrosDeCusto) => CAMPOS.every((c) => p[c] === CUSTO_PADRAO[c]);

/** Percentuais do custo: mudam os números na hora e ficam guardados neste navegador. */
export function useParametrosDeCusto() {
  const [parametros, setParametros] = useState<ParametrosDeCusto>(lerParametros);
  const alterar = useCallback((mudanca: Partial<ParametrosDeCusto>) => {
    setParametros((atual) => {
      const novo = { ...atual, ...mudanca };
      guardar(ehPadrao(novo) ? null : novo);
      return novo;
    });
  }, []);
  const voltarAoPadrao = useCallback(() => {
    guardar(null);
    setParametros(CUSTO_PADRAO);
  }, []);
  return { parametros, alterar, voltarAoPadrao };
}
