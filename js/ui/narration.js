/* Narração do Pajé (falas em data/narration.js): um painel embaixo da tela com o retrato de quem fala (o Pajé na
   fogueira ou o Rhanon, quando corrige o avô) e o texto aparecendo letra por letra. Z/Enter/Espaço/X: completa a
   frase ou passa para a próxima; Esc pula tudo. A exploração fica parada enquanto o painel está aberto. */
let NARRA_RUN = null;   // {lines, i, done, t0, full}
const NARRA_CPS = 45;   // letras por segundo
function narrate(lines, done) {
  if (!lines || !lines.length) return done && done();
  NARRA_RUN = {lines, i: -1, done}; if (EX) exKeys.clear();
  $("narra").hidden = false; narraNext();
}
function narraNext() {
  const n = NARRA_RUN; if (!n) return;
  n.i++;
  if (n.i >= n.lines.length) return narraEnd();
  const l = n.lines[n.i], who = typeof l !== "object" ? "paje" : l.p ? "pytuna" : "rhanon", rh = who === "rhanon";
  const txt = who === "paje" ? l : l.p || l.r; n.full = t(txt); n.t0 = performance.now(); n.shown = 0;
  $("narra").classList.toggle("rhanon", rh); $("narra").classList.toggle("pytuna", who === "pytuna");
  $("narra").querySelector("b").textContent = who === "pytuna" ? "Pytuna" : rh ? "Rhanon" : t("Pajé");
  narraPortrait(who); sfx(who === "pytuna" ? "roar" : "blip");
  $("narra").querySelector("small").innerHTML = padBadge("z") + " ▶";   // Z ou o botão do controle
  requestAnimationFrame(narraType);
}
// texto aparecendo aos poucos (respeita "reduzir movimento": aparece inteiro)
function narraType(now) {
  const n = NARRA_RUN; if (!n) return;
  const k = REDUCE ? n.full.length : Math.min(n.full.length, Math.floor((now - n.t0) / 1000 * NARRA_CPS));
  if (k !== n.shown) { n.shown = k; $("narra").querySelector("p").textContent = n.full.slice(0, k); }
  if (k < n.full.length) requestAnimationFrame(narraType);
}
function narraPress() {
  const n = NARRA_RUN; if (!n) return;
  if (n.shown < n.full.length) { n.t0 = -1e9; return; }   // primeiro aperto completa a frase
  narraNext();
}
function narraEnd() {
  const n = NARRA_RUN; NARRA_RUN = null;
  $("narra").hidden = true;
  if (n && n.done) n.done();
}
// retrato: o Pajé sentado com a fogueira na frente, o Rhanon de pé, ou Pytuna (fumaça com olhos vermelhos)
function narraPortrait(who) {
  const c = $("narra").querySelector("canvas"), x = c.getContext("2d"), rh = who === "rhanon";
  x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  if (who === "pytuna") { x.fillStyle = "#0a0a14"; x.fillRect(0, 0, 48, 48); drawSmoke(x, 24, 26, 1.1, performance.now()); return; }
  const g = x.createRadialGradient(24, 40, 2, 24, 30, 34); g.addColorStop(0, "#c8602a"); g.addColorStop(1, "#2a140a");
  x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  const fig = rh ? rigCanvas("front", {face: "happy"}, rhanonLook(), 1) : rigCanvas("front", {sit: true}, VILLAGER_LOOK.xama, 1);
  x.drawImage(fig, 8, rh ? 4 : 2);
  if (!rh) { const f = gridC(FLAME, PAL_F, 1); x.drawImage(f, 18, 38); }
}
/* fumaça de Pytuna: bolhas cinza-escuras girando devagar e dois olhos vermelhos; k = tamanho, alpha = sumindo */
function drawSmoke(x, cx, cy, k = 1, now = 0, alpha = 1) {
  x.save(); x.globalAlpha = alpha;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + now / 1400, r = (7 + (i % 3) * 3) * k, d = (6 + (i % 2) * 5) * k;
    x.fillStyle = ["#2a2a34", "#3a3a46", "#1a1a22"][i % 3];
    x.beginPath(); x.arc(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * .7), r, 0, Math.PI * 2); x.fill();
  }
  const blink = now % 3000 < 120;
  x.fillStyle = "#ff2a2a"; if (!blink) { x.fillRect(Math.round(cx - 5 * k), Math.round(cy - 2 * k), Math.max(1, Math.round(3 * k)), Math.max(1, Math.round(2 * k))); x.fillRect(Math.round(cx + 2 * k), Math.round(cy - 2 * k), Math.max(1, Math.round(3 * k)), Math.max(1, Math.round(2 * k))); }
  x.restore();
}
/* Luz de Jaci: quanto do Norte já foi acalmado (chefes de dia e de noite de Ananindeua e Belém). Clareia as noites e
   descobre a lua da faixa do anoitecer (moonCanvas). */
