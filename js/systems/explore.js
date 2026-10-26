/* Exploração das fases vista de cima. O Rhanon anda livre (8 direções), os bichos passeiam e perseguem.
   Quem acerta primeiro começa a batalha: golpe/arremesso do Rhanon = turno dele, com dano;
   bicho alcança ou o Rhanon esbarra nele = turno do bicho. Bem mais forte que o bicho = abate direto. */
// tamanho da câmera em pixels do jogo: acompanha a janela (exFit), com cada pixel do jogo virando VIEW_Z pixels da tela
let VIEW_W = 240, VIEW_H = 176, VIEW_Z = 3;
function exFit() {
  const W = innerWidth, H = innerHeight, z = Math.max(2, Math.round(Math.min(W / 300, H / 190)));   // ~19 x 12 quadrados ou mais
  VIEW_Z = z; VIEW_W = Math.ceil(W / z); VIEW_H = Math.ceil(H / z);
  const cv = $("exCanvas"); cv.style.width = VIEW_W * z + "px"; cv.style.height = VIEW_H * z + "px";
}
addEventListener("resize", () => { if (EX && !$("explore").hidden) exFit(); });
// câmera seguindo o Rhanon; fase menor que a tela (aldeia, feira) fica centralizada
const camAxis = (map, view, want) => map <= view ? -Math.round((view - map) / 2) : Math.max(0, Math.min(map - view, want));
const viewTiles = () => [Math.ceil(VIEW_W / TILE) + 1, Math.ceil(VIEW_H / TILE) + 1];
const RS = 3;                                // resolução do canvas: cada pixel do jogo vira 3x3 (arte em imagem com scale 3 fica nítida)
const snap = v => Math.round(v * RS) / RS;  // posição na grade da tela, para o movimento andar de 1/3 em 1/3 de pixel
const HERO_SPEED = 74;                       // pixels por segundo
const ANIMAL_SPEED = {pequeno: 46, "médio": 40, grande: 34, chefe: 0};
const CHASE_RANGE = 72;                      // distância em que o bicho percebe o Rhanon
let EX = null;                               // fase atual (null fora da exploração)
const exKeys = new Set();
let exMsgTimer = null;

/* ---------- terreno e colisão ---------- */
function stageTile(tx, ty) { const r = EX.rows[ty]; return (r && r[tx]) || "T"; }
// a passagem (G) abre quando a próxima fase está liberada no mapa (nas fases de caça: o chefe daqui caiu)
const gateOpen = () => !!EX.st.next && unlocked(EX.st.next);
// fase anterior na corrente (quem tem esta como next): o E volta para ela
const STAGE_PREV = Object.fromEntries(Object.entries(STAGES).filter(([, st]) => st.next).map(([k, st]) => [st.next, k]));
function solidAt(px, py) {
  const ch = stageTile(Math.floor(px / TILE), Math.floor(py / TILE));
  return ch === "G" ? !gateOpen() : SOLID.includes(ch);
}
// a caixa dos pés (meia largura hw, meia altura hh) em (x, y) encosta em algo sólido?
function boxBlocked(x, y, hw, hh) {
  return solidAt(x - hw, y - hh) || solidAt(x + hw, y - hh) || solidAt(x - hw, y + hh) || solidAt(x + hw, y + hh) || solidAt(x, y - hh) || solidAt(x, y + hh);
}
// anda (dx, dy) escorregando nas paredes
function slide(ent, dx, dy) {
  let moved = false;
  if (dx && !boxBlocked(ent.x + dx, ent.y, ent.hw, ent.hh)) { ent.x += dx; moved = true; }
  if (dy && !boxBlocked(ent.x, ent.y + dy, ent.hw, ent.hh)) { ent.y += dy; moved = true; }
  return moved;
}
// andando reto contra uma quina, desliza de lado até achar a passagem (facilita entrar em trilhas estreitas)
function nudge(ent, ix, iy) {
  if (ix && iy) return false;
  for (let o = 1; o <= 7; o++) for (const s of [1, -1]) {
    const ox = iy ? o * s : 0, oy = ix ? o * s : 0;
    if (!boxBlocked(ent.x + ox + ix * 2, ent.y + oy + iy * 2, ent.hw, ent.hh)) return slide(ent, Math.sign(ox), Math.sign(oy));
  }
  return false;
}
function spearBlocked(px, py) {
  const ch = stageTile(Math.floor(px / TILE), Math.floor(py / TILE));
  return ch === "T" || ch === "o" || ch === "#" || (ch === "G" && !gateOpen());
}

/* ---------- entrar, sair e trocar de fase ---------- */
// vida no cenário (só enfeite): borboletas e folhas caindo de dia, vaga-lumes à noite, sempre perto da câmera
function exAmbient(dt, now) {
  const h = EX.hero, want = EX.night ? 10 : 6;
  EX.amb = EX.amb || [];
  if (EX.amb.length < want && Math.random() < dt * 3) {
    const kind = EX.night ? "vagalume" : Math.random() < .5 ? "borboleta" : "folha";
    let x = h.x + (Math.random() - .5) * VIEW_W, y = h.y - 12 + (Math.random() - .5) * VIEW_H;
    if (kind === "folha") {   // folha só cai de árvore
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (stageTile(tx, ty) !== "T") return;
      x = tx * TILE + 4 + Math.random() * 8; y = ty * TILE + 4;
    }
    EX.amb.push({kind, x, y, t: 0, life: kind === "folha" ? 3.5 : 7 + Math.random() * 6, ph: Math.random() * 6,
      col: kind === "borboleta" ? ["#ffd23a", "#ff8ac8", "#86d6ff", "#ffffff"][Math.floor(Math.random() * 4)] : ["#6fbf4a", "#a6d65a", "#c9a040"][Math.floor(Math.random() * 3)]});
  }
  for (const a of EX.amb) {
    a.t += dt;
    if (a.kind === "borboleta") { a.x += Math.cos(a.ph + a.t * .7) * 18 * dt; a.y += Math.sin(a.ph * 1.3 + a.t * 1.1) * 14 * dt; }
    else if (a.kind === "vagalume") { a.x += Math.cos(a.ph + a.t * .5) * 8 * dt; a.y += Math.sin(a.ph + a.t * .8) * 6 * dt; }
    else { a.x += Math.sin(a.t * 2.2 + a.ph) * 16 * dt; a.y += 11 * dt; }
  }
  EX.amb = EX.amb.filter(a => a.t < a.life && Math.abs(a.x - h.x) < VIEW_W && Math.abs(a.y - h.y) < VIEW_H);
}
function drawAmbient(x, cx, cy, now, night) {
  for (const a of EX.amb || []) {
    if ((a.kind === "vagalume") !== night) continue;
    const px = Math.round(a.x - cx), py = Math.round(a.y - cy);
    x.globalAlpha = Math.max(0, Math.min(1, a.t, a.life - a.t));
    if (a.kind === "borboleta") {   // asas abrindo e fechando
      x.fillStyle = a.col;
      if (Math.floor(now / 110 + a.ph * 3) % 2) { x.fillRect(px - 2, py - 1, 2, 2); x.fillRect(px + 1, py - 1, 2, 2); } else { x.fillRect(px - 1, py - 1, 1, 2); x.fillRect(px + 1, py - 1, 1, 2); }
      x.fillStyle = "#2a1a14"; x.fillRect(px, py - 1, 1, 2);
    } else if (a.kind === "folha") { x.fillStyle = a.col; x.fillRect(px, py, 2, 1); x.fillRect(px + Math.floor(a.t * 4) % 2, py + 1, 1, 1); }
    else if (Math.sin(now / 300 + a.ph * 5) > -.2) { x.fillStyle = "rgba(220,255,120,.35)"; x.fillRect(px - 1, py - 1, 3, 3); x.fillStyle = "#e8ff7a"; x.fillRect(px, py, 1, 1); }   // vaga-lume piscando
  }
  x.globalAlpha = 1;
}
// peixes vivem só na água: nadam de um lado para o outro, cospem água quando veem o Rhanon e só a flecha alcança
const AQUATIC = new Set(["piranha", "poraque", "boto"]);
// where: "terra" (sem peixes, para os "a" do mapa), "agua" (só peixes) ou nada (qualquer um, usado na batalha)
function pickFromPool(zone, where) {
  const z = zoneDef(zone), pool = where ? z.pool.filter(([id]) => (where === "agua") === AQUATIC.has(id)) : z.pool;
  if (!pool.length) return null;
  let r = Math.random() * pool.reduce((s, [, w]) => s + w, 0);
  for (const [id, w] of pool) if ((r -= w) < 0) return ANIMALS.find(a => a.id === id);
  return ANIMALS.find(a => a.id === pool[0][0]);
}
// espalha peixes pela água da fase (em trechos com água dos dois lados, para terem por onde nadar)
function spawnFish(zone, rows) {
  const water = [];
  rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
    if (ch !== "~") return;
    const h = row[tx - 1] === "~" && row[tx + 1] === "~", v = (rows[ty - 1] || "")[tx] === "~" && (rows[ty + 1] || "")[tx] === "~";
    if (h || v) water.push([tx, ty, h ? "x" : "y"]);
  }));
  for (let k = Math.min(6, Math.floor(water.length / 25)); k > 0 && water.length; k--) {
    const a = pickFromPool(zone, "agua"); if (!a) return;
    const [tx, ty, axis] = water.splice(Math.floor(Math.random() * water.length), 1)[0];
    EX.ents.push(Object.assign(makeAnimalEnt(a, tx, ty), {aquatic: true, axis, dir: Math.random() < .5 ? 1 : -1}));
  }
}
// peixe: nada sem sair da água; ao ver o Rhanon, "!" e cospe um jato d'água (se acertar, a batalha começa com ele)
function exFish(en, dt, now) {
  const h = EX.hero, sp = en.speed * .5 * dt, ax = en.axis === "x";
  const nx = en.x + (ax ? en.dir * sp : 0), ny = en.y + (ax ? 0 : en.dir * sp);
  if (stageTile(Math.floor((nx + (ax ? en.dir * 9 : 0)) / TILE), Math.floor((ny - 4 + (ax ? 0 : en.dir * 9)) / TILE)) === "~") { en.x = nx; en.y = ny; en.walk += sp; }
  else en.dir *= -1;
  if (ax) en.face = en.dir;
  if (en.state === "windup" && now > en.until) en.state = "wander";
  if (Math.hypot(h.x - en.x, h.y - en.y) < 92 && now > (en.spitT || 0) && now > EX.invulnUntil && !EX.locked && !EX.camp) {
    en.spitT = now + 2600; en.state = "windup"; en.until = now + 450; en.face = h.x > en.x ? 1 : -1; animalCry(en.a.id, false, .5);
    setTimeout(() => {
      if (!EX || !en.alive || EX.locked) return;
      const sx = en.x, sy = en.y - 7, tx = h.x, ty = h.y - 9, d = Math.hypot(tx - sx, ty - sy) || 1;
      EX.spits.push({x: sx, y: sy, vx: (tx - sx) / d * 140, vy: (ty - sy) / d * 140, left: 120, en}); sfx("blip");
    }, 450);
  }
}
// jatos d'água voando: acertou o Rhanon = batalha; bateu em árvore/pedra ou acabou o alcance = some num respingo
function exSpits(dt, now) {
  const h = EX.hero;
  for (const s of EX.spits) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.left -= Math.hypot(s.vx, s.vy) * dt;
    const ch = stageTile(Math.floor(s.x / TILE), Math.floor((s.y + 6) / TILE));
    if (Math.hypot(h.x - s.x, h.y - 9 - s.y) < 7 && now > EX.invulnUntil && !EX.locked) { EX.spits = []; exBurst(h.x, h.y - 10, ["#86d6ff", "#ffffff"], 10); return exStartBattle(s.en, {enemyFirst: true}); }
    if (s.left <= 0 || ch === "T" || ch === "o") { s.done = true; exBurst(s.x, s.y, ["#86d6ff", "#ffffff"], 5); }
  }
  EX.spits = EX.spits.filter(s => !s.done);
}
function makeAnimalEnt(a, tx, ty) {
  const img = artCanvas("animal/" + a.id + "/mapa") || codeAnimalSprite(a), k = +img.dataset.scale || 1, x = tx * TILE + 8, y = ty * TILE + 12;
  // traço novo: segundo quadro (respirando/andando) e o desmaiado, para quando cai com um golpe só
  const rig = img.dataset.rig, img2 = rig && beastFrame(a.id, "idle", 1), ko = rig && beastFrame(a.id, "ko"), blink = rig && beastFrame(a.id, "blink");
  return {a, img, img2, ko, blink, w: img.width / k, h: img.height / k, x, y, homeX: x, homeY: y, hw: Math.min(7, Math.round(img.width / k / 3)), hh: 3,
    speed: a.id === "preguica" ? 18 : (ANIMAL_SPEED[a.size] ?? 40), boss: !!a.boss, alive: true,
    state: "wander", vx: 0, vy: 0, until: 0, face: -1, walk: 0, stunUntil: 0};
}
// after: chamado depois de montar a fase (cena de abertura)
// from = "back": chegou voltando da fase seguinte, então aparece do lado de dentro da passagem (G)
function startExplore(zone, after, from) {
  if (moving || (EX && EX.starting)) return;
  if (EX) EX.starting = true;
  wipe(() => {
    const st = STAGES[zone];
    EX = {zone, st, rows: st.rows, map: drawStageMap(st.rows, zone), pal: TILE_PAL[zone] || TILE_PAL.mata,
      night: !!G.night, ents: [], fx: [], loot: [], spits: [], spots: [], spear: null, cool: 0, jab: 0, hero: null, fighting: null, locked: false, invulnUntil: 0, dialog: null};
    const at = (tx, ty) => (st.rows[ty] || "")[tx];
    st.rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if ("QU".includes(ch)) {   // bloco: um ponto só, embaixo do meio dele (onde o Rhanon chega pela calçada)
        if (at(tx - 1, ty) === ch || at(tx, ty - 1) === ch) return;
        let w = 0, h = 0; while (at(tx + w, ty) === ch) w++; while (at(tx, ty + h) === ch) h++;
        const sp = {kind: SPOTS[ch], x: tx * TILE + w * 8, y: (ty + h) * TILE + 4, tx, ty, w, h};
        EX.spots.push(sp); if (ch === "U") EX.bus = {x: tx * TILE, y: ty * TILE, w: w * TILE, h: h * TILE, dx: 0, spot: sp};
        return;
      }
      if (ch === "S") EX.hero = {x: tx * TILE + 8, y: ty * TILE + 12, hw: 5, hh: 3, dir: "down", aim: {x: 0, y: 1}, walk: 0, flip: false, movedT: 0};
      else if (ch === "a") { const a = pickFromPool(zone, "terra"); if (a) EX.ents.push(makeAnimalEnt(a, tx, ty)); }
      else if (ch === "B" && !BS()[bossKey(zone)]) EX.ents.push(makeAnimalEnt(ANIMALS.find(a => a.id === zoneDef(zone).boss), tx, ty));
      else if (SPOTS[ch]) EX.spots.push({kind: SPOTS[ch], look: SPOTS[ch] === "aldeao" ? (cityOf(zone) === "belem" ? "urbano" : "aldeao") + (EX.spots.filter(q => q.kind === "aldeao").length % 3 + 1) : SPOTS[ch], x: tx * TILE + 8, y: ty * TILE + 8, tx, ty});
    }));
    if (from === "back") {   // do lado de dentro da passagem, virado para a fase
      const gy = st.rows.findIndex(r => r.includes("G")), gx = st.rows[gy].indexOf("G"), W = st.rows[0].length, H = st.rows.length;
      const [ix, iy] = gx === 0 ? [1, 0] : gx === W - 1 ? [-1, 0] : gy === 0 ? [0, 1] : [0, -1];
      Object.assign(EX.hero, {x: (gx + ix) * TILE + 8, y: (gy + iy) * TILE + 12, dir: ix ? "side" : iy > 0 ? "down" : "up", side: ix || 1, aim: {x: ix, y: iy}});
    }
    if (!st.safe) spawnFish(zone, st.rows);
    vit(); G.sub = zone; save();
    curZone = zone; fromLocal = false; exKeys.clear();
    $("explore").classList.toggle("no-help", !!G.tutorial);   // os comandos aparecem só depois do tutorial
    $("titleScreen").hidden = true; $("map").hidden = true; $("local").hidden = true; $("over").hidden = true; $("homeButton").hidden = true; $("explore").hidden = false; exFit();
    musicStart("local"); exHud();
    exToast(st.safe ? SUB[zone].n + (SAFE_TIP[zone] || " · peles, comida, artesão e armeiro: chegue perto de uma barraca e aperte Z") : zoneDef(zone).n + (BS()[bossKey(zone)] ? "" : G.night ? " · dizem que algo do folclore ronda o fim da trilha..." : " · o chefe espera no fim da trilha"));
    if (zone === "aldeia" && !after) announceOffer();   // pedido do dia (na abertura, só depois de acordar)
    if (after) after();
  });
}
const SAFE_TIP = {aldeia: " · chegue perto da fogueira ou dos aldeões e aperte Z. A trilha da direita leva à feira",
  parada: " · a cabine do cobrador vende a passagem; com ela, é só embarcar no ônibus", terminal: " · o ônibus volta para Ananindeua; a trilha da esquerda leva ao Ver-o-Peso"};
