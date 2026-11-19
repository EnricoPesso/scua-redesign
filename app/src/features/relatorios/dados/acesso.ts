/** Dados de exemplo de acesso: sessões diárias, eventos de logon, último login e último IP. */
import { dia, diasEntre } from '../../../mock/datas';
import { ESTACOES_DIRETORIO, PESSOAS_DIRETORIO } from '../../../mock/diretorio';
import { identidade, ehDiaUtil, instante, ruido, type Identidade } from './base';
import { minutosEntre } from './formatacao';

export interface Sessao extends Identidade {
  id: string;
  /** YYYY-MM-DD. */
  dia: string;
  primeiroLogon: string;
  /** null = ainda conectada (hoje) ou logoff não registrado. */
  ultimoLogoff: string | null;
  minutos: number | null;
}

/** Quem está "de férias" nos últimos 9 dias (alimenta o "sem login há mais de 7 dias"). */
const ausenteRecente = (i: number) => i % 11 === 10;

/** Um primeiro logon e um último logoff por pessoa e dia útil, nos últimos 30 dias. */
export function sessoes(): Sessao[] {
  const out: Sessao[] = [];
  PESSOAS_DIRETORIO.forEach((p, i) => {
    for (let n = 0; n > -30; n--) {
      if (!ehDiaUtil(n) || (ausenteRecente(i) && n > -9) || ruido(1, i, n) < 0.08) continue;
      const entrada = 7 * 60 + 20 + Math.floor(ruido(2, i, n) * 110);
      const saida = n === 0 || ruido(3, i, n) < 0.04 ? null : 17 * 60 + Math.floor(ruido(4, i, n) * 150);
      const primeiroLogon = instante(n, entrada);
      const ultimoLogoff = saida === null ? null : instante(n, saida);
      out.push({ ...identidade(p), id: `${p.id}-${dia(n)}`, dia: dia(n), primeiroLogon, ultimoLogoff, minutos: ultimoLogoff ? minutosEntre(primeiroLogon, ultimoLogoff) : null });
    }
  });
  return out.sort((a, b) => b.primeiroLogon.localeCompare(a.primeiroLogon));
}

export interface EventoAcesso extends Identidade {
  id: string;
  quando: string;
  /** Código técnico: a tela só mostra o texto do dicionário de eventos. */
  evento: string;
  motivo: string;
}

/** Eventos um a um: logon, logoff, bloqueio e desbloqueio da estação, e logons negados. */
export function eventosDeAcesso(): EventoAcesso[] {
  const out: EventoAcesso[] = [];
  const indice = new Map(PESSOAS_DIRETORIO.map((p, i) => [p.id, i]));
  for (const s of sessoes()) {
    const i = indice.get(s.pessoaId)!;
    const n = -diasEntre(s.dia, dia(0));
    const base = (sufixo: string, quando: string, evento: string, motivo: string): EventoAcesso => ({ ...s, id: `${s.id}-${sufixo}`, quando, evento, motivo });
    out.push(base('in', s.primeiroLogon, 'EVT_LOGON_ALLOWED', 'Dentro da jornada'));
    if (s.ultimoLogoff) out.push(base('out', s.ultimoLogoff, 'EVT_LOGOFF', 'Encerrado pela pessoa'));
    if (ruido(5, i, n) < 0.07) out.push(base('neg', instante(n, 6 * 60 + Math.floor(ruido(6, i, n) * 70)), 'EVT_LOGON_DENIED', 'Fora da jornada'));
    if (ruido(7, i, n) < 0.12) {
      const bloqueio = 12 * 60 + Math.floor(ruido(8, i, n) * 90);
      out.push(base('blq', instante(n, bloqueio), 'EVT_SCREEN_LOCKED', 'Inatividade'));
      out.push(base('dsb', instante(n, bloqueio + 20 + Math.floor(ruido(9, i, n) * 40)), 'EVT_SCREEN_UNLOCKED', 'Senha informada'));
    }
  }
  return out.sort((a, b) => b.quando.localeCompare(a.quando));
}

export interface UltimoLogin extends Identidade {
  id: string;
  matricula: string;
  versaoCliente: string;
  ultimoLogin: string;
}

/** O logon mais recente de cada pessoa. */
export function ultimosLogins(): UltimoLogin[] {
  const maisRecente = new Map<string, string>();
  for (const s of sessoes()) if (!maisRecente.has(s.pessoaId) || s.primeiroLogon > maisRecente.get(s.pessoaId)!) maisRecente.set(s.pessoaId, s.primeiroLogon);
  return PESSOAS_DIRETORIO.filter((p) => maisRecente.has(p.id)).map((p) => ({
    ...identidade(p),
    id: p.id,
    matricula: p.matricula,
    versaoCliente: ESTACOES_DIRETORIO.find((e) => e.nome === p.estacao)?.versaoAgente || 'Não instalado',
    ultimoLogin: maisRecente.get(p.id)!,
  }));
}

export interface UltimoIp extends Identidade {
  id: string;
  ip: string;
  localidade: string;
  coletadoEm: string;
}

const LOCALIDADE_DA_AREA: Record<string, string> = {
  Comercial: 'São Paulo, SP',
  Operações: 'Campinas, SP',
  Financeiro: 'São Paulo, SP',
  Tecnologia: 'Florianópolis, SC',
  Pessoas: 'Curitiba, PR',
};
export const LOCALIDADES = [...new Set([...Object.values(LOCALIDADE_DA_AREA), 'Acesso remoto (VPN)'])].sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** Último endereço IP coletado de cada pessoa; quem trabalha de fora aparece como acesso remoto. */
export function ultimosIps(): UltimoIp[] {
  return PESSOAS_DIRETORIO.map((p, i) => {
    const remoto = i % 5 === 4;
    return {
      ...identidade(p),
      id: p.id,
      ip: remoto ? `189.${40 + i}.${10 + i * 3}.${20 + i}` : `10.20.${i % 6}.${10 + i}`,
      localidade: remoto ? 'Acesso remoto (VPN)' : LOCALIDADE_DA_AREA[p.diretoria] ?? 'São Paulo, SP',
      coletadoEm: instante(-(i % 4), 8 * 60 + 5 + ((i * 17) % 90)),
    };
  });
}
