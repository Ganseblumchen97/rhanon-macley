/* Rhanon (e a gente da aldeia) no estilo "recorte com contorno": o corpo é montado com formas a partir de
   uma POSE (pés, mãos, inclinação, rosto, arma) e de um VISUAL (cores, roupa, cabelo, enfeites); um passo
   automático desenha o contorno escuro por fora e entre as partes.
   Base 32x44 pixels; scale desenha já na resolução final (0.75 = 24x33, usado na exploração).
   rigCanvas(view, pose, look, scale) -> canvas;  view = "front" (de frente) ou "back" (de costas). */
const RIG_W = 32, RIG_H = 44, RIG_K = "#1a1426";
const RIG_PAL = {h: "#2a2238", H: "#4d4170", s: "#d0925a", S: "#99603a", g: "#3fb35f", G: "#237a40", r: "#e2363d",
  t: "#a0663a", T: "#6b4126", w: "#f6eedb", p: SPEAR_WOOD, P: "#a9823f", m: "#e6edf0", b: "#9c6339", f: "#7a4a1e"};
const FLAMES = [["#d62828", "#f2740c", "#ffd23a"], ["#f2740c", "#ffd23a", "#fff3a0"], ["#d62828", "#ffd23a", "#f2740c"]];

/* ---------- grade de desenho: cada pixel guarda cor e "parte" (o contorno separa partes) ---------- */
function rigGrid(S, W = RIG_W, H = RIG_H) {   // W/H: tamanho base (outros desenhos, como bichos, podem ser maiores)
  const w = Math.round(W * S), h = Math.round(H * S);
  const col = Array.from({length: h}, () => Array(w).fill(null)), grp = Array.from({length: h}, () => Array(w).fill(0));
  let gid = 1;
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) { col[y][x] = c; grp[y][x] = gid; } };
  const d = {
    part() { gid++; return d; },
    ellipse(cx, cy, rx, ry, c, dark, k = .45) {   // sombra no lado de baixo/direito
      cx *= S; cy *= S; rx *= S; ry *= S;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry;
        if (u * u + v * v <= 1) put(x, y, dark && u * .7 + v * .7 > k ? dark : c);
      }
      return d;
    },
    poly(pts, c, dark, cut) {   // sombra à direita de x = cut
      pts = pts.map(([x, y]) => [x * S, y * S]);
      const ys = pts.map(q => q[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++)
          put(x, y, dark && cut !== undefined && x >= cut * S ? dark : c);
      }
      return d;
    },
    limb(x0, y0, x1, y1, wd, c, dark) {   // braço/perna/haste com espessura; sombra no lado de baixo
      x0 *= S; y0 *= S; x1 *= S; y1 *= S; wd = Math.max(1, Math.round(wd * S));
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) || 1, nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        for (let o = -wd / 2 + .5; o <= wd / 2 - .5 + .01; o++) put(x + nx / l * o, y + ny / l * o, dark && wd > 2 && o > wd / 2 - 1.5 ? dark : c);
      }
      return d;
    },
    dots(list, c) { list.forEach(([x, y]) => put(x * S, y * S, c)); return d; },
    rect(x, y, rw, rh, c) {
      const X = Math.round(x * S), Y = Math.round(y * S), RW = Math.max(1, Math.round(rw * S)), RH = Math.max(1, Math.round(rh * S));
      for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) put(X + i, Y + j, c);
      return d;
    },
    canvas() {
      const out = col.map(r => r.slice());
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (col[y][x] === null) {   // contorno por fora
          if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => col[y + dy]?.[x + dx] && col[y + dy][x + dx] !== RIG_K)) out[y][x] = RIG_K;
        } else if (col[y][x] !== RIG_K && [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => grp[y + dy]?.[x + dx] > grp[y][x] && col[y + dy][x + dx] !== RIG_K)) out[y][x] = RIG_K;   // linha entre partes
      }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d");
      out.forEach((r, y) => r.forEach((v, i) => { if (v) { x.fillStyle = v; x.fillRect(i, y, 1, 1); } }));
      return c;
    }
  };
  return d;
}

