/* Menu de opções: volume da música e dos efeitos (guardado no navegador, fora do save do jogo).
   Abre pelo botão "Opções" da tela inicial ou pela engrenagem no canto do jogo; Esc ou "Fechar" fecham. */
const OPT_KEY = "rhanon-opcoes";
let OPT = {music: .8, sfx: .8};
try { Object.assign(OPT, JSON.parse(localStorage.getItem(OPT_KEY)) || {}); } catch (_) {}
// aplica os volumes nos canais de áudio (criados em audio(), audio/sfx.js)
function applyVolumes() {
  if (musicOut) musicOut.gain.value = OPT.music;
  if (sfxOut) sfxOut.gain.value = OPT.sfx;
}
function setVolume(kind, v) {
  OPT[kind] = Math.max(0, Math.min(1, v));
  try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (_) {}
  audio(); applyVolumes();
}
function openOptions() {
  audio();
  const o = $("opcoes"), box = o.querySelector(".info");
  box.innerHTML = `<h2>${t("Opções")}</h2>
    <label class="opt-row">${t("Música")} <input type="range" min="0" max="100" step="5" value="${Math.round(OPT.music * 100)}" data-k="music"><output>${Math.round(OPT.music * 100)}%</output></label>
    <label class="opt-row">${t("Efeitos")} <input type="range" min="0" max="100" step="5" value="${Math.round(OPT.sfx * 100)}" data-k="sfx"><output>${Math.round(OPT.sfx * 100)}%</output></label>
    <label class="opt-row">${t("Idioma")} <select data-k="lang">${Object.entries(LANGS).map(([k, n]) => `<option value="${k}"${k === LANG ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    ${LANG !== "pt" ? `<p class="hint lang-note">${t(LANG_NOTE)}</p>` : ""}
    <p class="hint">${t("Durante as cenas, segure C para pular.")}</p>
    <label class="opt-row">${t("Ícones dos botões")} <select data-k="padIcons">${[["auto", t("Automático")], ["kbd", t("Teclado")], ["xbox", "Xbox"], ["ps", "PlayStation"], ["nintendo", "Nintendo"]].map(([k, n]) => `<option value="${k}"${k === (OPT.padIcons || "auto") ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    <p class="hint">${padHelp()}</p>
    <p class="hint pad-live" id="padLive"></p>`;
  box.querySelector('select[data-k="lang"]').addEventListener("change", ev => setLang(ev.target.value));   // recarrega o jogo no idioma novo
  box.querySelector('select[data-k="padIcons"]').addEventListener("change", ev => {   // ícones do controle: automático, teclado ou um estilo fixo
    OPT.padIcons = ev.target.value; try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (_) {}
    padRefresh(); box.querySelector(".pad-help").innerHTML = padHelp(); sfx("blip");
  });
  padLive();
  box.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    setVolume(inp.dataset.k, inp.value / 100); inp.nextElementSibling.textContent = inp.value + "%";
    if (inp.dataset.k === "sfx") sfx("blip");   // amostra do volume dos efeitos
  }));
  btn(t("Fechar"), closeOptions, false, box);
  o.hidden = false; box.querySelector("input").focus();
}
// botões do controle no estilo em uso (ou no do controle conectado, ou Xbox)
function padHelp() {
  const st = padStyle() || PAD.style, g = PAD_GLYPHS[st], v = padVars(k => `<b class="pb pb-${k}" data-st="${st}">${g[k]}</b>`);
  return `<span class="pad-help">${t("Controle: {z} golpe e confirma · {x} flecha e volta · {sh} esquiva · {i} bolsa · {e} equipar · {h} habilidades · {st} começa · {sel} (segurar) pula cena · analógico direito mira na exploração", v)}</span>`;
}
// setas nas Opções (teclado e controle): cima/baixo escolhem a linha, lados mudam volume (5 em 5) ou a lista, Z aperta
function optKey(ev) {
  const box = $("opcoes").querySelector(".info"), items = [...box.querySelectorAll("input, select, .cmd")];
  let i = items.indexOf(document.activeElement); if (i < 0) i = 0;
  const el = items[i], k = ev.key;
  if (k === "ArrowDown" || k === "ArrowUp") { ev.preventDefault(); items[(i + (k === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); sfx("blip"); return true; }
  if ((k === "ArrowLeft" || k === "ArrowRight") && el.matches("input, select")) {
    ev.preventDefault(); const d = k === "ArrowRight" ? 1 : -1;
    if (el.tagName === "INPUT") el.value = Math.max(0, Math.min(100, +el.value + d * 5));
    else el.selectedIndex = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + d));
    if (el.dataset.k !== "lang") el.dispatchEvent(new Event(el.tagName === "INPUT" ? "input" : "change", {bubbles: true}));   // idioma recarrega o jogo: só com Z
    else sfx("blip");
    return true;
  }
  if (["z", "Z", "Enter", " "].includes(k) && el.dataset.k === "lang") { ev.preventDefault(); if (!ev.repeat) setLang(el.value); return true; }
  if (["z", "Z", "Enter", " "].includes(k) && el.matches(".cmd")) { ev.preventDefault(); if (!ev.repeat) el.click(); return true; }
  return false;
}
function closeOptions() { $("opcoes").hidden = true; sfx("blip"); }
function setupOptions() {
  $("optBtn").addEventListener("click", openOptions);
  $("titleOptions").addEventListener("click", openOptions);
  $("exOpt").addEventListener("click", () => { if (!EX || !EX.camp) openOptions(); });   // na exploração (fora das cenas)
  $("opcoes").addEventListener("click", ev => { if (ev.target === $("opcoes")) closeOptions(); });   // clicar fora fecha
  document.addEventListener("keydown", ev => {
    if (!$("opcoes").hidden && optKey(ev)) { ev.stopImmediatePropagation(); return; }
    if (ev.key !== "Escape" && !(ev.key === "x" || ev.key === "X") ) return;   // X volta, como Esc
    if (!$("opcoes").hidden) { ev.stopImmediatePropagation(); closeOptions(); }
    else if (!$("caderno").hidden) { ev.stopImmediatePropagation(); closeJournal(); }
  }, true);
  $("caderno").addEventListener("click", ev => { if (ev.target === $("caderno")) closeJournal(); });
}
