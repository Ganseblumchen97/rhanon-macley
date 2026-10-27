/* Controle (Xbox, PlayStation, Switch Pro e genéricos) pela Gamepad API do navegador. Cada botão vira a tecla que o
   jogo já entende, então nada mais precisa saber que existe controle: a tecla sai do elemento em foco e sobe até o
   document, como uma tecla de verdade. No layout "standard" os números são os mesmos em todo controle:
   0 A/✕/B(Switch) = Z (golpe, confirmar)   1 B/◯/A(Switch) = X (flecha, voltar)   2 X/▢/Y = Shift (esquiva)
   3 Y/△/X = I (bolsa)   4 LB/L1 = E (equipar)   5 RB/R1 = H (habilidades)   6 LT/L2 = Shift   7 RT/R2 = X
   8 Select/Share/− = C (segurar pula cena)   9 Start/Options/+ = Enter   12-15 cruz e analógico esquerdo = setas.
   Quando o navegador não reconhece o controle (mapping vazio, comum no DualSense e no DualShock), os botões da Sony
   vêm noutra ordem (0 ▢, 1 ✕, 2 ◯, 3 △: PAD_SONY troca para a ordem padrão) e a cruz vira um eixo "chapéu" (padHat).
   Direção segurada repete (menus andam sozinhos); o analógico passa das 8 direções pela zona morta PAD_DEAD.
   Os ícones na tela (padLabel/padBadge) seguem o último jeito de jogar: apertou o controle, aparecem os botões dele;
   apertou o teclado, voltam as teclas. Nas Opções dá para fixar o estilo (OPT.padIcons) e ver o que o controle manda. */
const PAD_KEYS = {0: "z", 1: "x", 2: "Shift", 3: "i", 4: "e", 5: "h", 6: "Shift", 7: "x", 8: "c", 9: "Enter", 12: "ArrowUp", 13: "ArrowDown", 14: "ArrowLeft", 15: "ArrowRight"};
const PAD_SONY = {0: 2, 1: 0, 2: 1, 3: 3};   // ordem dos botões da Sony sem o mapeamento padrão -> ordem padrão
const PAD_DEAD = .45, PAD_REPEAT = [380, 120];   // zona morta do analógico; espera e intervalo da repetição das setas (ms)
const PAD = {on: false, down: {}, since: {}, last: {}, active: false, style: "xbox", raw: null};
const padIsSony = id => /054c|dualsense|dualshock|playstation|wireless controller/i.test(id);
const PAD_STYLE_OF = id => padIsSony(id) ? "ps" : /057e|nintendo|pro controller|joy-?con/i.test(id) ? "nintendo" : "xbox";
// o que cada tecla do jogo é em cada controle (nome do botão)
const PAD_GLYPHS = {
  xbox:     {z: "A", x: "B", Shift: "X", i: "Y", e: "LB", h: "RB", Enter: "☰", c: "⧉", arrows: "✚"},
  ps:       {z: "✕", x: "◯", Shift: "▢", i: "△", e: "L1", h: "R1", Enter: "Options", c: "Create", arrows: "✚"},
  nintendo: {z: "B", x: "A", Shift: "Y", i: "X", e: "L", h: "R", Enter: "+", c: "−", arrows: "✚"}
};
// estilo de ícone em uso: null = teclado
function padStyle() {
  const o = typeof OPT !== "undefined" && OPT.padIcons || "auto";
  if (o === "kbd") return null;
  if (o !== "auto") return o;
  return PAD.active ? PAD.style : null;
}
const padLabel = k => PAD_GLYPHS[padStyle()]?.[k] || {z: "Z", x: "X", Shift: "Shift", i: "I", e: "E", h: "H", Enter: "Enter", c: "C", arrows: t("Setas")}[k] || k;
// nomes (ou selos, com f = padBadge) de cada botão para as frases: t("{z} aprende.", padVars())
const PAD_VAR_KEYS = {dir: "arrows", z: "z", x: "x", sh: "Shift", i: "i", e: "e", h: "h", st: "Enter", sel: "c"};
const padVars = (f = padLabel) => Object.fromEntries(Object.entries(PAD_VAR_KEYS).map(([v, k]) => [v, f(k)]));
// selo de tecla para HTML: botão colorido do controle ou a tecla do teclado
const padBadge = k => padStyle() ? `<b class="pb pb-${k}">${padLabel(k)}</b>` : `<i class="key">${padLabel(k)}</i>`;
function padSetActive(on) {
  if (PAD.active === on) return;
  PAD.active = on; padRefresh();
}
// troca os ícones das telas abertas (o resto já nasce com o estilo certo)
function padRefresh() {
  const st = padStyle(); document.body.dataset.pad = st || "";
  const help = document.getElementById("exHelpPad");
  if (help && st) help.innerHTML = t("{dir} anda · analógico direito mira · {z} golpe e conversa · {x} flecha · {sh} esquiva · {i} bolsa · {e} equipar · {h} habilidades", padVars(padBadge));
  if (!$("equipar").hidden) openEquip();
  if (!$("habil").hidden) openSkills();
}
function padKey(type, key, repeat) {
  const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : document;
  target.dispatchEvent(new KeyboardEvent(type, {key, code: key, bubbles: true, cancelable: true, repeat: !!repeat}));
}
// cruz como eixo "chapéu": -1 em cima, girando no sentido do relógio em passos de 2/7; fora de [-1, 1] = solta
function padHat(v, want) {
  if (v === undefined || Math.abs(v) > 1.05) return;
  const d = Math.round((v + 1) * 3.5) % 8;   // 0 cima, 1 cima-dir, 2 dir, 3 baixo-dir, 4 baixo, 5 baixo-esq, 6 esq, 7 cima-esq
  if (d === 7 || d <= 1) want.ArrowUp = true;
  if (d >= 1 && d <= 3) want.ArrowRight = true;
  if (d >= 3 && d <= 5) want.ArrowDown = true;
  if (d >= 5 && d <= 7) want.ArrowLeft = true;
}
function padPoll(now) {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const want = {};
  PAD.raw = pads[0] || null;
  for (const gp of pads) {
    const std = gp.mapping === "standard", sony = !std && padIsSony(gp.id);
    gp.buttons.forEach((b, i) => {
      if (!(b.pressed || b.value > .5)) return;
      const j = sony && i in PAD_SONY ? PAD_SONY[i] : i;
      if (!std && j >= 12) return;   // sem mapeamento padrão, 12+ não são a cruz (PS, touchpad...)
      if (PAD_KEYS[j]) want[PAD_KEYS[j]] = true;
    });
    const [ax, ay] = gp.axes;   // analógico esquerdo
    if (ax < -PAD_DEAD) want.ArrowLeft = true; else if (ax > PAD_DEAD) want.ArrowRight = true;
    if (ay < -PAD_DEAD) want.ArrowUp = true; else if (ay > PAD_DEAD) want.ArrowDown = true;
    if (!std) padHat(gp.axes[9], want);
    if (Object.keys(want).length) { PAD.style = PAD_STYLE_OF(gp.id); padSetActive(true); }
  }
  for (const k of Object.keys(PAD.down)) if (!want[k]) { delete PAD.down[k]; padKey("keyup", k); }
  for (const k of Object.keys(want)) {
    if (!PAD.down[k]) { PAD.down[k] = true; PAD.since[k] = PAD.last[k] = now; padKey("keydown", k); }
    else if (k.startsWith("Arrow") && now - PAD.since[k] > PAD_REPEAT[0] && now - PAD.last[k] > PAD_REPEAT[1]) { PAD.last[k] = now; padKey("keydown", k, true); }
  }
  padAim(pads[0], now);
  padLive();
  if (PAD.on) requestAnimationFrame(padPoll);
}
/* analógico direito na exploração = mouse: a mira (a cruz) fica na direção dele e o golpe/flecha saem para lá
   (exStrike/exThrow usam EX.padAim enquanto ele estiver inclinado). Solto, tudo volta a ser pela direção do andar. */
