import { Badge } from '@/components/ui/badge';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, noPeriodo, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';
import { rotuloEvento, statusEvento } from '../dados/eventos';
import { tentativas, type Tentativa } from '../dados/tentativas';

const config: ConfigRelatorio<Tentativa> = {
  titulo: 'Tentativas de acesso fora da jornada',
  grupo: 'Bloqueios e liberações',
  arquivo: 'tentativas-fora-da-jornada',
  vazio: 'Nenhuma tentativa fora da jornada nesse período.',
  filtros: [FILTRO_COLABORADORES, FILTRO_GESTORES, { tipo: 'periodo', dias: 7 }],
  kpis: [
    { rotulo: 'Tentativas', valor: (rows) => rows.length },
    { rotulo: 'Colaboradores', valor: (rows) => new Set(rows.map((r) => r.pessoaId)).size },
    { rotulo: 'Gestores com equipe envolvida', valor: (rows) => new Set(rows.map((r) => r.gestorId)).size },
    {
      rotulo: 'Média por colaborador',
      decimais: 1,
      valor: (rows) => {
        const pessoas = new Set(rows.map((r) => r.pessoaId)).size;
        return pessoas ? rows.length / pessoas : 0;
      },
    },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    colunaSemQuebra('estacao', 'Estação'),
    { key: 'evento', header: 'Evento', render: (r) => <Badge status={statusEvento(r.evento)}>{rotuloEvento(r.evento)}</Badge>, texto: (r) => rotuloEvento(r.evento) },
    colunaDataHora('quando', 'Data e hora'),
  ],
  buscar: buscarEm((f) => porPessoa(tentativas(), f).filter((t) => noPeriodo(t.quando, f))),
};

export default config;
