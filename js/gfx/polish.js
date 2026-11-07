/* Acabamento visual: em todas as fases, chão com manchas e enfeites do bioma, beira de trilha e de água, árvores
   redesenhadas (copa em cachos, coqueiro, mandacaru e árvore seca, árvore do cerrado, araucária, estalagmite e duna)
   e a luz por cima (fachos de sol na mata fechada, sombra de nuvem, poeira, vinheta; escuro e frio nas grutas); na
   batalha, menu com cursor que desliza, entrada em cascata, confirmação com pancada, registro escrevendo e a barra de
   vida com o rastro do dano. Ligado por padrão; `?visual=velho` na URL mostra o jogo como era, para comparar. */
const POLISH = !/[?&]visual=velho\b/.test(location.search);
const polishOn = zone => POLISH && !!zone;
if (POLISH) document.documentElement.classList.add("polido");

// ruído suave (valor interpolado) para manchas grandes no chão: mesma fase = mesmo desenho
function pNoise(x, y, s) {
  const xi = Math.floor(x / s), yi = Math.floor(y / s), fx = x / s - xi, fy = y / s - yi;
  const h = (a, b) => rand(a * 57.31 + b * 113.7 + 7.7), sm = t => t * t * (3 - 2 * t);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), u = sm(fx), v = sm(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function pMix(c1, c2, k) {   // mistura duas cores "#rrggbb"
  const a = parseInt(c1.slice(1, 7), 16), b = parseInt(c2.slice(1, 7), 16), m = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return "#" + ((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1);
}
function pRgba(c, a) { const n = parseInt(c.slice(1, 7), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const pLum = c => { const n = parseInt(c.slice(1, 7), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; };

/* bioma do chão pela paleta: cidade (tem telhado), gruta, areia (praia e duna), seco (sertão e cerrado) ou verde.
   Árvore pelo tipo do T da paleta: coqueiro, cacto, gruta, cerrado, araucária, duna ou copa comum */
function polishBiome(P) {
  if (P.roof) return "cidade";
  if (P.gruta) return "gruta";
  if (P.dune || P.palm) return "areia";
  const n = parseInt(P.g1.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255;
  if (P.cactus || P.cerrado || r > g * .95) return "seco";
  return "verde";
}
const polishTree = P => P.palm ? "palm" : P.cactus ? "cactus" : P.gruta ? "gruta" : P.cerrado ? "cerrado" : P.araucaria ? "araucaria" : P.dune ? "dune" : "leafy";

// manchas grandes de luz e sombra no chão, em blocos de 2px (o chão para de parecer azulejo repetido); chamada pelo
// grass() de cada quadrado em tiles.js, antes de oca, barraca e fogueira serem desenhadas por cima
function polishGrassNoise(x, ox, oy, P) {
  const c = P._noise || (P._noise = (() => { const b = polishBiome(P); return {amp: b === "cidade" ? .5 : b === "areia" ? .7 : 1, dark: pMix(P.g2, "#0a1a10", .55), lite: pMix(P.g1, "#fff4c0", .6)}; })());
  for (let py = 0; py < TILE; py += 2) for (let px = 0; px < TILE; px += 2) {
    const gx = ox + px, gy = oy + py, n = pNoise(gx, gy, 56) * .7 + pNoise(gx, gy, 19) * .3;
    if (n < .38) { x.fillStyle = c.dark; x.globalAlpha = (.38 - n) * 1.1 * c.amp; x.fillRect(gx, gy, 2, 2); }
    else if (n > .62) { x.fillStyle = c.lite; x.globalAlpha = (n - .62) * c.amp; x.fillRect(gx, gy, 2, 2); }
  }
  x.globalAlpha = 1;
}
/* ---------- desenho fixo da fase (chamado no fim de drawStageMap) ---------- */
function polishMap(x, rows, P, zone) {
  const H = rows.length, W = rows[0].length, at = (tx, ty) => (rows[ty] || "")[tx];
  const biome = polishBiome(P), tree = polishTree(P);
  const isT = (tx, ty) => at(tx, ty) === "T", isPath = ch => ch && "-SEG".includes(ch), wet = ch => ch && "~=U".includes(ch);
  // 0) quadrados de árvore: tira a árvore velha (capim com as manchas embaixo; a copa nova é desenhada no fim)
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (isT(tx, ty)) {
    const r = k => rand(tx * 73.1 + ty * 131.7 + k);
    x.fillStyle = P.g1; x.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    x.fillStyle = P.g2; for (let k = 0; k < 5; k++) x.fillRect(tx * TILE + Math.floor(r(k) * 14), ty * TILE + Math.floor(r(k + 9) * 15), 2, 1);
    polishGrassNoise(x, tx * TILE, ty * TILE, P);
  }
  // 2) beira da trilha: na cidade, meio-fio escuro; fora dela, o chão invade a terra em tufos e a terra escurece rente
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (at(tx, ty) !== "-") continue;
    const ox = tx * TILE, oy = ty * TILE;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const n = at(tx + dx, ty + dy); if (!n || isPath(n) || wet(n) || n === "#" || n === "r") continue;
      if (biome === "cidade") {
        x.fillStyle = pRgba(P.path2, .9); x.fillRect(dx > 0 ? ox + TILE - 1 : ox, dy > 0 ? oy + TILE - 1 : oy, dx ? 1 : TILE, dy ? 1 : TILE);
        x.fillStyle = "rgba(0,0,0,.14)"; x.fillRect(dx > 0 ? ox + TILE - 3 : dx < 0 ? ox + 1 : ox, dy > 0 ? oy + TILE - 3 : dy < 0 ? oy + 1 : oy, dx ? 2 : TILE, dy ? 2 : TILE);
        continue;
      }
      for (let k = 0; k < TILE; k++) {
        const r = rand(tx * 31.7 + ty * 17.3 + k * 3.1 + dx * 5 + dy * 11), d = r < .35 ? 0 : r < .7 ? 1 : r < .9 ? 2 : 3;
        const px = dx ? (dx < 0 ? ox : ox + TILE - 1) : ox + k, py = dy ? (dy < 0 ? oy : oy + TILE - 1) : oy + k;
        x.fillStyle = P.path2; x.fillRect(px + (dx ? -dx * (d + 1) : 0), py + (dy ? -dy * (d + 1) : 0), 1, 1);
        if (d) { x.fillStyle = r < .8 ? P.g1 : P.g2; x.fillRect(dx ? (dx < 0 ? px : px - d + 1) : px, dy ? (dy < 0 ? py : py - d + 1) : py, dx ? d : 1, dy ? d : 1); }
        if (d === 3 && !dx && biome === "verde") { x.fillStyle = P.tallHi; x.fillRect(px, dy < 0 ? py + 2 : py - 3, 1, 1); }
      }
    }
    if (rand(tx * 9.1 + ty * 4.3) < .3) {   // pedrinhas na terra (na cidade, rachadura)
      const sx = ox + 3 + Math.floor(rand(tx + ty * 7.7) * 9), sy = oy + 3 + Math.floor(rand(tx * 3.3 + ty) * 9);
      if (biome === "cidade") { x.fillStyle = pRgba(P.path2, .8); x.fillRect(sx, sy, 2, 1); x.fillRect(sx + 2, sy + 1, 2, 1); x.fillRect(sx + 4, sy + 1, 1, 1); }
      else { x.fillStyle = P.rock2; x.fillRect(sx, sy + 1, 3, 1); x.fillStyle = P.rock; x.fillRect(sx, sy, 2, 1); }
    }
  }
  // 3) beira da água: barranco escuro embaixo da terra de cima e linha clara nas outras margens
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (at(tx, ty) !== "~") continue;
    const ox = tx * TILE, oy = ty * TILE, land = (dx, dy) => { const n = at(tx + dx, ty + dy); return n && !wet(n) && n !== "B"; };
    if (land(0, -1)) { x.fillStyle = pRgba(pMix(P.water, "#000000", .45), .7); x.fillRect(ox, oy, TILE, 2); x.fillStyle = pRgba(pMix(P.water, "#000000", .3), .45); x.fillRect(ox, oy + 2, TILE, 2); }
    x.fillStyle = pRgba(P.water2, .75);
    if (land(0, 1)) x.fillRect(ox, oy + TILE - 1, TILE, 1);
    if (land(-1, 0)) x.fillRect(ox, oy, 1, TILE);
    if (land(1, 0)) x.fillRect(ox + TILE - 1, oy, 1, TILE);
  }
  // 4) pedras: sombra no chão e, no verde, musgo em cima
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (at(tx, ty) !== "o") continue;
    const ox = tx * TILE, oy = ty * TILE;
    x.fillStyle = "rgba(0,0,0,.2)"; x.fillRect(ox + 3, oy + 15, 12, 1); x.fillRect(ox + 10, oy + 13, 5, 2);
    if (biome === "verde") { x.fillStyle = P.tallHi; x.fillRect(ox + 5, oy + 4, 4, 1); x.fillRect(ox + 4, oy + 5, 2, 1); x.fillStyle = P.tall; x.fillRect(ox + 6, oy + 5, 3, 1); }
  }
  // 5) enfeites no chão, cada bioma com os seus
  const nearT = (tx, ty) => isT(tx - 1, ty) || isT(tx + 1, ty) || isT(tx, ty - 1) || isT(tx, ty + 1);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (at(tx, ty) !== ".") continue;
    const r = k => rand(tx * 41.3 + ty * 77.9 + k), ox = tx * TILE, oy = ty * TILE, kind = r(1);
    const px = ox + 2 + Math.floor(r(2) * 11), py = oy + 3 + Math.floor(r(3) * 10);
    const pebble = () => { x.fillStyle = P.rock2; x.fillRect(px, py + 1, 3, 1); x.fillStyle = P.rock; x.fillRect(px, py, 2, 1); };
    if (biome === "verde") {
      if (nearT(tx, ty) && kind < .22 && tree === "leafy") {   // cogumelo
        x.fillStyle = OUTLINE; x.fillRect(px - 1, py - 1, 5, 3); x.fillStyle = r(4) < .5 ? "#d8432e" : "#e8c27a"; x.fillRect(px, py - 1, 3, 2);
        x.fillStyle = "#fff4d8"; x.fillRect(px + 1, py - 1, 1, 1); x.fillRect(px + 1, py + 1, 1, 2);
      } else if (kind < .14) {   // florzinhas em grupo
        const col = ["#ffffff", "#ffd23a", "#ff8ab0", "#b89aff"][Math.floor(r(5) * 4)];
        for (let k = 0; k < 3; k++) { const fx = px + Math.round((r(6 + k) - .5) * 7), fy = py + Math.round((r(9 + k) - .5) * 5); x.fillStyle = P.tall; x.fillRect(fx, fy + 1, 1, 2); x.fillStyle = col; x.fillRect(fx - 1, fy, 3, 1); x.fillRect(fx, fy - 1, 1, 1); }
      } else if (kind < .24) {   // trevo
        x.fillStyle = P.tall; x.fillRect(px, py, 2, 1); x.fillRect(px + 1, py - 1, 1, 3); x.fillStyle = P.tallHi; x.fillRect(px + 1, py - 1, 1, 1);
      } else if (kind < .31) {   // folha caída
        x.fillStyle = ["#c88a3a", "#a8542e", "#d8b04a"][Math.floor(r(7) * 3)]; x.fillRect(px, py, 3, 1); x.fillRect(px + 1, py - 1, 1, 1);
      } else if (kind < .35) pebble();
    } else if (biome === "seco") {
      if (kind < .1) {   // graveto seco
        x.fillStyle = pMix(P.trunk, "#000000", .2); x.fillRect(px, py, 4, 1); x.fillRect(px + 3, py - 1, 1, 1); x.fillRect(px + 1, py + 1, 1, 1);
      } else if (kind < .2) {   // tufo de capim seco
        x.fillStyle = P.tall; x.fillRect(px, py - 2, 1, 3); x.fillRect(px + 2, py - 3, 1, 4); x.fillRect(px + 4, py - 1, 1, 2); x.fillStyle = P.tallHi; x.fillRect(px + 2, py - 3, 1, 1);
      } else if (kind < .3) pebble();
      else if (kind < .36) {   // rachadura da terra seca
        x.fillStyle = pRgba(pMix(P.g2, "#000000", .35), .6); x.fillRect(px, py, 2, 1); x.fillRect(px + 2, py + 1, 2, 1); x.fillRect(px + 3, py + 2, 1, 1); x.fillRect(px - 1, py - 1, 1, 1);
      } else if (kind < .39) {   // florzinha de cerrado
        x.fillStyle = r(8) < .5 ? "#ffd23a" : "#e86a9a"; x.fillRect(px, py, 1, 1); x.fillRect(px - 1, py + 1, 3, 1); x.fillStyle = P.tall; x.fillRect(px, py + 2, 1, 2);
      }
    } else if (biome === "areia") {
      if (kind < .08) {   // conchinha
        x.fillStyle = r(9) < .5 ? "#f8e8e0" : "#f0b8a8"; x.fillRect(px, py, 3, 1); x.fillRect(px + 1, py - 1, 1, 1); x.fillStyle = pRgba(P.g2, .9); x.fillRect(px, py + 1, 3, 1);
      } else if (kind < .2) {   // ondinha de vento na areia
        x.fillStyle = pRgba(pMix(P.g2, "#000000", .1), .7); x.fillRect(px - 2, py, 3, 1); x.fillRect(px + 1, py - 1, 3, 1); x.fillStyle = pRgba("#ffffff", .5); x.fillRect(px - 2, py - 1, 3, 1);
      } else if (kind < .25) pebble();
    } else if (biome === "gruta") {
      if (kind < .14) pebble();
      else if (kind < .17) {   // cristal brilhando
        const c = P.rock; x.fillStyle = OUTLINE; x.fillRect(px - 1, py - 3, 3, 5); x.fillStyle = c; x.fillRect(px, py - 2, 1, 3); x.fillStyle = "#ffffff"; x.fillRect(px, py - 2, 1, 1);
      } else if (kind < .3) {   // musgo
        x.fillStyle = pRgba(P.tall, .8); x.fillRect(px, py, 4, 1); x.fillRect(px + 1, py - 1, 2, 1); x.fillStyle = pRgba(P.tallHi, .7); x.fillRect(px + 1, py - 1, 1, 1);
      } else if (kind < .34) {   // poça d'água pingada
        x.fillStyle = pRgba(P.water, .7); x.fillRect(px - 1, py, 5, 2); x.fillStyle = pRgba(P.water2, .8); x.fillRect(px, py, 2, 1);
      }
    } else {   // cidade: rachadura, matinho no vão da calçada e um papel
      if (kind < .1) { x.fillStyle = pRgba(pMix(P.g2, "#000000", .3), .55); x.fillRect(px, py, 2, 1); x.fillRect(px + 2, py + 1, 2, 1); x.fillRect(px + 4, py, 1, 1); }
      else if (kind < .16) { x.fillStyle = P.tall; x.fillRect(px, py, 1, 2); x.fillRect(px + 1, py - 1, 1, 3); x.fillStyle = P.tallHi; x.fillRect(px + 1, py - 1, 1, 1); }
      else if (kind < .18) { x.fillStyle = "#f0ece0"; x.fillRect(px, py, 2, 2); x.fillStyle = "rgba(0,0,0,.15)"; x.fillRect(px, py + 2, 2, 1); }
    }
  }
  // 6) sombra das árvores no chão em volta (antes das copas, que caem por cima)
  if (tree === "leafy") for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (!isT(tx, ty) || isT(tx, ty + 1)) continue;   // só a fileira de baixo de cada bosque joga sombra para fora
    const ox = tx * TILE, oy = ty * TILE;
    x.fillStyle = "rgba(10,40,20,.28)"; for (let k = 0; k < 5; k++) x.fillRect(ox - 2 + k, oy + TILE + k, TILE + 2 - k, 1);
  }
  if (tree === "leafy") for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {   // chão do bosque mais escuro, só no miolo
    if (!isT(tx, ty)) continue;
    const nb = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dy]) => isT(tx + dx, ty + dy)).length;
    if (nb >= 3) { x.fillStyle = "rgba(10,40,20,.35)"; x.fillRect(tx * TILE, ty * TILE, TILE, TILE); }
    else pShadow(x, tx * TILE + 8, ty * TILE + 14, 8, 3, .25);
  }
  // 7) árvores, de cima para baixo (as da frente cobrem as de trás)
  const draw = POLISH_TREE[tree], cached = POLISH_SPRITE.has(tree);
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    if (!isT(tx, ty)) continue;
    const r = k => rand(tx * 23.9 + ty * 61.3 + k), edge = !isT(tx, ty + 1);
    if (cached) pTreeSprite(x, tree, P, Math.floor(r(80) * 12), edge, tx, ty);
    else draw(x, tx, ty, P, r, edge, (dx, dy) => isT(tx + dx, ty + dy));
  }
}

