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
  if ($("lnodes").dataset.city !== curCity()) buildLocalNodes();   // trocou de cidade (ônibus): redesenha o mapa
  CITY[curCity()].route.forEach(k => { const n = $("ln-" + k); n.classList.toggle("locked", !unlocked(k)); n.style.display = G.seen[k] ? "" : "none"; });
  document.querySelectorAll("#lroutes [data-b], #lbridges [data-b]").forEach(el => { el.style.display = G.seen[el.dataset.b] ? "" : "none"; });
  $("lroad").style.display = G.seen[CITY[curCity()].gate] ? "" : "none";
  const l = SUB[G.sub]; $("lmk").setAttribute("transform", `translate(${l.x} ${l.y})`);
}
function selectSub(id, msg) {
  sfx("blip"); vit(); markNode("local", id);
  const l = SUB[id], z = ZONES[id] && zoneDef(id), here = id === G.sub, i = $("linfo"), lock = !unlocked(id);   // fases e a BR-316 abrem com o chefe anterior
  i.innerHTML = `<h2>${l.n}</h2><p>${l.txt}</p>` + (here ? '<p class="hint">Você está aqui.</p>' : "");
  if (!here) { btn(lock ? `${l.n} (vença o chefe: ${SUB[NEED[id]].n})` : "Ir até lá", () => goSub(id), lock, i); if (lock) lh(`Derrote o chefe de ${SUB[NEED[id]].n} para liberar este local.`); }
  else if (id === "aldeia" || id === "feira") {
    btn(id === "aldeia" ? "Entrar na aldeia" : "Entrar na feira", () => startExplore(id), false, i);
    lh(id === "aldeia" ? "Lá dentro fica a fogueira: descanse até a noite ou durma até o dia seguinte. Os aldeões dão dicas." : "Lá dentro o vendedor compra suas peles, tem comida, o artesão vende roupas e o armeiro faz armas e armaduras.");
  }
  else if (id === "parada") {   // cobrador vende a passagem para Belém (BUS em data/world.js)
    if (G.passagem && BUS.open) { btn("Embarcar no ônibus para Belém", () => busRide("belem"), false, i); lh("A passagem vale ida e volta: do terminal de Belém dá para voltar quando quiser."); }
    else if (G.passagem) lh("Passagem comprada! Assim que o ônibus para Belém voltar a rodar, é só embarcar aqui.");
    else btn(`Comprar passagem para Belém · R$ ${BUS.price}`, buyTicket, !BUS.open || G.money < BUS.price, i);
    if (!BUS.open) lh("O cobrador avisa: \"O ônibus para Belém ainda não está saindo. Volta daqui a uns dias!\" (em breve: episódio 2)");
    else if (!G.passagem && G.money < BUS.price) lh(`Faltam R$ ${BUS.price - G.money}. Peles de bicho forte valem bem mais na feira.`);
  }
  else if (id === "terminal") {   // em Belém: o mesmo ônibus volta pela BR-316
    btn("Voltar para Ananindeua", () => busRide("ananindeua"), false, i);
    lh("A passagem vale ida e volta. Na aldeia dá para descansar na fogueira e caçar nas matas de sempre.");
  }
  else if (id === "veropeso") {
    btn("Entrar no Ver-o-Peso", () => startExplore(id), false, i);
    lh("Lá dentro: comprador de peles, barraca de comida, artesão, armeiro e uma rede na pensão para dormir.");
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
// quiet = o galo já cantou na cena da fogueira (exploração); toast = só devolve a mensagem (a exploração mostra no topo)
function rest(kind, quiet, toast) {
  vit(); const f = kind === "noite" ? .5 : 1;
  G.hp = Math.min(maxHP(G.lv), G.hp + Math.ceil(maxHP(G.lv) * f)); G.sp = Math.min(maxSP(G.lv), G.sp + Math.ceil(maxSP(G.lv) * f));
  if (kind === "dormir") { G.day++; G.night = false; if (!quiet) setTimeout(() => sfx("galo"), 450); }   // amanhece com o galo
  if (kind === "noite") G.night = true;
  save(); sfx("heal");
  const msg = kind === "dormir" ? `Rhanon dormiu até o dia seguinte. Dia ${G.day}.` : kind === "noite" ? "Rhanon descansou até a noite. À noite a mata é outra: cuidado com o que ronda o escuro."
    : "Rhanon recuperou toda a vida e a energia junto à fogueira.";
  if (toast) return msg;
  localDone("aldeia", msg);
}
/* viagem de ônibus pela BR-316 (passagem de ida e volta): dá para embarcar na cabine/terminal ou direto no mapa do
   Pará. O ônibus anda pela estrada do mapa grande, de uma cidade até a outra, e o mapa entra na cidade de chegada. */
const BUS_MS = 3600;
function busRide(city) {
  if (moving || !G.passagem || G.loc === city) return;
  if ($("map").hidden) showMapNow();   // saindo da cabine/terminal: volta para o mapa do Pará
  moving = true; sfx("look");
  const road = $("route"), L = road.getTotalLength(), fromStart = MAP_REGIONS[MAP_REGION].route[0] === G.loc;
  $("mk").style.display = "none"; $("mkbus").style.display = "";
  $("info").innerHTML = `<h2>Na estrada…</h2><p>${city === "belem" ? "O ônibus segue pela BR-316 rumo a Belém." : "O ônibus volta pela BR-316 para Ananindeua."}</p>`;
  let t0 = 0, last = null, vrum = 0;
  const f = ts => {
    t0 = t0 || ts;
    const u = Math.min(1, (ts - t0) / (REDUCE ? 400 : BUS_MS)), e = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2, p = road.getPointAtLength(L * (fromStart ? e : 1 - e));
    const flip = last && p.x < last.x - .01 ? -1 : last && p.x > last.x + .01 ? 1 : $("mkbus").dataset.f || 1;   // o ônibus vira para o lado em que anda
    $("mkbus").dataset.f = flip; $("mkbus").setAttribute("transform", `translate(${p.x} ${p.y}) scale(${1.6 * flip} 1.6) translate(0 ${Math.floor(ts / 120) % 2})`);
    last = p;
    if (ts - vrum > 650) { vrum = ts; sfx("onibus"); }
    if (u < 1) return requestAnimationFrame(f);
    G.loc = city; G.sub = CITY[city].gate; G.seen[G.sub] = true; save();
    $("mkbus").style.display = "none"; $("mk").style.display = ""; moving = false; drawMap(); sfx("more");
    buildLocalNodes(); openLocal();   // entra na cidade de chegada, no terminal (ou na cabine da BR-316)
    if (city === "belem" && !G.belemVisto) { G.belemVisto = true; save(); setTimeout(() => lh("Primeira vez na capital! Siga a trilha até o Ver-o-Peso: lá dá para vender peles e dormir."), 1300); }
  };
  requestAnimationFrame(f);
}
// passagem de ônibus para Belém: cara, comprada uma vez só
function buyTicket() {
  if (!BUS.open || G.passagem || G.money < BUS.price) return;
  G.money -= BUS.price; G.passagem = true; save(); sfx("more");
  localDone("parada", "Passagem para Belém comprada! Ela vale ida e volta: embarque aqui na cabine ou direto no mapa do Pará.");
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
  // cada trecho segue a curva da trilha desenhada (o caminho de a para b, ou ao contrário se for voltando)
  const path = subPath(G.sub, id), segs = path.slice(1).map((b, i) => {
    const a = path[i], fw = $("lroutes").querySelector(`[data-a="${a}"][data-b="${b}"]`), bk = $("lroutes").querySelector(`[data-a="${b}"][data-b="${a}"]`), el = fw || bk;
    const len = el ? el.getTotalLength() : Math.hypot(SUB[b].x - SUB[a].x, SUB[b].y - SUB[a].y);
    return {len, at: u => el ? el.getPointAtLength(fw ? u : len - u) : {x: SUB[a].x + (SUB[b].x - SUB[a].x) * u / len, y: SUB[a].y + (SUB[b].y - SUB[a].y) * u / len}};
  });
  const L = segs.reduce((s, q) => s + q.len, 0), dur = Math.min(2800, Math.max(700, L / .26));   // longe demais anda mais rápido
  $("linfo").innerHTML = "<h2>Caminhando…</h2><p>Rhanon segue pela trilha.</p>";
  let t0 = 0;
  const f = ts => {
    t0 = t0 || ts;
    const k = Math.min(1, Math.round((ts - t0) / dur * 60) / 60);
    let d = k * L, i = 0; while (i < segs.length - 1 && d > segs[i].len) { d -= segs[i].len; i++; }
    const q = segs[i].at(Math.min(segs[i].len, d));
    $("lmk").setAttribute("transform", `translate(${q.x} ${q.y})`);
    if (k < 1) requestAnimationFrame(f); else { G.sub = id; save(); moving = false; drawLocal(); selectSub(id); sfx("more"); }
  };
  requestAnimationFrame(f);
}
const peltName = id => PELT[id] || "Pele de " + ANIMALS.find(a => a.id === id).name.toLowerCase();
const peltValue = id => { const g = ANIMALS.find(a => a.id === id).gold; return Math.round((g[0] + g[1]) / 2); };
const peltIds = () => Object.keys(G.pelts).filter(k => G.pelts[k] > 0);
const peltsTotal = () => peltIds().reduce((a, k) => a + G.pelts[k] * peltValue(k), 0);
/* Lojas da feira, cada uma numa barraca: comprador de peles, comida, artesão (roupas e tocha) e armeiro (armas e armaduras). */
function peltButtons(i) {
  const ids = peltIds();
  if (ids.length > 1) btn(`Vender todas as peles · R$ ${peltsTotal()}`, ask(`Vender todas as peles por R$ ${peltsTotal()}?`, sellAll), false, i);
  ids.forEach(k => btn(`Vender ${peltName(k)} ×${G.pelts[k]} · R$ ${G.pelts[k] * peltValue(k)}`, ask(`Vender ${peltName(k).toLowerCase()} ×${G.pelts[k]} por R$ ${G.pelts[k] * peltValue(k)}?`, () => sell(k)), false, i));
  if (!ids.length) lh("Você não tem peles para vender. Cace na mata, no rio ou na mata fechada.", i);
}
function foodButtons(i) { Object.entries(ITEMS).forEach(([id, it]) => btn(`${it.n} (${itemEffect(it)}) · R$ ${it.price}`, ask(`Comprar ${it.n.toLowerCase()} por R$ ${it.price}?`, () => buy(id)), G.money < it.price, i)); }
function sell(k) {
  const n = G.pelts[k] || 0, v = n * peltValue(k); if (!n) return;
  G.money += v; G.pelts[k] = 0; save(); sfx("more"); localDone("feira", `Vendeu ${peltName(k).toLowerCase()} ×${n} por R$ ${v}.`);
}
function sellAll() {
  const v = peltsTotal(); G.money += v; Object.keys(G.pelts).forEach(k => { G.pelts[k] = 0; });
  save(); sfx("more"); localDone("feira", `Vendeu todas as peles por R$ ${v}.`);
}
const GEAR_SLOTS = ["weapon", "ranged", "torso", "legs"];
const gearBonus = (slot, it) => slot === "ranged" ? (it.atk ? `flecha +${it.atk}` : "ataca de longe") : slot === "weapon" ? `ATQ +${it.atk || 0}` : `DEF +${it.def || 0}`;
const SMITH_SLOTS = ["weapon", "ranged"];   // feitos pelo armeiro; roupas (torso, legs) ficam com o artesão
// artesão: roupas de EQUIP com preço e especiais à venda (tocha); itens novos em EQUIP aparecem aqui sozinhos
function gearButtons(i) {
  vit(); let any = false;
  GEAR_SLOTS.filter(slot => !SMITH_SLOTS.includes(slot)).forEach(slot => Object.entries(EQUIP[slot]).forEach(([id, it]) => {
    if (!it.price || G.owned[id]) return;
    const lock = G.lv < it.lv; any = true;
    btn(lock ? `${it.n} (Nv ${it.lv})` : `Comprar ${it.n} · R$ ${it.price} · ${gearBonus(slot, it)}`, ask(`Comprar ${it.n.toLowerCase()} por R$ ${it.price}?`, () => buyGear(slot, id)), lock || G.money < it.price, i);
  }));
  // especiais de batalha à venda (SPECIALS com price), como a tocha
  SPECIALS.forEach(s => {
    if (!s.price || G.owned[s.id]) return;
    const lock = G.lv < s.lv; any = true;
    btn(lock ? `${s.n} (Nv ${s.lv})` : `Comprar ${s.n} · R$ ${s.price} · especial de batalha`, ask(`Comprar ${s.n.toLowerCase()} por R$ ${s.price}?`, () => buySpecial(s.id)), lock || G.money < s.price, i);
  });
  if (!any) lh("Você já tem tudo o que o artesão faz por enquanto.", i);
}
/* ---------- armeiro: nomes à esquerda; o escolhido mostra à direita o que precisa, quanto você tem e "Fabricar" ---------- */
// armas/arco com preço (só dinheiro) e tudo de CRAFT (peles + dinheiro), do menor nível para o maior
function forgeItems() {
  const out = [];
  SMITH_SLOTS.forEach(slot => Object.entries(EQUIP[slot]).forEach(([id, it]) => { if (it.price) out.push({slot, id, it}); }));
  GEAR_SLOTS.forEach(slot => Object.entries(CRAFT[slot] || {}).forEach(([id, it]) => out.push({slot, id, it})));
  return out.sort((a, b) => a.it.lv - b.it.lv);
}
const forgeCost = it => it.price || it.cost || 0;
const forgeLacks = it => G.lv < it.lv || G.money < forgeCost(it) || Object.entries(it.craft || {}).some(([k, n]) => (G.pelts[k] || 0) < n);
function forgePanel(d) {
  vit();
  const items = forgeItems(), box = document.createElement("div"), list = document.createElement("div"), card = document.createElement("div");
  box.className = "forge"; list.className = "forge-list"; card.className = "forge-card";
  box.append(list, card); d.appendChild(box);
  if (!items.some(o => o.id === EX.forgeSel)) EX.forgeSel = (items.find(o => !G.owned[o.id]) || items[0]).id;
  items.forEach(o => btn(o.it.n + (G.owned[o.id] ? " <small>feito</small>" : G.lv < o.it.lv ? ` <small>Nv ${o.it.lv}</small>` : ""), () => forgeSelect(o.id), false, list));
  forgeSelect(EX.forgeSel, true);
}
function forgeSelect(id, quiet) {
  const items = forgeItems(), k = items.findIndex(o => o.id === id), o = items[k], card = $("exDialog").querySelector(".forge-card");
  if (!o || !card) return;
  EX.forgeSel = id; if (!quiet) sfx("blip");
  $("exDialog").querySelectorAll(".forge-list .cmd").forEach((b, j) => b.classList.toggle("sel", j === k));
  const it = o.it, row = (name, have, need, txt) => `<li class="${have >= need ? "ok" : "falta"}"><span>${name}</span><b>${txt}</b></li>`;
  card.innerHTML = `<h3>${it.n}</h3><p class="forge-bonus">${gearBonus(o.slot, it)}</p>` + (G.owned[id] ? '<p class="hint">Já é seu. Troque no equipamento (E).</p>' :
    '<ul class="forge-need">' + (G.lv < it.lv ? row("Nível", G.lv, it.lv, `${G.lv}/${it.lv}`) : "") +
    Object.entries(it.craft || {}).map(([p, n]) => row(peltName(p), G.pelts[p] || 0, n, `${Math.min(n, G.pelts[p] || 0)}/${n}`)).join("") +
    row("Dinheiro", G.money, forgeCost(it), `R$ ${forgeCost(it)}`) + "</ul>");
  if (G.owned[id]) return;
  const b = document.createElement("button"), off = forgeLacks(it);
  b.className = "cmd forge-make"; b.type = "button"; b.innerHTML = '<span><i class="key">Z</i>Fabricar</span>';   // a tecla some em tela de toque, como nos outros botões
  if (off) b.setAttribute("aria-disabled", "true");
  b.addEventListener("click", () => { if (!forgeLacks(it)) ask(`Fabricar ${it.n.toLowerCase()}? Gasta R$ ${forgeCost(it)}` + (it.craft ? " e as peles da lista." : "."), () => forgeMake(o))(); });
  card.appendChild(b);
}
// teclado no armeiro: setas escolhem o item, Z/Enter/Espaço fabricam (devolve true se usou a tecla)
function forgeKey(ev) {
  if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
    ev.preventDefault();
    const items = forgeItems(), k = items.findIndex(o => o.id === EX.forgeSel);
    forgeSelect(items[(k + (ev.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].id);
    return true;
  }
  if (["Enter", " ", "z", "Z"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); pressPanel($("exDialog").querySelector(".forge-make")); return true; }
  return false;
}
// o armeiro gasta as peles e o dinheiro, e o Rhanon já sai usando/vestindo
function forgeMake({slot, id, it}) {
  Object.entries(it.craft || {}).forEach(([k, n]) => { G.pelts[k] -= n; });
  G.money -= forgeCost(it); G.owned[id] = true; G.equip[slot] = id; save(); sfx("forja");
  localDone("feira", `O armeiro fez: ${it.n}. Já está ${slot === "torso" || slot === "legs" ? "vestindo" : "com você"}.` + (slot === "ranged" ? " Na exploração, X atira flechas." : ""));
}
function buySpecial(id) {
  const s = SPECIALS.find(q => q.id === id); if (G.money < s.price || G.lv < s.lv) return;
  G.money -= s.price; G.owned[id] = true; save(); sfx("heal");
  localDone("feira", `Comprou: ${s.n}. Use em "Especial" na batalha.`);
}
function buyGear(slot, id) {
  const it = EQUIP[slot][id]; if (G.money < it.price || G.lv < it.lv) return;
  G.money -= it.price; G.owned[id] = true; G.equip[slot] = id; save(); sfx("heal");
  localDone("feira", `Comprou e vestiu: ${it.n}. DEF total: ${defense()}.`);
}

/* ---------- inventário (no mapa de Ananindeua e, com I, dentro das fases) ---------- */
function invSummary() {
  const q = G.equip, ids = peltIds();
  return "Vestindo: " + (q.torso ? EQUIP.torso[q.torso].n : "sem camisa") + " e " + EQUIP.legs[q.legs].n +
    "<br>Arma: " + EQUIP.weapon[q.weapon].n + (q.ranged ? " + " + EQUIP.ranged[q.ranged].n : "") + " · Defesa: " + defense() +
    questLine() +
    "<br>Bolsa: " + (Object.entries(G.items).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].n} ×${n}`).join(", ") || "vazia") +
    "<br>" + (ids.length ? ids.map(k => `${peltName(k)} ×${G.pelts[k]} (R$ ${peltValue(k)} cada)`).join("<br>") : "Nenhuma pele ainda. Vença bichos para conseguir peles.");
}
function invButtons(i) {
  Object.entries(G.items).forEach(([k, n]) => { if (n > 0) btn(`Comer ${ITEMS[k].n.toLowerCase()} ×${n} (${itemEffect(ITEMS[k])})`, () => eatItem(k), false, i); });
  btn("Equipamento", () => openEquip(), false, i);   // trocar arma e roupa (systems/equip.js)
  btn("Caderno de bichos", openJournal, false, i);
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
  setTimeout(() => { if (!$("local").hidden && $("revela").hidden) revealNext(); }, zoom ? 600 : 250);   // caminho que abriu e ainda não apareceu
  if (zoom) $("lsvg").animate([{transform: "scale(.15)", opacity: 0}, {transform: "scale(1)", opacity: 1}], {duration: 480, easing: "cubic-bezier(.2,1,.4,1)"});
}
/* ---------- caminho novo: o mapa aparece e a trilha vai se desenhando até a área que abriu ---------- */
// primeira área já liberada (chefe anterior vencido) que o jogador ainda não viu aparecer no mapa
const pendingReveal = () => { vit(); return CITY[curCity()].route.find(k => unlocked(k) && !G.seen[k]); };
function revealNext(done) { const k = pendingReveal(); if (k) revealPath(k, done); else if (done) done(); }
let revealReady = false, revealDone = null;
function revealPath(k, done) {
  drawLocal();   // o mapa escondido mostra só o que já foi visto
  const o = $("revela"), box = o.querySelector(".revela"), svg = $("lsvg").cloneNode(true), NS = "http://www.w3.org/2000/svg";
  svg.removeAttribute("id"); svg.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));   // cópia sem ids repetidos
  box.innerHTML = '<h2>Caminho aberto!</h2>'; box.append(svg);
  const seg = svg.querySelector(`.lroute[data-b="${k}"]`), parts = [...svg.querySelectorAll(`[data-b="${k}"]`)], node = svg.querySelector(`.node[data-k="${k}"]`);
  revealReady = false; revealDone = done || null; o.hidden = false; sfx("look");
  const L = seg.getTotalLength(), trail = document.createElementNS(NS, "path"), tip = document.createElementNS(NS, "circle");
  trail.setAttribute("d", seg.getAttribute("d")); trail.setAttribute("class", "lreveal"); trail.style.strokeDasharray = L; trail.style.strokeDashoffset = L;
  tip.setAttribute("r", 5); tip.setAttribute("class", "lreveal-tip");
  seg.parentNode.append(trail, tip);
  const dur = REDUCE ? 1 : 1800, t0 = performance.now(); let steps = 0;
  const f = now => {
    const u = Math.min(1, (now - t0) / dur), e = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2, p = trail.getPointAtLength(L * e);
    trail.style.strokeDashoffset = L * (1 - e); tip.setAttribute("cx", p.x); tip.setAttribute("cy", p.y);
    if (Math.floor(u * 6) > steps) { steps++; sfx("blip"); }   // passinhos enquanto a trilha cresce
    if (u < 1) return requestAnimationFrame(f);
    trail.remove(); tip.remove();
    parts.forEach(el => { el.style.display = ""; });
    node.style.display = ""; node.classList.remove("locked");
    const {x, y} = SUB[k];
    node.animate([{transform: `translate(${x}px,${y}px) scale(0)`}, {transform: `translate(${x}px,${y}px) scale(1.35)`, offset: .6}, {transform: `translate(${x}px,${y}px) scale(1)`}], {duration: 420, easing: "ease-out"});
    if (k === CITY[curCity()].gate) svg.querySelector(".lroad")?.parentNode.style.removeProperty("display");   // a estrada aparece com a cabine
    sfx("missao"); G.seen[k] = true; save();
    box.insertAdjacentHTML("beforeend", `<p class="hint">${k === "parada" ? "A trilha chegou ao fim: a BR-316, de onde sai o ônibus para Belém." : `Agora a trilha segue até: ${SUB[k].n}.`}</p>`);
    btn("Continuar", closeReveal, false, box); box.querySelector(".cmd").focus({preventScroll: true});
    revealReady = true;
  };
  requestAnimationFrame(f);
}
function closeReveal() {
  if (!revealReady) return;
  $("revela").hidden = true; sfx("blip");
  if (!$("local").hidden) { drawLocal(); selectSub(G.sub); }
  const d = revealDone; revealDone = null; if (d) d();
  else revealNext();   // abriu mais de uma de uma vez (save antigo): mostra a próxima
}
function setupReveal() {
  document.addEventListener("keydown", ev => {
    if ($("revela").hidden) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (["Enter", " ", "z", "Z", "x", "X", "Escape"].includes(ev.key) && !ev.repeat) closeReveal();
  }, true);
  $("revela").addEventListener("click", ev => { if (ev.target === $("revela")) closeReveal(); });
}
function openLocal() {
  if (moving) return;
  const svg = $("mapsvg"), l = LOC[curCity()]; $("map").style.overflow = "hidden"; sfx("look");
  svg.style.transformOrigin = `${l.x / 4}% ${l.y / 4.4}%`;
  const an = svg.animate([{transform: "scale(1)", opacity: 1}, {transform: "scale(7)", opacity: 0}], {duration: 520, easing: "cubic-bezier(.6,0,.9,.4)"});
  an.onfinish = () => { $("map").style.overflow = ""; showLocal(true); };
}
function closeLocal() { showMap(); }
// mapa local da cidade atual (CITY em data/world.js): trilha em curva suave passando pelos locais na ordem (route),
// pontes onde ela cruza o rio/canal e a BR-316 saindo do mapa a partir da cabine do cobrador (ou do terminal)
function buildLocalNodes() {
  const C = CITY[curCity()], ROUTE = C.route, P = ROUTE.map(k => [SUB[k].x, SUB[k].y]), at = i => P[Math.max(0, Math.min(P.length - 1, i))];
  $("lnodes").dataset.city = curCity(); $("lsvg").setAttribute("aria-label", "Mapa estilizado de " + C.n);
  $("lland").setAttribute("points", C.land); $("lbay").setAttribute("d", C.bay || "");
  const curve = i => {   // trecho i -> i+1 (Catmull-Rom virando Bézier)
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `M${p1} C${c1} ${c2} ${p2}`;
  };
  $("lriver").setAttribute("d", C.river);
  $("lroad").innerHTML = `<path class="lroad" d="${C.road}"/><path class="lroad-faixa" d="${C.road}"/><text class="lroad-txt" x="${C.sign[0]}" y="${C.sign[1]}">${C.sign[2]}</text>`;
  $("lroutes").innerHTML = ROUTE.slice(1).map((k, i) => `<path class="lroute-base" data-b="${k}" d="${curve(i)}"/><path class="lroute" data-a="${ROUTE[i]}" data-b="${k}" d="${curve(i)}"/>`).join("");
  // pontes: anda pela trilha procurando onde ela passa por cima do rio, e põe uma ponte de tábuas alinhada com a trilha
  const river = $("lriver"), RL = river.getTotalLength(), rs = [];
  for (let u = 0; u <= RL; u += 2) rs.push(river.getPointAtLength(u));
  let bridges = "";
  $("lroutes").querySelectorAll(".lroute").forEach(el => {
    const L = el.getTotalLength();
    for (let u = 2; u < L - 2; u += 1.5) {
      const p = el.getPointAtLength(u);
      if (!rs.some(r => Math.hypot(r.x - p.x, r.y - p.y) < 2)) continue;
      const a = el.getPointAtLength(u - 2), b = el.getPointAtLength(u + 2), deg = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      bridges += `<g class="lbridge" data-b="${el.dataset.b}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${deg.toFixed(1)})"><rect x="-13" y="-6" width="26" height="12"/><path d="M-8 -6V6M-3 -6V6M2 -6V6M7 -6V6"/><path class="corda" d="M-13 -6H13M-13 6H13"/></g>`;
      u += 30;
    }
  });
  $("lbridges").innerHTML = bridges;
  const mark = k => k === C.gate   // a BR-316 (e o terminal de Belém) é uma cabine de cobrador, não uma bolinha
    ? '<g class="cabin"><circle r="13" class="hit"/><rect x="-9" y="-12" width="18" height="15"/><path d="M-12 -12L0 -21L12 -12Z"/><rect class="win" x="-5" y="-8" width="10" height="5"/></g>'
    : '<circle r="10"/>';
  $("lnodes").innerHTML = ROUTE.map(k => [k, SUB[k]]).map(([k, l]) => `<g class="node" id="ln-${k}" data-k="${k}" transform="translate(${l.x} ${l.y})" tabindex="0" role="button" aria-label="${l.n}">${mark(k)}<text y="28" text-anchor="middle">${l.s || l.n}</text></g>`).join("");   // s = nome curto no mapa
  document.querySelectorAll("#lnodes .node").forEach(n => {
    const k = n.dataset.k, pick = () => { if (!moving) selectSub(k); };
    n.addEventListener("click", pick);
    n.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
  });
}
