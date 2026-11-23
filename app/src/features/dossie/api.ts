import { dia } from '../../mock/datas';
import { pessoaPorId } from '../../mock/diretorio';
import { diasDaPessoa } from '../../mock/jornadaReal';
import { rede } from '../../mock/rede';
import { codigoDeIntegridade, montarConteudo, type Dossie, type Periodo } from './domain/dossie';

/** Ainda não existe contrato de API: o dossiê é montado em memória a partir dos registros de exemplo. Quando a API existir, só este arquivo muda. */
export const dossieApi = {
  /** Dossiê dos últimos `periodo` dias fechados (até ontem). */
  async gerar(pessoaId: string, periodo: Periodo): Promise<Dossie> {
    const conteudo = await rede(() => {
      const pessoa = pessoaPorId(pessoaId);
      if (!pessoa) throw new Error('Pessoa não encontrada');
      // Um dia a mais antes do período, só para conferir o descanso entre jornadas.
      return montarConteudo(pessoa, diasDaPessoa(pessoaId, -periodo - 1, -1), dia(-periodo), dia(-1));
    });
    return { ...conteudo, geradoEm: new Date().toISOString(), codigo: await codigoDeIntegridade(conteudo) };
  },
};
