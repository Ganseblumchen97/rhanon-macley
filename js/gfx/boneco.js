/* Boneco pintado pixel a pixel: o Rhanon e a Franciscane com volume, sombra colorida e sem linha preta nas juntas.
   rigPaint(view, pose, look, S) tem o mesmo contrato do rigCanvas (gfx/rig.js): mesma pose, mesmo look, canvas de
   32*S x 44*S. A diferença é como pinta: cada parte do corpo é um volume (cápsula que afina, elipse) e cada pixel escolhe
   um de 4 tons pela luz, que vem de cima e da esquerda; a sombra puxa para o roxo, o tom é fosco (sem ponto de brilho na
   pele), e onde uma parte passa na frente de outra a borda só escurece do lado da sombra. Contorno de fora ameixa.
   Foi desenhado para S = 2 (64x88: é assim que a batalha pede, HERO_HD em gfx/actors.js); em outra escala as medidas encolhem junto.
   Armas e objetos (lança em qualquer pose, arco, tocha, o que a gente da feira segura) são pintados com os mesmos pincéis
   numa camada própria (bnTela: bnSpear, bnBow, bnTorch, nos mesmos pontos de rigSpear/rigBow/rigTorch de rig.js), então
   toda arma do equipamento já funciona. Vale de frente e de costas, para quem viaja e para a gente da aldeia e das cidades.
   `testes/previa_personagens.html` mostra o protótipo. */
const BN_LINE = "#241426";
const BN_CACHE = new Map();
const bnMix = (a, b, k) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
const bnRamp = b => [bnMix(b, "#fff0c8", .22), b, bnMix(b, "#4a2058", .3), bnMix(b, "#1c0c2c", .55)];   // contraste baixo: fosco
/* ---------- tela de pintar: os mesmos pincéis do boneco, para armas e objetos (uma camada à parte, com contorno ameixa) ----------
   Unidades de 64x88 (o dobro do esqueleto de rig.js), como no rigPaint. BW/BH = tamanho base em unidades de rig.js. */
function bnTela(S, BW = RIG_W, BH = RIG_H) {
  const q = S / 2, W = Math.round(BW * S), H = Math.round(BH * S), st = 1 / q, buf = new Array(W * H).fill(null);
  const put = (x, y, c) => { x = Math.round(x * q); y = Math.round(y * q); if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; };
  const tom = (nx, ny, edge) => { const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), Lz = -nx * .5 - ny * .42 + z * .6; let t = Lz > 1.02 ? 0 : Lz > .3 ? 1 : Lz > .02 ? 2 : 3; if (edge && nx * .6 + ny * .5 > .15) t = 3; return t; };
  const T = {
    put, st,
    cap(ax, ay, bx, by, r0, r1, R) {
      const m = Math.max(r0, r1) + 1;
      for (let y = Math.floor(Math.min(ay, by) - m); y <= Math.max(ay, by) + m; y += st) for (let x = Math.floor(Math.min(ax, bx) - m); x <= Math.max(ax, bx) + m; x += st) {
        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / l2));
        const r = r0 + (r1 - r0) * t, ox = x + .5 - ax - dx * t, oy = y + .5 - ay - dy * t, d = Math.hypot(ox, oy);
        if (d <= r) put(x, y, R[tom(ox / r, oy / r, d > r - 1.1)]);
      }
    },
    ell(cx, cy, rx, ry, R) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y += st) for (let x = Math.floor(cx - rx); x <= cx + rx; x += st) {
        const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, qq = u * u + v * v;
        if (qq <= 1) put(x, y, R[tom(u * .92, v * .92, qq > .8)]);
      }
    },
    pol(pts, cor) {   // polígono; cor(x, y) escolhe o tom de cada pixel
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y += st) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x += st) {
        const px = x + .5, py = y + .5; let dentro = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) dentro = !dentro; }
        if (dentro) put(x, y, cor(px, py));
      }
    },
    linha(ax, ay, bx, by, c, w = 1) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) * q * 2) || 1, pe = Math.abs(by - ay) > Math.abs(bx - ax);
      for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; for (let o = 0; o < w; o += st) put(x + (pe ? o : 0), y + (pe ? 0 : o), c); }
    },
    bloco(x, y, w, h, c) { for (let j = 0; j < h; j += st) for (let i = 0; i < w; i += st) put(x + i, y + j, c); },
    canvas() {
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
      const tem = (x, y) => x >= 0 && y >= 0 && x < W && y < H && buf[y * W + x];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = buf[y * W + x] || ((tem(x - 1, y) || tem(x + 1, y) || tem(x, y - 1) || tem(x, y + 1)) && BN_LINE);
        if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
      }
      return cv;
    }
  };
  return T;
}
const bnLiso = c => [c, c, c, c];
// as armas de rig.js (rigSpear, rigBow, rigTorch) pintadas: mesmos pontos, em unidades de rig.js, e as mesmas cores do `look`
function bnSpear(T, C, x0, y0, x1, y1) {
  const L0 = Math.hypot(x1 - x0, y1 - y0) || 1, t = (C.long ? 5 : 3.5) + (C.tip === "chifre" ? 1.5 : 0) + (C.tip ? 1 : 0), volta = t - 3.5 + (C.tip ? 1 : 0);
  x1 -= (x1 - x0) / L0 * volta; y1 -= (y1 - y0) / L0 * volta;
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = (x1 - x0) / L, ny = (y1 - y0) / L, at = (u, v) => [(x1 + nx * u - ny * v) * 2, (y1 + ny * u + nx * v) * 2];
  const mad = bnRamp(C.p), met = bnRamp(C.m);
  T.cap(x0 * 2, y0 * 2, x1 * 2, y1 * 2, 1.7, 1.7, mad);
  if (C.band) T.cap(...at(-3, 0), ...at(-1.2, 0), 2.5, 2.5, bnRamp(C.band));
  // ponta: um lado na luz, o outro na sombra, com o fio claro no meio
  const lado = (px, py) => { const v = (px / 2 - x1) * -ny + (py / 2 - y1) * nx, luz = Math.sign(v) * (ny * .5 - nx * .42); return met[Math.abs(v) < .3 ? 0 : luz > 0 ? 1 : 2]; };
  if (C.tip === "osso") T.ell(...at(-.2, 0), 4.2, 4.2, met);
  if (C.tip === "presa" || C.tip === "chifre") T.pol([at(0, -2), at(0, 2), at(t * .55, 1.8), at(t, -1.6), at(t * .5, -.6)], lado);
  else if (C.tip === "aco") T.pol([at(0, 0), at(t * .38, 2.6), at(t + .5, 0), at(t * .38, -2.6)], lado);
  else T.pol([at(0, -1.7), at(0, 1.7), at(t, 0)], lado);
  if (C.tip === "dente") { T.pol([at(.4, 1.4), at(2, 3.4), at(2.2, 1)], lado); T.pol([at(.4, -1.4), at(2, -3.4), at(2.2, -1)], lado); }
}
function bnCurva(T, fx, fy, R) { for (let k = 0; k < 6; k++) { const a = k / 6, b = (k + 1) / 6; T.cap(fx(a) * 2, fy(a) * 2, fx(b) * 2, fy(b) * 2, 1.5, 1.5, R); } }   // madeira do arco
function bnBow(T, C, x, y0, y1, pullTo) {
  bnCurva(T, s => x + Math.sin(s * Math.PI) * 2.5, s => y0 + (y1 - y0) * s, bnRamp(C.b));
  if (pullTo) { T.linha(x * 2, y0 * 2, pullTo[0] * 2, pullTo[1] * 2, C.w); T.linha(pullTo[0] * 2, pullTo[1] * 2, x * 2, y1 * 2, C.w); }
  else T.linha(x * 2, y0 * 2, x * 2, y1 * 2, C.w);
  if (C.fl) { const R = bnRamp(C.fl); T.ell((x + 2) * 2, (y0 + 1.5) * 2, 3.4, 2.6, R); T.ell((x + 2) * 2, (y1 - 1.5) * 2, 3.4, 2.6, R); }
}
function bnTorch(T, C, x0, y0, x1, y1, f) {
  T.cap(x0 * 2, y0 * 2, x1 * 2, y1 * 2, 1.8, 1.8, bnRamp(C.f));
  const fl = FLAMES[f % 3], X = x1 * 2, Y = y1 * 2, v = f % 2 ? 1 : -1;
  T.cap(X, Y - 3, X + v * 1.5, Y - 11, 4.6, 1, bnLiso(fl[0])); T.cap(X, Y - 3, X + v, Y - 8, 2.9, .8, bnLiso(fl[1])); T.ell(X, Y - 3, 1.6, 2.2, bnLiso(fl[2]));
  T.put(X - v * 4, Y - 11, fl[1]); T.put(X + v * 4, Y - 13, fl[0]);   // fagulhas
}
/* a lança da estocada na exploração: solta, apontando para a mira (48 direções), numa imagem de 72x72 pixels do jogo
   com a mão no centro; L = até onde a ponta vai. Devolve o canvas (3x), guardado por lança, direção e alcance. */
