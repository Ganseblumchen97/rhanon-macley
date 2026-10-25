/* Pixel art em texto: paletas, linhas de sprite (entrevistador/trabalho, chama), glifos e o visual dos aldeões.
   Os bichos são desenhados em gfx/beasts.js. */
const PAL_H = {k:"#1a0f0a", s:"#c98a56", d:"#9c6339", r:"#d62828", t:"#e8c36a", g:"#3f9a5c", w:"#7a4a1e", m:"#cfd8dc"};
const PAL_BUS = {k:"#1a0f0a",s:"#c98a56",d:"#9c6339",j:"#26364a",c:"#f4ecd8",q:"#d62828",b:"#294f86",g:"#3f9a5c"};
const INTERVIEWER = ["....kkkkkk....","...kkkkkkkk...","...kssssssk...","...ksskkssk...","...kssssssk...","....ssssss....","...jjjjjjjj...","..jjccqqccjj..","..jjccqqccjj..","..jjccqqccjj..","...jjjjjjjj...","....jjjjjj....","....bbbbbb....","....bb..bb....","....bb..bb....","....kk..kk...."];
const WORKER = [
"....kkkkkk....","...kkkkkkkk...","...kssssssk...","...kskssksk...","...kssssssk...","....ssssss....",
"....jjjjjj....","...jjccccjj...","..jjjjjjjjjj..","..jjjjjjjjjj..","...jjjjjjjj...","....jj..jj....",
"...bb....bb...","..bbb....bbb..",".bbbb....bbbb.",".kkk......kkk."
];
// chefes que usam o desenho de outro bicho (com a cor trocada por "tint" em ANIMALS)
const ART = {queixada_chefe: "queixada", cobra_grande: "sucuri", onca_rei: "onca", morcego_vampiro: "morcego", morcego_pescador: "morcego"};
const FLAME = ["...r....","..rr.r..","..rrrr..",".rroorr.",".rooyor.","rooyyyor","rooyyyor",".rooyor.","..rooor."], PAL_F = {r:"#d62828", o:"#f2740c", y:"#ffd23a"};
const GL = {"0":"111101101101111","1":"010110010010111","2":"111001111100111","3":"111001111001111","4":"101101111001001","5":"111100111001111","6":"111100111101111","7":"111001001010010","8":"111101111101111","9":"111101111001111","+":"000010111010000","-":"000000111000000"};

const GLYPH = {
  z: ["1111", "0010", "0100", "1111"], star: ["010", "111", "010"], note: ["0110", "0101", "0100", "1100"],
  ring: ["010", "101", "010"], dot: ["1"], bang: ["1", "1", "1", "0", "1"], heart: ["01010", "11111", "11111", "01110", "00100"],
  drop: ["010", "111", "111"], leaf: ["01", "11", "10"], puff: ["11", "11"], q: ["0110", "1001", "0010", "0100", "0000", "0100"],
  wave: ["0110", "1001"], spark: ["101", "010", "101"]
};
/* Gente da aldeia e da feira: mesmo esqueleto do Rhanon (gfx/rig.js), com outras cores e enfeites.
   pal troca cores de RIG_PAL (s/S pele, h cabelo, H brilho do cabelo, g/G cocar, r pintura, t/T tanga);
   feather = pena no cocar; longHair = cabelo até os ombros; top = faixa de tecido no peito;
   prop = o que leva na mão ("pelt" pele, "basket" cesto, "bow" arco). */
const VILLAGER_LOOK = {
  aldeao1: {pal: {g: "#d62828", G: "#8f1a1a", r: "#f2a20c", t: "#9c6339", T: "#6d4329"}, feather: "#ffd23a"},
  aldeao2: {pal: {h: "#bdb6ac", H: "#f4ecd8", s: "#a86f40", S: "#7d4f2c", g: "#7a2a8a", G: "#4e1a5a"}},
  aldeao3: {pal: {g: "#19a8d8", G: "#0f6f91", r: "#e5001c", s: "#b47a48", S: "#8a5a32"}, longHair: true, top: "#e5741c"},
  peles:   {pal: {g: "#6d4329", G: "#46291a", r: "#ffffff", s: "#a86f40", S: "#7d4f2c"}, feather: "#e5001c", prop: "pelt"},
  comida:  {pal: {g: "#3f9a5c", G: "#25663a", r: "#ffd23a"}, longHair: true, top: "#ffd23a", prop: "basket"},
  artesao: {pal: {g: "#2a2230", G: "#17121c", r: "#19a8d8", t: "#26364a", T: "#18222f"}, feather: "#19a8d8", prop: "bow"}
};