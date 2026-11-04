/* Habilidades: três caminhos numa teia (SKILL_WEB, desenhada em systems/skills.js). As três primeiras ficam no meio;
   aprender um degrau libera todos os vizinhos ligados a ele. O custo vem do anel: 1, 2, 3, 4, 7 e 10 do meio para a borda,
   então ninguém pega tudo (a teia inteira custa 132). O Rhanon ganha 1 ponto por nível (skillPoints em systems/skills.js).
   atk/def/hp/sp somam ao status (skillStat em core/state.js); fx é um efeito que o código procura com hasSkill(fx):
   furia (Fúria da mata: tempos certos seguidos enchem a fúria; sem ela não tem fúria), perfeito (golpe perfeito +50%),
   furia2 (fúria com 3 acertos), furia4 (quatro estocadas), bloqueio (bloqueio evita 2/3),
   mira (flecha +4 e esquiva da exploração em 1 s), bloqueio2 (bloqueio perfeito anula o golpe e dá um turno a mais),
   cura (especial Reza de cura), vento (especial Sopro de vento), cura2 (reza mais forte e que limpa veneno/queimadura), regen (+3 PV e +1 PE por turno).
   Degraus das regiões: dupla, investida, luar, flecha2, laco, aliado, estrelas = especiais com skill em SPECIALS;
   furia_guarda (errar o tempo tira 1 da fúria), faro (luta começa atento e o bicho nunca começa), revide (bloqueio perfeito
   devolve metade do dano evitado), fiel (o aliado fica 3 turnos), jaci (levanta uma vez por luta com 30% da vida).
   O Pajé da aldeia faz o Rhanon esquecer tudo e devolve os pontos (SKILL_RESET). */
