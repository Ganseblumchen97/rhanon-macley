/* Inicialização: monta os mapas, liga os botões e o teclado e abre a tela inicial.
   É o último arquivo carregado, então tudo dos outros arquivos já existe aqui. */
applyLangData(); translateStatic();   // idioma escolhido nas Opções (core/lang.js); em português (ou sem o arquivo do idioma) não faz nada
if (!CURITIBA_OPEN && G.loc === "curitiba") { G.loc = "ananindeua"; save(); }   // Curitiba fechada por enquanto
$("gameVersion").textContent = t("ALFA") + " " + GAME_VERSION;
setupMapRegion();
buildMapNodes();
buildLocalNodes();
setupExploreInput();
setupMapNav();
setupOptions();
setupEquip();
setupReveal();
$("stage").addEventListener("pointerdown", () => qtePress());   // no celular: tocar no palco na hora certa
loadArt();   // imagens de data/art.js (carregam enquanto a tela inicial está aberta)

/* ----- botões fixos ----- */
$("startAdventure").addEventListener("click", () => {
  audio(); musicStop();
  startIntro();   // a aventura começa com Rhanon acordando na fogueira da aldeia (a tela inicial some por trás da transição)
});
$("local").querySelector(".nav-help").textContent = t("Setas: escolher local · Enter: confirmar · 1-9: botões · Esc: mapa do {mapa}", {mapa: MAP_REGIONS[MAP_REGION].n});
$("homeButton").addEventListener("click", () => {
  $("local").hidden = true;
  musicStop();
  $("titleScreen").hidden = false;
  audio(); musicStart("title");
});
$("mute").addEventListener("click", toggleMute);
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
document.addEventListener("keydown", ev => {
  // cartão do resultado: Z aperta o botão escolhido (como Enter)
  if (!$("over").hidden && (ev.key === "z" || ev.key === "Z") && document.activeElement && document.activeElement.closest("#over")) { ev.preventDefault(); document.activeElement.click(); return; }
  // setas e 1-6 só durante a batalha
  if (mode !== "hunt" || !p || !$("over").hidden || !$("map").hidden || !$("local").hidden || !$("explore").hidden || !$("titleScreen").hidden) return;
  if (qte && ["z", "Z", " "].includes(ev.key)) { ev.preventDefault(); if (!ev.repeat) qtePress(); return; }   // golpe/bloqueio no tempo certo
  const bs = [...$("cmds").children], cur = bs.indexOf(document.activeElement);
  if (["z", "Z", " "].includes(ev.key) && cur >= 0) { ev.preventDefault(); if (!ev.repeat) bs[cur].click(); return; }   // Z confirma o comando escolhido nas setas
  if ((ev.key === "x" || ev.key === "X") && subMenu) { ev.preventDefault(); closeSubMenu(); return; }   // X volta do Especial/Itens
  if (ev.key === "ArrowDown") { ev.preventDefault(); bs[(cur + 1) % bs.length].focus(); }
  else if (ev.key === "ArrowUp") { ev.preventDefault(); bs[(cur - 1 + bs.length) % bs.length].focus(); }
  else if (subMenu) {   // Especial/Itens abertos: números escolhem, Esc volta
    const o = /^[1-9]$/.test(ev.key) && subMenu[+ev.key - 1];
    if (o && !o.off) o.fn();
    else if (ev.key === "Escape" || ev.key === "Backspace") closeSubMenu();
  }
  else if (/^[1-6]$/.test(ev.key)) act(CMDS[+ev.key - 1].id);
});
document.addEventListener("keydown", ev => { if (ev.key === "m" || ev.key === "M") toggleMute(); });
// Espaço já confirma ao apertar (painéis, comandos da batalha, equipamento): soltar não pode apertar o botão de novo
document.addEventListener("keyup", ev => { if (ev.key === " " && ev.target.closest && ev.target.closest("#exDialog, #cmds, #equipar")) ev.preventDefault(); });

/* ----- áudio ----- */
// o áudio começa no primeiro gesto do jogador, respeitando a política de autoplay dos navegadores
document.addEventListener("pointerdown", () => {
  audio();
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
$("titleScreen").hidden = false;
startAnimationLoop();
debugSetup();   // só faz algo com ?debug na URL (ver state.js)
