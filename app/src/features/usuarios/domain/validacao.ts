import type { DadosUsuario, Excecao, Ferias, NovaExcecao, NovasFerias, Substituto } from './tipos';
import { dataCurta } from './formatacao';

export type Erros<C extends string> = Partial<Record<C, string>>;
export const semErros = (e: object): boolean => Object.values(e).every((v) => !v);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Telefone com DDD, com ou sem +55, aceitando espaços, parênteses e hífen: 10 a 13 dígitos. */
export function whatsappValido(texto: string): boolean {
  if (!/^\+?[\d\s().-]+$/.test(texto)) return false;
  const digitos = texto.replace(/\D/g, '');
  return digitos.length >= 10 && digitos.length <= 13;
}

export type CampoDados = 'email' | 'whatsapp' | 'gestorId' | 'departamento' | 'jornadaId';

/** E-mail obrigatório e em formato simples; WhatsApp é opcional, mas se vier precisa ser um telefone válido. */
export function validarDados(d: DadosUsuario): Erros<CampoDados> {
  const erros: Erros<CampoDados> = {};
  const email = d.email.trim();
  if (!email) erros.email = 'Informe o e-mail';
  else if (!EMAIL.test(email)) erros.email = 'Informe um e-mail válido, como nome@empresa.com.br';
  const whatsapp = d.whatsapp.trim();
  if (whatsapp && !whatsappValido(whatsapp)) erros.whatsapp = 'Informe o WhatsApp com DDD, como (11) 91234-5678';
  if (!d.departamento) erros.departamento = 'Escolha o departamento';
  if (!d.jornadaId) erros.jornadaId = 'Escolha a jornada';
  return erros;
}

/** Dois períodos fechados (datas YYYY-MM-DD) se sobrepõem se um começa antes de o outro terminar. */
export function periodosSeSobrepoem(a: { inicio: string; fim: string }, b: { inicio: string; fim: string }): boolean {
  return a.inicio <= b.fim && b.inicio <= a.fim;
}

export type CampoFerias = 'inicio' | 'fim';

/** Início e fim obrigatórios, fim depois ou no mesmo dia do início, e sem sobrepor outro período da mesma pessoa. */
export function validarFerias(novas: NovasFerias, existentes: Ferias[], anoReferencia: string): Erros<CampoFerias> {
  const erros: Erros<CampoFerias> = {};
  if (!novas.inicio) erros.inicio = 'Informe o início';
  if (!novas.fim) erros.fim = 'Informe o fim';
  if (erros.inicio || erros.fim) return erros;
  if (novas.fim < novas.inicio) {
    erros.fim = 'O fim não pode ser antes do início';
    return erros;
  }
  const choque = existentes.find((f) => periodosSeSobrepoem(novas, f));
  if (choque) erros.inicio = `Este período se sobrepõe às férias de ${dataCurta(choque.inicio, anoReferencia)} a ${dataCurta(choque.fim, anoReferencia)}`;
  return erros;
}

export type CampoExcecao = 'data' | 'entrada' | 'saida' | 'motivo';

/** `hoje` em YYYY-MM-DD. A data não pode ser passada; a saída precisa ser depois da entrada; motivo obrigatório. */
export function validarExcecao(nova: NovaExcecao, existentes: Excecao[], hoje: string): Erros<CampoExcecao> {
  const erros: Erros<CampoExcecao> = {};
  if (!nova.data) erros.data = 'Informe a data';
  else if (nova.data < hoje) erros.data = 'A data não pode ser anterior a hoje';
  else if (existentes.some((e) => e.data === nova.data)) erros.data = 'Já existe uma exceção nesta data';
  if (!nova.entrada) erros.entrada = 'Informe a entrada';
  if (!nova.saida) erros.saida = 'Informe a saída';
  if (nova.entrada && nova.saida && nova.saida <= nova.entrada) erros.saida = 'A saída precisa ser depois da entrada';
  if (!nova.motivo.trim()) erros.motivo = 'Informe o motivo';
  return erros;
}

export type CampoSubstituto = 'pessoaId' | 'de' | 'ate';

/** A pessoa não pode ser substituta de si mesma, e o período não pode terminar antes de começar. */
export function validarSubstituto(s: Substituto, idDaPessoa: string): Erros<CampoSubstituto> {
  const erros: Erros<CampoSubstituto> = {};
  if (!s.pessoaId) erros.pessoaId = 'Escolha quem aprova no lugar';
  else if (s.pessoaId === idDaPessoa) erros.pessoaId = 'A pessoa não pode ser a própria substituta';
  if (!s.de) erros.de = 'Informe o início';
  if (!s.ate) erros.ate = 'Informe o fim';
  if (s.de && s.ate && s.ate < s.de) erros.ate = 'O fim não pode ser antes do início';
  return erros;
}
