/* Narração do Pajé (falas em data/narration.js): um painel embaixo da tela com o retrato de quem fala (o Pajé na
   fogueira ou o Rhanon, quando corrige o avô) e o texto aparecendo letra por letra. Z/Enter/Espaço/X: completa a
   frase ou passa para a próxima; Esc pula tudo. A exploração fica parada enquanto o painel está aberto. */
let NARRA_RUN = null;   // {lines, i, done, t0, full}
const NARRA_CPS = 45;   // letras por segundo
function narrate(lines, done) {
  if (!lines || !lines.length) return done && done();
  NARRA_RUN = {lines, i: -1, done}; if (EX) exKeys.clear();
  $("narra").hidden = false; narraNext();
}
function narraNext() {
  const n = NARRA_RUN; if (!n) return;
  n.i++;
  if (n.i >= n.lines.length) return narraEnd();
  const l = n.lines[n.i], who = typeof l !== "object" ? "paje" : l.p ? "pytuna" : l.e ? "entrevista" : "rhanon", rh = who === "rhanon";
  const txt = who === "paje" ? l : l.p || l.e || l.r; n.full = t(txt); n.t0 = performance.now(); n.shown = 0;
  $("narra").classList.toggle("rhanon", rh); $("narra").classList.toggle("pytuna", who === "pytuna");
  $("narra").querySelector("b").textContent = who === "pytuna" ? "Pytuna" : who === "entrevista" ? t("Entrevistadora") : rh ? heroName() : t("Pajé");
  narraPortrait(who); sfx(who === "pytuna" ? "roar" : "blip");
  $("narra").querySelector("small").innerHTML = padBadge("z") + " ▶";   // Z ou o botão do controle
  requestAnimationFrame(narraType);
}
// texto aparecendo aos poucos (respeita "reduzir movimento": aparece inteiro)
function narraType(now) {
  const n = NARRA_RUN; if (!n) return;
  const k = REDUCE ? n.full.length : Math.min(n.full.length, Math.floor((now - n.t0) / 1000 * NARRA_CPS));
  if (k !== n.shown) { n.shown = k; $("narra").querySelector("p").textContent = n.full.slice(0, k); }
  if (k < n.full.length) requestAnimationFrame(narraType);
}
function narraPress() {
  const n = NARRA_RUN; if (!n) return;
  if (n.shown < n.full.length) { n.t0 = -1e9; return; }   // primeiro aperto completa a frase
  narraNext();
}
function narraEnd() {
  const n = NARRA_RUN; NARRA_RUN = null;
  $("narra").hidden = true;
  if (n && n.done) n.done();
}
// retrato: o Pajé sentado com a fogueira na frente, o Rhanon de pé, ou Pytuna (fumaça com olhos vermelhos)
function narraPortrait(who) {
  const c = $("narra").querySelector("canvas"), x = c.getContext("2d"), rh = who === "rhanon";
  x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
  if (who === "pytuna") { x.fillStyle = "#0a0a14"; x.fillRect(0, 0, 48, 48); drawSmoke(x, 24, 26, 1.1, performance.now()); return; }
  if (who === "entrevista") { x.fillStyle = "#3a4a6a"; x.fillRect(0, 0, 48, 48); x.drawImage(rigCanvas("front", {face: "happy"}, VILLAGER_LOOK.startup, 1), 8, 4); return; }   // a entrevistadora da empresa
  const g = x.createRadialGradient(24, 40, 2, 24, 30, 34); g.addColorStop(0, "#c8602a"); g.addColorStop(1, "#2a140a");
  x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  const fig = rh ? rigCanvas("front", {face: "happy"}, rhanonLook(), 1) : rigCanvas("front", {sit: true}, VILLAGER_LOOK.xama, 1);
  x.drawImage(fig, 8, rh ? 4 : 2);
  if (!rh) { const f = gridC(FLAME, PAL_F, 1); x.drawImage(f, 18, 38); }
}
/* fumaça de Pytuna: bolhas cinza-escuras girando devagar e dois olhos vermelhos; k = tamanho, alpha = sumindo */
function drawSmoke(x, cx, cy, k = 1, now = 0, alpha = 1) {
  if (!(k > 0)) return;   // primeiro quadro da cena: o relógio pode vir um pouco antes do começo (tamanho negativo)
  x.save(); x.globalAlpha = alpha;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + now / 1400, r = (7 + (i % 3) * 3) * k, d = (6 + (i % 2) * 5) * k;
    x.fillStyle = ["#2a2a34", "#3a3a46", "#1a1a22"][i % 3];
    x.beginPath(); x.arc(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * .7), r, 0, Math.PI * 2); x.fill();
  }
  const blink = now % 3000 < 120;
  x.fillStyle = "#ff2a2a"; if (!blink) { x.fillRect(Math.round(cx - 5 * k), Math.round(cy - 2 * k), Math.max(1, Math.round(3 * k)), Math.max(1, Math.round(2 * k))); x.fillRect(Math.round(cx + 2 * k), Math.round(cy - 2 * k), Math.max(1, Math.round(3 * k)), Math.max(1, Math.round(2 * k))); }
  x.restore();
}
/* a mesma fumaça presa num bicho tomado, sem os olhos: bolhas girando devagar em volta do corpo (atrás dele);
   (cx, cy) = meio do bicho, rx/ry = metade da largura e da altura */
