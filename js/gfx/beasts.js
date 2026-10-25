/* Bichos no mesmo traço do Rhanon: formas + contorno automático (rigGrid de gfx/rig.js), em resolução 2x
   (o canvas leva data-scale="2", então aparece no mesmo tamanho dos desenhos antigos).
   Cada bicho tem as poses: idle (f = 0/1, respirando), crouch (agacha antes do bote), attack (bote/boca aberta),
   hurt (levou golpe) e ko (desmaiado, olho em "X"). Todos olham para a esquerda.
   beastFrame(id, pose, f) -> canvas (com dataset.head = posição da cabeça, para as estrelinhas do desmaio). */
const BEAST_K = 2, BN = "#22100a", BW = "#ffffff", BR = "#e2363d";

/* ---------- peças comuns ---------- */
// olho: open (aberto, com brilho), angry (sobrancelha), shut (fechado), x (desmaio)
function bEye(d, x, y, o, n = BN) {
  if (o.eye === "x") d.dots([[x - 1, y - 1], [x + 1, y - 1], [x, y], [x - 1, y + 1], [x + 1, y + 1]], n);
  else if (o.eye === "shut") d.rect(x - 1, y, 3, 1, n);
  else {
    d.rect(x - 1, y - 1, 2, 2, n).dots([[x - 1, y - 1]], BW);
    if (o.eye === "angry") d.dots([[x - 2, y - 2], [x - 1, y - 2], [x, y - 3], [x + 1, y - 3]], n);
  }
}
// boca aberta virada para a esquerda, a partir do canto (x, y): dentes em cima e língua
function bMouth(d, x, y, len, teeth = true) {
  d.part().poly([[x, y], [x + len, y + 1], [x + 1, y + len * .65]], BN);
  if (teeth) d.dots([[x + 1, y + 1], [x + Math.round(len * .55), y + 1]], BW);
  d.dots([[x + 2, y + Math.round(len * .4)], [x + 3, y + Math.round(len * .4)]], BR);
}
// corrente de "membros" passando por vários pontos (rabo, corpo de cobra); wd pode ser número ou [início, fim]
function bChain(d, pts, wd, c, dark) {
  const [w0, w1] = Array.isArray(wd) ? wd : [wd, wd];
  for (let i = 0; i + 1 < pts.length; i++) {
    const t = pts.length > 2 ? i / (pts.length - 2) : 0;
    d.limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w0 + (w1 - w0) * t, c, dark);
  }
}

/* ---------- quadrúpedes: um esqueleto para todos, cada espécie muda medidas, cabeça, rabo e desenho do pelo ---------- */
function quadPose(S, pose, f) {
  const G = S.H - 3, L = S.leg, o = {eye: "open"};
  let cx = S.cx, ry = S.ry, rx = S.rx, cy = G - L - ry * .45, hdx = 0, hdy = 0;
  if (pose === "idle") cy += f;
  if (pose === "crouch") { cy += L * .4; cx += 1; hdy = 2; o.eye = "angry"; }
  if (pose === "attack") { cx -= 4; cy -= L * .35; rx *= 1.06; hdx = -2; hdy = -1; o.eye = "angry"; o.mouth = true; }
  if (pose === "hurt") { cx += 2; hdx = 2; hdy = -2; o.eye = "shut"; }
  if (pose === "ko") { ry *= .85; cy = G - ry * .8; o.eye = "x"; o.tongue = true; }
  const hip = cy + ry * .5, F = cx - rx * .55, B = cx + rx * .55, sp = S.splay || 0;
  let legs;
  if (pose === "ko") legs = [[F + 3, cy + ry * .3, F - L * .7 + 3, G], [B + 3, cy + ry * .3, B - L * .5 + 3, G], [F, cy + ry * .4, F - L * .8, G], [B, cy + ry * .4, B - L * .6, G]];
  else if (pose === "attack") legs = [[F + 3, hip, F - L * .8 + 3, hip + L * .45], [B + 3, hip, B + L * .8 + 3, G - 1], [F, hip, F - L * .9, hip + L * .6], [B, hip, B + L * .9, G]];
  else if (pose === "crouch") legs = [[F + 3, hip, F - 1 - sp, G], [B + 3, hip, B + 6 + sp, G], [F, hip, F - 4 - sp, G], [B, hip, B + 3 + sp, G]];
  else legs = [[F + 3, hip, F + 2 - sp, G], [B + 3, hip, B + 4 + sp, G], [F, hip, F - 1 - sp, G], [B, hip, B + 1 + sp, G]];
  let hx = cx - rx - (S.neck || 0) + hdx, hy = cy - (S.hu || 0) + hdy;
  if (pose === "ko") { hx = cx - rx - (S.neck || 0) * .6; hy = G - (S.hr || 5) + 1; }
  hy = Math.max(hy, (S.hr || 5) + 4);   // orelhas não saem do quadro no bote
  return {cx, cy, rx, ry, hip, legs, hx, hy, o, G, pose, f, L};
}
function quad(S, pose, f) {
  const d = rigGrid(1, S.W, S.H), P = quadPose(S, pose, f), C = S.C, lc = S.legC || [C.b, C.B];
  const leg = (l, far) => {
    d.limb(l[0], l[1], l[2], l[3], S.lw, far ? lc[1] : lc[0], far ? (C.F || lc[1]) : lc[1]);
    if (S.paw) d.ellipse(l[2] - 1, l[3], S.lw * .6, 1.5, far ? S.paw[1] : S.paw[0]);
  };
  d.part(); leg(P.legs[0], true); leg(P.legs[1], true);
  if (S.tail) { d.part(); S.tail(d, P, C); }
  d.part().ellipse(P.cx, P.cy, P.rx, P.ry, C.b, C.B, .5);
  d.limb(P.cx - P.rx * .75, P.cy - P.ry * .2, P.hx + 2, P.hy + 1, Math.max(3, P.ry * .9), C.b, C.B);   // pescoço
  if (C.l) d.ellipse(P.cx - 1, P.cy + P.ry * .5, P.rx * .7, P.ry * .38, C.l);
  if (S.pattern) S.pattern(d, P, C);
  d.part(); leg(P.legs[2]); leg(P.legs[3]);
  if (S.claw) [P.legs[2], P.legs[3]].forEach(l => S.claw(d, l[2], l[3]));
  d.part(); S.head(d, P.hx, P.hy, P.o, C, P);
  return {c: d.canvas(), head: [P.hx, P.hy]};
}

