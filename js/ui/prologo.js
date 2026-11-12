/* Abertura ilustrada do jogo novo: atrás de cada fala do prólogo do Pajé (NARRA.prologo) passa um quadro desenhado em
   pixel art, com movimento (fogo, fumaça, gente andando, papel voando) e a câmera escorregando devagar de lado.
   prologueScene(depois) abre o canvas #prologo, toca o tema de Jaci e chama narrate(); o quadro é escolhido pela fala que
   está na tela (NARRA_RUN.i), então Z passa a fala e o quadro junto, e Esc pula tudo (como em toda narração).
   Quadro novo = uma entrada em PROL_SCENES, na ordem das falas: paint() pinta o fundo parado (uma vez, PROL_PAN pixels
   mais largo que a tela) e draw() desenha por cima o que se mexe (t = ms desde que o quadro entrou). */
let PROL = null;   // {cv, x, i, t0, bg: [], next, sw}
const PROL_FADE = 240, PROL_PAN = 14, PROL_TOP = .05, PROL_H = .7;
// pincéis: retângulo e bolinha em pixels inteiros
function prolBrush(g) {
  return {
    rect: (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); },
    blob: (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(Math.round(cx), Math.round(cy), Math.max(1, r), 0, Math.PI * 2); g.fill(); }
  };
}
// céu em faixas, com a borda entre elas pontilhada
function prolSky(B, W, cols, h) {
  cols.forEach((c, i) => { const a = Math.round(h * i / cols.length), b = Math.round(h * (i + 1) / cols.length); B.rect(c, 0, a, W, b - a); if (i) for (let px = 0; px < W; px += 2) B.rect(c, px + (a % 2), a - 1, 1, 1); });
}
// fileira de copas: bolas ao longo da linha `y` e tudo cheio dali para baixo
function prolTrees(B, rnd, W, H, y, size, col) {
  for (let cx = -6; cx < W + 10; cx += size * .55 + rnd() * size * .6) B.blob(cx, y - rnd() * size * .7, size * (.7 + rnd() * .5), col);
  B.rect(col, 0, y, W, H - y);
}
// oca: cúpula de palha com as fiadas mais escuras e a porta
function prolOca(B, cx, base, r, cols) {
  for (let y = 0; y < r; y++) { const w = Math.sqrt(1 - (y / r) ** 2) * r * 1.15; B.rect(y % 4 === 3 ? cols[1] : cols[0], cx - w, base - y, w * 2, 1); }
  B.rect(cols[2], cx - r * .2, base - r * .45, r * .4, r * .45 + 1);
}
// araucária: tronco alto e pelado e a copa em taça lá em cima (galhos de baixo mais compridos, todos virando para o alto)
function prolAraucaria(B, cx, base, h, col) {
  const tw = Math.max(2, Math.round(h * .05)), top = base - h;
  B.rect(col, cx - tw / 2, top, tw, h);
  for (let k = 0; k < 4; k++) {
    const y = top + h * .05 + k * h * .065, rw = h * (.1 + k * .055), r = Math.max(2, h * (.05 - k * .004));
    B.rect(col, cx - rw, y, rw * 2, 2);
    for (const s of [-1, 1]) { B.rect(col, cx + s * rw - 1, y - r, 2, r + 1); B.blob(cx + s * rw, y - r, r, col); B.blob(cx + s * rw * .6, y - r * .4, r * .8, col); }
  }
  B.blob(cx, top, Math.max(2, h * .06), col);
}
// os dois: [quem viaja, quem foi na frente], com o desenho de cada um
function prolLooks() {
  const fran = {pal: {...HERO_PAL.fran}, trancas: true}, me = rhanonLook();
  return heroi() === "fran" ? [me, {}] : [me, fran];
}
// tudo escuro, só o contorno (crianças de costas em volta do fogo)
function prolShade(src, col, a) {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0); g.globalCompositeOperation = "source-atop"; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return c;
}
const PROL_SHADE = new Map(), prolDark = (src, col = "#0a0e28", a = .55) => { const k = col + a; let m = PROL_SHADE.get(src); if (!m) PROL_SHADE.set(src, m = {}); return m[k] || (m[k] = prolShade(src, col, a)); };
// fogueira grande: lenha, chamas (as mesmas da exploração, 3x), clarão que treme e fagulhas subindo
function prolFire(x, cx, gy, t, H, k = 1) {
  const fl = .2 + Math.sin(t / 90) * .04 + Math.sin(t / 37) * .03;
  x.save(); x.globalCompositeOperation = "lighter";
  const g = x.createRadialGradient(cx, gy - 8, 2, cx, gy - 8, H * .55 * k); g.addColorStop(0, `rgba(255,150,40,${fl * 1.6})`); g.addColorStop(.5, `rgba(255,110,30,${fl * .5})`); g.addColorStop(1, "rgba(255,90,20,0)");
  x.fillStyle = g; x.fillRect(cx - H, gy - H, H * 2, H * 2); x.restore();
  x.fillStyle = "#2a1a0e"; x.fillRect(cx - 14, gy + 2, 28, 4); x.fillStyle = "#4a2e16"; x.fillRect(cx - 12, gy, 10, 3); x.fillRect(cx + 2, gy, 10, 3);
  x.save(); x.translate(cx - 24, gy - 27); x.scale(3, 3); drawFire(x, 0, 0, t); x.restore();
  for (let i = 0; i < 10; i++) {
    const life = (t / 1600 + rand(i * 3.3)) % 1;
    x.fillStyle = life < .5 ? "#ffd23a" : "#f2740c"; x.globalAlpha = 1 - life;
    x.fillRect(Math.round(cx + (rand(i * 5.7) - .5) * 20 + Math.sin(life * 7 + i) * 4), Math.round(gy - 14 - life * H * .4), 1, 1);
  }
  x.globalAlpha = 1;
}
const PROL_SCENES = [
  { // 1. "Senta aqui perto do fogo, curumim": noite, o Pajé e as crianças em volta da fogueira
    paint(B, W, H, rnd) {
      prolSky(B, W, ["#060a1a", "#0a1230", "#101a42", "#182654"], H * .62);
      for (let i = 0; i < W / 3; i++) B.rect(rnd() < .8 ? "#e8f0ff" : "#ffe8a0", rnd() * W, rnd() * H * .5, 1, 1);
      prolTrees(B, rnd, W, H, H * .56, 13, "#0c2030"); prolTrees(B, rnd, W, H, H * .66, 16, "#07141c");
      B.rect("#120e0a", 0, H * .72, W, H); prolOca(B, W * .14, H * .74, H * .2, ["#2a2014", "#1a140c", "#0a0806"]);
      for (let i = 0; i < 40; i++) B.rect("#1e1810", rnd() * W, H * .74 + rnd() * H * .26, 2 + rnd() * 3, 1);
    },
    draw(x, W, H, t) {
      const cx = Math.round(W * .52), gy = Math.round(H * .78), paje = rigPaint("front", {sit: true, ...heroBreath(t, 2600)}, VILLAGER_LOOK.xama, 2);
      x.drawImage(prolDark(paje, "#0a0e28", .28), cx - 92, gy + 12 - paje.height);
      [[VILLAGER_LOOK.aldeao1, 30, 0], [VILLAGER_LOOK.aldeao3, 58, 6], [{}, 88, 2]].forEach(([look, dx, dy], i) => {
        const kid = rigPaint("back", {sit: true, dy: Math.floor(t / 900 + i * .4) % 2}, look, 1.3);
        x.drawImage(prolDark(kid), cx + dx, gy + 16 + dy - kid.height);
      });
      prolFire(x, cx, gy, t, H);
    }
  },
  { // 2. "Jaci, a lua, começou a apagar": a lua sobre o rio, a fumaça subindo e os olhos vermelhos acendendo na mata
    paint(B, W, H, rnd) {
      prolSky(B, W, ["#04071a", "#081030", "#0e1a4a", "#182a62"], H * .68);
      for (let i = 0; i < W / 2; i++) B.rect(rnd() < .8 ? "#e8f0ff" : "#ffe8a0", rnd() * W, rnd() * H * .6, 1, 1);
      prolTrees(B, rnd, W, H, H * .64, 11, "#0c2238");
      B.rect("#10224a", 0, H * .68, W, H * .14);
      for (let y = 0; y < H * .13; y += 2) B.rect("rgba(230,236,255,.35)", W * .5 - 14 + rnd() * 8 - y * .3, H * .69 + y, 20 + rnd() * 10 + y * .6, 1);   // a lua no rio
      prolTrees(B, rnd, W, H, H * .86, 17, "#03080a");
    },
    draw(x, W, H, t) {
      const B = prolBrush(x), mx = W * .5, my = H * .32, mr = H * .17, k = Math.min(1, t / 9000);
      [[2, .05], [1.55, .08], [1.25, .12]].forEach(([s, a]) => B.blob(mx, my, mr * s, `rgba(220,230,255,${a * (1 - k * .6)})`));
      B.blob(mx, my, mr, "#f4f6ff"); B.blob(mx - mr * .35, my - mr * .2, mr * .2, "#d4dcf2"); B.blob(mx + mr * .3, my + mr * .3, mr * .15, "#d4dcf2"); B.blob(mx + mr * .1, my - mr * .45, mr * .1, "#d4dcf2");
      // a fumaça sobe do horizonte, à direita, e vai cobrindo a lua
      for (let i = 0; i < 26; i++) {
        const u = ciClamp(k * 1.5 - i * .03), a = i * 2.4 + t / 2600, far = i < 14;
        const sx = W * .88 + Math.sin(i * 1.7) * 14, sy = H * .66 - i * 3;
        const tx = far ? mx + mr * (.25 + Math.cos(a) * .75) : mx + (W * .88 - mx) * (i - 14) / 12 + Math.cos(a) * 6, ty = far ? my + Math.sin(a) * mr * .6 : my + (H * .6 - my) * ((i - 14) / 12) ** 1.4 + Math.sin(a) * 4;
        if (u <= 0) continue;
        x.globalAlpha = Math.min(1, u * 1.5) * .92;
        B.blob(sx + (tx - sx) * ciEase(u), sy + (ty - sy) * ciEase(u), (5 + (i % 3) * 3 + Math.sin(t / 500 + i) * 1) * (far ? 1.15 : .9), ["#2a2a34", "#3a3a46", "#1a1a22"][i % 3]);
      }
      x.globalAlpha = 1;
      if (k > .55 && t % 3200 > 140) { x.fillStyle = "#ff2a2a"; x.fillRect(Math.round(mx + mr * .3 - 6), Math.round(my - 2), 4, 2); x.fillRect(Math.round(mx + mr * .3 + 4), Math.round(my - 2), 4, 2); }   // os olhos de Pytuna
      for (let i = 0; i < 7; i++) {   // os bichos ficando bravos: pares de olhos acendendo na mata
        const on = t - 1800 - i * 850; if (on < 0 || (t + i * 700) % 2600 < 110) continue;
        const ex = W * (.08 + rand(i * 2.9) * .84), ey = H * (.84 + rand(i * 6.1) * .1), g = Math.min(1, on / 300);
        x.globalAlpha = g; x.fillStyle = "#ff2a2a"; x.fillRect(Math.round(ex), Math.round(ey), 2, 1); x.fillRect(Math.round(ex + 5), Math.round(ey), 2, 1);
      }
      x.globalAlpha = 1;
    }
  },
  { // 3. "O Rhanon era um menino da nossa aldeia... andavam juntos desde pequenos": dia na aldeia, os dois chegando pela trilha
    paint(B, W, H, rnd) {
      prolSky(B, W, ["#58b8ec", "#7accf2", "#a4e0f4", "#d8f2e4"], H * .5);
      for (let i = 0; i < 5; i++) { const cx = rnd() * W, cy = H * (.08 + rnd() * .22); B.blob(cx, cy, 7, "#ffffff"); B.blob(cx + 9, cy + 2, 5, "#ffffff"); B.blob(cx - 8, cy + 2, 5, "#f0f8ff"); }
      prolTrees(B, rnd, W, H, H * .5, 9, "#3a8a50");
      B.rect("#3a9ad8", 0, H * .53, W, H * .14);
      for (let i = 0; i < 26; i++) B.rect("#8ad0f4", rnd() * W, H * .54 + rnd() * H * .12, 4 + rnd() * 10, 1);
      B.rect("#5ab04a", 0, H * .67, W, H); B.rect("#4a9a3e", 0, H * .67, W, 2);
      for (let i = 0; i < 70; i++) B.rect(rnd() < .5 ? "#4a9a3e" : "#72c85a", rnd() * W, H * .69 + rnd() * H * .31, 2, 1);
      B.rect("#d8b880", 0, H * .8, W, H * .07); for (let i = 0; i < 30; i++) B.rect("#c0a068", rnd() * W, H * .8 + rnd() * H * .07, 3, 1);
      prolOca(B, W * .17, H * .77, H * .2, ["#c89a52", "#a07838", "#3a2414"]); prolOca(B, W * .9, H * .75, H * .17, ["#c89a52", "#a07838", "#3a2414"]);
      [[W * .03, H * .78, 15], [W * .68, H * .7, 11], [W * 1.02, H * .8, 16]].forEach(([tx, ty, r]) => { B.rect("#5a3a1e", tx - 2, ty - r * 1.6, 4, r * 1.6); B.blob(tx, ty - r * 2, r, "#2f8a4a"); B.blob(tx - r * .6, ty - r * 1.6, r * .7, "#1d6a3a"); B.blob(tx + r * .5, ty - r * 2.3, r * .6, "#4aa85a"); });
    },
    draw(x, W, H, t, looks) {
      const gy = Math.round(H * .845), u = ciEase(ciClamp(t / 2800)), hx = Math.round(-70 + (W * .4 + 70) * u), walking = u < .98, st = "walk" + Math.floor(t / 130) % 4;
      const who = (look, weapon, ph) => walking ? rigPaintSide({step: st, dy: Math.floor(t / 130) % 2 ? 0 : 1, weapon}, look, 2) : rigPaint("front", {...heroBreath(t + ph, 2400), face: (t + ph * 3) % 3300 < 130 ? "blink" : undefined}, look, 2);
      const a = who(looks[1], null, 400), b = who({...looks[0], bowBack: false}, walking ? "diag" : undefined, 0);
      x.fillStyle = "rgba(0,0,0,.2)"; x.fillRect(hx + 12, gy, 40, 2); x.fillRect(hx + 56, gy, 40, 2);
      x.drawImage(a, hx + 44, gy - 82); x.drawImage(b, hx, gy - 82);
      for (let i = 0; i < 3; i++) {   // borboletas
        const bx = W * (.2 + i * .28) + Math.sin(t / 900 + i * 2) * 14, by = H * (.6 + i * .04) + Math.sin(t / 500 + i) * 6;
        x.fillStyle = ["#ffd23a", "#ffffff", "#ff8ab0"][i]; x.fillRect(Math.round(bx), Math.round(by), 1, 1); x.fillRect(Math.round(bx + (Math.floor(t / 120 + i) % 2 ? 1 : 2)), Math.round(by - 1), 1, 1);
      }
    }
  },
  { // 4. "Foi primeiro pra Curitiba... e mandou o anúncio": a cidade no fim da tarde, quem foi acena e o papel sai voando
    paint(B, W, H, rnd) {
      prolSky(B, W, ["#2a1a4a", "#55286a", "#983c6c", "#dc6a4c", "#f4ac60"], H * .66);
      B.blob(W * .34, H * .5, H * .15, "rgba(255,224,160,.35)"); B.blob(W * .34, H * .5, H * .1, "#fff0c8");
      for (let bx = -4; bx < W; ) {   // prédios com janelas acesas
        const bw = 9 + rnd() * 14, bh = H * (.1 + rnd() * .3);
        B.rect("#1c1636", bx, H * .7 - bh, bw, bh + 2);
        for (let wy = H * .7 - bh + 3; wy < H * .7 - 3; wy += 5) for (let wx = bx + 2; wx < bx + bw - 3; wx += 4) if (rnd() < .45) B.rect(rnd() < .8 ? "#ffd870" : "#fff4c8", wx, wy, 2, 2);
        bx += bw + 1 + rnd() * 3;
      }
      B.rect("#141028", 0, H * .7, W, H);
      for (let cx = W * .52; cx < W + 20; cx += 9) B.blob(cx, H * .86 - Math.sin((cx - W * .52) / (W * .5) * Math.PI * .6) * H * .1, 14, "#0c0a1a");   // o morro de onde se acena
      B.rect("#0c0a1a", W * .5, H * .86, W, H);
      prolAraucaria(B, W * .08, H * 1.02, H * .62, "#08060f"); prolAraucaria(B, W * .2, H * 1.02, H * .44, "#0c0a1a"); prolAraucaria(B, W * .95, H * .9, H * .5, "#08060f");
    },
    draw(x, W, H, t, looks) {
      const px = Math.round(W * .7), gy = Math.round(H * .79), wave = Math.floor(t / 260) % 2;
      const par = rigPaint("front", {rh: wave ? [27, 12] : [25, 14], dy: wave, face: t % 3300 < 130 ? "blink" : undefined}, {...looks[1], shirt: ["#e8e2cf", "#c8c0a8"], pants: ["#3a5a8a", "#24405a"], bowBack: false}, 2);
      x.drawImage(par, px, gy - 82);
      // o anúncio: sai da mão, sobe girando e vai embora para a esquerda (para o Norte), deixando um rastro pontilhado
      const pos = v => [px + 50 + (-20 - px - 50) * v, gy - 58 - Math.sin(v * Math.PI) * H * .3 - v * H * .12 + Math.sin(v * 22) * 3];
      const u = ciClamp(((t - 900) % 6400) / 5000);
      if (t > 900 && u < 1) {
        x.fillStyle = "#fff4c8"; for (let k = 1; k < 14; k++) { const v = u - k * .022; if (v > 0) { const [dx, dy] = pos(v); x.globalAlpha = .7 - k * .05; x.fillRect(Math.round(dx), Math.round(dy), 1, 1); } }
        x.globalAlpha = 1;
        const [ax, ay] = pos(u), fr = Math.floor(t / 140) % 4, w = [8, 6, 3, 6][fr], h = [6, 7, 8, 7][fr];
        x.fillStyle = "#1a1430"; x.fillRect(Math.round(ax - w / 2) - 1, Math.round(ay - h / 2) - 1, w + 2, h + 2);
        x.fillStyle = "#f4ecd8"; x.fillRect(Math.round(ax - w / 2), Math.round(ay - h / 2), w, h);
        x.fillStyle = "#25663a"; x.fillRect(Math.round(ax - w / 2), Math.round(ay - h / 2), w, 2);
      }
    }
  },
  { // 5. "Eu guardei esse anúncio no bolso a viagem inteira": o papel de perto, nas mãos, à luz do fogo
    paint(B, W, H, rnd) {
      B.rect("#140c08", 0, 0, W, H);
      for (let r = H * .9; r > 0; r -= 6) B.blob(W / 2 + PROL_PAN / 2, H * .5, r, `rgba(120,60,20,.06)`);
      for (let i = 0; i < 60; i++) B.rect("rgba(255,180,90,.08)", rnd() * W, rnd() * H, 3 + rnd() * 6, 1);
    },
    draw(x, W, H, t, looks) {
      const B = prolBrush(x), C = {...RIG_PAL, ...(looks[0].pal || {})}, sw = Math.sin(t / 900) * 2, w = Math.round(Math.min(W * .34, H * .62)), h = Math.round(w * 1.22), px = Math.round(W / 2 - w / 2 + sw), py = Math.round(H * .44 - h / 2 + Math.cos(t / 1300) * 1.5);
      B.rect("rgba(0,0,0,.35)", px + 4, py + 5, w, h); B.rect("#b8a880", px - 1, py - 1, w + 2, h + 2); B.rect("#f4ecd8", px, py, w, h);
      B.rect("#e2d8bc", px, py + h * .5, w, 1); B.rect("#e2d8bc", px + w * .5, py, 1, h);   // as dobras de tanto ficar no bolso
      B.rect("#25663a", px + 4, py + 4, w - 8, h * .16);                                      // o cabeçalho da vaga
      B.rect("#f4ecd8", px + 8, py + 4 + h * .05, w * .5, 2); B.rect("#a6ffc4", px + 8, py + 4 + h * .1, w * .3, 1);
      const ix = px + 7, iy = py + h * .27, iw = w * .34, ih = iw * .7;                          // o computador desenhado
      B.rect("#2a2230", ix, iy, iw, ih); B.rect("#12303a", ix + 2, iy + 2, iw - 4, ih - 4); B.rect("#2a2230", ix + iw * .35, iy + ih, iw * .3, 3); B.rect("#2a2230", ix + iw * .2, iy + ih + 3, iw * .6, 2);
      const c = "#6fe0a0", mx = ix + iw / 2, my = iy + ih / 2;                                   // "</>" na tela
      [[-6, 0], [-5, -1], [-5, 1], [-4, -2], [-4, 2], [6, 0], [5, -1], [5, 1], [4, -2], [4, 2], [-1, 2], [0, 0], [1, -2]].forEach(([dx, dy]) => B.rect(c, mx + dx, my + dy, 1, 1));
      if (Math.floor(t / 500) % 2) B.rect(c, mx + 8, my + 2, 2, 1);
      for (let i = 0; i < 4; i++) B.rect("#8a7a60", px + 12 + iw, iy + 2 + i * 5, (w - iw - 22) * (i === 3 ? .5 : .85 + (i % 2) * .15), 2);   // as linhas do anúncio
      for (let i = 0; i < 5; i++) B.rect(i === 0 ? "#5a4a34" : "#a89878", px + 7, py + h * .6 + i * 6, (w - 14) * (i === 4 ? .45 : .8 + (i % 2) * .2), 2);
      B.blob(px + w - 15, py + h - 16, 8, "rgba(214,40,40,.75)"); B.blob(px + w - 15, py + h - 16, 5, "#f4ecd8"); B.blob(px + w - 15, py + h - 16, 3, "rgba(214,40,40,.75)");   // o carimbo
      // as mãos segurando por baixo, com o polegar por cima do papel
      [[px - 6, 1], [px + w + 6, -1]].forEach(([hx, s]) => {
        B.blob(hx, py + h + 6, 15, "#1a2418"); B.blob(hx, py + h + 6, 14, C.s); B.blob(hx - s * 4, py + h + 12, 11, C.S);
        B.rect("#1a2418", hx + s * 2 - (s > 0 ? 0 : 13), py + h - 9, 13, 8); B.rect(C.s, hx + s * 3 - (s > 0 ? 0 : 11), py + h - 8, 11, 6); B.rect(C.S, hx + s * 3 - (s > 0 ? 0 : 11), py + h - 3, 11, 1);
      });
      x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = `rgba(255,140,40,${.05 + Math.sin(t / 90) * .015 + Math.sin(t / 37) * .012})`; x.fillRect(0, 0, W, H); x.restore();   // luz do fogo tremendo
    }
  },
  { // 6. "Naquela manhã ele acordou do lado dessa mesma fogueira": o mesmo lugar ao amanhecer, ele dormindo sentado
    paint(B, W, H, rnd) {
      prolSky(B, W, ["#3a2a5e", "#8a4a70", "#e07e5c", "#f8be72", "#fff0b4"], H * .62);
      B.blob(W * .7, H * .42, H * .2, "rgba(255,240,180,.25)"); B.blob(W * .7, H * .42, H * .1, "#fff6d0");
      prolTrees(B, rnd, W, H, H * .56, 13, "#2a6a4a"); prolTrees(B, rnd, W, H, H * .66, 16, "#164a30");
      B.rect("#4a7a3a", 0, H * .72, W, H); for (let i = 0; i < 60; i++) B.rect(rnd() < .5 ? "#3a6a30" : "#6a9a4a", rnd() * W, H * .74 + rnd() * H * .26, 2, 1);
      for (let dy = -5; dy <= 5; dy++) { const w = Math.sqrt(1 - (dy / 6) ** 2) * 30; B.rect("#5a4a2a", W * .52 + PROL_PAN / 2 - w, H * .8 + dy, w * 2, 1); }   // terra batida em volta da fogueira
      prolOca(B, W * .14, H * .74, H * .2, ["#b88a48", "#8a6630", "#2a1a0e"]);
    },
    draw(x, W, H, t, looks) {
      const B = prolBrush(x), cx = Math.round(W * .52), gy = Math.round(H * .78), k = Math.min(1, t / 7000);
      const me = rigPaint("front", {sit: true, face: "blink", dy: Math.floor(t / 1100) % 2}, {...looks[0], bowBack: false}, 2);
      x.drawImage(me, cx - 86, gy + 12 - me.height);
      if (Math.floor(t / 1100) % 2) { x.fillStyle = "#ffffff"; x.fillRect(cx - 40, gy - 78, 2, 2); x.fillRect(cx - 35, gy - 84, 3, 3); }   // roncando baixinho
      B.rect("#2a1a0e", cx - 14, gy + 2, 28, 4); B.rect("#3a2414", cx - 12, gy, 10, 3); B.rect("#3a2414", cx + 2, gy, 10, 3);
      B.rect(Math.floor(t / 300) % 2 ? "#f2740c" : "#d62828", cx - 4, gy - 1, 3, 2); B.rect("#d62828", cx + 3, gy, 2, 1);   // brasa
      for (let i = 0; i < 16; i++) { const life = (t / 3000 + i / 16) % 1; x.globalAlpha = .5 * (1 - life); B.blob(cx + Math.sin(life * 5 + i) * (2 + life * 8), gy - 6 - life * H * .4, 1.5 + life * 4, "#c8c0b8"); }   // fumacinha da fogueira apagada
      x.globalAlpha = 1;
      for (let i = 0; i < 4; i++) {   // passarinhos atravessando o céu
        const bx = ((t / 28 + i * 31) % (W + 60)) - 30, by = H * (.2 + i * .04) + Math.sin(t / 400 + i) * 2, f = Math.floor(t / 180 + i) % 2;
        x.fillStyle = "#3a2a4a"; x.fillRect(Math.round(bx), Math.round(by), 1, 1); x.fillRect(Math.round(bx - 1), Math.round(by - (f ? 1 : -1)), 1, 1); x.fillRect(Math.round(bx + 1), Math.round(by - (f ? 1 : -1)), 1, 1);
      }
      x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = `rgba(255,220,140,${.1 * k})`; x.fillRect(0, 0, W, H); x.restore();   // o dia clareando
    }
  }
];
function prologueScene(done) {
  const cv = $("prologo"), k = Math.max(3, Math.round(Math.min(innerWidth / 280, innerHeight / 170)));
  G.narrated.prologo = true; save();
  cv.width = Math.ceil(innerWidth / k); cv.height = Math.ceil(innerHeight / k); cv.hidden = false; cv.classList.remove("out");
  PROL = {cv, x: cv.getContext("2d"), i: -1, t0: 0, bg: [], next: null, sw: 0, looks: prolLooks()};
  PROL.x.imageSmoothingEnabled = false;
  musicStart("jaci");
  requestAnimationFrame(prolFrame);
  narrate(NARRA.prologo, () => {   // acabou (ou pulou): o quadro some por cima da cena de acordar
    cv.classList.add("out"); setTimeout(() => { cv.hidden = true; PROL = null; }, 600);
    musicStart("local"); done();
  });
}
function prolFrame(now) {
  const P = PROL; if (!P) return;
  requestAnimationFrame(prolFrame);
  // a cena ocupa a parte de cima da tela (PROL_TOP a PROL_TOP + PROL_H da altura): embaixo fica a caixa da fala
  const {cv, x} = P, W = cv.width, top = Math.round(cv.height * PROL_TOP), H = Math.round(cv.height * PROL_H), n = NARRA_RUN, want = n ? Math.max(0, Math.min(n.i, PROL_SCENES.length - 1)) : P.i;
  // troca de quadro: escurece, troca no meio e clareia
  if (P.i < 0) { P.i = want; P.t0 = now; }
  else if (want !== P.i && P.next === null) { P.next = want; P.sw = now; }
  let dark = Math.max(0, 1 - (now - P.t0) / PROL_FADE);
  if (P.next !== null) {
    const e = now - P.sw;
    if (e >= PROL_FADE && P.i !== P.next) { P.i = P.next; P.t0 = now; }
    dark = e < PROL_FADE ? e / PROL_FADE : Math.max(0, 1 - (e - PROL_FADE) / PROL_FADE);
    if (e >= PROL_FADE * 2) P.next = null;
  }
  const S = PROL_SCENES[P.i], t = REDUCE ? 4000 : Math.max(0, now - P.t0);
  if (!P.bg[P.i]) {   // fundo parado, pintado uma vez (um pouco mais largo, para a câmera escorregar)
    const c = document.createElement("canvas"); c.width = W + PROL_PAN; c.height = H;
    S.paint(prolBrush(c.getContext("2d")), c.width, H, sceneRng(9100 + P.i * 77)); P.bg[P.i] = c;
  }
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = "#06060c"; x.fillRect(0, 0, W, cv.height);
  x.save(); x.beginPath(); x.rect(0, top, W, H); x.clip(); x.translate(0, top);
  x.drawImage(P.bg[P.i], -Math.round(Math.min(PROL_PAN, REDUCE ? PROL_PAN / 2 : t / 1000 * 1.4)), 0);
  S.draw(x, W, H, t, P.looks);
  x.restore();
  if (dark > 0) { x.globalAlpha = Math.min(1, dark); x.fillStyle = "#06060c"; x.fillRect(0, 0, W, cv.height); x.globalAlpha = 1; }   // o escuro da troca de quadro
}
