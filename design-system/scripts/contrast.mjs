// Confere contraste WCAG AA dos pares de tokens. Uso: node scripts/contrast.mjs
// Resolve var(--x) até chegar no hex, então tokens semânticos (--color-*) também entram nos pares.
import { readFileSync } from "node:fs";

// Lê o bloco :root de tokens.css (Scua) e de index.css (mapeamento shadcn): é o tema claro.
// O tema escuro é o claro com o bloco :root.dark de tokens.css por cima.
// Variável repetida com valor diferente no mesmo bloco falha o script.
// Regra de uso (não é par testado): ícone ou borda laranja só sobre surface; sobre o fundo da página
// use --color-brand-text. color-brand sobre color-bg dá 2,86:1 e reprova de propósito.
const lerBloco = (css, seletor, file) => {
  const block = css.match(new RegExp(String.raw`${seletor}\s*\{([\s\S]*?)\n\}`));
  if (!block) throw new Error(`${file}: bloco ${seletor} não encontrado`);
  const vars = {};
  for (const m of block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = m;
    if (name in vars && vars[name] !== value.trim()) {
      throw new Error(`--${name} definido duas vezes com valores diferentes: ${vars[name]} e ${value.trim()}`);
    }
    vars[name] = value.trim();
  }
  return vars;
};
const css = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const claro = { ...lerBloco(css("../src/styles/tokens.css"), ":root", "tokens.css"), ...lerBloco(css("../src/index.css"), ":root", "index.css") };
const escuro = { ...claro, ...lerBloco(css("../src/styles/tokens.css"), String.raw`:root\.dark`, "tokens.css") };

const resolver = (raw) => {
  const resolve = (name, depth = 0) => {
    const v = raw[name];
    if (v === undefined || depth > 8) throw new Error(`token --${name} não resolve`);
    const ref = v.match(/^var\(--([\w-]+)\)$/);
    if (ref) return resolve(ref[1], depth + 1);
    if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`token --${name} não é cor hex: ${v}`);
    return v;
  };
  return resolve;
};

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [texto, fundo, mínimo]: 4.5 texto normal, 3 texto grande, ícone, borda de controle e anel de foco
const pairs = [
  // semânticos que os componentes consomem (valem nos dois temas)
  ["color-text", "color-bg", 4.5],
  ["color-text", "color-surface", 4.5],
  ["color-text-muted", "color-surface", 4.5],
  ["color-text-muted", "color-bg", 4.5],
  ["color-on-brand", "color-brand", 4.5], // botão primário
  ["color-brand-text", "color-surface", 4.5],
  ["color-brand-text", "color-bg", 4.5],
  ["color-brand-text", "color-surface-muted", 4.5],
  ["color-line-strong", "color-surface", 3], // borda de campo
  ["color-focus", "color-surface", 3],
  ["color-focus", "color-bg", 3],
  ["color-brand", "color-surface", 3], // ícone/borda laranja, só sobre surface
  ["color-line-strong", "color-bg", 3],
  ["color-text-muted", "color-neutral-bg", 4.5],
  ["color-text-muted", "color-surface-muted", 4.5],
  ["color-brand-text", "color-accent-bg", 4.5],
  ["color-text", "color-accent-bg", 4.5], // secundário no hover
  ["color-danger", "color-bg", 3],
  ["color-on-brand", "color-brand-hover", 4.5],
  ["color-text", "color-row-hover", 4.5],
  // mapeamento shadcn (index.css)
  ["primary-foreground", "primary", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["input", "card", 3],
  ["ring", "background", 3],
  ["color-danger", "color-surface", 3], // borda de campo inválido
  // botões
  ["color-on-danger", "color-danger", 4.5],
  ["color-on-danger", "color-danger-hover", 4.5],
  // texto de erro
  ["color-danger-text", "color-bg", 4.5],
  // tabela
  ["color-text", "color-surface-muted", 4.5], // cabeçalho
  // status semânticos (badge)
  ["color-success-text", "color-success-bg", 4.5],
  ["color-warning-text", "color-warning-bg", 4.5],
  ["color-danger-text", "color-danger-bg", 4.5],
  ["color-info-text", "color-info-bg", 4.5],
  ["color-neutral-text", "color-neutral-bg", 4.5],
  ["color-danger-text", "color-surface", 4.5], // erro de select/multi-select
  // toast: fundo escuro, texto claro, borda de status
  ["color-toast-text", "color-toast-bg", 4.5],
  ["color-toast-success", "color-toast-bg", 3],
  ["color-toast-danger", "color-toast-bg", 3],
  ["color-toast-info", "color-toast-bg", 3],
  ["color-toast-brand", "color-toast-bg", 3],
  // tema escuro: o toast precisa se destacar do fundo da página
  ["color-toast-bg", "color-bg", 1.2],
];

// Pares com primitivos fixos: só fazem sentido no tema claro (documentação e badges da página de docs).
const soClaro = [
  ["color-on-brand", "scua-orange-400", 4.5],
  ["scua-red-700", "color-surface", 4.5],
  ["scua-red-700", "color-bg", 4.5],
  ["scua-orange-700", "scua-orange-100", 4.5],
  ["scua-orange-700", "scua-orange-200", 4.5],
  ["color-text", "scua-orange-50", 4.5],
  ["color-text", "scua-gray-50", 4.5],
  ["scua-green-700", "scua-green-100", 4.5],
  ["scua-red-700", "scua-red-100", 4.5],
  ["scua-yellow-800", "scua-yellow-100", 4.5],
  ["scua-blue-700", "scua-blue-100", 4.5],
  ["scua-gray-800", "scua-gray-100", 4.5],
];

let fail = 0;
let total = 0;
for (const [tema, raw, lista] of [["claro", claro, [...pairs, ...soClaro]], ["escuro", escuro, pairs]]) {
  const resolve = resolver(raw);
  console.log(`
Tema ${tema}`);
  for (const [fg, bg, min] of lista) {
    const r = ratio(resolve(fg), resolve(bg));
    const ok = r >= min;
    total++;
    if (!ok) fail++;
    console.log(`${ok ? "OK   " : "FALHA"} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} sobre ${bg}`);
  }
}
console.log(fail ? `
${fail} par(es) reprovado(s)` : `
${total} pares aprovados (temas claro e escuro)`);
process.exit(fail ? 1 : 0);
