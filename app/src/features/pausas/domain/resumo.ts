/** Resumo legível de um perfil: "2 pausas de 15 min" (singular quando há uma só). */
export function resumoDasPausas(quantidade: number, minutos: number): string {
  return `${quantidade} ${quantidade === 1 ? 'pausa' : 'pausas'} de ${minutos} min`;
}

/** Já existe outro perfil com o mesmo nome (sem diferenciar maiúsculas, acentos e espaços nas pontas). */
export function nomeJaExiste(nome: string, existentes: { id: string; nome: string }[], idAtual?: string): boolean {
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const alvo = norm(nome);
  return existentes.some((e) => e.id !== idAtual && norm(e.nome) === alvo);
}
