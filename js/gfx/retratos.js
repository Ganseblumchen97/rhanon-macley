/* Retratos das falas pintados pixel a pixel (112x128), usados por portraitDraw (gfx/portraits.js).
   Em vez de formas chapadas, cada pixel da pele e do cabelo escolhe um tom de uma rampa de 5 cores conforme a luz (vem de
   cima e da esquerda), com sombra projetada da franja, do nariz e do queixo, brilho em anel no cabelo com os fios separados,
   olho com íris em degradê e dois brilhos, e contorno escuro só por fora. Cada expressão tem a sua pose (RT_POSE): rosto
   um pouco virado, cabeça inclinada, ombros subindo ou caindo; o bravo de quem viaja empunha a lança.
   Personagem novo = linha em RT_CHAR (rampas e estilo do cabelo). `testes/previa_retratos.html` mostra todos. */
const RT_W = 112, RT_H = 128, RT_CX = 56;
const RT_LINE = "#160e16";   // contorno de fora
const RT_GREEN = ["#86e89a", "#3fb35f", "#237a40", "#124e28"], RT_PURPLE = ["#c88ad8", "#7a2a8a", "#4e1a5a", "#32103a"];
// skin/hair: rampas do claro ao escuro; jaw = [expoente, potência] do queixo; cabelo = estilo (liso, trancas, paje, chanel)
const RT_CHAR = {
  rhanon: {skin: ["#f2bc8a", "#dea06c", "#c98a56", "#a4683e", "#74432a"], hair: ["#7a6aa8", "#4d4170", "#2e2640", "#1c1728", "#0f0c18"],
    iris: ["#2a160c", "#5a3418", "#96592a", "#c98a44"], jaw: [3, .5], brow: "#191420", band: RT_GREEN, cabelo: "liso", colar: "dente", pintura: "riscas", lanca: true},
  fran: {skin: ["#ffd9b0", "#f4c294", "#e2aa7a", "#bd8256", "#8a5636"], hair: ["#d09a62", "#9a6a44", "#643e24", "#422616", "#26140a"],
    iris: ["#2e180a", "#6a3c1a", "#a8662e", "#dc9a52"], jaw: [2.3, .58], brow: "#3a2012", band: RT_GREEN, cabelo: "trancas", colar: "sementes", pintura: "pontos", lashes: true, lanca: true},
  paje: {skin: ["#cc8e5a", "#b27646", "#9a6236", "#744829", "#4c2c18"], hair: ["#ffffff", "#f6f0e6", "#e4ddd0", "#b8b0a4", "#8a8278"],
    iris: ["#160c08", "#2a1a10", "#4a3020", "#6e4c30"], jaw: [3, .5], brow: "#f4ecd8", band: RT_PURPLE, cabelo: "paje", colar: "osso", pintura: "paje", velho: true},
  entrevista: {skin: ["#f2c490", "#dea872", "#c8905a", "#a06c40", "#74482a"], hair: ["#ffc888", "#ffa060", "#e8702a", "#b04e14", "#7a3208"],
    iris: ["#1e120a", "#3a2414", "#6a4426", "#96683a"], jaw: [2.3, .58], brow: "#a8481a", band: null, cabelo: "chanel", lashes: true, gola: [9, 8]}
};
// expressões (as mesmas chaves de FACE_SHAPE): bo/bi = ponta de fora/dentro da sobrancelha (positivo desce); open = abertura do olho
const RT_EXPR = {
  normal:    {bo: 0, bi: 0, open: 1, mouth: "calmo", eye: 0},
  feliz:     {bo: -1, bi: -1, open: 0, mouth: "riso", eye: 0},
  pensativo: {bo: 0, bi: 1, open: .7, mouth: "hum", eye: 2, raise: true},
  bravo:     {bo: -2, bi: 4, open: .7, mouth: "bravo", eye: 0, lid: "bravo"},
  surpreso:  {bo: -4, bi: -4, open: 1.3, mouth: "o", eye: 0},
  triste:    {bo: 3, bi: -2, open: .7, mouth: "triste", eye: 0, lid: "triste"}
};
/* pose de cada expressão: yaw = rosto virado (-1 esquerda, 1 direita: os traços andam para o lado e o olho de lá encolhe),
   tilt = cabeça inclinada (cada linha anda um pouco para o lado), hx/hy = cabeça deslocada, sh = um ombro mais alto,
   by = tronco sobe ou desce, arma = a lança empunhada do lado (só quem tem `lanca`) */
