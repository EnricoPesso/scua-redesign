import { Badge, type BadgeProps } from '@/components/ui/badge';
import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { validarVariaveis } from '../domain/templates';
import { baseDe, mesmoTexto, opcoes } from './comum';

export interface TemplateWhatsapp { id: string; nome: string; categoria: string; idioma: string; status: string; texto: string }

const STATUS: Record<string, NonNullable<BadgeProps['status']>> = { Aprovado: 'success', 'Em análise': 'warning', Recusado: 'danger' };

const w = (n: number, nome: string, categoria: string, status: string, texto: string, idioma = 'Português (BR)'): TemplateWhatsapp => ({ id: `wa-${n}`, nome, categoria, idioma, status, texto });

export const templatesWhatsapp = criarColecao<TemplateWhatsapp>(
  'wa',
  () => [
    w(1, 'extensao_pedida', 'Utilidade', 'Aprovado', 'Olá, {{1}}. {{2}} pediu uma extensão de jornada para {{3}}. Responda pelo Scua Logon.'),
    w(2, 'extensao_aprovada', 'Utilidade', 'Aprovado', 'Olá, {{1}}. Sua extensão de jornada de {{2}} foi aprovada.'),
    w(3, 'extensao_reprovada', 'Utilidade', 'Aprovado', 'Olá, {{1}}. Seu pedido de extensão de {{2}} não foi aprovado. Motivo: {{3}}.'),
    w(4, 'fim_de_jornada', 'Utilidade', 'Em análise', 'Olá, {{1}}. Sua jornada termina em {{2}} minutos.'),
    w(5, 'codigo_de_acesso', 'Autenticação', 'Aprovado', 'Seu código de acesso ao Scua Logon é {{1}}. Ele vale por 10 minutos.'),
    w(6, 'extension_requested', 'Utilidade', 'Recusado', 'Hello, {{1}}. {{2}} requested a workday extension.', 'Inglês'),
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && mesmoTexto(i.nome, d.nome) && i.idioma === d.idioma) ? 'Já existe um template com esse nome neste idioma.' : undefined),
);

export const configTemplatesWhatsapp: ConfigCadastro<TemplateWhatsapp> = {
  ...baseDe('templates-whatsapp'),
  singular: 'template',
  genero: 'o',
  colecao: templatesWhatsapp,
  colunas: [
    { key: 'nome', header: 'Nome' },
    { key: 'categoria', header: 'Categoria' },
    { key: 'idioma', header: 'Idioma' },
    { key: 'status', header: 'Status na Meta', render: (i) => <Badge status={STATUS[i.status] ?? 'neutral'}>{i.status}</Badge> },
    { key: 'texto', header: 'Texto', render: (i) => <span className="block min-w-64 max-w-md whitespace-normal">{i.texto}</span> },
  ],
  campos: [
    { chave: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maximo: 60, dica: 'Só letras minúsculas, números e sublinhado, como extensao_aprovada. É o nome usado na Meta.' },
    { chave: 'categoria', rotulo: 'Categoria', tipo: 'select', obrigatorio: true, opcoes: opcoes('Utilidade', 'Autenticação', 'Marketing') },
    { chave: 'idioma', rotulo: 'Idioma', tipo: 'select', obrigatorio: true, opcoes: opcoes('Português (BR)', 'Inglês', 'Espanhol') },
    { chave: 'status', rotulo: 'Status na Meta', tipo: 'select', obrigatorio: true, opcoes: opcoes('Aprovado', 'Em análise', 'Recusado') },
    {
      chave: 'texto',
      rotulo: 'Texto do template',
      tipo: 'textoLongo',
      obrigatorio: true,
      maximo: 1024,
      dica: 'Use {{1}}, {{2}} e assim por diante onde entram dados da pessoa ou do pedido (nome, data, horário). Numere em sequência, a partir de {{1}}.',
    },
  ],
  novo: () => ({ nome: '', categoria: 'Utilidade', idioma: 'Português (BR)', status: 'Em análise', texto: '' }),
  nomeDe: (i) => i.nome,
  textoDeBusca: (i) => `${i.nome} ${i.categoria} ${i.idioma} ${i.status} ${i.texto}`,
  validar: (d) => ({
    ...(d.nome.trim() && !/^[a-z0-9_]+$/.test(d.nome.trim()) ? { nome: 'Use só letras minúsculas, números e sublinhado' } : {}),
    ...(d.texto.trim() && validarVariaveis(d.texto) ? { texto: validarVariaveis(d.texto) } : {}),
  }),
};
