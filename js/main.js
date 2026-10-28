/* Inicialização: monta os mapas, liga os botões e o teclado e abre a tela inicial.
   É o último arquivo carregado, então tudo dos outros arquivos já existe aqui. */
applyLangData(); translateStatic();   // idioma escolhido nas Opções (core/lang.js); em português (ou sem o arquivo do idioma) não faz nada
if (!CURITIBA_OPEN && G.loc === "curitiba") { G.loc = "ananindeua"; save(); }   // Curitiba fechada por enquanto
$("gameVersion").textContent = t("ALFA") + " " + GAME_VERSION;
syncRegion();   // mapa grande da cidade do save (Pará ou Maranhão)
buildLocalNodes();
setupExploreInput();
setupMapNav(); setupGamepad(); setupNarration();
setupOptions();
setupEquip(); setupSkills(); setupBrasil();
setupReveal();
$("stage").addEventListener("pointerdown", () => qtePress());   // no celular: tocar no palco na hora certa
loadArt();   // imagens de data/art.js (carregam enquanto a tela inicial está aberta)

/* ----- botões fixos ----- */
$("startAdventure").addEventListener("click", () => {
  audio(); musicStop();
  startIntro();   // a aventura começa com Rhanon acordando na fogueira da aldeia (a tela inicial some por trás da transição)
});
$("local").querySelector(".nav-help").textContent = t("Setas ou WASD: escolher local · Z: confirmar · X: mapa do {mapa}", {mapa: MAP_REGIONS[MAP_REGION].n});
$("homeButton").addEventListener("click", () => {
  $("local").hidden = true;
  musicStop();
  $("titleScreen").hidden = false;
  audio(); musicStart("title");
});
$("mute").addEventListener("click", toggleMute);
$("cmds").addEventListener("scroll", cmdsMore, {passive: true});   // setinhas da lista de especiais/itens
// cartão de resultado: "Lutar de novo" / "Continuar" e "Voltar ao mapa"
$("again").addEventListener("click", () => { if (mode === "interview" || mode === "betterInterview" || mode === "work") { if ($("overTitle").textContent.includes("encerrado")) startChallenge(challengeKind); else showMap(); } else init(); });
$("toMap").addEventListener("click", () => {
  $("over").hidden = true; $("again").style.display = ""; $("toMap").textContent = t("Voltar ao mapa");
  if (fromExplore) { fromExplore = false; return wipe(() => resumeExplore(battleResult)); }
  const f = fromLocal; fromLocal = false; f ? showLocal() : showMap();
});
// o título do resultado vira letras carimbadas sempre que o texto muda
new MutationObserver(() => { const t = $("overTitle"); if (t.childNodes.length === 1 && t.firstChild.nodeType === 3) stampText(t, t.textContent); }).observe($("overTitle"), {childList: true});

