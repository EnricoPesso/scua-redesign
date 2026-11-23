import { describe, expect, it } from 'vitest';
import { entenderPedido } from './intencao';

describe('entenderPedido', () => {
  it.each([
    'resumo do dia', 'Resumo do dia, por favor', 'o que precisa de mim?', 'O que eu preciso fazer hoje?', 'o que tenho para hoje', 'quais são as minhas pendências',
  ])('"%s" pede o resumo', (texto) => {
    expect(entenderPedido(texto)).toBe('resumo');
  });

  it.each([
    'aprovar os pedidos dentro do limite', 'Aprove os pedidos dentro do limite', 'aprovar em lote', 'aprova todos os pedidos', 'pode aprovar as extensões pendentes',
  ])('"%s" pede a aprovação em lote', (texto) => {
    expect(entenderPedido(texto)).toBe('aprovar-lote');
  });

  it.each(['reprovar os pedidos', 'exclua os pedidos de extensão', 'recusar todos os pedidos'])('"%s" é recusado (o assistente não reprova nem exclui)', (texto) => {
    expect(entenderPedido(texto)).toBe('reprovar');
  });

  it.each([
    'Como aprovo uma extensão?', 'como aprovar pedidos?', 'onde aprovar os pedidos', 'qual a capital da França?', 'abrir ausências de ontem', 'aprovar o pedido do João',
  ])('"%s" não é um dos comandos do app', (texto) => {
    expect(entenderPedido(texto)).toBeNull();
  });
});