/* ---------- cabeças ---------- */
function catHead(d, hx, hy, o, C, s = 1) {
  const q = (x, y) => [hx + x * s, hy + y * s];
  d.part().poly([q(1, -4), q(3, -9), q(6, -3)], C.b).dots([q(3, -6), q(3, -5)], C.k);   // orelha
  d.part().ellipse(hx, hy, 7.5 * s, 6.5 * s, C.b, C.B, .6);
  d.ellipse(hx - 1 * s, hy + 3 * s, 6 * s, 3.4 * s, C.l);
  d.ellipse(hx - 5 * s, hy + 1.5 * s, 3.6 * s, 2.8 * s, C.l, C.L, .6);
  d.dots([q(-8, 0), q(-7, 0), q(-8, 1)], BN);
  d.dots([q(2, -3), q(4, -1), q(3, 2), q(5, 1)], C.k);
  const [ex, ey] = q(-3, -2.5); bEye(d, Math.round(ex), Math.round(ey), o);
  if (o.mouth) { const [mx, my] = q(-9, 3); bMouth(d, mx, my, 6 * s + 1); }
  if (o.tongue) { const [tx, ty] = q(-8, 4); d.part().rect(tx, ty, 2, 2, BR); }
}

/* ---------- espécies ---------- */
const rosette = (d, x, y, c) => d.dots([[x, y], [x + 1, y], [x - 1, y + 1], [x + 2, y + 1], [x, y + 2], [x + 1, y + 2]], c);
const QUADS = {
  onca: {W: 60, H: 38, cx: 33, rx: 17, ry: 7.5, leg: 11, lw: 4.5, neck: 4, hu: 7.6, hr: 6.5,
    C: {b: "#f2a20c", B: "#c27406", l: "#fbe3a8", L: "#e0b870", k: "#3a1d0e", F: "#9a5c04"}, paw: ["#fbe3a8", "#e0b870"],
    head: (d, x, y, o, C) => catHead(d, x, y, o, C),
    tail: (d, P, C) => { const x = P.cx + P.rx - 3, y = P.cy - 1, up = P.pose === "ko" ? [[x + 7, y + 3], [x + 10, y + 6]] : P.pose === "attack" ? [[x + 6, y - 2], [x + 10, y]] : [[x + 6, y - 5], [x + 8, y - 11]];
      bChain(d, [[x, y], ...up], 3, C.b, C.B); d.dots([up[1], [up[1][0], up[1][1] + 1]], C.k); },
    pattern: (d, P, C) => [[-9, -4], [-2, -5], [5, -4], [11, -2], [-6, 0], [1, -1], [8, 1]].forEach(([x, y]) => rosette(d, Math.round(P.cx + x), Math.round(P.cy + y), C.k))},
  jaguatirica: {W: 50, H: 30, cx: 28, rx: 13, ry: 6, leg: 8, lw: 3.5, neck: 3, hu: 6, hr: 5,
    C: {b: "#e2ad5c", B: "#b07a34", l: "#f8e6bf", L: "#d8bd8a", k: "#3a2010", F: "#8a5a24"}, paw: ["#f8e6bf", "#d8bd8a"],
    head: (d, x, y, o, C) => catHead(d, x, y, o, C, .8),
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy - 1, e = P.pose === "ko" ? [x + 9, y + 4] : [x + 10, y - 3];
      bChain(d, [[x, y], [x + 5, y - 1], e], 2.5, C.b, C.B); d.dots([[x + 4, y - 1], [x + 7, y - 2], e], C.k); },
    pattern: (d, P, C) => [[-8, -3], [-3, -4], [2, -4], [7, -3], [-5, 0], [1, -1], [6, 0]].forEach(([x, y]) => d.limb(P.cx + x, P.cy + y, P.cx + x + 2, P.cy + y, 1, C.k))},
  cotia: {W: 40, H: 24, cx: 22, rx: 10, ry: 6, leg: 6, lw: 2.5, neck: 2, hu: 3, hr: 4,
    C: {b: "#b8763e", B: "#8a5228", l: "#d9a066"}, legC: ["#7a4a2a", "#5a3420"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 2, y - 5, 2, 2.5, C.B);
      d.part().ellipse(x, y, 5, 4.2, C.b, C.B, .6).ellipse(x - 4, y + 1, 2.6, 2, C.l);
      d.dots([[x - 6, y + 1]], BN); bEye(d, x - 1, y - 1, o);
      if (o.mouth) bMouth(d, x - 6, y + 2, 3, true); if (o.tongue) d.dots([[x - 5, y + 3]], BR);
    },
    tail: (d, P, C) => d.ellipse(P.cx + P.rx, P.cy - 1, 2, 1.5, C.B),
    pattern: (d, P, C) => d.dots([[P.cx - 4, P.cy - 4], [P.cx + 1, P.cy - 5], [P.cx + 5, P.cy - 4]], C.B)},
  cassaco: {W: 48, H: 28, cx: 27, rx: 12, ry: 6.5, leg: 6, lw: 3, neck: 4, hu: 4, hr: 4,
    C: {b: "#9a9aa0", B: "#6c6c74", l: "#c8c8cc"}, legC: ["#3a3a40", "#26262c"], paw: ["#e8a0a0", "#b87878"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 3, y - 4, 2.5, 2.5, "#26262c");
      d.part().ellipse(x, y, 5, 4, "#eeeeea", "#c8c8c4", .6).poly([[x - 3, y - 2], [x - 10, y + 1], [x - 3, y + 3]], "#eeeeea", "#c8c8c4", x - 6);
      d.dots([[x - 10, y + 1], [x - 9, y + 1]], "#e87a8a"); d.dots([[x - 1, y - 2], [x, y - 2], [x - 2, y - 1]], "#7a7a80");
      bEye(d, x - 1, y - 1, o); if (o.mouth) bMouth(d, x - 9, y + 2, 4); if (o.tongue) d.dots([[x - 7, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy + 1, e = P.pose === "ko" ? [[x + 6, y + 3], [x + 10, y + 2]] : [[x + 6, y + 2], [x + 9, y - 2], [x + 7, y - 5]];
      bChain(d, [[x, y], ...e], [2.5, 1.5], "#e8a0a0", "#b87878"); }},
  quati: {W: 52, H: 32, cx: 30, rx: 12, ry: 6, leg: 7, lw: 3, neck: 5, hu: 3, hr: 4,
    C: {b: "#9a6a3e", B: "#6e4826", l: "#d8b98a"}, legC: ["#4a3020", "#36221a"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 3, y - 4, 1.8, 1.8, C.B);
      d.part().ellipse(x, y, 4.5, 4, C.b, C.B, .6).poly([[x - 3, y - 2], [x - 11, y], [x - 11, y + 2], [x - 3, y + 3]], C.b, C.B, x - 7);
      d.dots([[x - 11, y], [x - 11, y + 1]], BN); d.dots([[x - 3, y - 3], [x - 2, y - 3], [x - 4, y + 1], [x - 3, y + 1]], "#f4ecd8");
      bEye(d, x - 1, y - 1, o); if (o.mouth) bMouth(d, x - 10, y + 2, 4); if (o.tongue) d.dots([[x - 8, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy - 1, pts = P.pose === "ko" ? [[x, y], [x + 6, y + 2], [x + 11, y + 4]] : [[x, y], [x + 4, y - 6], [x + 5, y - 13], [x + 3, y - 19]];
      for (let i = 0; i + 1 < pts.length; i++) d.limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3.5, i % 2 ? "#3a2618" : "#c8a070"); }},
  tamandua: {W: 60, H: 32, cx: 34, rx: 14, ry: 7, leg: 8, lw: 3.5, neck: 5, hu: 2, hr: 3,
    C: {b: "#d8b06a", B: "#a8823e", l: "#e8cc90"}, legC: ["#d8b06a", "#a8823e"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 3, y - 3, 1.6, 2, C.B);
      d.part().ellipse(x + 1, y, 4, 3.5, C.b, C.B, .6).limb(x - 1, y + 1, x - 13, y + 3, 3, C.b, C.B);
      d.dots([[x - 13, y + 3], [x - 14, y + 3]], BN); bEye(d, x, y - 1, o);
      if (o.mouth || o.tongue) d.part().limb(x - 14, y + 4, x - 18, y + 7, 1, BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy, e = P.pose === "ko" ? [[x + 7, y + 3], [x + 11, y + 6]] : [[x + 6, y + 3], [x + 9, y + 9], [x + 6, y + 12]];
      bChain(d, [[x, y], ...e], [4, 2], C.b, C.B); },
    pattern: (d, P, C) => d.poly([[P.cx - 3, P.cy - P.ry], [P.cx + 4, P.cy - P.ry + 1], [P.cx - 6, P.cy + P.ry * .6], [P.cx - 12, P.cy + P.ry * .4]], "#2a2018"),
    claw: (d, x, y) => d.dots([[x - 3, y + 1], [x - 2, y + 1]], "#2a2018")},
  queixada: {W: 52, H: 32, cx: 28, rx: 14, ry: 8, leg: 6, lw: 3.5, neck: 2, hu: 1, hr: 5,
    C: {b: "#3e3a3a", B: "#262222", l: "#4e4848"}, paw: ["#151212", "#0e0c0c"],
    head: (d, x, y, o, C) => {
      d.part().poly([[x + 2, y - 5], [x + 4, y - 9], [x + 6, y - 4]], C.b);
      d.part().poly([[x + 5, y - 5], [x - 9, y + 1], [x - 9, y + 5], [x + 5, y + 6]], C.b, C.B, x).ellipse(x - 9, y + 3, 1.5, 2.2, "#8a7a78");
      d.limb(x - 1, y + 6, x + 4, y + 1, 2, "#d8d2c8");   // colar branco
      bEye(d, x - 2, y, o);
      if (o.mouth) { bMouth(d, x - 8, y + 5, 4, false); d.dots([[x - 6, y + 4], [x - 6, y + 3]], BW); }
      if (o.tongue) d.dots([[x - 7, y + 6]], BR);
    },
    tail: (d, P, C) => d.limb(P.cx + P.rx - 1, P.cy - 2, P.cx + P.rx + 2, P.cy, 2, C.B),
    pattern: (d, P, C) => { for (let i = -10; i <= 10; i += 3) d.dots([[Math.round(P.cx + i), Math.round(P.cy - P.ry + 1 + Math.abs(i) * .15)]], "#6e6666"); }},
  anta: {W: 60, H: 34, cx: 33, rx: 17, ry: 9.5, leg: 7, lw: 4.5, neck: 1, hu: 2, hr: 5,
    C: {b: "#4a4a54", B: "#30303a", l: "#5a5a66"}, paw: ["#1e1e24", "#141418"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 3, y - 6, 2.2, 3, C.B).dots([[x + 3, y - 9], [x + 2, y - 8]], "#d8d2c8");
      d.part().ellipse(x, y, 6, 5, C.b, C.B, .6);
      const tip = o.mouth ? [x - 11, y - 3] : o.tongue ? [x - 10, y + 4] : [x - 10, y + 5];
      d.limb(x - 4, y, tip[0], tip[1], 3, C.b, C.B);
      bEye(d, x - 1, y - 2, o); if (o.mouth) bMouth(d, x - 6, y + 3, 4, false);
    },
    tail: (d, P, C) => d.ellipse(P.cx + P.rx, P.cy - 2, 1.5, 2, C.B)},
  capivara: {W: 56, H: 34, cx: 31, rx: 18, ry: 9.5, leg: 5, lw: 4, neck: 1, hu: 8, hr: 5,
    C: {b: "#9a6436", B: "#6e4424", l: "#b9824f", g: "#7a4a2e"}, paw: ["#2a1a10", "#1e120a"],
    head: (d, hx, hy, o, C) => {
      d.part().ellipse(hx + 6, hy - 6, 2.2, 2, C.B).dots([[hx + 6, hy - 6]], BN);
      d.part().poly([[hx - 9, hy - 3], [hx - 7, hy - 6], [hx + 6, hy - 6], [hx + 8, hy - 2], [hx + 8, hy + 5], [hx - 9, hy + 5]], C.b, C.B, hx + 3);
      d.rect(hx - 10, hy - 2, 3, 5, C.l).dots([[hx - 10, hy - 1], [hx - 10, hy]], BN);
      bEye(d, hx, hy - 3, o);
      if (o.mouth) d.part().rect(hx - 9, hy + 4, 6, 3, BN).rect(hx - 8, hy + 4, 3, 2, BW);
      else d.dots([[hx - 8, hy + 4], [hx - 7, hy + 4], [hx - 6, hy + 4]], "#3a2414");
      if (o.tongue) d.dots([[hx - 9, hy + 5]], BR);
    },
    pattern: (d, P, C) => d.dots([[P.cx - 6, P.cy - 6], [P.cx + 2, P.cy - 7], [P.cx + 9, P.cy - 5], [P.cx - 2, P.cy - 3], [P.cx + 6, P.cy - 2]], C.g)},
  ariranha: {W: 60, H: 24, cx: 30, rx: 17, ry: 5.5, leg: 4, lw: 3, neck: 2, hu: 2, hr: 4,
    C: {b: "#5a3a24", B: "#3e2614", l: "#6e4a30"}, legC: ["#4a2e1a", "#36200e"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 3, y - 4, 1.5, 1.5, C.B);
      d.part().ellipse(x, y, 5.5, 4, C.b, C.B, .6).ellipse(x - 4, y + 1, 2.5, 2, C.l).ellipse(x + 1, y + 4, 3.5, 1.8, "#e8d8b0");
      d.dots([[x - 7, y]], BN); d.dots([[x - 6, y + 2], [x - 8, y + 3]], "#d8c8a0");
      bEye(d, x - 1, y - 1, o); if (o.mouth) bMouth(d, x - 7, y + 2, 4); if (o.tongue) d.dots([[x - 6, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 3, y = P.cy, e = P.pose === "attack" ? [x + 12, y - 3] : [x + 12, y + 2];
      bChain(d, [[x, y], [x + 6, y + 1], e], [5, 2], C.b, C.B); }},
  tatu: {W: 44, H: 28, cx: 24, rx: 12, ry: 8, leg: 4, lw: 3, neck: 1, hu: 0, hr: 4,
    C: {b: "#8a7a6a", B: "#5e5044"}, legC: ["#a89080", "#7a6658"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 2, y - 5, 1.5, 3, "#a89080").ellipse(x + 4, y - 5, 1.5, 3, "#7a6658");
      d.part().poly([[x + 3, y - 3], [x - 8, y + 2], [x + 3, y + 4]], "#a89080", "#7a6658", x);
      d.dots([[x - 8, y + 2]], BN); bEye(d, x - 1, y, o);
      if (o.mouth) bMouth(d, x - 7, y + 3, 3, false); if (o.tongue) d.dots([[x - 6, y + 3]], BR);
    },
    tail: (d, P, C) => d.limb(P.cx + P.rx - 2, P.cy + 2, P.cx + P.rx + 6, P.cy + (P.pose === "ko" ? 4 : 5), 2.5, "#a89080", "#7a6658"),
    pattern: (d, P, C) => {
      for (let i = -6; i <= 6; i += 3) d.limb(P.cx + i, P.cy - P.ry + 1 + Math.abs(i) * .2, P.cx + i, P.cy + P.ry * .6, 1, C.B);
      d.limb(P.cx - P.rx + 1, P.cy + P.ry * .6, P.cx + P.rx - 1, P.cy + P.ry * .6, 1, "#5e5044");
      d.dots([[P.cx - 9, P.cy - 2], [P.cx + 9, P.cy - 2], [P.cx - 8, P.cy + 2], [P.cx + 8, P.cy + 2]], "#b8a898");
    }},
  calango: {W: 46, H: 20, cx: 22, rx: 10, ry: 4, leg: 4, lw: 2, splay: 3, neck: 3, hu: 1, hr: 3,
    C: {b: "#5a9a3a", B: "#3a6a24", l: "#a8c86a"},
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 5, 3, C.b, C.B, .6).poly([[x - 3, y - 2], [x - 8, y + 1], [x - 3, y + 2]], C.b, C.B, x - 5);
      bEye(d, x, y - 1, o); if (o.mouth) bMouth(d, x - 7, y + 1, 3, false);
      if (o.tongue) d.part().limb(x - 8, y + 1, x - 11, y + 2, 1, BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy, e = P.pose === "attack" ? [[x + 8, y - 3], [x + 16, y - 6]] : [[x + 8, y + 1], [x + 17, y + 3]];
      bChain(d, [[x, y], ...e], [3, 1], C.b, C.B); },
    pattern: (d, P, C) => { for (let i = -8; i <= 8; i += 3) d.dots([[Math.round(P.cx + i), Math.round(P.cy - 2)]], "#c8e88a"); }},
  jacare: {W: 68, H: 24, cx: 38, rx: 17, ry: 5, leg: 4, lw: 3, splay: 3, neck: 6, hu: 1, hr: 3,
    C: {b: "#4a6a3a", B: "#2e4624", l: "#b8b890"},
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 4, y, 5, 3.6, C.b, C.B, .6);
      if (o.mouth) {
        d.poly([[x + 2, y - 3], [x - 14, y - 6], [x - 13, y - 3], [x + 2, y]], C.b, C.B, x - 4);   // queixo de cima
        d.poly([[x + 2, y + 1], [x - 13, y + 4], [x - 12, y + 6], [x + 2, y + 3]], C.b, C.B, x - 4);
        d.part().poly([[x + 1, y], [x - 12, y - 3], [x - 11, y + 3]], "#c8506a");
        d.dots([[x - 11, y - 3], [x - 7, y - 2], [x - 3, y - 1], [x - 10, y + 3], [x - 5, y + 2]], BW);
      } else {
        d.poly([[x + 2, y - 3], [x - 14, y - 1], [x - 14, y + 2], [x + 2, y + 3]], C.b, C.B, x - 4);
        d.dots([[x - 10, y + 2], [x - 6, y + 2], [x - 2, y + 2]], BW); d.dots([[x - 13, y - 1]], BN);
      }
      d.ellipse(x + 2, y - 3, 2, 1.6, C.b); bEye(d, x + 2, y - 3, o);
      if (o.tongue) d.dots([[x - 4, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 3, y = P.cy, e = P.pose === "attack" ? [[x + 8, y - 2], [x + 16, y - 5]] : [[x + 8, y + 1], [x + 17, y + 2]];
      bChain(d, [[x, y], ...e], [6, 2], C.b, C.B); d.dots([[x + 3, y - 3], [x + 7, y - 2], [x + 11, y - 1]], C.B); },
    pattern: (d, P, C) => { for (let i = -13; i <= 13; i += 3) d.dots([[Math.round(P.cx + i), Math.round(P.cy - P.ry + 1)], [Math.round(P.cx + i + 1), Math.round(P.cy - 1)]], C.B); }},
  preguica: {W: 44, H: 38, cx: 24, rx: 11, ry: 8, leg: 10, lw: 3, splay: 3, neck: 1, hu: 6, hr: 5,
    C: {b: "#9a8a70", B: "#6e604a", l: "#b8a888"},
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 6, 5.5, C.b, C.B, .6).ellipse(x - 1, y + 1, 4.5, 3.8, "#e8dcc0");
      d.limb(x - 4, y, x + 1, y - 1, 2, "#3a2a1a");   // máscara escura dos olhos
      if (o.eye === "x" || o.eye === "shut") bEye(d, x - 2, y - 1, o, "#f4ecd8"); else d.dots([[x - 2, y - 1]], BW);
      d.dots([[x - 4, y + 2]], BN);
      if (o.mouth) bMouth(d, x - 4, y + 3, 3, false); else d.dots([[x - 3, y + 4], [x - 2, y + 4]], "#5a4a3a");
      if (o.tongue) d.dots([[x - 3, y + 4]], BR);
    },
    pattern: (d, P, C) => d.dots([[P.cx - 6, P.cy - 5], [P.cx - 1, P.cy - 6], [P.cx + 4, P.cy - 5], [P.cx + 7, P.cy - 2], [P.cx - 4, P.cy - 1], [P.cx + 2, P.cy - 2]], "#b8a888"),
    claw: (d, x, y) => d.dots([[x - 3, y], [x - 4, y + 1], [x - 2, y + 1]], "#2a1a10")}
};