function exitExplore() {
  if (!EX || EX.locked) return;
  EX.locked = true;
  wipe(() => { $("explore").hidden = true; $("exDialog").hidden = true; $("exSkip").hidden = true; EX = null; exKeys.clear(); showLocal(); });
}
// volta da batalha para a fase, no mesmo lugar
function resumeExplore(result) {
  if (!EX || result === "lose") { $("explore").hidden = true; EX = null; return showLocal(); }
  const en = EX.fighting, now = performance.now();
  EX.fighting = null; EX.locked = false; exKeys.clear();
  if (en && result === "win") { en.alive = false; exBurst(en.x, en.y - 6, ["#d8d2c0", "#a89f8a", "#fff"], 14); }
  if (en && result === "flee") { en.stunUntil = now + 3500; EX.invulnUntil = now + 2500; }
  $("explore").hidden = false; $("homeButton").hidden = true;
  musicStart("local"); exHud();
  if (en && result === "win" && en.boss) exToast(NIGHT_ZONES[EX.zone] && en.a.id === NIGHT_ZONES[EX.zone].boss ? `${en.a.name} derrotado! A aldeia vai contar essa história por muitas noites.`
    : EX.st.next === "parada" ? "Você venceu o último chefe de Ananindeua! A passagem leva à BR-316." : EX.st.next ? `Caminho liberado: ${SUB[EX.st.next].n}! Siga a trilha até a passagem.` : "Você venceu o último chefe daqui!");
  if (en && result === "win" && en.boss && pendingReveal()) { EX.locked = true; setTimeout(() => revealNext(() => { if (EX) EX.locked = false; }), 700); }   // o mapa mostra o caminho novo
}

