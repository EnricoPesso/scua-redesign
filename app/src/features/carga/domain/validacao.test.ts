import { describe, expect, it } from 'vitest';
import { cargaPorId, type DefinicaoCarga } from './cargas';
import { formatarQuando, listaDeProblemas, resultadoDoHistorico, resumoDaImportacao, resumoDaPrevia } from './textos';
import { dataParaIso, horaValida, LIMITE_DE_PROBLEMAS, TAMANHO_MAXIMO, telefoneValido, validarArquivo } from './validacao';

const ferias = cargaPorId('ferias') as DefinicaoCarga;
const extensoes = cargaPorId('extensoes') as DefinicaoCarga;
const telefones = cargaPorId('telefones') as DefinicaoCarga;
const excecoes = cargaPorId('excecoes-diretoria') as DefinicaoCarga;
const feriados = cargaPorId('feriados') as DefinicaoCarga;

const arq = (texto: string, nome = 'a.csv', tamanho = texto.length) => ({ nome, tamanho, texto });
const CAB_FERIAS = 'Login;Data inicial;Data final';

describe('campos', () => {
  it('data dd/mm/aaaa só aceita datas que existem', () => {
    expect(dataParaIso('29/02/2028')).toBe('2028-02-29');
    expect(dataParaIso('31/02/2026')).toBeNull();
    expect(dataParaIso('2026-02-10')).toBeNull();
    expect(dataParaIso('1/2/2026')).toBe('2026-02-01');
  });
  it('hora hh:mm', () => {
    expect(horaValida('9:05')).toBe('09:05');
    expect(horaValida('24:00')).toBeNull();
    expect(horaValida('10:60')).toBeNull();
  });
  it('telefone exige DDD', () => {
    expect(telefoneValido('(11) 98765-4321')).toBe(true);
    expect(telefoneValido('+55 11 98765-4321')).toBe(true);
    expect(telefoneValido('1133334444')).toBe(true);
    expect(telefoneValido('98765-4321')).toBe(false);
    expect(telefoneValido('(11) 88765-4321')).toBe(false);
    expect(telefoneValido('abc')).toBe(false);
  });
});

describe('validarArquivo: arquivo inteiro inválido', () => {
  it('não é .csv', () => {
    const r = validarArquivo(arq('x', 'planilha.xlsx'), ferias);
    expect(r).toEqual({ ok: false, erro: expect.stringContaining('não é um CSV') });
  });
  it('grande demais', () => {
    const r = validarArquivo(arq(`${CAB_FERIAS}\n`, 'a.csv', TAMANHO_MAXIMO + 1), ferias);
    expect(r).toEqual({ ok: false, erro: expect.stringContaining('máximo é 2,0 MB') });
  });
  it('vazio', () => {
    expect(validarArquivo(arq('  \n', 'a.csv'), ferias)).toEqual({ ok: false, erro: expect.stringContaining('vazio') });
  });
  it('binário disfarçado de csv', () => {
    expect(validarArquivo(arq('PK\u0000\u0003xx'), ferias)).toEqual({ ok: false, erro: expect.stringContaining('não é texto') });
  });
  it('cabeçalho diferente do modelo', () => {
    const r = validarArquivo(arq('Nome;Inicio;Fim\nAna;01/01/2027;02/01/2027'), ferias);
    expect(r).toEqual({ ok: false, erro: 'O arquivo não tem as colunas do modelo. Baixe o modelo e copie os dados para ele.' });
  });
  it('só cabeçalho', () => {
    expect(validarArquivo(arq(CAB_FERIAS), ferias)).toEqual({ ok: false, erro: expect.stringContaining('só tem o cabeçalho') });
  });
  it('aceita cabeçalho sem acento e com outra caixa', () => {
    const r = validarArquivo(arq('login;DATA INICIAL;data final\nana.souza;01/01/2027;02/01/2027'), ferias);
    expect(r).toMatchObject({ ok: true, validas: [{ Login: 'ana.souza' }] });
  });
});

