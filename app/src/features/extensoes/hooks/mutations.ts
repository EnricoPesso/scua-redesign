import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extensoesApi } from '../api/extensoesApi';
import type { Decisao, NovoPedido } from '../domain/types';
import { chaves } from './queries';

/** Invalida tudo de extensões sem esperar o refetch: o callback de sucesso da tela roda antes da lista mudar. */
function useInvalidar() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: chaves.tudo });
  };
}

export function useCriarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (p: NovoPedido) => extensoesApi.criar(p), onSettled: invalidar });
}

export function useEditarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ id, pedido }: { id: string; pedido: NovoPedido }) => extensoesApi.editar(id, pedido), onSettled: invalidar });
}

export function useCancelarPedido() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (id: string) => extensoesApi.cancelar(id), onSettled: invalidar });
}

export function useDecidir() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ id, decisao }: { id: string; decisao: Decisao }) => extensoesApi.decidir(id, decisao), onSettled: invalidar });
}

export function useDecidirEmLote() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: ({ ids, decisao }: { ids: string[]; decisao: Decisao }) => extensoesApi.decidirEmLote(ids, decisao), onSettled: invalidar });
}
