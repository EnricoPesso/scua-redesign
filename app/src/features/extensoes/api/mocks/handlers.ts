import { http, HttpResponse } from 'msw';
import type { Decisao, NovoPedido, Pedido } from '../../domain/types';
import * as db from './db';

const API = '*/api';
const erro = (status: number, codigo: string, dados?: Record<string, string>) => HttpResponse.json({ codigo, dados }, { status });
const indisponivel = () => erro(503, 'INDISPONIVEL');
const parametros = (request: Request) => new URL(request.url).searchParams;

function dadosDoConflito(p: Pedido): Record<string, string> {
  const d = p.decisao;
  return d ? { status: d.status, por: d.por.nome, canal: d.canal, em: d.em } : { status: p.status };
}

// A ordem importa: rotas fixas (/totais, /exportar, /decisao-em-lote) antes de /:id.
export const handlers = [
  http.get(`${API}/me/permissoes`, () => (db.estaFalhando() ? indisponivel() : HttpResponse.json(db.permissoesAtuais()))),

  http.get(`${API}/extensoes/totais`, ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.totaisDb(parametros(request));
    return r === 'proibido' ? erro(403, 'PROIBIDO') : HttpResponse.json(r);
  }),

  http.get(`${API}/extensoes/exportar`, ({ request }) => {
    const r = db.exportarCsvDb(parametros(request));
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    return new HttpResponse(r, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="extensoes.csv"' } });
  }),

  http.post(`${API}/extensoes/decisao-em-lote`, async ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const corpo = (await request.json()) as { ids: string[]; decisao: Decisao };
    return HttpResponse.json(db.decidirEmLoteDb(corpo.ids, corpo.decisao));
  }),

  http.get(`${API}/extensoes/:id`, ({ params }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.obterDb(String(params.id));
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    return HttpResponse.json(r);
  }),

  http.get(`${API}/extensoes`, ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.listarDb(parametros(request));
    return r === 'proibido' ? erro(403, 'PROIBIDO') : HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes`, async ({ request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.criarPedidoDb((await request.json()) as NovoPedido);
    if (r === 'conflito') return erro(409, 'PERIODO_CONFLITANTE');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    return HttpResponse.json(r, { status: 201 });
  }),

  http.put(`${API}/extensoes/:id`, async ({ params, request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.editarPedidoDb(String(params.id), (await request.json()) as NovoPedido);
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'nao-editavel') return erro(409, 'NAO_EDITAVEL');
    if (r === 'conflito') return erro(409, 'PERIODO_CONFLITANTE');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    return HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes/:id/cancelar`, ({ params }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.cancelarDb(String(params.id));
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'nao-cancelavel') return erro(409, 'NAO_PENDENTE');
    return HttpResponse.json(r);
  }),

  http.post(`${API}/extensoes/:id/decisao`, async ({ params, request }) => {
    if (db.estaFalhando()) return indisponivel();
    const r = db.decidirDb(String(params.id), (await request.json()) as Decisao);
    if (r === 'nao-encontrado') return erro(404, 'NAO_ENCONTRADO');
    if (r === 'proibido') return erro(403, 'PROIBIDO');
    if (r === 'invalido') return erro(400, 'INVALIDO');
    if ('conflito' in r) return erro(409, r.conflito, dadosDoConflito(r.pedido));
    return HttpResponse.json(r);
  }),

  http.get(`${API}/justificativas`, () => HttpResponse.json(db.JUSTIFICATIVAS)),
  http.get(`${API}/colaboradores`, () => HttpResponse.json(db.colaboradoresDb())),

  http.get(`${API}/beneficiarios/:id/resumo`, ({ params, request }) => {
    const r = db.resumoDb(String(params.id), parametros(request).get('mes') ?? '');
    return r ? HttpResponse.json(r) : erro(404, 'NAO_ENCONTRADO');
  }),
];
