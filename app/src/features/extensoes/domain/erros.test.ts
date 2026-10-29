import { describe, expect, it } from 'vitest';
import { ApiError, mensagemParaUsuario } from './erros';

describe('mensagemParaUsuario', () => {
  it('nunca repassa texto técnico', () => {
    const m = mensagemParaUsuario(new Error('[object ProgressEvent]'), 'carregar');
    expect(m).toBe('Não conseguimos carregar os pedidos. Verifique sua conexão. Se continuar, fale com o TI da sua empresa.');
  });
  it('falha de rede ao enviar', () =>
    expect(mensagemParaUsuario(new ApiError(0, 'REDE'), 'enviar')).toBe('Não conseguimos enviar. Seus dados estão salvos aqui.'));
  it('erro 500 ao decidir', () =>
    expect(mensagemParaUsuario(new ApiError(500, 'X'), 'decidir')).toBe('Não conseguimos registrar a decisão. Tente de novo.'));
  it('403', () => expect(mensagemParaUsuario(new ApiError(403, 'PROIBIDO'), 'carregar')).toBe('Você não tem acesso a este pedido.'));
  it('404', () => expect(mensagemParaUsuario(new ApiError(404, 'NAO_ENCONTRADO'), 'carregar')).toBe('Este pedido não existe ou foi removido.'));
  it('conflito de período', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'PERIODO_CONFLITANTE'), 'enviar')).toBe('Já existe um pedido pendente para esse período.'));
  it('não editável', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'NAO_EDITAVEL'), 'enviar')).toBe('Este pedido não pode mais ser editado.'));
  it('não pendente', () =>
    expect(mensagemParaUsuario(new ApiError(409, 'NAO_PENDENTE'), 'decidir')).toBe('Este pedido não está mais pendente.'));
  it('já decidido em outro canal', () => {
    const e = new ApiError(409, 'JA_DECIDIDO', { status: 'aprovado', por: 'Carlos Mendes', canal: 'whatsapp', em: '2026-10-12T17:42:00' });
    expect(mensagemParaUsuario(e, 'decidir')).toBe('Este pedido já foi aprovado por Carlos Mendes via WhatsApp às 17:42.');
  });
});