const RT_POSE = {
  normal:    {yaw: 0, tilt: 0, hx: 0, hy: 0, sh: 0, by: 0},
  feliz:     {yaw: 0, tilt: .075, hx: 1, hy: -1, sh: .02, by: -1},
  pensativo: {yaw: 1, tilt: -.05, hx: 2, hy: 1, sh: -.03, by: 0},
  bravo:     {yaw: -1, tilt: -.06, hx: -4, hy: 3, sh: -.06, by: 1, arma: true},
  surpreso:  {yaw: 0, tilt: .03, hx: 1, hy: -3, sh: 0, by: -2},
  triste:    {yaw: -1, tilt: .055, hx: -2, hy: 4, sh: .03, by: 2}
};
// meia largura do rosto em cada linha: redondo em cima, afinando para o queixo
function rtFaceW(y, jaw) {
  if (y < 25 || y > 88) return 0;
  if (y <= 54) return 25 * Math.sqrt(Math.max(0, 1 - ((y - 54) / 30) ** 2));
  const t = (y - 54) / 34; return 25 * Math.max(0, 1 - t ** jaw[0]) ** jaw[1];
}
const rtBandTop = x => Math.round(33 - Math.sin(Math.max(0, Math.min(1, (x - 24) / 64)) * Math.PI) * 6);
function rtFringeY(cab, x) {   // onde a franja acaba em cada coluna
  if (cab === "trancas" || cab === "chanel") return Math.round(x < 72 ? 49 - (x - 30) * .2 + ((x % 9) < 2 ? 1 : 0) : 40 + (x - 72) * .7);   // de lado, repartida à direita
  if (cab === "paje") return Math.round(35 + Math.abs(x - RT_CX) * .4);   // repartida no meio, testa alta
  return 44 + ((x % 7) < 2 ? 2 : (x % 7) < 4 ? 1 : 0);                    // reta, com pontinhas rasas
}
// tom do cabelo (0 claro a 4 escuro): anel de brilho no alto, fios separados, lado de lá mais escuro
function rtHairTone(cab, x, y) {
  const strand = Math.floor((x + Math.sin(y / 11) * 2) / 3), gy = 21 + (x - RT_CX) ** 2 / 62;
  const dg = Math.abs(y - gy), wide = 2 + (strand % 3 === 0 ? 2 : 0) - (strand % 2);
  if (y < 34 && dg <= wide) return dg <= .8 && strand % 3 !== 1 ? 0 : 1;
  let tn = 2;
  if (x > RT_CX + 17) tn = 3;                                                                  // lado da sombra
  if (y > 40 && (x + Math.round(Math.sin(y / 11) * 2)) % 6 === 0) tn = Math.min(4, tn + 1);   // risco entre as mechas
  if (x < RT_CX - 14 && y > 48 && y < 78 && strand % 4 === 0) tn = 1;                          // brilho nas mechas do lado da luz
  if (cab !== "liso" && y > 44 && y < 60 && x > 34 && x < 62 && strand % 5 === 0) tn = 1;
  return tn;
}
// cocar do Pajé: penas em leque atrás da cabeça, cada uma com a metade da luz, a da sombra, o talo claro e a ponta escura
function rtCocar(px) {
  const cores = [["#ff7a7a", "#e2363d", "#9a1a22"], ["#fff0a0", "#ffd23a", "#c89a10"], ["#8ad8f4", "#3fb0d8", "#1a6a90"], ["#86e89a", "#3fb35f", "#237a40"]];
  for (let y = 0; y < 66; y++) for (let x = 0; x < RT_W; x++) {
    const dx = x - RT_CX, dy = y - 46, r = Math.hypot(dx, dy); if (r < 14 || r > 47) continue;
    const ang = Math.atan2(dy, dx), i = Math.round((ang + Math.PI / 2) / .21); if (Math.abs(i) > 6) continue;
    const d = (ang - (-Math.PI / 2 + i * .21)) * r, w = r > 41 ? (47 - r) * .65 : 3.7; if (Math.abs(d) > w) continue;
    const c = cores[(i + 12) % 4];
    px(x, y, Math.abs(d) < .6 && r < 40 ? "#f4ecd8" : r > 37 ? c[2] : d < 0 ? c[0] : c[1]);
  }
}
function retratoPixel(who, expr, talk, blink, look) {
  const R = RT_CHAR[who] || RT_CHAR.rhanon, F = RT_EXPR[expr] || RT_EXPR.normal, P = RT_POSE[expr] || RT_POSE.normal, S = R.skin, Hh = R.hair, cab = R.cabelo, CX = RT_CX, RW = RT_W, RH = RT_H;
  const longo = cab === "trancas" || cab === "paje", shirt = look && look.shirt, oculos = (look && look.glasses) || R.oculos;
  // três camadas: cabelo de trás, tronco e cabeça; cada uma entra na pose do seu jeito na montagem
  const mk = h => { const c = document.createElement("canvas"); c.width = RW; c.height = h; return c; };
  const cBack = mk(RH), cBust = mk(RH + 8), cHead = mk(RH), cv = mk(RH);
  let g = cBack.getContext("2d");
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }, box = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const yaw = P.yaw, FX = CX + yaw * 3;                                  // centro dos traços do rosto
  const low = y => y > 54 ? Math.round(yaw * (y - 54) / 34 * 2) : 0;     // o queixo acompanha o lado para onde vira

  // ---- cabelo de trás (e o cocar) ----
  if (cab === "paje") rtCocar(px);
  for (let y = 14; y < RH; y++) for (let x = 18; x < 96; x++) {
    const top = ((x - CX) / 32) ** 2 + ((y - 48) / 32) ** 2 <= 1 && y <= 56, jag = (x >> 2) % 2 ? 2 : 0;
    const fim = longo ? RH : cab === "chanel" ? 99 + jag : 89 + jag;
    const larg = longo ? 33 - (y > 100 ? (y - 100) * .15 : 0) : cab === "chanel" ? 31 - (y > 92 ? (y - 92) * .5 : 0) : 31 - (y > 80 ? (y - 80) * .5 : 0);
    if (!top && !(y > 56 && y <= fim && Math.abs(x - CX) <= larg)) continue;
    let tn = rtHairTone(cab, x, y); if (!longo && y > fim - 6) tn = 3; if (longo && y > 92) tn = Math.max(tn, 3);
    px(x, y, Hh[tn]);
  }
  // ---- pescoço e tronco ----
  g = cBust.getContext("2d");
  const gola = R.gola || [14, 12], claro = shirt && pMix(shirt[0], "#ffffff", .18);
  for (let y = 80; y < RH + 8; y++) for (let x = 0; x < RW; x++) {
    const nw = 10 + (y > 94 ? (y - 94) * .6 : 0), hw = y < 97 ? 0 : y < 109 ? 14 + (y - 97) * 3.4 : 54.8 + (y - 109) * .15, dx = x - CX;
    const neck = y >= 80 && y < 104 && Math.abs(dx) <= nw, body = hw && Math.abs(dx) <= hw - (y < 109 ? Math.max(0, 3 - (y - 97)) : 0);
    if (!neck && !body) continue;
    const decote = (dx / gola[0]) ** 2 + ((y - 98) / gola[1]) ** 2;   // a pele aparece dentro do decote
    if (shirt && body && decote >= 1) {
      let c = dx > hw - 13 ? shirt[1] : dx < -hw + 12 && y > 103 ? claro : shirt[0];
      if (decote < 1.35 || (y > 112 && (x + y * 2) % 23 === 0)) c = shirt[1];   // borda do decote e dobras
      px(x, y, c); continue;
    }
    let tn = 2;
    if (neck && y < 104) tn = y < 90 ? (dx < -5 ? 3 : 4) : y < 94 ? 3 : dx > 6 ? 3 : 2;     // sombra do queixo no pescoço
    if (body && !neck) { tn = dx > hw - 13 ? 3 : dx < -hw + 12 && y > 103 ? 1 : 2; if (dx > hw - 5) tn = 4; }
    if (body && y >= 104 && y <= 105 && Math.abs(Math.abs(dx) - 20 - (y - 104)) <= 6) tn = 3;   // clavículas
    if (body && Math.abs(dx) <= 1 && y > 112) tn = 3;                                         // meio do peito
    px(x, y, S[tn]);
  }
  if (cab === "trancas" && !shirt) for (let y = 114; y < RH + 8; y++) for (let x = 2; x < 110; x++) {   // a parte de cima da tanga
    const hw = 54.8 + (y - 109) * .15; if (Math.abs(x - CX) > hw - 3) continue;
    px(x, y, y === 114 ? "#d8a468" : x > CX + 34 ? "#6d4329" : (x + y) % 9 === 0 ? "#6d4329" : y === 115 ? "#c08a52" : "#9c6339");
  }
  if (R.colar) {   // colar: contas ao longo de uma curva; dente (ou osso) no meio
    for (let x = CX - 17; x <= CX + 17; x += 3) {
      const y = 108 - ((x - CX) / 17) ** 2 * 6, c = R.colar === "sementes" ? "#e2363d" : R.colar === "osso" || ((x - CX + 18) / 3) % 2 < 1 ? "#f4ecd8" : "#e2363d";
      box(x - 1, y, 2, 2, c); px(x, y + 2, "#5a2a1c"); px(x - 1, y, "#ffffff");
    }
    if (R.colar !== "sementes") { box(CX - 1, 110, 3, 2, "#f4ecd8"); box(CX - 1, 112, 2, 2, "#f4ecd8"); px(CX, 114, "#f4ecd8"); px(CX + 1, 111, "#c8bca0"); px(CX + 1, 113, "#5a2a1c"); px(CX - 2, 111, "#5a2a1c"); }
    if (look && look.charm) { box(CX - 2, 115, 4, 4, "#3a2414"); box(CX - 1, 116, 2, 2, look.charm); }   // talismã em uso
  }

  // ---- cabeça ----
  g = cHead.getContext("2d");
  if (cab === "trancas") for (const s of [-1, 1]) for (let y = 62; y < 122; y++) {   // tranças por cima dos ombros
    const cx2 = CX + s * 31 + Math.round(Math.sin(y / 14)), w = y < 112 ? 4 : 4 - (y - 112) * .35, seg = Math.floor((y - 62) / 5);
    for (let x = Math.ceil(cx2 - w); x <= cx2 + w; x++) {
      const e = Math.abs(x - cx2) / w, lit = (x - cx2) * (seg % 2 ? 1 : -1) < 0;
      let c = Hh[(y - 62) % 5 === 4 ? 4 : e > .8 ? 3 : lit ? 1 : 2];
      if (y >= 106 && y <= 108) c = RT_GREEN[y === 106 ? 0 : y === 107 ? 1 : 2];   // fita verde
      px(x, y, c);
    }
  }
  // rosto: cada pixel escolhe o tom pela luz
  for (let y = 25; y <= 88; y++) {
    const w = rtFaceW(y, R.jaw), c0 = CX + low(y);
    for (let x = Math.ceil(c0 - w); x <= c0 + w; x++) {
      const nx = (x - c0) / Math.max(1, w), ny = (y - 56) / 32;
      let L = .58 - .34 * nx - .1 * ny - yaw * .05;
      if (y < rtFringeY(cab, x) + 4) L -= .26;                                              // sombra da franja na testa
      L += .13 * Math.exp(-((x - (FX - 14)) ** 2 + (y - 67) ** 2) / 70);                    // maçã do rosto na luz
      L += .07 * Math.exp(-((x - (c0 - 4)) ** 2 + (y - 85) ** 2) / 14);                     // queixo
      if (y >= 81 && y <= 82 && Math.abs(x - FX - yaw) < 5) L -= .16;                       // embaixo do lábio
      if (x >= FX + yaw * 2 + 1 && x <= FX + yaw * 2 + 4 && y >= 62 && y <= 70) L -= .12;   // lado do nariz
      let tn = L > .86 ? 0 : L > .63 ? 1 : L > .34 ? 2 : L > .17 ? 3 : 4;
      if (Math.abs(nx) > .93 || (y > 84 && Math.abs(x - c0) >= w - 1)) tn = Math.max(tn, 3);   // a borda do rosto fecha no tom escuro
      px(x, y, S[tn]);
    }
  }
  // nariz (anda mais que o resto quando o rosto vira) e bochechas coradas (pontilhado)
  const NX = FX + yaw * 2, lado = s => s * yaw > 0;   // lado(s): este lado do rosto é o de lá (encolhe)
  px(NX - 1, 66, S[0]); px(NX - 1, 67, S[0]); px(NX + 2, 69, S[3]); px(NX + 2, 70, S[4]); px(NX + 1, 71, S[4]); px(NX, 71, S[3]); px(NX - 2, 71, S[3]);
  if (!R.velho) for (const s of [-1, 1]) { const cxx = FX + s * (lado(s) ? 13 : 15); for (let y = 68; y <= 71; y++) for (let x = -4; x <= 4; x++) if ((x + y) % 2 === 0 && Math.abs(x) + Math.abs(y - 69.5) * 1.6 < 5) px(cxx + x, y, pMix(S[1], "#f06a5a", .45)); }
  // pintura do rosto
  if (R.pintura === "pontos") for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const bx = FX + s * ((lado(s) ? 9 : 11) + i * (lado(s) ? 3 : 4)); box(bx - 1, 73 - (i % 2), 2, 2, "#e2363d"); px(bx - 1, 73 - (i % 2), "#ff7a7a"); }
  if (R.pintura === "riscas") for (const s of [-1, 1]) { const c1 = FX + s * (lado(s) ? 12 : 14), k = lado(s) ? 1 : 0; box(c1 - 4 + k, 73, 8 - k * 2, 1, "#e2363d"); box(c1 - 3 + k, 74, 7 - k * 2, 1, "#a8202a"); box(c1 - s - 3 + k, 76, 6 - k * 2, 1, "#e2363d"); box(c1 - s - 2 + k, 77, 5 - k * 2, 1, "#a8202a"); }
  if (R.pintura === "paje") for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const bx = FX + s * (17 - i), yy = 70 + Math.round(i * .6); px(bx, yy, "#e2363d"); px(bx, yy + 1, "#a8202a"); }
  if (R.velho) {   // rugas: testa, canto da boca
    for (let x = FX - 9; x <= FX + 9; x++) if (x % 3) { px(x, 47, S[3]); if (Math.abs(x - FX) < 6) px(x, 50, S[3]); }
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) px(NX + s * (6 + Math.round(i * .5)), 72 + i, S[3]);
  }
  // olhos
  const ey = 59, h = F.open >= 1.2 ? 10 : F.open >= .95 ? 8 : 6, lash = "#170f18";
  for (const s of [-1, 1]) {
    const far = lado(s), HW = far ? 5 : 6, ex = FX + s * (far ? 11 : 13);
    const arc = dx => Math.sqrt(Math.max(0, 1 - (dx / (HW + .6)) ** 2));
    if (blink || F.open === 0) {
      for (let dx = -HW; dx <= HW; dx++) {   // fechado: piscando, a curva desce; sorrindo, sobe
        const y = F.open === 0 && !blink ? ey + 1 - Math.round(arc(dx) * 3) : ey + Math.round(arc(dx) * 2);
        px(ex + dx, y, lash); px(ex + dx, y + 1, Math.abs(dx) < HW - 1 ? lash : S[3]);
      }
      px(ex + s * (HW + 1), ey + (F.open === 0 && !blink ? 1 : 0), lash); if (R.lashes) { px(ex + s * (HW + 2), ey - 1, lash); px(ex + s * (HW + 1), ey + 2, lash); }
    } else {
      const ix = ex + (F.eye || 0), iy = ey, ir = far ? 3.8 : 4.3;
      for (let dx = -HW; dx <= HW; dx++) {
        let top = Math.round(ey - h / 2 * arc(dx)), bot = Math.round(ey + h / 2 * .82 * arc(dx));
        const side = dx * s;
        if (F.lid === "bravo") top += Math.max(0, Math.round((2 - side) * .45));     // pálpebra desce no canto de dentro
        if (F.lid === "triste") top += Math.max(0, Math.round((side + 2) * .4));     // e no de fora quando triste
        if (R.velho) top += 1;                                                         // pálpebra pesada
        for (let y = top; y <= bot; y++) {
          const d = Math.hypot(ex + dx - ix, y - iy);
          let c = y === top ? "#cdc2b4" : "#fbf6ea";                                 // branco do olho, com a sombra da pálpebra
          if (d <= ir) c = d > ir - .8 ? R.iris[0] : d <= 1.7 ? "#120a0a" : y < iy ? R.iris[1] : y < iy + 2 ? R.iris[2] : R.iris[3];   // íris em degradê, clara embaixo
          px(ex + dx, y, c);
        }
        px(ex + dx, top - 1, lash); px(ex + dx, top - 2, Math.abs(dx) < HW ? lash : S[3]);   // pálpebra de cima, grossa
        if (Math.abs(dx) <= HW - 2) px(ex + dx, bot + 1, S[3]);                       // pálpebra de baixo
      }
      box(ix - 3, iy - 3, 2, 2, "#ffffff"); px(ix + 2, iy + 2, "#ffe8c8");            // dois brilhos
      px(ex + s * (HW + 1), ey - 1, lash); px(ex + s * (HW + 2), ey - 2, lash);       // canto de fora puxado
      if (R.lashes) { px(ex + s * (HW + 2), ey - 4, lash); px(ex + s * (HW + 3), ey - 3, lash); px(ex + s * (HW + 1), ey - 5, lash); px(ex + s * (HW - 1), ey + h / 2 * .82 + 2, lash); }
    }
    if (R.velho) { px(ex + s * (HW + 3), ey + 1, S[4]); px(ex + s * (HW + 4), ey + 2, S[4]); px(ex + s * (HW + 3), ey + 4, S[3]); px(ex + s * (HW + 4), ey + 5, S[3]); }   // pé de galinha
    // sobrancelha: mais grossa perto do nariz (a do Pajé, grossa inteira)
    const by = ey - h / 2 - 6 + (F.raise && s > 0 ? -2 : 0), x0 = ex + s * (HW + 2), x1 = ex - s * (HW - 1), n = HW * 2 + 1;
    for (let i = 0; i <= n; i++) { const k = i / n, bx = Math.round(x0 + (x1 - x0) * k), yy = Math.round(by + F.bo + (F.bi - F.bo) * k - Math.sin(k * Math.PI) * 1.2); px(bx, yy, R.brow); px(bx, yy + 1, R.brow); if (k > .55 || R.velho) px(bx, yy - 1, R.brow); if (R.velho) px(bx, yy + 2, S[3]); }
    if (oculos) {   // armação
      const K = "#1a1a22", x0g = ex - HW - 3, wg = HW * 2 + 7;
      box(x0g, ey - 8, wg, 2, K); box(x0g, ey + 6, wg, 1, K); box(x0g, ey - 8, 1, 15, K); box(x0g + wg - 1, ey - 8, 1, 15, K);
      px(x0g + 2, ey - 5, "#ffffff"); px(x0g + 3, ey - 4, "#ffffff");
    }
  }
  if (oculos) box(FX - 4, ey - 4, 9, 1, "#1a1a22");
  // boca
  const MX = FX + yaw, my = 78, lip = "#6a2420", dentro = "#4a1016", lingua = "#dc6a6a";
  if (talk) {
    const rx = (F.mouth === "riso" ? 6 : F.mouth === "o" ? 3 : 5) - (talk === 1 ? 1 : 0), ry = talk === 1 ? 2 : F.mouth === "o" ? 4 : 3.5;
    for (let y = -5; y <= 5; y++) for (let x = -8; x <= 8; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) px(MX + x, my + 1 + y, y <= -ry + 1.2 && ry > 2.5 ? "#ffffff" : y >= ry - 1.6 ? lingua : dentro);
      else if (d <= 1.9) px(MX + x, my + 1 + y, lip);
    }
    box(MX - 3, my + ry + 3, 7, 1, S[3]);
  } else if (F.mouth === "riso") {
    box(MX - 7, my - 2, 15, 1, lip); px(MX - 8, my - 3, lip); px(MX + 8, my - 3, lip);
    box(MX - 6, my - 1, 13, 1, "#ffffff"); box(MX - 5, my, 11, 2, dentro); box(MX - 3, my + 1, 7, 1, lingua);
    box(MX - 4, my + 2, 9, 1, lip); px(MX - 6, my, lip); px(MX + 6, my, lip); px(MX - 5, my + 1, lip); px(MX + 5, my + 1, lip);
    box(MX - 3, my + 4, 7, 1, S[3]);
  } else if (F.mouth === "o") {
    for (let y = -4; y <= 4; y++) for (let x = -3; x <= 3; x++) { const d = (x / 2.2) ** 2 + (y / 3.2) ** 2; if (d <= 1) px(MX + x, my + 1 + y, dentro); else if (d <= 2.2) px(MX + x, my + 1 + y, lip); }
  } else {
    for (let x = -6; x <= 6; x++) {
      const k = (x / 6) ** 2;
      const y = F.mouth === "bravo" ? my + Math.round(k * 2) : F.mouth === "triste" ? my + 1 + Math.round(k * 1.5) : F.mouth === "hum" ? my + 1 - (x > 2 ? Math.round((x - 2) * .5) : 0) : my - Math.round(k * 1.4) + 1;
      if (F.mouth === "hum" && x < -4) continue;
      px(MX + x, y, lip);
    }
    if (F.mouth === "bravo") box(MX - 3, my + 1, 7, 1, "#ffffff");   // dentes cerrados
    box(MX - 2, my + 3, 5, 1, S[1]); box(MX - 3, my + 4, 7, 1, S[3]);   // lábio de baixo: luz e sombra
  }
  // franja e mechas da frente
  for (let x = 24; x <= 88; x++) {
    const w = rtFaceW(50, R.jaw) + 2; if (Math.abs(x - CX) > w) continue;
    const fy = rtFringeY(cab, x), y0 = R.band ? rtBandTop(x) + 4 : Math.ceil(48 - 32 * Math.sqrt(Math.max(0, 1 - ((x - CX) / 32) ** 2)));   // sem faixa: a franja começa no alto da cabeça
    for (let y = y0; y <= fy; y++) {
      let tn = rtHairTone(cab, x, y); if (R.band && y <= rtBandTop(x) + 6) tn = Math.max(tn, 3);   // sombra da faixa na franja
      if (y === fy) tn = Math.max(tn, 3);
      px(x, y, Hh[Math.min(4, tn)]);
    }
  }
  const fimMecha = cab === "trancas" ? 70 : cab === "paje" ? 96 : cab === "chanel" ? 90 : 84;
  for (const s of [-1, 1]) for (let y = 36; y <= fimMecha; y++) {   // mechas dos lados, afinando na ponta
    const w = y > fimMecha - 12 ? (fimMecha - y) / 12 * 6 : 6, inner = CX + s * (rtFaceW(Math.min(y, 70), R.jaw) - 3) + (lado(s) ? -s : 0);
    for (let i = 0; i <= w; i++) { const x = Math.round(inner + s * i); let tn = rtHairTone(cab, x, y); if (i === 0) tn = Math.max(tn, 3); px(x, y, Hh[tn]); }
  }
  // faixa da cabeça
  if (R.band) {
    for (let x = 24; x <= 88; x++) {
      const t0 = rtBandTop(x);
      if (Math.abs(x - CX) > 32 * Math.sqrt(Math.max(0, 1 - ((t0 + 3 - 48) / 32) ** 2)) + 1) continue;
      for (let i = 0; i < 6; i++) { let tn = i === 0 ? 0 : i < 4 ? 1 : 2; if (x > CX + 18) tn = Math.min(3, tn + 1); if (i === 5) tn = 3; px(x, t0 + i, R.band[tn]); }
    }
    if (cab === "paje") { box(CX - 1, rtBandTop(CX) + 1, 3, 3, "#ffd23a"); px(CX - 1, rtBandTop(CX) + 1, "#fff0a0"); px(CX + 1, rtBandTop(CX) + 3, "#c89a10"); }   // a pedra amarela
    else { px(CX - 6, rtBandTop(CX) + 2, R.band[0]); px(CX - 5, rtBandTop(CX) + 2, R.band[0]); }
  }

  // ---- montagem na pose ----
  g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
  const headRow = src => { for (let y = 0; y < RH; y++) g.drawImage(src, 0, y, RW, 1, P.hx + Math.round((90 - y) * P.tilt), y + P.hy, RW, 1); };   // cabeça inclinada: cada linha um pouco para o lado
  headRow(cBack);
  for (let x = 0; x < RW; x++) g.drawImage(cBust, x, 0, 1, RH + 8, x, P.by + Math.round((x - CX) * P.sh), 1, RH + 8);   // um ombro mais alto que o outro
  if (P.arma && R.lanca) {   // a lança empunhada do lado, com a mão fechada no cabo
    const pal = (look && look.pal) || {}, madeira = [pal.p ? pMix(pal.p, "#ffffff", .25) : "#e8c070", pal.p || "#c89a4a", pal.P || "#8a6428"], cabo = y => Math.round(101 - (y - 18) * .06);
    const haste = (a, b) => { for (let y = a; y <= b; y++) { const x = cabo(y); box(x, y, 1, 1, madeira[0]); box(x + 1, y, 2, 1, madeira[1]); box(x + 3, y, 1, 1, madeira[2]); } };
    haste(18, RH - 1);
    for (let i = 0; i < 14; i++) { const w = Math.round(i < 10 ? 1 + i * .35 : 4 - (i - 10)), x = 103 - Math.round((i - 14) * .06); box(x - w, 4 + i, w * 2, 1, i % 4 === 3 ? "#8a8a98" : pal.m || "#d8d8e4"); px(x - w, 4 + i, "#ffffff"); }   // ponta
    box(99, 18, 6, 3, "#e2363d"); box(99, 21, 6, 1, "#a8202a");                                    // amarração
    // a mão: quatro dedos dobrados por cima do cabo, o polegar atravessado, as costas da mão e o antebraço descendo para fora;
    // numa lista de pixels com tom, para ganhar um contorno escuro por dentro do desenho
    const sx = cabo(100) + 1, M = new Map(), set = (x, y, tn) => M.set(Math.round(x) + "," + Math.round(y), [Math.round(x), Math.round(y), tn]);
    for (let i = 0; i <= 26; i++) for (let w = -4; w <= 4; w++) set(sx + 8 + i * .42 + w, 105 + i, w < -2 ? 1 : w > 2 ? 3 : 2);          // antebraço
    for (let y = 92; y <= 109; y++) for (let x = sx + 2; x <= sx + 11; x++) if ((x - sx - 6) ** 2 / 26 + (y - 100.5) ** 2 / 76 <= 1) set(x, y, x > sx + 9 ? 3 : y < 95 ? 1 : 2);   // costas da mão
    for (let f = 0; f < 4; f++) {                                                                                                     // os dedos
      const y0 = 92 + f * 4, x0 = sx - 5 + (f === 0 || f === 3 ? 1 : 0);
      for (let x = x0; x <= sx + 5; x++) { set(x, y0, x === x0 ? 2 : 1); set(x, y0 + 1, 2); set(x, y0 + 2, x < sx - 2 ? 3 : 2); set(x, y0 + 3, 4); }
      set(x0, y0 + 1, 0); set(x0 + 1, y0 + 1, 1); set(sx + 3, y0, 0); set(sx + 4, y0, 0); set(sx + 5, y0 + 1, 1);   // ponta do dedo e o nó, na luz
    }
    for (let i = 0; i <= 9; i++) { const tx = sx + 8 - i, ty = 92 - Math.round(i * .35); set(tx, ty - 2, i > 7 ? 0 : 1); set(tx, ty - 1, 2); set(tx, ty, i < 8 ? 3 : 2); }   // polegar
    set(sx - 2, 87, 0); set(sx - 1, 87, 0);                                           // unha do polegar
    for (const [x, y] of M.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has((x + dx) + "," + (y + dy))) px(x + dx, y + dy, "#4a2414");
    for (const [x, y, tn] of M.values()) px(x, y, S[tn]);
    haste(83, 91);   // o polegar passa por trás do cabo: o cabo volta por cima dele, só acima dos dedos
  }
  headRow(cHead);
  // contorno de fora: todo pixel vazio encostado no desenho
  const a = g.getImageData(0, 0, RW, RH).data, on = (x, y) => x >= 0 && y >= 0 && x < RW && y < RH && a[(y * RW + x) * 4 + 3] > 0, edge = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) edge.push([x, y]);
  edge.forEach(([x, y]) => px(x, y, RT_LINE));
  return cv;
}
const RT_CACHE = new Map();
// talk: 0 fechada, 1 meio aberta, 2 aberta; look: {shirt, glasses, charm, pal} de quem viaja
function retratoNovo(who, expr, talk, blink, look) {
  const L = look ? {shirt: look.shirt, glasses: look.glasses, charm: look.charm, pal: look.pal && {p: look.pal.p, P: look.pal.P, m: look.pal.m}} : null;
  const key = [who, expr, talk, blink, JSON.stringify(L)].join("|");
  if (RT_CACHE.has(key)) return RT_CACHE.get(key);
  if (RT_CACHE.size > 300) RT_CACHE.clear();
  const c = retratoPixel(who, expr, talk, blink, L);
  RT_CACHE.set(key, c);
  return c;
}

