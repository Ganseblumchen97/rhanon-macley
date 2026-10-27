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
/* ---------- amanhecer: a faixa da transição passa devagar, com um galo cantando e um solzinho no canto ---------- */
const DAWN_MS = 2200;
function roosterCanvas(crow) {
  const d = rigGrid(1, 44, 40), hy = crow ? -2 : 0, hx = crow ? -1 : 0;
  d.part();   // rabo de penas escuras
  [[26, 20, 38, 7, "#1e3a2a"], [27, 22, 42, 13, "#2a5a3a"], [27, 24, 41, 22, "#1a1a1a"]].forEach(([a, b, c, e, col]) => d.limb(a, b, c, e, 3, col));
  d.part().limb(20, 31, 19, 37, 2, "#f2c230").limb(24, 31, 25, 37, 2, "#f2c230").dots([[17, 38], [18, 38], [26, 38], [27, 38]], "#f2c230");   // pernas
  d.part().ellipse(22, 24, 10, 8, "#c8482a", "#8a2a18", .5);
  d.part().ellipse(24, 23, 6, 4, "#e0a040", "#b07020", .5);   // asa
  d.part().limb(17, 20, 13 + hx, 12 + hy, 5, "#e8a040", "#b87a28");
  d.part().ellipse(12 + hx, 10 + hy, 4.5, 4, "#e8a040", "#b87a28", .6);
  d.part().poly([[8 + hx, 7 + hy], [9 + hx, 3 + hy], [11 + hx, 5 + hy], [12 + hx, 2 + hy], [14 + hx, 5 + hy], [16 + hx, 4 + hy], [15 + hx, 8 + hy]], "#e5001c");   // crista
  d.part().ellipse(10 + hx, 15 + hy, 1.5, 2, "#e5001c");   // barbela
  if (crow) d.part().poly([[8 + hx, 8 + hy], [3 + hx, 6 + hy], [8 + hx, 10 + hy]], "#f2c230").poly([[8 + hx, 11 + hy], [4 + hx, 13 + hy], [8 + hx, 12 + hy]], "#f2c230");
  else d.part().poly([[8, 9], [4, 10], [8, 11]], "#f2c230");
  d.dots([[11 + hx, 9 + hy]], "#1a1426");
  return d.canvas();
}
function sunCanvas() {
  const d = rigGrid(1, 40, 40);
  d.part();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; d.limb(20 + Math.cos(a) * 14, 20 + Math.sin(a) * 14, 20 + Math.cos(a) * 19, 20 + Math.sin(a) * 19, 2.5, "#ffd23a"); }
  d.part().ellipse(20, 20, 11, 11, "#ffb52e", "#f2860c", .55).ellipse(17, 17, 5, 5, "#ffe27a");
  d.limb(14, 19, 17, 19, 1, "#1a1426").limb(23, 19, 26, 19, 1, "#1a1426").dots([[16, 24], [17, 25], [18, 25], [19, 25], [20, 25], [21, 25], [22, 25], [23, 24]], "#1a1426");   // olhos fechados e sorriso
  d.dots([[13, 22], [27, 22]], "#ff7a5a");
  return d.canvas();
}
// Jaci, a lua: rosto calmo de olhos fechados; a fumaça de Pytuna (com olhos vermelhos) cobre o pedaço que ainda falta
// voltar (jaciLight em ui/narration.js: um pedaço a cada chefe acalmado no Norte)
function moonCanvas() {
  const d = rigGrid(1, 40, 40), light = typeof jaciLight === "function" ? jaciLight() : 0;
  d.part().ellipse(20, 20, 17, 17, "#f4ecc0", "#c8b47a", .5).dots([[9, 10], [10, 10], [30, 28], [31, 29], [27, 9], [8, 27]], "#d8c890");   // crateras
  d.limb(11, 17, 15, 17, 1, "#8a7a4a").limb(25, 17, 29, 17, 1, "#8a7a4a").dots([[16, 25], [17, 26], [18, 26], [19, 26], [20, 26], [21, 26], [22, 26], [23, 25]], "#8a7a4a");   // olhos fechados e sorriso
  const c = d.canvas(), x = c.getContext("2d"), cover = 1 - light;
  if (cover > 0) {   // a fumaça cobre da direita para a esquerda, do tamanho do que falta
    x.save(); x.beginPath(); x.arc(20, 20, 18, 0, Math.PI * 2); x.clip();
    x.fillStyle = "#2a2a34"; x.fillRect(Math.round(40 - 40 * cover), 0, 40, 40);
    x.fillStyle = "#3a3a46"; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(40 - 40 * cover + (i % 2) * 2, 4 + i * 6.5, 4, 0, Math.PI * 2); x.fill(); }
    x.restore();
    if (cover > .25) { x.fillStyle = "#ff2a2a"; const ex = Math.round(40 - 40 * cover / 2); x.fillRect(ex - 4, 16, 2, 2); x.fillRect(ex + 2, 16, 2, 2); }   // olhos de Pytuna
  }
  return c;
}
// lobo-guará sentado; howl = cabeça para cima, uivando
function wolfCanvas(howl) {
  const d = rigGrid(1, 44, 40), hx = howl ? -1 : 0, hy = howl ? -4 : 0;
  d.part().limb(30, 28, 38, 22, 4, "#c8641c", "#8a3e10").limb(38, 22, 41, 18, 3, "#f4ecd8");   // rabo com ponta branca
  d.part().limb(24, 28, 25, 38, 3, "#1a1414").limb(29, 29, 31, 38, 3, "#1a1414");   // patas de trás
  d.part().ellipse(26, 27, 8, 7, "#c8641c", "#8a3e10", .5);
  d.part().limb(18, 24, 17, 38, 3, "#1a1414").limb(21, 25, 21, 38, 3, "#1a1414");   // patas da frente
  d.part().limb(22, 24, 16 + hx, 14 + hy, 6, "#c8641c", "#8a3e10").limb(20, 21, 18 + hx, 15 + hy, 3, "#1a1414");   // pescoço e crina
  d.part().poly([[16 + hx, 9 + hy], [17 + hx, 3 + hy], [20 + hx, 9 + hy]], "#c8641c").poly([[13 + hx, 9 + hy], [13 + hx, 3 + hy], [16 + hx, 8 + hy]], "#c8641c");   // orelhas
  d.part().ellipse(15 + hx, 12 + hy, 4.5, 3.5, "#c8641c", "#8a3e10", .6);
  if (howl) d.part().poly([[12, 8], [6, 1], [9, 7]], "#1a1414").poly([[12, 10], [7, 9], [11, 12]], "#1a1414");   // focinho para cima, boca aberta
  else d.part().poly([[12, 11], [6, 13], [12, 14]], "#1a1414");
  d.dots([[15 + hx, 11 + hy]], "#ffd23a");
  return d.canvas();
}
// mid = chamado quando a faixa cobre a tela (troca a noite pelo dia ou o dia pela noite);
// de dia o galo canta com o sol no canto; night = anoitecer, com Jaci (meio coberta pela fumaça) e um lobo uivando
function dawnWipe(mid, label, night) {
  let w = $("dawnWipe");
  if (!w) {
    w = document.createElement("div"); w.id = "dawnWipe"; w.className = "wipe dawn";
    w.innerHTML = '<div class="dawn-sun"></div><div class="dawn-galo"></div><b class="dawn-txt"></b>';
    document.body.appendChild(w);
  }
  w.classList.toggle("dusk", !!night);
  w.querySelector(".dawn-sun").replaceChildren(night ? moonCanvas() : sunCanvas());
  const frames = night ? [wolfCanvas(false), wolfCanvas(true)] : [roosterCanvas(false), roosterCanvas(true)], g = w.querySelector(".dawn-galo");
  g.replaceChildren(frames[0]); w.querySelector(".dawn-txt").textContent = label || (night ? t("Anoiteceu") : t("Amanheceu"));
  w.classList.remove("go"); void w.offsetWidth; w.classList.add("go");
  setTimeout(mid, DAWN_MS * .22);
  setTimeout(() => sfx(night ? "uivo" : "galo"), DAWN_MS * .3);
  if (night) { setTimeout(() => g.replaceChildren(frames[1]), DAWN_MS * .3); setTimeout(() => g.replaceChildren(frames[0]), DAWN_MS * .72); return; }   // uivo longo
  [.3, .38, .44, .5, .58, .64].forEach((p, i) => setTimeout(() => g.replaceChildren(frames[(i + 1) % 2]), DAWN_MS * p));   // bico abrindo no "có-có-ri-cóóó"
}
function applyTheme() {
  const t = G.loc === "curitiba" ? "p4" : "mata", r = document.documentElement;
  if (r.dataset.theme === t) return;
  if (!themeReady) r.dataset.theme = t; else wipe(() => { r.dataset.theme = t; });
}
// chefe chegando: a tela escurece, faixas de alerta listradas batem nas bordas e "CUIDADO!" aparece em letras de recorte
function bossWarn(sub) {
  const st = $("stage"); st.querySelector(".boss-warn")?.remove();
  const b = document.createElement("div"); b.className = "boss-warn"; b.setAttribute("aria-hidden", "true");
  b.innerHTML = `<div class="bw-tape top"></div><div class="bw-tape bottom"></div><h2 class="title bw-title"></h2><div class="bw-sub">${sub}</div>`;
  st.appendChild(b);
  ransom(b.querySelector(".bw-title"), [t("CUIDADO!")], 7);
  sfx("alarme"); impactSound();
  setTimeout(() => b.classList.add("out"), REDUCE ? 500 : 1150);
  setTimeout(() => b.remove(), REDUCE ? 600 : 1550);
}
// abertura da batalha: o Rhanon entra pela esquerda, o bicho chega pela direita e o nome dele aparece numa faixa
// (a mesma faixa anuncia a fúria do Rhanon, com outro subtítulo)
function encounterBanner(name, sub = t("apareceu!")) {
  const st = $("stage"); st.querySelector(".encounter")?.remove();
  const b = document.createElement("div"); b.className = "encounter"; b.setAttribute("aria-hidden", "true");
  b.innerHTML = `<div class="enc-band"></div><h2 class="title enc-title"></h2><div class="enc-sub">${sub}</div>`;
  st.appendChild(b);
  ransom(b.querySelector(".enc-title"), [name.toUpperCase()], name.length * 3.1);
  impactSound();
  setTimeout(() => b.classList.add("out"), REDUCE ? 600 : 1050);
  setTimeout(() => b.remove(), REDUCE ? 700 : 1450);
}

// faixa "NÍVEL X!" atravessando a tela + fanfarra (batalha, exploração ou missão)
function levelUpFx(lv) {
  levelUpJingle();
  const b = document.createElement("div"); b.className = "lvup"; b.setAttribute("aria-live", "polite");
  b.innerHTML = `<span>${t("NÍVEL {n}!", {n: lv})}</span><small>${t("Rhanon ficou mais forte")}</small><small>${t("+1 ponto de habilidade (H)")}</small>`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), REDUCE ? 1200 : 2200);
}