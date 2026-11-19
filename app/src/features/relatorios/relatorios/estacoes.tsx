import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { dia } from '../../../mock/datas';
import { ESTACOES_DIRETORIO } from '../../../mock/diretorio';
import { buscarEm } from '../dados/base';
import { colunaData, colunaSemQuebra, colunaSimNao } from '../dados/colunas';

interface LinhaEstacao {
  id: string;
  nome: string;
  dominio: string;
  /** "Não instalado" quando o agente não está na estação. */
  versao: string;
  ativa: boolean;
  /** YYYY-MM-DD do último registro do agente. */
  ultimoRegistro: string;
  liberada: boolean;
}

const SEM_AGENTE = 'Não instalado';

function estacoes(): LinhaEstacao[] {
  return ESTACOES_DIRETORIO.map((e) => ({
    id: e.nome,
    nome: e.nome,
    dominio: e.dominio,
    versao: e.versaoAgente || SEM_AGENTE,
    ativa: e.ativa,
    ultimoRegistro: dia(-e.diasSemRegistro),
    liberada: e.liberada,
  }));
}

const versoes = [...new Set(ESTACOES_DIRETORIO.map((e) => e.versaoAgente || SEM_AGENTE))].sort((a, b) => b.localeCompare(a));

// Une "Estações" e "Estações inativas" do sistema atual, com o filtro "Situação".
const config: ConfigRelatorio<LinhaEstacao> = {
  titulo: 'Estações',
  grupo: 'Estações',
  arquivo: 'estacoes',
  vazio: 'Nenhuma estação encontrada para os filtros escolhidos.',
  filtros: [
    { tipo: 'texto', chave: 'nome', rotulo: 'Nome da estação', placeholder: 'Ex.: SCUA-NB-014' },
    { tipo: 'select', chave: 'situacao', rotulo: 'Situação', opcoes: [{ value: 'ativa', label: 'Ativa' }, { value: 'inativa', label: 'Inativa' }] },
    { tipo: 'select', chave: 'versao', rotulo: 'Versão do agente', opcoes: versoes.map((v) => ({ value: v, label: v })) },
    { tipo: 'select', chave: 'liberada', rotulo: 'Liberada', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
  ],
  kpis: [
    { rotulo: 'Estações', valor: (rows) => rows.length },
    { rotulo: 'Ativas', valor: (rows) => rows.filter((r) => r.ativa).length },
    { rotulo: 'Inativas', valor: (rows) => rows.filter((r) => !r.ativa).length },
    { rotulo: 'Sem agente instalado', valor: (rows) => rows.filter((r) => r.versao === SEM_AGENTE).length },
  ],
  colunas: [
    colunaSemQuebra('nome', 'Nome'),
    { key: 'dominio', header: 'Domínio' },
    colunaSemQuebra('versao', 'Versão do agente'),
    { key: 'ativa', header: 'Situação', render: (r) => <Badge status={r.ativa ? 'success' : 'neutral'}>{r.ativa ? 'Ativa' : 'Inativa'}</Badge>, texto: (r) => (r.ativa ? 'Ativa' : 'Inativa') },
    colunaData('ultimoRegistro', 'Último registro'),
    colunaSimNao('liberada', 'Liberada'),
  ],
  buscar: buscarEm((f) => {
    const nome = lerTexto(f, 'nome').trim().toUpperCase();
    const situacao = lerTexto(f, 'situacao');
    const versao = lerTexto(f, 'versao');
    const liberada = lerTexto(f, 'liberada');
    return estacoes().filter(
      (e) =>
        (!nome || e.nome.includes(nome)) &&
        (!situacao || e.ativa === (situacao === 'ativa')) &&
        (!versao || e.versao === versao) &&
        (!liberada || e.liberada === (liberada === 'sim')),
    );
  }),
};

export default config;