/* ---------- Pytuna: a fumaça com olhos de brasa, pintada no tamanho do retrato (112x128) ----------
   Rolos de fumaça em volta de um miolo escuro (cada pixel pega o rolo mais "alto" e o tom pela luz, fosco como a gente),
   ombros de fumaça embaixo, fiapos subindo, olhos em camadas de brasa e fagulhas. frame = 0..RT_PYT_N-1 (um ciclo). */
const RT_PYT_N = 40, RT_PYT_CACHE = new Map();
function retratoPytuna(expr, frame, talk, blink) {
  frame = ((frame % RT_PYT_N) + RT_PYT_N) % RT_PYT_N;
  const key = expr + "|" + frame + "|" + talk + "|" + blink;
  if (RT_PYT_CACHE.has(key)) return RT_PYT_CACHE.get(key);
  if (RT_PYT_CACHE.size > 320) RT_PYT_CACHE.clear();
  const F = RT_EXPR[expr] || RT_EXPR.normal, W = RT_W, H = RT_H, p = frame / RT_PYT_N * Math.PI * 2, cx = RT_CX, cy = 56;
  const FUM = ["#6c6684", "#474058", "#2b2539", "#17121f"], OCO = ["#262032", "#1b1625", "#120e1a", "#0b0810"], FIO = "#0d0812";
  const rolos = [[cx, cy, 30, 30], [cx, 92, 17, 17]];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + Math.sin(p + i) * .12, d = 27 + (i % 3) * 4, r = 13 + (i % 4) * 2.5 + Math.sin(p * 2 + i * 1.7) * 1.5; rolos.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * .92, r, r]); }
  for (let i = 0; i < 7; i++) rolos.push([8 + i * 16, 112 + (i % 2) * 5 + Math.sin(p + i * 1.3) * 1.5 + Math.abs(i - 3) * 3, 19 + (i % 3) * 2, 19 + (i % 3) * 2]);   // ombros
  for (let j = 0; j < 3; j++) { const u = (frame / RT_PYT_N + j / 3) % 1; rolos.push([cx + (j - 1) * 24 + Math.sin(u * Math.PI * 2 + j) * 5, 30 - u * 30, 11 * (1 - u) + 2, 11 * (1 - u) + 2]); }   // fiapos subindo
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d"), buf = new Array(W * H).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let best = 0, nx = 0, ny = 0;
    for (const [bx, by, rx, ry] of rolos) { const u = (x + .5 - bx) / rx, v = (y + .5 - by) / ry, h = 1 - Math.sqrt(u * u + v * v); if (h > best) { best = h; nx = u; ny = v; } }
    if (best <= 0) continue;
    const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), Lz = -nx * .5 - ny * .42 + z * .6;
    let tn = Lz > .98 ? 0 : Lz > .34 ? 1 : Lz > .02 ? 2 : 3; if (best < .1 && nx * .6 + ny * .5 > .1) tn = 3;
    const dm = Math.hypot((x + .5 - cx) / 25, (y + .5 - (cy + 4)) / 24), oco = dm < .86 || (dm < 1 && (x + y) % 2 === 0);   // o miolo escuro do rosto, com a beira pontilhada
    buf[y * W + x] = oco ? OCO[Math.min(3, tn + (dm < .5 ? 1 : 0))] : FUM[tn];
  }
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c; };
  // olhos de brasa: a forma muda com a expressão; dxo = para fora do rosto
  const M = F.mouth, olho = (dxo, dy, gr) => {
    const ax = Math.abs(dxo);
    if (blink) return ax <= 7 + gr && dy >= -gr && dy <= 1 + gr;
    if (M === "riso") { const arco = -3 + (dxo / 7) ** 2 * 4; return ax <= 7 + gr && dy >= arco - gr && dy <= arco + 2 + gr; }
    if (M === "o") return (dxo / (5 + gr)) ** 2 + (dy / (7 + gr)) ** 2 <= 1;
    if (M === "calmo") return (dxo / (7.5 + gr)) ** 2 + (dy / (3.6 + gr)) ** 2 <= 1;
    if (M === "triste") return ax <= 7 + gr && Math.abs(dy - dxo * .38) <= 1.2 + (7 + dxo) / 14 * 2 + gr;
    return ax <= 7.5 + gr && Math.abs(dy + dxo * .42) <= 1.1 + (7 - dxo) / 14 * 2.8 + gr;   // bravo: rasgados para dentro
  };
  for (const [gr, cor, pont] of [[3.2, "#3a0608", true], [1.6, "#8a100c", false], [0, "#f2421e", false], [-1.3, "#ffb648", false]])
    for (const s of [-1, 1]) for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) if (olho(dx * s, dy, gr) && (!pont || (dx + dy) % 2 === 0)) put(cx + s * 14 + dx, cy + dy, cor);
  if (!blink && M !== "riso") for (const s of [-1, 1]) { put(cx + s * 14 - 1, cy - 1, "#fff2c8"); put(cx + s * 14, cy - 1, "#fff2c8"); }
  if (talk || M === "riso") {   // boca: rachadura em brasa
    const alt = talk === 2 ? 4 : talk ? 2 : 1;
    for (let i = -11; i <= 11; i++) {
      const y = 79 + (i & 1) + (Math.abs(i) % 5 === 3 ? 1 : 0) - (M === "riso" ? Math.round((i / 11) ** 2 * 4) : 0);
      put(cx + i, y - 1, "#5a0a0c"); for (let k = 0; k < alt; k++) put(cx + i, y + k, k === 0 ? "#ff8a3a" : "#d8341a"); put(cx + i, y + alt, "#5a0a0c");
    }
  }
  for (let i = 0; i < 6; i++) {   // fagulhas subindo
    const u = (frame / RT_PYT_N + i / 6) % 1, x = cx + Math.sin(i * 2.4) * 42 + Math.sin(u * Math.PI * 2 + i) * 3, y = 112 - u * 96;
    put(x, y, u < .6 ? "#ff8a3a" : "#a8301a"); if (u < .3) put(x, y + 1, "#a8301a");
  }
  const tem = (x, y) => x >= 0 && y >= 0 && x < W && y < H && buf[y * W + x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = buf[y * W + x] || ((tem(x - 1, y) || tem(x + 1, y) || tem(x, y - 1) || tem(x, y + 1)) && FIO);
    if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
  }
  RT_PYT_CACHE.set(key, cv);
  return cv;
}