/* ---------- macaco (sentado, rabo enrolado) ---------- */
function macaco(pose, f) {
  const d = rigGrid(1, 40, 40), G = 37, C = {b: "#6a4a34", B: "#4a3020", l: "#d8b088", L: "#b08a64"}, o = {eye: "open"};
  let body, head, arms, legs, tail;
  if (pose === "ko") {
    o.eye = "x"; o.tongue = true;
    d.part(); bChain(d, [[30, 33], [35, 31], [37, 34]], 2.5, C.b, C.B);
    d.part().ellipse(22, 33, 10, 4.5, C.b, C.B, .5).ellipse(21, 34, 6, 2, C.l);
    d.part().limb(15, 32, 8, 36, 2.5, C.b, C.B).limb(26, 33, 32, 37, 3, C.b, C.B);
    head = [9, 31];
  } else {
    const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt";
    const cy = (at ? 21 : cr ? 29 : 27) + (pose === "idle" ? f : 0), cx = at ? 19 : hu ? 24 : 22;
    tail = at ? [[cx + 5, cy + 3], [cx + 12, cy + 1], [cx + 16, cy - 4]] : [[cx + 5, cy + 5], [cx + 12, cy + 4], [cx + 14, cy - 3], [cx + 11, cy - 7]];
    d.part(); bChain(d, tail, 2.5, C.b, C.B);
    if (at) { d.part().limb(cx + 2, cy + 5, cx + 12, cy + 10, 3.5, C.B).limb(cx - 1, cy + 6, cx + 8, cy + 13, 3.5, C.b, C.B); }
    else { d.part().limb(cx + 2, cy + 5, cx - 4, cy + 7, 3.5, C.B).limb(cx - 4, cy + 7, cx - 3, G, 3, C.B); }
    d.part().ellipse(cx, cy, 7, at ? 7.5 : 9, C.b, C.B, .5).ellipse(cx - 2, cy + 1, 4, 6, C.l, C.L, .7);
    if (!at) d.part().limb(cx + 1, cy + 5, cx - 6, cy + 6, 4, C.b, C.B).limb(cx - 6, cy + 6, cx - 5, G, 3.5, C.b, C.B);
    arms = at ? [[cx - 3, cy - 4, cx - 15, cy - 6], [cx - 1, cy - 3, cx - 14, cy - 2]] : cr ? [[cx - 3, cy - 4, cx - 9, G], [cx, cy - 3, cx - 6, G]] : [[cx - 3, cy - 4, cx - 7, cy + 4], [cx, cy - 3, cx - 3, cy + 5]];
    d.part().limb(...arms[0], 3, C.b, C.B).ellipse(arms[0][2], arms[0][3], 1.6, 1.6, C.l);
    head = at ? [cx - 6, cy - 9] : hu ? [cx - 1, cy - 14] : cr ? [cx - 5, cy - 11] : [cx - 3, cy - 13 + 0];
    if (at || cr) o.eye = "angry"; if (at) o.mouth = true; if (hu) o.eye = "shut";
    d.part().limb(...arms[1], 3, C.b, C.B).ellipse(arms[1][2], arms[1][3], 1.6, 1.6, C.l);
  }
  const [x, y] = head;
  d.part().ellipse(x + 5, y, 2, 2.2, C.l);
  d.part().ellipse(x, y, 6, 5.5, C.b, C.B, .6).ellipse(x - 2, y + 1, 4, 4, C.l, C.L, .7);
  bEye(d, x - 3, y - 1, o); bEye(d, x, y - 1, o); d.dots([[x - 3, y + 2]], BN);
  if (o.mouth) bMouth(d, x - 4, y + 3, 3); else d.dots([[x - 3, y + 4], [x - 2, y + 4]], C.B);
  if (o.tongue) d.dots([[x - 3, y + 4]], BR);
  return {c: d.canvas(), head};
}

