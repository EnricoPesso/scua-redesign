import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configDominios } from '../features/configuracoes/cadastros/dominios';
import { configFeriados } from '../features/configuracoes/cadastros/feriados';
import { configGrupos } from '../features/configuracoes/cadastros/grupos';
import { configJustificativas } from '../features/configuracoes/cadastros/justificativas';
import { configLocalidadesPorIp } from '../features/configuracoes/cadastros/localidades-por-ip';
import { configMensagens } from '../features/configuracoes/cadastros/mensagens';
import { configMensagensPorTempo } from '../features/configuracoes/cadastros/mensagens-por-tempo';
import { configNotificacoes } from '../features/configuracoes/cadastros/notificacoes';
import { configNotificacoesDeRecorrencia } from '../features/configuracoes/cadastros/notificacoes-de-recorrencia';
import { configParametros } from '../features/configuracoes/cadastros/parametros';
import { configTemplatesWhatsapp } from '../features/configuracoes/cadastros/templates-whatsapp';
import { configTiposDeJornada } from '../features/configuracoes/cadastros/tipos-de-jornada';
import { configLiberacoes } from '../features/liberacoes/config';
import { configPausas } from '../features/pausas/config';
import { capturarDownloads } from '../test/downloads';
import { renderApp } from '../test/render';
import { colunasDaPlanilha } from './cadastro/planilha';
import type { ConfigCadastro } from './cadastro/tipos';
import type { ComId } from '../mock/colecao';

const CADASTROS = [
  configPausas, configLiberacoes, configDominios, configFeriados, configGrupos, configJustificativas, configLocalidadesPorIp,
  configMensagens, configMensagensPorTempo, configNotificacoes, configNotificacoesDeRecorrencia, configParametros,
  configTemplatesWhatsapp, configTiposDeJornada,
] as unknown as ConfigCadastro<ComId>[];

describe('planilha dos cadastros', () => {
  it.each(CADASTROS.map((c) => [c.titulo, c] as const))('%s: toda coluna sai como texto legível, sem a coluna de ações', async (_, config) => {
    const itens = await config.colecao.listar();
    expect(itens.length).toBeGreaterThan(0);
    const colunas = colunasDaPlanilha(config.colunas);
    expect(colunas.map((c) => c.header)).toEqual(config.colunas.map((c) => c.header));
    for (const item of itens) {
      for (const c of colunas) {
        const texto = c.texto(item);
        expect(typeof texto, `${config.titulo} › ${c.header}`).toBe('string');
        expect(texto, `${config.titulo} › ${c.header}`).not.toMatch(/\[object |undefined|^true$|^false$|^null$/);
      }
    }
  });
});

describe('botão Exportar para Excel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    configParametros.colecao.resetar();
  });

  it('num cadastro, inclusive de lista fixa: baixa as linhas visíveis e avisa', async () => {
    const downloads = capturarDownloads();
    const { user } = renderApp('/configuracoes/parametros');
    const botao = await screen.findByRole('button', { name: 'Exportar para Excel' }, { timeout: 20_000 });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    expect(downloads.arquivos).toEqual([expect.stringMatching(/^parametros\.(csv|xlsx)$/)]);
    const linhas = await downloads.linhas();
    expect(linhas[0]).toBe('Parâmetro;Valor;O que faz');
    expect(linhas).toHaveLength(16);
    expect(await screen.findByText(/15 registros exportados em parametros\./)).toBeInTheDocument();
  });

  it('a busca vale para a planilha: exporta só o que está na lista', async () => {
    const downloads = capturarDownloads();
    const { user } = renderApp('/configuracoes/parametros');
    const busca = await screen.findByRole('searchbox', { name: 'Buscar' }, { timeout: 20_000 });
    await user.type(busca, 'tolerância');
    await user.click(screen.getByRole('button', { name: 'Exportar para Excel' }));
    const linhas = await downloads.linhas();
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas.slice(1)) expect(l.toLowerCase()).toContain('toler');
  });

  it('Usuários exporta todos os filtrados, não só a página', async () => {
    const downloads = capturarDownloads();
    const { user } = renderApp('/usuarios?situacao=todos');
    const botao = await screen.findByRole('button', { name: 'Exportar para Excel' }, { timeout: 20_000 });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    expect(downloads.arquivos).toEqual([expect.stringMatching(/^usuarios\.(csv|xlsx)$/)]);
    const linhas = await downloads.linhas();
    expect(linhas[0]).toBe('Nome;Login;Matrícula;Gestor;Departamento;Jornada;Situação');
    expect(linhas).toHaveLength(25);
  });

  it('Jornadas exporta a lista com horário, carga e situação em texto', async () => {
    const downloads = capturarDownloads();
    const { user } = renderApp('/jornadas');
    const botao = await screen.findByRole('button', { name: 'Exportar para Excel' }, { timeout: 20_000 });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    const linhas = await downloads.linhas();
    expect(linhas[0]).toBe('Identificador;Descrição;Horário;Carga semanal;Situação');
    expect(linhas.find((l) => l.startsWith('ADM-8H'))).toBe('ADM-8H;Administrativa, 8 horas por dia;Seg a sex, 08:00–17:00;40h;Ativa, Padrão');
  });

  it('Ausências exporta as ausências do período (vale na linha do tempo e na tabela)', async () => {
    const downloads = capturarDownloads();
    const { user } = renderApp('/ausencias');
    const botao = await screen.findByRole('button', { name: 'Exportar para Excel' }, { timeout: 20_000 });
    await waitFor(() => expect(botao).toBeEnabled());
    await user.click(botao);
    expect(downloads.arquivos[0]).toMatch(/^ausencias_2026-10-06_a_2026-10-12\.(csv|xlsx)$/);
    const linhas = await downloads.linhas();
    expect(linhas[0]).toBe('Pessoa;Dia;Início;Fim;Duração;Motivo');
    expect(linhas.length).toBeGreaterThan(10);
  });
});
