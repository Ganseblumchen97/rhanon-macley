/* Comandos de batalha e nomes padrão dos golpes dos bichos. */
const CMDS = [
  {id:"atacar",   n:"Lança",    d:"Avança e golpeia com a lança. Rápido: 6 a 10 de dano."},
  {id:"especial", n:"Especial", d:"Ataques especiais que gastam PE: jogar a lança, tocha e flecha."},
  {id:"observar", n:"Observar", d:"Revela o próximo golpe do animal e deixa seu próximo ataque crítico."},
  {id:"defender", n:"Defender", d:"Reduz o dano do próximo golpe e recupera 3 PE."},
  {id:"item",     n:"Itens",    d:"Abre a bolsa: mandioca, peixe, açaí, maniçoba... Usar um item gasta o turno."},
  {id:"fugir",    n:"Fugir",    d:"Chance maior se o animal estiver ferido ou observado."}
];
// aba "Especial" (cada um é um ramo de act() em systems/combat.js)
// price/lv = vendido pelo artesão da feira (fica em G.owned); sem price = Rhanon já sabe desde o começo
const SPECIALS = [
  {id:"arremesso", n:"Jogar a lança", cost:3, d:"Arremessa a lança com força: 10 a 15 de dano, mas 20% de chance de errar. 3 PE."},
  {id:"tocha",  n:"Tocha",  cost:6, price:80, lv:2, d:"Assopra a tocha e lança uma onda de fogo. Demora mais, 14 a 18 de dano, 6 PE. Se o animal fraquejar, você ganha “Mais uma!”."},
  {id:"flecha", n:"Flecha", cost:3, d:"Puxa o arco com calma e mira: 40% de chance de crítico (dano dobrado). 3 PE. Precisa de arco."}
];
const MOVES = {arranhao:"Arranhão", bote:"Bote", rugido:"Rugido"};
