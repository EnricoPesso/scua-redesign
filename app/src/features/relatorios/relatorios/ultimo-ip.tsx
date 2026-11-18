import { lerTexto } from '@/lib/relatorio';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import { LOCALIDADES, ultimosIps, type UltimoIp } from '../dados/acesso';
import { FILTRO_COLABORADORES, FILTRO_GESTORES, buscarEm, porPessoa } from '../dados/base';
import { colunaDataHora, colunaSemQuebra } from '../dados/colunas';

const config: ConfigRelatorio<UltimoIp> = {
  titulo: 'Último IP por usuário',
  grupo: 'Acesso',
  arquivo: 'ultimo-ip',
  vazio: 'Nenhum endereço IP encontrado para os filtros escolhidos.',
  filtros: [
    FILTRO_COLABORADORES,
    FILTRO_GESTORES,
    { tipo: 'texto', chave: 'ip', rotulo: 'Endereço IP', placeholder: 'Ex.: 10.20.1' },
    { tipo: 'select', chave: 'localidade', rotulo: 'Localidade', opcoes: LOCALIDADES.map((l) => ({ value: l, label: l })) },
  ],
  kpis: [
    { rotulo: 'Pessoas', valor: (rows) => rows.length },
    { rotulo: 'Endereços distintos', valor: (rows) => new Set(rows.map((r) => r.ip)).size },
    { rotulo: 'Localidades', valor: (rows) => new Set(rows.map((r) => r.localidade)).size },
    { rotulo: 'Acesso remoto', valor: (rows) => rows.filter((r) => r.localidade === 'Acesso remoto (VPN)').length },
  ],
  colunas: [
    { key: 'colaborador', header: 'Colaborador' },
    colunaSemQuebra('estacao', 'Estação'),
    colunaSemQuebra('ip', 'Endereço IP'),
    { key: 'localidade', header: 'Localidade' },
    colunaDataHora('coletadoEm', 'Coletado em'),
  ],
  buscar: buscarEm((f) => {
    const ip = lerTexto(f, 'ip').trim();
    const localidade = lerTexto(f, 'localidade');
    return porPessoa(ultimosIps(), f).filter((r) => (!ip || r.ip.startsWith(ip)) && (!localidade || r.localidade === localidade));
  }),
};

export default config;
