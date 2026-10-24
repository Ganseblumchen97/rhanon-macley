/* Utilidades usadas em todo o jogo. */
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// número pseudoaleatório fixo para cada semente (letras de recorte sempre iguais)
function rand(seed) { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
// troca colunas de uma linha de sprite: setCols("..kk", {s: [0, 1]}) -> "sskk"
const setCols = (row, map) => { const a = [...row]; for (const [ch, cols] of Object.entries(map)) cols.forEach(c => a[c] = ch); return a.join(""); };
