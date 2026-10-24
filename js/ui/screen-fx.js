/* Letras de recorte, carimbo do resultado, transição entre telas, tema por região e faixa de encontro. */
// texto em "letras de revista recortadas" (logo do título e faixa de encontro)
function ransom(el, lines, seed = 1) {
  el.innerHTML = ""; let n = 0;
  for (const text of lines) {
    const line = document.createElement("span"); line.className = "line";
    text.split(" ").forEach((word, wi) => {
      if (wi) line.append(Object.assign(document.createElement("span"), {className: "sp"}));
      const w = document.createElement("span"); w.className = "w";
      for (const ch of word) {
        const r = rand(seed + n * 7.13), s = document.createElement("span");
        s.className = "l " + "abcd"[Math.floor(r * 4)]; s.textContent = ch;
        s.style.setProperty("--rot", ((rand(seed + n * 3.7) - .5) * 16).toFixed(1) + "deg");
        s.style.setProperty("--fs", (.85 + rand(seed + n * 1.9) * .3).toFixed(2) + "em");
        s.style.setProperty("--d", n); w.append(s); n++;
      }
      line.append(w);
    });
    el.append(line);
  }
}
// título do resultado: letras carimbadas, cada palavra inteira na mesma linha
function stampText(el, text) {
  el.setAttribute("aria-label", text); el.textContent = "";
  let i = 0;
  text.split(" ").forEach((word, wi) => {
    if (wi) el.append(" ");
    const w = document.createElement("span"); w.className = "wd";
    for (const ch of word) {
      const s = document.createElement("span");
      s.className = "ch"; s.textContent = ch;
      s.style.setProperty("--i", i); s.style.setProperty("--r", ((i % 2 ? 1 : -1) * (2 + (i * 37) % 5)) + "deg"); s.style.setProperty("--y", ((i * 53) % 3 - 1) * .04 + "em");
      w.append(s); i++;
    }
    el.append(w);
  });
}
let wipeUntil = 0, themeReady = false;
// faixa diagonal cobrindo a tela; cb roda com a tela coberta
function wipe(cb) {
  const now = performance.now();
  if (now < wipeUntil) { cb(); return; }
  wipeUntil = now + 700;
  const w = $("wipe"); w.classList.remove("go"); void w.offsetWidth; w.classList.add("go");
  setTimeout(cb, 330);
}
function applyTheme() {
  const t = G.loc === "curitiba" ? "p4" : "mata", r = document.documentElement;
  if (r.dataset.theme === t) return;
  if (!themeReady) r.dataset.theme = t; else wipe(() => { r.dataset.theme = t; });
}
// abertura da batalha: o Rhanon entra pela esquerda, o bicho chega pela direita e o nome dele aparece numa faixa
function encounterBanner(name) {
  const st = $("stage"); st.querySelector(".encounter")?.remove();
  const b = document.createElement("div"); b.className = "encounter"; b.setAttribute("aria-hidden", "true");
  b.innerHTML = '<div class="enc-band"></div><h2 class="title enc-title"></h2><div class="enc-sub">apareceu!</div>';
  st.appendChild(b);
  ransom(b.querySelector(".enc-title"), [name.toUpperCase()], name.length * 3.1);
  impactSound();
  setTimeout(() => b.classList.add("out"), REDUCE ? 600 : 1050);
  setTimeout(() => b.remove(), REDUCE ? 700 : 1450);
}
