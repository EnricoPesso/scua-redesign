import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { definirFalhaDeRede } from '../../mock/rede';
import { renderApp } from '../../test/render';
import { historico } from './api';

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  historico.resetar();
  definirFalhaDeRede(false);
  vi.restoreAllMocks();
});

const CAB = 'Login;Data inicial;Data final';
const csv = (...linhas: string[]) => [CAB, ...linhas].join('\r\n');
const arquivo = (texto: string, nome = 'ferias.csv') => new File([texto], nome, { type: 'text/csv' });

async function abrir() {
  const app = renderApp('/carga-de-dados');
  await screen.findByRole('heading', { level: 1, name: 'Carga de dados' });
  await screen.findByText('ferias-janeiro.csv');
  return app;
}
const cartao = () => screen.getByRole('region', { name: 'Férias' });
const enviar = (user: ReturnType<typeof renderApp>['user'], f: File) => user.upload(within(cartao()).getByLabelText('Arquivo CSV de Férias'), f);

describe('Tela de carga de dados', () => {
  it('mostra o passo a passo, as seis cargas com as colunas e o histórico', async () => {
    await abrir();
    expect(screen.getByText(/Baixe o modelo/)).toBeInTheDocument();
    for (const nome of ['Exceções por diretoria', 'Férias', 'Feriados', 'Extensões de jornada', 'Feriados por usuário', 'Telefones para WhatsApp']) {
      expect(screen.getByRole('heading', { level: 2, name: nome })).toBeInTheDocument();
    }
    expect(within(cartao()).getByText('Data inicial')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Baixar modelo de/ })).toHaveLength(6);
    const hist = screen.getByRole('region', { name: 'Últimas cargas' });
    expect(within(hist).getByText('120 importadas, 5 ignoradas')).toBeInTheDocument();
  });

  it('baixa o modelo da carga com BOM, ";" e uma linha de exemplo', async () => {
    const criar = vi.fn<(b: Blob) => string>(() => 'blob:modelo');
    URL.createObjectURL = criar;
    URL.revokeObjectURL = vi.fn();
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = await abrir();
    await user.click(screen.getByRole('button', { name: 'Baixar modelo de Férias' }));
    expect(clique).toHaveBeenCalledTimes(1);
    const bytes = await new Promise<Uint8Array>((ok) => {
      const l = new FileReader();
      l.onload = () => ok(new Uint8Array(l.result as ArrayBuffer));
      l.readAsArrayBuffer(criar.mock.calls[0][0]);
    });
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Login;Data inicial;Data final\r\nana.souza;04/01/2027;23/01/2027\r\n');

  });

  it('mostra a prévia com os problemas, importa e mostra o resumo e o histórico', async () => {
    const { user } = await abrir();
    await enviar(user, arquivo(csv('ana.souza;01/01/2027;10/01/2027', 'joao.lima;20/01/2027;10/01/2027', 'bia.rocha;02/02/2027;05/02/2027')));
    expect(await within(cartao()).findByText('2 linhas prontas para importar, 1 com problema')).toBeInTheDocument();
    expect(within(cartao()).getByText('Linha 3: a data final é anterior à inicial')).toBeInTheDocument();

    await user.click(within(cartao()).getByRole('button', { name: 'Importar 2 linhas' }));
    expect(await within(cartao()).findByText(/2 linhas importadas em 12\/10 às 10:00\. 1 linha ignorada\./)).toBeInTheDocument();
    expect(screen.getByText('Férias: 2 linhas importadas.')).toBeInTheDocument();
    const hist = screen.getByRole('region', { name: 'Últimas cargas' });
    expect(await within(hist).findByText('ferias.csv')).toBeInTheDocument();
    expect(within(hist).getByText('2 importadas, 1 ignorada')).toBeInTheDocument();
  });

  it('limita a lista de problemas a 20 e diz quantos faltam', async () => {
    const { user } = await abrir();
    const ruins = Array.from({ length: 23 }, () => 'fulano.xyz;01/01/2027;02/01/2027');
    await enviar(user, arquivo(csv('ana.souza;01/01/2027;10/01/2027', ...ruins)));
    expect(await within(cartao()).findByText('1 linha pronta para importar, 23 com problema')).toBeInTheDocument();
    expect(within(cartao()).getAllByText(/^Linha \d+: o login fulano\.xyz não existe$/)).toHaveLength(20);
    expect(within(cartao()).getByText('e mais 3')).toBeInTheDocument();
    expect(within(cartao()).getByRole('button', { name: 'Importar 1 linha' })).toBeEnabled();
  });

  it('desabilita a importação quando nenhuma linha é válida', async () => {
    const { user } = await abrir();
    await enviar(user, arquivo(csv('fulano.xyz;01/01/2027;02/01/2027')));
    expect(await within(cartao()).findByText('Nenhuma linha pronta para importar, 1 com problema')).toBeInTheDocument();
    expect(within(cartao()).getByRole('button', { name: 'Importar 0 linhas' })).toBeDisabled();
  });

  it('explica o que está errado quando o cabeçalho não é o do modelo', async () => {
    const { user } = await abrir();
    await enviar(user, arquivo('Nome;Inicio;Fim\nAna;01/01/2027;02/01/2027'));
    const alerta = await within(cartao()).findByRole('alert');
    expect(alerta).toHaveTextContent('O arquivo não tem as colunas do modelo. Baixe o modelo e copie os dados para ele.');
    expect(within(cartao()).queryByRole('button', { name: /^Importar/ })).not.toBeInTheDocument();
  });

  it('recusa arquivo que não é CSV e arquivo vazio', async () => {
    const livre = userEvent.setup({ applyAccept: false });
    await abrir();
    await livre.upload(within(cartao()).getByLabelText('Arquivo CSV de Férias'), arquivo('x', 'planilha.xlsx'));
    expect(await within(cartao()).findByRole('alert')).toHaveTextContent('Este arquivo não é um CSV');
    await livre.upload(within(cartao()).getByLabelText('Arquivo CSV de Férias'), arquivo('', 'vazio.csv'));
    await waitFor(() => expect(within(cartao()).getByRole('alert')).toHaveTextContent('O arquivo está vazio'));
  });

  it('avisa quando a importação falha, mantém o arquivo e permite tentar de novo', async () => {
    const { user } = await abrir();
    await enviar(user, arquivo(csv('ana.souza;01/01/2027;10/01/2027')));
    await within(cartao()).findByText('1 linha pronta para importar, nenhuma com problema');
    definirFalhaDeRede(true);
    await user.click(within(cartao()).getByRole('button', { name: 'Importar 1 linha' }));
    expect(await within(cartao()).findByText('Não conseguimos importar. Nada foi alterado.')).toBeInTheDocument();
    expect(within(cartao()).getByText('ferias.csv')).toBeInTheDocument();

    definirFalhaDeRede(false);
    await user.click(within(cartao()).getByRole('button', { name: 'Tentar de novo' }));
    expect(await within(cartao()).findByText(/1 linha importada em/)).toBeInTheDocument();
  });

  it('"Escolher outro arquivo" descarta a prévia', async () => {
    const { user } = await abrir();
    await enviar(user, arquivo(csv('ana.souza;01/01/2027;10/01/2027')));
    await user.click(await within(cartao()).findByRole('button', { name: 'Escolher outro arquivo' }));
    expect(within(cartao()).queryByRole('button', { name: /^Importar/ })).not.toBeInTheDocument();
  });

  it('mostra o histórico vazio quando não há cargas', async () => {
    vi.spyOn(historico, 'listar').mockResolvedValue([]);
    renderApp('/carga-de-dados');
    expect(await screen.findByText('Nenhuma carga feita ainda')).toBeInTheDocument();
  });

  it('mostra erro ao carregar o histórico com "Tentar de novo"', async () => {
    definirFalhaDeRede(true);
    renderApp('/carga-de-dados');
    expect(await screen.findByText('Não conseguimos carregar os dados')).toBeInTheDocument();
  });
});
