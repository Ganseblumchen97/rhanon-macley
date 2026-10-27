/* Árvores de habilidade: três caminhos com cinco degraus cada, aprendidos em ordem (cada degrau pede o anterior).
   O Rhanon ganha 1 ponto por nível (skillPoints em systems/skills.js); os dois últimos degraus custam 2.
   atk/def/hp/sp somam ao status (skillStat em core/state.js); fx é um efeito que o código procura com hasSkill(fx):
   perfeito (golpe perfeito +50%), furia2 (fúria com 2 acertos), furia4 (quatro estocadas), bloqueio (bloqueio evita 2/3),
   mira (flecha +4 e esquiva da exploração em 1 s), bloqueio2 (bloqueio perfeito anula o golpe e dá um turno a mais),
   cura (especial Reza de cura), cura2 (reza mais forte e que limpa veneno/queimadura), regen (+3 PV e +1 PE por turno).
   O Pajé da aldeia faz o Rhanon esquecer tudo e devolve os pontos (SKILL_RESET). */
const SKILL_TREES = [
  {id: "guerreiro", n: "Guerreiro", d: "Lança e fúria", color: "#e2363d", nodes: [
    {id: "g1", n: "Braço forte", d: "ATQ +2.", cost: 1, atk: 2},
    {id: "g2", n: "Ponta afiada", d: "Golpe perfeito tira +50% de dano (antes +30%).", cost: 1, fx: "perfeito"},
    {id: "g3", n: "Braço de ferro", d: "ATQ +3.", cost: 1, atk: 3},
    {id: "g4", n: "Sangue quente", d: "A fúria enche com 2 acertos no tempo certo (antes 3).", cost: 2, fx: "furia2"},
    {id: "g5", n: "Fúria da onça", d: "A fúria dá quatro estocadas em vez de três.", cost: 2, fx: "furia4"}
  ]},
  {id: "cacador", n: "Rastreador", d: "Defesa e reflexo", color: "#3f9a5c", nodes: [
    {id: "c1", n: "Couro grosso", d: "DEF +2.", cost: 1, def: 2},
    {id: "c2", n: "Bloqueio firme", d: "Bloqueio no tempo certo evita 2/3 do dano (antes metade).", cost: 1, fx: "bloqueio"},
    {id: "c3", n: "Casca dura", d: "DEF +3.", cost: 1, def: 3},
    {id: "c4", n: "Olho de gavião", d: "Flechas +4 de dano. Na exploração, a esquiva recarrega em 1 segundo.", cost: 2, fx: "mira"},
    {id: "c5", n: "Contra-ataque perfeito", d: "Bloqueio no tempo certo anula todo o dano e o Rhanon age duas vezes no turno seguinte.", cost: 2, fx: "bloqueio2"}
  ]},
  {id: "paje", n: "Pajé", d: "Vida e cura", color: "#7a4ac8", nodes: [
    {id: "p1", n: "Fôlego", d: "PV +12.", cost: 1, hp: 12},
    {id: "p2", n: "Reza de cura", d: "Libera o especial Reza de cura: 6 PE para recuperar 30% da vida.", cost: 1, fx: "cura"},
    {id: "p3", n: "Espírito da mata", d: "PE +8.", cost: 1, sp: 8},
    {id: "p4", n: "Reza forte", d: "A Reza de cura recupera 45% da vida e tira veneno, queimadura e sangramento.", cost: 2, fx: "cura2"},
    {id: "p5", n: "Proteção dos encantados", d: "No fim de cada turno da luta, recupera 3 PV e 1 PE.", cost: 2, fx: "regen"}
  ]}
];
const SKILL_RESET = lv => 30 + lv * 5;   // preço para esquecer as habilidades no Pajé
