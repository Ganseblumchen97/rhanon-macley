/* Atores animados: Rhanon, bichos, Rhanon da tela inicial e marcador andando no mapa. */
/* ===== Animação dos personagens (no estilo do mascote da vitrine) =====
   O Rhanon é montado por partes a cada quadro (cabeça, tronco e pernas com pose), pisca,
   respira, pula com sombra e reage a cada ação. Os bichos usam o desenho pronto e ganham
   respiração, movimento próprio de cada espécie, entrada em cena, ataque, dano e queda.
   Tudo é desenhado num canvas pequeno e ampliado, então o movimento anda "de pixel em pixel". */
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* relógio da batalha: igual a performance.now(), mas para durante a "pausa de impacto" (hitStop) do golpe que acerta,
   assim Rhanon e o bicho congelam juntos por um instante e voltam do mesmo ponto */
let ANIM_LAG = 0, HITSTOP_END = 0;
const animNow = () => performance.now() - ANIM_LAG;
function hitStop(ms) {
  if (REDUCE) return;
  HITSTOP_END = Math.max(HITSTOP_END, performance.now() + ms);
  // a investida do Rhanon e o tremor do bicho (animações do navegador) também param
  // (só as que estão rodando: play() numa animação já terminada, como a entrada em cena, recomeçaria ela do zero)
  const an = ["hero", "beast"].flatMap(id => $(id).getAnimations({subtree: true})).filter(a => a.playState === "running");
  an.forEach(a => a.pause()); setTimeout(() => an.forEach(a => a.playState === "paused" && a.play()), ms);
}
/* ---------- ator do Rhanon (batalha e desafios): visto de costas, montado pelo esqueleto (gfx/rig.js) ---------- */
const HERO_FIT = .7;   // tamanho de 1 pixel do desenho em relação ao --px do palco (arte 32x44 mais fina que a antiga)
function makeHeroActor() {
  const W = 48, H = 56, SX = 8, SY = 10;   // o desenho 32x44 fica com os pés na linha 54; linha 55 é a sombra
  let cv = null, g = null, look = null, weaponOn = true, state = "idle", since = 0, mode = "battle", lastFx = 0, stT = 0;
  let k = 1;   // resolução extra quando há arte em imagem (hero/battle em data/art.js)
  const artCache = {};
  // quadro da arte do estado atual (hero/battle/<estado> ou hero/battle); null sem arte
  function heroArt(t) {
    const key = IMG["hero/battle/" + state] ? "hero/battle/" + state : "hero/battle", a = IMG[key];
    if (!a) return null;
    const f = Math.floor(t / 150) % a.frames;
    return artCache[key + f] || (artCache[key + f] = artCanvas(key, f));
  }
  const set = (s) => { state = s; since = animNow(); lastFx = 0; };
  function mount(el, opts = {}) {
    look = rhanonLook(); weaponOn = !!opts.weapon;
    mode = opts.mode || "battle";
    k = IMG["hero/battle"] ? IMG["hero/battle"].scale : 1;
    cv = document.createElement("canvas"); cv.width = W * k; cv.height = H * k;
    cv.className = "spr actor"; cv.style.setProperty("--n", W * HERO_FIT);
    const m = v => (v * .75 * HERO_FIT).toFixed(2);
    cv.style.margin = `calc(var(--px) * -${m(SY)}) calc(var(--px) * -${m(SX)}) calc(var(--px) * -${m(1)}) calc(var(--px) * -${m(SX)})`;
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    set(opts.state || "idle");
    return cv;
  }
  // ponto do canvas (em pixels do desenho) para a grade das partículas
  function grid(lx, ly) {
    const r = cv.getBoundingClientRect(), u = r.width / W;
    return PFX.toGrid(r.left + lx * u, r.top + ly * u);
  }
  function draw(t) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, battle = mode === "battle";
    const pose = {...(battle ? RIG_LEGS.stance : RIG_LEGS.stand), weapon: weaponOn ? "up" : null};
    let lift = 0, ox = 0, flash = false, rot = 0, flip = false, coil = false;
    const breathe = REDUCE ? 0 : Math.floor(t / (battle ? 420 : 650)) % 2;
    const walk = speed => { const f = Math.floor(t / speed) % 4; Object.assign(pose, RIG_LEGS[["walkA", "stand", "walkB", "stand"][f]]); pose.dy = f % 2 ? 0 : 1; };
    switch (state) {
      case "idle":
        pose.dy = breathe;
        if (p && battle) {
          if (p.def) { pose.dy = 1; if (weaponOn) pose.weapon = "guard"; }
          if (p.preso > 0) coil = true;
          if (p.medo > 0) {   // com medo: joelhos juntos, encolhido, tremendo e suando
            Object.assign(pose, {lf: [14, 40], rf: [18, 40], dy: 1, lean: -1}); if (weaponOn) pose.weapon = "guard";
            ox = REDUCE ? 0 : Math.floor(t / 45) % 2 ? 1 : -1;
            if (t - lastFx > 420 && !REDUCE) { lastFx = t; const [gx, gy] = grid(SX + (Math.random() < .5 ? 6 : 26), SY + 6); PFX.emit("drop", ["#86d6ff", "#ffffff"], gx, gy, (Math.random() - .5) * 6, -4, .8, {grav: 40}); }
          }
        }
        break;
      case "scared":   // levou um susto (chocalho, uivo): pula para trás com "!!" e fica tremendo
        Object.assign(pose, {lf: [14, 40], rf: [18, 40], lean: -2}); if (weaponOn) pose.weapon = "guard";
        lift = el < 200 ? Math.sin(el / 200 * Math.PI) * 4 : 0; ox = el < 300 ? -3 : Math.floor(t / 40) % 2 ? 1 : -1;
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 22, SY - 4); PFX.emit("bang", ["#86d6ff"], gx, gy, 0, -6, .8); PFX.emit("bang", ["#86d6ff"], gx + 2, gy, 0, -6, .8); }
        if (el > 800) set("idle");
        break;
      case "walk": walk(110); break;
      case "stab":    // lança de perto: recua, estoca para frente e volta à guarda
        pose.lean = el < 180 ? -1 : el < 620 ? 2 : 0; pose.weapon = el >= 180 && el < 620 ? "stab" : "guard";
        if (el > 850) set("idle");
        break;
      case "throw":   // jogar a lança: ergue para trás, arremessa (fica sem a lança) e pega outra de volta
        if (el < 330) { pose.weapon = "raise"; pose.lean = -1; pose.dy = 1; }
        else { pose.weapon = el > 1000 ? "up" : null; pose.lean = el < 600 ? 2 : 0; pose.rh = el < 600 ? [28, 22] : undefined; }
        if (el > 1150) set("idle");
        break;
      case "aim":     // flecha com calma: puxa a corda aos poucos (até 1,7 s), solta e segura o arco
        pose.weapon = el < 1700 ? "bowdraw" : "bow"; pose.pull = Math.min(5, Math.floor(el / 300)); pose.lean = el < 1700 ? 0 : 1;
        if (el > 2300) set("idle");
        break;
      case "blow":    // tocha: ergue ao lado da cabeça e assopra o fogo
        pose.weapon = "torchup"; pose.f = Math.floor(t / 70) % 3; pose.lean = el > 450 && el < 1100 ? 1 : 0;
        if (el > 2100) set("idle");
        break;
      case "cast":    // especial de água, vento ou raio: ergue a lança, segura no alto e aponta para o bicho
        pose.weapon = el < 650 ? "up" : el < 1100 ? "diag" : "guard"; pose.lean = el > 650 && el < 1100 ? 1 : 0; pose.dy = el < 650 ? 1 : 0;
        if (!lastFx && el > 450) { lastFx = 1; const [gx, gy] = grid(SX + 27, SY + 2); PFX.burst(6, "star", ["#ffffff", "#bff3ff"], gx, gy, 12, {life: .5}); }
        if (el > 1400) set("idle");
        break;
      case "ready": {   // chefe apareceu: gira a lança (para cima, diagonal, para trás...), firma a guarda e a ponta brilha
        const spin = ["up", "diag", "raise", "diag", "up", "guard"], k = Math.min(spin.length - 1, Math.floor(el / 95));
        if (weaponOn) pose.weapon = spin[k]; pose.dy = k === spin.length - 1 ? 1 : 0; pose.lean = k === spin.length - 1 ? 1 : 0;
        lift = el < 380 ? Math.round(Math.sin(el / 380 * Math.PI) * 3) : 0;
        if (!lastFx && el > 600) { lastFx = 1; const [gx, gy] = grid(SX + 27, SY + 4); PFX.burst(8, "star", ["#ffffff", "#bff3ff", "#ffd23a"], gx, gy, 16, {life: .6}); PFX.burst(5, "ring", ["#ffffff"], gx, gy, 10, {life: .4}); }
        if (el > 1300) set("idle");
        break;
      }
      case "guard":
        pose.dy = 1; if (weaponOn) pose.weapon = "guard";
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 16, SY + 22); PFX.burst(6, "ring", ["#bff3ff", "#ffffff"], gx, gy, 18, {life: .5}); }
        if (el > 600) set("idle");
        break;
      case "cheer":   // acerto na entrevista: pulinho com notas
        lift = Math.max(0, Math.sin(Math.min(1, el / 380) * Math.PI) * 6);
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 16, SY); PFX.burst(4, "note", ["#ffffff", "#ffd200"], gx, gy, 14, {life: .9, up: 10}); }
        if (el > 700) set("idle");
        break;
      case "hurt":
        pose.lean = -2; ox = el < 120 ? -3 : el < 260 ? -1 : 0;
        flash = el < 60 || (el > 120 && el < 170);
        if (el > 420) set("idle");
        break;
      case "eat":
        lift = Math.max(0, Math.sin(Math.min(1, el / 380) * Math.PI) * 5);
        if (!lastFx && el > 250) { lastFx = 1; const [gx, gy] = grid(SX + 16, SY + 4); PFX.burst(5, "heart", ["#ff6b8a", "#ff9fb4"], gx, gy, 14, {life: .9, up: 10}); }
        if (el > 900) set("idle");
        break;
      case "observe":
        pose.lean = 1;
        if (!lastFx) { lastFx = 1; const [gx, gy] = grid(SX + 22, SY - 4); PFX.emit("q", ["#ffffff"], gx, gy, 0, -5, .55); }
        if (lastFx === 1 && el > 520) { lastFx = 2; const [gx, gy] = grid(SX + 23, SY - 4); PFX.emit("bang", ["#ffd200"], gx, gy, 0, -6, .7); sfx("blip"); }
        if (el > 900) set("idle");
        break;
      case "victory": {
        if (el < 1300 && !REDUCE) {
          const ph = (el % 650) / 650, jump = Math.floor(el / 650) + 1;
          lift = Math.sin(ph * Math.PI) * 9; if (!(ph > .1 && ph < .9)) Object.assign(pose, RIG_LEGS.stand);
          if (jump !== lastFx) { lastFx = jump; const [gx, gy] = grid(SX + 16, SY + 6); PFX.burst(9, "star", ["#ffd200", "#ffffff", "#7dff9a"], gx, gy, 24, {life: .9}); }
        } else pose.dy = breathe;
        if (weaponOn) pose.weapon = "raise";
        break;
      }
      case "defeat":
        rot = 1; pose.weapon = null;
        if (!lastFx && el > 260) { lastFx = 1; const [gx, gy] = grid(24, H - 3); PFX.burst(8, "puff", ["#d8d2c0", "#a89f8a"], gx, gy, 14, {life: .6, up: 3}); }
        break;
      case "flee":
        flip = true; walk(70);
        if (t - lastFx > 120) { lastFx = t; const [gx, gy] = grid(SX + 22, H - 2); PFX.emit("puff", ["#d8d2c0", "#bdb39a"], gx, gy, 6, -3, .4); }
        break;
    }
    if (REDUCE) lift = 0;

    g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    // sombra no chão: encolhe quando ele pula
    g.fillStyle = "rgba(0,0,0,.3)";
    const sw = rot ? 40 : Math.max(8, 22 - Math.round(lift));
    g.fillRect(Math.round((W - sw) / 2) + ox, H - 1, sw, 1);

    const art = heroArt(t), base = art || rigCanvas("back", pose, look, 1), src = flash ? whiteOf(base) : base;
    // arte em imagem: pés na mesma linha do desenho de 32x44
    const put = () => art ? g.drawImage(src, 16 - art.width / k / 2, 44 - art.height / k, art.width / k, art.height / k) : g.drawImage(src, 0, 0);
    g.save();
    if (rot) { g.translate(2, H - 1); g.rotate(-Math.PI / 2); put(); }
    else {
      const bx = SX + ox, by = SY - Math.round(lift);
      if (flip) { g.translate(bx + 32, by); g.scale(-1, 1); } else g.translate(bx, by);
      put();
    }
    g.restore();
    // derrota: estrelinhas girando sobre a cabeça
    if (state === "defeat" && !REDUCE) for (let i = 0; i < 3; i++) {
      const a = t / 300 + i * 2.1;
      glyphP(g, "star", "#ffd200", 6 + Math.cos(a) * 6, H - 32 + Math.sin(a) * 2);
    }
    // cobra apertando (sucuri e Cobra-Grande)
    if (coil && !rot) {
      const sh = Math.floor(t / 160) % 2;
      for (const y of [SY + 26, SY + 32]) { g.fillStyle = "#5d8a3a"; g.fillRect(SX + 6, y + sh, 22, 3); g.fillStyle = "#2a3a1c"; for (let x = SX + 7; x < SX + 28; x += 4) g.fillRect(x, y + sh, 2, 1); }
    }
    // efeitos de estado: fedor, veneno, sangramento
    if (battle && p && t - stT > 260 && !REDUCE && state !== "defeat") {
      stT = t;
      const [gx, gy] = grid(SX + 10 + Math.random() * 12, SY + 4);
      if (p.weak > 0) PFX.emit("wave", ["#9bd34a", "#c9e870"], gx, gy, (Math.random() - .5) * 4, -6, .9, {wob: 3});
      if (p.dot && p.dot.t > 0) PFX.emit(p.dot.n === "Veneno" ? "ring" : "drop", p.dot.n === "Veneno" ? ["#b06ad6", "#d6a6ff"] : ["#e03a2f", "#ff6b6b"], gx, gy + 14, 0, p.dot.n === "Veneno" ? -6 : 8, .7);
    }
  }
  return {mount, draw, set, get state() { return state; }, get canvas() { return cv; },
    // tamanho de 1 pixel do desenho; offsetWidth ignora as animações de escala (investida), senão as partículas do palco "grudam" no herói
    unit() { return cv && cv.isConnected ? cv.offsetWidth / W : 0; },
    // anima o canvas inteiro (entrar e fugir de cena), sem mexer na posição do contêiner
    slide(fromX, toX, ms, after) {
      if (!cv) return;
      const an = cv.animate([{transform: `translateX(${fromX})`}, {transform: `translateX(${toX})`}], {duration: REDUCE ? 1 : ms, easing: `steps(${Math.max(4, Math.round(ms / 50))})`, fill: "forwards"});
      an.onfinish = () => after && after();
    }};
}