/* ---------- harpia ---------- */
function harpia(pose, f) {
  const d = rigGrid(1, 56, 44), G = 41, C = {b: "#5e5e68", B: "#3e3e48", w: "#ececf0", W: "#c8c8d0", h: "#b8b8c4", y: "#e8c040", Y: "#b8902a"}, o = {eye: "open"};
  let head;
  if (pose === "ko") {
    o.eye = "x";
    d.part().poly([[16, 34], [44, 30], [52, 38], [20, 39]], C.B);   // asa aberta no chão
    d.part().ellipse(30, 34, 12, 6, C.b, C.B, .5).ellipse(26, 36, 8, 3, C.w);
    d.part().limb(32, 30, 36, 24, 3, C.y, C.Y).limb(38, 31, 42, 25, 3, C.y, C.Y).dots([[35, 23], [37, 23], [41, 24], [43, 24]], BN);
    head = [14, 35];
  } else {
    const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", cy = (cr ? 27 : at ? 22 : 25) + (pose === "idle" ? f : 0), cx = at ? 27 : 30;
    if (at) { d.part().poly([[cx, cy - 6], [cx + 6, cy - 22], [cx + 22, cy - 18], [cx + 12, cy - 4]], C.B); d.dots([[cx + 8, cy - 19], [cx + 13, cy - 18], [cx + 18, cy - 17]], C.w); }
    d.part().poly([[cx + 4, cy + 6], [cx + 16, cy + 14], [cx + 12, cy + 16], [cx + 1, cy + 9]], C.B);   // cauda
    const foot = at ? [[cx - 4, cy + 9, cx - 12, cy + 14], [cx - 1, cy + 10, cx - 8, cy + 16]] : [[cx - 2, cy + 8, cx - 3, G], [cx + 2, cy + 8, cx + 2, G]];
    d.part().limb(...foot[1], 3, C.Y);
    d.part().ellipse(cx, cy, 9, 11, C.b, C.B, .5).ellipse(cx - 4, cy + 2, 5, 8, C.w, C.W, .7);
    d.limb(cx - 7, cy - 6, cx - 2, cy - 7, 2, "#2a2a32");   // faixa escura do peito
    d.part().limb(...foot[0], 3, C.y, C.Y);
    [foot[0], foot[1]].forEach(l => d.dots([[l[2] - 2, l[3]], [l[2] + 1, l[3]], [l[2] - 1, l[3] + 1]], BN));
    const wing = at ? [[cx - 2, cy - 6], [cx - 8, cy - 22], [cx - 20, cy - 16], [cx - 8, cy - 4]] : cr ? [[cx - 3, cy - 7], [cx + 12, cy - 12], [cx + 13, cy + 6], [cx + 2, cy + 6]] : [[cx - 2, cy - 7], [cx + 10, cy - 4], [cx + 12, cy + 9], [cx + 1, cy + 8]];
    d.part().poly(wing, C.b, C.B, cx + 6);
    d.dots(at ? [[cx - 10, cy - 19], [cx - 14, cy - 17], [cx - 18, cy - 16]] : [[cx + 9, cy + 8], [cx + 11, cy + 7], [cx + 7, cy + 7]], C.B);
    head = at ? [cx - 9, cy - 9] : hu ? [cx - 5, cy - 15] : cr ? [cx - 7, cy - 10] : [cx - 6, cy - 13];
    if (at || cr) o.eye = "angry"; if (at) o.mouth = true; if (hu) o.eye = "shut";
  }
  const [x, y] = head;
  d.part().poly([[x + 2, y - 4], [x + 9, y - 9], [x + 6, y - 2]], "#4a4a54").poly([[x + 4, y - 3], [x + 10, y - 5], [x + 6, y]], "#4a4a54");   // penacho
  d.part().ellipse(x, y, 6, 5, C.h, "#9898a4", .6);
  d.part().poly([[x - 5, y - 1], [x - 10, y + 1], [x - 9, y + 4], [x - 5, y + 3]], "#2a2a32");   // bico em gancho
  if (o.mouth) d.dots([[x - 8, y + 2], [x - 7, y + 2]], BR);
  bEye(d, x - 2, y - 1, o);
  return {c: d.canvas(), head: [x, y]};
}

