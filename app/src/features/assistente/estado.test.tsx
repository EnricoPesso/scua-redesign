import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provedores } from '../../app/Provedores';
import { criarQueryClient } from '../../app/queryClient';
import { entrarComo } from '../extensoes/api/mocks/db';
import type { ResultadoAplicar } from './acoes';
import * as api from './api';
import type { AlvoFormulario } from './contrato';
import { AJUSTES, AssistenteProvider, useAlvoDoAssistente, useAssistente } from './estado';
import { lerConfig, resetarConfigAssistente, salvarAutomatica, salvarConfig } from './preferencias';

const pausa: AlvoFormulario = {
  tipo: 'formulario', id: 'cadastro:pausas', titulo: 'Perfil de pausas', valores: {},
  campos: [{ chave: 'nome', rotulo: 'Nome', tipo: 'texto' }, { chave: 'minutos', rotulo: 'Duração', tipo: 'numero', maximo: 60 }],
};
const jornada: AlvoFormulario = { tipo: 'formulario', id: 'jornada', titulo: 'Jornada de trabalho', valores: {}, campos: [{ chave: 'identificador', rotulo: 'Identificador', tipo: 'texto' }, { chave: 'semana', rotulo: 'Semana', tipo: 'semana' }] };

const aplicar = vi.fn((campos: Record<string, unknown>): ResultadoAplicar => ({ aplicados: Object.entries(campos).map(([k, v]) => ({ rotulo: k === 'nome' ? 'Nome' : k, valor: typeof v === 'object' ? 'semana' : String(v) })), ignorados: [] }));
const salvar = vi.fn(async () => ({ ok: true, mensagem: 'Salvei perfil de pausas Café.' }));

let assistente: ReturnType<typeof useAssistente>;
let navegar: ReturnType<typeof useNavigate>;

/** Cada formulário é um componente próprio: trocar de rota desmonta um e monta outro, como nas telas de verdade. */
function Registra({ alvo }: { alvo: AlvoFormulario | null }) {
  useAlvoDoAssistente(alvo ? { alvo, aplicar, salvar } : null);
  return null;
}

/** Tela de mentira: registra o alvo conforme a rota. */
function Tela({ alvoFixo }: { alvoFixo?: AlvoFormulario | null }) {
  assistente = useAssistente();
  const { pathname, search } = useLocation();
  navegar = useNavigate();
  const porRota = pathname === '/jornadas/nova' ? jornada
    : pathname === '/pausas' && search === '?novo=1' ? pausa
    : pathname === '/pausas' && search === '?editar=1' ? { ...pausa, titulo: 'Editar perfil de pausas Café', editando: true }
    // Tela "errada": no endereço de criar localidade aparece o formulário de jornada.
    : pathname === '/configuracoes/localidades-por-ip' ? jornada
    : null;
  const alvo = alvoFixo !== undefined ? alvoFixo : porRota;
  return (
    <>
      <Registra key={pathname + search} alvo={alvo} />
      <output data-testid="local">{pathname + search}</output>
      <ol aria-label="conversa">{assistente.conversa.map((m, i) => <li key={i} data-erro={m.erro ? 'sim' : undefined}>{m.texto}</li>)}</ol>
    </>
  );
}

async function montar(rota: string, alvoFixo?: AlvoFormulario | null) {
  render(
    <Provedores client={criarQueryClient({ semRetry: true })}>
      <MemoryRouter initialEntries={[rota]}>
        <AssistenteProvider><Tela alvoFixo={alvoFixo} /></AssistenteProvider>
      </MemoryRouter>
    </Provedores>,
  );
  await waitFor(() => expect(assistente.ativo).toBe(true));
}

const enviar = (texto: string) => act(() => assistente.enviar(texto));
const ultima = () => screen.getByRole('list', { name: 'conversa' }).lastElementChild as HTMLElement;
const local = () => screen.getByTestId('local').textContent;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.localStorage.clear();
  resetarConfigAssistente();
  aplicar.mockClear();
  salvar.mockClear();
  entrarComo('carlos');
});
afterEach(() => { AJUSTES.prazoDoPendenteMs = 8000; vi.restoreAllMocks(); });