/* ---------- árvores (x, tx, ty, P, r = sorteio fixo do lugar, edge = beira de baixo do bosque) ---------- */
// segmento grosso com contorno (galho/tronco)
function pSeg(x, x0, y0, x1, y1, w, col) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let k = 0; k <= n; k++) x.fillStyle = col, x.fillRect(Math.round(x0 + (x1 - x0) * k / n - (w - 1) / 2), Math.round(y0 + (y1 - y0) * k / n - (w - 1) / 2), w, w);
}
function pShadow(x, cx, cy, rx, ry, a = .22) { fillEllipse(x, cx, cy, rx, ry, `rgba(10,25,15,${a})`); }
function pCrown(x, cx, cy, R, P, r, flat = 1) {   // copa em cachos: contorno, escuro, meio e claro em cima à esquerda
  const tones = [[P.leaf2, P.leaf, P.leafHi], [pMix(P.leaf2, "#1a3a2a", .35), pMix(P.leaf, "#2a6a4a", .4), pMix(P.leafHi, "#7ab86a", .3)], [pMix(P.leaf2, "#4a5a1a", .3), pMix(P.leaf, "#7a9a2a", .3), pMix(P.leafHi, "#b8d86a", .45)]];
  const [dk, md, hi] = tones[Math.floor(r(1) * 3)], n = 5 + Math.floor(r(5) * 3), blobs = [[0, 0, R * .78]];
  for (let k = 0; k < n; k++) { const a = r(10 + k) * Math.PI * 2, d = R * (.35 + r(20 + k) * .3); blobs.push([Math.cos(a) * d, Math.sin(a) * d * .8 * flat, R * (.38 + r(30 + k) * .18)]); }
  blobs.forEach(([bx, by, br]) => fillEllipse(x, cx + bx, cy + by, br + 1, br * .9 * flat + 1, OUTLINE));
  blobs.forEach(([bx, by, br]) => fillEllipse(x, cx + bx, cy + by, br, br * .9 * flat, dk));
  blobs.forEach(([bx, by, br]) => fillEllipse(x, cx + bx - 1, cy + by - 1.5 * flat, br * .8, br * .7 * flat, md));
  blobs.filter(([bx, by]) => bx + by < 1).forEach(([bx, by, br]) => fillEllipse(x, cx + bx - 2, cy + by - 2.5 * flat, br * .42, br * .32 * flat, hi));
  for (let k = 0; k < 6; k++) {   // pontinhos de folha soltos dando textura
    const fx = cx + Math.round((r(40 + k) - .5) * R * 1.3), fy = cy + Math.round((r(50 + k) - .5) * R * 1.1 * flat);
    x.fillStyle = k % 2 ? hi : dk; x.fillRect(fx, fy, 1, 1);
  }
  if (r(60) < .06) for (let k = 0; k < 3; k++) {   // de vez em quando fruta ou flor
    x.fillStyle = r(61) < .5 ? "#e8443a" : "#ffd23a"; x.fillRect(cx + Math.round((r(62 + k) - .5) * R), cy + Math.round((r(65 + k) - .3) * R * .8 * flat), 2, 2);
  }
}
// copa pronta num canvas, guardada por paleta: 10 desenhos por tamanho, cada árvore sorteia um (desenhar ~30 elipses
// por árvore deixava a entrada da fase lenta)
function pCrownAt(x, cx, cy, R, P, r, flat = 1) {
  const cache = P._crowns || (P._crowns = {}), v = Math.floor(r(70) * 10), key = v + "," + R + "," + flat;
  let c = cache[key];
  if (!c) {
    const s = R * 2 + 8; c = cache[key] = document.createElement("canvas"); c.width = c.height = s;
    pCrown(c.getContext("2d"), s / 2, s / 2, R, P, k => rand(v * 91.7 + R * 13.1 + k), flat);
  }
  x.drawImage(c, Math.round(cx - c.width / 2), Math.round(cy - c.height / 2));
}
// árvores que não dependem dos vizinhos: 12 desenhos prontos por paleta, cada lugar sorteia um
const POLISH_SPRITE = new Set(["palm", "cactus", "gruta", "araucaria"]);
function pTreeSprite(x, tree, P, v, edge, tx, ty) {
  const cache = P._trees || (P._trees = {}), key = tree + v + (edge ? "e" : "");
  let c = cache[key];
  if (!c) {   // o quadrado da árvore fica em (16, 40) dentro de um canvas de 48x60
    c = cache[key] = document.createElement("canvas"); c.width = 48; c.height = 60;
    const g = c.getContext("2d"); g.translate(16, 40);
    POLISH_TREE[tree](g, 0, 0, P, k => rand(v * 77.3 + k + (edge ? 500 : 0)), edge, () => false);
  }
  x.drawImage(c, tx * TILE - 16, ty * TILE - 40);
}
const POLISH_TREE = {
  // copa comum: maior que o quadrado, posição e tamanho sorteados; tronco só na beira de baixo do bosque
  leafy(x, tx, ty, P, r, edge) {
    const cx = tx * TILE + 8 + Math.round((r(2) - .5) * 5), cy = ty * TILE + 6 + Math.round((r(3) - .5) * 4), R = 9 + Math.floor(r(4) * 3);
    if (edge) {
      x.fillStyle = OUTLINE; x.fillRect(cx - 3, cy + 3, 6, 10); x.fillRect(cx - 4, cy + 11, 8, 2);
      x.fillStyle = P.trunk; x.fillRect(cx - 2, cy + 4, 4, 8); x.fillRect(cx - 3, cy + 11, 6, 1);
      x.fillStyle = pMix(P.trunk, "#000000", .3); x.fillRect(cx + 1, cy + 4, 1, 8);
      x.fillStyle = "rgba(10,30,15,.4)"; x.fillRect(cx - 6, cy + 13, 13, 2);
    }
    pCrownAt(x, cx, cy, R, P, r);
  },
  // coqueiro: tronco curvo com anéis, copa de folhas compridas caindo em arco e cocos
  palm(x, tx, ty, P, r) {
    const s = r(1) < .5 ? 1 : -1, h = 17 + Math.floor(r(2) * 7), bx = tx * TILE + 8 + Math.round((r(3) - .5) * 4), by = ty * TILE + 15;
    pShadow(x, bx + s * 7, by, 9, 2.5);
    const tp = k => [bx + Math.round(s * (k * k) / (h * h / 6)), by - k];
    for (let k = 0; k <= h; k++) { const [px, py] = tp(k); x.fillStyle = OUTLINE; x.fillRect(px - 2, py, 4, 1); }
    for (let k = 0; k <= h; k++) { const [px, py] = tp(k); x.fillStyle = k % 3 ? P.trunk : pMix(P.trunk, "#000000", .3); x.fillRect(px - 1, py, 2, 1); x.fillStyle = pMix(P.trunk, "#ffffff", .25); x.fillRect(px - 1, py, 1, 1); }
    const [topx, topy] = tp(h), fr = [];
    for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI + (r(10 + k) - .5) * .4; fr.push([Math.cos(a), Math.sin(a) * .5, 8 + Math.floor(r(20 + k) * 4), .05 + r(30 + k) * .07]); }
    fr.push([-.3, .6, 6, .1], [.3, .6, 6, .1]);   // duas caindo para a frente
    const pts = ([dx, dy, L, dr]) => [...Array(L).keys()].map(k => [Math.round(topx + dx * (k + 1)), Math.round(topy + dy * (k + 1) + dr * (k + 1) * (k + 1))]);
    x.fillStyle = OUTLINE; fr.forEach(f => pts(f).forEach(([px, py]) => x.fillRect(px - 1, py - 1, 3, 3)));
    fr.forEach(f => pts(f).forEach(([px, py], k) => { x.fillStyle = k < 2 ? P.leaf2 : P.leaf; x.fillRect(px, py, 1, 1); if (k % 2) { x.fillStyle = P.leaf2; x.fillRect(px, py + 1, 1, 1); } x.fillStyle = P.leafHi; if (k % 3 === 1) x.fillRect(px, py - 1, 1, 1); }));
    x.fillStyle = OUTLINE; x.fillRect(topx - 3, topy - 1, 6, 4);
    x.fillStyle = "#6a4a1e"; x.fillRect(topx - 2, topy, 2, 2); x.fillRect(topx + 1, topy, 2, 2); x.fillStyle = "#8a6a2e"; x.fillRect(topx - 2, topy, 1, 1);
  },
  // sertão: mandacaru alto de braços (com luz de um lado e espinhos) ou árvore seca de galhos tortos
  cactus(x, tx, ty, P, r) {
    const bx = tx * TILE + 8 + Math.round((r(3) - .5) * 4), by = ty * TILE + 15;
    if (r(90) < .55) {
      const h = 14 + Math.floor(r(2) * 9), aL = Math.floor(h * (.4 + r(4) * .2)), aR = Math.floor(h * (.55 + r(5) * .2));
      pShadow(x, bx + 4, by, 7, 2);
      const col = (x0, y0, w, hh) => { x.fillStyle = OUTLINE; x.fillRect(x0 - 1, y0 - 1, w + 2, hh + 2); };
      const parts = [[bx - 2, by - h, 4, h], [bx - 7, by - aL - 2, 5, 3], [bx - 7, by - aL - 8, 3, 8], [bx + 2, by - aR - 2, 5, 3], [bx + 4, by - aR - 7, 3, 7]];
      parts.forEach(([a, b, c, d]) => col(a, b, c, d));
      parts.forEach(([a, b, c, d]) => { x.fillStyle = P.leaf; x.fillRect(a, b, c, d); x.fillStyle = P.leafHi; x.fillRect(a, b, 1, d); x.fillStyle = P.leaf2; x.fillRect(a + c - 1, b, 1, d); });
      x.fillStyle = "#f0e8c8"; for (let k = 2; k < h - 1; k += 3) { x.fillRect(bx - 3, by - h + k, 1, 1); x.fillRect(bx + 2, by - h + k + 1, 1, 1); }
      if (r(7) < .25) { x.fillStyle = r(8) < .5 ? "#f0f0e0" : "#e85a8a"; x.fillRect(bx - 1, by - h - 2, 2, 2); }
    } else {
      pShadow(x, bx + 3, by, 8, 2);
      const tw = pMix(P.trunk, "#000000", .15), top = [bx + Math.round((r(4) - .5) * 4), by - 9];
      pSeg(x, bx, by, top[0], top[1], 4, OUTLINE);
      const br = [...Array(4)].map((_, k) => { const a = -Math.PI / 2 + (k - 1.5) * .6 + (r(10 + k) - .5) * .4, L = 6 + r(20 + k) * 5; return [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L, a]; });
      br.forEach(([ex, ey]) => pSeg(x, top[0], top[1], ex, ey, 3, OUTLINE));
      br.forEach(([ex, ey, a], k) => { const tx2 = ex + Math.cos(a + (k % 2 ? .7 : -.7)) * 3, ty2 = ey + Math.sin(a + (k % 2 ? .7 : -.7)) * 3; pSeg(x, ex, ey, tx2, ty2, 2, OUTLINE); pSeg(x, ex, ey, tx2, ty2, 1, tw); });
      pSeg(x, bx, by, top[0], top[1], 2, P.trunk); br.forEach(([ex, ey]) => pSeg(x, top[0], top[1], ex, ey, 1, P.trunk));
      x.fillStyle = pMix(P.trunk, "#ffffff", .3); x.fillRect(bx - 1, by - 5, 1, 3);
    }
  },
  // cerrado: tronco torto de casca grossa e copa larga e achatada
  cerrado(x, tx, ty, P, r) {
    const s = r(1) < .5 ? 1 : -1, bx = tx * TILE + 8 + Math.round((r(3) - .5) * 3), by = ty * TILE + 15, mid = [bx + s * 2, by - 6], top = [bx - s, by - 11];
    pShadow(x, bx + 3, by, 10, 2.5);
    pSeg(x, bx, by, mid[0], mid[1], 5, OUTLINE); pSeg(x, mid[0], mid[1], top[0], top[1], 4, OUTLINE);
    pSeg(x, bx, by, mid[0], mid[1], 3, P.trunk); pSeg(x, mid[0], mid[1], top[0], top[1], 2, P.trunk);
    x.fillStyle = P.rock2; x.fillRect(bx, by - 3, 1, 1); x.fillRect(mid[0] - 1, mid[1] + 1, 1, 1);
    pCrownAt(x, top[0], top[1] - 3, 11 + Math.floor(r(4) * 3), P, r, .55);
  },
  // araucária: tronco reto e alto, galhos em andares e a copa em taça larga no alto
  araucaria(x, tx, ty, P, r, edge) {
    const bx = tx * TILE + 8 + Math.round((r(3) - .5) * 4), by = ty * TILE + 15, h = (edge ? 20 : 14) + Math.floor(r(2) * 8), w = (edge ? 10 : 13) + Math.floor(r(4) * 4);
    pShadow(x, bx + 5, by, 9, 2.5);
    x.fillStyle = OUTLINE; x.fillRect(bx - 2, by - h, 4, h + 1); x.fillStyle = P.trunk; x.fillRect(bx - 1, by - h, 2, h); x.fillStyle = pMix(P.trunk, "#ffffff", .25); x.fillRect(bx - 1, by - h, 1, h);
    const tier = (ty0, rx, ry, cup) => {
      fillEllipse(x, bx, ty0, rx + 1, ry + 1, OUTLINE); fillEllipse(x, bx, ty0, rx, ry, P.leaf2); fillEllipse(x, bx, ty0 - ry * .4, rx - 1, ry * .6, P.leaf);
      fillEllipse(x, bx - rx * .35, ty0 - ry * .6, rx * .35, ry * .3, P.leafHi);
      if (cup) for (const d of [-1, 1]) { x.fillStyle = OUTLINE; x.fillRect(bx + d * (rx - 1) - 1, ty0 - ry - 3, 3, 4); x.fillStyle = P.leaf; x.fillRect(bx + d * (rx - 1), ty0 - ry - 2, 1, 3); }
      x.fillStyle = P.leaf2; for (let k = -rx + 2; k < rx - 1; k += 3) x.fillRect(bx + k, ty0 + Math.floor(ry * .3), 1, 1);
    };
    if (edge) tier(by - h * .45, Math.round(w * .45), 1.6, false);
    tier(by - h * .72, Math.round(w * .72), 2, false);
    tier(by - h, w, 3, true);
  },
  // gruta: uma a três estalagmites de pedra, claras de um lado, com pedrisco no pé
  gruta(x, tx, ty, P, r) {
    const n = r(1) < .6 ? 1 : 2, base = ty * TILE + 15;
    pShadow(x, tx * TILE + 10, base, 8, 2, .3);
    const cones = [...Array(n)].map((_, k) => [tx * TILE + 3 + Math.floor(r(10 + k) * 10), 7 + Math.floor(r(20 + k) * (k ? 8 : 12)), 2 + Math.floor(r(30 + k) * 3)]).sort((a, b) => b[1] - a[1]);
    cones.forEach(([cx, h, w]) => {
      for (let k = 0; k < h; k++) {
        const hw = Math.max(.5, w * (k + 1) / h), y = base - h + k, L = Math.round(cx - hw), R = Math.round(cx + hw);
        x.fillStyle = OUTLINE; x.fillRect(L - 1, y, R - L + 2, 1);
        x.fillStyle = P.rock2; x.fillRect(L, y, R - L, 1);
        x.fillStyle = pMix(P.rock, P.rock2, .4); x.fillRect(L, y, Math.max(1, Math.round((R - L) * .55)), 1);
        x.fillStyle = P.rock; x.fillRect(L, y, 1, 1);
      }
      x.fillStyle = "#ffffff"; x.fillRect(cx, base - h, 1, 1);
    });
    x.fillStyle = P.rock2; x.fillRect(tx * TILE + 2 + Math.floor(r(40) * 10), base, 2, 1); x.fillStyle = P.rock; x.fillRect(tx * TILE + 3 + Math.floor(r(41) * 10), base - 1, 1, 1);
  },
  // duna: crista contínua que atravessa os quadrados vizinhos (altura pela posição no mundo), face de sol em cima,
  // crista clara, face de sombra embaixo e marcas do vento; afina nas pontas quando o vizinho não é duna
  dune(x, tx, ty, P, r, edge, nb) {
    const ox = tx * TILE, oy = ty * TILE, L = nb(-1, 0), R = nb(1, 0), shade = pMix(P.leaf2, "#000000", .12);
    const c = P._dune || (P._dune = {top: pRgba(P.leaf, .55), foot: pRgba(shade, .45), wind: pRgba(P.leaf2, .7)});
    for (let gx = ox; gx < ox + TILE; gx++) {
      const end = Math.min(L ? 99 : gx - ox + 1, R ? 99 : ox + TILE - gx), k = Math.min(1, end / 6);   // 0..1: afina nas pontas soltas
      if (k <= 0) continue;
      const ry = oy + 8 + Math.round(Math.sin(gx / 11 + ty * 1.7) * 2.2 + Math.sin(gx / 4.3 + ty) * .6), up = Math.round(5 * k), dn = Math.round(6 * k);
      x.fillStyle = c.top; x.fillRect(gx, ry - up, 1, 1);
      x.fillStyle = P.leaf; x.fillRect(gx, ry - up + 1, 1, Math.max(0, up - 1));
      x.fillStyle = P.leafHi; x.fillRect(gx, ry, 1, 1);
      x.fillStyle = shade; x.fillRect(gx, ry + 1, 1, Math.max(0, dn - 2));
      x.fillStyle = c.foot; x.fillRect(gx, ry + dn - 1, 1, 2);
      if ((gx + ty * 3) % 7 === 0 && up > 3) { x.fillStyle = c.wind; x.fillRect(gx, ry - 3, 3, 1); }   // marca do vento na face de sol
    }
    if (r(5) < .25) { const cx = ox + 4 + Math.floor(r(6) * 8), cy = oy + 6; x.fillStyle = P.tall; x.fillRect(cx, cy - 1, 1, 2); x.fillRect(cx + 2, cy, 1, 2); x.fillStyle = P.tallHi; x.fillRect(cx + 1, cy - 2, 1, 2); }
  }
};

