import { describe, expect, it } from 'vitest';
import type { ConfigRelatorio } from '@/modelos/relatorio';
import config from './relatorios/tempo-de-bloqueio';
import { MAX_LINHAS_PARA_IA, alvoDoRelatorio } from './assistente';

// Período largo o bastante para pegar todas as linhas dos dados de exemplo.
const TUDO = { inicio: '2000-01-01', fim: '2100-12-31', colaboradores: [], gestores: [] };
const linhasReais = () => config.buscar(TUDO, new AbortController().signal);

describe('alvoDoRelatorio', () => {
  it('descreve o relatório com as linhas reais do mock', async () => {
    const rows = await linhasReais();
    expect(rows.length).toBeGreaterThan(0);
    const alvo = alvoDoRelatorio(config, TUDO, rows);
    expect(alvo.tipo).toBe('relatorio');
    expect(alvo.titulo).toBe('Tempo de bloqueio');
    expect(alvo.indicadores).toHaveLength(config.kpis.length);
    expect(alvo.indicadores[0].rotulo).toBe('Bloqueios liberados');
    expect(alvo.indicadores[0].valor).toBe(String(rows.length).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    expect(alvo.colunas).toEqual(config.colunas.map((c) => c.header));
    expect(alvo.linhas).toHaveLength(Math.min(rows.length, MAX_LINHAS_PARA_IA));
    expect(alvo.totalDeLinhas).toBe(rows.length);
    for (const linha of alvo.linhas) {
      expect(linha).toHaveLength(config.colunas.length);
      for (const celula of linha) {
        expect(celula).not.toContain('[object Object]');
        expect(celula).not.toContain('undefined');
      }
    }
  });

  it('manda no máximo 60 linhas e informa o total', () => {
    const falsas = Array.from({ length: 200 }, (_, i) => ({ n: i }));
    const cfg: ConfigRelatorio<{ n: number }> = {
      titulo: 'Falso', grupo: 'G', arquivo: 'f', filtros: [], kpis: [], vazio: '',
      colunas: [{ key: 'n', header: 'Número' }],
      buscar: async () => falsas,
    };
    const alvo = alvoDoRelatorio(cfg, {}, falsas);
    expect(MAX_LINHAS_PARA_IA).toBe(60);
    expect(alvo.linhas).toHaveLength(60);
    expect(alvo.totalDeLinhas).toBe(200);
    expect(alvo.linhas[59]).toEqual(['59']);
  });

  it('escreve os filtros em texto legível: período "de … a …" e nomes no lugar de ids', () => {
    const colaborador = config.filtros.find((f) => f.tipo === 'multi' && f.chave === 'colaboradores');
    if (colaborador?.tipo !== 'multi') throw new Error('filtro de colaboradores não encontrado');
    const { value, label } = colaborador.opcoes[0];
    const alvo = alvoDoRelatorio(config, { inicio: '2026-10-01', fim: '2026-10-31', colaboradores: [value], gestores: [] }, []);
    expect(alvo.filtros['Período']).toBe('de 01/10/2026 a 31/10/2026');
    expect(alvo.filtros['Colaboradores']).toBe(label);
    expect(alvo.filtros['Gestores']).toBeUndefined();
  });

  it('formata indicadores com decimais e unidade', () => {
    const cfg: ConfigRelatorio<{ n: number }> = {
      titulo: 'K', grupo: 'G', arquivo: 'k', filtros: [], vazio: '',
      kpis: [{ rotulo: 'Média', valor: () => 1234.5, decimais: 1, unidade: 'min' }],
      colunas: [{ key: 'n', header: 'N' }],
      buscar: async () => [],
    };
    expect(alvoDoRelatorio(cfg, {}, []).indicadores).toEqual([{ rotulo: 'Média', valor: '1.234,5 min' }]);
  });
});
