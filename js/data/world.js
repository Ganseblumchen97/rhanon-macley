/* Locais do mapa do Brasil, sublocais de Ananindeua, loja e equipamentos. */
const REQ = {lv: 4, money: 150};   // para Curitiba aparecer e a passagem
const CURITIBA_OPEN = false;       // false = Curitiba fica escondida (foco em Ananindeua por enquanto)
const LOC = {
  ananindeua: {n: "Ananindeua (PA)", s: "Ananindeua", x: 322, y: 168, txt: "Sua aldeia. A mata ao redor está cheia de perigo, e cada pele rende uns trocados."},
  curitiba: {n: "Curitiba (PR)", s: "Curitiba", x: 315, y: 478, txt: "Cidade grande, frio e oportunidades na programação. Conquiste a primeira vaga, complete missões de trabalho e tente uma empresa melhor."}
};
const SUB = {
  aldeia:  {n: "Aldeia", x: 120, y: 170, txt: "Sua casa. Fogueira para descansar, tenda para dormir e gente conhecida por perto."},
  feira:   {n: "Feira", x: 205, y: 225, txt: "Barracas de mandioca, peixe assado, açaí e maniçoba. Aqui você vende suas peles e compra comida."},
  mata:    {n: "Mata", x: 95, y: 80, txt: "Trilhas conhecidas. Bichos pequenos e médios, bons para começar."},
  rio:     {n: "Beira do rio", x: 305, y: 135, txt: "Água, lama e dentes. Cuidado com o que se mexe na margem."},
  fechada: {n: "Mata fechada", x: 215, y: 50, txt: "Folhas altas, pouca luz e predadores de verdade."}
};
const EDGES = [["aldeia","mata"],["mata","fechada"],["aldeia","feira"],["feira","rio"],["fechada","rio"]];
const NEED = {fechada: "mata", rio: "fechada"}, NEXT_Z = {mata: "fechada", fechada: "rio"};
/* Itens da bolsa (vendidos na barraca de comida; usados na batalha em "Itens" ou no inventário).
   Para criar um item novo, acrescente uma linha: hp/sp = quanto recupera. */
const ITEMS = {
  mandioca: {n: "Mandioca", price: 10, hp: 15, sp: 0},
  peixe:    {n: "Peixe assado", price: 18, hp: 20, sp: 0},
  acai:     {n: "Açaí", price: 15, hp: 0, sp: 10},
  manicoba: {n: "Maniçoba", price: 45, hp: 30, sp: 15}
};
const itemEffect = it => [it.hp && `+${it.hp} PV`, it.sp && `+${it.sp} PE`].filter(Boolean).join(" e ");
/* Equipamentos: para criar um item novo, basta acrescentar uma linha em legs, torso ou weapon. */
const EQUIP = {
  legs:   {tanga: {n: "Tanga", def: 0, lv: 1, price: 0}, short: {n: "Short", def: 2, lv: 3, price: 60, color: "#3b6ea5", shade: "#27496e"}},
  torso:  {regata: {n: "Regata", def: 2, lv: 5, price: 90, color: "#e9e2cf", shade: "#c9bfa4"}},
  weapon: {lanca: {n: "Lança", atk: 0, lv: 1, price: 0}},
  // arma de longe (X na exploração); sem ela, o Rhanon só ataca de perto com a lança
  ranged: {arco: {n: "Arco e flecha", atk: 0, lv: 3, price: 120}}
};
