/* Teclado fora da batalha e da exploração.
   Mapas (Brasil e Ananindeua): setas (ou WASD) escolhem o local na direção apertada, Enter/Z faz a ação principal do
   painel, Esc/X volta de Ananindeua para o mapa grande (Pará). Sem atalhos de número: tudo é escolher e confirmar.
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
/* listas de botões só no teclado (painéis da exploração, confirmações): setas sobem e descem, Z/Enter/Espaço
   confirmam o escolhido. O escolhido ganha "sel" e o foco e a lista rola até ele (listas maiores que 1-9) */
const menuButtons = host => [...host.querySelectorAll(".cmd")].filter(b => b.offsetParent !== null);
function menuSelect(host, i) {
  const bs = menuButtons(host); if (!bs.length) return;
  i = (i + bs.length) % bs.length;
  bs.forEach((b, j) => b.classList.toggle("sel", j === i));
  bs[i].focus({preventScroll: true}); bs[i].scrollIntoView({block: "nearest"});
}
const menuFirst = host => Math.max(0, menuButtons(host).findIndex(b => b.getAttribute("aria-disabled") !== "true"));
function menuKey(ev, host) {   // devolve true se usou a tecla
  const bs = menuButtons(host); if (!bs.length) return false;
  let i = bs.findIndex(b => b.classList.contains("sel")); if (i < 0) i = bs.indexOf(document.activeElement);
  if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); menuSelect(host, i < 0 ? 0 : i + (ev.key === "ArrowDown" ? 1 : -1)); sfx("blip"); return true; }
  if (["z", "Z", "Enter", " "].includes(ev.key)) { ev.preventDefault(); if (!ev.repeat) pressPanel(bs[i < 0 ? menuFirst(host) : i]); return true; }
  return false;
}

function setupMapNav() {
  document.addEventListener("keydown", ev => {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (!$("titleScreen").hidden) { menuKey(ev, $("titleScreen").querySelector(".t-menu")); return; }   // setas entre "Iniciar aventura" e "Opções", Z/Enter apertam
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
    else if ((ev.key === "Enter" && !onControl) || ev.key === "z" || ev.key === "Z") { ev.preventDefault(); pressPanel(panelButtons(which).find(b => b.getAttribute("aria-disabled") !== "true")); }   // Z = Enter
    else if ((ev.key === "Escape" || ev.key === "x" || ev.key === "X") && which === "local") closeLocal();   // X = voltar
  });
}
