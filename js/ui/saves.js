/* Escolher save ("Iniciar aventura"): os três espaços de SLOTS (core/state.js). Espaço com jogo: Continuar ou Apagar
   (pergunta Sim/Não antes); espaço vazio: Começar aqui. Setas escolhem, Z confirma, X/Esc volta um passo. */
let SAVE_STEP = null;   // null = a lista dos espaços; {n} = o espaço escolhido; {n, apagar: true} = a pergunta antes de apagar;
                       // {n, heroi: true} = jogo novo: escolher entre o Rhanon e a Franciscane
const slotData = n => { try { return JSON.parse(localStorage.getItem(slotKey(n))); } catch (_) { return null; } };
// resumo de uma linha: nível, onde está, dia e chefes acalmados (ou "Vazio")
function slotLine(n) {
  const g = slotData(n); if (!g) return t("Vazio");
  const heroiNome = g.heroi === "fran" ? "Franciscane" : "Rhanon";
  return t("{heroi} · Nv {lv} · {lugar} · dia {dia} · {n} chefes", {heroi: heroiNome, lv: g.lv || 1, lugar: (LOC[g.loc] || LOC.ananindeua).n, dia: g.day || 1, n: Object.values(g.boss || {}).filter(Boolean).length});
}
function openSaves(step = null) {
  SAVE_STEP = step; PICK = [];
  const o = $("saves"), box = o.querySelector(".info"), n = step && step.n;
  box.innerHTML = `<h2>${t("Escolher save")}</h2>`;
  if (!step) {
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Três espaços: cada um guarda uma aventura.")}</p>`);
    for (let k = 1; k <= SLOTS; k++) btn(`${t("Espaço {n}", {n: k})}<small>${slotLine(k)}</small>`, () => { sfx("blip"); openSaves({n: k}); }, false, box);
    btn(t("Voltar"), closeSaves, false, box);
  } else if (step.heroi) {   // jogo novo: quem vai viajar (o outro já está em Curitiba)
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Quem vai viajar? Quem fica em Curitiba espera e manda notícia.")}</p><div class="heroi-pick"></div>`);
    const pick = box.querySelector(".heroi-pick");
    PICK = [["rhanon", "Rhanon Macley"], ["fran", "Franciscane Macley"]].map(([id, nome], i) => {
      btn(`<b>${nome}</b>`, () => pickChoose(i, n), false, pick);
      const b = pick.lastElementChild, c = document.createElement("canvas"); c.width = PICK_W; c.height = PICK_H; c.className = "heroi-fig";
      b.querySelector("span").prepend(c);
      const keep = [G.heroi, G.equip]; G.heroi = id; G.equip = {}; const look = rhanonLook(); [G.heroi, G.equip] = keep;   // como começa: sem roupa nem arco
      return {id, b, c, g: c.getContext("2d"), look, on: false, since: 0, blink: 0, nextBlink: 1500 + i * 900, off: i * 700};
    });
    btn(t("Voltar"), () => { sfx("blip"); openSaves({n}); }, false, box);
  } else if (step.apagar) {
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Apagar o espaço {n}? Não dá para desfazer.", {n})}</p><p class="hint">${slotLine(n)}</p>`);
    btn(t("Não"), () => openSaves({n}), false, box);
    btn(t("Sim, apagar"), () => slotErase(n), false, box);
  } else {
    box.insertAdjacentHTML("beforeend", `<p class="hint"><b>${t("Espaço {n}", {n})}</b> · ${slotLine(n)}</p>`);
    if (slotData(n)) {
      btn(t("Continuar"), () => slotPlay(n), false, box);
      btn(t("Apagar"), () => { sfx("blip"); openSaves({n, apagar: true}); }, false, box);
    } else btn(t("Começar aqui"), () => { sfx("blip"); openSaves({n, heroi: true}); }, false, box);
    btn(t("Voltar"), () => { sfx("blip"); openSaves(); }, false, box);
  }
  const first = !step ? SLOT - 1 : 0;   // na lista, o espaço em uso vem escolhido
  o.hidden = false; menuSelect(box, first);
}
function closeSaves() { $("saves").hidden = true; SAVE_STEP = null; PICK = []; sfx("blip"); }
/* bonequinhos da escolha de quem viaja (chamado pelo laço de animação, gfx/actors.js): parado, respira com a lança em pé
   e pisca; escolhido (seta, mouse ou foco), dá um pulinho e acena com a mão livre; confirmado, ergue a lança e pula */
