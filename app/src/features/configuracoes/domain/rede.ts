/** Regras de formato de endereços de rede. Devolvem o texto do problema, ou nada quando está certo. */

export function validarIpv4(texto: string): string | undefined {
  const t = texto.trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) return 'Use quatro números separados por ponto, como 10.20.0.0';
  const partes = t.split('.');
  // "010" seria lido como octal por algumas ferramentas: não aceita zero à esquerda.
  if (partes.some((p) => p.length > 1 && p.startsWith('0'))) return 'Não use zero à esquerda nos números do endereço';
  if (partes.some((p) => Number(p) > 255)) return 'Cada número do endereço vai de 0 a 255';
  return undefined;
}

const ROTULO_DOMINIO = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

export function validarDominio(texto: string): string | undefined {
  const t = texto.trim();
  const partes = t.split('.');
  if (partes.length < 2) return 'Informe o domínio completo, como scua.local';
  if (partes.some((p) => !ROTULO_DOMINIO.test(p))) return 'Use só letras, números e hífen, separados por ponto (sem espaços)';
  return undefined;
}
