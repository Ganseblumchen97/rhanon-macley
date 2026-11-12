/* Retratos grandes das falas (narração, ui/narration.js): o busto de quem fala fica do lado de fora da caixa.
   Desde a 0.93 a gente (Rhanon, Franciscane, Pajé, entrevistadora) é desenhada em gfx/retratos.js (112x128, pintada pixel a
   pixel, com pose por expressão); daqui continuam valendo o Pytuna (ppPytuna, 80x96 ampliado), FACE_SHAPE, pMix e VESTE_CUT.
   O desenho antigo da gente (80x96, contorno automático do rigGrid em gfx/rig.js) ficou só para consulta.
   portraitDraw(x, who, expr, o): who = "rhanon" | "fran" | "paje" | "pytuna" | "entrevista"; expr = chave de FACE_SHAPE;
   o = {t (relógio em ms), talk (boca aberta), blink, look (rhanonLook: roupa, óculos e talismã de quem viaja)}.
   Cada combinação vira um canvas guardado (PORTRAIT_CACHE); o Pytuna, que é fumaça mexendo, tem quadros pelo relógio. */
const PORTRAIT_W = 80, PORTRAIT_H = 96;
// sobrancelha: bo = ponta de fora, bi = ponta de dentro (positivo desce); open = abertura do olho (0 = fechado em arco,
// sorrindo); mouth = boca; eye = para onde olha (x); raise = uma sobrancelha sobe (desconfiado); lid = pálpebra torta
const FACE_SHAPE = {
  normal:    {bo: 0, bi: 0, open: 1, mouth: "calmo", eye: 0},
  feliz:     {bo: -1, bi: -1, open: 0, mouth: "riso", eye: 0},
  pensativo: {bo: 0, bi: 1, open: .7, mouth: "hum", eye: 1, raise: true},
  bravo:     {bo: -1, bi: 3, open: .7, mouth: "bravo", eye: 0, lid: "bravo"},
  surpreso:  {bo: -3, bi: -3, open: 1.3, mouth: "o", eye: 0},
  triste:    {bo: 2, bi: -2, open: .7, mouth: "triste", eye: 0, lid: "triste"}
};
// pele, sombra da pele, cabelo, brilho e sombra do cabelo, olho, sobrancelha, faixa da cabeça
const PORTRAIT_PAL = {
  rhanon:     {s: "#c98a56", S: "#99603a", h: "#2a2238", H: "#4d4170", D: "#1b1626", iris: "#4a2c16", brow: "#1b1a24", band: ["#3fb35f", "#237a40"]},
  fran:       {s: "#e2aa7a", S: "#b0784c", h: "#5e3a22", H: "#8e6040", D: "#3e2414", iris: "#6a3c1a", brow: "#3a2214", band: ["#3fb35f", "#237a40"]},
  paje:       {s: "#9a6236", S: "#6e4424", h: "#e4ddd0", H: "#ffffff", D: "#b8b0a4", iris: "#2a1a10", brow: "#f4ecd8", band: ["#7a2a8a", "#4e1a5a"]},
  entrevista: {s: "#c8905a", S: "#9a6a3e", h: "#e8702a", H: "#ffa060", D: "#b04e14", iris: "#3a2414", brow: "#a8481a"}
};
const PORTRAIT_CACHE = new Map(), P_LIP = "#6a1a24", P_EYE = "#fbf6ea";
// mistura duas cores "#rrggbb" (k = quanto da segunda)
function pMix(a, b, k) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
}

