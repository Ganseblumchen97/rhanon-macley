/* Efeitos de combate (lança, fogo, números, explosões) e partículas sobre o palco. */
// reinicia uma animação CSS no elemento
function anim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function pos(el) {
  const s = $("fx").getBoundingClientRect(), r = el.getBoundingClientRect();
  return {x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2};
}
/* ===== efeitos de ataque e números de dano em pixel art ===== */
function px(c, sc) { c.style.width = c.width * sc + "px"; c.style.imageRendering = "pixelated"; c.className = "fxi"; return c; }
function gridC(rows, pal, sc) {
  const c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = rows[0].length; c.height = rows.length;
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } }));
  return px(c, sc);
}
// flecha voando: haste clara, ponta de pedra e penas vermelhas
function arrowC(sc) {
  const c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = 16; c.height = 5;
  x.fillStyle = "#c9a46a"; x.fillRect(2, 2, 11, 1);
  x.fillStyle = "#cfd8dc"; x.fillRect(13, 1, 2, 3); x.fillRect(15, 2, 1, 1);
  x.fillStyle = "#e5001c"; x.fillRect(0, 1, 3, 1); x.fillRect(0, 3, 3, 1);
  return px(c, sc);
}
// lança voando (deitada, ponta para a direita): mesma madeira e ponta de pedra do Rhanon
function spearC(sc) {
  const c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = 26; c.height = 5;
  const sl = spearLook();
  spearShaft(x, 0, 1, 21, 1, sl.p);
  if (sl.band) { x.fillStyle = sl.band; x.fillRect(18, 0, 2, 3); }
  x.fillStyle = "#1a1426"; x.fillRect(21, 0, 3, 4); x.fillRect(24, 1, 2, 2);
  x.fillStyle = sl.m; x.fillRect(22, 1, 2, 2); x.fillRect(24, 1, 1, 1);
  return px(c, sc);
}
function numC(str, col, sc) {
  const g = [...str].map(ch => GL[ch === "\u2212" ? "-" : ch]).filter(Boolean), c = document.createElement("canvas"), x = c.getContext("2d");
  c.width = g.length * 4 + 1; c.height = 7;
  const dot = (i, k, dx, dy) => x.fillRect(1 + i * 4 + k % 3 + dx, 1 + (k / 3 | 0) + dy, 1, 1);
  x.fillStyle = "#1a0f0a";
  g.forEach((b, i) => { for (let k = 0; k < 15; k++) if (b[k] === "1") for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) dot(i, k, dx, dy); });
  x.fillStyle = col;
  g.forEach((b, i) => { for (let k = 0; k < 15; k++) if (b[k] === "1") dot(i, k, 0, 0); });
  return px(c, sc);
}
function el$(cls, css) { const d = document.createElement("div"); d.className = "fxi " + cls; Object.assign(d.style, css); $("fx").appendChild(d); return d; }
function rm(a, ms, kf, ease, delay) { const an = a.animate(kf, {duration: ms, easing: ease || "steps(10)", delay: delay || 0, fill: "both"}); an.onfinish = () => a.remove(); return an; }
function shake(cls = "gshake") { const g = $("game"); g.classList.remove("gshake", "gshake-s"); void g.offsetWidth; g.classList.add(cls); }
/* peso do golpe que acerta: "leve" (golpe comum), "forte" (crítico, perfeito, golpe grande) e "furia".
   Pausa de impacto (hitStop), tremor da tela na medida e, nos fortes, um clarão e o palco "socando" para perto. */