/* ---------- por cima da fase, todo quadro (exDraw): a luz de cada bioma ---------- */
// mata fechada (muita árvore de copa): fachos de sol; campo, areia e cidade: só nuvem e o tom quente; gruta: escuro e frio
function polishLook() {
  if (EX.pLook && EX.pLook.zone === EX.zone) return EX.pLook;
  const P = EX.pal, biome = polishBiome(P), tree = polishTree(P);
  let t = 0, n = 0; EX.rows.forEach(row => { for (const ch of row) { n++; if (ch === "T") t++; } });
  return EX.pLook = {zone: EX.zone, biome, rays: tree === "leafy" || tree === "araucaria" ? t / n > .22 : false, clouds: biome !== "gruta", vig: null};
}
function polishOverlay(x, cx, cy, now) {
  if (!polishOn(EX.zone) || EX.night) return;
  const L = polishLook();
  x.save();
  if (L.clouds) for (let k = 0; k < 3; k++) {   // sombra de nuvem: manchas grandes e suaves presas ao mundo
    const wx = ((now / 40 + k * 520) % (EX.map.width + 600)) - 300, wy = 120 + k * 260 + Math.sin(now / 9000 + k) * 40;
    const sx = wx - cx, sy = (wy % (EX.map.height + 200)) - cy;
    if (sx < -260 || sx > VIEW_W + 260 || sy < -200 || sy > VIEW_H + 200) continue;
    const g = x.createRadialGradient(sx, sy, 10, sx, sy, 210); g.addColorStop(0, `rgba(10,30,40,${L.biome === "areia" ? .1 : .16})`); g.addColorStop(1, "rgba(10,30,40,0)");
    x.fillStyle = g; x.fillRect(sx - 220, sy - 220, 440, 440);
  }
  if (L.rays) {   // fachos de sol em diagonal, respirando
    x.globalCompositeOperation = "screen";
    for (let k = 0; k < 4; k++) {
      const base = ((k * 211 - cx * .35) % (VIEW_W + 300) + VIEW_W + 300) % (VIEW_W + 300) - 150, a = .05 + .035 * Math.sin(now / 1700 + k * 1.9);
      const g = x.createLinearGradient(0, 0, 0, VIEW_H); g.addColorStop(0, `rgba(255,236,170,${(a * 1.6).toFixed(3)})`); g.addColorStop(1, "rgba(255,236,170,0)");
      x.fillStyle = g; x.beginPath(); x.moveTo(base, 0); x.lineTo(base + 46 + k * 9, 0); x.lineTo(base + 46 + k * 9 - VIEW_H * .55, VIEW_H); x.lineTo(base - VIEW_H * .55, VIEW_H); x.fill();
    }
    x.globalCompositeOperation = "source-over";
  }
  // poeira no ar: brilhando na luz (na gruta, poeira fria e lenta)
  const dust = L.biome === "gruta" ? "#c8d8ff" : "#fff6c8", nd = L.biome === "cidade" ? 10 : 26;
  for (let k = 0; k < nd; k++) {
    const sx = ((rand(k * 3.1) * VIEW_W + now / (60 + k * 3)) % VIEW_W), sy = (rand(k * 7.7) * VIEW_H + Math.sin(now / 1300 + k) * 12 - now / (L.biome === "gruta" ? 400 : 140)) % VIEW_H;
    x.globalAlpha = .2 + .35 * Math.max(0, Math.sin(now / 500 + k * 2.3)); x.fillStyle = dust;
    x.fillRect(Math.round(sx), Math.round((sy + VIEW_H) % VIEW_H), 1, 1);
  }
  x.globalAlpha = 1;
  // tom do bioma e vinheta nas bordas (guardado pelo tamanho da tela)
  if (!L.vig || L.vig.w !== VIEW_W || L.vig.h !== VIEW_H) {
    const c = document.createElement("canvas"); c.width = VIEW_W; c.height = VIEW_H; const v = c.getContext("2d");
    const tone = {verde: ["rgba(255,200,90,.10)", "rgba(20,40,80,.08)", .42], seco: ["rgba(255,170,60,.12)", "rgba(80,40,20,.06)", .32], areia: ["rgba(255,230,160,.10)", "rgba(40,90,120,.06)", .28],
      cidade: ["rgba(255,210,150,.08)", "rgba(30,40,70,.10)", .34], gruta: ["rgba(40,60,120,.12)", "rgba(10,10,30,.2)", .62]}[L.biome];
    const top = v.createLinearGradient(0, 0, 0, VIEW_H); top.addColorStop(0, tone[0]); top.addColorStop(.5, "rgba(0,0,0,0)"); top.addColorStop(1, tone[1]);
    v.fillStyle = top; v.fillRect(0, 0, VIEW_W, VIEW_H);
    const g = v.createRadialGradient(VIEW_W / 2, VIEW_H / 2, Math.min(VIEW_W, VIEW_H) * .35, VIEW_W / 2, VIEW_H / 2, Math.max(VIEW_W, VIEW_H) * .72);
    g.addColorStop(0, "rgba(8,16,14,0)"); g.addColorStop(1, `rgba(8,16,14,${tone[2]})`); v.fillStyle = g; v.fillRect(0, 0, VIEW_W, VIEW_H);
    L.vig = {w: VIEW_W, h: VIEW_H, c};
  }
  x.drawImage(L.vig.c, 0, 0);
  x.restore();
}
// copa balançando: um brilho que corre pela borda de cima de algumas copas comuns (no lugar dos dois pontinhos antigos)
function polishSway(x, tx, ty, sx, sy, now) {
  if (polishTree(EX.pal) !== "leafy" || (tx * 5 + ty * 3) % 4) return;
  const r = k => rand(tx * 23.9 + ty * 61.3 + k), ox = Math.round((r(2) - .5) * 5), oy = Math.round((r(3) - .5) * 4), sw = Math.round(Math.sin(now / 700 + tx * .9 + ty * .4) * 1.5);
  x.fillStyle = "rgba(200,255,150,.55)"; x.fillRect(sx + 4 + ox + sw, sy + oy, 3, 1); x.fillRect(sx + 9 + ox + sw, sy + 2 + oy, 2, 1);
}
// espuma da margem: pontinhos claros correndo na beira da água (exDraw, no "~" que encosta em terra)
function polishShore(x, tx, ty, sx, sy, now) {
  const land = (dx, dy) => { const n = stageTile(tx + dx, ty + dy); return n && !"~=UB".includes(n); };
  x.fillStyle = "rgba(255,255,255,.7)";
  const o = Math.floor(now / 160 + tx * 3 + ty * 5) % 16;
  if (land(0, 1)) { x.fillRect(sx + o, sy + 14, 2, 1); x.fillRect(sx + (o + 8) % 16, sy + 13, 1, 1); }
  if (land(0, -1)) { x.fillRect(sx + (16 - o) % 16, sy + 4, 2, 1); }
  if (land(-1, 0)) x.fillRect(sx + 1, sy + o, 1, 2);
  if (land(1, 0)) x.fillRect(sx + 14, sy + (o + 5) % 16, 1, 2);
}

