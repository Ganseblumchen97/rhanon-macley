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
  box.innerHTML = `<h2>Opções</h2>
    <label class="opt-row">Música <input type="range" min="0" max="100" step="5" value="${Math.round(OPT.music * 100)}" data-k="music"><output>${Math.round(OPT.music * 100)}%</output></label>
    <label class="opt-row">Efeitos <input type="range" min="0" max="100" step="5" value="${Math.round(OPT.sfx * 100)}" data-k="sfx"><output>${Math.round(OPT.sfx * 100)}%</output></label>
    <p class="hint">Durante as cenas, segure C para pular.</p>`;
  box.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
    setVolume(inp.dataset.k, inp.value / 100); inp.nextElementSibling.textContent = inp.value + "%";
    if (inp.dataset.k === "sfx") sfx("blip");   // amostra do volume dos efeitos
  }));
  btn("Fechar", closeOptions, false, box);
  o.hidden = false; box.querySelector("input").focus();
}
function closeOptions() { $("opcoes").hidden = true; sfx("blip"); }
function setupOptions() {
  $("optBtn").addEventListener("click", openOptions);
  $("titleOptions").addEventListener("click", openOptions);
  $("exOpt").addEventListener("click", () => { if (!EX || !EX.camp) openOptions(); });   // na exploração (fora das cenas)
  $("opcoes").addEventListener("click", ev => { if (ev.target === $("opcoes")) closeOptions(); });   // clicar fora fecha
  document.addEventListener("keydown", ev => { if (!$("opcoes").hidden && ev.key === "Escape") { ev.stopImmediatePropagation(); closeOptions(); } }, true);
}