const IMPACT = {leve: {stop: 55, shake: "gshake-s"}, forte: {stop: 110, shake: "gshake", flash: .45, punch: true}, furia: {stop: 170, shake: "gshake", flash: .7, punch: true}};
function hitImpact(level) {
  const o = IMPACT[level] || IMPACT.leve;
  hitStop(o.stop); shake(o.shake); padRumble(level);   // controle treme junto (ui/gamepad.js)
  if (REDUCE) return;
  if (o.flash) rm(el$("flash", {}), 160, [{opacity: o.flash}, {opacity: 0}], "steps(3)");
  if (o.punch) anim($("stage"), "punch");
}
function burst(q, cols, n, r) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n + Math.random() * .6, d = r * (.6 + Math.random() * .6), s = 6 + (Math.random() * 6 | 0);
    const p = el$("fxp", {left: q.x + "px", top: q.y + "px", width: s + "px", height: s + "px", marginLeft: -s / 2 + "px", marginTop: -s / 2 + "px", background: cols[i % cols.length]});
    rm(p, 520, [{transform: "translate(0,0)", opacity: 1}, {transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 14}px) scale(.3)`, opacity: 0}]);
  }
  [45, -45].forEach(deg => {
    const f = el$("fxp", {left: q.x + "px", top: q.y + "px", width: r * 1.6 + "px", height: "10px", marginLeft: -r * .8 + "px", marginTop: "-5px", background: "#fff"});
    rm(f, 240, [{transform: `rotate(${deg}deg) scale(.2)`, opacity: 1}, {transform: `rotate(${deg}deg) scale(1)`, opacity: 0}], "steps(6)");
  });
}
function slash(el) {
  const q = pos(el);
  [-16, 0, 16].forEach((o, i) => {
    const s = el$("fxp", {left: q.x + o + "px", top: q.y + "px", width: "8px", height: "90px", marginLeft: "-4px", marginTop: "-45px", background: i === 1 ? "#fff" : "#ffd23a"});
    rm(s, 320, [{transform: "rotate(35deg) scaleY(0)", opacity: 1}, {transform: "rotate(35deg) scaleY(1)", opacity: 1, offset: .5}, {transform: "rotate(35deg) scaleY(1)", opacity: 0}], "steps(8)", i * 70);
  });
}
function hurtFx(kind, d) {
  if (kind === "roar") burst(pos($("hero")), ["#e03a2f", "#f4ecd8"], 8, 50);
  else if (kind === "fire") burst(pos($("hero")), ["#ffd23a", "#f2740c", "#d62828"], 12, 60);
  else slash($("hero"));
  if (d >= 10) shake();
}
// estrela de impacto (moldura do n\u00famero cr\u00edtico): pontas em volta, contorno escuro, em pixels
function critStarC(w, h, sc) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), n = 10;
  c.width = w; c.height = h;
  const star = (gr, col) => {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, k = i % 2 ? .62 : 1; x.lineTo(w / 2 + Math.cos(a) * (w / 2 - gr) * k, h / 2 + Math.sin(a) * (h / 2 - gr) * k); }
    x.fillStyle = col; x.fill();
  };
  star(0, "#1a0f0a"); star(1.5, "#d62828"); star(4, "#f2740c");
  const im = x.getImageData(0, 0, w, h);   // sem meio-tom nas bordas: pixel cheio ou vazio
  for (let i = 3; i < im.data.length; i += 4) im.data[i] = im.data[i] > 110 ? 255 : 0;
  x.putImageData(im, 0, 0);
  return px(c, sc);
}
/* n\u00famero que salta do alvo. cls: "crit" = maior, amarelo, numa estrela de impacto; "strong" = golpe forte (laranja);
   tag = etiqueta pequena acima do n\u00famero (ex. "PERFEITO!"), que sobe junto sem cobrir o valor */
function pop(txt, el, cls, tag) {
  const s = $("fx").getBoundingClientRect(), r = el.getBoundingClientRect(), x = r.left - s.left + r.width / 2, y = r.top - s.top + Math.min(r.height * .3, 40);
  const num = /^[+\u2212-]?\d+$/.test(txt), col = {crit: "#ffd23a", strong: "#f2a20c", heal: "#7dff9a", me: "#ff5a4a"}[cls] || "#fff3c4";
  let d;
  if (num) {
    const n = numC(txt, col, cls === "crit" ? 9 : cls === "strong" ? 7 : 6);
    d = el$("popw", {});
    if (tag) { const t = document.createElement("div"); t.className = "banner mini"; t.textContent = tag; d.appendChild(t); }
    const box = document.createElement("div"); box.className = "popn"; d.appendChild(box);
    if (cls === "crit") { box.appendChild(critStarC(Math.max(17, txt.length * 4 + 11), 17, 7)).classList.add("popstar"); box.style.margin = "26px 0"; }   // espaço para a estrela não cobrir a etiqueta
    n.className = ""; box.appendChild(n);
  }
  else { d = el$("banner", {}); d.textContent = txt; }
  d.style.left = x + "px"; d.style.top = y + "px";
  rm(d, 1050, [
    {transform: "translate(-50%,0) scale(.3)", opacity: 0},
    {transform: "translate(-50%,-16px) scale(1.4)", opacity: 1, offset: .15},
    {transform: "translate(-50%,-10px) scale(1)", opacity: 1, offset: .3},
    {transform: "translate(-50%,-34px) scale(1)", opacity: 1, offset: .8},
    {transform: "translate(-50%,-48px) scale(1)", opacity: 0}
  ], "steps(24)");
  if (cls === "crit" && num) burst({x, y}, ["#f2a20c", "#fff"], 8, 50);
}
/* ---------- partículas sobre o palco (grade de pixels igual à do herói) ---------- */
const PFX = (() => {
  let cv = null, g = null, P = 4, list = [], amb = 0;
  function ensure() {
    const st = $("stage"); if (!st) return false;
    if (!cv || !cv.isConnected) {
      cv = document.createElement("canvas"); cv.className = "pfx"; cv.setAttribute("aria-hidden", "true");
      st.appendChild(cv); g = cv.getContext("2d");
    }
    return true;
  }
  function resize(unit) {
    const r = $("stage").getBoundingClientRect();
    P = unit || P;
    const w = Math.ceil(r.width / P), h = Math.ceil(r.height / P);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = w * P + "px"; cv.style.height = h * P + "px";
  }
  // converte um ponto da tela (px) para a grade das partículas
  function toGrid(sx, sy) { const r = $("stage").getBoundingClientRect(); return [(sx - r.left) / P, (sy - r.top) / P]; }
  function emit(glyph, colors, x, y, vx, vy, life, o = {}) {
    if (!ensure()) return;
    list.push({glyph, color: colors[Math.floor(Math.random() * colors.length)], x, y, vx, vy, life, max: life, grav: o.grav || 0, blink: o.blink, drag: o.drag || 0, wob: o.wob || 0, ph: Math.random() * 6});
  }
  function burst(n, glyph, colors, x, y, speed = 22, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (.5 + Math.random() * .7);
      emit(glyph, colors, x, y, Math.cos(a) * v, Math.sin(a) * v - (o.up || 6), (o.life || .7) + Math.random() * .4, o);
    }
  }
  // clima de cada lugar enquanto a batalha acontece
  function ambient(dt) {
    if (REDUCE || !cv) return;
    amb -= dt; if (amb > 0) return;
    const W = cv.width, H = cv.height, z = curZone;
    // folhas caem só pela metade de cima do palco, longe da placa com o nome do bicho
    const lx = () => W * (.3 + Math.random() * .7);
    if (z === "rio" || z === "igarape" || z === "manguezal" || z === "mangueilha" || z === "lencois" || z === "encontro" || z === "beira" || z === "pantanal" || z === "rioprata" || z === "varzea") { amb = .45; emit("ring", ["#bff3ff", "#86d6ff"], Math.random() * W, H * (.78 + Math.random() * .18), 0, -5 - Math.random() * 4, 3, {wob: 3}); }
    else if (z === "fechada") {
      amb = .4;
      if (Math.random() < .3) emit("leaf", ["#1f5a32", "#2f7a3f", "#7a6a2a"], lx(), -3, 3 + Math.random() * 3, 6 + Math.random() * 4, 6, {wob: 6});
      else emit("dot", ["#c9f2a8", "#f4ffd8"], Math.random() * W, H * (.3 + Math.random() * .6), 0, -2 - Math.random() * 2, 4, {blink: true, wob: 2});
    } else {
      amb = .5;
      if (Math.random() < .8) emit("dot", ["#f4ff7a", "#e9ff4a"], Math.random() * W, H * (.25 + Math.random() * .6), (Math.random() - .5) * 3, -1.5, 4.5, {blink: true, wob: 4});
      else emit("leaf", ["#3d8a4d", "#6fbf4a", "#a6d65a"], lx(), -3, 3 + Math.random() * 3, 5 + Math.random() * 3, 6, {wob: 5});
    }
  }
  function frame(dt, unit, battle) {
    if (!ensure()) return;
    resize(unit);
    if (battle) ambient(dt);
    g.clearRect(0, 0, cv.width, cv.height);
    list = list.filter(p => (p.life -= dt) > 0);
    for (const p of list) {
      p.vy += p.grav * dt; if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt * 3;
      if (p.blink && Math.sin(p.ph * 2.2) < -.3) continue;
      if (p.life < .25 && Math.floor(p.life * 20) % 2) continue;   // pisca antes de sumir
      glyphP(g, p.glyph, p.color, p.x + (p.wob ? Math.sin(p.ph) * p.wob * .3 : 0), p.y);
    }
  }
  return {emit, burst, frame, toGrid, clear() { list = []; }, get unit() { return P; }};
})();
