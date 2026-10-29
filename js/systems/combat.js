/* Batalha por turnos contra os bichos. */
function setBattleDecor(zone) {
  const stage = $("stage"), decor = $("bgDecor");
  if (!stage || !decor) return;
  stage.classList.remove(...[...stage.classList].filter(c => c.startsWith("zone-")));
  stage.classList.add("zone-" + (zone || curZone || "mata"));
  // à noite: um véu azul-escuro com a lua por cima do cenário (embaixo das plataformas e dos personagens)
  if (!stage.querySelector(".night-shade")) decor.insertAdjacentHTML("afterend", '<div class="night-shade" aria-hidden="true"></div>');
  stage.classList.toggle("night", !!G.night); stage.style.setProperty("--jaci", jaciLight().toFixed(2));   // Jaci voltando clareia a noite
  if (!stage.querySelector(".weather-fx")) stage.querySelector(".night-shade").insertAdjacentHTML("afterend", '<div class="weather-fx" aria-hidden="true"></div>');
  stage.classList.remove(...[...stage.classList].filter(c => c.startsWith("w-"))); stage.classList.add("w-" + weatherNow());   // clima do dia (data/world.js)
  decor.innerHTML = "";
  setScenery(zone || curZone || "mata");   // cenário em pixel art (gfx/scenery.js)
}

// batalha comum: o tema do Norte num arranjo do lugar (mata: roda de capoeira; água: carimbó; Belém: guitarrada);
// chefe: a versão pesada; bug do freela: a roda
const BATTLE_WATER = new Set(["rio", "igarape", "manguezal", "varzea"]), BATTLE_CITY = new Set(["cidadevelha", "porto", "baixadas"]);
function getBattleTrackFor(animal) {
  if (animal.boss) return "battleBoss";
  if (regionOfCity(curCity()) === "nordeste" && !animal.bug) return "battleNordeste";   // Nordeste: o tema da região num forró de batalha
  if (regionOfCity(curCity()) === "centroeste" && !animal.bug) return "battleCentroOeste";   // Centro-Oeste: pagode de viola
  if (regionOfCity(curCity()) === "sudeste" && !animal.bug) return "battleMinas";   // Minas: sertanejo universitário
  return animal.bug ? "battleCapo" : BATTLE_CITY.has(curZone) ? "battleGuitarrada" : BATTLE_WATER.has(curZone) ? "battleCarimbo" : "battleCapo";
}

/* ---------- comandos: lista principal e submenus (Especial e Itens) ---------- */
let subMenu = null, subFrom = 0;   // opções do submenu aberto no lugar dos comandos; subFrom = comando que o abriu
function cmdButton(html, desc, fn, off) {
  const b = document.createElement("button"); b.className = "cmd"; b.type = "button"; b.innerHTML = `<span>${html}</span>`;
  if (off) b.setAttribute("aria-disabled", "true");
  b.addEventListener("click", () => { if (!off) fn(); });
  const showDesc = () => { $("desc").textContent = desc; sfx("blip"); }; b.addEventListener("focus", showDesc); b.addEventListener("mouseenter", showDesc);
  $("cmds").appendChild(b);
}
function buildCmds() {
  subMenu = null; const box = $("cmds"); box.innerHTML = ""; box.style.minHeight = ""; box.classList.remove("scroll"); $("cmdsUp").hidden = $("cmdsDown").hidden = true;
  CMDS.forEach(c => cmdButton(`<i class="zk"></i>${cmdName(c)}<small></small>`, c.d, () => act(c.id)));   // zk = selo do Z (ou botão do controle) no escolhido
  box.style.minHeight = box.offsetHeight + "px"; box.style.setProperty("--cmdsH", box.offsetHeight + "px");   // a lista principal fixa a altura: Especial/Itens abrem no mesmo espaço
}
// opts: [{label, small, desc, fn, off}]; setas escolhem, Z confirma, X/Esc volta sem gastar o turno
function openSubMenu(opts, backDesc, from) {
  subMenu = opts; subFrom = from; sfx("look"); $("cmds").innerHTML = "";
  opts.forEach(o => cmdButton(`<i class="zk"></i>${o.label}<small>${o.small || ""}</small>`, o.desc, o.fn, o.off));
  cmdButton(`${padBadge("x")}${t("Voltar")}`, backDesc, closeSubMenu);
  $("cmds").classList.toggle("scroll", opts.length >= CMDS.length);   // bolsa cheia: não passa da altura dos comandos, rola com as setas
  $("cmds").firstChild.focus(); cmdsMore();
}
// setinhas piscando quando a lista tem mais itens para cima ou para baixo (chamada também ao rolar, em main.js)
function cmdsMore() {
  const c = $("cmds"), up = $("cmdsUp"), dn = $("cmdsDown"), sc = c.classList.contains("scroll");
  up.hidden = !sc || c.scrollTop <= 2; dn.hidden = !sc || c.scrollTop + c.clientHeight >= c.scrollHeight - 2;
  const x = c.offsetLeft + c.offsetWidth - 22 + "px";
  up.style.left = dn.style.left = x; up.style.top = c.offsetTop + "px"; dn.style.top = c.offsetTop + c.offsetHeight - 18 + "px";
}
function closeSubMenu() { const from = subFrom; buildCmds(); render(); $("cmds").children[from].focus(); }
const bagIds = () => Object.keys(ITEMS).filter(k => (p.items[k] || 0) > 0);
function openItemMenu() {
  openSubMenu(bagIds().map(k => ({label: ITEMS[k].n, small: "×" + p.items[k], desc: `${ITEMS[k].n}: ${itemEffect(ITEMS[k])}.`, fn: () => useItem(k)})), t("Fecha a bolsa sem gastar o turno."), CMDS.findIndex(c => c.id === "item"));
}
// por que um especial ainda não pode ser usado ("" = pode): flecha precisa de arco, os comprados precisam ter sido comprados
const specialLock = s => (s.id === "flecha" || s.bow) && !G.equip.ranged ? t("sem arco") : s.price && !G.owned[s.id] ? t("na feira") : s.skill && !hasSkill(s.skill) ? t("habilidade") : "";
/* especiais já liberados, na ordem em que o Rhanon conseguiu cada um (G.specOrder); o que ainda não tem não aparece.
   Os que liberam juntos (save antigo) entram pela ordem de compra: Object.keys(G.owned) guarda a ordem em que comprou */
function specialsInOrder() {
  const keys = Object.keys(G.owned), rank = s => s.id === "flecha" ? keys.findIndex(k => EQUIP.ranged[k]) : s.price ? keys.indexOf(s.id) : s.skill ? 1e4 : -1;
  SPECIALS.filter(s => !specialLock(s) && !G.specOrder.includes(s.id)).sort((a, b) => rank(a) - rank(b)).forEach(s => G.specOrder.push(s.id));
  return G.specOrder.map(id => SPECIALS.find(s => s.id === id)).filter(s => s && !specialLock(s));
}
function openSpecialMenu() {
  openSubMenu(specialsInOrder().map(s => ({label: s.n, small: s.cost + " " + t("PE"), desc: s.d, off: !avail(s.id), fn: () => { buildCmds(); act(s.id); }})),
    t("Volta aos comandos sem gastar o turno."), CMDS.findIndex(c => c.id === "especial"));
}// usa um item da bolsa: gasta o turno, como os outros comandos
function useItem(k) {
  const it = ITEMS[k]; if (busy || !(p.items[k] > 0)) return;
  buildCmds(); busy = true; preE = e.hp; HERO_A.set("eat");
  p.items[k]--; p.hp = Math.min(p.max, p.hp + it.hp); p.sp = Math.min(p.msp, p.sp + it.sp);
  sfx("heal"); pop(it.hp ? "+" + it.hp : "+" + it.sp, $("hero"), "heal"); burst(pos($("hero")), it.hp ? ["#7dff9a", "#fff"] : ["#19a8d8", "#fff"], 8, 40);
  say(t("Rhanon come {item}: {efeito}.", {item: it.n.toLowerCase(), efeito: itemEffect(it)}));
  render(); $("cmds").firstChild.focus();
  setTimeout(enemyTurn, 750);
}

// opts: animal (bicho escolhido), firstHit (dano do golpe de abertura na exploração), enemyFirst (o bicho começa)
// contra bug do freela os comandos mudam de nome (a luta é a mesma): Lança = Depurar, Observar = Testar...
let bugMode = false;
const BUG_CMD = {atacar: "Depurar", observar: "Testar", defender: "Respirar", item: "Café e açaí", fugir: "Fechar o notebook"};
const cmdName = c => bugMode && BUG_CMD[c.id] ? t(BUG_CMD[c.id]) : c.n;
function init(opts = {}) {
  bugMode = !!(opts.animal && opts.animal.bug);
  $("homeButton").hidden = true; $("map").hidden = true; $("local").hidden = true;
  $("game").classList.remove("working-mode", "challenge-mode"); $("stage").classList.remove("working"); $("workScene").hidden = true; $("beast").style.display = ""; $("hero").style.display = "";
  setBattleDecor(curZone);
  mode = "hunt";
  buildCmds();
  const animal = opts.animal || pickAnimal();
  noteSeen(animal.id);   // entra no caderno de bichos
  $("plate").querySelector("b").textContent = animal.name; $("plate").querySelector(".lv").textContent = t("Nv") + " " + (animal.lv || 1); plateElem(animal);
  $("beast").innerHTML = ""; $("beast").appendChild(animalSprite(animal)); refreshHero();
  const spr = $("beast").firstChild;
  $("beast").style.top = `calc(var(--plat) - ${spr.height / (+spr.dataset.scale || 1) * (animal.boss ? animal.scale || 1.35 : 1)} * var(--px) + 12px)`; $("beast").style.right = "12%"; $("beast").setAttribute("aria-label", animal.name); $("hero").style.display = ""; $("intent").style.display = ""; $("ehp").parentElement.style.display = ""; $("spTxt").parentElement.style.display = ""; $("sp").parentElement.style.display = "";
  musicStop();
  vit(); const mh = maxHP(G.lv), ms = maxSP(G.lv); $("again").style.display = fromExplore ? "none" : ""; $("again").textContent = t("Lutar de novo"); $("toMap").textContent = fromExplore ? t("Continuar explorando") : t("Voltar ao mapa");
  p = {hp:Math.max(1, G.hp), max:mh, sp:G.sp, msp:ms, def:false, atento:hasSkill("faro"), items:{...G.items}, furia:0};   // Faro do mateiro: começa atento
  if (hasSkill("faro")) opts = {...opts, enemyFirst: false};   // ...e o bicho nunca pega de surpresa
  // freela do mapa de queimadas (Brasília): a brigada apaga os focos antes e o bicho tomado chega com 10% menos PV
  const far = !animal.bug && !!ZONES[curZone] && CITY[cityOf(curZone)].map !== "norte";   // chefe de fora do Norte: mais vida e o golpe forte
  const ehp = Math.round(animal.hp * (G.portfolio.mapa_queimadas && !animal.bug && isTomado(animal) ? .9 : 1) * (animal.boss && far ? BOSS_HP_FAR : 1) * beastToughness(animal));
  e = { ...animal, hp:ehp, max:ehp, intent:null, known:false, assustada:false, rematch: !!opts.rematch, far, turn: 0 };   // rematch: revanche pela lembrança do chefe
  busy = false;
  lines = [animal.intro];
  if (opts.firstHit) { e.hp = Math.max(1, e.hp - opts.firstHit); lines.push(t("Rhanon acertou primeiro: −{n}. Sua vez!", {n: opts.firstHit})); }
  if (opts.enemyFirst) lines.push(t("{bicho} pegou Rhanon de surpresa!", {bicho: theName(animal, true)}));
  if (!animal.bug && WEATHER[weatherNow()].fight) lines.push(WEATHER[weatherNow()].fight);   // o clima do dia mexe na luta
  $("over").hidden = true;
  const wet = WATER_BATTLE.has(animal.id);   // bicho de água: laguinho no lugar do chão e ele meio submerso
  // peixes afundam mais; jacaré, ariranha e cobras só um pouco
  $("beast").className = "beast" + (wet ? " submerged" + (AQUATIC.has(animal.id) ? "" : " shallow") : "") + (isTomado(animal) && !opts.rematch ? " tomado" : "");   // tomado: brilho escuro da fumaça
  $("hero").className = "hero"; $("stage").classList.toggle("aquatic", wet); holdE = null; holdP = null; $("meMedal").style.backgroundImage = `url(${heroMedal()})`; $("lvTxt").textContent = t("Nv") + " " + G.lv + (defense() ? " · " + t("DEF") + " " + defense() : "");
  pick(); render();
  $("cmds").firstChild.focus(); musicStart(getBattleTrackFor(animal));
  // abertura: o Rhanon entra pela esquerda, o bicho chega pela direita e o nome dele aparece numa faixa
  PFX.clear();
  HERO_A.mount($("hero"), {weapon: true, mode: "battle", state: "walk"});
  const boss = !!e.boss;
  BEAST_A.mount($("beast"), $("beast").querySelector("canvas") || animalSprite(e), {id: e.id, boss, scale: e.scale, state: "enter", fit: true, smoke: isTomado(animal) && !opts.rematch});   // scale: chefe com tamanho próprio (o padrão é 1,35); smoke: sobra em volta para a fumaça
  busy = true; render();
  HERO_A.slide("-38vw", "0px", 650, () => HERO_A.set("idle"));
  const ready = () => { if (opts.enemyFirst) return enemyTurn(); busy = false; render(); $("cmds").firstChild && $("cmds").firstChild.focus(); };
  if (boss && !REDUCE) return bossIntro(ready);
  BEAST_A.slide("42vw", "0px", 600, () => { BEAST_A.set("idle"); BEAST_A.dust(); BEAST_A.bang(); animalCry(e.id, boss); });
  setTimeout(() => encounterBanner(e.name), 380);
  setTimeout(ready, REDUCE ? 300 : 1350);
}
/* apresentação do chefe (a música do chefe abre junto, com tambores e badalada): o chefe chega, "CUIDADO!" bate na
   tela, ele solta um rugido longo que faz tudo tremer, o Rhanon gira a lança e firma a guarda, e só então o nome aparece */
