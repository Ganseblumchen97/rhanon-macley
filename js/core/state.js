/* Estado do jogo. G é o progresso salvo; o resto é estado da tela atual (não vai para o save). */
// modo de teste pela URL (index.html?debug&fase=varzea&nv=16): usa um save à parte, que começa do zero a cada
// abertura, então o save de verdade nunca é tocado. As opções são aplicadas por debugSetup() no fim do main.js.
const DEBUG = /[?&]debug(&|=|$)/.test(location.search) ? new URLSearchParams(location.search) : null;
const KEY = DEBUG ? "rhanon-save-debug" : "rhanon-save-v1";
const need = l => 20 + 20 * l;                 // XP para passar do nível l
// talismã em uso (EQUIP.amulet, feito pelo Pajé): charmStat("atk" | "def" | "hp" | "sp") soma ao status; charm() = o item inteiro
const charm = () => (typeof EQUIP !== "undefined" && G.equip && EQUIP.amulet && EQUIP.amulet[G.equip.amulet]) || {};
const charmStat = k => charm()[k] || 0;
// árvore de habilidades (data/skills.js): skillStat soma o status dos degraus aprendidos; hasSkill(fx) = tem o efeito
const skillsOn = () => typeof SKILL_TREES !== "undefined" && G.skills ? SKILL_TREES.flatMap(tr => tr.nodes).filter(n => G.skills[n.id]) : [];
const skillStat = k => skillsOn().reduce((a, n) => a + (n[k] || 0), 0);
const hasSkill = fx => skillsOn().some(n => n.fx === fx);
const maxHP = l => 40 + 6 * (l - 1) + charmStat("hp") + skillStat("hp"), maxSP = l => 20 + 2 * (l - 1) + charmStat("sp") + skillStat("sp");

let G = {lv: 1, xp: 0, money: 0, loc: "ananindeua"};
if (!DEBUG) try { Object.assign(G, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
G.jobXp = G.jobXp || 0; G.jobMissions = G.jobMissions || 0; G.job = !!G.job; G.betterJob = !!G.betterJob;

function save() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (_) {} }
// completa os campos que saves antigos não têm e limita PV/PE ao máximo do nível
function vit() {
  G.hp = Math.min(G.hp ?? maxHP(G.lv), maxHP(G.lv)); G.sp = Math.min(G.sp ?? maxSP(G.lv), maxSP(G.lv));
  if (!G.items) { G.items = {mandioca: G.man ?? 3}; delete G.man; }   // saves antigos guardavam só as mandiocas em G.man
  G.pelts = G.pelts || {}; G.day = G.day || 1; G.sub = G.sub || "aldeia"; G.night = !!G.night;   // night: é noite (fogueira "descansar até a noite")
  // tutorial: ainda falta a conversa com o caçador (só num jogo sem progresso; saves antigos já passaram dela)
  G.bestiary = G.bestiary || {}; G.questsDone = G.questsDone || {}; G.quest = G.quest || null; G.offer = G.offer || null;   // caderno e pedidos
  if (G.tutorial === undefined) G.tutorial = G.lv === 1 && !G.xp && !Object.keys(G.kills || {}).length;
  G.passagem = !!G.passagem; G.belemVisto = !!G.belemVisto;   // passagem de ônibus para Belém (Parada da BR-316)
  if (SUB[G.sub] && cityOf(G.sub) !== curCity()) G.sub = CITY[curCity()].home;   // o local guardado tem que ser da cidade atual
  // locais que já apareceram no mapa de Ananindeua; save antigo: tudo o que já está liberado (sem repetir animação)
  if (!G.seen) { G.seen = {}; CITY.ananindeua.route.forEach(k => { if (unlocked(k)) G.seen[k] = true; }); }   // Belém aparece aos poucos na primeira chegada
  G.skills = G.skills || {};   // degraus aprendidos da árvore de habilidades
  // notebook: jogo novo começa sem ele (missão do começo); save antigo já tem tudo ligado
  if (!G.nb) G.nb = G.tutorial ? {} : {tem: true, bateria: true, teclado: true, carregador: true, on: true};
  G.freela = G.freela || {}; G.portfolio = G.portfolio || {};   // bugs resolvidos por freela; freelas entregues
  G.owned = G.owned || {tanga: true, lanca: true}; G.equip = G.equip || {legs: "tanga", torso: null, weapon: "lanca"};
}
/* Opções do modo de teste (todas opcionais, juntas com &):
   fase=varzea   entra direto nessa fase, com os chefes das fases anteriores vencidos (e o mapa revelado até ela)
   chefe         também conta o chefe dessa fase como vencido (a passagem G já abre)
   nv=16         nível do Rhanon (PV e PE cheios)      dinheiro=500   R$ na bolsa
   noite         começa à noite                         arco           com o arco equipado (flecha no X)
   notebook      notebook quebrado (sem bateria, teclado e carregador), para testar a missão
   tela=mapa | cidade   sem fase: abre o mapa grande ou o mapa da cidade da fase */
function debugSetup() {
  if (!DEBUG) return;
  const fase = DEBUG.get("fase"), nv = +DEBUG.get("nv") || 0, money = +DEBUG.get("dinheiro") || 0;
  if (fase && !STAGES[fase]) { alert("Modo de teste: fase \"" + fase + "\" não existe. Fases: " + Object.keys(STAGES).join(", ")); return; }
  G.tutorial = false; G.night = DEBUG.has("noite");
  if (nv) { G.lv = nv; G.hp = maxHP(nv); G.sp = maxSP(nv); }
  if (money) G.money = money;
  vit();
  if (DEBUG.has("arco")) { G.owned.arco = true; G.equip.ranged = "arco"; }
  G.nb = DEBUG.has("notebook") ? {tem: true} : {tem: true, bateria: true, teclado: true, carregador: true, on: true};   // "notebook": começa sem as peças
  if (fase) {
    const city = cityOf(fase), route = city === "belem" ? [...CITY.ananindeua.route, ...CITY.belem.route] : CITY.ananindeua.route;
    const upto = route.indexOf(fase);
    route.slice(0, upto < 0 ? route.length : upto + (DEBUG.has("chefe") ? 1 : 0)).forEach(z => { if (ZONES[z]) BS()[z] = true; });
    route.slice(0, upto + 1).forEach(z => { if (cityOf(z) === city) G.seen[z] = true; });
    if (city === "belem") { G.loc = "belem"; G.passagem = true; G.belemVisto = true; }
    G.sub = fase;
  }
  save();
  $("gameVersion").textContent += " · MODO DE TESTE";
  if (fase) startExplore(fase);
  else if (DEBUG.get("tela") === "mapa") { $("titleScreen").hidden = true; showMapNow(); }
  else if (DEBUG.get("tela") === "cidade") { $("titleScreen").hidden = true; showLocal(); }
}
const itemCount = bag => Object.values(bag || {}).reduce((a, n) => a + n, 0);
const K = () => G.kills || (G.kills = {}), BS = () => G.boss || (G.boss = {});   // vitórias e chefes por zona

// tela atual: "hunt" (batalha), "interview", "betterInterview" ou "work"
let mode = "hunt";
// batalha: p = Rhanon, e = bicho; holdE/holdP seguram as barras até a animação do golpe chegar
let p, e, busy, lines, holdE = null, holdP = null, preE = 0;
let curZone = "mata", bossFight = false, fromLocal = false;
// batalha que começou na exploração e como ela terminou ("win", "flee" ou "lose")
let fromExplore = false, battleResult = null;
// desafios de Curitiba
let interviewIndex = 0, activeQuestions = null, challengeKind = "interview";
// mapas
let moving = false, sure = false;
