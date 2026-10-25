/* Batalha por turnos contra os bichos. */
function setBattleDecor(zone) {
  const stage = $("stage"), decor = $("bgDecor");
  if (!stage || !decor) return;
  stage.classList.remove("zone-mata","zone-rio","zone-fechada");
  stage.classList.add("zone-" + (zone || curZone || "mata"));
  decor.innerHTML = "";
  if (zone === "rio") {
    const reeds = document.createElement("div"); reeds.className = "reeds";
    for (let i=0;i<12;i++){ const r=document.createElement("div"); r.className="reed"; r.style.height=`calc(${8 + Math.random()*6} * var(--px))`; reeds.appendChild(r); }
    decor.appendChild(reeds);
    const l = document.createElement("div"); l.className="lilypad"; decor.appendChild(l);
  } else if (zone === "fechada") {
    const t1=document.createElement("div"); t1.className="tree left"; t1.innerHTML='<div class="trunk"></div><div class="crown"></div>'; decor.appendChild(t1);
    const t2=document.createElement("div"); t2.className="tree right"; t2.innerHTML='<div class="trunk"></div><div class="crown"></div>'; decor.appendChild(t2);
    const b1=document.createElement("div"); b1.className="bush b1"; decor.appendChild(b1);
    const b2=document.createElement("div"); b2.className="bush b3"; decor.appendChild(b2);
  } else {
    const t1=document.createElement("div"); t1.className="tree left"; t1.innerHTML='<div class="trunk"></div><div class="crown"></div>'; decor.appendChild(t1);
    const t2=document.createElement("div"); t2.className="tree mid"; t2.innerHTML='<div class="trunk"></div><div class="crown"></div>'; decor.appendChild(t2);
    const b1=document.createElement("div"); b1.className="bush b1"; decor.appendChild(b1);
    const b2=document.createElement("div"); b2.className="bush b2"; decor.appendChild(b2);
  }
}

function getBattleTrackFor(animal) {
  if (animal.boss) return "battleP5";
  if (animal.size === "pequeno") return "battleP3";
  if (animal.size === "médio") return "battleP4";
  if (animal.size === "grande") return "battleP5";
  return "battleP3";
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
  subMenu = null; $("cmds").innerHTML = "";
  CMDS.forEach((c, n) => cmdButton(`<i class="key">${n + 1}</i>${c.n}<small></small>`, c.d, () => act(c.id)));   // o número é a tecla de atalho (1-6)
}
// opts: [{label, small, desc, fn, off}]; números escolhem, Esc volta sem gastar o turno
function openSubMenu(opts, backDesc, from) {
  subMenu = opts; subFrom = from; sfx("look"); $("cmds").innerHTML = "";
  opts.forEach((o, n) => cmdButton(`<i class="key">${n + 1}</i>${o.label}<small>${o.small || ""}</small>`, o.desc, o.fn, o.off));
  cmdButton(`<i class="key">Esc</i>Voltar`, backDesc, closeSubMenu);
  $("cmds").firstChild.focus();
}
function closeSubMenu() { const from = subFrom; buildCmds(); render(); $("cmds").children[from].focus(); }
const bagIds = () => Object.keys(ITEMS).filter(k => (p.items[k] || 0) > 0);
function openItemMenu() {
  openSubMenu(bagIds().map(k => ({label: ITEMS[k].n, small: "×" + p.items[k], desc: `${ITEMS[k].n}: ${itemEffect(ITEMS[k])}.`, fn: () => useItem(k)})), "Fecha a bolsa sem gastar o turno.", CMDS.findIndex(c => c.id === "item"));
}
function openSpecialMenu() {
  openSubMenu(SPECIALS.map(s => ({label: s.n, small: s.id === "flecha" && !G.equip.ranged ? "sem arco" : s.cost + " PE", desc: s.d, off: !avail(s.id), fn: () => { buildCmds(); act(s.id); }})),
    "Volta aos comandos sem gastar o turno.", CMDS.findIndex(c => c.id === "especial"));
}// usa um item da bolsa: gasta o turno, como os outros comandos
function useItem(k) {
  const it = ITEMS[k]; if (busy || !(p.items[k] > 0)) return;
  buildCmds(); busy = true; preE = e.hp; HERO_A.set("eat");
  p.items[k]--; p.hp = Math.min(p.max, p.hp + it.hp); p.sp = Math.min(p.msp, p.sp + it.sp);
  sfx("heal"); pop(it.hp ? "+" + it.hp : "+" + it.sp, $("hero"), "heal"); burst(pos($("hero")), it.hp ? ["#7dff9a", "#fff"] : ["#19a8d8", "#fff"], 8, 40);
  say(`Rhanon come ${it.n.toLowerCase()}. ${itemEffect(it)}.`);
  render(); $("cmds").firstChild.focus();
  setTimeout(enemyTurn, 750);
}