const BOSS_INTRO = {warn: 450, roar: 1500, ready: 2700, name: 3600, go: 4500};
function bossIntro(done) {
  const me = e, at = (ms, fn) => setTimeout(() => { if (e === me && mode === "hunt" && e.hp > 0 && p.hp > 0) fn(); }, ms);   // outra batalha começou ou a luta acabou: para
  BEAST_A.slide("42vw", "0px", 700, () => { BEAST_A.set("idle"); BEAST_A.dust(); });
  const treino = e.rematch;   // treino com o chefe aliado: aviso amigável e um grito só, sem o tremor de ameaça
  at(BOSS_INTRO.warn, () => treino ? bossWarn(t("{bicho} topou treinar contigo", {bicho: theName(e, true)}), true) : bossWarn(t("Um chefe bloqueia o caminho")));
  at(BOSS_INTRO.roar, () => {
    BEAST_A.set("bigroar"); animalCry(e.id, false, treino ? 1 : 1.4);   // o grito do bicho na frente...
    if (treino) return shake("gshake-s");
    bossRoar(e.id); musicDuck(1400);   // ...e o ronco do chefe, diferente para cada um
    hitImpact("forte"); shake("gshake"); setTimeout(() => shake("gshake"), 380); setTimeout(() => shake("gshake-s"), 760);
  });
  at(BOSS_INTRO.ready, () => { HERO_A.set("ready"); sfx("spear"); setTimeout(() => sfx("bloqueio"), 600); });
  at(BOSS_INTRO.name, () => encounterBanner(e.name, treino ? t("treino!") : t("chefe!")));
  at(BOSS_INTRO.go, done);
}
// etiquetas de fraqueza e resistência na placa do bicho: só as que o Rhanon já descobriu usando o elemento nele
function plateElem(a) {
  const el = $("plate").querySelector(".elem") || $("plate").appendChild(document.createElement("span")), [w, ...r] = ELEM_OF[a.id] || [];
  el.className = "elem"; el.innerHTML = !w ? "" : [[w, false], ...r.map(k => [k, true])].filter(([k]) => elemKnown(a, k))
    .map(([k, res]) => `<i class="${res ? "resiste" : "fraco"}" style="--ec:${ELEMENTS[k].c}" title="${t(res ? "Resiste: {elemento}" : "Fraco: {elemento}", {elemento: ELEMENTS[k].n})}">${elemIcon(res ? "resiste" : "fraco")} ${ELEMENTS[k].n}</i>`).join("");
}
/* dificuldade (lote B): chefe de fora do Norte tem BOSS_HP_FAR da vida e, a cada BOSS_HEAVY_EVERY turnos, avisa um golpe
   forte (BOSS_HEAVY × o dano máximo) que pede guarda (Defender corta para BOSS_HEAVY_GUARD); bicho comum bem abaixo do
   nível do Rhanon aguenta mais (beastToughness), para a luta não acabar no primeiro golpe */
const BOSS_HP_FAR = 1.4, BOSS_HEAVY_EVERY = 4, BOSS_HEAVY = 1.8, BOSS_HEAVY_GUARD = .3;
const beastToughness = a => a.boss || a.bug ? 1 : Math.min(1.5, 1 + .08 * Math.max(0, G.lv - (a.lv || 1) - 2));
const moveName = () => e.intent === "forte" ? t("Golpe forte") : (e.moves || MOVES)[e.intent];
function pick() {
  e.turn = (e.turn || 0) + 1;
  if (e.boss && e.far && e.turn % BOSS_HEAVY_EVERY === 0) { e.intent = "forte"; e.known = true; return; }   // o golpe forte vem sempre avisado
  const r = Math.random() * 100;
  e.intent = r < 45 ? "arranhao" : r < 80 ? "bote" : "rugido";
  e.known = false;
}
// o bicho da luta nas frases: foe(1) = "A onça-pintuda", foe() = "a onça-pintuda"
const foe = cap => theName(e, cap);
function say(t) { lines.push(t); if (lines.length > 4) lines.shift(); }
function avail(id) {
  if (busy) return false;
  const sp = SPECIALS.find(s => s.id === id);
  if (id === "aliado" && (p.aliadoUsado || !allyList().length)) return false;   // uma vez por luta, e só com chefe final acalmado
  if (sp) return !specialLock(sp) && p.sp >= sp.cost;
  if (id === "especial") return SPECIALS.some(s => avail(s.id));
  if (id === "item") return bagIds().length > 0;
  return true;
}
function render() {
  const eh = holdE !== null ? holdE : e.hp, ph = holdP ? holdP.hp : p.hp, ps = holdP ? holdP.sp : p.sp;
  $("ehp").style.width = (100 * eh / e.max) + "%";
  $("pv").style.width = (100 * ph / p.max) + "%";
  $("sp").style.width = (100 * ps / p.msp) + "%";
  $("pvTxt").textContent = ph + " / " + p.max;
  $("spTxt").textContent = ps + " / " + p.msp;
  drawXp();
  $("log").innerHTML = lines.map(l => "<p>" + l + "</p>").join("");
  $("intentTxt").textContent = e.intent === "forte" ? t("{bicho} junta forças: golpe forte! Defenda.", {bicho: foe(1)}) : e.known ? t("Próximo golpe: {golpe}", {golpe: moveName()}) : t("{bicho} prepara o golpe…", {bicho: foe(1)});
  $("intent").className = "intent" + (e.known ? " known" : "") + (e.intent === "forte" ? " forte" : "");
  // estados como ícones (ui/theme.js), com os turnos que faltam; o nome aparece ao passar o mouse e para leitores de tela
  $("status").innerHTML = statusList().map(([k, name, n]) => `<span class="st" title="${name}"><img src="${statusIconURL(k)}" alt="${name}">${n ? `<b>${n}</b>` : ""}</span>`).join("");
  $("furia").className = "furia" + (furyReady() ? " cheia" : "");
  $("hero").classList.toggle("escudo", p.escudo > 0);   // rabo-bandeira e Brilho das estrelas: escudo de luar na frente do Rhanon
  [...$("furia").children].forEach((d, i) => { d.classList.toggle("on", i < (p ? p.furia || 0 : 0)); d.hidden = i >= furyMax(); });
  if (!subMenu) CMDS.forEach((c, i) => {
    const b = $("cmds").children[i];
    if (c.id === "atacar" && b.dataset.f !== String(furyReady())) {   // fúria pronta: a lança vira o golpe da fúria
      b.dataset.f = furyReady(); b.classList.toggle("furia-cmd", furyReady());
      b.firstChild.innerHTML = `<i class="zk"></i>${furyReady() ? t(bugMode ? "Estado de flow!" : "Fúria!") : cmdName(c)}<small></small>`;
    }
    b.setAttribute("aria-disabled", avail(c.id) ? "false" : "true");
    b.querySelector("small").textContent = c.id === "item" ? "×" + itemCount(p.items) : c.id === "especial" ? t("PE") : "";
  });
}
/* golpe no tempo certo: um anel discreto com "Z" fecha até a hora do impacto e fica verde na janela certa.
   Apertar Z (ou Espaço, ou tocar no palco) nessa janela dá "Perfeito!" (+30% de dano) no golpe do Rhanon ou
   "Bloqueio!" (metade do dano) no golpe do bicho. Uma tentativa por golpe: apertar fora da hora perde a chance. */
const QTE_EARLY = 250, QTE_LATE = 150;   // janela, em ms, antes e depois do impacto (o anel fica verde e faz "tic" quando ela abre)
let qte = null, foeImpact = 0;           // qte = {at, el, ok, tried}; foeImpact = quando o último golpe do bicho chega
function qteArm(impactIn, target) {
  qteClear();
  const q = pos(target), el = el$("qte", {left: q.x + "px", top: q.y - 34 + "px"}), lead = Math.max(0, impactIn - QTE_EARLY);
  // alvo fixo (::before), o anel que fecha até ele (i) e a tecla no meio; no controle, o botão dele (ui/gamepad.js)
  el.innerHTML = `<i></i><u></u><b>${padLabel("z")}</b>`; el.style.setProperty("--dur", lead + "ms");
  qte = {at: performance.now() + impactIn, el, ok: false, tried: false};
  setTimeout(() => { if (el.isConnected) { el.classList.add("agora"); sfx("janela"); } }, lead);
  setTimeout(() => el.remove(), impactIn + QTE_LATE + 260);
}
function qteClear() { if (qte && qte.el) qte.el.remove(); qte = null; }
function qtePress() {
  if (!qte || qte.tried || mode !== "hunt") return;
  qte.tried = true;
  const dt = performance.now() - qte.at;
  qte.ok = dt >= -QTE_EARLY && dt <= QTE_LATE;
  qte.el.classList.add(qte.ok ? "acertou" : "errou");
}
// no impacto: devolve se acertou o tempo (e encerra a janela); cada janela conta para a fúria
function qteTake() { const had = !!qte, ok = !!(qte && qte.ok); qteClear(); if (had) furyNote(ok); return ok; }
/* fúria: FURY_MAX tempos certos seguidos (golpe perfeito ou bloqueio) enchem a barra; errar ou deixar passar zera.
   Cheia, o comando da lança vira "Fúria!": três estocadas seguidas (FURY_HIT do golpe) e a última mais forte (FURY_LAST).
   Antes enchia com 3 (2 com Sangue quente) e cada estocada era um golpe inteiro: quem acertava o tempo vencia chefe em 2 turnos */