/* ---------- ações do Rhanon ---------- */
const entH = en => Math.min(en.h, 20);
function exStrike() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0) return;
  const spot = nearSpot(); if (spot) return exOpenDialog(spot.kind, null, spot.look);   // perto de alguém: conversa em vez de golpe
  const h = EX.hero; EX.cool = .35; EX.jab = .16; sfx("spear");
  // a lança alcança uns 1,5 quadrado à frente: confere pontos ao longo dela
  const reach = en => [8, 15, 22].some(r => Math.hypot(en.x - (h.x + h.aim.x * r), en.y - entH(en) / 2 - (h.y - 8 + h.aim.y * r)) < 9 + en.hw);
  if (EX.ents.some(en => en.alive && en.aquatic && reach(en)) && !EX.ents.some(en => en.alive && !en.aquatic && reach(en))) exToast("O peixe está na água: a lança não alcança. Use a flecha (X)!");
  const target = EX.ents.find(en => en.alive && !en.aquatic && [8, 15, 22].some(r => Math.hypot(en.x - (h.x + h.aim.x * r), en.y - entH(en) / 2 - (h.y - 8 + h.aim.y * r)) < 9 + en.hw));
  if (target) exHit(target);
}
// flecha: só com arco (EQUIP.ranged, comprado no armeiro da feira)
const BOW_DRAW = .32;   // segundos puxando a corda antes da flecha sair (ele para de andar nesse tempo)
// mão do arco (em pixels do desenho 32x44 do Rhanon): esticada na direção da mira, na altura do peito
const bowHand = a => [16 + a.x * 13, 25 + a.y * 9];
function exThrow() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0 || EX.spear || EX.draw) return;
  if (!G.equip.ranged) { EX.cool = 1.2; sfx("blip"); return exToast("Para atacar de longe você precisa de um arco. O armeiro da feira vende."); }
  const h = EX.hero; EX.cool = BOW_DRAW + .45; sfx("guard");
  EX.draw = {t: 0, aim: {x: h.aim.x, y: h.aim.y}};
}
// solta a corda: a flecha sai da mão do arco, com um brilho, e a corda fica vibrando um instante
function exRelease() {
  const h = EX.hero, a = EX.draw.aim, [bx, by] = bowHand(a), x = h.x + (bx - 16) * OW_SCALE, y = h.y - 32 + by * OW_SCALE;
  EX.lastAim = a; EX.draw = null; EX.shoot = .3; sfx("spear");
  EX.spear = {x, y, vx: a.x * 260, vy: a.y * 260, left: 120, stuck: 0};
  exBurst(x + a.x * 4, y + a.y * 4, ["#ffffff", "#ffd23a"], 5);
}
/* mouse (para quem anda com WASD): a mira segue o cursor; botão esquerdo = golpe, direito = flecha, na direção da mira */
function exAimAt(wx, wy) {
  const h = EX.hero, dx = wx - h.x, dy = wy - (h.y - 8), n = Math.hypot(dx, dy);
  if (n < 2) return;
  h.aim = {x: dx / n, y: dy / n};
  if (Math.abs(dx) > Math.abs(dy)) { h.dir = "side"; h.side = dx > 0 ? 1 : -1; } else h.dir = dy < 0 ? "up" : "down";
}
function exMouseWorld(ev) {
  const r = $("exCanvas").getBoundingClientRect(), c = EX.cam || {cx: 0, cy: 0};
  return {x: (ev.clientX - r.left) / VIEW_Z + c.cx, y: (ev.clientY - r.top) / VIEW_Z + c.cy};
}
/* esquiva: um rolamento rápido na direção em que anda (ou para onde mira), sem levar bote no caminho */
const DODGE_TIME = .24, DODGE_SPEED = 3.2, DODGE_COOL = .75;
function exDodge() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.draw || EX.dodge || (EX.dodgeCool || 0) > 0) return;
  const h = EX.hero, ix = (exKeys.has("right") ? 1 : 0) - (exKeys.has("left") ? 1 : 0), iy = (exKeys.has("down") ? 1 : 0) - (exKeys.has("up") ? 1 : 0), n = Math.hypot(ix, iy);
  const v = n ? {x: ix / n, y: iy / n} : h.aim;
  EX.dodge = {t: DODGE_TIME, vx: v.x, vy: v.y}; EX.dodgeCool = DODGE_COOL;
  EX.invulnUntil = Math.max(EX.invulnUntil, performance.now() + DODGE_TIME * 1000 + 120);
  exBurst(h.x, h.y - 2, ["#d8c49a", "#a89a72", "#ffffff"], 6); sfx("esquiva");
}
// pega a pele do chão: vai para a bolsa (vende na feira)
function pickLoot(l) {
  EX.loot = EX.loot.filter(q => q !== l); vit();
  G.pelts[l.id] = (G.pelts[l.id] || 0) + 1; save(); sfx("heal");
  exBurst(l.x, l.y - 4, ["#ffffff", "#ffd23a"], 8);
  exToast(`Pegou: ${peltName(l.id).toLowerCase()} (vale R$ ${peltValue(l.id)} na feira).`); exHud();
}
// pele no chão: trouxinha com a cor do tipo (couro, escamas, penas, casco, presas), pulando e brilhando
function drawLoot(x, l, cx, cy, now) {
  const n = peltName(l.id), col = /Escamas/.test(n) ? ["#b8c4c8", "#7e8c92"] : /Penas/.test(n) ? ["#ececf0", "#a8a8b4"] : /Casco/.test(n) ? ["#9a8a7a", "#6a5c4e"] : /Presas/.test(n) ? ["#f4ecd8", "#c8bca0"] : ["#a86f40", "#7a4a2a"];
  const sx = Math.round(l.x - cx), sy = Math.round(l.y - cy) - (Math.floor(now / 300) % 2);
  x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(sx - 4, Math.round(l.y - cy), 8, 1);
  x.fillStyle = OUTLINE; x.fillRect(sx - 4, sy - 6, 8, 6); x.fillRect(sx - 3, sy - 7, 6, 8);
  x.fillStyle = col[0]; x.fillRect(sx - 3, sy - 6, 6, 5); x.fillStyle = col[1]; x.fillRect(sx - 3, sy - 2, 6, 1);
  x.fillStyle = "#e5001c"; x.fillRect(sx - 1, sy - 6, 1, 5);   // amarração
  if (Math.floor(now / 160) % 6 === 0) { x.fillStyle = "#ffffff"; x.fillRect(sx + 3, sy - 9, 1, 1); x.fillRect(sx + 2, sy - 8, 3, 1); x.fillRect(sx + 3, sy - 7, 1, 1); }
}
function exHit(en) {
  const a = en.a, d = rnd(6, 10) + G.lv - 1 + weaponAtk();
  exBurst(en.x, en.y - entH(en) / 2, ["#ffffff", "#ffd23a"], 8);
  if (!a.boss && (G.lv - (a.lv || 1) >= ONE_HIT_LEVELS || d >= a.hp)) {
    en.alive = false; en.koUntil = performance.now() + 1100; sfx("crit");
    exBurst(en.x, en.y - 6, ["#d8d2c0", "#a89f8a", "#ffffff"], 14);
    curZone = EX.zone;
    exToast(`Abateu ${a.name.toLowerCase()} com um golpe só!` + reward(a, G.lv - (a.lv || 1) >= ONE_HIT_LEVELS ? WEAK_XP : ONE_HIT_XP, !en.aquatic));
    if (!en.aquatic) EX.loot.push({id: a.id, x: en.x, y: en.y, t0: performance.now()});   // a pele fica no chão até ele passar por cima (peixe: vai direto para a bolsa)
    exHud();
    return;
  }
  sfx("hit");
  exStartBattle(en, {firstHit: Math.min(d, a.hp - 1)});
}
function exStartBattle(en, opts) {
  if (EX.locked) return;
  EX.locked = true; EX.fighting = en; exKeys.clear();
  setTimeout(() => battleCutin(opts.enemyFirst ? "ambush" : "first", () => {
    $("explore").hidden = true; fromExplore = true; curZone = EX.zone; bossFight = en.boss;
    init({animal: en.a, ...opts});
  }), opts.enemyFirst ? 0 : 160);
}

/* ---------- atualização ---------- */
function exMove(en, ux, uy, sp) {
  const ok = slide(en, ux * sp, uy * sp);
  if (ux) en.face = ux > 0 ? 1 : -1;
  if (ok) en.walk += sp;
  return ok;
}
function exAnimal(en, dt, now) {
  if (en.aquatic) return exFish(en, dt, now);
  const h = EX.hero, dx = h.x - en.x, dy = h.y - en.y, dist = Math.hypot(dx, dy) || 1;
  const safe = now < EX.invulnUntil || EX.locked;
  if (dist < en.hw + h.hw + 3 && !safe) return exStartBattle(en, {enemyFirst: true});
  if (en.boss) {   // o chefe espera parado, soltando brilho
    if (Math.random() < dt * 8) EX.fx.push({x: en.x + (Math.random() - .5) * en.w, y: en.y - Math.random() * en.h, vx: 0, vy: -14, life: .8, col: (AURA[en.a.id] || ["#ffd23a"])[Math.random() * 2 | 0]});
    return;
  }
  if (now < en.stunUntil) { exMove(en, -dx / dist, -dy / dist, en.speed * .8 * dt); return; }   // assustado, foge
  if (en.state === "windup") { if (now > en.until) en.state = "chase"; else return; }
  if (dist < CHASE_RANGE && !safe) {
    if (en.state !== "chase") { en.state = "windup"; en.until = now + 450; en.face = dx > 0 ? 1 : -1; animalCry(en.a.id, en.boss, .55); return; }   // "!" (e o grito) antes de correr
    exMove(en, dx / dist, dy / dist, en.speed * 1.3 * dt);
    return;
  }
  if (en.state === "chase") en.state = "wander";
  if (now > en.until) {   // passeia perto de onde nasceu
    if (Math.hypot(en.homeX - en.x, en.homeY - en.y) > 40) { const t = Math.atan2(en.homeY - en.y, en.homeX - en.x); en.vx = Math.cos(t); en.vy = Math.sin(t); }
    else if (Math.random() < .4) en.vx = en.vy = 0;
    else { const t = Math.random() * Math.PI * 2; en.vx = Math.cos(t); en.vy = Math.sin(t); }
    en.until = now + 700 + Math.random() * 1600;
  }
  if ((en.vx || en.vy) && !exMove(en, en.vx, en.vy, en.speed * .6 * dt)) en.until = 0;
}
function exUpdate(dt, now) {
  const h = EX.hero;
  if (EX.boarding && busPull(now)) return;
  EX.cool = Math.max(0, EX.cool - dt); EX.jab = Math.max(0, EX.jab - dt); EX.shoot = Math.max(0, (EX.shoot || 0) - dt);
  if (EX.draw && (EX.draw.t += dt) >= BOW_DRAW) exRelease();
  if (EX.spits.length && !EX.dialog && !EX.camp) { exSpits(dt, now); if (!EX || EX.locked) return; }
  if (EX.camp) {   // sons da fogueira: ronco com assobio enquanto dorme; ao dormir, a faixa do amanhecer traz o galo
    const c = EX.camp, el = now - c.t0;
    if (campAsleep(c, el) && !c.dawned && now - (c.snoreT || 0) > 1700) { c.snoreT = now; sfx("ronco"); }   // o amanhecer interrompe o ronco
    if (CAMP_DAWN_AT[c.kind] && el > CAMP_DAWN_AT[c.kind] && !c.dawned) {   // passa a faixa do amanhecer (galo e sol); por trás dela vira dia
      c.dawned = true;
      const toNight = c.kind === "noite";   // atrás da faixa o mundo troca: noite (lua e lobo) ou dia (sol e galo)
      dawnWipe(() => { c.day = true; G.night = toNight; EX.night = toNight; save(); exHud(); musicStart("local"); }, toNight ? "Anoiteceu" : `Amanheceu · Dia ${G.day + 1}`, toNight);
    }
  }
  // aviso "segure C para pular" com a barrinha enchendo (0,7 s segurando pula a cena)
  const sk = $("exSkip");
  if (EX.camp) {
    sk.hidden = false;
    const p = EX.skipHold ? Math.min(1, (now - EX.skipHold) / 700) : 0;
    sk.style.setProperty("--p", p * 100 + "%");
    if (p >= 1) { EX.skipHold = 0; return campSkip(); }
  } else if (!sk.hidden) sk.hidden = true;
  if (EX.camp && now - EX.camp.t0 > EX.camp.dur) exCampEnd();
  for (const l of EX.loot) if (now - l.t0 > 500 && Math.hypot(l.x - h.x, l.y - h.y) < 11) pickLoot(l);
  EX.dodgeCool = Math.max(0, (EX.dodgeCool || 0) - dt);
  if (EX.dodge) {   // rolando: anda rápido na direção escolhida e deixa poeira
    const dg = EX.dodge, sp = HERO_SPEED * DODGE_SPEED * dt;
    slide(h, dg.vx * sp, dg.vy * sp); h.walk += sp; h.movedT = now;
    if (Math.random() < .6) EX.fx.push({x: h.x + (Math.random() - .5) * 6, y: h.y, vx: -dg.vx * 20, vy: -8, life: .3, col: "#d8c49a", g: 8});
    if ((dg.t -= dt) <= 0) EX.dodge = null;
  }
  let ix = (exKeys.has("right") ? 1 : 0) - (exKeys.has("left") ? 1 : 0), iy = (exKeys.has("down") ? 1 : 0) - (exKeys.has("up") ? 1 : 0);
  if (EX.dodge) ix = iy = 0;
  if (EX.locked || EX.dialog || EX.draw || EX.camp || !$("opcoes").hidden || !$("caderno").hidden || !$("equipar").hidden || !$("revela").hidden) ix = iy = 0;
  if (ix || iy) {
    const n = Math.hypot(ix, iy), sp = HERO_SPEED * dt;
    if (!(EX.jab > 0)) {   // durante a estocada a lança e o corpo ficam virados para onde ela foi (a mira do mouse), mesmo andando
      h.aim = {x: ix / n, y: iy / n};
      if (ix) { h.side = ix; h.dir = "side"; }   // andando para os lados (ou na diagonal): de perfil
      else h.dir = iy < 0 ? "up" : "down";
    }
    if (slide(h, ix / n * sp, iy / n * sp) || nudge(h, ix, iy)) {
      h.walk += sp; h.movedT = now;
      if ((h.dust = (h.dust || 0) + sp) > 13) {   // a cada passo: poeirinha na trilha ou folhinhas no mato alto
        h.dust = 0;
        const ch = stageTile(Math.floor(h.x / TILE), Math.floor(h.y / TILE)), grass = ch === ",";
        for (let k = 0; k < (grass ? 3 : 2); k++) EX.fx.push({x: h.x + (Math.random() - .5) * 6, y: h.y - (grass ? 4 : 0), vx: (Math.random() - .5) * 16 - ix * 6, vy: grass ? -18 - Math.random() * 10 : -6,
          life: grass ? .45 : .3, col: grass ? (k % 2 ? "#5fae52" : "#8fd06a") : ch === "-" || ch === "=" ? "#d8c49a" : "#a89a72", g: grass ? 70 : 8});
      }
    }
  }
  if (!EX.locked) {
    const ch = stageTile(Math.floor(h.x / TILE), Math.floor(h.y / TILE));
    if (ch === "E") { if (!STAGE_PREV[EX.zone]) return exitExplore(); EX.locked = true; return startExplore(STAGE_PREV[EX.zone], null, "back"); }   // volta pela trilha
    if (ch === "G" && gateOpen()) { EX.locked = true; return startExplore(EX.st.next); }
  }
  const s = EX.spear;
  if (s && s.stuck) { s.stuck -= dt; if (s.stuck <= 0) EX.spear = null; }
  else if (s) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.left -= Math.hypot(s.vx, s.vy) * dt;
    const hit = EX.ents.find(en => en.alive && Math.hypot(en.x - s.x, en.y - entH(en) / 2 - s.y) < en.hw + 6);
    if (hit) { EX.spear = null; exHit(hit); }
    else if (spearBlocked(s.x, s.y + 10)) { s.stuck = .35; sfx("guard"); }
    else if (s.left <= 0) s.stuck = .35;
  }
  if (!EX.dialog && !EX.camp) for (const en of EX.ents) if (en.alive && EX) exAnimal(en, dt, now);   // bichos param com o painel aberto
  EX.fx = EX.fx.filter(q => (q.life -= dt) > 0);
  for (const q of EX.fx) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g ?? 60) * dt; }
  exAmbient(dt, now);
}
function exBurst(x, y, cols, n) {
  for (let i = 0; i < n; i++) { const t = Math.random() * Math.PI * 2, v = 30 + Math.random() * 40; EX.fx.push({x, y, vx: Math.cos(t) * v, vy: Math.sin(t) * v - 20, life: .4 + Math.random() * .3, col: cols[i % cols.length]}); }
}

