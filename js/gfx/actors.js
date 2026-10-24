/* Atores animados: Rhanon, bichos, Rhanon da tela inicial e marcador andando no mapa. */
/* ===== Animação dos personagens (no estilo do mascote da vitrine) =====
   O Rhanon é montado por partes a cada quadro (cabeça, tronco e pernas com pose), pisca,
   respira, pula com sombra e reage a cada ação. Os bichos usam o desenho pronto e ganham
   respiração, movimento próprio de cada espécie, entrada em cena, ataque, dano e queda.
   Tudo é desenhado num canvas pequeno e ampliado, então o movimento anda "de pixel em pixel". */
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* ---------- ator do Rhanon ---------- */
function makeHeroActor() {
  const W = 32, H = 39, SX = 6, SY = 10;   // o sprite 20x28 fica com os pés na linha 37; linha 38 é a sombra
  let cv = null, g = null, parts = null, state = "idle", since = 0, nextBlink = 0, blinkUntil = 0, mode = "battle", lastFx = 0, stT = 0;
  const off = document.createElement("canvas"); off.width = 20; off.height = 28;
  const og = off.getContext("2d", {willReadFrequently: true});
  const set = (s) => { state = s; since = performance.now(); lastFx = 0; };
  function mount(el, opts = {}) {
    parts = heroParts(!opts.weapon);
    mode = opts.mode || "battle";
    cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    cv.className = "spr actor"; cv.style.setProperty("--n", W);
    cv.style.margin = `calc(var(--px) * -${SY * .75}) calc(var(--px) * -${SX * .75}) calc(var(--px) * -.75) calc(var(--px) * -${SX * .75})`;
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    set(opts.state || "idle");
    return cv;
  }
  // ponto do canvas (em pixels do desenho) para a grade das partículas
  function grid(lx, ly) {
    const r = cv.getBoundingClientRect(), u = r.width / W;
    return PFX.toGrid(r.left + lx * u, r.top + ly * u);
  }
  // lança de (x0, y0), a ponta, até (x1, y1)
  function spear(x0, y0, x1, y1) {
    lineP(g, x0, y0, x1, y1, "#7a4a1e");
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i < 2; i++) pxl(g, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, i ? "#cfd8dc" : "#eef3f5");
  }
  function draw(t) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, o = {legs: mode === "battle" ? "stance" : "stand", dy: 0, lean: 0, face: null};
    let lift = 0, ox = 0, flash = false, rot = 0, flip = false, weapon = parts.weapon ? "up" : null, extra = null;
    if (t > nextBlink) { blinkUntil = t + 140; nextBlink = t + 2000 + Math.random() * 3500; }
    if (t < blinkUntil) o.face = "blink";
    const breathe = Math.floor(t / (mode === "battle" ? 420 : 650)) % 2;
    switch (state) {
      case "idle":
        o.dy = REDUCE ? 0 : breathe;
        if (p && mode === "battle") {
          if (p.def) { o.dy = 1; weapon = parts.weapon ? "guard" : null; }
          if (p.preso > 0) extra = "coil";
        }
        break;
      case "walk": {
        const f = Math.floor(t / 110) % 4;
        o.legs = ["walkA", "stand", "walkB", "stand"][f]; o.dy = f % 2 ? 0 : 1;
        break;
      }
      case "throw":   // lança: puxa para trás e arremessa
        o.legs = "stance";
        if (el < 90) { o.lean = -1; weapon = "back"; }
        else if (el < 520) { o.lean = 1; weapon = null; extra = "arm"; }
        else set("idle");
        break;
      case "torch":
        o.legs = "stance"; o.lean = el < 420 ? 1 : 0; weapon = "torch";
        if (el > 650) set("idle");
        break;
      case "guard":
        o.legs = "stance"; o.dy = 1; weapon = parts.weapon ? "guard" : null;
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 10, SY + 14); PFX.burst(6, "ring", ["#bff3ff", "#ffffff"], gx, gy, 18, {life: .5}); }
        if (el > 600) set("idle");
        break;
      case "cheer":   // acerto na entrevista: pulinho com notas
        lift = REDUCE ? 0 : Math.max(0, Math.sin(Math.min(1, el / 380) * Math.PI) * 5); o.face = "happy";
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 10, SY); PFX.burst(4, "note", ["#ffffff", "#ffd200"], gx, gy, 14, {life: .9, up: 10}); }
        if (el > 700) set("idle");
        break;
      case "hurt":
        o.face = "hurt"; o.lean = -1; ox = el < 120 ? -2 : el < 260 ? -1 : 0;
        flash = el < 60 || (el > 120 && el < 170);
        if (el > 420) set("idle");
        break;
      case "eat":
        lift = REDUCE ? 0 : Math.max(0, Math.sin(Math.min(1, el / 380) * Math.PI) * 4);
        o.face = el > 200 ? "happy" : null; extra = el < 650 ? "food" : null;
        if (!lastFx && el > 250) { lastFx = 1; const [gx, gy] = grid(SX + 10, SY + 2); PFX.burst(5, "heart", ["#ff6b8a", "#ff9fb4"], gx, gy, 14, {life: .9, up: 10}); }
        if (el > 900) set("idle");
        break;
      case "observe":
        o.lean = 1; extra = "brow";
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 14, SY - 7); PFX.emit("q", ["#ffffff"], gx, gy, 0, -5, .55); }
        if (lastFx === 1 && el > 520) { lastFx = 2; const [gx, gy] = grid(SX + 15, SY - 7); PFX.emit("bang", ["#ffd200"], gx, gy, 0, -6, .7); sfx("blip"); }
        if (el > 900) set("idle");
        break;
      case "victory": {
        if (el < 1300 && !REDUCE) {
          const ph = (el % 650) / 650, jump = Math.floor(el / 650) + 1;
          lift = Math.sin(ph * Math.PI) * 8; o.legs = ph > .1 && ph < .9 ? "stance" : "stand";
          if (jump !== lastFx) {
            lastFx = jump; const [gx, gy] = grid(SX + 10, SY + 4);
            PFX.burst(9, "star", ["#ffd200", "#ffffff", "#7dff9a"], gx, gy, 24, {life: .9});
          }
        } else o.dy = breathe;
        o.face = "happy"; weapon = parts.weapon ? "raise" : null;
        break;
      }
      case "defeat":
        rot = 1; o.face = "blink"; weapon = null;
        if (!lastFx && el > 260) { lastFx = 1; const [gx, gy] = grid(16, H - 3); PFX.burst(8, "puff", ["#d8d2c0", "#a89f8a"], gx, gy, 14, {life: .6, up: 3}); }
        break;
      case "flee": {
        flip = true;
        const f = Math.floor(t / 70) % 4;
        o.legs = ["walkA", "stand", "walkB", "stand"][f]; o.dy = f % 2 ? 0 : 1;
        if (t - lastFx > 120) { lastFx = t; const [gx, gy] = grid(SX + 14, H - 2); PFX.emit("puff", ["#d8d2c0", "#bdb39a"], gx, gy, 6, -3, .4); }
        break;
      }
    }
    if (REDUCE) lift = 0;

    g.clearRect(0, 0, W, H);
    // sombra no chão: encolhe quando ele pula
    g.fillStyle = "rgba(0,0,0,.3)";
    const sw = rot ? 26 : Math.max(6, 14 - Math.round(lift));
    g.fillRect(Math.round((W - sw) / 2) + ox, H - 1, sw, 1);

    og.clearRect(0, 0, 20, 28);
    drawHero(og, parts, o);
    shadeCanvas(off);
    // braço estendido no arremesso, mão na testa ao observar, comida na boca
    if (extra === "arm") { og.fillStyle = parts.pal.s; og.fillRect(18, 19, 2, 1); og.fillStyle = parts.pal.k; og.fillRect(18, 18, 2, 1); og.fillRect(18, 20, 2, 1); }
    if (extra === "brow") { og.fillStyle = parts.pal.s; og.fillRect(13 + o.lean, 9, 4, 1); og.fillStyle = parts.pal.k; og.fillRect(13 + o.lean, 8, 4, 1); }
    if (extra === "food") { og.fillStyle = "#7a4a1e"; og.fillRect(9, 13, 3, 2); og.fillStyle = "#f4ecd8"; og.fillRect(9, 13, 1, 2); }
    const src = flash ? whiteOf(off) : off;

    g.save();
    if (rot) { g.translate(2, H - 1); g.rotate(-Math.PI / 2); g.drawImage(src, 0, 0); }
    else {
      const bx = SX + ox, by = SY - Math.round(lift);
      if (flip) { g.translate(bx + 20, by); g.scale(-1, 1); } else g.translate(bx, by);
      g.drawImage(src, 0, 0);
      // arma (coordenadas do sprite)
      if (weapon === "up") spear(19, o.dy, 19, 27);
      else if (weapon === "back") spear(21, 1, 16, 27);
      else if (weapon === "raise") spear(19, -6, 19, 21);
      else if (weapon === "guard") spear(21, 18, -1, 21);
      else if (weapon === "torch") {
        lineP(g, 18, 22, 21, 15, "#7a4a1e");
        const f = Math.floor(t / 70) % 3, fl = [["#ffd23a", "#f2740c", "#d62828"], ["#fff3a0", "#ffd23a", "#f2740c"], ["#ffd23a", "#d62828", "#f2740c"]][f];
        pxl(g, 21, 14, fl[0]); pxl(g, 22, 14, fl[1]); pxl(g, 21, 13, fl[1]); pxl(g, 22, 13, fl[0]); pxl(g, 21 + (f % 2), 12, fl[2]); pxl(g, 22, 15, fl[2]);
      }
    }
    g.restore();
    // derrota: estrelinhas girando sobre a cabeça
    if (state === "defeat" && !REDUCE) for (let i = 0; i < 3; i++) {
      const a = t / 300 + i * 2.1;
      glyphP(g, "star", "#ffd200", 4 + Math.cos(a) * 5, H - 22 + Math.sin(a) * 2);
    }
    // cobra apertando (sucuri e Cobra-Grande)
    if (extra === "coil" && !rot) {
      const sh = Math.floor(t / 160) % 2;
      for (const y of [SY + 18, SY + 22]) { g.fillStyle = "#5d8a3a"; g.fillRect(SX + 1, y + sh, 18, 2); g.fillStyle = "#2a3a1c"; for (let x = SX + 2; x < SX + 19; x += 4) g.fillRect(x, y + sh, 2, 1); }
    }
    // efeitos de estado: fedor, veneno, sangramento
    if (mode === "battle" && p && t - stT > 260 && !REDUCE && state !== "defeat") {
      stT = t;
      const [gx, gy] = grid(SX + 6 + Math.random() * 8, SY + 2);
      if (p.weak > 0) PFX.emit("wave", ["#9bd34a", "#c9e870"], gx, gy, (Math.random() - .5) * 4, -6, .9, {wob: 3});
      if (p.dot && p.dot.t > 0) PFX.emit(p.dot.n === "Veneno" ? "ring" : "drop", p.dot.n === "Veneno" ? ["#b06ad6", "#d6a6ff"] : ["#e03a2f", "#ff6b6b"], gx, gy + 10, 0, p.dot.n === "Veneno" ? -6 : 8, .7);
    }
  }
  return {mount, draw, set, get state() { return state; }, get canvas() { return cv; }, unit() { return cv && cv.isConnected ? cv.getBoundingClientRect().width / W : 0; },
    // anima o canvas inteiro (entrar e fugir de cena), sem mexer na posição do contêiner
    slide(fromX, toX, ms, after) {
      if (!cv) return;
      const an = cv.animate([{transform: `translateX(${fromX})`}, {transform: `translateX(${toX})`}], {duration: REDUCE ? 1 : ms, easing: `steps(${Math.max(4, Math.round(ms / 50))})`, fill: "forwards"});
      an.onfinish = () => after && after();
    }};
}