const FURY_MAX = 4, FURY_HIT = .8, FURY_LAST = 1.4, FURY_LAST_CRIT = 1.9;
const furyMax = () => hasSkill("furia2") ? FURY_MAX - 1 : FURY_MAX;   // habilidade Sangue quente: enche com um acerto a menos
const furyReady = () => !!p && p.furia >= furyMax();
function furyNote(ok) {
  if (!p || furyReady()) return;
  if (!ok) { p.furia = hasSkill("furia_guarda") ? Math.max(0, p.furia - 1) : 0; return; }   // Fúria guardada: perde só 1
  p.furia++;
  if (furyReady()) setTimeout(() => { pop(t("FÚRIA PRONTA!"), $("hero"), "crit"); sfx("furia"); say(t(furyMax() === 3 ? "Três no tempo certo! Fúria pronta: usa a lança." : "Quatro no tempo certo! Fúria pronta: usa a lança.")); render(); }, 420);
}
function hitBeast() {
  const b = $("beast"); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
  if (BEAST_A.state !== "defeat") BEAST_A.set("hurt");
}
function act(id, ally) {
  if (!avail(id)) return;
  if (id === "aliado" && !ally) return openAllyMenu();   // escolhe o aliado; o turno só é gasto ao escolher
  if (id === "defender") HERO_A.set("guard");
  if (id === "item") return openItemMenu();          // submenus: o turno só é gasto ao escolher algo dentro deles
  if (id === "especial") return openSpecialMenu();
  if (id === "observar") HERO_A.set("observe");
  busy = true; preE = e.hp;
  let extra = false, wait = 0;   // wait = duração da animação do golpe (o bicho só responde depois)
  if (id === "atacar" && furyReady()) {
    p.furia = 0;
    const n = hasSkill("furia4") ? 4 : 3;   // habilidade Fúria da onça: uma estocada a mais
    const ds = [...Array(n).keys()].map(i => { let d = rnd(6, 10) + G.lv - 1 + weaponAtk(); d = Math.round(d * (i === n - 1 ? (p.atento ? FURY_LAST_CRIT : FURY_LAST) : FURY_HIT)); if (p.weak > 0) d = Math.ceil(d / 2); return d; });
    p.atento = false; e.hp = Math.max(0, e.hp - ds.reduce((a, b) => a + b, 0));
    wait = furyStrike(ds);
  } else if (id === "atacar") {
    let d = rnd(6, 10) + G.lv - 1 + weaponAtk(), crit = p.atento;
    if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d);
    wait = strike(d, crit ? "crit" : "", "spear", crit ? t("Golpe certeiro no ponto fraco: −{n}!", {n: d}) : t("Lançada: −{n}.", {n: d}));
  } else if (id === "arremesso") {   // lança arremessada: mais dano que o golpe, mas pode errar
    p.sp -= 3;
    const miss = !p.atento && Math.random() < .2;
    let d = miss ? 0 : rnd(10, 15) + G.lv - 1 + weaponAtk(), crit = !miss && p.atento;
    if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d);
    wait = strike(d, crit ? "crit" : "", "throw", miss ? t("Rhanon joga a lança, mas {bicho} desvia!", {bicho: foe()}) : crit ? t("Arremesso certeiro no ponto fraco: −{n}!", {n: d}) : t("Rhanon joga a lança: −{n}.", {n: d}));
  } else if (id === "dupla") {   // Estocada dupla: duas lançadas, cada uma com o seu anel
    p.sp -= 8;
    wait = strikeTwice("spear", () => { let d = Math.round((rnd(6, 10) + G.lv - 1 + weaponAtk()) * .8), crit = p.atento; if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2); return {d, cls: crit ? "crit" : "", msg: t("Estocada: −{n}.", {n: d})}; });
  } else if (id === "flecha2") {   // Flecha dupla: duas flechas, cada uma com 40% de crítico
    p.sp -= 8;
    wait = strikeTwice("arrow", () => { let d = rnd(5, 9) + G.lv - 1 + ((EQUIP.ranged[G.equip.ranged] || {}).atk || 0) + charmStat("atk") + skillStat("atk") + (hasSkill("mira") ? 4 : 0), crit = p.atento || Math.random() < .4; if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2); return {d, cls: crit ? "crit" : "", msg: crit ? t("Flechada certeira no ponto fraco: −{n}!", {n: d}) : t("Flechada: −{n}.", {n: d})}; });
  } else if (id === "investida" || id === "luar") {   // Investida do lobo-guará (corta o golpe forte) e Lança de luar (cresce com os chefes acalmados)
    p.sp -= id === "luar" ? 14 : 10;
    const forte = id === "investida" && e.intent === "forte";
    let d = Math.round((rnd(6, 10) + G.lv - 1 + weaponAtk()) * (id === "luar" ? Math.min(2.5, 1 + .02 * bossesCalm()) : forte ? 3.2 : 1.6));
    if (p.atento) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d);
    if (forte) { e.intent = "arranhao"; e.known = true; }   // o golpe forte se desfaz
    wait = strike(d, "crit", "spear", id === "luar" ? t("Lança de luar: −{n}!", {n: d}) : forte ? t("Investida no meio do golpe forte: −{n}! O golpe se desfaz.", {n: d}) : t("Investida: −{n}!", {n: d}));
    if (id === "luar") setTimeout(() => { const r = $("beast").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height / 2); PFX.burst(16, "star", ["#ffffff", "#cfe0ff"], gx, gy, 20, {life: 1, up: 8}); }, 450);
  } else if (id === "laco") {   // Laço de cipó: pouco dano e o bicho perde a vez (chefe: metade das vezes)
    p.sp -= 10;
    let d = Math.round((rnd(6, 10) + G.lv - 1 + weaponAtk()) * .5); if (p.weak > 0) d = Math.ceil(d / 2);
    const ok = !e.boss || Math.random() < .5; if (ok) e.perde = 1;
    e.hp = Math.max(0, e.hp - d);
    wait = strike(d, "", "cipo", ok ? t("O laço de cipó prende {bicho}: −{n}, e perdeu a vez.", {bicho: foe(), n: d}) : t("O laço pega {bicho} de raspão: −{n}. Ele se soltou.", {bicho: foe(), n: d}));
  } else if (id === "estrelas") {   // Brilho das estrelas: os 2 próximos golpes do bicho batem pela metade
    p.sp -= 10; p.escudo = Math.max(p.escudo || 0, 2);
    HERO_A.set("cast"); sfx("heal");
    const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .4);
    PFX.burst(16, "star", ["#ffffff", "#ffd23a", "#cfe0ff"], gx, gy, 22, {life: 1.1, up: 6});
    say(t("Brilho das estrelas: os 2 próximos golpes batem pela metade."));
    wait = 900;
  } else if (id === "aliado") {   // Chamado do aliado: o chefe acalmado vem e dá o golpe dele
    p.sp -= 12; p.aliadoUsado = true;
    const r = allyCall(ally); wait = r.wait; extra = r.extra;
  } else if (SPECIALS.find(s => s.id === id && s.elem)) {   // especial de elemento (tocha, cuia, vento, raio): fraqueza 1,5× e "Mais uma!", resistência metade
    const k = SPECIALS.find(s => s.id === id).elem, m = bugMode ? 1 : elemMult(e, k), fresh = !bugMode && !elemKnown(e, k);
    elemLearn(e, k);
    p.sp -= 6;
    let d = Math.round((rnd(14, 18) + G.lv - 1 + charmStat("atk") + skillStat("atk")) * m * (bugMode ? 1 : weatherBoost(k))); if (p.weak > 0) d = Math.ceil(d / 2);   // clima: chuva fortalece água e raio...
    e.hp = Math.max(0, e.hp - d);
    const v = {bicho: foe(), n: d}, msg = {fogo: t("A tocha cospe fogo n{bicho}: −{n}.", v), agua: t("A cuia joga um jato d'água n{bicho}: −{n}.", v), vento: t("Um sopro de vento acerta {bicho}: −{n}.", v), raio: t("Um raio cai n{bicho}: −{n}.", v),
      cipo: t("Um chicote de cipó estala n{bicho}: −{n}.", v), folhas: t("Folhas afiadas cortam {bicho}: −{n}.", v)};
    const kind = k === "fogo" ? "fire" : k === "planta" ? (Math.random() < .5 ? "cipo" : "folhas") : k;   // planta: sorteia o chicote ou as folhas
    wait = strike(d, m > 1 ? "crit" : "", kind, msg[kind === "fire" ? "fogo" : kind]);
    if (m < 1) setTimeout(() => { say(t("{bicho} resistiu ao golpe.", {bicho: foe(1)})); pop(t("RESISTIU!"), $("beast")); render(); }, wait + 200);
    if (fresh) setTimeout(() => { plateElem(e); if (m === 1) say(t("{elemento} não faz nada de especial n{bicho}. Anotado no caderno.", {elemento: ELEMENTS[k].n, bicho: foe()})); render(); }, wait + 250);   // descobriu: a placa mostra (e o caderno anota)
    if (m > 1 && !e.assustada && e.hp > 0) { e.assustada = true; extra = true; setTimeout(() => { say(t("FRAQUEZA! {bicho} recuou {assustado}. Mais uma!", {bicho: foe(1), assustado: ending(e, "assustado", "assustada")})); render(); sfx("more"); pop(t("FRAQUEZA!"), $("beast"), "crit"); }, wait + 200); }
  } else if (id === "flecha") {   // tiro com o arco: menos dano que a lança, mas 40% de chance de crítico
    p.sp -= 3;
    let d = rnd(5, 9) + G.lv - 1 + ((EQUIP.ranged[G.equip.ranged] || {}).atk || 0) + charmStat("atk") + skillStat("atk") + (hasSkill("mira") ? 4 : 0), crit = p.atento || Math.random() < .4;   // arco melhor = flecha mais forte
    if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d);
    wait = strike(d, crit ? "crit" : "", "arrow", crit ? t("Flechada certeira no ponto fraco: −{n}!", {n: d}) : t("Flechada: −{n}.", {n: d}));
  } else if (id === "cura") {   // Reza de cura (árvore do Pajé): recupera parte da vida; Reza forte cura mais e limpa o veneno
    p.sp -= 6;
    const strong = hasSkill("cura2"), n = Math.min(p.max - p.hp, Math.round(p.max * (strong ? .45 : .3)));
    p.hp += n; if (strong) p.dot = null;
    HERO_A.set("victory"); sfx("heal");
    const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .4);
    PFX.burst(12, "heart", ["#7dff9a", "#ffffff", "#c8a0ff"], gx, gy, 22, {life: 1, up: 12});
    pop("+" + n, $("hero"), "heal");
    say(strong ? t("Reza forte: +{n} PV, e o corpo fica limpo.", {n}) : t("Reza de cura: +{n} PV.", {n}));
    wait = 900;
  } else if (id === "observar") {
    e.known = true; p.atento = true; sfx("look");
    say(t("Rhanon estuda {bicho}. Vem aí: {golpe}.", {bicho: foe(), golpe: moveName()}));
  } else if (id === "defender") {
    p.def = true; p.sp = Math.min(p.msp, p.sp + 3); sfx("guard");
    say(t("Rhanon levanta a guarda."));
  } else if (id === "fugir") {
    const chance = p.preso > 0 ? 0 : 35 + (e.hp < 30 ? 25 : 0) + (e.known ? 15 : 0);
    if (Math.random() * 100 < chance) { render(); return finish("flee"); }
    say(p.preso > 0 ? t("Rhanon tá preso, não dá pra fugir!") : t("{bicho} cortou o caminho. Não deu pra fugir!", {bicho: foe(1)}));
  }
  const again = !extra && (["atacar", "arremesso", "flecha", "dupla", "flecha2", "investida", "luar", "laco"].includes(id) || SPECIALS.some(s => s.id === id && s.elem)) && charmRoll("turno");   // talismã: age de novo
  const bonus = !extra && !again && p.bonus && id !== "fugir"; if (bonus) p.bonus = false;   // contra-ataque perfeito: esta ação não passa a vez
  render();
  setTimeout(() => {
    if (e.hp <= 0) return finish("win");
    if (again) { say(t("O talismã brilha: mais um turno!")); pop(t("DE NOVO!"), $("hero"), "crit"); sfx("more"); }
    if (bonus) { say(t("Mais uma ação!")); pop(t("DE NOVO!"), $("hero"), "crit"); sfx("more"); }
    if (extra || again || bonus) { busy = false; render(); return; }
    setTimeout(enemyTurn, 450);   // respiro antes do bicho reagir
  }, wait + 550);
}
function enemyTurn() {
  const i = e.intent; foeImpact = 0;
  if (e.perde > 0) {   // laço de cipó ou abraço do tempo: o bicho fica parado
    e.perde = 0; say(t("{bicho} não consegue se mexer: perdeu a vez.", {bicho: foe(1)})); pop(t("PRESO!"), $("beast"), "crit"); BEAST_A.set("hurt");
    foeImpact = 600;
  } else if (charmRoll("encanto")) {   // talismã do Boto: o bicho fica parado, encantado
    say(t("O talismã encanta {bicho}: perdeu a vez.", {bicho: foe()})); pop(t("ENCANTADO!"), $("beast"), "crit"); sfx("look"); BEAST_A.set("hurt");
    foeImpact = 600;
  } else if (i === "forte") {   // o golpe forte avisado: com a guarda levantada, passa só um pedaço
    let d = Math.round(e.damage[1] * BOSS_HEAVY); if (p.def) d = Math.ceil(d * BOSS_HEAVY_GUARD); d = Math.max(1, d - pdef());
    p.hp -= d; foeAttack("claw", d); shake("gshake");
    say(p.def ? t("A guarda segura o golpe forte d{bicho}: −{n} PV.", {bicho: foe(), n: d}) : t("Golpe forte d{bicho}! −{n} PV.", {bicho: foe(), n: d}));
  } else if (i === "arranhao") {
    let d = rnd(e.damage[0], Math.max(e.damage[0], Math.min(e.damage[1], e.damage[0]+3))); if (p.def) d = Math.ceil(d / 2); d = Math.max(1, d - pdef());
    p.hp -= d; foeAttack("claw", d); say(t("{bicho} ataca: −{n} PV.", {bicho: foe(1), n: d}));
  } else if (i === "bote") {
    let d = rnd(Math.max(e.damage[0], e.damage[1]-4), e.damage[1]); d = Math.max(1, d - pdef());
    if (p.def) {
      d = Math.ceil(d * .35); e.hp = Math.max(0, e.hp - 4); hitBeast();
      say(t("Desviou! O bote pega de raspão: −{n} PV. Contra-ataque: −4.", {n: d}));
    } else say(t("{bicho} vem com tudo! −{n} PV.", {bicho: foe(1), n: d}));
    p.hp -= d; foeAttack("claw", d);
  } else {
    if (e.special) special(); else { const sp0 = p.sp; p.hp -= 3; p.sp = Math.max(0, p.sp - 4); foeAttack("roar", 3, sp0); }
    if (!e.special) say(t("{bicho} encara Rhanon. −3 PV, −4 PE.", {bicho: foe(1)}));
  }
  p.def = false; e.assustada = false;
  setTimeout(() => {
    tick(); p.hp = Math.max(0, p.hp);
    if (e.hp <= 0) { render(); return finish("win"); }
    if (p.hp <= 0 && hasSkill("jaci") && !p.jaciUsada) {   // Luz de Jaci: uma vez por luta, levanta com 30% da vida
      p.jaciUsada = true; p.hp = Math.ceil(p.max * .3); HERO_A.set("victory"); sfx("heal"); pop(t("LUZ DE JACI!"), $("hero"), "heal");
      const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .3);
      PFX.burst(18, "spark", ["#ffffff", "#cfe0ff", "#e8f0ff"], gx, gy, 20, {life: 1.2, up: 12});
      say(t("A luz de Jaci cai sobre o Rhanon: ele levanta com {n} PV!", {n: p.hp}));
    }
    if (p.hp <= 0) { render(); return finish("lose"); }
    pick(); busy = false; render();
  }, foeImpact + 150);
}
/* Pytuna não solta fácil o último chefe de dia de cada cidade: até a primeira vitória, quando o chefe quase volta a si,
   a fumaça entra de volta nele, ele levanta com PYT_HOLD da vida, mais forte e com o tema de Pytuna tocando, e a luz de
   Jaci devolve PYT_SP do PE ao Rhanon. Ninguém morre: o chefe só não voltou a si ainda */
