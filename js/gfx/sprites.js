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
// desenho em código: traço novo (gfx/beasts.js) > emoji provisório
function codeAnimalSprite(a) {
  const rig = beastFrame(a.id), c = document.createElement("canvas"), x = c.getContext("2d");
  if (rig) {   // traço novo (gfx/beasts.js): cópia do quadro parado, em resolução 2x
    c.width = rig.width; c.height = rig.height; x.drawImage(rig, 0, 0);
    Object.assign(c.dataset, rig.dataset); c.dataset.rig = beastId(a.id);
  } else {   // bicho ainda sem desenho: emoji provisório
    c.width = c.height = 20;
    x.font = "16px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(a.emoji, 10, 11);
  }
  c.className = "spr"; c.style.setProperty("--n", c.width / (+c.dataset.scale || 1) * (a.boss ? 1.35 : 1));
  if (a.tint) c.style.filter = a.tint;
  return c;
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
// haste da lança: madeira clara com contorno escuro ao lado (a mesma em exploração, batalha e tela inicial)
const SPEAR_WOOD = "#d9b25a";
function spearShaft(ctx, x0, y0, x1, y1) {
  const steep = Math.abs(x1 - x0) < Math.abs(y1 - y0), ox = steep ? 1 : 0, oy = steep ? 0 : 1;
  lineP(ctx, x0 + ox, y0 + oy, x1 + ox, y1 + oy, "#1a2418");
  lineP(ctx, x0, y0, x1, y1, SPEAR_WOOD);
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
