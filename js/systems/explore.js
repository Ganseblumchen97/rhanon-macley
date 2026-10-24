/* Exploração das fases vista de cima. O Rhanon anda livre (8 direções), os bichos passeiam e perseguem.
   Quem acerta primeiro começa a batalha: golpe/arremesso do Rhanon = turno dele, com dano;
   bicho alcança ou o Rhanon esbarra nele = turno do bicho. Bem mais forte que o bicho = abate direto. */
const VIEW_W = 240, VIEW_H = 176;            // tamanho da câmera em pixels do desenho (15 x 11 quadrados)
const HERO_SPEED = 74;                       // pixels por segundo
const ANIMAL_SPEED = {pequeno: 46, "médio": 40, grande: 34, chefe: 0};
const CHASE_RANGE = 72;                      // distância em que o bicho percebe o Rhanon
let EX = null;                               // fase atual (null fora da exploração)
const exKeys = new Set();
let exMsgTimer = null;

/* ---------- terreno e colisão ---------- */
function stageTile(tx, ty) { const r = EX.rows[ty]; return (r && r[tx]) || "T"; }
function solidAt(px, py) {
  const ch = stageTile(Math.floor(px / TILE), Math.floor(py / TILE));
  return ch === "G" ? !BS()[EX.zone] : SOLID.includes(ch);
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
  return ch === "T" || ch === "o" || (ch === "G" && !BS()[EX.zone]);
}

/* ---------- entrar, sair e trocar de fase ---------- */
function pickFromPool(zone) {
  const z = ZONES[zone]; let r = Math.random() * z.pool.reduce((s, [, w]) => s + w, 0);
  for (const [id, w] of z.pool) if ((r -= w) < 0) return ANIMALS.find(a => a.id === id);
  return ANIMALS.find(a => a.id === z.pool[0][0]);
}
function makeAnimalEnt(a, tx, ty) {
  const img = animalSprite(a), x = tx * TILE + 8, y = ty * TILE + 12;
  return {a, img, x, y, homeX: x, homeY: y, hw: Math.min(7, Math.round(img.width / 3)), hh: 3,
    speed: a.id === "preguica" ? 18 : (ANIMAL_SPEED[a.size] ?? 40), boss: !!a.boss, alive: true,
    state: "wander", vx: 0, vy: 0, until: 0, face: -1, walk: 0, stunUntil: 0};
}
function startExplore(zone) {
  if (moving || (EX && EX.starting)) return;
  if (EX) EX.starting = true;
  wipe(() => {
    const st = STAGES[zone];
    EX = {zone, st, rows: st.rows, map: drawStageMap(st.rows, zone), pal: TILE_PAL[zone] || TILE_PAL.mata,
      ents: [], fx: [], spear: null, cool: 0, jab: 0, hero: null, fighting: null, locked: false, invulnUntil: 0};
    st.rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch === "S") EX.hero = {x: tx * TILE + 8, y: ty * TILE + 12, hw: 5, hh: 3, dir: "down", aim: {x: 0, y: 1}, walk: 0, flip: false, movedT: 0};
      else if (ch === "a") EX.ents.push(makeAnimalEnt(pickFromPool(zone), tx, ty));
      else if (ch === "B" && !BS()[zone]) EX.ents.push(makeAnimalEnt(ANIMALS.find(a => a.id === ZONES[zone].boss), tx, ty));
    }));
    vit(); G.sub = zone; save();
    curZone = zone; fromLocal = false; exKeys.clear();
    $("map").hidden = true; $("local").hidden = true; $("over").hidden = true; $("homeButton").hidden = true; $("explore").hidden = false;
    musicStart("local"); exHud();
    exToast(ZONES[zone].n + (BS()[zone] ? "" : " · o chefe espera no fim da trilha"));
  });
}
function exitExplore() {
  if (!EX || EX.locked) return;
  EX.locked = true;
  wipe(() => { $("explore").hidden = true; EX = null; exKeys.clear(); showLocal(); });
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
  if (en && result === "win" && en.boss) exToast(EX.st.next ? `Caminho liberado: ${ZONES[EX.st.next].n}! Siga a trilha até a passagem.` : "Você venceu o último chefe... por enquanto!");
}

