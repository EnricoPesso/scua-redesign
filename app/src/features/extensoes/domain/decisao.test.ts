import { describe, expect, it } from 'vitest';
import { descreverEvento, eventosRecentesPrimeiro, proximoDaFila, rotuloMotivo, validarReprovacao } from './decisao';
import type { Evento } from './types';

const ana = { id: 'u-ana', nome: 'Ana Souza' };
const carlos = { id: 'u-carlos', nome: 'Carlos Mendes' };

describe('motivos de reprovação', () => {
  it('traduz o código para o texto da tela', () => {
    expect(rotuloMotivo('outro_horario')).toBe('Combinar outro horário');
    expect(rotuloMotivo('nao_necessario')).toBe('Não é necessário');
  });

  it('exige motivo, e mensagem quando o motivo é "Outro"', () => {
    expect(validarReprovacao(null, '')).toEqual({ motivo: 'Escolha um motivo' });
    expect(validarReprovacao('outro', '  ')).toEqual({ mensagem: 'Escreva uma mensagem explicando o motivo' });
    expect(validarReprovacao('outro', 'Sem orçamento')).toEqual({});
    expect(validarReprovacao('periodo_errado', '')).toEqual({});
  });
});

describe('histórico', () => {
  it('descreve quem, o quê, canal e quando, usando "você" para o próprio usuário', () => {
    const criado: Evento = { tipo: 'criado', por: ana, canal: 'painel', em: '2026-10-12T16:30:00' };
    expect(descreverEvento(criado, ana.id)).toEqual({ titulo: 'Pedido criado por você', detalhe: 'via painel · 12/10 às 16:30' });
    expect(descreverEvento(criado, carlos.id).titulo).toBe('Pedido criado por Ana Souza');
  });

  it('aviso usa texto neutro em gênero e edição mostra o que mudou', () => {
    expect(descreverEvento({ tipo: 'avisado', por: carlos, canal: 'whatsapp', em: '2026-10-12T16:31:00' }, ana.id))
      .toEqual({ titulo: 'Carlos Mendes recebeu o aviso', detalhe: 'via WhatsApp · 12/10 às 16:31' });
    expect(descreverEvento({ tipo: 'editado', por: ana, canal: 'painel', em: '2026-10-12T16:40:00', detalhe: 'horário 18:00–21:00 → 18:00–20:00' }, ana.id))
      .toEqual({ titulo: 'Editado por você', detalhe: 'horário 18:00–21:00 → 18:00–20:00 · via painel · 12/10 às 16:40' });
  });

  it('sem autor, o título fica só com a ação', () => {
    expect(descreverEvento({ tipo: 'cancelado', por: null, canal: 'painel', em: '2026-10-12T10:00:00' }, ana.id).titulo).toBe('Cancelado');
  });

  it('ordena do mais recente para o mais antigo sem mexer no original', () => {
    const lista: Evento[] = [
      { tipo: 'criado', por: ana, canal: 'painel', em: '2026-10-12T16:30:00' },
      { tipo: 'aprovado', por: carlos, canal: 'painel', em: '2026-10-12T19:05:00' },
    ];
    expect(eventosRecentesPrimeiro(lista).map((e) => e.tipo)).toEqual(['aprovado', 'criado']);
    expect(lista[0].tipo).toBe('criado');
  });
});

describe('próximo da fila', () => {
  it('abre o seguinte; no último, volta para o anterior; sozinho, fecha', () => {
    expect(proximoDaFila(['a', 'b', 'c'], 'a')).toBe('b');
    expect(proximoDaFila(['a', 'b', 'c'], 'c')).toBe('b');
    expect(proximoDaFila(['a'], 'a')).toBeNull();
  });

  it('pedido que não está na lista abre o primeiro da fila', () => {
    expect(proximoDaFila(['a', 'b'], 'x')).toBe('a');
    expect(proximoDaFila([], 'x')).toBeNull();
  });
});
