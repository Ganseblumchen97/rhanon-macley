/* Inicialização: monta os mapas, liga os botões e o teclado e abre a tela inicial.
   É o último arquivo carregado, então tudo dos outros arquivos já existe aqui. */
buildMapNodes();
buildLocalNodes();

/* ----- botões fixos ----- */
$("startAdventure").addEventListener("click", () => { audio(); musicStop(); $("titleScreen").hidden = true; showMapNow(); musicStart("map"); });
$("homeButton").addEventListener("click", () => {
  $("local").hidden = true;
  musicStop();
  $("titleScreen").hidden = false;
  audio(); musicStart("title");
});
$("mute").addEventListener("click", toggleMute);
// cartão de resultado: "Lutar de novo" / "Continuar" e "Voltar ao mapa"
$("again").addEventListener("click", () => { if (mode === "interview" || mode === "betterInterview" || mode === "work") { if ($("overTitle").textContent.includes("encerrado")) startChallenge(challengeKind); else showMap(); } else init(); });
$("toMap").addEventListener("click", () => { $("over").hidden = true; $("again").style.display = ""; const f = fromLocal; fromLocal = false; f ? showLocal() : showMap(); });
// o título do resultado vira letras carimbadas sempre que o texto muda
new MutationObserver(() => { const t = $("overTitle"); if (t.childNodes.length === 1 && t.firstChild.nodeType === 3) stampText(t, t.textContent); }).observe($("overTitle"), {childList: true});

/* ----- teclado ----- */
document.addEventListener("keydown", ev => {
  // setas e 1-6 só durante a batalha
  if (mode !== "hunt" || !p || !$("over").hidden || !$("map").hidden || !$("local").hidden || !$("titleScreen").hidden) return;
  const bs = [...$("cmds").children], cur = bs.indexOf(document.activeElement);
  if (ev.key === "ArrowDown") { ev.preventDefault(); bs[(cur + 1) % bs.length].focus(); }
  else if (ev.key === "ArrowUp") { ev.preventDefault(); bs[(cur - 1 + bs.length) % bs.length].focus(); }
  else if (/^[1-6]$/.test(ev.key)) act(CMDS[+ev.key - 1].id);
});
document.addEventListener("keydown", ev => { if (ev.key === "m" || ev.key === "M") toggleMute(); });

/* ----- áudio ----- */
// o áudio começa no primeiro gesto do jogador, respeitando a política de autoplay dos navegadores
document.addEventListener("pointerdown", () => {
  audio();
  if (!$("titleScreen").hidden) musicStart("title");
  else if (!$("local").hidden) musicStart("local");
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
