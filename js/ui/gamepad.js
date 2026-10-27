/* Controle (Xbox, PlayStation, Switch Pro e genéricos) pela Gamepad API do navegador. Cada botão vira a tecla que o
   jogo já entende, então nada mais precisa saber que existe controle: a tecla sai do elemento em foco e sobe até o
   document, como uma tecla de verdade. No layout "standard" os números são os mesmos em todo controle:
   0 A/✕/B(Switch) = Z (golpe, confirmar)   1 B/◯/A(Switch) = X (flecha, voltar)   2 X/▢/Y = Shift (esquiva)
   3 Y/△/X = I (bolsa)   4 LB/L1 = E (equipar)   5 RB/R1 = H (habilidades)   6 LT/L2 = Shift   7 RT/R2 = X
   8 Select/Share/− = C (segurar pula cena)   9 Start/Options/+ = Enter   12-15 cruz e analógico esquerdo = setas.
   Direção segurada repete (menus andam sozinhos); o analógico passa das 8 direções pela zona morta PAD_DEAD. */
const PAD_KEYS = {0: "z", 1: "x", 2: "Shift", 3: "i", 4: "e", 5: "h", 6: "Shift", 7: "x", 8: "c", 9: "Enter", 12: "ArrowUp", 13: "ArrowDown", 14: "ArrowLeft", 15: "ArrowRight"};
const PAD_DEAD = .45, PAD_REPEAT = [380, 120];   // zona morta do analógico; espera e intervalo da repetição das setas (ms)
const PAD = {on: false, down: {}, since: {}, last: {}};
function padKey(type, key, repeat) {
  const target = document.activeElement && document.activeElement !== document.body ? document.activeElement : document;
  target.dispatchEvent(new KeyboardEvent(type, {key, code: key, bubbles: true, cancelable: true, repeat: !!repeat}));
}
function padPoll(now) {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const want = {};
  for (const gp of pads) {
    gp.buttons.forEach((b, i) => { if (PAD_KEYS[i] && (b.pressed || b.value > .5)) want[PAD_KEYS[i]] = true; });
    const [ax, ay] = gp.axes;   // analógico esquerdo
    if (ax < -PAD_DEAD) want.ArrowLeft = true; else if (ax > PAD_DEAD) want.ArrowRight = true;
    if (ay < -PAD_DEAD) want.ArrowUp = true; else if (ay > PAD_DEAD) want.ArrowDown = true;
  }
  for (const k of Object.keys(PAD.down)) if (!want[k]) { delete PAD.down[k]; padKey("keyup", k); }
  for (const k of Object.keys(want)) {
    if (!PAD.down[k]) { PAD.down[k] = true; PAD.since[k] = PAD.last[k] = now; padKey("keydown", k); }
    else if (k.startsWith("Arrow") && now - PAD.since[k] > PAD_REPEAT[0] && now - PAD.last[k] > PAD_REPEAT[1]) { PAD.last[k] = now; padKey("keydown", k, true); }
  }
  if (PAD.on) requestAnimationFrame(padPoll);
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
    const nome = ev.gamepad.id.replace(/\s*\(.*$/, "").slice(0, 40) || t("controle");   // "Xbox Wireless Controller (STANDARD...)" sem o resto
    padToast(t("Controle conectado: {nome}", {nome}));
  });
  addEventListener("gamepaddisconnected", () => {
    if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) return;
    PAD.on = false; Object.keys(PAD.down).forEach(k => padKey("keyup", k)); PAD.down = {};
    padToast(t("Controle desconectado"));
  });
}
// aviso curto no canto, por cima de qualquer tela
function padToast(msg) {
  const b = document.createElement("div"); b.className = "pad-toast"; b.textContent = "🎮 " + msg; b.setAttribute("aria-live", "polite");
  document.body.appendChild(b); setTimeout(() => b.remove(), 2600);
}
