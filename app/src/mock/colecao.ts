import { rede } from './rede';

export interface ComId { id: string }

/** Erro de regra de negócio com texto já pronto para a tela (ex.: "Já existe um grupo com esse nome."). */
export class ErroDeValidacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeValidacao';
  }
}

export interface Colecao<T extends ComId> {
  listar: () => Promise<T[]>;
  obter: (id: string) => Promise<T | null>;
  criar: (dados: Omit<T, 'id'>) => Promise<T>;
  editar: (id: string, dados: Omit<T, 'id'>) => Promise<T>;
  excluir: (id: string) => Promise<void>;
  /** Volta aos dados de exemplo (usado nos testes). */
  resetar: () => void;
}

/**
 * Coleção em memória com as operações de um cadastro simples.
 * `semente` é uma função: os dados de exemplo são criados no primeiro uso (e a cada `resetar`),
 * então datas relativas a hoje (`dia(-3)`) respeitam o relógio fixo dos testes.
 * `validar` devolve o texto do problema (ou nada) antes de criar/editar.
 */
export function criarColecao<T extends ComId>(prefixo: string, semente: () => T[], validar?: (dados: Omit<T, 'id'>, itens: T[], id?: string) => string | undefined): Colecao<T> {
  let guardados: T[] | null = null;
  let seq = 0;
  const carregar = (): T[] => {
    if (guardados === null) {
      guardados = structuredClone(semente());
      seq = guardados.length;
    }
    return guardados;
  };
  const conferir = (dados: Omit<T, 'id'>, id?: string) => {
    const problema = validar?.(dados, carregar(), id);
    if (problema) throw new ErroDeValidacao(problema);
  };
  return {
    listar: () => rede(() => carregar()),
    obter: (id) => rede(() => carregar().find((i) => i.id === id) ?? null),
    criar: (dados) => rede(() => {
      conferir(dados);
      const itens = carregar();
      seq += 1;
      const novo = { ...dados, id: `${prefixo}-${seq}` } as T;
      guardados = [...itens, novo];
      return novo;
    }),
    editar: (id, dados) => rede(() => {
      conferir(dados, id);
      const novo = { ...dados, id } as T;
      guardados = carregar().map((i) => (i.id === id ? novo : i));
      return novo;
    }),
    excluir: (id) => rede(() => {
      guardados = carregar().filter((i) => i.id !== id);
    }),
    resetar: () => {
      guardados = null;
    },
  };
}