const SKILL_TREES = [
  {id: "guerreiro", n: "Guerreiro", d: "Lança e fúria", color: "#e2363d", nodes: [
    {id: "g1", n: "Braço forte", d: "ATQ +2.", cost: 1, atk: 2},
    {id: "g2", n: "Fúria da mata", d: "Quatro tempos certos seguidos (golpe perfeito ou bloqueio) enchem a fúria: a lança vira três estocadas de uma vez. Acertar a fraqueza de um bicho também conta.", cost: 2, fx: "furia"},
    {id: "g3", n: "Braço de ferro", d: "ATQ +3.", cost: 2, atk: 3},
    {id: "g4", n: "Sangue quente", d: "A fúria enche com 3 acertos no tempo certo (antes 4).", cost: 3, fx: "furia2"},
    {id: "g5", n: "Fúria da onça", d: "A fúria dá quatro estocadas em vez de três.", cost: 4, fx: "furia4"},
    {id: "g6", n: "Lança de mandacaru", d: "ATQ +4 e o golpe perfeito tira +50% de dano (antes +30%).", cost: 3, atk: 4, fx: "perfeito"},
    {id: "g7", n: "Estocada dupla", d: "Libera o especial Estocada dupla: duas estocadas seguidas, cada uma com o seu tempo certo (as duas contam para a fúria). 8 PE.", cost: 4, fx: "dupla"},
    {id: "g8", n: "Fúria guardada", d: "Errar o tempo certo tira só 1 ponto da fúria, em vez de zerar.", cost: 7, fx: "furia_guarda"},
    {id: "g9", n: "Investida do lobo-guará", d: "Libera o especial Investida: dano 1,6×. Se o chefe estiver juntando forças, dano dobrado e o golpe forte dele se desfaz. 10 PE.", cost: 7, fx: "investida"},
    {id: "g10", n: "Lança de luar", d: "Libera o especial Lança de luar: uma estocada que fica mais forte a cada chefe que o Rhanon já acalmou. 14 PE.", cost: 10, fx: "luar"}
  ]},
  {id: "cacador", n: "Rastreador", d: "Defesa e reflexo", color: "#3f9a5c", nodes: [
    {id: "c1", n: "Couro grosso", d: "DEF +2.", cost: 1, def: 2},
    {id: "c2", n: "Bloqueio firme", d: "Bloqueio no tempo certo evita 2/3 do dano (antes metade).", cost: 2, fx: "bloqueio"},
    {id: "c3", n: "Casca dura", d: "DEF +3.", cost: 2, def: 3},
    {id: "c4", n: "Olho de gavião", d: "Flechas +4 de dano. Na exploração, a esquiva recarrega em 1 segundo.", cost: 3, fx: "mira"},
    {id: "c5", n: "Contra-ataque perfeito", d: "Bloqueio no tempo certo anula todo o dano e o Rhanon age duas vezes no turno seguinte.", cost: 4, fx: "bloqueio2"},
    {id: "c6", n: "Gibão de couro", d: "DEF +4.", cost: 3, def: 4},
    {id: "c7", n: "Flecha dupla", d: "Libera o especial Flecha dupla: duas flechas, cada uma com 40% de chance de crítico. 8 PE. Precisa de arco.", cost: 4, fx: "flecha2"},
    {id: "c8", n: "Laço de cipó", d: "Libera o especial Laço de cipó: pouco dano, mas o bicho perde a próxima vez (chefe: metade das vezes). 10 PE.", cost: 7, fx: "laco"},
    {id: "c9", n: "Faro do mateiro", d: "Toda luta começa com o próximo golpe crítico, e o bicho nunca pega o Rhanon de surpresa.", cost: 7, fx: "faro"},
    {id: "c10", n: "Revide", d: "Bloqueio no tempo certo devolve ao bicho metade do dano evitado.", cost: 10, fx: "revide"}
  ]},
  {id: "paje", n: "Pajé", d: "Vida e cura", color: "#7a4ac8", nodes: [
    {id: "p1", n: "Fôlego", d: "PV +12.", cost: 1, hp: 12},
    {id: "p2", n: "Reza de cura", d: "Libera o especial Reza de cura: 6 PE para recuperar 30% da vida.", cost: 2, fx: "cura"},
    {id: "p3", n: "Espírito da mata", d: "PE +8 e libera o especial Sopro de vento.", cost: 2, sp: 8, fx: "vento"},
    {id: "p4", n: "Reza forte", d: "A Reza de cura recupera 45% da vida e tira veneno, queimadura e sangramento.", cost: 3, fx: "cura2"},
    {id: "p5", n: "Proteção dos encantados", d: "No fim de cada turno da luta, recupera 3 PV e 1 PE.", cost: 4, fx: "regen"},
    {id: "p6", n: "Chamado do aliado", d: "Libera o especial Chamado do aliado: um chefe que o Pytuna segurou e o Rhanon acalmou vem na luz de Jaci e dá o golpe dele. Uma vez por luta. 12 PE.", cost: 4, fx: "aliado"},
    {id: "p7", n: "Bênção de Guaraci", d: "PV +20 e PE +10.", cost: 3, hp: 20, sp: 10},
    {id: "p8", n: "Aliado fiel", d: "O aliado chamado fica mais 3 turnos e ataca no fim de cada um.", cost: 7, fx: "fiel"},
    {id: "p9", n: "Brilho das estrelas", d: "Libera o especial Brilho das estrelas: os 2 próximos golpes do bicho batem pela metade. 10 PE.", cost: 7, fx: "estrelas"},
    {id: "p10", n: "Luz de Jaci", d: "Uma vez por luta, se o Rhanon cair, levanta com 30% da vida.", cost: 10, fx: "jaci"}
  ]}
];
const SKILL_RESET = lv => 30 + lv * 5;   // preço para esquecer as habilidades no Pajé
/* forma da teia, igual nos três caminhos: lugar = [anel, desvio em graus dentro do setor do caminho]; liga = fios entre
   lugares (1 → 2 e 3; 2 → 4 → 5; 3 → 6; 2 + 6 → 7; 5 → 8; 7 + 6 → 9; 8 + 9 → 10); lugares = qual degrau fica em cada um;
   pontes = fios na borda entre caminhos vizinhos (dá para atravessar). Degrau novo: um lugar novo aqui e o custo do anel. */