/* ---------- caranguejeira ---------- */
function caranguejeira(pose, f) {
  const d = rigGrid(1, 48, 26), G = 23, C = {b: "#3a2a2a", B: "#24181a", l: "#5e4444", h: "#8a6a6a"};
  if (pose === "ko") {   // de barriga para cima, patas encolhidas
    d.part();
    [[13, -3], [17, -1], [21, 1], [25, 3]].forEach(([x, lean]) => d.limb(x, 18, x + lean - 2, 11, 2, C.l).limb(x + lean - 2, 11, x + lean + 1, 9, 1.6, C.l));
    d.part().ellipse(30, 19, 9, 4.5, C.b, C.B, .5).ellipse(16, 19, 6, 3.5, C.b, C.B, .5);
    d.dots([[11, 18], [13, 17]], BN).dots([[10, 17], [12, 18], [14, 16], [12, 16], [11, 19], [13, 19]], BN);
    return {c: d.canvas(), head: [13, 16]};
  }
  const at = pose === "attack", cr = pose === "crouch", dy = (cr ? 3 : at ? -1 : 0) + (pose === "idle" ? f : 0), up = cr ? 3 : 0;
  // [base x, joelho, pé] de cada pata, da frente para trás
  const LEGS = [[17, [9, 7 + up], [2, G]], [19, [14, 5 + up], [9, G]], [21, [27, 6 + up], [33, G]], [22, [33, 8 + up], [43, G]]];
  if (at) { LEGS[0] = [17, [10, 1], [3, 3]]; LEGS[1] = [19, [14, 0], [8, -1]]; }   // patas da frente erguidas, ameaçando
  const leg = (i, far) => {
    const [bx, kn, ft] = LEGS[i], o = far ? 2 : 0, ky = kn[1] + (i % 2 ? f : 0) - (far ? 1 : 0);
    d.limb(bx + o, 15 + dy, kn[0] + o, ky, 2.2, far ? C.B : C.l).limb(kn[0] + o, ky, ft[0] + o, ft[1], 1.8, far ? C.B : C.l);
    if (!far) d.dots([[kn[0], ky]], C.h);
  };
  d.part(); [0, 1, 2, 3].forEach(i => leg(i, true));
  d.part(); leg(2); leg(3);
  d.part().ellipse(32, 12 + dy, 9, 7, C.b, C.B, .5).dots([[28, 8 + dy], [32, 7 + dy], [36, 9 + dy], [30, 12 + dy], [34, 13 + dy], [38, 12 + dy]], C.h);
  d.part().ellipse(19, 14 + dy, 6.5, 4.5, C.b, C.B, .5).dots([[19, 11 + dy], [22, 12 + dy]], C.h);
  d.part(); leg(0); leg(1);
  d.part().limb(14, 16 + dy, at ? 10 : 12, (at ? 21 : 20) + dy, 2.4, C.B);   // presas
  if (pose === "hurt") d.dots([[15, 12 + dy], [17, 12 + dy]], BN); else d.dots([[15, 12 + dy], [17, 12 + dy], [16, 11 + dy]], BR);
  return {c: d.canvas(), head: [16, 12 + dy]};
}

