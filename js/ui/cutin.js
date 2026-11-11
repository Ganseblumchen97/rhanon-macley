/* Cinemática de abertura da batalha (estilo Metaphor: ReFantazio).
   "first": o Rhanon acertou primeiro -> close nos olhos: abrem, olham de lado, a sobrancelha fecha e eles acendem
            (chama saindo dos cantos, brasas subindo, veias de energia), faixas e corte seco.
   "ambush": o bicho pegou o Rhanon desprevenido -> ele leva o golpe, é empurrado para trás e segura firme (o bicho não aparece).
   "vs": ninguém acertou antes (treino, bugs do freela) -> os mesmos olhos, sem o "ATACA PRIMEIRO!".
   "boss": encontro com um chefe -> ele surge enorme, só a silhueta e os olhos vermelhos na fumaça; num clarão aparece
           rugindo e o Rhanon firma os pés contra o vento do rugido (a apresentação com "CUIDADO!" segue na batalha).
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

/* o rosto de cada um (heroi() em core/state.js): pele, cabelo e a luz dos olhos. O Rhanon acende em brasa (laranja);
   a Franciscane acende em luar (branco azulado com veias lilás), tem cílios compridos, olho mais amendoado,
   sobrancelha arqueada, franja castanha, as pontas das tranças nas bordas e continhas de semente na bochecha */
