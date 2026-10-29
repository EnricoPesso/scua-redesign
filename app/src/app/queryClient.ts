import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../features/extensoes/domain/erros';

/** Erros 4xx (sem acesso, não existe, conflito) não melhoram tentando de novo. */
export function criarQueryClient(opcoes: { semRetry?: boolean } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: opcoes.semRetry ? false : (tentativas, erro) => !(erro instanceof ApiError && erro.status >= 400 && erro.status < 500) && tentativas < 2,
      },
      mutations: { retry: false },
    },
  });
}
