import { hoje } from '../../mock/datas';
import { PESSOAS_DIRETORIO, pessoaPorId } from '../../mock/diretorio';
import { grupoCompletoDaPessoa } from '../../mock/grupos';
import { CUSTO_HORA, diasDaPessoa } from '../../mock/jornadaReal';
import { rede } from '../../mock/rede';
import { compararPrevisoes, preverPessoa, type PrevisaoPessoa } from './domain/previsao';

/** Ainda não existe contrato de API: a previsão é calculada em memória sobre a jornada de exemplo. Quando a API existir, só este arquivo muda. */

export interface LinhaPrevisao extends PrevisaoPessoa {
  nome: string;
  diretoria: string;
  gestorId: string | null;
  gestorNome: string | null;
  grupoNome: string | null;
}

/** Dias passados lidos: cobre os 15 dias úteis do histórico e o mês corrente inteiro. */
const DIAS_LIDOS = -40;

export const previsaoApi = {
  /**
   * Previsão das pessoas que quem está logado pode ver (`null` = todas), da mais arriscada para a menos arriscada.
   * O filtro fica aqui, e não na tela, para o custo-hora de quem a pessoa não pode ver nem sair da API.
   */
  listar: (visiveis: Set<string> | null = null): Promise<LinhaPrevisao[]> => rede(() => {
    const agora = hoje();
    return PESSOAS_DIRETORIO.filter((p) => visiveis === null || visiveis.has(p.id)).map((p) => {
      const grupo = grupoCompletoDaPessoa(p.id);
      const previsao = preverPessoa({
        pessoaId: p.id,
        dias: diasDaPessoa(p.id, DIAS_LIDOS, -1),
        hoje: agora,
        limiteHoras: grupo?.limiteHoras ?? '',
        grupoNome: grupo?.nome,
        custoHora: CUSTO_HORA[p.id] ?? 30,
      });
      return { ...previsao, nome: p.nome, diretoria: p.diretoria, gestorId: p.gestorId, gestorNome: pessoaPorId(p.gestorId)?.nome ?? null, grupoNome: grupo?.nome ?? null };
    }).sort(compararPrevisoes);
  }),
};
