/* Tela de habilidades (H na exploração, botão no HUD e na bolsa): a teia de SKILL_WEB (data/skills.js). As três primeiras
   ficam em volta da lua de Jaci, no meio; aprender um nó libera todos os vizinhos ligados a ele (inclusive as pontes entre
   caminhos, na borda). Setas vão para o nó mais perto na direção apertada (como nos mapas), Z aprende, X/Esc/H fecham.
   G.skills guarda os degraus aprendidos ({g1: true...}); os pontos vêm do nível (1 por nível acima do 1). */
let SK_SEL = "g1";   // nó escolhido
const skillNode = id => SKILL_TREES.flatMap(tr => tr.nodes).find(n => n.id === id);
const skillSpent = () => Object.keys(G.skills || {}).reduce((a, id) => a + (skillNode(id)?.cost || 0), 0);
const skillPoints = () => Math.max(0, G.lv - 1 - skillSpent());
// posição de cada nó na teia (x, y em torno do meio), anel e vizinhos; montado uma vez
let SK_WEB = null;
function skillWeb() {
  if (SK_WEB) return SK_WEB;
  const W = SKILL_WEB, nodes = {}, raio = r => 62 + (r - 1) * 58;
  SKILL_TREES.forEach(tr => Object.entries(W.lugares[tr.id]).forEach(([slot, id]) => {
    const [r, off] = W.forma[slot], a = (W.setor[tr.id] + off) * Math.PI / 180;
    nodes[id] = {id, tr, nd: tr.nodes.find(n => n.id === id), r, x: Math.cos(a) * raio(r), y: Math.sin(a) * raio(r), viz: []};
  }));
  const fios = [];
  SKILL_TREES.forEach(tr => W.liga.forEach(([a, b]) => fios.push([W.lugares[tr.id][a], W.lugares[tr.id][b], false])));
  W.pontes.forEach(([a, b]) => fios.push([a, b, true]));
  fios.forEach(([a, b]) => { nodes[a].viz.push(b); nodes[b].viz.push(a); });
  return (SK_WEB = {nodes, fios, raio});
}
// nó livre para aprender: no meio (anel 1) ou ligado a um já aprendido, e com pontos que bastem
function skillState(id) {
  const w = skillWeb().nodes[id];
  if (G.skills[id]) return "learned";
  if (w.r > 1 && !w.viz.some(v => G.skills[v])) return "locked";
  return skillPoints() >= w.nd.cost ? "open" : "short";
}
// ícone do nó (traço em 16x16 em volta do centro): status pela cor do caminho, efeito pelo tipo
const SK_ICON_OF = n => n.atk ? "lanca" : n.def ? "escudo" : n.hp ? "coracao" : n.sp ? "gota" : {aliado: "pata", fiel: "pata", jaci: "lua", luar: "lua", estrelas: "estrela", cura: "folha", cura2: "folha", regen: "folha", vento: "folha", mira: "olho", faro: "olho", laco: "cipo", dupla: "lanca2", investida: "lanca2", flecha2: "flecha", furia2: "fogo", furia4: "fogo", furia_guarda: "fogo", perfeito: "lanca", bloqueio: "escudo", bloqueio2: "escudo", revide: "escudo"}[n.fx] || "estrela";
const SK_ICON = {
  lanca: "M-7 7 L5 -5 M2 -7 L7 -7 L7 -2", lanca2: "M-8 4 L4 -8 M-4 8 L8 -4", escudo: "M0 -8 L7 -5 L6 3 L0 8 L-6 3 L-7 -5Z",
  coracao: "M0 7 L-7 0 A4 4 0 0 1 0 -5 A4 4 0 0 1 7 0Z", gota: "M0 -8 L5 1 A5 5 0 1 1 -5 1Z", estrela: "M0 -8 L2 -2 L8 -2 L3 2 L5 8 L0 4 L-5 8 L-3 2 L-8 -2 L-2 -2Z",
  lua: "M3 -8 A8 8 0 1 0 3 8 A6 6 0 1 1 3 -8Z", pata: "M-4 3 A4 3 0 1 0 4 3 A4 3 0 1 0 -4 3 M-6 -3 a2 2 0 1 0 .1 0 M6 -3 a2 2 0 1 0 .1 0 M-2 -7 a2 2 0 1 0 .1 0 M2 -7 a2 2 0 1 0 .1 0",
  folha: "M-6 6 Q-6 -6 7 -7 Q6 6 -6 6Z M-6 6 L3 -3", olho: "M-8 0 Q0 -7 8 0 Q0 7 -8 0Z M0 -2.5 a2.5 2.5 0 1 0 .1 0", cipo: "M-7 -6 Q7 -6 0 0 Q-7 6 7 6",
  flecha: "M-8 8 L6 -6 M1 -7 L7 -7 L7 -1 M-8 4 L-4 8", fogo: "M0 -8 Q6 -2 4 4 Q2 8 0 8 Q-5 8 -5 3 Q-5 -1 -1 -3 Q-1 1 1 2 Q2 -3 0 -8Z"
};
const SK_LINE = new Set(["lanca", "lanca2", "flecha", "cipo"]);   // ícones só de traço (sem preenchimento)
function skillSvg() {
  const {nodes, fios, raio} = skillWeb();
  let s = `<svg class="sk-teia" viewBox="-380 -370 760 740" role="img" aria-label="${t("Teia de habilidades")}">
    <defs><radialGradient id="skLuz"><stop offset="0" stop-color="#2c4a2e"/><stop offset="1" stop-color="#0f1a12"/></radialGradient></defs>
    <circle r="365" fill="url(#skLuz)"/>`;
  for (let r = 1; r <= 6; r++) s += `<circle r="${raio(r)}" fill="none" stroke="#24402a" stroke-width="1.5" stroke-dasharray="2 6"/>`;
  // fios de cipó: aceso entre dois aprendidos, firme quando um lado foi aprendido, pontilhado no resto
  for (const [a, b, ponte] of fios) {
    const A = nodes[a], B = nodes[b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const cx = ponte ? mx * 1.25 : mx - (B.y - A.y) * .1, cy = ponte ? my * 1.25 : my + (B.x - A.x) * .1, d = `M${A.x.toFixed(1)} ${A.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}`;
    const aceso = G.skills[a] && G.skills[b], meio = G.skills[a] || G.skills[b];
    s += `<path d="${d}" fill="none" stroke="#0a120c" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="${d}" class="sk-fio${aceso ? " aceso" : ""}" fill="none" stroke="${aceso ? A.tr.color : meio ? "#6b8a4a" : "#3a5232"}" stroke-width="${aceso ? 4 : 3}" stroke-linecap="round"${aceso ? ' stroke-dasharray="8 8"' : meio ? "" : ' stroke-dasharray="3 5"'}/>`;
  }
  const meio3 = SKILL_TREES.map(tr => nodes[SKILL_WEB.lugares[tr.id][1]]);
  meio3.forEach((A, i) => { const B = meio3[(i + 1) % 3]; s += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#6b4a24" stroke-width="3" stroke-dasharray="2 4"/>`; });
  s += `<circle r="16" fill="#3a2a16" stroke="#ffd23a" stroke-width="2"/><path d="${SK_ICON.lua}" fill="#f4ecd8" transform="scale(.9)"/>`;   // Jaci no meio
  for (const w of Object.values(nodes)) {
    const st = skillState(w.id), R = w.r >= 5 ? 19 : 16, cor = w.tr.color, apagado = st === "locked", ic = SK_ICON_OF(w.nd);
    const tinta = st === "learned" ? "#f4ecd8" : apagado ? "#3a5232" : cor;
    s += `<g class="sk-no ${st}" data-id="${w.id}" transform="translate(${w.x.toFixed(1)} ${w.y.toFixed(1)})">`;
    if (st === "open") s += `<circle r="${R + 7}" fill="none" stroke="${cor}" stroke-width="3" class="sk-pulsa"/>`;
    if (w.id === SK_SEL) s += `<circle r="${R + 9}" fill="none" stroke="#ffd23a" stroke-width="3"/>`;
    s += `<circle r="${R + 3}" fill="#0a120c"/><circle r="${R}" fill="${st === "learned" ? cor : "#1d2e21"}" stroke="${st === "learned" ? "#f4ecd8" : apagado ? "#3a5232" : cor}" stroke-width="3"/>`;
    s += `<path d="${SK_ICON[ic]}" fill="${SK_LINE.has(ic) ? "none" : tinta}" stroke="${tinta}" stroke-width="2" stroke-linecap="round" transform="scale(${R / 16})"/></g>`;
  }
  return s + "</svg>";
}
function openSkills(msg) {
  vit(); audio();
  const o = $("habil"), box = o.querySelector(".info"), w = skillWeb().nodes[SK_SEL] || skillWeb().nodes.g1, nd = w.nd, st = skillState(w.id);
  box.innerHTML = `<div class="sk-cab"><h2>${t("Habilidades")}</h2><p class="hint">${t("Pontos para gastar: {n} · ganha 1 a cada nível", {n: skillPoints()})}</p></div>${skillSvg()}`;
  box.querySelectorAll(".sk-no").forEach(g => g.addEventListener("click", () => { if (g.dataset.id === SK_SEL) skillLearn(); else { SK_SEL = g.dataset.id; sfx("blip"); openSkills(); } }));
  // ficha do nó escolhido: tamanho fixo, a tela não muda de largura com a descrição
  const card = document.createElement("div"); card.className = "sk-card"; card.style.setProperty("--sk", w.tr.color);
  card.innerHTML = `<h3>${nd.n}</h3><span class="sk-custo">${w.tr.n} · ${nd.cost === 1 ? t("1 ponto") : t("{n} pontos", {n: nd.cost})}</span><p>${nd.d}</p><p class="hint">${msg || {learned: t("Já aprendida."), locked: t("Aprenda antes uma habilidade ligada a esta."), short: t("Faltam pontos: suba de nível."), open: padStyle() ? t("{z} aprende.", padVars()) : t("Z aprende.")}[st]}</p>`;
  box.append(card);
  box.insertAdjacentHTML("beforeend", `<p class="hint eq-keys">${padStyle() ? t("{dir} escolhem · {z} aprende · {x} fecha", padVars()) : t("Setas escolhem · Z aprende · X fecha")}</p>`);
  btn(t("Fechar"), closeSkills, false, box);
  if (o.hidden) { o.hidden = false; sfx("blip"); }
}
// setas: o nó mais à frente e menos de lado na direção apertada
function skillMove(dx, dy) {
  const nodes = skillWeb().nodes, a = nodes[SK_SEL]; let best = null, score = Infinity;
  for (const b of Object.values(nodes)) {
    const vx = b.x - a.x, vy = b.y - a.y, along = vx * dx + vy * dy; if (b.id === SK_SEL || along <= 0) continue;
    const s = along + Math.abs(vx * dy - vy * dx) * 2; if (s < score) { score = s; best = b.id; }
  }
  if (best) { SK_SEL = best; sfx("blip"); openSkills(); }
}
function skillLearn() {
  const nd = skillNode(SK_SEL);
  if (skillState(SK_SEL) !== "open") { sfx("blip"); return; }
  G.skills[nd.id] = true; vit(); save(); sfx("more");
  if (EX && !$("explore").hidden) exHud();
  openSkills(t("Aprendeu: {hab}.", {hab: nd.n}));
}
function closeSkills() {
  $("habil").hidden = true; sfx("blip");
  if (EX && !$("explore").hidden && EX.dialog === "inventario") exOpenDialog("inventario");
}
// Pajé: esquecer tudo devolve os pontos (custa SKILL_RESET)
function skillReset() {
  const n = SKILL_RESET(G.lv);
  if (G.money < n || !Object.keys(G.skills).length) return;
  G.money -= n; G.skills = {}; vit(); save(); sfx("look");
  localDone("aldeia", t("O Pajé sopra a fumaça: o Rhanon esqueceu as habilidades e recebeu os pontos de volta."));
}
function setupSkills() {
  $("habil").addEventListener("click", ev => { if (ev.target === $("habil")) closeSkills(); });
  $("exSkills").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp && EX.dialog !== "tutorial") openSkills(); });
  // com a tela aberta o teclado é só dela
  document.addEventListener("keydown", ev => {
    if ($("habil").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.stopImmediatePropagation();
    const k = ev.key, mv = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[k];
    if (mv) { ev.preventDefault(); skillMove(...mv); }
    else if ((k === "Enter" || k === " " || k === "z" || k === "Z") && !ev.repeat) { ev.preventDefault(); skillLearn(); }
    else if (["Escape", "x", "X", "h", "H", "i", "I"].includes(k) && !ev.repeat) { ev.preventDefault(); closeSkills(); }
  }, true);
}
