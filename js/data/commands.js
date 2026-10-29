/* Comandos de batalha e nomes padrão dos golpes dos bichos. */
const CMDS = [
  {id:"atacar",   n:"Lança",    d:"Corre e estoca com a lança. 6 a 10 de dano."},
  {id:"especial", n:"Especial", d:"Golpes que gastam PE: jogar a lança, flecha e os elementos (fogo, água, vento, raio e planta)."},
  {id:"observar", n:"Observar", d:"Mostra o próximo golpe do bicho e deixa seu próximo ataque crítico."},
  {id:"defender", n:"Defender", d:"Leva menos dano no próximo golpe e recupera 3 PE."},
  {id:"item",     n:"Itens",    d:"Abre a bolsa. Usar um item gasta o turno."},
  {id:"fugir",    n:"Fugir",    d:"Mais fácil se o bicho estiver ferido ou observado."}
];
// aba "Especial" (cada um é um ramo de act() em systems/combat.js)
// price/lv = vendido pelo artesão da feira (fica em G.owned); craft = lembranças que o artesão pede junto com o dinheiro;
// sem price = Rhanon já sabe desde o começo. elem = golpe de elemento (ELEMENTS): na fraqueza do bicho, 1,5× e "Mais uma!";
// na resistência, metade. A lança e a flecha nunca têm elemento.
const SPECIALS = [
  {id:"arremesso", n:"Jogar a lança", cost:3, d:"Joga a lança com força: 10 a 15 de dano, mas erra 20% das vezes. 3 PE."},
  {id:"tocha",  n:"Tocha",  cost:6, price:80, lv:2, elem:"fogo", d:"Fogo: 14 a 18 de dano. Na fraqueza do bicho, dano maior e “Mais uma!”. 6 PE."},
  {id:"cuia",   n:"Cuia d'água", cost:6, price:140, lv:6, elem:"agua", d:"Água: 14 a 18 de dano. Na fraqueza do bicho, dano maior e “Mais uma!”. 6 PE."},
  {id:"cipo",   n:"Chicote de cipó", cost:6, price:90, lv:3, elem:"planta", d:"Planta: chicote de cipó ou folhas que cortam, 14 a 18 de dano. Na fraqueza do bicho, dano maior e “Mais uma!”. 6 PE."},
  {id:"vento",  n:"Sopro de vento", cost:6, skill:"vento", elem:"vento", d:"Vento: 14 a 18 de dano. Na fraqueza do bicho, dano maior e “Mais uma!”. 6 PE."},
  {id:"raio",   n:"Raio do poraquê", cost:6, price:120, lv:9, craft:{poraque: 2}, elem:"raio", d:"Raio: 14 a 18 de dano. Na fraqueza do bicho, dano maior e “Mais uma!”. 6 PE."},
  {id:"flecha", n:"Flecha", cost:3, d:"Mira com calma: 40% de chance de crítico (dano dobrado). 3 PE. Precisa de arco."},
  {id:"dupla", n:"Estocada dupla", cost:8, skill:"dupla", d:"Duas estocadas seguidas, cada uma com o seu tempo certo. 8 PE."},
  {id:"flecha2", n:"Flecha dupla", cost:8, skill:"flecha2", bow:true, d:"Duas flechas, cada uma com 40% de chance de crítico. 8 PE. Precisa de arco."},
  {id:"investida", n:"Investida", cost:10, skill:"investida", d:"Dano 1,6×. Contra o golpe forte que o chefe está juntando, dano dobrado e o golpe se desfaz. 10 PE."},
  {id:"laco", n:"Laço de cipó", cost:10, skill:"laco", d:"Pouco dano, mas o bicho perde a próxima vez (chefe: metade das vezes). 10 PE."},
  {id:"estrelas", n:"Brilho das estrelas", cost:10, skill:"estrelas", d:"Os 2 próximos golpes do bicho batem pela metade. 10 PE."},
  {id:"aliado", n:"Chamado do aliado", cost:12, skill:"aliado", d:"Um chefe acalmado vem na luz de Jaci e dá o golpe dele. Uma vez por luta. 12 PE."},
  {id:"luar", n:"Lança de luar", cost:14, skill:"luar", d:"Uma estocada de luar que fica mais forte a cada chefe acalmado. 14 PE."},
  {id:"cura", n:"Reza de cura", cost:6, skill:"cura", d:"O Rhanon reza para a mata e recupera 30% da vida (com Reza forte, 45% e tira veneno e queimadura). 6 PE."}
];
// os cinco elementos dos especiais: nome e cor (etiqueta na placa da batalha e no caderno)
const ELEMENTS = {fogo: {n: "Fogo", c: "#e8521c"}, agua: {n: "Água", c: "#2a8ad8"}, vento: {n: "Vento", c: "#6aa8b8"}, raio: {n: "Raio", c: "#d8a80c"}, planta: {n: "Planta", c: "#3f9a3a"}};
const MOVES = {arranhao:"Arranhão", bote:"Bote", rugido:"Rugido"};