/* ---------- desenho ---------- */
const OW_ART = {};
function overworldArt(dir, f) { const key = dir + f; return OW_ART[key] || (OW_ART[key] = artCanvas("hero/walk/" + dir, f)); }
// mato alto na frente dos pés de quem está nele
function grassOver(x, ent, cx, cy) {
  const ty = Math.floor(ent.y / TILE);
  for (let tx = Math.floor((ent.x - ent.hw) / TILE); tx <= Math.floor((ent.x + ent.hw) / TILE); tx++)
    if (stageTile(tx, ty) === ",") x.drawImage(EX.map, tx * TILE, ty * TILE + 9, TILE, 7, tx * TILE - cx, ty * TILE + 9 - cy, TILE, 7);
}
function drawShadow(x, sx, sy, w) { x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(sx - w / 2, sy - 1, w, 2); x.fillRect(sx - w / 2 + 2, sy - 2, w - 4, 4); }
function drawHeroEnt(x, h, cx, cy, now) {
  const sx = snap(h.x - cx), sy = snap(h.y - cy);
  if (EX.boarding) return;   // já subiu no ônibus
  if (now < EX.invulnUntil && Math.floor(now / 100) % 2) return;
  const walking = now - h.movedT < 90, step = Math.floor(h.walk / 7);
  const art = IMG["hero/walk/" + (h.dir === "side" ? "down" : h.dir)];   // arte em imagem (data/art.js): quadros da caminhada lado a lado
  const bowAim = EX.draw ? EX.draw.aim : EX.shoot > 0 && EX.lastAim, pull = EX.draw ? Math.min(1, EX.draw.t / BOW_DRAW) : 0;
  let img, B;
  if (bowAim && !art) {   // atirando: braços apontados para a mira, uma mão no arco e a outra puxando a corda
    B = bowHand(bowAim);
    const N = [B[0] - bowAim.x * (4 + pull * 3), B[1] - bowAim.y * (4 + pull * 3)], r = v => v.map(Math.round), left = bowAim.x < -.1;
    img = rigCanvas(bowAim.y < -.35 ? "back" : "front", {lh: r(left ? B : N), rh: r(left ? N : B)}, {...rhanonLook(), bowBack: false}, OW_SCALE);
  } else if (h.dir === "side" && !art) {   // de perfil: 4 passos; na estocada, braços para frente (a lança vem por fora)
    const sideJab = EX.jab > 0 && Math.abs(h.aim.y) < .5;
    img = rigSideCanvas({step: walking ? "walk" + step % 4 : "stand", dy: walking ? (step % 2 === 0 ? 1 : 0) : Math.floor(now / 700) % 2, face: now % 3300 < 130 ? "blink" : undefined, weapon: sideJab ? "jab" : EX.jab > 0 ? null : "diag", lean: sideJab ? 2 : 0, side: h.side || 1},
      {...rhanonLook(), bowBack: !!G.equip.ranged && !(EX.shoot > 0)}, OW_SCALE);
  } else img = art ? overworldArt(h.dir === "side" ? "down" : h.dir, walking ? step % art.frames : 0)
    : heroOverworld(h.dir, walking ? ["walkA", "stand", "walkB", "stand"][step % 4] : "stand", EX.jab <= 0, !(EX.shoot > 0), h.side || 1,
        walking ? {} : {dy: Math.floor(now / 700) % 2, face: now % 3300 < 130 ? "blink" : undefined});   // parado: respira e pisca
  const iw = art ? art.w / art.scale : img.width, ih = art ? art.h / art.scale : img.height;
  const ox = EX.jab > 0 ? Math.round(h.aim.x * 3) : 0, oy = EX.jab > 0 ? Math.round(h.aim.y * 3) : 0;
  // estocada da lança; de costas (golpe para cima) ela vai atrás do corpo e só a ponta aparece acima da cabeça
  const behind = h.dir === "up", jab = () => {
    const bx = sx + ox, by = sy - 12 + oy, L = behind ? 27 : 21;
    spearShaft(x, bx - h.aim.x * 4, by - h.aim.y * 4, bx + h.aim.x * L, by + h.aim.y * L);
    pxl(x, bx + h.aim.x * (L + 1), by + h.aim.y * (L + 1), "#eef3f5"); pxl(x, bx + h.aim.x * L, by + h.aim.y * L, "#cfd8dc");
  };
  drawShadow(x, sx, sy, 12);
  if (EX.jab > 0 && behind) jab();
  x.drawImage(img, sx - iw / 2 + ox, sy - ih + 1 + oy, iw, ih);
  if (B) drawAimBow(x, sx - iw / 2 + B[0] * OW_SCALE, sy - ih + 1 + B[1] * OW_SCALE, bowAim, pull, !!EX.draw, now);
  if (EX.jab > 0 && !behind) jab();
  grassOver(x, h, cx, cy);
}
// arco virado para a mira: a corda vai até o ponto puxado e, enquanto puxa, a flecha fica encaixada
function drawAimBow(x, X, Y, a, pull, nocked, now) {
  const px = -a.y, py = a.x, L = 5;
  for (let k = -L; k <= L; k++) {
    const b = 2.2 * (1 - k * k / (L * L)), bx = X + px * k + a.x * b, by = Y + py * k + a.y * b;
    pxl(x, bx, by + 1, OUTLINE); pxl(x, bx, by, "#9c6339");
  }
  const vib = !nocked && Math.floor(now / 40) % 2 ? 1 : 0;   // corda vibrando depois de soltar
  const nx = X - a.x * (pull * 4 + vib), ny = Y - a.y * (pull * 4 + vib);
  lineP(x, X + px * L, Y + py * L, nx, ny, "#f4ecd8"); lineP(x, nx, ny, X - px * L, Y - py * L, "#f4ecd8");
  if (nocked) {
    lineP(x, nx, ny, X + a.x * 5, Y + a.y * 5, "#c9a46a"); pxl(x, X + a.x * 6, Y + a.y * 6, "#eef3f5");
    pxl(x, nx - a.y, ny + a.x, "#e5001c"); pxl(x, nx + a.y, ny - a.x, "#e5001c");
  }
}
function drawAnimalEnt(x, en, cx, cy, now) {
  const sx = snap(en.x - cx), sy = snap(en.y - cy), w = en.w, hg = en.h;
  if (sx < -40 || sx > VIEW_W + 40 || sy < -8 || sy > VIEW_H + 40) return;
  let bob = (en.vx || en.vy || en.state === "chase") ? Math.floor(en.walk / 5) % 2 : Math.floor(now / 500) % 2, img = en.img;
  if (!en.alive) { img = en.ko; bob = 0; if (en.koUntil - now < 400 && Math.floor(now / 80) % 2) return; }   // desmaiado, pisca e some
  else if (en.img2) { if (bob) img = en.img2; bob = 0; if (en.blink && (now + en.homeX * 7) % 3600 < 140) img = en.blink; }   // traço novo: troca de quadro e pisca
  if (en.aquatic && en.alive) {   // na água: só a parte de cima aparece, com marolinhas em volta
    const vis = Math.round(hg * .6), top = sy - vis + 2 + (Math.floor(now / 400 + en.x) % 2), sh = img.height * .6;
    x.save(); if (en.a.tint) x.filter = en.a.tint;
    if (en.face > 0) { x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, 0, 0, img.width, sh, -Math.round(w / 2), top, w, vis); }
    else x.drawImage(img, 0, 0, img.width, sh, sx - Math.round(w / 2), top, w, vis);
    x.restore();
    const k = Math.floor(now / 260) % 2; x.fillStyle = "#ffffffc0";
    x.fillRect(Math.round(sx - w / 2 - 3 + k), top + vis - 1, 4, 1); x.fillRect(Math.round(sx + w / 2 - 1 - k), top + vis - 1, 4, 1);
    return;
  }
  drawShadow(x, sx, sy, Math.max(8, Math.round(w * .7)));
  x.save();
  if (en.a.tint) x.filter = en.a.tint;
  if (en.face > 0) { x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, -Math.round(w / 2), sy - hg - bob, w, hg); }
  else x.drawImage(img, sx - Math.round(w / 2), sy - hg - bob, w, hg);
  x.restore();
  grassOver(x, en, cx, cy);
}
// etiqueta de nível (verde = cai com um golpe, vermelha = chefe) e "!" quando o bicho vê o Rhanon
function drawAnimalTags(x, en, cx, cy, now) {
  const sx = Math.round(en.x - cx), sy = Math.round(en.y - cy) - Math.round(en.h) - 4;
  if (sx < -20 || sx > VIEW_W + 20 || sy < -10 || sy > VIEW_H) return;
  const lv = String(en.a.lv || 1), bw = lv.length * 4 + 3;
  x.fillStyle = OUTLINE; x.fillRect(sx - bw / 2 - 1, sy - 8, bw + 2, 9);
  x.fillStyle = en.boss ? "#e5001c" : G.lv - (en.a.lv || 1) >= ONE_HIT_LEVELS ? "#2fa84a" : "#3a4a3a";
  x.fillRect(sx - bw / 2, sy - 7, bw, 7);
  drawTinyNumber(x, lv, Math.round(sx - bw / 2) + 2, sy - 6, "#ffffff");
  if (en.state === "windup" && now < en.until) {
    x.fillStyle = OUTLINE; x.fillRect(sx - 3, sy - 20, 7, 11); x.fillStyle = "#ffffff"; x.fillRect(sx - 2, sy - 19, 5, 9);
    glyphP(x, "bang", "#e5001c", sx, sy - 17);
  }
}
function exDraw(now) {
  const cv = $("exCanvas"), x = cv.getContext("2d"), h = EX.hero;
  if (cv.width !== VIEW_W * RS) { cv.width = VIEW_W * RS; cv.height = VIEW_H * RS; }
  x.setTransform(RS, 0, 0, RS, 0, 0);
  x.imageSmoothingEnabled = false;
  const cx = snap(camAxis(EX.map.width, VIEW_W, h.x - VIEW_W / 2)), cy = snap(camAxis(EX.map.height, VIEW_H, h.y - 12 - VIEW_H / 2));
  EX.cam = {cx, cy};
  x.fillStyle = "#0e1a12"; x.fillRect(0, 0, VIEW_W, VIEW_H);   // borda em volta das fases pequenas
  const sx0 = Math.max(0, cx), sy0 = Math.max(0, cy), sw = Math.min(VIEW_W, EX.map.width - sx0), sh = Math.min(VIEW_H, EX.map.height - sy0);
  x.drawImage(EX.map, sx0, sy0, sw, sh, sx0 - cx, sy0 - cy, sw, sh);
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE), [nx, ny] = viewTiles();
  for (let ty = t0y; ty <= t0y + ny; ty++) for (let tx = t0x; tx <= t0x + nx; tx++) {
    const ch = stageTile(tx, ty), sx = tx * TILE - cx, sy = ty * TILE - cy;
    if (ch === "~") {   // água: brilhos piscando e uma marolinha correndo
      if ((tx * 7 + ty * 13 + Math.floor(now / 450)) % 9 === 0) { x.fillStyle = "#ffffffb0"; x.fillRect(sx + 4 + (tx % 3) * 3, sy + 6 + (ty % 2) * 4, 3, 1); }
      const off = Math.floor(now / 90 + tx * 5 + ty * 3) % 16; x.fillStyle = "#bff3ff70"; x.fillRect(sx + off, sy + 3 + (tx * 5 + ty * 7) % 10, Math.min(4, 16 - off), 1);
    }
    if (ch === "T" && (tx * 3 + ty * 5) % 3 === 0) {   // copa balançando com o vento: dois pontinhos de luz indo e voltando
      const sw = Math.round(Math.sin(now / 650 + tx * .9 + ty * .4) * 1.4); x.fillStyle = EX.night ? "#5a8a6a90" : "#9ad87a";
      x.fillRect(sx + 5 + sw, sy + 3, 2, 1); x.fillRect(sx + 9 + sw, sy + 5, 1, 1);
    }
    if (ch === "G" && !gateOpen()) drawGate(x, sx, sy, EX.pal);
    if (ch === "F") drawFire(x, sx, sy, now);
  }
  EX.loot.forEach(l => drawLoot(x, l, cx, cy, now));   // no chão, embaixo de todo mundo
  const alive = EX.ents.filter(en => en.alive), knocked = EX.ents.filter(en => !en.alive && en.ko && en.koUntil > now);
  const people = EX.spots.filter(s => PEOPLE.includes(s.kind)).map(s => ({y: s.y + 5, draw: () => drawNpc(x, s, cx, cy, now)}));
  if (EX.bus) people.push({y: EX.bus.y + EX.bus.h, draw: () => drawBus(x, EX.bus, cx, cy, now)});
  [...alive.map(en => ({y: en.y, draw: () => drawAnimalEnt(x, en, cx, cy, now)})), ...knocked.map(en => ({y: en.y, draw: () => drawAnimalEnt(x, en, cx, cy, now)})), ...people, (EX.camp ? {y: EX.camp.y, draw: () => drawCampHero(x, cx, cy, now)} : {y: h.y, draw: () => drawHeroEnt(x, h, cx, cy, now)})]
    .sort((a, b) => a.y - b.y).forEach(o => o.draw());
  const s = EX.spear;
  if (s) {
    const n = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / n, uy = s.vy / n, sx = s.x - cx, sy = s.y - cy;
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(Math.round(sx) - 3, Math.round(sy + 10), 6, 1);
    lineP(x, sx - ux * 5, sy - uy * 5, sx + ux * 4, sy + uy * 4, "#c9a46a");   // flecha: haste, ponta e penas
    pxl(x, sx + ux * 5, sy + uy * 5, "#eef3f5"); pxl(x, sx - ux * 5 - uy, sy - uy * 5 + ux, "#e5001c"); pxl(x, sx - ux * 5 + uy, sy - uy * 5 - ux, "#e5001c");
  }
  drawAmbient(x, cx, cy, now, false);
  if (EX.night) drawNightShade(x, cx, cy, now);
  drawAmbient(x, cx, cy, now, true);
  if (EX.camp && EX.camp.kind !== "fogueira") drawCampSky(x, cx, cy, now);
  for (const s of EX.spits) {   // jato d'água: gota com rastro
    const n = Math.hypot(s.vx, s.vy) || 1, px = Math.round(s.x - cx), py = Math.round(s.y - cy);
    x.fillStyle = "#86d6ff80"; x.fillRect(Math.round(px - s.vx / n * 4), Math.round(py - s.vy / n * 4), 2, 2);
    x.fillStyle = OUTLINE; x.fillRect(px - 2, py - 2, 4, 4); x.fillStyle = "#86d6ff"; x.fillRect(px - 1, py - 1, 3, 3); x.fillStyle = "#ffffff"; x.fillRect(px - 1, py - 1, 1, 1);
  }
  for (const q of EX.fx) { x.fillStyle = q.col; x.fillRect(Math.round(q.x - cx) - 1, Math.round(q.y - cy) - 1, 2, 2); }
  alive.forEach(en => drawAnimalTags(x, en, cx, cy, now));
  drawSpotPrompt(x, cx, cy, now);
  if (EX.mouse && now - EX.mouse.t < 2500 && !EX.dialog && !EX.camp) {   // mira no cursor: cruz com o centro aberto
    const mx = Math.round(EX.mouse.x - cx), my = Math.round(EX.mouse.y - cy), col = G.equip.ranged ? "#ffd23a" : "#ffffff";
    x.fillStyle = OUTLINE; for (const [a, b, w, hh] of [[-6, -1, 4, 3], [3, -1, 4, 3], [-1, -6, 3, 4], [-1, 3, 3, 4]]) x.fillRect(mx + a, my + b, w, hh);
    x.fillStyle = col; for (const [a, b, w, hh] of [[-5, 0, 3, 1], [3, 0, 3, 1], [0, -5, 1, 3], [0, 3, 1, 3]]) x.fillRect(mx + a, my + b, w, hh);
  }
}
// chamado pelo laço de animação (gfx/actors.js) a cada quadro
function exploreFrame(t, dt) {
  if (!EX || $("explore").hidden) return;
  exUpdate(dt, t);
  if (EX && !$("explore").hidden) exDraw(t);
}

