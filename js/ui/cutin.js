/* Cinemática de abertura da batalha (estilo Metaphor: ReFantazio).
   "first": o Rhanon acertou primeiro -> close nos olhos dele acendendo, veias de energia, faixas e corte seco.
   "ambush": o bicho pegou o Rhanon desprevenido -> faixa vermelha curta de perigo.
   cb roda com a tela coberta pelo flash final (é ali que a batalha começa).
   Com cutin/eyes em data/art.js, o close usa a imagem; sem ela, os olhos são desenhados aqui em pixel art. */
const EYE_W = 96, EYE_H = 36, EYES = [27, 69], EYE_Y = 19;

// veia de energia: passeio aleatório fixo a partir de (x, y), puxado na direção (dx, dy), com galhos
function makeVein(x, y, dx, dy, len, seed, out = []) {
  const pts = [];
  for (let i = 0; i < len; i++) {
    const r = rand(seed + i * 3.1);
    if (r < .5) { x += dx; y += dy; } else if (r < .75) x += Math.sign(dx) || (r < .62 ? 1 : -1); else y += Math.sign(dy) || (r < .87 ? 1 : -1);
    pts.push([x, y]);
    if (i > 3 && rand(seed + i * 7.7) < .12) makeVein(x, y, dy || dx, dx || dy, Math.floor(len / 3), seed + i * 13, out);
  }
  out.push(pts);
  return out;
}
const EYE_VEINS = EYES.map((cx, k) => {
  const s = k ? 1 : -1, v = [];   // s: lado de fora do rosto (-1 olho esquerdo, +1 direito)
  makeVein(cx + s * 13, EYE_Y + 2, s, 1, 16, 11 + k * 50, v);     // canto de fora, descendo
  makeVein(cx + s * 4, EYE_Y + 7, 0, 1, 14, 23 + k * 50, v);      // abaixo do olho
  makeVein(cx - s * 11, EYE_Y + 5, -s, 1, 10, 37 + k * 50, v);    // canto de dentro, para o nariz
  makeVein(cx + s * 9, EYE_Y - 6, s, -1, 9, 41 + k * 50, v);      // acima, para a testa
  return v;
});

function drawEyesBase(x, open) {
  x.clearRect(0, 0, EYE_W, EYE_H);
  x.fillStyle = "#c98a56"; x.fillRect(0, 0, EYE_W, EYE_H);
  x.fillStyle = "#b47a48"; x.fillRect(0, 28, EYE_W, 8);
  x.fillStyle = "#a86f40"; x.fillRect(46, 24, 4, 8);   // sombra do nariz
  for (const cx of EYES) {
    const rx = 14, ry = 1 + 6 * open;
    fillEllipse(x, cx, EYE_Y, rx + 1, ry + 1.5, "#7a4a2e");
    fillEllipse(x, cx, EYE_Y, rx, ry, "#f4ecd8");
    x.fillStyle = "#1b1a24";   // pálpebra de cima grossa, com cílio no canto de fora
    for (let px = cx - rx; px <= cx + rx; px++) { const top = Math.round(EYE_Y - ry * Math.sqrt(Math.max(0, 1 - ((px - cx) / rx) ** 2))); x.fillRect(px, top - 2, 1, 2); }
    const s = cx < EYE_W / 2 ? -1 : 1;
    x.fillRect(cx + s * (rx + 1), EYE_Y - 2, 2 * s, 1); x.fillRect(cx + s * (rx + 2), EYE_Y - 3, 2 * s, 1);
  }
  x.fillStyle = "#1b1a24";   // sobrancelhas franzidas
  for (let i = 0; i < 24; i++) { x.fillRect(14 + i, 8 + Math.floor(i / 7), 1, 2); x.fillRect(82 - i, 8 + Math.floor(i / 7), 1, 2); }
  x.fillStyle = "#2a2230"; x.fillRect(0, 0, EYE_W, 4);   // franja em pontas, algumas passando por cima dos olhos
  for (let i = 0; i < 16; i++) {
    const x0 = i * 6.2 - 2 + rand(i * 5.3) * 3, w = 5 + rand(i * 2.7) * 4, len = 5 + rand(i * 9.1) * 15, tip = x0 + w / 2 + (rand(i * 4.4) - .5) * 6;
    for (let y = 0; y < len; y++) {
      const k = y / len, l = x0 + (tip - x0) * k, r = x0 + w + (tip - x0 - w) * k;
      x.fillStyle = y > len - 2 ? "#16121c" : "#2a2230"; x.fillRect(Math.round(l), y + 4, Math.max(1, Math.round(r - l)), 1);
      if (y < len * .5 && i % 3 === 0) { x.fillStyle = "#554a66"; x.fillRect(Math.round(l + 1), y + 4, 1, 1); }
    }
  }
}
function drawEyesGlow(x, open, p) {
  x.clearRect(0, 0, EYE_W, EYE_H);
  if (open > .3) for (const cx of EYES) {
    const ry = 1 + 6 * open;
    for (let py = EYE_Y - 7; py <= EYE_Y + 7; py++) for (let px = cx - 7; px <= cx + 7; px++) {
      const d = Math.hypot(px + .5 - cx, py + .5 - EYE_Y);
      if (d > 5.6 || ((px + .5 - cx) / 14) ** 2 + ((py + .5 - EYE_Y) / ry) ** 2 > 1) continue;
      x.fillStyle = d < 1.6 ? "#fffbe0" : d < 3.4 ? "#ffc040" : d < 4.8 ? "#ff8a1a" : "#d8401a"; x.fillRect(px, py, 1, 1);
    }
    x.fillStyle = "#ffffff"; x.fillRect(cx - 3, EYE_Y - 3, 2, 1); x.fillRect(cx - 3, EYE_Y - 2, 1, 1);
  }
  EYE_VEINS.forEach(veins => veins.forEach(pts => {
    const n = Math.floor(pts.length * p);
    for (let i = 0; i < n; i++) { const [vx, vy] = pts[i]; x.fillStyle = i > n - 3 ? "#fff3c0" : "#ffa020"; x.fillRect(vx, vy, 1, 1); }
  }));
}

