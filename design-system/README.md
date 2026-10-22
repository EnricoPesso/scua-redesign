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
