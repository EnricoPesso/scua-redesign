import {
  CalendarClockIcon, CalendarOffIcon, ChartColumnIcon, CoffeeIcon, HistoryIcon, HouseIcon, InfoIcon, LockOpenIcon, SettingsIcon, TimerIcon, UploadIcon, UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { CONFIGURACOES } from '../features/configuracoes/catalogo';
import type { Permissoes } from '../features/extensoes/domain/types';
import { RELATORIOS, temaDe } from '../features/relatorios/catalogo';

/**
 * Arquitetura de informação do menu. O sistema atual tinha 13 itens + 18 relatórios + 13 de administração,
 * todos soltos. Aqui são 12 itens em 4 grupos por tarefa, e cada perfil só vê o que pode usar.
 * Relatórios e Configurações têm uma página de entrada própria; as telas internas aparecem na busca.
 */
export type Permissao = 'extensoes' | 'relatorios' | 'pessoas' | 'administracao';

export function tem(p: Permissoes, permissao: Permissao): boolean {
  if (permissao === 'extensoes') return p.podePedir || p.podeAprovar || p.podeVerTodos;
  if (permissao === 'relatorios') return p.podeVerRelatorios;
  if (permissao === 'pessoas') return p.podeGerirPessoas;
  return p.podeAdministrar;
}

export interface ItemMenu { rotulo: string; para: string; icone: LucideIcon; permissao: Permissao }
export interface GrupoMenu { titulo: string; itens: ItemMenu[] }

export const MENU: GrupoMenu[] = [
  {
    titulo: 'Dia a dia',
    itens: [
      { rotulo: 'Início', para: '/inicio', icone: HouseIcon, permissao: 'relatorios' },
      { rotulo: 'Extensões de jornada', para: '/extensoes', icone: TimerIcon, permissao: 'extensoes' },
      { rotulo: 'Ausências', para: '/ausencias', icone: CalendarOffIcon, permissao: 'relatorios' },
    ],
  },
  {
    titulo: 'Pessoas e jornadas',
    itens: [
      { rotulo: 'Usuários', para: '/usuarios', icone: UsersIcon, permissao: 'pessoas' },
      { rotulo: 'Jornadas de trabalho', para: '/jornadas', icone: CalendarClockIcon, permissao: 'pessoas' },
      { rotulo: 'Pausas', para: '/pausas', icone: CoffeeIcon, permissao: 'pessoas' },
      { rotulo: 'Liberações por diretoria', para: '/liberacoes-por-diretoria', icone: LockOpenIcon, permissao: 'pessoas' },
    ],
  },
  {
    titulo: 'Análise',
    itens: [{ rotulo: 'Relatórios', para: '/relatorios', icone: ChartColumnIcon, permissao: 'relatorios' }],
  },
  {
    titulo: 'Administração',
    itens: [
      { rotulo: 'Configurações', para: '/configuracoes', icone: SettingsIcon, permissao: 'administracao' },
      { rotulo: 'Carga de dados', para: '/carga-de-dados', icone: UploadIcon, permissao: 'administracao' },
      { rotulo: 'Auditoria', para: '/auditoria', icone: HistoryIcon, permissao: 'administracao' },
      { rotulo: 'Sobre', para: '/sobre', icone: InfoIcon, permissao: 'administracao' },
    ],
  },
];

/** Grupos e itens que a pessoa pode ver (grupos vazios somem). */
export function menuPara(p: Permissoes): GrupoMenu[] {
  return MENU.map((g) => ({ ...g, itens: g.itens.filter((i) => tem(p, i.permissao)) })).filter((g) => g.itens.length > 0);
}

/** Primeira tela que a pessoa pode abrir (destino de "/"). */
export function telaInicial(p: Permissoes): string | null {
  return menuPara(p)[0]?.itens[0]?.para ?? null;
}

export function papelDe(p: Permissoes): string {
  if (p.podeAdministrar) return 'Administração';
  if (p.podeGerirPessoas) return 'RH';
  if (p.podeAprovar) return 'Gestão';
  return 'Colaboração';
}

export interface TelaBuscavel { titulo: string; para: string; onde: string; resumo?: string }

/** Todas as telas que a pessoa pode abrir, para a busca: itens do menu + cada relatório + cada configuração. */
export function telasPara(p: Permissoes): TelaBuscavel[] {
  const telas: TelaBuscavel[] = menuPara(p).flatMap((g) => g.itens.map((i) => ({ titulo: i.rotulo, para: i.para, onde: g.titulo })));
  if (tem(p, 'relatorios')) {
    for (const r of RELATORIOS) telas.push({ titulo: r.titulo, para: `/relatorios/${r.slug}`, onde: `Relatórios · ${temaDe(r.tema).titulo}`, resumo: r.resumo });
  }
  if (tem(p, 'administracao')) {
    for (const c of CONFIGURACOES) telas.push({ titulo: c.titulo, para: `/configuracoes/${c.slug}`, onde: 'Configurações', resumo: c.resumo });
  }
  return telas;
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Busca ignorando acentos e maiúsculas. Ordem: título com uma palavra que começa pelo termo
 * ("ip" acha "Último IP" antes de "Tipos de jornada"), depois título que contém, depois local e resumo.
 */
export function buscarTelas(telas: TelaBuscavel[], termo: string): TelaBuscavel[] {
  const t = semAcento(termo.trim());
  if (!t) return telas;
  const nota = (x: TelaBuscavel): number => {
    const titulo = semAcento(x.titulo);
    if (titulo.split(/\s+/).some((palavra) => palavra.startsWith(t)) || titulo.startsWith(t)) return 0;
    if (titulo.includes(t)) return 1;
    if (semAcento(`${x.onde} ${x.resumo ?? ''}`).includes(t)) return 2;
    return 3;
  };
  return telas
    .map((x, i) => ({ x, i, n: nota(x) }))
    .filter((r) => r.n < 3)
    .sort((a, b) => a.n - b.n || a.i - b.i)
    .map((r) => r.x);
}