const PYT_HOLD = .6, PYT_DMG = 1.15, PYT_SP = .35;
const pytunaBosses = () => Object.values(CITY).map(c => c.route.filter(z => ZONES[z]).pop()).filter(Boolean).map(z => ZONES[z].boss);   // o último chefe de dia de cada cidade
const pytunaHolds = () => mode === "hunt" && e.boss && !e.rematch && !e.night && !e.possuido && !bugMode && ZONES[curZone] && !BS()[curZone] && pytunaBosses().includes(e.id);
function pytunaPossess() {
  const me = e; e.possuido = true; e.segurando = true; busy = true; render();   // segurando: a vida fica em 0 durante a cena, e nenhuma vitória conta
  const at = (ms, fn) => setTimeout(() => { if (e === me && mode === "hunt" && p.hp > 0) fn(); }, REDUCE ? ms / 3 : ms);
  BEAST_A.set("hurt"); musicStop(); say(t("{bicho} quase volta a si...", {bicho: foe(1)})); render();
  at(1000, () => {   // a fumaça volta de todo lado para dentro do chefe, e Pytuna fala
    sfx("rugidoChefe"); musicStart("pytuna"); shake("gshake-s"); $("beast").classList.add("possuido");
    const r = $("beast").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .45);
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, R = 28 + (i % 3) * 8; PFX.emit("puff", PYT_SMOKE, gx + Math.cos(a) * R, gy + Math.sin(a) * R * .7, -Math.cos(a) * R / 1.1, -Math.sin(a) * R * .7 / 1.1, 1.1); }
    say(t("Pytuna puxa a fumaça de volta: \"Esse aí ainda é meu, curumim.\"")); render();
  });
  at(2600, () => {   // levanta mais forte
    e.hp = Math.round(e.max * PYT_HOLD); e.damage = e.damage.map(d => Math.round(d * PYT_DMG)); e.segurando = false;
    BEAST_A.set("bigroar"); animalCry(e.id, true, 1.4); hitImpact("forte"); shake("gshake");
    encounterBanner(e.name, t(ending(e, "possuído por Pytuna!", "possuída por Pytuna!")));
    say(t("{bicho} levanta com a fumaça de Pytuna, mais forte!", {bicho: foe(1)})); render();
  });
  at(4000, () => {   // e a luz de Jaci responde
    const n = Math.max(0, Math.min(p.msp - p.sp, Math.round(p.msp * PYT_SP)));
    p.sp += n; jaciJingle(); HERO_A.set("ready");
    const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .35);
    PFX.burst(14, "dot", ["#fff8c8", "#ffffff", "#bfe8ff"], gx, gy, 18, {life: 1, up: 14});
    if (n) pop("+" + n + " " + t("PE"), $("hero"), "heal");
    say(n ? t("A luz de Jaci aquece Rhanon: +{n} PE.", {n}) : t("A luz de Jaci aquece Rhanon."));
    pick(); busy = false; render(); $("cmds").firstChild && $("cmds").firstChild.focus();
  });
}
function finish(kind) {
  if (kind === "win" && e.segurando) return;   // um golpe atrasado no meio da cena do Pytuna
  if (kind === "win" && pytunaHolds()) return pytunaPossess();
  if (kind === "win") { beastThanks(); setTimeout(() => HERO_A.set("victory"), 250); }
  else if (kind === "lose") HERO_A.set("defeat");
  else if (kind === "flee") { HERO_A.set("flee"); HERO_A.slide("0px", "-60vw", 1000); }
  // depois da fanfarra, a música do lugar volta baixinho enquanto o cartão de resultado está na tela
  setTimeout(() => { if (!$("over").hidden && mode === "hunt") musicStart(fromLocal || fromExplore ? "local" : "map"); }, 2800);
  busy = true; battleResult = kind;
  const xp0 = {lv: G.lv, xp: G.xp};   // para a barra de XP do cartão encher do ponto em que estava
  musicStop(); keepVitals(kind); const rw = kind === "win" ? reward(e, e.rematch ? REMATCH_XP : 1, false, true) : []; if (kind === "win") $("beast").classList.add("dead"); fanfare(kind);
  // cartão: título, uma frase curta e, embaixo, o que ganhou ou perdeu (um item por linha)
  const O = theName(e, true), pick = l => l[rnd(0, l.length - 1)], home = t({belem: "Acordou no Ver-o-Peso, com metade das forças", saoluis: "Acordou na Praia Grande, com metade das forças", teresina: "Acordou no Troca-Troca, com metade das forças", recife: "Acordou no Recife Antigo, com metade das forças", petrolina: "Acordou na orla do Velho Chico, com metade das forças", cuiaba: "Acordou no Porto de Cuiabá, com metade das forças", bh: "Acordou no Mercado Central, com metade das forças", ouropreto: "Acordou na Praça Tiradentes, com metade das forças", bonito: "Acordou no centro de Bonito, com metade das forças", brasilia: "Acordou no Plano Piloto, com metade das forças"}[curCity()] || "Acordou na aldeia, com metade das forças");
  const T = {
    win:  e.bug ? [t("Bug resolvido!"), t("{bicho} sumiu do código.", {bicho: O})] : e.rematch ? [t("Treino concluído!"), t("{bicho} gostou do treino.", {bicho: O})]
      : e.boss ? [t(ending(e, "Chefe acalmado!", "Chefe acalmada!")), t("{bicho} voltou a si. A trilha está livre.", {bicho: O})]
      : [t(pick(["Vitória!", "Mandou bem!", "É isso aí!"])), t(WATER_BATTLE.has(e.id) ? "{bicho} sumiu na água." : pick(["{bicho} saiu correndo.", "{bicho} desistiu da briga.", "{bicho} não quer mais conversa."]), {bicho: O})],
    flee: [t("Fugiu!"), t("{bicho} fica pra próxima.", {bicho: O})],
    lose: e.rematch ? [t("Fim do treino"), t("{bicho} venceu dessa vez. Bora de novo?", {bicho: O})] : [t("Desmaiou..."), t("{bicho} levou a melhor.", {bicho: O})]
  }[kind];
  if (kind === "lose") rw.push(home, G.lastLoss && t("R$ {n} a menos", {n: G.lastLoss}));
  setTimeout(() => {
    $("overTitle").textContent = T[0]; $("overTxt").textContent = [T[1], ...rw].filter(Boolean).join("\n");
    const again = kind !== "lose" && !fromExplore;
    if (fromExplore && kind === "lose") $("toMap").textContent = t({belem: "Voltar ao Ver-o-Peso", saoluis: "Voltar à Praia Grande", teresina: "Voltar ao Troca-Troca", recife: "Voltar ao Recife Antigo", petrolina: "Voltar à orla", cuiaba: "Voltar ao Porto", bh: "Voltar ao Mercado", ouropreto: "Voltar à Praça", bonito: "Voltar ao centro de Bonito", brasilia: "Voltar ao Plano Piloto"}[curCity()] || "Voltar à aldeia");
    $("again").style.display = again ? "" : "none"; $("over").hidden = false; (again ? $("again") : $("toMap")).focus();
    overXp(kind === "win" ? xp0 : null);
  }, kind === "win" ? 1700 : kind === "lose" ? 1900 : 1150);
}
/* barra de XP no cartão da vitória: enche do XP de antes até o de agora com o som subindo (xpFillSound); se passar de
   nível, enche até o fim, toca a subida de nível e recomeça do zero no nível novo */
function overXp(from) {
  const box = $("overXp"); box.hidden = !from; box.classList.remove("up"); if (!from) return;
  const bar = box.querySelector("i"), txt = box.querySelector("small"), to = {lv: G.lv, xp: G.xp};
  const legs = [];   // trechos: [nível, de, até] em frações da barra
  for (let lv = from.lv; lv <= to.lv; lv++) legs.push([lv, lv === from.lv ? from.xp / need(lv) : 0, lv === to.lv ? to.xp / need(lv) : 1]);
  const show = (lv, f) => { bar.style.width = (100 * f) + "%"; txt.textContent = `${t("Nv")} ${lv} · XP ${Math.round(f * need(lv))} / ${need(lv)}`; };
  show(legs[0][0], legs[0][1]);
  let k = 0;
  const run = () => {
    if (k >= legs.length || $("over").hidden) return;
    const [lv, a, b] = legs[k++], dur = REDUCE ? 0 : Math.max(.25, (b - a) * 1.4), t0 = performance.now();
    if (b <= a) { show(lv, b); return run(); }
    xpFillSound(dur, a, b);
    const step = now => {
      const p = Math.min(1, (now - t0) / (dur * 1000 || 1)); show(lv, a + (b - a) * p);
      if (p < 1) return requestAnimationFrame(step);
      if (b >= 1 && k < legs.length) { levelUpFx(legs[k][0]); box.classList.add("up"); setTimeout(run, 900); }   // subiu: festa e recomeça no nível novo
      else xpDing();
    };
    requestAnimationFrame(step);
  };
  setTimeout(run, 350);
}
/* vitória: o bicho volta a si, agradece (coração; passarinho, nota; macaco, joinha) e corre para o mato pela direita;
   peixe afunda na água; o chefe fica, calmo, porque vira aliado (ponto de treino na exploração) */
