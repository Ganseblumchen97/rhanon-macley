/* Mapa grande (Pará ou Brasil, ver MAP_REGION em data/world.js): HUD, painel de informações, viagem e troca de telas. */
const curVis = () => CURITIBA_OPEN && (G.lv >= REQ.lv || G.loc === "curitiba");
function drawMap() {
  vit(); $("hud").textContent = `${t("Nv")} ${G.lv} · XP ${G.xp}/${need(G.lv)} · R$ ${G.money}` + (CITY[G.loc] ? ` · ${t("PV")} ${G.hp}/${maxHP(G.lv)} · ${t("PE")} ${G.sp}/${maxSP(G.lv)}` : "") + (G.job ? ` · PROGRAMADOR · XP PROF. ${G.jobXp||0}` : "") + (G.betterJob ? " · SÊNIOR" : "");
  const R = MAP_REGIONS[MAP_REGION];
  if ($("n-curitiba")) $("n-curitiba").style.display = curVis() ? "" : "none";
  $("route").style.display = R.route.includes("curitiba") && !curVis() ? "none" : "";
  const l = LOC[G.loc]; $("mk").setAttribute("transform", `translate(${l.x} ${l.y})`);
  applyTheme();
}
// desenha o contorno do mapa escolhido e põe cada local de LOC na posição dele
function setupMapRegion() {
  const R = MAP_REGIONS[MAP_REGION], svg = $("mapsvg");
  svg.setAttribute("aria-label", R.aria); svg.dataset.region = MAP_REGION;   // terreno: mata ou sertão (padrões no index.html)
  svg.querySelector(".land").innerHTML = R.land.map(d => `<path d="${d}"/>`).join("") + (R.river ? `<path class="river" d="${R.river}"/>` : "");
  for (const [k, [x, y, ly]] of Object.entries(R.pos)) Object.assign(LOC[k], {x, y, ly});
  const [a, b] = R.route.map(k => LOC[k]), c = R.curve;   // estrada entre as duas cidades: reta ou em curva (uma cidade só: sem estrada)
  $("route").setAttribute("d", R.path ? R.path : !b ? "" : c ? `M${a.x},${a.y} C${a.x + c[0]},${a.y + c[1]} ${b.x + c[2]},${b.y + c[3]} ${b.x},${b.y}` : "M" + R.route.map(k => `${LOC[k].x},${LOC[k].y}`).join(" L"));   // várias cidades: segmentos retos
}
// mapa grande da cidade atual (o Pará ou o Maranhão): chamado ao abrir o jogo e depois de cada voo
function syncRegion() { MAP_REGION = CITY[curCity()].map; setupMapRegion(); buildMapNodes(); }
// cria os pontos clicáveis do mapa a partir de LOC (só os que existem no mapa escolhido)
function buildMapNodes() {
  const pos = MAP_REGIONS[MAP_REGION].pos;
  $("nodes").innerHTML = Object.entries(LOC).filter(([k]) => pos[k]).map(([k, l]) => `<g class="node${l.soon ? " soon" : ""}" id="n-${k}" data-k="${k}" transform="translate(${l.x} ${l.y})" tabindex="0" role="button" aria-label="${l.n}">${mapIcon(CITY_ICON[k] || k, 16)}<text y="${l.ly || 28}" text-anchor="middle">${l.s}</text></g>`).join("");
  document.querySelectorAll("#nodes .node").forEach(n => {
    const k = n.dataset.k, pick = () => { if (!moving) select(k); };
    n.addEventListener("click", pick);
    n.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
  });
}
// botão de comando dentro de um painel (por padrão, o painel do mapa grande)
// (cada botão ganha um número: a tecla 1-9 que o aperta, ver ui/mapnav.js)
function btn(txt, fn, off, host) {
  host = host || $("info");
  const b = document.createElement("button"), n = host.querySelectorAll(".cmd[data-key]").length + 1;
  b.className = "cmd"; b.type = "button"; b.innerHTML = `<span><i class="zk"></i>${txt}</span>`;   // data-key = ordem do botão (Enter/Z no mapa aperta o primeiro)
  b.dataset.key = n;
  if (off) b.setAttribute("aria-disabled", "true");
  b.addEventListener("click", () => { if (!off) fn(); });
  host.appendChild(b);
}
function select(id) {
  sfx("blip"); markNode("map", id);
  const l = LOC[id], here = id === G.loc, i = $("info");
  i.innerHTML = `<h2>${l.n}</h2><p>${l.txt}</p>` + (here ? `<p class="hint">${t("Você está aqui.")}</p>` : "");
  if (l.soon) {   // destino que ainda não abre (Belém)
    btn(t("Em breve"), () => {}, true);
    i.insertAdjacentHTML("beforeend", '<p class="hint">Um dia Rhanon vai precisar chegar à capital para pegar um avião. Por enquanto, a aventura é na aldeia.</p>');
  } else if (CITY[id] && CITY[id].map === "nordeste") {   // cidades do Nordeste: entrar, ônibus para as vizinhas e o voo de São Luís
    if (here) {
      btn(t("Entrar em {cidade}", {cidade: LOC[id].s}), openLocal);
      MAP_REGIONS.nordeste.route.filter(c => c !== id && busLine(id, c) && G[busLine(id, c).pass]).forEach(c => btn(t("Viajar de ônibus para {cidade}", {cidade: LOC[c].s}), () => busRide(c)));
      if (FLIGHT[id]) { btn(t("Voar para Belém (Aeroporto de São Luís)"), () => fly("belem")); i.insertAdjacentHTML("beforeend", `<p class="hint">${t("O voo de ida e volta é pago pela empresa do site da feira.")}</p>`); }
    } else {
      const ln = busLine(G.loc, id);   // dá para ir de ônibus da cidade atual até esta
      if (ln && G[ln.pass]) btn(t("Viajar de ônibus para {cidade}", {cidade: LOC[id].s}), () => busRide(id));
      else if (ln && ln.open()) btn(t("Comprar passagem para {cidade} · R$ {n}", {cidade: LOC[id].s, n: ln.price}), () => buyBusTicket(id), G.money < ln.price);
      i.insertAdjacentHTML("beforeend", `<p class="hint">${!ln ? t("De ônibus, só a partir da cidade vizinha na estrada.") : ln.open() ? t("A passagem vale ida e volta entre {a} e {b}.", {a: LOC[ln.from].s, b: LOC[ln === BUS_LINES[id] ? id : G.loc].s}) : t(ln.lock)}</p>`);
    }
  } else if (here && id === "belem") {
    btn(t("Entrar em Belém"), openLocal);
    if (flightOpen()) { btn(t("Voar para São Luís (Aeroporto de Belém)"), () => fly("saoluis")); i.insertAdjacentHTML("beforeend", `<p class="hint">${t("O voo de ida e volta é pago pela empresa do site da feira.")}</p>`); }
    else if (G.portfolio.site_feira || NORTE_BOSSES().every(k => BS()[k])) i.insertAdjacentHTML("beforeend", `<p class="hint">${t("Aeroporto de Belém: o voo para São Luís sai quando o site da feira estiver entregue e os 20 chefes do Norte acalmados.")}</p>`);
  } else if (id === "belem" || (id === "ananindeua" && G.loc === "belem")) {   // entre as duas cidades só se vai de ônibus
    if (G.passagem && BUS.open) { btn(id === "belem" ? t("Viajar de barco para Belém") : t("Voltar de barco para a aldeia"), () => busRide(id)); i.insertAdjacentHTML("beforeend", `<p class="hint">${t("A passagem do barco vale ida e volta.")}</p>`); }
    else i.insertAdjacentHTML("beforeend", '<p class="hint">Para chegar à capital, compre a passagem do barco no porto do Tapajós, no fim da trilha da aldeia.</p>');
  } else if (here && id === "ananindeua") {
    btn(t("Entrar na aldeia"), openLocal);
    i.insertAdjacentHTML("beforeend", !CURITIBA_OPEN ? (MAP_REGION === "norte" ? "" : '<p class="hint">Em breve: novos destinos.</p>') : curVis() ? '<p class="hint">Curitiba apareceu no mapa. Toque nela para viajar.</p>' : `<p class="hint">Existe um destino distante. Para ir até lá: Nv ${REQ.lv} e R$ ${REQ.money}.</p>`);
  } else if (here && id === "curitiba") {
    if (!G.job) {
      btn("Entrevista: vaga de programador", () => startChallenge("interview"));
      i.insertAdjacentHTML("beforeend", '<p class="hint">Responda cinco perguntas. Errar custa PV.</p>');
    } else {
      i.insertAdjacentHTML("beforeend", `<p class="hint">${G.betterJob ? "Você trabalha na empresa melhor e recebe mais." : "Você é programador! Complete missões para ganhar XP profissional e desbloquear uma empresa que paga melhor."}</p>`);
      btn("Missão de trabalho", () => startChallenge("work"));
      if (!G.betterJob && (G.jobXp||0) >= 150) { btn("Entrevista para empresa melhor", () => startChallenge("betterInterview")); i.insertAdjacentHTML("beforeend", '<p class="hint">Requisito cumprido: XP profissional suficiente.</p>'); }
      else if (!G.betterJob) i.insertAdjacentHTML("beforeend", `<p class="hint">Entrevista melhor desbloqueia com 150 XP profissional. Faltam ${Math.max(0,150-(G.jobXp||0))} XP.</p>`);
    }
  } else if (!here) {
    const cost = id === "curitiba" ? REQ.money : 0, miss = cost - G.money;
    i.insertAdjacentHTML("beforeend", `<p class="hint">Passagem: R$ ${cost}</p>`);
    btn(miss > 0 ? t("Faltam R$ {n}", {n: miss}) : t("Viajar"), () => go(id, cost), miss > 0);
  }
  btn(t("Mapa do Brasil"), () => openBrasil());   // as cinco regiões da viagem
  resetButton(i, () => { drawMap(); select(G.loc); });
}
// passagem de uma linha de ônibus do Nordeste (BUS_LINES): comprada uma vez, vale ida e volta
function buyBusTicket(id) {
  const ln = busLine(G.loc, id); if (!ln || G.money < ln.price || G[ln.pass]) return;
  G.money -= ln.price; G[ln.pass] = true; save(); sfx("more"); drawMap(); select(id);
}
/* ---------- voo entre regiões (FLIGHT em data/world.js) ----------
   o mapa do Brasil abre com um aviãozinho indo de uma região à outra; ao pousar, troca o mapa grande e a cidade */