// noite: brilho quente das fogueiras (por cima do escuro, que só abre um buraco sem cor) e a lua piscando na água
function polishNight(x, cx, cy, now) {
  if (!POLISH) return;
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE), [nx, ny] = viewTiles();
  x.save();
  for (let ty = t0y - 3; ty <= t0y + ny + 3; ty++) for (let tx = t0x - 3; tx <= t0x + nx + 3; tx++) {
    const ch = stageTile(tx, ty), px = tx * TILE + 8 - cx, py = ty * TILE + 8 - cy;
    if (ch === "F") {
      const r = 44 + Math.sin(now / 90 + tx) * 3 + Math.sin(now / 37 + ty) * 1.5, g = x.createRadialGradient(px, py, 2, px, py, r);
      g.addColorStop(0, "rgba(255,120,40,.26)"); g.addColorStop(.45, "rgba(255,90,30,.1)"); g.addColorStop(1, "rgba(255,90,20,0)");
      x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    } else if (ch === "~" && (tx * 7 + ty * 11) % 5 === 0) {
      const a = Math.max(0, Math.sin(now / 600 + tx * 1.7 + ty * 2.3));
      if (a > .2) { x.fillStyle = `rgba(200,220,255,${(a * .8).toFixed(2)})`; x.fillRect(Math.round(px - 3 + (tx % 3) * 2), Math.round(py - 2 + (ty % 2) * 3), 3, 1); x.fillRect(Math.round(px - 2 + (tx % 3) * 2), Math.round(py - 3 + (ty % 2) * 3), 1, 1); }
    }
  }
  // luar: claridade fria vindo de cima, que some para baixo
  x.globalCompositeOperation = "screen";
  const g = x.createLinearGradient(0, 0, VIEW_W * .4, VIEW_H); g.addColorStop(0, "rgba(140,170,255,.10)"); g.addColorStop(.6, "rgba(140,170,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, VIEW_W, VIEW_H);
  x.restore();
}

