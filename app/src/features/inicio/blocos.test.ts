import { describe, expect, it } from 'vitest';
import { agruparParaExibir, BLOCOS_PADRAO, idDeRelatorio, lerIdRelatorio, mover, sanitizarPreferencia, tipoDoBloco } from './blocos';

const tudoPermitido = () => true;

describe('blocos do início: preferência', () => {
  it('sem preferência salva (ou salva com lixo), usa o padrão', () => {
    expect(sanitizarPreferencia(null, tudoPermitido)).toEqual(BLOCOS_PADRAO);
    expect(sanitizarPreferencia('não é json', tudoPermitido)).toEqual(BLOCOS_PADRAO);
    expect(sanitizarPreferencia(JSON.stringify({ a: 1 }), tudoPermitido)).toEqual(BLOCOS_PADRAO);
  });

  it('mantém a ordem salva, tira repetidos e ids que não existem mais', () => {
    const salvo = JSON.stringify(['historico', 'kpi-horas', 'historico', 'bloco-que-sumiu', idDeRelatorio('tempo-de-bloqueio', 0), 'rel:nao-existe:0']);
    expect(sanitizarPreferencia(salvo, tudoPermitido)).toEqual(['historico', 'kpi-horas', 'rel:tempo-de-bloqueio:0']);
  });

  it('respeita a permissão: bloco que a pessoa não pode ver sai da lista', () => {
    const semAprovar = (id: string) => id !== 'aviso' && id !== 'parados';
    expect(sanitizarPreferencia(JSON.stringify(['aviso', 'parados', 'status']), semAprovar)).toEqual(['status']);
    expect(sanitizarPreferencia(null, semAprovar)).not.toContain('aviso');
  });

  it('lista vazia salva de propósito continua vazia (a pessoa tirou tudo)', () => {
    expect(sanitizarPreferencia('[]', tudoPermitido)).toEqual([]);
  });

  it('id de indicador de relatório: monta e lê de volta', () => {
    expect(idDeRelatorio('estacoes', 2)).toBe('rel:estacoes:2');
    expect(lerIdRelatorio('rel:estacoes:2')).toEqual({ slug: 'estacoes', indice: 2 });
    expect(lerIdRelatorio('status')).toBeNull();
    expect(lerIdRelatorio('rel:estacoes:x')).toBeNull();
  });
});

describe('blocos do início: ordem e exibição', () => {
  it('subir e descer; nas pontas não muda nada', () => {
    expect(mover(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b']);
    expect(mover(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c']);
    expect(mover(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(mover(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
  });

  it('indicadores vizinhos ficam numa faixa só; cartões vizinhos, numa grade', () => {
    expect(tipoDoBloco('kpi-usuarios')).toBe('kpi');
    expect(tipoDoBloco(idDeRelatorio('estacoes', 0))).toBe('kpi');
    expect(tipoDoBloco('status')).toBe('cartao');
    const grupos = agruparParaExibir(['aviso', 'kpi-usuarios', 'rel:estacoes:0', 'status', 'parados', 'kpi-horas']);
    expect(grupos).toEqual([
      { tipo: 'aviso', ids: ['aviso'] },
      { tipo: 'kpi', ids: ['kpi-usuarios', 'rel:estacoes:0'] },
      { tipo: 'cartao', ids: ['status', 'parados'] },
      { tipo: 'kpi', ids: ['kpi-horas'] },
    ]);
  });
});