const SKILL_WEB = {
  forma: {1: [1, 0], 2: [2, -24], 3: [2, 24], 4: [3, -38], 5: [4, -40], 6: [3, 38], 7: [4, 0], 8: [5, -34], 9: [5, 34], 10: [6, 0]},
  liga: [[1, 2], [1, 3], [2, 4], [4, 5], [3, 6], [2, 7], [6, 7], [5, 8], [7, 9], [6, 9], [8, 10], [9, 10]],
  setor: {guerreiro: -90, cacador: 30, paje: 150},
  lugares: {
    guerreiro: {1: "g1", 2: "g2", 3: "g3", 4: "g4", 5: "g5", 6: "g6", 7: "g7", 8: "g8", 9: "g9", 10: "g10"},
    cacador: {1: "c1", 2: "c2", 3: "c3", 4: "c4", 5: "c5", 6: "c6", 7: "c7", 8: "c8", 9: "c9", 10: "c10"},
    paje: {1: "p1", 2: "p2", 3: "p3", 4: "p4", 5: "p5", 6: "p7", 7: "p6", 8: "p9", 9: "p8", 10: "p10"}
  },
  pontes: [["g9", "c8"], ["c9", "p9"], ["p8", "g8"]]
};

/* Chamado do aliado (degrau p6): só os chefes que o Pytuna segurou (pytunaBosses, o último chefe de dia de cada cidade),
   já acalmados. O espírito dele surge ao lado do Rhanon na luz de Jaci (allySpirit em systems/combat.js) e dá o golpe:
   pow = multiplicador do dano (base do especial de elemento), elem = elemento do golpe (fraqueza conta), fx = efeito
   (allyHit em combat.js). Chefe final novo: uma linha aqui (sem linha, ele não aparece na lista). */
const ALLY_MOVES = {
  bufalo_touro:     {n: "Investida do búfalo", d: "Golpe forte de água.", pow: 1.6, elem: "agua", fx: "padrao"},
  jacare_canal:     {n: "Rolo da morte", d: "Agarra e gira: dano e o bicho sangra por 2 turnos.", pow: 1.1, elem: "agua", fx: "rolo"},
  sucuarana:        {n: "Salto da duna", d: "Cai do alto e joga areia: o próximo golpe do bicho erra metade das vezes.", pow: 1.1, elem: "vento", fx: "areia"},
  zabele_rei:       {n: "Canto do zabelê", d: "Dano leve e devolve 40% do PE do Rhanon.", pow: .6, elem: "vento", fx: "canto"},
  carranca:         {n: "Careta que espanta", d: "Onda d'água; com medo, o bicho bate 35% mais fraco por 2 turnos.", pow: 1, elem: "agua", fx: "careta"},
  tubarao_rei:      {n: "Frenesi do recife", d: "Três mordidas rápidas seguidas.", pow: .6, elem: "agua", fx: "frenesi"},
  guara_rei:        {n: "Uivo do cerrado", d: "Dano médio e enche a fúria do Rhanon (sem a Fúria da mata, o próximo golpe sai certeiro).", pow: 1, elem: "fogo", fx: "uivo"},
  preguica_gigante: {n: "Abraço do tempo", d: "Dano alto e o bicho perde a próxima vez (chefe: metade das vezes).", pow: 1.5, elem: "planta", fx: "abraco"},
  tamandua_rei:     {n: "Rabo-bandeira", d: "Pouco dano, mas os 2 próximos golpes do bicho batem pela metade.", pow: .5, elem: "planta", fx: "bandeira"},
  muriqui_rei:      {n: "Bando dourado", d: "Dano leve e cura 30% da vida do Rhanon.", pow: .7, elem: "planta", fx: "bando"},
  mula_madrinha:    {n: "Estouro da tropa", d: "O cincerro toca e a tropa de luar passa: o maior dano de todos.", pow: 2.2, elem: "raio", fx: "tropa"},
  quati_rei:        {n: "Bando do Corcovado", d: "Três unhadas rápidas do bando de quatis.", pow: .7, elem: "planta", fx: "frenesi"},
  capivara_rainha:  {n: "Calma da capivara", d: "Pouco dano, mas os 2 próximos golpes do bicho batem pela metade.", pow: .6, elem: "agua", fx: "bandeira"}
};