function beastThanks() {
  const id = e.id, g = id === "macaco" ? "thumb" : BIRDS.has(id) ? "note" : "heart", person = MOTION[id] === "person";
  BEAST_A.set("idle");
  if (e.bug) return setTimeout(() => $("beast").classList.add("glitch"), 300);   // bug: pisca em pedaços e some
  const r = $("beast").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .15);
  $("beast").classList.remove("tomado", "possuido");
  if (isTomado(e) && !e.rematch) { const [sx, sy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height * .45); PFX.burst(18, "puff", PYT_SMOKE, sx, sy, 16, {life: 1.2, up: 18}); }   // a fumaça de Pytuna sai do corpo e sobe
  if (!person) setTimeout(() => PFX.burst(g === "heart" ? 6 : 3, g, {heart: ["#ff6b8a", "#ff9fb4"], note: ["#5a6ad8", "#ffffff"], thumb: ["#ffd23a", "#c8902a"]}[g], gx, gy, 14, {life: 1, up: 12}), 200);
  if (e.boss) return;
  if ($("beast").classList.contains("submerged")) return setTimeout(() => $("beast").classList.add("dive"), 700);
  setTimeout(() => BEAST_A.slide("0px", "60vw", 800), 750);
}
// golpe do bicho: anima, e o dano aparece na barra só quando o golpe "chega"
const FOE_PREP = 650;   // o bicho se prepara antes do golpe: tempo de reagir com o Z
function foeAttack(kind, d, sp0) {
  holdP = {hp: p.hp + d, sp: sp0 === undefined ? p.sp : sp0};
  // bicho na água não sai dela: ataca de longe (jato d'água; poraquê, choque) e o tiro leva mais tempo até chegar
  const wet = kind !== "roar" && kind !== "fire" && $("beast").classList.contains("submerged");
  const block = d > 0 && kind !== "roar", prep = block ? FOE_PREP : 0, impact = prep + (kind === "roar" ? 400 : kind === "fire" ? 1000 : wet ? 460 : 220);
  foeImpact = Math.max(foeImpact, impact);
  if (block) { BEAST_A.set("prep"); qteArm(impact, $("hero")); }
  setTimeout(() => {
    BEAST_A.set(kind === "roar" || kind === "fire" ? "roar" : "windup");
    if (kind === "roar") { animalCry(e.id, e.boss); anim($("beast"), "hit"); }
    else if (kind === "fire") foeFlames();
    else if (wet) foeSplash(e.id === "poraque");
    else { anim($("beast"), "lunge"); sfx("claw"); }
  }, prep);
  setTimeout(() => {
    if (d > 0 && e.cego > 0) { e.cego = 0; if (Math.random() < .5) { p.hp += d; d = 0; say(t("Com areia nos olhos, {bicho} erra o golpe!", {bicho: foe()})); pop(t("ERROU!"), $("hero"), "heal"); sfx("esquiva"); } }   // Salto da duna
    if (d > 0 && e.espanto > 0) { const n = Math.ceil(d * .35); p.hp += n; d -= n; }   // Careta que espanta: com medo, bate mais fraco
    if (d > 0 && p.escudo > 0) { p.escudo--; const n = Math.floor(d / 2); p.hp += n; d -= n; say(t("O escudo de luar segura metade do golpe: evitou {n}.", {n})); pop(t("ESCUDO!"), $("hero"), "heal"); sfx("bloqueio"); }
    if (block && qteTake()) {   // bloqueio na hora certa: metade do dano volta (Bloqueio firme: 2/3; Contra-ataque perfeito: tudo)
      const all = hasSkill("bloqueio2"), back = all ? d : Math.floor(d * (hasSkill("bloqueio") ? 2 / 3 : 1 / 2)); p.hp += back; d -= back;
      if (back) { say(t("Bloqueio! Evitou {n} de dano.", {n: back})); pop(t("BLOQUEIO!"), $("hero"), "heal"); sfx("bloqueio"); HERO_A.set("guard"); hitImpact("leve"); }
      if (all && back) { p.bonus = true; say(t("Contra-ataque perfeito: no próximo turno, o Rhanon age duas vezes!")); }
      if (hasSkill("revide") && back && e.hp > 0) {   // Revide: metade do que evitou volta para o bicho
        const n = Math.max(1, Math.ceil(back / 2)); e.hp = Math.max(0, e.hp - n);
        setTimeout(() => { hitBeast(); pop("−" + n, $("beast"), "strong"); say(t("Revide! {bicho} perde {n} PV.", {bicho: foe(), n})); render(); }, 150);
      }
    }
    if (d > 0 && !e.bug && Math.random() * 100 < (WEATHER[weatherNow()].dodge || 0)) {   // neblina: o bicho erra de vez em quando
      p.hp += d; d = 0; say(t("Na neblina, o golpe passa raspando!")); pop(t("DESVIOU!"), $("hero"), "heal"); sfx("esquiva");
    }
    if (d > 0 && charmRoll("esquiva")) {   // talismã do Curupira: escapa do golpe inteiro
      p.hp += d; d = 0; say(t("Rhanon desvia no último instante!")); pop(t("DESVIOU!"), $("hero"), "heal"); sfx("esquiva");
    }
    if (d > 0 && charm().fx === "espinho" && e.hp > 0) {   // talismã do Mapinguari: parte do golpe volta para o bicho
      const n = Math.max(1, Math.round(d * charm().ch / 100)); e.hp = Math.max(0, e.hp - n);
      setTimeout(() => { hitBeast(); pop("−" + n, $("beast")); say(t("O talismã devolve o golpe: {bicho} perde {n} PV.", {bicho: foe(), n})); render(); }, 120);
    }
    holdP = null; render();
    if (d) { anim($("hero"), "hurt"); sfx("hurt"); hurtFx(kind, d); pop("−" + d, $("hero"), "me"); if (HERO_A.state !== "defeat") HERO_A.set("hurt"); hitStop(d >= 10 ? 90 : 50); }
  }, impact);
}
// bicho na água: sobe um pouco (sem sair dela) e cospe um jato que atravessa até o Rhanon; o poraquê solta um raio
function foeSplash(shock) {
  const a = pos($("beast")), b = pos($("hero")), cols = shock ? ["#fff27a", "#ffd23a", "#ffffff"] : ["#86d6ff", "#d2f0ff", "#4ab0d8"];
  anim($("beast"), "surge"); sfx(shock ? "choque" : "agua");
  for (let i = 0; i < 14; i++) setTimeout(() => {
    const c = document.createElement("i"), sz = 9 + (i % 3) * 4, sx = a.x - 30, sy = a.y - 6;
    c.className = "fx-jato"; c.style.cssText = `left:${sx}px;top:${sy}px;width:${sz}px;height:${sz}px;background:${cols[i % 3]}`;
    $("fx").appendChild(c);
    const arc = shock ? (i % 2 ? 14 : -14) : -40 - (i % 3) * 6;   // jato faz curva para cima; raio vai em zigue-zague
    c.animate([{transform: "translate(-50%,-50%)"}, {transform: `translate(calc(-50% + ${(b.x - sx) / 2}px),calc(-50% + ${(b.y - sy) / 2 + arc}px))`, offset: .5},
      {transform: `translate(calc(-50% + ${b.x - sx}px),calc(-50% + ${b.y - sy}px)) scale(1.4)`, opacity: .6}], {duration: 380, easing: "steps(8)", fill: "forwards"}).onfinish = () => c.remove();
  }, 40 + i * 18);
}
// labareda do bicho (Mula sem cabeça): chamas saem dele e atravessam até o Rhanon
function foeFlames() {
  const a = pos($("beast")), b = pos($("hero"));
  animalCry(e.id, e.boss); sfx("fire");
  for (let i = 0; i < 8; i++) setTimeout(() => {
    const c = gridC(FLAME, PAL_F, 3 + (i % 3)), sx = a.x - 30, sy = a.y - 20, wob = (i % 2 ? -1 : 1) * (8 + i * 2);
    c.style.left = sx + "px"; c.style.top = sy + "px"; $("fx").appendChild(c);
    c.animate([{transform: "translate(-50%,-50%) scale(.4)"}, {transform: `translate(calc(-50% + ${(b.x - sx) / 2}px),calc(-50% + ${(b.y - sy) / 2 + wob}px)) scale(1)`, offset: .5},
      {transform: `translate(calc(-50% + ${b.x - sx}px),calc(-50% + ${b.y - sy}px)) scale(1.3)`, opacity: .7}], {duration: 600, easing: "steps(10)", fill: "forwards"}).onfinish = () => c.remove();
    if (i % 3 === 0) sfx("fire");
  }, 150 + i * 60);
}
// golpe do Rhanon; cada ataque tem seu ritmo. msg vai para o registro no impacto. Devolve quanto dura (ms).
function strike(d, cls, kind, msg) {
  holdE = preE;
  const a = pos($("hero")), b = pos($("beast"));
  const hit = colors => {   // impacto: barra desce, número salta, registro recebe a mensagem
    const perfect = qteTake() && d > 0;
    if (perfect) {   // apertou Z na hora: golpe perfeito
      const more = Math.max(2, Math.round(d * (hasSkill("perfeito") ? .5 : .3))); d += more; e.hp = Math.max(0, e.hp - more);   // Ponta afiada: +50%
      msg = (msg || "") + " " + t("Perfeito! +{n}.", {n: more});
    }
    const strong = cls === "crit" || perfect || d >= 14;
    holdE = null; if (msg) say(msg); charmOnHit(d); render(); hitBeast(); sfx(cls === "crit" ? "critico" : perfect ? "perfeito" : "hit");
    burst(b, colors, strong ? 16 : 9, strong ? 90 : 60);
    pop(String(d), $("beast"), cls === "crit" ? "crit" : strong ? "strong" : cls, perfect ? t("PERFEITO!") : null); hitImpact(strong ? "forte" : "leve"); if (strong) musicDuck();
  };
  if (kind === "spear") {   // lança: corre até o bicho, estoca e volta (rápido)
    HERO_A.set("stab"); sfx("spear"); qteArm(REDUCE ? 0 : 450, $("beast"));
    const dx = Math.max(0, b.x - a.x - 70);
    $("hero").animate([   // recua (antecipação), dispara acelerando até o bicho, segura a estocada e volta freando
      {transform: "translateX(0)", easing: "cubic-bezier(.3,0,.6,1)"}, {transform: "translateX(-14px)", offset: .17, easing: "cubic-bezier(.6,0,1,.6)"},
      {transform: `translateX(${dx}px)`, offset: .52}, {transform: `translateX(${dx}px)`, offset: .68, easing: "cubic-bezier(.2,.7,.3,1)"}, {transform: "translateX(0)"}], {duration: REDUCE ? 1 : 850});
    setTimeout(() => { hit(["#fff", "#cfd8dc", "#f2a20c"]); slash($("beast")); }, REDUCE ? 0 : 450);
    return 850;
  }
  if (kind === "throw") {   // jogar a lança: toma impulso, arremessa e ela voa girando de leve até o bicho (ou passa por cima)
    HERO_A.set("throw"); sfx("guard"); qteArm(590, $("beast"));
    setTimeout(() => {
      sfx("spear");
      const c = spearC(4), miss = d === 0, tx = b.x - a.x - 20, ty = miss ? b.y - a.y - 90 : b.y - a.y;
      c.style.left = a.x + 20 + "px"; c.style.top = a.y - 30 + "px"; $("fx").appendChild(c);
      c.animate([{transform: "translate(-50%,-50%) rotate(-12deg)"}, {transform: `translate(calc(-50% + ${tx}px),calc(-50% + ${ty + 30}px)) rotate(${miss ? -20 : 8}deg)`}],
        {duration: 260, easing: "steps(7)", fill: "forwards"}).onfinish = () => {
        if (!miss) { c.remove(); hit(["#fff", "#d9b25a", "#f2a20c"]); return; }
        qteClear(); holdE = null; if (msg) say(msg); render(); sfx("blip"); pop(t("ERROU!"), $("beast"));
        c.animate([{opacity: 1}, {transform: `translate(calc(-50% + ${tx + 160}px),calc(-50% + ${ty - 10}px)) rotate(-20deg)`, opacity: 0}], {duration: 300, easing: "steps(6)", fill: "forwards"}).onfinish = () => c.remove();
      };
    }, REDUCE ? 0 : 330);
    return 330 + 260 + 120;
  }
  if (kind === "arrow") {   // flecha: puxa o arco devagar, brilho na ponta, sai reta e rápida
    HERO_A.set("aim"); sfx("guard"); qteArm(1930, $("beast"));
    setTimeout(() => {
      const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width * .82, r.top + r.height * .52);
      PFX.burst(7, "star", ["#ffffff", "#ffd23a"], gx, gy, 14, {life: .55, up: 0}); PFX.emit("spark", ["#ffffff"], gx, gy, 0, 0, .4); sfx("look");
    }, 1450);
    setTimeout(() => {
      sfx("spear");
      const c = arrowC(4), ang = Math.atan2(b.y - a.y, b.x - a.x);
      c.style.left = a.x + 30 + "px"; c.style.top = a.y + "px"; $("fx").appendChild(c);
      c.animate([{transform: `translate(-50%,-50%) rotate(${ang}rad)`}, {transform: `translate(calc(-50% + ${b.x - a.x - 30}px),calc(-50% + ${b.y - a.y}px)) rotate(${ang}rad)`}], {duration: 230, easing: "steps(6)", fill: "forwards"})
        .onfinish = () => { c.remove(); hit(["#fff", "#c9a46a", "#f2a20c"]); };
    }, 1700);
    return 1950;
  }
  if (kind === "cipo") {   // chicote de cipó: o cipó estica do Rhanon até o bicho, estala e volta
    HERO_A.set("cast"); const at = cipoWhip(a, b); qteArm(at, $("beast"));
    setTimeout(() => { hit(["#7ac84a", "#ffffff", "#3f9a3a"]); slash($("beast")); }, at);
    return at + 200;
  }
  if (kind === "agua" || kind === "vento" || kind === "raio" || kind === "folhas") {   // especiais de elemento: o Rhanon ergue a lança e o elemento atravessa até o bicho
    HERO_A.set("cast"); const fly = elemFly(kind, a, b); qteArm(fly, $("beast"));
    setTimeout(() => { hit({agua: ["#86d6ff", "#ffffff", "#2a8ad8"], vento: ["#e8f4f8", "#ffffff", "#6aa8b8"], raio: ["#fff27a", "#ffffff", "#d8a80c"], folhas: ["#7ac84a", "#ffffff", "#3f9a3a"]}[kind]); if (kind === "folhas") slash($("beast")); }, fly);
    return fly;
  }
  // tocha: ergue, assopra (baforadas) e uma onda de chamas atravessa até o bicho
  HERO_A.set("blow"); qteArm(900 + 8 * 70 + 650, $("beast"));
  setTimeout(() => {
    sfx("fire");
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width * .66, r.top + r.height * .38);   // do lado da cabeça até a chama
      PFX.emit("puff", ["#e8e4dc", "#ffffff"], gx, gy, 16 + Math.random() * 6, (Math.random() - .5) * 6, .5);
    }, i * 70);
  }, 480);
  const N = 9, start = 900, fly = 650;
  for (let i = 0; i < N; i++) setTimeout(() => {
    const c = gridC(FLAME, PAL_F, 3 + (i % 3)), sx = a.x + 34, sy = a.y - 14, wob = (i % 2 ? -1 : 1) * (10 + i * 2);
    c.style.left = sx + "px"; c.style.top = sy + "px"; $("fx").appendChild(c);
    c.animate([{transform: "translate(-50%,-50%) scale(.4)", opacity: .9},
      {transform: `translate(calc(-50% + ${(b.x - sx) / 2}px),calc(-50% + ${(b.y - sy) / 2 + wob}px)) scale(1)`, opacity: 1, offset: .5},
      {transform: `translate(calc(-50% + ${b.x - sx}px),calc(-50% + ${b.y - sy}px)) scale(1.3)`, opacity: .7}], {duration: fly, easing: "steps(10)", fill: "forwards"}).onfinish = () => c.remove();
    if (i % 3 === 0) sfx("fire");
  }, start + i * 70);
  setTimeout(() => hit(["#ffd23a", "#f2740c", "#d62828"]), start + (N - 1) * 70 + fly);
  return start + (N - 1) * 70 + fly;   // ~2,1 s
}
/* água, vento, raio e folhas saindo do Rhanon até o bicho (quadradinhos de pixel, como o jato do bicho na água):
   água faz um arco, vento e folhas vão em espiral (as folhas girando), raio em zigue-zague e rápido. Devolve quando chega (ms). */
