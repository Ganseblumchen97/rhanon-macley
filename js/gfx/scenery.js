/* Cenário da batalha em pixel art, desenhado em código com as cores das fases (TILE_PAL em tiles.js).
   Um canvas só (#sceneBg) cobre a janela inteira: o palco da batalha é uma janela para o mesmo lugar e, fora dele,
   o cenário continua escurecido (no lugar do fundo da tela inicial). As alturas seguem o palco: o chão começa onde
   começava a faixa de chão antiga e a água fica na mesma faixa de antes. Os montinhos onde o Rhanon e o bicho pisam
   são imagens feitas aqui (sceneryPlat) e entram no ::before/::after do palco pelas variáveis --platL e --platW. */

// cada zona: céu (de cima para baixo), mata de fundo, chão, água, o que tem atrás (árvores, prédios...) e o chão de pisar
const SCENES = {
  mata:        {sky: ["#7cc48a", "#5fae6a", "#4a9858"], far: "#2f7a42", trees: "copa", plat: "grama"},
  fechada:     {sky: ["#1d4a2c", "#24583a", "#2c6640"], far: "#163f26", trees: "fechada", plat: "musgo", vines: true},
  rio:         {sky: ["#9ad4e8", "#7cc4a8", "#5aae78"], far: "#3a8a45", trees: "copa", plat: "areia", water: true},
  igarape:     {sky: ["#5a9a62", "#4a8a52", "#3c7a46"], far: "#24603a", trees: "copa", plat: "barro", water: true, vines: true},
  manguezal:   {sky: ["#9ab89a", "#7a9a7a", "#5a7a5a"], far: "#2f5030", trees: "mangue", plat: "lama", water: true},   // igapó: raízes em arco dentro da água
  mangueilha:  {sky: ["#d8e4c0", "#b4ccac", "#86a88a"], far: "#3a5a32", trees: "mangue", plat: "lama", water: true},   // São Luís: o mangue com o sol do Nordeste
  encontro:    {sky: ["#f0c870", "#e8d898", "#a8d4e0"], far: "#5a8a3a", trees: "copa", plat: "areia", water: true},   // Teresina: céu quente sobre o rio
  lencois:     {sky: ["#5ab8f0", "#8ad0f8", "#e0f2fa"], far: "#f2ead2", trees: "campo", plat: "areia", water: true},   // dunas e lagoas
  seringal:    {sky: ["#8ab86a", "#6a9a4e", "#557f3e"], far: "#2f6a2a", trees: "seringa", plat: "folhas"},
  varzea:      {sky: ["#a8dcf0", "#8acce4", "#c8e8d8"], far: "#3f7f36", trees: "campo", plat: "flores", water: true},
  parquebsb:   {sky: ["#f0d8a0", "#e8c890", "#b8c8d8"], far: "#7a8a3a", trees: "campo", plat: "grama", water: true},   // Parque Nacional de Brasília: céu de seca e o campo do cerrado
  gruta:       {sky: ["#14141e", "#1c1c2c", "#24243a"], far: "#3a3848", trees: "campo", plat: "pedra", water: true},   // Gruta do Lago Azul: teto de pedra escuro e o lago azul
  rioprata:    {sky: ["#a8e0f0", "#88d0d8", "#6ac0a8"], far: "#2f7a42", trees: "copa", plat: "areia", water: true},   // Rio da Prata: mata verde e água cristalina
  chapada:     {sky: ["#f0a868", "#e8b888", "#c8a8a0"], far: "#b8583a", trees: "copa", plat: "barro"},   // Chapada: paredão de arenito vermelho no fim da tarde
  pantanal:    {sky: ["#f0b878", "#e8c898", "#a8d0d8"], far: "#4a7a3a", trees: "campo", plat: "flores", water: true},   // Pantanal: céu enorme de fim de tarde e campo alagado
  beira:       {sky: ["#f0d090", "#e8d8a8", "#a8d0d8"], far: "#6a8a4a", trees: "caatinga", plat: "areia", water: true},   // Velho Chico: sertão na margem do rio largo
  serra:       {sky: ["#f0c890", "#d8b888", "#b8a890"], far: "#8a5a3a", trees: "copa", plat: "barro"},   // Araripe: paredão de terra vermelha e mata na encosta
  caatinga:    {sky: ["#f0d8a0", "#e8c890", "#d8b8a0"], far: "#8a7a62", trees: "caatinga", plat: "areia"},   // sertão: céu de poeira, serra ao longe
  olinda:      {sky: ["#f8c890", "#f0a878", "#c88aa8"], far: "#8a6a9a", trees: "casario", plat: "pedra"},   // Olinda: pôr do sol no alto da Sé
  cidadevelha: {sky: ["#f0b080", "#e8a070", "#b88a9a"], far: "#7a6a8a", trees: "casario", plat: "pedra"},
  porto:       {sky: ["#b8c4cc", "#a0b0ba", "#8a9aa6"], far: "#6a7a86", trees: "galpao", plat: "tabua", water: true},
  baixadas:    {sky: ["#d8a898", "#c89a8a", "#a8949a"], far: "#5a6a5a", trees: "palafita", plat: "tabua", water: true},
  codigo:      {sky: ["#060a18", "#0a1228", "#0e1a36"], far: "#13304a", trees: "codigo", plat: "pixel"}   // dentro do notebook (freela)
};
const sceneOf = z => SCENES[z] || SCENES.mata;
const scenePal = z => TILE_PAL[z] || TILE_PAL.mata;
// sorteio fixo por zona: o mesmo lugar sempre tem as árvores no mesmo canto
function sceneRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sceneSeed = z => [...z].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);

