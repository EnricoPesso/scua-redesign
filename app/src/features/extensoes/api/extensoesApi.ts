import { ApiError } from '../domain/erros';
import type {
  Decisao, Filtros, FiltrosSemPagina, Justificativa, NovoPedido, Pagina, Pedido, Permissoes, Pessoa, ResultadoLote, ResumoBeneficiario, Totais,
} from '../domain/types';
import { request } from './client';

type Parametros = Record<string, string | number | undefined>;

function qs(p: Parametros): string {
  const s = new URLSearchParams();
  for (const [chave, valor] of Object.entries(p)) if (valor !== undefined && valor !== '') s.set(chave, String(valor));
  const texto = s.toString();
  return texto ? `?${texto}` : '';
}

const corpo = (method: string, dados: unknown): RequestInit => ({ method, body: JSON.stringify(dados) });
const id = (valor: string) => encodeURIComponent(valor);

export const extensoesApi = {
  permissoes: () => request<Permissoes>('/me/permissoes'),
  listar: (f: Filtros) => request<Pagina<Pedido>>(`/extensoes${qs({ ...f })}`),
  totais: (f: FiltrosSemPagina) => request<Totais>(`/extensoes/totais${qs({ ...f })}`),
  exportarUrl: (f: FiltrosSemPagina) => `/api/extensoes/exportar${qs({ ...f })}`,
  obter: (pedidoId: string) => request<Pedido>(`/extensoes/${id(pedidoId)}`),
  criar: (p: NovoPedido) => request<Pedido>('/extensoes', corpo('POST', p)),
  editar: (pedidoId: string, p: NovoPedido) => request<Pedido>(`/extensoes/${id(pedidoId)}`, corpo('PUT', p)),
  cancelar: (pedidoId: string) => request<Pedido>(`/extensoes/${id(pedidoId)}/cancelar`, { method: 'POST' }),
  decidir: (pedidoId: string, d: Decisao) => request<Pedido>(`/extensoes/${id(pedidoId)}/decisao`, corpo('POST', d)),
  decidirEmLote: (ids: string[], decisao: Decisao) => request<ResultadoLote>('/extensoes/decisao-em-lote', corpo('POST', { ids, decisao })),
  justificativas: () => request<Justificativa[]>('/justificativas'),
  colaboradores: () => request<Pessoa[]>('/colaboradores'),
  /** null quando a API não tem o dado (404) ou não implementa a rota (501): a tela esconde a parte de limite. */
  async resumo(beneficiarioId: string, mes: string): Promise<ResumoBeneficiario | null> {
    try {
      return await request<ResumoBeneficiario>(`/beneficiarios/${id(beneficiarioId)}/resumo${qs({ mes })}`);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 501)) return null;
      throw e;
    }
  },
};