/* ---------- cobras (sucuri, surucucu; a Cobra-Grande usa a sucuri) ---------- */
function cobra(C, tri) {
  return (pose, f) => {
    const d = rigGrid(1, 56, 36), o = {eye: "open"}, coil = [[53, 31], [44, 33], [34, 33], [24, 32], [18, 29], [22, 25], [32, 25], [40, 27]];
    let neck, head;
    if (pose === "ko") { o.eye = "x"; o.tongue = true; neck = []; head = [9, 30]; }
    else if (pose === "attack") { o.eye = "angry"; o.mouth = true; neck = [[40, 22], [28, 17], [16, 15]]; head = [11, 15]; }
    else if (pose === "crouch") { o.eye = "angry"; neck = [[43, 22], [41, 16], [35, 13]]; head = [31, 13]; }
    else if (pose === "hurt") { o.eye = "shut"; neck = [[43, 22], [40, 14], [36, 9]]; head = [33, 7]; }
    else { neck = [[42, 22], [37, 15], [31, 12]]; head = [26 + f, 12]; }
    const path = pose === "ko" ? [[54, 32], [45, 31], [36, 33], [27, 31], [18, 32], [12, 31]] : [...coil, ...neck];
    d.part(); bChain(d, path, pose === "ko" ? [5, 6] : [4, 6.5], C.b, C.B);
    path.forEach(([x, y], i) => { if (i % 1 === 0 && i < path.length - 1) { const nx = (x + path[i + 1][0]) / 2, ny = (y + path[i + 1][1]) / 2; d.dots(tri ? [[nx, ny - 1], [nx - 1, ny], [nx + 1, ny], [nx, ny + 1]] : [[nx, ny - 1], [nx + 1, ny - 1]], C.k); } });
    const [x, y] = head;
    d.part();
    if (tri) d.poly([[x + 4, y - 4], [x - 6, y - 1], [x - 6, y + 2], [x + 4, y + 4], [x + 6, y]], C.b, C.B, x + 1);
    else d.ellipse(x, y, 6, 3.6, C.b, C.B, .6);
    d.dots([[x - 5, y - 1]], BN);
    bEye(d, x - 2, y - 1, o);
    if (o.mouth) { d.part().poly([[x - 6, y + 1], [x + 1, y + 2], [x - 5, y + 6]], BN).dots([[x - 5, y + 2], [x - 3, y + 2]], BW); }
    if (o.tongue || (pose === "idle" && f)) d.part().limb(x - 6, y + 1, x - 10, y + 1, 1, BR).dots([[x - 11, y], [x - 11, y + 2]], BR);
    return {c: d.canvas(), head: [x, y]};
  };
}