const NORTE_BOSSES = () => Object.keys(ZONES).flatMap(z => [z, NIGHT_ZONES[z] ? z + ":noite" : null]).filter(Boolean);
const jaciLight = () => { const all = NORTE_BOSSES(); return all.filter(k => BS()[k]).length / all.length; };
// Pytuna aparece na exploração: a fumaça chega perto do Rhanon, fala (narra) e o vento leva ela embora
function pytunaScene(lines, done) {
  if (!EX) return narrate(lines, done);
  EX.locked = true; exKeys.clear();
  EX.pyt = {t0: performance.now(), x: EX.hero.x + 28, y: EX.hero.y - 26};
  sfx("rugidoChefe"); musicStart("pytuna");   // o tema de Pytuna toca enquanto ele está em cena
  setTimeout(() => narrate(lines, () => {
    if (!EX || !EX.pyt) return done && done();
    EX.pyt.leave = performance.now(); sfx("esquiva");
    setTimeout(() => { if (EX) { EX.pyt = null; EX.locked = false; musicStart("local"); } if (done) done(); }, 1200);
  }), 900);
}
// desenho na exploração (chamado no fim do quadro): chega crescendo, fica, e sai voando para baixo (para o Sul)
function drawPytuna(x, cx, cy, now) {
  const p = EX.pyt; if (!p) return;
  const inK = Math.min(1, (now - p.t0) / 800), out = p.leave ? Math.min(1, (now - p.leave) / 1100) : 0;
  drawSmoke(x, p.x - cx + out * 30, p.y - cy + out * 120, 1.2 * inK + out, now, (1 - out) * .95);
}
// fim do capítulo do Norte: faixa grande com letras de recorte
function chapterBanner(title, sub) {
  const b = document.createElement("div"); b.className = "chapter"; b.setAttribute("aria-live", "polite");
  b.innerHTML = `<h2 class="title"></h2><p>${sub}</p>`; document.body.appendChild(b);
  ransom(b.querySelector("h2"), [title.toUpperCase()], 11); levelUpJingle();
  setTimeout(() => b.classList.add("out"), 4200); setTimeout(() => b.remove(), 5000);
}
// depois do comentário do Pajé sobre um chefe: Pytuna (se for o último de uma cidade) e o fim do Norte, nessa ordem
function bossStory(id, done) {
  const steps = [];
  if (NARRA_PYT[id] && !G.narrated["pyt_" + id]) steps.push(next => { G.narrated["pyt_" + id] = true; save(); pytunaScene(NARRA_PYT[id], next); });
  if (jaciLight() >= 1 && !G.narrated.norte_fim) steps.push(next => {
    G.narrated.norte_fim = true; save(); musicStart("jaci");   // a lua volta inteira: o tema de Jaci
    narrate(NARRA_PYT.norte, () => { setTimeout(() => { if (EX) musicStart("local"); }, 5200); chapterBanner(t("Fim do Norte"), t(G.portfolio.site_feira ? "A história continua no Nordeste: o voo sai do Aeroporto de Belém." : "A história continua no Nordeste. Antes, entregue o site da Dona Graça no Ver-o-Peso.")); setTimeout(next, 1500); });
  });
  const run = () => steps.length ? steps.shift()(run) : done && done();
  run();
}
// dica quando o jogador perde duas lutas seguidas: a primeira que servir, na ordem
function pajeHint() {
  const z = G.loseZone && ZONES[G.loseZone] && zoneDef(G.loseZone);
  const luar = Object.entries(CHARMS).some(([id, it]) => !G.owned[id] && Object.entries(it.craft).every(([k, n]) => (G.pelts[k] || 0) >= n));   // dá para fazer um talismã
  const w = z && (ELEM_OF[z.boss] || [])[0], sp = w && SPECIALS.find(q => q.elem === w);   // o chefe dali é fraco contra um elemento que o Rhanon ainda não tem
  return skillPoints() ? NARRA_HINT.pontos : !G.equip.ranged && G.lv >= 4 ? NARRA_HINT.arco : luar && !G.equip.amulet ? NARRA_HINT.talisma
    : sp && specialLock(sp) && NARRA_HINT[w] ? NARRA_HINT[w] : z && G.lv < (z.lv || 1) + 1 ? NARRA_HINT.nivel : NARRA_HINT.tempo;
}
function setupNarration() {
  $("narra").addEventListener("click", narraPress);
  document.addEventListener("keydown", ev => {
    if ($("narra").hidden) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.repeat) return;
    if (ev.key === "Escape") narraEnd();
    else if (["z", "Z", "Enter", " ", "x", "X"].includes(ev.key)) narraPress();
  }, true);
}
