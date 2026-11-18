import type { NomeFerramenta } from './contrato';

/** As ações que o robô pode pedir. Os parâmetros são JSON Schema, aceito pelos três provedores. */
export const FERRAMENTAS: Record<NomeFerramenta, { descricao: string; parametros: Record<string, unknown> }> = {
  preencher_formulario: {
    descricao:
      'Preenche campos do formulário aberto na tela. Use só as chaves de campo informadas no contexto. Não salva: a pessoa confere e salva.',
    parametros: {
      type: 'object',
      properties: {
        campos: { type: 'object', description: 'Mapa chave do campo → valor. Horas "HH:MM", datas "AAAA-MM-DD", liga/desliga true ou false.' },
      },
      required: ['campos'],
    },
  },
  navegar: {
    descricao: 'Abre uma tela do sistema. Use só rotas da lista de telas do contexto.',
    parametros: {
      type: 'object',
      properties: { rota: { type: 'string', description: 'Rota da tela, por exemplo /ausencias?de=2026-10-11&ate=2026-10-11' } },
      required: ['rota'],
    },
  },
  abrir_formulario: {
    descricao:
      'Abre o formulário de criação de um cadastro quando a pessoa pede para criar algo e esse formulário ainda não está aberto. Depois que ele abrir, o pedido é repetido para você preencher.',
    parametros: {
      type: 'object',
      properties: { formulario: { type: 'string', description: 'Id do cadastro, da lista de formulários do contexto.' } },
      required: ['formulario'],
    },
  },
};