/* ---------- peixes: piranha e poraquê ---------- */
function piranha(pose, f) {
  const d = rigGrid(1, 60, 32), C = {b: "#8a9aa0", B: "#5a6a70", r: "#e05a3a", R: "#b03a24", k: "#5a4a4a"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const cx = pose === "attack" ? 27 : pose === "crouch" ? 33 : 30, cy = 15, fl = pose === "idle" ? f * 2 : 0;
  d.part().poly([[cx + 13, cy], [cx + 24, cy - 9 + fl], [cx + 22, cy], [cx + 24, cy + 9 - fl]], C.B);   // cauda
  d.part().poly([[cx - 2, cy - 9], [cx + 6, cy - 14], [cx + 10, cy - 7]], C.B);   // barbatana de cima
  d.part().ellipse(cx, cy, 15, 10, C.b, C.B, .55).ellipse(cx - 2, cy + 5, 11, 4.5, C.r, C.R, .6);
  d.dots([[cx + 2, cy - 4], [cx + 6, cy - 2], [cx + 4, cy + 1], [cx + 8, cy - 5], [cx + 9, cy + 1]], C.k);
  d.part().poly([[cx + 2, cy + 1], [cx + 7, cy + 4], [cx + 2, cy + 5]], C.B);   // nadadeira
  const jaw = pose === "attack" ? 5 : 0;
  d.part().poly([[cx - 15, cy + 1 + jaw], [cx - 6, cy + 1], [cx - 6, cy + 6 + jaw], [cx - 14, cy + 5 + jaw]], C.b, C.B, cx - 9);   // queixo
  if (jaw) d.part().poly([[cx - 14, cy], [cx - 6, cy], [cx - 6, cy + 1 + jaw], [cx - 14, cy + 1 + jaw]], "#5a1a1a");
  d.dots([[cx - 14, cy], [cx - 12, cy], [cx - 10, cy], [cx - 13, cy + 1 + jaw], [cx - 11, cy + 1 + jaw]], BW);
  bEye(d, cx - 8, cy - 4, o);
  if (pose === "ko") {   // de barriga para cima, boiando
    const c = d.canvas(), out = document.createElement("canvas"), x = out.getContext("2d");
    out.width = c.width; out.height = c.height; x.translate(0, c.height); x.scale(1, -1); x.drawImage(c, 0, 0);
    return {c: out, head: [cx - 8, 32 - (cy - 4)]};
  }
  return {c: d.canvas(), head: [cx - 8, cy - 4]};
}
function poraque(pose, f) {
  const d = rigGrid(1, 64, 22), C = {b: "#4a5a3a", B: "#2e3a24", y: "#d8b84a"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const amp = pose === "ko" ? 0 : pose === "crouch" ? 3 : 2, x0 = pose === "attack" ? 5 : pose === "crouch" ? 10 : 7, ph = pose === "idle" ? f * 1.5 : 0;
  const pts = []; for (let i = 0; i <= 8; i++) { const x = x0 + i * 6.5; pts.push([x, 12 + (pose === "ko" ? 5 : 0) + Math.sin(i * .9 + ph) * amp * (i / 8 + .3)]); }
  d.part(); bChain(d, pts, [7, 3], C.b, C.B);
  pts.slice(1, -1).forEach(([x, y]) => d.dots([[x, y + 2], [x + 1, y + 2]], C.y));
  const [hx, hy] = pts[0];
  d.part().ellipse(hx + 1, hy, 5, 4, C.b, C.B, .6).dots([[hx - 3, hy + 1]], BN);
  bEye(d, hx, hy - 1, o);
  if (pose === "attack") {   // choque: faíscas em volta
    d.part();
    [[hx - 6, hy - 5], [hx + 10, hy - 7], [hx + 24, hy - 6], [hx + 38, hy - 7], [hx + 18, hy + 6]].forEach(([x, y]) => d.dots([[x, y], [x + 1, y + 1], [x, y + 2], [x + 1, y + 3]], "#fff07a"));
    d.part().poly([[hx - 4, hy + 1], [hx + 1, hy + 2], [hx - 3, hy + 4]], BN);
  }
  return {c: d.canvas(), head: [hx, hy]};
}

/* ---------- registro e cache ---------- */
const BEAST_DRAW = {macaco, harpia, caranguejeira, piranha, poraque,
  sucuri: cobra({b: "#5a7a3a", B: "#3a5a24", k: "#1e2a14"}, false),
  surucucu: cobra({b: "#b0905a", B: "#806440", k: "#3a2a1a"}, true)};
Object.keys(QUADS).forEach(id => { BEAST_DRAW[id] = (pose, f) => quad(QUADS[id], pose, f); });
const BEAST_CACHE = new Map();
const beastId = id => BEAST_DRAW[id] ? id : BEAST_DRAW[ART[id]] ? ART[id] : null;   // chefes usam o desenho do bicho base
function beastFrame(id, pose = "idle", f = 0) {
  const k = beastId(id); if (!k) return null;
  const key = k + pose + f;
  if (!BEAST_CACHE.has(key)) {
    const r = BEAST_DRAW[k](pose, f);
    r.c.dataset.scale = BEAST_K; r.c.dataset.head = r.head.join(",");
    BEAST_CACHE.set(key, r.c);
  }
  return BEAST_CACHE.get(key);
}