/* ---------- textos na tela ---------- */
function exHud() {
  vit();
  const bar = (v, m, cls) => `<i class="hb ${cls}"><u style="width:${Math.round(100 * v / m)}%"></u></i>`;   // HUD: nome do lugar e chips com barrinhas
  $("exHud").innerHTML = `<b>${ZONES[EX.zone] ? zoneDef(EX.zone).n : SUB[EX.zone].n + (G.night ? " à noite" : "")}</b><span>Nv ${G.lv}</span>`
    + `<span>PV ${G.hp}/${maxHP(G.lv)}${bar(G.hp, maxHP(G.lv), "pv")}</span><span>PE ${G.sp}/${maxSP(G.lv)}${bar(G.sp, maxSP(G.lv), "pe")}</span>`
    + `<span>XP ${G.xp}/${need(G.lv)}${bar(G.xp, need(G.lv), "xp")}</span><span>R$ ${G.money}</span>`;
}
function exToast(msg) {
  const el = $("exMsg"); el.textContent = msg; el.classList.add("show");
  clearTimeout(exMsgTimer); exMsgTimer = setTimeout(() => el.classList.remove("show"), 3600);
}

/* ---------- controles: teclado e botões de toque ---------- */
function setupExploreInput() {
  const DIRS = {ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"};
  document.addEventListener("keydown", ev => {
    if (!EX || $("explore").hidden || !$("opcoes").hidden || !$("caderno").hidden) return;   // com opções ou caderno abertos, o teclado é deles
    if (EX.dialog) { dialogKey(ev); return; }
    if (EX.camp) {   // cena (abertura, fogueira): só segurar C pula
      ev.preventDefault();
      if ((ev.key === "c" || ev.key === "C") && !ev.repeat) EX.skipHold = performance.now();
      return;
    }
    const k = DIRS[ev.key];
    if (k) { exKeys.add(k); ev.preventDefault(); return; }
    if (ev.repeat) return;
    if ("zZjJ ".includes(ev.key)) { ev.preventDefault(); exStrike(); }
    else if (ev.key === "Shift" || ev.key === "c" || ev.key === "C") { ev.preventDefault(); exDodge(); }
    else if ("xXkK".includes(ev.key)) { ev.preventDefault(); exThrow(); }
    else if (ev.key === "Escape") exitExplore();
    else if ((ev.key === "i" || ev.key === "I") && !EX.locked) exOpenDialog("inventario");
    else if ((ev.key === "e" || ev.key === "E") && !EX.locked) openEquip();
  });
  document.addEventListener("keyup", ev => { const k = DIRS[ev.key]; if (k) exKeys.delete(k); if ((ev.key === "c" || ev.key === "C") && EX) EX.skipHold = 0; });
  // no celular: segurar o próprio aviso "segure C para pular"
  const sk = $("exSkip"), stop = () => { if (EX) EX.skipHold = 0; };
  sk.addEventListener("pointerdown", ev => { ev.preventDefault(); if (EX && EX.camp) EX.skipHold = performance.now(); });
  sk.addEventListener("pointerup", stop); sk.addEventListener("pointerleave", stop); sk.addEventListener("pointercancel", stop);
  window.addEventListener("blur", () => exKeys.clear());
  document.querySelectorAll("#exPad [data-dir]").forEach(b => {
    const k = b.dataset.dir, off = () => exKeys.delete(k);
    b.addEventListener("pointerdown", ev => { ev.preventDefault(); exKeys.add(k); b.setPointerCapture(ev.pointerId); });
    b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off);
  });
  $("exA").addEventListener("pointerdown", ev => { ev.preventDefault(); exStrike(); });
  $("exC").addEventListener("pointerdown", ev => { ev.preventDefault(); exDodge(); });
  const cv = $("exCanvas");
  cv.addEventListener("mousemove", ev => { if (EX && !EX.camp) { const w = exMouseWorld(ev); EX.mouse = {...w, t: performance.now()}; } });
  cv.addEventListener("mousedown", ev => {
    if (!EX || EX.locked || EX.dialog || EX.camp || (ev.button !== 0 && ev.button !== 2)) return;
    ev.preventDefault();
    const w = exMouseWorld(ev); EX.mouse = {...w, t: performance.now()}; exAimAt(w.x, w.y);
    ev.button === 0 ? exStrike() : exThrow();
  });
  cv.addEventListener("contextmenu", ev => ev.preventDefault());
  $("exB").addEventListener("pointerdown", ev => { ev.preventDefault(); exThrow(); });
  $("exExit").addEventListener("click", exitExplore);
  $("exBag").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp && EX.dialog !== "tutorial") EX.dialog === "inventario" ? exCloseDialog() : exOpenDialog("inventario"); });
}

