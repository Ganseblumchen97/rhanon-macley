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
// oca de 2x2 quadrados: telhado de palha arredondado, parede de barro e porta escura
// oca de 3x2 quadrados (48x32): a porta fica no meio do quadrado central, onde a trilha chega
function hutCanvas() {
  const c = document.createElement("canvas"); c.width = 48; c.height = 32; const x = c.getContext("2d");
  x.fillStyle = OUTLINE; x.fillRect(7, 17, 34, 14);
  x.fillStyle = "#9c6339"; x.fillRect(8, 18, 32, 12);
  x.fillStyle = "#7a4a2e"; x.fillRect(8, 27, 32, 3);
  x.fillStyle = OUTLINE; x.fillRect(20, 20, 8, 11); x.fillStyle = "#2a1a10"; x.fillRect(21, 21, 6, 10);
  fillEllipse(x, 24, 13, 23, 11, OUTLINE); fillEllipse(x, 24, 13, 22, 10, "#b08a3a"); fillEllipse(x, 24, 12, 21, 9, "#d9b25a");
  x.fillStyle = "#b08a3a"; for (let k = 0; k < 10; k++) x.fillRect(5 + k * 4, 8 + (k % 2) * 3, 1, 9 - (k % 2) * 3);
  x.fillStyle = "#f0d68a"; x.fillRect(13, 6, 8, 1); x.fillRect(11, 7, 4, 1);
  return c;
}
// barraca da feira: toldo listrado em cima, balcão com mercadoria embaixo (left/right = pontas)
function drawStall(x, ox, oy, tx, left, right) {
  const cols = ["#e5001c", "#f4ecd8"];
  for (let k = 0; k < TILE; k += 4) { x.fillStyle = cols[((tx * 4 + k) / 4) % 2]; x.fillRect(ox + k, oy + 1, 4, 6); }
  x.fillStyle = OUTLINE; x.fillRect(ox, oy, TILE, 1); x.fillRect(ox, oy + 7, TILE, 1);
  for (let k = 0; k < TILE; k += 4) { x.fillStyle = cols[((tx * 4 + k) / 4) % 2]; x.fillRect(ox + k, oy + 8, 4, 1); x.fillRect(ox + k + 1, oy + 9, 2, 1); }
  x.fillStyle = "#9c6339"; x.fillRect(ox, oy + 10, TILE, 6); x.fillStyle = "#6d4329"; x.fillRect(ox, oy + 14, TILE, 2);
  x.fillStyle = OUTLINE; x.fillRect(ox, oy + 15, TILE, 1);
  [["#ffd23a", 2], ["#7a2a8a", 7], ["#3f9a5c", 11]].forEach(([col, gx]) => { x.fillStyle = col; x.fillRect(ox + gx, oy + 11, 3, 2); });
  x.fillStyle = OUTLINE;
  if (left) x.fillRect(ox, oy, 1, TILE);
  if (right) x.fillRect(ox + TILE - 1, oy, 1, TILE);
}
// pinta a fase inteira num canvas (o desenho não muda; passagem, fogo e água brilhando são desenhados por cima)
function drawStageMap(rows, zone) {
  const P = TILE_PAL[zone] || TILE_PAL.mata, H = rows.length, W = rows[0].length;
  const c = document.createElement("canvas"); c.width = W * TILE; c.height = H * TILE;
  const x = c.getContext("2d"), hut = hutCanvas(), at = (tx, ty) => (rows[ty] || "")[tx];
  rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
    const ox = tx * TILE, oy = ty * TILE;
    if ("HKFNVPCR".includes(ch)) {
      drawTile(x, "KVCR".includes(ch) ? "-" : ".", ox, oy, P, tx, ty);
      if (ch === "H") x.drawImage(hut, (at(tx - 1, ty) === "H" ? (at(tx - 2, ty) === "H" ? 2 : 1) : 0) * 16, at(tx, ty - 1) === "H" ? 16 : 0, 16, 16, ox, oy, 16, 16);
      else if (ch === "K") drawStall(x, ox, oy, tx, at(tx - 1, ty) !== "K", at(tx + 1, ty) !== "K");
      else if (ch === "F") {   // pedras em volta e lenha (as chamas são animadas por cima)
        fillEllipse(x, ox + 8, oy + 10, 7, 4, "#6a675e"); fillEllipse(x, ox + 8, oy + 10, 5, 2.5, "#2a1a10");
        x.fillStyle = "#6d4329"; x.fillRect(ox + 4, oy + 9, 8, 2); x.fillStyle = "#9c6339"; x.fillRect(ox + 5, oy + 11, 7, 1);
      } else if (ch === "N") {   // tenda triangular de couro
        x.fillStyle = OUTLINE; for (let k = 0; k < 13; k++) x.fillRect(ox + 8 - Math.ceil(k * .6) - 1, oy + 2 + k, Math.ceil(k * 1.2) + 3, 1);
        for (let k = 0; k < 12; k++) { x.fillStyle = "#e9e2cf"; x.fillRect(ox + 8 - Math.ceil(k * .6), oy + 3 + k, Math.ceil(k * .6), 1); x.fillStyle = "#c9bfa4"; x.fillRect(ox + 8, oy + 3 + k, Math.ceil(k * .6), 1); }
        x.fillStyle = "#3a2a1a"; for (let k = 0; k < 6; k++) x.fillRect(ox + 8 - Math.ceil(k / 2), oy + 9 + k, Math.ceil(k / 2) * 2 + 1, 1);
        x.fillStyle = "#7a4a1e"; x.fillRect(ox + 7, oy, 2, 3);
      }
      return;
    }
    drawTile(x, TILE_BASE[ch] || ch, ox, oy, P, tx, ty);
    if (ch === "E") {   // seta de saída apontando para a borda mais perto
      const sy = rows.findIndex(r => r.includes("S")), sx = rows[sy].indexOf("S");   // aponta do início (S) para a saída
      const left = tx < sx, down = ty > sy, ax = tx * TILE + 8, ay = ty * TILE + 8;
      if (down) {
        x.fillStyle = OUTLINE; x.fillRect(ax - 3, ay - 5, 7, 10);
        x.fillStyle = "#ffd23a"; x.fillRect(ax, ay - 4, 1, 5);
        for (let k = 0; k < 3; k++) x.fillRect(ax - k, ay + 3 - k, 2 * k + 1, 1);
      } else {
        x.fillStyle = OUTLINE; x.fillRect(ax - 5, ay - 2, 10, 5);
        x.fillStyle = "#ffd23a";
        for (let k = 0; k < 3; k++) x.fillRect(left ? ax - 4 + k : ax + 3 - k, ay - k + 1, 1, 2 * k + 1);
        x.fillRect(left ? ax - 1 : ax - 4, ay + 1, 5, 1);
      }
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
const OW_SCALE = .75;   // desenho do esqueleto (gfx/rig.js) em 24x33 na exploração
// dir: "down" (de frente) ou "up" (de costas); legs: chave de RIG_LEGS
// weapon: lança na diagonal com as duas mãos, ponta para o lado side (1 direita, -1 esquerda)
// bowBack = false enquanto o arco está na mão (atirando), para não aparecer dois arcos
function heroOverworld(dir, legs, weapon, bowBack = true, side = 1) {
  const look = rhanonLook();
  if (!bowBack) look.bowBack = false;
  const walking = legs !== "stand";
  return rigCanvas(dir === "up" ? "back" : "front", {...RIG_LEGS[legs], dy: walking ? 1 : 0, weapon: weapon ? "diag" : null, side}, look, OW_SCALE);
}
// número em pixels (glifos 3x5 de GL) para a etiqueta de nível dos bichos
function drawTinyNumber(x, str, px, py, col) {
  x.fillStyle = col;
  [...str].forEach((ch, i) => { const g = GL[ch]; if (g) for (let k = 0; k < 15; k++) if (g[k] === "1") x.fillRect(px + i * 4 + k % 3, py + (k / 3 | 0), 1, 1); });
}

// chamas da fogueira, animadas a cada quadro
function drawFire(x, sx, sy, t) {
  const f = Math.floor(t / 90) % 3, fl = [["#ffd23a", "#f2740c", "#d62828"], ["#fff3a0", "#ffd23a", "#f2740c"], ["#ffd23a", "#d62828", "#f2740c"]][f];
  x.fillStyle = fl[2]; x.fillRect(sx + 4, sy + 6, 8, 4);
  x.fillStyle = fl[1]; x.fillRect(sx + 5, sy + 3 + (f === 1 ? 0 : 1), 6, 5);
  x.fillStyle = fl[0]; x.fillRect(sx + 7 - (f % 2), sy + 1 + (f === 2 ? 1 : 0), 2, 5);
  x.fillStyle = "#fffbe0"; x.fillRect(sx + 7, sy + 6, 2, 2);
}
// pessoa da aldeia/feira: o mesmo esqueleto do Rhanon, de tanga, com as cores e enfeites de VILLAGER_LOOK[look]
function villagerSprite(look) {
  return rigCanvas("front", {}, VILLAGER_LOOK[look] || {}, OW_SCALE);
}