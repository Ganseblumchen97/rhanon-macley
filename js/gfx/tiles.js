/* Desenho das fases de exploração: terreno em quadrados de 16x16 (pintado uma vez num canvas grande)
   e o Rhanon visto de cima, de frente, de costas e de lado. */
const TILE = 16;
const TILE_PAL = {
  mata:    {g1: "#5fa84c", g2: "#4f9441", tall: "#3f7f36", tallHi: "#78c45a", path: "#c9a46a", path2: "#b08a55", leaf: "#2f7a3f", leaf2: "#24633a", leafHi: "#4f9a4c", trunk: "#6d4329", rock: "#9a978a", rock2: "#6a675e", water: "#2f7fb8", water2: "#5ab3e3", wood: "#9c6339", wood2: "#6d4329"},
  fechada: {g1: "#3f7a3c", g2: "#336a33", tall: "#2a5a2e", tallHi: "#559048", path: "#a8875a", path2: "#8a6d45", leaf: "#1f5a32", leaf2: "#163f24", leafHi: "#2f7040", trunk: "#5a3a1c", rock: "#7f7c72", rock2: "#55524a", water: "#245f8a", water2: "#4a92c0", wood: "#8a5a32", wood2: "#5a3a1c"},
  rio:     {g1: "#6ab04f", g2: "#58a045", tall: "#46893a", tallHi: "#86d064", path: "#d4b27a", path2: "#bb9763", leaf: "#3a8a45", leaf2: "#2b6a37", leafHi: "#5aaa55", trunk: "#6d4329", rock: "#a09d90", rock2: "#706d64", water: "#2a86c4", water2: "#6cc4f0", wood: "#a8703f", wood2: "#6d4329"}
};
const OUTLINE = "#1a2418";
// tipo de terreno desenhado embaixo das letras especiais
const TILE_BASE = {S: "-", E: "-", G: "-", a: ".", B: "."};

function fillEllipse(x, cx, cy, rx, ry, col) {
  x.fillStyle = col;
  for (let py = Math.floor(cy - ry); py <= cy + ry; py++) for (let px = Math.floor(cx - rx); px <= cx + rx; px++)
    if (((px + .5 - cx) / rx) ** 2 + ((py + .5 - cy) / ry) ** 2 <= 1) x.fillRect(px, py, 1, 1);
}
// desenha um quadrado do terreno em (ox, oy); tx/ty variam os detalhes de forma fixa
function drawTile(x, ch, ox, oy, P, tx, ty) {
  const r = k => rand(tx * 73.1 + ty * 131.7 + k);
  const grass = () => {
    x.fillStyle = P.g1; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.g2; for (let k = 0; k < 5; k++) x.fillRect(ox + Math.floor(r(k) * 14), oy + Math.floor(r(k + 9) * 15), 2, 1);
  };
  if (ch === ".") grass();
  else if (ch === ",") {
    grass();
    for (const [bx, by] of [[1, 3], [9, 1], [5, 9], [12, 10]]) {
      x.fillStyle = P.tall; x.fillRect(ox + bx, oy + by + 2, 1, 4); x.fillRect(ox + bx + 2, oy + by + 1, 1, 5); x.fillRect(ox + bx + 4, oy + by + 2, 1, 4);
      x.fillStyle = P.tallHi; x.fillRect(ox + bx + 2, oy + by, 1, 2); x.fillRect(ox + bx + 1, oy + by + 1, 1, 1); x.fillRect(ox + bx + 3, oy + by + 1, 1, 1);
    }
  } else if (ch === "f") {
    grass();
    for (let k = 0; k < 3; k++) {
      const fx = ox + 2 + Math.floor(r(k + 20) * 11), fy = oy + 2 + Math.floor(r(k + 30) * 11);
      x.fillStyle = ["#ffd23a", "#ffffff", "#ff6b8a"][k]; x.fillRect(fx - 1, fy, 3, 1); x.fillRect(fx, fy - 1, 1, 3);
      x.fillStyle = "#e5741c"; x.fillRect(fx, fy, 1, 1);
    }
  } else if (ch === "-") {
    x.fillStyle = P.path; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.path2; for (let k = 0; k < 6; k++) x.fillRect(ox + Math.floor(r(k + 40) * 15), oy + Math.floor(r(k + 50) * 15), 1 + (k % 2), 1);
  } else if (ch === "~") {
    x.fillStyle = P.water; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.water2; for (let k = 0; k < 2; k++) { const wx = ox + Math.floor(r(k + 60) * 10), wy = oy + 3 + k * 7; x.fillRect(wx, wy, 4, 1); x.fillRect(wx + 4, wy - 1, 2, 1); }
  } else if (ch === "=") {
    x.fillStyle = P.water; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.wood; x.fillRect(ox, oy + 2, TILE, 12);
    x.fillStyle = P.wood2; for (let k = 0; k < TILE; k += 4) x.fillRect(ox + k, oy + 2, 1, 12);
    x.fillRect(ox, oy + 2, TILE, 1); x.fillRect(ox, oy + 13, TILE, 1);
  } else if (ch === "o") {
    grass();
    fillEllipse(x, ox + 8, oy + 9, 7, 6, OUTLINE); fillEllipse(x, ox + 8, oy + 9, 6, 5, P.rock2); fillEllipse(x, ox + 7, oy + 8, 5, 4, P.rock);
    x.fillStyle = "#ffffff40"; x.fillRect(ox + 5, oy + 6, 3, 1);
  } else if (ch === "T") {
    grass();
    x.fillStyle = OUTLINE; x.fillRect(ox + 5, oy + 11, 6, 5);
    x.fillStyle = P.trunk; x.fillRect(ox + 6, oy + 11, 4, 4);
    fillEllipse(x, ox + 8, oy + 7, 8, 7, OUTLINE); fillEllipse(x, ox + 8, oy + 7, 7, 6, P.leaf2); fillEllipse(x, ox + 8, oy + 6, 6, 5, P.leaf);
    fillEllipse(x, ox + 6, oy + 4, 3, 2, P.leafHi);
  }
}
// pinta a fase inteira num canvas (o desenho não muda; a passagem e a água brilhando são desenhadas por cima)
function drawStageMap(rows, zone) {
  const P = TILE_PAL[zone] || TILE_PAL.mata, H = rows.length, W = rows[0].length;
  const c = document.createElement("canvas"); c.width = W * TILE; c.height = H * TILE;
  const x = c.getContext("2d");
  rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
    drawTile(x, TILE_BASE[ch] || ch, tx * TILE, ty * TILE, P, tx, ty);
    if (ch === "E") {   // seta de saída apontando para a borda mais perto
      const left = tx < W / 2, ax = tx * TILE + 8, ay = ty * TILE + 8;
      x.fillStyle = OUTLINE; x.fillRect(ax - 5, ay - 2, 10, 5);
      x.fillStyle = "#ffd23a";
      for (let k = 0; k < 3; k++) x.fillRect(left ? ax - 4 + k : ax + 3 - k, ay - k + 1, 1, 2 * k + 1);
      x.fillRect(left ? ax - 1 : ax - 4, ay + 1, 5, 1);
    }
  }));
  return c;
}
// troncos atravessados na passagem enquanto o chefe não cai
function drawGate(x, sx, sy, P) {
  for (const gy of [3, 9]) {
    x.fillStyle = OUTLINE; x.fillRect(sx - 1, sy + gy - 1, TILE + 2, 6);
    x.fillStyle = P.wood; x.fillRect(sx, sy + gy, TILE, 4);
    x.fillStyle = P.wood2; x.fillRect(sx, sy + gy + 3, TILE, 1); x.fillRect(sx + 4, sy + gy + 1, 1, 2); x.fillRect(sx + 11, sy + gy + 1, 1, 2);
  }
}

