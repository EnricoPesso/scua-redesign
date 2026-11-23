// A confirmar com a Scua (pergunta em perguntas-para-scua.md): a lista do que NÃO é registrado é uma premissa do protótipo.

/** Um item das listas de transparência: título curto e uma explicação de uma frase. */
export interface ItemDeConteudo {
  titulo: string;
  explicacao: string;
}

/** O que o Scua registra sobre a pessoa. Edite aqui para mudar o texto da tela. */
export const O_QUE_REGISTRA: ItemDeConteudo[] = [
  { titulo: 'Entrada e saída da estação', explicacao: 'O horário em que você entra (logon) e sai (logoff) do computador.' },
  { titulo: 'Bloqueios fora da jornada', explicacao: 'Quando a estação foi bloqueada por estar fora do seu horário combinado.' },
  { titulo: 'Pedidos de extensão', explicacao: 'Os pedidos para trabalhar além da jornada e quem aprovou ou recusou cada um.' },
  { titulo: 'Pausas', explicacao: 'As pausas que você fez durante o dia.' },
  { titulo: 'Estação usada', explicacao: 'Em qual computador você entrou.' },
];

/** O que o Scua não registra. Edite aqui para mudar o texto da tela. */
export const O_QUE_NAO_REGISTRA: ItemDeConteudo[] = [
  { titulo: 'Imagem da tela', explicacao: 'O Scua não tira foto nem grava o que aparece na sua tela.' },
  { titulo: 'O que você digita', explicacao: 'Nenhuma tecla digitada é guardada.' },
  { titulo: 'Sites e aplicativos abertos', explicacao: 'Não sabemos o que você abriu nem por quanto tempo.' },
  { titulo: 'Webcam e microfone', explicacao: 'A câmera e o som do computador não são usados.' },
  { titulo: 'Localização', explicacao: 'O Scua não sabe onde você está.' },
  { titulo: 'Arquivos e mensagens', explicacao: 'O conteúdo dos seus arquivos, e-mails e conversas fica só com você.' },
];

/** Quem pode ver os dados da pessoa. O gestor é preenchido na tela com o nome real. */
export const QUEM_VE = {
  rh: { titulo: 'O RH', explicacao: 'Acompanha a jornada de todos para cuidar das regras da empresa.' },
  administracao: { titulo: 'A administração do sistema', explicacao: 'Cuida do funcionamento do Scua e pode consultar os registros.' },
  prazo: 'Pelo prazo definido pela sua empresa',
} as const;

/** Direitos da pessoa sobre os próprios dados (LGPD). */
export const DIREITOS: ItemDeConteudo[] = [
  { titulo: 'Acessar', explicacao: 'Você pode ver os dados que o Scua guarda sobre você. Esta página mostra a sua jornada dos últimos 14 dias; para o histórico completo, peça ao encarregado de dados.' },
  { titulo: 'Corrigir', explicacao: 'Se algum registro estiver errado, você pode pedir a correção.' },
  { titulo: 'Pedir explicação', explicacao: 'Você pode perguntar para que cada dado é usado e por quanto tempo fica guardado.' },
];

export const CONTATO_DIREITOS = 'Fale com o encarregado de dados da sua empresa.';