/* ---------- batalha: gestos de espera dos bichos (gfx/actors.js, estado "fidget") ---------- */
// sorteia um gesto pelo jeito de mexer da espécie (MOTION); "" = fica parado desta vez
function polishFidget(motion, boss) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  if (motion === "hover") return pick(["mergulho", "sacode", ""]);
  if (motion === "swim" || motion === "sway") return pick(["sacode", "passo", ""]);
  return pick(boss ? ["pisada", "ameaca", "ameaca", "fareja", "sacode"] : ["fareja", "pisada", "ameaca", "sacode", "passo", "fareja"]);
}
// cada gesto ao longo do tempo: pose do quadro (idle/crouch/attack), deslocamento, pulo, poeira e fim
function polishFidgetFrame(act, el) {
  const r = {pose: "idle", lift: 0, ox: 0, done: false};
  if (act === "fareja") {   // abaixa a cabeça cheirando o chão, com tremidinha
    r.pose = el < 900 ? "crouch" : "idle"; r.ox = el < 900 && Math.floor(el / 120) % 2 ? -1 : 0; r.done = el > 1000;
  } else if (act === "pisada") {   // levanta e bate as patas, levantando poeira
    r.lift = el < 160 ? Math.round(el / 60) : el < 220 ? 0 : el < 360 ? Math.round((el - 220) / 50) : 0; r.dust = el > 160; r.done = el > 520;
  } else if (act === "ameaca") {   // finta: agacha, mostra o golpe e volta
    r.pose = el < 260 ? "crouch" : el < 420 ? "attack" : "idle"; r.ox = el >= 260 && el < 420 ? -3 : 0; r.done = el > 640;
  } else if (act === "sacode") {   // sacode o corpo
    r.ox = el < 420 ? (Math.floor(el / 50) % 2 ? 1 : -1) : 0; r.done = el > 480;
  } else if (act === "passo") {   // dá um passo para a frente, espera e volta
    r.ox = el < 200 ? -Math.round(el / 70) : el < 900 ? -3 : el < 1100 ? -3 + Math.round((el - 900) / 70) : 0; r.dy = el < 1100 ? Math.floor(el / 100) % 2 : undefined; r.done = el > 1120;
  } else if (act === "mergulho") {   // quem voa: dá uma descida rápida e sobe
    r.lift = -Math.round(Math.sin(Math.min(1, el / 600) * Math.PI) * 5); r.done = el > 620;
  } else r.done = true;
  return r;
}