function elemFly(kind, a, b) {
  const T = {agua: [600, 16, 34], vento: [600, 18, 40], raio: [500, 12, 22], folhas: [600, 14, 45]}[kind], [start, N, gap] = T, fly = kind === "raio" ? 160 : 420;
  const cols = {agua: ["#86d6ff", "#d2f0ff", "#2a8ad8"], vento: ["#ffffff", "#e8f4f8", "#9ac8d8"], raio: ["#fff27a", "#ffd23a", "#ffffff"], folhas: ["#3f9a3a", "#7ac84a", "#2a6a2a"]}[kind];
  setTimeout(() => sfx(kind === "agua" ? "agua" : kind === "raio" ? "choque" : kind === "folhas" ? "planta" : "vento"), start);
  for (let i = 0; i < N; i++) setTimeout(() => {
    const c = document.createElement("i"), sz = 8 + (i % 3) * 4, sx = a.x + 30, sy = a.y - 24;
    c.className = "fx-jato"; c.style.cssText = `left:${sx}px;top:${sy}px;width:${sz}px;height:${sz}px;background:${cols[i % 3]}`;
    $("fx").appendChild(c);
    const mid = kind === "agua" ? -60 - (i % 3) * 8 : kind === "raio" ? (i % 2 ? 26 : -26) : Math.sin(i * 1.3) * 40, spin = kind === "folhas" ? 540 : 0;   // folha gira no ar
    if (kind === "folhas") c.style.height = Math.round(sz / 2) + "px";
    c.animate([{transform: "translate(-50%,-50%) scale(.6)"}, {transform: `translate(calc(-50% + ${(b.x - sx) / 2}px),calc(-50% + ${(b.y - sy) / 2 + mid}px)) rotate(${spin / 2}deg)`, offset: .5},
      {transform: `translate(calc(-50% + ${b.x - sx}px),calc(-50% + ${b.y - sy}px)) rotate(${spin}deg) scale(1.5)`, opacity: .5}], {duration: fly, easing: "steps(8)", fill: "forwards"}).onfinish = () => c.remove();
    if (kind === "raio" && i % 4 === 0) sfx("choque");
  }, start + i * gap);
  return start + (N - 1) * gap + fly;
}
// chicote de cipó: uma corda verde de gomos sai da mão do Rhanon, estica até o bicho, estala e recolhe. Devolve quando estala (ms).
function cipoWhip(a, b) {
  const start = 550, reach = 260, sx = a.x + 24, sy = a.y - 20, dx = b.x - sx, dy = b.y - sy, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  setTimeout(() => {
    sfx("planta");
    const c = document.createElement("i");
    c.className = "fx-cipo"; c.style.cssText = `left:${sx}px;top:${sy}px;width:${len}px;transform:rotate(${ang}rad)`;
    $("fx").appendChild(c);
    c.animate([{clipPath: "inset(0 100% 0 0)"}, {clipPath: "inset(0 0 0 0)", offset: .45}, {clipPath: "inset(0 0 0 0)", offset: .7}, {clipPath: "inset(0 100% 0 0)"}],
      {duration: reach * 2.2, easing: "steps(10)"}).onfinish = () => c.remove();
  }, start);
  return start + reach;
}
/* ---------- Chamado do aliado (degrau p6, ALLY_MOVES em data/skills.js) ----------
   Os chefes que o Pytuna segurou (o último chefe de dia de cada cidade), já acalmados, atendem a luz de Jaci: o espírito
   surge ao lado do Rhanon, de perfil para o bicho, prateado e meio transparente, dá o golpe próprio e se desfaz em luar.
   Uma vez por luta; com Aliado fiel (p8) ele fica mais 3 turnos e ataca no fim de cada um (allyEcho, em tick). */
