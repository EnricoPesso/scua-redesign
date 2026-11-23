import { diasDaPessoa, type DiaDeJornada } from '../../mock/jornadaReal';
import { gestorDe, pessoaPorId } from '../../mock/diretorio';
import { grupoCompletoDaPessoa } from '../../mock/grupos';
import { rede } from '../../mock/rede';

export interface MeusDados {
  nome: string;
  estacao: string;
  /** Nome do gestor, ou null no topo da hierarquia. */
  gestor: string | null;
  grupo: string | null;
  /** '' ou null = sem limite. */
  limiteHoras: number | '' | null;
  /** Dias fechados, até ontem, do mais antigo ao mais recente. */
  dias: DiaDeJornada[];
}

/** Ainda não existe contrato de API: dados em memória. Quando a API existir, só este arquivo muda. */
export const meusDadosApi = {
  obter(pessoaId: string): Promise<MeusDados> {
    return rede(() => {
      const pessoa = pessoaPorId(pessoaId);
      if (!pessoa) throw new Error('Pessoa não encontrada');
      const grupo = grupoCompletoDaPessoa(pessoaId);
      return {
        nome: pessoa.nome,
        estacao: pessoa.estacao,
        gestor: gestorDe(pessoa)?.nome ?? null,
        grupo: grupo?.nome ?? null,
        limiteHoras: grupo?.limiteHoras ?? null,
        dias: diasDaPessoa(pessoaId, -45, -1),
      };
    });
  },
};
