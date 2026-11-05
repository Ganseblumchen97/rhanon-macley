/* Notebook do Rhanon ligado ("Rhanon OS"): quase a tela toda, com a moldura do notebook, o papel de parede da região
   (o mesmo desenho da tela inicial, paintRegionArt em gfx/scenery.js), os ícones dos apps e a barra com Wi-Fi, bateria e
   o dia. Cada app abre numa janela por cima da área de trabalho:
   - Caderno: o caderno de bichos (journalFill em journal.js); depois de ligado, ele só abre por aqui
   - E-mail: os pedidos de freela (FREELAS); o e-mail chega quando o Rhanon entra na cidade do cliente (nbMailArrive),
     e depurar e entregar só funcionam onde tem Wi-Fi (fases seguras das cidades, nbWifi)
   - Programas: os freelas entregues e o que cada um faz
   - Peças: a tela das peças de sempre (nbView em explore.js)
   Antes de ligar, a bolsa mostra só a tela das peças e o caderno é o de papel. Abre com N ou pela bolsa/HUD.
   G.mail[id]: 1 = chegou e não foi lido, 2 = lido. Save antigo com o freela começado conta como lido (nbMailIn). */
const NB_APPS = [{id: "caderno"}, {id: "mail"}, {id: "programas"}, {id: "pecas"}];
const nbAppName = id => ({caderno: t("Caderno"), mail: t("E-mail"), programas: t("Programas"), pecas: t("Peças")})[id];
// ícones dos apps em pixel art, 12x12: cada letra é uma cor (. = vazio)
const NB_ICON_PAL = {k: "#1a1426", w: "#fff8e0", y: "#ffd23a", o: "#e8a040", r: "#e5001c", g: "#3f9a5c", b: "#3aa0e8", d: "#1a5aa8", s: "#a8bccb", n: "#8a5a2a", p: "#c9a46a"};
const NB_ICONS = {
  caderno: ["..kkkkkkkk..", ".knnnnnnnnk.", ".knwwwwwwnk.", ".knwkkkkwnk.", ".knwwwwwwnk.", ".knwkkkkwnk.", ".knwwwwwwnk.", ".knwkkkwwnk.", ".knwwwwwwnk.", ".knnnnnnnnk.", ".knnnnnnnnk.", "..kkkkkkkk.."],
  mail:    ["............", "kkkkkkkkkkkk", "kwwwwwwwwwwk", "kkwwwwwwwwkk", "kwkwwwwwwkwk", "kwwkwwwwkwwk", "kwwwkkkkwwwk", "kwwwwwwwwwwk", "kwwwwwwwwwwk", "kwwwwwwwwwwk", "kkkkkkkkkkkk", "............"],
  programas: ["kkkkkkkkkkk.", "kddddddddddk", "kdsssssssdk.", "kdsssssssdkk", "kdsssssssddk", "kddddddddddk", "kddwwwwwwddk", "kddwwwwkwddk", "kddwwwwkwddk", "kddwwwwwwddk", "kkkkkkkkkkkk", "............"],
  pecas:   ["....kk......", "...kssk.....", "...kssk.....", "....kssk....", ".....kssk...", "......kssk..", ".......ksskk", "......kssssk", ".....kkssssk", "....kpk.kkk.", "...kpk......", "..kkk......."]
};
function nbIconSvg(id) {
  const rows = NB_ICONS[id];
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rows.map((r, y) => [...r].map((c, x) => c === "." ? "" : `<rect x="${x}" y="${y}" width="1" height="1" fill="${NB_ICON_PAL[c]}"/>`).join("")).join("")}</svg>`;
}
let NB_SEL = 0, NB_APP = null, NB_MAIL = null;   // ícone escolhido, app aberto e e-mail aberto
// Wi-Fi: só nas fases seguras das cidades (pensão, mercado, praça, rodoviária); a aldeia e a vila não têm
const nbWifi = () => !!(EX && !$("explore").hidden && EX.st.safe && cityOf(EX.zone) !== "ananindeua");
const nbMailIn = id => !!(G.mail[id] || G.portfolio[id] || G.freela[id]);
const nbMails = () => Object.keys(FREELAS).filter(nbMailIn);
const nbUnread = () => nbMails().filter(id => G.mail[id] === 1).length;
const nbMailPlace = id => SUB[Object.keys(FREELA_AT).find(ph => FREELA_AT[ph] === id)].n;
// ao entrar numa fase: chega o e-mail do freela da cidade, se ainda não chegou
function nbMailArrive() {
  if (!G.nb.on || !EX) return;
  const c = cityOf(EX.zone);
  Object.entries(FREELA_AT).filter(([ph, id]) => cityOf(ph) === c && !nbMailIn(id)).forEach(([, id]) => {
    G.mail[id] = 1; save();
    setTimeout(() => { if (EX && !$("explore").hidden) { exToast(t("Chegou um e-mail de {cliente}! Abre o notebook (N).", {cliente: FREELAS[id].client})); sfx("more"); exHud(); } }, 900);
  });
}

function openNotebook(app, opts = {}) {
  vit(); audio();
  if (!G.nb.on) return;
  if (EX && !$("explore").hidden && EX.dialog) exCloseDialog();
  const o = $("nbos");
  o.hidden = false; sfx("blip");
  nbWall(); nbDesk();
  if (app) nbOpenApp(app, opts); else nbFocusIcon();
}
function closeNotebook() {
  $("nbos").hidden = true; NB_APP = null; sfx("blip");
  if (EX && !$("explore").hidden) exHud();
}
// papel de parede: o desenho da região do mapa aberto, em pixels grandes como o fundo dos mapas
function nbWall() {
  const cv = $("nbosWall"), r = cv.getBoundingClientRect(), reg = TITLE_BG[MAP_REGION] ? MAP_REGION : "norte";
  const k = Math.max(2, Math.round(Math.min(r.width / 260, r.height / 170))), W = Math.ceil(r.width / k), H = Math.ceil(r.height / k);
  if (cv.width === W && cv.height === H && cv.dataset.region === reg) return;
  cv.width = W; cv.height = H; cv.dataset.region = reg;
  paintRegionArt(cv, TITLE_BG[reg]);
}
// área de trabalho: os ícones (o E-mail com a bolinha das mensagens novas) e a barra de baixo
function nbDesk() {
  const box = $("nbosIcons"), un = nbUnread();
  box.innerHTML = NB_APPS.map((a, i) => `<button class="nbos-ic${i === NB_SEL ? " sel" : ""}" type="button" data-i="${i}">${nbIconSvg(a.id)}${a.id === "mail" && un ? `<em class="nbos-badge">${un}</em>` : ""}<span>${nbAppName(a.id)}</span></button>`).join("");
  box.querySelectorAll(".nbos-ic").forEach(b => b.addEventListener("click", () => { NB_SEL = +b.dataset.i; nbOpenApp(NB_APPS[NB_SEL].id); }));
  const wifi = nbWifi();
  $("nbosBar").innerHTML = `<b>▣ Rhanon OS</b><span class="nbos-sp"></span><span class="nbos-wifi${wifi ? "" : " off"}">${t(wifi ? "Wi-Fi" : "sem Wi-Fi")}</span><span class="nbos-bat"><i></i></span><span>${t(G.night ? "Dia {n} · noite" : "Dia {n} · dia", {n: G.day})}</span><button class="nbos-off" type="button">✕ ${t("Desligar")}</button>`;   // fecha o notebook (no celular não tem tecla nem sobra fora)
}
function nbFocusIcon() {
  const bs = [...$("nbosIcons").querySelectorAll(".nbos-ic")];
  bs.forEach((b, i) => b.classList.toggle("sel", i === NB_SEL));
  bs[NB_SEL] && bs[NB_SEL].focus({preventScroll: true});
}
function nbOpenApp(id, opts = {}) {
  NB_APP = id; sfx("blip");
  const win = $("nbosWin"), body = $("nbosBody");
  win.hidden = false; body.scrollTop = 0;
  $("nbosTitle").textContent = nbAppName(id);
  if (id === "caderno") nbCaderno(body, opts.migrate);
  else if (id === "mail") nbMailView(body);
  else if (id === "programas") nbProgramas(body);
  else { body.innerHTML = ""; nbView(body); }
  const first = body.querySelector(".cmd"); if (first) menuSelect(body, menuFirst(body));
}
function nbCloseApp() {
  $("nbosWin").hidden = true; NB_APP = null; NB_MAIL = null; sfx("blip");
  nbDesk(); nbFocusIcon();
}
// Caderno; migrate = o notebook acabou de ligar: o caderno de papel passa para o notebook com uma barrinha enchendo
function nbCaderno(body, migrate) {
  if (!migrate) return journalFill(body, false);
  body.innerHTML = `<div class="nbos-copia"><p>${t("Passando o caderno de papel pro notebook...")}</p><span class="nbos-prog"><i></i></span></div>`;
  const bar = body.querySelector(".nbos-prog i");
  bar.animate([{width: "0%"}, {width: "100%"}], {duration: REDUCE ? 200 : 1800, easing: "steps(12)", fill: "forwards"}).onfinish = () => {
    if (NB_APP !== "caderno" || $("nbos").hidden) return;
    sfx("more"); journalFill(body, false);
    body.insertAdjacentHTML("afterbegin", `<p class="nbos-ok">${t("Pronto! O caderno agora mora aqui, e chegou um e-mail.")}</p>`);
    nbDesk();
  };
}
// E-mail: a lista à esquerda (botões, para as setas andarem) e o e-mail aberto à direita
function nbMailView(body) {
  const ids = nbMails();
  if (!ids.length) { body.innerHTML = `<p class="nbos-vazio">${t("Nenhum e-mail ainda. Os pedidos de freela chegam quando tu entra numa cidade nova.")}</p>`; return; }
  if (!NB_MAIL || !ids.includes(NB_MAIL)) NB_MAIL = ids.find(id => G.mail[id] === 1) || ids[0];
  if (G.mail[NB_MAIL] === 1) { G.mail[NB_MAIL] = 2; save(); }   // abriu: lido
  body.innerHTML = `<div class="nbos-mail"><div class="nbos-lista"></div><div class="nbos-ler"></div></div>`;
  const list = body.querySelector(".nbos-lista"), read = body.querySelector(".nbos-ler"), f = FREELAS[NB_MAIL];
  ids.forEach(id => {
    const g = FREELAS[id], done = G.freela[id] || 0;
    const tag = G.portfolio[id] ? t("entregue") : done >= g.bugs.length ? t("pronto pra entregar") : G.mail[id] === 1 ? t("novo") : t("{n} de {total} bugs", {n: done, total: g.bugs.length});
    btn(`<b>${g.client}</b> <small>${t(g.n)} · ${tag}</small>`, () => { NB_MAIL = id; nbOpenApp("mail"); }, false, list);
    list.lastChild.classList.toggle("aberto", id === NB_MAIL);
  });
  const done = G.freela[NB_MAIL] || 0, wifi = nbWifi(), all = done >= f.bugs.length;
  read.innerHTML = `<p class="nbos-de">${t("De: {cliente} · {lugar}", {cliente: f.client, lugar: nbMailPlace(NB_MAIL)})}</p><p class="nbos-msg">${t(f.ask, {n: f.pay})}</p>`
    + (G.portfolio[NB_MAIL] ? `<p class="nbos-msg resp">${t(f.thanks)}</p><p class="nbos-ok">${t("Entregue · R$ {n}", {n: f.pay})}</p>`
      : `<p class="nbos-ok">${all ? t("Todos os bugs resolvidos!") : t("Bugs resolvidos: {n} de {total}.", {n: done, total: f.bugs.length})}</p>`);
  if (G.portfolio[NB_MAIL]) return;
  if (all) btn(t("Enviar o trabalho · R$ {n}", {n: f.pay}), () => nbDeliver(NB_MAIL), !wifi, read);
  else btn(t(done ? "Depurar o resto, um bug atrás do outro" : "Depurar os bugs, um atrás do outro"), () => nbDebug(NB_MAIL), !wifi, read);
  if (!wifi) read.insertAdjacentHTML("beforeend", `<p class="nbos-semwifi">${t("Sem Wi-Fi aqui. Tem nas pensões, mercados e praças das cidades.")}</p>`);
}
// depurar: fecha o notebook e os bugs entram em sequência (bugChain em combat.js), na fase em que o Rhanon está
function nbDebug(id) {
  if (!nbWifi()) return;
  closeNotebook();
  setTimeout(() => {
    if (!EX || EX.locked) return;
    EX.freela = id;   // freelaHere (explore.js) passa a contar este freela
    const b = BUGS.find(x => x.id === freelaNext(id)), en = makeAnimalEnt(b, Math.floor(EX.hero.x / TILE), Math.floor(EX.hero.y / TILE));
    exStartBattle(en, {});
  }, 200);
}
function nbDeliver(id) {
  if (!nbWifi()) return;
  const f = FREELAS[id];
  G.portfolio[id] = true; G.money += f.pay; save(); sfx("more"); if (EX) exHud();
  nbOpenApp("mail");
  $("nbosBody").querySelector(".nbos-ler").insertAdjacentHTML("beforeend", `<p class="nbos-ok">${t("Freela entregue! +R$ {n}. Programa novo no notebook: {prog}", {n: f.pay, prog: t(f.prog)})}</p>`);
}
function nbProgramas(body) {
  const ids = Object.keys(FREELAS).filter(id => G.portfolio[id]);
  body.innerHTML = ids.length ? ids.map(id => `<div class="nbos-prog-it"><b>${t(FREELAS[id].n)}</b><p>${t(FREELAS[id].prog)}</p></div>`).join("")
    : `<p class="nbos-vazio">${t("Nenhum programa ainda. Entrega um freela pra instalar o primeiro.")}</p>`;
}
// teclado: com o notebook aberto, as teclas são só dele (fase de captura, antes da exploração e dos mapas)
function nbKey(ev) {
  if ($("nbos").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
  ev.stopImmediatePropagation();
  const k = ev.key, back = ["Escape", "x", "X"].includes(k);
  if (NB_APP) {
    if (back && !ev.repeat) { ev.preventDefault(); nbCloseApp(); return; }
    if ((k === "n" || k === "N") && !ev.repeat) { ev.preventDefault(); closeNotebook(); return; }
    const body = $("nbosBody"), arrow = {ArrowLeft: "ArrowUp", ArrowRight: "ArrowDown"}[k];
    if (menuKey(arrow ? {key: arrow, repeat: ev.repeat, preventDefault: () => ev.preventDefault()} : ev, body)) return;
    if (k === "ArrowDown" || k === "ArrowUp") { ev.preventDefault(); body.scrollTop += k === "ArrowDown" ? 60 : -60; }   // app sem botões (Caderno, Programas): rola
    return;
  }
  const mv = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2}[k];
  if (mv) { ev.preventDefault(); NB_SEL = (NB_SEL + mv + NB_APPS.length) % NB_APPS.length; nbFocusIcon(); sfx("blip"); }
  else if (["z", "Z", "Enter", " "].includes(k) && !ev.repeat) { ev.preventDefault(); nbOpenApp(NB_APPS[NB_SEL].id); }
  else if ((back || ["n", "N", "i", "I"].includes(k)) && !ev.repeat) { ev.preventDefault(); closeNotebook(); }
}
function setupNotebook() {
  document.addEventListener("keydown", nbKey, true);
  $("nbos").addEventListener("click", ev => { if (ev.target === $("nbos")) closeNotebook(); });
  $("nbosX").addEventListener("click", nbCloseApp);
  $("nbosBar").addEventListener("click", ev => { if (ev.target.closest(".nbos-off")) closeNotebook(); });
  $("exNb").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp && EX.dialog !== "tutorial") openNotebook(); });
  addEventListener("resize", () => { if (!$("nbos").hidden) nbWall(); });
}