/* ---------- desenho do cenário ---------- */
let sceneLast = "";
function drawScenery(force) {
  const cv = $("sceneBg"), stage = $("stage");
  if (!cv || !stage || $("game").classList.contains("working-mode")) return;
  const r = stage.getBoundingClientRect();
  if (r.height < 40) return;
  const k = Math.max(3, Math.round(r.height / 130)), W = Math.ceil(innerWidth / k), H = Math.ceil(innerHeight / k);
  const zone = [...stage.classList].find(c => c.startsWith("zone-"))?.slice(5) || "mata", night = !!G.night;
  const key = [zone, night, k, W, H, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join();
  if (!force && key === sceneLast) return;
  sceneLast = key;
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d"), S = sceneOf(zone), P = scenePal(zone), rnd = sceneRng(sceneSeed(zone));
  const st = {x: r.left / k, y: r.top / k, w: r.width / k, h: r.height / k};
  const G0 = Math.round(st.y + st.h * (S.water ? .40 : .50));     // onde começa o chão
  const wTop = Math.round(st.y + st.h * .27);                       // faixa de água (zonas com rio)
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };

  // céu (ou o verde de dentro da mata) em faixas com pontilhado entre elas
  const top = S.water ? wTop : G0, n = S.sky.length;
  for (let i = 0; i < n; i++) {
    const a = Math.round(top * i / n), b = Math.round(top * (i + 1) / n);
    rect(S.sky[i], 0, a, W, b - a);
    if (i) for (let px = 0; px < W; px += 2) rect(S.sky[i], px + (a % 2), a - 1, 1, 1);
  }
  if (S.trees === "fechada" || S.vines) for (let i = 0; i < W / 9; i++) {   // fresta de luz no meio das folhas
    const lx = rnd() * W, lw = 2 + rnd() * 5; x.fillStyle = "rgba(220,255,200,.07)";
    x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx + lw, 0); x.lineTo(lx + lw + top * .35, top); x.lineTo(lx + top * .35, top); x.fill();
  }
  if (S.trees === "codigo") { sceneCode(x, rnd, W, H, G0, top); drawSceneryShade(x, st, W, H, night); return; }
  // mata (ou cidade) de fundo: silhueta irregular perto do horizonte
  sceneSkyline(x, S, P, rnd, W, top, st);
  // água
  if (S.water) {
    rect(P.water, 0, wTop, W, G0 - wTop);
    rect(P.water2, 0, wTop, W, 1);
    for (let i = 0; i < W * (G0 - wTop) / 70; i++) rect(P.water2, rnd() * W, wTop + 2 + rnd() * (G0 - wTop - 3), 2 + rnd() * 5, 1);   // reflexos
    rect("rgba(0,0,0,.18)", 0, G0 - 2, W, 2);
    if (zone === "rio" || zone === "varzea" || zone === "igarape") for (let i = 0; i < W / 40; i++) sceneLily(x, rnd() * W, wTop + 3 + rnd() * (G0 - wTop - 6), P);
  }
  // chão
  const g1 = S.plat === "pedra" ? P.g1 : S.plat === "tabua" && zone === "porto" ? P.path : P.g2;
  rect(g1, 0, G0, W, H - G0);
  for (let y = G0 + 2; y < H; y += 4) for (let px = (y * 7) % 11; px < W; px += 13 + ((y * 13) % 9)) rect(P.g1, px, y, 3, 1);   // textura
  rect("rgba(0,0,0,.14)", 0, G0, W, 2); rect("rgba(0,0,0,.07)", 0, G0 + 2, W, 3);   // sombra da mata no começo do chão
  if (["pedra", "tabua"].includes(S.plat) && zone !== "baixadas") sceneStreet(x, zone, P, W, H, G0);
  else for (let i = 0; i < W * (H - G0) / 300; i++) {   // tufos, florzinhas e pedrinhas
    const tx = rnd() * W, ty = G0 + 2 + rnd() * (H - G0), c = rnd();
    if (c < .7) { rect(P.tall, tx, ty - 2, 1, 2); rect(P.tall, tx + 2, ty - 3, 1, 3); rect(P.tallHi, tx + 1, ty - 4, 1, 4); }
    else if (c < .82 && !zone.startsWith("mangue")) { rect(["#ffd23a", "#ff8aa8", "#ffffff"][Math.floor(rnd() * 3)], tx, ty - 1, 1, 1); rect(P.leaf2, tx, ty, 1, 1); }
    else { rect(P.rock2, tx, ty, 3, 1); rect(P.rock, tx, ty - 1, 3, 1); }
  }
  // na beira da água: juncos
  if (S.water && zone !== "porto") for (let i = 0; i < W / 3; i++) { const rx = rnd() * W, h = 3 + rnd() * 6; rect(P.tall, rx, G0 - h, 1, h + 1); if (rnd() < .3) rect("#8a5a32", rx, G0 - h - 2, 1, 2); }
  if (S.trees === "palafita") scenePalafitas(x, P, rnd, W, wTop, G0);
  if (S.vines) for (let i = 0; i < W / 6; i++) {   // cipós descendo do alto
    const vx = Math.round(rnd() * W), vl = 6 + rnd() * top * .55;
    for (let y = 0; y < vl; y++) rect(y % 5 === 4 ? P.leafHi : P.leaf2, vx + Math.round(Math.sin(y / 6) * 1.2), y, 1, 1);
    rect(P.leaf, vx - 1, vl, 3, 2);
  }
  drawSceneryShade(x, st, W, H, night);
}
// fora do palco: mais escuro (o olho fica na luta) e, à noite, azul; o palco tem o próprio véu da noite
function drawSceneryShade(x, st, W, H, night) {
  x.fillStyle = night ? "rgba(6,10,40,.74)" : "rgba(4,14,8,.55)";
  x.fillRect(0, 0, W, Math.max(0, st.y)); x.fillRect(0, st.y + st.h, W, H);
  x.fillRect(0, st.y, Math.max(0, st.x), st.h); x.fillRect(st.x + st.w, st.y, W, st.h);
}
// dentro do notebook: linhas de código coloridas no alto e um chão de grade azul que some no horizonte
function sceneCode(x, rnd, W, H, G0, top) {
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const cols = ["#3fd87a", "#5ac8ff", "#ff7ab8", "#ffd23a", "#c8d0e0"];
  for (let y = 4; y < top - 4; y += 5) {
    let cx = 6 + Math.floor(rnd() * 4) * 6;   // recuo como num código de verdade
    while (cx < W - 10 && rnd() < .9) { const w = 3 + rnd() * 14; rect(cols[Math.floor(rnd() * cols.length)] + "88", cx, y, w, 2); cx += w + 3; if (rnd() < .15) break; }
  }
  rect("#0a1a30", 0, G0, W, H - G0);
  for (let y = G0, k = 1; y < H; y += k, k += 1) rect("#1e4a7a", 0, y, W, 1);   // linhas do chão mais espaçadas perto
  for (let i = -20; i < 20; i++) { x.strokeStyle = "#1e4a7a"; x.beginPath(); x.moveTo(W / 2 + i * 6, G0); x.lineTo(W / 2 + i * 60, H); x.stroke(); }
}
// mata de fundo (copas arredondadas em duas fileiras), seringueiras, mangue, campo aberto ou prédios
function sceneSkyline(x, S, P, rnd, W, top, st) {
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const blob = (cx, cy, rr, c) => { x.fillStyle = c; x.beginPath(); x.arc(Math.round(cx), Math.round(cy), rr, 0, Math.PI * 2); x.fill(); };
  if (["casario", "galpao", "palafita"].includes(S.trees)) {
    // prédios da cidade: casarões coloridos com janelas, galpões de zinco com guindaste
    const walls = P.walls || ["#3a7ab8", "#e8c040", "#e89aaa", "#5aa06a", "#c8603a"];
    let bx = -rnd() * 10;
    while (bx < W) {
      const skyH = top - st.y, bw = S.trees === "galpao" ? 30 + rnd() * 20 : 14 + rnd() * 12, bh = skyH * ({casario: .42, galpao: .4, palafita: .3}[S.trees] + rnd() * .22);
      const by = top - bh, c = S.trees === "galpao" ? ["#8a929a", "#7a828a", "#9aa2a8"][Math.floor(rnd() * 3)] : walls[Math.floor(rnd() * walls.length)];
      rect(OUTLINE, bx - 1, by - 1, bw + 2, bh + 1); rect(c, bx, by, bw, bh); rect("rgba(0,0,0,.18)", bx + bw - 2, by, 2, bh);
      if (S.trees === "galpao") { for (let i = 0; i < bw; i += 3) rect("rgba(255,255,255,.12)", bx + i, by, 1, bh); rect(P.roof2 || "#5a6670", bx - 2, by - 3, bw + 4, 3); }
      else {
        rect(P.roof || "#8a3a22", bx - 2, by - 3, bw + 4, 3); rect(P.roof2 || "#6a2a18", bx - 2, by - 1, bw + 4, 1);
        for (let wy = by + 4; wy < top - 5; wy += 7) for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) { rect("#f4ecd8", wx, wy, 3, 4); rect("#3a2a3a", wx + 1, wy + 1, 1, 3); }
      }
      bx += bw + (S.trees === "galpao" ? 6 + rnd() * 16 : rnd() < .3 ? 4 + rnd() * 8 : 1);
    }
    if (S.trees === "galpao") for (let i = 0; i < 2; i++) {   // guindastes do porto
      const cx = W * (.2 + .55 * i + rnd() * .1), cy = top - (top - st.y) * .85;
      rect("#c8603a", cx, cy, 2, top - cy); rect("#c8603a", cx - 10, cy, 26, 2); rect("#5a3a2a", cx + 14, cy + 2, 1, 8);
    }
    return;
  }
  // duas fileiras de copas: a de trás mais clara (longe), a da frente mais escura e mais baixa
  for (let row = 0; row < 2; row++) {
    const base = top - (row ? 0 : 6), c = row ? S.far : mixHex(S.far, S.sky[S.sky.length - 1], .45);
    for (let cx = -4; cx < W + 8; cx += 5 + rnd() * 6) {
      const rr = (row ? 5 : 7) + rnd() * (S.trees === "campo" ? 3 : 7);
      blob(cx, base - rr * .6, rr, c);
    }
    rect(c, 0, base - 3, W, 4);
  }
  if (S.trees === "campo") return;   // várzea: campo aberto, só a mata baixa ao longe
  if (S.trees === "caatinga") { sceneCaatinga(x, P, rnd, W, top, st, rect); return; }
  // árvores grandes na frente da mata: tronco e copa com luz em cima; mangue com raízes em arco; seringueira clara com cortes
  const count = Math.ceil(W / 34);
  for (let i = 0; i < count; i++) {
    const skyH = top - st.y, tx = (i + .2 + rnd() * .6) * W / count, th = skyH * (.4 + rnd() * .22), tw = S.trees === "seringa" ? 4 : 3 + Math.round(rnd() * 2);
    const tb = top + 1, tt = tb - th;
    if (tx > st.x + st.w * .45 && tx < st.x + st.w * .95 && rnd() < .6) continue;   // deixa o lugar do bicho mais limpo
    rect(OUTLINE, tx - 1, tt, tw + 2, th); rect(P.trunk, tx, tt, tw, th); rect("rgba(0,0,0,.25)", tx + tw - 1, tt, 1, th);
    if (S.trees === "seringa") for (let y = tt + th * .4; y < tb - 3; y += 4) { rect("#8a7a5a", tx, y, tw, 1); rect("#f4f4ec", tx + tw, y + 1, 1, 2); }   // cortes e o leite escorrendo
    if (S.trees === "mangue") for (let j = -2; j <= 2; j++) if (j) {   // raízes em arco
      const ex = tx + tw / 2 + j * 4;
      for (let s = 0; s <= 6; s++) rect(P.trunk, tx + tw / 2 + (ex - tx - tw / 2) * s / 6, tb - 8 + s * s / 4.5, 1, 1);
    }
    const cr = skyH * ((S.trees === "fechada" ? .27 : .2) + rnd() * .07), cy = tt - cr * .3;   // tamanho pelo céu que sobra: atrás do rio ficam menores
    [[0, 0, 1], [-.7, .35, .8], [.7, .35, .8], [-.3, -.5, .75], [.4, -.45, .7]].forEach(([dx, dy, s]) => blob(tx + tw / 2 + dx * cr, cy + dy * cr, cr * s + 1, OUTLINE));
    [[0, 0, 1], [-.7, .35, .8], [.7, .35, .8], [-.3, -.5, .75], [.4, -.45, .7]].forEach(([dx, dy, s]) => blob(tx + tw / 2 + dx * cr, cy + dy * cr, cr * s, P.leaf));
    blob(tx + tw / 2 + cr * .25, cy + cr * .45, cr * .55, P.leaf2);
    blob(tx + tw / 2 - cr * .35, cy - cr * .45, cr * .38, P.leafHi);
  }
}
// caatinga: mandacaru (cacto de braços para cima) e árvore seca de galho cinza, sem folha, na frente da serra
function sceneCaatinga(x, P, rnd, W, top, st, rect) {
  const count = Math.ceil(W / 30), skyH = top - st.y;
  for (let i = 0; i < count; i++) {
    const tx = Math.round((i + .2 + rnd() * .6) * W / count), tb = top + 1;
    if (tx > st.x + st.w * .45 && tx < st.x + st.w * .95 && rnd() < .6) continue;   // o lugar do bicho fica limpo
    if (rnd() < .5) {   // mandacaru
      const h = Math.round(skyH * (.25 + rnd() * .15)), tt = tb - h;
      rect(OUTLINE, tx - 1, tt - 1, 6, h + 1); rect(P.leaf, tx, tt, 4, h); rect(P.leafHi, tx + 1, tt + 1, 1, h - 2);
      for (const s of [-1, 1]) if (rnd() < .8) {
        const ay = tt + Math.round(h * (.3 + rnd() * .25)), ah = Math.round(h * (.25 + rnd() * .15)), ax = s < 0 ? tx - 5 : tx + 5;
        rect(OUTLINE, Math.min(tx, ax) - 1, ay - 1, 7, 5); rect(P.leaf, Math.min(tx, ax), ay, 5, 3);   // cotovelo
        rect(OUTLINE, ax - 1, ay - ah - 1, 5, ah + 2); rect(P.leaf, ax, ay - ah, 3, ah + 2); rect(P.leafHi, ax, ay - ah + 1, 1, ah - 1);
      }
      if (rnd() < .4) rect("#f4f0e0", tx + 1, tt - 2, 2, 2);   // a flor branca no alto
    } else {   // árvore seca: tronco torto e galhos finos abrindo em leque
      const h = Math.round(skyH * (.3 + rnd() * .18)), tt = tb - h;
      x.strokeStyle = P.trunk; x.lineWidth = 2; x.beginPath(); x.moveTo(tx, tb); x.lineTo(tx + 1, tt + h * .45); x.stroke();
      x.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k - 2) * .45 + (rnd() - .5) * .3, l = h * (.35 + rnd() * .25), bx = tx + 1, by = tt + h * .45;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); x.stroke();
        x.beginPath(); x.moveTo(bx + Math.cos(a) * l * .6, by + Math.sin(a) * l * .6); x.lineTo(bx + Math.cos(a + .5) * l * .9, by + Math.sin(a + .5) * l * .9); x.stroke();
      }
    }
  }
}
// rua da cidade: paralelepípedo (Cidade Velha) ou tábuas do cais (Porto)
function sceneStreet(x, zone, P, W, H, G0) {
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  if (zone === "porto") { for (let y = G0; y < H; y += 4) { rect(P.wood2, 0, y, W, 1); for (let px = (y / 4 % 2) * 9; px < W; px += 18) rect(P.wood2, px, y, 1, 4); } return; }
  for (let y = G0 + 1; y < H; y += 3) for (let px = (y % 2) * 2; px < W; px += 4) { rect(P.rock, px, y, 3, 2); rect(P.rock2, px, y + 2, 4, 1); }
}
function sceneLily(x, cx, cy, P) {
  x.fillStyle = "#3a8a4a"; x.fillRect(Math.round(cx) - 2, Math.round(cy), 5, 1); x.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 1);
  x.fillStyle = "#ff9fc0"; x.fillRect(Math.round(cx), Math.round(cy) - 2, 1, 1);
}
// palafitas das Baixadas: casinhas de madeira em cima de estacas, dentro da água
function scenePalafitas(x, P, rnd, W, wTop, G0) {
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  for (let hx = rnd() * 20; hx < W; hx += 34 + rnd() * 30) {
    const hw = 16 + rnd() * 8, hb = wTop + 3, hh = 12 + rnd() * 4, c = P.walls[Math.floor(rnd() * P.walls.length)];
    for (let s = 1; s < hw; s += 5) rect(P.wood2, hx + s, hb, 1, G0 - hb - 2);
    rect(OUTLINE, hx - 1, hb - hh - 1, hw + 2, hh + 2); rect(c, hx, hb - hh, hw, hh); rect(P.roof, hx - 2, hb - hh - 3, hw + 4, 3);
    rect("#3a2a1a", hx + hw * .4, hb - 7, 3, 6); rect(P.wood, hx - 3, hb, hw + 6, 1);
  }
}
function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/* ---------- montinhos onde cada um pisa ---------- */
// superfície em elipse (com textura e beirada de grama/tábua/pedra) e a lateral mais escura por baixo; a imagem tem 64x10
const PLAT_W = 64, PLAT_H = 10, PLAT_TOP = 7;
const PLAT_CACHE = new Map();
function sceneryPlat(zone, wet) {
  const key = zone + (wet ? ":agua" : "");
  if (PLAT_CACHE.has(key)) return PLAT_CACHE.get(key);
  const S = sceneOf(zone), P = scenePal(zone), rnd = sceneRng(sceneSeed(key) + 3), kind = wet ? "agua" : S.plat;
  const c = document.createElement("canvas"); c.width = PLAT_W; c.height = PLAT_H;
  const x = c.getContext("2d"), cx = PLAT_W / 2, rx = PLAT_W / 2 - 1, ry = PLAT_TOP / 2, cy = ry + .5;
  const surf = {grama: [P.g1, P.g2], musgo: [P.g1, P.leaf], areia: [P.path, P.path2], barro: [P.path2, P.trunk], lama: [P.g1, P.g2], folhas: [P.path, P.trunk],
    flores: [P.g1, P.g2], pedra: [P.rock, P.rock2], tabua: [P.wood, P.wood2], agua: [P.water2, P.water], pixel: ["#1e4a7a", "#5ac8ff"]}[kind] || [P.g1, P.g2];
  const side = kind === "agua" ? "#14304a" : kind === "pixel" ? "#0a1a30" : kind === "tabua" ? P.wood2 : kind === "pedra" ? P.rock2 : P.trunk;
  const half = y => rx * Math.sqrt(Math.max(0, 1 - ((y + .5 - cy) / ry) ** 2));
  for (let y = 0; y < PLAT_H; y++) {
    const hw = y < PLAT_TOP ? half(y) : half(Math.min(y - (PLAT_H - PLAT_TOP), PLAT_TOP - 1)) * (1 - (y - PLAT_TOP) * .06);
    const a = Math.round(cx - hw), b = Math.round(cx + hw);
    if (b <= a) continue;
    x.fillStyle = OUTLINE; x.fillRect(a - 1, y, b - a + 2, 1);
    x.fillStyle = y >= PLAT_TOP ? side : surf[0]; x.fillRect(a, y, b - a, 1);
    if (y < PLAT_TOP) for (let px = a + 1; px < b - 1; px++) {   // textura da superfície
      const v = rnd();
      if (kind === "tabua" ? px % 9 === 0 : kind === "pedra" ? (px + y * 3) % 5 === 0 : v < .22) { x.fillStyle = surf[1]; x.fillRect(px, y, 1, 1); }
      if (kind === "agua" && v > .9) { x.fillStyle = "#e8f6ff"; x.fillRect(px, y, 2, 1); }
    }
  }
  x.fillStyle = OUTLINE; x.fillRect(Math.round(cx - rx * .55), PLAT_H - 1, Math.round(rx * 1.1), 1);
  // beirada: tufos de grama, florzinhas, folhas secas, raízes do mangue
  for (let i = 0; i < 26; i++) {
    const t = rnd() * Math.PI * 2, ex = Math.round(cx + Math.cos(t) * rx * .97), ey = Math.round(cy + Math.sin(t) * ry * .9);
    if (["grama", "flores", "musgo"].includes(kind) && Math.sin(t) < .3) { x.fillStyle = kind === "musgo" ? P.leafHi : P.tallHi; x.fillRect(ex, ey - 1, 1, 2); x.fillStyle = P.tall; x.fillRect(ex + 1, ey, 1, 1); }
    if (kind === "flores" && i % 5 === 0) { x.fillStyle = ["#ffd23a", "#ff8aa8", "#ffffff"][i % 3]; x.fillRect(ex, ey - 1, 1, 1); }
    if (kind === "folhas" && i % 2) { x.fillStyle = ["#c88a3a", "#a8642a", "#d8b05a"][i % 3]; x.fillRect(ex, ey, 2, 1); }
    if (kind === "lama" && i % 3 === 0) { x.fillStyle = P.trunk; x.fillRect(ex, ey, 1, 2); }
  }
  const url = `url(${c.toDataURL()})`;
  PLAT_CACHE.set(key, url); return url;
}
// chamado por setBattleDecor: troca os montinhos e redesenha o cenário quando o palco muda de tamanho
function setScenery(zone) {
  const stage = $("stage");
  stage.classList.add("scenic");
  stage.style.setProperty("--platL", sceneryPlat(zone, false));   // chão de pisar (Rhanon e bicho)
  stage.style.setProperty("--platW", sceneryPlat(zone, true));    // poça do bicho de água (.stage.aquatic)
  requestAnimationFrame(() => drawScenery(true));
}
if (window.ResizeObserver) addEventListener("DOMContentLoaded", () => new ResizeObserver(() => drawScenery()).observe($("stage")));
addEventListener("resize", () => drawScenery());