const CUTIN_FACE = {
  rhanon: {skin: "#c98a56", low: "#b47a48", nose: "#a86f40", lid: "#7a4a2e", hair: "#2a2230", hairD: "#16121c", hairL: "#554a66",
    glow: ["#fffbe0", "#ffc040", "#ff8a1a", "#d8401a"], vein: ["#ffa020", "#fff3c0"], almond: 0},
  fran:   {skin: "#e2aa7a", low: "#cf9568", nose: "#c08458", lid: "#8a5a3a", hair: "#5e3a22", hairD: "#3a2214", hairL: "#8e6040",
    glow: ["#ffffff", "#d8f4ff", "#8fd2ff", "#5a7ae0"], vein: ["#b48cff", "#f0e6ff"], almond: 1, lashes: true, arch: true, braids: true, beads: true}
};
const cutinFace = () => CUTIN_FACE[heroi() === "fran" ? "fran" : "rhanon"];
// o = {iris: desenha a íris escura (antes de acender), look: para onde ela olha (px), brow: 0 solta a 1 franzida, w: relógio do vento (ms)}
function drawEyesBase(x, open, o = {}) {
  const F = cutinFace(), br = o.brow ?? 1, wt = o.w || 0, dx = Math.round(o.look || 0);
  x.clearRect(0, 0, EYE_W, EYE_H);
  x.fillStyle = F.skin; x.fillRect(0, 0, EYE_W, EYE_H);
  x.fillStyle = F.low; x.fillRect(0, 28, EYE_W, 8);
  x.fillStyle = F.nose; x.fillRect(46, 24, 4, 8);   // sombra do nariz
  for (const cx of EYES) {
    const rx = 14, ry = 1 + 6 * open, s = cx < EYE_W / 2 ? -1 : 1;
    // amendoado: o canto de fora sobe um pouco (o olho inteiro fica mais fino nas pontas)
    const edge = px => F.almond ? Math.round(((px - cx) * s) / rx * 1.5) : 0;
    fillEllipse(x, cx, EYE_Y, rx + 1, ry + 1.5, F.lid);
    fillEllipse(x, cx, EYE_Y, rx, ry, "#f4ecd8");
    if (o.iris && open > .3) {
      fillEllipse(x, cx + dx, EYE_Y, 5.5, Math.min(5.5, ry), "#4a2c18"); fillEllipse(x, cx + dx, EYE_Y, 2.6, Math.min(2.6, ry), "#120c0c");
      x.fillStyle = "#ffffff"; x.fillRect(cx + dx - 3, EYE_Y - 3, 2, 1); x.fillRect(cx + dx - 3, EYE_Y - 2, 1, 1);
    }
    x.fillStyle = "#1b1a24";   // pálpebra de cima grossa, com cílio no canto de fora
    for (let px = cx - rx; px <= cx + rx; px++) { const top = Math.round(EYE_Y - ry * Math.sqrt(Math.max(0, 1 - ((px - cx) / rx) ** 2))) - Math.max(0, edge(px)); x.fillRect(px, top - 2, 1, F.lashes ? 3 : 2); }
    x.fillRect(cx + s * (rx + 1), EYE_Y - 2, 2 * s, 1); x.fillRect(cx + s * (rx + 2), EYE_Y - 3, 2 * s, 1);
    if (F.lashes) {   // cílios compridos saindo do canto de fora, e dois de baixo
      x.fillRect(cx + s * (rx + 3), EYE_Y - 5, 2 * s, 1); x.fillRect(cx + s * (rx + 4), EYE_Y - 6, 1 * s, 1);
      if (open > .5) { x.fillRect(cx + s * (rx - 2), EYE_Y + ry + 1, 1, 1); x.fillRect(cx + s * (rx - 5), EYE_Y + ry + 2, 1, 1); }
    }
  }
  x.fillStyle = "#1b1a24";
  const browY = i => Math.round(5.9 + br * 1.6 + i / 7 * (.4 + .6 * br));   // franzida: desce mais para o lado do nariz
  if (F.arch) for (let i = 0; i < 24; i++) { const y = 8 + Math.round(br) - Math.round(Math.sin(i / 23 * Math.PI) * 2); x.fillRect(14 + i, y, 1, 1 + (i > 4 && i < 18 ? 1 : 0)); x.fillRect(82 - i, y, 1, 1 + (i > 4 && i < 18 ? 1 : 0)); }   // sobrancelha arqueada e fina
  else for (let i = 0; i < 24; i++) { x.fillRect(14 + i, browY(i), 1, 2); x.fillRect(82 - i, browY(i), 1, 2); }   // sobrancelhas franzidas
  if (F.beads) for (const cx of EYES) { const s = cx < EYE_W / 2 ? -1 : 1; x.fillStyle = "#e2363d"; for (let i = 0; i < 3; i++) x.fillRect(cx + s * (4 + i * 4), 31 - (i % 2), 2, 2); }   // continhas de semente na bochecha
  else for (const cx of EYES) { const s = cx < EYE_W / 2 ? -1 : 1; x.fillStyle = "#e2363d"; x.fillRect(cx + s * 4, 31, 9 * s, 1); x.fillRect(cx + s * 6, 33, 7 * s, 1); }   // traços de pintura
  x.fillStyle = F.hair; x.fillRect(0, 0, EYE_W, 4);   // franja em pontas, algumas passando por cima dos olhos
  for (let i = 0; i < 16; i++) {
    const x0 = i * 6.2 - 2 + rand(i * 5.3) * 3, w = 5 + rand(i * 2.7) * 4, len = (F.braids ? 4 : 5) + rand(i * 9.1) * (F.braids ? 10 : 15), tip = x0 + w / 2 + (rand(i * 4.4) - .5) * 6 + Math.sin(wt / 170 + i * 1.3) * 1.8;
    for (let y = 0; y < len; y++) {
      const k = y / len, l = x0 + (tip - x0) * k, r = x0 + w + (tip - x0 - w) * k;
      x.fillStyle = y > len - 2 ? F.hairD : F.hair; x.fillRect(Math.round(l), y + 4, Math.max(1, Math.round(r - l)), 1);
      if (y < len * .5 && i % 3 === 0) { x.fillStyle = F.hairL; x.fillRect(Math.round(l + 1), y + 4, 1, 1); }
    }
  }
  if (F.braids) for (const s of [-1, 1]) {   // as tranças descendo pelas bordas do quadro, com o gomo trançado e a fita verde
    const bx = s < 0 ? 0 : EYE_W - 7;
    for (let y = 0; y < EYE_H; y++) { const g = Math.floor(y / 4) % 2; x.fillStyle = y % 4 === 3 ? F.hairD : g ? F.hairL : F.hair; x.fillRect(bx + (g ? 1 : 0), y, 6, 1); }
    x.fillStyle = "#3fb35f"; x.fillRect(bx, 29, 7, 2); x.fillStyle = "#237a40"; x.fillRect(bx, 31, 7, 1);
  }
}
// p = quanto das veias já cresceu; lt = ms desde que acendeu (chama dos cantos, brasas e o pulso da luz)
function drawEyesGlow(x, open, p, lt = 0) {
  const F = cutinFace(), pulse = lt ? Math.sin(lt / 45) * .5 : 0;
  x.clearRect(0, 0, EYE_W, EYE_H);
  if (open > .3) for (const cx of EYES) {
    const ry = 1 + 6 * open;
    for (let py = EYE_Y - 7; py <= EYE_Y + 7; py++) for (let px = cx - 7; px <= cx + 7; px++) {
      const d = Math.hypot(px + .5 - cx, py + .5 - EYE_Y);
      if (d > 5.6 + pulse || ((px + .5 - cx) / 14) ** 2 + ((py + .5 - EYE_Y) / ry) ** 2 > 1) continue;
      x.fillStyle = F.glow[d < 1.6 ? 0 : d < 3.4 ? 1 : d < 4.8 ? 2 : 3]; x.fillRect(px, py, 1, 1);
    }
    x.fillStyle = "#ffffff"; x.fillRect(cx - 3, EYE_Y - 3, 2, 1); x.fillRect(cx - 3, EYE_Y - 2, 1, 1);
    if (!lt) continue;
    // chama saindo do canto de fora, ondulando para cima e para trás
    const s = cx < EYE_W / 2 ? -1 : 1, n = Math.floor(Math.min(1, lt / 240) * 26);
    for (let j = 0; j < n; j++) {
      const k = j / 26, fy = EYE_Y - 3 - j * .55 + Math.sin(j * .6 - lt / 55) * 2.6 * k;
      x.fillStyle = F.glow[k < .2 ? 0 : k < .5 ? 1 : k < .8 ? 2 : 3]; x.fillRect(cx + s * (12 + j), Math.round(fy), 1, k < .35 ? 4 : k < .7 ? 3 : 2);
    }
    // brasas subindo em volta do olho
    for (let i = 0; i < 9; i++) {
      const life = (lt / 460 + rand(i * 3.3 + cx)) % 1;
      x.fillStyle = F.glow[life < .4 ? 1 : life < .75 ? 2 : 3];
      x.fillRect(Math.round(cx + s * (rand(i * 5.7 + cx) * 26 - 4) + Math.sin(life * 6 + i) * 1.5), Math.round(EYE_Y + 5 - life * 22), 1, 1);
    }
  }
  EYE_VEINS.forEach(veins => veins.forEach(pts => {
    const n = Math.floor(pts.length * p);
    for (let i = 0; i < n; i++) { const [vx, vy] = pts[i]; x.fillStyle = F.vein[i > n - 3 ? 1 : 0]; x.fillRect(vx, vy, 1, 1); }
  }));
}

