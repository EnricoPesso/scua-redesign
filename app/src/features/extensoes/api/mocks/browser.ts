import { setupWorker } from 'msw/browser';
import { decidirExterno, entrarComo, PESSOAS, resetarDb, simularFalha, type ChavePessoa } from './db';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// ?como=ana troca o usuário simulado (útil no navegador e no Playwright).
const como = new URLSearchParams(window.location.search).get('como');
if (como && como in PESSOAS) entrarComo(como as ChavePessoa);

Object.assign(window, { __scuaMock: { entrarComo, decidirExterno, simularFalha, resetarDb } });