const BN_JAB = new Map();
function bnJabSpear(aim, L) {
  const n = Math.round(Math.atan2(aim.y, aim.x) / (Math.PI / 24)), key = (G.equip?.weapon || "") + "|" + n + "|" + L;
  if (BN_JAB.has(key)) return BN_JAB.get(key);
  if (BN_JAB.size > 300) BN_JAB.clear();
  const T = bnTela(OW_SCALE * BN_OW(), 96, 96), C = {...RIG_PAL, ...EQUIP.weapon[G.equip?.weapon]?.look}, k = 1 / OW_SCALE, dx = Math.cos(n * Math.PI / 24), dy = Math.sin(n * Math.PI / 24);
  bnSpear(T, C, 48 - dx * 4 * k, 48 - dy * 4 * k, 48 + dx * (L - 2) * k, 48 + dy * (L - 2) * k);
  const c = T.canvas(); BN_JAB.set(key, c); return c;
}
function rigPaint(view, pose = {}, look = {}, S = 2) {
  if (view !== "back" && view !== "front") return rigCanvas(view, pose, look, S);
  const key = "bn" + view + S + JSON.stringify(pose) + JSON.stringify(look);
  if (BN_CACHE.has(key)) return BN_CACHE.get(key);
  if (BN_CACHE.size > 900) BN_CACHE.clear();
  const C = {...RIG_PAL, ...(look.pal || {})}, back = view === "back", q = S / 2, W = Math.round(RIG_W * S), H = Math.round(RIG_H * S);
  // ---- a pose do esqueleto (unidades de rig.js), com as mãos que a arma define ----
  const lean = pose.lean || 0, hyB = (pose.dy || 0) + (pose.sit ? 6 : 0), wyB = pose.wy || 0, Wp = pose.weapon, side = pose.side || 1, X = v => side > 0 ? v : 31 - v, hp = pose.sit ? 12 : 0;   // hp: quanto o quadril desce sentado
  let lhB = pose.lh || [7 + lean, 31 + hyB + wyB], rhB = pose.rh || [25 + lean, 31 + hyB + wyB];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], diagA = [X(4), 42], diagB = [X(27), 13];
  if (Wp === "diag") { if (back) { lhB = [11 + lean, 28 + hyB]; rhB = [21 + lean, 28 + hyB]; } else { lhB = lerp(diagA, diagB, .36); rhB = lerp(diagA, diagB, .6); } }
  if (Wp === "up") rhB = [25 + lean, 30 + hyB + wyB];
  if (Wp === "stab") { lhB = [17 + lean, 25 + hyB]; rhB = [23 + lean, 24 + hyB]; }
  if (Wp === "guard") { lhB = [11 + lean, 28 + hyB]; rhB = [20 + lean, 27 + hyB]; }
  if (Wp === "raise") rhB = [26, 14 + hyB + wyB];
  if (Wp === "bow") rhB = [27, 24 + hyB];
  if (Wp === "bowdraw") { rhB = [27, 24 + hyB]; lhB = [24 - (pose.pull || 0), 24 + hyB]; }
  if (Wp === "torch") rhB = [25 + lean, 27 + hyB];
  if (Wp === "torchup") rhB = [27, 24 + hyB];
  // ---- camadas das armas, pelo desenho de rig.js ----
  /* de costas, o que ele segura na frente do peito fica escondido pelo corpo: a lança atravessada (diagonal, guarda,
     estocada e os quadros entre as poses que cruzam o tronco) e o arco puxado, com a flecha. Lança em pé do lado, erguida,
     arco só empunhado e tocha continuam por cima, porque ficam fora do tronco. */
  const cruza = sp => { for (let i = 0; i <= 8; i++) { const x = sp[0] + (sp[2] - sp[0]) * i / 8, y = sp[1] + (sp[3] - sp[1]) * i / 8; if (x > 10 + lean && x < 22 + lean && y > 21 + hyB && y < 31 + hyB) return true; } return false; };
  const tras = back && (Wp === "diag" || Wp === "stab" || Wp === "guard" || Wp === "bowdraw" || (Wp === "free" && pose.sp && cruza(pose.sp)));
  const some = h => back && tras && Math.abs(h[0] - (16 + lean)) < 6.5;   // esta mão está na frente do peito: some atrás do tronco, com o braço
  const pintada = fn => { const T = bnTela(S); fn(T); return T.canvas(); };   // armas e objetos pintados (bnSpear, bnBow, bnTorch)
  const costas = back && look.bowBack && Wp !== "bow" && Wp !== "bowdraw" ? pintada(T => {
    bnCurva(T, s => 8 + 15 * s + Math.sin(s * Math.PI) * -2, s => 20 + hyB + 14 * s, bnRamp(C.b));
    T.linha(16, (20 + hyB) * 2, 46, (34 + hyB) * 2, C.w);
  }) : null;
  const armaC = Wp || look.prop ? pintada(T => {
    if (Wp === "up") bnSpear(T, C, rhB[0] + 1, 43, rhB[0] + 1, 4 + hyB + wyB);
    if (Wp === "diag") bnSpear(T, C, diagA[0], diagA[1], diagB[0], diagB[1]);
    if (Wp === "stab") bnSpear(T, C, 6 + lean, 25 + hyB, 28 + lean, 24 + hyB);
    if (Wp === "guard") bnSpear(T, C, 3 + lean, 28 + hyB, 27 + lean, 26 + hyB);
    if (Wp === "raise") bnSpear(T, C, 26, 33 + hyB + wyB, 26, 4 + hyB + wyB);
    if (Wp === "free" && pose.sp) bnSpear(T, C, ...pose.sp);
    if (Wp === "bow") bnBow(T, C, 27, 15 + hyB, 33 + hyB);
    if (Wp === "bowdraw") {   // arco puxado, com a flecha encaixada
      const px = lhB[0], fy = (24 + hyB) * 2; bnBow(T, C, 27, 15 + hyB, 33 + hyB, [px, 24 + hyB]);
      T.linha(px * 2, fy, 60, fy, "#c9a46a", 2); T.pol([[60, fy - 2], [60, fy + 4], [64, fy + 1]], () => C.m); T.bloco(px * 2, fy - 2, 2, 2, C.r); T.bloco(px * 2, fy + 2, 2, 2, C.r);
    }
    if (Wp === "torch") bnTorch(T, C, 24 + lean, 31 + hyB, 26 + lean, 21 + hyB, pose.f || 0);
    if (Wp === "torchup") bnTorch(T, C, 27, 28 + hyB, 29, 15 + hyB, pose.f || 0);
    // objetos da gente da feira
    const rx = rhB[0] * 2, ry = rhB[1] * 2, lx = lhB[0] * 2, ly = lhB[1] * 2;
    if (look.prop === "pelt") { const R = bnRamp("#9c6339"); T.cap(rx, ry - 1, rx + 1, ry + 11, 4.6, 5.4, R); T.put(rx - 1, ry + 3, "#d9b25a"); T.put(rx + 2, ry + 7, "#d9b25a"); T.put(rx - 2, ry + 9, "#d9b25a"); }
    if (look.prop === "basket") { T.ell(lx, ly - 2, 6.2, 5.2, bnRamp("#d9b25a")); for (let i = -4; i <= 4; i += 2) T.put(lx + i, ly - 1, "#a07a30"); T.ell(lx - 2, ly - 7, 1.8, 1.8, bnRamp("#e5001c")); T.ell(lx + 2, ly - 7, 1.8, 1.8, bnRamp("#e5001c")); }
    if (look.prop === "bow") bnBow(T, C, 27, 14 + hyB, 34 + hyB);
    if (look.prop === "cloth") { const R = bnRamp("#e9e2cf"); T.cap(lx, ly - 1, lx, ly + 9, 4.8, 5.2, R); T.bloco(lx - 4, ly + 2, 9, 2, "#19a8d8"); T.bloco(lx - 4, ly + 6, 9, 2, "#e5001c"); }
    if (look.prop === "spear") bnSpear(T, C, rhB[0], 42, rhB[0], 7 + hyB);
    if (look.prop === "staff") { T.cap(rx, 86, rx, (6 + hyB) * 2, 1.6, 1.6, bnRamp("#7a4a1e")); T.ell(rx, (5 + hyB) * 2, 4.2, 5, bnRamp("#d9b25a")); T.bloco(rx - 4, (9 + hyB) * 2, 2, 2, "#e5001c"); T.bloco(rx + 3, (9 + hyB) * 2, 2, 2, "#e5001c"); }
  }) : null;
  const atras = tras ? armaC : null, frente = tras ? null : armaC;

  // ---- pintura: tudo em unidades de 64x88 (o dobro do esqueleto), multiplicadas por q na hora de pôr o pixel ----
  const novo = () => new Array(W * H).fill(null);
  let buf = novo();
  const put = (x, y, c) => { x = Math.round(x * q); y = Math.round(y * q); if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; };
  // tom pela luz: (nx, ny) = para onde a superfície aponta; edge = pixel da borda (fecha escuro do lado da sombra)
  const tom = (nx, ny, edge) => { const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), Lz = -nx * .5 - ny * .42 + z * .6; let t = Lz > 1.02 ? 0 : Lz > .3 ? 1 : Lz > .02 ? 2 : 3; if (edge && nx * .6 + ny * .5 > .15) t = 3; return t; };
  const st = 1 / q;   // passo: um pixel de saída
  const cap = (ax, ay, bx, by, r0, r1, R) => {   // cápsula de (ax, ay) a (bx, by), afinando de r0 para r1
    const m = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(ay, by) - m); y <= Math.max(ay, by) + m; y += st) for (let x = Math.floor(Math.min(ax, bx) - m); x <= Math.max(ax, bx) + m; x += st) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / l2));
      const r = r0 + (r1 - r0) * t, ox = x + .5 - ax - dx * t, oy = y + .5 - ay - dy * t, d = Math.hypot(ox, oy);
      if (d <= r) put(x, y, R[tom(ox / r, oy / r, d > r - 1.1)]);
    }
  };
  const ell = (cx, cy, rx, ry, R) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y += st) for (let x = Math.floor(cx - rx); x <= cx + rx; x += st) {
      const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, qq = u * u + v * v;
      if (qq <= 1) put(x, y, R[tom(u * .92, v * .92, qq > .8)]);
    }
  };
  const pele = bnRamp(C.s), cab = [bnMix(C.H, "#ffffff", .2), bnMix(C.h, C.H, .5), C.h, bnMix(C.h, "#000010", .45)], tanga = bnMix(C.t, "#3a1c10", .35), pano = bnRamp(tanga), faixa = bnRamp(C.g), pe = bnRamp(bnMix(C.s, "#5a3018", .3));
  const camisa = look.shirt && bnRamp(look.shirt[0]), calca = look.pants && bnRamp(look.pants[0]);
  const L = lean * 2, hy = hyB * 2, hh = hy + (pose.hd || 0) * 2, tr = (pose.tr || 0) * 1.5, hb = pose.hd ? -1 : 0, cx = 32 + L;   // hb: o cabelo vem um pouco depois da cabeça
  const lf = (pose.lf || [12, 40]).map(v => v * 2), rf = (pose.rf || [20, 40]).map(v => v * 2), lh = lhB.map(v => v * 2), rh = rhB.map(v => v * 2), fran = !!look.trancas;
  // ---- corpo ----
  if (look.longHair && !back) cap(cx, 30 + hh, cx, 52 + hy, 16, 12.5, cab);   // cabelo comprido caindo por trás dos ombros
  if (pose.sit) for (const s of [-1, 1]) { cap(32 + s * 5, 72, 32 + s * 17, 80, 4.1, 3.4, calca || pele); ell(32 + s * 22, 81, 4.6, 2.6, pe); }   // sentado: pernas abertas no chão
  else for (const [hx, f] of [[27, lf], [37, rf]]) {   // pernas e pés
    const kx = (hx + f[0]) / 2 + (hx < 32 ? -.5 : .5), ky = (60 + f[1]) / 2;
    cap(hx, 60, kx, ky, 4.1, 3.7, calca || pele); cap(kx, ky, f[0], f[1], 3.7, 3, pele); ell(f[0] + (hx < 32 ? -1 : 1), f[1] + 2.5, 4.6, 2.6, pe);
  }
  const braco = (s, h) => {   // ombro, cotovelo e pulso
    const sx = cx + s * 10.6, sy = 44.5 + hy, ex = (sx + h[0]) / 2 + s * 1, ey = (sy + h[1]) / 2;
    cap(sx, sy, ex, ey, 3.5, 3.1, pele); cap(ex, ey, h[0], h[1], 3.1, 2.6, pele);
    for (let i = -3; i <= 3; i++) { put(sx + (ex - sx) * .55 + i, sy + (ey - sy) * .55, C.r); put(sx + (ex - sx) * .55 + i, sy + (ey - sy) * .55 + 1, bnMix(C.r, "#3a0a10", .4)); }   // bracelete
  };
  const eL = some(lhB), eR = some(rhB);
  if (eL) { braco(-1, lh); ell(lh[0], lh[1] + 1, 3.1, 3.1, pele); }   // braço que está na frente do peito: o tronco passa por cima
  if (eR) { braco(1, rh); ell(rh[0], rh[1] + 1, 3.2, 3.2, pele); }
  const y0 = 40 + hy, corpo = camisa || pele;
  for (let y = y0; y <= 61 + hp; y += st) {   // tronco: ombro quadrado, afinando para a cintura
    const t = (y - y0) / (61 + hp - y0), w = y < y0 + 3 ? 8 + (y - y0) * .95 : 10.8 - (y - y0 - 3) / 18 * 2.6, c = 32 + L * (1 - t);
    for (let x = Math.floor(c - w); x <= c + w; x += st) { const u = (x + .5 - c) / w; if (Math.abs(u) <= 1) put(x, y, corpo[tom(u * .8, (t - .45) * .3, Math.abs(u) > .86)]); }
  }
  if (back) { for (let y = y0 + 4; y <= 56; y += st) put(32 + L * .5, y, corpo[2]); }   // linha da coluna
  else if (!camisa) {
    for (const s of [-1, 1]) for (let i = 2; i <= 7; i++) put(cx + s * i, 51 + hy + (i > 5 ? -1 : 0), pele[2]);   // peito
    put(32 + L * .3, 57 + hp, pele[2]);                                                                              // umbigo
    for (let x = -8; x <= 8; x += 2) { const y = 44 + hy + (1 - (x / 8) ** 2) * 4; put(cx + x, y, fran ? C.r : "#f4ecd8"); put(cx + x, y + 1, fran ? bnMix(C.r, "#3a0a10", .4) : "#b8a890"); }   // colar
    if (!fran) { put(cx, 50 + hy, "#ffffff"); put(cx, 51 + hy, "#f4ecd8"); put(cx, 52 + hy, "#c8bca0"); }                                                                              // dente
  }
  if (fran && !camisa) for (let y = 48 + hy; y <= 53 + hy; y += st) for (let x = cx - 11; x <= cx + 11; x += st) {   // a parte de cima da tanga
    const u = (x + .5 - cx) / 10.4; if (Math.abs(u) <= 1) put(x, y, y < 49 + hy ? pano[0] : y > 52 + hy ? pano[3] : pano[tom(u * .8, 0, Math.abs(u) > .88)]);
  }
  if (look.top) { const R = bnRamp(look.top); for (let y = 46 + hy; y <= 51 + hy; y += st) for (let x = cx - 11; x <= cx + 11; x += st) { const u = (x + .5 - cx) / 10.4; if (Math.abs(u) <= 1) put(x, y, y > 50 + hy ? R[3] : R[tom(u * .8, 0, Math.abs(u) > .88)]); } }
  if (look.charm && !back) { for (const s of [-1, 1]) for (let i = 0; i < 5; i++) put(cx + s * (6 - i), 43 + hy + i, "#3a2414"); ell(cx, 49 + hy, 2.4, 2.4, bnRamp(look.charm)); }   // talismã no peito
  // cintura: saiote de pano solto com a barra ondulada, e a aba da frente (ou a calça)
  const cinto = bnMix(calca ? look.pants[0] : tanga, "#ffe0a0", .45), saia = calca || pano;
  for (let x = 21; x <= 43; x += st) {
    const u = (x + .5 - 32) / 10.2; if (Math.abs(u) > 1) continue;
    const barra = calca ? 62 : 65 + Math.round(Math.sin(x * 1.1 + tr)) + (Math.abs(u) > .7 ? -1 : 0);
    for (let y = 57; y <= barra; y += st) {
      const dx = !calca && y > 60 ? Math.round(tr * (y - 60) / 8 * .6) : 0, prega = !calca && (Math.floor(x) + (y > 62 ? 1 : 0)) % 4 === 0 && y > 59;
      put(x + dx, y + hp, y < 58 ? cinto : y < 59 ? saia[0] : y >= barra ? saia[3] : prega ? saia[2] : saia[tom(u * .8, .1, Math.abs(u) > .88)]);
    }
  }
  if (!calca) for (let y = 60; y <= 76; y += st) {   // aba da frente (de costas, a de trás): balança mais que o saiote e termina em franja
    const k = (y - 60) / 16, w = 4.6 - k * 1.1, c = 32 + tr * k * 1.5 + Math.round(Math.sin(y * .7) * k * .6);
    for (let x = Math.floor(c - w); x <= c + w; x += st) {
      const u = (x + .5 - c) / Math.max(1, w); if (y > 73 && (Math.floor(x) & 1)) continue;
      put(x, y + hp, Math.abs(u) > .78 ? pano[3] : Math.abs(u) < .16 ? pano[2] : pano[u < 0 ? 0 : 1]);
    }
  }
  if (!eL) braco(-1, lh); if (!eR) braco(1, rh);
  const bCorpo = buf; buf = novo();
  // ---- cabeça ----
  if (back) {
    ell(cx, 25 + hh, 19, 18.5, cab);                                                              // a cuia inteira, de costas
    for (const s of [-1, 1]) ell(cx + s * 14 - tr * .4, 33 + hh + hb, 6, 8, cab);
    for (let x = cx - 16; x <= cx + 16; x += st) for (let y = 38 + hh + hb; y <= 42 + hh + hb + (Math.floor(x) % 5 === 0 ? 0 : 1); y += st) { const u = (x + .5 - cx) / 17; put(x, y, cab[y > 41 + hh + hb ? 3 : u > .5 ? 3 : 2]); }   // a barra reta do corte
    for (let x = Math.floor(cx - 19); x <= cx + 19; x += st) { const gy = 13 + hh + (x + .5 - cx) ** 2 / 34, rel = Math.floor(x) + 40; if (rel % 3 === 0) put(x, gy, cab[0]); else if (rel % 5) put(x, gy + 1, cab[1]); }   // fios de brilho
    if (fran) for (const s of [-1, 1]) { const x1 = cx + s * 9 + tr, y1 = 62 + hy; cap(cx + s * 8, 40 + hh, x1, y1, 2.8, 2.4, cab); for (let i = -2; i <= 2; i++) { put(x1 + i, y1 - 1, faixa[1]); put(x1 + i, y1, faixa[2]); } ell(x1, y1 + 3, 2.4, 2.4, cab); }   // tranças descendo pelas costas
  } else {
    ell(cx, 23 + hh, 19, 17, cab);
    for (const s of [-1, 1]) ell(cx + s * 15.5 - tr * .4, 30.5 + hh + hb, 5, 8.5, cab);         // cuia: os lados fecham redondos na altura do queixo
    for (const s of [-1, 1]) ell(cx + s * 14.5, 30 + hh, 2.6, 3.6, pele);                        // orelhas
    for (let y = 14 + hh; y <= 40 + hh; y += st) for (let x = Math.floor(cx - 15); x <= cx + 15; x += st) {   // rosto: luz chapada
      const u = (x + .5 - cx) / 14.5, v = (y + .5 - (27 + hh)) / 13, qq = u * u + v * v; if (qq > 1) continue;
      let tn = 1; if (u < -.25 && v > -.1 && qq < .6) tn = 0;
      if (u > .55 || y < 23 + hh) tn = 2;
      if (qq > .84 && u * .6 + v * .5 > .1) tn = 3;
      put(x, y, pele[tn]);
    }
    const ey = 30 + hh, F = pose.face || "normal", K = "#1a1020";
    for (const s of [-1, 1]) {
      const ex = Math.round(cx + s * 6.5);
      if (F === "blink") { for (let i = -2; i <= 2; i++) put(ex + i, ey + 2, K); put(ex + s * 3, ey + 1, K); }
      else if (F === "happy") { for (let i = -2; i <= 2; i++) put(ex + i, ey + (Math.abs(i) === 2 ? 1 : 0), K); }
      else if (F === "hurt") { for (let i = 0; i <= 3; i++) { put(ex + s * (2 - i), ey - 2 + i, K); put(ex + s * (2 - i), ey + 3 - i, K); } }
      else {
        for (let y = -3; y <= 3; y++) for (let x = -2; x <= 2; x++) {
          if (Math.abs(x) === 2 && Math.abs(y) === 3) continue;
          put(ex + x, ey + y, x * s === -2 ? "#f4ecd8" : y === -3 ? K : y < 1 ? "#241420" : y < 3 ? "#8a5226" : "#c89a5a");
        }
        put(ex - 1, ey - 2, "#ffffff"); put(ex, ey - 2, "#ffffff"); put(ex + 1, ey + 1, "#ffe8c8");
        for (let i = -2; i <= 2; i++) put(ex + i, ey - 4, K); put(ex + s * 3, ey - 3, K);
      }
      for (let i = -3; i <= 2; i++) put(ex - i * s, ey - 7 + (i > 0 ? 1 : 0) + (F === "hurt" ? 1 : 0), cab[2]);   // sobrancelha
      put(ex + s * 2, ey + 5, bnMix(C.s, "#f06a5a", .4)); put(ex + s * 3, ey + 5, bnMix(C.s, "#f06a5a", .4));   // corado
      for (let i = 0; i <= 2; i++) { put(ex + s * i, ey + 7, C.r); if (i) put(ex + s * i, ey + 9, bnMix(C.r, "#3a0a10", .25)); }   // pintura do rosto
    }
    if (F === "hurt") { for (let x = -1; x <= 1; x++) for (let y = 0; y < 3; y++) put(cx + x, 36 + hh + y, y === 2 ? "#dc6a6a" : "#4a1016"); }
    else if (F === "happy") { for (let x = -3; x <= 3; x++) put(cx + x, 36 + hh + (Math.abs(x) === 3 ? 0 : 1), "#7a3a2a"); }
    else for (let x = -2; x <= 2; x++) put(cx + x, 37 + hh - (Math.abs(x) === 2 ? 1 : 0), "#7a3a2a");
    put(cx + 1, 34 + hh, pele[2]);   // nariz
    for (let y = 5 + hh; y <= 26 + hh; y += st) for (let x = Math.floor(cx - 19); x <= cx + 19; x += st) {   // franja reta (cuia), com fios de brilho
      const u = (x + .5 - cx) / 19, v = (y + .5 - (23 + hh)) / 17, qq = u * u + v * v; if (qq > 1) continue;
      const rel = Math.floor(x) - Math.round(cx) + 40, dente = 1.5 + (rel % 9 === 0 ? 1 : 0) + Math.abs(x + .5 - cx) * .14 + (hb < 0 ? 1 : 0);
      if (y > 18 + hh + dente && Math.abs(u) < .78) continue;
      let tn = tom(u * .92, v * .92, qq > .82);
      const gy = 11 + hh + (x + .5 - cx) ** 2 / 34; if (Math.abs(y - gy) < .9 && rel % 3 === 0) tn = 0; else if (Math.abs(y - gy) < 1.6 && rel % 5 !== 0) tn = Math.min(tn, 1);
      if (y >= 17 + hh + dente && Math.abs(u) < .78) tn = 3;
      put(x, y, cab[tn]);
    }
    for (const s of [-1, 1]) cap(cx + s * 15.5, 22 + hh, cx + s * 15.5 - tr * .5, 35 + hh + hb, 3.6, 3, cab);
    if (fran) for (const s of [-1, 1]) { const x1 = cx + s * 19 + tr, y1 = 58 + hy; cap(cx + s * 16, 34 + hh, x1, y1, 2.8, 2.4, cab); for (let i = -2; i <= 2; i++) { put(x1 + i, y1 - 1, faixa[1]); put(x1 + i, y1, faixa[2]); } ell(x1, y1 + 3, 2.4, 2.4, cab); }   // tranças por cima dos ombros
  }
  if (look.longHair && back) cap(cx, 32 + hh, cx, 54 + hy, 16, 12, cab);
  // faixa: curva acompanhando a cabeça, clara em cima e escura embaixo e do lado de lá; de costas, o nó no meio com as pontas soltas
  if (!look.noBand) for (let x = Math.floor(cx - 18); x <= cx + 18; x += st) {
    const u = (x + .5 - cx) / 18.5, by = 13 + hh + u * u * 5 + (back ? 3 : 0); if (Math.abs(u) > .99) continue;
    for (let i = 0; i < 4; i += st) put(x, by + i, faixa[Math.min(3, (i < 1 ? 0 : i < 3 ? 1 : 2) + (u > .45 ? 1 : 0))]);
  }
  if (look.noBand) {} else if (back) { ell(cx, 18.5 + hh, 2.6, 2.4, faixa); cap(cx - 1, 20 + hh, cx - 3 - tr, 32 + hh, 1.6, 1, faixa); cap(cx + 1, 20 + hh, cx + 2 - tr, 34 + hh, 1.6, 1, faixa.map((c, i) => faixa[Math.min(3, i + 1)])); }
  else { ell(cx + 18, 20 + hh, 2.4, 2.4, faixa); cap(cx + 19, 21 + hh, cx + 22 - tr, 31 + hh, 1.6, 1, faixa); cap(cx + 18, 22 + hh, cx + 19 - tr, 33 + hh, 1.6, 1, faixa.map((c, i) => faixa[Math.min(3, i + 1)])); }
  {   // enfeites da gente da aldeia e das cidades (de costas, só não aparecem os óculos)
    if (look.feather) cap(cx + 11, 17 + hh, cx + 15, 3 + hh, 1.9, .9, bnRamp(look.feather));
    if (look.cap) {   // boné: copa redonda e a aba
      const R = bnRamp(look.cap[0]), A = bnRamp(look.cap[1]);
      for (let y = 3 + hh; y <= 17 + hh; y += st) for (let x = Math.floor(cx - 19); x <= cx + 19; x += st) { const u = (x + .5 - cx) / 18.6, v = (y + .5 - (17 + hh)) / 13; if (u * u + v * v <= 1) put(x, y, R[tom(u * .9, v * .9, u * u + v * v > .82)]); }
      if (!back) for (let y = 17 + hh; y <= 20 + hh; y += st) for (let x = cx - 20; x <= cx + 20; x += st) put(x, y, A[y > 19 + hh ? 3 : x > cx + 9 ? 2 : 1]);   // a aba só aparece de frente
    }
    if (look.hat) {   // chapéu de aba larga: copa, fita e a aba
      const R = bnRamp(look.hat[0]), A = bnRamp(look.hat[1]);
      ell(cx, 9 + hh, 13, 9.5, R);
      for (let y = 13 + hh; y <= 15 + hh; y += st) for (let x = cx - 12; x <= cx + 12; x += st) put(x, y, look.hat[2]);
      for (let y = 15 + hh; y <= 20 + hh; y += st) for (let x = Math.floor(cx - 23); x <= cx + 23; x += st) { const u = (x + .5 - cx) / 22.5, v = (y + .5 - (17.5 + hh)) / 3; if (u * u + v * v <= 1) put(x, y, A[y > 19 + hh ? 3 : v < -.3 ? 0 : u > .45 ? 2 : 1]); }
    }
    if (look.glasses && !back) {   // armação
      const K = "#1a1020", ey = 30 + hh;
      for (const s of [-1, 1]) { const ex = Math.round(cx + s * 6.5); for (let i = -4; i <= 4; i++) { put(ex + i, ey - 6, K); put(ex + i, ey + 5, K); } for (let j = -6; j <= 5; j++) { put(ex - 4, ey + j, K); put(ex + 4, ey + j, K); } put(ex - 2, ey - 4, "#ffffff"); }
      for (let i = -2; i <= 2; i++) put(cx + i, ey - 2, K);
    }
  }
  const bCabeca = buf; buf = novo();
  if (!eL) ell(lh[0], lh[1] + 1, 3.1, 3.1, pele); if (!eR) ell(rh[0], rh[1] + 1, 3.2, 3.2, pele);   // mãos por cima da haste (as que não ficaram atrás do tronco)
  const bMaos = buf;

  // ---- montagem: arma de trás, corpo, arco nas costas, cabeça, arma da frente, mãos; contorno ameixa por fora ----
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
  const pinta = b => { for (let i = 0; i < b.length; i++) if (b[i]) { g.fillStyle = b[i]; g.fillRect(i % W, (i / W) | 0, 1, 1); } };
  if (atras) g.drawImage(atras, 0, 0);
  pinta(bCorpo); if (costas) g.drawImage(costas, 0, 0);
  pinta(bCabeca); if (frente) g.drawImage(frente, 0, 0);
  pinta(bMaos);
  const a = g.getImageData(0, 0, W, H).data, on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 0;
  g.fillStyle = BN_LINE;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x, y, 1, 1);
  BN_CACHE.set(key, cv);
  return cv;
}

