/* Exploração das fases vista de cima. O Rhanon anda livre (8 direções), os bichos passeiam e perseguem.
   Quem acerta primeiro começa a batalha: golpe/arremesso do Rhanon = turno dele, com dano;
   bicho alcança ou o Rhanon esbarra nele = turno do bicho. Bem mais forte que o bicho = abate direto. */
// tamanho da câmera em pixels do jogo: acompanha a janela (exFit), com cada pixel do jogo virando VIEW_Z pixels da tela
let VIEW_W = 240, VIEW_H = 176, VIEW_Z = 3;
function exFit() {
  const W = innerWidth, H = innerHeight, z = Math.max(2, Math.round(Math.min(W / 380, H / 220)));   // ~24 x 14 quadrados ou mais (em tela grande o zoom não cresce tanto)
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
  return ch === "G" ? !gateOpen() : ch === "Y" || ch === "J" ? secretSolid(ch) : SOLID.includes(ch);
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
const AQUATIC = new Set(["piau", "piranha", "poraque", "boto", "traira"]);
// where: "terra" (sem peixes, para os "a" do mapa), "agua" (só peixes) ou nada (qualquer um, usado na batalha)
function pickFromPool(zone, where) {
  const z = zoneDef(zone), pool = where ? z.pool.filter(([id]) => (where === "agua") === AQUATIC.has(id)) : z.pool;
  if (!pool.length) return null;
  const more = WEATHER[weatherNow()].more || [], wt = ([id, w]) => more.includes(id) ? w * 2 : w;   // clima: os bichos dele aparecem o dobro
  let r = Math.random() * pool.reduce((s, q) => s + wt(q), 0);
  for (const q of pool) if ((r -= wt(q)) < 0) return ANIMALS.find(a => a.id === q[0]);
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
  if (G.night && NIGHT_ZONES[EX?.zone]) a = nightBeast(a);   // de noite os bichos da fase vêm mais fortes
  // ow = escala só na exploração (bicho desenhado pequeno perto do Rhanon, como o Curupira)
  const img = artCanvas("animal/" + a.id + "/mapa") || codeAnimalSprite(a), k = (+img.dataset.scale || 1) / (a.ow || 1), x = tx * TILE + 8, y = ty * TILE + 12;
  // traço novo: segundo quadro (respirando/andando) e o desmaiado, para quando cai com um golpe só
  const rig = img.dataset.rig, img2 = rig && beastFrame(a.id, "idle", 1), ko = rig && beastFrame(a.id, "ko"), blink = rig && beastFrame(a.id, "blink");
  // tomado pela fumaça (vivo, antes de ser acalmado): os mesmos quadros com o olho vermelho
  const evil = rig && isTomado(a) && {img: beastFrame(a.id, "idle", 0, true), img2: beastFrame(a.id, "idle", 1, true), blink: beastFrame(a.id, "blink", 0, true)};
  return {a, img, img2, ko, blink, evil, tomado: isTomado(a), w: img.width / k, h: img.height / k, x, y, homeX: x, homeY: y, hw: Math.min(7, Math.round(img.width / k / 3)), hh: 3,
    speed: a.id === "preguica" ? 18 : (ANIMAL_SPEED[a.size] ?? 40), boss: !!a.boss, alive: true,
    state: "wander", vx: 0, vy: 0, until: 0, face: -1, walk: 0, stunUntil: 0};
}
// after: chamado depois de montar a fase (cena de abertura)
// from = "back": chegou voltando da fase seguinte, então aparece do lado de dentro da passagem (G)
function startExplore(zone, after, from) {
  if (moving || (EX && EX.starting)) return;
  if (EX) EX.starting = true;
  wipe(() => {
    const st = STAGES[zone], rows = st.safe ? st.rows : secretRows(zone, st.rows);   // fase de caça: com o recanto secreto cavado
    EX = {zone, st, rows, map: drawStageMap(rows, zone), pal: TILE_PAL[zone] || TILE_PAL.mata,
      night: !!G.night, ents: [], fx: [], loot: [], spits: [], spots: [], spear: null, cool: 0, jab: 0, hero: null, fighting: null, locked: false, invulnUntil: 0, dialog: null};
    const at = (tx, ty) => (st.rows[ty] || "")[tx];
    rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch === "Y" && secretState(zone)) return;   // segredo já aberto: a entrada é chão
      if ("QUO".includes(ch)) {   // bloco: um ponto só, embaixo do meio dele (onde o Rhanon chega pela calçada)
        if (at(tx - 1, ty) === ch || at(tx, ty - 1) === ch) return;
        let w = 0, h = 0; while (at(tx + w, ty) === ch) w++; while (at(tx, ty + h) === ch) h++;
        const sp = {kind: SPOTS[ch], x: tx * TILE + w * 8, y: (ty + h) * TILE + 4, tx, ty, w, h};
        EX.spots.push(sp); if (ch === "U") EX.bus = {x: tx * TILE, y: ty * TILE, w: w * TILE, h: h * TILE, dx: 0, spot: sp};
        return;
      }
      if (ch === "S") EX.hero = {x: tx * TILE + 8, y: ty * TILE + 12, hw: 5, hh: 3, dir: "down", aim: {x: 0, y: 1}, walk: 0, flip: false, movedT: 0};
      else if (ch === "a") { const a = pickFromPool(zone, "terra"); if (a) EX.ents.push(makeAnimalEnt(a, tx, ty)); }
      else if (ch === "B" && !BS()[bossKey(zone)]) EX.ents.push(makeAnimalEnt(ANIMALS.find(a => a.id === zoneDef(zone).boss), tx, ty));
      else if (ch === "B") EX.spots.push({kind: "lembranca", x: tx * TILE + 8, y: ty * TILE + 8, tx, ty});   // chefe vencido: dá para enfrentar de novo
      else if (SPOTS[ch]) EX.spots.push({kind: SPOTS[ch], look: SPOTS[ch] === "cliente" ? FREELAS[FREELA_AT[zone] || "site_feira"].look : SPOTS[ch] === "aldeao" ? (cityOf(zone) !== "ananindeua" ? "urbano" : "aldeao") + (EX.spots.filter(q => q.kind === "aldeao").length % 3 + 1) : SPOTS[ch], x: tx * TILE + 8, y: ty * TILE + 8, tx, ty});
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
    exToast((st.safe ? SUB[zone].n + (SAFE_TIP[zone] || t(" · lembranças, comida, artesão e armeiro: chega perto de uma barraca e aperta Z")) : zoneDef(zone).n + (BS()[bossKey(zone)] ? "" : G.night ? t(" · dizem que algo do folclore ronda o fim da trilha...") : t(" · o chefe espera no fim da trilha"))) + (weatherNow() === "limpo" ? "" : " · " + WEATHER[weatherNow()].n));
    if (zone === "aldeia" && !after) announceOffer();   // pedido do dia (na abertura, só depois de acordar)
    if (after) after();
    else if (G.night && !G.tutorial && !G.narrated.pyt_noite) { G.narrated.pyt_noite = true; save(); setTimeout(() => pytunaScene(NARRA_PYT.noite), 700); }   // primeira noite: Pytuna aparece
    else if (jaciLight() >= 1 && !G.narrated.norte_fim || guaraciCalm() >= 1 && !G.narrated.nordeste_fim) { EX.locked = true; setTimeout(() => bossStory("", () => { if (EX) EX.locked = false; }), 700); }   // save que já acalmou a região toda
    else if (cityOf(zone) === "belem" && !G.narrated.belem) { G.narrated.belem = true; save(); setTimeout(() => narrate(NARRA.belem), 600); }   // primeira vez na capital
    else if (cityOf(zone) === "saoluis" && !G.narrated.saoluis) { G.narrated.saoluis = true; save(); setTimeout(() => narrate(NARRA.saoluis), 600); }   // chegou no Nordeste
    else if (cityOf(zone) === "petrolina" && !G.narrated.petrolina) { G.narrated.petrolina = true; save(); setTimeout(() => narrate(NARRA.petrolina), 600); }
    else if (cityOf(zone) === "recife" && !G.narrated.recife) { G.narrated.recife = true; save(); setTimeout(() => narrate(NARRA.recife), 600); }
    else if (cityOf(zone) === "teresina" && !G.narrated.teresina) { G.narrated.teresina = true; save(); setTimeout(() => narrate(NARRA.teresina), 600); }
    else if (G.loseStreak >= 2) { G.loseStreak = 0; save(); setTimeout(() => narrate([pajeHint()]), 600); }   // perdeu duas seguidas: o Pajé "lembra" de algo
  });
}
const SAFE_TIP = {aldeia: " · chega perto da fogueira ou dos aldeões e aperta Z. A trilha da direita vai pra feira",
  praiagrande: " · lembranças, comida e rede na pensão: chega perto e aperta Z",
  trocatroca: " · lembranças, comida e rede na pensão: chega perto e aperta Z",
  orla: " · lembranças, comida e rede na pensão: chega perto e aperta Z",
  recifeantigo: " · lembranças, comida, rede na pensão e o Seu Dedé, que tem um freela: chega perto e aperta Z",
  parada: " · compra a passagem na bilheteria e embarca no barco", terminal: " · o barco volta pra aldeia; a trilha da esquerda vai pro Ver-o-Peso"};
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
  if (en && result === "win" && en.a.bug) { en.alive = false; freelaBugDone(); }   // bug do freela resolvido
  else if (en && result === "win" && !en.boss) exCalm(en);   // agradece e corre para o mato
  if (en && result === "win" && en.boss) {   // chefe acalmado fica no lugar como aliado (ponto de treino)
    en.alive = false;
    if (!EX.spots.some(s => s.kind === "lembranca")) EX.spots.push({kind: "lembranca", x: en.homeX, y: en.homeY - 4, tx: Math.floor(en.homeX / TILE), ty: Math.floor(en.homeY / TILE)});
  }
  if (en && result === "flee") { en.stunUntil = now + 3500; EX.invulnUntil = now + 2500; }
  $("explore").hidden = false; $("homeButton").hidden = true;
  musicStart("local"); exHud();
  if (en && result === "win" && en.rematch) exToast(t("Treino vencido: {chefe} gostou da luta!", {chefe: theName(en.a)}));
  else if (en && result === "win" && en.boss) exToast(NIGHT_ZONES[EX.zone] && en.a.id === NIGHT_ZONES[EX.zone].boss ? t("{chefe} voltou a si! A aldeia vai falar disso por muitas noites.", {chefe: theName(en.a, true)})
    : EX.st.next === "parada" ? t("Último chefe da trilha vencido! A passagem leva ao porto do Tapajós.") : EX.st.next ? t("Caminho livre: {lugar}! Segue a trilha até a passagem.", {lugar: SUB[EX.st.next].n}) : t("Último chefe daqui vencido!"));
  const reveal = () => { if (en && result === "win" && en.boss && pendingReveal()) { EX.locked = true; setTimeout(() => revealNext(() => { if (EX) EX.locked = false; }), 700); } };   // o mapa mostra o caminho novo
  if (en && result === "win" && en.boss && !en.rematch && NARRA_BOSS[en.a.id] && !G.narrated[en.a.id]) {
    G.narrated[en.a.id] = true; save(); EX.locked = true;
    setTimeout(jaciJingle, 300);   // um pedaço da luz de Jaci volta
    setTimeout(() => narrate(NARRA_BOSS[en.a.id], () => bossStory(en.a.id, () => { if (EX) EX.locked = false; reveal(); })), 900);
  } else reveal();
  if (result === "win") setTimeout(nbShowNew, 1300);   // peça do notebook ganha na luta: entra encaixando
}

