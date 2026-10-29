/* Tema da mata no HUD: moldura de vinhas e folhas em pixel art (desenhada aqui e usada pelo CSS como border-image,
   na variável --moldura) e os ícones de estado da batalha. Cada "pixel" da arte vale 3 px de tela, como os sprites. */
const THEME_PX = 3;
const VINE = {stem: "#2a5a2a", stemHi: "#5fae52", leaf: "#3f9a5c", leafD: "#1f5a32", leafHi: "#8fd06a", berry: "#e2363d", berryHi: "#ff9a8a"};

// moldura 16x16 (bordas de 6 pixels): cipó ondulado com folhas para fora e para dentro e um tufo com frutinha em cada canto.
// O miolo de cada borda (colunas 6 a 9) se repete sem emenda, porque o desenho tem período de 4 pixels.
function vineFrame() {
  const N = 16, c = document.createElement("canvas"), g = c.getContext("2d");
  c.width = c.height = N * THEME_PX;
  const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x * THEME_PX, y * THEME_PX, THEME_PX, THEME_PX); };
  const sides = [(x, y) => [x, y], (x, y) => [N - 1 - y, x], (x, y) => [N - 1 - x, N - 1 - y], (x, y) => [y, N - 1 - x]];
  for (const map of sides) {
    const p = (x, y, col) => put(...map(x, y), col);
    for (let x = 0; x < N; x++) {
      const w = x % 4 < 2 ? 0 : 1;
      p(x, 2 + w, VINE.stemHi); p(x, 3 + w, VINE.stem);   // cipó
      if (x % 4 === 1) { p(x, 1, VINE.leaf); p(x + 1, 1, VINE.leafHi); p(x, 0, VINE.leafD); }   // folha para fora
      if (x % 4 === 3) { p(x, 5, VINE.leaf); p(x - 1, 5, VINE.leafD); }                          // folha para dentro
    }
  }
  // cantos: tufo de folhas com uma frutinha vermelha
  for (const [ox, oy, sx, sy] of [[0, 0, 1, 1], [N - 1, 0, -1, 1], [0, N - 1, 1, -1], [N - 1, N - 1, -1, -1]]) {
    const p = (x, y, col) => put(ox + x * sx, oy + y * sy, col);
    [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2], [3, 2], [2, 3]].forEach(([x, y]) => p(x, y, VINE.leaf));
    [[0, 2], [2, 0], [3, 3], [4, 2], [2, 4]].forEach(([x, y]) => p(x, y, VINE.leafD));
    [[1, 1], [3, 1], [1, 3]].forEach(([x, y]) => p(x, y, VINE.leafHi));
    p(2, 2, VINE.berry); p(3, 2, VINE.berry); p(2, 3, VINE.berry); p(2, 2, VINE.berryHi);
  }
  return c.toDataURL();
}