function fly(city) {
  if (moving || !FLIGHT[G.loc] || FLIGHT[G.loc] !== city) return;
  moving = true; sfx("onibus"); musicStop();
  const from = REGIONS[regionOfCity(G.loc)].pos, to = REGIONS[regionOfCity(city)].pos;
  openBrasil(); const svg = $("brasil").querySelector("svg");
  svg.insertAdjacentHTML("beforeend", `<g class="br-plane"><path d="M-9 0 L9 0 M-2 -7 L3 0 L-2 7 M-8 -3 L-6 0 L-8 3" /></g>`);
  const pl = svg.querySelector(".br-plane"), ang = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI, t0 = performance.now(), ms = REDUCE ? 300 : 3200;
  const step = now => {
    const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
    pl.setAttribute("transform", `translate(${from[0] + (to[0] - from[0]) * e} ${from[1] + (to[1] - from[1]) * e - Math.sin(k * Math.PI) * 30}) rotate(${ang})`);
    if (k < 1) return requestAnimationFrame(step);
    vit(); G.loc = city; G.sub = CITY[city].home; G.seen[G.sub] = true; (G.regions || (G.regions = {}))[regionOfCity(city)] = true; save();
    moving = false; closeBrasil(); syncRegion(); buildLocalNodes(); drawMap(); select(city); sfx("more");
    musicStart("map");
  };
  requestAnimationFrame(step);
}
// região de uma cidade (pelo mapa grande dela)
const regionOfCity = c => Object.keys(REGIONS).find(k => REGIONS[k].map === CITY[c].map);
/* ---------- mapa do Brasil: as cinco regiões (REGIONS), do Norte ao Sul ----------
   À esquerda o contorno com um ponto por região (a aberta pulsa, as outras ficam apagadas) e a fumaça de Pytuna no Sul
   depois que ele foge; à direita a lista (setas escolhem, Z abre, X fecha) e o painel da região escolhida. */
