import type { ColunaPlanilha } from '@/lib/planilha';
import { nomeDe } from '../../mock/diretorio';
import { formatarDataHora, type Registro } from './domain/auditoria';

/** Colunas da planilha da aba atual (as linhas são as mesmas que os filtros mostram, não só a página). */
export const COLUNAS_PLANILHA: ColunaPlanilha<Registro>[] = [
      { header: 'Item alterado', texto: (r) => r.item },
      { header: 'Ação', texto: (r) => r.acao },
      { header: 'Valor anterior', texto: (r) => r.anterior ?? '' },
      { header: 'Valor novo', texto: (r) => r.novo ?? '' },
      { header: 'Quem alterou', texto: (r) => nomeDe(r.pessoaId) },
      { header: 'Via assistente', texto: (r) => (r.viaAssistente ? 'Sim' : 'Não') },
      { header: 'Data e hora', texto: (r) => formatarDataHora(r.quando) },
];