/* ---------- de perfil (exploração, andando para os lados): mesmo contrato do rigSideCanvas ---------- */
function rigPaintSide(pose = {}, look = {}, S = 2) {
  if (look.prop || look.hat || look.cap || look.glasses || look.longHair || look.top || look.feather || look.noBand) return rigSideCanvas(pose, look, S);
  const key = "bns" + S + JSON.stringify(pose) + JSON.stringify(look);
  if (BN_CACHE.has(key)) return BN_CACHE.get(key);
  if (BN_CACHE.size > 900) BN_CACHE.clear();
  if (pose.side < 0) {   // olhando para a esquerda: o mesmo desenho espelhado
    const src = rigPaintSide({...pose, side: 1}, look, S), c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = src.width; c.height = src.height; x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    BN_CACHE.set(key, c); return c;
  }
  const C = {...RIG_PAL, ...(look.pal || {})}, q = S / 2, W = Math.round(RIG_W * S), H = Math.round(RIG_H * S), st = 1 / q;
  // mãos e pés pelo esqueleto de rig.js (rigSideCanvas)
  const leanB = pose.lean || 0, hyB = pose.dy || 0, hhB = hyB + (pose.hd || 0), Wp = pose.weapon, [farFoot, nearFoot] = RIG_SIDE_STEPS[pose.step || "stand"];
  const swing = {walk0: 1, walk1: 0, walk2: -1, walk3: 0}[pose.step] || 0, estoca = Wp === "stab" || Wp === "jab";
  const spearA = Wp === "stab" ? [1 + leanB, 26 + hhB] : [2, 40], spearB = Wp === "stab" ? [27 + leanB, 26 + hhB] : [28, 20 + hhB], on = t => [spearA[0] + (spearB[0] - spearA[0]) * t, spearA[1] + (spearB[1] - spearA[1]) * t];
  const farHand = (Wp ? (estoca ? [13 + leanB, 26 + hhB] : on(.42)) : [16 - swing * 5 + leanB, 31 + hhB]).map(v => v * 2), nearHand = (Wp ? (estoca ? [20 + leanB, 26 + hhB] : on(.6)) : [16 + swing * 5 + leanB, 31 + hhB]).map(v => v * 2);
  const pintada = fn => { const T = bnTela(S); fn(T); return T.canvas(); };
  const arcoCostas = look.bowBack ? pintada(T => {
    bnCurva(T, s => 13 - 6 * s - Math.sin(s * Math.PI) * 2.5 + leanB, s => 18 + hhB + 16 * s, bnRamp(C.b));
    T.linha((13 + leanB) * 2, (18 + hhB) * 2, (7 + leanB) * 2, (34 + hhB) * 2, C.w);
  }) : null;
  const lanca = Wp && Wp !== "jab" ? pintada(T => bnSpear(T, C, spearA[0], spearA[1], spearB[0], spearB[1])) : null;
  // pintura (unidades de 64x88, como no rigPaint)
  const novo = () => new Array(W * H).fill(null); let buf = novo();
  const put = (x, y, c) => { x = Math.round(x * q); y = Math.round(y * q); if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; };
  const tom = (nx, ny, edge) => { const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), Lz = -nx * .5 - ny * .42 + z * .6; let t = Lz > 1.02 ? 0 : Lz > .3 ? 1 : Lz > .02 ? 2 : 3; if (edge && nx * .6 + ny * .5 > .15) t = 3; return t; };
  const cap = (ax, ay, bx, by, r0, r1, R) => {
    const m = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(ay, by) - m); y <= Math.max(ay, by) + m; y += st) for (let x = Math.floor(Math.min(ax, bx) - m); x <= Math.max(ax, bx) + m; x += st) {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x + .5 - ax) * dx + (y + .5 - ay) * dy) / l2));
      const r = r0 + (r1 - r0) * t, ox = x + .5 - ax - dx * t, oy = y + .5 - ay - dy * t, d = Math.hypot(ox, oy);
      if (d <= r) put(x, y, R[tom(ox / r, oy / r, d > r - 1.1)]);
    }
  };
  const ell = (cx, cy, rx, ry, R) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y += st) for (let x = Math.floor(cx - rx); x <= cx + rx; x += st) {
      const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, qq = u * u + v * v;
      if (qq <= 1) put(x, y, R[tom(u * .92, v * .92, qq > .8)]);
    }
  };
  const esc = R => [R[1], R[2], R[3], R[3]];   // o lado de lá do corpo, um tom abaixo
  const pele = bnRamp(C.s), cab = [bnMix(C.H, "#ffffff", .2), bnMix(C.h, C.H, .5), C.h, bnMix(C.h, "#000010", .45)], tanga = bnMix(C.t, "#3a1c10", .35), pano = bnRamp(tanga), faixa = bnRamp(C.g), pe = bnRamp(bnMix(C.s, "#5a3018", .3));
  const camisa = look.shirt && bnRamp(look.shirt[0]), calca = look.pants && bnRamp(look.pants[0]), fran = !!look.trancas;
  const L = leanB * 2, hy = hyB * 2, hh = hhB * 2, cx = 32 + L, tr = (pose.tr || 0) * 1.5 + swing * 1.5, hb = pose.step === "walk1" || pose.step === "walk3" ? 1 : pose.hd ? -1 : 0;   // o cabelo quica no passo
  const ff = farFoot.map(v => v * 2), nf = nearFoot.map(v => v * 2);
  const perna = (hx, f, R, P2) => { const kx = (hx + f[0]) / 2 + 1, ky = (60 + f[1]) / 2; cap(hx, 60, kx, ky, 4.1, 3.7, R); cap(kx, ky, f[0], f[1], 3.7, 3, P2); };
  const braco = (h, R) => { const sx = 32.5 + L, sy = 45 + hh, ex = (sx + h[0]) / 2 - 1, ey = (sy + h[1]) / 2 + .5; cap(sx, sy, ex, ey, 3.4, 3, R); cap(ex, ey, h[0], h[1], 3, 2.5, R); };
  // lado de lá: braço e perna mais escuros
  braco(farHand, esc(pele));
  perna(30, ff, esc(calca || pele), esc(pele)); ell(ff[0] + 2, ff[1] + 2.5, 4.6, 2.6, esc(pe));
  perna(34, nf, calca || pele, pele); ell(nf[0] + 2, nf[1] + 2.5, 4.8, 2.6, pe);
  // tronco de perfil
  const y0 = 40 + hh, corpo = camisa || pele;
  for (let y = y0; y <= 61; y += st) {
    const t = (y - y0) / (61 - y0), w = y < y0 + 3 ? 5.4 + (y - y0) * .7 : 7.5 - (y - y0 - 3) / 18 * 1.3, c = 33 + L * (1 - t);
    for (let x = Math.floor(c - w); x <= c + w; x += st) { const u = (x + .5 - c) / w; if (Math.abs(u) <= 1) put(x, y, corpo[tom(u * .8, (t - .45) * .3, Math.abs(u) > .84)]); }
  }
  if (fran && !camisa) for (let y = 48 + hh; y <= 53 + hh; y += st) for (let x = cx - 7; x <= cx + 9; x += st) { const u = (x + .5 - cx - 1) / 7.4; if (Math.abs(u) <= 1) put(x, y, y < 49 + hh ? pano[0] : y > 52 + hh ? pano[3] : pano[tom(u * .8, 0, Math.abs(u) > .86)]); }
  const cinto = bnMix(calca ? look.pants[0] : tanga, "#ffe0a0", .45), saia = calca || pano;
  for (let x = 25; x <= 41; x += st) {   // saiote
    const u = (x + .5 - 33) / 7.8; if (Math.abs(u) > 1) continue;
    const barra = calca ? 62 : 65 + Math.round(Math.sin(x * 1.1 + tr)) + (Math.abs(u) > .7 ? -1 : 0);
    for (let y = 57; y <= barra; y += st) { const prega = !calca && Math.floor(x) % 4 === 0 && y > 59; put(x + (!calca && y > 60 ? Math.round(-tr * (y - 60) / 8 * .5) : 0), y, y < 58 ? cinto : y < 59 ? saia[0] : y >= barra ? saia[3] : prega ? saia[2] : saia[tom(u * .8, .1, Math.abs(u) > .86)]); }
  }
  if (!calca) for (let y = 60; y <= 75; y += st) {   // aba da frente, balançando para trás com o passo
    const k = (y - 60) / 15, w = 3.2 - k * .8, c = 38 - tr * k * 1.4;
    for (let x = Math.floor(c - w); x <= c + w; x += st) { const u = (x + .5 - c) / Math.max(1, w); if (y > 72 && (Math.floor(x) & 1)) continue; put(x, y, Math.abs(u) > .75 ? pano[3] : u < 0 ? pano[1] : pano[2]); }
  }
  // cabeça de perfil: cuia cobrindo a orelha, rosto para a direita
  ell(cx, 23 + hh, 18, 17, cab);
  ell(cx - 5 - tr * .4, 31 + hh + hb, 12, 9.5, cab);   // a parte de trás e de lado da cuia, até o queixo
  for (let x = Math.floor(cx - 19); x <= cx + 19; x += st) { const gy = 11 + hh + (x + .5 - cx) ** 2 / 34, rel = Math.floor(x) + 40; if (rel % 3 === 0) put(x, gy, cab[0]); else if (rel % 5) put(x, gy + 1, cab[1]); }
  for (let y = 16 + hh; y <= 41 + hh; y += st) for (let x = Math.floor(cx + 1); x <= cx + 17; x += st) {   // rosto
    const u = (x + .5 - (cx + 5)) / 11.2, v = (y + .5 - (28.5 + hh)) / 11.8, qq = u * u + v * v; if (qq > 1) continue;
    if (y <= 19.5 + hh + (hb > 0 ? 1 : 0) + (x - cx) * .08) continue;   // a franja fica por cima
    let tn = 1; if (y < 23 + hh) tn = 2; else if (u < .2 && v > 0 && qq < .5) tn = 0;
    if (qq > .82 && v > .2) tn = 3;
    put(x, y, pele[tn]);
  }
  ell(cx + 16.4, 31.5 + hh, 1.9, 1.7, pele);                                                    // nariz
  const ex = Math.round(cx + 10), ey = 29 + hh, K = "#1a1020";
  if (pose.face === "blink") { for (let i = -2; i <= 2; i++) put(ex + i, ey + 2, K); }
  else {
    for (let y = -3; y <= 3; y++) for (let x = -1; x <= 2; x++) { if ((x === -1 || x === 2) && Math.abs(y) === 3) continue; put(ex + x, ey + y, x === 2 ? "#f4ecd8" : y === -3 ? K : y < 1 ? "#241420" : y < 3 ? "#8a5226" : "#c89a5a"); }
    put(ex, ey - 2, "#ffffff"); put(ex + 1, ey + 1, "#ffe8c8"); for (let i = -1; i <= 3; i++) put(ex + i, ey - 4, K);
  }
  for (let i = -2; i <= 3; i++) put(ex + i, ey - 7 + (i < 0 ? 1 : 0), cab[2]);                    // sobrancelha
  put(ex - 3, ey + 5, bnMix(C.s, "#f06a5a", .4)); put(ex - 2, ey + 5, bnMix(C.s, "#f06a5a", .4));
  for (let i = 0; i <= 2; i++) { put(ex - 2 + i, ey + 7, C.r); if (i) put(ex - 2 + i, ey + 9, bnMix(C.r, "#3a0a10", .25)); }   // pintura do rosto
  put(cx + 12, 38 + hh, "#7a3a2a"); put(cx + 13, 38 + hh, "#7a3a2a"); put(cx + 14, 37 + hh, "#7a3a2a");                       // boca
  cap(cx + 1, 21 + hh, cx + 1 - tr * .3, 36 + hh + hb, 3.6, 3, cab);                               // a mecha na frente da orelha
  for (let x = Math.floor(cx - 18); x <= cx + 18; x += st) {   // faixa, com o nó atrás
    const u = (x + .5 - cx) / 18.5, by = 13 + hh + u * u * 5 + (u < 0 ? 1.5 : 0); if (Math.abs(u) > .99) continue;
    for (let i = 0; i < 4; i += st) put(x, by + i, faixa[Math.min(3, (i < 1 ? 0 : i < 3 ? 1 : 2) + (u < -.45 ? 1 : 0))]);
  }
  ell(cx - 18, 21 + hh, 2.4, 2.4, faixa); cap(cx - 19, 22 + hh, cx - 23 - tr, 32 + hh, 1.6, 1, faixa); cap(cx - 18, 23 + hh, cx - 20 - tr, 34 + hh, 1.6, 1, faixa.map((c, i) => faixa[Math.min(3, i + 1)]));
  if (fran) { const x1 = cx - 12 - tr, y1 = 60 + hy; cap(cx - 9, 36 + hh, x1, y1, 2.8, 2.4, cab); for (let i = -2; i <= 2; i++) { put(x1 + i, y1 - 1, faixa[1]); put(x1 + i, y1, faixa[2]); } ell(x1, y1 + 3, 2.4, 2.4, cab); }   // trança
  const bCorpo = buf; buf = novo();
  braco(nearHand, pele);
  { const sx = 32.5 + L, sy = 45 + hh, bx = sx + (nearHand[0] - sx) * .3, by = sy + (nearHand[1] - sy) * .3; for (let i = -3; i <= 3; i++) { put(bx + i, by, C.r); put(bx + i, by + 1, bnMix(C.r, "#3a0a10", .4)); } }   // bracelete
  ell(farHand[0], farHand[1] + 1, 2.9, 2.9, esc(pele)); ell(nearHand[0], nearHand[1] + 1, 3.1, 3.1, pele);
  const bFrente = buf;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
  const pinta = b => { for (let i = 0; i < b.length; i++) if (b[i]) { g.fillStyle = b[i]; g.fillRect(i % W, (i / W) | 0, 1, 1); } };
  if (arcoCostas) g.drawImage(arcoCostas, 0, 0);
  pinta(bCorpo); if (lanca) g.drawImage(lanca, 0, 0); pinta(bFrente);
  const a = g.getImageData(0, 0, W, H).data, tem = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 0;
  g.fillStyle = BN_LINE;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!tem(x, y) && (tem(x - 1, y) || tem(x + 1, y) || tem(x, y - 1) || tem(x, y + 1))) g.fillRect(x, y, 1, 1);
  BN_CACHE.set(key, cv);
  return cv;
}
/* ---------- exploração: a tela de lá já tem 3 pixels por pixel do jogo (RS em explore.js), então o boneco é pedido 3x maior
   (OW_SCALE * 3 = 2,25) e desenhado nos mesmos 24x33 do jogo (OW_W x OW_H): cada pixel dele cai num pixel da tela ---------- */