/* ---------- armas e objetos ---------- */
// formato da ponta (look.tip): dente = farpas dos lados, presa = curva, osso = nó na base, chifre = curva escura e comprida,
// aco = lâmina larga de folha; sem tip, triângulo simples. O mesmo desenho sai no Rhanon e no ícone da tela de equipar.
function rigSpear(d, C, x0, y0, x1, y1) {   // (x1, y1) = onde começa a ponta; cores e amarração de EQUIP.weapon[].look
  const L0 = Math.hypot(x1 - x0, y1 - y0) || 1, t = (C.long ? 5 : 3.5) + (C.tip === "chifre" ? 1.5 : 0) + (C.tip ? 1 : 0);
  const back = t - 3.5 + (C.tip ? 1 : 0);   // ponta maior começa mais para trás: a lança inteira continua dentro do desenho
  x1 -= (x1 - x0) / L0 * back; y1 -= (y1 - y0) / L0 * back;
  d.part().limb(x0, y0, x1, y1, 2, C.p, C.P);
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = (x1 - x0) / L, ny = (y1 - y0) / L;
  const at = (u, v) => [x1 + nx * u - ny * v, y1 + ny * u + nx * v];   // u ao longo da lança, v para o lado
  if (C.band) d.part().limb(x1 - nx * 3, y1 - ny * 3, x1 - nx * 1.2, y1 - ny * 1.2, 2.8, C.band).part();
  if (C.tip === "osso") { d.ellipse(...at(-.2, 0), 2.2, 2.2, C.m).part(); }
  if (C.tip === "presa" || C.tip === "chifre") d.poly([at(0, -2), at(0, 2), at(t * .55, 1.8), at(t, -1.6), at(t * .5, -.6)], C.m);
  else if (C.tip === "aco") d.poly([at(0, 0), at(t * .38, 2.6), at(t + .5, 0), at(t * .38, -2.6)], C.m);
  else d.poly([at(0, -1.6), at(0, 1.6), at(t, 0)], C.m);
  if (C.tip === "dente") d.part().poly([at(.4, 1.4), at(2, 3.4), at(2.2, 1)], C.m).poly([at(.4, -1.4), at(2, -3.4), at(2.2, -1)], C.m);
}
function rigBow(d, C, x, y0, y1, pullTo) {   // arco vertical em x; corda reta ou puxada até pullTo [x, y]
  d.part();
  for (let k = 0; k < 6; k++) {
    const a = k / 6, b = (k + 1) / 6, xa = x + Math.sin(a * Math.PI) * 2.5, xb = x + Math.sin(b * Math.PI) * 2.5;
    d.limb(xa, y0 + (y1 - y0) * a, xb, y0 + (y1 - y0) * b, 1.5, C.b);
  }
  if (pullTo) { d.part().limb(x, y0, pullTo[0], pullTo[1], 1, C.w).limb(pullTo[0], pullTo[1], x, y1, 1, C.w); }
  else d.part().limb(x, y0, x, y1, 1, C.w);
  if (C.fl) d.part().ellipse(x + 2, y0 + 1.5, 1.8, 1.4, C.fl).ellipse(x + 2, y1 - 1.5, 1.8, 1.4, C.fl);   // penas nas pontas
}
function rigTorch(d, C, x0, y0, x1, y1, f) {   // cabo de (x0,y0) até a chama em (x1,y1)
  d.part().limb(x0, y0, x1, y1, 2, C.f);
  const fl = FLAMES[f % 3];
  d.part().ellipse(x1, y1 - 2, 2.4, 3, fl[0]).ellipse(x1, y1 - 2, 1.4, 2, fl[1]).dots([[x1, y1 - 5], [x1 + (f % 2 ? 1 : -1), y1 - 4]], fl[2]);
}

