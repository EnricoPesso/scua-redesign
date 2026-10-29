import type { Canal, Horario } from './types';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dois = (n: number) => String(n).padStart(2, '0');

export function hojeLocal(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function periodoDoMes(dia: string): { de: string; ate: string } {
  const [ano, mes] = dia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { de: `${ano}-${dois(mes)}-01`, ate: `${ano}-${dois(mes)}-${dois(ultimo)}` };
}

export function mesDe(dia: string): string {
  return dia.slice(0, 7);
}

function ddmm(dia: string): string {
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
}

/** "13–15/10 · 18:00–20:00", "16/10 · 18:00–20:00" ou "30/09–02/10 · 18:00–20:00". */
export function formatarPeriodo(dataInicial: string, dataFinal: string, horario: Horario): string {
  const horas = `${horario.inicio}–${horario.fim}`;
  if (!dataFinal || dataFinal === dataInicial) return `${ddmm(dataInicial)} · ${horas}`;
  const dias = mesDe(dataInicial) === mesDe(dataFinal)
    ? `${dataInicial.slice(8, 10)}–${ddmm(dataFinal)}`
    : `${ddmm(dataInicial)}–${ddmm(dataFinal)}`;
  return `${dias} · ${horas}`;
}

export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${formatarHora(iso)}`;
}

export function tempoDesde(iso: string, agora: Date = new Date()): string {
  const minutos = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
  return `em ${formatarDataHora(iso)}`;
}

/** Texto do período ativo, para contadores e mensagens: "no mês", "de 01/10 a 15/10", "no total"… */
export function rotuloPeriodo(de: string, ate: string, hoje: string): string {
  if (!de && !ate) return 'no total';
  if (de && ate) {
    const mes = periodoDoMes(de);
    if (mes.de === de && mes.ate === ate) {
      if (mesDe(de) === mesDe(hoje)) return 'no mês';
      const [ano, m] = de.split('-').map(Number);
      return `em ${MESES[m - 1]}/${ano}`;
    }
    if (de === ate) return `em ${ddmm(de)}`;
    return `de ${ddmm(de)} a ${ddmm(ate)}`;
  }
  return de ? `a partir de ${ddmm(de)}` : `até ${ddmm(ate)}`;
}

const NOMES_CANAL: Record<Canal, string> = { painel: 'painel', teams: 'Teams', whatsapp: 'WhatsApp' };

export function nomeCanal(canal: Canal): string {
  return NOMES_CANAL[canal] ?? canal;
}