const BN_OW = () => typeof POLISH === "undefined" || POLISH ? 3 : 1, OW_W = 24, OW_H = 33;
const heroRig = (view, pose, look) => BN_OW() > 1 ? rigPaint(view, pose, look, OW_SCALE * BN_OW()) : rigCanvas(view, pose, look, OW_SCALE);
const heroRigSide = (pose, look) => BN_OW() > 1 ? rigPaintSide(pose, look, OW_SCALE * BN_OW()) : rigSideCanvas(pose, look, OW_SCALE);

/* ---------- bichos pintados: a mesma grade de desenho de rig.js (rigGrid: part, ellipse, poly, limb, dots, rect, canvas),
   mas cada forma ganha volume: o tom de cada pixel sai da rampa fosca da cor (bnRamp) pela luz de cima e da esquerda.
   Elipse = bola, membro = cilindro, polígono = chapa com a beira clara do lado da luz e escura do lado da sombra;
   pontos e retângulos (olhos, dentes, pintas) ficam na cor que vieram. Entre duas partes a linha é a cor escurecida,
   não preta; por fora, contorno ameixa. Os desenhos de gfx/beasts.js não mudam: beastBase liga BEAST_PAINT enquanto
   desenha e o rigGrid devolve esta grade, em resolução dobrada. A cor "dark" que as formas recebem é ignorada. ---------- */
