/* Exploração das fases vista de cima. O Rhanon anda livre (8 direções), os bichos passeiam e perseguem.
   Quem acerta primeiro começa a batalha: golpe/arremesso do Rhanon = turno dele, com dano;
   bicho alcança ou o Rhanon esbarra nele = turno do bicho. Bem mais forte que o bicho = abate direto. */
const VIEW_W = 240, VIEW_H = 176;            // tamanho da câmera em pixels do jogo (15 x 11 quadrados)
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
  const z = zoneDef(zone); let r = Math.random() * z.pool.reduce((s, [, w]) => s + w, 0);
  for (const [id, w] of z.pool) if ((r -= w) < 0) return ANIMALS.find(a => a.id === id);
  return ANIMALS.find(a => a.id === z.pool[0][0]);
}
function makeAnimalEnt(a, tx, ty) {
  const img = artCanvas("animal/" + a.id + "/mapa") || codeAnimalSprite(a), k = +img.dataset.scale || 1, x = tx * TILE + 8, y = ty * TILE + 12;
  // traço novo: segundo quadro (respirando/andando) e o desmaiado, para quando cai com um golpe só
  const rig = img.dataset.rig, img2 = rig && beastFrame(a.id, "idle", 1), ko = rig && beastFrame(a.id, "ko");
  return {a, img, img2, ko, w: img.width / k, h: img.height / k, x, y, homeX: x, homeY: y, hw: Math.min(7, Math.round(img.width / k / 3)), hh: 3,
    speed: a.id === "preguica" ? 18 : (ANIMAL_SPEED[a.size] ?? 40), boss: !!a.boss, alive: true,
    state: "wander", vx: 0, vy: 0, until: 0, face: -1, walk: 0, stunUntil: 0};
}
// after: chamado depois de montar a fase (cena de abertura)
function startExplore(zone, after) {
  if (moving || (EX && EX.starting)) return;
  if (EX) EX.starting = true;
  wipe(() => {
    const st = STAGES[zone];
    EX = {zone, st, rows: st.rows, map: drawStageMap(st.rows, zone), pal: TILE_PAL[zone] || TILE_PAL.mata,
      night: !!G.night, ents: [], fx: [], loot: [], spots: [], spear: null, cool: 0, jab: 0, hero: null, fighting: null, locked: false, invulnUntil: 0, dialog: null};
    st.rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch === "S") EX.hero = {x: tx * TILE + 8, y: ty * TILE + 12, hw: 5, hh: 3, dir: "down", aim: {x: 0, y: 1}, walk: 0, flip: false, movedT: 0};
      else if (ch === "a") EX.ents.push(makeAnimalEnt(pickFromPool(zone), tx, ty));
      else if (ch === "B" && !BS()[bossKey(zone)]) EX.ents.push(makeAnimalEnt(ANIMALS.find(a => a.id === zoneDef(zone).boss), tx, ty));
      else if (SPOTS[ch]) EX.spots.push({kind: SPOTS[ch], look: SPOTS[ch] === "aldeao" ? "aldeao" + (EX.spots.filter(q => q.kind === "aldeao").length % 3 + 1) : SPOTS[ch], x: tx * TILE + 8, y: ty * TILE + 8, tx, ty});
    }));
    vit(); G.sub = zone; save();
    curZone = zone; fromLocal = false; exKeys.clear();
    $("titleScreen").hidden = true; $("map").hidden = true; $("local").hidden = true; $("over").hidden = true; $("homeButton").hidden = true; $("explore").hidden = false;
    musicStart("local"); exHud();
    exToast(st.safe ? SUB[zone].n + (zone === "aldeia" ? " · chegue perto da fogueira ou dos aldeões e aperte Z" : " · peles, comida e artesão: chegue perto de uma barraca e aperte Z") : zoneDef(zone).n + (BS()[bossKey(zone)] ? "" : G.night ? " · dizem que algo do folclore ronda o fim da trilha..." : " · o chefe espera no fim da trilha"));
    if (after) after();
  });
}
function exitExplore() {
  if (!EX || EX.locked) return;
  EX.locked = true;
  wipe(() => { $("explore").hidden = true; $("exDialog").hidden = true; EX = null; exKeys.clear(); showLocal(); });
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
    : EX.st.next ? `Caminho liberado: ${ZONES[EX.st.next].n}! Siga a trilha até a passagem.` : "Você venceu o último chefe... por enquanto!");
}