/* ---------- ícones de estado (7x7 pixels de arte) ---------- */
const STATUS_ICON = {
  atento:   {c: ["#ffd23a", "#1a1426"], m: ["..xxx..", ".x...x.", "x..o..x", "x.ooo.x", "x..o..x", ".x...x.", "..xxx.."]},   // olho
  guarda:   {c: ["#86d6ff", "#1a1426"], m: ["xxxxxxx", "xooooox", "xooooox", "xooooox", ".xooox.", "..xox..", "...x..."]},   // escudo
  veneno:   {c: ["#b06ad6", "#ffffff"], m: ["...x...", "..xxx..", ".xxxxx.", "xxxoxxx", "xxooxxx", ".xxxxx.", "..xxx.."]},   // gota roxa
  sangue:   {c: ["#e2363d", "#ffffff"], m: ["...x...", "..xxx..", ".xxxxx.", "xxxoxxx", "xxooxxx", ".xxxxx.", "..xxx.."]},   // gota vermelha
  fogo:     {c: ["#f2740c", "#ffd23a"], m: ["...x...", "..xx...", "..xxx..", ".xxoxx.", "xxooxxx", "xxooxx.", ".xxxx.."]},   // chama
  dreno:    {c: ["#e2363d", "#f4ecd8"], m: ["xxxxxxx", "x.o.o.x", "x.o.o.x", "..o.o..", "..o.o..", "...x...", "...x..."]},   // presas
  fedor:    {c: ["#9bd34a", "#5a7a2a"], m: [".x...x.", "x.x.x.x", "...x...", ".xoooo.", "xoooooo", "xoooooo", ".oooo.."]},   // nuvem
  preso:    {c: ["#5d8a3a", "#2a3a1c"], m: ["xxxxxxx", "o.....o", "xxxxxxx", "o.....o", "xxxxxxx", "o.....o", "xxxxxxx"]},   // laço de cobra
  medo:     {c: ["#86d6ff", "#1a1426"], m: ["..xxx..", ".xxxxx.", "xoxxxox", "xxxxxxx", "xxoooxx", ".xoxox.", "..xxx.."]},   // carinha assustada
  assustada:{c: ["#86d6ff", "#ffffff"], m: ["x.....x", ".x...x.", "..x.x..", "...x...", "..o.o..", ".o...o.", "o.....o"]},   // tremendo
  escudo:   {c: ["#cfe0ff", "#ffffff"], m: ["xxxxxxx", "xx.o.xx", "x.ooo.x", "xoooooo", "x.ooo.x", ".x.o.x.", "..xxx.."]},   // escudo com estrela de luar
  aliado:   {c: ["#cfe0ff", "#1a1426"], m: ["x.x.x..", "xxxxx..", ".xxx...", "..x.xx.", "...xxxx", "...xxxx", "....xx."]}    // patinha de luar
};
const ICON_CACHE = {};
function statusIconURL(k) {
  if (ICON_CACHE[k]) return ICON_CACHE[k];
  const d = STATUS_ICON[k], c = document.createElement("canvas"), g = c.getContext("2d"), S = 3;
  c.width = c.height = 9 * S;
  const cells = [];
  d.m.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") cells.push([x + 1, y + 1, ch === "x" ? d.c[0] : d.c[1]]); }));
  g.fillStyle = "#1a1426";   // contorno em volta do desenho
  cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => g.fillRect((x + dx) * S, (y + dy) * S, S, S)));
  cells.forEach(([x, y, col]) => { g.fillStyle = col; g.fillRect(x * S, y * S, S, S); });
  return ICON_CACHE[k] = c.toDataURL();
}
// lista de estados do Rhanon (e do bicho) com o ícone, o nome e quantos turnos faltam
function statusList() {
  const out = [];
  if (p.atento) out.push(["atento", t("Atento: próximo ataque crítico"), ""]);
  if (p.def) out.push(["guarda", t("Em guarda"), ""]);
  if (p.dot && p.dot.t > 0) out.push([{Veneno: "veneno", Sangramento: "sangue", Queimadura: "fogo", Drenagem: "dreno", Aperto: "preso"}[p.dot.n] || "sangue", t(p.dot.n), p.dot.t]);
  if (p.weak > 0) out.push(["fedor", t("Fedor: golpes mais fracos"), p.weak]);
  if (p.preso > 0) out.push(["preso", t("Preso: não consegue fugir"), p.preso]);
  if (p.medo > 0) out.push(["medo", t("Medo: sem defesa"), p.medo]);
  if (p.escudo > 0) out.push(["escudo", t("Escudo de luar: golpe pela metade"), p.escudo]);
  if (p.fiel > 0) out.push(["aliado", t("Aliado ao lado do Rhanon"), p.fiel]);
  if (e && e.assustada) out.push(["assustada", t("{bicho} {assustado}", {bicho: theName(e, true), assustado: ending(e, "assustado", "assustada")}), ""]);
  return out;
}

/* ícone do elemento na placa do bicho e no caderno: fraqueza = rachadura (o golpe entra fundo), resistência = escudo de
   casco (de tartaruga), normal = traço, ainda não descoberto = "?". Desenho com a cor do texto (currentColor) */
const ELEM_ICON = {
  fraco: '<path d="M7 0L5 4L8 6.2L4.2 9L5.4 12M8 6.2L11.5 7.4M5 4L1.5 2.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="bevel"/>',
  resiste: '<path d="M6 .5L11 2.4V6c0 3-2.4 5-5 5.8C3.4 11 1 9 1 6V2.4z" fill="currentColor"/><path d="M6 3.4l2 1.2v2.4l-2 1.2-2-1.2V4.6zM6 3.4V1.4M8 7l2 1M4 7l-2 1" fill="none" stroke="var(--ei-bg,#fff)" stroke-width="1"/>',
  normal: '<path d="M2 6h8" stroke="currentColor" stroke-width="2"/>'
};
const elemIcon = cls => cls === "nao-sei" ? "?" : `<svg class="ei" viewBox="0 0 12 12" aria-hidden="true">${ELEM_ICON[cls]}</svg>`;

document.documentElement.style.setProperty("--moldura", `url(${vineFrame()})`);