const BN_RAMPS = new Map();
const bnRampOf = c => { let r = BN_RAMPS.get(c); if (!r) { r = /^#[0-9a-f]{6}$/i.test(c) ? bnRamp(c) : bnLiso(c); BN_RAMPS.set(c, r); } return r; };
function bnGrid(S, W = RIG_W, H = RIG_H) {
  const w = Math.round(W * S), h = Math.round(H * S), n = w * h;
  const col = new Array(n).fill(null), ton = new Int8Array(n), grp = new Int32Array(n), chapa = new Uint8Array(n);
  let gid = 1;
  const tom = (nx, ny, edge) => { const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), Lz = -nx * .5 - ny * .42 + z * .6; let t = Lz > 1.02 ? 0 : Lz > .3 ? 1 : Lz > .02 ? 2 : 3; if (edge && nx * .6 + ny * .5 > .15) t = 3; return t; };
  const put = (x, y, c, t, ch) => { if (x >= 0 && y >= 0 && x < w && y < h) { const i = y * w + x; col[i] = c; ton[i] = t; grp[i] = gid; chapa[i] = ch ? 1 : 0; } };
  const d = {
    part() { gid++; return d; },
    ellipse(cx, cy, rx, ry, c) {
      cx *= S; cy *= S; rx *= S; ry *= S;
      const miudo = Math.min(rx, ry) < 2.2;   // bolinha pequena: sem sombra de borda, para não virar um borrão escuro
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, q = u * u + v * v;
        if (q <= 1) put(x, y, c, miudo ? (u * .6 + v * .5 > .35 ? 2 : 1) : tom(u * .92, v * .92, q > .8));
      }
      return d;
    },
    poly(pts, c) {
      pts = pts.map(([x, y]) => [x * S, y * S]);
      const ys = pts.map(q => q[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) put(x, y, c, 1, true);
      }
      return d;
    },
    limb(x0, y0, x1, y1, wd, c) {
      x0 *= S; y0 *= S; x1 *= S; y1 *= S; const r = Math.max(1, Math.round(wd * S)) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      for (let y = Math.floor(Math.min(y0, y1) - r - 1); y <= Math.max(y0, y1) + r + 1; y++) for (let x = Math.floor(Math.min(x0, x1) - r - 1); x <= Math.max(x0, x1) + r + 1; x++) {
        const px = x + .5 - x0, py = y + .5 - y0, al = px * ux + py * uy, la = -px * uy + py * ux;   // ao longo e de lado
        if (al < -.5 || al > l + .5 || Math.abs(la) > r) continue;
        const k = la / r; put(x, y, c, r < 1.3 ? 1 : tom(-uy * k * .9, ux * k * .9, Math.abs(la) > r - 1.1));
      }
      return d;
    },
    dots(list, c) { const b = Math.max(1, Math.round(S)); list.forEach(([x, y]) => { const X = Math.round(x * S), Y = Math.round(y * S); for (let j = 0; j < b; j++) for (let i = 0; i < b; i++) put(X + i, Y + j, c, -1); }); return d; },
    rect(x, y, rw, rh, c) {
      const X = Math.round(x * S), Y = Math.round(y * S), RW = Math.max(1, Math.round(rw * S)), RH = Math.max(1, Math.round(rh * S));
      for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) put(X + i, Y + j, c, -1);
      return d;
    },
    canvas() {
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.dataset.pintado = "1"; const g = cv.getContext("2d");
      const G =(x, y) => x >= 0 && y >= 0 && x < w && y < h ? grp[y * w + x] : 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, c = col[i]; let out = null;
        if (!c) { if (G(x - 1, y) || G(x + 1, y) || G(x, y - 1) || G(x, y + 1)) out = BN_LINE; }
        else if (ton[i] < 0) out = c;
        else {
          const R = bnRampOf(c), me = grp[i]; let t = ton[i];
          if (chapa[i]) {   // chapa: beira escura embaixo e à direita, fio de luz em cima e à esquerda
            if (G(x + 1, y + 1) !== me || G(x + 1, y) !== me || G(x, y + 1) !== me) t = 3;
            else if (G(x + 2, y + 2) !== me || G(x + 3, y + 3) !== me) t = 2;
            else if (G(x - 1, y - 1) !== me || G(x - 1, y) !== me || G(x, y - 1) !== me) t = 0;
          }
          // linha entre partes: a parte de baixo escurece onde a de cima encosta (a cor escurecida, não preto)
          if ([[1, 0], [0, 1], [-1, 0], [0, -1]].some(([ax, ay]) => { const o = G(x + ax, y + ay); return o > me && ton[(y + ay) * w + x + ax] >= 0; })) t = 3;
          out = R[t];
        }
        if (out) { g.fillStyle = out; g.fillRect(x, y, 1, 1); }
      }
      return cv;
    }
  };
  return d;
}
