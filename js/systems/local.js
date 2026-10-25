/* Ananindeua: mapa local, descanso, feira, peles, roupas e inventário. */
const defense = () => ["legs", "torso"].reduce((a, k) => a + ((G.equip && EQUIP[k][G.equip[k]] && EQUIP[k][G.equip[k]].def) || 0), 0);
const weaponAtk = () => (G.equip && EQUIP.weapon[G.equip.weapon] && EQUIP.weapon[G.equip.weapon].atk) || 0;
const unlocked = k => !NEED[k] || !!BS()[NEED[k]];
function subPath(a, b) {
  const adj = {}; EDGES.forEach(([x, y]) => { (adj[x] = adj[x] || []).push(y); (adj[y] = adj[y] || []).push(x); });
  const prev = {[a]: null}, q = [a];
  while (q.length) { const c = q.shift(); if (c === b) break; (adj[c] || []).forEach(n => { if (!(n in prev) && unlocked(n)) { prev[n] = c; q.push(n); } }); }
  const path = []; for (let c = b; c != null; c = prev[c]) path.unshift(c);
  return path[0] === a ? path : [a, b];
}
const lh = (t, host = $("linfo")) => host.insertAdjacentHTML("beforeend", `<p class="hint">${t}</p>`);
// depois de descansar/comprar/vender: atualiza o painel de onde a ação veio (mapa de Ananindeua ou conversa na exploração)
function localDone(where, msg) {
  if (EX && EX.dialog && !$("explore").hidden) { exHud(); exOpenDialog(EX.dialog, msg); return; }
  drawLocal(); selectSub(where, msg);
}
function drawLocal() {
  vit();
  $("lhud").textContent = `Dia ${G.day}${G.night ? " (noite)" : ""} · Nv ${G.lv} · R$ ${G.money} · PV ${G.hp}/${maxHP(G.lv)} · PE ${G.sp}/${maxSP(G.lv)} · DEF ${defense()} · Itens ×${itemCount(G.items)} · Peles ×${Object.values(G.pelts).reduce((a, n) => a + n, 0)}`;
  Object.keys(SUB).forEach(k => $("ln-" + k).classList.toggle("locked", !unlocked(k)));
  const l = SUB[G.sub]; $("lmk").setAttribute("transform", `translate(${l.x} ${l.y})`);
}
function selectSub(id, msg) {
  sfx("blip"); vit(); markNode("local", id);
  const l = SUB[id], z = ZONES[id] && zoneDef(id), here = id === G.sub, i = $("linfo"), lock = z && !unlocked(id);
  i.innerHTML = `<h2>${l.n}</h2><p>${l.txt}</p>` + (here ? '<p class="hint">Você está aqui.</p>' : "");
  if (!here) { btn(lock ? `${l.n} (vença o chefe: ${SUB[NEED[id]].n})` : "Ir até lá", () => goSub(id), lock, i); if (lock) lh(`Derrote o chefe de ${SUB[NEED[id]].n} para liberar este local.`); }
  else if (id === "aldeia" || id === "feira") {
    btn(id === "aldeia" ? "Entrar na aldeia" : "Entrar na feira", () => startExplore(id), false, i);
    lh(id === "aldeia" ? "Lá dentro fica a fogueira: descanse até a noite ou durma até o dia seguinte. Os aldeões dão dicas." : "Lá dentro o vendedor compra suas peles e vende comida e roupas.");
  }
  else if (z) {
    btn("Explorar", () => startExplore(id), false, i);
    if (G.night) lh(BS()[bossKey(id)] ? `${ANIMALS.find(a => a.id === z.boss).name} derrotado ✓` : `É noite: os bichos são outros e o ${ANIMALS.find(a => a.id === z.boss).name} ronda o fim da trilha.`);
    else lh(BS()[id] ? "Chefe derrotado ✓ · a passagem no fim da trilha está aberta." : `O chefe (${ANIMALS.find(a => a.id === z.boss).name}) espera no fim da trilha.`);
    if (G.hp < maxHP(G.lv) * .35) lh("Rhanon está muito ferido. Descanse na aldeia antes de caçar.");
  }
  if (msg) lh(msg);
  btn("Inventário", showInv, false, i);
  btn("Voltar ao mapa do " + MAP_REGIONS[MAP_REGION].n, closeLocal, false, i);
}
// kind: "dormir" (tudo, vira o dia seguinte), "noite" (metade, vira noite) ou "fogueira" (ponto de descanso da trilha: tudo, sem mudar a hora)
// quiet = o galo já cantou na cena da fogueira (exploração)
function rest(kind, quiet) {
  vit(); const f = kind === "noite" ? .5 : 1;
  G.hp = Math.min(maxHP(G.lv), G.hp + Math.ceil(maxHP(G.lv) * f)); G.sp = Math.min(maxSP(G.lv), G.sp + Math.ceil(maxSP(G.lv) * f));
  if (kind === "dormir") { G.day++; G.night = false; if (!quiet) setTimeout(() => sfx("galo"), 450); }   // amanhece com o galo
  if (kind === "noite") G.night = true;
  save(); sfx("heal");
  localDone("aldeia", kind === "dormir" ? `Rhanon dormiu até o dia seguinte. Dia ${G.day}.` : kind === "noite" ? "Rhanon descansou até a noite. À noite a mata é outra: cuidado com o que ronda o escuro."
    : "Rhanon recuperou toda a vida e a energia junto à fogueira.");
}
// compra um item da barraca de comida (vai para a bolsa)
function buy(id) {
  const it = ITEMS[id]; if (G.money < it.price) return;
  G.money -= it.price; G.items[id] = (G.items[id] || 0) + 1; save(); sfx("heal");
  localDone("feira", `Comprou: ${it.n}. Na bolsa: ×${G.items[id]}.`);
}
// come um item fora da batalha (inventário)
function eatItem(id) {
  const it = ITEMS[id]; if (!G.items[id]) return;
  G.items[id]--; G.hp = Math.min(maxHP(G.lv), G.hp + it.hp); G.sp = Math.min(maxSP(G.lv), G.sp + it.sp);
  save(); sfx("heal"); invDone(`Rhanon comeu ${it.n.toLowerCase()}: ${itemEffect(it)}.`);
}
function goSub(id) {
  if (moving || id === G.sub) return;
  moving = true; sfx("look");
  const pts = subPath(G.sub, id).map(k => SUB[k]);
  const seg = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y)), L = seg.reduce((a, b) => a + b, 0), dur = Math.max(700, L / .26);
  $("linfo").innerHTML = "<h2>Caminhando…</h2><p>Rhanon segue pelas trilhas.</p>";
  let t0 = 0;
  const f = ts => {
    t0 = t0 || ts;
    const k = Math.min(1, Math.round((ts - t0) / dur * 60) / 60);
    let d = k * L, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const u = seg[i] ? Math.min(1, d / seg[i]) : 1, a = pts[i], b = pts[i + 1];
    $("lmk").setAttribute("transform", `translate(${a.x + (b.x - a.x) * u} ${a.y + (b.y - a.y) * u})`);
    if (k < 1) requestAnimationFrame(f); else { G.sub = id; save(); moving = false; drawLocal(); selectSub(id); sfx("more"); }
  };
  requestAnimationFrame(f);
}
const peltName = id => PELT[id] || "Pele de " + ANIMALS.find(a => a.id === id).name.toLowerCase();
const peltValue = id => { const g = ANIMALS.find(a => a.id === id).gold; return Math.round((g[0] + g[1]) / 2); };
const peltIds = () => Object.keys(G.pelts).filter(k => G.pelts[k] > 0);
const peltsTotal = () => peltIds().reduce((a, k) => a + G.pelts[k] * peltValue(k), 0);
/* Lojas da feira, cada uma numa barraca: comprador de peles, comida e artesão (roupas e armas). */
function peltButtons(i) {
  const ids = peltIds();
  if (ids.length > 1) btn(`Vender todas as peles · R$ ${peltsTotal()}`, sellAll, false, i);
  ids.forEach(k => btn(`Vender ${peltName(k)} ×${G.pelts[k]} · R$ ${G.pelts[k] * peltValue(k)}`, () => sell(k), false, i));
  if (!ids.length) lh("Você não tem peles para vender. Cace na mata, no rio ou na mata fechada.", i);
}
function foodButtons(i) { Object.entries(ITEMS).forEach(([id, it]) => btn(`${it.n} (${itemEffect(it)}) · R$ ${it.price}`, () => buy(id), G.money < it.price, i)); }
function sell(k) {
  const n = G.pelts[k] || 0, v = n * peltValue(k); if (!n) return;
  G.money += v; G.pelts[k] = 0; save(); sfx("more"); localDone("feira", `Vendeu ${peltName(k).toLowerCase()} ×${n} por R$ ${v}.`);
}
function sellAll() {
  const v = peltsTotal(); G.money += v; Object.keys(G.pelts).forEach(k => { G.pelts[k] = 0; });
  save(); sfx("more"); localDone("feira", `Vendeu todas as peles por R$ ${v}.`);
}
const GEAR_SLOTS = ["weapon", "ranged", "torso", "legs"];
const gearBonus = (slot, it) => slot === "ranged" ? "ataca de longe" : slot === "weapon" ? `ATQ +${it.atk || 0}` : `DEF +${it.def || 0}`;
// tudo de EQUIP que tem preço e ainda não é seu (itens novos em EQUIP aparecem aqui sozinhos)
function gearButtons(i) {
  vit(); let any = false;
  GEAR_SLOTS.forEach(slot => Object.entries(EQUIP[slot]).forEach(([id, it]) => {
    if (!it.price || G.owned[id]) return;
    const lock = G.lv < it.lv; any = true;
    btn(lock ? `${it.n} (Nv ${it.lv})` : `Comprar ${it.n} · R$ ${it.price} · ${gearBonus(slot, it)}`, () => buyGear(slot, id), lock || G.money < it.price, i);
  }));
  // especiais de batalha à venda (SPECIALS com price), como a tocha
  SPECIALS.forEach(s => {
    if (!s.price || G.owned[s.id]) return;
    const lock = G.lv < s.lv; any = true;
    btn(lock ? `${s.n} (Nv ${s.lv})` : `Comprar ${s.n} · R$ ${s.price} · especial de batalha`, () => buySpecial(s.id), lock || G.money < s.price, i);
  });
  if (!any) lh("Você já tem tudo o que o artesão faz por enquanto.", i);
}
function buySpecial(id) {
  const s = SPECIALS.find(q => q.id === id); if (G.money < s.price || G.lv < s.lv) return;
  G.money -= s.price; G.owned[id] = true; save(); sfx("heal");
  localDone("feira", `Comprou: ${s.n}. Use em "Especial" na batalha.`);
}
function buyGear(slot, id) {
  const it = EQUIP[slot][id]; if (G.money < it.price || G.lv < it.lv) return;
  G.money -= it.price; G.owned[id] = true; G.equip[slot] = id; save(); sfx("heal");
  localDone("feira", slot === "ranged" ? `Comprou: ${it.n}. Na exploração, X atira flechas.` : slot === "weapon" ? `Comprou e equipou: ${it.n}.` : `Comprou e vestiu: ${it.n}. DEF total: ${defense()}.`);
}
function equip(slot, id) { G.equip[slot] = id; save(); sfx("blip"); invDone(); }

