/* Estado do jogo. G é o progresso salvo; o resto é estado da tela atual (não vai para o save). */
const KEY = "rhanon-save-v1";
const need = l => 20 + 20 * l;                 // XP para passar do nível l
const maxHP = l => 40 + 6 * (l - 1), maxSP = l => 20 + 2 * (l - 1);

let G = {lv: 1, xp: 0, money: 0, loc: "ananindeua"};
try { Object.assign(G, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (_) {}
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
  G.passagem = !!G.passagem; G.belemVisto = !!G.belemVisto;
  // locais que já apareceram no mapa de Ananindeua; save antigo: tudo o que já está liberado (sem repetir animação)
  if (SUB[G.sub] && cityOf(G.sub) !== curCity()) G.sub = CITY[curCity()].home;   // o local guardado tem que ser da cidade atual
  if (!G.seen) { G.seen = {}; CITY.ananindeua.route.forEach(k => { if (unlocked(k)) G.seen[k] = true; }); }   // Belém aparece aos poucos na primeira chegada   // passagem de ônibus para Belém (Parada da BR-316)
  G.owned = G.owned || {tanga: true, lanca: true}; G.equip = G.equip || {legs: "tanga", torso: null, weapon: "lanca"};
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
