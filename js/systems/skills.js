/* Tela de habilidades (H na exploração, botão no HUD e na bolsa): as três árvores de SKILL_TREES (data/skills.js) lado
   a lado, cada degrau um botão. Setas andam (lados trocam de árvore, cima/baixo de degrau), Z aprende, X/Esc/H fecham.
   G.skills guarda os degraus aprendidos ({g1: true...}); os pontos vêm do nível (1 por nível acima do 1). */
let SK_SEL = {t: 0, i: 0};   // árvore e degrau escolhidos
const skillNode = id => SKILL_TREES.flatMap(tr => tr.nodes).find(n => n.id === id);
const skillSpent = () => Object.keys(G.skills || {}).reduce((a, id) => a + (skillNode(id)?.cost || 0), 0);
const skillPoints = () => Math.max(0, G.lv - 1 - skillSpent());
// degrau livre para aprender: o anterior da mesma árvore já aprendido e pontos que bastem
function skillState(tr, i) {
  const nd = tr.nodes[i];
  if (G.skills[nd.id]) return "learned";
  if (i && !G.skills[tr.nodes[i - 1].id]) return "locked";
  return skillPoints() >= nd.cost ? "open" : "short";
}
function openSkills(msg) {
  vit(); audio();
  const o = $("habil"), box = o.querySelector(".info"), pts = skillPoints();
  box.innerHTML = `<h2>${t("Habilidades")}</h2><p class="hint">${t("Pontos para gastar: {n} · ganha 1 a cada nível", {n: pts})}</p>`;
  const wrap = document.createElement("div"); wrap.className = "sk-wrap";
  SKILL_TREES.forEach((tr, ti) => {
    const col = document.createElement("div"); col.className = "sk-tree"; col.style.setProperty("--sk", tr.color);
    col.innerHTML = `<h3>${tr.n}</h3><small>${tr.d}</small>`;
    tr.nodes.forEach((nd, i) => {
      const st = skillState(tr, i), b = document.createElement("button"), sel = SK_SEL.t === ti && SK_SEL.i === i;
      b.type = "button"; b.className = `sk-node ${st}` + (sel ? " sel" : "");
      b.innerHTML = `<b>${nd.n}</b><span>${st === "learned" ? t("aprendida") : nd.cost === 1 ? t("1 ponto") : t("{n} pontos", {n: nd.cost})}</span>`;
      b.addEventListener("click", () => { if (sel) skillLearn(); else { SK_SEL = {t: ti, i}; sfx("blip"); openSkills(); } });
      col.append(b);
    });
    wrap.append(col);
  });
  box.append(wrap);
  // degrau escolhido: o que ele faz e por que ainda não dá
  const tr = SKILL_TREES[SK_SEL.t], nd = tr.nodes[SK_SEL.i], st = skillState(tr, SK_SEL.i), card = document.createElement("div");
  card.className = "sk-card";
  card.innerHTML = `<h3>${nd.n}</h3><p>${nd.d}</p><p class="hint">${{learned: t("Já aprendida."), locked: t("Aprenda antes a habilidade de cima."), short: t("Faltam pontos: suba de nível."), open: t("Z aprende.")}[st]}</p>`;
  box.append(card);
  if (msg) lh(msg, box);
  box.insertAdjacentHTML("beforeend", `<p class="hint eq-keys">${t("Setas escolhem · Z aprende · X fecha")}</p>`);
  btn(t("Fechar"), closeSkills, false, box);
  if (o.hidden) { o.hidden = false; sfx("blip"); }
}
function skillLearn() {
  const tr = SKILL_TREES[SK_SEL.t], nd = tr.nodes[SK_SEL.i];
  if (skillState(tr, SK_SEL.i) !== "open") { sfx("blip"); return; }
  G.skills[nd.id] = true; vit(); save(); sfx("more");
  if (EX && !$("explore").hidden) exHud();
  openSkills(t("Aprendeu: {hab}.", {hab: nd.n}));
}
function closeSkills() {
  $("habil").hidden = true; sfx("blip");
  if (EX && !$("explore").hidden && EX.dialog === "inventario") exOpenDialog("inventario");
}
// xamã: esquecer tudo devolve os pontos (custa SKILL_RESET)
function skillReset() {
  const n = SKILL_RESET(G.lv);
  if (G.money < n || !Object.keys(G.skills).length) return;
  G.money -= n; G.skills = {}; vit(); save(); sfx("look");
  localDone("aldeia", t("O xamã sopra a fumaça: o Rhanon esqueceu as habilidades e recebeu os pontos de volta."));
}
function setupSkills() {
  $("habil").addEventListener("click", ev => { if (ev.target === $("habil")) closeSkills(); });
  $("exSkills").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp && EX.dialog !== "tutorial") openSkills(); });
  // com a tela aberta o teclado é só dela
  document.addEventListener("keydown", ev => {
    if ($("habil").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.stopImmediatePropagation();
    const k = ev.key, n = SKILL_TREES.length, m = SKILL_TREES[SK_SEL.t].nodes.length;
    const mv = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[k];
    if (mv) { ev.preventDefault(); SK_SEL = {t: (SK_SEL.t + mv[0] + n) % n, i: Math.max(0, Math.min(m - 1, SK_SEL.i + mv[1]))}; sfx("blip"); openSkills(); }
    else if ((k === "Enter" || k === " " || k === "z" || k === "Z") && !ev.repeat) { ev.preventDefault(); skillLearn(); }
    else if (["Escape", "x", "X", "h", "H", "i", "I"].includes(k) && !ev.repeat) { ev.preventDefault(); closeSkills(); }
  }, true);
}