describe('validarArquivo: linhas', () => {
  it('separa prontas e com problema, com o número da linha do arquivo', () => {
    const texto = [
      CAB_FERIAS,
      'ana.souza;01/01/2027;10/01/2027',
      'joao.lima;20/01/2027;10/01/2027',
      'fulano.xyz;01/01/2027;02/01/2027',
      'bia.rocha;31/02/2027;02/03/2027',
      ';01/01/2027;02/01/2027',
      'rui.alves;01/01/2027',
    ].join('\r\n');
    const r = validarArquivo(arq(texto), ferias);
    expect(r).toMatchObject({ ok: true, total: 6 });
    if (!r.ok) return;
    expect(r.validas).toHaveLength(1);
    expect(r.problemas).toEqual([
      { linha: 3, mensagem: 'a data final é anterior à inicial' },
      { linha: 4, mensagem: 'o login fulano.xyz não existe' },
      { linha: 5, mensagem: '"Data inicial" tem uma data que não existe (31/02/2027). Use dd/mm/aaaa' },
      { linha: 6, mensagem: 'a coluna "Login" está vazia' },
      { linha: 7, mensagem: 'a linha tem 2 colunas e o modelo tem 3' },
    ]);
  });
  it('hora final precisa ser depois da inicial', () => {
    const r = validarArquivo(arq('Login;Data;Hora inicial;Hora final;Motivo\nana.souza;18/11/2026;20:00;18:00;x'), extensoes);
    expect(r).toMatchObject({ ok: true, problemas: [{ linha: 2, mensagem: 'a hora final precisa ser depois da inicial' }] });
  });
  it('telefone sem DDD e diretoria desconhecida', () => {
    const t = validarArquivo(arq('Login;Telefone\nana.souza;98765-4321'), telefones);
    expect(t).toMatchObject({ problemas: [{ mensagem: expect.stringContaining('DDD') }] });
    const d = validarArquivo(arq('Diretoria;Data inicial;Data final;Motivo\nMarketing;01/12/2026;02/12/2026;x'), excecoes);
    expect(d).toMatchObject({ problemas: [{ mensagem: 'a diretoria Marketing não existe' }] });
  });
  it('feriado válido', () => {
    expect(validarArquivo(arq('Data;Descrição\n25/12/2026;Natal'), feriados)).toMatchObject({ validas: [{ Data: '25/12/2026' }], problemas: [] });
  });
});

describe('textos', () => {
  it('resumo da prévia com singular e plural', () => {
    expect(resumoDaPrevia(18, 2)).toBe('18 linhas prontas para importar, 2 com problema');
    expect(resumoDaPrevia(1, 0)).toBe('1 linha pronta para importar, nenhuma com problema');
    expect(resumoDaPrevia(0, 3)).toBe('Nenhuma linha pronta para importar, 3 com problema');
  });
  it('limita a lista de problemas', () => {
    const muitos = Array.from({ length: 25 }, (_, i) => ({ linha: i + 2, mensagem: 'x' }));
    const r = listaDeProblemas(muitos);
    expect(r.itens).toHaveLength(LIMITE_DE_PROBLEMAS);
    expect(r.itens[0]).toBe('Linha 2: x');
    expect(r.restantes).toBe(5);
    expect(listaDeProblemas(muitos.slice(0, 3)).restantes).toBe(0);
  });
  it('quando e resumos', () => {
    expect(formatarQuando('2026-11-17T14:32:00')).toBe('17/11 às 14:32');
    expect(resumoDaImportacao(18, 2, '2026-11-17T14:32:00')).toBe('18 linhas importadas em 17/11 às 14:32. 2 linhas ignoradas.');
    expect(resumoDaImportacao(1, 0, '2026-11-17T14:32:00')).toBe('1 linha importada em 17/11 às 14:32.');
    expect(resultadoDoHistorico(18, 2)).toBe('18 importadas, 2 ignoradas');
    expect(resultadoDoHistorico(1, 1)).toBe('1 importada, 1 ignorada');
  });
});
