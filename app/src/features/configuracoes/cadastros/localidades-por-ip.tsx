import { criarColecao } from '../../../mock/colecao';
import type { ConfigCadastro } from '../../../componentes/cadastro/tipos';
import { validarIpv4 } from '../domain/rede';
import { baseDe } from './comum';

export interface LocalidadePorIp { id: string; localidade: string; endereco: string; mascara: string }

const l = (n: number, localidade: string, endereco: string, mascara: string): LocalidadePorIp => ({ id: `ip-${n}`, localidade, endereco, mascara });

export const localidadesPorIp = criarColecao<LocalidadePorIp>(
  'ip',
  () => [
    l(1, 'Matriz, andar 1', '10.20.1.0', '24'),
    l(2, 'Matriz, andar 2', '10.20.2.0', '24'),
    l(3, 'Matriz, andar 3', '10.20.3.0', '24'),
    l(4, 'Matriz, data center', '10.20.250.0', '28'),
    l(5, 'Filial São Paulo', '10.30.0.0', '22'),
    l(6, 'Filial Rio de Janeiro', '10.31.0.0', '22'),
    l(7, 'Filial Belo Horizonte', '10.32.0.0', '23'),
    l(8, 'Filial Curitiba', '10.33.0.0', '23'),
    l(9, 'Filial Porto Alegre', '10.34.0.0', '24'),
    l(10, 'Filial Recife', '10.35.0.0', '24'),
    l(11, 'Filial Salvador', '10.36.0.0', '24'),
    l(12, 'Filial Brasília', '10.37.0.0', '24'),
    l(13, 'Centro de distribuição Campinas', '172.16.10.0', '24'),
    l(14, 'Centro de distribuição Contagem', '172.16.20.0', '24'),
    l(15, 'VPN, trabalho remoto', '10.99.0.0', '16'),
    l(16, 'VPN, parceiros', '10.98.0.0', '20'),
    l(17, 'Rede de visitantes', '192.168.50.0', '24'),
    l(18, 'Laboratório de testes', '192.168.100.0', '26'),
  ],
  (d, itens, id) => (itens.some((i) => i.id !== id && i.endereco.trim() === d.endereco.trim() && i.mascara === d.mascara) ? 'Essa faixa de endereços já está cadastrada.' : undefined),
);

const MASCARAS = Array.from({ length: 23 }, (_, i) => String(i + 8));

export const configLocalidadesPorIp: ConfigCadastro<LocalidadePorIp> = {
  ...baseDe('localidades-por-ip'),
  singular: 'localidade',
  genero: 'a',
  colecao: localidadesPorIp,
  colunas: [
    { key: 'localidade', header: 'Localidade' },
    { key: 'endereco', header: 'Endereço de rede' },
    { key: 'mascara', header: 'Máscara', render: (i) => `/${i.mascara}` },
  ],
  campos: [
    { chave: 'localidade', rotulo: 'Localidade', tipo: 'texto', obrigatorio: true, maximo: 80, dica: 'Onde ficam as estações desta faixa, como Filial São Paulo.' },
    { chave: 'endereco', rotulo: 'Endereço de rede', tipo: 'texto', obrigatorio: true, maximo: 15, dica: 'O primeiro endereço da faixa, como 10.20.0.0.' },
    { chave: 'mascara', rotulo: 'Máscara', tipo: 'select', obrigatorio: true, opcoes: MASCARAS.map((m) => ({ value: m, label: `/${m}` })), dica: 'Define o tamanho da faixa. /24 cobre 256 endereços.' },
  ],
  novo: () => ({ localidade: '', endereco: '', mascara: '24' }),
  nomeDe: (i) => i.localidade,
  textoDeBusca: (i) => `${i.localidade} ${i.endereco}`,
  validar: (d) => (d.endereco.trim() && validarIpv4(d.endereco) ? { endereco: validarIpv4(d.endereco) } : {}),
};
