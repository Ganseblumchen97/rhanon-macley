/* Escolher save ("Iniciar aventura"): os três espaços de SLOTS (core/state.js). Espaço com jogo: Continuar ou Apagar
   (pergunta Sim/Não antes); espaço vazio: Começar aqui. Setas escolhem, Z confirma, X/Esc volta um passo. */
let SAVE_STEP = null;   // null = a lista dos espaços; {n} = o espaço escolhido; {n, apagar: true} = a pergunta antes de apagar
const slotData = n => { try { return JSON.parse(localStorage.getItem(slotKey(n))); } catch (_) { return null; } };
// resumo de uma linha: nível, onde está, dia e chefes acalmados (ou "Vazio")
function slotLine(n) {
  const g = slotData(n); if (!g) return t("Vazio");
  return t("Nv {lv} · {lugar} · dia {dia} · {n} chefes", {lv: g.lv || 1, lugar: (LOC[g.loc] || LOC.ananindeua).n, dia: g.day || 1, n: Object.values(g.boss || {}).filter(Boolean).length});
}
function openSaves(step = null) {
  SAVE_STEP = step;
  const o = $("saves"), box = o.querySelector(".info"), n = step && step.n;
  box.innerHTML = `<h2>${t("Escolher save")}</h2>`;
  if (!step) {
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Três espaços: cada um guarda uma aventura.")}</p>`);
    for (let k = 1; k <= SLOTS; k++) btn(`${t("Espaço {n}", {n: k})}<small>${slotLine(k)}</small>`, () => { sfx("blip"); openSaves({n: k}); }, false, box);
    btn(t("Voltar"), closeSaves, false, box);
  } else if (step.apagar) {
    box.insertAdjacentHTML("beforeend", `<p class="hint">${t("Apagar o espaço {n}? Não dá para desfazer.", {n})}</p><p class="hint">${slotLine(n)}</p>`);
    btn(t("Não"), () => openSaves({n}), false, box);
    btn(t("Sim, apagar"), () => slotErase(n), false, box);
  } else {
    box.insertAdjacentHTML("beforeend", `<p class="hint"><b>${t("Espaço {n}", {n})}</b> · ${slotLine(n)}</p>`);
    if (slotData(n)) {
      btn(t("Continuar"), () => slotPlay(n), false, box);
      btn(t("Apagar"), () => { sfx("blip"); openSaves({n, apagar: true}); }, false, box);
    } else btn(t("Começar aqui"), () => slotPlay(n), false, box);
    btn(t("Voltar"), () => { sfx("blip"); openSaves(); }, false, box);
  }
  const first = !step ? SLOT - 1 : 0;   // na lista, o espaço em uso vem escolhido
  o.hidden = false; menuSelect(box, first);
}
function closeSaves() { $("saves").hidden = true; SAVE_STEP = null; sfx("blip"); }
// o que foi montado com o save na abertura do jogo (mapas, fundo da tela inicial) é refeito com o espaço novo
function useSlotDone() {
  if (!CURITIBA_OPEN && G.loc === "curitiba") { G.loc = "ananindeua"; save(); }
  syncRegion(); buildLocalNodes(); drawMap(); drawTitleBg();
}
function slotPlay(n) {
  useSlot(n); useSlotDone();
  $("saves").hidden = true; SAVE_STEP = null;
  audio(); musicStop();
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
    if (menuKey(ev, $("saves").querySelector(".info"))) return;
    if (["Escape", "x", "X"].includes(ev.key) && !ev.repeat) {
      ev.preventDefault();
      if (!SAVE_STEP) closeSaves(); else { sfx("blip"); openSaves(SAVE_STEP.apagar ? {n: SAVE_STEP.n} : null); }
    }
  }, true);
}
