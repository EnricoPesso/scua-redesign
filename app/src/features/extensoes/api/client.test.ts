import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/server';
import { request } from './client';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('request', () => {
  it('devolve o JSON', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ ok: true })));
    await expect(request('/ping')).resolves.toEqual({ ok: true });
  });
  it('erro HTTP vira ApiError com código e dados', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ codigo: 'JA_DECIDIDO', dados: { por: 'Carlos' } }, { status: 409 })));
    await expect(request('/ping')).rejects.toMatchObject({ status: 409, codigo: 'JA_DECIDIDO', dados: { por: 'Carlos' } });
  });
  it('erro sem JSON vira DESCONHECIDO', async () => {
    server.use(http.get('*/api/ping', () => new HttpResponse('oops', { status: 500 })));
    await expect(request('/ping')).rejects.toMatchObject({ status: 500, codigo: 'DESCONHECIDO' });
  });
  it('falha de rede vira REDE', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.error()));
    await expect(request('/ping')).rejects.toMatchObject({ status: 0, codigo: 'REDE' });
  });
  it('204 devolve undefined', async () => {
    server.use(http.post('*/api/ping', () => new HttpResponse(null, { status: 204 })));
    await expect(request('/ping', { method: 'POST' })).resolves.toBeUndefined();
  });
});