let BR_SEL = "norte";
function openBrasil() {
  vit(); audio();
  const o = $("brasil"), box = o.querySelector(".info"), B = MAP_REGIONS.brasil, fled = G.narrated.pyt_jacare_canal || G.narrated.pyt_bufalo_touro;
  const dots = Object.entries(REGIONS).map(([k, r]) => `<g class="br-dot${r.open ? " open" : ""}${k === BR_SEL ? " sel" : ""}" transform="translate(${r.pos[0]} ${r.pos[1]})" style="--rc:${r.color}"><circle r="${r.open ? 16 : 12}"/><text y="34" text-anchor="middle">${r.n}</text></g>`).join("");
  const smoke = fled ? `<g class="br-smoke" transform="translate(${REGIONS.sul.pos[0] + 30} ${REGIONS.sul.pos[1] - 26})"><circle r="11" cx="-6"/><circle r="13" cx="6" cy="-4"/><circle r="9" cx="2" cy="6"/><rect x="-6" y="-4" width="4" height="3"/><rect x="3" y="-4" width="4" height="3"/></g>` : "";
  box.innerHTML = `<h2>${t("Mapa do Brasil")}</h2><div class="br-wrap"><svg viewBox="80 80 400 480" aria-hidden="true"><g class="land">${B.land.map(d => `<path d="${d}"/>`).join("")}</g>` +
    `<path class="br-trail" d="M${REGIONS.norte.pos} L${REGIONS.nordeste.pos} L${REGIONS.centroeste.pos} L${REGIONS.sudeste.pos} L${REGIONS.sul.pos}"/>${dots}${smoke}</svg><div class="br-side"></div></div>`;
  const side = box.querySelector(".br-side");
  Object.entries(REGIONS).forEach(([k, r]) => btn(r.n + (r.open ? "" : ` <small>${t("em breve")}</small>`), () => { BR_SEL = k; sfx("blip"); openBrasil(); }, false, side));
  side.querySelectorAll(".cmd").forEach((b, j) => b.classList.toggle("sel", Object.keys(REGIONS)[j] === BR_SEL));
  const r = REGIONS[BR_SEL], card = document.createElement("div"); card.className = "br-card";
  card.innerHTML = `<h3 style="color:${r.color}">${r.n}</h3><p>${r.txt}</p>` + (BR_SEL === "nordeste"
    ? `<p class="hint">${t(G.regions?.nordeste ? "Você já esteve aqui. Por enquanto, São Luís; o resto do Nordeste vem em breve." : flightOpen() ? "O voo para São Luís já sai do Aeroporto de Belém." : "O voo sai do Aeroporto de Belém depois que o site da feira for entregue e os 20 chefes do Norte acalmados.")}</p>`
    : r.open
    ? `<p class="hint">${t("Luz de Jaci: {n} de {total} chefes do Norte acalmados", {n: NORTE_BOSSES().filter(k => BS()[k]).length, total: NORTE_BOSSES().length})}</p>` +
      `<p class="hint">${t("Entre a aldeia e Belém, vai de barco de linha pelo rio.")}</p>` +
      `<p class="hint">${t(flightOpen() ? "{aero}: voo de ida e volta para São Luís." : "{aero}: os voos de ida e volta abrem quando o Rhanon chegar na próxima região.", {aero: r.airport})}</p>`
    : `<p class="hint">${t("Ainda não dá pra ir. A história chega lá em breve.")}</p>`);
  side.append(card);
  btn(t("Fechar"), closeBrasil, false, side);
  if (o.hidden) { o.hidden = false; sfx("look"); }
  menuSelect(side, Object.keys(REGIONS).indexOf(BR_SEL));
}
function closeBrasil() { $("brasil").hidden = true; sfx("blip"); }
function setupBrasil() {
  $("brasil").addEventListener("click", ev => { if (ev.target === $("brasil")) closeBrasil(); });
  document.addEventListener("keydown", ev => {
    if ($("brasil").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.stopImmediatePropagation();
    const keys = Object.keys(REGIONS), i = keys.indexOf(BR_SEL);
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); BR_SEL = keys[(i + (ev.key === "ArrowDown" ? 1 : keys.length - 1)) % keys.length]; sfx("blip"); openBrasil(); }
    else if (["Escape", "x", "X"].includes(ev.key) && !ev.repeat) { ev.preventDefault(); closeBrasil(); }
    else if (["z", "Z", "Enter", " "].includes(ev.key)) ev.preventDefault();
  }, true);
}
// "Zerar progresso" (pede um segundo clique para confirmar); after = redesenha a tela de onde veio
function resetButton(host, after) {
  const r = document.createElement("button");
  r.className = "cmd"; r.type = "button"; r.style.opacity = ".6"; r.innerHTML = `<span>${t("Zerar progresso")}</span>`;
  r.addEventListener("click", () => {
    if (!sure) { sure = true; r.firstChild.textContent = t("Clique de novo para confirmar"); return; }
    sure = false; G = {lv: 1, xp: 0, money: 0, loc: "ananindeua", job:false, jobXp:0, jobMissions:0, betterJob:false}; save(); after();
  });
  host.appendChild(r);
}
function showMap() { wipe(showMapNow); }
// sem a transição (usado ao sair da tela inicial)
function showMapNow() { $("local").hidden = true; $("explore").hidden = true; $("homeButton").hidden = false; $("game").classList.remove("working-mode"); $("stage").classList.remove("working"); $("workScene").hidden = true; $("beast").style.display = ""; $("hero").style.display = ""; $("over").hidden = true; $("map").hidden = false; musicStart("map"); refreshHero(); drawMap(); select(G.loc); }
function go(id, cost) {
  if (moving) return;
  moving = true;
  const a = LOC[G.loc], b = LOC[id];
  G.money -= cost; save(); drawMap();
  $("info").innerHTML = `<h2>${t("Viajando…")}</h2><p>${t("A trilha é longa. Cuidado com os animais pelo caminho.")}</p>`; sfx("look");
  let t0 = 0;
  const travelMs = 3200;
  const f = ts => {
    t0 = t0 || ts;
    const k = Math.min(1, Math.round((ts - t0) / travelMs * 24) / 24);
    $("mk").setAttribute("transform", `translate(${a.x + (b.x - a.x) * k} ${a.y + (b.y - a.y) * k})`);
    if (k < 1) requestAnimationFrame(f);
    else { G.loc = id; save(); moving = false; drawMap(); select(id); sfx("more"); }
  };
  requestAnimationFrame(f);
}