function padAim(gp, now) {
  if (!gp || typeof EX === "undefined" || !EX || $("explore").hidden || EX.dialog || EX.camp) return;
  const std = gp.mapping === "standard", rx = gp.axes[2] || 0, ry = (std ? gp.axes[3] : gp.axes[5]) || 0, n = Math.hypot(rx, ry);
  if (n < .4) { EX.padAim = null; return; }
  const h = EX.hero; EX.padAim = {x: rx / n, y: ry / n};
  EX.mouse = {x: h.x + EX.padAim.x * 40, y: h.y - 8 + EX.padAim.y * 40, t: now};   // a cruz da mira aparece como no mouse
  padSetActive(true);
}
// Opções abertas: mostra ao vivo o nome do controle, o modo e o que está apertado (ajuda a achar botão trocado)
function padLive() {
  const el = document.getElementById("padLive"); if (!el) return;
  const gp = PAD.raw;
  if (!gp) { el.textContent = t("Nenhum controle encontrado. Aperte um botão do controle."); return; }
  const v = {nome: gp.id.slice(0, 48), modo: gp.mapping || t("próprio"), b: gp.buttons.map((b, i) => b.pressed ? i : null).filter(i => i !== null).join(", ") || "—",
    e: gp.axes.map((a, i) => Math.abs(a) > .3 ? `${i}:${a.toFixed(1)}` : null).filter(Boolean).join(" ") || "—"};
  el.textContent = t("{nome} · modo {modo} · botões: {b} · eixos: {e}", v);
}
// tremidinha no golpe (hitImpact): forte = mais tempo e mais força; controles sem motor ignoram
function padRumble(level) {
  if (!PAD.on || REDUCE) return;
  const ms = {leve: 60, forte: 140, furia: 260}[level] || 60, s = {leve: .25, forte: .6, furia: 1}[level] || .25;
  for (const gp of navigator.getGamepads ? navigator.getGamepads() : []) {
    gp?.vibrationActuator?.playEffect?.("dual-rumble", {duration: ms, strongMagnitude: s, weakMagnitude: s * .6})?.catch(() => {});
  }
}
function setupGamepad() {
  addEventListener("gamepadconnected", ev => {
    if (!PAD.on) { PAD.on = true; requestAnimationFrame(padPoll); }
    PAD.style = PAD_STYLE_OF(ev.gamepad.id);
    const nome = ev.gamepad.id.replace(/\s*\(.*$/, "").slice(0, 40) || t("controle");   // "Xbox Wireless Controller (STANDARD...)" sem o resto
    padToast(t("Controle conectado: {nome}", {nome}));
  });
  addEventListener("gamepaddisconnected", () => {
    if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) return;
    PAD.on = false; Object.keys(PAD.down).forEach(k => padKey("keyup", k)); PAD.down = {}; PAD.raw = null;
    padSetActive(false); padLive();
    padToast(t("Controle desconectado"));
  });
  // tecla de verdade (não a que o controle solta): os ícones voltam a ser as teclas
  document.addEventListener("keydown", ev => { if (ev.isTrusted) padSetActive(false); }, true);
  padRefresh();
}
// aviso curto no canto, por cima de qualquer tela
function padToast(msg) {
  const b = document.createElement("div"); b.className = "pad-toast"; b.textContent = "🎮 " + msg; b.setAttribute("aria-live", "polite");
  document.body.appendChild(b); setTimeout(() => b.remove(), 2600);
}