/* ----- teclado ----- */
// WASD valem como setas em tudo (menus, mapas, batalha; na exploração já andavam): a tecla vira a seta antes de
// chegar nas telas, do mesmo jeito que o controle solta teclas (padKey)
const WASD = {w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight"};
for (const type of ["keydown", "keyup"]) window.addEventListener(type, ev => {
  const k = WASD[ev.key.length === 1 && ev.key.toLowerCase()];
  if (!k || !ev.isTrusted || ev.ctrlKey || ev.altKey || ev.metaKey || ev.target.matches?.("input, textarea, select")) return;
  ev.stopImmediatePropagation(); ev.preventDefault();
  (ev.target || document).dispatchEvent(new KeyboardEvent(type, {key: k, code: k, bubbles: true, cancelable: true, repeat: ev.repeat}));
}, {capture: true});
document.addEventListener("keydown", ev => {
  // cartão do resultado: Z aperta o botão escolhido (como Enter)
  if (!$("over").hidden && (ev.key === "z" || ev.key === "Z") && document.activeElement && document.activeElement.closest("#over")) { ev.preventDefault(); document.activeElement.click(); return; }
  if (!$("over").hidden && ev.key.startsWith("Arrow")) {   // setas trocam entre "Lutar de novo" e "Voltar"
    const bs = [...$("over").querySelectorAll("button")].filter(b => b.offsetParent !== null), i = bs.indexOf(document.activeElement);
    if (bs.length) { ev.preventDefault(); bs[(i + (ev.key === "ArrowUp" || ev.key === "ArrowLeft" ? bs.length - 1 : 1)) % bs.length].focus(); sfx("blip"); }
    return;
  }
  // setas (ou WASD) e Z/X só durante a batalha
  if (mode !== "hunt" || !p || !$("over").hidden || !$("map").hidden || !$("local").hidden || !$("explore").hidden || !$("titleScreen").hidden) return;
  if (qte && ["z", "Z", " "].includes(ev.key)) { ev.preventDefault(); if (!ev.repeat) qtePress(); return; }   // golpe/bloqueio no tempo certo
  const bs = [...$("cmds").children], cur = bs.indexOf(document.activeElement);
  if (["z", "Z", " "].includes(ev.key) && cur >= 0) { ev.preventDefault(); if (!ev.repeat) bs[cur].click(); return; }   // Z confirma o comando escolhido nas setas
  if ((ev.key === "x" || ev.key === "X") && subMenu) { ev.preventDefault(); closeSubMenu(); return; }   // X volta do Especial/Itens
  // os comandos ficam numa grade: lados andam um, cima/baixo andam uma linha e dão a volta na mesma coluna
  const cols = getComputedStyle($("cmds")).gridTemplateColumns.split(" ").length || 1;
  const step = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols}[ev.key];
  if (step) {
    ev.preventDefault(); let i = cur < 0 ? 0 : cur + step;
    if (i >= bs.length) i = Math.abs(step) > 1 ? cur % cols : 0;   // passou do fim: volta ao começo da mesma coluna
    else if (i < 0) { if (Math.abs(step) > 1) { i = cur; while (i + cols < bs.length) i += cols; } else i = bs.length - 1; }   // do topo para o fim da coluna
    bs[i].focus(); bs[i].scrollIntoView({block: "nearest"});
  }
  else if (subMenu && (ev.key === "Escape" || ev.key === "Backspace")) closeSubMenu();   // Especial/Itens: Esc também volta
});
document.addEventListener("keydown", ev => { if (ev.key === "m" || ev.key === "M") toggleMute(); });
// Espaço já confirma ao apertar (painéis, comandos da batalha, equipamento): soltar não pode apertar o botão de novo
document.addEventListener("keyup", ev => { if (ev.key === " " && ev.target.closest && ev.target.closest("#exDialog, #cmds, #equipar, #habil")) ev.preventDefault(); });

/* ----- áudio ----- */
// o áudio começa no primeiro gesto do jogador, respeitando a política de autoplay dos navegadores; com música já
// tocando, o clique não troca nada (antes, clicar de volta na janela trocava a faixa de um chefe ou do Pytuna pela da tela)
document.addEventListener("pointerdown", () => {
  audio();
  if (MUS.current || legacyTimer) return;
  if (!$("titleScreen").hidden) musicStart("title");
  else if (!$("local").hidden || !$("explore").hidden) musicStart("local");
  else if (!$("map").hidden) musicStart("map");
  else if ($("over").hidden && mode === "hunt") musicStart(e ? getBattleTrackFor(e) : "battleP3");
  else if ($("over").hidden && (mode === "interview" || mode === "betterInterview")) musicStart("interview");
  else if ($("over").hidden && mode === "work") musicStart("work");
}, {capture: true});
document.addEventListener("visibilitychange", () => { if (AC) document.hidden ? AC.suspend() : AC.resume(); });

/* ----- tela inicial ----- */
ransom($("titleLogo"), ["MACLEY'S", "ADVENTURE"], 7);
TITLE_A.mount($("titleArt"));
drawMap(); themeReady = true;
$("titleScreen").hidden = false; drawTitleForest();
startAnimationLoop();
debugSetup();   // só faz algo com ?debug na URL (ver state.js)
