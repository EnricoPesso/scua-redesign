import { Badge } from '@/components/ui/badge';
import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { dia, diasEntre } from '../../../mock/datas';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, porPessoa } from '../dados/base';
import { colunaDataHora } from '../dados/colunas';
import { rotuloEvento, statusEvento } from '../dados/eventos';
import { controles, type Controle } from '../dados/jornada';

interface LinhaControle extends Controle { diasSemControle: number }

const config: ConfigRelatorio<LinhaControle> = {
  titulo: 'Último controle por usuário',
  grupo: 'Jornada e horas',
  arquivo: 'ultimo-controle',
  vazio: 'Ninguém está sem controle há tanto tempo.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    {
      tipo: 'select',
      chave: 'dias',
      rotulo: 'Sem controle há mais de',
      opcoes: [{ value: '7', label: '7 dias' }, { value: '15', label: '15 dias' }, { value: '30', label: '30 dias' }],
    },
  ],
  kpis: [
    { rotulo: 'Pessoas', valor: (rows) => rows.length },
    { rotulo: 'Média de dias sem controle', decimais: 1, valor: (rows) => (rows.length ? rows.reduce((s, r) => s + r.diasSemControle, 0) / rows.length : 0) },
    { rotulo: 'Maior intervalo', unidade: 'dias', valor: (rows) => Math.max(0, ...rows.map((r) => r.diasSemControle)) },
    { rotulo: 'Sem controle há mais de 30 dias', valor: (rows) => rows.filter((r) => r.diasSemControle > 30).length },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    { key: 'gestor', header: 'Gestor' },
    colunaDataHora('ultimoEventoEm', 'Data do último controle'),
    { key: 'ultimoEvento', header: 'Evento', render: (r) => <Badge status={statusEvento(r.ultimoEvento)}>{rotuloEvento(r.ultimoEvento)}</Badge>, texto: (r) => rotuloEvento(r.ultimoEvento) },
    { key: 'diasSemControle', header: 'Dias desde o último controle', numeric: true },
  ],
  buscar: buscarEm((f) => {
    const minimo = Number(lerTexto(f, 'dias')) || 0;
    return porPessoa(controles(), f)
      .map((c) => ({ ...c, diasSemControle: diasEntre(c.ultimoEventoEm.slice(0, 10), dia(0)) }))
      .filter((c) => !minimo || c.diasSemControle > minimo)
      .sort((a, b) => b.diasSemControle - a.diasSemControle);
  }),
};

export default config;
