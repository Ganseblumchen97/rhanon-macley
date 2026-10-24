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
  G.man = G.man ?? 3; G.pelts = G.pelts || {}; G.day = G.day || 1; G.sub = G.sub || "aldeia";
  G.owned = G.owned || {tanga: true, lanca: true}; G.equip = G.equip || {legs: "tanga", torso: null, weapon: "lanca"};
}
const K = () => G.kills || (G.kills = {}), BS = () => G.boss || (G.boss = {});   // vitórias e chefes por zona

// tela atual: "hunt" (batalha), "interview", "betterInterview" ou "work"
let mode = "hunt";
// batalha: p = Rhanon, e = bicho; holdE/holdP seguram as barras até a animação do golpe chegar
let p, e, busy, lines, holdE = null, holdP = null, preE = 0;
let curZone = "mata", bossFight = false, fromLocal = false;
// desafios de Curitiba
let interviewIndex = 0, activeQuestions = null, challengeKind = "interview";
// mapas
let moving = false, sure = false;
