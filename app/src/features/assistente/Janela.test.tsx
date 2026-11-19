import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { entrarComo } from '../extensoes/api/mocks/db';
import * as api from './api';
import { lerConfig, salvarConfig } from './preferencias';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
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

describe('Assistente: bolha e janela', () => {
  it('a bolha abre a janela, com o foco no campo de mensagem', async () => {
    const { user } = await abrirInicio();
    expect(bolha()).toHaveAttribute('aria-expanded', 'false');
    await user.click(bolha());
    expect(bolha()).toHaveAttribute('aria-expanded', 'true');
    expect(janela()).toBeInTheDocument();
    await waitFor(() => expect(campo()).toHaveFocus());
  });

  it('Esc e o botão Fechar fecham a janela e devolvem o foco à bolha', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Assistente Scua' })).not.toBeInTheDocument();
    expect(bolha()).toHaveFocus();
    await user.click(bolha());
    await user.click(within(janela()).getByRole('button', { name: 'Fechar assistente' }));
    expect(screen.queryByRole('dialog', { name: 'Assistente Scua' })).not.toBeInTheDocument();
    expect(bolha()).toHaveFocus();
  });

  it('Enter envia, o campo esvazia e a resposta aparece; Shift+Enter não envia', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.type(campo(), 'linha 1{Shift>}{Enter}{/Shift}');
    expect(within(janela()).getByRole('log')).toBeEmptyDOMElement();
    await user.clear(campo());
    await user.type(campo(), 'qual a capital da França?{Enter}');
    const log = within(janela()).getByRole('log');
    expect(await within(log).findByText('qual a capital da França?')).toBeInTheDocument();
    expect(await within(log).findByText(/Só consigo ajudar com o Scua Logon/)).toBeInTheDocument();
    expect(campo()).toHaveValue('');
  });

  it('botão Enviar fica desabilitado sem texto', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    const enviar = within(janela()).getByRole('button', { name: 'Enviar' });
    expect(enviar).toBeDisabled();
    await user.type(campo(), 'oi');
    expect(enviar).toBeEnabled();
  });

  it('mostra o aviso de IA e de envio de dados, e o selo de demonstração depois da primeira resposta', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    expect(within(janela()).getByText(/Respostas geradas por IA/)).toBeInTheDocument();
    expect(within(janela()).getByText(/são enviados ao provedor de IA configurado/)).toBeInTheDocument();
    await user.type(campo(), 'como funciona a auditoria?{Enter}');
    expect(await within(janela()).findByText(/Modo demonstração/)).toBeInTheDocument();
  });

  it('sugestões aparecem com a conversa vazia e enviam ao clicar', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.click(within(janela()).getByRole('button', { name: 'Como aprovo uma extensão?' }));
    expect(await within(janela()).findByText(/Para aprovar/)).toBeInTheDocument();
    expect(within(janela()).queryByRole('button', { name: 'Como aprovo uma extensão?' })).not.toBeInTheDocument();
  });

  it('"Limpar conversa" esvazia o histórico', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.type(campo(), 'como funciona a auditoria?{Enter}');
    await within(janela()).findByText(/registra quem alterou/);
    await user.click(within(janela()).getByRole('button', { name: 'Limpar conversa' }));
    expect(within(janela()).getByRole('log')).toBeEmptyDOMElement();
  });

  it('erro mostra o aviso e o botão "Tentar de novo"', async () => {
    const espia = vi.spyOn(api, 'perguntar').mockRejectedValueOnce(new api.ErroDoAssistente('indisponivel'));
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.type(campo(), 'como funciona a auditoria?{Enter}');
    expect(await within(janela()).findByText('Não consegui responder agora.')).toBeInTheDocument();
    espia.mockRestore();
    await user.click(within(janela()).getByRole('button', { name: 'Tentar de novo' }));
    expect(await within(janela()).findByText(/registra quem alterou/)).toBeInTheDocument();
    expect(within(janela()).queryByText('Não consegui responder agora.')).not.toBeInTheDocument();
  });

  it('resposta com HTML aparece como texto, sem criar elementos', async () => {
    vi.spyOn(api, 'perguntar').mockResolvedValue({ texto: '<img src=x onerror="window.__xss=1"> <b>oi</b>', acoes: [] });
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.type(campo(), 'oi{Enter}');
    const log = within(janela()).getByRole('log');
    expect(await within(log).findByText(/<img src=x/)).toBeInTheDocument();
    expect(log.querySelector('img')).toBeNull();
    expect(log.querySelector('b')).toBeNull();
    expect((window as { __xss?: number }).__xss).toBeUndefined();
  });

  it('a conversa continua ao trocar de tela', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    await user.type(campo(), 'como funciona a auditoria?{Enter}');
    await within(janela()).findByText(/registra quem alterou/);
    await user.click(screen.getAllByRole('link', { name: 'Ausências' })[0]);
    await screen.findByRole('heading', { level: 1, name: 'Ausências' }, { timeout: 20_000 });
    expect(within(janela()).getByText(/registra quem alterou/)).toBeInTheDocument();
  });

  it('aprovação automática: controle na janela, some quando o administrador proíbe', async () => {
    const { user } = await abrirInicio();
    await user.click(bolha());
    const controle = within(janela()).getByRole('switch', { name: 'Aprovação automática' });
    expect(controle).not.toBeChecked();
    await user.click(controle);
    expect(window.localStorage.getItem('scua.assistente.auto.u-carlos')).toBe('1');
    act(() => salvarConfig({ ...lerConfig(), permitirAutomatica: false }));
    expect(within(janela()).queryByRole('switch', { name: 'Aprovação automática' })).not.toBeInTheDocument();
  });

  it('assistente desligado pelo administrador: a bolha não existe', async () => {
    salvarConfig({ ...lerConfig(), ativo: false });
    await abrirInicio();
    expect(screen.queryByRole('button', { name: 'Assistente Scua' })).not.toBeInTheDocument();
  });
});
