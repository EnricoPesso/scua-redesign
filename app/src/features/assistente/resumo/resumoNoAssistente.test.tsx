import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../../test/render';
import { decidirExterno, entrarComo, todosOsPedidos } from '../../extensoes/api/mocks/db';
import { extensoesApi } from '../../extensoes/api/extensoesApi';
import { resetarConfigAssistente } from '../preferencias';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  resetarConfigAssistente();
  entrarComo('carlos');
});
afterEach(() => vi.restoreAllMocks());

async function abrirInicio() {
  const app = renderApp('/inicio');
  await screen.findByRole('heading', { level: 1, name: 'Início' }, { timeout: 20_000 });
  return app;
}
const bolha = () => screen.getByRole('button', { name: 'Assistente Scua' });
const janela = () => screen.getByRole('dialog', { name: 'Assistente Scua' });
const campo = () => screen.getByRole('textbox', { name: 'Mensagem para o assistente' });
const log = () => within(janela()).getByRole('log');
const pendentes = () => todosOsPedidos().filter((p) => p.status === 'pendente').map((p) => p.id);

/** Abre a bolha e espera a abertura do dia (que depende de a fila de pedidos carregar). */
async function abrirAssistente(user: ReturnType<typeof renderApp>['user']) {
  await user.click(bolha());
  await within(janela()).findByText(/coisas? precisam? de você hoje:/, {}, { timeout: 20_000 });
}

describe('Assistente proativo: abertura do dia', () => {
  it('a bolha mostra o contador, com texto para leitor de tela, sem mudar o nome do botão', async () => {
    await abrirInicio();
    await waitFor(() => expect(bolha().querySelector('[data-contador]')).not.toBeNull(), { timeout: 20_000 });
    const botao = bolha();
    expect(botao).toHaveAccessibleName('Assistente Scua');
    expect(botao).toHaveAccessibleDescription(/^Assistente, \d+ itens? (precisa|precisam) de você$/);
    expect(botao.querySelector('[data-contador]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ao abrir a conversa vazia, a primeira mensagem é o resumo, com um botão por item', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    expect(log()).toHaveTextContent(/(Bom dia|Boa tarde|Boa noite), Carlos\. \d coisas precisam de você hoje:/);
    const lista = within(log()).getByRole('list', { name: 'O que precisa de você hoje' });
    const botoes = within(lista).getAllByRole('button');
    expect(botoes.length).toBeGreaterThanOrEqual(2);
    expect(botoes[0]).toHaveTextContent('5 pedidos de extensão esperam a sua decisão');
    // O app guarda a abertura, mas ela não vai para a IA: a conversa de verdade ainda não começou.
    expect(within(janela()).getByRole('list', { name: 'Sugestões' })).toBeInTheDocument();
  });

  it('"Limpar conversa" esvazia e a abertura só volta quando a janela é aberta de novo', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    await user.click(within(janela()).getByRole('button', { name: 'Limpar conversa' }));
    expect(log()).toBeEmptyDOMElement();
    await user.click(within(janela()).getByRole('button', { name: 'Fechar assistente' }));
    await user.click(bolha());
    expect(await within(janela()).findByText(/coisas? precisam? de você hoje:/)).toBeInTheDocument();
  });

  it('entende "resumo do dia", "o que precisa de mim" e "o que tenho para hoje"', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    for (const frase of ['resumo do dia', 'o que precisa de mim?', 'o que tenho para hoje']) {
      const antes = within(log()).getAllByRole('list', { name: 'O que precisa de você hoje' }).length;
      await user.clear(campo());
      await user.type(campo(), `${frase}{Enter}`);
      await waitFor(() => expect(within(log()).getAllByRole('list', { name: 'O que precisa de você hoje' })).toHaveLength(antes + 1));
    }
  });

  it('quem é só colaborador não tem item de pedidos para decidir nem dados de outras pessoas', async () => {
    entrarComo('ana');
    const { user } = renderApp('/extensoes');
    await screen.findByRole('heading', { level: 1, name: 'Extensões de jornada' }, { timeout: 20_000 });
    await user.click(bolha());
    const abertura = await within(janela()).findByText(/(Bom dia|Boa tarde|Boa noite), Ana\./, {}, { timeout: 20_000 });
    expect(abertura).toBeInTheDocument();
    expect(log()).not.toHaveTextContent('pedidos de extensão esperam');
    expect(log()).not.toHaveTextContent('além da jornada sem aprovação');
    expect(log()).not.toHaveTextContent('hora extra subindo');
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    expect(await within(log()).findByText('Você não tem acesso para aprovar pedidos.')).toBeInTheDocument();
    expect(within(log()).queryByRole('button', { name: /^Aprovar \d/ })).not.toBeInTheDocument();
  });
});