/* ---------- aldeia e feira: pontos de conversa ---------- */
const SPOTS = {F: "fogueira", N: "tenda", V: "peles", C: "comida", R: "artesao", M: "armeiro", P: "aldeao", Q: "cabine", U: "onibus"};
const PEOPLE = ["peles", "comida", "artesao", "armeiro", "aldeao"];
const SPOT_LABEL = {fogueira: "descansar na fogueira", tenda: "dormir", peles: "vender peles", comida: "comprar comida", artesao: "ver roupas", armeiro: "ver armas e armaduras", aldeao: "conversar", cabine: "falar com o cobrador", onibus: "embarcar no ônibus"};
const VILLAGER_NAME = {aldeao1: "Caçador", aldeao2: "Ancião", aldeao3: "Aldeã", urbano1: "Peixeira", urbano2: "Erveira", urbano3: "Estivador"};
// dicas da gente do Ver-o-Peso (em Belém)
const BELEM_TIPS = [
  "Aqui na capital tem malandro esperto: segura a bolsa! Se um deles levar seu dinheiro, vença e ele devolve.",
  "Os urubus do Ver-o-Peso estão aqui desde antes de mim. Não mexe com eles que eles não mexem contigo.",
  "Na Cidade Velha tem iguana tomando sol nas praças. Parece calma, mas a cauda dela é um chicote.",
  "Dizem que de noite, na Cidade Velha, uma mulher de branco anda pelas ruas de pedra. É visagem, menino.",
  "No porto, os ratos são do tamanho de um gato. E à noite contam que a Cobra Norato sobe a baía.",
  "Do outro lado do canal ficam as Baixadas: casa de palafita e ponte de tábua. Na maré cheia, cuidado.",
  "A rede da pensão é baratinha, coisa de quinze reais. Dorme aí que amanhã a gente conversa.",
  "Erva de cheiro, banho de descarrego... aqui tem remédio para tudo. Menos para preguiça."
];
const VILLAGER_TIPS = [
  "Etiqueta verde em cima do bicho? Ele cai com um golpe só.",
  "Quando o bicho se encolhe tremendo, ele vai atacar: aperte Z quando o anel ficar verde e você bloqueia metade do golpe.",
  "Acertar o bicho primeiro, com a lança (Z) ou uma flecha (X), te dá o primeiro turno da luta.",
  "Três tempos certos seguidos na luta, golpe perfeito ou bloqueio, enchem a Fúria: aí a lança vira três estocadas de uma vez.",
  "Se o bicho te alcançar antes, quem começa batendo é ele. Fique esperto com o \"!\".",
  "A tocha do artesão assusta os bichos: eles fraquejam e você ataca de novo na mesma hora.",
  "Sem arco? Jogue a lança (Especial): bate forte, mas às vezes erra.",
  "O chefe de cada mata fica no fim da trilha. Vencer ele abre o caminho para a próxima.",
  "Na fogueira da aldeia dá para descansar até a noite ou dormir até o dia seguinte. As fogueiras das trilhas recuperam tudo.",
  "À noite a mata muda: morcegos, corujas, lobos-guará... e dizem que o Chupa-cabra ronda a mata.",
  "Contam que na mata fechada passa uma mula sem cabeça, cuspindo fogo pelo pescoço. E no lago... o Boitatá.",
  "O vendedor da feira paga bem por couro de jacaré. Dizem."
];
// ponto de conversa colado no Rhanon (o mais perto)
function nearSpot() {
  const h = EX.hero; let best = null, bd = 27;
  for (const s of EX.spots) { const d = Math.hypot(s.x - h.x, s.y - (h.y - 6)); if (d < bd) { bd = d; best = s; } }
  return best;
}
// de dia os aldeões gingam no ritmo da música; à noite os da aldeia dormem sentados e os da feira só ficam sentados
function drawNpc(x, s, cx, cy, now) {
  const mark = s.kind === "aldeao" && questMark(s.look);   // quem tem pedido fica acordado e com a folha sobre a cabeça
  const sx = snap(s.x - cx), sy = snap(s.y + 5 - cy), sleeping = EX.night && s.kind === "aldeao" && !mark;
  let pose, bob = 0;
  if (EX.night) pose = {sit: true, face: sleeping || (now / 1000 + s.tx) % 4 < .15 ? "blink" : undefined, dy: sleeping ? 1 : 0};
  else {
    const b = MUS.beat() ?? now / 625, step = Math.floor(b);   // sem música tocando, segue um ritmo parecido (96 batidas por minuto)
    pose = {...GINGA[step % 2], dy: b % 1 < .5 ? 1 : 0};
  }
  const img = villagerSprite(s.look, pose), hw = img.width / 2, top = sy - img.height + 1 - bob;
  drawShadow(x, sx, sy, pose.sit ? 14 : 10);
  if (EX.hero.x > s.x + 4) { x.save(); x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, -hw, top); x.restore(); }
  else x.drawImage(img, sx - hw, top);
  if (mark) drawQuestMark(x, sx, top - 4, mark, now);
  if (sleeping && !REDUCE) { const p = (now / 1100 + s.tx * .37) % 1; glyphP(x, "z", "#ffffff", sx + 4 + p * 6, top + 6 - p * 10); }
}
// setinha pulando em cima do ponto mais perto + texto "Z: ..." embaixo da tela
function drawSpotPrompt(x, cx, cy, now) {
  const s = !EX.dialog && !EX.locked ? nearSpot() : null, el = $("exPrompt"), txt = s ? `Z / GOLPE: ${SPOT_LABEL[s.kind]}` : "";
  if (el.textContent !== txt) { el.textContent = txt; el.classList.toggle("show", !!s); }
  if (!s) return;
  const px = Math.round(s.x - cx), py = Math.round(s.y - cy) - (PEOPLE.includes(s.kind) ? 30 : 10) - Math.floor(now / 250) % 2;
  x.fillStyle = OUTLINE; x.fillRect(px - 4, py - 1, 9, 2); x.fillRect(px - 3, py + 1, 7, 1); x.fillRect(px - 2, py + 2, 5, 1); x.fillRect(px - 1, py + 3, 3, 1);
  x.fillStyle = "#ffd23a"; x.fillRect(px - 3, py, 7, 1); x.fillRect(px - 2, py + 1, 5, 1); x.fillRect(px - 1, py + 2, 3, 1); x.fillRect(px, py + 3, 1, 1);
}
// painel do ponto de conversa; msg aparece em destaque (resultado da última ação)
function exOpenDialog(kind, msg, look) {
  look = look || EX.dialogLook; EX.dialogLook = look;
  const d = $("exDialog"); EX.dialog = kind; exKeys.clear(); sfx("blip");
  const say = (title, text) => { d.innerHTML = `<h2>${title}</h2><p>${text}</p>`; };
  if (kind === "fogueira" && EX.st.safe) {   // fogueira da aldeia: escolhe até quando descansar
    say("Fogueira", G.night ? "A noite está alta. Dormir aqui recupera tudo, e o dia seguinte começa."
      : "O fogo estala e esquenta. Descansar até a noite recupera metade de PV e PE, e à noite a mata muda. Dormir até o dia seguinte recupera tudo.");
    if (!G.night) btn("Descansar até a noite", () => exCampRest("noite"), false, d);
    btn("Dormir até o dia seguinte", () => exCampRest("dormir"), false, d);
  }
  else if (kind === "fogueira") {   // fogueira no meio da trilha: só um ponto para recuperar as forças
    say("Fogueira", "Um ponto para recuperar o fôlego no meio da trilha. Descansar recupera toda a vida e a energia.");
    btn("Descansar", () => exCampRest("fogueira"), false, d);
  }
  else if (kind === "tenda" && EX.zone === "veropeso") {   // Belém: rede na pensão do Ver-o-Peso (diária barata em PENSAO)
    say("Pensão do Ver-o-Peso", (G.night ? "Uma rede limpa, o cheiro da maré e o barulho do mercado acordando cedo. Dormir recupera tudo." : "Uma rede para quem é de fora. Dá para descansar até a noite (metade) ou dormir até o dia seguinte (tudo).") + ` Você tem R$ ${G.money}.`);
    // paga e passa a faixa do anoitecer (lua e lobo) ou do amanhecer (galo e sol), como na fogueira da aldeia
    const nap = k => ask(`Pagar R$ ${PENSAO[k]} pela rede${k === "noite" ? " até a noite" : " até amanhã"}?`, () => {
      if (G.money < PENSAO[k]) { sfx("blip"); return exOpenDialog("tenda", `Falta dinheiro: a diária é R$ ${PENSAO[k]}.`); }
      G.money -= PENSAO[k]; exNap(k);
    });
    if (!G.night) btn(`Descansar até a noite (R$ ${PENSAO.noite})`, nap("noite"), false, d);
    btn(`Dormir até o dia seguinte (R$ ${PENSAO.dormir})`, nap("dormir"), false, d);
  }
  else if (kind === "tenda") { say("Tenda", "Sua tenda. Dormir recupera tudo, mas o dia passa."); btn("Dormir", () => exNap("dormir"), false, d); }
  else if (kind === "peles") { say("Comprador de peles", "Couro bom vira dinheiro bom. Mostra o que você caçou."); peltButtons(d); }
  else if (kind === "comida") { say("Barraca de comida", "Mandioca, peixe assado, açaí e maniçoba. Barriga cheia, lança firme."); foodButtons(d); }
  else if (kind === "artesao") { say("Artesão", "Roupas tecidas à mão e tocha para assustar os bichos. Arma e armadura é com o armeiro, ali na barraca do meio. Quanto mais forte você fica, mais coisa eu te mostro."); gearButtons(d); }
  else if (kind === "armeiro") { say("Armeiro", "Lança, arco e flecha, armadura de couro... Me traz as peles certas e um trocado que eu faço coisa boa. Escolha com as setas e aperte Enter para fabricar."); forgePanel(d); }
  else if (kind === "inventario") { say("Bolsa", invSummary()); invButtons(d); }
  else if (kind === "cabine") busCabin(say, d);
  else if (kind === "onibus") busDoor(say, d);
  else villagerTalk(look, say, d);   // pedido (oferta ou entrega) ou uma dica (systems/journal.js)
  if (msg) d.insertAdjacentHTML("beforeend", `<p class="hint">${msg}</p>`);
  btn("Fechar", exCloseDialog, false, d);
  d.hidden = false; EX.confirming = null; EX.dialogT = performance.now();
  if (kind !== "armeiro" && kind !== "tutorial") { menuSelect(d, EX.keepSel ?? menuFirst(d)); EX.keepSel = null; }   // já começa com uma opção escolhida
}
/* ---------- BR-316: cabine do cobrador e o ônibus (fases parada e terminal) ---------- */
const busDest = () => EX.zone === "parada" ? "belem" : "ananindeua";
const busSide = () => EX.zone === "parada" ? -1 : 1;   // a estrada sai pela esquerda rumo a Belém e pela direita rumo a Ananindeua
function busCabin(say, d) {
  if (EX.zone === "terminal") return say("Guichê do terminal", G.passagem ? "Sua passagem vale ida e volta. O ônibus para Ananindeua sai assim que você subir." : "Sem passagem não dá para embarcar.");
  if (G.passagem) return say("Cobrador", "Passagem na mão! É só subir no ônibus. Ela vale ida e volta: do terminal de Belém dá para voltar quando quiser.");
  if (!BUS.open) return say("Cobrador", "O ônibus para Belém ainda não está saindo. Volta daqui a uns dias!");
  say("Cobrador", `Passagem para Belém, a capital: R$ ${BUS.price}, ida e volta. Você tem R$ ${G.money}.` + (G.money < BUS.price ? ` Faltam R$ ${BUS.price - G.money}: pele de bicho forte vale bem mais na feira.` : ""));
  btn(`Comprar passagem · R$ ${BUS.price}`, ask(`Comprar a passagem para Belém por R$ ${BUS.price}?`, () => {
    if (G.passagem || G.money < BUS.price) return;
    G.money -= BUS.price; G.passagem = true; save(); sfx("more"); exHud();
    exOpenDialog("cabine", "Passagem comprada! Agora é só subir no ônibus.");
  }), G.money < BUS.price, d);
}
function busDoor(say, d) {
  const dest = busDest(), n = dest === "belem" ? "Belém" : "Ananindeua";
  if (!G.passagem || !BUS.open) return say("Ônibus da BR-316", "O motorista aponta para a cabine: \"Sem passagem não sobe. Compra ali com o cobrador.\"");
  say("Ônibus da BR-316", `O motor já está ligado. Destino: ${n}.`);
  btn(`Embarcar para ${n}`, busLeave, false, d);
}
// sobe no ônibus: ele arranca e sai pela estrada; depois a viagem segue no mapa do Pará e entra na fase da outra cidade
function busLeave() {
  exCloseDialog(); EX.locked = true; exKeys.clear(); sfx("look");
  EX.boarding = {t0: performance.now(), vrum: 0};
}
function busPull(now) {
  const b = EX.bus, el = now - EX.boarding.t0;
  if (el > 350) b.dx = busSide() * ((el - 350) / 1000) ** 2 * 260;   // espera a porta fechar e acelera
  if (now - EX.boarding.vrum > 520) { EX.boarding.vrum = now; sfx("onibus"); }
  if (el < 2000) return false;
  const dest = busDest();
  EX.boarding = null; $("explore").hidden = true; $("exDialog").hidden = true; EX = null; exKeys.clear();
  busRide(dest, true);
  return true;
}
// ônibus vermelho visto de lado, frente virada para o lado em que a estrada sai (b.dx = quanto já andou)
function drawBus(x, b, cx, cy, now) {
  const f = busSide(), X = Math.round(b.x + b.dx - cx), Y = Math.round(b.y - cy), W = b.w, run = b.dx !== 0, bob = run && Math.floor(now / 90) % 2;
  x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(X + 3, Y + 27, W - 6, 4);
  const y = Y + bob;
  x.fillStyle = OUTLINE; x.fillRect(X, y + 3, W, 24);
  x.fillStyle = "#d62828"; x.fillRect(X + 1, y + 4, W - 2, 22);
  x.fillStyle = "#f4ecd8"; x.fillRect(X + 1, y + 4, W - 2, 3);   // teto claro
  x.fillStyle = "#9c1a1a"; x.fillRect(X + 1, y + 22, W - 2, 4);   // saia escura
  x.fillStyle = "#f2c230"; x.fillRect(X + 1, y + 18, W - 2, 2);   // faixa amarela
  const front = f < 0 ? X + 1 : X + W - 9;
  for (let k = 0; k < 6; k++) { const wx = f < 0 ? X + 12 + k * 8 : X + 3 + k * 8; x.fillStyle = OUTLINE; x.fillRect(wx, y + 8, 7, 8); x.fillStyle = "#9ad0e8"; x.fillRect(wx + 1, y + 9, 5, 6); x.fillStyle = "#e8f6ff"; x.fillRect(wx + 1, y + 9, 2, 2); }
  x.fillStyle = OUTLINE; x.fillRect(front, y + 7, 8, 12); x.fillStyle = "#bfe8ff"; x.fillRect(front + 1, y + 8, 6, 9);   // para-brisa
  const door = f < 0 ? X + 11 : X + W - 19; x.fillStyle = OUTLINE; x.fillRect(door - 1, y + 8, 1, 17);   // porta perto da frente
  x.fillStyle = "#ffe98a"; x.fillRect(f < 0 ? X + 1 : X + W - 3, y + 21, 2, 2);   // farol
  for (const wx of [X + 10, X + W - 14]) {
    x.fillStyle = OUTLINE; x.fillRect(wx, Y + 23, 8, 7); x.fillStyle = "#3a3a40"; x.fillRect(wx + 1, Y + 24, 6, 5);
    x.fillStyle = "#a8a8b0"; x.fillRect(wx + 3, Y + 26, 2, 1); if (run && Math.floor(now / 70) % 2) x.fillRect(wx + 3, Y + 25, 1, 3);
  }
  if (run) { x.fillStyle = "#c8c4b8a0"; x.fillRect(f < 0 ? X + W + 2 : X - 5, Y + 24 - (Math.floor(now / 120) % 3), 3, 2); }   // fumaça do escapamento
}
// dormir numa rede ou tenda: passa a faixa do anoitecer (lua e lobo) ou do amanhecer (galo e sol), como na fogueira da aldeia
function exNap(k) {
  exCloseDialog(); EX.locked = true; exKeys.clear();
  const night = k === "noite";
  dawnWipe(() => { const msg = rest(k, true, true); EX.night = G.night; exHud(); musicStart("local"); setTimeout(() => { if (!EX) return; EX.locked = false; exToast(msg); }, DAWN_MS * .6); }, night ? "Anoiteceu" : `Amanheceu · Dia ${G.day + 1}`, night);
}
/* "Deseja vender...?": o painel vira a pergunta com Sim e Não (setas escolhem, Z confirma, X é o Não).
   Depois de responder, a loja volta com a mesma opção escolhida. */
