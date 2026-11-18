/**
 * Pessoas, estações e estrutura da empresa de exemplo. É a base comum de todas as telas simuladas:
 * o mesmo nome aparece igual em Usuários, Extensões, Ausências e nos relatórios.
 * Os ids das 8 primeiras pessoas são os mesmos do mock de Extensões de jornada.
 */

export interface PessoaDiretorio {
  id: string;
  nome: string;
  login: string;
  matricula: string;
  /** null = topo da hierarquia. */
  gestorId: string | null;
  departamento: string;
  diretoria: string;
  /** Estação principal (nome). */
  estacao: string;
}

export const DIRETORIAS = ['Comercial', 'Operações', 'Financeiro', 'Tecnologia', 'Pessoas'] as const;

const p = (id: string, nome: string, login: string, matricula: string, gestorId: string | null, departamento: string, diretoria: string, estacao: string): PessoaDiretorio =>
  ({ id, nome, login, matricula, gestorId, departamento, diretoria, estacao });

export const PESSOAS_DIRETORIO: PessoaDiretorio[] = [
  p('u-carlos', 'Carlos Mendes', 'carlos.mendes', '1001', null, 'Vendas', 'Comercial', 'SCUA-NB-014'),
  p('u-ana', 'Ana Souza', 'ana.souza', '1002', 'u-carlos', 'Vendas', 'Comercial', 'SCUA-NB-021'),
  p('u-joao', 'João Lima', 'joao.lima', '1003', 'u-carlos', 'Vendas', 'Comercial', 'SCUA-DT-007'),
  p('u-bia', 'Bia Rocha', 'bia.rocha', '1004', 'u-carlos', 'Logística', 'Operações', 'SCUA-DT-012'),
  p('u-rui', 'Rui Alves', 'rui.alves', '1005', 'u-carlos', 'Vendas', 'Comercial', 'SCUA-NB-033'),
  p('u-xavier', 'Xavier Pinto', 'xavier.pinto', '1006', 'u-olga', 'Contas a pagar', 'Financeiro', 'SCUA-DT-019'),
  p('u-olga', 'Olga Prado', 'olga.prado', '1007', null, 'Controladoria', 'Financeiro', 'SCUA-NB-002'),
  p('u-renata', 'Renata Dias', 'renata.dias', '1008', null, 'Recursos humanos', 'Pessoas', 'SCUA-NB-005'),
  p('u-diego', 'Diego Farias', 'diego.farias', '1009', 'u-olga', 'Contas a receber', 'Financeiro', 'SCUA-DT-020'),
  p('u-elaine', 'Elaine Castro', 'elaine.castro', '1010', 'u-olga', 'Fiscal', 'Financeiro', 'SCUA-DT-023'),
  p('u-fabio', 'Fábio Nunes', 'fabio.nunes', '1011', 'u-carlos', 'Pré-vendas', 'Comercial', 'SCUA-NB-040'),
  p('u-gabi', 'Gabriela Teles', 'gabriela.teles', '1012', 'u-carlos', 'Pós-venda', 'Comercial', 'SCUA-NB-041'),
  p('u-heitor', 'Heitor Ramos', 'heitor.ramos', '1013', 'u-marcos', 'Infraestrutura', 'Tecnologia', 'SCUA-DT-031'),
  p('u-iara', 'Iara Mota', 'iara.mota', '1014', 'u-marcos', 'Desenvolvimento', 'Tecnologia', 'SCUA-NB-052'),
  p('u-julio', 'Júlio Peixoto', 'julio.peixoto', '1015', 'u-marcos', 'Suporte', 'Tecnologia', 'SCUA-DT-034'),
  p('u-karen', 'Karen Lopes', 'karen.lopes', '1016', 'u-renata', 'Recrutamento', 'Pessoas', 'SCUA-NB-060'),
  p('u-leo', 'Leonardo Brito', 'leonardo.brito', '1017', 'u-renata', 'Folha de pagamento', 'Pessoas', 'SCUA-DT-041'),
  p('u-marcos', 'Marcos Vidal', 'marcos.vidal', '1018', null, 'Tecnologia', 'Tecnologia', 'SCUA-NB-003'),
  p('u-nina', 'Nina Duarte', 'nina.duarte', '1019', 'u-marcos', 'Desenvolvimento', 'Tecnologia', 'SCUA-NB-053'),
  p('u-otavio', 'Otávio Reis', 'otavio.reis', '1020', 'u-olga', 'Tesouraria', 'Financeiro', 'SCUA-DT-024'),
  p('u-paula', 'Paula Guedes', 'paula.guedes', '1021', 'u-carlos', 'Logística', 'Operações', 'SCUA-DT-013'),
  p('u-quesia', 'Quésia Andrade', 'quesia.andrade', '1022', 'u-carlos', 'Logística', 'Operações', 'SCUA-DT-014'),
  p('u-sara', 'Sara Bastos', 'sara.bastos', '1023', 'u-marcos', 'Suporte', 'Tecnologia', 'SCUA-DT-035'),
  p('u-tiago', 'Tiago Moreira', 'tiago.moreira', '1024', 'u-olga', 'Fiscal', 'Financeiro', 'SCUA-DT-025'),
];

export const pessoaPorId = (id: string | null | undefined): PessoaDiretorio | undefined => PESSOAS_DIRETORIO.find((x) => x.id === id);
export const nomeDe = (id: string | null | undefined): string => pessoaPorId(id)?.nome ?? '—';
export const gestorDe = (pessoa: PessoaDiretorio): PessoaDiretorio | undefined => pessoaPorId(pessoa.gestorId);

/** Quem tem equipe. */
export const GESTORES: PessoaDiretorio[] = PESSOAS_DIRETORIO.filter((x) => PESSOAS_DIRETORIO.some((y) => y.gestorId === x.id));

/** Opções para os filtros (multi-select e select) de colaborador e de gestor. O valor é o id. */
export const OPCOES_PESSOAS = PESSOAS_DIRETORIO.map((x) => ({ value: x.id, label: x.nome }));
export const OPCOES_GESTORES = GESTORES.map((x) => ({ value: x.id, label: x.nome }));
export const OPCOES_DIRETORIAS = DIRETORIAS.map((d) => ({ value: d, label: d }));

export interface EstacaoDiretorio {
  nome: string;
  dominio: string;
  /** '' = agente não instalado. */
  versaoAgente: string;
  ativa: boolean;
  /** Dias desde o último registro do agente (0 = hoje). */
  diasSemRegistro: number;
  liberada: boolean;
}

const VERSAO_ATUAL = '2.0.10';
/** Uma estação por pessoa, mais três sem uso (inativas). */
export const ESTACOES_DIRETORIO: EstacaoDiretorio[] = [
  ...PESSOAS_DIRETORIO.map((x, i): EstacaoDiretorio => ({
    nome: x.estacao,
    dominio: 'scua.local',
    versaoAgente: i % 7 === 6 ? '2.0.8' : VERSAO_ATUAL,
    ativa: true,
    diasSemRegistro: i % 9 === 8 ? 2 : 0,
    liberada: i % 11 === 10,
  })),
  { nome: 'SCUA-DT-090', dominio: 'scua.local', versaoAgente: '2.0.8', ativa: false, diasSemRegistro: 47, liberada: false },
  { nome: 'SCUA-DT-091', dominio: 'scua.local', versaoAgente: '1.9.4', ativa: false, diasSemRegistro: 112, liberada: false },
  { nome: 'SCUA-NB-095', dominio: 'scua.local', versaoAgente: '', ativa: false, diasSemRegistro: 203, liberada: false },
];