describe('assistente: conversa e ações', () => {
  it('preenche o formulário aberto, descreve o que fez e não salva sozinho', async () => {
    await montar('/pausas?novo=1');
    await enviar('nome: Café');
    expect(aplicar).toHaveBeenCalledWith({ nome: 'Café' });
    expect(ultima()).toHaveTextContent('Preenchi:');
    expect(ultima()).toHaveTextContent('Nome: Café');
    expect(ultima()).toHaveTextContent('Confira e clique em Salvar.');
    expect(salvar).not.toHaveBeenCalled();
    expect(assistente.conversa[0]).toMatchObject({ papel: 'usuario', texto: 'nome: Café' });
    expect(assistente.simulado).toBe(true);
  });

  it('com aprovação automática ligada, salva e mostra a mensagem do formulário', async () => {
    salvarAutomatica('u-carlos', true);
    await montar('/pausas?novo=1');
    expect(assistente.automatica).toBe(true);
    await enviar('nome: Café');
    expect(salvar).toHaveBeenCalledTimes(1);
    expect(ultima()).toHaveTextContent('Salvei perfil de pausas Café.');
    expect(ultima()).not.toHaveTextContent('Confira e clique em Salvar.');
  });

  it('se o administrador proíbe, a aprovação automática não vale mesmo ligada pela pessoa', async () => {
    salvarAutomatica('u-carlos', true);
    salvarConfig({ ...lerConfig(), permitirAutomatica: false });
    await montar('/pausas?novo=1');
    expect(assistente.podeAutomatica).toBe(false);
    expect(assistente.automatica).toBe(false);
    await enviar('nome: Café');
    expect(aplicar).toHaveBeenCalled();
    expect(salvar).not.toHaveBeenCalled();
  });

  it('a preferência de aprovação automática é de cada pessoa e fica guardada', async () => {
    await montar('/pausas?novo=1');
    act(() => assistente.definirAutomatica(true));
    expect(assistente.automatica).toBe(true);
    expect(window.localStorage.getItem('scua.assistente.auto.u-carlos')).toBe('1');
    expect(window.localStorage.getItem('scua.assistente.auto.u-olga')).toBeNull();
  });

  it('navega só para onde a pessoa pode ir', async () => {
    entrarComo('olga');
    await montar('/extensoes', null);
    await enviar('me leva para auditoria');
    expect(local()).toBe('/extensoes');
    expect(ultima()).toHaveTextContent(/não encontrei|acesso/i);
  });

  it('ação proibida devolvida pela IA é recusada pelo app, mesmo que o servidor a deixe passar', async () => {
    entrarComo('olga');
    vi.spyOn(api, 'perguntar').mockResolvedValue({ texto: '', acoes: [{ tipo: 'navegar', rota: '/auditoria' }, { tipo: 'navegar', rota: 'https://exemplo.com' }, { tipo: 'preencher', campos: { nome: 'X' } }] });
    await montar('/extensoes', null);
    await enviar('qualquer coisa');
    expect(local()).toBe('/extensoes');
    expect(aplicar).not.toHaveBeenCalled();
    expect(ultima()).toHaveTextContent('Não posso fazer isso com o seu acesso.');
  });

  it('navegação permitida muda a tela e avisa', async () => {
    await montar('/inicio', null);
    await enviar('me leva para ausências de ontem');
    expect(local()).toBe('/ausencias?de=2026-10-11&ate=2026-10-11');
    expect(ultima()).toHaveTextContent('Abri Ausências.');
  });

  it('pedido de cadastro em outra tela: abre o formulário e continua o pedido sozinho', async () => {
    await montar('/inicio');
    await enviar('cria uma jornada seg a sex 8 às 17 nome NOVA-1');
    await waitFor(() => expect(local()).toBe('/jornadas/nova'));
    await waitFor(() => expect(aplicar).toHaveBeenCalledTimes(1));
    const campos = aplicar.mock.calls[0][0] as { identificador: string; semana: { seg: { entrada: string } } };
    expect(campos.identificador).toBe('NOVA-1');
    expect(campos.semana.seg.entrada).toBe('08:00');
    // A pessoa falou uma vez só.
    expect(assistente.conversa.filter((m) => m.papel === 'usuario')).toHaveLength(1);
    await waitFor(() => expect(ultima()).toHaveTextContent('Confira e clique em Salvar.'));
  });

  it('pedido pendente expira se o formulário não aparece, e não preenche nada depois', async () => {
    AJUSTES.prazoDoPendenteMs = 60;
    vi.spyOn(api, 'perguntar').mockResolvedValue({ texto: '', acoes: [{ tipo: 'abrir_formulario', formulario: 'cadastro:grupos' }] });
    await montar('/inicio');
    await enviar('cria um grupo');
    await waitFor(() => expect(ultima()).toHaveTextContent('Abri a tela, mas não consegui preencher.'));
    expect(aplicar).not.toHaveBeenCalled();
    expect(api.perguntar).toHaveBeenCalledTimes(1);
  });

  it('se outro formulário aparece no lugar do esperado, o pendente é cancelado sem preencher', async () => {
    vi.spyOn(api, 'perguntar').mockResolvedValue({ texto: '', acoes: [{ tipo: 'abrir_formulario', formulario: 'cadastro:localidades-por-ip' }] });
    await montar('/inicio');
    await enviar('cria uma localidade');
    await waitFor(() => expect(local()).toBe('/configuracoes/localidades-por-ip?novo=1'));
    // O prazo do pendente é de 8 s: o aviso só chega a tempo porque apareceu um formulário diferente do esperado.
    await waitFor(() => expect(ultima()).toHaveTextContent('Abri a tela, mas não consegui preencher.'));
    expect(aplicar).not.toHaveBeenCalled();
    expect(api.perguntar).toHaveBeenCalledTimes(1);
  });

  it('resposta que chega depois de a pessoa trocar de formulário não preenche nem salva o outro', async () => {
    salvarAutomatica('u-carlos', true);
    let responder!: (r: Awaited<ReturnType<typeof api.perguntar>>) => void;
    vi.spyOn(api, 'perguntar').mockReturnValue(new Promise((ok) => { responder = ok; }));
    await montar('/pausas?novo=1');
    let envio!: Promise<void>;
    act(() => { envio = assistente.enviar('nome: Café'); });
    // Enquanto a IA responde, a pessoa fecha a pausa e abre uma jornada nova.
    await act(async () => { await navegar('/jornadas/nova'); });
    await act(async () => { responder({ texto: '', acoes: [{ tipo: 'preencher', campos: { nome: 'Café' } }] }); await envio; });
    expect(aplicar).not.toHaveBeenCalled();
    expect(salvar).not.toHaveBeenCalled();
    expect(ultima()).toHaveTextContent('O formulário mudou enquanto eu respondia');
  });

  it('resposta que chega depois de limpar a conversa é descartada', async () => {
    let responder!: (r: Awaited<ReturnType<typeof api.perguntar>>) => void;
    vi.spyOn(api, 'perguntar').mockReturnValue(new Promise((ok) => { responder = ok; }));
    await montar('/pausas?novo=1');
    let envio!: Promise<void>;
    act(() => { envio = assistente.enviar('nome: Café'); });
    act(() => assistente.limpar());
    await act(async () => { responder({ texto: '', acoes: [{ tipo: 'preencher', campos: { nome: 'Café' } }] }); await envio; });
    expect(aplicar).not.toHaveBeenCalled();
    expect(assistente.conversa).toEqual([]);
  });

  it('com um formulário de edição aberto, pedir para criar abre o formulário de criação em vez de alterar o registro', async () => {
    await montar('/pausas?editar=1');
    await enviar('cria uma pausa nome: Lanche');
    await waitFor(() => expect(local()).toBe('/pausas?novo=1'));
    await waitFor(() => expect(aplicar).toHaveBeenCalledTimes(1));
    expect(aplicar).toHaveBeenCalledWith({ nome: 'Lanche' });
    await waitFor(() => expect(ultima()).toHaveTextContent('Confira e clique em Salvar.'));
  });

  it('ação de uma ferramenta que não foi oferecida é recusada', async () => {
    // Sem formulário aberto, "preencher" não é oferecida.
    vi.spyOn(api, 'perguntar').mockResolvedValue({ texto: '', acoes: [{ tipo: 'preencher', campos: { nome: 'Café' } }] });
    await montar('/inicio');
    await enviar('nome: Café');
    expect(aplicar).not.toHaveBeenCalled();
    expect(ultima()).toHaveTextContent('Não posso fazer isso com o seu acesso.');
  });

  it('erro da IA vira aviso com texto humano; tentar de novo repete o pedido', async () => {
    const espia = vi.spyOn(api, 'perguntar').mockRejectedValueOnce(new api.ErroDoAssistente('limite'));
    await montar('/inicio', null);
    await enviar('como aprovo uma extensão?');
    expect(ultima()).toHaveTextContent('O limite de uso da IA foi atingido. Tente daqui a pouco.');
    expect(ultima()).toHaveAttribute('data-erro', 'sim');
    espia.mockRestore();
    await act(() => assistente.tentarDeNovo());
    expect(ultima()).toHaveTextContent('Extensões de jornada');
    expect(assistente.conversa.some((m) => m.erro)).toBe(false);
    expect(assistente.conversa.filter((m) => m.papel === 'usuario')).toHaveLength(1);
  });

  it('erro inesperado não vaza detalhe técnico', async () => {
    vi.spyOn(api, 'perguntar').mockRejectedValue(new Error('TypeError: fetch failed sk-123'));
    await montar('/inicio', null);
    await enviar('oi');
    expect(ultima()).toHaveTextContent('Não consegui responder agora.');
    expect(ultima()).not.toHaveTextContent('sk-123');
  });

  it('texto vazio é ignorado; limpar esvazia a conversa', async () => {
    await montar('/inicio', null);
    await enviar('   ');
    expect(assistente.conversa).toHaveLength(0);
    await enviar('como funciona a auditoria?');
    expect(assistente.conversa).toHaveLength(2);
    act(() => assistente.limpar());
    expect(assistente.conversa).toHaveLength(0);
  });

  it('assistente desligado pelo administrador fica inativo', async () => {
    await montar('/inicio', null);
    act(() => salvarConfig({ ...lerConfig(), ativo: false }));
    expect(assistente.ativo).toBe(false);
  });
});