const allyList = () => pytunaBosses().filter(id => ALLY_MOVES[id] && bossBeaten(id));
const allyBase = () => rnd(14, 18) + G.lv - 1 + charmStat("atk") + skillStat("atk");   // a mesma base dos especiais de elemento
function openAllyMenu() {
  openSubMenu(allyList().map(id => {
    const a = ANIMALS.find(x => x.id === id), mv = ALLY_MOVES[id];
    return {label: a.name, small: mv.n, desc: `${mv.n}: ${mv.d}`, fn: () => { buildCmds(); act("aliado", id); }};
  }), t("Volta aos comandos sem gastar o turno."), CMDS.findIndex(c => c.id === "especial"));
}
// quadro do espírito: o desenho do chefe tingido de luar, com brilho em volta (guardado por pose)
const SPIRIT_C = new Map();
function spiritFrame(id, pose) {
  const k = id + pose; if (SPIRIT_C.has(k)) return SPIRIT_C.get(k);
  const a = ANIMALS.find(x => x.id === id) || {}, src = beastFrame(id, pose, 0) || animalSprite(a), pad = 8;
  const o = document.createElement("canvas"); o.width = src.width; o.height = src.height;
  const og = o.getContext("2d"); og.filter = a.tint || "none"; og.drawImage(src, 0, 0); og.filter = "none";
  og.globalCompositeOperation = "source-atop"; og.fillStyle = "rgba(200,220,255,.4)"; og.fillRect(0, 0, o.width, o.height);
  const c = document.createElement("canvas"); c.width = src.width + pad * 2; c.height = src.height + pad * 2;
  const g = c.getContext("2d"); g.shadowColor = "#cfe0ff"; g.shadowBlur = 6; g.drawImage(o, pad, pad); g.shadowBlur = 0; g.drawImage(o, pad, pad);
  SPIRIT_C.set(k, c); return c;
}
// espírito no palco: pés na altura dos pés do Rhanon, um pouco à frente dele; size = fração da altura do Rhanon
function spiritEl(id, size = 1.15, x) {
  const a = pos($("hero")), hr = $("hero").getBoundingClientRect(), w = document.createElement("div"), cv = document.createElement("canvas");
  w.className = "fx-espirito"; w.append(cv);
  const show = pose => { const s = spiritFrame(id, pose); cv.width = s.width; cv.height = s.height; cv.getContext("2d").drawImage(s, 0, 0); cv.style.height = hr.height * size + "px"; };
  show("idle");
  w.style.left = (x === undefined ? a.x + hr.width * 1.3 : x) + "px"; w.style.top = a.y + hr.height / 2 + "px";
  $("fx").appendChild(w);
  return {el: w, show, x: x === undefined ? a.x + hr.width * 1.3 : x};
}
// golpe do aliado: devolve {wait, extra}; o dano entra no impacto (cada mordida do frenesi é um impacto)
function allyCall(id) {
  const mv = ALLY_MOVES[id], me = e, k = mv.elem, m = bugMode ? 1 : elemMult(e, k), fresh = !bugMode && !elemKnown(e, k);
  const at = (ms, fn) => setTimeout(() => { if (e === me && mode === "hunt") fn(); }, REDUCE ? ms / 3 : ms);
  const name = ANIMALS.find(x => x.id === id).name, dmg = f => Math.max(1, Math.round(allyBase() * mv.pow * f * m * (bugMode ? 1 : weatherBoost(k))));
  if (!bugMode) elemLearn(e, k);
  p.aliadoId = id; if (hasSkill("fiel")) p.fiel = 3;
  const sp = spiritEl(id), b = pos($("beast")), dx = Math.max(0, b.x - sp.x - 70), cols = ["#ffffff", "#cfe0ff", ELEMENTS[k].c];
  say(t("{aliado} atende a luz de Jaci!", {aliado: name}));
  HERO_A.set("cast"); sfx("look"); animalCry(id, true); pop(mv.n.toUpperCase(), $("hero"), "heal");   // nome do golpe pequeno, sem cobrir o espírito
  sp.el.animate([{opacity: 0, transform: "translateY(24px)"}, {opacity: .85, transform: "translateY(0)"}], {duration: 600, easing: "ease-out", fill: "forwards"});
  const hit = (d, msg) => {   // impacto no bicho: barra desce, número, cor do elemento
    e.hp = Math.max(0, e.hp - d); hitBeast(); pop(String(d), $("beast"), m > 1 ? "crit" : "strong");
    burst(b, cols, 14, 80); sfx(m > 1 ? "critico" : "hit"); hitImpact(d >= 20 ? "forte" : "leve"); if (msg) say(msg); render();
  };
  const lunge = (t0, dur = 260, hold = 300, extra = []) => {   // agacha, dá o bote até o bicho e volta
    at(t0 - 250, () => sp.show("crouch"));
    at(t0, () => { sp.show("attack"); sfx("claw"); sp.el.animate([{transform: "translateX(0)"}, {transform: `translateX(${dx}px)`, offset: dur / (dur + hold + 300)}, ...extra, {transform: `translateX(${dx}px)`, offset: (dur + hold) / (dur + hold + 300)}, {transform: "translateX(0)"}], {duration: dur + hold + 300, easing: "ease-out"}); });
  };
  const v = {bicho: foe()}, T = 900;   // T = hora do bote
  let end = T + 900;
  if (mv.fx === "frenesi") {   // três mordidas: o espírito cola no bicho e morde três vezes
    lunge(T, 220, 900);
    [0, 1, 2].forEach(i => at(T + 220 + i * 280, () => { sp.show(i % 2 ? "crouch" : "attack"); sfx("claw"); hit(dmg(1), i === 2 && t("Três mordidas do recife n{bicho}!", v)); }));
    end = T + 220 + 3 * 280 + 400;
  } else if (mv.fx === "tropa") {   // o cincerro toca e uma fila de mulas de luar atravessa o palco
    at(500, () => { sp.show("attack"); sfx("bloqueio"); setTimeout(() => sfx("bloqueio"), 220); shake("gshake-s"); });   // blém, blém: o cincerro
    at(800, () => {
      const W = $("fx").clientWidth;
      for (let i = 0; i < 5; i++) setTimeout(() => {
        const c = spiritEl(id, .8, -60); c.show(i % 2 ? "attack" : "idle"); c.el.style.opacity = .7; sfx("claw");
        c.el.animate([{transform: "translateX(0)"}, {transform: `translateX(${W + 140}px)`}], {duration: 900, easing: "linear"}).onfinish = () => c.el.remove();
      }, i * 140);
      shake("gshake");
    });
    at(1450, () => { hit(dmg(1), t("A tropa de luar passa por cima d{bicho}!", v)); hitImpact("furia"); });
    end = 2300;
  } else if (mv.fx === "bando") {   // muriquis pequenos de luar pulam por cima do bicho; folhas verdes caem no Rhanon
    at(600, () => {
      const W = $("fx").clientWidth;
      for (let i = 0; i < 6; i++) setTimeout(() => {
        const c = spiritEl(id, .45, -40); c.el.style.opacity = .8;
        c.el.animate([{transform: "translate(0,0)"}, {transform: `translate(${W * .5}px,-60px)`}, {transform: `translate(${W + 80}px,0)`}], {duration: 1000, easing: "linear"}).onfinish = () => c.el.remove();
      }, i * 110);
      animalCry(id, false);
    });
    at(1200, () => {
      hit(dmg(1), null);
      const n = Math.min(p.max - p.hp, Math.round(p.max * .3)); p.hp += n; pop("+" + n, $("hero"), "heal"); sfx("heal");
      const r = $("hero").getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top);
      PFX.burst(14, "leaf", ["#7ac84a", "#3f9a3a", "#c9f2a8"], gx, gy, 16, {life: 1.2, up: -4});
      say(t("O bando dourado passa: {bicho} leva o golpe e o Rhanon recupera {n} PV.", {bicho: foe(), n})); render();
    });
    end = 2100;
  } else if (mv.fx === "uivo" || mv.fx === "canto") {   // fica ao lado do Rhanon: uivo (anéis de som) ou canto (notinhas) até o bicho
    at(T - 200, () => { sp.show("attack"); animalCry(id, true); });
    for (let i = 0; i < 6; i++) at(T - 100 + i * 90, () => {
      const [gx, gy] = PFX.toGrid(sp.el.getBoundingClientRect().right, sp.el.getBoundingClientRect().top + 20), [bx] = PFX.toGrid(b.x + $("fx").getBoundingClientRect().left, 0);
      PFX.emit(mv.fx === "uivo" ? "ring" : "note", mv.fx === "uivo" ? ["#ffd23a", "#ff7a3a"] : ["#ffffff", "#cfe0ff"], gx, gy, (bx - gx) * 1.4, mv.fx === "canto" ? -6 : 0, .7);
    });
    at(T + 500, () => {
      if (mv.fx === "uivo") { hit(dmg(1), null); p.furia = furyMax(); pop(t("FÚRIA PRONTA!"), $("hero"), "crit"); sfx("furia"); say(t("O uivo do cerrado acerta {bicho} e enche a fúria do Rhanon!", v)); }
      else { hit(dmg(1), null); const n = Math.min(p.msp - p.sp, Math.round(p.msp * .4)); p.sp += n; pop("+" + n + " " + t("PE"), $("hero"), "heal"); sfx("heal"); say(t("O canto do zabelê devolve {n} PE ao Rhanon.", {n})); }
      render();
    });
    end = T + 1300;
  } else {   // bote até o bicho, com o jeito de cada um
    const spin = mv.fx === "rolo" ? [{transform: `translateX(${dx}px) rotate(360deg)`, offset: .55}] : [];   // o jacaré rola com o bicho
    if (mv.fx === "areia") at(T - 300, () => sp.el.animate([{translate: "0 0"}, {translate: "0 -70px"}, {translate: "0 0"}], {duration: 600, easing: "ease-in-out"}));
    lunge(T, 260, mv.fx === "abraco" ? 650 : 300, spin);
    at(T + 260, () => {
      const d = dmg(1);
      if (mv.fx === "rolo") { e.dot = {d: 3 + Math.floor(G.lv / 4), t: 2}; sfx("agua"); hit(d, t("Rolo da morte: {bicho} vai sangrar por 2 turnos.", v)); }
      else if (mv.fx === "areia") {
        e.cego = 1; hit(d, t("Areia nos olhos d{bicho}: o próximo golpe pode errar.", v));
        const [gx, gy] = PFX.toGrid(b.x + $("fx").getBoundingClientRect().left, b.y + $("fx").getBoundingClientRect().top); PFX.burst(18, "puff", ["#e8d27a", "#d8b860", "#fff2c0"], gx, gy, 20, {life: 1.1, up: 4});
      }
      else if (mv.fx === "careta") { e.espanto = 2; hit(d, t("A careta espanta {bicho}: vai bater mais fraco por 2 turnos.", v)); elemFly("agua", pos($("hero")), b); pop(t("MEDO!"), $("beast"), "crit"); }
      else if (mv.fx === "abraco") {
        const ok = !e.boss || Math.random() < .5; if (ok) e.perde = 1; hit(d, ok ? t("Abraço do tempo: {bicho} fica parado e perde a vez.", v) : t("Abraço do tempo: {bicho} se solta a tempo.", v));
        const [gx, gy] = PFX.toGrid(b.x + $("fx").getBoundingClientRect().left, b.y + $("fx").getBoundingClientRect().top - 30); PFX.burst(8, "star", ["#ffd23a", "#ffffff"], gx, gy, 10, {life: 1.2, up: 6});
      }
      else if (mv.fx === "bandeira") { p.escudo = Math.max(p.escudo || 0, 2); hit(d, t("O rabo-bandeira abre na frente do Rhanon: os 2 próximos golpes batem pela metade.", v)); sfx("bloqueio"); }
      else hit(d, t("{aliado} acerta {bicho} em cheio: −{n}.", {aliado: name, bicho: foe(), n: d}));
    });
    end = T + 260 + (mv.fx === "abraco" ? 650 : 300) + 500;
  }
  at(end - 300, () => {   // desfaz em luar
    const r = sp.el.getBoundingClientRect(), [gx, gy] = PFX.toGrid(r.left + r.width / 2, r.top + r.height / 2);
    PFX.burst(16, "spark", ["#ffffff", "#cfe0ff", "#e8f0ff"], gx, gy, 18, {life: 1.1, up: 10});
    sp.el.animate([{opacity: .85}, {opacity: 0}], {duration: 450, fill: "forwards"}).onfinish = () => sp.el.remove();
  });
  setTimeout(() => sp.el.remove(), (REDUCE ? end / 3 : end) + 600);   // garantia, se a luta acabar no meio
  if (fresh) at(end, () => { plateElem(e); render(); });
  let extra = false;
  if (m > 1 && !e.assustada) { extra = true; at(end - 100, () => { if (e.hp <= 0) return; e.assustada = true; say(t("FRAQUEZA! {bicho} recuou {assustado}. Mais uma!", {bicho: foe(1), assustado: ending(e, "assustado", "assustada")})); pop(t("FRAQUEZA!"), $("beast"), "crit"); sfx("more"); render(); }); }
  return {wait: REDUCE ? end / 3 : end, extra};
}
// Aliado fiel: no fim do turno, o espírito volta rapidinho e dá um bote mais fraco
function allyEcho() {
  const id = p.aliadoId, mv = ALLY_MOVES[id]; if (!mv || e.hp <= 0) return;
  p.fiel--;
  const m = bugMode ? 1 : elemMult(e, mv.elem), d = Math.max(1, Math.round(allyBase() * .5 * m)), b = pos($("beast"));
  e.hp = Math.max(0, e.hp - d);
  const sp = spiritEl(id, .9), dx = Math.max(0, b.x - sp.x - 70);
  sp.show("attack"); sfx("claw");
  sp.el.animate([{opacity: 0, transform: "translateX(0)"}, {opacity: .8, transform: `translateX(${dx}px)`, offset: .45}, {opacity: .8, transform: `translateX(${dx}px)`, offset: .6}, {opacity: 0, transform: "translateX(0)"}], {duration: 800, fill: "forwards"}).onfinish = () => sp.el.remove();
  setTimeout(() => { hitBeast(); pop(String(d), $("beast")); burst(b, ["#ffffff", "#cfe0ff", ELEMENTS[mv.elem].c], 8, 50); sfx("hit"); }, 360);
  say(t("{aliado} volta e acerta {bicho}: −{n}.", {aliado: ANIMALS.find(x => x.id === id).name, bicho: foe(), n: d}));
}
// golpes duplos (Estocada dupla, Flecha dupla): o segundo sai depois do primeiro, cada um com o seu anel do tempo certo
function strikeTwice(kind, mk) {
  const one = () => { const r = mk(); e.hp = Math.max(0, e.hp - r.d); return strike(r.d, r.cls, kind, r.msg); };
  const w1 = one(), me = e;
  setTimeout(() => { if (e === me && mode === "hunt" && e.hp > 0) { preE = e.hp; one(); } }, w1 + 150);
  return w1 + 150 + (kind === "arrow" ? 1950 : 850);
}
// chefes acalmados até agora (dia e noite): a Lança de luar fica mais forte com cada um
const bossesCalm = () => [...new Set([...Object.values(ZONES), ...Object.values(NIGHT_ZONES)].map(z => z.boss).filter(Boolean))].filter(bossBeaten).length;
// fúria: faixa "FÚRIA!", Rhanon corre até o bicho e dá três estocadas (a última mais forte). Devolve quanto dura (ms).
function furyStrike(ds) {
  holdE = preE; qteClear();
  const b = pos($("beast")), dx = Math.max(0, b.x - pos($("hero")).x - 70), T0 = REDUCE ? 0 : 900, gap = REDUCE ? 0 : FURY_GAP;
  encounterBanner(t("Fúria da mata"), t(ds.length === 4 ? "quatro golpes!" : "três golpes!")); sfx("furia"); musicDuck(1200);
  setTimeout(() => {   // corre até o bicho e fica colado nele: cada acerto é uma estocada diferente (estado "fury" do HERO_A)
    FURY_HITS = ds.length; HERO_A.set("fury"); sfx("spear");
    const dur = REDUCE ? 1 : FURY_LEAD + gap * ds.length + 300;
    $("hero").animate([{transform: "translateX(0)", easing: "cubic-bezier(.6,0,1,.6)"}, {transform: `translateX(${dx}px)`, offset: 200 / dur}, {transform: `translateX(${dx}px)`, offset: 1 - 260 / dur, easing: "cubic-bezier(.2,.7,.3,1)"}, {transform: "translateX(0)"}],
      {duration: dur});
  }, T0);
  let shown = preE;
  ds.forEach((d, i) => setTimeout(() => {
    const last = i === ds.length - 1;
    shown = Math.max(0, shown - d); holdE = last ? null : shown;
    if (i) sfx("spear");
    hitBeast(); slash($("beast")); burst(b, last ? ["#ffd23a", "#ffffff", "#e5001c"] : ["#fff", "#cfd8dc", "#f2a20c"], last ? 20 : 10, last ? 110 : 60);
    pop(String(d), $("beast"), last ? "crit" : "strong"); sfx("hit"); if (last) sfx("critico");   // o último leva o baque e o brilho do crítico hitImpact(last ? "furia" : "leve");
    if (last) { say(t(ds.length === 4 ? "FÚRIA! Quatro estocadas: −{n}." : "FÚRIA! Três estocadas: −{n}.", {n: ds.join(", −")})); charmOnHit(ds.reduce((a, b) => a + b, 0)); setTimeout(() => pop(t("FÚRIA!"), $("beast"), "crit"), 200); }
    render();
  }, T0 + FURY_LEAD + i * gap));
  return T0 + FURY_LEAD + gap * (ds.length - 1) + 500;
}
// barra de XP do painel do Rhanon (quanto falta para o próximo nível)
function drawXp() { $("xpb").style.width = (100 * G.xp / need(G.lv)) + "%"; $("xpTxt").textContent = G.xp + " / " + need(G.lv); }
function pickAnimal() {
  if (bossFight && !BS()[bossKey(curZone)]) return ANIMALS.find(a => a.id === zoneDef(curZone).boss);
  return pickFromPool(curZone);
}
// defesa na hora do golpe: com medo (chocalho do Boitatá, uivo do lobo) ela some e o golpe ainda dói mais
const pdef = () => p && p.medo > 0 ? -2 : defense();
function special() {
  const s = Array.isArray(e.special) ? e.special[Math.floor(Math.random() * e.special.length)] : e.special, d = rnd(e.damage[0], e.damage[1]);   // lista = sorteia um dos golpes
  const hit = (n, k) => { if (p.def) n = Math.ceil(n / 2); n = Math.max(1, n - pdef()); p.hp -= n; foeAttack(k || "claw", n); return n; };
  if (s === "drenar") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Drenagem"}; say(t("{bicho} crava os dentes e suga! −{n} PV, e mais 3 por turno.", {bicho: foe(1), n})); return; }
  if (s === "fogo") { const n = hit(Math.ceil(d * 1.4), "fire"); p.dot = {d: 3, t: 2, n: "Queimadura"}; say(t("{bicho} solta uma labareda! −{n} PV e queimadura por 2 turnos.", {bicho: foe(1), n})); return; }
  if (s === "prender") { const n = hit(d); p.preso = 3; say(t("{bicho} se enrola em Rhanon! −{n} PV, e nada de fugir por 3 turnos.", {bicho: foe(1), n})); return; }
  if (s === "chocalho") { p.medo = 3; foeAttack("roar", 0); setTimeout(() => HERO_A.set("scared"), 400); say(t("{bicho} balança o chocalho de fogo... Rhanon treme! Sem defesa por 3 turnos.", {bicho: foe(1)})); return; }
  if (s === "uivo") { p.medo = 2; foeAttack("roar", 0); setTimeout(() => HERO_A.set("scared"), 400); say(t("{bicho} uiva no escuro. Rhanon se arrepia! Sem defesa por 2 turnos.", {bicho: foe(1)})); return; }
  if (s === "fedor") { p.weak = 3; foeAttack("roar", 0); say(t("{bicho} solta um fedor horrível! Golpes mais fracos por 3 turnos.", {bicho: foe(1)})); }
  else if (s === "roubo") {
    const k = bagIds()[0];
    if (k) { p.items[k]--; foeAttack("roar", 0); say(t("{bicho} rouba {item} da bolsa e some nas árvores!", {bicho: foe(1), item: ITEMS[k].n.toLowerCase()})); }
    else say(t("{bicho} puxa o cabelo de Rhanon: −{n} PV.", {bicho: foe(1), n: hit(3)}));
  }
  else if (s === "sono") { e.hp = Math.min(e.max, e.hp + 8); foeAttack("roar", 0); say(t("{bicho} tira um cochilo: +8 PV.", {bicho: foe(1)})); }
  else if (s === "assobio") { const n = hit(Math.ceil(d * .7)); p.medo = 3; setTimeout(() => HERO_A.set("scared"), 400); say(t("\"Fiiit!\" O assobio d{bicho} gela o sangue: −{n} PV. Sem defesa por 3 turnos.", {bicho: foe(), n})); }
  else if (s === "espinhos") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Espinhos"}; say(t("{bicho} se sacode e crava espinhos! −{n} PV e −3 por turno.", {bicho: foe(1), n})); }
  else if (s === "confusao") { const n = hit(Math.ceil(d * .6)); p.weak = 3; say(t("{bicho} deixa pegadas trocadas. −{n} PV, e Rhanon se perde: golpes mais fracos por 3 turnos.", {bicho: foe(1), n})); }
  else if (s === "dinheiro") {   // malandro: leva dinheiro de verdade; vencendo, ele devolve (reward)
    const n = Math.min(G.money, rnd(20, 45)); G.money -= n; e.stolen = (e.stolen || 0) + n; foeAttack("roar", 0);
    say(n ? t("{bicho} passa a mão no dinheiro de Rhanon: −R$ {n}! Vence pra pegar de volta.", {bicho: foe(1), n}) : t("{bicho} enfia a mão na bolsa... e não acha nem uma moeda.", {bicho: foe(1)}));
  }
  else if (s === "casco") { e.hp = Math.min(e.max, e.hp + 12); foeAttack("roar", 0); say(t("{bicho} se fecha no casco: +12 PV.", {bicho: foe(1)})); }
  else if (s === "encanto") { const n = hit(Math.ceil(d * .6)); p.medo = 2; p.sp = Math.max(0, p.sp - 5); setTimeout(() => HERO_A.set("scared"), 400); say(t("{bicho} assobia uma música encantada... −{n} PV e −5 PE. Rhanon fica tonto, sem defesa por 2 turnos.", {bicho: foe(1), n})); }
  else if (s === "salto") say(t("{bicho} pula do galho em cima de Rhanon! −{n} PV.", {bicho: foe(1), n: hit(Math.ceil(d * 1.5))}));
  else if (s === "abraco") { const n = hit(Math.ceil(d * 1.2)); p.preso = 1; say(t("{bicho} dá um abraço apertado! −{n} PV, e nada de fugir.", {bicho: foe(1), n})); }
  else if (s === "frenesi") { const n = hit(d); p.dot = {d: 2, t: 3, n: "Sangramento"}; say(t("{bicho} morde sem parar! −{n} PV e sangramento por 3 turnos.", {bicho: foe(1), n})); }
  else if (s === "choque") { const n = hit(d); p.preso = 1; p.sp = Math.max(0, p.sp - 4); say(t("{bicho} dá um choque! −{n} PV e −4 PE. Rhanon fica travado e não consegue fugir.", {bicho: foe(1), n})); }
  else if (s === "estouro") say(t(e.id === "anta" ? "{bicho} atropela tudo pela frente! −{n} PV." : "{bicho} avança com o bando! −{n} PV.", {bicho: foe(1), n: hit(Math.ceil(d * 1.4))}));
  else if (s === "mergulho") say(t("{bicho} mergulha do alto! −{n} PV.", {bicho: foe(1), n: hit(Math.ceil(d * 1.5))}));
  else if (s === "cardume") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Sangramento"}; say(t("O cardume ataca! −{n} PV e sangramento por 3 turnos.", {n})); }
  else if (s === "constricao") { const n = hit(d); p.preso = 2; p.dot = {d: 3, t: 2, n: "Aperto"}; say(t("{bicho} enrola Rhanon! −{n} PV, e nada de fugir.", {bicho: foe(1), n})); }
  else if (s === "careta") { const n = hit(Math.ceil(d * .7)); p.medo = 2; setTimeout(() => HERO_A.set("scared"), 400); say(t("{bicho} arreganha os dentes de pau numa careta medonha: −{n} PV. Sem defesa por 2 turnos.", {bicho: foe(1), n})); }
  else if (s === "onda") say(t("{bicho} vem de proa e levanta uma onda em cima de Rhanon! −{n} PV.", {bicho: foe(1), n: hit(Math.ceil(d * 1.4))}));
  else if (s === "redemoinho") { const n = hit(Math.ceil(d * 1.2)); p.preso = 2; say(t("{bicho} gira a água e puxa Rhanon pro redemoinho! −{n} PV, e nada de fugir por 2 turnos.", {bicho: foe(1), n})); }
  else if (s === "gargalhada") { const n = hit(Math.ceil(d * .6)); p.medo = 2; p.weak = 2; setTimeout(() => HERO_A.set("scared"), 400); say(t("{bicho} solta uma gargalhada que ecoa no rio: −{n} PV. Rhanon se arrepia: sem defesa e golpes mais fracos por 2 turnos.", {bicho: foe(1), n})); }
  else if (s === "picada") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Veneno"}; say(t("{bicho} pica Rhanon! −{n} PV e veneno por 3 turnos.", {bicho: foe(1), n})); }
}
/* ---------- talismãs do Pajé (CHARMS em data/world.js) ---------- */
const charmRoll = k => charm().fx === k && Math.random() * 100 < charm().ch;   // sorteia o efeito do talismã em uso
// golpe do Rhanon acertou: o dreno cura parte do dano; sangra/queima podem deixar o bicho perdendo PV por 3 turnos
function charmOnHit(d) {
  const c = charm();
  if (!c.fx || d <= 0 || e.hp <= 0) return;
  if (c.fx === "dreno") {
    const n = Math.min(p.max - p.hp, Math.max(1, Math.round(d * c.ch / 100)));
    if (n > 0) { p.hp += n; setTimeout(() => pop("+" + n, $("hero"), "heal"), 250); say(t("O talismã devolve {n} PV.", {n})); }
  } else if ((c.fx === "sangra" || c.fx === "queima") && Math.random() * 100 < c.ch) {
    const fire = c.fx === "queima"; e.dot = {d: 2 + Math.floor(G.lv / 5), t: 3, fire};
    say(t(fire ? "{bicho} pegou fogo!" : "{bicho} tá sangrando!", {bicho: foe(1)})); setTimeout(() => pop(t(fire ? "QUEIMOU!" : "SANGROU!"), $("beast"), "crit"), 300);
  }
}
function tick() {
  if (e.dot && e.dot.t > 0 && e.hp > 0) {   // sangramento ou queimadura que o talismã deixou no bicho
    const n = Math.min(e.hp, e.dot.d); e.hp -= n; e.dot.t--; hitBeast(); pop("−" + n, $("beast"));
    say(t(e.dot.fire ? "Queimadura: {bicho} perde {n} PV." : "Sangramento: {bicho} perde {n} PV.", {bicho: foe(), n}));
  }
  if (p.dot && p.dot.t > 0) {
    p.hp -= p.dot.d; p.dot.t--;
    if (p.dot.n === "Drenagem") { e.hp = Math.min(e.max, e.hp + p.dot.d); say(t("Drenagem: −{n} PV, e {bicho} recupera {n}.", {n: p.dot.d, bicho: foe()})); }
    else say(`${t(p.dot.n)}: −${p.dot.d} ${t("PV")}.`);
  }
  if (e.espanto > 0) e.espanto--;
  if (p.fiel > 0 && e.hp > 0) allyEcho();   // Aliado fiel: o espírito volta e ataca no fim do turno
  if (hasSkill("regen") && p.hp > 0) { p.hp = Math.min(p.max, p.hp + 3); p.sp = Math.min(p.msp, p.sp + 1); }   // Proteção dos encantados
  if (p.medo > 0) p.medo--;
  if (p.weak > 0) p.weak--;
  if (p.preso > 0) p.preso--;
}
// XP, pele e progresso por vencer o bicho a (na batalha, o bicho atual); mult reduz o XP (abate direto)
// drop = a pele fica no chão da exploração (golpe só) em vez de ir direto para a bolsa
function reward(a = e, mult = 1, drop = false, quietLv = false) {   // quietLv: quem chamou mostra a subida de nível (cartão da luta)
  noteWin(a.id);   // caderno de bichos e pedido de "vencer"
  const back = a.stolen || 0; if (back) { G.money += back; a.stolen = 0; }   // dinheiro que o malandro levou volta
  if (a.boss) BS()[bossKey(curZone)] = true; else K()[curZone] = (K()[curZone] || 0) + 1; const xp = Math.round(a.xp * mult), L0 = G.lv; vit();
  const got = drop || a.bug ? 0 : a.boss ? rnd(1, 3) : 1;   // chefe deixa de 1 a 3 (o Pajé faz talismã com elas); bug não deixa nada
  const part = NB_DROP[a.id] && G.nb.tem && !G.nb[NB_DROP[a.id]] ? NB_DROP[a.id] : null;   // macaco e ariranha largam peças do notebook
  if (part) { G.nb[part] = true; G.nbNew.push(part); }   // nbNew: a tela do notebook mostra ela encaixando
  if (got) G.pelts[a.id] = (G.pelts[a.id] || 0) + got;
  G.xp += xp;
  while (G.xp >= need(G.lv)) { G.xp -= need(G.lv); G.lv++; }
  if (G.lv > L0 && !quietLv) setTimeout(() => levelUpFx(G.lv), 150);
  drawXp();
  vit(); G.hp = Math.min(maxHP(G.lv), G.hp + maxHP(G.lv) - maxHP(L0)); G.sp = Math.min(maxSP(G.lv), G.sp + maxSP(G.lv) - maxSP(L0));
  save();
  // o que ganhou, em pedaços curtos (o cartão mostra um por linha; a exploração junta com " · ")
  return [
    back && t("R$ {n} de volta no bolso", {n: back}),
    xp ? `+${xp} XP` : drop && t("Sem XP (fraco demais)"),
    part && t(part === "teclado" ? "O macaco largou o teclado do notebook!" : "A ariranha largou o carregador do notebook!"),
    a.bug ? null : drop ? t("{pele} no chão: passa por cima", {pele: peltName(a.id)}) : got > 1 ? t("{pele} ×{q} (R$ {n} cada na feira)", {pele: peltName(a.id), q: got, n: peltValue(a.id)}) : t("{pele} (R$ {n} na feira)", {pele: peltName(a.id), n: peltValue(a.id)}),
    G.lv > L0 && t("Nível {n}!", {n: G.lv}),
    CURITIBA_OPEN && L0 < REQ.lv && G.lv >= REQ.lv && t("Destino novo no mapa"),
    a.boss && NEXT_Z[curZone] ? t("Liberou: {lugar}", {lugar: ZONES[NEXT_Z[curZone]].n}) : a.boss && NEED.parada === curZone && !G.night && t("Liberou: {lugar}", {lugar: SUB.parada.n}),
    [...Object.values(EQUIP.legs), ...Object.values(EQUIP.torso)].some(it => it.price && L0 < it.lv && G.lv >= it.lv) && t("Roupa nova na feira")
  ].filter(Boolean);
}
function keepVitals(kind) {
  vit();
  G.loseStreak = kind === "lose" ? (G.loseStreak || 0) + 1 : kind === "win" ? 0 : G.loseStreak; if (kind === "lose") G.loseZone = curZone;
  if (kind === "lose") { G.hp = Math.ceil(maxHP(G.lv) / 2); G.sp = Math.ceil(maxSP(G.lv) / 2); G.lastLoss = Math.round(G.money * (.05 + Math.random() * .1)); G.money -= G.lastLoss; G.sub = CITY[curCity()].home; G.day++; }   // acorda na aldeia (ou no Ver-o-Peso, em Belém)
  else { G.hp = Math.max(1, p.hp); G.sp = p.sp; G.items = p.items; }
  save();
}