/* ---------- ações do Rhanon ---------- */
const entH = en => Math.min(en.h, 20);
// analógico direito do controle inclinado (ui/gamepad.js): mira para lá antes do golpe ou da flecha
const padAimNow = () => { if (EX.padAim) exAimAt(EX.hero.x + EX.padAim.x * 20, EX.hero.y - 8 + EX.padAim.y * 20); };
function exStrike() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0) return;
  padAimNow();
  const spot = nearSpot(); if (spot) return exOpenDialog(spot.kind, null, spot.look);   // perto de alguém: conversa em vez de golpe
  const h = EX.hero; EX.cool = .35; EX.jab = .16; sfx("spear");
  // a lança alcança uns 1,5 quadrado à frente: confere pontos ao longo dela
  const reach = en => [8, 15, 22].some(r => Math.hypot(en.x - (h.x + h.aim.x * r), en.y - entH(en) / 2 - (h.y - 8 + h.aim.y * r)) < 9 + en.hw);
  if (EX.ents.some(en => en.alive && en.aquatic && reach(en)) && !EX.ents.some(en => en.alive && !en.aquatic && reach(en))) exToast(t("O peixe tá na água e a lança não alcança. Usa a flecha (X)!"));
  const target = EX.ents.find(en => en.alive && !en.aquatic && [8, 15, 22].some(r => Math.hypot(en.x - (h.x + h.aim.x * r), en.y - entH(en) / 2 - (h.y - 8 + h.aim.y * r)) < 9 + en.hw));
  if (target) exHit(target);
}
// flecha: só com arco (EQUIP.ranged, comprado no armeiro da feira)
const BOW_DRAW = .32;   // segundos puxando a corda antes da flecha sair (ele para de andar nesse tempo)
// mão do arco (em pixels do desenho 32x44 do Rhanon): esticada na direção da mira, na altura do peito
const bowHand = a => [16 + a.x * 13, 25 + a.y * 9];
function exThrow() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.cool > 0 || EX.spear || EX.draw) return;
  if (!G.equip.ranged) { EX.cool = 1.2; sfx("blip"); return exToast(t("Pra atacar de longe precisa de arco. O armeiro da feira faz um.")); }
  padAimNow();
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
/* esquiva: um rolamento rápido na direção em que anda (ou para onde mira), sem levar bote no caminho; depois espera
   DODGE_COOL segundos (a rodinha ao lado do Rhanon carrega, drawDodgeCool) */
const DODGE_TIME = .3, DODGE_SPEED = 2.8, DODGE_COOL = 2;
const dodgeCool = () => hasSkill("mira") ? 1 : DODGE_COOL;   // habilidade Olho de gavião
function exDodge() {
  if (!EX || EX.locked || EX.dialog || EX.camp || EX.draw || EX.dodge || (EX.dodgeCool || 0) > 0) return;
  const h = EX.hero, ix = (exKeys.has("right") ? 1 : 0) - (exKeys.has("left") ? 1 : 0), iy = (exKeys.has("down") ? 1 : 0) - (exKeys.has("up") ? 1 : 0), n = Math.hypot(ix, iy);
  const v = n ? {x: ix / n, y: iy / n} : h.aim;
  EX.dodge = {t: DODGE_TIME, vx: v.x, vy: v.y}; EX.dodgeCool = dodgeCool();
  EX.invulnUntil = Math.max(EX.invulnUntil, performance.now() + DODGE_TIME * 1000 + 120);
  exBurst(h.x, h.y - 2, ["#d8c49a", "#a89a72", "#ffffff"], 6); sfx("esquiva");
}
// pega a lembrança do chão: vai para a bolsa (vende na feira)
function pickLoot(l) {
  EX.loot = EX.loot.filter(q => q !== l); vit();
  G.pelts[l.id] = (G.pelts[l.id] || 0) + 1; save(); sfx("heal");
  exBurst(l.x, l.y - 4, ["#ffffff", "#ffd23a"], 8);
  exToast(t("Pegou: {pele} (R$ {n} na feira).", {pele: peltName(l.id).toLowerCase(), n: peltValue(l.id)})); exHud();
}
// cor da trouxinha pelo tipo da lembrança: pena, pele trocada, dente/espinho, luar de chefe ou pelo
const SHED = new Set(["calango", "sucuri", "surucucu", "caranguejeira", "sapo", "cobra_cipo", "jararaca", "iguana", "caranguejo", "tracaja"]);
const TEETH = new Set(["jacare", "piranha", "jacaretinga", "ourico"]);
const lootColor = id => ANIMALS.find(a => a.id === id)?.boss ? ["#fff6c8", "#c8d8ff"] : BIRDS.has(id) ? ["#ececf0", "#a8a8b4"]
  : SHED.has(id) ? ["#d8d0a8", "#a8a07a"] : TEETH.has(id) ? ["#f4ecd8", "#c8bca0"] : ["#a86f40", "#7a4a2a"];
