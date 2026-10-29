# Design system Scua Logon

Tokens e componentes React do Scua Logon, mais a página de documentação que mostra cada componente, seus estados e o código de uso. Base: React 19, Tailwind 4, base-ui.

## Comandos

Exigem Node 22.18 ou mais novo.

```
npm run dev       # documentação em modo de desenvolvimento
npm run build     # typecheck + build de produção
npm run lint      # oxlint
npm run contrast  # confere os pares de cor contra WCAG AA
npm test          # testes das funções puras em src/lib
```

## Regras de uso dos tokens

1. Botão primário usa fundo laranja com texto escuro (`--color-on-brand`), nunca branco. Texto laranja sobre o fundo da página usa `--color-brand-text`; ícone ou borda laranja só sobre `--color-surface`.
2. Componente consome só tokens semânticos (`--color-*`), nunca `--scua-*`.
3. Sem modo escuro: não use `dark:`.
4. Alvo clicável mínimo de 40px, em altura e largura.
5. Animação respeita `prefers-reduced-motion`: use `--dur` e `--dur-fast`, que zeram nesse modo.

## Documentação

Rode `npm run dev` e abra a página inicial. Ela traz tokens, componentes, estados e o trecho de código para copiar.

## Modelo único de relatório

Todo relatório usa `<ModeloRelatorio>` (`src/modelos/relatorio/`): cabeçalho com Exportar CSV, faixa de filtros, KPIs e tabela. O relatório só declara a configuração; layout, carregando, vazio, erro, validação do período e exportação vêm prontos.

```tsx
import { ModeloRelatorio, type ConfigRelatorio } from "@/modelos/relatorio"

const config: ConfigRelatorio<Linha> = {
  titulo: "Tentativas de acesso fora da jornada",
  grupo: "Bloqueios e liberações",          // trilha: Relatórios / grupo
  arquivo: "tentativas-fora-da-jornada",    // nome base do CSV
  filtros: [
    { tipo: "multi", chave: "gestores", rotulo: "Gestores", opcoes },
    { tipo: "select", chave: "evento", rotulo: "Tipo de evento", opcoes },
    { tipo: "texto", chave: "estacao", rotulo: "Estação" },
    { tipo: "periodo", dias: 7 },            // grava em "inicio" e "fim"
  ],
  kpis: [{ rotulo: "Tentativas", valor: (rows) => rows.length }],
  colunas: [{ key: "colaborador", header: "Colaborador" }],  // texto: (row) => string define a saída no CSV
  buscar: (filtros, signal) => api.get("/report/...", { params: filtros, signal }),
}

<ModeloRelatorio config={config} />
```

Regras:
- `config` fica fora do componente (constante de módulo). Se for recriado a cada render, a busca roda em loop.
- A busca só roda ao clicar em Filtrar, e cada busca nova cancela a anterior (`signal`).
- O CSV usa `;` e BOM (Excel pt-BR) e neutraliza texto que começa com `=`, `+`, `-` ou `@`.

Exemplos rodando: `npm run dev` e abra `/prototipos.html` (`?r=tentativas|liberacoes`, `&estado=carregando|vazio|erro`).
