import { conteudoDaPlanilha, nomeDaPlanilha, type ColunaPlanilha } from "@/lib/planilha"

/** Baixa um arquivo no navegador. */
export function baixarArquivo(dados: BlobPart, nome: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([dados], { type: tipo }))
  // Safari e Firefox só baixam com o link no DOM e a URL ainda válida durante o clique.
  const a = document.createElement("a")
  a.href = url
  a.download = nome
  a.hidden = true
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Gera e baixa a planilha. Devolve o nome do arquivo baixado (para o aviso). */
export function exportarPlanilha<T>({ arquivo, colunas, linhas }: { arquivo: string; colunas: ColunaPlanilha<T>[]; linhas: T[] }): string {
  const nome = nomeDaPlanilha(arquivo)
  const { dados, tipo } = conteudoDaPlanilha(colunas, linhas)
  baixarArquivo(dados as BlobPart, nome, tipo)
  return nome
}