/* ---------- partes ---------- */
function ppHairBack(d, P, who) {
  if (who === "rhanon") d.part().ellipse(40, 35, 20.5, 18, P.h).poly([[19.5, 35], [60.5, 35], [62, 61], [57, 63], [53, 56], [27, 56], [23, 63], [18, 61]], P.h)   // liso, caindo reto até o queixo
    .limb(22, 40, 21, 60, 1, P.D).limb(58, 40, 59, 60, 1, P.D);
  else if (who === "fran") d.part().ellipse(40, 33, 21, 21, P.h, P.D, .7).poly([[20, 62], [19, 36], [61, 36], [60, 62]], P.h);
  else if (who === "paje") {   // cocar de penas em leque atrás da cabeça e o cabelo branco comprido
    const cores = [["#e2363d", "#9a1a22"], ["#ffd23a", "#c89a10"], ["#3fb0d8", "#1a6a90"], ["#3fb35f", "#237a40"]];
    for (let i = -6; i <= 6; i++) {
      const a = -Math.PI / 2 + i * .21, [c, k] = cores[(i + 12) % 4], at = r => [40 + Math.cos(a) * r, 36 + Math.sin(a) * r];
      d.part().limb(...at(10), ...at(30), 4.6, c).limb(...at(25), ...at(31), 4.6, k).dots([at(18), at(22)], "#f4ecd8");
    }
    d.part().poly([[18, 86], [14, 52], [20, 26], [40, 21], [60, 26], [66, 52], [62, 86], [52, 88], [28, 88]], P.h).limb(22, 50, 21, 84, 1, P.D).limb(58, 50, 59, 84, 1, P.D).limb(62, 56, 63, 84, 1, P.D);
  }
  else if (who === "entrevista") d.part().poly([[19, 68], [15, 40], [23, 21], [40, 17], [57, 21], [65, 40], [61, 68]], P.h).limb(60, 40, 59, 66, 1, P.D).limb(20, 44, 21, 66, 1, P.D);
}
function ppTorso(d, P, look, who) {
  const shirt = look && look.shirt, cover = who === "entrevista";   // a entrevistadora usa moletom (cobre tudo); quem viaja, a roupa por cima (ppGarment)
  const fill = cover ? shirt[0] : P.s, dark = cover ? shirt[1] : P.S, mid = cover ? pMix(fill, dark, .5) : P.M;
  d.part().poly([[0, 100], [3, 85], [17, 77], [33, 74], [47, 74], [63, 77], [77, 85], [80, 100]], fill)
    .poly([[59, 76], [77, 85], [80, 100], [58, 100], [63, 90], [62, 81]], mid).poly([[64, 78], [77, 85], [80, 100], [63, 100], [67, 90], [66, 82]], dark)   // sombra no ombro de lá
    .poly([[0, 100], [3, 91], [9, 100]], mid);
  // pescoço na mesma parte do tronco (sem linha preta na junta): sombra forte embaixo do queixo, meio-tom e a pele
  d.poly([[34, 55], [46, 55], [47, 77], [33, 77]], P.s).poly([[34, 55], [46, 55], [46.5, 63], [33.5, 61]], P.S).poly([[33.5, 61], [46.5, 63], [46.7, 66], [33.4, 64]], P.M)
    .limb(45.5, 64, 46.5, 76, 1, P.M);
  if (who === "entrevista") d.part().poly([[31, 74], [40, 85], [49, 74]], "#22222a");   // gola do moletom
  else d.rect(27, 80, 8, 1, P.M).rect(45, 80, 8, 1, P.M);   // clavícula
}
/* roupa de quem viaja (EQUIP.torso, look.veste) com o corte de cada uma, por cima do tronco numa parte própria.
   Para não parecer "colada": a cava é funda (o ombro e o começo do braço aparecem), a peça tem volume (meio-tom nos
   lados, sombra do lado de lá, dobras) e a borda tem acabamento. Regata: no Rhanon, larga com decote em U; na
   Franciscane, de alcinha. Colete: aberto na frente. Gibão e jaqueta: cobrem os ombros e têm gola */
const VESTE_CUT = {regata: "regata", colete_sucuri: "colete", colete_tracaja: "colete", gibao_bufalo: "gibao", jaqueta_jacare: "jaqueta",
  gibao_vaqueiro: "gibao", colete_cervo: "colete", jaqueta_tropeiro: "jaqueta", poncho_pampa: "gibao"};