/* ---------- ator dos bichos (e de quem mais for desenhado pronto) ---------- */
function makeBeastActor() {
  let cv = null, g = null, base = null, white = null, w = 0, h = 0, f = 1, k = 1, CW = 0, CH = 0, kind = "", motion = "", state = "idle", since = 0, lastFx = 0, nextHop = 0, info = {}, swT = 0, rig = null;
  const whites = new WeakMap(), whiteFrame = c => whites.get(c) || (whites.set(c, whiteOf(c)), whites.get(c));
  const MX = 6, MT = 8, MB = 2;
  const set = (s) => { state = s; since = animNow(); lastFx = 0; };
  function mount(el, src, opts = {}) {
    // w/h em pixels do jogo; k = resolução extra da arte em imagem (data-scale)
    k = +src.dataset.scale || 1; base = src; w = src.width / k; h = src.height / k; f = opts.boss ? 1.35 : 1; kind = opts.id || ""; info = opts;
    // bicho alto demais para o palco (harpia, chefes): diminui um pouco para os pés ficarem na plataforma e a cabeça aparecer
    if (opts.fit) {
      const st = $("stage"), unit = src.getBoundingClientRect().width / w;   // tamanho de 1 pixel do desenho, já com o tamanho de chefe
      const room = st.clientHeight * (parseFloat(getComputedStyle(st).getPropertyValue("--plat")) || 46) / 100 + 12 - 8;   // até a plataforma (--plat em styles.css)
      if (MOTION[kind] === "hover") el.style.top = h * unit > room ? `${Math.round(8 + 4 * unit)}px` : el.style.top;   // voando: fica no alto, sem encolher
      else {
        if (unit && h * unit > room) f *= Math.max(opts.boss ? .75 : .82, room / (h * unit));
        el.style.top = `calc(var(--plat) - ${(h * f).toFixed(2)} * var(--px) + 12px)`;
      }
    }
    motion = MOTION[kind] || (opts.person ? "person" : "");
    rig = src.dataset.rig || null;   // traço novo (gfx/beasts.js): cada estado tem seu quadro desenhado   // olho (desenho em código) para o "X" do desmaio
    white = whiteOf(src);
    CW = w + MX * 2; CH = h + MT + MB;
    cv = document.createElement("canvas"); cv.width = Math.round(CW * k); cv.height = Math.round(CH * k);
    cv.className = "spr actor"; cv.style.setProperty("--n", CW * f);
    if (src.style.filter) cv.style.filter = src.style.filter;
    const u = n => `calc(var(--px) * -${(n * f).toFixed(2)})`;
    cv.style.margin = `${u(MT)} ${u(MX)} ${u(MB)} ${u(MX)}`;
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    nextHop = animNow() + 1500;
    set(opts.state || "idle");
    return cv;
  }
  function grid(lx, ly) {
    const r = cv.getBoundingClientRect(), u = r.width / CW;
    return PFX.toGrid(r.left + lx * u, r.top + ly * u);
  }
  // desenha o sprite com a parte de cima "respirando" e, nas cobras, ondulando
  function body(img, x, y, t, o) {
    const split = Math.round(h * .55), wave = motion === "sway" || motion === "swim";
    if (wave && !REDUCE) {
      for (let yy = 0; yy < h; yy++) {
        const amp = motion === "swim" ? .9 : 1.2, freq = motion === "swim" ? .5 : .35;
        const dx = Math.round(Math.sin(t / (motion === "swim" ? 200 : 320) + yy * freq) * amp * (yy < h * .8 ? 1 : .3));
        g.drawImage(img, 0, yy * k, w * k, k, x + dx, y + yy + (yy < split ? o.dy : 0), w, 1);
      }
      return;
    }
    g.drawImage(img, 0, split * k, w * k, (h - split) * k, x, y + split, w, h - split);
    g.drawImage(img, 0, 0, w * k, split * k, x, y + o.dy, w, split);
  }
  function draw(t) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, o = {dy: 0};
    let lift = 0, ox = 0, flash = false, lie = 0, scale = 1, sx = 1, sy = 1, shake = 0, alpha = 1;
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
      case "prep":     // vai atacar: fica agachado, tremendo (hora de se preparar para o Z)
        sx = 1.05; sy = .88; ox = REDUCE ? 0 : Math.floor(t / 55) % 2 ? 1 : -1;
        break;
      case "windup":   // ataque: agacha (encolhe), dá o bote esticado para frente e volta
        if (el < 170) { sx = 1.06; sy = .86; ox = 2; }
        else if (el < 330) {
          sx = 1.1; sy = .95; ox = -5; lift = motion === "swim" ? 0 : 3;
          if (!lastFx) { lastFx = 1; for (let i = 0; i < 3; i++) { const [gx, gy] = grid(MX + w, MT + h * (.3 + i * .2)); PFX.emit("dot", ["#ffffff", "#e8e4dc"], gx, gy, 18, 0, .3); } }
        } else ox = -Math.round((520 - el) / 60);
        if (el > 520) set("idle");
        break;
      case "bigroar":   // apresentação do chefe: cresce e treme por mais tempo, soltando ondas e um anel de choque
        scale = 1 + (Math.floor(el / 90) % 2) * .12; shake = 1;
        if (!lastFx || el - lastFx > 160) {
          lastFx = el || 1; const [gx, gy] = grid(MX + 2, MT + h * .4);
          PFX.emit("wave", ["#ffffff", "#ff6b4a"], gx - 2, gy, -18, -5, .6); PFX.emit("wave", ["#ffffff"], gx - 2, gy + 3, -18, 4, .6);
          if (el < 200) PFX.burst(10, "ring", ["#ffffff", "#ff6b4a"], gx + 4, gy, 30, {life: .6});
        }
        if (el > 1150) set("idle");
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
      case "defeat": {   // levanta com o golpe, desaba e fica deitado de olhos em "X", com estrelinhas na cabeça
        if (el < 280) { flash = Math.floor(el / 60) % 2 === 0; lift = Math.round(Math.sin(el / 280 * Math.PI) * 5); ox = Math.round(el / 90); }
        else {
          ox = 3; lie = Math.min(1, (el - 280) / 240);
          if (lie === 1 && lastFx === 0) { lastFx = 1; const [gx, gy] = grid(CW / 2, CH - 3); PFX.burst(12, "puff", ["#d8d2c0", "#a89f8a", "#ffffff"], gx, gy, 20, {life: .7, up: 4}); sfx("guard"); }
          if (el > 520 && el < 640) lift = 1;   // quiquezinho ao bater no chão
          if (el > 2600) alpha = Math.floor(el / 90) % 2 ? .35 : .8;
        }
        break;
      }
    }
    // traço novo: o quadro desenhado já faz agachar/bote/golpe/desmaio, sem esticar o sprite
    let rp = null;
    if (rig) {
      sx = sy = scale = 1;
      rp = state === "prep" ? "crouch" : state === "windup" ? (el < 170 ? "crouch" : el < 330 ? "attack" : "idle") : state === "roar" || state === "bigroar" ? "attack" : state === "hurt" ? "hurt" : state === "defeat" ? (lie ? "ko" : "hurt") : "idle";
      if (rp === "idle" && t % 3400 < 140) rp = "blink";   // pisca de vez em quando
    }
    g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, CW, CH);
    g.globalAlpha = alpha;
    g.fillStyle = "rgba(0,0,0,.3)";
    const sw = Math.max(6, Math.round(w * .8) - lift * 2);
    g.fillRect(Math.round((CW - sw) / 2), CH - 1, sw, 1);
    const img = flash ? white : base;
    if (shake) ox += Math.floor(t / 40) % 2 ? 1 : -1;
    if (rp) {
      const fr = beastFrame(rig, rp, rp === "idle" || rp === "blink" ? o.dy % 2 : 0), x0 = MX + ox, y0 = MT - lift;
      g.drawImage(flash ? whiteFrame(fr) : fr, x0, y0, w, h);
      if (state === "defeat" && rp === "ko" && !REDUCE) {
        const [hx, hy] = fr.dataset.head.split(",").map(n => n / k);
        for (let i = 0; i < 3; i++) { const a = t / 280 + i * 2.1; glyphP(g, "star", i === 1 ? "#ffffff" : "#ffd200", x0 + hx - 1 + Math.cos(a) * 6, y0 + hy - 7 + Math.sin(a) * 2); }
      }
    } else if (lie) {
      // arte em imagem (PNG) deitada: as patas "dobram" para baixo do corpo (as linhas de baixo somem no chão) e o corpo achata um pouco
      const legless = motion === "sway" || motion === "swim";   // cobras e peixes: sem patas para dobrar
      const sink = Math.round((legless ? h * .1 : h * .22) * lie), vis = h - sink, x0 = MX + ox - Math.round(w * .03 * lie), y0 = MT + sink - lift;
      g.drawImage(img, 0, 0, w * k, vis * k, x0, y0, Math.round(w * (1 + .06 * lie)), vis);
      const ex = x0 + w * .2, ey = y0 + h * .3;   // cabeça (à esquerda)
      if (state === "defeat" && lie === 1 && !REDUCE) for (let i = 0; i < 3; i++) {
        const a = t / 280 + i * 2.1;
        glyphP(g, "star", i === 1 ? "#ffffff" : "#ffd200", ex - 1 + Math.cos(a) * 6, ey - 6 + Math.sin(a) * 2);
      }
    } else if (sx !== 1 || sy !== 1) {   // agachar/esticar: encolhe ou estica a partir dos pés
      const sw2 = Math.round(w * sx), sh2 = Math.round(h * sy);
      g.drawImage(img, MX + ox - (sw2 - w) / 2, MT + h - sh2 - lift, sw2, sh2);
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
    dust() { if (!cv) return; const [gx, gy] = grid(CW / 2, CH - 2); PFX.burst(10, "puff", ["#d8d2c0", "#a89f8a"], gx, gy, 18, {life: .6, up: 3}); },
    bang() { if (!cv) return; const [gx, gy] = grid(CW / 2, 1); PFX.emit("bang", ["#ffd200"], gx, gy, 0, -4, .9); }};
}
const HERO_A = makeHeroActor(), BEAST_A = makeBeastActor();

