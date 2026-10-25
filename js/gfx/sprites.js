/* Montagem dos sprites em canvas: bichos, entrevistador, Rhanon e utilidades de pixel. */
function spriteRaw(rows, pal, W) {
  const c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = W; c.height = rows.length; c.className = "spr"; c.style.setProperty("--n", W);
  rows.forEach((r, y) => [...r.slice(0, W)].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
  return c;
}
function interviewerSprite() { return sprite(INTERVIEWER, PAL_BUS, 14); }
function workerSprite() {
  const pal={...PAL_H,j:"#26364a",c:"#f4ecd8",b:"#315b91",x:"#101820"};
  const c=sprite(WORKER,pal,14),x=c.getContext("2d");
  if(G?.betterJob){x.fillStyle=pal.j;x.fillRect(3,7,8,5);x.fillStyle=pal.q;x.fillRect(6,7,2,4);x.fillStyle=pal.x;x.fillRect(4,3,2,1);x.fillRect(8,3,2,1);}
  else if(G?.job){x.fillStyle=pal.j;x.fillRect(3,7,8,5);x.fillStyle=pal.c;x.fillRect(6,7,2,4);x.fillStyle=pal.q;x.fillRect(6,7,1,4);}
  return c;
}
// bicho na batalha: arte em imagem (data/art.js) se houver, senão o desenho em código
function animalSprite(a) {
  const own = artCanvas("animal/" + a.id), c = own || (ART[a.id] && artCanvas("animal/" + ART[a.id]));
  if (!c) return codeAnimalSprite(a);
  c.className = "spr"; c.style.setProperty("--n", c.width / c.dataset.scale * (a.boss ? 1.35 : 1));
  if (!own && a.tint) c.style.filter = a.tint;   // chefe usando a arte do bicho base
  return c;
}
// desenho em código: SPR (formas) > rows (texto) > emoji provisório
function codeAnimalSprite(a) {
  let c; const k = ART[a.id] || a.id;
  if (SPR[k]) c = artSprite(k);
  else if (a.rows) c = sprite(a.rows, a.palette, Math.max(...a.rows.map(r => r.length)));
  else {
    c = document.createElement("canvas"); const x = c.getContext("2d");
    c.width = c.height = 20; c.className = "spr"; c.style.setProperty("--n", 20);
    x.font = "16px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(a.emoji, 10, 11);
  }
  if (a.boss) c.style.setProperty("--n", c.width * 1.35);
  if (a.tint) c.style.filter = a.tint;
  return c;
}
function artSprite(k) {
  const d = SPR[k], c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = d.w; c.height = d.h; c.className = "spr"; c.style.setProperty("--n", d.w);
  const g = Array.from({length: d.h}, () => Array(d.w).fill(null));
  const put = (px, py, col) => { if (px >= 0 && py >= 0 && px < d.w && py < d.h) g[py][px] = col; };
  d.s.forEach(([t, ...a]) => {
    if (t === "e") { const [cx, cy, rx, ry, col] = a; for (let y = 0; y < d.h; y++) for (let i = 0; i < d.w; i++) if (((i - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(i, y, col); }
    else if (t === "r") { const [rx, ry, w, h, col] = a; for (let y = ry; y < ry + h; y++) for (let i = rx; i < rx + w; i++) put(i, y, col); }
    else if (t === "p") a[0].forEach(([px, py]) => put(px, py, a[1]));
    else if (t === "s") a[0].forEach(([px, py]) => { put(px, py, a[1]); put(px + 1, py, a[1]); put(px, py + 1, a[1]); put(px + 1, py + 1, a[1]); });
  });
  const out = g.map(r => r.slice());
  for (let y = 0; y < d.h; y++) for (let i = 0; i < d.w; i++) if (!g[y][i]) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (g[y + dy] && g[y + dy][i + dx]) { out[y][i] = "#1a0f0a"; break; }
  out.forEach((r, y) => r.forEach((col, i) => { if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } }));
  return shadeCanvas(c);
}
function sprite(rows, pal, W) { return shadeCanvas(spriteRaw(rows, pal, W)); }
function shadeCanvas(c) {
  const x = c.getContext("2d"), w = c.width, h = c.height, d = x.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a);
  const edge = (px, py) => { if (py < 0 || py >= h) return true; const j = (py * w + px) * 4; return !a[j + 3] || (a[j] < 40 && a[j + 1] < 36 && a[j + 2] < 48); };
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    if (edge(i, y)) continue;
    const k = edge(i, y + 1) ? .78 : edge(i, y - 1) ? 1.18 : 1;
    if (k !== 1) { const j = (y * w + i) * 4; for (let n = 0; n < 3; n++) o[j + n] = Math.min(255, a[j + n] * k); }
  }
  d.data.set(o); x.putImageData(d, 0, 0); return c;
}
/* ---------- montagem do Rhanon ---------- */
function heroParts(noWeapon = false) {
  const o = G?.betterJob ? "blazer" : G?.job ? "social" : "tribo", d = RH_OUT[o], pal = {...RH.base}, eq = G?.equip || {legs: "tanga", torso: null};
  for (const k in d) pal[k] = RH.base[d[k]] || d[k];
  const head = RH.head.slice(); let torso = RH.torso.slice(), short = false;
  if (o !== "tribo") head[6] = head[6].replace(/g/g, "h");
  else {
    const T = EQUIP.torso[eq.torso], L = EQUIP.legs[eq.legs] || EQUIP.legs.tanga;
    if (T) {
      pal.c = T.color; pal.C = T.shade;
      torso = torso.map((r, y) => y > 5 ? r : [...r].map((ch, i) => ch === "r" ? "c" : "cCw".includes(ch) ? (i < 5 || i > 14 ? (ch === "C" ? "S" : "s") : ch === "w" ? "c" : ch) : ch).join(""));
    }
    if (L.color) { pal.q = L.color; pal.Q = L.shade; short = true; [6, 7].forEach(i => torso[i] = torso[i].replace(/c/g, "q").replace(/C/g, "Q")); }
    else [6, 7].forEach(i => torso[i] = torso[i].replace(/c/g, "t").replace(/C/g, "T"));
  }
  const glasses = o === "blazer";
  if (glasses) { head[11] = ".khhs" + "x".repeat(10) + "shhk."; head[12] = ".khhsxwxxxxxwxxshhk."; }
  return {head, torso, pal, short, glasses, weapon: !noWeapon};
}
// Rhanon de costas (batalha e exploração andando para cima): o rosto vira cabelo e a pintura/gravata do peito some
function heroBackParts(parts) {
  return {...parts, back: true,
    head: parts.head.map((r, i) => i >= 7 && i <= 14 ? r.replace(/[sewrmx]/g, "h") : r),
    torso: parts.torso.map((r, i) => i <= 5 ? r.replace(/r/g, "c") : r)};
}
// arco atravessado nas costas (sprite de 20x28 visto de trás)
function drawBowOnBack(ctx) {
  for (let k = 0; k <= 11; k++) { const b = Math.round(Math.sin(k / 11 * Math.PI) * 2); pxl(ctx, 4 + k - b, 14 + k + b, "#9c6339"); }
  lineP(ctx, 4, 14, 15, 25, "#f4ecd8");
  pxl(ctx, 4, 14, "#1b1a24"); pxl(ctx, 15, 25, "#1b1a24");
}
function legsFor(parts, pose) {
  const rows = LEGPOSE[pose] || LEGPOSE.stand;
  return parts.short ? rows.map((r, i) => i < 2 ? r.replace(/p/g, "q").replace(/P/g, "Q") : r) : rows;
}
// desenha o Rhanon 20x28 em (ox, oy): o = {legs, dy, lean, face}
function drawHero(ctx, parts, o, ox = 0, oy = 0) {
  const pal = parts.pal;
  const put = (rows, y0, dx = 0) => rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]; if (ch === "." || !pal[ch]) continue;
      ctx.fillStyle = pal[ch]; ctx.fillRect(ox + i + dx, oy + y0 + y, 1, 1);
    }
  });
  const legs = legsFor(parts, o.legs || "stand");
  put(legs, 28 - legs.length);
  const dy = o.legs === "sit" ? 2 : (o.dy || 0);
  put(parts.torso, 16 + dy);
  const face = !parts.glasses && !parts.back && o.face && FACE[o.face];
  put(parts.head.map((r, i) => (face && face[i]) || r), dy, o.lean || 0);
}
// Rhanon parado, como imagem estática
function heroSprite(noWeapon = false) {
  const parts = heroParts(noWeapon), c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = 20; c.height = 28; c.className = "spr"; c.style.setProperty("--n", 20);
  drawHero(x, parts, {legs: "stand"});
  shadeCanvas(c);
  if (!noWeapon) { x.fillStyle = "#7a4a1e"; x.fillRect(19, 2, 1, 26); x.fillStyle = "#cfd8dc"; x.fillRect(19, 0, 1, 2); }
  return c;
}

/* ---------- utilidades de desenho ---------- */
function pxl(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
function lineP(ctx, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) pxl(ctx, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
}
function glyphP(ctx, name, color, gx, gy) {
  ctx.fillStyle = color;
  GLYPH[name].forEach((row, y) => [...row].forEach((c, i) => { if (c === "1") ctx.fillRect(Math.round(gx) + i, Math.round(gy) + y, 1, 1); }));
}
// silhueta branca (piscar de dano)
function whiteOf(src) {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  return c;
}