function exConfirm(text, yes) {
  const d = $("exDialog"), back = EX.dialog, bs = menuButtons(d);
  EX.keepSel = Math.max(0, bs.findIndex(b => b.classList.contains("sel")));
  d.innerHTML = `<h2>Confirmar</h2><p>${text}</p>`; sfx("look");
  btn("Sim", yes, false, d); btn("Não", () => exOpenDialog(back), false, d);
  EX.confirming = back; menuSelect(d, 0);
}
// nas lojas da exploração pergunta antes; no resto (testes, mapa) faz direto
const ask = (text, fn) => () => EX && EX.dialog && !$("explore").hidden ? exConfirm(text, fn) : fn();
// descansar/dormir na fogueira: Rhanon senta do lado do fogo (como na tela inicial) e só depois recupera
function exCampRest(kind) {
  const h = EX.hero, f = EX.spots.filter(s => s.kind === "fogueira").sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
  $("exDialog").hidden = true; EX.dialog = null; exKeys.clear();
  EX.camp = {kind, startNight: EX.night, t0: performance.now(), dur: campWake(kind) + 2600, x: f.x + (h.x < f.x ? -14 : 14), y: f.y + 5, fx: f.x, fy: f.y, ftx: f.tx, fty: f.ty};
}
// cena de abertura: amanhece, Rhanon acorda do lado da fogueira da aldeia, se espreguiça e o jogo começa
function startIntro() { vit(); G.night = false; save(); startExplore("aldeia", exIntro); }   // a aventura sempre começa de manhã
function exIntro() {
  const h = EX.hero, f = EX.spots.find(s => s.kind === "fogueira"), side = solidAt(f.x - 14, f.y + 5) ? 1 : -1;
  EX.camp = {kind: "intro", t0: performance.now(), dur: campWake("intro") + 2600, x: f.x + side * 14, y: f.y + 5, fx: f.x, fy: f.y, ftx: f.tx, fty: f.ty};
  h.x = EX.camp.x; h.y = EX.camp.y; h.dir = "down"; h.aim = {x: 0, y: 1};
  exToast("Ananindeua (PA) · manhã na aldeia...");
}
/* tutorial (jogo novo): depois de acordar, o caçador ensina os controles; só então o Rhanon anda e a ajuda aparece */
const TUTORIAL = [
  "Bom dia, Rhanon! Dormiu bem aí do lado da fogueira? Antes de ir para a mata, deixa eu te lembrar do básico.",
  "Para andar, use as setas ou W A S D. Shift (ou C) dá uma esquiva rápida: um rolamento que passa pelo bote do bicho sem levar.",
  "Z (ou Espaço) é o golpe de lança. Também serve para conversar com o pessoal e usar a fogueira e as barracas.",
  "X atira flechas, mas só depois que você comprar um arco com o armeiro da feira. Quem joga com o mouse mira no cursor: clique esquerdo golpeia, o direito atira.",
  "I abre a bolsa, com suas comidas e peles, e E abre o equipamento para trocar arma e roupa. Nos menus, as setas escolhem, Z confirma e X volta. Esc sai da fase.",
  "Na luta, quando aparecer um anel com Z, aperte Z na hora em que ele ficar verde: seu golpe sai perfeito, ou você bloqueia metade do ataque do bicho.",
  "Bicho com etiqueta verde cai com um golpe só. E se você acertar primeiro, começa a luta com vantagem. Boa caçada!"
];
function startTutorial() { EX.tutPage = 0; showTutorial(); }
function showTutorial() {
  const d = $("exDialog"), i = EX.tutPage, last = i === TUTORIAL.length - 1;
  EX.dialog = "tutorial"; exKeys.clear();
  d.innerHTML = `<h2>Caçador</h2><div class="tut"><canvas width="24" height="33"></canvas><p>${TUTORIAL[i]}</p></div>`;
  d.querySelector("canvas").getContext("2d").drawImage(villagerSprite("aldeao1"), 0, 0);   // retratinho de quem fala
  btn(last ? "Vamos lá!" : "Próximo", () => { if (last) endTutorial(); else { EX.tutPage++; sfx("blip"); showTutorial(); } }, false, d);
  d.hidden = false;
}
function endTutorial() {
  G.tutorial = false; save();
  $("exDialog").hidden = true; EX.dialog = null; $("explore").classList.remove("no-help"); sfx("more");
  exToast("Aldeia · chegue perto da fogueira ou dos aldeões e aperte Z. A trilha da direita leva à feira e, depois dela, à mata.");
}
// pular a cena: aplica na hora o que ela faria (noite ou dia) e termina
function campSkip() {
  const c = EX.camp; if (!c) return;
  if (c.kind === "noite" || c.kind === "dormir") { G.night = c.kind === "noite"; EX.night = G.night; musicStart("local"); }
  c.dawned = c.day = true; exCampEnd();
}
// fim da cena: o controle volta na hora e o resultado aparece no aviso do topo (sem reabrir o painel da fogueira)
function exCampEnd() {
  const kind = EX.camp.kind; EX.camp = null; EX.dialog = null; exKeys.clear();
  if (kind === "intro") return G.tutorial ? startTutorial() : rollOffer() ? announceOffer() : exToast("Aldeia · chegue perto da fogueira ou dos aldeões e aperte Z. A trilha da direita leva à feira e, depois dela, à mata.");
  exToast(rest(kind, true, true)); exHud();
  if (EX.zone === "aldeia" && kind !== "fogueira") setTimeout(() => EX && announceOffer(), 2400);   // novo dia ou noite: pode ter pedido novo   // dormir: o galo já cantou no amanhecer da cena
}
/* Linha do tempo das cenas que acordam (ms desde o começo):
   dormir: senta (0-900) e dorme enquanto a noite cai; em CAMP_DAWN_AT passa a faixa do amanhecer (dawnWipe: galo e sol).
   noite: senta, cochila enquanto escurece e passa a faixa do anoitecer (lua e lobo); por trás dela vira noite.
   abertura: já é de manhã; ele cochila um pouco e acorda em CAMP_INTRO_WAKE (o galo só canta ao dormir).
   Ao acordar:
   "!" (W..W+400), sorri (W+500..W+1100), levanta e se espreguiça (W+1300..W+2000) e fica de pé. */
