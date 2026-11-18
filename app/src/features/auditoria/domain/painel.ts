import { nomeDe } from '../../../mock/diretorio';
import { ABAS, type Aba, type Registro } from './auditoria';

export interface ResumoAuditoria {
  total: number;
  criacoes: number;
  alteracoes: number;
  exclusoes: number;
  /** Quantas pessoas diferentes alteraram algo. */
  pessoas: number;
  /** As 5 áreas, na ordem das abas, inclusive as que não tiveram alteração. */
  porArea: { aba: Aba; rotulo: string; total: number }[];
  areaMaisAlterada: string | null;
  /** Até 5 pessoas, quem mais alterou primeiro. */
  quemMaisAlterou: { pessoaId: string; nome: string; total: number }[];
  /** Um valor para cada dia do período (zero nos dias sem alteração). */
  porDia: { dia: string; total: number }[];
}

const dois = (n: number) => String(n).padStart(2, '0');
function proximoDia(dia: string): string {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Panorama das alterações já filtradas (de todas as áreas). Sem período, vai do primeiro ao último registro. */
export function resumirAuditoria(registros: Registro[], de: string, ate: string): ResumoAuditoria {
  const contar = (acao: Registro['acao']) => registros.filter((r) => r.acao === acao).length;

  const porArea = ABAS.map((a) => ({ aba: a.valor, rotulo: a.rotulo, total: registros.filter((r) => r.aba === a.valor).length }));
  const maior = porArea.reduce((m, a) => (a.total > m.total ? a : m), porArea[0]);

  const porPessoa = new Map<string, number>();
  for (const r of registros) porPessoa.set(r.pessoaId, (porPessoa.get(r.pessoaId) ?? 0) + 1);
  const quemMaisAlterou = [...porPessoa]
    .map(([pessoaId, total]) => ({ pessoaId, nome: nomeDe(pessoaId), total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 5);

  const dias = registros.map((r) => r.quando.slice(0, 10)).sort();
  const inicio = de || dias[0];
  const fim = ate || dias.at(-1);
  const porDia: { dia: string; total: number }[] = [];
  if (inicio && fim) {
    const contagem = new Map<string, number>();
    for (const d of dias) contagem.set(d, (contagem.get(d) ?? 0) + 1);
    // Limite de segurança: no máximo ~um trimestre de colunas.
    for (let d = inicio, n = 0; d <= fim && n < 92; d = proximoDia(d), n++) porDia.push({ dia: d, total: contagem.get(d) ?? 0 });
  }

  return {
    total: registros.length,
    criacoes: contar('Criou'),
    alteracoes: contar('Alterou'),
    exclusoes: contar('Excluiu'),
    pessoas: porPessoa.size,
    porArea,
    areaMaisAlterada: maior && maior.total > 0 ? maior.rotulo : null,
    quemMaisAlterou,
    porDia,
  };
}