/* ---------- Rhanon visto de cima ---------- */
const OW_CACHE = {};
// dir: "down" (de frente), "up" (de costas) ou "side" (de lado, olhando para a direita)
function heroOverworld(dir, legs, weapon) {
  const key = dir + legs + weapon + JSON.stringify(G?.equip || {}) + (G?.job ? 1 : 0) + (G?.betterJob ? 1 : 0);
  if (OW_CACHE[key]) return OW_CACHE[key];
  const parts = heroParts(true);
  if (dir === "up") parts.head = parts.head.map((r, i) => i >= 7 && i <= 14 ? r.replace(/[sewrmx]/g, "h") : r);
  if (dir === "side") parts.head = parts.head.map((r, i) => {
    if (i < 8 || i > 14) return r;
    const a = [...r];   // cabelo cobre a metade de trás do rosto; um olho só, perto da frente
    for (let k = 3; k < 9; k++) if ("sewrmx".includes(a[k])) a[k] = "h";
    if (i === 11 || i === 12) { for (let k = 9; k < 16; k++) if ("ewx".includes(a[k])) a[k] = "s"; if (!parts.glasses) a[13] = i === 11 ? "e" : "w"; else a[13] = "x"; }
    return a.join("");
  });
  const c = document.createElement("canvas"); c.width = 20; c.height = 28;
  const x = c.getContext("2d");
  drawHero(x, parts, {legs});
  shadeCanvas(c);
  if (weapon) {
    x.fillStyle = "#7a4a1e";
    if (dir === "up") { x.fillRect(1, 2, 1, 26); x.fillStyle = "#cfd8dc"; x.fillRect(1, 0, 1, 2); }
    else { x.fillRect(19, 2, 1, 26); x.fillStyle = "#cfd8dc"; x.fillRect(19, 0, 1, 2); }
  }
  return OW_CACHE[key] = c;
}
// número em pixels (glifos 3x5 de GL) para a etiqueta de nível dos bichos
function drawTinyNumber(x, str, px, py, col) {
  x.fillStyle = col;
  [...str].forEach((ch, i) => { const g = GL[ch]; if (g) for (let k = 0; k < 15; k++) if (g[k] === "1") x.fillRect(px + i * 4 + k % 3, py + (k / 3 | 0), 1, 1); });
}
