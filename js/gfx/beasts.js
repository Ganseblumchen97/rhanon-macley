/* Bichos no mesmo traço do Rhanon: formas + contorno automático (rigGrid de gfx/rig.js), em resolução 2x
   (o canvas leva data-scale="2", então aparece no mesmo tamanho dos desenhos antigos).
   Cada bicho tem as poses: idle (f = 0/1, respirando), crouch (agacha antes do bote), attack (bote/boca aberta),
   hurt (levou golpe) e ko (desmaiado, olho em "X"). Todos olham para a esquerda.
   beastFrame(id, pose, f, evil) -> canvas (com dataset.head = posição da cabeça, para as estrelinhas do desmaio).
   evil = bicho tomado pela fumaça de Pytuna: olho vermelho aceso e cenho franzido (nos que usam bEye). */
const BEAST_K = 2, BN = "#22100a", BW = "#ffffff", BR = "#e2363d", BEAST_EVIL_EYE = "#ff2a2a";
let BEAST_EVIL = false;   // ligado só enquanto beastFrame desenha um quadro "tomado"
const PYT_SMOKE = ["#2a2a34", "#3a3a46", "#1a1a22", "#4a3a5a"];   // fumaça de Pytuna saindo dos bichos tomados
// quem a fumaça toma: bicho de verdade (bug do freela e gente não; ver MOTION "person")
const isTomado = a => !!a && !a.bug && MOTION[a.id] !== "person";

