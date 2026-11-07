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
  SAVE_STEP = step;
  const o = $("saves"), box = o.querySelector(".info"), n = step && step.n;
  box.innerHTML = `<h2>${t("Escolher save")}</h2>`;
  if (!step) {
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Três espaços: cada um guarda uma aventura.")}</p>`);
    for (let k = 1; k <= SLOTS; k++) btn(`${t("Espaço {n}", {n: k})}<small>${slotLine(k)}</small>`, () => { sfx("blip"); openSaves({n: k}); }, false, box);
    btn(t("Voltar"), closeSaves, false, box);
  } else if (step.heroi) {   // jogo novo: quem vai viajar (o outro já está em Curitiba)
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Quem vai viajar? Quem fica em Curitiba espera e manda notícia.")}</p><div class="heroi-pick"></div>`);
    const pick = box.querySelector(".heroi-pick");
    [["rhanon", "Rhanon Macley", t("Lança na mão e a cabeça cheia de computador.")], ["fran", "Franciscane Macley", t("Lança na mão, trança no vento e a cabeça cheia de código.")]].forEach(([id, nome, d]) => {
      const keep = G.heroi; G.heroi = id; const fig = rigCanvas("front", {face: "happy"}, rhanonLook(), 1); G.heroi = keep;
      btn(`<b>${nome}</b><small>${d}</small>`, () => slotPlay(n, id), false, pick);
      const b = pick.lastElementChild, c = document.createElement("canvas"); c.width = fig.width; c.height = fig.height; c.getContext("2d").drawImage(fig, 0, 0); c.className = "heroi-fig";
      b.querySelector("span").prepend(c);
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
function closeSaves() { $("saves").hidden = true; SAVE_STEP = null; sfx("blip"); }
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
  $("saves").hidden = true; SAVE_STEP = null;
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
