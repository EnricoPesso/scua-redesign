/** Dados de exemplo: tentativas de acesso fora da jornada. */
import { PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { identidade, instante, ruido, type Identidade } from './base';

export interface Tentativa extends Identidade {
  id: string;
  evento: string;
  quando: string;
}

const HORAS_FORA = [6, 7, 19, 20, 21, 22, 23];

export function tentativas(): Tentativa[] {
  const out: Tentativa[] = [];
  PESSOAS_DIRETORIO.forEach((p, i) => {
    for (let n = 0; n > -30; n--) {
      if (ruido(20, i, n) >= 0.15) continue;
      const hora = HORAS_FORA[Math.floor(ruido(21, i, n) * HORAS_FORA.length)];
      out.push({
        ...identidade(p),
        id: `${p.id}-${n}`,
        evento: ruido(22, i, n) < 0.7 ? 'EVT_OUT_OF_JOURNEY_LOGON' : 'EVT_OUT_OF_JOURNEY_UNLOCK',
        quando: instante(n, hora * 60 + Math.floor(ruido(23, i, n) * 60)),
      });
    }
  });
  return out.sort((a, b) => b.quando.localeCompare(a.quando));
}
