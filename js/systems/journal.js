/* Caderno de bichos (bestiário) e pedidos dos aldeões.
   Caderno: G.bestiary[id] = {seen, wins}; abre pela bolsa. Pedidos: um aceito por vez (G.quest), oferta do dia/noite em G.offer. */

/* ---------- caderno de bichos ---------- */
function noteSeen(id) { vit(); const b = G.bestiary[id] || (G.bestiary[id] = {seen: true, wins: 0}); b.seen = true; }
// vitória: conta no caderno e no pedido de "vencer" aceito
function noteWin(id) {
  noteSeen(id); G.bestiary[id].wins++;
  const q = G.quest && questById(G.quest.id);
  if (q && q.need.kill === id) G.quest.n = Math.min(q.need.n, G.quest.n + 1);
}
// onde o bicho vive (zonas de dia e de noite, e se é chefe)
function habitat(id) {
  const out = [];
  for (const [z, d] of Object.entries(ZONES)) {
    if (d.boss === id || d.pool.some(([a]) => a === id)) out.push(ZONES[z].n + (d.boss === id ? " (chefe)" : ""));
    const n = NIGHT_ZONES[z];
    if (n && (n.boss === id || n.pool.some(([a]) => a === id))) out.push(t("{zona} à noite", {zona: ZONES[z].n}) + (n.boss === id ? " " + t("(chefe)") : ""));
  }
  return out.join(", ") || "?";
}
function journalCard(a) {
  const b = G.bestiary[a.id], seen = b && b.seen, src = beastFrame(a.id), c = document.createElement("canvas");
  c.width = src ? src.width : 20; c.height = src ? src.height : 20;
  const x = c.getContext("2d");
  if (src) { x.drawImage(src, 0, 0); if (!seen) { x.globalCompositeOperation = "source-in"; x.fillStyle = "#2a1a14"; x.fillRect(0, 0, c.width, c.height); } }   // não visto: só a silhueta
  if (a.tint && seen) c.style.filter = a.tint;
  const card = document.createElement("div"); card.className = "cad-card" + (seen ? "" : " nao-visto");
  card.append(c);
  card.insertAdjacentHTML("beforeend", seen
    ? `<b>${a.name}</b><small>${t("Nv")} ${a.lv}${a.boss ? " · " + t("chefe") : ""} · ${t("vencidos: {n}", {n: b.wins})}</small><small>${habitat(a.id)}</small><p>${ANIMAL_FACTS[a.id] || ""}</p>`
    : `<b>???</b><small>${habitat(a.id)}</small>`);
  return card;
}
function openJournal() {
  vit();
  const o = $("caderno"), box = o.querySelector(".info"), seen = ANIMALS.filter(a => G.bestiary[a.id] && G.bestiary[a.id].seen).length;
  o.classList.toggle("papel", !G.nb.on);   // antes do notebook ligar, o caderno é de papel (desenho à mão); depois, digital
  box.innerHTML = `<h2>${t(G.nb.on ? "Caderno de bichos · digital" : "Caderno de bichos")}</h2><p class="hint">${t("Luz de Jaci: {n} de {total} chefes do Norte acalmados", {n: NORTE_BOSSES().filter(k => BS()[k]).length, total: NORTE_BOSSES().length})}</p><p class="hint">${t("{n} de {total} bichos encontrados. Os que faltam aparecem só como silhueta.", {n: seen, total: ANIMALS.length})}</p><div class="cad-grid"></div>`;
  const grid = box.querySelector(".cad-grid");
  ANIMALS.forEach(a => grid.append(journalCard(a)));
  btn("Fechar", closeJournal, false, box);
  o.hidden = false; sfx("blip"); box.querySelector(".cmd").focus({preventScroll: true}); box.scrollTop = 0;
}
function closeJournal() { $("caderno").hidden = true; sfx("blip"); }