/* ---------- ações do Rhanon ---------- */
const entH = en => Math.min(en.img.height, 20);
function exStrike() {
  if (!EX || EX.locked || EX.cool > 0) return;
  const h = EX.hero; EX.cool = .35; EX.jab = .16; sfx("spear");
  const px = h.x + h.aim.x * 13, py = h.y - 8 + h.aim.y * 13;
  const target = EX.ents.find(en => en.alive && Math.hypot(en.x - px, en.y - entH(en) / 2 - py) < 11 + en.hw);
  if (target) exHit(target);
}
function exThrow() {
  if (!EX || EX.locked || EX.cool > 0 || EX.spear) return;
  const h = EX.hero; EX.cool = .5; sfx("spear");
  EX.spear = {x: h.x + h.aim.x * 6, y: h.y - 10 + h.aim.y * 6, vx: h.aim.x * 230, vy: h.aim.y * 230, left: 96, stuck: 0};
}
function exHit(en) {
  const a = en.a, d = rnd(6, 10) + G.lv - 1 + weaponAtk();
  exBurst(en.x, en.y - entH(en) / 2, ["#ffffff", "#ffd23a"], 8);
  if (!a.boss && (G.lv - (a.lv || 1) >= ONE_HIT_LEVELS || d >= a.hp)) {
    en.alive = false; sfx("crit");
    exBurst(en.x, en.y - 6, ["#d8d2c0", "#a89f8a", "#ffffff"], 14);
    curZone = EX.zone;
    exToast(`Abateu ${a.name.toLowerCase()} com um golpe só!` + reward(a));
    exHud();
    return;
  }
  sfx("hit");
  exStartBattle(en, {firstHit: Math.min(d, a.hp - 1)});
}
function exStartBattle(en, opts) {
  if (EX.locked) return;
  EX.locked = true; EX.fighting = en; exKeys.clear();
  if (opts.enemyFirst) sfx("roar");
  setTimeout(() => wipe(() => {
    $("explore").hidden = true; fromExplore = true; curZone = EX.zone; bossFight = en.boss;
    init({animal: en.a, ...opts});
  }), 260);
}