/* ---------- o personagem ---------- */
const RIG_CACHE = new Map();
// pose: {lf, rf: pés [x,y]; lh, rh: mãos; lean, dy: parte de cima; sit; face; weapon; side; pull; f (quadro da chama)}
// look: {pal, shirt, pants, glasses, noBand, bowBack, longHair, feather, top, prop, charm}
function rigCanvas(view, pose = {}, look = {}, scale = 1) {
  const key = view + scale + JSON.stringify(pose) + JSON.stringify(look);
  if (RIG_CACHE.has(key)) return RIG_CACHE.get(key);
  if (RIG_CACHE.size > 600) RIG_CACHE.clear();
  const C = {...RIG_PAL, ...(look.pal || {})}, d = rigGrid(scale), back = view === "back";
  const lean = pose.lean || 0, hy = (pose.dy || 0) + (pose.sit ? 6 : 0), hx = 16 + lean, W = pose.weapon, side = pose.side || 1;
  const X = v => side > 0 ? v : 31 - v;
  const lf = pose.lf || [12, 40], rf = pose.rf || [20, 40], hip = 30 + (pose.sit ? 6 : 0);
  let lh = pose.lh || [7 + lean, 31 + hy], rh = pose.rh || [25 + lean, 31 + hy];
  // posições das mãos que a arma define
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const diagA = [X(4), 42], diagB = [X(27), 13];
  if (W === "diag") { if (back) { lh = [11 + lean, 28 + hy]; rh = [21 + lean, 28 + hy]; } else { lh = lerp(diagA, diagB, .36); rh = lerp(diagA, diagB, .6); } }
  if (W === "up") rh = [25 + lean, 30 + hy];
  if (W === "stab") { lh = [17 + lean, 25 + hy]; rh = [23 + lean, 24 + hy]; }
  if (W === "guard") { lh = [11 + lean, 28 + hy]; rh = [20 + lean, 27 + hy]; }
  if (W === "raise") rh = [26, 14 + hy];
  if (W === "bow") rh = [27, 24 + hy];
  if (W === "bowdraw") { rh = [27, 24 + hy]; lh = [24 - (pose.pull || 0), 24 + hy]; }
  if (W === "torch") rh = [25 + lean, 27 + hy];
  if (W === "torchup") rh = [27, 24 + hy];   // tocha erguida ao lado da cabeça (de costas, a cabeça não a cobre)

  if (back && W === "diag") rigSpear(d, C, diagA[0], diagA[1], diagB[0], diagB[1]);   // de costas: o corpo esconde o meio da lança
  if (!back) {   // cabelo de trás, com pontas soltas
    d.part().ellipse(hx, 12 + hy, 11, 10, C.h)
      .poly([[hx - 10, 13 + hy], [hx - 11, 22 + hy], [hx - 7, 17 + hy], [hx - 6, 23 + hy], [hx - 4, 18 + hy]], C.h)
      .poly([[hx + 10, 13 + hy], [hx + 11, 22 + hy], [hx + 7, 17 + hy], [hx + 6, 23 + hy], [hx + 4, 18 + hy]], C.h);
    if (look.longHair) d.poly([[hx - 10, 14 + hy], [hx + 10, 14 + hy], [hx + 11, 29 + hy], [hx - 11, 29 + hy]], C.h);
  }
  // pernas e pés
  if (pose.sit) { d.part().limb(13, 36, 7, 40, 4, C.s, C.S).limb(19, 36, 25, 40, 4, C.s, C.S); d.part().rect(4, 39, 4, 2, C.S).rect(24, 39, 4, 2, C.S); }
  else {
    d.part().limb(13, hip, lf[0], lf[1], 4, C.s, C.S).limb(19, hip, rf[0], rf[1], 4, C.s, C.S);
    d.part().rect(lf[0] - 3, lf[1], 5, 2, C.S).rect(rf[0] - 2, rf[1], 5, 2, C.S);
    if (look.pants) d.part().limb(13, hip, (13 + lf[0]) / 2, (hip + lf[1]) / 2, 5, look.pants[0], look.pants[1]).limb(19, hip, (19 + rf[0]) / 2, (hip + rf[1]) / 2, 5, look.pants[0], look.pants[1]);
  }
  // tronco
  const ty = 21 + hy;
  d.part().poly([[10 + lean, ty], [22 + lean, ty], [21, hip], [11, hip]], look.shirt ? look.shirt[0] : C.s, look.shirt ? look.shirt[1] : C.S, 19 + lean / 2);
  if (!back && !look.shirt) d.dots([[13 + lean, 25 + hy], [13 + lean, 26 + hy], [13 + lean, 27 + hy], [19 + lean, 25 + hy], [19 + lean, 26 + hy], [19 + lean, 27 + hy]], C.r)   // pintura
    .dots([[12 + lean, 22 + hy], [14 + lean, 23 + hy], [16 + lean, 23 + hy], [18 + lean, 23 + hy], [20 + lean, 22 + hy]], C.w);                                     // colar de dentes
  if (look.top) d.rect(10 + lean, 23 + hy, 12, 2, look.top);
  if (look.charm && !back) d.part().limb(hx - 3, 20 + hy, hx, 23 + hy, .8, "#3a2414").limb(hx + 3, 20 + hy, hx, 23 + hy, .8, "#3a2414").part().ellipse(hx, 24 + hy, 1.6, 1.6, look.charm);   // colar com a pedra do talismã
  // cintura: faixa e aba da tanga (ou a cintura da calça/short)
  const band = look.pants ? look.pants : [C.t, C.T];
  d.part().rect(10, hip - 1, 12, 2, band[0]).rect(10, hip, 12, 1, band[1]);
  if (!look.pants) d.part().poly([[13, hip], [19, hip], [18, hip + 4], [16, hip + 6], [14, hip + 4]], C.t, C.T, 17);
  // braços
  d.part().limb(9 + lean, 22 + hy, lh[0], lh[1], 3, C.s, C.S).limb(23 + lean, 22 + hy, rh[0], rh[1], 3, C.s, C.S);
  // arco nas costas (visto de trás), a não ser quando está na mão
  if (back && look.bowBack && W !== "bow" && W !== "bowdraw") {
    d.part();
    for (let k = 0; k < 6; k++) { const a = k / 6, b = (k + 1) / 6, bx = s => 8 + 15 * s + Math.sin(s * Math.PI) * -2, by = s => 20 + hy + 14 * s; d.limb(bx(a), by(a), bx(b), by(b), 1.5, C.b); }
    d.part().limb(8, 20 + hy, 23, 34 + hy, 1, C.w);
  }
  // cabeça
  if (back) {
    d.part().ellipse(hx, 13 + hy, 10.5, 10.5, C.h)
      .poly([[hx - 9, 14 + hy], [hx - 8, 24 + hy], [hx - 5, 19 + hy], [hx - 3, 25 + hy], [hx, 20 + hy], [hx + 3, 25 + hy], [hx + 5, 19 + hy], [hx + 8, 24 + hy], [hx + 9, 14 + hy]], C.h)
      .dots([[hx - 3, 5 + hy], [hx - 2, 5 + hy], [hx - 1, 4 + hy], [hx, 4 + hy], [hx - 4, 6 + hy]], C.H);
    if (look.longHair) d.poly([[hx - 10, 15 + hy], [hx + 10, 15 + hy], [hx + 10, 29 + hy], [hx - 10, 29 + hy]], C.h);
    if (!look.noBand) d.part().rect(hx - 10, 10 + hy, 21, 2, C.g).rect(hx - 10, 11 + hy, 21, 1, C.G).rect(hx - 1, 12 + hy, 2, 4, C.g);
  } else {
    d.part().ellipse(hx, 14 + hy, 7.5, 7.5, C.s, C.S, .55);
    const F = pose.face || "normal", e = (x, y) => [hx + x, y + hy];
    if (look.glasses) d.rect(hx - 6, 14 + hy, 13, 2, RIG_K);
    else if (F === "blink") d.rect(hx - 4, 16 + hy, 2, 1, RIG_K).rect(hx + 3, 16 + hy, 2, 1, RIG_K);
    else if (F === "happy") d.dots([e(-5, 16), e(-4, 15), e(-3, 16), e(2, 16), e(3, 15), e(4, 16)], RIG_K);
    else if (F === "hurt") d.limb(hx - 5, 15 + hy, hx - 3, 16 + hy, 1, RIG_K).limb(hx - 3, 16 + hy, hx - 5, 17 + hy, 1, RIG_K).limb(hx + 4, 15 + hy, hx + 2, 16 + hy, 1, RIG_K).limb(hx + 2, 16 + hy, hx + 4, 17 + hy, 1, RIG_K);
    else d.rect(hx - 4, 14 + hy, 2, 3, RIG_K).rect(hx + 3, 14 + hy, 2, 3, RIG_K).dots([e(-4, 14), e(3, 14)], C.w);
    d.dots([e(-6, 17), e(-5, 17), e(-6, 18), e(5, 17), e(6, 17), e(6, 18)], C.r);   // pintura nas bochechas
    if (F === "hurt") d.rect(hx - 1, 18 + hy, 3, 2, RIG_K).dots([e(0, 18)], C.r);
    else if (F === "happy") d.dots([e(-1, 18), e(0, 19), e(1, 19), e(2, 18)], RIG_K);
    else d.dots([e(0, 19), e(1, 19)], C.S);
    d.part().poly([[hx - 8, 7 + hy], [hx + 8, 7 + hy], [hx + 8, 12 + hy], [hx + 5, 15 + hy], [hx + 4, 11 + hy], [hx + 1, 14 + hy], [hx - 1, 10 + hy], [hx - 4, 14 + hy], [hx - 5, 11 + hy], [hx - 8, 14 + hy]], C.h)   // franja em pontas
      .dots([e(-5, 5), e(-4, 5), e(-3, 4), e(-2, 4), e(-4, 6)], C.H);
    if (!look.noBand) d.part().rect(hx - 8, 9 + hy, 17, 2, C.g).rect(hx - 8, 10 + hy, 17, 1, C.G);
    if (look.cap) d.part().ellipse(hx, 8 + hy, 8.5, 4.5, look.cap[0]).rect(hx - 9, 10 + hy, 19, 2, look.cap[1]);   // boné (gente da cidade)
  }
  if (look.feather) d.part().limb(hx + 5, 9 + hy, hx + 7, 2 + hy, 1.5, look.feather);
  // armas na frente do corpo
  if (W === "up") rigSpear(d, C, rh[0] + 1, 43, rh[0] + 1, 4 + hy);
  if (W === "diag" && !back) rigSpear(d, C, diagA[0], diagA[1], diagB[0], diagB[1]);
  if (W === "stab") rigSpear(d, C, 6 + lean, 25 + hy, 28 + lean, 24 + hy);
  if (W === "guard") rigSpear(d, C, 3 + lean, 28 + hy, 27 + lean, 26 + hy);
  if (W === "raise") rigSpear(d, C, 26, 33 + hy, 26, 4 + hy);
  if (W === "bow") rigBow(d, C, 27, 15 + hy, 33 + hy);
  if (W === "bowdraw") {
    const px = lh[0];
    rigBow(d, C, 27, 15 + hy, 33 + hy, [px, 24 + hy]);
    d.part().limb(px, 24 + hy, 30, 24 + hy, 1, "#c9a46a").dots([[31, 24 + hy]], C.m).dots([[px, 23 + hy], [px, 25 + hy]], C.r);
  }
  if (W === "torch") rigTorch(d, C, 24 + lean, 31 + hy, 26 + lean, 21 + hy, pose.f || 0);
  if (W === "torchup") rigTorch(d, C, 27, 28 + hy, 29, 15 + hy, pose.f || 0);
  // objetos da gente da feira
  if (look.prop === "pelt") d.part().rect(rh[0] - 2, rh[1] - 1, 5, 7, "#9c6339").dots([[rh[0], rh[1] + 1], [rh[0] + 1, rh[1] + 3]], "#d9b25a");
  if (look.prop === "basket") d.part().ellipse(lh[0], lh[1] - 1, 3, 2.5, "#d9b25a", "#b08a3a").dots([[lh[0] - 1, lh[1] - 3], [lh[0] + 1, lh[1] - 3]], "#e5001c");
  if (look.prop === "bow") rigBow(d, C, 27, 14 + hy, 34 + hy);
  if (look.prop === "cloth") d.part().rect(lh[0] - 2, lh[1] - 1, 5, 6, "#e9e2cf").rect(lh[0] - 2, lh[1] + 1, 5, 1, "#19a8d8").rect(lh[0] - 2, lh[1] + 3, 5, 1, "#e5001c");
  if (look.prop === "spear") rigSpear(d, C, rh[0], 42, rh[0], 7 + hy);
  if (look.prop === "staff") d.part().limb(rh[0], 43, rh[0], 6 + hy, 1.6, "#7a4a1e").part().ellipse(rh[0], 5 + hy, 2.2, 2.6, "#d9b25a", "#a07a30").dots([[rh[0] - 2, 9 + hy], [rh[0] + 2, 9 + hy]], "#e5001c");
  // mãos por cima de tudo (segurando a haste/o arco)
  if (!(back && W === "diag")) d.part().ellipse(lh[0], lh[1], 1.6, 1.6, C.s).ellipse(rh[0], rh[1], 1.6, 1.6, C.s);
  const c = d.canvas();
  RIG_CACHE.set(key, c);
  return c;
}
/* Rhanon dormindo na cama do motel, visto de lado (84x26): cabeça no travesseiro olhando para cima, cobertor até os pés
   com o relevo do corpo e o braço por cima. breathe (0/1) sobe o peito. Desenho próprio porque ele só respira. */
