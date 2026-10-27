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
  const l = n.lines[n.i], rh = typeof l === "object";
  n.full = t(rh ? l.r : l); n.t0 = performance.now(); n.shown = 0;
  $("narra").classList.toggle("rhanon", rh);
  $("narra").querySelector("b").textContent = rh ? "Rhanon" : t("Pajé");
  narraPortrait(rh); sfx("blip");
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
// retrato: o Pajé sentado com a fogueira na frente, ou o Rhanon de pé, num quadro com luz de fogo
function narraPortrait(rh) {
  const c = $("narra").querySelector("canvas"), x = c.getContext("2d");
  x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  const g = x.createRadialGradient(24, 40, 2, 24, 30, 34); g.addColorStop(0, "#c8602a"); g.addColorStop(1, "#2a140a");
  x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  const fig = rh ? rigCanvas("front", {face: "happy"}, rhanonLook(), 1) : rigCanvas("front", {sit: true}, VILLAGER_LOOK.xama, 1);
  x.drawImage(fig, 8, rh ? 4 : 2);
  if (!rh) { const f = gridC(FLAME, PAL_F, 1); x.drawImage(f, 18, 38); }
}
// dica quando o jogador perde duas lutas seguidas: a primeira que servir, na ordem
function pajeHint() {
  const z = G.loseZone && ZONES[G.loseZone] && zoneDef(G.loseZone);
  const luar = Object.entries(CHARMS).some(([id, it]) => !G.owned[id] && Object.entries(it.craft).every(([k, n]) => (G.pelts[k] || 0) >= n));   // dá para fazer um talismã
  return skillPoints() ? NARRA_HINT.pontos : !G.equip.ranged && G.lv >= 4 ? NARRA_HINT.arco : luar && !G.equip.amulet ? NARRA_HINT.talisma
    : z && G.lv < (z.lv || 1) + 1 ? NARRA_HINT.nivel : NARRA_HINT.tempo;
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