/* ---------- atualização ---------- */
function exMove(en, ux, uy, sp) {
  const ok = slide(en, ux * sp, uy * sp);
  if (ux) en.face = ux > 0 ? 1 : -1;
  if (ok) en.walk += sp;
  return ok;
}
function exAnimal(en, dt, now) {
  const h = EX.hero, dx = h.x - en.x, dy = h.y - en.y, dist = Math.hypot(dx, dy) || 1;
  const safe = now < EX.invulnUntil || EX.locked;
  if (dist < en.hw + h.hw + 3 && !safe) return exStartBattle(en, {enemyFirst: true});
  if (en.boss) {   // o chefe espera parado, soltando brilho
    if (Math.random() < dt * 8) EX.fx.push({x: en.x + (Math.random() - .5) * en.img.width, y: en.y - Math.random() * en.img.height, vx: 0, vy: -14, life: .8, col: (AURA[en.a.id] || ["#ffd23a"])[Math.random() * 2 | 0]});
    return;
  }
  if (now < en.stunUntil) { exMove(en, -dx / dist, -dy / dist, en.speed * .8 * dt); return; }   // assustado, foge
  if (en.state === "windup") { if (now > en.until) en.state = "chase"; else return; }
  if (dist < CHASE_RANGE && !safe) {
    if (en.state !== "chase") { en.state = "windup"; en.until = now + 450; en.face = dx > 0 ? 1 : -1; return; }   // "!" antes de correr
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
  EX.cool = Math.max(0, EX.cool - dt); EX.jab = Math.max(0, EX.jab - dt);
  let ix = (exKeys.has("right") ? 1 : 0) - (exKeys.has("left") ? 1 : 0), iy = (exKeys.has("down") ? 1 : 0) - (exKeys.has("up") ? 1 : 0);
  if (EX.locked) ix = iy = 0;
  if (ix || iy) {
    const n = Math.hypot(ix, iy), sp = HERO_SPEED * dt;
    h.aim = {x: ix / n, y: iy / n};
    h.dir = iy && (!ix || h.dir !== "side") ? (iy < 0 ? "up" : "down") : "side";
    if (ix) h.flip = ix < 0;
    if (slide(h, ix / n * sp, iy / n * sp) || nudge(h, ix, iy)) { h.walk += sp; h.movedT = now; }
  }
  if (!EX.locked) {
    const ch = stageTile(Math.floor(h.x / TILE), Math.floor(h.y / TILE));
    if (ch === "E") return exitExplore();
    if (ch === "G" && BS()[EX.zone] && EX.st.next) { EX.locked = true; return startExplore(EX.st.next); }
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
  for (const en of EX.ents) if (en.alive && EX) exAnimal(en, dt, now);
  EX.fx = EX.fx.filter(q => (q.life -= dt) > 0);
  for (const q of EX.fx) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; }
}
function exBurst(x, y, cols, n) {
  for (let i = 0; i < n; i++) { const t = Math.random() * Math.PI * 2, v = 30 + Math.random() * 40; EX.fx.push({x, y, vx: Math.cos(t) * v, vy: Math.sin(t) * v - 20, life: .4 + Math.random() * .3, col: cols[i % cols.length]}); }
}

/* ---------- desenho ---------- */
// mato alto na frente dos pés de quem está nele
function grassOver(x, ent, cx, cy) {
  const ty = Math.floor(ent.y / TILE);
  for (let tx = Math.floor((ent.x - ent.hw) / TILE); tx <= Math.floor((ent.x + ent.hw) / TILE); tx++)
    if (stageTile(tx, ty) === ",") x.drawImage(EX.map, tx * TILE, ty * TILE + 9, TILE, 7, tx * TILE - cx, ty * TILE + 9 - cy, TILE, 7);
}
function drawShadow(x, sx, sy, w) { x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(sx - w / 2, sy - 1, w, 2); x.fillRect(sx - w / 2 + 2, sy - 2, w - 4, 4); }
function drawHeroEnt(x, h, cx, cy, now) {
  const sx = Math.round(h.x - cx), sy = Math.round(h.y - cy);
  if (now < EX.invulnUntil && Math.floor(now / 100) % 2) return;
  const walking = now - h.movedT < 90;
  const img = heroOverworld(h.dir, walking ? ["walkA", "stand", "walkB", "stand"][Math.floor(h.walk / 7) % 4] : "stand", !EX.spear && EX.jab <= 0);
  const ox = EX.jab > 0 ? Math.round(h.aim.x * 3) : 0, oy = EX.jab > 0 ? Math.round(h.aim.y * 3) : 0;
  drawShadow(x, sx, sy, 12);
  if (h.dir === "side" && h.flip) { x.save(); x.translate(sx + ox, 0); x.scale(-1, 1); x.drawImage(img, -10, sy - 27 + oy); x.restore(); }
  else x.drawImage(img, sx - 10 + ox, sy - 27 + oy);
  if (EX.jab > 0) {   // estocada da lança
    const bx = sx + ox, by = sy - 12 + oy;
    lineP(x, bx - h.aim.x * 4, by - h.aim.y * 4, bx + h.aim.x * 15, by + h.aim.y * 15, "#7a4a1e");
    pxl(x, bx + h.aim.x * 16, by + h.aim.y * 16, "#eef3f5"); pxl(x, bx + h.aim.x * 15, by + h.aim.y * 15, "#cfd8dc");
  }
  grassOver(x, h, cx, cy);
}
function drawAnimalEnt(x, en, cx, cy, now) {
  const sx = Math.round(en.x - cx), sy = Math.round(en.y - cy), w = en.img.width, hg = en.img.height;
  if (sx < -40 || sx > VIEW_W + 40 || sy < -8 || sy > VIEW_H + 40) return;
  const bob = (en.vx || en.vy || en.state === "chase") ? Math.floor(en.walk / 5) % 2 : Math.floor(now / 500) % 2;
  drawShadow(x, sx, sy, Math.max(8, Math.round(w * .7)));
  x.save();
  if (en.a.tint) x.filter = en.a.tint;
  if (en.face > 0) { x.translate(sx, 0); x.scale(-1, 1); x.drawImage(en.img, -Math.round(w / 2), sy - hg - bob); }
  else x.drawImage(en.img, sx - Math.round(w / 2), sy - hg - bob);
  x.restore();
  grassOver(x, en, cx, cy);
}
// etiqueta de nível (verde = cai com um golpe, vermelha = chefe) e "!" quando o bicho vê o Rhanon
function drawAnimalTags(x, en, cx, cy, now) {
  const sx = Math.round(en.x - cx), sy = Math.round(en.y - cy) - en.img.height - 4;
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
  const x = $("exCanvas").getContext("2d"), h = EX.hero;
  x.imageSmoothingEnabled = false;
  const cx = Math.round(Math.max(0, Math.min(EX.map.width - VIEW_W, h.x - VIEW_W / 2)));
  const cy = Math.round(Math.max(0, Math.min(EX.map.height - VIEW_H, h.y - 12 - VIEW_H / 2)));
  x.drawImage(EX.map, cx, cy, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE);
  for (let ty = t0y; ty <= t0y + 11; ty++) for (let tx = t0x; tx <= t0x + 15; tx++) {
    const ch = stageTile(tx, ty), sx = tx * TILE - cx, sy = ty * TILE - cy;
    if (ch === "~" && (tx * 7 + ty * 13 + Math.floor(now / 450)) % 9 === 0) { x.fillStyle = "#ffffffb0"; x.fillRect(sx + 4 + (tx % 3) * 3, sy + 6 + (ty % 2) * 4, 3, 1); }
    if (ch === "G" && !BS()[EX.zone]) drawGate(x, sx, sy, EX.pal);
  }
  const alive = EX.ents.filter(en => en.alive);
  [...alive.map(en => ({y: en.y, draw: () => drawAnimalEnt(x, en, cx, cy, now)})), {y: h.y, draw: () => drawHeroEnt(x, h, cx, cy, now)}]
    .sort((a, b) => a.y - b.y).forEach(o => o.draw());
  const s = EX.spear;
  if (s) {
    const n = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / n, uy = s.vy / n, sx = s.x - cx, sy = s.y - cy;
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(Math.round(sx) - 3, Math.round(sy + 10), 6, 1);
    lineP(x, sx - ux * 6, sy - uy * 6, sx + ux * 5, sy + uy * 5, "#7a4a1e");
    pxl(x, sx + ux * 6, sy + uy * 6, "#eef3f5"); pxl(x, sx + ux * 5, sy + uy * 5, "#cfd8dc");
  }
  for (const q of EX.fx) { x.fillStyle = q.col; x.fillRect(Math.round(q.x - cx) - 1, Math.round(q.y - cy) - 1, 2, 2); }
  alive.forEach(en => drawAnimalTags(x, en, cx, cy, now));
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
  $("exHud").textContent = `${ZONES[EX.zone].n} · Nv ${G.lv} · PV ${G.hp}/${maxHP(G.lv)} · PE ${G.sp}/${maxSP(G.lv)} · R$ ${G.money}`;
}
function exToast(msg) {
  const el = $("exMsg"); el.textContent = msg; el.classList.add("show");
  clearTimeout(exMsgTimer); exMsgTimer = setTimeout(() => el.classList.remove("show"), 3600);
}

/* ---------- controles: teclado e botões de toque ---------- */
function setupExploreInput() {
  const DIRS = {ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"};
  document.addEventListener("keydown", ev => {
    if (!EX || $("explore").hidden) return;
    const k = DIRS[ev.key];
    if (k) { exKeys.add(k); ev.preventDefault(); return; }
    if (ev.repeat) return;
    if ("zZjJ ".includes(ev.key)) { ev.preventDefault(); exStrike(); }
    else if ("xXkK".includes(ev.key)) { ev.preventDefault(); exThrow(); }
    else if (ev.key === "Escape") exitExplore();
  });
  document.addEventListener("keyup", ev => { const k = DIRS[ev.key]; if (k) exKeys.delete(k); });
  window.addEventListener("blur", () => exKeys.clear());
  document.querySelectorAll("#exPad [data-dir]").forEach(b => {
    const k = b.dataset.dir, off = () => exKeys.delete(k);
    b.addEventListener("pointerdown", ev => { ev.preventDefault(); exKeys.add(k); b.setPointerCapture(ev.pointerId); });
    b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("lostpointercapture", off);
  });
  $("exA").addEventListener("pointerdown", ev => { ev.preventDefault(); exStrike(); });
  $("exB").addEventListener("pointerdown", ev => { ev.preventDefault(); exThrow(); });
  $("exExit").addEventListener("click", exitExplore);
}
