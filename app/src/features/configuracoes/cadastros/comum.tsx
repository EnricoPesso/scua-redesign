import { Badge } from '@/components/ui/badge';
import type { PassoTrilha } from '../../../componentes/Pagina';
import { AREAS, CONFIGURACOES } from '../catalogo';

/** Título, descrição e trilha de uma tela: tudo vem do catálogo, que é a fonte única. */
export function baseDe(slug: string): { chave: string; titulo: string; descricao: string; trilha: PassoTrilha[] } {
  const item = CONFIGURACOES.find((c) => c.slug === slug);
  if (!item) throw new Error(`Tela de configuração desconhecida: ${slug}`);
  const area = AREAS.find((a) => a.id === item.area)!;
  return {
    chave: slug,
    titulo: item.titulo,
    descricao: item.resumo,
    trilha: [{ rotulo: 'Configurações', para: '/configuracoes' }, { rotulo: area.titulo }],
  };
}

export const SimNao = ({ valor }: { valor: boolean }) => <Badge status={valor ? 'success' : 'neutral'}>{valor ? 'Sim' : 'Não'}</Badge>;

export const mesmoTexto = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const opcoes = (...valores: string[]) => valores.map((v) => ({ value: v, label: v }));