const SLEEP_CACHE = {};
function rhanonSleeping(breathe = 0) {
  const look = rhanonLook(), key = breathe + JSON.stringify(look);
  if (SLEEP_CACHE[key]) return SLEEP_CACHE[key];
  const C = {...RIG_PAL, ...(look.pal || {})}, d = rigGrid(1, 84, 26), b = breathe ? 1 : 0;
  d.part().ellipse(7, 13, 6, 7, C.h, C.H, .5);                          // cabelo atrás da cabeça
  d.part().ellipse(12, 13, 6, 6, C.s, C.S, .5);                         // rosto de perfil, virado para cima
  d.dots([[18, 12], [18, 13]], C.s).dots([[17, 12]], C.S);              // nariz
  if (!look.noBand) d.part().limb(7, 6, 9, 20, 2, C.g, C.G);            // faixa da cabeça
  d.part().poly([[8, 6], [13, 6], [12, 8], [10, 7], [9, 9]], C.h);      // franja
  d.dots([[13, 11], [14, 11]], "#1a1426").dots([[11, 15], [12, 15]], C.r).dots([[16, 16], [17, 16]], C.S);   // olho fechado, pintura na bochecha e boca
  // cobertor: sobe no peito, desce na cintura, joelhos e pés fazem montinhos
  const top = [[17, 11], [20, 8 - b], [28, 7 - b], [36, 8 - b], [44, 10], [52, 10], [60, 9], [66, 10], [71, 8], [75, 6], [79, 7], [82, 12]];
  d.part().poly([[17, 25], ...top, [83, 25]], "#c8303a", "#9c2028", 78);
  for (let x = 30; x < 78; x += 9) d.rect(x, 12, 1, 12, "#a82430");     // listras do cobertor
  d.rect(17, 21, 66, 2, "#9c2028");                                       // dobra embaixo
  d.part().poly([[17, 11], [20, 8 - b], [26, 7 - b], [27, 11], [24, 14], [17, 14]], "#f4ecd8", "#cdbf9a", 25);   // dobra do lençol no pescoço
  d.part().limb(25, 11 - b, 38, 12, 2.5, C.s, C.S).ellipse(39, 12, 2, 1.8, C.s);   // braço por cima do cobertor
  return SLEEP_CACHE[key] = d.canvas();
}
// visual do Rhanon conforme o que ele veste (G.equip) e o emprego
function rhanonLook() {
  const q = G?.equip || {}, T = EQUIP.torso[q.torso], L = EQUIP.legs[q.legs], look = {bowBack: !!q.ranged};
  const pal = {...EQUIP.weapon[q.weapon]?.look, ...EQUIP.ranged[q.ranged]?.look};   // cores da lança e do arco em uso
  if (q.amulet && EQUIP.amulet[q.amulet]) look.charm = EQUIP.amulet[q.amulet].night ? "#b07ae8" : "#ffd23a";   // talismã no peito
  if (Object.keys(pal).length) look.pal = pal;
  if (G?.betterJob) Object.assign(look, {shirt: ["#26364a", "#18222f"], pants: ["#18222f", "#0f1620"], glasses: true, noBand: true});
  else if (G?.job) Object.assign(look, {shirt: ["#f4ecd8", "#cdbf9a"], pants: ["#26364a", "#18222f"], noBand: true});
  else { if (T) look.shirt = [T.color, T.shade]; if (L && L.color) look.pants = [L.color, L.shade]; }
  return look;
}
// pés de cada passo (walkA/walkB levantam um pé) e pose de combate (pernas abertas)
const RIG_LEGS = {stand: {}, walkA: {lf: [12, 38]}, walkB: {rf: [20, 38]}, stance: {lf: [10, 40], rf: [22, 40]}};

