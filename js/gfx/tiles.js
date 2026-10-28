/* Desenho das fases de exploração: terreno em quadrados de 16x16 (pintado uma vez num canvas grande)
   e o Rhanon visto de cima, de frente, de costas e de lado. */
const TILE = 16;
const TILE_PAL = {
  mata:    {g1: "#5fa84c", g2: "#4f9441", tall: "#3f7f36", tallHi: "#78c45a", path: "#c9a46a", path2: "#b08a55", leaf: "#2f7a3f", leaf2: "#24633a", leafHi: "#4f9a4c", trunk: "#6d4329", rock: "#9a978a", rock2: "#6a675e", water: "#2f7fb8", water2: "#5ab3e3", wood: "#9c6339", wood2: "#6d4329"},
  fechada: {g1: "#3f7a3c", g2: "#336a33", tall: "#2a5a2e", tallHi: "#559048", path: "#a8875a", path2: "#8a6d45", leaf: "#1f5a32", leaf2: "#163f24", leafHi: "#2f7040", trunk: "#5a3a1c", rock: "#7f7c72", rock2: "#55524a", water: "#245f8a", water2: "#4a92c0", wood: "#8a5a32", wood2: "#5a3a1c"},
  rio:     {g1: "#6ab04f", g2: "#58a045", tall: "#46893a", tallHi: "#86d064", path: "#d4b27a", path2: "#bb9763", leaf: "#3a8a45", leaf2: "#2b6a37", leafHi: "#5aaa55", trunk: "#6d4329", rock: "#a09d90", rock2: "#706d64", water: "#2a86c4", water2: "#6cc4f0", wood: "#a8703f", wood2: "#6d4329"},
  encontro: {g1: "#9ab84f", g2: "#88a845", tall: "#46893a", tallHi: "#86d064", path: "#e8d29a", path2: "#bb9763", leaf: "#3a8a45", leaf2: "#2b6a37", leafHi: "#5aaa55", trunk: "#6d4329", rock: "#a09d90", rock2: "#706d64", water: "#2a86c4", water2: "#6cc4f0", wood: "#a8703f", wood2: "#6d4329"},   // Teresina: o rio do sertão, capim mais seco e praia de areia clara
  // igarapé: água escura cor de chá (folhas na água), mata úmida e passarelas de tábua clara
  igarape: {g1: "#4f9a52", g2: "#438a48", tall: "#357a3e", tallHi: "#6ab85e", path: "#b89a66", path2: "#9a7e50", leaf: "#2a7a48", leaf2: "#1d5a36", leafHi: "#46a05a", trunk: "#5a3a22", rock: "#8a8a7e", rock2: "#5e5e54", water: "#4a5a2a", water2: "#8a9a4a", wood: "#c8a070", wood2: "#7a5a36"},
  // igapó (id manguezal): chão de lama escura, mata de folha escura, água preta de mata alagada com reflexo âmbar
  manguezal: {g1: "#5a6a48", g2: "#4e5e3e", tall: "#3e5032", tallHi: "#6a8250", path: "#8a7a52", path2: "#6e5e3e", leaf: "#2f5a30", leaf2: "#21441f", leafHi: "#4a7a40", trunk: "#4a3a2a", rock: "#7a7468", rock2: "#5a5448", water: "#3a3222", water2: "#8a6a3a", wood: "#b08a5a", wood2: "#6a4e30"},
  mangueilha: {g1: "#7a7458", g2: "#6a6448", tall: "#5a5a3a", tallHi: "#8a8a5a", path: "#a08a62", path2: "#86704c", leaf: "#3a5a32", leaf2: "#2a4424", leafHi: "#5a7a44", trunk: "#5a4a3a", rock: "#8a8478", rock2: "#5e5a50", water: "#4a6a6a", water2: "#7a9a8a", wood: "#b08a5a", wood2: "#6a4e30"},   // São Luís: o mesmo mangue
  lencois: {g1: "#f0e6cc", g2: "#e6dabc", tall: "#9ab86a", tallHi: "#c8e08a", path: "#d8c8a0", path2: "#c4b28a", leaf: "#f8f2e2", leaf2: "#e0d2ae", leafHi: "#ffffff", trunk: "#d8c8a0", rock: "#e8dcc0", rock2: "#c8b890", water: "#2a9ad8", water2: "#7ad0f0", wood: "#b08a5a", wood2: "#6a4e30", dune: true},   // Lençóis: areia branca e lagoa azul
  // seringal: chão de folha seca, seringueiras de casca clara e copa verde-escura
  seringal: {g1: "#7a9a4a", g2: "#8a8a42", tall: "#5a7a32", tallHi: "#a8b85a", path: "#b8925a", path2: "#9a7844", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#c8b89a", rock: "#9a948a", rock2: "#6a645a", water: "#3a6a8a", water2: "#6a9ab8", wood: "#9c6339", wood2: "#6d4329"},
  // cidade: chão de pedra/calçada, rua de asfalto ou paralelepípedo, telhado de telha (porto: zinco); walls = cores das fachadas
  veropeso: {g1: "#b0a898", g2: "#9a9282", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7a7268", path2: "#5e574e", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#8a96a0", roof2: "#5e6a74", walls: ["#3a7ab8", "#5aa06a"]},
  cidadevelha: {g1: "#a8a090", g2: "#948c7c", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22"},
  // caatinga: chão de terra clara rachada, capim seco, mandacaru e árvore seca (cactus: o T vira um ou outro)
  caatinga: {g1: "#d8c08a", g2: "#c8ae78", tall: "#a89a5a", tallHi: "#d8c87a", path: "#b8865a", path2: "#9a6a42", leaf: "#4a8a5a", leaf2: "#2e6a3e", leafHi: "#7ab884", trunk: "#8a8478", rock: "#b0a090", rock2: "#7a6a58", water: "#4a8aa8", water2: "#8ac0d0", wood: "#9c6339", wood2: "#6d4329", cactus: true},
  // beira do Velho Chico: areia da margem, capim verde de beira de rio e a água verde do São Francisco
  beira: {g1: "#b8b07a", g2: "#a8a06a", tall: "#6a9a3a", tallHi: "#9ac85a", path: "#d8c08a", path2: "#b89a62", leaf: "#3a7a3a", leaf2: "#2a5a2a", leafHi: "#5a9a4a", trunk: "#6d4a2a", rock: "#a89a88", rock2: "#7a6a58", water: "#3a8a8a", water2: "#8acac0", wood: "#9c6339", wood2: "#6d4329"},
  // serra do Araripe: chão de terra vermelha, mato verde da encosta e muita pedra
  serra: {g1: "#a87a52", g2: "#986a46", tall: "#5a7a3a", tallHi: "#8aaa5a", path: "#c8986a", path2: "#a87a50", leaf: "#3a6a2e", leaf2: "#2a5222", leafHi: "#5a8a44", trunk: "#5a3a22", rock: "#b0786a", rock2: "#7a4a3a", water: "#4a8aa8", water2: "#8ac0d0", wood: "#9c6339", wood2: "#6d4329"},
  // Cuiabá: o Porto, chão de pedra quente, casario colonial baixo, ipê-amarelo florido (as árvores) e o rio Cuiabá barrento
  portocuiaba: {g1: "#c4a888", g2: "#b49878", tall: "#8a9a4a", tallHi: "#b8c86a", path: "#8a6e58", path2: "#6e5644", leaf: "#e8c020", leaf2: "#b88a10", leafHi: "#ffe878", trunk: "#5a3a22", rock: "#a89a88", rock2: "#7a6a58", water: "#5e6e52", water2: "#9aa87a", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22", walls: ["#f0e6d0", "#e8c860", "#5a8ac8", "#e89aaa", "#f0e6d0"]},
  // Brasília: o Plano Piloto, calçada de concreto claro, prédio branco de laje cinza e ipê-roxo florido nas quadras
  planopiloto: {g1: "#c8c8b8", g2: "#b8b8a8", tall: "#7a9a4a", tallHi: "#a8c86a", path: "#8a8a80", path2: "#6e6e66", leaf: "#b85ad8", leaf2: "#8a3aa8", leafHi: "#e09af0", trunk: "#5a3a2a", rock: "#a8a49a", rock2: "#7a766e", water: "#3a8ac8", water2: "#9ad0f0", wood: "#9c6339", wood2: "#6d4329", roof: "#a8a8a0", roof2: "#7a7a72", walls: ["#f0f0e8", "#e8e4d8", "#d8e8f0", "#f0e6c8", "#c8d8e8"]},
  // Bonito: o centro (calçada clara, casa baixa colorida) e o Rio da Prata (mata verde e água azul-turquesa transparente)
  centrobonito: {g1: "#c8bca0", g2: "#b8ac90", tall: "#6a9a4a", tallHi: "#9ac86a", path: "#8a7e6a", path2: "#6e6454", leaf: "#2f7a3a", leaf2: "#22602a", leafHi: "#4a9a4a", trunk: "#6d4329", rock: "#a89a88", rock2: "#7a6a58", water: "#3ab8c8", water2: "#a8f0f0", wood: "#9c6339", wood2: "#6d4329", roof: "#c06a3a", roof2: "#8a4422", walls: ["#f0e6d0", "#8ad0c8", "#f0c860", "#e89aaa", "#a8d888"]},
  rioprata: {g1: "#6aa84c", g2: "#5a9842", tall: "#4a8a38", tallHi: "#8ac860", path: "#d8c8a0", path2: "#bcaa84", leaf: "#2a7a3a", leaf2: "#1e5e2c", leafHi: "#4a9a48", trunk: "#5a3a22", rock: "#c8c4b8", rock2: "#9a968a", water: "#2aa8c0", water2: "#a8f4f4", wood: "#a8703f", wood2: "#6d4329"},
  // Gruta do Lago Azul: chão de pedra escura, musgo, estalagmite (gruta: true) e a água azul-forte do lago
  gruta: {g1: "#5a5660", g2: "#4e4a54", tall: "#3a6a4a", tallHi: "#5a9a6a", path: "#8a8070", path2: "#6e6658", leaf: "#3a5a4a", leaf2: "#2a4a3a", leafHi: "#5a7a6a", trunk: "#4a4038", rock: "#b8b0a0", rock2: "#7a7468", water: "#1a5ad8", water2: "#6ab4ff", wood: "#9c6339", wood2: "#6d4329", gruta: true},
  // Chapada dos Guimarães: terra vermelha, capim dourado do cerrado, árvore torta (cerrado: true) e muita pedra arenito
  chapada: {g1: "#b88a52", g2: "#a87a46", tall: "#b8a04a", tallHi: "#e8d070", path: "#d8a070", path2: "#b8804e", leaf: "#5a8a3a", leaf2: "#3a6a2a", leafHi: "#8ab85a", trunk: "#4a3020", rock: "#c8704a", rock2: "#8a4a2e", water: "#3a8ab0", water2: "#9ad8e8", wood: "#9c6339", wood2: "#6d4329", cerrado: true},
  // Pantanal: capim verde-claro de campo alagado, cordilheira de mata baixa e água de baía escura e parada
  pantanal: {g1: "#8ab45a", g2: "#7aa44e", tall: "#5a8a3a", tallHi: "#a8d070", path: "#c8a870", path2: "#a88a54", leaf: "#3a7a3a", leaf2: "#2a5a2a", leafHi: "#5a9a4a", trunk: "#6d4a2a", rock: "#a89a88", rock2: "#7a6a58", water: "#3a7a7a", water2: "#7ab8b0", wood: "#9c6339", wood2: "#6d4329"},
  // Petrolina: a orla do São Francisco, calçada clara e casario baixo de cores quentes
  orla: {g1: "#c8b898", g2: "#b8a888", tall: "#8a9a4a", tallHi: "#b8c86a", path: "#8a7a68", path2: "#6e604e", leaf: "#3a7a3a", leaf2: "#2a5a2a", leafHi: "#5a9a4a", trunk: "#6d4329", rock: "#a89a88", rock2: "#7a6a58", water: "#3a7aa0", water2: "#7ab8d0", wood: "#9c6339", wood2: "#6d4329", roof: "#c06a3a", roof2: "#8a4422", walls: ["#e8d090", "#e89a5a", "#f0e6d0", "#d8705a", "#8ac0a0"]},
  olinda: {g1: "#a8a090", g2: "#948c7c", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22", walls: ["#e86a8a", "#f0c840", "#4aa8d8", "#8ad86a", "#f08a3a", "#e8e4d8"]},   // Olinda: o casario colonial colorido
  praiagrande: {g1: "#a8a090", g2: "#948c7c", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22", walls: ["#3a6ab8", "#e8e4d8", "#4a8ad8", "#f0d890", "#e8e4d8"]},   // casarões de azulejo (azul, branco e amarelo)
  recifeantigo: {g1: "#a8a090", g2: "#948c7c", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22", walls: ["#e86a8a", "#f0c840", "#4aa8d8", "#8ad86a", "#f08a3a", "#e8e4d8"]},   // Recife Antigo: casarões coloridos
  trocatroca: {g1: "#a8a090", g2: "#948c7c", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#b8583a", roof2: "#8a3a22", walls: ["#e8a040", "#d86a3a", "#f0d890", "#8ac0a0", "#e8e4d8"]},   // Teresina: casario de cores quentes
  porto: {g1: "#8e8e88", g2: "#7a7a74", tall: "#6a7a4a", tallHi: "#9aaa6a", path: "#55555a", path2: "#44444a", leaf: "#3a6a3a", leaf2: "#2a502a", leafHi: "#5a8a4a", trunk: "#5a4a3a", rock: "#8a8a8a", rock2: "#5a5a5a", water: "#3a6a7a", water2: "#7aa8b0", wood: "#8a6a4a", wood2: "#5a4430", roof: "#7a8a96", roof2: "#5a6670", walls: ["#8a8a8a", "#c8603a", "#3a7ab8", "#e8c040"]},
  baixadas: {g1: "#7a7a5a", g2: "#6a6a4a", tall: "#5a7a3a", tallHi: "#8aaa5a", path: "#9a7a52", path2: "#7a5e3a", leaf: "#3a6a32", leaf2: "#2a5024", leafHi: "#5a8a44", trunk: "#5a4030", rock: "#8a847a", rock2: "#5e5a50", water: "#4a6a5a", water2: "#7a9a8a", wood: "#b08a5a", wood2: "#6a4e30", roof: "#a85a3a", roof2: "#7a3e24", walls: ["#8a5a32", "#c8a070", "#3f9a5c", "#e89aaa"]},
  // várzea: capim claro, água de cheia azul-esverdeada e poucas árvores
  parada: {g1: "#8ab04a", g2: "#7aa040", tall: "#5e8a34", tallHi: "#c0dc70", path: "#c8aa6a", path2: "#ac8e54", leaf: "#3f7f36", leaf2: "#2e6428", leafHi: "#5aa04a", trunk: "#6d4329", rock: "#a09d90", rock2: "#706d64", water: "#3a8aa0", water2: "#7ac4d0", wood: "#a8703f", wood2: "#6d4329"},
  terminal: {g1: "#b4ac9c", g2: "#a09888", tall: "#6a8a4a", tallHi: "#9ac06a", path: "#7e786c", path2: "#625c52", leaf: "#2f6a2a", leaf2: "#22501e", leafHi: "#4a8a3a", trunk: "#6d4329", rock: "#9a948a", rock2: "#6a645a", water: "#4a7a8a", water2: "#8ab8c0", wood: "#9c6339", wood2: "#6d4329", roof: "#8a96a0", roof2: "#5e6a74", walls: ["#e8e2cf", "#3a7ab8", "#e8c040", "#c8603a"]},
  varzea: {g1: "#8ab04a", g2: "#7aa040", tall: "#5e8a34", tallHi: "#c0dc70", path: "#c8aa6a", path2: "#ac8e54", leaf: "#3f7f36", leaf2: "#2e6428", leafHi: "#5aa04a", trunk: "#6d4329", rock: "#a09d90", rock2: "#706d64", water: "#3a8aa0", water2: "#7ac4d0", wood: "#a8703f", wood2: "#6d4329"}
};
const OUTLINE = "#1a2418";
// tipo de terreno desenhado embaixo das letras especiais
const TILE_BASE = {S: "-", E: "-", G: "-", a: ".", B: ".", U: "~", Y: ".", J: "."};   // U: o barco de linha fica na água; Y e J: entrada e baú do segredo (systems/secrets.js)

function fillEllipse(x, cx, cy, rx, ry, col) {
  x.fillStyle = col;
  for (let py = Math.floor(cy - ry); py <= cy + ry; py++) for (let px = Math.floor(cx - rx); px <= cx + rx; px++)
    if (((px + .5 - cx) / rx) ** 2 + ((py + .5 - cy) / ry) ** 2 <= 1) x.fillRect(px, py, 1, 1);
}
// desenha um quadrado do terreno em (ox, oy); tx/ty variam os detalhes de forma fixa
function drawTile(x, ch, ox, oy, P, tx, ty) {
  const r = k => rand(tx * 73.1 + ty * 131.7 + k);
  const grass = () => {
    x.fillStyle = P.g1; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.g2; for (let k = 0; k < 5; k++) x.fillRect(ox + Math.floor(r(k) * 14), oy + Math.floor(r(k + 9) * 15), 2, 1);
  };
  if (ch === ".") grass();
  else if (ch === ",") {
    grass();
    for (const [bx, by] of [[1, 3], [9, 1], [5, 9], [12, 10]]) {
      x.fillStyle = P.tall; x.fillRect(ox + bx, oy + by + 2, 1, 4); x.fillRect(ox + bx + 2, oy + by + 1, 1, 5); x.fillRect(ox + bx + 4, oy + by + 2, 1, 4);
      x.fillStyle = P.tallHi; x.fillRect(ox + bx + 2, oy + by, 1, 2); x.fillRect(ox + bx + 1, oy + by + 1, 1, 1); x.fillRect(ox + bx + 3, oy + by + 1, 1, 1);
    }
  } else if (ch === "f") {
    grass();
    for (let k = 0; k < 3; k++) {
      const fx = ox + 2 + Math.floor(r(k + 20) * 11), fy = oy + 2 + Math.floor(r(k + 30) * 11);
      x.fillStyle = ["#ffd23a", "#ffffff", "#ff6b8a"][k]; x.fillRect(fx - 1, fy, 3, 1); x.fillRect(fx, fy - 1, 1, 3);
      x.fillStyle = "#e5741c"; x.fillRect(fx, fy, 1, 1);
    }
  } else if (ch === "-") {
    x.fillStyle = P.path; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.path2; for (let k = 0; k < 6; k++) x.fillRect(ox + Math.floor(r(k + 40) * 15), oy + Math.floor(r(k + 50) * 15), 1 + (k % 2), 1);
  } else if (ch === "~") {
    x.fillStyle = P.water; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.water2; for (let k = 0; k < 2; k++) { const wx = ox + Math.floor(r(k + 60) * 10), wy = oy + 3 + k * 7; x.fillRect(wx, wy, 4, 1); x.fillRect(wx + 4, wy - 1, 2, 1); }
  } else if (ch === "=") {
    x.fillStyle = P.water; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = P.wood; x.fillRect(ox, oy + 2, TILE, 12);
    x.fillStyle = P.wood2; for (let k = 0; k < TILE; k += 4) x.fillRect(ox + k, oy + 2, 1, 12);
    x.fillRect(ox, oy + 2, TILE, 1); x.fillRect(ox, oy + 13, TILE, 1);
  } else if (ch === "r") {   // asfalto da BR-316: faixa branca nas beiradas e tracejado amarelo no meio (at = vizinho)
    const road = c => c === "r" || c === "U", at = P.at || (() => "r");
    x.fillStyle = "#4a4a50"; x.fillRect(ox, oy, TILE, TILE);
    x.fillStyle = "#56565c"; for (let k = 0; k < 4; k++) x.fillRect(ox + Math.floor(r(k + 70) * 15), oy + Math.floor(r(k + 80) * 15), 1, 1);
    const up = road(at(tx, ty - 1)), down = road(at(tx, ty + 1));
    x.fillStyle = "#e8e2cf"; if (!up) x.fillRect(ox, oy + 1, TILE, 1); if (!down) x.fillRect(ox, oy + 14, TILE, 1);
    if (up && down && tx % 2 === 0) { x.fillStyle = "#f2c230"; x.fillRect(ox + 3, oy + 7, 10, 2); }
  } else if (ch === "o") {
    grass();
    fillEllipse(x, ox + 8, oy + 9, 7, 6, OUTLINE); fillEllipse(x, ox + 8, oy + 9, 6, 5, P.rock2); fillEllipse(x, ox + 7, oy + 8, 5, 4, P.rock);
    x.fillStyle = "#ffffff40"; x.fillRect(ox + 5, oy + 6, 3, 1);
  } else if (ch === "T" && P.cactus) {   // caatinga: mandacaru (cacto de braços) ou árvore seca de galho cinza, sorteado pelo lugar
    grass();
    if (r(90) < .5) {
      x.fillStyle = OUTLINE; x.fillRect(ox + 6, oy + 1, 5, 15); x.fillRect(ox + 1, oy + 4, 4, 8); x.fillRect(ox + 12, oy + 3, 4, 7); x.fillRect(ox + 2, oy + 9, 6, 4); x.fillRect(ox + 9, oy + 7, 6, 4);
      x.fillStyle = P.leaf; x.fillRect(ox + 7, oy + 2, 3, 13); x.fillRect(ox + 2, oy + 5, 2, 6); x.fillRect(ox + 13, oy + 4, 2, 5); x.fillRect(ox + 3, oy + 10, 4, 2); x.fillRect(ox + 10, oy + 8, 4, 2);
      x.fillStyle = P.leafHi; x.fillRect(ox + 7, oy + 3, 1, 10); x.fillRect(ox + 2, oy + 6, 1, 3);
    } else {
      x.fillStyle = OUTLINE; x.fillRect(ox + 6, oy + 8, 4, 8);
      x.fillStyle = P.trunk; x.fillRect(ox + 7, oy + 8, 2, 7);
      for (const [a, b, c, d] of [[7, 9, 2, 3], [8, 9, 13, 2], [7, 7, 4, 1], [8, 6, 11, 0], [8, 10, 14, 7], [7, 10, 1, 7]]) {   // galhos secos
        const n = Math.max(Math.abs(c - a), Math.abs(d - b));
        for (let k = 0; k <= n; k++) x.fillRect(ox + Math.round(a + (c - a) * k / n), oy + Math.round(b + (d - b) * k / n), 1, 1);
      }
    }
  } else if (ch === "T" && P.gruta) {   // gruta: estalagmite (cone de pedra subindo do chão), uma ou duas, com a ponta clara
    grass();
    const two = r(92) < .45;
    for (const [cx, h, w] of two ? [[5, 11, 3], [11, 8, 2]] : [[8, 14, 4]]) {
      for (let k = 0; k < h; k++) {
        const hw = Math.max(1, Math.round(w * (k + 1) / h));
        x.fillStyle = OUTLINE; x.fillRect(ox + cx - hw - 1, oy + 16 - h + k, hw * 2 + 2, 1);
        x.fillStyle = k < 2 ? P.rock : P.rock2; x.fillRect(ox + cx - hw, oy + 16 - h + k, hw * 2, 1);
        x.fillStyle = P.rock; x.fillRect(ox + cx - hw, oy + 16 - h + k, 1, 1);
      }
    }
  } else if (ch === "T" && P.cerrado) {   // cerrado: árvore baixa de tronco torto e casca grossa, copa achatada e torta
    grass();
    const s = r(91) < .5 ? 1 : -1, cx = 8 + s;
    x.fillStyle = OUTLINE; x.fillRect(ox + 6, oy + 9, 5, 7); x.fillRect(ox + 7 + s * 2, oy + 6, 4, 5);
    x.fillStyle = P.trunk; x.fillRect(ox + 7, oy + 10, 3, 5); x.fillRect(ox + 8 + s * 2, oy + 7, 2, 4);
    x.fillStyle = P.rock2; x.fillRect(ox + 7, oy + 12, 1, 1); x.fillRect(ox + 9, oy + 10, 1, 1);   // casca rachada
    fillEllipse(x, ox + cx, oy + 5, 8, 4.5, OUTLINE); fillEllipse(x, ox + cx, oy + 5, 7, 3.5, P.leaf2); fillEllipse(x, ox + cx - s, oy + 4, 5, 2.5, P.leaf);
    fillEllipse(x, ox + cx - s * 3, oy + 3, 2, 1, P.leafHi);
  } else if (ch === "T" && P.dune) {   // dunas dos Lençóis: montinho de areia branca com a crista clara, sem tronco
    grass();
    fillEllipse(x, ox + 8, oy + 10, 9, 6, P.leaf2); fillEllipse(x, ox + 7, oy + 9, 8, 5, P.leaf); fillEllipse(x, ox + 5, oy + 7, 4, 1.5, P.leafHi);
  } else if (ch === "T") {
    grass();
    x.fillStyle = OUTLINE; x.fillRect(ox + 5, oy + 11, 6, 5);
    x.fillStyle = P.trunk; x.fillRect(ox + 6, oy + 11, 4, 4);
    fillEllipse(x, ox + 8, oy + 7, 8, 7, OUTLINE); fillEllipse(x, ox + 8, oy + 7, 7, 6, P.leaf2); fillEllipse(x, ox + 8, oy + 6, 6, 5, P.leaf);
    fillEllipse(x, ox + 6, oy + 4, 3, 2, P.leafHi);
  }
}
// prédio/casarão de cidade ("#"): telhado de telha (ou zinco, no porto) por cima; na última fileira da quadra, a fachada
// colorida com janelas e às vezes uma porta, como os casarões de azulejo de Belém. at(tx, ty) = letra do vizinho
const WALLS = ["#3a7ab8", "#e8c040", "#e89aaa", "#5aa06a", "#e8e2cf", "#c8603a"];
function drawBuilding(x, ox, oy, P, tx, ty, at) {
  const r = k => rand(tx * 37.3 + ty * 91.1 + k), front = at(tx, ty + 1) !== "#", wall = P.walls ? P.walls[Math.floor(rand(tx * 7.7) * P.walls.length)] : WALLS[Math.floor(rand(tx * 7.7) * WALLS.length)];
  x.fillStyle = P.roof; x.fillRect(ox, oy, TILE, TILE);
  x.fillStyle = P.roof2; for (let k = 2; k < TILE; k += 4) x.fillRect(ox, oy + k, TILE, 1);   // fileiras de telha
  if (r(1) < .08) { x.fillStyle = OUTLINE; x.fillRect(ox + 5, oy + 3, 5, 6); x.fillStyle = P.roof2; x.fillRect(ox + 6, oy + 4, 3, 4); }   // caixa d'água/chaminé
  if (front) {
    x.fillStyle = P.roof2; x.fillRect(ox, oy + 3, TILE, 2);   // beiral
    x.fillStyle = wall; x.fillRect(ox, oy + 5, TILE, 11);
    x.fillStyle = "#00000022"; x.fillRect(ox, oy + 14, TILE, 2);
    const door = r(2) < .3;
    x.fillStyle = OUTLINE;
    if (door) { x.fillRect(ox + 5, oy + 8, 6, 8); x.fillStyle = "#6d4329"; x.fillRect(ox + 6, oy + 9, 4, 7); }
    else for (const wx of [2, 9]) { x.fillRect(ox + wx, oy + 7, 5, 6); x.fillStyle = r(wx) < .5 ? "#bfe8ff" : "#2a3a4a"; x.fillRect(ox + wx + 1, oy + 8, 3, 4); x.fillStyle = OUTLINE; }
  }
  x.fillStyle = OUTLINE;   // contorno onde a quadra acaba
  if (at(tx - 1, ty) !== "#") x.fillRect(ox, oy, 1, TILE);
  if (at(tx + 1, ty) !== "#") x.fillRect(ox + TILE - 1, oy, 1, TILE);
  if (at(tx, ty - 1) !== "#") x.fillRect(ox, oy, TILE, 1);
  if (front) x.fillRect(ox, oy + TILE - 1, TILE, 1);
}
// oca de 2x2 quadrados: telhado de palha arredondado, parede de barro e porta escura
// oca de 3x2 quadrados (48x32): a porta fica no meio do quadrado central, onde a trilha chega
function hutCanvas() {
  const c = document.createElement("canvas"); c.width = 48; c.height = 32; const x = c.getContext("2d");
  x.fillStyle = OUTLINE; x.fillRect(7, 17, 34, 14);
  x.fillStyle = "#9c6339"; x.fillRect(8, 18, 32, 12);
  x.fillStyle = "#7a4a2e"; x.fillRect(8, 27, 32, 3);
  x.fillStyle = OUTLINE; x.fillRect(20, 20, 8, 11); x.fillStyle = "#2a1a10"; x.fillRect(21, 21, 6, 10);
  fillEllipse(x, 24, 13, 23, 11, OUTLINE); fillEllipse(x, 24, 13, 22, 10, "#b08a3a"); fillEllipse(x, 24, 12, 21, 9, "#d9b25a");
  x.fillStyle = "#b08a3a"; for (let k = 0; k < 10; k++) x.fillRect(5 + k * 4, 8 + (k % 2) * 3, 1, 9 - (k % 2) * 3);
  x.fillStyle = "#f0d68a"; x.fillRect(13, 6, 8, 1); x.fillRect(11, 7, 4, 1);
  return c;
}
// barraca da feira: toldo listrado em cima, balcão com mercadoria embaixo (left/right = pontas)
function drawStall(x, ox, oy, tx, left, right) {
  const cols = ["#e5001c", "#f4ecd8"];
  for (let k = 0; k < TILE; k += 4) { x.fillStyle = cols[((tx * 4 + k) / 4) % 2]; x.fillRect(ox + k, oy + 1, 4, 6); }
  x.fillStyle = OUTLINE; x.fillRect(ox, oy, TILE, 1); x.fillRect(ox, oy + 7, TILE, 1);
  for (let k = 0; k < TILE; k += 4) { x.fillStyle = cols[((tx * 4 + k) / 4) % 2]; x.fillRect(ox + k, oy + 8, 4, 1); x.fillRect(ox + k + 1, oy + 9, 2, 1); }
  x.fillStyle = "#9c6339"; x.fillRect(ox, oy + 10, TILE, 6); x.fillStyle = "#6d4329"; x.fillRect(ox, oy + 14, TILE, 2);
  x.fillStyle = OUTLINE; x.fillRect(ox, oy + 15, TILE, 1);
  [["#ffd23a", 2], ["#7a2a8a", 7], ["#3f9a5c", 11]].forEach(([col, gx]) => { x.fillStyle = col; x.fillRect(ox + gx, oy + 11, 3, 2); });
  x.fillStyle = OUTLINE;
  if (left) x.fillRect(ox, oy, 1, TILE);
  if (right) x.fillRect(ox + TILE - 1, oy, 1, TILE);
}
// pinta a fase inteira num canvas (o desenho não muda; passagem, fogo e água brilhando são desenhados por cima)
function drawStageMap(rows, zone) {
  const P = TILE_PAL[zone] || TILE_PAL.mata, H = rows.length, W = rows[0].length;
  const c = document.createElement("canvas"); c.width = W * TILE; c.height = H * TILE;
  const x = c.getContext("2d"), hut = hutCanvas(), at = (tx, ty) => (rows[ty] || "")[tx];
  P.at = at;   // o asfalto olha os vizinhos para pintar as faixas
  rows.forEach((row, ty) => [...row].forEach((ch, tx) => {
    const ox = tx * TILE, oy = ty * TILE;
    if ("HKFNVPCRMXLWQO".includes(ch)) {
      drawTile(x, "KVCRM".includes(ch) ? "-" : ".", ox, oy, P, tx, ty);
      if (ch === "H") x.drawImage(hut, (at(tx - 1, ty) === "H" ? (at(tx - 2, ty) === "H" ? 2 : 1) : 0) * 16, at(tx, ty - 1) === "H" ? 16 : 0, 16, 16, ox, oy, 16, 16);
      else if (ch === "K") drawStall(x, ox, oy, tx, at(tx - 1, ty) !== "K", at(tx + 1, ty) !== "K");
      else if (ch === "F") {   // pedras em volta e lenha (as chamas são animadas por cima)
        fillEllipse(x, ox + 8, oy + 10, 7, 4, "#6a675e"); fillEllipse(x, ox + 8, oy + 10, 5, 2.5, "#2a1a10");
        x.fillStyle = "#6d4329"; x.fillRect(ox + 4, oy + 9, 8, 2); x.fillStyle = "#9c6339"; x.fillRect(ox + 5, oy + 11, 7, 1);
      } else if (ch === "N") {   // tenda triangular de couro
        x.fillStyle = OUTLINE; for (let k = 0; k < 13; k++) x.fillRect(ox + 8 - Math.ceil(k * .6) - 1, oy + 2 + k, Math.ceil(k * 1.2) + 3, 1);
        for (let k = 0; k < 12; k++) { x.fillStyle = "#e9e2cf"; x.fillRect(ox + 8 - Math.ceil(k * .6), oy + 3 + k, Math.ceil(k * .6), 1); x.fillStyle = "#c9bfa4"; x.fillRect(ox + 8, oy + 3 + k, Math.ceil(k * .6), 1); }
        x.fillStyle = "#3a2a1a"; for (let k = 0; k < 6; k++) x.fillRect(ox + 8 - Math.ceil(k / 2), oy + 9 + k, Math.ceil(k / 2) * 2 + 1, 1);
        x.fillStyle = "#7a4a1e"; x.fillRect(ox + 7, oy, 2, 3);
      }
      return;
    }
    if (ch === "#") return drawBuilding(x, ox, oy, P, tx, ty, at);
    // chefe de água (Pirarucu, Cobra-Grande...): fica numa poça em vez de na grama
    drawTile(x, ch === "B" && ZONES[zone] && WATER_BATTLE.has(ZONES[zone].boss) ? "~" : TILE_BASE[ch] || ch, ox, oy, P, tx, ty);
    if (ch === "E") {   // seta de saída apontando para a borda mais perto
      const sy = rows.findIndex(r => r.includes("S")), sx = rows[sy].indexOf("S");   // aponta do início (S) para a saída
      const left = tx < sx, down = ty > sy, ax = tx * TILE + 8, ay = ty * TILE + 8;
      if (down) {
        x.fillStyle = OUTLINE; x.fillRect(ax - 3, ay - 5, 7, 10);
        x.fillStyle = "#ffd23a"; x.fillRect(ax, ay - 4, 1, 5);
        for (let k = 0; k < 3; k++) x.fillRect(ax - k, ay + 3 - k, 2 * k + 1, 1);
      } else {
        x.fillStyle = OUTLINE; x.fillRect(ax - 5, ay - 2, 10, 5);
        x.fillStyle = "#ffd23a";
        for (let k = 0; k < 3; k++) x.fillRect(left ? ax - 4 + k : ax + 3 - k, ay - k + 1, 1, 2 * k + 1);
        x.fillRect(left ? ax - 1 : ax - 4, ay + 1, 5, 1);
      }
    }
  }));
  rows.forEach((row, ty) => [...row].forEach((ch, tx) => {   // blocos por cima dos quadrados deles: cabine e motel
    if ("QO".includes(ch) && at(tx - 1, ty) !== ch && at(tx, ty - 1) !== ch) (ch === "Q" ? drawCabin : drawMotel)(x, tx * TILE, ty * TILE);
  }));
  return c;
}
// cabine do cobrador (bloco 2x2 = 32x32): madeira, telhado de zinco, janela com o cobrador e a placa da passagem
function drawCabin(x, ox, oy) {
  x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(ox + 3, oy + 29, 27, 3);
  x.fillStyle = OUTLINE; x.fillRect(ox + 2, oy + 9, 28, 22);
  x.fillStyle = "#9c6339"; x.fillRect(ox + 3, oy + 10, 26, 20);
  x.fillStyle = "#7a4a2e"; for (let k = 5; k < 29; k += 5) x.fillRect(ox + k, oy + 10, 1, 20);   // tábuas
  x.fillStyle = OUTLINE; x.fillRect(ox, oy + 4, 32, 7); x.fillStyle = "#a8b0b8"; x.fillRect(ox + 1, oy + 5, 30, 5); x.fillStyle = "#7a828a"; for (let k = 2; k < 31; k += 3) x.fillRect(ox + k, oy + 5, 1, 5);   // zinco
  x.fillStyle = OUTLINE; x.fillRect(ox + 6, oy + 13, 20, 10); x.fillStyle = "#bfe8ff"; x.fillRect(ox + 7, oy + 14, 18, 8);
  const p = villagerSprite("aldeao2");   // o cobrador na janela (só a cabeça e os ombros)
  x.save(); x.beginPath(); x.rect(ox + 7, oy + 14, 18, 8); x.clip(); x.drawImage(p, ox + 16 - Math.round(p.width / 2), oy + 9); x.restore();
  x.fillStyle = "#6d4329"; x.fillRect(ox + 5, oy + 23, 22, 2);   // balcão
  x.fillStyle = OUTLINE; x.fillRect(ox + 9, oy, 14, 5); x.fillStyle = "#f2c230"; x.fillRect(ox + 10, oy + 1, 12, 3);   // placa
  x.fillStyle = OUTLINE; x.fillRect(ox + 12, oy + 2, 8, 1);
}
// motel do Ver-o-Peso (bloco 3x2 = 48x32): sobrado cor-de-rosa de azulejo, janelas, porta no meio e a placa vermelha
function drawMotel(x, ox, oy) {
  x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(ox + 2, oy + 30, 46, 3);
  x.fillStyle = OUTLINE; x.fillRect(ox, oy + 2, 48, 30);
  x.fillStyle = "#e89aaa"; x.fillRect(ox + 1, oy + 3, 46, 28);
  x.fillStyle = "#c87a8a"; for (let k = 1; k < 47; k += 4) x.fillRect(ox + k, oy + 16, 2, 1);   // faixa de azulejo
  x.fillStyle = "#8a3a4a"; x.fillRect(ox + 1, oy + 3, 46, 3);   // beiral
  for (const wx of [5, 20, 35]) { x.fillStyle = OUTLINE; x.fillRect(ox + wx, oy + 8, 8, 7); x.fillStyle = "#bfe8ff"; x.fillRect(ox + wx + 1, oy + 9, 6, 5); x.fillStyle = "#3a7ab8"; x.fillRect(ox + wx, oy + 8, 2, 7); x.fillRect(ox + wx + 6, oy + 8, 2, 7); }   // janelas com veneziana
  for (const wx of [5, 35]) { x.fillStyle = OUTLINE; x.fillRect(ox + wx, oy + 20, 8, 7); x.fillStyle = "#ffe98a"; x.fillRect(ox + wx + 1, oy + 21, 6, 5); }
  x.fillStyle = OUTLINE; x.fillRect(ox + 18, oy + 19, 12, 13); x.fillStyle = "#6d4329"; x.fillRect(ox + 19, oy + 20, 10, 12); x.fillStyle = "#ffd23a"; x.fillRect(ox + 27, oy + 26, 1, 1);   // porta
  x.fillStyle = "#9a948a"; x.fillRect(ox + 16, oy + 31, 16, 1);   // degrau
  x.fillStyle = OUTLINE; x.fillRect(ox + 13, oy - 3, 22, 9); x.fillStyle = "#e5001c"; x.fillRect(ox + 14, oy - 2, 20, 7);   // placa
  x.fillStyle = "#fff3c4"; for (let k = 0; k < 5; k++) x.fillRect(ox + 16 + k * 4, oy, 2, 3);   // letreiro
}
// troncos atravessados na passagem enquanto o chefe não cai
function drawGate(x, sx, sy, P) {
  for (const gy of [3, 9]) {
    x.fillStyle = OUTLINE; x.fillRect(sx - 1, sy + gy - 1, TILE + 2, 6);
    x.fillStyle = P.wood; x.fillRect(sx, sy + gy, TILE, 4);
    x.fillStyle = P.wood2; x.fillRect(sx, sy + gy + 3, TILE, 1); x.fillRect(sx + 4, sy + gy + 1, 1, 2); x.fillRect(sx + 11, sy + gy + 1, 1, 2);
  }
}

/* ---------- Rhanon visto de cima ---------- */
const OW_SCALE = .75;   // desenho do esqueleto (gfx/rig.js) em 24x33 na exploração
// dir: "down" (de frente) ou "up" (de costas); legs: chave de RIG_LEGS
// weapon: lança na diagonal com as duas mãos, ponta para o lado side (1 direita, -1 esquerda)
// bowBack = false enquanto o arco está na mão (atirando), para não aparecer dois arcos
// extra: {dy, face} para respirar e piscar parado
function heroOverworld(dir, legs, weapon, bowBack = true, side = 1, extra = {}) {
  const look = rhanonLook();
  if (!bowBack) look.bowBack = false;
  const walking = legs !== "stand";
  return rigCanvas(dir === "up" ? "back" : "front", {...RIG_LEGS[legs], dy: walking ? 1 : 0, weapon: weapon ? "diag" : null, side, ...extra}, look, OW_SCALE);
}
// número em pixels (glifos 3x5 de GL) para a etiqueta de nível dos bichos
function drawTinyNumber(x, str, px, py, col) {
  x.fillStyle = col;
  [...str].forEach((ch, i) => { const g = GL[ch]; if (g) for (let k = 0; k < 15; k++) if (g[k] === "1") x.fillRect(px + i * 4 + k % 3, py + (k / 3 | 0), 1, 1); });
}

// chamas da fogueira, animadas a cada quadro
function drawFire(x, sx, sy, t) {
  const f = Math.floor(t / 90) % 3, fl = [["#ffd23a", "#f2740c", "#d62828"], ["#fff3a0", "#ffd23a", "#f2740c"], ["#ffd23a", "#d62828", "#f2740c"]][f];
  x.fillStyle = fl[2]; x.fillRect(sx + 4, sy + 6, 8, 4);
  x.fillStyle = fl[1]; x.fillRect(sx + 5, sy + 3 + (f === 1 ? 0 : 1), 6, 5);
  x.fillStyle = fl[0]; x.fillRect(sx + 7 - (f % 2), sy + 1 + (f === 2 ? 1 : 0), 2, 5);
  x.fillStyle = "#fffbe0"; x.fillRect(sx + 7, sy + 6, 2, 2);
}
// pessoa da aldeia/feira: o mesmo esqueleto do Rhanon, de tanga, com as cores e enfeites de VILLAGER_LOOK[look]
function villagerSprite(look, pose = {}) {
  return rigCanvas("front", pose, VILLAGER_LOOK[look] || {}, OW_SCALE);
}
// passos da ginga (um por batida): pé que pisa para o lado, braços se alternando no alto
const GINGA = [{lf: [9, 40], rf: [19, 38], lh: [4, 23], rh: [24, 32]}, {lf: [13, 38], rf: [23, 40], lh: [8, 32], rh: [28, 23]}];