/* ---------- ações do Rhanon ---------- */
const entH = en => Math.min(en.h, 20);
function exStrike() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0) return;
  const spot = nearSpot(); if (spot) return exOpenDialog(spot.kind, null, spot.look);   // perto de alguém: conversa em vez de golpe
  const h = EX.hero; EX.cool = .35; EX.jab = .16; sfx("spear");
  // a lança alcança uns 1,5 quadrado à frente: confere pontos ao longo dela
  const target = EX.ents.find(en => en.alive && [8, 15, 22].some(r => Math.hypot(en.x - (h.x + h.aim.x * r), en.y - entH(en) / 2 - (h.y - 8 + h.aim.y * r)) < 9 + en.hw));
  if (target) exHit(target);
}
// flecha: só com arco (EQUIP.ranged, comprado no artesão da feira)
const BOW_DRAW = .32;   // segundos puxando a corda antes da flecha sair (ele para de andar nesse tempo)
// mão do arco (em pixels do desenho 32x44 do Rhanon): esticada na direção da mira, na altura do peito
const bowHand = a => [16 + a.x * 13, 25 + a.y * 9];
function exThrow() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0 || EX.spear || EX.draw) return;
  if (!G.equip.ranged) { EX.cool = 1.2; sfx("blip"); return exToast("Para atacar de longe você precisa de um arco. O artesão da feira vende."); }
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
    exToast(`Abateu ${a.name.toLowerCase()} com um golpe só!` + reward(a, ONE_HIT_XP, true));
    EX.loot.push({id: a.id, x: en.x, y: en.y, t0: performance.now()});   // a pele fica no chão até ele passar por cima
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
  EX.cool = Math.max(0, EX.cool - dt); EX.jab = Math.max(0, EX.jab - dt); EX.shoot = Math.max(0, (EX.shoot || 0) - dt);
  if (EX.draw && (EX.draw.t += dt) >= BOW_DRAW) exRelease();
  if (EX.camp) {   // sons da fogueira: ronco com assobio enquanto dorme; ao dormir, a faixa do amanhecer traz o galo
    const c = EX.camp, el = now - c.t0;
    if (campAsleep(c, el) && !c.dawned && now - (c.snoreT || 0) > 1700) { c.snoreT = now; sfx("ronco"); }   // o amanhecer interrompe o ronco
    if (CAMP_DAWN_AT[c.kind] && el > CAMP_DAWN_AT[c.kind] && !c.dawned) {   // passa a faixa do amanhecer (galo e sol); por trás dela vira dia
      c.dawned = true;
      const toNight = c.kind === "noite";   // atrás da faixa o mundo troca: noite (lua e lobo) ou dia (sol e galo)
      dawnWipe(() => { c.day = true; G.night = toNight; EX.night = toNight; save(); exHud(); }, toNight ? "Anoiteceu" : `Amanheceu · Dia ${G.day + 1}`, toNight);
    }
  }
  if (EX.camp && now - EX.camp.t0 > EX.camp.dur) exCampEnd();
  for (const l of EX.loot) if (now - l.t0 > 500 && Math.hypot(l.x - h.x, l.y - h.y) < 11) pickLoot(l);
  let ix = (exKeys.has("right") ? 1 : 0) - (exKeys.has("left") ? 1 : 0), iy = (exKeys.has("down") ? 1 : 0) - (exKeys.has("up") ? 1 : 0);
  if (EX.locked || EX.dialog || EX.draw || EX.camp) ix = iy = 0;
  if (ix || iy) {
    const n = Math.hypot(ix, iy), sp = HERO_SPEED * dt;
    h.aim = {x: ix / n, y: iy / n};
    if (ix) { h.side = ix; h.dir = "side"; }   // andando para os lados (ou na diagonal): de perfil
    else h.dir = iy < 0 ? "up" : "down";
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
  if (!EX.dialog && !EX.camp) for (const en of EX.ents) if (en.alive && EX) exAnimal(en, dt, now);   // bichos param com o painel aberto
  EX.fx = EX.fx.filter(q => (q.life -= dt) > 0);
  for (const q of EX.fx) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; }
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
    img = rigSideCanvas({step: walking ? "walk" + step % 4 : "stand", dy: walking && step % 2 === 0 ? 1 : 0, weapon: sideJab ? "jab" : EX.jab > 0 ? null : "diag", lean: sideJab ? 2 : 0, side: h.side || 1},
      {...rhanonLook(), bowBack: !!G.equip.ranged && !(EX.shoot > 0)}, OW_SCALE);
  } else img = art ? overworldArt(h.dir === "side" ? "down" : h.dir, walking ? step % art.frames : 0)
    : heroOverworld(h.dir, walking ? ["walkA", "stand", "walkB", "stand"][step % 4] : "stand", EX.jab <= 0, !(EX.shoot > 0), h.side || 1);
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
  else if (en.img2) { if (bob) img = en.img2; bob = 0; }   // traço novo: troca de quadro em vez de pular
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
  const cx = snap(Math.max(0, Math.min(EX.map.width - VIEW_W, h.x - VIEW_W / 2)));
  const cy = snap(Math.max(0, Math.min(EX.map.height - VIEW_H, h.y - 12 - VIEW_H / 2)));
  x.drawImage(EX.map, cx, cy, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE);
  for (let ty = t0y; ty <= t0y + 11; ty++) for (let tx = t0x; tx <= t0x + 15; tx++) {
    const ch = stageTile(tx, ty), sx = tx * TILE - cx, sy = ty * TILE - cy;
    if (ch === "~" && (tx * 7 + ty * 13 + Math.floor(now / 450)) % 9 === 0) { x.fillStyle = "#ffffffb0"; x.fillRect(sx + 4 + (tx % 3) * 3, sy + 6 + (ty % 2) * 4, 3, 1); }
    if (ch === "G" && !BS()[EX.zone]) drawGate(x, sx, sy, EX.pal);
    if (ch === "F") drawFire(x, sx, sy, now);
  }
  EX.loot.forEach(l => drawLoot(x, l, cx, cy, now));   // no chão, embaixo de todo mundo
  const alive = EX.ents.filter(en => en.alive), knocked = EX.ents.filter(en => !en.alive && en.ko && en.koUntil > now);
  const people = EX.spots.filter(s => PEOPLE.includes(s.kind)).map(s => ({y: s.y + 5, draw: () => drawNpc(x, s, cx, cy, now)}));
  [...alive.map(en => ({y: en.y, draw: () => drawAnimalEnt(x, en, cx, cy, now)})), ...knocked.map(en => ({y: en.y, draw: () => drawAnimalEnt(x, en, cx, cy, now)})), ...people, (EX.camp ? {y: EX.camp.y, draw: () => drawCampHero(x, cx, cy, now)} : {y: h.y, draw: () => drawHeroEnt(x, h, cx, cy, now)})]
    .sort((a, b) => a.y - b.y).forEach(o => o.draw());
  const s = EX.spear;
  if (s) {
    const n = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / n, uy = s.vy / n, sx = s.x - cx, sy = s.y - cy;
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(Math.round(sx) - 3, Math.round(sy + 10), 6, 1);
    lineP(x, sx - ux * 5, sy - uy * 5, sx + ux * 4, sy + uy * 4, "#c9a46a");   // flecha: haste, ponta e penas
    pxl(x, sx + ux * 5, sy + uy * 5, "#eef3f5"); pxl(x, sx - ux * 5 - uy, sy - uy * 5 + ux, "#e5001c"); pxl(x, sx - ux * 5 + uy, sy - uy * 5 - ux, "#e5001c");
  }
  if (EX.night) drawNightShade(x, cx, cy, now);
  if (EX.camp && EX.camp.kind !== "fogueira") drawCampSky(x, cx, cy, now);
  for (const q of EX.fx) { x.fillStyle = q.col; x.fillRect(Math.round(q.x - cx) - 1, Math.round(q.y - cy) - 1, 2, 2); }
  alive.forEach(en => drawAnimalTags(x, en, cx, cy, now));
  drawSpotPrompt(x, cx, cy, now);
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
  $("exHud").textContent = `${ZONES[EX.zone] ? zoneDef(EX.zone).n : SUB[EX.zone].n + (G.night ? " à noite" : "")} · Nv ${G.lv} · XP ${G.xp}/${need(G.lv)} · PV ${G.hp}/${maxHP(G.lv)} · PE ${G.sp}/${maxSP(G.lv)} · R$ ${G.money}`;
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
    if (EX.dialog) { dialogKey(ev); return; }
    if (EX.camp) {   // sentado na fogueira: espera terminar (a cena de abertura dá para pular)
      ev.preventDefault();
      if (EX.camp.kind === "intro" && ["z", "Z", "Enter", " ", "Escape"].includes(ev.key)) Object.assign(EX.camp, {t0: -1e9, dawned: true, day: true});
      return;
    }
    const k = DIRS[ev.key];
    if (k) { exKeys.add(k); ev.preventDefault(); return; }
    if (ev.repeat) return;
    if ("zZjJ ".includes(ev.key)) { ev.preventDefault(); exStrike(); }
    else if ("xXkK".includes(ev.key)) { ev.preventDefault(); exThrow(); }
    else if (ev.key === "Escape") exitExplore();
    else if ((ev.key === "i" || ev.key === "I") && !EX.locked) exOpenDialog("inventario");
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
  $("exBag").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp) EX.dialog === "inventario" ? exCloseDialog() : exOpenDialog("inventario"); });
}