/* ---------- Rhanon de perfil (exploração e mapa, andando para os lados) ---------- */
// pose: {step: stand | walk0..walk3, dy, lean, weapon: "diag" | "stab" | "jab" | null, face, side: 1 (direita) | -1 (esquerda)}
const RIG_SIDE_STEPS = {stand: [[14, 40], [18, 40]], walk0: [[10, 40], [22, 40]], walk1: [[15, 40], [18, 38]], walk2: [[22, 40], [10, 40]], walk3: [[18, 38], [15, 40]]};
function rigSideCanvas(pose = {}, look = {}, scale = 1) {
  const key = "side" + scale + JSON.stringify(pose) + JSON.stringify(look);
  if (RIG_CACHE.has(key)) return RIG_CACHE.get(key);
  if (pose.side < 0) {   // olhando para a esquerda: o mesmo desenho espelhado
    const src = rigSideCanvas({...pose, side: 1}, look, scale), c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = src.width; c.height = src.height; x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    RIG_CACHE.set(key, c); return c;
  }
  const C = {...RIG_PAL, ...(look.pal || {})}, d = rigGrid(scale), lean = pose.lean || 0, hy = pose.dy || 0, W = pose.weapon;
  const [farFoot, nearFoot] = RIG_SIDE_STEPS[pose.step || "stand"], hip = 30, hx = 16 + lean;
  const skin = look.shirt ? look.shirt : [C.s, C.S], legs = look.pants || [C.s, C.S];
  // mãos: segurando a lança (diagonal baixa ou estocada) ou balançando com o passo
  const swing = {walk0: 1, walk1: 0, walk2: -1, walk3: 0}[pose.step] || 0;
  const spearA = W === "stab" ? [1 + lean, 26 + hy] : [2, 40], spearB = W === "stab" ? [27 + lean, 26 + hy] : [28, 20 + hy];   // a ponta passa à frente do peito, não do rosto
  const on = t => [spearA[0] + (spearB[0] - spearA[0]) * t, spearA[1] + (spearB[1] - spearA[1]) * t];
  const stab = W === "stab" || W === "jab";   // jab = mãos da estocada, a lança é desenhada por fora (exploração)
  const farHand = W ? (stab ? [13 + lean, 26 + hy] : on(.42)) : [16 - swing * 5 + lean, 31 + hy];
  const nearHand = W ? (stab ? [20 + lean, 26 + hy] : on(.6)) : [16 + swing * 5 + lean, 31 + hy];
  if (look.bowBack) {   // arco atravessado nas costas
    d.part();
    for (let k = 0; k < 6; k++) { const a = k / 6, b = (k + 1) / 6, bx = s => 13 - 6 * s - Math.sin(s * Math.PI) * 2.5 + lean, by = s => 18 + hy + 16 * s; d.limb(bx(a), by(a), bx(b), by(b), 1.5, C.b); }
    d.part().limb(13 + lean, 18 + hy, 7 + lean, 34 + hy, 1, C.w);
  }
  // braço e perna de trás (mais escuros)
  d.part().limb(16 + lean, 22 + hy, farHand[0], farHand[1], 3, look.shirt ? skin[1] : C.S);
  d.part().limb(15, hip, farFoot[0], farFoot[1], 4, look.pants ? legs[1] : C.S).rect(farFoot[0] - 1, farFoot[1], 5, 2, "#7a4a2e");
  d.part().ellipse(hx, 12 + hy, 8.5, 8.5, C.h);   // fundo da cabeça
  d.part().limb(17, hip, nearFoot[0], nearFoot[1], 4, C.s, C.S).rect(nearFoot[0] - 1, nearFoot[1], 5, 2, C.S);
  if (look.pants) d.part().limb(17, hip, (17 + nearFoot[0]) / 2, (hip + nearFoot[1]) / 2, 5, legs[0], legs[1]);
  // tronco de perfil (pintura e colar só sem camisa)
  d.part().poly([[12 + lean, 21 + hy], [20 + lean, 21 + hy], [21, hip], [12, hip]], skin[0], skin[1], 18 + lean / 2);
  if (!look.shirt) d.dots([[19 + lean, 25 + hy], [19 + lean, 26 + hy], [19 + lean, 27 + hy]], C.r).dots([[15 + lean, 22 + hy], [17 + lean, 23 + hy], [19 + lean, 23 + hy]], C.w);
  const band = look.pants || [C.t, C.T];
  d.part().rect(12, hip - 1, 9, 2, band[0]).rect(12, hip, 9, 1, band[1]);
  if (!look.pants) d.part().poly([[17, hip], [21, hip], [21, hip + 5], [19, hip + 6]], C.t, C.T, 20);
  // rosto de perfil
  d.part().ellipse(hx + 3, 14 + hy, 5.5, 6.5, C.s, C.S, .8);
  d.poly([[hx + 7, 12 + hy], [hx + 10, 16 + hy], [hx + 7, 17 + hy]], C.s);   // nariz
  if (look.glasses) d.rect(hx + 3, 13 + hy, 5, 2, RIG_K);
  else if (pose.face === "blink") d.rect(hx + 5, 15 + hy, 2, 1, RIG_K);
  else d.rect(hx + 5, 13 + hy, 2, 3, RIG_K).dots([[hx + 5, 13 + hy]], C.w);
  d.dots([[hx + 5, 18 + hy], [hx + 6, 18 + hy], [hx + 5, 19 + hy]], C.r).dots([[hx + 7, 20 + hy], [hx + 8, 19 + hy]], C.S);
  // cabelo por cima da parte de trás da cabeça, orelha e franja
  d.part().poly([[hx - 8, 7 + hy], [hx - 2, 3 + hy], [hx + 2, 4 + hy], [hx + 2, 13 + hy], [hx, 18 + hy], [hx - 1, 23 + hy], [hx - 3, 19 + hy], [hx - 5, 23 + hy], [hx - 7, 18 + hy], [hx - 9, 21 + hy], [hx - 9, 12 + hy]], C.h)
    .dots([[hx - 4, 5 + hy], [hx - 3, 5 + hy], [hx - 2, 4 + hy], [hx - 1, 4 + hy]], C.H);
  d.part().ellipse(hx + 1, 15 + hy, 1.6, 2.2, C.s).dots([[hx + 1, 15 + hy]], C.S);
  d.part().poly([[hx, 4 + hy], [hx + 5, 5 + hy], [hx + 8, 8 + hy], [hx + 9, 11 + hy], [hx + 7, 10 + hy], [hx + 6, 12 + hy], [hx + 4, 10 + hy], [hx + 2, 12 + hy], [hx, 10 + hy]], C.h);
  if (!look.noBand) {   // faixa do cocar com as pontas soltas atrás
    d.part().rect(hx - 8, 9 + hy, 18, 2, C.g).rect(hx - 8, 10 + hy, 18, 1, C.G);
    d.part().limb(hx - 8, 11 + hy, hx - 11, 15 + hy + Math.abs(swing), 1, C.g).limb(hx - 8, 11 + hy, hx - 9, 16 + hy, 1, C.G);
  }
  if (W && W !== "jab") rigSpear(d, C, spearA[0], spearA[1], spearB[0], spearB[1]);
  d.part().limb(17 + lean, 22 + hy, nearHand[0], nearHand[1], 3, skin[0], skin[1]);
  d.part().ellipse(farHand[0], farHand[1], 1.6, 1.6, C.S).ellipse(nearHand[0], nearHand[1], 1.6, 1.6, C.s);
  const c = d.canvas();
  RIG_CACHE.set(key, c);
  return c;
}
