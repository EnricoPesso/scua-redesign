import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { extensoesApi } from '../api/extensoesApi';
import type { Filtros, FiltrosSemPagina } from '../domain/types';

export const chaves = {
  tudo: ['extensoes'] as const,
  lista: (f: Filtros) => ['extensoes', 'lista', f] as const,
  totais: (f: FiltrosSemPagina) => ['extensoes', 'totais', f] as const,
  pedido: (id: string) => ['extensoes', 'pedido', id] as const,
  resumo: (beneficiarioId: string, mes: string) => ['extensoes', 'resumo', beneficiarioId, mes] as const,
};

export function usePermissoes() {
  return useQuery({ queryKey: ['permissoes'], queryFn: extensoesApi.permissoes, staleTime: 5 * 60_000 });
}

export function useListaPedidos(f: Filtros, habilitado = true) {
  return useQuery({
    queryKey: chaves.lista(f),
    queryFn: () => extensoesApi.listar(f),
    enabled: habilitado,
    placeholderData: keepPreviousData,
    // A fila do gestor se atualiza sozinha: decisões tomadas no Teams/WhatsApp tiram o pedido da fila.
    refetchInterval: f.aba === 'aprovar' ? 60_000 : false,
  });
}

export function useTotais(f: FiltrosSemPagina, habilitado = true) {
  return useQuery({ queryKey: chaves.totais(f), queryFn: () => extensoesApi.totais(f), enabled: habilitado });
}

export function usePedido(id: string | undefined) {
  return useQuery({ queryKey: chaves.pedido(id ?? ''), queryFn: () => extensoesApi.obter(id!), enabled: !!id });
}

export function useJustificativas() {
  return useQuery({ queryKey: ['justificativas'], queryFn: extensoesApi.justificativas, staleTime: Infinity });
}

export function useColaboradores(habilitado: boolean) {
  return useQuery({ queryKey: ['colaboradores'], queryFn: extensoesApi.colaboradores, enabled: habilitado, staleTime: 5 * 60_000 });
}

export function useResumo(beneficiarioId: string | undefined, mes: string) {
  return useQuery({
    queryKey: chaves.resumo(beneficiarioId ?? '', mes),
    queryFn: () => extensoesApi.resumo(beneficiarioId!, mes),
    enabled: !!beneficiarioId,
  });
}
