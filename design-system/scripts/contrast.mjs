// Confere contraste WCAG AA dos pares de tokens. Uso: node design-system/scripts/contrast.mjs
// Resolve var(--x) até chegar no hex, então tokens semânticos (--color-*) também entram nos pares.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
const raw = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const resolve = (name, depth = 0) => {
  const v = raw[name];
  if (v === undefined || depth > 8) throw new Error(`token --${name} não resolve`);
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolve(ref[1], depth + 1);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`token --${name} não é cor hex: ${v}`);
  return v;
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
  // semânticos que os componentes consomem
  ["color-text", "color-bg", 4.5],
  ["color-text", "color-surface", 4.5],
  ["color-text-muted", "color-surface", 4.5],
  ["color-text-muted", "color-bg", 4.5],
  ["color-on-accent", "color-accent", 4.5], // botão primário
  ["color-accent-text", "color-surface", 4.5],
  ["color-accent-text", "color-bg", 4.5],
  ["color-accent-text", "color-surface-muted", 4.5],
  ["color-border-strong", "color-surface", 3], // borda de campo
  ["color-focus", "color-surface", 3],
  ["color-focus", "color-bg", 3],
  ["color-accent", "color-surface", 3], // ícone/borda laranja
  ["color-danger", "color-surface", 3], // borda de campo inválido
  // botões
  ["scua-gray-0", "color-danger", 4.5],
  ["scua-gray-0", "color-danger-hover", 4.5],
  ["color-on-accent", "scua-orange-400", 4.5], // primário no hover
  ["color-text", "scua-orange-100", 4.5], // secundário no hover
  // texto de erro
  ["scua-red-700", "color-surface", 4.5],
  ["scua-red-700", "color-bg", 4.5],
  // links da navegação da documentação
  ["scua-orange-700", "scua-orange-100", 4.5],
  ["scua-orange-700", "scua-orange-200", 4.5],
  // tabela
  ["color-text", "scua-orange-50", 4.5], // cabeçalho
  ["color-text", "scua-gray-50", 4.5], // linha em hover
  // badges
  ["scua-green-700", "scua-green-100", 4.5],
  ["scua-red-700", "scua-red-100", 4.5],
  ["scua-yellow-800", "scua-yellow-100", 4.5],
  ["scua-blue-700", "scua-blue-100", 4.5],
  ["scua-gray-800", "scua-gray-100", 4.5], // badge neutro
  // toast: fundo escuro, texto branco, borda de status
  ["scua-gray-0", "scua-gray-900", 4.5],
  ["scua-green-400", "scua-gray-900", 3],
  ["scua-red-400", "scua-gray-900", 3],
  ["color-accent", "scua-gray-900", 3],
];

let fail = 0;
for (const [fg, bg, min] of pairs) {
  const r = ratio(resolve(fg), resolve(bg));
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "OK   " : "FALHA"} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} sobre ${bg}`);
}
console.log(fail ? `\n${fail} par(es) reprovado(s)` : `\n${pairs.length} pares aprovados`);
process.exit(fail ? 1 : 0);
