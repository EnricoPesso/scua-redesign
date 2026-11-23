import { rede } from '../../mock/rede';
import { CUSTO_HORA, diasDeTodos, type DiaDeJornada } from '../../mock/jornadaReal';
import type { Periodo } from './domain/radar';

/** Ainda não existe contrato de API: a jornada registrada pelo agente do Scua Logon vem de exemplo. Quando a API existir, só este arquivo muda. */
export interface DadosDoRadar {
  dias: DiaDeJornada[];
  custoHora: Record<string, number>;
}

export const radarApi = {
  /**
   * Dias fechados (até ontem) e custo-hora das pessoas que quem está logado pode ver (`null` = todas).
   * O filtro fica aqui, e não na tela, para o custo-hora de quem a pessoa não pode ver nem sair da API.
   */
  carregar(periodo: Periodo, visiveis: Set<string> | null = null): Promise<DadosDoRadar> {
    return rede(() => {
      const pode = (id: string) => visiveis === null || visiveis.has(id);
      return {
        dias: diasDeTodos(-periodo, -1).filter((d) => pode(d.pessoaId)),
        custoHora: Object.fromEntries(Object.entries(CUSTO_HORA).filter(([id]) => pode(id))),
      };
    });
  },
};
