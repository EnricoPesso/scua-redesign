import { dia } from '../../mock/datas';
import { rede } from '../../mock/rede';
import type { InfoSistema } from './domain/sobre';

/** Ainda não existe contrato de API: dados em memória. Quando a API existir, só este arquivo muda. */
export const sobreApi = {
  obter(): Promise<InfoSistema> {
    return rede(() => ({
      licencasUsadas: 4,
      licencasContratadas: 50,
      versaoApp: '2.0.10.80',
      versaoBanco: '3.02.16.114',
      atualizadoEm: dia(-9),
    }));
  },
};