/* ---------- inventário (no mapa de Ananindeua e, com I, dentro das fases) ---------- */
function invSummary() {
  const q = G.equip, ids = peltIds();
  return "Vestindo: " + (q.torso ? EQUIP.torso[q.torso].n : "sem camisa") + " e " + EQUIP.legs[q.legs].n +
    "<br>Arma: " + EQUIP.weapon[q.weapon].n + (q.ranged ? " + " + EQUIP.ranged[q.ranged].n : "") + " · Defesa: " + defense() +
    "<br>Bolsa: " + (Object.entries(G.items).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].n} ×${n}`).join(", ") || "vazia") +
    "<br>" + (ids.length ? ids.map(k => `${peltName(k)} ×${G.pelts[k]} (R$ ${peltValue(k)} cada)`).join("<br>") : "Nenhuma pele ainda. Vença bichos para conseguir peles.");
}
function invButtons(i) {
  const q = G.equip;
  Object.entries(G.items).forEach(([k, n]) => { if (n > 0) btn(`Comer ${ITEMS[k].n.toLowerCase()} ×${n} (${itemEffect(ITEMS[k])})`, () => eatItem(k), false, i); });
  GEAR_SLOTS.forEach(slot => Object.entries(EQUIP[slot]).forEach(([id, it]) => { if (G.owned[id] && q[slot] !== id) btn(`${slot === "torso" || slot === "legs" ? "Vestir" : "Usar"} ${it.n}`, () => equip(slot, id), false, i); }));
  if (q.torso) btn(`Tirar a ${EQUIP.torso[q.torso].n.toLowerCase()}`, () => equip("torso", null), false, i);
}
// depois de comer/trocar equipamento: atualiza o inventário de onde veio
function invDone(msg) {
  if (EX && EX.dialog === "inventario" && !$("explore").hidden) { exHud(); exOpenDialog("inventario", msg); return; }
  drawLocal(); showInv(msg);
}
function showInv(msg) {
  sfx("blip"); vit();
  const i = $("linfo"), ids = peltIds();
  i.innerHTML = `<h2>Inventário</h2><p>${invSummary()}</p>` + (ids.length ? `<p class="hint">Valor das peles: R$ ${peltsTotal()}. Venda na feira.</p>` : "");
  invButtons(i);
  if (msg) lh(msg, i);
  btn("Voltar", () => selectSub(G.sub), false, i);
}
function showLocal(zoom) {
  audio(); musicStart("local"); $("homeButton").hidden = false; $("map").hidden = true; $("local").hidden = false; drawLocal(); selectSub(G.sub);
  if (zoom) $("lsvg").animate([{transform: "scale(.15)", opacity: 0}, {transform: "scale(1)", opacity: 1}], {duration: 480, easing: "cubic-bezier(.2,1,.4,1)"});
}
function openLocal() {
  if (moving) return;
  const svg = $("mapsvg"), l = LOC.ananindeua; $("map").style.overflow = "hidden"; sfx("look");
  svg.style.transformOrigin = `${l.x / 4}% ${l.y / 4.4}%`;
  const an = svg.animate([{transform: "scale(1)", opacity: 1}, {transform: "scale(7)", opacity: 0}], {duration: 520, easing: "cubic-bezier(.6,0,.9,.4)"});
  an.onfinish = () => { $("map").style.overflow = ""; showLocal(true); };
}
function closeLocal() { showMap(); }
// cria trilhas e pontos clicáveis do mapa de Ananindeua a partir de SUB e EDGES
function buildLocalNodes() {
  $("lroutes").innerHTML = EDGES.map(([a, b]) => `<line class="lroute" x1="${SUB[a].x}" y1="${SUB[a].y}" x2="${SUB[b].x}" y2="${SUB[b].y}"/>`).join("");
  $("lnodes").innerHTML = Object.entries(SUB).map(([k, l]) => `<g class="node" id="ln-${k}" data-k="${k}" transform="translate(${l.x} ${l.y})" tabindex="0" role="button" aria-label="${l.n}"><circle r="10"/><text y="28" text-anchor="middle">${l.n}</text></g>`).join("");
  document.querySelectorAll("#lnodes .node").forEach(n => {
    const k = n.dataset.k, pick = () => { if (!moving) selectSub(k); };
    n.addEventListener("click", pick);
    n.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
  });
}