/* ---------- peças comuns ---------- */
// olho: open (aberto, com brilho), angry (sobrancelha), shut (fechado), x (desmaio)
function bEye(d, x, y, o, n = BN) {
  if (o.eye === "x") d.dots([[x - 1, y - 1], [x + 1, y - 1], [x, y], [x - 1, y + 1], [x + 1, y + 1]], n);
  else if (o.eye === "shut") d.rect(x - 1, y, 3, 1, n);
  else if (BEAST_EVIL) {   // tomado: olho vermelho com brilho e sempre bravo
    d.rect(x - 1, y - 1, 2, 2, BEAST_EVIL_EYE).dots([[x - 1, y - 1]], "#ffd0c8").dots([[x - 2, y - 2], [x - 1, y - 2], [x, y - 3], [x + 1, y - 3]], n);
  } else {
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
  const G = S.H - 3, L = S.leg, o = {eye: pose === "blink" ? "shut" : "open"};
  if (pose === "blink") pose = "idle";   // piscar = parado de olho fechado
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

// cabeça de cão: crânio redondo, focinho curto, orelha caída (ou em pé no bravo) e coleira
function dogHead(d, x, y, o, C, brave) {
  if (brave) d.part().poly([[x + 1, y - 3], [x + 3, y - 9], [x + 5, y - 3]], C.b).dots([[x + 3, y - 6]], C.B);   // orelha em pé
  d.part().ellipse(x, y, 5.5, 5, C.b, C.B, .6).ellipse(x - 5, y + 2, 3.8, 2.8, C.l, C.B, .6);
  d.dots([[x - 9, y + 1], [x - 8, y + 1], [x - 9, y + 2]], BN);   // nariz
  if (!brave) d.part().poly([[x + 1, y - 4], [x + 6, y - 3], [x + 5, y + 3], [x + 2, y + 1]], C.B);   // orelha caída
  if (o.eye === "angry" || brave) { bEye(d, x - 2, y - 1, {eye: o.eye === "open" ? "angry" : o.eye}); } else bEye(d, x - 2, y - 1, o);
  if (o.mouth) bMouth(d, x - 9, y + 3, 5); else if (brave) d.dots([[x - 7, y + 4], [x - 5, y + 4]], BW);   // dentes à mostra
  if (o.tongue) d.dots([[x - 7, y + 5], [x - 6, y + 5]], BR);
}
function dogQuad(C, brave) {
  return {W: 50, H: 34, cx: 27, rx: 12, ry: 6.5, leg: 9, lw: 3, neck: 1, hu: 5, hr: 5, C, paw: [C.l, C.B],
    head: (d, x, y, o, C) => dogHead(d, x, y, o, C, brave),
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy - 2, e = P.pose === "ko" ? [[x + 5, y + 4], [x + 9, y + 6]] : brave ? [[x + 5, y - 3], [x + 9, y - 5]] : [[x + 4, y - 5], [x + 2, y - 9]];
      bChain(d, [[x, y], ...e], [3, 2.5], C.b, C.B); },
    pattern: (d, P, C) => d.rect(Math.round(P.cx - P.rx - 1), Math.round(P.cy - 4), 3, 6, brave ? "#8a8a90" : BR)};   // coleira (corrente no bravo)
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
  // lobo-guará: pernas compridas e pretas, pescoço curto com crina espetada, rabo cheio de pontas com a ponta branca
  lobo: {W: 56, H: 40, cx: 30, rx: 14, ry: 7, leg: 12, lw: 2.4, neck: 2, hu: 7, hr: 5,
    C: {b: "#c8641c", B: "#8a3e10", l: "#e8a050"}, legC: ["#1a1414", "#0e0a0a"],
    head: (d, x, y, o, C) => {
      d.part().poly([[x + 1, y - 3], [x + 3, y - 11], [x + 6, y - 3]], C.b).poly([[x - 2, y - 3], [x - 2, y - 10], [x + 1, y - 4]], C.B);   // orelhonas
      d.dots([[x + 3, y - 7], [x + 3, y - 6]], "#2a1a14");
      d.part().ellipse(x, y, 5.5, 4.5, C.b, C.B, .6).poly([[x - 3, y - 1], [x - 10, y + 1], [x - 10, y + 3], [x - 3, y + 3]], "#2a1a14");   // focinho preto
      d.part().poly([[x + 3, y + 2], [x + 1, y + 7], [x - 1, y + 3]], C.l).poly([[x + 5, y + 1], [x + 5, y + 6], [x + 2, y + 3]], C.l);   // tufos do queixo
      bEye(d, x - 1, y - 1, o); if (o.mouth) bMouth(d, x - 9, y + 3, 4); if (o.tongue) d.dots([[x - 8, y + 4]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy - 1, e = P.pose === "ko" ? [[x + 6, y + 3], [x + 11, y + 5]] : P.pose === "attack" ? [[x + 6, y - 2], [x + 11, y - 3]] : [[x + 5, y + 3], [x + 9, y + 8]];
      bChain(d, [[x, y], ...e], [5, 4], C.b, C.B);
      const [mx, my] = e[0]; d.poly([[mx - 1, my - 2], [mx + 2, my - 6], [mx + 3, my - 1]], C.b).poly([[mx + 2, my + 2], [mx + 6, my + 1], [mx + 3, my + 4]], C.B);   // pelo espetado
      d.ellipse(e[1][0], e[1][1], 2.5, 2.5, "#f4ecd8"); },
    pattern: (d, P, C) => {   // crina preta espetada da nuca até o meio das costas
      const top = P.cy - P.ry + 1;
      [[-13, 1], [-9, 0], [-5, 0], [-1, 0], [3, 1]].forEach(([dx, dy], i) => { const bx = Math.round(P.cx + dx), by = Math.round(top + dy); d.poly([[bx - 2, by + 2], [bx + (i < 3 ? -1 : 0), by - 4 + i % 2], [bx + 2, by + 2]], "#2a1a14"); });
      d.poly([[P.cx - 13, P.cy - 3], [P.cx - 2, P.cy - P.ry + 1], [P.cx - 2, P.cy - 3], [P.cx - 11, P.cy]], "#2a1a14");
      [[-13, 3]].forEach(([dx, dy]) => { const bx = Math.round(P.cx + dx), by = Math.round(P.cy + dy); d.poly([[bx, by - 2], [bx - 4, by + 1], [bx, by + 2]], C.l); });   // peito felpudo
    }},
  // cães da cidade (vira-lata caramelo, cachorro bravo): pescoço curto, focinho curto, orelha caída e rabo enrolado
  caramelo: dogQuad({b: "#d8963c", B: "#a86a22", l: "#f4d8a0", k: "#2a1a10"}),
  cachorro_bravo: dogQuad({b: "#2e2a2a", B: "#181414", l: "#6a5a4a", k: "#0e0a0a"}, true),
  mula: {W: 60, H: 44, cx: 32, rx: 16, ry: 8, leg: 13, lw: 3.5, neck: 0, hu: 10, hr: 7,
    C: {b: "#4a3020", B: "#2e1c12", l: "#5e3e2a"}, paw: ["#9aa0a8", "#6a7078"],   // ferraduras
    head: (d, x, y, o, C, P) => {   // sem cabeça: o pescoço acaba numa labareda
      const big = o.mouth ? 1.8 : o.eye === "x" ? .5 : 1.35, fl = FLAMES[(P.f + (o.mouth ? 1 : 0)) % 3], fx = x - (o.mouth ? 3 : 0);
      d.part().ellipse(x + 1, y + 2, 4, 3.5, C.b, C.B, .6);
      d.part().ellipse(fx, y - 3 * big, 4 * big, 6 * big, fl[0]).ellipse(fx, y - 2 * big, 2.6 * big, 4 * big, fl[1]).dots([[x, y - 8 * big], [x - 2, y - 7 * big]], fl[2]);
      if (o.mouth) d.part().ellipse(x - 9, y - 1, 3, 2, fl[0]).ellipse(x - 13, y, 2, 1.5, fl[1]);   // labareda para frente
    },
    tail: (d, P, C) => bChain(d, [[P.cx + P.rx - 2, P.cy - 2], [P.cx + P.rx + 5, P.cy + 3], [P.cx + P.rx + 6, P.cy + 10]], [3, 2], "#1e120a"),
    pattern: (d, P, C) => d.rect(P.cx - 6, P.cy - P.ry + 1, 10, 4, "#7a2a1a").rect(P.cx - 6, P.cy - P.ry + 4, 10, 1, "#c8a040")},   // sela
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
    claw: (d, x, y) => d.dots([[x - 3, y], [x - 4, y + 1], [x - 2, y + 1]], "#2a1a10")},
  // tracajá: pele cinza-oliva com pintas amarelas na cabeça; o casco é desenhado por cima do corpo
  tracaja: {W: 50, H: 26, cx: 27, rx: 13, ry: 7, leg: 4, lw: 3, splay: 3, neck: 4, hu: 1, hr: 3,
    C: {b: "#6a6a50", B: "#4a4a36", s: "#3e4630", S: "#262c1c", r: "#c8b060"}, legC: ["#6a6a50", "#4a4a36"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 4.5, 3.4, C.b, C.B, .6).dots([[x + 1, y - 2], [x + 3, y - 1], [x - 1, y - 3], [x + 2, y + 1]], "#e8c040");
      d.dots([[x - 4, y]], BN); bEye(d, x - 1, y - 1, o);
      if (o.mouth) bMouth(d, x - 5, y + 1, 3, false); if (o.tongue) d.dots([[x - 4, y + 2]], BR);
    },
    tail: (d, P, C) => d.limb(P.cx + P.rx - 2, P.cy + 3, P.cx + P.rx + 3, P.cy + 4, 2, C.b),
    pattern: (d, P, C) => {
      d.part().ellipse(P.cx + 1, P.cy - 1, P.rx + 1, P.ry, C.s, C.S, .5);
      d.limb(P.cx - P.rx + 1, P.cy + P.ry * .5, P.cx + P.rx + 1, P.cy + P.ry * .5, 1.5, C.r);   // borda do casco
      for (let i = -7; i <= 8; i += 5) d.limb(P.cx + i, P.cy - P.ry + 2, P.cx + i, P.cy + P.ry * .3, 1, C.S);
      d.dots([[P.cx - 4, P.cy - 4], [P.cx + 2, P.cy - 5], [P.cx + 7, P.cy - 3]], "#5a6444");
    }},
  // sapo-cururu: largo, sem pescoço, olhos no alto da cabeça e as glândulas de veneno atrás deles
  sapo: {W: 44, H: 28, cx: 25, rx: 12, ry: 7.5, leg: 4, lw: 3.5, splay: 4, neck: 0, hu: 3, hr: 6,
    C: {b: "#8a6a3a", B: "#5e4626", l: "#d8c08a", g: "#c89a4a"}, legC: ["#7a5a30", "#5e4626"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 1, y, 7.5, 5.5, C.b, C.B, .6).ellipse(x, y + 3, 6, 2.5, C.l);
      d.ellipse(x + 6, y - 2, 3, 1.8, C.g);   // glândula
      d.part().ellipse(x - 1, y - 5, 2.6, 2.4, C.b); bEye(d, x - 1, y - 5, o);
      if (o.mouth) { d.part().ellipse(x - 3, y + 3, 4.5, 2.5, BN); d.part().limb(x - 6, y + 3, x - 11, y + 2, 1.5, BR); }
      else d.dots([[x - 6, y + 2], [x - 5, y + 2], [x - 4, y + 3], [x - 3, y + 3], [x - 2, y + 3], [x - 1, y + 3], [x, y + 3]], C.B);
      if (o.tongue) d.dots([[x - 6, y + 3], [x - 7, y + 4]], BR);
    },
    pattern: (d, P, C) => d.dots([[P.cx - 6, P.cy - 4], [P.cx - 1, P.cy - 6], [P.cx + 4, P.cy - 4], [P.cx + 8, P.cy - 2], [P.cx - 3, P.cy - 1], [P.cx + 2, P.cy - 2], [P.cx + 6, P.cy + 1]], C.g)},
  // mão-pelada: cinza, máscara preta nos olhos, mãos claras sem pelo e rabo listrado
  guaxinim: {W: 52, H: 30, cx: 29, rx: 12, ry: 6.5, leg: 6, lw: 3, neck: 3, hu: 3, hr: 4,
    C: {b: "#8a8a80", B: "#5e5e56", l: "#c8c8bc"}, legC: ["#4a4a44", "#34342e"], paw: ["#e0c0a0", "#b89878"],
    head: (d, x, y, o, C) => {
      d.part().poly([[x + 1, y - 3], [x + 2, y - 8], [x + 5, y - 3]], C.b).dots([[x + 2, y - 5]], "#e8e8e0");
      d.part().ellipse(x, y, 5, 4.2, C.b, C.B, .6).poly([[x - 3, y - 1], [x - 9, y + 1], [x - 3, y + 3]], "#e8e8e0", "#c8c8c0", x - 6);
      d.limb(x - 5, y - 1, x + 3, y - 1, 2, "#26262a");   // máscara
      d.dots([[x - 9, y + 1]], BN); bEye(d, x - 1, y - 1, o);
      if (o.mouth) bMouth(d, x - 8, y + 2, 4); if (o.tongue) d.dots([[x - 7, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 2, y = P.cy, pts = P.pose === "ko" ? [[x, y], [x + 5, y + 2], [x + 10, y + 4]] : [[x, y], [x + 5, y + 2], [x + 9, y + 6], [x + 11, y + 11]];
      for (let i = 0; i + 1 < pts.length; i++) d.limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 4.5, i % 2 ? "#3a3a36" : "#b8b8ac"); }},
  // búfalo: grandão cinza-escuro, chifres largos curvados para trás e focinho claro
  // Boi Bumbá encantado (Lençóis à noite): o corpo do búfalo vestido de boi de São João. Couro de veludo preto bordado de
  // flores e estrelas, saia de fitas coloridas na barriga, estrela na testa e fitas penduradas nos chifres
  boi_bumba: {W: 66, H: 40, cx: 36, rx: 18, ry: 10, leg: 9, lw: 5, neck: 1, hu: 3, hr: 7,
    C: {b: "#2a2036", B: "#170f20", l: "#342a46"}, paw: ["#1a1618", "#121012"],
    pattern: (d, P) => {
      [[-10, -4, "#ff5a8a"], [-2, -6, "#3ad8ff"], [6, -4, "#ffffff"], [13, -2, "#ff8a3a"], [-6, 1, "#ffd23a"], [2, 0, "#ff5a8a"], [10, 2, "#3ad8ff"]]
        .forEach(([dx, dy, c]) => { const x = Math.round(P.cx + dx), y = Math.round(P.cy + dy); d.dots([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], c); d.dots([[x, y]], "#ffd23a"); });   // flores bordadas
      d.dots([[P.cx - 14, P.cy - 2], [P.cx + 16, P.cy - 5], [P.cx - 1, P.cy - 8], [P.cx + 9, P.cy - 8]].map(([x, y]) => [Math.round(x), Math.round(y)]), "#fff2a0");   // estrelinhas
      const fitas = ["#e5401c", "#ffd23a", "#3a8ad8", "#3f9a3a", "#ff8ac8", "#ff8a3a"], y0 = Math.round(P.cy + P.ry * .45);
      for (let x = Math.round(P.cx - P.rx + 2), k = 0; x <= P.cx + P.rx - 2; x += 2, k++) d.rect(x, y0, 2, 6 + (k % 2), fitas[k % fitas.length]);   // saia de fitas
    },
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 7, 6, C.b, C.B, .6).ellipse(x - 5, y + 3, 4, 3, "#e8e0d8");   // focinho claro
      d.part().poly([[x - 3, y - 4], [x - 6, y - 11], [x - 3, y - 12], [x, y - 5]], "#f0e8d8", "#b8b0a0");   // chifres para cima
      d.part().poly([[x + 3, y - 5], [x + 5, y - 12], [x + 8, y - 11], [x + 6, y - 4]], "#f0e8d8", "#b8b0a0");
      d.part().rect(x - 6, y - 11, 1, 8, "#e5401c").rect(x - 5, y - 11, 1, 7, "#ffd23a").rect(x - 4, y - 11, 1, 9, "#3a8ad8");   // fitas nos chifres
      d.rect(x + 6, y - 11, 1, 8, "#3f9a3a").rect(x + 7, y - 11, 1, 7, "#ff8ac8").rect(x + 8, y - 10, 1, 9, "#ff8a3a");
      d.dots([[x + 1, y - 4], [x, y - 3], [x + 2, y - 3], [x + 1, y - 2]], "#ffd23a");   // estrela na testa
      d.dots([[x - 8, y + 2], [x - 7, y + 3]], BN); bEye(d, x - 1, y - 2, o);
      if (o.mouth) bMouth(d, x - 8, y + 5, 4, false); if (o.tongue) d.dots([[x - 7, y + 6]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 1, y = P.cy - 3; bChain(d, [[x, y], [x + 3, y + 6], [x + 3, y + 12]], [2, 1.5], C.B); d.ellipse(x + 3, y + 13, 1.5, 2, "#ffd23a"); }
  },
  bufalo: {W: 66, H: 40, cx: 36, rx: 18, ry: 10, leg: 9, lw: 5, neck: 1, hu: 3, hr: 7,
    C: {b: "#3a3638", B: "#242022", l: "#4a4648"}, paw: ["#1a1618", "#121012"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 7, 6, C.b, C.B, .6).ellipse(x - 5, y + 3, 4, 3, "#6a6264");
      d.part().poly([[x - 3, y - 4], [x + 5, y - 10], [x + 14, y - 10], [x + 18, y - 4], [x + 13, y - 6], [x + 6, y - 6], [x + 1, y - 2]], "#d8d0c0", "#9a9488", x + 12);   // chifre largo, curvado para trás
      d.dots([[x - 8, y + 2], [x - 7, y + 3]], BN); bEye(d, x - 1, y - 2, o);
      if (o.mouth) bMouth(d, x - 8, y + 5, 4, false); if (o.tongue) d.dots([[x - 7, y + 6]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 1, y = P.cy - 3; bChain(d, [[x, y], [x + 3, y + 6], [x + 3, y + 12]], [2, 1.5], C.B); d.ellipse(x + 3, y + 13, 1.5, 2, BN); },
    pattern: (d, P, C) => d.dots([[P.cx - 8, P.cy - 7], [P.cx - 2, P.cy - 8], [P.cx + 5, P.cy - 7], [P.cx + 11, P.cy - 5]], "#5a5658")},
  // bode do sertão (e o Bode-rei): pelo claro malhado, chifre curvado para trás, orelha de lado e barbicha
  bode: {W: 54, H: 40, cx: 30, rx: 13, ry: 7, leg: 11, lw: 3, neck: 4, hu: 8, hr: 5,
    C: {b: "#d8ccb4", B: "#a89a80", l: "#ece4d2", k: "#6a4a32"}, legC: ["#c8bca4", "#988a70"], paw: ["#3a2a1e", "#22180e"],
    head: (d, x, y, o, C) => {
      d.part().poly([[x + 1, y - 4], [x + 4, y - 11], [x + 10, y - 13], [x + 13, y - 9], [x + 9, y - 10], [x + 5, y - 8], [x + 3, y - 3]], "#8a7a62", "#5e5040", x + 9);   // chifre
      d.part().ellipse(x + 4, y - 1, 3.5, 1.6, C.B);   // orelha de lado
      d.part().ellipse(x, y, 5, 4.5, C.b, C.B, .6).poly([[x - 3, y - 2], [x - 10, y + 2], [x - 9, y + 5], [x - 2, y + 4]], C.b, C.B, x - 6);   // cara comprida
      d.part().poly([[x - 7, y + 4], [x - 4, y + 5], [x - 6, y + 11]], C.k);   // barbicha
      d.dots([[x - 10, y + 2], [x - 9, y + 3]], BN); bEye(d, x - 1, y - 1, {eye: o.eye === "open" ? "angry" : o.eye});
      if (o.mouth) bMouth(d, x - 9, y + 4, 4, false); if (o.tongue) d.dots([[x - 8, y + 5]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 1, y = P.cy - 4; d.limb(x, y, x + 3, y + (P.pose === "ko" ? 2 : -4), 2, C.k); },
    pattern: (d, P, C) => { d.ellipse(P.cx + 4, P.cy - 2, 4, 3, C.k); d.ellipse(P.cx - 6, P.cy + 1, 3, 2.5, C.k); }},
  // veado-catingueiro: pernas finas, pelo pardo, rabo branco curto e chifrinho reto
  veado: {W: 52, H: 42, cx: 28, rx: 12, ry: 6.5, leg: 14, lw: 2.2, neck: 6, hu: 10, hr: 4.5,
    C: {b: "#a8784a", B: "#7a5230", l: "#e8d8b8"}, legC: ["#8a6038", "#5e3e22"], paw: ["#2a1a10", "#1a100a"],
    head: (d, x, y, o, C) => {
      d.part().limb(x + 1, y - 4, x + 2, y - 11, 1, "#5e4a30").limb(x + 4, y - 3, x + 6, y - 10, 1, "#5e4a30");   // chifrinhos retos
      d.part().ellipse(x + 4, y - 3, 3, 1.6, C.B);   // orelha
      d.part().ellipse(x, y, 4.5, 4, C.b, C.B, .6).poly([[x - 3, y - 1], [x - 9, y + 1], [x - 8, y + 3], [x - 2, y + 3]], C.b, C.B, x - 6);
      d.dots([[x - 9, y + 1], [x - 8, y + 1]], BN).dots([[x - 6, y + 3], [x - 5, y + 3]], C.l); bEye(d, x - 1, y - 1, o);
      if (o.mouth) bMouth(d, x - 8, y + 3, 3, false); if (o.tongue) d.dots([[x - 7, y + 4]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 1, y = P.cy - 4; d.ellipse(x + 2, y + (P.pose === "ko" ? 3 : 0), 2, 2.5, C.l); },
    pattern: (d, P, C) => d.ellipse(P.cx, P.cy + P.ry * .55, P.rx * .7, P.ry * .3, C.l)},
  // rato (ratazana do porto, rato-d'água e o Ratão): cinza, orelhas redondas rosadas e rabo comprido pelado
  rato: {W: 48, H: 24, cx: 24, rx: 10, ry: 5.5, leg: 4, lw: 2.5, neck: 2, hu: 2, hr: 4,
    C: {b: "#6a6a70", B: "#4a4a50", l: "#9a9aa0"}, legC: ["#d89a9a", "#b87878"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x + 2, y - 4, 2.6, 2.6, "#d89a9a", "#b87878");
      d.part().ellipse(x, y, 4.5, 3.6, C.b, C.B, .6).poly([[x - 3, y - 2], [x - 9, y + 1], [x - 3, y + 2]], C.b, C.B, x - 6);
      d.dots([[x - 9, y + 1]], "#e87a8a").dots([[x - 8, y + 3], [x - 10, y + 3], [x - 7, y - 1]], "#c8c8c8");   // focinho e bigode
      bEye(d, x - 1, y - 1, o); if (o.mouth) bMouth(d, x - 8, y + 2, 3); if (o.tongue) d.dots([[x - 7, y + 3]], BR);
    },
    tail: (d, P, C) => { const x = P.cx + P.rx - 1, y = P.cy + 1, e = P.pose === "ko" ? [[x + 7, y + 3], [x + 15, y + 4]] : [[x + 6, y + 1], [x + 12, y - 2], [x + 18, y - 1]];
      bChain(d, [[x, y], ...e], [2, 1], "#d89a9a", "#b87878"); }},
  // ouriço-cacheiro: corpo redondo coberto de espinhos claros de ponta escura, focinho rosado
  ourico: {W: 48, H: 32, cx: 26, rx: 11, ry: 8, leg: 4, lw: 3, neck: 1, hu: 1, hr: 4,
    C: {b: "#6a5a48", B: "#4a3e30", l: "#8a7a64"}, legC: ["#4a3e30", "#34281e"],
    head: (d, x, y, o, C) => {
      d.part().ellipse(x, y, 4.5, 4, C.b, C.B, .6).ellipse(x - 4, y + 1, 2.4, 2, "#d89a8a");
      d.dots([[x - 6, y + 1]], BN); bEye(d, x - 1, y - 1, o);
      if (o.mouth) bMouth(d, x - 6, y + 2, 3); if (o.tongue) d.dots([[x - 5, y + 3]], BR);
    },
    tail: (d, P, C) => d.limb(P.cx + P.rx - 1, P.cy + 1, P.cx + P.rx + 6, P.cy + (P.pose === "ko" ? 3 : -3), 2.5, C.B),
    pattern: (d, P, C) => {   // espinhos saindo das costas; arrepiados no bote e agachado
      const up = P.pose === "attack" || P.pose === "crouch" ? 1.4 : 1;
      d.part();
      for (let a = -2.6; a <= -.3; a += .28) {
        const x0 = P.cx + Math.cos(a) * P.rx * .8, y0 = P.cy + Math.sin(a) * P.ry * .8, x1 = P.cx + Math.cos(a) * (P.rx + 5 * up), y1 = P.cy + Math.sin(a) * (P.ry + 5 * up);
        d.limb(x0, y0, x1, y1, 1, "#e8dcc0").dots([[Math.round(x1), Math.round(y1)]], "#2a1e14");
      }
    }}
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
    const d = rigGrid(1, 56, 36), o = {eye: pose === "blink" ? "shut" : "open"}, coil = [[53, 31], [44, 33], [34, 33], [24, 32], [18, 29], [22, 25], [32, 25], [40, 27]];
    let neck, head;
    if (pose === "ko") { o.eye = "x"; o.tongue = true; neck = []; head = [9, 30]; }
    else if (pose === "attack") { o.eye = "angry"; o.mouth = true; neck = [[40, 22], [28, 17], [16, 15]]; head = [11, 15]; }
    else if (pose === "crouch") { o.eye = "angry"; neck = [[43, 22], [41, 16], [35, 13]]; head = [31, 13]; }
    else if (pose === "hurt") { o.eye = "shut"; neck = [[43, 22], [40, 14], [36, 9]]; head = [33, 7]; }
    else { neck = [[42, 22], [37, 15], [31, 12]]; head = [26 + f, 12]; }
    const path = pose === "ko" ? [[54, 32], [45, 31], [36, 33], [27, 31], [18, 32], [12, 31]] : [...coil, ...neck];
    if (C.rattle) { const [tx, ty] = path[0]; d.part(); [0, 2, 4].forEach(k => d.ellipse(tx + 2 + k, ty - k * .5, 1.8, 2.2, k % 4 ? C.rattle[1] : C.rattle[0])); }   // chocalho
    d.part(); bChain(d, path, pose === "ko" ? [5, 6] : [4, 6.5], C.b, C.B);
    if (C.flame && pose !== "ko") path.slice(1, -1).forEach(([px, py], i) => { if ((i + f) % 2) d.dots([[px, py - 4], [px + 1, py - 5], [px, py - 6]], FLAMES[(i + f) % 3][1]); });   // chamas pelo corpo
    path.forEach(([x, y], i) => { if (i % 1 === 0 && i < path.length - 1) { const nx = (x + path[i + 1][0]) / 2, ny = (y + path[i + 1][1]) / 2; d.dots(tri ? [[nx, ny - 1], [nx - 1, ny], [nx + 1, ny], [nx, ny + 1]] : [[nx, ny - 1], [nx + 1, ny - 1]], C.k); } });
    const [x, y] = head;
    d.part();
    if (tri) d.poly([[x + 4, y - 4], [x - 6, y - 1], [x - 6, y + 2], [x + 4, y + 4], [x + 6, y]], C.b, C.B, x + 1);
    else d.ellipse(x, y, 6, 3.6, C.b, C.B, .6);
    d.dots([[x - 5, y - 1]], BN);
    if (C.eye && o.eye !== "x" && o.eye !== "shut") d.ellipse(x - 2, y - 1.5, 2.2, 2, C.eye).dots([[x - 2, y - 2]], BW);   // olhão aceso
    else bEye(d, x - 2, y - 1, o);
    if (o.mouth) { d.part().poly([[x - 6, y + 1], [x + 1, y + 2], [x - 5, y + 6]], BN).dots([[x - 5, y + 2], [x - 3, y + 2]], BW); }
    if (o.tongue || (pose === "idle" && f)) d.part().limb(x - 6, y + 1, x - 10, y + 1, 1, BR).dots([[x - 11, y], [x - 11, y + 2]], BR);
    return {c: d.canvas(), head: [x, y]};
  };
}

/* ---------- bichos da noite ---------- */
// morcego (de frente, asas batendo: f = 0 asas em cima, 1 embaixo); vampiro e pescador usam este com outra cor
function morcego(pose, f) {
  const d = rigGrid(1, 40, 30), C = {b: "#3a2a30", B: "#24181e", w: "#5a3a44", W: "#3e2630"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : "open"};
  if (pose === "ko") {   // caído, asas abertas no chão
    d.part().poly([[19, 24], [3, 22], [6, 26], [2, 28], [19, 27]], C.w, C.W).poly([[21, 24], [37, 22], [34, 26], [38, 28], [21, 27]], C.w, C.W);
    d.part().ellipse(20, 25, 4.5, 3, C.b, C.B, .5).ellipse(14, 24, 3, 2.6, C.b).dots([[13, 24], [15, 24], [14, 23]], "#ff4a4a");
    return {c: d.canvas(), head: [14, 22]};
  }
  const up = pose === "attack" ? true : pose === "crouch" ? false : !f, y = pose === "attack" ? 2 : 0;
  const wing = s => { const X = v => 20 + (v - 20) * s; return up ? [[X(17), 13 + y], [X(3), 3 + y], [X(6), 9 + y], [X(1), 11 + y], [X(8), 14 + y], [X(5), 18 + y], [X(17), 17 + y]] : [[X(17), 13 + y], [X(3), 19 + y], [X(7), 18 + y], [X(2), 24 + y], [X(10), 21 + y], [X(12), 25 + y], [X(17), 18 + y]]; };
  d.part().poly(wing(1), C.w, C.W).poly(wing(-1), C.w, C.W);
  d.part().ellipse(20, 15 + y, 4, 5.5, C.b, C.B, .5);
  d.part().poly([[16, 7 + y], [16, 1 + y], [19, 6 + y]], C.b).poly([[24, 7 + y], [24, 1 + y], [21, 6 + y]], C.b);   // orelhas
  d.part().ellipse(20, 8 + y, 4, 3.5, C.b, C.B, .6);
  if (o.eye === "shut") d.dots([[18, 8 + y], [22, 8 + y], [17, 8 + y], [23, 8 + y]], BN); else d.dots([[18, 8 + y], [22, 8 + y]], "#ff4a4a");
  if (pose === "attack" || pose === "crouch") d.dots([[19, 11 + y], [21, 11 + y]], BW).dots([[20, 11 + y]], BN);   // presas
  return {c: d.canvas(), head: [20, 8]};
}
// coruja (de frente, olhões amarelos)
function coruja(pose, f) {
  const d = rigGrid(1, 36, 36), C = {b: "#8a6a4a", B: "#5e4430", l: "#d8c8a0", L: "#b8a478"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  if (pose === "ko") {
    d.part().ellipse(18, 29, 12, 5, C.b, C.B, .5).poly([[8, 28], [1, 31], [9, 32]], C.B);
    d.part().ellipse(9, 27, 6, 5, C.l, C.L, .6);
    [[6, 26], [12, 26]].forEach(([x, y]) => d.dots([[x - 1, y - 1], [x + 1, y - 1], [x, y], [x - 1, y + 1], [x + 1, y + 1]], BN));
    return {c: d.canvas(), head: [9, 24]};
  }
  const open = pose === "attack", dy = pose === "crouch" ? 2 : pose === "idle" ? f : 0;
  if (open) d.part().poly([[11, 18], [0, 8], [2, 20], [10, 26]], C.B).poly([[25, 18], [36, 8], [34, 20], [26, 26]], C.B);   // asas abertas
  d.part().limb(15, 31, 14, 34, 2, "#e8b030").limb(21, 31, 22, 34, 2, "#e8b030");
  d.part().ellipse(18, 22 + dy, 9, 10, C.b, C.B, .5).ellipse(18, 24 + dy, 6, 7, C.l, C.L, .6).dots([[16, 21 + dy], [20, 23 + dy], [17, 26 + dy], [19, 28 + dy]], C.B);
  d.part().poly([[11, 6 + dy], [12, 1 + dy], [15, 5 + dy]], C.b).poly([[25, 6 + dy], [24, 1 + dy], [21, 5 + dy]], C.b);   // penachos
  d.part().ellipse(18, 9 + dy, 9, 7, C.b, C.B, .55).ellipse(14, 9 + dy, 4, 4, C.l).ellipse(22, 9 + dy, 4, 4, C.l);
  for (const x of [14, 22]) {
    if (o.eye === "shut") d.rect(x - 2, 9 + dy, 4, 1, BN);
    else d.ellipse(x, 9 + dy, 2.6, 2.6, "#ffcc33").ellipse(x, 9 + dy, 1.2, 1.4, BN);
  }
  if (o.eye === "angry") d.limb(10, 5 + dy, 16, 7 + dy, 1, BN).limb(26, 5 + dy, 20, 7 + dy, 1, BN);
  d.part().poly([[17, 11 + dy], [19, 11 + dy], [18, 14 + dy + (open ? 1 : 0)]], "#e8b030");
  return {c: d.canvas(), head: [18, 9]};
}
// Chupa-cabra: bípede corcunda, espinhos nas costas, olhos vermelhos e garras
function chupacabra(pose, f) {
  const d = rigGrid(1, 44, 44), G = 41, C = {b: "#5a6a5a", B: "#3a4a3a", l: "#7a8a6a", s: "#2a3a2a"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : "angry"};
  if (pose === "ko") {
    d.part().poly([[16, 34], [20, 29], [24, 33], [28, 28], [32, 33], [36, 30], [38, 35]], C.s);
    d.part().ellipse(26, 36, 13, 5, C.b, C.B, .5).limb(30, 38, 40, 39, 3, C.b, C.B);
    d.part().ellipse(11, 36, 6, 4.5, C.b, C.B, .6);
    d.dots([[8, 34], [10, 34], [9, 35], [8, 36], [10, 36], [12, 34], [14, 34], [13, 35], [12, 36], [14, 36]], "#ff2a2a");
    d.part().rect(6, 38, 2, 2, BR);
    return {c: d.canvas(), head: [11, 33]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (cr ? 4 : at ? -3 : 0) + (pose === "idle" ? f : 0), bx = at ? -4 : hu ? 2 : 0;
  d.part().limb(26 + bx, 30 + by, 30, 36, 4, C.B).limb(30, 36, 28, G, 3, C.B);   // perna de trás
  d.part().limb(30 + bx, 26 + by, 40, 30 + by, 3, C.b, C.B).limb(40, 30 + by, 42, 26 + by, 2, C.b);   // rabo fino
  d.part().ellipse(24 + bx, 24 + by, 10, 8, C.b, C.B, .5).ellipse(22 + bx, 27 + by, 6, 4, C.l);
  [[18, 17], [22, 15], [26, 15], [30, 17]].forEach(([x, y]) => d.poly([[x - 2 + bx, y + 2 + by], [x + bx, y - 4 + by], [x + 2 + bx, y + 2 + by]], C.s));   // espinhos
  d.part().limb(22 + bx, 30 + by, 18, 36, 4, C.b, C.B).limb(18, 36, 20, G, 3, C.b, C.B).dots([[18, G + 1], [20, G + 1], [22, G + 1]], "#d8d2c0");
  const hand = at ? [4, 20 + by] : cr ? [8, 34] : [12, 28 + by];
  d.part().limb(18 + bx, 22 + by, hand[0], hand[1], 2.5, C.b, C.B).dots([[hand[0] - 2, hand[1] - 1], [hand[0] - 2, hand[1] + 1], [hand[0] - 1, hand[1] + 2]], "#e8e4d0");   // garras
  const hx = (at ? 9 : 13) + bx, hy = (at ? 15 : hu ? 12 : 16) + by;
  d.part().ellipse(hx, hy, 6, 5, C.b, C.B, .6).poly([[hx - 4, hy], [hx - 10, hy + 2], [hx - 4, hy + 4]], C.b);
  if (o.eye === "shut") d.rect(hx - 3, hy - 2, 3, 1, BN); else d.ellipse(hx - 2, hy - 2, 2, 1.6, "#ff2a2a").dots([[hx - 2, hy - 2]], "#ffffff");
  if (at || cr) d.part().poly([[hx - 9, hy + 2], [hx - 3, hy + 3], [hx - 8, hy + 7]], BN).dots([[hx - 8, hy + 3], [hx - 5, hy + 3]], BW);
  return {c: d.canvas(), head: [hx, hy]};
}

/* ---------- peixes: piranha e poraquê ---------- */
function piranha(pose, f) {
  const d = rigGrid(1, 60, 32), C = {b: "#8a9aa0", B: "#5a6a70", r: "#e05a3a", R: "#b03a24", k: "#5a4a4a"}, o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
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

/* ---------- igarapé: garça, boto (e o Boto encantado, de chapéu) e pirarucu ---------- */
// garça em pé numa perna só, pescoço em "S" e bico comprido; C troca as cores (o socó da várzea usa a mesma);
// C.n = pescoço e cabeça de outra cor e C.r = o colar na base do pescoço (o tuiuiú: pescoço preto e colar vermelho)
function garca(pose, f, C = {b: "#f4f4ee", B: "#c8c8c0", y: "#e8c040", Y: "#b8902a", k: "#2a2a2a"}) {
  const d = rigGrid(1, 48, 52), G = 49, o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  if (pose === "ko") {   // deitada, asa aberta e pescoço esticado no chão
    d.part().limb(30, 45, 40, 43, 1.5, C.k).limb(32, 46, 42, 47, 1.5, C.k);
    d.part().poly([[22, 42], [36, 38], [40, 44]], C.B);
    d.part().ellipse(27, 45, 11, 4.5, C.b, C.B, .5);
    d.part(); bChain(d, [[18, 45], [13, 46], [10, 46]], [3, 2], C.n || C.b, C.N || C.B);
    d.part().ellipse(9, 45, 3.5, 3, C.n || C.b, C.N || C.B, .6).limb(6, 46, 1, 48, 1.5, C.y, C.Y);
    bEye(d, 9, 44, o);
    return {c: d.canvas(), head: [9, 43]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt";
  const cx = at ? 29 : hu ? 33 : 31, cy = (cr ? 31 : 27) + (pose === "idle" ? f : 0);
  const N = at ? [[cx - 8, cy - 2], [cx - 14, cy - 4], [cx - 16, cy - 5]] : cr ? [[cx - 8, cy - 1], [cx - 12, cy - 4], [cx - 10, cy - 7]] : hu ? [[cx - 8, cy - 2], [cx - 11, cy - 8], [cx - 7, cy - 13]] : [[cx - 8, cy - 2], [cx - 13, cy - 9], [cx - 9, cy - 15]];
  const [hx, hy] = at ? [cx - 19, cy - 6] : cr ? [cx - 13, cy - 8] : hu ? [cx - 9, cy - 17] : [cx - 12, cy - 19];
  d.part().limb(cx + 1, cy + 5, cx + 1, G, 1.5, C.k);   // perna de trás
  if (pose === "idle" || pose === "blink") d.part().limb(cx - 1, cy + 5, cx - 1, cy + 12, 1.5, C.k).limb(cx - 1, cy + 12, cx + 3, cy + 9, 1.5, C.k);   // a outra dobrada
  else d.part().limb(cx - 2, cy + 5, cx - 5, G, 1.5, C.k);
  d.part().poly([[cx + 8, cy - 2], [cx + 15, cy + 1], [cx + 8, cy + 4]], C.B);   // cauda
  d.part().ellipse(cx, cy, 10, 6.5, C.b, C.B, .55).ellipse(cx + 3, cy - 1, 7, 4.5, C.b, C.B, .6);
  d.dots([[cx + 8, cy + 1], [cx + 9, cy + 2]], C.B);
  d.part(); bChain(d, [N[0], N[1], N[2], [hx + 1, hy + 1]], [3.5, 2], C.n || C.b, C.N || C.B);
  if (C.r) d.part().ellipse(N[0][0], N[0][1], 3.2, 2.6, C.r, C.R, .6);   // colar vermelho
  d.part().ellipse(hx, hy, 3.5, 3, C.n || C.b, C.N || C.B, .6);
  d.part().limb(hx - 2, hy + 1, hx - (at ? 9 : 10), hy + (at ? 1 : 2), 1.5, C.y, C.Y);
  if (at) d.part().limb(hx - 2, hy + 2, hx - 8, hy + 4, 1, C.Y);   // bico aberto
  bEye(d, hx - 1, hy - 1, o);
  return {c: d.canvas(), head: [hx, hy]};
}
// boto-cor-de-rosa nadando para a esquerda: testa redonda, focinho comprido e nadadeira; hat = o Boto encantado
function boto(pose, f, hat) {
  const d = rigGrid(1, 64, 36), C = hat ? {b: "#f2a8c0", B: "#c27894", l: "#fbd8e4"} : {b: "#e89aaa", B: "#b86a7a", l: "#f6c8d0"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", dx = at ? -3 : hu ? 3 : 0, dy = (cr ? 3 : at ? -2 : 0) + (pose === "idle" ? f : 0) + 6;
  const pts = [[56 + dx, 20 + dy], [46 + dx, 17 + dy + (cr ? 2 : 0)], [35 + dx, 16 + dy], [25 + dx, 17 + dy], [18 + dx, 19 + dy]];
  d.part().poly([[57 + dx, 20 + dy], [63 + dx, 13 + dy - (at ? 2 : 0)], [61 + dx, 20 + dy], [63 + dx, 27 + dy]], C.B);   // cauda
  d.part(); bChain(d, pts, [3, 9], C.b, C.B);
  d.ellipse(30 + dx, 21 + dy, 10, 2.5, C.l);   // barriga clara
  d.part().poly([[34 + dx, 12 + dy], [38 + dx, 9 + dy], [40 + dx, 13 + dy]], C.B);   // corcova
  d.part().poly([[26 + dx, 21 + dy], [31 + dx, 28 + dy], [32 + dx, 21 + dy]], C.B);   // nadadeira
  const hx = 15 + dx, hy = 18 + dy;
  d.part().ellipse(hx, hy, 6.5, 5.5, C.b, C.B, .6);
  d.part().limb(hx - 4, hy + 2, hx - 14, hy + (at ? 1 : 4), 3, C.l, C.b);   // focinho
  if (at) d.part().limb(hx - 4, hy + 4, hx - 12, hy + 7, 2, C.l).dots([[hx - 7, hy + 3], [hx - 10, hy + 4], [hx - 8, hy + 5]], BW);
  d.dots([[hx + 2, hy - 5]], C.B);   // respiradouro
  bEye(d, hx - 2, hy - 1, o);
  if (hat && pose !== "ko") {   // chapéu branco escondendo o furo da cabeça
    d.part().rect(hx - 6, hy - 7, 13, 2, "#f6f2e8").rect(hx - 3, hy - 12, 7, 5, "#f6f2e8").rect(hx - 3, hy - 9, 7, 1, "#e5001c");
  }
  if (pose === "ko") {   // de barriga para cima, boiando
    const c = d.canvas(), out = document.createElement("canvas"), x = out.getContext("2d");
    out.width = c.width; out.height = c.height; x.translate(0, c.height); x.scale(1, -1); x.drawImage(c, 0, 0);
    return {c: out, head: [hx, 36 - hy]};
  }
  return {c: d.canvas(), head: [hx, hy]};
}
// pirarucu: peixe enorme, cabeça chata cinza e o rabo vermelho de escamas grandes
function pirarucu(pose, f) {
  const d = rigGrid(1, 80, 32), C = {b: "#5a6656", B: "#3a4438", r: "#d8402a", R: "#a02a1a", l: "#b8b8a0"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const at = pose === "attack", cr = pose === "crouch", cx = at ? 36 : cr || pose === "hurt" ? 42 : 39, cy = 15 + (pose === "idle" ? f : 0), fl = pose === "idle" ? f * 2 : 0;
  d.part().poly([[cx + 28, cy], [cx + 38, cy - 9 + fl], [cx + 36, cy], [cx + 38, cy + 9 - fl]], C.r, C.R, cx + 34);   // cauda em leque
  d.part().poly([[cx + 12, cy - 6], [cx + 26, cy - 4], [cx + 22, cy - 2]], C.R).poly([[cx + 12, cy + 6], [cx + 26, cy + 4], [cx + 22, cy + 2]], C.R);   // nadadeiras do fim
  d.part().ellipse(cx + 12, cy, 18, 7, C.r, C.R, .55).ellipse(cx - 8, cy, 20, 8, C.b, C.B, .55);
  for (let x = cx - 2; x < cx + 26; x += 4) for (const y of [cy - 4, cy, cy + 4]) d.dots([[x + (y === cy ? 2 : 0), y]], x > cx + 4 ? C.R : C.B);   // escamas
  d.ellipse(cx - 10, cy + 4, 14, 2.5, C.l);
  const hx = cx - 26, hy = cy;
  d.part().poly([[hx - 2, hy - 4], [hx + 8, hy - 7], [hx + 9, hy + 6], [hx - 2, hy + 4]], C.b, C.B, hx + 6);   // cabeça chata
  if (at) d.part().ellipse(hx - 1, hy, 3, 4, "#2a1414").dots([[hx - 2, hy - 3], [hx - 1, hy + 3]], BW);   // bocão aberto
  else d.limb(hx - 2, hy + 1, hx + 4, hy - 1, 1, BN);
  bEye(d, hx + 4, hy - 3, o);
  if (pose === "ko") {
    const c = d.canvas(), out = document.createElement("canvas"), x = out.getContext("2d");
    out.width = c.width; out.height = c.height; x.translate(0, c.height); x.scale(1, -1); x.drawImage(c, 0, 0);
    return {c: out, head: [hx + 4, 32 - (hy - 3)]};
  }
  return {c: d.canvas(), head: [hx + 4, hy - 3]};
}

/* ---------- manguezal: caranguejo-uçá (e o Caranguejo-rei) e a Matinta Perera ---------- */
// caranguejo de frente para a esquerda: casco azulado, patas laranja, olhos no talo e as garras na frente
function caranguejo(pose, f) {
  const d = rigGrid(1, 54, 32), G = 29, C = {b: "#3a5a7a", B: "#24405a", l: "#c8603a", L: "#8a3a22", t: "#f0c8a0"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : "open"};
  const at = pose === "attack", cr = pose === "crouch", dy = (cr ? 4 : at ? -2 : 0) + (pose === "idle" ? f : 0), dx = pose === "hurt" ? 3 : 0, cx = 28 + dx, cy = 15 + dy;
  // patas abertas em leque: joelho para cima e para fora, ponta fina no chão (lado de lá mais escuro e mais para trás)
  const legs = (far) => { for (let i = 0; i < 3; i++) {
    const o = far ? 4 : 0, bx = cx - 7 + i * 7 + o, dir = i - 1, kx = bx + dir * 5 + (dir ? 0 : -2), ky = cy + 8 + (i === 1 ? f : 0) - (far ? 1 : 0), fx = bx + dir * 8 - (dir ? 0 : 3);
    d.limb(bx, cy + 4, kx, ky, 2.2, far ? C.L : C.l, C.L).limb(kx, ky, fx, G, 1.6, far ? C.L : C.l);
  } };
  d.part(); legs(true);
  d.part().ellipse(cx, cy, 13, 7, C.b, C.B, .5).dots([[cx - 6, cy - 3], [cx - 1, cy - 4], [cx + 5, cy - 3], [cx + 9, cy - 1]], "#5a7a9a");
  d.part(); legs(false);
  for (const ex of [cx - 7, cx - 2]) { d.part().limb(ex, cy - 5, ex - 1, cy - 10, 1.2, C.B); bEye(d, ex - 1, cy - 11, o); }   // olhos no talo
  const claw = (bx, by, big, open) => {
    d.part().limb(cx - 10, cy + 1, bx + 4, by + 2, 2.5, C.l, C.L);
    d.part().ellipse(bx, by, big, big * .75, C.l, C.L, .5);
    d.poly([[bx - big, by - 1], [bx - big - 4, by - (open ? 4 : 2)], [bx - big + 1, by + 1]], C.t);   // ponta de cima
    if (open) d.poly([[bx - big, by + 1], [bx - big - 4, by + 4], [bx - big + 1, by + 2]], C.t);
  };
  if (at) { claw(9, cy - 6, 5, true); claw(12, cy + 2, 3.5, true); }
  else { claw(cx - 17, cy + 2, 5, false); claw(cx - 13, cy + 6, 3.5, false); }
  if (pose === "ko") {   // de barriga para cima
    const c = d.canvas(), out = document.createElement("canvas"), x = out.getContext("2d");
    out.width = c.width; out.height = c.height; x.translate(0, c.height); x.scale(1, -1); x.drawImage(c, 0, 0);
    return {c: out, head: [cx - 4, 32 - cy]};
  }
  return {c: d.canvas(), head: [cx - 4, cy - 11]};
}
// Matinta Perera: velha curvada de xale preto, bengala e o pássaro rasga-mortalha no ombro; no ataque abre o xale e assobia
function matinta(pose, f) {
  const d = rigGrid(1, 46, 42), G = 39, C = {b: "#2a2230", B: "#17121c", s: "#a87a58", S: "#7a5236", h: "#d8d4cc", y: "#ffd23a"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : "angry"};
  if (pose === "ko") {
    d.part().poly([[6, 39], [12, 30], [36, 28], [44, 39]], C.b, C.B, 30);
    d.part().ellipse(10, 34, 5, 4.5, C.s, C.S, .6).limb(5, 31, 2, 38, 2, C.h);
    d.part().limb(30, 38, 44, 32, 1.5, "#6a4a2a");   // bengala caída
    bEye(d, 9, 33, o);
    return {c: d.canvas(), head: [10, 31]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (cr ? 4 : 0) + (pose === "idle" ? f : 0), bx = hu ? 3 : at ? -2 : 0;
  const hx = 15 + bx, hy = 11 + by;
  d.part().limb(10 + bx, 22 + by, 4 + bx, G, 1.6, "#6a4a2a");   // bengala
  // xale: no ataque abre como asas
  d.part().poly(at ? [[hx + 2, hy - 6], [2, 12 + by], [6, G], [40, G], [44, 10 + by]] : [[hx + 2, hy - 6], [hx - 6, hy + 4], [8, G], [38, G], [34, 16 + by]], C.b, C.B, 30);
  d.dots([[14 + bx, 25 + by], [22 + bx, 29 + by], [30 + bx, 25 + by], [18 + bx, 34 + by], [28 + bx, 35 + by]], "#3e3446");
  for (let x = 9; x < 38; x += 3) d.dots([[x, G - 1], [x + 1, G]], "#4e4058");   // franja do xale
  d.part().ellipse(hx, hy, 5.5, 5, C.s, C.S, .6);   // rosto dentro do capuz
  d.limb(hx - 6, hy - 2, hx - 7, hy + 5, 1.5, "#a8a4ac").limb(hx + 6, hy - 1, hx + 7, hy + 5, 1.5, "#a8a4ac");   // cabelo grisalho dos lados
  d.part().poly([[hx - 7, hy - 1], [hx + 1, hy - 9], [hx + 8, hy - 2], [hx + 4, hy - 5], [hx - 4, hy - 4]], C.b);   // capuz
  if (o.eye === "shut") d.dots([[hx - 3, hy], [hx - 2, hy], [hx + 1, hy], [hx + 2, hy]], BN);
  else d.dots([[hx - 3, hy - 1], [hx + 1, hy - 1]], C.y).dots([[hx - 3, hy], [hx + 1, hy]], "#ff8a3a");
  if (at) d.part().ellipse(hx - 1, hy + 3, 1.2, 1.4, BN);   // assobiando
  d.dots([[hx - 5, hy + 1]], C.S);   // nariz comprido
  // rasga-mortalha no ombro (no ataque, voando na frente)
  const [px, py] = at ? [6, 5 + by] : [30 + bx, 12 + by];
  d.part().ellipse(px, py, 3.5, 2.6, "#e8e0d0", "#b8b0a0", .6).poly([[px + 2, py - 1], [px + 7, py - (at ? 6 : 2)], [px + 3, py + 1]], "#b8b0a0");
  d.dots([[px - 2, py - 1]], BN).dots([[px - 4, py], [px - 5, py]], "#e8b030");
  return {c: d.canvas(), head: [hx, hy]};
}

/* ---------- seringal: Curupira ---------- */
// Curupira: menino da mata de cabelo de fogo, pele escura esverdeada e os pés virados para trás
function curupira(pose, f) {
  const d = rigGrid(1, 40, 42), G = 39, C = {s: "#5a7a4a", S: "#3a5a30", h: "#e5401c", H: "#ffb03a", t: "#7a5a2a", T: "#5a4020"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const hair = (x, y, k) => {   // cabelo em labaredas, mexendo com o quadro
    const fl = FLAMES[(f + k) % 3];
    d.part().poly([[x - 7, y + 1], [x - 6, y - 7], [x - 3, y - 3], [x - 1, y - 10], [x + 2, y - 4], [x + 5, y - 9], [x + 7, y + 1]], fl[0]);
    d.dots([[x - 3, y - 5], [x + 1, y - 7], [x + 4, y - 5]], fl[2]).dots([[x - 1, y - 3], [x + 3, y - 2]], fl[1]);
  };
  if (pose === "ko") {
    d.part().ellipse(22, 35, 10, 3.5, C.t, C.T, .5);
    d.part().limb(30, 35, 37, 36, 3, C.s, C.S).limb(37, 36, 38, 33, 2, C.s);   // pé virado para cima
    hair(9, 34, 0);
    d.part().ellipse(10, 34, 5, 4.5, C.s, C.S, .6); bEye(d, 9, 33, o);
    return {c: d.canvas(), head: [10, 31]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (cr ? 4 : at ? -2 : 0) + (pose === "idle" ? f : 0), bx = at ? -3 : hu ? 3 : 0;
  // pernas com os pés virados: o calcanhar aponta para a esquerda (para a frente) e os dedos para trás
  const foot = (x, far) => { d.part().limb(x + bx, 28 + by, x + bx + 1, G - 1, 3, far ? C.S : C.s, C.S).limb(x + bx + 1, G, x + bx + 6, G, 2.5, far ? C.S : C.s); d.dots([[x + bx + 7, G], [x + bx + 7, G - 1]], C.S); };
  foot(20, true); foot(15, false);
  d.part().rect(12 + bx, 24 + by, 12, 6, C.t).rect(12 + bx, 28 + by, 12, 2, C.T);   // tanga de folha
  d.part().ellipse(18 + bx, 20 + by, 6.5, 6, C.s, C.S, .55);
  const arm = at ? [[13 + bx, 17 + by], [4 + bx, 12 + by]] : cr ? [[13 + bx, 18 + by], [8 + bx, 26 + by]] : [[13 + bx, 17 + by], [9 + bx, 24 + by]];
  d.part().limb(...arm[0], ...arm[1], 2.5, C.s, C.S).ellipse(arm[1][0], arm[1][1], 1.6, 1.6, C.s);
  if (at) d.part().ellipse(arm[1][0] - 2, arm[1][1] - 2, 2, 2.5, FLAMES[f % 3][1]).dots([[arm[1][0] - 2, arm[1][1] - 5]], "#ffd23a");   // chama na mão
  const hx = 17 + bx, hy = 10 + by;
  hair(hx + 1, hy - 2, 1);
  d.part().ellipse(hx, hy, 5.5, 5, C.s, C.S, .6);
  d.part().limb(23 + bx, 17 + by, 27 + bx, 24 + by, 2.5, C.S);   // braço de trás
  if (o.eye === "shut") d.dots([[hx - 3, hy], [hx - 2, hy], [hx + 1, hy], [hx + 2, hy]], BN);
  else { bEye(d, hx - 3, hy, o); bEye(d, hx + 1, hy, o); }
  if (at) d.dots([[hx - 2, hy + 3], [hx - 1, hy + 3], [hx, hy + 3]], BN); else d.dots([[hx - 2, hy + 3], [hx, hy + 3]], C.S);
  return {c: d.canvas(), head: [hx, hy]};
}

/* ---------- várzea: Mapinguari ---------- */
// Mapinguari: gigante peludo de um olho só na testa e a boca enorme na barriga; anda curvado, braços com garras
function mapinguari(pose, f) {
  const d = rigGrid(1, 52, 46), G = 43, C = {b: "#7a4a2a", B: "#4e2c16", l: "#9a6a42", m: "#3a1410", t: "#e8e0c8", k: "#2a1a10"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  if (pose === "ko") {   // caído de costas
    d.part().ellipse(28, 37, 17, 6, C.b, C.B, .5).dots([[20, 34], [26, 33], [32, 34], [38, 35]], C.l);
    d.part().limb(40, 38, 48, 33, 4, C.b, C.B).limb(16, 38, 9, 42, 4, C.b, C.B);
    d.part().ellipse(11, 35, 6, 5, C.b, C.B, .6); bEye(d, 10, 33, o);
    return {c: d.canvas(), head: [11, 31]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (cr ? 4 : at ? -1 : 0) + (pose === "idle" ? f : 0), bx = at ? -3 : hu ? 3 : 0;
  const cx = 27 + bx, cy = 25 + by;
  d.part().limb(cx + 6, cy + 10, cx + 8, G, 5, C.B).ellipse(cx + 8, G, 4, 1.8, C.k);   // perna de trás
  d.part().limb(cx + 10, cy - 6, cx + 16, cy + 6, 4, C.B).dots([[cx + 15, cy + 8], [cx + 17, cy + 8], [cx + 16, cy + 9]], C.t);   // braço de trás
  d.part().ellipse(cx, cy, 13, 15, C.b, C.B, .5);
  for (const [x, y] of [[-8, -9], [-3, -12], [4, -10], [9, -5], [-10, 2], [10, 4], [-6, 10], [6, 11]]) d.limb(cx + x, cy + y, cx + x + 1, cy + y + 3, 1, C.l);   // pelo
  // boca na barriga: fechada é um risco com dentes; aberta é um buraco escuro cheio de dentes
  if (at || cr) { d.part().ellipse(cx - 2, cy + 3, 6, at ? 7 : 5, C.m); for (let i = -4; i <= 2; i += 3) d.dots([[cx - 2 + i, cy - 3], [cx - 1 + i, cy + 8]], C.t); }
  else { d.part().limb(cx - 7, cy + 3, cx + 3, cy + 4, 1.5, C.m); d.dots([[cx - 5, cy + 2], [cx - 2, cy + 2], [cx + 1, cy + 3]], C.t); }
  d.part().limb(cx - 4, cy + 10, cx - 6, G, 5, C.b, C.B).ellipse(cx - 7, G, 4, 1.8, C.k);   // perna da frente
  const hand = at ? [cx - 22, cy - 6] : cr ? [cx - 16, cy + 12] : [cx - 15, cy + 6];
  d.part().limb(cx - 9, cy - 7, hand[0], hand[1], 4, C.b, C.B).dots([[hand[0] - 2, hand[1] - 1], [hand[0] - 2, hand[1] + 1], [hand[0] - 1, hand[1] + 2]], C.t);   // garras
  const hx = cx - 2, hy = cy - 16;
  d.part().ellipse(hx, hy, 8, 6.5, C.b, C.B, .6);
  if (o.eye === "shut") d.rect(hx - 3, hy - 1, 5, 1, BN);
  else if (o.eye === "x") bEye(d, hx - 1, hy - 1, o);
  else { d.ellipse(hx - 1, hy - 1, 3, 2.6, "#ffe9a0").ellipse(hx - 2, hy - 1, 1.3, 1.6, BN).dots([[hx - 2, hy - 2]], BW); if (o.eye === "angry") d.limb(hx - 5, hy - 5, hx + 3, hy - 4, 1, BN); }   // olhão único
  return {c: d.canvas(), head: [hx, hy]};
}

/* ---------- Belém: pombo, gente da cidade (malandros) e as visagens ---------- */
// pombo: corpo cinza, pescoço furta-cor (verde e roxo), pés laranja
function pombo(pose, f, C = {b: "#8a8a9a", B: "#5e5e6e", n: "#5aa07a", p: "#9a6ab0", w: "#76768a", y: "#e86a3a"}) {
  const d = rigGrid(1, 34, 30), G = 27;
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" || pose === "blink" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  if (pose === "ko") {
    d.part().ellipse(18, 23, 9, 4.5, C.b, C.B, .5).limb(22, 21, 25, 16, 1.2, C.y).limb(19, 21, 21, 16, 1.2, C.y);
    d.part().ellipse(9, 23, 4, 3.4, C.b, C.B, .6).limb(6, 24, 3, 25, 1.2, "#3a3a3a"); bEye(d, 9, 22, o);
    return {c: d.canvas(), head: [9, 20]};
  }
  const at = pose === "attack", cr = pose === "crouch", cx = at ? 16 : pose === "hurt" ? 19 : 17, cy = (cr ? 19 : 16) + (pose === "idle" ? f : 0);
  d.part().limb(cx + 2, cy + 5, cx + 1, G, 1.2, C.y).limb(cx - 1, cy + 5, cx - 2, G, 1.2, C.y);
  d.part().poly([[cx + 7, cy - 1], [cx + 14, cy + 1], [cx + 7, cy + 3]], C.B);   // cauda
  if (at) d.part().poly([[cx - 1, cy - 3], [cx + 4, cy - 14], [cx + 12, cy - 9], [cx + 6, cy - 1]], C.w, C.B, cx + 6);   // asas abertas
  d.part().ellipse(cx, cy, 8, 6, C.b, C.B, .55);
  if (!at) d.ellipse(cx + 2, cy - 1, 5.5, 3.5, C.w).dots([[cx + 2, cy], [cx + 4, cy], [cx + 3, cy - 2]], "#3a3a4a");   // asa com as listras
  d.part().ellipse(cx - 5, cy - 4, 3.5, 4, C.n).dots([[cx - 6, cy - 3], [cx - 4, cy - 2]], C.p);   // pescoço furta-cor
  const hx = at ? cx - 10 : cx - 7, hy = at ? cy - 5 : cy - 9;
  d.part().ellipse(hx, hy, 3.5, 3.2, C.b, C.B, .6).limb(hx - 3, hy + 1, hx - 6, hy + 2, 1.2, "#3a3a3a").dots([[hx - 3, hy], [hx - 2, hy]], "#e8e8f0");
  bEye(d, hx - 1, hy - 1, o);
  return {c: d.canvas(), head: [hx, hy]};
}
// gente da cidade (malandros e golpistas): o mesmo esqueleto do Rhanon, de frente; no desmaio fica deitado
function pessoa(look) {
  return (pose, f) => {
    const P = {idle: {dy: f}, blink: {face: "blink"}, crouch: {dy: 2, lf: [10, 40], rf: [22, 40]}, attack: {lean: -2, lh: [1, 20], face: "happy"}, hurt: {lean: 2, face: "hurt"},
      ko: {sit: true, lean: 2, dy: 1, face: "hurt", lh: [7, 39], rh: [27, 39]}}[pose] || {};   // desmaiado: sentado no chão, tonto, mãos apoiadas
    const S = 1.4, c = rigCanvas("front", P, look, S);   // 1.4 na grade 2x = do tamanho do Rhanon na batalha
    return {c, head: pose === "ko" ? [18 * S, 20 * S] : [16 * S, 13 * S]};
  };
}
// Cabeça de Cuia (Teresina, à noite): pescador sem camisa, de calção, com a cabeça enorme em forma de cuia, cabelo molhado
// e olhos acesos; desmaiado, fica deitado na beira com a cabeça no chão
function cabecaCuia(pose, f) {
  const d = rigGrid(1, 40, 50), sk = "#8a5a32", Sk = "#5e3a1e", cu = "#c8a050", Cu = "#8a6a28", sh = "#3a5a8a", Sh = "#24405a";
  if (pose === "ko") {
    d.part().poly([[12, 42], [34, 40], [37, 45], [14, 48]], sk, Sk);
    d.part().ellipse(10, 39, 9, 8, cu, Cu, .6).rect(9, 30, 2, 2, "#5a7a2a");
    d.dots([[6, 38], [8, 40], [8, 38], [6, 40], [12, 38], [14, 40], [14, 38], [12, 40]], BN);
    return {c: d.canvas(), head: [10, 38]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (pose === "idle" ? f : 0) + (cr ? 3 : 0), bx = at ? -3 : hu ? 3 : 0;
  const X = v => v + bx, Y = v => v + by;
  d.part().limb(X(17), Y(36), X(15), Y(48), 3, sk, Sk); d.limb(X(23), Y(36), X(25), Y(48), 3, sk, Sk);   // pernas
  d.part().poly([[X(14), Y(30)], [X(26), Y(30)], [X(27), Y(38)], [X(13), Y(38)]], sh, Sh);   // calção
  d.part().poly([[X(14), Y(20)], [X(26), Y(20)], [X(26), Y(31)], [X(14), Y(31)]], sk, Sk);   // tronco
  const hand = at ? [[X(14), Y(22)], [X(2), Y(20)]] : cr ? [[X(14), Y(22)], [X(9), Y(33)]] : [[X(14), Y(22)], [X(10), Y(32)]];
  d.part().limb(...hand[0], ...hand[1], 3, sk, Sk);
  d.part().limb(X(26), Y(22), X(30), Y(32), 3, sk, Sk);
  d.part().ellipse(X(20), Y(11), 12, 10, cu, Cu, .6).rect(X(19), Y(0), 2, 2, "#5a7a2a");   // a cabeça de cuia, com o talo
  d.dots([[X(13), Y(6)], [X(14), Y(5)], [X(12), Y(8)]], "#ecd090");   // brilho da cuia
  d.dots([[X(9), Y(14)], [X(31), Y(14)], [X(9), Y(16)], [X(31), Y(16)], [X(10), Y(18)], [X(30), Y(18)]], "#2a1a10");   // cabelo molhado escorrendo
  if (hu) d.dots([[X(15), Y(12)], [X(16), Y(12)], [X(24), Y(12)], [X(25), Y(12)]], BN);
  else d.ellipse(X(15.5), Y(12), 1.6, 1.8, "#8ad0f0").ellipse(X(24.5), Y(12), 1.6, 1.8, "#8ad0f0");
  if (at) d.ellipse(X(20), Y(17), 2.5, 2, BN); else d.rect(X(17), Y(17), 6, 1, BN);
  return {c: d.canvas(), head: [X(20), Y(11)]};
}
// Comadre Fulozinha (caatinga, à noite): cabocla pequena, de pé descalço, com o cabelo preto comprido até o chão cobrindo o
// corpo, olhos verdes acesos e um cipó na mão (a surra de cipó); desmaiada, senta no chão enrolada no cabelo
function fulozinha(pose, f) {
  const d = rigGrid(1, 40, 48), sk = "#a8703e", Sk = "#74482a", h = "#1a1420", H = "#0c0a10", ci = "#5a8a2a", Ci = "#3a5a1a", fl = "#f0d040";
  if (pose === "ko") {
    d.part().poly([[8, 46], [12, 30], [28, 30], [34, 46]], h, H, 26);
    d.part().ellipse(20, 28, 6, 6, sk, Sk, .7).poly([[13, 24], [27, 24], [27, 29], [24, 26], [16, 26], [13, 30]], h);
    d.dots([[17, 29], [18, 29], [22, 29], [23, 29]], BN).dots([[25, 23], [26, 23]], fl);
    return {c: d.canvas(), head: [20, 28]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (pose === "idle" ? f : 0) + (cr ? 3 : 0), bx = at ? -3 : hu ? 3 : 0;
  const X = v => v + bx, Y = v => v + by;
  d.part().limb(X(18), Y(38), X(17), Y(46), 2.5, sk, Sk); d.limb(X(22), Y(38), X(23), Y(46), 2.5, sk, Sk);   // pernas finas, pé no chão
  d.part().poly([[X(13), Y(12)], [X(27), Y(12)], [X(31), Y(42)], [X(26), Y(40)], [X(22), Y(44)], [X(18), Y(40)], [X(14), Y(44)], [X(9), Y(42)]], h, H, X(25));   // o cabelo cobre o corpo
  d.dots([[X(12), Y(30)], [X(16), Y(36)], [X(25), Y(28)], [X(28), Y(38)]], "#3a3248");   // brilho nas mechas
  const hand = at ? [X(6), Y(17)] : cr ? [X(8), Y(30)] : [X(9), Y(28)];
  d.part().limb(X(14), Y(18), ...hand, 2, sk, Sk);
  if (at) d.part().limb(hand[0], hand[1], X(4), Y(2), 1.2, ci).limb(X(4), Y(2), X(10), Y(1), 1.2, ci).dots([[X(5), Y(9)], [X(4), Y(5)]], Ci);   // o cipó estalando no alto
  else d.part().limb(hand[0], hand[1], hand[0] - 2, hand[1] + 12, 1.2, ci).dots([[hand[0] - 1, hand[1] + 6]], Ci);
  d.part().limb(X(26), Y(18), X(30), Y(27), 2, sk, Sk);
  d.part().ellipse(X(20), Y(10), 5.5, 6, sk, Sk, .7);
  d.part().poly([[X(14), Y(4)], [X(26), Y(4)], [X(27), Y(11)], [X(24), Y(7)], [X(16), Y(7)], [X(13), Y(12)]], h);   // franja
  d.part().ellipse(X(25), Y(4), 2, 2, fl).dots([[X(25), Y(4)]], "#e86a2a");   // a flor no cabelo
  if (hu) d.dots([[X(17), Y(10)], [X(18), Y(10)], [X(22), Y(10)], [X(23), Y(10)]], BN);
  else d.ellipse(X(17.5), Y(10), 1.4, 1.6, "#9bf04a").ellipse(X(22.5), Y(10), 1.4, 1.6, "#9bf04a");
  if (at) d.ellipse(X(20), Y(14), 1.2, 1.5, BN);   // assobiando
  return {c: d.canvas(), head: [X(20), Y(10)]};
}
// Tapejara (serra, de dia): réptil voador de pedra, de asa de pele presa no braço, bico curto e a crista alta de vela;
// desmaiado, fica estendido no chão de asas abertas
function tapejara(pose, f) {
  const d = rigGrid(1, 60, 48), G = 45, C = {b: "#a89070", B: "#6e5a44", m: "#c88a5a", M: "#8a5a36", c: "#e8603a", k: "#f0c040", s: "#5a4a3a"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const crest = (x, y) => d.part().poly([[x - 7, y], [x - 7, y - 8], [x - 3, y - 15], [x + 3, y - 17], [x + 8, y - 13], [x + 6, y - 6], [x + 2, y - 3]], C.c, "#a83a1a", x + 3)
    .limb(x - 5, y - 2, x + 1, y - 14, 1, C.k);   // a vela alta da crista, saindo do bico, com uma nervura amarela
  if (pose === "ko") {
    d.part().poly([[6, 40], [24, 33], [30, 40]], C.m, C.M).poly([[30, 40], [40, 33], [56, 41]], C.m, C.M);   // asas abertas no chão
    d.part().ellipse(30, 40, 9, 4, C.b, C.B, .5);
    crest(14, 40); d.part().ellipse(14, 40, 5, 4, C.b, C.B, .6).poly([[10, 40], [4, 42], [10, 43]], C.s); bEye(d, 13, 39, o);
    return {c: d.canvas(), head: [14, 40]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", cy = (cr ? 30 : at ? 24 : 27) + (pose === "idle" ? f : 0), cx = at ? 29 : hu ? 34 : 32;
  const up = at || pose === "idle" && f;   // asas: erguidas no bote e numa das batidas parado
  const wing = s => up ? [[cx, cy - 3], [cx + s * 6, cy - 20], [cx + s * 24, cy - 14], [cx + s * 8, cy + 2]] : [[cx, cy - 3], [cx + s * 10, cy - 8], [cx + s * 24, cy + 4], [cx + s * 6, cy + 5]];
  d.part().poly(wing(1), C.M, C.s, cx + 14).dots([[cx + 10, cy - 6], [cx + 16, cy - 4]], C.B);   // asa de trás
  d.part().limb(cx + 2, cy + 6, cx + 4, G, 2, C.B).limb(cx - 2, cy + 6, cx - 3, G, 2, C.B);   // perninhas
  d.part().ellipse(cx, cy, 7, 7.5, C.b, C.B, .5);
  d.part().poly(wing(-1), C.m, C.M, cx - 12).limb(cx, cy - 3, wing(-1)[1][0], wing(-1)[1][1], 1.5, C.B);   // asa da frente, com o osso do braço
  const hx = at ? cx - 9 : cx - 6, hy = at ? cy - 8 : cr ? cy - 7 : cy - 10;
  d.part().limb(cx - 2, cy - 6, hx + 2, hy + 3, 2.5, C.b, C.B);   // pescoço
  crest(hx, hy);
  d.part().ellipse(hx, hy, 4.5, 4, C.b, C.B, .6).poly([[hx - 3, hy - 1], [hx - 9, hy + 1], [hx - 10, hy + 4], [hx - 3, hy + 3]], C.s);   // bico curto, virado para baixo
  if (at) d.dots([[hx - 7, hy + 2], [hx - 5, hy + 2]], BR);
  bEye(d, hx - 1, hy - 1, o);
  return {c: d.canvas(), head: [hx, hy]};
}
// Lobisomem (serra, à noite): lobo de pé, curvado, pelo cinza-escuro, orelha em ponta, olhos vermelhos e a calça
// rasgada de quando era gente; desmaiado, fica deitado de lado
function lobisomem(pose, f) {
  const d = rigGrid(1, 52, 50), G = 47, C = {b: "#5a5458", B: "#38323a", l: "#7a7478", k: "#1a1418", t: "#e8e0c8", p: "#3a4a6a", P: "#26324a"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : "open"};
  if (pose === "ko") {
    d.part().ellipse(28, 41, 16, 5.5, C.b, C.B, .5).poly([[34, 38], [46, 39], [46, 45], [34, 45]], C.p, C.P);
    d.part().ellipse(11, 40, 6, 4.5, C.b, C.B, .6).poly([[6, 40], [1, 42], [6, 43]], C.b, C.B).poly([[12, 36], [14, 31], [16, 37]], C.b);
    bEye(d, 10, 39, o);
    return {c: d.canvas(), head: [11, 38]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (cr ? 4 : at ? -1 : 0) + (pose === "idle" ? f : 0), bx = at ? -3 : hu ? 3 : 0;
  const cx = 30 + bx, cy = 24 + by;
  d.part().limb(cx + 5, cy + 10, cx + 9, G - 6, 4.5, C.P).limb(cx + 9, G - 6, cx + 7, G, 3.5, C.B).ellipse(cx + 6, G, 3.5, 1.6, C.k);   // perna de trás, joelho de bicho
  d.part().limb(cx + 8, cy - 5, cx + 15, cy + 7, 3.5, C.B).dots([[cx + 14, cy + 9], [cx + 16, cy + 9], [cx + 15, cy + 10]], C.t);   // braço de trás
  d.part().limb(cx + 9, cy + 6, cx + 16, cy + 2, 2.5, C.b, C.B);   // rabo
  d.part().ellipse(cx, cy, 11, 13, C.b, C.B, .5).ellipse(cx - 2, cy + 3, 6, 7, C.l);   // tronco curvado, peito mais claro
  d.part().poly([[cx - 9, cy + 8], [cx + 10, cy + 8], [cx + 10, cy + 13], [cx - 9, cy + 13]], C.p, C.P);   // cós da calça
  for (const [x, y] of [[-8, -8], [-3, -11], [4, -10], [8, -4]]) d.limb(cx + x, cy + y, cx + x + 2, cy + y - 3, 1, C.B);   // pelo eriçado
  d.part().limb(cx - 4, cy + 11, cx - 7, G - 6, 4.5, C.p, C.P).limb(cx - 7, G - 6, cx - 6, G, 3.5, C.b, C.B).ellipse(cx - 7, G, 3.5, 1.6, C.k);   // perna da frente
  d.dots([[cx - 9, G - 7], [cx - 5, G - 6], [cx - 8, G - 5]], C.P);   // barra rasgada
  const hand = at ? [cx - 22, cy - 7] : cr ? [cx - 15, cy + 11] : [cx - 14, cy + 6];
  d.part().limb(cx - 8, cy - 6, hand[0], hand[1], 3.5, C.b, C.B).dots([[hand[0] - 2, hand[1] - 1], [hand[0] - 2, hand[1] + 1], [hand[0] - 1, hand[1] + 2]], C.t);   // garras
  const hx = cx - 5, hy = cy - 15;
  d.part().poly([[hx + 1, hy - 4], [hx + 3, hy - 11], [hx + 6, hy - 3]], C.b).poly([[hx - 3, hy - 4], [hx - 2, hy - 10], [hx + 1, hy - 4]], C.B);   // orelhas em ponta
  d.part().ellipse(hx, hy, 6, 5, C.b, C.B, .6).poly([[hx - 3, hy - 1], [hx - 12, hy + 1], [hx - 11, hy + 4], [hx - 3, hy + 4]], C.b, C.B, hx - 8);   // focinho comprido
  d.dots([[hx - 12, hy + 1], [hx - 11, hy + 1]], BN);
  if (o.eye === "shut") d.rect(hx - 3, hy - 1, 3, 1, BN);
  else d.ellipse(hx - 2, hy - 1, 1.6, 1.4, "#ff3a2a").dots([[hx - 2, hy - 1]], "#ffe0a0");
  if (at || cr) { d.part().poly([[hx - 11, hy + 3], [hx - 3, hy + 4], [hx - 4, hy + 7], [hx - 10, hy + 5]], "#3a1410"); d.dots([[hx - 10, hy + 3], [hx - 7, hy + 4], [hx - 5, hy + 4]], C.t); }
  return {c: d.canvas(), head: [hx, hy]};
}
// Carranca (beira do Velho Chico, de dia): o barquinho de madeira com a carranca na proa, cabeça de bicho entalhada de
// juba vermelha, olho arregalado e boca cheia de dente; desmaiada, o barco adorna e a carranca deita na água
function carranca(pose, f) {
  const d = rigGrid(1, 58, 50), C = {h: "#8a5a32", H: "#5e3a1e", s: "#3a6aa8", m: "#c8301c", M: "#8a1a10", k: "#e8a050", K: "#a86a2a", t: "#f4ecd8", y: "#ffd23a"};
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  if (pose === "ko") {
    d.part().poly([[6, 38], [52, 34], [54, 42], [10, 47]], C.h, C.H, 40).limb(9, 42, 53, 38, 1.2, C.s);   // casco adornado
    d.part().ellipse(12, 40, 9, 6, C.m, C.M, .5).ellipse(10, 40, 6, 4.5, C.k, C.K, .6);   // a cabeça deitada
    bEye(d, 8, 39, o); bEye(d, 13, 38, o);
    return {c: d.canvas(), head: [10, 40]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (pose === "idle" ? f : 0) + (cr ? 3 : 0), bx = at ? -4 : hu ? 3 : 0;
  const X = v => v + bx, Y = v => v + by;
  d.part().poly([[X(4), Y(34)], [X(54), Y(37)], [X(51), Y(46)], [X(13), Y(47)]], C.h, C.H, X(44));   // casco
  d.limb(X(7), Y(37), X(53), Y(40), 1.5, C.s).dots([[X(20), Y(43)], [X(30), Y(44)], [X(40), Y(44)]], C.H);   // faixa azul pintada e as tábuas
  d.part().limb(X(48), Y(36), X(48), Y(14), 1.5, C.H).poly([[X(48), Y(15)], [X(56), Y(31)], [X(48), Y(31)]], C.t, "#c8c0a8");   // mastro e vela
  d.part().limb(X(11), Y(36), X(12), Y(26), 4, C.h, C.H);   // o pescoço de pau saindo da proa
  const hx = X(at ? 9 : 12), hy = Y(at ? 17 : 19);
  for (const [a, r] of [[-2.6, 12], [-2, 13], [-1.4, 13], [-.8, 12], [-.2, 11], [.4, 10], [1, 9]])   // a juba entalhada, em mechas
    d.part().limb(hx + 2, hy, hx + 2 + Math.cos(a) * r, hy + Math.sin(a) * r, 3, C.m, C.M);
  d.part().ellipse(hx, hy, 7.5, 8.5, C.k, C.K, .55);   // a cara
  d.part().ellipse(hx - 3, hy - 3, 2.6, 2.4, C.t).ellipse(hx + 2.5, hy - 3, 2.6, 2.4, C.t);   // olho arregalado
  bEye(d, hx - 3, hy - 3, o); bEye(d, hx + 2.5, hy - 3, o);
  d.limb(hx - 6, hy - 6, hx - 1, hy - 5, 1, C.M).limb(hx + 1, hy - 5, hx + 6, hy - 6, 1, C.M);   // sobrancelha franzida
  d.dots([[hx - 1, hy + 1], [hx, hy + 1]], C.K);   // narina
  const mo = at ? 4 : cr ? 3 : 2;   // a boca: mais aberta no bote
  d.part().poly([[hx - 5, hy + 3], [hx + 4, hy + 3], [hx + 3, hy + 4 + mo], [hx - 4, hy + 4 + mo]], "#3a1410");
  d.dots([[hx - 4, hy + 3], [hx - 2, hy + 3], [hx, hy + 3], [hx + 2, hy + 3], [hx - 3, hy + 3 + mo], [hx - 1, hy + 3 + mo], [hx + 1, hy + 3 + mo]], C.t);   // dentes de pau
  d.dots([[hx - 6, hy + 1], [hx + 5, hy + 1]], C.y);   // pintura amarela nas bochechas
  return {c: d.canvas(), head: [hx, hy]};
}
// Nego d'água (beira do Velho Chico, à noite): o homem do rio, careca, de pele escura com brilho de água, mão e pé de pato e
// fiapo de alga no ombro; ri alto. Na luta fica com a cintura dentro d'água; desmaiado, boia de costas
function negoDagua(pose, f) {
  const d = rigGrid(1, 44, 50), sk = "#6a4630", Sk = "#462c1c", sh = "#9ac0b8", wb = "#4a6a62", Wb = "#2e4a42", al = "#5a8a3a", sb = "#2a4a6a", Sb = "#1a3048";
  const o = {eye: pose === "ko" ? "x" : pose === "hurt" ? "shut" : pose === "attack" || pose === "crouch" ? "angry" : "open"};
  const hand = (x, y, s) => d.part().poly([[x, y - 1], [x + s * 4, y - 3], [x + s * 5, y], [x + s * 4, y + 3], [x, y + 2]], wb, Wb).dots([[x + s * 3, y - 1], [x + s * 3, y + 1]], Wb);   // mão de pato
  if (pose === "ko") {
    d.part().poly([[12, 40], [34, 39], [35, 44], [12, 45]], sk, Sk).rect(26, 39, 6, 6, sb);   // boiando de costas, de calção
    d.part().poly([[35, 40], [41, 37], [42, 43]], wb, Wb).poly([[35, 43], [41, 45], [40, 47]], wb, Wb);   // pé de pato
    d.part().ellipse(9, 41, 6, 5.5, sk, Sk, .6).dots([[7, 37], [8, 37]], sh);
    d.ellipse(7, 40, 1.8, 1.6, BW).ellipse(11, 40, 1.8, 1.6, BW); bEye(d, 7, 40, o); bEye(d, 11, 40, o);
    return {c: d.canvas(), head: [9, 40]};
  }
  const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (pose === "idle" ? f : 0) + (cr ? 3 : 0), bx = at ? -3 : hu ? 3 : 0;
  const X = v => v + bx, Y = v => v + by;
  d.part().limb(X(18), Y(36), X(16), Y(46), 3.5, sk, Sk).limb(X(24), Y(36), X(26), Y(46), 3.5, sk, Sk);   // pernas (dentro d'água)
  d.part().poly([[X(14), Y(31)], [X(28), Y(31)], [X(29), Y(39)], [X(13), Y(39)]], sb, Sb);   // calção
  d.part().poly([[X(13), Y(18)], [X(29), Y(18)], [X(28), Y(32)], [X(14), Y(32)]], sk, Sk, X(25));   // tronco largo
  d.dots([[X(15), Y(20)], [X(16), Y(21)], [X(25), Y(20)], [X(19), Y(26)]], sh);   // brilho da água na pele
  d.part().limb(X(14), Y(18), X(11), Y(23), 1.5, al).limb(X(28), Y(18), X(31), Y(24), 1.5, al);   // fiapo de alga nos ombros
  const hf = at ? [X(1), Y(16)] : cr ? [X(7), Y(31)] : [X(8), Y(28)];
  d.part().limb(X(14), Y(20), ...hf, 3, sk, Sk); hand(hf[0], hf[1], -1);
  d.part().limb(X(28), Y(20), X(33), Y(29), 3, sk, Sk); hand(X(33), Y(29), 1);
  d.part().ellipse(X(21), Y(10), 7, 7.5, sk, Sk, .6).ellipse(X(14), Y(11), 1.5, 2, sk, Sk).ellipse(X(28), Y(11), 1.5, 2, sk, Sk);   // cabeça careca e orelhas
  d.dots([[X(18), Y(4)], [X(19), Y(4)], [X(20), Y(3)]], sh);   // brilho da careca molhada
  if (o.eye !== "shut") d.ellipse(X(18), Y(9), 2, 1.8, BW).ellipse(X(24), Y(9), 2, 1.8, BW);   // branco do olho, que aparece na pele escura
  bEye(d, X(18), Y(9), o, o.eye === "shut" ? BW : BN); bEye(d, X(24), Y(9), o, o.eye === "shut" ? BW : BN);
  if (at || cr) { d.part().ellipse(X(21), Y(14), 3.5, 2.5, "#3a1410"); d.rect(X(18), Y(12), 7, 1, BW); }   // a gargalhada
  else d.limb(X(17), Y(13), X(21), Y(15), 1, Sk).limb(X(21), Y(15), X(25), Y(13), 1, Sk);   // sorriso de quem sabe que vai virar a canoa
  return {c: d.canvas(), head: [X(21), Y(10)]};
}
// visagem (assombração de Belém): vestido comprido sem pés, flutuando, cabelo escuro e olhos acesos; C troca as cores
function visagem(C) {
  return (pose, f) => {
    const d = rigGrid(1, 40, 46), o = pose === "ko" ? "x" : pose === "hurt" ? "shut" : "open";
    if (pose === "ko") {   // o vestido se desfaz no chão
      d.part().poly([[8, 40], [14, 34], [34, 33], [38, 40], [33, 43], [28, 41], [22, 44], [16, 41], [10, 44]], C.w, C.W, 28);
      d.part().poly([[6, 36], [14, 34], [12, 42]], C.h).ellipse(10, 38, 4.5, 4, C.s);
      d.dots([[8, 37], [10, 37], [9, 38], [8, 39], [10, 39]], BN);
      return {c: d.canvas(), head: [10, 35]};
    }
    const at = pose === "attack", cr = pose === "crouch", hu = pose === "hurt", by = (pose === "idle" ? f : 0) + (cr ? 3 : 0), bx = at ? -3 : hu ? 3 : 0, w = pose === "idle" ? f : 0;
    const X = v => v + bx, Y = v => v + by;
    d.part().poly([[X(13), Y(10)], [X(15), Y(30)], [X(12), Y(36)], [X(28), Y(36)], [X(25), Y(30)], [X(27), Y(10)]], C.h);   // cabelo comprido atrás
    d.part().poly([[X(14), Y(16)], [X(26), Y(16)], [X(33), Y(38)], [X(30), Y(43 - w)], [X(26), Y(39)], [X(21), Y(44 + w)], [X(16), Y(39)], [X(12), Y(43 - w)], [X(7), Y(38)]], C.w, C.W, X(24));   // vestido
    d.dots([[X(12), Y(30)], [X(18), Y(34)], [X(26), Y(30)], [X(22), Y(40)]], C.W);
    const hand = at ? [[X(14), Y(18)], [X(1), Y(15)]] : cr ? [[X(14), Y(18)], [X(9), Y(30)]] : [[X(14), Y(18)], [X(10), Y(29)]];
    d.part().limb(...hand[0], ...hand[1], 2, C.s, C.W);
    d.part().limb(X(26), Y(18), X(30), Y(29), 2, C.s, C.W);
    d.part().ellipse(X(20), Y(10), 5.5, 6, C.s, C.W, .7);
    d.part().poly([[X(14), Y(5)], [X(26), Y(5)], [X(26), Y(10)], [X(23), Y(7)], [X(17), Y(7)], [X(14), Y(11)]], C.h);   // franja
    if (o === "shut") d.dots([[X(17), Y(10)], [X(18), Y(10)], [X(22), Y(10)], [X(23), Y(10)]], BN);
    else d.ellipse(X(17.5), Y(10), 1.4, 1.6, C.e).ellipse(X(22.5), Y(10), 1.4, 1.6, C.e);
    if (at) d.part().ellipse(X(20), Y(14), 1.5, 2, BN);   // grito
    return {c: d.canvas(), head: [X(20), Y(10)]};
  };
}

/* ---------- registro e cache ---------- */
const BEAST_DRAW = {macaco, harpia, caranguejeira, piranha, poraque, morcego, coruja, chupacabra, garca, pirarucu, caranguejo, matinta, curupira, mapinguari, pombo,
  gaivota: (pose, f) => garca(pose, f, {b: "#f4f4f4", B: "#a8b0b8", y: "#e8b030", Y: "#b88a20", k: "#e8b030"}),   // gaivota: a garça em branco e cinza
  cobra_norato: cobra({b: "#2a3a4a", B: "#1a2430", k: "#7cf2ff", eye: "#bff8ff"}, false),   // Cobra Norato: escura, com desenhos e olhos de luz
  batedor: pessoa({pal: {s: "#9a6236", S: "#6e4424", h: "#1a1420"}, shirt: ["#2a2a30", "#18181c"], pants: ["#3a5a8a", "#24405a"], noBand: true, cap: ["#e5401c", "#a82a10"], prop: "pelt"}),
  golpista: pessoa({pal: {s: "#b47a48", S: "#8a5a32", h: "#2a2238"}, shirt: ["#e8e2cf", "#c8c0a8"], pants: ["#2a2a30", "#18181c"], noBand: true, glasses: true}),
  ladrao_bike: pessoa({pal: {s: "#8a5a32", S: "#5e3a1e"}, shirt: ["#3f9a5c", "#25663a"], pants: ["#2a2a30", "#18181c"], noBand: true, cap: ["#e8c040", "#b8902a"]}),
  mulher_branco: visagem({w: "#f4f4ee", W: "#c0c0cc", s: "#e8e0d8", h: "#1a1420", e: "#ff3a3a"}),
  visagem_mare: visagem({w: "#9ad8d0", W: "#5aa8a0", s: "#c8e8e0", h: "#2a4a48", e: "#ffffff"}),
  jararaca: cobra({b: "#8a7a5a", B: "#5e5038", k: "#3a2a1a"}, true),   // jararaca: cabeça triangular, marrom com desenhos escuros
  soco: (pose, f) => garca(pose, f, {b: "#9a7a52", B: "#6e5436", y: "#d8b040", Y: "#a88a2a", k: "#c8a040"}),   // socó-boi: a garça em marrom listrado
  cobra_cipo: cobra({b: "#6ab83a", B: "#3e8a24", k: "#a8e070"}, false),   // cobra-cipó: verde-folha, fina
  macarico: (pose, f) => garca(pose, f, {b: "#a8906a", B: "#7a6446", y: "#3a2a1a", Y: "#22180e", k: "#4a3a2a"}),   // maçarico: a garça em tons de areia
  guara: (pose, f) => garca(pose, f, {b: "#e8402a", B: "#b02818", y: "#3a2418", Y: "#22140c", k: "#5a2a1a"}),   // guará: a garça em vermelho
  garca_moura: (pose, f) => garca(pose, f, {b: "#8a96a8", B: "#5e6a7a", y: "#e8b030", Y: "#b88a20", k: "#2a3038"}),   // garça-moura: cinza-azulada
  bigua: (pose, f) => garca(pose, f, {b: "#2a2a30", B: "#16161a", y: "#e8a030", Y: "#b07a20", k: "#e8a030"}),   // biguá: a garça toda preta, de bico amarelo
  cabeca_cuia: cabecaCuia, fulozinha, lobisomem, tapejara, carranca, nego_dagua: negoDagua,
  martim: (pose, f) => pombo(pose, f, {b: "#2a7ac8", B: "#1a4a8a", n: "#f4f0e4", p: "#e8702a", w: "#4aa8e0", y: "#2a2a2a"}),   // martim-pescador: azul, colar branco e peito laranja
  tuiuiu: (pose, f) => garca(pose, f, {b: "#f6f6f0", B: "#c8c8c0", n: "#1e1e24", N: "#0e0e12", r: "#d8283a", R: "#a01a28", y: "#1e1e24", Y: "#0e0e12", k: "#1e1e24"}),   // tuiuiú: branco, pescoço preto e colar vermelho
  arara_azul: (pose, f) => pombo(pose, f, {b: "#2a4ac8", B: "#1a2a8a", n: "#3a5ad8", p: "#3a5ad8", w: "#2a3aa8", y: "#f0d020"}),   // arara-azul: azul inteira, de bico amarelo (o amarelo da cara)
  minhocao: cobra({b: "#8a6a48", B: "#5a4430", k: "#b8946a", eye: "#ffd23a"}, false),   // Minhocão do Pantanal: grosso, cor de barro, de anéis claros
  carao: (pose, f) => garca(pose, f, {b: "#6a4a32", B: "#4a3222", y: "#c8a050", Y: "#8a6a28", k: "#3a2a1a"}),   // carão: a garça em pardo-escuro
  cobra_dagua: cobra({b: "#4a5a3a", B: "#2e3a24", k: "#c8b060"}, false),   // cobra-d'água: verde-oliva com a barriga amarela
  jiboia: cobra({b: "#a8885a", B: "#74583a", k: "#4a3220"}, false),   // jiboia: parda, com as manchas escuras em sela
  meia_noite: pessoa({pal: {s: "#5e3a1e", S: "#3a2412", h: "#1a1420"}, shirt: ["#1a1a22", "#0e0e14"], pants: ["#1a1a22", "#0e0e14"], noBand: true, cap: ["#1a1a22", "#0e0e14"]}),   // Homem da Meia-Noite: o boneco de fraque e cartola
  cascavel: cobra({b: "#b89a5a", B: "#7a6234", k: "#4a3a1a"}, true),   // cascavel: cabeça triangular, cor de areia com losangos escuros
  serpente: cobra({b: "#c8a030", B: "#8a6a18", k: "#fff2a0", eye: "#ff8a3a"}, false),   // Serpente encantada da ilha: dourada
  boto: (pose, f) => boto(pose, f, false), boto_encantado: (pose, f) => boto(pose, f, true),
  boitata: cobra({b: "#e8601c", B: "#a8300c", k: "#ffd23a", eye: "#fff3a0", flame: true, rattle: ["#e8d8a0", "#a89870"]}, false),
  sucuri: cobra({b: "#5a7a3a", B: "#3a5a24", k: "#1e2a14"}, false),
  surucucu: cobra({b: "#b0905a", B: "#806440", k: "#3a2a1a"}, true)};
Object.keys(QUADS).forEach(id => { BEAST_DRAW[id] = (pose, f) => quad(QUADS[id], pose, f); });
const BEAST_CACHE = new Map();
const beastId = id => BEAST_DRAW[id] ? id : BEAST_DRAW[ART[id]] ? ART[id] : null;   // chefes usam o desenho do bicho base
function beastFrame(id, pose = "idle", f = 0, evil = false) {
  const k = beastId(id); if (!k) return null;
  evil = evil && pose !== "ko";   // desmaiado já voltou a si
  const key = k + pose + f + (evil ? "!" : "");
  if (!BEAST_CACHE.has(key)) {
    BEAST_EVIL = evil;
    try {
      const r = BEAST_DRAW[k](pose, f);
      r.c.dataset.scale = BEAST_K; r.c.dataset.head = r.head.join(",");
      BEAST_CACHE.set(key, r.c);
    } finally { BEAST_EVIL = false; }
  }
  return BEAST_CACHE.get(key);
}
