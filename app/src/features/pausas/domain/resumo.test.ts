import { describe, expect, it } from 'vitest';
import { nomeJaExiste, resumoDasPausas } from './resumo';

describe('resumoDasPausas', () => {
  it('usa plural', () => expect(resumoDasPausas(2, 15)).toBe('2 pausas de 15 min'));
  it('usa singular com uma pausa', () => expect(resumoDasPausas(1, 60)).toBe('1 pausa de 60 min'));
});

describe('nomeJaExiste', () => {
  const lista = [{ id: 'a', nome: 'Pausas Comercial' }];
  it('ignora caixa, acento e espaços', () => expect(nomeJaExiste('  pausas comerciál ', lista)).toBe(true));
  it('não conta o próprio item ao editar', () => expect(nomeJaExiste('Pausas Comercial', lista, 'a')).toBe(false));
  it('aceita nome novo', () => expect(nomeJaExiste('Pausas Suporte', lista)).toBe(false));
});