function drawSmokeAura(x, cx, cy, rx, ry, now, seed = 0, alpha = .8) {
  if (!(rx > 0 && ry > 0)) return;
  x.save(); x.globalAlpha = alpha;
  const r0 = Math.max(2, Math.min(rx, ry) * .3);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + now / 1400 + seed, d = .8 + (i % 2) * .25, r = r0 * (1 + (i % 3) * .35) * (1 + .12 * Math.sin(now / 380 + i * 1.7));
    x.fillStyle = PYT_SMOKE[i % 3];
    x.beginPath(); x.arc(Math.round(cx + Math.cos(a) * rx * d), Math.round(cy + Math.sin(a) * ry * d), r, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
/* Luz de Jaci: quanto do Norte já foi acalmado (chefes de dia e de noite de Ananindeua e Belém). Clareia as noites e
   descobre a lua da faixa do anoitecer (moonCanvas). */
// chefes do Norte (zonas de Ananindeua e Belém), de dia e de noite: as zonas de outras regiões ficam de fora
const NORTE_BOSSES = () => Object.keys(ZONES).filter(z => ["ananindeua", "belem"].includes(cityOf(z))).flatMap(z => [z, NIGHT_ZONES[z] ? z + ":noite" : null]).filter(Boolean);
const jaciLight = () => { const all = NORTE_BOSSES(); return all.filter(k => BS()[k]).length / all.length; };
/* Calma de Guaraci: no Nordeste a fumaça secou tudo e o sol ficou bravo; com os chefes de lá (São Luís, Teresina,
   Recife e Petrolina, de dia e de noite) acalmados, a chuva volta e o capítulo fecha */
const NORDESTE_BOSSES = () => Object.keys(ZONES).filter(z => CITY[cityOf(z)].map === "nordeste").flatMap(z => [z, NIGHT_ZONES[z] ? z + ":noite" : null]).filter(Boolean);
const guaraciCalm = () => { const all = NORDESTE_BOSSES(); return all.filter(k => BS()[k]).length / all.length; };
/* Brilho das estrelas (jasytatá): no Centro-Oeste a fumaça das queimadas apagou o céu enorme do cerrado; com os chefes de
   lá (Cuiabá, Bonito e Brasília, de dia e de noite) acalmados, as estrelas voltam e o capítulo fecha */
const CENTROESTE_BOSSES = () => Object.keys(ZONES).filter(z => CITY[cityOf(z)].map === "centroeste").flatMap(z => [z, NIGHT_ZONES[z] ? z + ":noite" : null]).filter(Boolean);
const estrelaCalm = () => { const all = CENTROESTE_BOSSES(); return all.filter(k => BS()[k]).length / all.length; };
/* Lua sobre as cidades: no Sudeste a fumaça se escondeu na luz dos postes e ninguém olha pro céu; com os chefes de lá
   (BH, Ouro Preto, Rio e São Paulo, de dia e de noite) acalmados, falta luz na cidade, todo mundo vê Jaci e o capítulo fecha */
const SUDESTE_BOSSES = () => Object.keys(ZONES).filter(z => CITY[cityOf(z)].map === "sudeste").flatMap(z => [z, NIGHT_ZONES[z] ? z + ":noite" : null]).filter(Boolean);
const luaCidade = () => { const all = SUDESTE_BOSSES(); return all.filter(k => BS()[k]).length / all.length; };
// Pytuna aparece na exploração: a fumaça chega perto do Rhanon, fala (narra) e o vento leva ela embora
function pytunaScene(lines, done) {
  if (!EX) return narrate(lines, done);
  EX.locked = true; exKeys.clear();
  EX.pyt = {t0: performance.now(), x: EX.hero.x + 28, y: EX.hero.y - 16};   // do lado do Rhanon, na altura do peito
  sfx("rugidoChefe"); musicStart("pytuna");   // o tema de Pytuna toca enquanto ele está em cena
  setTimeout(() => narrate(lines, () => {
    if (!EX || !EX.pyt) return done && done();
    EX.pyt.leave = performance.now(); sfx("esquiva");
    setTimeout(() => { if (EX) { EX.pyt = null; EX.locked = false; musicStart("local"); } if (done) done(); }, 1200);
  }), 900);
}
// desenho na exploração (chamado no fim do quadro): chega crescendo, fica, e sai voando para baixo (para o Sul)
function drawPytuna(x, cx, cy, now) {
  const p = EX.pyt; if (!p) return;
  const inK = Math.min(1, (now - p.t0) / 800), out = p.leave ? Math.min(1, (now - p.leave) / 1100) : 0;
  // no canto da fase (chefe lá no alto da trilha) a fumaça ficava fora da tela: segura ela dentro, com folga
  const M = 34, sx = Math.max(M, Math.min(VIEW_W - M, p.x - cx)), sy = Math.max(M + 18, Math.min(VIEW_H - M - 70, p.y - cy));   // em cima a faixa do HUD, embaixo o painel da fala
  drawSmoke(x, sx + out * 30, sy + out * 120, 1.2 * inK + out, now, (1 - out) * .95);
}
// fim de capítulo (Norte, Nordeste): faixa grande com letras de recorte
function chapterBanner(title, sub) {
  const b = document.createElement("div"); b.className = "chapter"; b.setAttribute("aria-live", "polite");
  b.innerHTML = `<h2 class="title"></h2><p>${sub}</p>`; document.body.appendChild(b);
  ransom(b.querySelector("h2"), [title.toUpperCase()], 11); levelUpJingle();
  setTimeout(() => b.classList.add("out"), 4200); setTimeout(() => b.remove(), 5000);
}
// depois do comentário do Pajé sobre um chefe: Pytuna (se for o último de uma cidade) e o fim do Norte, do Nordeste, do
// Centro-Oeste ou do Sudeste, nessa ordem
function bossStory(id, done) {
  const steps = [];
  // ainda não viu o Pytuna (nenhuma noite na mata): ele se apresenta aqui, e a cena da primeira noite não repete
  if (NARRA_PYT[id] && !G.narrated["pyt_" + id]) steps.push(next => {
    const first = !G.narrated.pyt_noite && NARRA_PYT[id + "_primeiro"];
    G.narrated["pyt_" + id] = true; if (first) G.narrated.pyt_noite = true; save(); pytunaScene(first || NARRA_PYT[id], next);
  });
  if (jaciLight() >= 1 && !G.narrated.norte_fim) steps.push(next => {
    G.narrated.norte_fim = true; save(); musicStart("jaci");   // a lua volta inteira: o tema de Jaci
    narrate(NARRA_PYT.norte, () => { setTimeout(() => { if (EX) musicStart("local"); }, 5200); chapterBanner(t("Fim do Norte"), t("A história continua no Nordeste: o voo sai do Aeroporto de Belém.")); setTimeout(next, 1500); });
  });
  if (guaraciCalm() >= 1 && !G.narrated.nordeste_fim) steps.push(next => {
    G.narrated.nordeste_fim = true; save(); musicStart("jaci");   // a chuva volta no sertão: o tema da esperança
    narrate(NARRA_PYT.nordeste, () => { setTimeout(() => { if (EX) musicStart("local"); }, 5200); chapterBanner(t("Fim do Nordeste"), t("A história continua no Centro-Oeste: o voo sai do Aeroporto do Recife.")); setTimeout(next, 1500); });
  });
  if (estrelaCalm() >= 1 && !G.narrated.centroeste_fim) steps.push(next => {
    G.narrated.centroeste_fim = true; save(); musicStart("jaci");   // as estrelas voltam ao céu do cerrado: o tema da esperança
    narrate(NARRA_PYT.centroeste, () => { setTimeout(() => { if (EX) musicStart("local"); }, 5200); chapterBanner(t("Fim do Centro-Oeste"), t("A história continua no Sudeste: o voo sai do Aeroporto de Brasília.")); setTimeout(next, 1500); });
  });
  if (id === "pytuna" && !G.narrated.fim) steps.push(pytunaFinale);   // o final: a lua, a entrevista e o Pajé
  if (luaCidade() >= 1 && !G.narrated.sudeste_fim) steps.push(next => {
    G.narrated.sudeste_fim = true; save(); musicStart("jaci");   // apagão na cidade grande: todo mundo vê a lua
    narrate(NARRA_PYT.sudeste, () => { setTimeout(() => { if (EX) musicStart("local"); }, 5200); chapterBanner(t("Fim do Sudeste"), t("A história continua no Sul, onde a viagem termina. Em breve!")); setTimeout(next, 1500); });
  });
  const run = () => steps.length ? steps.shift()(run) : done && done();
  run();
}
/* O final, depois de acalmar Pytuna: Jaci volta inteira (tema de Jaci), a faixa "Fim da viagem", o dia seguinte com a
   entrevista (o portfólio dos freelas no meio da conversa), o Pajé fechando a história e os créditos. Depois disso o jogo
   continua aberto (G.fim) */
function pytunaFinale(done) {
  G.narrated.fim = true; G.fim = true; save(); musicStart("jaci");
  narrate(NARRA_FIM.lua, () => {
    chapterBanner(t("Fim da viagem"), t("Jaci brilha inteira de novo."));
    setTimeout(() => dawnWipe(() => { G.night = false; G.day++; save(); if (EX) EX.night = false; }, t("O dia seguinte")), 5000);
    setTimeout(() => narrate(fimEntrevista(), () => narrate(NARRA_FIM.epilogo, () => endCredits(done))), 5000 + DAWN_MS);
  });
}
function fimEntrevista() {
  const prog = Object.keys(G.portfolio || {}).filter(k => FREELAS[k]).map(k => FREELAS[k].prog), L = NARRA_FIM.entrevista.slice();
  if (prog.length) L.splice(2, 0, {e: t("Vi o teu portfólio: {lista}. Tudo feito na estrada?", {lista: prog.join(", ")})});
  return L;
}
/* créditos do fim, como nos jogos grandes: sobem devagar com o tema de Jaci (CREDITOS e CRED_ELENCO em data/narration.js;
   os chefes e os freelas vêm dos dados, os que faltam aparecem apagados). Z/Enter segura = mais rápido, X/Esc pula.
   No fim, o cartão com a viagem do jogador, "Obrigado por jogar!" e "Continuar jogando" */
function endCredits(done) {
  const b = document.createElement("div"); b.className = "creditos rolando"; b.setAttribute("role", "dialog");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const sec = (h, body) => `<section><h3>${esc(h)}</h3>${body}</section>`;
  const chefes = ANIMALS.filter(a => a.boss && a.id !== "pytuna"), freelas = Object.keys(FREELAS);
  let html = `<div class="cred-logo"><p class="nome">Jaci: The Fading Moon</p><p class="sub">${esc(heroAventura())}</p></div>`;
  html += CREDITOS.map(c => sec(t(c.h), c.n.map(n => `<p class="cn">${esc(n)}</p>`).join("") + (c.d ? `<p class="cd">${esc(t(c.d))}</p>` : ""))).join("");
  const par = [[heroName() + " Macley", t("quem viajou")], [parName() + " Macley", t("quem esperou em Curitiba")]];
  html += sec(t("Elenco"), par.map(([n, d]) => `<p class="cn">${esc(n)}</p><p class="cd">${esc(d)}</p>`).join("") + CRED_ELENCO.map(([n, d]) => `<p class="cn">${esc(t(n))}</p><p class="cd">${esc(t(d))}</p>`).join("")
    + freelas.map(k => `<p class="cn">${esc(FREELAS[k].client)}</p><p class="cd">${esc(t("cliente do {freela}", {freela: FREELAS[k].n}))}</p>`).join(""));
  html += sec(t("Os chefes do caminho"), `<p class="cd">${esc(t("{n} de {total} acalmados", {n: chefes.filter(a => bossBeaten(a.id)).length, total: chefes.length}))}</p><div class="cred-chefes"></div>`);
  html += sec(t("Feito com"), `<p class="cd">${esc(t("HTML, CSS e JavaScript, sem nenhuma biblioteca."))}</p><p class="cd">${esc(t("Letras: Lilita One, Lora e Nunito (Google Fonts)."))}</p>`);
  html += sec(t("Agradecimentos"), `<p class="cd">${esc(t("Ao folclore brasileiro, aos bichos do Brasil e a você, que jogou até aqui."))}</p>`);
  b.innerHTML = `<div class="rolo">${html}</div><p class="cred-dica"></p>`;
  const grid = b.querySelector(".cred-chefes");
  chefes.forEach(a => {   // cada chefe com o desenho dele; o que ainda não foi acalmado fica de silhueta
    const ok = bossBeaten(a.id), src = beastFrame(a.id), fig = document.createElement("figure");
    if (src) {
      const c = document.createElement("canvas"); c.width = src.width; c.height = src.height; const x = c.getContext("2d"); x.drawImage(src, 0, 0);
      if (!ok) { x.globalCompositeOperation = "source-in"; x.fillStyle = "#24304a"; x.fillRect(0, 0, c.width, c.height); }
      else c.style.filter = (beastTint(a) + " drop-shadow(0 0 5px rgba(255,240,190,.55))").trim();   // acalmado: com a cor dele e o brilho do luar
      c.style.width = Math.round(src.width / BEAST_K * 2) + "px"; fig.append(c);
    }
    fig.insertAdjacentHTML("beforeend", `<figcaption>${ok ? esc(a.name) : "???"}</figcaption>`);
    if (!ok) fig.className = "falta";
    grid.append(fig);
  });
  const dica = b.querySelector(".cred-dica");
  dica.textContent = isTouch() ? t("Segure para acelerar · toque em Pular") : t("Segure {z} para acelerar · {x} pula", padVars());
  if (isTouch()) { const pul = document.createElement("button"); pul.type = "button"; pul.className = "cred-pular"; pul.textContent = t("Pular"); b.append(pul); pul.addEventListener("click", ev => { ev.stopPropagation(); fim(); }); }
  document.body.appendChild(b); musicStart("creditos");   // os temas do Rhanon e de Jaci emendados (music.js)
  const rolo = b.querySelector(".rolo"), H = rolo.offsetHeight, V = b.clientHeight;
  const anim = rolo.animate([{transform: `translateY(${V}px)`}, {transform: `translateY(${-H}px)`}], {duration: Math.max(30000, (H + V) * 20), easing: "linear", fill: "forwards"});
  const fast = on => { anim.playbackRate = on ? 5 : 1; };
  let acabou = false;
  const key = ev => {
    if (acabou) return;
    if (["z", "Z", "Enter", " "].includes(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); fast(ev.type === "keydown"); }
    else if (["x", "X", "Escape"].includes(ev.key) && ev.type === "keydown") { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) fim(); }
  };
  const down = () => fast(true), up = () => fast(false);
  window.addEventListener("keydown", key, true); window.addEventListener("keyup", key, true);
  b.addEventListener("pointerdown", down); b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
  anim.finished.then(fim, () => {});
  function fim() {
    if (acabou) return; acabou = true;
    window.removeEventListener("keydown", key, true); window.removeEventListener("keyup", key, true);
    anim.cancel(); b.remove(); endCard(done, chefes, freelas);
  }
}
// o cartão depois dos créditos: a viagem em números, o que ainda dá para fazer e "Continuar jogando" (Z, Enter ou X fecham)
function endCard(done, chefes, freelas) {
  const nc = chefes.filter(a => bossBeaten(a.id)).length, nf = freelas.filter(k => G.portfolio && G.portfolio[k]).length;
  const nb = ANIMALS.filter(a => G.bestiary[a.id] && G.bestiary[a.id].seen).length;
  const linha = (k, v) => `<li><span>${k}</span><b>${v}</b></li>`;
  const falta = [nc < chefes.length && t("acalmar os chefes que faltam (de noite também)"), nf < freelas.length && t("entregar os freelas que faltam"),
    nb < ANIMALS.length && t("completar o caderno de bichos")].filter(Boolean);
  const b = document.createElement("div"); b.className = "creditos"; b.setAttribute("role", "dialog");
  b.innerHTML = `<h2 class="title"></h2><p class="nome">Jaci: The Fading Moon</p><p class="sub">${heroAventura()}</p>`
    + `<p>${t("Do Tapajós a Curitiba, o menino acalmou os bichos do Brasil inteiro, devolveu a lua pro avô e reencontrou a Franciscane.")}</p>`
    + `<ul class="viagem">${linha(t("Nível"), G.lv)}${linha(t("Dias na estrada"), G.day || 1)}${linha(t("Chefes acalmados"), `${nc}/${chefes.length}`)}`
    + `${linha(t("Freelas entregues"), `${nf}/${freelas.length}`)}${linha(t("Bichos no caderno"), `${nb}/${ANIMALS.length}`)}</ul>`
    + (falta.length ? `<p class="falta">${t("O Brasil continua aberto. Ainda dá para: {lista}.", {lista: falta.join(", ")})}</p>` : `<p class="falta">${t("Tu fez tudo. Pai d'égua!")}</p>`)
    + `<p class="obrigado">${t("Obrigado por jogar!")}</p><button class="cmd" type="button"><span>${t("Continuar jogando")}</span></button>`;
  document.body.appendChild(b); ransom(b.querySelector("h2"), [t("Fim").toUpperCase()], 7); levelUpJingle();
  const btn = b.querySelector("button"), key = ev => {
    if (!["z", "Z", "Enter", " ", "x", "X", "Escape"].includes(ev.key)) return;
    ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) btn.click();
  };
  setTimeout(() => window.addEventListener("keydown", key, true), 600);   // o Z que pulou os créditos não fecha o cartão
  btn.addEventListener("click", () => { window.removeEventListener("keydown", key, true); b.remove(); if (EX) musicStart("local"); if (done) done(); });
  setTimeout(() => btn.focus(), 300);
}
// dica quando o jogador perde duas lutas seguidas: a primeira que servir, na ordem
function pajeHint() {
  const z = G.loseZone && ZONES[G.loseZone] && zoneDef(G.loseZone);
  const luar = Object.entries(CHARMS).some(([id, it]) => !G.owned[id] && Object.entries(it.craft).every(([k, n]) => (G.pelts[k] || 0) >= n));   // dá para fazer um talismã
  const w = z && (ELEM_OF[z.boss] || [])[0], sp = w && SPECIALS.find(q => q.elem === w);   // o chefe dali é fraco contra um elemento que o Rhanon ainda não tem
  return skillPoints() ? NARRA_HINT.pontos : !G.equip.ranged && G.lv >= 4 ? NARRA_HINT.arco : luar && !G.equip.amulet ? NARRA_HINT.talisma
    : sp && specialLock(sp) && NARRA_HINT[w] ? NARRA_HINT[w] : z && G.lv < (z.lv || 1) + 1 ? NARRA_HINT.nivel : NARRA_HINT.tempo;
}
function setupNarration() {
  $("narra").addEventListener("click", narraPress);
  document.addEventListener("keydown", ev => {
    if ($("narra").hidden) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (ev.repeat) return;
    if (ev.key === "Escape") narraEnd();
    else if (["z", "Z", "Enter", " ", "x", "X"].includes(ev.key)) narraPress();
  }, true);
}