const CAMP_DAWN_AT = {dormir: 2600, noite: 2400}, CAMP_INTRO_WAKE = 1500;
const campWake = kind => kind === "intro" ? CAMP_INTRO_WAKE : CAMP_DAWN_AT[kind] ? CAMP_DAWN_AT[kind] + DAWN_MS + 200 : 0;
const campAsleep = (c, el) => c.kind === "intro" ? el < campWake("intro") : !!CAMP_DAWN_AT[c.kind] && el > 900 && el < campWake(c.kind);
// escuridão da noite (some quando a faixa do amanhecer cobre a tela)
// (dormir já de noite: o escuro da noite já está na tela; anoitecer: só escurece um pouco antes da faixa)
const campDark = (c, el) => !CAMP_DAWN_AT[c.kind] || c.day || c.startNight ? 0 : (c.kind === "noite" ? .35 : .65) * Math.max(0, Math.min(1, (el - 900) / 1500));
function drawCampHero(x, cx, cy, now) {
  const c = EX.camp, el = now - c.t0, W = campWake(c.kind), sx = snap(c.x - cx), sy = snap(c.y - cy);
  const sleep = campAsleep(c, el);
  let face = sleep || el % 1700 < 140 ? "blink" : (W ? el > W + 500 && el < W + 1100 : el > 800 && el < 1250) ? "happy" : undefined;
  const up = W && el > W + 1300;   // acordou: levanta e se espreguiça com a lança para o alto
  const img = up ? rigCanvas("front", {weapon: el < W + 2000 ? "raise" : "diag", face: el < W + 2000 ? "happy" : undefined, dy: el < W + 2000 ? 0 : 1}, rhanonLook(), OW_SCALE)
    : rigCanvas("front", {sit: true, face, dy: sleep ? 1 : 0}, {...rhanonLook(), bowBack: false}, OW_SCALE);
  drawShadow(x, sx, sy, up ? 12 : 18);
  if (!up) { spearShaft(x, sx - 11, sy, sx + 9, sy); pxl(x, sx + 10, sy, "#eef3f5"); }   // lança deitada no chão
  x.drawImage(img, sx - img.width / 2, sy - img.height + 1);
  if (W && el > W && el < W + 400) glyphP(x, "bang", "#ffd23a", sx + 7, sy - 30);   // acordou!
  for (let i = 0; i < 4; i++) {   // fumaça subindo do fogo
    const p = (now / 1700 + i / 4) % 1;
    if (p < .85 || Math.floor(now / 80) % 2) { x.fillStyle = i % 2 ? "#c9c4b8" : "#9e9a90"; x.fillRect(Math.round(c.fx - cx + Math.sin(p * 6 + i) * 2), Math.round(c.fy - cy - 6 - p * 20), 2, 2); }
  }
  if (sleep) for (let i = 0; i < 3; i++) { const p = (el / 1000 + i / 3) % 1; glyphP(x, "z", "#ffffff", sx + 5 + p * 7, sy - 24 - p * 12); }
}
// noite na fase: tudo escuro, com um círculo de luz em volta do Rhanon e de cada fogueira (o fogo tremula)
let NIGHT_CV = null;
function drawNightShade(x, cx, cy, now) {
  const c = NIGHT_CV || (NIGHT_CV = document.createElement("canvas"));
  c.width = VIEW_W; c.height = VIEW_H;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(6,8,32,.7)"; g.fillRect(0, 0, VIEW_W, VIEW_H);
  g.globalCompositeOperation = "destination-out";
  const light = (px, py, r) => { const gr = g.createRadialGradient(px, py, r * .25, px, py, r); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); };
  const h = EX.camp || EX.hero;
  light(h.x - cx, h.y - cy - 12, 50);
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE), [nx, ny] = viewTiles();
  for (let ty = t0y - 3; ty <= t0y + ny + 3; ty++) for (let tx = t0x - 3; tx <= t0x + nx + 3; tx++)
    if (stageTile(tx, ty) === "F") light(tx * TILE + 8 - cx, ty * TILE + 8 - cy, 46 + Math.sin(now / 110 + tx) * 2.5);
  x.drawImage(c, 0, 0);
  // neblina: tufos claros e lentos sobre as árvores longe do Rhanon (só estética)
  const puff = FOG_PUFF || (FOG_PUFF = fogPuff());
  for (let ty = t0y; ty <= t0y + ny; ty++) for (let tx = t0x; tx <= t0x + nx; tx++) {
    if (stageTile(tx, ty) !== "T" || (tx * 7 + ty * 13) % 4) continue;
    const px = tx * TILE + 8 - cx, py = ty * TILE + 8 - cy, far = Math.hypot(px - (h.x - cx), py - (h.y - cy - 12));
    if (far < 70) continue;
    x.globalAlpha = Math.min(.32, (far - 70) / 160) * (.75 + .25 * Math.sin(now / 1700 + tx));
    x.drawImage(puff, Math.round(px - 20 + Math.sin(now / 2300 + ty * .7) * 7), Math.round(py - 8), 40, 18);
  }
  x.globalAlpha = 1;
}
let FOG_PUFF = null;
function fogPuff() {   // tufo de neblina: elipse clara que some nas bordas
  const c = document.createElement("canvas"); c.width = 40; c.height = 18;
  const g = c.getContext("2d"); g.scale(2.2, 1);
  const gr = g.createRadialGradient(9, 9, 1, 9, 9, 9); gr.addColorStop(0, "rgba(205,215,245,.95)"); gr.addColorStop(1, "rgba(205,215,245,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 18, 18);
  return c;
}
// noite por cima da fase: escuro com estrelas; o fogo e o Rhanon são redesenhados por cima para continuarem acesos
function drawCampSky(x, cx, cy, now) {
  const c = EX.camp, dark = campDark(c, now - c.t0);
  if (dark < .01) return;
  x.fillStyle = `rgba(8,10,40,${dark})`; x.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let i = 0; i < 14; i++) {   // estrelas piscando
    const sx = (i * 67 + 13) % VIEW_W, sy = (i * 41 + 7) % (VIEW_H * .6);
    if (dark > .3 && (Math.floor(now / 300) + i) % 5) { x.fillStyle = `rgba(255,255,230,${Math.min(1, (dark - .3) * 3)})`; x.fillRect(sx, sy, 1, 1); }
  }
  drawFire(x, c.ftx * TILE - cx, c.fty * TILE - cy, now); drawCampHero(x, cx, cy, now);
}
function exCloseDialog() { $("exDialog").hidden = true; if (EX) EX.dialog = null; sfx("blip"); }
// teclado com o painel aberto: setas escolhem, Z/Enter/Espaço confirmam, 1-9 apertam direto, X/Esc voltam ou fecham
function dialogKey(ev) {
  if (EX.dialog === "tutorial") {   // Z, Espaço ou Enter passam a página; Esc encerra a conversa
    if (["z", "Z", " ", "Enter"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); pressPanel($("exDialog").querySelector(".cmd")); }
    else if (ev.key === "Escape") endTutorial();
    else if (ev.key.startsWith("Arrow")) ev.preventDefault();
    return;
  }
  const d = $("exDialog");
  if (EX.dialog === "armeiro" && !EX.confirming && forgeKey(ev)) return;
  if (/^[1-9]$/.test(ev.key)) { ev.preventDefault(); pressPanel(d.querySelectorAll(".cmd[data-key]")[+ev.key - 1]); }
  else if (menuKey(ev, d)) return;   // setas escolhem, Z/Enter/Espaço confirmam
  else if (["Escape", "x", "X", "i", "I"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); EX.confirming ? exOpenDialog(EX.confirming) : exCloseDialog(); }   // X volta (na pergunta, é o "Não")
  else if (ev.key.startsWith("Arrow")) ev.preventDefault();
}