const PICK_W = 44, PICK_H = 52;
let PICK = [], PICK_GO = false;
function drawHeroPick(t) {
  if (!PICK.length || $("saves").hidden) return;
  for (const q of PICK) {
    if (!q.c.isConnected) continue;
    const on = q.b.matches(".sel, :hover, :focus-visible"), go = q.go;
    if (on !== q.on) { q.on = on; q.since = t; }
    const el = t - q.since, pose = {...heroBreath(t + q.off, 2200), weapon: "up"};
    let lift = 0;
    if (t > q.nextBlink) { q.blink = t + 130; q.nextBlink = t + 1800 + Math.random() * 3200; }
    if (go) {   // confirmou: ergue a lança e pula
      const e = t - go, k = Math.min(1, Math.max(0, (e - 80) / 360));
      pose.weapon = e < 80 ? "up" : "raise"; pose.face = "happy"; pose.dy = e < 80 ? 1 : 0;
      lift = REDUCE ? 0 : Math.sin(k * Math.PI) * 7; pose.hd = k > 0 && k < .5 ? 1 : 0; pose.tr = k > .5 && k < 1 ? 1 : 0;
    } else if (on && !REDUCE) {
      pose.face = "happy";
      if (el < 80) { pose.dy = 1; pose.wy = 1; }   // agacha antes do pulinho
      else if (el < 380) { const k = (el - 80) / 300; lift = Math.sin(k * Math.PI) * 4; pose.dy = 0; pose.hd = k < .5 ? 1 : -1; pose.tr = k < .5 ? 0 : -1; }
      // acena: o braço livre sobe aos poucos e a mão vai e volta
      const up = Math.min(1, el / 260), wave = [[4, 13], [3, 11], [5, 10], [7, 11]][Math.floor(t / 110) % 4];
      pose.lh = el < 260 ? [Math.round(7 - 2 * up), Math.round(31 - 18 * up)] : wave;
      if (el > 380) pose.lh = [pose.lh[0], pose.lh[1] + (pose.dy || 0)];
    } else if (t < q.blink) pose.face = "blink";
    const g = q.g, L = Math.round(lift);
    g.clearRect(0, 0, PICK_W, PICK_H);
    g.fillStyle = "rgba(0,0,0,.3)"; const sw = Math.max(10, 22 - L * 2); g.fillRect(Math.round((PICK_W - sw) / 2), PICK_H - 2, sw, 2);
    g.drawImage(rigCanvas("front", pose, q.look, 1), 6, PICK_H - 45 - L);
  }
}
function pickChoose(i, n) {
  if (PICK_GO) return;
  const q = PICK[i]; if (!q) return slotPlay(n, ["rhanon", "fran"][i]);
  PICK_GO = true; q.go = performance.now(); sfx("blip");
  setTimeout(() => { PICK_GO = false; slotPlay(n, q.id); }, REDUCE ? 0 : 560);
}
// o que foi montado com o save na abertura do jogo (mapas, fundo da tela inicial) é refeito com o espaço novo
// subtítulo da tela inicial e o desenho dela com quem o save em uso escolheu
function heroTitle() {
  if ($("titleHero")) $("titleHero").textContent = heroAventura();
  if (typeof TITLE_A !== "undefined" && TITLE_A.mount) TITLE_A.mount($("titleArt"));
}
function useSlotDone() {
  applyLangData();   // quem viaja pode ter mudado: os textos dos dados saem de novo do português (core/lang.js)
  if (G.loc === "curitiba") { G.loc = "ananindeua"; save(); }
  syncRegion(); buildLocalNodes(); drawMap(); drawTitleBg(); heroTitle();
}
function slotPlay(n, heroi) {
  useSlot(n);
  if (heroi) { G.heroi = heroi; save(); }   // jogo novo: quem o jogador escolheu
  useSlotDone();
  $("saves").hidden = true; SAVE_STEP = null; PICK = [];
  audio(); musicStop();
  if (typeof refreshHero === "function") refreshHero(true);   // o desenho segue quem foi escolhido
  startIntro();   // a aventura começa com Rhanon acordando (jogo novo: na fogueira da aldeia)
}
function slotErase(n) {
  try { localStorage.removeItem(slotKey(n)); } catch (_) {}
  if (n === SLOT) { loadG(); useSlotDone(); }   // apagou o espaço em uso: o G volta a ser de jogo novo
  sfx("look"); openSaves({n});
}
function setupSaves() {
  $("saves").addEventListener("click", ev => { if (ev.target === $("saves")) closeSaves(); });
  // com a tela aberta, o teclado é só dela
  document.addEventListener("keydown", ev => {
    if ($("saves").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.stopImmediatePropagation();
    const lr = {ArrowLeft: "ArrowUp", ArrowRight: "ArrowDown"}[ev.key];   // a escolha de quem viaja fica lado a lado: as setas dos lados também andam
    if (lr && SAVE_STEP && SAVE_STEP.heroi) { menuKey({key: lr, repeat: ev.repeat, preventDefault: () => ev.preventDefault()}, $("saves").querySelector(".info")); return; }
    if (menuKey(ev, $("saves").querySelector(".info"))) return;
    if (["Escape", "x", "X"].includes(ev.key) && !ev.repeat) {
      ev.preventDefault();
      if (!SAVE_STEP) closeSaves(); else { sfx("blip"); openSaves(SAVE_STEP.apagar || SAVE_STEP.heroi ? {n: SAVE_STEP.n} : null); }
    }
  }, true);
}
