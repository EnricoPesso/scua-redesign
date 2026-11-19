import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { telasPara } from '../../layout/menu';
import { renderApp } from '../../test/render';
import { entrarComo } from '../extensoes/api/mocks/db';
import type { Permissoes } from '../extensoes/domain/types';
import { lerConfig } from './preferencias';

const ROTA = '/configuracoes/assistente-ia';

const admin: Permissoes = {
  usuario: { id: 'u-carlos', nome: 'Carlos Mendes' },
  podePedir: true, podePedirParaOutros: true, podeAprovar: true, podeVerTodos: true, podeVerRelatorios: true, podeGerirPessoas: true, podeAdministrar: true,
};

let fetchEspiao: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  window.sessionStorage.clear();
  entrarComo('carlos');
  fetchEspiao = vi.spyOn(globalThis, 'fetch');
});
afterEach(() => vi.restoreAllMocks());

async function abrirTela() {
  const app = renderApp(ROTA);
  await screen.findByRole('heading', { level: 1, name: 'Assistente de IA' }, { timeout: 20_000 });
  return app;
}
const salvar = () => screen.getByRole('button', { name: 'Salvar' });

describe('Configurações › Assistente de IA', () => {
  it('desligar o assistente e salvar guarda a escolha e a bolha some', async () => {
    const { user } = await abrirTela();
    const ligado = screen.getByRole('switch', { name: 'Assistente ligado' });
    expect(ligado).toBeChecked();
    expect(screen.getByRole('button', { name: 'Assistente Scua' })).toBeInTheDocument();
    await user.click(ligado);
    await user.click(salvar());
    expect(await screen.findByText('Configurações do assistente salvas.')).toBeInTheDocument();
    expect(lerConfig().ativo).toBe(false);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Assistente Scua' })).not.toBeInTheDocument());
  });

  it('desligar a aprovação automática tira o controle da janela do assistente', async () => {
    const { user } = await abrirTela();
    await user.click(screen.getByRole('button', { name: 'Assistente Scua' }));
    expect(within(screen.getByRole('dialog', { name: 'Assistente Scua' })).getByRole('switch', { name: 'Aprovação automática' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog', { name: 'Assistente Scua' })).getByRole('button', { name: 'Fechar assistente' }));

    await user.click(screen.getByRole('switch', { name: 'Permitir aprovação automática' }));
    await user.click(salvar());
    await screen.findByText('Configurações do assistente salvas.');
    expect(lerConfig().permitirAutomatica).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Assistente Scua' }));
    expect(within(screen.getByRole('dialog', { name: 'Assistente Scua' })).queryByRole('switch', { name: 'Aprovação automática' })).not.toBeInTheDocument();
  });

  it('a chave própria nunca é guardada nem mostrada: o campo esvazia e só os 4 últimos caracteres aparecem', async () => {
    const { user } = await abrirTela();
    expect(screen.queryByLabelText('Chave de API')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Chave própria' }));
    const campo = screen.getByLabelText('Chave de API');
    expect(campo).toHaveAttribute('type', 'password');
    await user.type(campo, 'sk-abcdef1234');
    await user.click(salvar());
    await screen.findByText('Configurações do assistente salvas.');

    expect(screen.getByLabelText('Chave de API')).toHaveValue('');
    expect(screen.getByText(/termina em …1234/)).toBeInTheDocument();
    expect(lerConfig().origemDaChave).toBe('propria');

    const guardado = JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage });
    expect(guardado).not.toContain('sk-abcdef1234');
    expect(document.body.innerHTML).not.toContain('sk-abcdef1234');
    expect(JSON.stringify(lerConfig())).not.toContain('sk-abcdef');
  });

  it('mostra o aviso da versão de demonstração e a situação da conexão, sem falar com a rede', async () => {
    await abrirTela();
    expect(screen.getByText(/Nesta versão de demonstração a chave não é guardada\. A conexão real usa a configuração do servidor\./)).toBeInTheDocument();
    expect(screen.getByText(/são enviados ao provedor de IA configurado/)).toBeInTheDocument();
    expect(await screen.findByText('Modo demonstração')).toBeInTheDocument();
    expect((fetchEspiao.mock.calls as unknown[][]).filter(([url]) => String(url).includes('/api/assistente'))).toEqual([]);
  });

  it('quem não é da administração vê "Sem acesso"', async () => {
    entrarComo('olga');
    renderApp(ROTA);
    expect(await screen.findByRole('heading', { level: 1, name: 'Sem acesso' }, { timeout: 20_000 })).toBeInTheDocument();
  });

  it('a busca de telas da administração inclui "Assistente de IA"', () => {
    expect(telasPara(admin).map((t) => t.titulo)).toContain('Assistente de IA');
    expect(telasPara({ ...admin, podeAdministrar: false }).map((t) => t.titulo)).not.toContain('Assistente de IA');
  });
});
