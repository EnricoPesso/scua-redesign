import type { Registro } from '../features/auditoria/domain/auditoria';

/**
 * Registros de auditoria criados durante o uso (os dados de exemplo da Auditoria são fixos).
 * Hoje só as gravações feitas com o assistente de IA registram aqui; no sistema real, quem registra é a API.
 */

let extras: Registro[] = [];
let seq = 0;

const dois = (n: number) => String(n).padStart(2, '0');
function agora(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}:00`;
}

export function registrarAuditoria(r: Omit<Registro, 'id' | 'quando'>): void {
  seq += 1;
  extras = [{ ...r, id: `extra-${seq}`, quando: agora() }, ...extras];
}

export const registrosExtras = (): Registro[] => extras;
export function resetarAuditoriaExtra(): void { extras = []; seq = 0; }