/* ---------- ator dos bichos (e de quem mais for desenhado pronto) ---------- */
function makeBeastActor() {
  let cv = null, g = null, base = null, white = null, w = 0, h = 0, f = 1, kind = "", motion = "", state = "idle", since = 0, lastFx = 0, nextHop = 0, info = {}, swT = 0;
  const MX = 6, MT = 8, MB = 2;
  const set = (s) => { state = s; since = performance.now(); lastFx = 0; };
  function mount(el, src, opts = {}) {
    base = src; w = src.width; h = src.height; f = opts.boss ? 1.35 : 1; kind = opts.id || ""; info = opts;
    // bicho alto demais para o palco (harpia, chefes): diminui um pouco para os pés ficarem na plataforma e a cabeça aparecer
    if (opts.fit) {
      const st = $("stage"), unit = src.getBoundingClientRect().width / w;   // tamanho de 1 pixel do desenho, já com o tamanho de chefe
      const room = st.clientHeight * .46 + 12 - 8;
      if (MOTION[kind] === "hover") el.style.top = h * unit > room ? `${Math.round(8 + 4 * unit)}px` : el.style.top;   // voando: fica no alto, sem encolher
      else {
        if (unit && h * unit > room) f *= Math.max(opts.boss ? .75 : .82, room / (h * unit));
        el.style.top = `calc(46% - ${(h * f).toFixed(2)} * var(--px) + 12px)`;
      }
    }
    motion = MOTION[kind] || (opts.person ? "person" : "");
    white = whiteOf(src);
    cv = document.createElement("canvas"); cv.width = w + MX * 2; cv.height = h + MT + MB;
    cv.className = "spr actor"; cv.style.setProperty("--n", cv.width * f);
    if (src.style.filter) cv.style.filter = src.style.filter;
    const u = n => `calc(var(--px) * -${(n * f).toFixed(2)})`;
    cv.style.margin = `${u(MT)} ${u(MX)} ${u(MB)} ${u(MX)}`;
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    nextHop = performance.now() + 1500;
    set(opts.state || "idle");
    return cv;
  }
  function grid(lx, ly) {
    const r = cv.getBoundingClientRect(), u = r.width / cv.width;
    return PFX.toGrid(r.left + lx * u, r.top + ly * u);
  }
  // desenha o sprite com a parte de cima "respirando" e, nas cobras, ondulando
  function body(img, x, y, t, o) {
    const split = Math.round(h * .55), wave = motion === "sway" || motion === "swim";
    if (wave && !REDUCE) {
      for (let yy = 0; yy < h; yy++) {
        const amp = motion === "swim" ? .9 : 1.2, k = motion === "swim" ? .5 : .35;
        const dx = Math.round(Math.sin(t / (motion === "swim" ? 200 : 320) + yy * k) * amp * (yy < h * .8 ? 1 : .3));
        g.drawImage(img, 0, yy, w, 1, x + dx, y + yy + (yy < split ? o.dy : 0), w, 1);
      }
      return;
    }
    g.drawImage(img, 0, split, w, h - split, x, y + split, w, h - split);
    g.drawImage(img, 0, 0, w, split, x, y + o.dy, w, split);
  }
  function draw(t) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, o = {dy: 0};
    let lift = 0, ox = 0, flash = false, rot = 0, scale = 1, shake = 0, alpha = 1;
    const period = motion === "slow" ? 1300 : motion === "slow2" ? 900 : motion === "person" ? 700 : 480;
    o.dy = REDUCE ? 0 : Math.floor(t / period) % 2;
    // movimento de cada espécie enquanto espera
    if (state === "idle" && !REDUCE) {
      if (motion === "hover") { lift = 2 + Math.round(Math.sin(t / 260) * 2); o.dy = Math.floor(t / 180) % 2; }
      if (motion === "swim") lift = Math.round(Math.sin(t / 380));
      if (motion === "jitter") ox = Math.floor(t / 300) % 3 === 0 ? -1 : 0;
      if (motion === "hop" && t > nextHop) { nextHop = t + 1400 + Math.random() * 1600; set("hop"); }
      if (motion === "curl" && Math.floor(t / 2600) % 3 === 2) o.dy = 2;
      if (motion === "snort" && t - lastFx > 2400) { lastFx = t; const [gx, gy] = grid(MX - 1, MT + h * .45); PFX.emit("puff", ["#e8e4dc"], gx, gy, -8, -2, .5); PFX.emit("puff", ["#e8e4dc"], gx, gy + 1, -10, 0, .45); }
      if (info.boss && t - lastFx > 140) {
        lastFx = t; const [gx, gy] = grid(MX + Math.random() * w, MT + h * (.3 + Math.random() * .6));
        PFX.emit("dot", AURA[kind] || ["#ffd23a"], gx, gy, 0, -9 - Math.random() * 6, .9);
      }
      if (mode === "hunt" && e && e.assustada && !info.person) {
        ox = Math.floor(t / 60) % 2 ? 1 : -1;
        if (t - swT > 420) { swT = t; const [gx, gy] = grid(MX + w * .3, MT); PFX.emit("drop", ["#86d6ff", "#ffffff"], gx, gy, -6, -10, .8, {grav: 50}); }
      }
    }
    switch (state) {
      case "hop":
        lift = Math.round(Math.sin(Math.min(1, el / 420) * Math.PI) * 5);
        if (el > 420) set("idle");
        break;
      case "enter":
        o.dy = 0;
        break;
      case "windup":   // ataque: recua e estica
        ox = el < 140 ? 2 : -2; o.dy = el < 140 ? 1 : 0;
        if (el > 520) set("idle");
        break;
      case "roar":
        scale = 1 + (Math.floor(el / 110) % 2) * .08; shake = 1;
        if (!lastFx || el - lastFx > 220) {
          lastFx = el || 1; const [gx, gy] = grid(MX + 2, MT + h * .4);
          PFX.emit("wave", ["#ffffff", "#ffd23a"], gx - 2, gy, -14, -4, .5); PFX.emit("wave", ["#ffffff"], gx - 2, gy + 3, -14, 3, .5);
        }
        if (el > 650) set("idle");
        break;
      case "hurt":
        ox = el < 100 ? 3 : el < 220 ? 2 : el < 320 ? 1 : 0;
        flash = el < 60 || (el > 110 && el < 160);
        if (el > 450) set("idle");
        break;
      case "defeat": {
        if (el < 260) { flash = Math.floor(el / 60) % 2 === 0; lift = Math.round(Math.sin(el / 260 * Math.PI) * 4); }
        else {
          rot = 1;
          if (lastFx === 0) { lastFx = 1; const [gx, gy] = grid(cv.width / 2, cv.height - 3); PFX.burst(12, "puff", ["#d8d2c0", "#a89f8a", "#ffffff"], gx, gy, 20, {life: .7, up: 4}); sfx("guard"); }
          if (el > 2200) alpha = Math.floor(el / 90) % 2 ? .35 : .8;
        }
        break;
      }
    }
    g.clearRect(0, 0, cv.width, cv.height);
    g.globalAlpha = alpha;
    g.fillStyle = "rgba(0,0,0,.3)";
    const sw = Math.max(6, Math.round(w * .8) - lift * 2);
    g.fillRect(Math.round((cv.width - sw) / 2), cv.height - 1, sw, 1);
    const img = flash ? white : base;
    if (shake) ox += Math.floor(t / 40) % 2 ? 1 : -1;
    if (rot) {
      // nocauteado: de barriga para cima (espelhado na vertical, sem distorcer os pixels)
      g.save(); g.translate(MX, MT + h); g.scale(1, -1);
      g.drawImage(img, 0, 0, w, h);
      g.restore();
      if (state === "defeat" && !REDUCE) {
        for (let i = 0; i < 3; i++) {
          const a = t / 300 + i * 2.1;
          glyphP(g, "star", "#ffd200", cv.width / 2 - 1 + Math.cos(a) * 6, MT + h * .35 + Math.sin(a) * 2);
        }
      }
    } else if (scale !== 1) {
      const sw2 = Math.round(w * scale), sh2 = Math.round(h * scale);
      g.drawImage(img, MX + ox - (sw2 - w) / 2, MT + h - sh2 - lift, sw2, sh2);
    } else body(img, MX + ox, MT - lift, t, o);
    g.globalAlpha = 1;
  }
  return {mount, draw, set, get state() { return state; }, get canvas() { return cv; },
    slide(fromX, toX, ms, after) {
      if (!cv) return;
      const an = cv.animate([{transform: `translateX(${fromX})`}, {transform: `translateX(${toX})`}], {duration: REDUCE ? 1 : ms, easing: `steps(${Math.max(4, Math.round(ms / 50))})`, fill: "forwards"});
      an.onfinish = () => after && after();
    },
    dust() { if (!cv) return; const [gx, gy] = grid(cv.width / 2, cv.height - 2); PFX.burst(10, "puff", ["#d8d2c0", "#a89f8a"], gx, gy, 18, {life: .6, up: 3}); },
    bang() { if (!cv) return; const [gx, gy] = grid(cv.width / 2, 1); PFX.emit("bang", ["#ffd200"], gx, gy, 0, -4, .9); }};
}
const HERO_A = makeHeroActor(), BEAST_A = makeBeastActor();