// opts: animal (bicho escolhido), firstHit (dano do golpe de abertura na exploração), enemyFirst (o bicho começa)
function init(opts = {}) {
  $("homeButton").hidden = true; $("map").hidden = true; $("local").hidden = true;
  $("game").classList.remove("working-mode"); $("stage").classList.remove("working"); $("workScene").hidden = true; $("beast").style.display = ""; $("hero").style.display = "";
  setBattleDecor(curZone);
  mode = "hunt";
  buildCmds();
  const animal = opts.animal || pickAnimal();
  $("plate").querySelector("b").textContent = animal.name; $("plate").querySelector(".lv").textContent = "Nv " + (animal.lv || 1);
  $("beast").innerHTML = ""; $("beast").appendChild(animalSprite(animal)); refreshHero();
  const spr = $("beast").firstChild;
  $("beast").style.top = `calc(46% - ${spr.height / (+spr.dataset.scale || 1) * (animal.boss ? 1.35 : 1)} * var(--px) + 12px)`; $("beast").style.right = "12%"; $("beast").setAttribute("aria-label", animal.name); $("hero").style.display = ""; $("intent").style.display = ""; $("ehp").parentElement.style.display = ""; $("spTxt").parentElement.style.display = ""; $("sp").parentElement.style.display = "";
  musicStop();
  vit(); const mh = maxHP(G.lv), ms = maxSP(G.lv); $("again").style.display = fromExplore ? "none" : ""; $("again").textContent = "Lutar de novo"; $("toMap").textContent = fromExplore ? "Continuar explorando" : "Voltar ao mapa";
  p = {hp:Math.max(1, G.hp), max:mh, sp:G.sp, msp:ms, def:false, atento:false, items:{...G.items}};
  e = { ...animal, hp:animal.hp, max:animal.hp, intent:null, known:false, assustada:false };
  busy = false;
  lines = [animal.intro];
  if (opts.firstHit) { e.hp = Math.max(1, e.hp - opts.firstHit); lines.push(`Rhanon acertou primeiro: −${opts.firstHit}. Sua vez!`); }
  if (opts.enemyFirst) lines.push(`${animal.name} pegou Rhanon desprevenido!`);
  $("over").hidden = true;
  $("beast").className = "beast"; $("hero").className = "hero"; holdE = null; holdP = null; $("lvTxt").textContent = "Nv " + G.lv + (defense() ? " · DEF " + defense() : "");
  pick(); render();
  $("cmds").firstChild.focus(); musicStart(getBattleTrackFor(animal));
  // abertura: o Rhanon entra pela esquerda, o bicho chega pela direita e o nome dele aparece numa faixa
  PFX.clear();
  HERO_A.mount($("hero"), {weapon: true, mode: "battle", state: "walk"});
  const boss = !!e.boss;
  BEAST_A.mount($("beast"), $("beast").querySelector("canvas") || animalSprite(e), {id: e.id, boss, state: "enter", fit: true});
  busy = true; render();
  HERO_A.slide("-38vw", "0px", 650, () => HERO_A.set("idle"));
  BEAST_A.slide("42vw", "0px", 600, () => { BEAST_A.set("idle"); BEAST_A.dust(); BEAST_A.bang(); sfx(boss ? "roar" : "guard"); });
  setTimeout(() => encounterBanner(e.name), 380);
  setTimeout(() => { if (opts.enemyFirst) return enemyTurn(); busy = false; render(); $("cmds").firstChild && $("cmds").firstChild.focus(); }, REDUCE ? 300 : 1350);
}
function pick() {
  const r = Math.random() * 100;
  e.intent = r < 45 ? "arranhao" : r < 80 ? "bote" : "rugido";
  e.known = false;
}
function say(t) { lines.push(t); if (lines.length > 4) lines.shift(); }
function avail(id) {
  if (busy) return false;
  if (id === "tocha") return p.sp >= 6;
  if (id === "flecha") return !!G.equip.ranged && p.sp >= 3;
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
  $("log").innerHTML = lines.map(l => "<p>" + l + "</p>").join("");
  $("intentTxt").textContent = e.known ? "Próximo golpe: " + (e.moves || MOVES)[e.intent] : `${e.name} se prepara para atacar…`;
  $("intent").className = "intent" + (e.known ? " known" : "");
  const st = [];
  if (p.atento) st.push("Atento: próximo ataque crítico");
  if (p.def) st.push("Em guarda"); if (p.dot && p.dot.t > 0) st.push(p.dot.n); if (p.weak > 0) st.push("Fedor"); if (p.preso > 0) st.push("Preso");
  if (e.assustada) st.push(`${e.name} assustado`);
  $("status").textContent = st.join(" · ");
  if (!subMenu) CMDS.forEach((c, i) => {
    const b = $("cmds").children[i];
    b.setAttribute("aria-disabled", avail(c.id) ? "false" : "true");
    b.querySelector("small").textContent = c.id === "item" ? "×" + itemCount(p.items) : c.id === "especial" ? "PE" : "";
  });
}
function hitBeast() {
  const b = $("beast"); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
  if (BEAST_A.state !== "defeat") BEAST_A.set("hurt");
}
function act(id) {
  if (!avail(id)) return;
  if (id === "defender") HERO_A.set("guard");
  if (id === "item") return openItemMenu();
  if (id === "especial") return openSpecialMenu();   // abre a bolsa; o turno só é gasto ao usar um item
  if (id === "observar") HERO_A.set("observe");
  busy = true; preE = e.hp;
  let extra = false;
  if (id === "atacar") {
    let d = rnd(6, 10) + G.lv - 1 + weaponAtk(), crit = p.atento;
    if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d); strike(d, crit ? "crit" : "", "spear");
    sayLate(crit ? `Golpe certeiro! A lança acerta o ponto fraco: −${d}.` : `Rhanon arremessa a lança: −${d}.`);
  } else if (id === "tocha") {
    p.sp -= 6;
    let d = rnd(14, 18) + G.lv - 1; if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d); strike(d, "", "fire");
    sayLate(`Rhanon avança com a tocha contra ${e.name.toLowerCase()}: −${d}.`);
    if (!e.assustada && e.hp > 0) { e.assustada = true; extra = true; sayLate(`FRAQUEZA! ${e.name} recua assustado. Mais uma!`); setTimeout(() => { sfx("more"); pop("FRAQUEZA!", $("beast"), "crit"); }, 450); }
  } else if (id === "flecha") {   // tiro com o arco: menos dano que a lança, mas 40% de chance de crítico
    p.sp -= 3;
    let d = rnd(5, 9) + G.lv - 1, crit = p.atento || Math.random() < .4;
    if (crit) { d *= 2; p.atento = false; } if (p.weak > 0) d = Math.ceil(d / 2);
    e.hp = Math.max(0, e.hp - d); strike(d, crit ? "crit" : "", "arrow");
    sayLate(crit ? `Flechada certeira no ponto fraco: −${d}!` : `Rhanon dispara uma flecha: −${d}.`);
  } else if (id === "observar") {
    e.known = true; p.atento = true; sfx("look");
    say(`Rhanon observa ${e.name.toLowerCase()}. Próximo movimento: ${(e.moves || MOVES)[e.intent]}.`);
  } else if (id === "defender") {
    p.def = true; p.sp = Math.min(p.msp, p.sp + 3); sfx("guard");
    say("Rhanon firma os pés e levanta a guarda.");
  } else if (id === "fugir") {
    const chance = p.preso > 0 ? 0 : 35 + (e.hp < 30 ? 25 : 0) + (e.known ? 15 : 0);
    if (Math.random() * 100 < chance) { render(); return finish("flee"); }
    say(p.preso > 0 ? "Rhanon está preso e não consegue fugir!" : `Rhanon tenta fugir, mas ${e.name.toLowerCase()} corta o caminho.`);
  }
  render();
  if (e.hp <= 0) return setTimeout(() => finish("win"), 480);
  if (extra) { setTimeout(() => { busy = false; render(); }, 480); return; }
  setTimeout(enemyTurn, 750);
}
function enemyTurn() {
  const i = e.intent;
  if (i === "arranhao") {
    let d = rnd(e.damage[0], Math.max(e.damage[0], Math.min(e.damage[1], e.damage[0]+3))); if (p.def) d = Math.ceil(d / 2); d = Math.max(1, d - defense());
    p.hp -= d; foeAttack("claw", d); say(`${e.name} ataca Rhanon: −${d} PV.`);
  } else if (i === "bote") {
    let d = rnd(Math.max(e.damage[0], e.damage[1]-4), e.damage[1]); d = Math.max(1, d - defense());
    if (p.def) {
      d = Math.ceil(d * .35); e.hp = Math.max(0, e.hp - 4); hitBeast();
      say(`Rhanon se esquiva e o bote perde força: −${d} PV. Contra-ataque: −4 em ${e.name.toLowerCase()}.`);
    } else say(`${e.name} avança com força! −${d} PV.`);
    p.hp -= d; foeAttack("claw", d);
  } else {
    if (e.special) special(); else { const sp0 = p.sp; p.hp -= 3; p.sp = Math.max(0, p.sp - 4); foeAttack("roar", 3, sp0); }
    if (!e.special) say(`${e.name} usa um ataque intimidador. −3 PV, −4 PE.`);
  }
  p.def = false; e.assustada = false; tick();
  p.hp = Math.max(0, p.hp);
  if (e.hp <= 0) { render(); return finish("win"); }
  if (p.hp <= 0) { render(); return finish("lose"); }
  pick(); busy = false; render();
}
function finish(kind) {
  if (kind === "win") { BEAST_A.set("defeat"); setTimeout(() => HERO_A.set("victory"), 250); }
  else if (kind === "lose") HERO_A.set("defeat");
  else if (kind === "flee") { HERO_A.set("flee"); HERO_A.slide("0px", "-60vw", 1000); }
  // depois da fanfarra, a música do lugar volta baixinho enquanto o cartão de resultado está na tela
  setTimeout(() => { if (!$("over").hidden && mode === "hunt") musicStart(fromLocal || fromExplore ? "local" : "map"); }, 2800);
  busy = true; battleResult = kind;
  musicStop(); keepVitals(kind); const rw = kind === "win" ? reward() : kind === "lose" ? " Rhanon desmaiou e acordou na aldeia, com metade das forças" + (G.lastLoss ? ` e R$ ${G.lastLoss} a menos.` : ".") : ""; if (kind === "win") $("beast").classList.add("dead"); fanfare(kind);
  const T = {
    win:  ["Rhanon sobreviveu!", `${e.name} foi vencido ou afugentado. A mata guarda mais encontros e recompensas diferentes. Rhanon ainda não sabe, mas o futuro dele tem teclado, pendrive e uma lojinha de cópias.`],
    flee: ["Fugiu com dignidade.", `Correr também é estratégia de sobrevivência. ${e.name} fica para a próxima, e Rhanon fica para contar a história.`],
    lose: ["Fim da trilha.", `${e.name} foi mais forte desta vez. Mas todo grande programador de Curitiba tem uma origem difícil: tente de novo.`]
  }[kind];
  setTimeout(() => {
    $("overTitle").textContent = T[0]; $("overTxt").textContent = T[1] + rw;
    const again = kind !== "lose" && !fromExplore;
    if (fromExplore && kind === "lose") $("toMap").textContent = "Voltar à aldeia";
    $("again").style.display = again ? "" : "none"; $("over").hidden = false; (again ? $("again") : $("toMap")).focus();
  }, kind === "win" ? 1700 : kind === "lose" ? 1900 : 1150);
}
function sayLate(t) { setTimeout(() => { say(t); render(); }, 450); }
// golpe do bicho: anima, e o dano aparece na barra só quando o golpe "chega"
function foeAttack(kind, d, sp0) {
  BEAST_A.set(kind === "roar" ? "roar" : "windup");
  holdP = {hp: p.hp + d, sp: sp0 === undefined ? p.sp : sp0};
  if (kind === "roar") { sfx("roar"); anim($("beast"), "hit"); }
  else { anim($("beast"), "lunge"); sfx("claw"); }
  setTimeout(() => {
    holdP = null; render();
    if (d) { anim($("hero"), "hurt"); sfx("hurt"); hurtFx(kind, d); pop("−" + d, $("hero"), "me"); if (HERO_A.state !== "defeat") HERO_A.set("hurt"); }
  }, kind === "roar" ? 400 : 220);
}
// golpe do Rhanon: lança ou tocha voando até o bicho
function strike(d, cls, kind) {
  HERO_A.set(kind === "fire" ? "torch" : kind === "arrow" ? "shoot" : "throw");
  holdE = preE; anim($("hero"), "lunge"); sfx(kind === "fire" ? "fire" : "spear");
  const a = pos($("hero")), b = pos($("beast")), fire = kind === "fire";
  const c = fire ? gridC(FLAME, PAL_F, 5) : kind === "arrow" ? arrowC(4) : spearC(4);
  c.style.left = a.x + "px"; c.style.top = a.y + "px"; $("fx").appendChild(c);
  const ang = Math.atan2(b.y - a.y, b.x - a.x), arc = fire ? 0 : kind === "arrow" ? -18 : -50, rot = (k) => fire ? 0 : ang + k;
  const an = c.animate([
    {transform: `translate(-50%,-50%) rotate(${rot(0)}rad)`},
    {transform: `translate(calc(-50% + ${(b.x - a.x) / 2}px),calc(-50% + ${(b.y - a.y) / 2 + arc}px)) rotate(${rot(.25)}rad)`, offset: .5},
    {transform: `translate(calc(-50% + ${b.x - a.x}px),calc(-50% + ${b.y - a.y}px)) rotate(${rot(.5)}rad)`}
  ], {duration: 430, easing: "steps(10)", fill: "forwards"});
  if (fire) for (let i = 1; i < 6; i++) setTimeout(() => {
    const q = el$("fxp", {left: a.x + (b.x - a.x) * i / 6 + "px", top: a.y + (b.y - a.y) * i / 6 + "px", width: "8px", height: "8px", background: i % 2 ? "#ffd23a" : "#f2740c"});
    rm(q, 350, [{opacity: 1, transform: "scale(1)"}, {opacity: 0, transform: "translateY(14px) scale(.2)"}]);
  }, i * 65);
  an.onfinish = () => {
    c.remove(); holdE = null; render(); hitBeast(); sfx(cls === "crit" ? "crit" : "hit");
    burst(b, fire ? ["#ffd23a", "#f2740c", "#d62828"] : ["#fff", "#cfd8dc", "#f2a20c"], cls === "crit" ? 16 : 9, cls === "crit" ? 90 : 60);
    pop(String(d), $("beast"), cls); if (cls === "crit" || d >= 14) shake();
  };
}
function pickAnimal() {
  if (bossFight && !BS()[curZone]) return ANIMALS.find(a => a.id === ZONES[curZone].boss);
  return pickFromPool(curZone);
}
function special() {
  const s = e.special, d = rnd(e.damage[0], e.damage[1]);
  const hit = (n, k) => { if (p.def) n = Math.ceil(n / 2); n = Math.max(1, n - defense()); p.hp -= n; foeAttack(k || "claw", n); return n; };
  if (s === "fedor") { p.weak = 3; foeAttack("roar", 0); say(`${e.name} solta um fedor horrível! Seus golpes enfraquecem por 3 turnos.`); }
  else if (s === "roubo") {
    const k = bagIds()[0];
    if (k) { p.items[k]--; foeAttack("roar", 0); say(`${e.name} rouba ${ITEMS[k].n.toLowerCase()} da sua bolsa e escapa pelas árvores!`); }
    else say(`${e.name} puxa seu cabelo: −${hit(3)} PV.`);
  }
  else if (s === "sono") { e.hp = Math.min(e.max, e.hp + 8); foeAttack("roar", 0); say(`${e.name} cochila no galho e recupera 8 PV.`); }
  else if (s === "estouro") say(`${e.name} avança com o bando! −${hit(Math.ceil(d * 1.4))} PV.`);
  else if (s === "mergulho") say(`${e.name} mergulha do alto! −${hit(Math.ceil(d * 1.5))} PV.`);
  else if (s === "cardume") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Sangramento"}; say(`O cardume ataca! −${n} PV e sangramento por 3 turnos.`); }
  else if (s === "constricao") { const n = hit(d); p.preso = 2; p.dot = {d: 3, t: 2, n: "Aperto"}; say(`${e.name} enrola Rhanon! −${n} PV. Você não consegue fugir.`); }
  else if (s === "picada") { const n = hit(d); p.dot = {d: 3, t: 3, n: "Veneno"}; say(`${e.name} pica Rhanon! −${n} PV e veneno por 3 turnos.`); }
}
function tick() {
  if (p.dot && p.dot.t > 0) { p.hp -= p.dot.d; say(`${p.dot.n}: −${p.dot.d} PV.`); p.dot.t--; }
  if (p.weak > 0) p.weak--;
  if (p.preso > 0) p.preso--;
}
// XP, pele e progresso por vencer o bicho a (na batalha, o bicho atual)
function reward(a = e) {
  if (a.boss) BS()[curZone] = true; else K()[curZone] = (K()[curZone] || 0) + 1; const xp = a.xp, L0 = G.lv; vit(); G.pelts[a.id] = (G.pelts[a.id] || 0) + 1;
  G.xp += xp;
  while (G.xp >= need(G.lv)) { G.xp -= need(G.lv); G.lv++; }
  vit(); G.hp = Math.min(maxHP(G.lv), G.hp + maxHP(G.lv) - maxHP(L0)); G.sp = Math.min(maxSP(G.lv), G.sp + maxSP(G.lv) - maxSP(L0));
  save();
  return ` Ganhou ${xp} XP e conseguiu ${peltName(a.id).toLowerCase()} (vale R$ ${peltValue(a.id)} na feira).` + (G.lv > L0 ? ` Subiu para o nível ${G.lv}!` : "") + (CURITIBA_OPEN && L0 < REQ.lv && G.lv >= REQ.lv ? " Um novo destino apareceu no mapa." : "") + (a.boss && NEXT_Z[curZone] ? " Novo local liberado: " + ZONES[NEXT_Z[curZone]].n + "." : "") + ([...Object.values(EQUIP.legs), ...Object.values(EQUIP.torso)].some(it => it.price && L0 < it.lv && G.lv >= it.lv) ? " Tem roupa nova na feira." : "");
}
function keepVitals(kind) {
  vit();
  if (kind === "lose") { G.hp = Math.ceil(maxHP(G.lv) / 2); G.sp = Math.ceil(maxSP(G.lv) / 2); G.lastLoss = Math.round(G.money * (.05 + Math.random() * .1)); G.money -= G.lastLoss; G.sub = "aldeia"; G.day++; }
  else { G.hp = Math.max(1, p.hp); G.sp = p.sp; G.items = p.items; }
  save();
}