function drawLoot(x, l, cx, cy, now) {
  const col = lootColor(l.id);
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
    exCalm(en); sfx("crit");
    exBurst(en.x, en.y - 6, ["#ffffff", "#ffd23a", "#c8e8ff"], 14);   // a fumaça sai como brilho
    curZone = EX.zone;
    exToast(t("Acalmou {bicho} num golpe só!", {bicho: theName(a)}) + " " + reward(a, G.lv - (a.lv || 1) >= ONE_HIT_LEVELS ? WEAK_XP : ONE_HIT_XP, !en.aquatic).join(" · "));
    if (!en.aquatic) EX.loot.push({id: a.id, x: en.x, y: en.y, t0: performance.now()});   // a lembrança fica no chão até ele passar por cima (peixe: vai direto para a bolsa)
    exHud(); setTimeout(nbShowNew, 1200);   // largou peça do notebook: ela entra encaixando
    return;
  }
  sfx("hit");
  exStartBattle(en, {firstHit: Math.min(d, a.hp - 1)});
}
function exStartBattle(en, opts) {
  if (EX.locked) return;
  EX.locked = true; EX.fighting = en; exKeys.clear();
  setTimeout(() => battleCutin(opts.enemyFirst ? "ambush" : "first", () => {
    $("explore").hidden = true; fromExplore = true; curZone = en.a.bug ? "codigo" : EX.zone; bossFight = en.boss;   // bug do freela: luta dentro do código
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
  if (EX.fill) hudFillTick(now);
  EX.cool = Math.max(0, EX.cool - dt); EX.jab = Math.max(0, EX.jab - dt); EX.shoot = Math.max(0, (EX.shoot || 0) - dt);
  if (EX.draw && (EX.draw.t += dt) >= BOW_DRAW) exRelease();
  if (EX.spits.length && !EX.dialog && !EX.camp) { exSpits(dt, now); if (!EX || EX.locked) return; }
  if (EX.camp) {   // sons da fogueira: ronco com assobio enquanto dorme; ao dormir, a faixa do amanhecer traz o galo
    const c = EX.camp, el = now - c.t0;
    if (campAsleep(c, el) && !c.dawned && now - (c.snoreT || 0) > 1700) { c.snoreT = now; sfx("ronco"); }   // o amanhecer interrompe o ronco
    if (CAMP_DAWN_AT[c.kind] && el > CAMP_DAWN_AT[c.kind] && !c.dawned) {   // passa a faixa do amanhecer (galo e sol); por trás dela vira dia
      c.dawned = true;
      const toNight = c.kind === "noite";   // atrás da faixa o mundo troca: noite (lua e lobo) ou dia (sol e galo)
      dawnWipe(() => { c.day = true; G.night = toNight; EX.night = toNight; save(); exHud(); musicStart("local"); }, toNight ? t("Anoiteceu") : t("Amanheceu · Dia {n}", {n: G.day + 1}), toNight);
    }
  }
  // aviso "segure C para pular" com a barrinha enchendo (0,7 s segurando pula a cena)
  const sk = $("exSkip");
  if (EX.camp) {
    if (sk.hidden) sk.firstChild.nodeValue = skipText() + " ";   // "Segure C" ou o botão do controle
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
  if (EX.locked || EX.dialog || EX.draw || EX.camp || !$("opcoes").hidden || !$("caderno").hidden || !$("equipar").hidden || !$("habil").hidden || !$("narra").hidden || !$("revela").hidden) ix = iy = 0;
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
  if (EX.dodge) return drawHeroRoll(x, h, sx, sy);
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
    const sl = spearLook();
    spearShaft(x, bx - h.aim.x * 4, by - h.aim.y * 4, bx + h.aim.x * L, by + h.aim.y * L, sl.p);
    pxl(x, bx + h.aim.x * (L + 1), by + h.aim.y * (L + 1), sl.m); pxl(x, bx + h.aim.x * L, by + h.aim.y * L, sl.band || "#cfd8dc");
  };
  drawShadow(x, sx, sy, 12);
  if (EX.jab > 0 && behind) jab();
  x.drawImage(img, sx - iw / 2 + ox, sy - ih + 1 + oy, iw, ih);
  if (B) drawAimBow(x, sx - iw / 2 + B[0] * OW_SCALE, sy - ih + 1 + B[1] * OW_SCALE, bowAim, pull, !!EX.draw, now);
  if (EX.jab > 0 && !behind) jab();
  grassOver(x, h, cx, cy);
  drawDodgeCool(x, sx, sy, now);
}
// rolamento: o Rhanon de perfil, encolhido, dá uma volta inteira no ar baixo enquanto avança (lança guardada)
function drawHeroRoll(x, h, sx, sy) {
  const dg = EX.dodge, k = 1 - Math.max(0, dg.t) / DODGE_TIME, side = dg.vx < -.1 ? -1 : dg.vx > .1 ? 1 : h.side || 1;
  const img = rigSideCanvas({step: "walk1", dy: 2, weapon: null, side}, {...rhanonLook(), bowBack: false}, OW_SCALE);
  const iw = img.width, ih = img.height, lift = Math.sin(k * Math.PI) * 3;
  drawShadow(x, sx, sy, 10);
  x.save(); x.translate(sx, sy - ih * .38 - lift); x.rotate(side * k * Math.PI * 2); x.scale(1, .82);
  x.drawImage(img, -iw / 2, -ih / 2, iw, ih); x.restore();
}
// rodinha da esquiva: enche enquanto recarrega e pisca uma vez quando fica pronta
function drawDodgeCool(x, sx, sy, now) {
  const c = EX.dodgeCool || 0;
  if (c <= 0) { if (EX.dodgeReady && now - EX.dodgeReady < 260) { x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.arc(sx + 9, sy - 30, 3.5, 0, Math.PI * 2); x.fill(); } return; }
  EX.dodgeReady = now;
  const p = 1 - c / dodgeCool(), X = sx + 9, Y = sy - 30;
  x.lineWidth = 1.4; x.strokeStyle = "rgba(0,0,0,.55)"; x.beginPath(); x.arc(X, Y, 3.5, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = "#ffd23a"; x.beginPath(); x.arc(X, Y, 3.5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); x.stroke();
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
  const c = en.calm, el = c ? now - c.t0 : 0, run = c && !en.aquatic ? Math.max(0, el - CALM_WAIT) / 1000 * CALM_SPEED : 0;
  if (c) { en.x = c.x0 + c.vx * run; en.y = c.y0 + c.vy * run; }   // acalmado: agradece parado e depois corre para longe do Rhanon
  const sx = snap(en.x - cx), sy = snap(en.y - cy), w = en.w, hg = en.h;
  if (sx < -40 || sx > VIEW_W + 40 || sy < -8 || sy > VIEW_H + 40) return;
  let bob = (en.vx || en.vy || en.state === "chase") ? Math.floor(en.walk / 5) % 2 : Math.floor(now / 500) % 2, img = en.img;
  if (c) bob = run ? Math.floor(run / 4) % 2 : Math.floor(el / 160) % 2;   // pulinho de alegria, depois as patas correndo
  if (c && en.koUntil - now < 350 && Math.floor(now / 70) % 2) return;   // já longe: pisca e some no mato
  if (c) { if (bob && en.img2) img = en.img2; bob = run ? 0 : bob * 2; }
  else if (!en.alive) { img = en.ko; bob = 0; if (en.koUntil - now < 400 && Math.floor(now / 80) % 2) return; }   // desmaiado, pisca e some
  else if (en.img2) {   // traço novo: troca de quadro e pisca (tomado: os quadros de olho vermelho)
    const q = en.evil || en; img = q.img;
    if (bob) img = q.img2; bob = 0; if (q.blink && (now + en.homeX * 7) % 3600 < 140) img = q.blink;
  }
  if (c && el < CALM_WAIT + 300) drawThanks(x, en, sx, sy - hg - 6 - Math.min(4, el / 120), el);
  if (en.aquatic && (en.alive || c)) {   // na água: só a parte de cima aparece, com marolinhas em volta
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
  if (en.alive && en.tomado) drawTomado(x, sx, sy - bob, w, hg, now, en.homeX, true);   // halo escuro atrás do bicho
  x.save();
  if (en.a.tint) x.filter = en.a.tint;
  if (en.face > 0) { x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, -Math.round(w / 2), sy - hg - bob, w, hg); }
  else x.drawImage(img, sx - Math.round(w / 2), sy - hg - bob, w, hg);
  x.restore();
  if (en.alive && en.tomado) drawTomado(x, sx, sy - bob, w, hg, now, en.homeX);
  grassOver(x, en, cx, cy);
}
/* fumaça de Pytuna num bicho tomado (some quando ele é acalmado): back = halo escuro arroxeado pulsando atrás do
   corpo; senão, fiapos escuros subindo das costas e sumindo */
function drawTomado(x, sx, sy, w, hg, now, seed, back) {
  if (back) {
    const k = .5 + .5 * Math.sin(now / 420 + seed), rx = w * .55 + 2 + k * 2, ry = hg * .5 + 2 + k;
    x.globalAlpha = .22 + k * .14; x.fillStyle = "#2a1440";
    x.beginPath(); x.ellipse(sx, sy - hg * .45, rx, ry, 0, 0, Math.PI * 2); x.fill();
    x.globalAlpha = 1; return;
  }
  for (let i = 0; i < 6; i++) {
    const p = (now / 1300 + i / 6 + seed * .013) % 1, s = p < .35 ? 4 : p < .7 ? 3 : 2;
    const px = Math.round(sx + Math.sin(p * 4 + i * 1.7) * w * .35), py = Math.round(sy - hg * (.45 + .12 * (i % 3)) - p * 22);
    x.globalAlpha = .85 * (1 - p); x.fillStyle = PYT_SMOKE[i % PYT_SMOKE.length]; x.fillRect(px - (s >> 1), py - (s >> 1), s, s);
  }
  x.globalAlpha = 1;
}
// bicho acalmado (golpe só ou vitória na batalha): agradece num balãozinho e corre para longe do Rhanon, para o mato
const CALM_WAIT = 700, CALM_SPEED = 120, CALM_RUN = 1000;   // ms parado agradecendo, pixels/s correndo, ms correndo até sumir
const BIRDS = new Set(["carao", "martim", "soldadinho", "tapejara", "periquito", "rasga_mortalha", "galo_campina", "bigua", "asa_branca", "guara", "garca_moura", "carcara", "harpia", "coruja", "garca", "macarico", "urubu", "soco", "pombo", "urubu_porto", "gaivota", "gaviao_real"]);
function exCalm(en, now = performance.now()) {
  const h = EX.hero, dx = en.x - h.x, dy = en.y - h.y, n = Math.hypot(dx, dy) || 1;
  en.alive = false; en.calm = {t0: now, x0: en.x, y0: en.y, vx: dx / n, vy: dy / n}; en.face = dx > 0 ? 1 : -1;
  if (en.tomado) for (let i = 0; i < 12; i++) EX.fx.push({x: en.x + (Math.random() - .5) * en.w * .7, y: en.y - en.h * (.3 + Math.random() * .5), vx: (Math.random() - .5) * 18, vy: -22 - Math.random() * 26, life: .9, col: PYT_SMOKE[i % PYT_SMOKE.length]});   // a fumaça sai e sobe
  en.koUntil = now + CALM_WAIT + (en.aquatic ? 500 : CALM_RUN);
}
// balãozinho de agradecimento: coração; passarinho canta (nota); o macaco faz joinha; gente (malandro) não agradece
function drawThanks(x, en, sx, top, el) {
  if (MOTION[en.a.id] === "person") return;
  const g = en.a.id === "macaco" ? "thumb" : BIRDS.has(en.a.id) ? "note" : "heart", col = {heart: "#e5001c", note: "#3a4ac8", thumb: "#c8902a"}[g];
  const bx = Math.round(sx - 5), by = Math.round(top - 9), pop = el < 120 ? 1 : 0;
  x.fillStyle = OUTLINE; x.fillRect(bx - 1 + pop, by - 1 + pop, 11 - pop * 2, 9 - pop * 2); x.fillRect(bx + 3, by + 8, 3, 2);
  x.fillStyle = "#ffffff"; x.fillRect(bx + pop, by + pop, 9 - pop * 2, 7 - pop * 2); x.fillRect(bx + 4, by + 7, 1, 2);
  if (!pop) glyphP(x, g, col, bx + 2, by + 1);
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
    if (ch === "Y" && !secretState(EX.zone)) drawSecretBlock(x, sx, sy, SECRETS[EX.zone].elem, now);
    if (ch === "J") drawChest(x, sx, sy, secretState(EX.zone) >= SECRET_LOOTED, now);
    if (ch === "F") drawFire(x, sx, sy, now);
  }
  EX.loot.forEach(l => drawLoot(x, l, cx, cy, now));   // no chão, embaixo de todo mundo
  const alive = EX.ents.filter(en => en.alive), knocked = EX.ents.filter(en => !en.alive && (en.calm || en.ko) && en.koUntil > now);
  const people = EX.spots.filter(s => PEOPLE.includes(s.kind)).map(s => ({y: s.y + 5, draw: () => drawNpc(x, s, cx, cy, now)}));
  if (EX.bus) people.push({y: EX.bus.y + EX.bus.h, draw: () => drawBus(x, EX.bus, cx, cy, now)});
  EX.spots.filter(s => s.kind === "lembranca").forEach(s => people.push({y: s.y + 4, draw: () => drawMemento(x, s, cx, cy, now)}));
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
  drawPytuna(x, cx, cy, now);   // fumaça de Pytuna nas cenas dele (ui/narration.js)
  drawAmbient(x, cx, cy, now, true);
  drawWeather(x, now);
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
  if ($("narra").hidden) exUpdate(dt, t);   // com o Pajé (ou o Pytuna) falando, o mundo para
  if (EX && !$("explore").hidden) exDraw(t);
}

/* ---------- textos na tela ---------- */
// show = {hp, sp} no lugar do que está no save (as barras enchendo no descanso)
function exHud(show) {
  vit(); const hp = show ? show.hp : G.hp, sp = show ? show.sp : G.sp;
  // HUD do guardião: medalhão com o rosto e o nível, o nome do lugar, barras de tronco (PV folha, PE água, XP semente) e o dinheiro
  const row = (lbl, v, m, cls) => `<span class="grow ${cls}"><span class="glbl">${lbl}</span><i class="gbar ${cls}"><u style="width:${Math.round(100 * v / m)}%"></u></i><small>${v}/${m}</small></span>`;
  $("exHud").innerHTML = `<i class="medal" style="background-image:url(${heroMedal()})"><em>${t("Nv")} ${G.lv}</em></i><span class="gst">`
    + `<b>${ZONES[EX.zone] ? zoneDef(EX.zone).n : G.night ? t("{zona} à noite", {zona: SUB[EX.zone].n}) : SUB[EX.zone].n}</b>`
    + row(t("PV"), hp, maxHP(G.lv), "pv") + row(t("PE"), sp, maxSP(G.lv), "pe") + row("XP", G.xp, need(G.lv), "xp")
    + `</span><span class="gmoney">R$ ${G.money}</span>`;
  $("exSkills").classList.toggle("pts", skillPoints() > 0);   // ponto de habilidade para gastar: o botão chama atenção
}
function exToast(msg) {
  const el = $("exMsg"); el.textContent = msg; el.classList.add("show");
  clearTimeout(exMsgTimer); exMsgTimer = setTimeout(() => el.classList.remove("show"), 3600);
}

/* ---------- controles: teclado e botões de toque ---------- */
function setupExploreInput() {
  const DIRS = {ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"};
  document.addEventListener("keydown", ev => {
    if (!EX || $("explore").hidden || !$("opcoes").hidden || !$("caderno").hidden || !$("narra").hidden) return;   // com opções, caderno ou narração abertos, o teclado é deles
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
    else if ((ev.key === "h" || ev.key === "H") && !EX.locked) openSkills();
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
/* revanche com o chefe: a lembrança no lugar onde ele caiu pergunta se o Rhanon quer enfrentá-lo de novo. A luta é a
   de sempre (com a apresentação) e dá a pele outra vez, mas só REMATCH_XP do XP, para não virar atalho de nível */
const REMATCH_XP = .5;
const rematchBoss = () => ANIMALS.find(a => a.id === (G.night && NIGHT_ZONES[EX.zone] ? NIGHT_ZONES[EX.zone].boss : zoneDef(EX.zone).boss));
function exRematch(spot) {
  exCloseDialog();
  const en = makeAnimalEnt(rematchBoss(), spot.tx, spot.ty); en.rematch = true;
  EX.ents.push(en); exStartBattle(en, {rematch: true});
}
// chefe aliado: ele mesmo, calmo, no lugar onde foi acalmado (respirando, piscando e de vez em quando um coração);
// sem desenho em traço novo, fica a estaca antiga com o brilho
function drawMemento(x, s, cx, cy, now) {
  if (!s.ally) { const b = rematchBoss(); s.ally = b ? makeAnimalEnt(b, s.tx, s.ty) : null; if (s.ally) s.ally.face = 1; }
  const al = s.ally;
  if (al && al.img2) {
    const sx = Math.round(s.x - cx), sy = Math.round(s.y - cy) + 6, w = al.w, hg = al.h, f = Math.floor(now / 600) % 2;
    const img = al.blink && now % 4200 < 140 ? al.blink : f ? al.img2 : al.img;
    drawShadow(x, sx, sy, Math.max(8, Math.round(w * .7)));
    x.save(); if (al.a.tint) x.filter = al.a.tint; x.globalAlpha = .95;
    x.translate(sx, 0); x.scale(-1, 1); x.drawImage(img, -Math.round(w / 2), sy - hg, w, hg); x.restore();
    const p = now % 5200;
    if (p < 900) drawThanks(x, al, sx, sy - hg - 6 - p / 300, p);
    return;
  }
  const sx = Math.round(s.x - cx), sy = Math.round(s.y - cy) + 4;
  x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(sx - 6, sy, 12, 2);
  x.fillStyle = OUTLINE; x.fillRect(sx - 2, sy - 16, 4, 17); x.fillStyle = "#9c6339"; x.fillRect(sx - 1, sy - 15, 2, 15);   // estaca
  x.fillStyle = OUTLINE; x.fillRect(sx - 6, sy - 15, 12, 9); x.fillStyle = "#c8a070"; x.fillRect(sx - 5, sy - 14, 10, 7);   // pele
  x.fillStyle = "#e5001c"; x.fillRect(sx - 5, sy - 12, 10, 1);   // amarração vermelha
  x.fillStyle = "#7a4a2a"; x.fillRect(sx - 3, sy - 10, 2, 2); x.fillRect(sx + 1, sy - 10, 2, 2);
  const p = (now / 1400) % 1;
  if (!REDUCE && p < .7) { x.fillStyle = p < .35 ? "#ffd23a" : "#fff3c4"; x.fillRect(sx + 4 - Math.round(p * 4), sy - 18 - Math.round(p * 10), 1, 1); }
}
const SPOTS = {Y: "segredo", J: "bau", F: "fogueira", N: "tenda", O: "tenda", V: "peles", C: "comida", R: "artesao", M: "armeiro", X: "xama", L: "tecnico", W: "cliente", P: "aldeao", Q: "cabine", U: "onibus"};
const PEOPLE = ["peles", "comida", "artesao", "armeiro", "xama", "tecnico", "cliente", "aldeao"];
const SPOT_LABEL = {segredo: "examinar", bau: "abrir o baú", fogueira: "descansar na fogueira", tenda: "dormir", peles: "vender lembranças", comida: "comprar comida", artesao: "ver roupas", armeiro: "ver armas e armaduras", xama: "falar com o Pajé", tecnico: "falar com o Seu Bugiganga", cliente: "falar com a Dona Graça", aldeao: "conversar", cabine: "falar com o comandante", onibus: "embarcar no barco", lembranca: "falar com o chefe"};
const VILLAGER_NAME = {aldeao1: "Mateiro", aldeao2: "Ancião", aldeao3: "Aldeã", urbano1: "Peixeira", urbano2: "Erveira", urbano3: "Estivador"};
// dicas da gente do Ver-o-Peso (em Belém)
// pensões das cidades (fase com O): nome do painel; dormir passa pela cena do quarto (motelScene)
const PENSAO_NAME = {veropeso: "Pensão do Ver-o-Peso", praiagrande: "Pensão da Praia Grande", trocatroca: "Pensão do Troca-Troca", recifeantigo: "Pensão do Recife Antigo", orla: "Pensão da Orla"};
// aviso de quando o Rhanon acorda na cidade (abertura do jogo, startIntro)
const CITY_WAKE = {belem: "Belém · manhã no Ver-o-Peso...", saoluis: "São Luís · manhã na Praia Grande...", teresina: "Teresina · manhã no Troca-Troca...", recife: "Recife · manhã no Recife Antigo...", petrolina: "Petrolina · manhã na beira do Velho Chico..."};
// Petrolina: quem é cada morador da orla do São Francisco e o que eles contam
const PETROLINA_NAME = {urbano1: "Vendedora de queijo coalho", urbano2: "Artesão de carranca", urbano3: "Vaqueiro"};
const PETROLINA_TIPS = [
  "Oxe, chegou do litoral? Aqui é sertão, meu filho: sol de rachar e o Velho Chico pra refrescar. Prova o queijo coalho na brasa.",
  "A carranca vai na proa do barco pra espantar o Nego d'água. Cara feia de madeira, coração bom.",
  "Na caatinga tudo tem espinho: mandacaru, xique-xique, até o bode tem cara de poucos amigos. Vai de gibão, se puder.",
  "De noite, quem anda na caatinga ouve um assobio fino. É a Comadre Fulozinha. Ela protege a mata e dá surra de cipó em caçador.",
  "Pra agradar a Comadre, o povo deixa fumo e mingau no pé do pau. Mas esse ano nem isso tá acalmando ela.",
  "Dizem que lá pra serra, nas noites de lua cheia de sexta-feira, anda um lobisomem. Vixe, nem quero saber.",
  "Rio abaixo, na beira, tem uma carranca que se soltou da proa e desce o rio sozinha, de cara fechada. Oxe, logo a que devia proteger a gente.",
  "Quem pesca de noite na beira deixa um fuminho na pedra pro Nego d'água. Se não deixar, ele ri alto e vira a canoa."
];
// Recife: quem é cada morador do Recife Antigo e o que eles contam
const RECIFE_NAME = {urbano1: "Passista de frevo", urbano2: "Vendedora de bolo de rolo", urbano3: "Batuqueiro do maracatu"};
const RECIFE_TIPS = [
  "Oxente, tu é de onde? Do Pará? Então prova o bolo de rolo: é fininho, enroladinho, e tem goiabada em cada camada.",
  "No Carnaval o Recife Antigo fica que não cabe ninguém: frevo de um lado, maracatu do outro. A sombrinha do frevo é pra equilibrar o passo.",
  "O maracatu tem rei, rainha e a calunga, uma boneca que leva os antepassados. Quando o tambor bate, o chão treme.",
  "Olinda fica logo ali, subindo a ladeira. Lá tem os bonecos gigantes, cada um maior que um poste.",
  "O Seu Dedé escreve cordel desde menino e vende na feira pendurado no barbante. Agora ele quer botar tudo no celular. Arretado, né?"
];
// Teresina: quem é cada morador do Troca-Troca e o que eles contam
const TERESINA_NAME = {urbano1: "Vendedora de cajuína", urbano2: "Artesão de cerâmica", urbano3: "Pescador do Poti"};
const TERESINA_TIPS = [
  "Égua não, aqui é \"oxe\"! Bem-vindo a Teresina, a cidade mais quente do Brasil. Toma uma cajuína gelada que passa.",
  "O Parnaíba e o Poti se encontram logo ali. Nas noites de cheia, ninguém pesca no encontro: é a hora do Cabeça de Cuia.",
  "Esse barro aqui vem do Poti Velho. A gente faz panela, pote e santo desde o tempo dos avós.",
  "Rapaz, de dia é mormaço que derrete. Vai pro rio cedinho, que depois do meio-dia nem o jacaré aguenta.",
  "Dizem que o Cabeça de Cuia só se livra da maldição se se arrepender de verdade. Vai que tu ajuda o homem."
];
// São Luís: quem é cada morador da Praia Grande (mesmos desenhos de Belém) e o que eles contam
const SAOLUIS_NAME = {urbano1: "Vendedora de juçara", urbano2: "Rendeira", urbano3: "Brincante do boi"};
const SAOLUIS_TIPS = [
  "Vixe, tu é do Pará? Aqui o açaí se chama juçara, e a gente toma com farinha e peixe frito.",
  "A maré daqui sobe e desce seis, sete metros num dia só. Quem não presta atenção perde a canoa, rapaz.",
  "Em junho a ilha toda vira boi: matraca, pandeirão, zabumba... Mas esse ano o boi anda triste. Dizem que é a fumaça.",
  "Esses azulejos vieram de Portugal faz mais de duzentos anos. Por isso chamam São Luís de cidade dos azulejos.",
  "Lá pros Lençóis a areia é tão branca que parece neve, e entre as dunas tem lagoa azul. Um dia abre caminho pra lá.",
  "De noite, dizem que a carruagem de Ana Jansen passa nas ruas de pedra, puxada por cavalo sem cabeça. Vixe, nem quero ver."
];
// moradores de cada cidade do Nordeste: nomes e falas (journal.js, villagerTalk)
const CITY_FOLK = () => ({saoluis: [SAOLUIS_NAME, SAOLUIS_TIPS], teresina: [TERESINA_NAME, TERESINA_TIPS], recife: [RECIFE_NAME, RECIFE_TIPS], petrolina: [PETROLINA_NAME, PETROLINA_TIPS]})[curCity()];
const BELEM_TIPS = [
  "Aqui na capital tem malandro esperto, segura a bolsa! Se um fi de rapariga desses levar teu dinheiro, vence ele que ele devolve.",
  "Os urubus do Ver-o-Peso tão aqui desde antes de mim. Não mexe com eles que eles não mexem contigo.",
  "Na Cidade Velha tem iguana tomando sol na praça. Parece de boa, mas a cauda dela é um chicote.",
  "Dizem que de noite, na Cidade Velha, uma mulher de branco anda pelas ruas de pedra. É visagem, menino. Te benze.",
  "No porto, os ratos são do tamanho de um gato. E de noite contam que a Cobra Norato sobe a baía. Arriégua!",
  "Do outro lado do canal ficam as Baixadas: palafita e ponte de tábua. Na maré cheia, olha onde pisa.",
  "A rede da pensão é baratinha, coisa de quinze conto. Dorme aí que amanhã a gente conversa.",
  "Erva de cheiro, banho de descarrego... aqui tem remédio pra tudo. Menos pra leseira.",
  "Sentiu esse pitiú? É peixe fresco, maninho. Cheiro de Ver-o-Peso."
];
const VILLAGER_TIPS = [
  "O Pajé faz talismã com o luar dos chefes. Cada chefe acalmado deixa um, dois, até três. E chefe acalmado vira amigo: dá pra treinar com ele, viu?",
  "Etiqueta verde em cima do bicho? Esse aí se acalma com uma lançada só.",
  "Bicho se encolheu tremendo? Vai dar o bote. Aperta Z quando o anel ficar verde que tu bloqueia metade.",
  "Acerta o bicho primeiro, na lança (Z) ou na flecha (X), que o primeiro turno da briga é teu.",
  "Três tempos certos seguidos na briga, golpe perfeito ou bloqueio, enchem a Fúria: a lança vira três estocadas de uma vez. Pai d'égua!",
  "Se o bicho te pegar antes, quem bate primeiro é ele. Viu o \"!\"? Moscou, dançou.",
  "Todo bicho tem um elemento que ele não aguenta: fogo, água, vento, raio ou planta. Acerta esse que ele fraqueja e tu bate de novo na hora.",
  "Usou um elemento num bicho? O caderno anota se ele é fraco, se resiste ou se nem liga. A fraqueza que tu descobrir aparece embaixo do nome dele.",
  "Sem arco? Joga a lança (Especial). Bate forte, mas às vezes erra.",
  "Dizem que toda trilha tem um canto escondido. Uns se abrem com fogo, outros com água... cada um tem seu jeito.",
  "O chefe de cada mata fica no fim da trilha. Vence ele que abre o caminho pra próxima.",
  "Na fogueira da aldeia tu descansa até a noite ou dorme até o outro dia. As fogueiras das trilhas recuperam tudo.",
  "De noite a mata muda: morcego, coruja, lobo-guará... e dizem que o Chupa-cabra anda rondando. Égua, tenho é medo.",
  "Contam que na mata fechada passa uma mula sem cabeça, cuspindo fogo pelo pescoço. E no lago... o Boitatá. Visagem das brabas.",
  "Jacaré troca de dente a vida inteira. O vendedor da feira paga bem pelos que ele perde."
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
const skipText = () => padStyle() ? t("Segure {sel} para pular", padVars()) : t("Segure C para pular");
// setinha pulando em cima do ponto mais perto + texto "Z: ..." embaixo da tela
function drawSpotPrompt(x, cx, cy, now) {
  const s = !EX.dialog && !EX.locked ? nearSpot() : null, el = $("exPrompt"), txt = s ? `${padStyle() ? padLabel("z") : t("Z / GOLPE")}: ${s.kind === "cliente" ? t("falar com {cliente}", {cliente: FREELAS[freelaHere()].client}) : SPOT_LABEL[s.kind]}` : "";
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
    say(t("Fogueira"), (G.night ? t("Noite alta. Descansar recupera tudo sem passar o tempo; dormir já começa o outro dia.")
      : t("O fogo estala. Descansar recupera tudo sem passar o tempo. Até a noite recupera metade (e de noite a mata muda); dormir até o outro dia, tudo.")) + " " + t("Amanhã: {clima}.", {clima: WEATHER[weatherOn(G.day + 1)].n.toLowerCase()}));
    btn(t("Descansar"), () => exCampRest("fogueira"), false, d);
    if (!G.night) btn(t("Descansar até a noite"), () => exCampRest("noite"), false, d);
    btn(t("Dormir até o dia seguinte"), () => exCampRest("dormir"), false, d);
  }
  else if (kind === "fogueira") {   // fogueira no meio da trilha: só um ponto para recuperar as forças
    say(t("Fogueira"), t("Um respiro no meio da trilha. Descansar recupera toda a vida e a energia."));
    btn(t("Descansar"), () => exCampRest("fogueira"), false, d);
  }
  else if (kind === "tenda" && PENSAO_NAME[EX.zone]) {   // cidade: rede na pensão (diária barata em PENSAO)
    say(PENSAO_NAME[EX.zone], (G.night ? t("Rede limpa, cheiro de maré e o mercado acordando cedo. Dormir recupera tudo.") : t("Rede pra quem é de fora. Descansar até a noite recupera metade; dormir até o outro dia, tudo.")) + " " + t("Dinheiro: R$ {n}.", {n: G.money}));
    // paga e passa a faixa do anoitecer (lua e lobo) ou do amanhecer (galo e sol), como na fogueira da aldeia
    const nap = k => ask(k === "noite" ? t("Pagar R$ {n} pela rede até a noite?", {n: PENSAO[k]}) : t("Pagar R$ {n} pela rede até amanhã?", {n: PENSAO[k]}), () => {
      if (G.money < PENSAO[k]) { sfx("blip"); return exOpenDialog("tenda", t("Falta dinheiro: a diária é R$ {n}.", {n: PENSAO[k]})); }
      G.money -= PENSAO[k]; exNap(k);
    });
    btn(`${t("Descansar")} (R$ ${PENSAO.descanso})`, ask(t("Pagar R$ {n} para descansar um pouco na rede?", {n: PENSAO.descanso}), () => {
      if (G.money < PENSAO.descanso) { sfx("blip"); return exOpenDialog("tenda", t("Falta dinheiro: a diária é R$ {n}.", {n: PENSAO.descanso})); }
      G.money -= PENSAO.descanso; exQuickRest();
    }), false, d);
    if (!G.night) btn(`${t("Descansar até a noite")} (R$ ${PENSAO.noite})`, nap("noite"), false, d);
    btn(`${t("Dormir até o dia seguinte")} (R$ ${PENSAO.dormir})`, nap("dormir"), false, d);
  }
  else if (kind === "tenda") { say(t("Tenda"), t("A tenda do Rhanon. Dormir recupera tudo, mas o dia passa.")); btn(t("Dormir"), () => exNap("dormir"), false, d); }
  else if (kind === "peles") { say(t("Comprador de lembranças"), t("Pena, dente, pele que a cobra largou... tudo vira artesanato. Mostra aí o que a mata te deu.")); peltButtons(d); }
  else if (kind === "comida") { say(t("Barraca de comida"), t("Mandioca, peixe assado, açaí e maniçoba. Barriga cheia, lança firme!")); foodButtons(d); }
  else if (kind === "artesao") { say(t("Artesão"), t("Roupa tecida à mão, tocha, cuia d'água e chicote de cipó pra espantar bicho. Me traz faísca de poraquê que eu te faço coisa melhor. Arma e armadura é com o armeiro, ali na barraca do meio.")); gearButtons(d); }
  else if (kind === "armeiro") { say(t("Armeiro"), t("Lança, arco, colete... Me traz as lembranças certas e um trocado que eu faço coisa pai d'égua. Escolhe nas setas e aperta Enter pra fabricar.")); forgePanel(d); }
  else if (kind === "xama") { say(t("Pajé"), t("Todo chefe que tu acalma solta um pouco do luar que a fumaça prendeu nele. Me traz esse luar que eu faço um talismã. Escolhe nas setas e aperta Enter.")); if (forgeItems().length) forgePanel(d); else lh(t("Ainda não tem luar de chefe nenhum pra eu trabalhar. Acalma um chefe e me traz o luar dele."), d);
    if (Object.keys(G.skills).length) btn(t("Esquecer habilidades · R$ {n}", {n: SKILL_RESET(G.lv)}), ask(t("Esquecer todas as habilidades por R$ {n}? Os pontos voltam para gastar de novo.", {n: SKILL_RESET(G.lv)}), skillReset), G.money < SKILL_RESET(G.lv), d); }
  else if (kind === "tecnico") nbTechnician(say, d);
  else if (kind === "notebook") { say(t("Notebook"), ""); d.querySelector("p").remove(); nbView(d); }
  else if (kind === "cliente") freelaClient(say, d);
  else if (kind === "inventario") { say(t("Bolsa"), invSummary()); invButtons(d); }
  else if (kind === "lembranca") {   // revanche com o chefe vencido
    const b = rematchBoss(), spot = nearSpot() || EX.spots.find(s => s.kind === "lembranca");
    say(t("Aliado: {chefe}", {chefe: b.name}), t("{chefe} voltou a si e agradece a ajuda. Quer treinar? Vale de 1 a 3 luares e metade do XP.", {chefe: theName(b, true)}));
    btn(t("Treinar"), () => exRematch(spot), false, d);
  }
  else if (kind === "segredo") secretPanel(say, d);
  else if (kind === "bau") secretChest(say, d);
  else if (kind === "cabine") busCabin(say, d);
  else if (kind === "onibus") busDoor(say, d);
  else villagerTalk(look, say, d);   // pedido (oferta ou entrega) ou uma dica (systems/journal.js)
  if (msg) d.insertAdjacentHTML("beforeend", `<p class="hint">${msg}</p>`);
  btn(t("Fechar"), exCloseDialog, false, d);
  d.hidden = false; EX.confirming = null; EX.dialogT = performance.now();
  if (kind !== "armeiro" && !(kind === "xama" && d.querySelector(".forge")) && kind !== "tutorial") { menuSelect(d, EX.keepSel ?? menuFirst(d)); EX.keepSel = null; }   // já começa com uma opção escolhida
}
/* ---------- notebook do Rhanon (NB_PARTS em data/world.js) e o freela (FREELAS) ---------- */
const nbMissing = () => NB_PARTS.filter(k => !G.nb[k]);
const nbReady = () => G.nb.tem && !nbMissing().length;
const nbPartName = k => ({bateria: t("bateria"), teclado: t("teclado"), carregador: t("carregador")})[k];
// Seu Bugiganga, o juntador de tralha da feira: diz o que falta, vende a bateria e dá a pista das outras peças
function nbTechnician(say, d) {
  if (!G.nb.tem) return say(t("Seu Bugiganga"), t("Tudo que a cheia traz eu junto: rádio, celular, fio... e conserto. Se um dia aparecer contigo um notebook, me traz."));
  if (G.nb.on) return say(t("Seu Bugiganga"), t("E aí, programador! O notebook tá aguentando? Cuida da bateria, viu."));
  if (nbReady()) return say(t("Seu Bugiganga"), t("Tá tudo aí! Agora só falta tomada. No porto do Tapajós, do lado da bilheteria, tem uma."));
  const miss = nbMissing().map(nbPartName).join(", ");
  say(t("Seu Bugiganga"), t("Égua, um notebook! Falta {pecas}.", {pecas: miss}) + (G.nb.teclado ? "" : " " + t("Teclado? Vi um macaco-prego na mata correndo com um debaixo do braço.")) +
    (G.nb.carregador ? "" : " " + t("Carregador... as ariranhas do rio vivem brincando com fio que a cheia leva.")));
  if (!G.nb.bateria) btn(t("Comprar bateria · R$ {n}", {n: NB_BATTERY}), ask(t("Comprar a bateria do notebook por R$ {n}?", {n: NB_BATTERY}), () => {
    if (G.money < NB_BATTERY || G.nb.bateria) return;
    G.money -= NB_BATTERY; G.nb.bateria = true; G.nbNew.push("bateria"); save(); sfx("more"); exHud();
    exOpenDialog("notebook");   // a bateria entra encaixando
  }), G.money < NB_BATTERY, d);
}
/* notebook na tela (bolsa ou peça nova): o desenho com as peças que já tem no lugar e as que faltam tracejadas, com "?".
   Peça nova (G.nbNew) entra encaixando: o teclado cai de cima, a bateria vem da esquerda e o carregador da direita */
const NB_W = 120, NB_H = 80, NB_SNAP = 900;   // tamanho do desenho e quanto dura cada peça encaixando (ms)
function nbView(host) {
  const c = document.createElement("canvas"), p = document.createElement("p"), news = (G.nbNew || []).filter(k => G.nb[k]);
  c.width = NB_W; c.height = NB_H; c.className = "nb-canvas"; p.className = "hint nb-txt";
  host.append(c, p);
  G.nbNew = []; save();
  const t0 = performance.now(), snapT = {};   // quando cada peça nova encaixou (brilha um pouco)
  const tick = now => {
    if (!c.isConnected) return;
    const i = Math.floor((now - t0) / NB_SNAP), k = news[i], u = k ? ((now - t0) % NB_SNAP) / NB_SNAP : 1;
    news.slice(0, i).forEach(q => { if (!snapT[q]) { snapT[q] = now; sfx("guard"); setTimeout(() => sfx("more"), 120); } });   // encaixou: clique e brilho
    drawNotebook(c.getContext("2d"), now, k ? {part: k, u, later: news.slice(i + 1)} : null, snapT);
    requestAnimationFrame(tick);
  };
  const miss = nbMissing().map(nbPartName).join(", ");
  p.textContent = news.length ? t("Peça nova no lugar: {peca}!", {peca: news.map(nbPartName).join(", ")}) + (miss ? " " + t("Faltam: {pecas}.", {pecas: miss}) : "")
    : G.nb.on ? t("Ligado. O caderno de bichos agora é digital.") : nbReady() ? t("Tudo no lugar! Só falta tomada: a bilheteria do porto tem uma.") : t("Faltam: {pecas}.", {pecas: miss});
  if (news.length && !nbMissing().length && !G.nb.on) p.textContent += " " + t("Tudo no lugar! Só falta tomada: a bilheteria do porto tem uma.");
  requestAnimationFrame(tick);
}
// anim = peça encaixando agora ({part, u de 0 a 1, later = as que vêm depois}); snapT = quando cada uma encaixou (brilha)
function drawNotebook(x, now, anim, snapT = {}) {
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const dash = (a, b, w, h) => {   // peça que falta: contorno tracejado piscando, com "?"
    x.save(); x.strokeStyle = Math.floor(now / 500) % 2 ? "#c8c8d4" : "#8a8a96"; x.setLineDash([2, 2]); x.lineWidth = 1;
    x.strokeRect(a + .5, b + .5, w - 1, h - 1); x.restore();
    x.fillStyle = "#c8c8d4"; x.font = "bold 7px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("?", a + w / 2, b + h / 2 + .5);
  };
  const has = k => G.nb[k] && !(anim && (anim.part === k || anim.later.includes(k)));   // a que está entrando ainda não conta
  const e = anim ? 1 - (1 - anim.u) ** 3 : 1, off = k => anim && anim.part === k ? 1 - e : 0;
  x.clearRect(0, 0, NB_W, NB_H); x.imageSmoothingEnabled = false;
  // tampa e tela
  R(29, 5, 62, 43, "#1a1a22"); R(30, 6, 60, 41, "#3a3a46"); R(33, 9, 54, 35, "#101218");
  if (G.nb.on) {
    const g = x.createLinearGradient(0, 9, 0, 44); g.addColorStop(0, "#3aa0e8"); g.addColorStop(1, "#1a4a8a"); x.fillStyle = g; x.fillRect(33, 9, 54, 35);
    R(37, 14, 22, 2, "#d8f0ff"); R(37, 19, 34, 1, "#9fd0f0"); R(37, 22, 28, 1, "#9fd0f0"); R(37, 25, 31, 1, "#9fd0f0");
    if (Math.floor(now / 500) % 2) R(37, 29, 3, 2, "#ffffff");
  } else { x.fillStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.moveTo(33, 30); x.lineTo(52, 9); x.lineTo(60, 9); x.lineTo(33, 38); x.fill(); }
  R(55, 7, 2, 1, "#5a5a68");   // câmera
  // base (em perspectiva) e dobradiça
  R(31, 47, 58, 2, "#24242c");
  x.fillStyle = "#4a4a58"; x.beginPath(); x.moveTo(30, 49); x.lineTo(90, 49); x.lineTo(97, 63); x.lineTo(23, 63); x.fill();
  R(23, 63, 74, 2, "#2a2a34"); R(31, 49, 58, 1, "#6a6a7a");
  R(53, 59, 14, 3, "#5a5a6a");   // touchpad
  // teclado: cai de cima
  if (has("teclado") || (anim && anim.part === "teclado")) {
    const dy = Math.round(-30 * off("teclado"));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 11; k++) R(35 + k * 4.6 + r, 51 + r * 2 + dy, 3, 1, "#c8c8d4");
    R(46, 57 + dy, 26, 1, "#c8c8d4");
  } else dash(35, 50, 50, 8);
  // bateria: entra pela esquerda, embaixo da base
  if (has("bateria") || (anim && anim.part === "bateria")) {
    const dx = Math.round(-40 * off("bateria"));
    R(27 + dx, 66, 22, 7, "#1a3a1a"); R(28 + dx, 67, 20, 5, "#3fae3f"); R(49 + dx, 68, 2, 3, "#1a3a1a"); R(31 + dx, 68, 6, 1, "#b6f58e");
  } else dash(27, 66, 24, 7);
  // carregador: fio saindo da lateral até a fonte, que entra pela direita
  if (has("carregador") || (anim && anim.part === "carregador")) {
    const dx = Math.round(40 * off("carregador"));
    x.strokeStyle = "#1a1a22"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(95, 59); x.quadraticCurveTo(103 + dx, 60, 104 + dx, 68); x.stroke();
    R(101 + dx, 68, 14, 8, "#1a1a22"); R(102 + dx, 69, 12, 6, "#3a3a46"); R(104 + dx, 70, 3, 1, "#7dff9a");
  } else dash(100, 67, 16, 9);
  // brilho de quem acabou de encaixar
  const spot = {teclado: [60, 54], bateria: [38, 69], carregador: [108, 72]};
  Object.entries(snapT).forEach(([k, at]) => { if (now - at > 900) return;
    const [sx, sy] = spot[k], a = (now / 120) % (Math.PI * 2);
    for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; R(Math.round(sx + Math.cos(b) * 9), Math.round(sy + Math.sin(b) * 5), 2, 2, i % 2 ? "#ffd23a" : "#ffffff"); }
  });
}
// peça nova chegou (comprou a bateria, acalmou o macaco ou a ariranha): a tela do notebook abre sozinha na exploração
function nbShowNew() {
  if (G.nbNew && G.nbNew.length && EX && !$("explore").hidden && !EX.locked && !EX.dialog && !EX.camp) exOpenDialog("notebook");
}
// liga o notebook na tomada da rodoviária: a tela acende, chega o e-mail do primeiro freela e o caderno vira digital
function nbTurnOn() {
  G.nb.on = true; save(); sfx("more"); exCloseDialog();
  exToast(t("A tela acende! Chegou um e-mail: \"Freela no Ver-o-Peso: um site para a feira. Procura a Dona Graça, perto da banca do açaí.\" O caderno de bichos agora é digital."));
}
// próximo bug do freela em andamento (ou nada)
const freelaNext = id => FREELAS[id].bugs[G.freela[id] || 0];
const freelaHere = () => FREELA_AT[EX.zone] || "site_feira";   // o freela do cliente desta fase
// cliente do freela (Dona Graça no Ver-o-Peso, Seu Dedé no Recife Antigo): pede o trabalho, solta os bugs um por vez e paga na entrega
function freelaClient(say, d) {
  const id = freelaHere(), f = FREELAS[id], done = G.freela[id] || 0;
  if (G.portfolio[id]) return say(f.client, f.after);
  if (!G.nb.on) return say(f.client, t("Tu que é o menino que mexe com computador? Arruma um notebook que eu tenho trabalho pra ti."));
  if (done >= f.bugs.length) {
    say(f.client, f.thanks);
    btn(t("Entregar o trabalho · R$ {n}", {n: f.pay}), () => {
      G.portfolio[id] = true; G.money += f.pay; save(); sfx("more"); exHud();
      exOpenDialog("cliente", t("Freela entregue! +R$ {n}. Programa novo no notebook: {prog}", {n: f.pay, prog: t(f.prog)}));
    }, false, d);
    return;
  }
  say(f.client, t(f.ask, {n: f.pay}) + " " + t("Bugs resolvidos: {n} de {total}.", {n: done, total: f.bugs.length}));
  btn(t("Depurar o próximo bug"), () => {
    exCloseDialog();
    const b = BUGS.find(x => x.id === freelaNext(id)), en = makeAnimalEnt(b, Math.floor(EX.hero.x / TILE), Math.floor(EX.hero.y / TILE));
    exStartBattle(en, {});
  }, false, d);
}
function freelaBugDone() {
  const id = freelaHere(), f = FREELAS[id];
  G.freela[id] = Math.min(f.bugs.length, (G.freela[id] || 0) + 1); save();
  exToast(G.freela[id] >= f.bugs.length ? t("Último bug resolvido! Fala com {cliente} pra entregar o trabalho.", {cliente: f.client}) : t("Bug resolvido! Faltam {n}.", {n: f.bugs.length - G.freela[id]}));
}
/* ---------- BR-316: cabine do cobrador e o ônibus (fases parada e terminal) ---------- */
const busDest = () => EX.zone === "parada" ? "belem" : "ananindeua";
const busSide = () => EX.zone === "parada" ? -1 : 1;   // a estrada sai pela esquerda rumo a Belém e pela direita rumo a Ananindeua
function busCabin(say, d) {
  if (EX.zone === "parada" && nbReady() && !G.nb.on) {   // tomada do lado da cabine: o notebook liga aqui
    say(t("Comandante"), t("Tomada? Tem ali do lado da bilheteria, pode usar à vontade."));
    btn(t("Ligar o notebook"), nbTurnOn, false, d);
    return;
  }
  if (EX.zone === "terminal") return say(t("Bilheteria do cais"), G.passagem ? t("Tua passagem vale ida e volta. O barco pro Tapajós sai assim que tu subir.") : t("Sem passagem não embarca, maninho."));
  if (G.passagem) return say(t("Comandante"), t("Passagem na mão! É só subir no barco. Vale ida e volta: do cais de Belém tu volta quando quiser."));
  if (!BUS.open) return say(t("Comandante"), t("O barco pra Belém ainda não tá saindo. Volta daqui uns dias!"));
  say(t("Comandante"), t("Passagem pra Belém, a capital: R$ {n}, ida e volta. Tu tem R$ {tem}.", {n: BUS.price, tem: G.money}) + (G.money < BUS.price ? " " + t("Faltam R$ {n}. Lembrança de bicho forte vale bem mais na feira, viu?", {n: BUS.price - G.money}) : ""));
  btn(t("Comprar passagem · R$ {n}", {n: BUS.price}), ask(t("Comprar a passagem para Belém por R$ {n}?", {n: BUS.price}), () => {
    if (G.passagem || G.money < BUS.price) return;
    G.money -= BUS.price; G.passagem = true; save(); sfx("more"); exHud();
    exOpenDialog("cabine", t("Passagem comprada! Agora é só subir no barco."));
  }), G.money < BUS.price, d);
}
function busDoor(say, d) {
  const dest = busDest(), n = dest === "belem" ? "Belém" : LOC.ananindeua.s;
  if (!G.passagem || !BUS.open) return say(t("Barco de linha"), t("O marinheiro aponta para a bilheteria: \"Sem passagem não sobe, maninho. Compra ali com o comandante.\""));
  say(t("Barco de linha"), t("O motor já está ligado. Destino: {lugar}.", {lugar: n}));
  btn(t("Embarcar para {lugar}", {lugar: n}), busLeave, false, d);
}
// sobe no ônibus: ele arranca e sai pela estrada; depois a viagem segue no mapa do Pará e entra na fase da outra cidade
function busLeave() {
  exCloseDialog(); EX.locked = true; exKeys.clear(); sfx("apito");   // o barco apita e sai
  EX.boarding = {t0: performance.now(), vrum: 0};
}
function busPull(now) {
  const b = EX.bus, el = now - EX.boarding.t0;
  if (el > 350) b.dx = busSide() * ((el - 350) / 1000) ** 2 * 260;   // espera a porta fechar e acelera
  if (now - EX.boarding.vrum > 520) { EX.boarding.vrum = now; sfx("barco"); }
  if (el < 2000) return false;
  const dest = busDest();
  EX.boarding = null; $("explore").hidden = true; $("exDialog").hidden = true; EX = null; exKeys.clear();
  busRide(dest, true);
  return true;
}
// barco de linha (recreio) visto de lado: casco azul, dois conveses brancos com redes coloridas, proa virada para o lado
// em que o rio sai (b.dx = quanto já andou). O bloco U (4x2) fica na água do porto
function drawBus(x, b, cx, cy, now) {
  const f = busSide(), X = Math.round(b.x + b.dx - cx), Y = Math.round(b.y - cy), W = b.w, run = b.dx !== 0;
  const y = Y + (Math.floor(now / (run ? 160 : 600)) % 2);   // balança na água
  const R = (a, bb, w, h, col) => { x.fillStyle = col; x.fillRect(a, bb, w, h); };
  const bow = f < 0 ? X : X + W - 8;   // proa
  // casco (com a proa inclinada) e a faixa vermelha
  R(X + 2, y + 18, W - 4, 11, OUTLINE); R(X + 3, y + 19, W - 6, 9, "#1f4a8a"); R(X + 3, y + 19, W - 6, 2, "#d62828");
  for (let k = 0; k < 8; k++) { const px = f < 0 ? X + k : X + W - 1 - k; R(px, y + 18 + k, 1, 11 - k, k ? "#1f4a8a" : OUTLINE); }
  // convés de baixo (janelas) e de cima (redes coloridas penduradas)
  R(X + 6, y + 9, W - 14, 10, OUTLINE); R(X + 7, y + 10, W - 16, 8, "#f4f1e8");
  for (let k = 0; k < 6; k++) { const wx = X + 9 + k * 8; R(wx, y + 12, 5, 4, "#2a5a8a"); R(wx, y + 12, 2, 2, "#bfe8ff"); }
  R(X + 10, y + 1, W - 22, 9, OUTLINE); R(X + 11, y + 2, W - 24, 7, "#f4f1e8"); R(X + 9, y + 1, W - 18, 2, "#2a8a5a");   // teto verde
  const redes = ["#e2363d", "#ffd23a", "#3a8ad8", "#e87ab0", "#7ac83a"];
  for (let k = 0; k < 5; k++) { const rx = X + 14 + k * 7; R(rx, y + 5, 5, 2, redes[k]); R(rx + 1, y + 7, 3, 1, redes[k]); }
  R(f < 0 ? X + W - 10 : X + 8, y - 3, 2, 5, OUTLINE);   // chaminé
  R(bow + (f < 0 ? 2 : 4), y + 15, 2, 2, "#ffe98a");   // luz da proa
  // marola: parada, só uma linha; andando, espuma atrás
  x.fillStyle = "#ffffffc0"; x.fillRect(X + 4, Y + 29, W - 8, 1);
  if (run) for (let k = 0; k < 3; k++) { const ex = f < 0 ? X + W + 2 + k * 5 : X - 6 - k * 5; R(ex, Y + 24 + (Math.floor(now / 90 + k) % 3), 3, 2, "#e8f6ff"); }
  if (run && Math.floor(now / 200) % 2) R(f < 0 ? X + W - 10 : X + 8, y - 6 - (Math.floor(now / 100) % 3), 2, 2, "#c8c4b8");   // fumaça da chaminé
}
// dormir numa rede ou tenda: passa a faixa do anoitecer (lua e lobo) ou do amanhecer (galo e sol), como na fogueira da aldeia
// no motel do Ver-o-Peso, antes da faixa passa a cena do quarto (Rhanon dormindo e a janela escurecendo ou clareando)
function exNap(k) {
  exCloseDialog(); EX.locked = true; exKeys.clear();
  const night = k === "noite", label = night ? t("Anoiteceu") : t("Amanheceu · Dia {n}", {n: G.day + 1});
  const from = {hp: G.hp, sp: G.sp};   // acordou: as barras enchem do que tinha antes de dormir
  const wake = hide => dawnWipe(() => { if (hide) hide(); const msg = rest(k, true, true); EX.night = G.night; exHud(from); musicStart("local"); setTimeout(() => { if (!EX) return; EX.locked = false; exToast(msg); hudFillStart(from); }, DAWN_MS * .6); }, label, night);
  if (PENSAO_NAME[EX.zone]) motelScene(k, wake); else wake();
}
/* quarto do motel: uns 3 s com o Rhanon dormindo na cama e a janela mudando de cor (noite: escurece; dormir: escurece e
   clareia; intro: só clareia); o quarto escurece junto e o abajur acende. C, Z, Enter ou Esc pulam. done(hide) segue com
   a próxima transição e chama hide() quando ela cobrir a tela */
const MOTEL_MS = 3000;
const MOTEL_SKY = {day: ["#6ab8e8", "#bfe6ff", 1], dusk: ["#c8604a", "#f8c070", .55], night: ["#0e1430", "#26305a", .12], dawn: ["#e89a9a", "#ffd890", .5]};
function motelScene(kind, done) {
  EX.locked = true; exKeys.clear();
  const keys = kind === "intro" ? [[0, "dawn"], [1, "day"]] : kind === "noite" ? [[0, "day"], [.5, "dusk"], [1, "night"]]
    : G.night ? [[0, "night"], [.55, "night"], [.8, "dawn"], [1, "day"]] : [[0, "day"], [.25, "dusk"], [.5, "night"], [.8, "dawn"], [1, "day"]];
  wipe(() => {
    let o = $("motelRoom");
    if (!o) { o = document.createElement("div"); o.id = "motelRoom"; o.className = "motel-room"; o.innerHTML = '<canvas width="192" height="120"></canvas><p></p>'; document.body.appendChild(o); }
    o.querySelector("p").textContent = skipText();
    o.hidden = false;
    const x = o.querySelector("canvas").getContext("2d"), t0 = performance.now(), D = REDUCE ? 600 : MOTEL_MS;
    let ended = false;
    const finish = () => { if (ended) return; ended = true; document.removeEventListener("keydown", skip, true); done(() => { o.hidden = true; }); };
    const skip = ev => { if (["c", "C", "z", "Z", "Enter", "Escape", " "].includes(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); finish(); } };
    document.addEventListener("keydown", skip, true);
    const frame = now => { if (ended) return; const u = Math.min(1, (now - t0) / D); drawMotelRoom(x, keys, u, now); if (u < 1) requestAnimationFrame(frame); else finish(); };
    requestAnimationFrame(frame);
  });
}
const hexMix = (a, b, u) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - u) + parseInt(b.substr(i, 2), 16) * u).toString(16).padStart(2, "0")).join("");
function motelSky(keys, u) {   // céu da janela em u (0..1): cores de cima e de baixo e quanto de luz entra no quarto
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const [ua, a] = keys[i], [ub, b] = keys[Math.min(i + 1, keys.length - 1)], v = ub > ua ? Math.min(1, Math.max(0, (u - ua) / (ub - ua))) : 1, A = MOTEL_SKY[a], B = MOTEL_SKY[b];
  return {top: hexMix(A[0], B[0], v), bottom: hexMix(A[1], B[1], v), light: A[2] + (B[2] - A[2]) * v};
}
function drawMotelRoom(x, keys, u, now) {
  const sky = motelSky(keys, u), dark = 1 - sky.light;
  x.fillStyle = "#c8b89a"; x.fillRect(0, 0, 192, 120);   // parede
  x.fillStyle = "#b8a888"; for (let k = 6; k < 192; k += 12) x.fillRect(k, 0, 1, 92);   // papel de parede listrado
  x.fillStyle = "#9c7a56"; x.fillRect(0, 74, 192, 18); x.fillStyle = "#6d4329"; x.fillRect(0, 74, 192, 2);   // rodapé de madeira
  x.fillStyle = "#7a5236"; x.fillRect(0, 92, 192, 28); x.fillStyle = "#5e3e28"; for (let k = 0; k < 192; k += 16) x.fillRect(k, 92, 1, 28);   // chão
  const win = () => {   // janela: o céu muda de cor, com estrelas e lua quando escurece
    x.fillStyle = "#5a3a22"; x.fillRect(118, 14, 52, 40);
    for (let y = 0; y < 34; y++) { x.fillStyle = hexMix(sky.top, sky.bottom, y / 33); x.fillRect(121, 17 + y, 46, 1); }
    if (dark > .5) { x.fillStyle = `rgba(255,255,255,${(dark - .5) * 2})`; [[126, 22], [140, 19], [158, 26], [150, 34], [131, 38]].forEach(([sx, sy]) => x.fillRect(sx, sy, 1, 1)); x.fillStyle = `rgba(244,236,216,${(dark - .5) * 2})`; x.fillRect(159, 20, 4, 4); }
    else { x.fillStyle = `rgba(255,236,150,${1 - dark * 2})`; x.fillRect(158, 38 - Math.round(sky.light * 12), 5, 5); }   // sol
    x.fillStyle = "#5a3a22"; x.fillRect(143, 17, 2, 34); x.fillRect(121, 33, 46, 2);   // cruz da janela
  };
  win();
  x.fillStyle = "#b03a2e"; x.fillRect(112, 12, 7, 46); x.fillRect(169, 12, 7, 46);   // cortinas
  // cama: cabeceira, colchão, travesseiro e o cobertor por cima do Rhanon
  x.fillStyle = "#5a3a22"; x.fillRect(14, 54, 8, 44); x.fillRect(102, 76, 6, 22);
  x.fillStyle = "#6d4329"; x.fillRect(14, 84, 94, 8);
  x.fillStyle = "#f4ecd8"; x.fillRect(22, 74, 84, 10);
  x.fillStyle = "#ffffff"; x.fillRect(24, 68, 20, 9);
  x.drawImage(rhanonSleeping(Math.floor(now / 900) % 2), 20, 59);   // deitado com a cabeça no travesseiro e o cobertor até os pés
  x.fillStyle = "#6d4329"; x.fillRect(122, 76, 22, 16); x.fillStyle = "#5a3a22"; x.fillRect(122, 76, 22, 2);   // criado-mudo
  x.fillStyle = "#3a2a1a"; x.fillRect(131, 66, 3, 10); x.fillStyle = "#f2c230"; x.fillRect(126, 60, 13, 7);   // abajur
  x.fillStyle = `rgba(8,12,36,${dark * .72})`; x.fillRect(0, 0, 192, 120);   // o quarto escurece junto com o céu
  if (dark > .3) {   // abajur aceso: um círculo de luz quente
    const g = x.createRadialGradient(132, 64, 2, 132, 64, 46); g.addColorStop(0, `rgba(255,214,120,${(dark - .3) * .7})`); g.addColorStop(1, "rgba(255,214,120,0)");
    x.fillStyle = g; x.fillRect(80, 20, 104, 90); x.fillStyle = "#ffe98a"; x.fillRect(126, 60, 13, 7);
  }
  win();   // a janela continua com a cor do céu por cima da sombra
  for (let i = 0; i < 3; i++) { const p = (now / 1100 + i / 3) % 1; glyphP(x, "z", "#ffffff", 34 + p * 10, 56 - p * 16); }   // zzz
}
/* "Deseja vender...?": o painel vira a pergunta com Sim e Não (setas escolhem, Z confirma, X é o Não).
   Depois de responder, a loja volta com a mesma opção escolhida. */
function exConfirm(text, yes) {
  const d = $("exDialog"), back = EX.dialog, bs = menuButtons(d);
  EX.keepSel = Math.max(0, bs.findIndex(b => b.classList.contains("sel")));
  d.innerHTML = `<h2>${t("Confirmar")}</h2><p>${text}</p>`; sfx("look");
  btn(t("Sim"), yes, false, d); btn(t("Não"), () => exOpenDialog(back), false, d);
  EX.confirming = back; menuSelect(d, 0);
}
// nas lojas da exploração pergunta antes; no resto (testes, mapa) faz direto
const ask = (text, fn) => () => EX && EX.dialog && !$("explore").hidden ? exConfirm(text, fn) : fn();
// descansar/dormir na fogueira: Rhanon senta do lado do fogo (como na tela inicial) e só depois recupera
function exCampRest(kind) {
  const h = EX.hero, f = EX.spots.filter(s => s.kind === "fogueira").sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
  $("exDialog").hidden = true; EX.dialog = null; exKeys.clear();
  const seat = campSeat(f, h.x < f.x ? -1 : 1), from = {hp: G.hp, sp: G.sp};
  // descanso sem passar o tempo: recupera já e as barras enchem com ele sentado; levanta quando encheram
  let W = campWake(kind), msg = null;
  if (kind === "fogueira") { msg = rest(kind, true, true); W = hudFillStart(from, 700) || 700; }
  EX.camp = {kind, from, msg, W, startNight: EX.night, t0: performance.now(), dur: W + 2600, x: seat.x, y: seat.y, fx: f.x, fy: f.y, ftx: f.tx, fty: f.ty};
}
// descanso rápido sem cena (rede da pensão): as barras enchem com o Rhanon parado
function exQuickRest() {
  exCloseDialog(); EX.locked = true; exKeys.clear();
  const from = {hp: G.hp, sp: G.sp}, msg = rest("rede", true, true), dur = hudFillStart(from);
  setTimeout(() => { if (!EX) return; EX.locked = false; exToast(msg); }, dur + 400);
}
/* barras enchendo no descanso: o HUD mostra o PV e o PE de antes subindo até o de agora, com o som de encher
   (healFillSound) e o jingle do descanso no fim. Devolve quanto tempo (ms) leva, contando o atraso (0 = já estava cheio). */
const FILL_MS = [900, 2400];
function hudFillStart(from, delay = 0) {
  vit();
  const gain = Math.max((G.hp - from.hp) / maxHP(G.lv), (G.sp - from.sp) / maxSP(G.lv));
  if (gain <= 0) { EX.fill = null; exHud(); return 0; }
  const dur = REDUCE ? 1 : FILL_MS[0] + (FILL_MS[1] - FILL_MS[0]) * gain;
  EX.fill = {from, t0: performance.now() + delay, dur, sound: false}; exHud(from);
  return delay + dur;
}
function hudFillTick(now) {
  const f = EX.fill; if (now < f.t0) return;
  if (!f.sound) { f.sound = true; healFillSound(f.dur / 1000); }
  const k = Math.min(1, (now - f.t0) / f.dur), at = (a, b) => Math.round(a + (b - a) * k);
  exHud({hp: at(f.from.hp, G.hp), sp: at(f.from.sp, G.sp)});
  if (k >= 1) { EX.fill = null; exHud(); restJingle(); }
}
// lugar para sentar do lado da fogueira: o lado de onde o Rhanon chegou; se tiver árvore ou água ali, o outro lado, e por último embaixo
function campSeat(f, side) {
  const free = (x, y) => !boxBlocked(x, y, 5, 3) && !boxBlocked(x, y - 10, 5, 3);
  for (const [x, y] of [[f.x + side * 14, f.y + 5], [f.x - side * 14, f.y + 5], [f.x, f.y + 16]]) if (free(x, y)) return {x, y};
  return {x: f.x + side * 14, y: f.y + 5};
}
// cena de abertura: amanhece, Rhanon acorda do lado da fogueira da aldeia, se espreguiça e o jogo começa
// a aventura sempre começa de manhã, na cidade onde o save está: na aldeia (fogueira) ou, em Belém, no quarto do motel
function startIntro() {
  vit(); G.night = false; save();
  if (curCity() !== "ananindeua") return startExplore(CITY[curCity()].home, () => {   // na cidade: acorda no quarto da pensão
    const m = EX.spots.find(q => q.kind === "tenda"), h = EX.hero;   // sai do quarto pela porta do motel
    if (m) Object.assign(h, {x: m.x, y: m.y + 8, dir: "down", aim: {x: 0, y: 1}});
    motelScene("intro", hide => wipe(() => { hide(); if (EX) EX.locked = false; exToast(CITY_WAKE[curCity()]); }));
  });
  startExplore("aldeia", exIntro);
}
function exIntro() {
  const h = EX.hero, f = EX.spots.find(s => s.kind === "fogueira"), seat = campSeat(f, -1);
  EX.camp = {kind: "intro", W: campWake("intro"), t0: performance.now(), dur: campWake("intro") + 2600, x: seat.x, y: seat.y, fx: f.x, fy: f.y, ftx: f.tx, fty: f.ty};
  h.x = EX.camp.x; h.y = EX.camp.y; h.dir = "down"; h.aim = {x: 0, y: 1};
  exToast(t("Aldeia Jasytatá (PA) · manhã na beira do Tapajós..."));
}
/* tutorial (jogo novo): depois de acordar, o caçador ensina os controles; só então o Rhanon anda e a ajuda aparece */
const TUTORIAL = [
  "Égua, Rhanon, acordou! Dormiu bem aí do lado do fogo? Antes de tu ir pra mata, deixa eu te lembrar do básico.",
  "Pra andar: setas ou W A S D. Shift (ou C) é a esquiva: tu rola e passa pelo bote do bicho sem levar.",
  "Z (ou Espaço) é a lançada. Também serve pra conversar com o pessoal e usar a fogueira e as barracas.",
  "X atira flecha, mas só depois que tu comprar um arco com o armeiro da feira. No mouse tu mira no cursor: botão esquerdo golpeia, o direito atira.",
  "I abre a bolsa, com comida e lembranças, e E abre o equipamento pra trocar arma e roupa. Nos menus: setas escolhem, Z confirma, X volta. Esc sai da fase.",
  "Na briga, quando aparecer o anel com Z, aperta Z na hora que ele ficar verde: o golpe sai perfeito, ou tu bloqueia metade do ataque do bicho.",
  "Bicho com etiqueta verde se acalma com uma lançada só. E se tu acertar primeiro, começa a briga na frente. Bora, e não vai ficar panema!"
];
function startTutorial() { EX.tutPage = 0; showTutorial(); }
function showTutorial() {
  const d = $("exDialog"), i = EX.tutPage, last = i === TUTORIAL.length - 1;
  EX.dialog = "tutorial"; exKeys.clear();
  d.innerHTML = `<h2>${VILLAGER_NAME.aldeao1}</h2><div class="tut"><canvas width="24" height="33"></canvas><p>${TUTORIAL[i]}</p></div>`;
  d.querySelector("canvas").getContext("2d").drawImage(villagerSprite("aldeao1"), 0, 0);   // retratinho de quem fala
  btn(last ? t("Bora!") : t("Próximo"), () => { if (last) endTutorial(); else { EX.tutPage++; sfx("blip"); showTutorial(); } }, false, d);
  d.hidden = false;
}
function endTutorial() {
  G.tutorial = false; if (!G.nb.tem) { G.nb.tem = true; setTimeout(() => exToast(t("O Mateiro te deu um notebook que a cheia trouxe. Não liga: falta bateria, teclado e carregador. O Seu Bugiganga, da feira, entende disso.")), 2600); }
  save();
  $("exDialog").hidden = true; EX.dialog = null; $("explore").classList.remove("no-help"); sfx("more");
  exToast(t("Aldeia · chega perto da fogueira ou dos aldeões e aperta Z. A trilha da direita vai pra feira e, depois, pra mata."));
}
// pular a cena: aplica na hora o que ela faria (noite ou dia) e termina
function campSkip() {
  const c = EX.camp; if (!c) return;
  if (c.kind === "noite" || c.kind === "dormir") { G.night = c.kind === "noite"; EX.night = G.night; musicStart("local"); }
  c.dawned = c.day = true; exCampEnd();
}
// fim da cena: o controle volta na hora e o resultado aparece no aviso do topo (sem reabrir o painel da fogueira)
function exCampEnd() {
  const {kind, from, msg} = EX.camp; EX.camp = null; EX.dialog = null; exKeys.clear();
  if (G.night && !G.tutorial && !G.narrated.pyt_noite && (kind === "noite")) { G.narrated.pyt_noite = true; save(); setTimeout(() => pytunaScene(NARRA_PYT.noite), 500); }   // anoiteceu pela primeira vez
  if (kind === "intro" && G.tutorial && !G.narrated.prologo) { G.narrated.prologo = true; save(); return narrate(NARRA.prologo, startTutorial); }   // o Pajé abre a história
  if (kind === "intro") return G.tutorial ? startTutorial() : rollOffer() ? announceOffer() : exToast(t("Aldeia · chega perto da fogueira ou dos aldeões e aperta Z. A trilha da direita vai pra feira e, depois, pra mata."));
  if (msg) { if (EX.fill) { EX.fill = null; restJingle(); } exToast(msg); exHud(); }   // descanso: já recuperou na cena (pulou: as barras completam)
  else { exToast(rest(kind, true, true)); hudFillStart(from); }   // dormir/anoitecer: as barras enchem depois de acordar
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
const campAsleep = (c, el) => c.kind === "intro" ? el < campWake("intro") : !!CAMP_DAWN_AT[c.kind] && el > 900 && el < c.W;
// escuridão da noite (some quando a faixa do amanhecer cobre a tela)
// (dormir já de noite: o escuro da noite já está na tela; anoitecer: só escurece um pouco antes da faixa)
const campDark = (c, el) => !CAMP_DAWN_AT[c.kind] || c.day || c.startNight ? 0 : (c.kind === "noite" ? .35 : .65) * Math.max(0, Math.min(1, (el - 900) / 1500));
function drawCampHero(x, cx, cy, now) {
  const c = EX.camp, el = now - c.t0, W = c.W, sx = snap(c.x - cx), sy = snap(c.y - cy);
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
  const jl = jaciLight(); g.fillStyle = `rgba(6,8,32,${(.74 - jl * .28).toFixed(2)})`; g.fillRect(0, 0, VIEW_W, VIEW_H);   // Jaci voltando = noite menos escura
  g.globalCompositeOperation = "destination-out";
  const light = (px, py, r) => { const gr = g.createRadialGradient(px, py, r * .25, px, py, r); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); };
  const h = EX.camp || EX.hero;
  light(h.x - cx, h.y - cy - 12, 50 + jl * 18);
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
/* clima por cima da fase (data/world.js: WEATHER): chuva em risquinhos diagonais, neblina em tufos andando, mormaço
   alaranjado e ventania em riscos rápidos com folhas. Tudo calculado pelo relógio, sem guardar partícula. */
function drawWeather(x, now, w = weatherNow()) {
  const W = VIEW_W, H = VIEW_H, dim = EX.night ? .6 : 1, R = REDUCE ? 0 : 1;
  if (w === "chuva") {
    x.fillStyle = `rgba(30,50,80,${.16 * dim})`; x.fillRect(0, 0, W, H);
    x.fillStyle = EX.night ? "#9ab8d870" : "#d2e6f8b0";
    const n = Math.round(W * H / 700);
    for (let i = 0; i < n; i++) {
      const py = ((i * 613 + now * (.28 + (i % 4) * .03) * R) % (H + 16)) - 8, px = (((i * 977 - py * .3) % W) + W) % W;
      x.fillRect(Math.round(px), Math.round(py), 1, 3); x.fillRect(Math.round(px) - 1, Math.round(py) + 3, 1, 2);
    }
    for (let i = 0; i < n / 8; i++) {   // respingos no chão
      const k = Math.floor(now / 260) + i * 31; if (k % 3) continue;
      x.fillRect((k * 97 + i * 53) % W, (k * 61 + i * 89) % H, 2, 1);
    }
  } else if (w === "neblina") {
    x.fillStyle = `rgba(214,222,236,${.32 * dim})`; x.fillRect(0, 0, W, H);
    const puff = FOG_PUFF || (FOG_PUFF = fogPuff());
    x.globalAlpha = .65 * dim;
    for (let i = 0; i < 10; i++) x.drawImage(puff, Math.round(((i * 157 + now * .008 * R * (1 + i % 3)) % (W + 120)) - 100), Math.round((i * 53 + 20) % H), 100, 44);
    x.globalAlpha = 1;
  } else if (w === "mormaco") {
    x.fillStyle = "rgba(255,170,60,.1)"; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(255,230,160,.12)"; x.fillRect(0, 0, W, Math.round(H * .3));
  } else if (w === "ventania") {
    x.fillStyle = EX.night ? "#ffffff30" : "#ffffff70";
    const n = Math.round(W * H / 2500);
    for (let i = 0; i < n; i++) x.fillRect(Math.round(((i * 211 + now * (.35 + (i % 3) * .1) * R) % (W + 30)) - 30), (i * 71) % H, 6 + i % 6, 1);
    for (let i = 0; i < 6; i++) {   // folhas voando
      const px = ((i * 173 + now * .22 * R) % (W + 20)) - 10, py = (i * 97 + Math.sin(now / 300 + i) * 8 + H) % H;
      x.fillStyle = i % 2 ? "#6fbf4a" : "#a6d65a"; x.fillRect(Math.round(px), Math.round(py), 2, 1);
    }
  }
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
// teclado com o painel aberto: setas (ou WASD) escolhem, Z/Enter/Espaço confirmam, X/Esc voltam ou fecham
function dialogKey(ev) {
  if (EX.dialog === "tutorial") {   // Z, Espaço ou Enter passam a página; Esc encerra a conversa
    if (["z", "Z", " ", "Enter"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); pressPanel($("exDialog").querySelector(".cmd")); }
    else if (ev.key === "Escape") endTutorial();
    else if (ev.key.startsWith("Arrow")) ev.preventDefault();
    return;
  }
  const d = $("exDialog");
  if ((EX.dialog === "armeiro" || EX.dialog === "xama") && !EX.confirming && forgeKey(ev)) return;
  if (menuKey(ev, d)) return;   // setas escolhem, Z/Enter/Espaço confirmam
  else if (["Escape", "x", "X", "i", "I"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); EX.confirming ? exOpenDialog(EX.confirming) : exCloseDialog(); }   // X volta (na pergunta, é o "Não")
  else if (ev.key.startsWith("Arrow")) ev.preventDefault();
}