/* ---------- Rhanon na tela inicial: respira, pisca, senta na fogueira e pula quando clicado ---------- */
const TITLE_A = (() => {
  const W = 40, H = 34;
  let cv = null, g = null, parts = null, state = "idle", since = 0, nextAct = 0, blinkUntil = 0, nextBlink = 0, lastFx = 0;
  const off = document.createElement("canvas"); off.width = 20; off.height = 28;
  const og = off.getContext("2d", {willReadFrequently: true});
  const set = s => { state = s; since = performance.now(); lastFx = 0; };
  function mount(el) {
    parts = heroParts(false);
    cv = document.createElement("canvas"); cv.width = W; cv.height = H; cv.className = "spr title-actor"; cv.style.setProperty("--n", W);
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    cv.addEventListener("click", () => { if (state !== "hop") { sfx("blip"); set("hop"); for (let i = 0; i < 2; i++) emitLocal("note", ["#ffffff", "#ffd200"], 18 + (i ? 6 : -6), 4, i ? 6 : -6, -12, 1); } });
    nextAct = performance.now() + 4000; set("idle");
  }
  let parts2 = [];
  function emitLocal(glyph, colors, x, y, vx, vy, life) { parts2.push({glyph, color: colors[Math.floor(Math.random() * colors.length)], x, y, vx, vy, life}); }
  function draw(t, dt) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, o = {legs: "stand", dy: Math.floor(t / 650) % 2, face: null};
    let lift = 0, fire = false;
    if (t > nextBlink) { blinkUntil = t + 140; nextBlink = t + 2000 + Math.random() * 3500; }
    if (t < blinkUntil) o.face = "blink";
    if (REDUCE) o.dy = 0;
    if (state === "idle" && t > nextAct && !REDUCE) set("camp");
    if (state === "camp") {   // senta na fogueira um tempo
      o.legs = "sit"; fire = true;
      if (el > 1500 && el < 1700) o.face = "happy";
      if (el > 8000) { set("idle"); nextAct = t + 6000 + Math.random() * 5000; }
    }
    if (state === "hop") { lift = Math.sin(Math.min(1, el / 380) * Math.PI) * 6; if (el > 380) set("idle"); }
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(0,0,0,.28)";
    const sw = Math.max(6, 14 - Math.round(lift));
    g.fillRect(Math.round(12 - sw / 2) + 8, H - 1, sw, 1);
    og.clearRect(0, 0, 20, 28);
    drawHero(og, parts, o); shadeCanvas(off);
    const by = H - 29 - Math.round(lift);
    g.drawImage(off, 10, by);
    if (!fire) { lineP(g, 29, by + o.dy, 29, by + 27, "#7a4a1e"); pxl(g, 29, by + o.dy, "#eef3f5"); pxl(g, 29, by + o.dy + 1, "#cfd8dc"); }
    else {
      // lança deitada, fogueira e fumaça
      lineP(g, 2, H - 2, 12, H - 2, "#7a4a1e"); pxl(g, 1, H - 2, "#cfd8dc");
      const fx = 34, fy = H - 2, k = Math.floor(t / 90) % 3;
      lineP(g, fx - 3, fy, fx + 3, fy - 1, "#5a3a1c"); lineP(g, fx - 3, fy - 1, fx + 3, fy, "#7a4a1e");
      const fl = [["#ffd23a", "#f2740c", "#d62828"], ["#fff3a0", "#ffd23a", "#f2740c"], ["#ffd23a", "#d62828", "#f2740c"]][k];
      g.fillStyle = fl[2]; g.fillRect(fx - 2, fy - 3, 5, 2);
      g.fillStyle = fl[1]; g.fillRect(fx - 1, fy - 5, 3, 2 + (k === 1 ? 1 : 0));
      g.fillStyle = fl[0]; g.fillRect(fx - (k % 2), fy - 6 - (k === 2 ? 1 : 0), 1, 2);
      if (t - lastFx > 380) { lastFx = t; emitLocal("dot", ["#c9c4b8", "#9e9a90"], fx + (Math.random() - .5) * 2, fy - 8, (Math.random() - .3) * 3, -5, 2.2); }
    }
    parts2 = parts2.filter(q => (q.life -= dt) > 0);
    for (const q of parts2) { q.x += q.vx * dt; q.y += q.vy * dt; glyphP(g, q.glyph, q.color, q.x, q.y); }
  }
  return {mount, draw};
})();