/* ---------- aldeia e feira: pontos de conversa ---------- */
const SPOTS = {F: "fogueira", N: "tenda", V: "peles", C: "comida", R: "artesao", P: "aldeao"};
const PEOPLE = ["peles", "comida", "artesao", "aldeao"];
const SPOT_LABEL = {fogueira: "descansar na fogueira", tenda: "dormir na tenda", peles: "vender peles", comida: "comprar comida", artesao: "ver roupas e equipamentos", aldeao: "conversar"};
const VILLAGER_NAME = {aldeao1: "Caçador", aldeao2: "Ancião", aldeao3: "Aldeã"};
const VILLAGER_TIPS = [
  "Etiqueta verde em cima do bicho? Ele cai com um golpe só.",
  "Acertar o bicho primeiro, com a lança (Z) ou uma flecha (X), te dá o primeiro turno da luta.",
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
function drawNpc(x, s, cx, cy, now) {
  const img = villagerSprite(s.look), sx = snap(s.x - cx), sy = snap(s.y + 5 - cy), bob = Math.floor(now / 600 + s.tx) % 2;
  const hw = img.width / 2, top = sy - img.height + 1 - bob;
  drawShadow(x, sx, sy, 10);
  if (EX.hero.x > s.x + 4) { x.save(); x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, -hw, top); x.restore(); }
  else x.drawImage(img, sx - hw, top);
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
  else if (kind === "tenda") { say("Tenda", "Sua tenda. Dormir recupera tudo, mas o dia passa."); btn("Dormir", () => wipe(() => rest("dormir")), false, d); }
  else if (kind === "peles") { say("Comprador de peles", "Couro bom vira dinheiro bom. Mostra o que você caçou."); peltButtons(d); }
  else if (kind === "comida") { say("Barraca de comida", "Mandioca, peixe assado, açaí e maniçoba. Barriga cheia, lança firme."); foodButtons(d); }
  else if (kind === "artesao") { say("Artesão", "Roupas e equipamentos feitos à mão, inclusive arco e flecha para caçar de longe e tocha para assustar os bichos. Quanto mais forte você fica, mais coisa eu te mostro."); gearButtons(d); }
  else if (kind === "inventario") { say("Bolsa", invSummary()); invButtons(d); }
  else say(VILLAGER_NAME[look] || "Aldeão", VILLAGER_TIPS[Math.floor(Math.random() * VILLAGER_TIPS.length)]);
  if (msg) d.insertAdjacentHTML("beforeend", `<p class="hint">${msg}</p>`);
  btn("Fechar", exCloseDialog, false, d);
  d.hidden = false;
}
// descansar/dormir na fogueira: Rhanon senta do lado do fogo (como na tela inicial) e só depois recupera
function exCampRest(kind) {
  const h = EX.hero, f = EX.spots.filter(s => s.kind === "fogueira").sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
  $("exDialog").hidden = true; exKeys.clear();
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
function exCampEnd() {
  const kind = EX.camp.kind; EX.camp = null;
  if (kind === "intro") return exToast("Aldeia · chegue perto da fogueira ou dos aldeões e aperte Z. A mata fica no caminho de saída.");
  EX.dialog = "fogueira";   // o resultado volta no painel da fogueira (localDone)
  rest(kind, true);   // dormir: o galo já cantou no amanhecer da cena
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
  const t0x = Math.floor(cx / TILE), t0y = Math.floor(cy / TILE);
  for (let ty = t0y - 3; ty <= t0y + 14; ty++) for (let tx = t0x - 3; tx <= t0x + 18; tx++)
    if (stageTile(tx, ty) === "F") light(tx * TILE + 8 - cx, ty * TILE + 8 - cy, 46 + Math.sin(now / 110 + tx) * 2.5);
  x.drawImage(c, 0, 0);
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
// teclado com o painel aberto: 1-9 botões, Enter o primeiro disponível, Esc/X/Z fecham
function dialogKey(ev) {
  const bs = [...$("exDialog").querySelectorAll(".cmd[data-key]")], onBtn = document.activeElement && document.activeElement.matches("#exDialog button");
  if (/^[1-9]$/.test(ev.key)) { ev.preventDefault(); pressPanel(bs[+ev.key - 1]); }
  else if (ev.key === "Enter" && !onBtn) { ev.preventDefault(); pressPanel(bs.find(b => b.getAttribute("aria-disabled") !== "true")); }
  else if (["Escape", "x", "X", "z", "Z", "i", "I"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); exCloseDialog(); }
  else if (ev.key.startsWith("Arrow") || ev.key === " ") ev.preventDefault();
}