/* ---------- tela inicial: o fundo é da região do save ---------- */
// cada região tem o seu desenho (TITLE_BG) e o montinho de chão debaixo do Rhanon (plat); região sem desenho usa o Norte.
// A faixa preta inclinada e as letras recortadas (styles.css, com as cores de cada região em [data-region]) dão o Persona
const TITLE_BG = {norte: {plat: "mata", draw: titleForest}, nordeste: {plat: "caatinga", draw: titleSertao}, centroeste: {plat: "varzea", draw: titlePantanal}};
function drawTitleBg() {
  const cv = $("titleBg");
  if (!cv || $("titleScreen").hidden) return;
  const reg = TITLE_BG[MAP_REGION] ? MAP_REGION : "norte", bg = TITLE_BG[reg];
  const k = Math.max(3, Math.round(Math.min(innerWidth / 260, innerHeight / 170))), W = Math.ceil(innerWidth / k), H = Math.ceil(innerHeight / k);
  if (cv.width === W && cv.height === H && cv.dataset.region === reg) return;
  cv.width = W; cv.height = H; cv.dataset.region = reg; $("titleScreen").dataset.region = reg;
  $("titleArt").style.setProperty("--titlePlat", sceneryPlat(bg.plat));   // montinho de chão debaixo do Rhanon
  const x = cv.getContext("2d");
  const rect = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const blob = (cx, cy, rr, c) => { x.fillStyle = c; x.beginPath(); x.arc(Math.round(cx), Math.round(cy), Math.max(1, rr), 0, Math.PI * 2); x.fill(); };
  bg.draw(W, H, rect, blob);
}
// Norte: a mata ao entardecer. Lua grande, três fileiras de copas (a de trás clara, a da frente quase preta), troncos nas
// bordas e cipós caindo do alto
function titleForest(W, H, rect, blob) {
  const rnd = sceneRng(4242);
  const sky = ["#0f3a2a", "#17583a", "#1f7a46", "#3a9a4e", "#8ac460", "#e8d070"];
  sky.forEach((c, i) => { const a = Math.round(H * .62 * i / sky.length), b = Math.round(H * .62 * (i + 1) / sky.length); rect(c, 0, a, W, b - a); if (i) for (let px = 0; px < W; px += 2) rect(c, px + (a % 2), a - 1, 1, 1); });
  rect("#e8d070", 0, H * .62, W, H);
  // lua cheia amarela atrás da mata, com brilho em degraus
  const mx = W * .74, my = H * .3, mr = Math.min(W, H) * .16;
  [[2.1, "rgba(255,240,170,.08)"], [1.6, "rgba(255,240,170,.12)"], [1.25, "rgba(255,240,170,.18)"]].forEach(([s, c]) => blob(mx, my, mr * s, c));
  blob(mx, my, mr, "#ffe98a"); blob(mx + mr * .25, my - mr * .2, mr * .2, "#f0d670"); blob(mx - mr * .35, my + mr * .3, mr * .14, "#f0d670");
  // fileiras de copas, cada uma mais perto e mais escura
  [["#2f8a4a", .5, 9], ["#1d6a3a", .62, 12], ["#0f3f24", .76, 16]].forEach(([c, base, size]) => {
    const by = H * base;
    for (let cx = -6; cx < W + 10; cx += size * .55 + rnd() * size * .6) blob(cx, by - rnd() * size * .7, size * (.7 + rnd() * .5), c);
    rect(c, 0, by, W, H - by);
  });
  // chão escuro e troncos grandes nas bordas, como uma moldura
  rect("#06120a", 0, H * .86, W, H);
  [[W * .04, 9], [W * .13, 6], [W * .93, 10], [W * .84, 5]].forEach(([tx, tw]) => {
    rect("#06120a", tx - 1, 0, tw + 2, H); rect("#2a1a0e", tx, 0, tw, H); rect("#3e2614", tx + 1, 0, 2, H);
    for (let y = rnd() * 10; y < H; y += 8 + rnd() * 10) rect("#1a0f08", tx + rnd() * (tw - 2), y, 2, 1);
  });
  for (let i = 0; i < W / 5; i++) {   // copa escura no alto e cipós pendurados
    blob(rnd() * W, rnd() * H * .06, 6 + rnd() * 10, "#06120a");
    if (rnd() < .3) { const vx = Math.round(rnd() * W), vl = H * (.08 + rnd() * .3); for (let y = 0; y < vl; y++) rect(y % 6 === 5 ? "#2f7a3f" : "#0a2414", vx + Math.round(Math.sin(y / 7) * 1.5), y, 1, 1); blob(vx, vl, 1.6, "#2f7a3f"); }
  }
}
// Nordeste: o sertão no pôr do sol. Céu do roxo ao laranja com estrelas no alto, sol listrado afundando atrás da chapada,
// asa-branca voando, serrote mais perto e, na frente, mandacaru e pau seco escuros nas bordas, como moldura
function titleSertao(W, H, rect, blob) {
  const rnd = sceneRng(7171), hz = H * .62, ink = "#14060e";
  const sky = ["#2a1438", "#4a1a48", "#7a2448", "#b83a44", "#e8643a", "#f8a040", "#ffd474"];
  sky.forEach((c, i) => { const a = Math.round(hz * i / sky.length), b = Math.round(hz * (i + 1) / sky.length); rect(c, 0, a, W, b - a); if (i) for (let px = 0; px < W; px += 2) rect(c, px + (a % 2), a - 1, 1, 1); });
  for (let i = 0; i < W / 6; i++) rect(rnd() < .3 ? "#fff2c8" : "#c8a0d0", rnd() * W, rnd() * hz * .3, 1, 1);   // estrelas acendendo
  // o sol grande e baixo, com listras de céu cortando a metade de baixo
  const sx = W * .72, sy = hz * .9, sr = Math.min(W, H) * .2;
  [[1.9, "rgba(255,200,110,.10)"], [1.45, "rgba(255,200,110,.16)"], [1.18, "rgba(255,210,120,.24)"]].forEach(([s, c]) => blob(sx, sy, sr * s, c));
  blob(sx, sy, sr, "#ffe07a"); blob(sx - sr * .3, sy - sr * .35, sr * .5, "#fff0a8");
  for (let i = 0, y = sy + sr * .08; y < sy + sr; i++, y += 2 + i) rect("#f08a3a", sx - sr, y, sr * 2, 1 + i * .5);
  // asa-branca: três passarinhos em "v"
  [[.3, .22], [.36, .17], [.26, .3]].forEach(([bx, by]) => { const px = W * bx, py = H * by; rect("#2a1028", px - 2, py, 2, 1); rect("#2a1028", px, py + 1, 1, 1); rect("#2a1028", px + 1, py, 2, 1); });
  // a chapada no fundo (mesa de topo reto, muda pouco) e o serrote mais perto, cada fileira mais escura
  const ridge = (c, base, top, step, flat) => {
    let y = base - top * (.5 + rnd() * .5);
    for (let px = 0; px < W; px += step) {
      if (!flat || rnd() < .15) y = Math.min(base - 2, Math.max(base - top, y + (rnd() - .5) * top * (flat ? .8 : .5)));
      rect(c, px, y, step, H - y);
    }
  };
  ridge("#7a2a44", hz, H * .14, 3, true);
  ridge("#4a1a34", H * .7, H * .1, 2, false);
  rect("#2a0e1e", 0, H * .76, W, H);
  for (let px = 0; px < W; px += 1 + Math.floor(rnd() * 4)) rect("#2a0e1e", px, H * .76 - 1 - Math.floor(rnd() * 2), 1, 2);   // capim seco na beira
  rect(ink, 0, H * .86, W, H);
  // moldura: mandacaru (tronco com braços para cima) e pau seco (galhos tortos, sem folha) nas bordas
  const cactus = (cx, w, top) => {   // tronco e braços de topo redondo (cotovelo ligando ao tronco), com gomos mais claros
    const col = (x0, y0, ww, y1) => { blob(x0 + ww / 2, y0, ww / 2 + 1, ink); rect(ink, x0 - 1, y0, ww + 2, y1 - y0 + 1); blob(x0 + ww / 2, y0, ww / 2, "#3a1a24"); rect("#3a1a24", x0, y0, ww, y1 - y0); rect("#5a2a34", x0 + 1, y0, 1, y1 - y0); rect("#2a1018", x0 + ww - 2, y0, 1, y1 - y0); };
    const arms = [[-1, .3, .14], [1, .42, .12], [-1, .58, .09]].map(([s, f, up]) => {
      const aw = Math.max(3, Math.round(w * .75)), ay = top + (H - top) * f, gap = Math.round(w * .7), ax = s < 0 ? cx - gap - aw : cx + w + gap;
      const ex = s < 0 ? ax : cx + w, ew = gap + aw, eh = Math.max(2, Math.round(w * .6));
      rect(ink, ex - 1, ay - 1, ew + 2, eh + 2); col(ax, ay - H * up, aw, ay + eh);
      return () => rect("#3a1a24", ex, ay, ew, eh);   // o cotovelo por cima do contorno do braço
    });
    col(cx, top, w, H); arms.forEach(f => f());
  };
  const dryTree = (tx, w) => {
    rect(ink, tx - 1, H * .3, w + 2, H); rect("#2a1018", tx, H * .3, w, H);
    for (let i = 0; i < 7; i++) {
      let gx = tx + w / 2, gy = H * (.3 + rnd() * .35); const dx = (rnd() < .5 ? -1 : 1) * (.6 + rnd() * .6);
      for (let j = 0; j < 14 + rnd() * 14; j++) { rect("#2a1018", gx, gy, 2, 2); gx += dx; gy -= .5 + rnd() * .8; if (rnd() < .15) rect("#2a1018", gx + dx * 3, gy - 2, 1, 3); }
    }
  };
  cactus(W * .05, 7, H * .2); dryTree(W * .15, 3); cactus(W * .9, 8, H * .14); dryTree(W * .81, 3);
}
// Centro-Oeste: o Pantanal no anoitecer. Céu enorme do azul ao rosa, lua grande e apagada (a fumaça de Pytuna comendo um
// pedaço dela), fumaça de queimada no horizonte, a lagoa refletindo tudo em listras, um tuiuiú parado na água e carandás
// (palmeira de leque) escuros nas bordas, como moldura
function titlePantanal(W, H, rect, blob) {
  const rnd = sceneRng(5353), hz = H * .58, ink = "#0a0a1e";
  const sky = ["#141838", "#22285a", "#3a3a7a", "#6a4a8a", "#a85a7a", "#e07a6a", "#f8b07a"];
  sky.forEach((c, i) => { const a = Math.round(hz * i / sky.length), b = Math.round(hz * (i + 1) / sky.length); rect(c, 0, a, W, b - a); if (i) for (let px = 0; px < W; px += 2) rect(c, px + (a % 2), a - 1, 1, 1); });
  for (let i = 0; i < W / 4; i++) rect(rnd() < .3 ? "#fff6d8" : "#b8b8e8", rnd() * W, rnd() * hz * .45, 1, 1);   // o céu sem morro: estrela de canto a canto
  // Jaci grande e pálida, com a fumaça cinza cobrindo um pedaço
  const mx = W * .3, my = hz * .34, mr = Math.min(W, H) * .15;
  [[2, "rgba(220,220,255,.06)"], [1.5, "rgba(220,220,255,.1)"], [1.2, "rgba(220,220,255,.14)"]].forEach(([k, c]) => blob(mx, my, mr * k, c));
  blob(mx, my, mr, "#d8d8e8"); blob(mx - mr * .3, my - mr * .25, mr * .22, "#c0c0d4"); blob(mx + mr * .2, my + mr * .3, mr * .14, "#c0c0d4");
  [[.55, -.2, .55], [.8, .25, .5], [.35, .45, .4], [1, -.05, .38]].forEach(([dx, dy, k]) => blob(mx + mr * dx, my + mr * dy, mr * k, "#4a4658"));
  // a queimada lá longe: brilho laranja no horizonte e a coluna de fumaça subindo torta
  const fx = W * .78;
  [[.2, "rgba(255,120,60,.18)"], [.12, "rgba(255,150,70,.25)"]].forEach(([k, c]) => blob(fx, hz, W * k, c));
  for (let y = hz, x0 = fx, r = 3; y > hz * .25; y -= 3, x0 -= .9 + rnd() * .8, r += .35) blob(x0 + (rnd() - .5) * 3, y, r, y > hz * .8 ? "#5a4048" : "#3e3650");
  // horizonte reto com mata baixa (capão) e a lagoa refletindo o céu em listras
  for (let px = 0; px < W; px += 2) rect("#1a1a3a", px, hz - 1 - Math.floor(rnd() * 3) - (Math.abs(px - W * .55) < W * .12 ? 4 + rnd() * 3 : 0), 2, 6);
  rect("#1a1a3a", 0, hz, W, 2);
  [...sky].reverse().forEach((c, i) => { const a = hz + 2 + i * (H * .26 / sky.length), h = H * .26 / sky.length; rect(c, 0, a, W, h); for (let k = 0; k < W / 10; k++) rect("#0a0a1e", rnd() * W, a + rnd() * h, 3 + rnd() * 6, 1); });
  for (let k = 0; k < 6; k++) rect("#f0f0ff", mx - mr * .6 + rnd() * mr * 1.2, hz + 4 + k * 3, 2 + rnd() * 5, 1);   // a lua na água
  // margem de capim e o chão escuro na frente
  rect("#141432", 0, H * .84, W, H);
  for (let px = 0; px < W; px += 1 + Math.floor(rnd() * 3)) rect("#141432", px, H * .84 - 1 - Math.floor(rnd() * 4), 1, 5);
  rect(ink, 0, H * .9, W, H);
  // tuiuiú na água: pernas compridas, corpo branco, pescoço preto com o colar vermelho e o bico grande
  const tx = W * .46, ty = H * .82;
  rect(ink, tx - 1, ty - 12, 1, 12); rect(ink, tx + 2, ty - 12, 1, 12);
  blob(tx + 1, ty - 15, 4, "#e8e8f0"); rect("#e8e8f0", tx - 3, ty - 17, 9, 4); rect("#3a3a48", tx + 3, ty - 17, 4, 2);
  rect(ink, tx - 2, ty - 25, 2, 9); rect("#d82a3a", tx - 2, ty - 18, 2, 2); blob(tx - 1, ty - 26, 2, ink); rect(ink, tx - 7, ty - 26, 6, 1); rect(ink, tx - 6, ty - 25, 4, 1);
  // carandás nas bordas: tronco fino e alto com a copa de leque
  const palm = (px, top, tw) => {
    rect(ink, px, top, tw, H - top);
    for (let k = 0; k < 9; k++) { const a = Math.PI * (1.1 + k * .1), len = 8 + rnd() * 6; for (let j = 0; j < len; j++) rect(ink, px + tw / 2 + Math.cos(a) * j, top + Math.sin(a) * j * .7 + j * j * .03, 2, 2); }
    blob(px + tw / 2, top, 3, ink);
  };
  palm(W * .05, H * .22, 3); palm(W * .12, H * .36, 2); palm(W * .9, H * .18, 3); palm(W * .83, H * .4, 2);
}
addEventListener("resize", () => drawTitleBg());