/* ---------- marcador do mapa: o Rhanon andando pelas trilhas ---------- */
const WALKER = (() => {
  const cache = {};
  function frame(key) {
    const sig = key + JSON.stringify(G?.equip || {}) + (G?.job ? 1 : 0) + (G?.betterJob ? 1 : 0);
    if (cache[sig]) return cache[sig];
    const parts = heroParts(true), c = document.createElement("canvas"); c.width = 20; c.height = 28;
    const legs = key.startsWith("walkA") ? "walkA" : key.startsWith("walkB") ? "walkB" : "stand";
    drawHero(c.getContext("2d"), parts, {legs, dy: key.endsWith("1") ? 1 : 0});
    shadeCanvas(c);
    return cache[sig] = c.toDataURL();
  }
  const st = {mk: {x: null, face: 1, moveT: 0, key: ""}, lmk: {x: null, face: 1, moveT: 0, key: ""}};
  function setup(id, size) {
    const g = $(id); if (!g || g.dataset.walker) return;
    g.dataset.walker = "1";
    g.innerHTML = `<ellipse rx="${size * .32}" ry="${size * .09}" fill="rgba(0,0,0,.35)"/><g class="wk"><image width="${size}" height="${size * 1.4}" x="${-size / 2}" y="${-size * 1.4 + 1}" style="image-rendering:pixelated"/></g>`;
  }
  function tick(t) {
    for (const [id, size] of [["mk", 30], ["lmk", 26]]) {
      const g = $(id); if (!g || !g.closest(".over") || g.closest(".over").hidden) continue;
      setup(id, size);
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute("transform") || ""), s = st[id];
      if (!m) continue;
      const x = +m[1], y = +m[2];
      if (s.x !== null && (Math.abs(x - s.x) > .01 || Math.abs(y - s.y) > .01)) { s.moveT = t; if (Math.abs(x - s.x) > .01) s.face = x > s.x ? 1 : -1; }
      s.x = x; s.y = y;
      const walking = t - s.moveT < 140;
      const key = walking ? ["walkA1", "stand0", "walkB1", "stand0"][Math.floor(t / 110) % 4] : "stand" + (REDUCE ? 0 : Math.floor(t / 650) % 2);
      const k2 = key + s.face;
      if (k2 !== s.key) {
        s.key = k2;
        g.querySelector("image").setAttribute("href", frame(key));
        g.querySelector(".wk").setAttribute("transform", s.face < 0 ? "scale(-1 1)" : "");
      }
    }
  }
  return {tick};
})();

// toda vez que o jogo redesenha o herói, ele vira um ator animado
function refreshHero(noWeapon = false) { HERO_A.mount($("hero"), {weapon: !noWeapon, mode: mode === "hunt" ? "battle" : "calm"}); }

/* ---------- laço único de animação ---------- */
function startAnimationLoop() {
  let last = performance.now();
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min((t - last) / 1000, .05); last = t;
    HERO_A.draw(t); BEAST_A.draw(t); TITLE_A.draw(t, dt); WALKER.tick(t); exploreFrame(t, dt);
    const battleOn = !$("stage").closest(".game")?.classList.contains("working-mode") && $("map").hidden && $("local").hidden && $("explore").hidden && $("titleScreen").hidden && mode === "hunt";
    if ($("titleScreen").hidden) PFX.frame(dt, HERO_A.unit() || 4, battleOn && $("over").hidden);
  }
  requestAnimationFrame(loop);
}