function battleCutin(kind, cb) {
  const el = $("cutin");
  if (REDUCE) { cb(); return; }
  el.className = "cutin " + kind; el.hidden = false;
  cutinSound(kind);
  if (kind === "ambush") {
    el.innerHTML = '<div class="ci-dim"></div><div class="ci-band ci-b1"></div><div class="ci-band ci-b2"></div><div class="ci-bang">!</div><div class="ci-sub">DESPREVENIDO!</div><div class="ci-flash"></div>';
    setTimeout(() => el.classList.add("out"), 650);
    setTimeout(cb, 720);
    setTimeout(() => { el.hidden = true; el.innerHTML = ""; }, 1000);
    return;
  }
  el.innerHTML = '<div class="ci-dim"></div><div class="ci-band ci-b1"></div><div class="ci-band ci-b2"></div>' +
    '<div class="ci-strip"><div class="ci-zoom"></div></div><h2 class="title ci-name"></h2><div class="ci-sub">ATACA PRIMEIRO!</div><div class="ci-flash"></div>';
  ransom(el.querySelector(".ci-name"), ["RHANON"], 5);
  const zoom = el.querySelector(".ci-zoom"), art = artCanvas("cutin/eyes");
  let stop = false;
  if (art) { art.className = "ci-art"; zoom.appendChild(art); }
  else {
    const base = document.createElement("canvas"), glow = document.createElement("canvas");
    base.width = glow.width = EYE_W; base.height = glow.height = EYE_H; glow.className = "ci-glow";
    zoom.append(base, glow);
    const bx = base.getContext("2d"), gx = glow.getContext("2d"), t0 = performance.now();
    const frame = t => {
      if (stop) return;
      const e = t - t0, open = e < 300 ? .15 : Math.min(1, .15 + (e - 300) / 120 * .85), p = Math.max(0, Math.min(1, (e - 380) / 620));
      drawEyesBase(bx, open); drawEyesGlow(gx, open, p);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  setTimeout(() => el.querySelector(".ci-strip")?.classList.add("ci-shake"), 380);
  setTimeout(() => el.classList.add("out"), 1250);
  setTimeout(cb, 1320);
  setTimeout(() => { stop = true; el.hidden = true; el.innerHTML = ""; }, 1700);
}
