// Confere contraste WCAG AA dos pares de tokens. Uso: node design-system/scripts/contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [texto, fundo, mínimo]: 4.5 texto normal, 3 texto grande/ícone/borda de controle
const pairs = [
  ["scua-gray-900", "scua-gray-50", 4.5],
  ["scua-gray-900", "scua-gray-0", 4.5],
  ["scua-gray-600", "scua-gray-0", 4.5],
  ["scua-gray-600", "scua-gray-50", 4.5],
  ["scua-gray-900", "scua-orange-500", 4.5],
  ["scua-gray-900", "scua-orange-400", 4.5],
  ["scua-orange-600", "scua-gray-0", 4.5],
  ["scua-orange-600", "scua-orange-100", 4.5],
  ["scua-orange-600", "scua-gray-50", 4.5],
  ["scua-gray-0", "scua-red-600", 4.5],
  ["scua-gray-0", "scua-red-700", 4.5],
  ["scua-green-700", "scua-green-100", 4.5],
  ["scua-red-700", "scua-red-100", 4.5],
  ["scua-yellow-800", "scua-yellow-100", 4.5],
  ["scua-blue-700", "scua-blue-100", 4.5],
  ["scua-gray-400", "scua-gray-0", 3],
  ["scua-gray-900", "scua-gray-0", 3], // anel de foco
  ["scua-orange-500", "scua-gray-0", 3], // ícone/borda laranja
];

let fail = 0;
for (const [fg, bg, min] of pairs) {
  const r = ratio(vars[fg], vars[bg]);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "OK  " : "FALHA"} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} sobre ${bg}`);
}
process.exit(fail ? 1 : 0);