/* ---------- Rhanon na tela inicial: respira, pisca, senta na fogueira e pula quando clicado ---------- */
const TITLE_A = (() => {
  const W = 56, H = 48;   // desenho do esqueleto 32x44 com espaço para a lança deitada e a fogueira
  let cv = null, g = null, look = null, state = "idle", since = 0, nextAct = 0, blinkUntil = 0, nextBlink = 0, lastFx = 0;
  const set = s => { state = s; since = performance.now(); lastFx = 0; };
  function mount(el) {
    look = rhanonLook();
    cv = document.createElement("canvas"); cv.width = W; cv.height = H; cv.className = "spr title-actor"; cv.style.setProperty("--n", W * 40 / 56);
    el.innerHTML = ""; el.appendChild(cv); g = cv.getContext("2d");
    cv.addEventListener("click", () => { if (state !== "hop") { sfx("blip"); set("hop"); for (let i = 0; i < 2; i++) emitLocal("note", ["#ffffff", "#ffd200"], 28 + (i ? 8 : -8), 4, i ? 6 : -6, -12, 1); } });
    nextAct = performance.now() + 4000; set("idle");
  }
  let parts2 = [];
  function emitLocal(glyph, colors, x, y, vx, vy, life) { parts2.push({glyph, color: colors[Math.floor(Math.random() * colors.length)], x, y, vx, vy, life}); }
  function draw(t, dt) {
    if (!cv || !cv.isConnected || !cv.offsetParent) return;
    const el = t - since, pose = {dy: Math.floor(t / 650) % 2, weapon: "up"};
    let lift = 0, fire = false;
    if (t > nextBlink) { blinkUntil = t + 140; nextBlink = t + 2000 + Math.random() * 3500; }
    if (t < blinkUntil) pose.face = "blink";
    if (REDUCE) pose.dy = 0;
    if (state === "idle" && t > nextAct && !REDUCE) set("camp");
    if (state === "camp") {   // senta na fogueira um tempo, com a lança deitada no chão
      pose.sit = true; pose.weapon = null; fire = true;
      if (el > 1500 && el < 1700) pose.face = "happy";
      if (el > 8000) { set("idle"); nextAct = t + 6000 + Math.random() * 5000; }
    }
    if (state === "hop") { lift = Math.sin(Math.min(1, el / 380) * Math.PI) * 6; pose.face = "happy"; if (el > 380) set("idle"); }
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(0,0,0,.28)";
    const sw = Math.max(8, 22 - Math.round(lift));
    g.fillRect(Math.round(24 - sw / 2), H - 1, sw, 1);
    if (fire) { spearShaft(g, 1, H - 2, 18, H - 2); pxl(g, 19, H - 2, "#cfd8dc"); pxl(g, 20, H - 2, "#eef3f5"); }
    g.drawImage(rigCanvas("front", pose, look, 1), 8, H - 43 - Math.round(lift));   // pés (linha 41 do desenho) logo acima da sombra
    if (fire) {
      // fogueira e fumaça
      const fx = 48, fy = H - 2, k = Math.floor(t / 90) % 3;
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
    // andando: de perfil (o marcador espelha para a esquerda); parado: de frente, respirando
    const c = /^walk\d$/.test(key) ? rigSideCanvas({step: key, dy: key === "walk0" || key === "walk2" ? 1 : 0}, rhanonLook(), OW_SCALE)
      : rigCanvas("front", {dy: key.endsWith("1") ? 1 : 0}, rhanonLook(), OW_SCALE);
    return cache[sig] = c.toDataURL();
  }
  const st = {mk: {x: null, face: 1, moveT: 0, key: ""}, lmk: {x: null, face: 1, moveT: 0, key: ""}};
  function setup(id, size) {
    const g = $(id); if (!g || g.dataset.walker) return;
    g.dataset.walker = "1";
    g.innerHTML = `<ellipse rx="${size * .32}" ry="${size * .09}" fill="rgba(0,0,0,.35)"/><g class="wk"><image width="${size}" height="${size * 1.375}" x="${-size / 2}" y="${-size * 1.375 + 1}" style="image-rendering:pixelated"/></g>`;
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
      const key = walking ? "walk" + Math.floor(t / 110) % 4 : "stand" + (REDUCE ? 0 : Math.floor(t / 650) % 2);
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
    let dt = Math.min((t - last) / 1000, .05);
    if (t < HITSTOP_END) { ANIM_LAG += t - last; dt = 0; }   // pausa de impacto: o relógio da batalha não anda
    last = t;
    HERO_A.draw(t - ANIM_LAG); BEAST_A.draw(t - ANIM_LAG); TITLE_A.draw(t, dt); WALKER.tick(t); exploreFrame(t, dt);
    const battleOn = !$("stage").closest(".game")?.classList.contains("working-mode") && $("map").hidden && $("local").hidden && $("explore").hidden && $("titleScreen").hidden && mode === "hunt";
    if ($("titleScreen").hidden) PFX.frame(dt, HERO_A.unit() || 4, battleOn && $("over").hidden);
  }
  requestAnimationFrame(loop);
}
