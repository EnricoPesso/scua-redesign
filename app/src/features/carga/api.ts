import { criarColecao } from '../../mock/colecao';
import { hoje, quando } from '../../mock/datas';
import type { DefinicaoCarga } from './domain/cargas';
import type { LinhaDeCarga } from './domain/validacao';

export interface RegistroCarga {
  id: string;
  carga: string;
  arquivo: string;
  /** YYYY-MM-DDTHH:MM:SS, hora local. */
  quando: string;
  quem: string;
  importadas: number;
  ignoradas: number;
}

// pedir ao @PhLima07: o usuário logado ainda não está exposto para as telas; enquanto isso, o mock usa o usuário padrão.
export const USUARIO_ATUAL = 'Carlos Mendes';

/** Histórico em memória: a semente mais o que for importado na sessão. */
export const historico = criarColecao<RegistroCarga>('carga', () => [
  { id: 'carga-1', carga: 'Férias', arquivo: 'ferias-janeiro.csv', quando: quando(-1, '16:20'), quem: 'Renata Dias', importadas: 42, ignoradas: 0 },
  { id: 'carga-2', carga: 'Feriados', arquivo: 'feriados-2027.csv', quando: quando(-6, '09:05'), quem: 'Carlos Mendes', importadas: 12, ignoradas: 1 },
  { id: 'carga-3', carga: 'Telefones para WhatsApp', arquivo: 'telefones-whatsapp.csv', quando: quando(-15, '11:48'), quem: 'Renata Dias', importadas: 120, ignoradas: 5 },
]);

const dois = (n: number) => String(n).padStart(2, '0');
const agora = () => {
  const d = new Date();
  return `${hoje()}T${dois(d.getHours())}:${dois(d.getMinutes())}:00`;
};

/**
 * Simula o envio das linhas válidas. Se a chamada falhar, nada é registrado.
 * Quando a API existir, é aqui que o arquivo (ou as linhas) vai para o servidor.
 */
export function importarCarga(carga: DefinicaoCarga, arquivo: string, validas: LinhaDeCarga[], ignoradas: number): Promise<RegistroCarga> {
  return historico.criar({ carga: carga.nome, arquivo, quando: agora(), quem: USUARIO_ATUAL, importadas: validas.length, ignoradas });
}
