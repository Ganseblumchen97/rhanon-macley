/* Mapa grande (Pará ou Brasil, ver MAP_REGION em data/world.js): HUD, painel de informações, viagem e troca de telas. */
const curVis = () => CURITIBA_OPEN && (G.lv >= REQ.lv || G.loc === "curitiba");
function drawMap() {
  vit(); $("hud").textContent = `Nv ${G.lv} · XP ${G.xp}/${need(G.lv)} · R$ ${G.money}` + (G.loc === "ananindeua" ? ` · PV ${G.hp}/${maxHP(G.lv)} · PE ${G.sp}/${maxSP(G.lv)}` : "") + (G.job ? ` · PROGRAMADOR · XP PROF. ${G.jobXp||0}` : "") + (G.betterJob ? " · SÊNIOR" : "");
  const R = MAP_REGIONS[MAP_REGION];
  if ($("n-curitiba")) $("n-curitiba").style.display = curVis() ? "" : "none";
  $("route").style.display = R.route.includes("curitiba") && !curVis() ? "none" : "";
  const l = LOC[G.loc]; $("mk").setAttribute("transform", `translate(${l.x} ${l.y})`);
  applyTheme();
}
// desenha o contorno do mapa escolhido e põe cada local de LOC na posição dele
function setupMapRegion() {
  const R = MAP_REGIONS[MAP_REGION], svg = $("mapsvg");
  svg.setAttribute("aria-label", R.aria);
  svg.querySelector(".land").innerHTML = R.land.map(d => `<path d="${d}"/>`).join("") + (R.river ? `<path class="river" d="${R.river}"/>` : "");
  for (const [k, [x, y, ly]] of Object.entries(R.pos)) Object.assign(LOC[k], {x, y, ly});
  const [a, b] = R.route.map(k => LOC[k]);
  Object.entries({x1: a.x, y1: a.y, x2: b.x, y2: b.y}).forEach(([k, v]) => $("route").setAttribute(k, v));
}
// cria os pontos clicáveis do mapa a partir de LOC (só os que existem no mapa escolhido)
function buildMapNodes() {
  const pos = MAP_REGIONS[MAP_REGION].pos;
  $("nodes").innerHTML = Object.entries(LOC).filter(([k]) => pos[k]).map(([k, l]) => `<g class="node${l.soon ? " soon" : ""}" id="n-${k}" data-k="${k}" transform="translate(${l.x} ${l.y})" tabindex="0" role="button" aria-label="${l.n}"><circle r="10"/><text y="${l.ly || 28}" text-anchor="middle">${l.s}</text></g>`).join("");
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
  b.className = "cmd"; b.type = "button"; b.innerHTML = `<span>${n <= 9 ? `<i class="key">${n}</i>` : ""}${txt}</span>`;
  b.dataset.key = n;
  if (off) b.setAttribute("aria-disabled", "true");
  b.addEventListener("click", () => { if (!off) fn(); });
  host.appendChild(b);
}
function select(id) {
  sfx("blip"); markNode("map", id);
  const l = LOC[id], here = id === G.loc, i = $("info");
  i.innerHTML = `<h2>${l.n}</h2><p>${l.txt}</p>` + (here ? '<p class="hint">Você está aqui.</p>' : "");
  if (l.soon) {   // destino que ainda não abre (Belém)
    btn("Em breve", () => {}, true);
    i.insertAdjacentHTML("beforeend", '<p class="hint">Um dia Rhanon vai precisar chegar à capital para pegar um avião. Por enquanto, a aventura é em Ananindeua.</p>');
  } else if (here && id === "ananindeua") {
    btn("Entrar em Ananindeua", openLocal);
    i.insertAdjacentHTML("beforeend", !CURITIBA_OPEN ? (MAP_REGION === "para" ? "" : '<p class="hint">Em breve: novos destinos.</p>') : curVis() ? '<p class="hint">Curitiba apareceu no mapa. Toque nela para viajar.</p>' : `<p class="hint">Existe um destino distante. Para ir até lá: Nv ${REQ.lv} e R$ ${REQ.money}.</p>`);
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
    btn(miss > 0 ? `Faltam R$ ${miss}` : "Viajar", () => go(id, cost), miss > 0);
  }
  resetButton(i, () => { drawMap(); select(G.loc); });
}
// "Zerar progresso" (pede um segundo clique para confirmar); after = redesenha a tela de onde veio
function resetButton(host, after) {
  const r = document.createElement("button");
  r.className = "cmd"; r.type = "button"; r.style.opacity = ".6"; r.innerHTML = "<span>Zerar progresso</span>";
  r.addEventListener("click", () => {
    if (!sure) { sure = true; r.firstChild.textContent = "Clique de novo para confirmar"; return; }
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
  $("info").innerHTML = "<h2>Viajando…</h2><p>A trilha é longa. Cuidado com os animais pelo caminho.</p>"; sfx("look");
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