const mirrorX = pts => pts.map(([x, y]) => [80 - x, y]).reverse();
function ppGarment(d, look, who) {
  if (!look || !look.shirt) return;
  const [c, k] = look.shirt, m = pMix(c, k, .5), cut = VESTE_CUT[look.veste] || "regata";
  // beira da cava (regata e colete): x da borda de fora em cada altura, para os detalhes ficarem dentro da peça
  const edge = y => y < 80 ? 24 : y < 86 ? 23 - (y - 80) * .67 : y < 91 ? 19 - (y - 86) : y < 95 ? 14 - (y - 91) * 1.5 : 8;
  // volume: meio-tom na beira de cá e sombra do lado de lá (a luz vem da esquerda, como na cabeça), sempre dentro da peça
  const volume = () => d.poly([[8, 100], [9, 95], [14, 91], [16, 95], [13, 100]], m)
    .poly([[57, 80], [61, 86], [66, 91], [72, 95], [74, 100], [60, 100], [59, 90]], m).poly([[61, 86], [66, 91], [72, 95], [74, 100], [65, 100], [63, 92]], k);
  if (cut === "regata" && who === "fran") {   // alcinha fina e decote redondo
    d.part().poly([[22, 100], [25, 86], [28, 78], [32, 76], [35, 82], [40, 85], [45, 82], [48, 76], [52, 78], [55, 86], [58, 100]], c)
      .poly([[50, 82], [55, 86], [58, 100], [50, 100], [53, 92]], m).poly([[54, 86], [58, 100], [55, 100]], k).rect(31, 96, 18, 1, m);
  } else if (cut === "regata") {   // regata larga: alça grossa, cava funda até o lado do peito, decote em U
    const lado = [[6, 100], [8, 95], [14, 91], [19, 86], [23, 80], [25, 76], [31, 75], [34, 80], [37, 83], [40, 84]];
    d.part().poly([...lado, ...mirrorX(lado)], c);
    volume();
    d.rect(18, 92, 14, 1, m).rect(48, 92, 14, 1, k).dots([[24, 96], [25, 97], [55, 96], [56, 97], [33, 98], [47, 98]], m)   // dobras embaixo do peito
      .limb(25, 77, 31, 76, 1, m).limb(49, 76, 55, 77, 1, k);   // costura da alça
  } else if (cut === "colete") {   // duas abas abertas, cava funda, borda com acabamento
    const aba = [[6, 100], [8, 95], [13, 91], [18, 86], [22, 80], [24, 76], [31, 75], [33, 80], [34, 88], [33, 100]];
    d.part().poly(aba, c).poly(mirrorX(aba), c);
    volume();
    const borda = look.veste === "colete_sucuri" ? "#8aa860" : "#7a8a5a";
    d.limb(31, 75, 34, 88, 1, borda).limb(34, 88, 33, 100, 1, borda).limb(49, 75, 46, 88, 1, borda).limb(46, 88, 47, 100, 1, borda);   // a beira da abertura
    if (look.veste === "colete_sucuri") { for (let y = 83; y < 100; y += 3) for (let x = 10; x < 72; x += 4) { const xx = x + (y % 6 ? 2 : 0), lim = edge(y) + 2; if ((xx > lim && xx < 31) || (xx > 49 && xx < 80 - lim)) d.dots([[xx, y]], k); } }   // escamas
    else for (const y of [88, 94]) d.limb(edge(y) + 2, y + 1, 31, y, 1, k).limb(49, y, 78 - edge(y), y + 1, 1, k);   // placas do casco
  } else {   // gibão e jaqueta: cobrem os ombros, com a costura do ombro, gola dobrada e a frente
    d.part().poly([[0, 100], [3, 85], [17, 77], [31, 74], [36, 84], [40, 90], [44, 84], [49, 74], [63, 77], [77, 85], [80, 100]], c)
      .poly([[0, 100], [3, 88], [9, 84], [12, 100]], m).poly([[59, 76], [77, 85], [80, 100], [58, 100], [63, 90], [62, 81]], m).poly([[64, 78], [77, 85], [80, 100], [63, 100], [67, 90], [66, 82]], k)
      .limb(14, 79, 18, 92, 1, m).limb(66, 79, 62, 92, 1, k)   // costura do ombro: o começo da manga
      .rect(20, 94, 12, 1, m).rect(48, 94, 12, 1, k);
    d.part().poly([[30, 74], [36, 84], [33, 89], [25, 79]], m).poly([[50, 74], [44, 84], [47, 89], [55, 79]], k);   // gola
    if (cut === "jaqueta") d.rect(40, 90, 1, 10, k).dots([[39, 93], [41, 93], [39, 97], [41, 97]], m);   // zíper
    else for (let x = 4; x < 78; x += 5) d.dots([[x, 99], [x + 1, 98]], k);   // franja do gibão
  }
}
function ppNecklace(d, P, who, look) {
  // em U: as pontas sobem pelo trapézio até a junta do pescoço (o colar dá a volta nele) e o meio cai no peito
  const at = k => { const a = Math.PI * k; return [40 - Math.cos(a) * 11, 74 + Math.sin(a) * 13]; };
  d.part(); for (let k = 0; k <= 1; k += .03) d.dots([at(k)], "#3a2414");
  if (who === "fran") for (let i = 1; i <= 9; i++) d.part().ellipse(...at(i / 10), 1.4, 1.4, "#e2363d", "#9a1a22", .4);   // continhas de semente
  else if (who === "paje") for (let i = 1; i <= 8; i++) d.part().ellipse(...at(i / 9), 1.5, 1.5, i % 2 ? "#2a2230" : "#e2363d");
  else { d.part(); for (let i = 2; i < 13; i++) { const [x, y] = at(i / 14); d.rect(x, y, 1, 2 + (i % 2), "#f6eedb"); } }   // colar de dentes
  const pedra = look && look.charm || (who === "paje" ? "#f4ecd8" : null);
  if (pedra) d.part().ellipse(40, 90, 2.6, 3, pedra).dots([[39, 88.5]], "#ffffff");   // talismã
  if (who === "fran" && (!(look && look.shirt) || VESTE_CUT[look.veste] === "colete")) d.part().rect(14, 92, 52, 3, "#a0663a").rect(14, 95, 52, 2, "#6b4126");   // a parte de cima da tanga
}
function ppBraid(d, P, s) {   // trança caindo por cima do ombro: gomos alternando claro e escuro, fita verde e a pontinha
  const n = 7, x0 = 40 + s * 16, y0 = 52, x1 = 40 + s * 21, y1 = 88;
  for (let i = 0; i < n; i++) { const k = i / (n - 1); d.part().ellipse(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, 3.3 - k * .6, 3, i % 2 ? P.H : P.h, P.D, .5); }
  d.part().rect(x1 - 2, y1 + 3, 5, 2, "#3fb35f").part().poly([[x1 - 2, y1 + 5], [x1 + 3, y1 + 5], [x1 + s, y1 + 10]], P.h);
}
// queixo: quadrado nos homens, um pouco mais fino nas mulheres (entre o quadrado e o pontudo)
const JAW = {
  quadrado: [[24, 50], [56, 50], [55, 59], [50, 64], [40, 65.5], [30, 64], [25, 59]],
  fino:     [[24.5, 50], [55.5, 50], [53.5, 59], [47, 64], [40, 66], [33, 64], [26.5, 59]]
};
function ppHead(d, P, who) {
  d.part().ellipse(22.5, 45, 2.8, 4.4, P.s, P.S, .2).ellipse(57.5, 45, 2.8, 4.4, P.s, P.S, .2);   // orelhas
  // sombra em três tons (sombra, meio-tom e pele): cada camada um pouco menor, para cima e para a esquerda
  const jaw = JAW[who === "fran" || who === "entrevista" ? "fino" : "quadrado"];
  const layer = (f, dx, dy) => jaw.map(([x, y]) => [40 + (x - 40) * f - dx, 50 + (y - 50) * f - dy]);
  d.part().ellipse(40, 40.5, 17.6, 19, P.S).poly(jaw, P.S)
    .ellipse(39.3, 40, 17, 18.6, P.M).poly(layer(.98, .7, .5), P.M)
    .ellipse(38.5, 39.4, 16.2, 18, P.s).poly(layer(.95, 1.3, 1), P.s);
}
function ppEyes(d, P, who, F, blink, look) {
  const K = RIG_K, lashes = who === "fran" || who === "entrevista", old = who === "paje";
  for (const s of [-1, 1]) {
    const cx = s < 0 ? 32 : 48;
    if (blink) d.rect(cx - 3, 46, 7, 1, K).dots([[cx + s * 4, 45]], K);
    else if (F.open === 0) d.dots([[cx - 3, 46], [cx - 2, 45], [cx - 1, 44], [cx, 44], [cx + 1, 44], [cx + 2, 45], [cx + 3, 46]], K);   // sorrindo
    else {
      const tall = F.open >= 1.2 ? 4 : F.open >= .95 ? 3 : 2, top = 47 - tall, ix = cx - 1 + (F.eye || 0);
      d.rect(cx - 3, top, 7, tall, P_EYE).rect(ix, top, 3, tall, P.iris).rect(ix + 1, top + (tall > 2 ? 1 : 0), 1, Math.min(2, tall), K).dots([[ix, top]], "#ffffff");
      for (let i = -3; i <= 3; i++) {   // pálpebra de cima: bravo desce no canto de dentro, triste no de fora
        const side = i * s, y = top - 1 + (F.lid === "bravo" && side < 0 ? 1 : 0) + (F.lid === "triste" && side > 1 ? 1 : 0);
        d.dots([[cx + i, y]], K);
      }
      d.dots([[cx + s * 4, top]], K).rect(cx - 2, 47, 5, 1, P.S);
      if (lashes) d.dots([[cx + s * 4, top - 1], [cx + s * 5, top - 2]], K);
      if (old) d.dots([[cx + s * 5, 47], [cx + s * 6, 48]], P.S);   // pé de galinha
    }
    const by = 40 + (F.raise && s > 0 ? -2 : 0);   // sobrancelha
    d.limb(cx + s * 4, by + F.bo, cx - s * 3, by + F.bi, old ? 2 : 1.6, P.brow);
    if (look && look.glasses) d.rect(cx - 4, 41, 9, 1, K).rect(cx - 4, 48, 9, 1, K).rect(cx - 5, 42, 1, 6, K).rect(cx + 5, 42, 1, 6, K);
  }
  if (look && look.glasses) d.rect(37, 43, 6, 1, K);
}
function ppFaceMarks(d, P, who) {
  d.dots([[41, 50], [41, 51], [40, 52]], P.S);   // nariz
  const r = "#e2363d";
  if (who === "rhanon") d.rect(24, 52, 5, 1, r).rect(25, 54, 4, 1, r).rect(51, 52, 5, 1, r).rect(51, 54, 4, 1, r);
  if (who === "fran") d.dots([[25, 53], [28, 52], [31, 53], [49, 53], [52, 52], [55, 53]], r);
  if (who === "paje") d.limb(26, 51, 30, 53, 1, r).limb(54, 51, 50, 53, 1, r);
}
function ppMouth(d, kind, talk, who) {
  const K = RIG_K, lip = who === "entrevista" ? "#8a2a34" : P_LIP;
  if (talk) {   // falando: a boca abre no jeito da expressão
    const w = kind === "riso" ? 4 : kind === "o" ? 1 : 3;
    d.rect(40 - w, 57, w * 2 + 1, 2, lip).rect(41 - w, 59, w * 2 - 1, 1, "#e26a6a")
      .rect(40 - w, 56, w * 2 + 1, 1, K).rect(41 - w, 60, w * 2 - 1, 1, K).dots([[39 - w, 57], [39 - w, 58], [41 + w, 57], [41 + w, 58], [40 - w, 59], [40 + w, 59]], K);
    if (kind === "bravo" || kind === "riso") d.rect(41 - w, 57, w * 2 - 1, 1, "#ffffff");
    return;
  }
  if (kind === "riso") d.rect(37, 56, 7, 1, K).rect(37, 57, 7, 1, "#ffffff").rect(37, 58, 7, 1, lip).rect(38, 59, 5, 1, lip)
    .dots([[36, 57], [44, 57], [36, 58], [44, 58], [37, 59], [43, 59]], K).rect(38, 60, 5, 1, K);
  else if (kind === "o") d.rect(39, 57, 3, 3, lip).rect(39, 56, 3, 1, K).rect(39, 60, 3, 1, K).rect(38, 57, 1, 3, K).rect(42, 57, 1, 3, K);
  else if (kind === "hum") d.dots([[39, 58], [40, 58], [41, 58], [42, 57], [43, 57]], K);
  else if (kind === "bravo") d.dots([[36, 59], [37, 58], [38, 57], [39, 57], [40, 57], [41, 57], [42, 57], [43, 58], [44, 59]], K);
  else if (kind === "triste") d.dots([[37, 59], [38, 58], [39, 58], [40, 58], [41, 58], [42, 58], [43, 59]], K);
  else d.dots([[37, 57], [38, 58], [39, 58], [40, 58], [41, 58], [42, 58], [43, 57]], K);   // calmo
}
function ppHairFront(d, P, who) {
  if (who === "rhanon") {
    // franja lisa, cortada reto com pontinhas rasas, e as mechas dos lados descendo junto do rosto
    d.part().poly([[20, 44], [20, 30], [27, 22], [40, 19], [53, 22], [60, 30], [60, 44], [57, 40], [54, 42], [50, 39], [46, 41], [42, 39], [38, 41], [34, 39], [30, 42], [26, 39], [23, 42]], P.h)
      .poly([[20, 36], [19, 57], [23, 59], [25, 45]], P.h).poly([[60, 36], [61, 57], [57, 59], [55, 45]], P.h)
      .dots([[28, 26], [29, 25], [30, 25], [31, 24], [32, 24], [33, 24], [45, 24], [46, 24], [47, 24], [48, 25], [49, 25]], P.H).dots([[24, 46], [24, 50], [56, 46], [56, 50], [29, 36], [29, 37], [36, 35], [36, 36], [44, 35], [44, 36], [51, 36], [51, 37]], P.D);   // fios da franja
  } else if (who === "fran") {
    d.part().poly([[21, 43], [19, 30], [26, 21], [40, 19], [53, 20], [60, 28], [59, 43], [54, 39], [46, 38], [38, 38], [30, 40], [24, 45]], P.h)
      .poly([[21, 38], [19, 48], [22, 57], [24, 47], [25, 40]], P.h).poly([[59, 38], [61, 48], [58, 57], [56, 47], [55, 40]], P.h)
      .dots([[27, 25], [28, 24], [29, 24], [30, 23], [44, 22], [45, 22], [46, 23], [47, 23]], P.H);
  } else if (who === "paje") {
    d.part().poly([[22, 43], [21, 30], [30, 24], [40, 23], [50, 24], [59, 30], [58, 43], [52, 35], [40, 32], [28, 35]], P.h).dots([[30, 27], [31, 26], [32, 26]], P.H);
  } else if (who === "entrevista") {
    d.part().poly([[21, 46], [19, 30], [28, 21], [41, 20], [54, 21], [61, 30], [59, 42], [48, 38], [37, 33], [32, 28], [27, 38]], P.h).dots([[30, 24], [31, 23], [32, 23], [44, 22], [45, 22]], P.H);
  }
  if (P.band) {   // faixa da cabeça, curvada pela testa
    d.part(); const q = k => [20 + 40 * k, 36 - Math.sin(k * Math.PI) * 6];
    for (let i = 0; i < 10; i++) d.limb(...q(i / 10), ...q((i + 1) / 10), 3.4, P.band[0]);
    for (let i = 0; i < 10; i++) { const [a, b] = q(i / 10), [c, e] = q((i + 1) / 10); d.limb(a, b + 1.5, c, e + 1.5, 1, P.band[1]); }
    if (who === "paje") d.dots([[39, 30], [40, 30], [41, 30], [40, 31]], "#ffd23a");
  }
}
/* ---------- Pytuna: fumaça em pixel, com olhos de brasa ---------- */
function ppEll(x, cx, cy, rx, ry, col) {
  x.fillStyle = col;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) { const u = (i + .5 - cx) / rx, v = (y + .5 - cy) / ry; if (u * u + v * v <= 1) x.fillRect(i, y, 1, 1); }
}
function ppPytuna(F, frame, talk, blink) {
  const c = document.createElement("canvas"); c.width = PORTRAIT_W; c.height = PORTRAIT_H; const x = c.getContext("2d");
  const t = frame * 150;
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < 14; i++) {   // três camadas: borda escura, meio e o miolo
    const a = i / 14 * Math.PI * 2 + t / 2600 + pass * .3, d = 15 + (i % 3) * 5, r = 12 + (i % 4) * 3 + Math.round(Math.sin(t / 700 + i) * 1.5) - pass * 3;
    if (r > 0) ppEll(x, 40 + Math.cos(a) * d, 50 + Math.sin(a) * d * .9 + (i % 2 ? 4 : 0), r, r, ["#0e0e14", "#24242e", "#34323e"][pass]);
  }
  ppEll(x, 40, 47, 20, 19, "#16161e");
  const eye = (s, col, grow) => {
    const ex = 40 + s * 9, ey = 44;
    if (blink) { x.fillStyle = col; x.fillRect(ex - 4 - grow, ey, 9 + grow * 2, 1 + grow); return; }
    if (F.mouth === "riso") { for (let i = -4; i <= 4; i++) { x.fillStyle = col; x.fillRect(ex + i - grow, ey - 2 + (Math.abs(i) / 2 | 0) - grow, 1 + grow * 2, 2 + grow); } return; }   // deboche
    if (F.mouth === "o") return ppEll(x, ex, ey, 3 + grow, 4 + grow, col);
    if (F.mouth === "calmo") return ppEll(x, ex, ey, 4 + grow, 2 + grow, col);
    for (let i = 0; i <= 8; i++) {   // bravo (e triste, ao contrário): olhos rasgados
      const k = i / 8, xx = ex + s * (i - 3), sad = F.mouth === "triste";
      const y0 = ey + Math.round((sad ? 1 - k : k) * 3) - (sad ? 0 : 2), h = Math.max(1, Math.round(3 - k * 2));
      x.fillStyle = col; x.fillRect(xx - grow, y0 - grow, 1 + grow * 2, h + grow * 2);
    }
  };
  for (const s of [-1, 1]) eye(s, "#7a0a0a", 1);
  for (const s of [-1, 1]) eye(s, "#ff3a2a", 0);
  if (!blink) for (const s of [-1, 1]) { x.fillStyle = "#ffd0c0"; x.fillRect(40 + s * 9 - 1, 43, 1, 1); }
  if (talk || F.mouth === "riso") {   // boca: rachadura em brasa
    for (let i = 0; i <= 12; i++) { x.fillStyle = talk ? "#ff5a3a" : "#c8301a"; x.fillRect(34 + i, 56 + (i % 2) + (F.mouth === "riso" ? -Math.round(Math.sin(i / 12 * Math.PI) * 2) : 0), 1, talk ? 3 : 1); }
  }
  return c;
}
/* ---------- montagem ---------- */
function portraitPixel(who, expr, talk, blink, look, frame) {
  const key = [who, expr, talk, blink, who === "pytuna" ? frame % 40 : JSON.stringify(look || {})].join("|");
  if (PORTRAIT_CACHE.has(key)) return PORTRAIT_CACHE.get(key);
  if (PORTRAIT_CACHE.size > 300) PORTRAIT_CACHE.clear();
  const F = FACE_SHAPE[expr] || FACE_SHAPE.normal;
  let c;
  if (who === "pytuna") c = ppPytuna(F, frame % 40, talk, blink);
  else {
    // meio-tom da pele; linhas entre partes na cor da parte escurecida (não preto): só a silhueta tem contorno preto
    const B = PORTRAIT_PAL[who] || PORTRAIT_PAL.rhanon, P = {...B, M: pMix(B.s, B.S, .5)}, d = rigGrid(1, PORTRAIT_W, PORTRAIT_H, {inner: c => pMix(c, RIG_K, .55)});
    ppHairBack(d, P, who); ppTorso(d, P, look, who); if (who !== "entrevista") ppGarment(d, look, who);
    if (who !== "entrevista") ppNecklace(d, P, who, look);
    if (who === "fran") { ppBraid(d, P, -1); ppBraid(d, P, 1); }
    ppHead(d, P, who); ppEyes(d, P, who, F, blink, look); ppFaceMarks(d, P, who); ppMouth(d, F.mouth, talk, who);
    ppHairFront(d, P, who);
    c = d.canvas();
  }
  PORTRAIT_CACHE.set(key, c);
  return c;
}
// desenha o retrato no canvas da fala (112x128). Gente: o desenho novo, pintado pixel a pixel e com pose por expressão
// (retratoNovo em gfx/retratos.js); o Pytuna continua a fumaça daqui, ampliada para o tamanho novo
function portraitDraw(x, who, expr, o = {}) {
  const t = o.t || 0, bob = REDUCE ? 0 : Math.sin(t / 900) > .2 ? 1 : 0;   // respira: o busto desce um pixel
  x.setTransform(1, 0, 0, 1, 0, 0); x.imageSmoothingEnabled = false; x.clearRect(0, 0, RT_W, RT_H);
  if (who === "pytuna") {   // fumaça pintada no tamanho do retrato (retratoPytuna em gfx/retratos.js)
    x.drawImage(retratoPytuna(expr, Math.floor(t / 150), o.talk ? (Math.floor(t / 190) % 2 ? 2 : 1) : 0, !!o.blink), 0, 0);
    return;
  }
  const look = who === "rhanon" || who === "fran" ? o.look : who === "entrevista" ? {shirt: ["#3a3a44", "#22222a"], glasses: true} : null;   // só quem viaja usa a roupa do equipamento
  const talk = o.talk ? (Math.floor(t / 190) % 2 ? 2 : 1) : 0;   // a boca alterna meio aberta e aberta
  x.drawImage(retratoNovo(who, expr, talk, !!o.blink, look), 0, bob);
}