describe('Assistente proativo: aprovação em lote com confirmação', () => {
  it('o cartão mostra nomes e total, deixa de fora o que passa do limite e não grava nada antes do toque', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    const antes = pendentes();
    const decidir = vi.spyOn(extensoesApi, 'decidirEmLote');
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    const cartao = await within(log()).findByRole('region', { name: 'Confirmar aprovação em lote' });
    // Dentro do limite: João, Bia e Bia (setembro). Fora: Ana (passa de 10h no mês) e Rui (estagiário, limite zero).
    expect(cartao).toHaveTextContent('3 pedidos');
    expect(cartao).toHaveTextContent(/João Lima/);
    expect(cartao).toHaveTextContent(/Bia Rocha/);
    expect(cartao).toHaveTextContent(/Ficam de fora 2 pedidos/);
    expect(cartao).toHaveTextContent(/Ana Souza: passaria do limite mensal do grupo/);
    expect(cartao).toHaveTextContent(/Rui Alves: passaria do limite mensal do grupo/);
    expect(within(cartao).getByRole('button', { name: 'Aprovar 3 pedidos' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(decidir).not.toHaveBeenCalled();
    expect(pendentes()).toEqual(antes);
  });

  it('Cancelar não grava nada', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    const antes = pendentes();
    const decidir = vi.spyOn(extensoesApi, 'decidirEmLote');
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    const cartao = await within(log()).findByRole('region', { name: 'Confirmar aprovação em lote' });
    await user.click(within(cartao).getByRole('button', { name: 'Cancelar' }));
    expect(await within(log()).findByText('Cancelado. Nada foi aprovado.')).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: /Aprovar/ })).not.toBeInTheDocument();
    expect(decidir).not.toHaveBeenCalled();
    expect(pendentes()).toEqual(antes);
  });

  it('o botão do item dos pedidos leva ao mesmo cartão; Aprovar chama a aprovação em lote só com os que estão dentro do limite', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    const decidir = vi.spyOn(extensoesApi, 'decidirEmLote');
    await user.click(within(log()).getByRole('button', { name: /5 pedidos de extensão esperam/ }));
    const cartao = await within(log()).findByRole('region', { name: 'Confirmar aprovação em lote' });
    await user.click(within(cartao).getByRole('button', { name: 'Aprovar 3 pedidos' }));
    await waitFor(() => expect(decidir).toHaveBeenCalledTimes(1));
    const [ids, decisao] = decidir.mock.calls[0];
    expect([...ids].sort()).toEqual(['p-2', 'p-3', 'p-8']);
    expect(decisao).toEqual({ acao: 'aprovar' });
    expect(await within(log()).findByText(/3 pedidos aprovados\./)).toBeInTheDocument();
    // Os dois fora do limite continuam esperando; nada foi reprovado nem excluído.
    expect(pendentes().sort()).toEqual(['p-1', 'p-4', 'p-9']);
    expect(todosOsPedidos().filter((p) => p.status === 'reprovado')).toHaveLength(1);
    expect(todosOsPedidos()).toHaveLength(9);
  });

  it('um toque só: o cartão sai do estado de espera e não aprova duas vezes', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    const decidir = vi.spyOn(extensoesApi, 'decidirEmLote');
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    const cartao = await within(log()).findByRole('region', { name: 'Confirmar aprovação em lote' });
    const aprovar = within(cartao).getByRole('button', { name: 'Aprovar 3 pedidos' });
    await user.dblClick(aprovar);
    await within(log()).findByText(/3 pedidos aprovados\./);
    expect(decidir).toHaveBeenCalledTimes(1);
  });

  it('fila mudou entre o cartão e o toque (pedido decidido por outra via): não aprova nada e pede para conferir de novo', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    const cartao = await within(log()).findByRole('region', { name: 'Confirmar aprovação em lote' });
    // O gestor decide o p-2 pelo Teams enquanto o cartão está aberto.
    decidirExterno('p-2', 'reprovado', 'teams');
    await user.click(within(cartao).getByRole('button', { name: 'Aprovar 3 pedidos' }));
    expect(await within(log()).findByText(/A fila mudou desde que montei esta lista, então não aprovei nada/)).toBeInTheDocument();
    expect(log()).not.toHaveTextContent(/pedidos aprovados\./);
    // O cartão antigo perde o efeito: não dá para confirmar de novo.
    expect(within(cartao).queryByRole('button', { name: /^Aprovar \d/ })).not.toBeInTheDocument();
  });

  it('só pedidos fora do limite: não oferece aprovar, diz quais ficaram de fora e por quê', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    // Deixa só a Ana e o Rui na fila.
    for (const id of ['p-2', 'p-3', 'p-8']) decidirExterno(id, 'aprovado', 'teams');
    await user.type(campo(), 'aprovar os pedidos dentro do limite{Enter}');
    expect(await within(log()).findByText(/Nenhum dos 2 pedidos cabe no limite do grupo/)).toBeInTheDocument();
    expect(within(log()).queryByRole('button', { name: /^Aprovar \d/ })).not.toBeInTheDocument();
    expect(log()).toHaveTextContent(/Ana Souza: passaria do limite/);
  });

  it('não reprova nem exclui: recusa e aponta a tela de pedidos', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    await user.type(campo(), 'reprovar os pedidos{Enter}');
    expect(await within(log()).findByText(/Eu não reprovo pedidos nem excluo nada/)).toBeInTheDocument();
    expect(within(log()).getByRole('link', { name: /Ver pedidos/ })).toHaveAttribute('href', '/extensoes/aprovar');
  });

  it('"Como aprovo uma extensão?" continua sendo uma dúvida, sem cartão de aprovação', async () => {
    const { user } = await abrirInicio();
    await abrirAssistente(user);
    await user.type(campo(), 'Como aprovo uma extensão?{Enter}');
    expect(await within(log()).findByText(/Para aprovar/)).toBeInTheDocument();
    expect(within(log()).queryByRole('region', { name: 'Confirmar aprovação em lote' })).not.toBeInTheDocument();
  });
});
