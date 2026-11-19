import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { criarQueryClient } from '../../../app/queryClient';
import { server } from '../../../test/server';
import { useDecidir } from './mutations';
import { useListaPedidos, usePedido, useResumo } from './queries';

const FILA = { aba: 'aprovar' as const, de: '', ate: '', pagina: 1, tamanho: 25 };
const envolver = (client: QueryClient) => ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('hooks de extensões', () => {
  it('decidir atualiza a fila', async () => {
    const { result } = renderHook(() => ({ lista: useListaPedidos(FILA), decidir: useDecidir() }), { wrapper: envolver(criarQueryClient({ semRetry: true })) });
    await waitFor(() => expect(result.current.lista.data?.total).toBe(5));
    await act(() => result.current.decidir.mutateAsync({ id: 'p-1', decisao: { acao: 'aprovar' } }));
    await waitFor(() => expect(result.current.lista.data?.total).toBe(4));
  });

  it('resumo sem dado vira null', async () => {
    const { result } = renderHook(() => useResumo('u-desconhecido', '2026-10'), { wrapper: envolver(criarQueryClient({ semRetry: true })) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('não repete erro 4xx', async () => {
    let chamadas = 0;
    server.use(http.get('*/api/extensoes/:id', () => {
      chamadas += 1;
      return HttpResponse.json({ codigo: 'NAO_ENCONTRADO' }, { status: 404 });
    }));
    const { result } = renderHook(() => usePedido('p-x'), { wrapper: envolver(criarQueryClient()) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(chamadas).toBe(1);
  });
});
