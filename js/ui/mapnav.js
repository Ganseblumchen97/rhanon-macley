/* Teclado fora da batalha e da exploração.
   Mapas (Brasil e Ananindeua): setas escolhem o local na direção apertada, Enter faz a ação principal do painel,
   1-9 apertam os botões numerados, Esc volta de Ananindeua para o mapa grande (Pará).
   Tela inicial: Enter começa. Entrevistas e missões: 1-3 (ou A-C) respondem. */
const NAV = {map: {nodes: "nodes", panel: "info"}, local: {nodes: "lnodes", panel: "linfo"}};
const navSel = {map: null, local: null};

// destaca o local escolhido (chamado por select/selectSub, então vale também para o mouse)
function markNode(which, k) {
  navSel[which] = k;
  document.querySelectorAll(`#${NAV[which].nodes} .node`).forEach(n => n.classList.toggle("sel", n.dataset.k === k));
}
function navWhere(k, which) { return which === "map" ? LOC[k] : SUB[k]; }
// próximo local na direção (dx, dy): o mais à frente e menos de lado
function navMove(which, dx, dy) {
  const cur = navSel[which] || (which === "map" ? G.loc : G.sub), a = navWhere(cur, which);
  let best = null, bestScore = Infinity;
  document.querySelectorAll(`#${NAV[which].nodes} .node`).forEach(n => {
    const k = n.dataset.k; if (k === cur || n.style.display === "none") return;
    const b = navWhere(k, which), vx = b.x - a.x, vy = b.y - a.y, along = vx * dx + vy * dy;
    if (along <= 0) return;
    const score = along + Math.abs(vx * dy - vy * dx) * 2;
    if (score < bestScore) { bestScore = score; best = k; }
  });
  if (best) which === "map" ? select(best) : selectSub(best);
}
const panelButtons = which => [...$(NAV[which].panel).querySelectorAll(".cmd[data-key]")];
function pressPanel(btn) { if (btn && btn.getAttribute("aria-disabled") !== "true") btn.click(); }

function setupMapNav() {
  document.addEventListener("keydown", ev => {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (!$("titleScreen").hidden) { if (ev.key === "Enter" && document.activeElement !== $("startAdventure")) $("startAdventure").click(); return; }
    // entrevistas e missões de trabalho
    if (["interview", "betterInterview", "work"].includes(mode) && $("over").hidden && $("map").hidden) {
      const i = "123".indexOf(ev.key) >= 0 ? "123".indexOf(ev.key) : "abc".indexOf(ev.key.toLowerCase());
      if (ev.key.length === 1 && i >= 0 && activeQuestions && i < activeQuestions[interviewIndex].a.length) answerInterview(i);
      return;
    }
    const which = !$("local").hidden ? "local" : !$("map").hidden ? "map" : null;
    if (!which || moving || !$("over").hidden) return;
    const dir = {ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0]}[ev.key];
    const onControl = document.activeElement && document.activeElement.matches("button, .node");
    if (dir) { ev.preventDefault(); navMove(which, ...dir); }
    else if (ev.key === "Enter" && !onControl) { ev.preventDefault(); pressPanel(panelButtons(which).find(b => b.getAttribute("aria-disabled") !== "true")); }
    else if (/^[1-9]$/.test(ev.key)) pressPanel(panelButtons(which)[+ev.key - 1]);
    else if (ev.key === "Escape" && which === "local") closeLocal();
  });
}