/* ---------- exploração: moradores com jeito próprio (explore.js, drawNpc) ---------- */
// jeito pelo lugar do morador: dança no ritmo (a ginga de sempre), conversa gesticulando, fica de mão na cintura
// olhando em volta, ou acena para quem passa; perto do Rhanon, todo mundo sorri e acena quando ele chega
const NPC_WAYS = ["danca", "conversa", "cintura", "danca", "acena"];
function polishNpcPose(s, now, beat) {
  const way = NPC_WAYS[(s.tx * 7 + s.ty * 3) % NPC_WAYS.length], h = EX.hero, near = Math.hypot(h.x - s.x, h.y - s.y) < 40;
  if (near && !s._near) s._near = now; else if (!near) s._near = 0;
  const blink = (now / 1000 + s.tx * .7) % 3.6 < .12 ? "blink" : undefined;
  if (s._near && now - s._near < 1400) {   // acabou de chegar: aceno com a mão alta, sorrindo
    const up = Math.floor((now - s._near) / 180) % 2;
    return {lh: [7, 31], rh: up ? [27, 15] : [29, 19], face: "happy", dy: 0};
  }
  if (way === "danca") return null;   // a ginga de explore.js
  const slow = Math.floor(now / 700 + s.tx) % 2;
  if (way === "conversa") {   // mãos mexendo como quem conta um causo
    const g = Math.floor(now / 420 + s.ty) % 4;
    return {lh: [[6, 27], [8, 25], [7, 30], [9, 26]][g], rh: [[25, 30], [26, 26], [24, 25], [25, 29]][g], face: near ? "happy" : blink, dy: slow};
  }
  if (way === "cintura") return {lh: [10, 30], rh: [22, 30], face: near ? "happy" : blink, dy: Math.floor(now / 1200 + s.tx) % 2, lean: Math.floor(now / 2600 + s.ty) % 3 - 1};
  // acena: de tempo em tempo levanta a mão para quem passa
  const wave = (now / 1000 + s.tx) % 6 < 1.2;
  return {lh: [7, 31], rh: wave ? (Math.floor(now / 200) % 2 ? [27, 15] : [29, 19]) : [25, 31], face: near || wave ? "happy" : blink, dy: slow};
}
// balãozinho branco com contorno acima da cabeça: "!" na chegada do Rhanon, nota na dança com música, "..." de vez em quando
function polishNpcBubble(x, s, sx, top, now) {
  if (REDUCE) return;
  const way = NPC_WAYS[(s.tx * 7 + s.ty * 3) % NPC_WAYS.length], cyc = (now / 1000 + s.tx * 1.3 + s.ty * .7) % 9;
  let g = null;
  if (s._near && now - s._near < 1100) g = "bang";
  else if (cyc < 1.8) g = way === "danca" && MUS.beat() != null ? "note" : way === "conversa" ? "dots" : null;
  if (!g) return;
  const bx = sx + 3, by = top - 9 - (Math.floor(now / 300) % 2);
  x.fillStyle = OUTLINE; x.fillRect(bx - 1, by - 1, 11, 9); x.fillRect(bx, by + 8, 2, 2);
  x.fillStyle = "#ffffff"; x.fillRect(bx, by, 9, 7); x.fillRect(bx + 1, by + 7, 1, 1);
  if (g === "bang") glyphP(x, "bang", "#e5001c", bx + 4, by + 1);
  else if (g === "note") glyphP(x, "note", "#3a6ab8", bx + 3, by + 1);
  else { x.fillStyle = OUTLINE; const k = Math.floor(now / 300) % 4; for (let d = 0; d < Math.min(3, k + 1); d++) x.fillRect(bx + 2 + d * 2, by + 4, 1, 1); }
}