/* ---------- emboscada: o Rhanon leva o golpe, é empurrado para trás e segura firme ----------
   Canvas pequeno dentro da faixa (.ci-strip); o Rhanon de perfil na escala CI_HERO. O bicho não aparece: só a pancada vindo
   da direita. Tempos em ms: CI_AMB.hit = a pancada, .end = fim da cena. */
const CI_H = 72, CI_HERO = 1.4, CI_AMB = {hit: 130, end: 820};
function ciSilhouette(src, col) {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
const ciEase = u => 1 - (1 - u) ** 3, ciClamp = u => Math.max(0, Math.min(1, u));
// riscos de velocidade correndo para a direita (o chão passando enquanto ele é arrastado para a esquerda)
function ciStreaks(x, e, cols, W, n, speed, H = CI_H) {
  for (let i = 0; i < n; i++) {
    const len = 30 + rand(i * 3.7) * 90, y = Math.floor(rand(i * 7.3) * H), px = (rand(i * 5.1) * (W + len) + e * speed * (.6 + rand(i * 1.9))) % (W + len);
    x.fillStyle = cols[i % cols.length]; x.globalAlpha = .25 + rand(i * 2.3) * .5;
    const l = Math.max(0, px - len), r = Math.min(W, px); if (r > l) x.fillRect(Math.round(l), y, Math.round(r - l), i % 5 === 0 ? 2 : 1);
  }
  x.globalAlpha = 1;
}
// quadro de impacto: tudo branco, raios pretos saindo do ponto do golpe
function ciImpactBg(x, W, ix, iy, seed, H = CI_H) {
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.fillStyle = "#0b0b12";
  for (let i = 0; i < 22; i++) {
    const an = i / 22 * Math.PI * 2 + rand(seed + i) * .2, r0 = 22 + rand(seed + i * 3) * 26, w = .03 + rand(seed + i * 5) * .05;
    x.beginPath(); x.moveTo(ix + Math.cos(an) * r0, iy + Math.sin(an) * r0);
    x.lineTo(ix + Math.cos(an - w) * W, iy + Math.sin(an - w) * W); x.lineTo(ix + Math.cos(an + w) * W, iy + Math.sin(an + w) * W); x.fill();
  }
}
function ciAmbush(cv) {
  const x = cv.getContext("2d"), W = cv.width, T = CI_AMB, ground = CI_H - 6, look = rhanonLook(), hero = p => rigSideCanvas(p, look, CI_HERO);
  const hWalk = [0, 1].map(i => hero({step: "walk" + i, weapon: "diag"}));                       // andando distraído
  const hHit = hero({step: "walk0", weapon: "diag", lean: -3, dy: 1, face: "blink"});              // a pancada: corpo jogado para trás
  const hSkid = [hero({step: "walk0", weapon: "diag", lean: -2, dy: 2, face: "blink"}), hero({step: "walk0", weapon: "diag", lean: -1, dy: 2, face: "blink"})];   // arrastando, pernas abertas e abaixado
  const hHold = hero({step: "walk0", weapon: "diag", lean: 1, dy: 1}), hUp = hero({step: "walk0", weapon: "diag", lean: 2});   // segurou: inclina de volta para a frente
  const SIL = new Map(), sil = (c, col) => { let m = SIL.get(c); if (!m) SIL.set(c, m = {}); return m[col] || (m[col] = ciSilhouette(c, col)); };
  const HW = hWalk[0].width, HH = hWalk[0].height, hy = ground - HH + 4, x0 = Math.round(W * .62 - HW / 2), slide = Math.min(Math.round(W * .34), x0 - 4);
  const red = ["#ff5a4a", "#ffffff", "#ffb0a0"];
  x.imageSmoothingEnabled = false;
  const floor = () => { x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(-9, ground + 3, W + 18, CI_H); };
  const bg = () => { const g = x.createLinearGradient(0, 0, 0, CI_H); g.addColorStop(0, "#3a0a10"); g.addColorStop(1, "#14060a"); x.fillStyle = g; x.fillRect(-9, 0, W + 18, CI_H); };
  const draw = e => {
    const u = ciClamp((e - T.hit - 70) / (T.end - T.hit - 70)), ix = x0 + HW - 4, iy = hy + 34;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, W, CI_H);
    if (e < T.hit) {   // distraído; a pancada vem zunindo da direita
      bg(); floor();
      const k = e / T.hit;
      x.drawImage(hWalk[Math.floor(e / 70) % 2], x0, hy);
      x.fillStyle = "#fff"; x.globalAlpha = .9; x.fillRect(Math.round(ix + (W - ix) * (1 - k)), iy - 1, Math.round((W - ix) * k) + 2, 3);
      x.fillStyle = "#ff5a4a"; x.globalAlpha = .7; x.fillRect(Math.round(ix + (W - ix) * (1 - k)), iy - 5, Math.round((W - ix) * k * .7), 1); x.fillRect(Math.round(ix + (W - ix) * (1 - k)), iy + 5, Math.round((W - ix) * k * .5), 1);
      return;
    }
    if (e < T.hit + 70) { ciImpactBg(x, W, ix, iy, 9); x.drawImage(sil(hHit, "#0b0b12"), x0 - 3, hy); return; }
    // arrastado para trás: começa rápido e vai freando; os pés riscam o chão e levantam poeira
    const s = ciEase(u), hx = x0 - 3 - Math.round(slide * s), moving = u < .72, sh = Math.round(Math.sin(e / 11) * 4 * (1 - u));
    x.translate(sh, 0); bg(); ciStreaks(x, e, red, W, 30, 1.5 * (1 - s) + .15); floor();
    // riscos dos pés no chão, do lugar da pancada até onde ele está
    x.fillStyle = "#e8c8a0"; x.globalAlpha = .55 * (1 - u * .6);
    x.fillRect(hx + 14, ground + 2, x0 - hx + 4, 1); x.fillRect(hx + 30, ground + 4, x0 - hx + 2, 1); x.globalAlpha = 1;
    // poeira: bolinhas que nascem nos pés, ficam para trás (à direita) e sobem
    for (let i = 0; i < 12; i++) {
      const born = i / 12 * .7, age = u - born; if (age < 0 || age > .45) continue;
      const bxp = x0 - 3 - slide * ciEase(born) + 18 + rand(i * 3.1) * 14, r = 2 + age * 12;
      x.globalAlpha = .5 * (1 - age / .45); x.fillStyle = i % 2 ? "#e8d8c0" : "#b89878";
      x.beginPath(); x.arc(Math.round(bxp + age * 26), Math.round(ground + 1 - age * 18 - rand(i * 7.7) * 4), r, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    const img = u < .08 ? hHit : moving ? hSkid[Math.floor(e / 60) % 2] : u < .86 ? hHold : hUp;
    if (moving && u < .5) { const g = sil(img, "#ff3a2a"); for (let i = 3; i > 0; i--) { x.globalAlpha = .3 - i * .07; x.drawImage(g, hx + Math.round(i * 14 * (1 - s)), hy); } x.globalAlpha = 1; }
    x.drawImage(u < .14 ? sil(img, "#fff") : img, hx + (moving ? Math.round(Math.sin(e / 7)) : 0), hy);
    // estrela da pancada e faíscas, no lugar onde ele estava
    if (u < .5) {
      const q = u / .5, r = 5 + 20 * ciEase(q), t = Math.max(1, 4 * (1 - q)), sx = ix - 4, sy = iy;
      x.globalAlpha = 1 - q * q; x.fillStyle = "#fff"; x.beginPath();
      x.moveTo(sx - r, sy); x.lineTo(sx - t, sy - t); x.lineTo(sx, sy - r * .7); x.lineTo(sx + t, sy - t); x.lineTo(sx + r, sy); x.lineTo(sx + t, sy + t); x.lineTo(sx, sy + r * .7); x.lineTo(sx - t, sy + t); x.fill();
      for (let i = 0; i < 14; i++) { const an = Math.PI - 1 + rand(i * 4.1) * 2, d = (10 + rand(i * 6.3) * 50) * ciEase(q); x.fillStyle = ["#fff", "#ff5a4a", "#ffd23a"][i % 3]; x.fillRect(Math.round(sx + Math.cos(an) * d), Math.round(sy + Math.sin(an) * d + q * q * 12), 2, 2); }
      x.globalAlpha = 1;
    }
    // segurou: um brilho curto na ponta da lança
    if (u > .86) { const q = (u - .86) / .14; x.fillStyle = "#fff"; x.globalAlpha = 1 - q; x.fillRect(hx + HW - 4 - 5, hy + 28, 11, 1); x.fillRect(hx + HW - 4, hy + 23, 1, 11); x.globalAlpha = 1; }
  };
  let stop = false; const t0 = performance.now();
  const frame = t => { if (stop || !cv.isConnected) return; draw(Math.max(0, t - t0)); requestAnimationFrame(frame); };   // o relógio do quadro pode vir um tiquinho antes do t0
  draw(0); requestAnimationFrame(frame);
  return () => { stop = true; };
}

/* ---------- encontro com um chefe ----------
   Painel mais alto (CI_BH) com o chefe ampliado. CI_BOSS: .eyes = os olhos acendem, .hit = o clarão, .end = fim. */
const CI_BH = 96, CI_BOSS = {eyes: 380, hit: 820, end: 1650};
// o chefe numa pose, já com a cor dele, ampliado até caber em maxH (no máximo 2,5x); sem desenho, o emoji provisório
function ciBeast(a, pose, maxH) {
  let src = null; try { src = a && beastFrame(a.id, pose, 0, isTomado(a)); } catch (_) {}
  if (!src) { src = document.createElement("canvas"); src.width = src.height = 40; const g = src.getContext("2d"); g.font = "30px serif"; g.textBaseline = "top"; g.fillText((a && a.emoji) || "❓", 3, 4); }
  const k = Math.min(2.5, maxH / src.height), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k));
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  const tint = a && beastTint(a); if (tint && CAN_FILTER) g.filter = tint;
  g.drawImage(src, 0, 0, c.width, c.height);
  const eye = (src.dataset.eye || src.dataset.head || "").split(",").map(Number);   // onde fica o olho, na escala nova
  c.eye = eye.length === 2 && eye.every(isFinite) ? [eye[0] * k, eye[1] * k] : null; c.k = k;
  return c;
}
function ciBoss(cv, a) {
  const x = cv.getContext("2d"), W = cv.width, H = CI_BH, T = CI_BOSS, ground = H - 7, look = rhanonLook(), hero = p => rigSideCanvas(p, look, CI_HERO);
  const bIdle = ciBeast(a, "idle", H - 12), bRoar = ciBeast(a, "roar", H - 12);
  const hStand = hero({step: "stand", weapon: "diag"}), hBrace = [hero({step: "walk0", weapon: "diag", lean: -2, dy: 1}), hero({step: "walk0", weapon: "diag", lean: -1, dy: 1})];
  const SIL = new Map(), sil = (c, col) => { let m = SIL.get(c); if (!m) SIL.set(c, m = {}); return m[col] || (m[col] = ciSilhouette(c, col)); };
  const HH = hStand.height, hx = Math.round(W * .16), hy = ground - HH + 4, bx = Math.round(W * .66 - bIdle.width / 2), by = c => ground - c.height + 2;
  x.imageSmoothingEnabled = false;
  const eyes = (c, px, py, e) => {   // olho vermelho com brilho, piscando ao acender
    if (!c.eye) return;
    const s = Math.max(2, Math.round(c.k * 1.2)), ex = Math.round(px + c.eye[0]), ey = Math.round(py + c.eye[1]), on = e - T.eyes;
    if (on < 0 || (on > 90 && on < 150)) return;
    x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,40,40,.3)"; x.beginPath(); x.arc(ex + s / 2, ey + s / 2, s * 2 + Math.sin(e / 70), 0, Math.PI * 2); x.fill(); x.restore();
    x.fillStyle = "#ff2a2a"; x.fillRect(ex - 1, ey - 1, s + 2, s + 2); x.fillStyle = "#ffd0c8"; x.fillRect(ex, ey, Math.max(1, s - 1), Math.max(1, s - 1));
  };
  const smoke = (e, n, cx, cy, rx, ry, alpha) => {   // a fumaça de Pytuna girando devagar atrás do chefe
    x.globalAlpha = alpha;
    for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2 + e / 1500, d = .7 + (i % 3) * .2; x.fillStyle = PYT_SMOKE[i % 3]; x.beginPath(); x.arc(Math.round(cx + Math.cos(an) * rx * d), Math.round(cy + Math.sin(an) * ry * d - e / 90 % 6), 6 + (i % 4) * 3 + Math.sin(e / 300 + i) * 1.5, 0, Math.PI * 2); x.fill(); }
    x.globalAlpha = 1;
  };
  const draw = e => {
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, W, H);
    const bcx = bx + bIdle.width / 2, bcy = by(bIdle) + bIdle.height / 2;
    if (e < T.hit) {   // escuro: a silhueta enorme cresce na fumaça e os olhos acendem
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1a1230"); g.addColorStop(1, "#0c0816"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const k = ciEase(ciClamp(e / T.eyes));
      const bl = x.createRadialGradient(bcx, bcy, 4, bcx, bcy, Math.max(bIdle.width, bIdle.height) * .95);   // clarão atrás dele, para a silhueta aparecer
      bl.addColorStop(0, `rgba(170,40,70,${.55 * k})`); bl.addColorStop(.6, `rgba(90,30,90,${.3 * k})`); bl.addColorStop(1, "rgba(40,20,60,0)"); x.fillStyle = bl; x.fillRect(0, 0, W, H);
      smoke(e, 14, bcx, bcy, bIdle.width * .7, bIdle.height * .6, .5 * k);
      x.globalAlpha = k; x.drawImage(sil(bIdle, "#000004"), bx, by(bIdle) + Math.round((1 - k) * 6)); x.globalAlpha = 1;
      eyes(bIdle, bx, by(bIdle), e);
      x.fillStyle = "rgba(0,0,0,.5)"; x.fillRect(0, ground + 3, W, H);
      x.drawImage(sil(hStand, "#05040a"), hx, hy + (e > T.eyes && e < T.eyes + 120 ? -2 : 0));   // o Rhanon de sombra, levando o susto quando os olhos acendem
      return;
    }
    if (e < T.hit + 80) { ciImpactBg(x, W, bcx - bRoar.width * .25, bcy, 4, H); x.drawImage(sil(bRoar, "#0b0b12"), bx, by(bRoar)); x.drawImage(sil(hBrace[0], "#0b0b12"), hx - 3, hy); return; }
    // o rugido: ele aparece em cores, tudo treme, o vento corre para a esquerda e o Rhanon firma os pés
    const u = ciClamp((e - T.hit - 80) / (T.end - T.hit - 80)), sh = Math.round(Math.sin(e / 11) * 5 * (1 - u * .6));
    x.translate(sh, 0);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#4a0c14"); g.addColorStop(1, "#16060a"); x.fillStyle = g; x.fillRect(-9, 0, W + 18, H);
    x.save(); x.translate(W, 0); x.scale(-1, 1); ciStreaks(x, e, ["#ff5a4a", "#ffffff", "#ffb0a0"], W, 34, 1.5, H); x.restore();
    smoke(e, 12, bcx, bcy, bRoar.width * .75, bRoar.height * .65, .55);
    x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(-9, ground + 3, W + 18, H);
    for (let i = 0; i < 3; i++) {   // ondas do rugido saindo da boca
      const q = (u * 2.2 + i / 3) % 1, r = 10 + q * W * .5;
      x.strokeStyle = "#fff"; x.globalAlpha = (1 - q) * .7; x.lineWidth = 2; x.beginPath(); x.arc(bx + bRoar.width * .2, bcy, r, Math.PI * .75, Math.PI * 1.25); x.stroke();
    }
    x.globalAlpha = 1;
    const jx = bx + Math.round(Math.sin(e / 9) * 2);
    x.drawImage(u < .12 ? sil(bRoar, "#fff") : bRoar, jx, by(bRoar));
    eyes(bRoar, jx, by(bRoar), e);
    const back = Math.round(12 * ciEase(u));
    x.fillStyle = "#e8c8a0"; x.globalAlpha = .5; x.fillRect(hx - back + 14, ground + 2, back + 4, 1); x.globalAlpha = 1;   // o pé riscando o chão
    x.drawImage(hBrace[Math.floor(e / 70) % 2], hx - 3 - back, hy);
  };
  let stop = false; const t0 = performance.now();
  const frame = t => { if (stop || !cv.isConnected) return; draw(Math.max(0, t - t0)); requestAnimationFrame(frame); };
  draw(0); requestAnimationFrame(frame);
  return () => { stop = true; };
}

