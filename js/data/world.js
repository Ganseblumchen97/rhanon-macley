/* Locais do mapa grande (Pará ou Brasil), sublocais de Ananindeua, loja e equipamentos. */
const REQ = {lv: 4, money: 150};   // para Curitiba aparecer e a passagem
const CURITIBA_OPEN = false;       // false = Curitiba fica escondida (foco em Ananindeua por enquanto)
/* Mapa grande: "para" (por enquanto: Ananindeua aberta e Belém, a capital, em breve) ou "brasil" (Ananindeua e Curitiba).
   Cada mapa tem o contorno (land), um rio opcional, a trilha tracejada (route) e onde fica cada local de LOC. */
const MAP_REGION = "para";
const MAP_REGIONS = {
  para: {n: "Pará", aria: "Mapa estilizado do Pará, com Ananindeua e Belém",
    land: ["M63 224 L97 167 L154 110 L211 91 L241 103 L306 179 L333 224 L382 259 L431 255 L458 236 L485 209 L530 221 L549 232 L530 285 L500 323 L466 384 L454 437 L428 490 L393 559 L287 544 L173 540 L127 502 L82 464 L127 357 L150 285 L97 262Z",
      "M367 213 L401 194 L439 202 L447 221 L424 243 L386 247Z"],   // continente e a ilha de Marajó (a partir de longitude/latitude)
    river: "M63 281 C130 286 190 282 230 276 S310 240 338 222",   // rio Amazonas
    route: ["ananindeua", "belem"], pos: {ananindeua: [480, 262], belem: [452, 240, -16]}},
  brasil: {n: "Brasil", aria: "Mapa do Brasil em silhueta, com rota entre Ananindeua e Curitiba",
    land: ["M205 106 L262 101 320 128 350 175 382 190 405 196 440 228 444 268 427 302 416 322 394 387 374 421 361 442 343 479 326 527 294 538 263 507 267 465 246 433 226 401 204 370 165 359 110 349 99 311 126 286 109 254 147 213 162 180 172 139Z"],
    route: ["ananindeua", "curitiba"], pos: {ananindeua: [322, 168], curitiba: [315, 478]}}
};
const LOC = {
  ananindeua: {n: "Ananindeua (PA)", s: "Ananindeua", x: 322, y: 168, txt: "Sua aldeia. A mata ao redor está cheia de perigo, e cada pele rende uns trocados."},
  belem: {n: "Belém (PA)", s: "Belém", soon: true, txt: "A capital do Pará, do outro lado da baía. É de lá que saem os aviões para o resto do Brasil."},
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