/* ---------- pedidos dos aldeões ---------- */
const questById = id => QUESTS.find(q => q.id === id);
// número "aleatório" fixo para cada dia/noite: o mesmo pedido aparece até o período virar
function seeded(n) { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }
// sorteia (ou mantém) a oferta deste dia/noite; nada se já tem um pedido aceito
function rollOffer() {
  vit();
  if (G.quest) return null;
  const key = G.day * 2 + (G.night ? 1 : 0);
  if (G.offer && G.offer.key === key) return G.offer;
  G.offer = null;
  if (seeded(key) < .6) {   // em 60% dos dias (e das noites) alguém tem um pedido
    const pool = QUESTS.filter(q => !!q.night === G.night && (!q.lv || G.lv >= q.lv) && (G.questsDone[q.id] ?? -9) < G.day - 1);
    if (pool.length) G.offer = {key, id: pool[Math.floor(seeded(key + 7) * pool.length)].id};
  }
  save();
  return G.offer;
}
// ao chegar na aldeia (ou acordar/anoitecer nela): o aldeão com pedido avisa com um somzinho
function announceOffer() {
  if (rollOffer()) { sfx("missao"); exToast(t("{quem} tem um pedido (folha em cima da cabeça).", {quem: VILLAGER_NAME[questById(G.offer.id).giver]})); }
}
const questCount = q => q.need.pelt ? Math.min(q.need.n, G.pelts[q.need.pelt] || 0) : G.quest.n;
const questReady = () => { const q = G.quest && questById(G.quest.id); return !!q && questCount(q) >= q.need.n; };
function questGoal(q) { const a = ANIMALS.find(x => x.id === (q.need.kill || q.need.pelt)); return q.need.kill ? t("vencer {n} × {bicho}", {n: q.need.n, bicho: a.name.toLowerCase()}) : `${q.need.n} × ${peltName(q.need.pelt).toLowerCase()}`; }
const rewardText = r => [r.money && `R$ ${r.money}`, ...Object.entries(r.items || {}).map(([k, n]) => `${ITEMS[k].n} ×${n}`)].filter(Boolean).join(t(" e "));
function questAccept() {
  const q = questById(G.offer.id); G.quest = {id: q.id, n: 0}; G.offer = null; save(); sfx("heal");
  exOpenDialog("aldeao", t("Pedido aceito: {meta}. Recompensa: {premio}.", {meta: questGoal(q), premio: rewardText(q.reward)}));
}
function questDeliver() {
  const q = questById(G.quest.id);
  if (q.need.pelt) G.pelts[q.need.pelt] -= q.need.n;
  G.money += q.reward.money || 0;
  for (const [k, n] of Object.entries(q.reward.items || {})) G.items[k] = (G.items[k] || 0) + n;
  G.questsDone[q.id] = G.day; G.quest = null; save(); sfx("more"); exHud();
  exOpenDialog("aldeao", `${q.thanks} Recebeu: ${rewardText(q.reward)}.`);
}
// conversa com um aldeão: entrega, oferta ou uma dica qualquer
function villagerTalk(look, say, d) {
  const name = VILLAGER_NAME[look] || "Aldeão", act = G.quest && questById(G.quest.id), off = !G.quest && G.offer && questById(G.offer.id);
  if (act && act.giver === look) {
    if (questReady()) { say(name, t("E aí, trouxe o que eu pedi?")); btn(t("Entregar"), questDeliver, false, d); }
    else say(name, `${act.text} (${questGoal(act)}: ${t("{n} de {total}", {n: questCount(act), total: act.need.n})})`);
  } else if (off && off.giver === look) { say(name, off.text); lh(t("Recompensa: {premio}.", {premio: rewardText(off.reward)}), d); btn(t("Aceitar o pedido"), questAccept, false, d); }
  else { const tips = look.startsWith("urbano") ? BELEM_TIPS : VILLAGER_TIPS; say(name, tips[Math.floor(Math.random() * tips.length)]); }
}
// linha do pedido na bolsa
const questLine = () => { const q = G.quest && questById(G.quest.id); return q ? "<br>" + t("Pedido de {quem}: {meta} ({n} de {total})", {quem: VILLAGER_NAME[q.giver].toLowerCase(), meta: questGoal(q), n: questCount(q), total: q.need.n}) : ""; };
// ícone sobre o aldeão: folha com anotações (tem pedido) ou com um visto verde (pedido pronto para entregar)
function questMark(look) {
  if (G.offer && !G.quest && questById(G.offer.id).giver === look) return "pedido";
  if (G.quest && questById(G.quest.id).giver === look && questReady()) return "pronto";
  return null;
}
function drawQuestMark(x, sx, sy, kind, now) {
  const y = Math.round(sy - (Math.floor(now / 300) % 2)), X = Math.round(sx);
  x.fillStyle = "#1a1426"; x.fillRect(X - 4, y - 1, 9, 9);
  x.fillStyle = kind === "pronto" ? "#7dff9a" : "#8fd06a"; x.fillRect(X - 3, y, 7, 7);
  x.fillStyle = "#25663a"; x.fillRect(X, y + 7, 1, 2);   // cabinho da folha
  if (kind === "pronto") { x.fillStyle = "#1a1426"; [[-2, 3], [-1, 4], [0, 5], [1, 4], [2, 3], [3, 2]].forEach(([dx, dy]) => x.fillRect(X + dx, y + dy, 1, 1)); }
  else { x.fillStyle = "#3a2414"; x.fillRect(X - 2, y + 2, 5, 1); x.fillRect(X - 2, y + 4, 4, 1); }   // anotações
}