/* ---------- batalha: cursor que desliza até o comando escolhido ---------- */
function polishCursor() {
  if (!POLISH) return;
  const box = document.querySelector(".cmds-box"), cur = $("cmdCursor"), b = document.activeElement;
  if (!box || !cur) return;
  const list = $("cmds");
  if (!b || !b.classList || !b.classList.contains("cmd") || !list.contains(b) || b.getAttribute("aria-disabled") === "true" || list.classList.contains("espera")) { cur.classList.remove("on"); return; }
  // posição de layout (offset), não a da tela: o botão pode estar no meio da animação de entrada
  let ox = 0, oy = 0; for (let el = b; el && el !== box; el = el.offsetParent) { ox += el.offsetLeft; oy += el.offsetTop; }
  oy -= list.scrollTop;
  cur.style.transform = `translate(${ox - 22}px, ${oy + b.offsetHeight / 2 - 11}px)`;
  cur.classList.add("on");
}
if (POLISH) addEventListener("resize", () => polishCursor());
// pancada no comando confirmado e folhinhas voando dele
function polishConfirm(b) {
  if (!POLISH || !b) return;
  b.classList.remove("go"); void b.offsetWidth; b.classList.add("go");
  const r = b.getBoundingClientRect();
  for (let k = 0; k < 8; k++) {
    const f = document.createElement("i"); f.className = "cmd-leaf";
    const a = (k / 8) * Math.PI * 2 + Math.random() * .5, d = 40 + Math.random() * 40;
    f.style.left = r.left + r.width / 2 + "px"; f.style.top = r.top + r.height / 2 + "px";
    f.style.setProperty("--dx", Math.cos(a) * d + "px"); f.style.setProperty("--dy", Math.sin(a) * d * .7 + "px"); f.style.setProperty("--rot", Math.round(Math.random() * 540 - 270) + "deg");
    f.style.background = ["#5fbe72", "#ffd23a", "#3f9a5c", "#f6e9c4"][k % 4];
    document.body.appendChild(f); setTimeout(() => f.remove(), 650);
  }
}
// rastro do dano: a barra clara fica para trás e alcança a vida de verdade depois de um tempinho
function polishGhost(barId, pct) {
  if (!POLISH) return;
  const bar = $(barId) && $(barId).parentElement; if (!bar) return;
  let g = bar.querySelector(".ghost"); if (!g) { g = document.createElement("b"); g.className = "ghost"; bar.prepend(g); g.style.width = pct + "%"; }
  const cur = parseFloat(g.style.width) || 0;
  if (pct >= cur) { g.style.transition = "none"; g.style.width = pct + "%"; }   // curou: o rastro acompanha na hora
  else { g.style.transition = ""; g.style.width = pct + "%"; }
}