/* kind: "first" (o Rhanon acertou primeiro), "ambush" (o bicho deu o bote), "vs" (ninguém acertou antes: treino e bugs)
   ou "boss" (encontro com um chefe; a = o chefe) */
function battleCutin(kind, cb, a) {
  const el = $("cutin");
  if (REDUCE) { cb(); return; }
  el.className = "cutin " + kind; el.hidden = false;
  cutinSound(kind);
  const fran = heroi() === "fran", bands = '<div class="ci-dim"></div><div class="ci-band ci-b1"></div><div class="ci-band ci-b2"></div>';
  el.classList.toggle("fran", fran);   // faixas e clarão em luar (styles.css)
  const close = (out, stop) => {
    setTimeout(() => el.classList.add("out"), out);
    setTimeout(cb, out + 70);
    setTimeout(() => { stop(); el.hidden = true; el.innerHTML = ""; }, out + 400);
  };
  if (kind === "boss") {
    el.innerHTML = bands + '<div class="ci-strip"><div class="ci-zoom"></div></div><div class="ci-flash"></div>';
    const strip = el.querySelector(".ci-strip"), cv = document.createElement("canvas"), w = strip.offsetWidth || innerWidth, h = strip.offsetHeight || innerHeight * .5;
    cv.height = CI_BH; cv.width = Math.max(200, Math.min(460, Math.round(CI_BH * w / h)));
    el.querySelector(".ci-zoom").appendChild(cv);
    const stopAct = ciBoss(cv, a);
    setTimeout(() => strip.classList.add("ci-shake"), CI_BOSS.hit);
    close(CI_BOSS.end, stopAct);
    return;
  }
  if (kind === "ambush") {
    el.innerHTML = bands + '<div class="ci-strip"><div class="ci-zoom"></div></div><div class="ci-bang">!</div><div class="ci-sub">' + t("DESPREVENIDO!") + '</div><div class="ci-flash"></div>';
    const strip = el.querySelector(".ci-strip"), cv = document.createElement("canvas"), w = strip.offsetWidth || innerWidth, h = strip.offsetHeight || innerHeight * .4;
    cv.height = CI_H; cv.width = Math.max(180, Math.min(420, Math.round(CI_H * w / h)));   // largura pela forma da faixa
    el.querySelector(".ci-zoom").appendChild(cv);
    const stopAct = ciAmbush(cv);
    setTimeout(() => strip.classList.add("ci-shake"), CI_AMB.hit);
    close(CI_AMB.end, stopAct);
    return;
  }
  el.innerHTML = bands + '<div class="ci-strip"><div class="ci-zoom"></div></div><h2 class="title ci-name"></h2>' +
    (kind === "first" ? '<div class="ci-sub">' + t("ATACA PRIMEIRO!") + '</div>' : "") + '<div class="ci-flash"></div>';
  ransom(el.querySelector(".ci-name"), [fran ? "FRANCISCANE" : "RHANON"], 5);
  const strip = el.querySelector(".ci-strip"), zoom = el.querySelector(".ci-zoom"), art = fran ? null : artCanvas("cutin/eyes");   // a arte em imagem é do Rhanon
  let stop = false;
  if (art) { art.className = "ci-art"; zoom.appendChild(art); }
  else {
    const base = document.createElement("canvas"), glow = document.createElement("canvas");
    base.width = glow.width = EYE_W; base.height = glow.height = EYE_H; glow.className = "ci-glow";
    zoom.append(base, glow);
    const bx = base.getContext("2d"), gx = glow.getContext("2d"), t0 = performance.now(), L = CI_LIT;
    const frame = t => {
      if (stop) return;
      // fechados -> abrem de uma vez (passando um pouco do ponto) -> olham de lado -> voltam para a frente franzindo -> acendem
      const e = Math.max(0, t - t0), lit = e >= L;
      const open = e < 170 ? .06 : e < 250 ? .06 + (e - 170) / 80 * 1.09 : e < 310 ? 1.15 - (e - 250) / 60 * .15 : 1;
      const look = e < 310 ? -5 : -5 * (1 - ciEase(ciClamp((e - 310) / 90)));
      drawEyesBase(bx, open, {iris: !lit, look, brow: ciClamp((e - 300) / 110), w: e});
      if (lit) drawEyesGlow(gx, open, ciClamp((e - L) / 480), e - L + 1); else gx.clearRect(0, 0, EYE_W, EYE_H);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  setTimeout(() => strip.classList.add("ci-shake"), CI_LIT);
  close(1180, () => { stop = true; });
}
const CI_LIT = 430;   // quando os olhos acendem (o som e o soco da câmera em styles.css acompanham)
