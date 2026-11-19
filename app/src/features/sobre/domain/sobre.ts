export interface InfoSistema {
  licencasUsadas: number;
  licencasContratadas: number;
  versaoApp: string;
  versaoBanco: string;
  /** YYYY-MM-DD */
  atualizadoEm: string;
}

export const SITE_SUPORTE = 'https://scua.com.br/';
/** Acima disso o aviso de licenças aparece. */
export const LIMITE_AVISO = 0.9;

/** Percentual de uso (0 a 100), sem passar de 100. */
export function percentualDeUso(usadas: number, contratadas: number): number {
  if (contratadas <= 0) return usadas > 0 ? 100 : 0;
  return Math.min(100, (usadas / contratadas) * 100);
}

export const passouDoLimite = (usadas: number, contratadas: number): boolean => contratadas > 0 && usadas / contratadas > LIMITE_AVISO;

export function textoDeLicencas(usadas: number, contratadas: number): string {
  return `${usadas} de ${contratadas} ${contratadas === 1 ? 'licença' : 'licenças'} em uso`;
}

/** "2026-10-03" → "03/10/2026". */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Resumo em texto para colar num chamado de suporte. */
export function resumoParaSuporte(info: InfoSistema): string {
  return [
    'Scua Logon',
    `Versão do aplicativo: ${info.versaoApp}`,
    `Versão do banco de dados: ${info.versaoBanco}`,
    `Última atualização: ${formatarData(info.atualizadoEm)}`,
    `Licenças: ${textoDeLicencas(info.licencasUsadas, info.licencasContratadas)}`,
    `Suporte: ${SITE_SUPORTE}`,
  ].join('\n');
}
