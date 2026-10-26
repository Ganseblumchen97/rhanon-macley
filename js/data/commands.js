/* Comandos de batalha e nomes padrão dos golpes dos bichos. */
const CMDS = [
  {id:"atacar",   n:"Lança",    d:"Corre e estoca com a lança. 6 a 10 de dano."},
  {id:"especial", n:"Especial", d:"Golpes que gastam PE: jogar a lança, tocha e flecha."},
  {id:"observar", n:"Observar", d:"Mostra o próximo golpe do bicho e deixa seu próximo ataque crítico."},
  {id:"defender", n:"Defender", d:"Leva menos dano no próximo golpe e recupera 3 PE."},
  {id:"item",     n:"Itens",    d:"Abre a bolsa. Usar um item gasta o turno."},
  {id:"fugir",    n:"Fugir",    d:"Mais fácil se o bicho estiver ferido ou observado."}
];
// aba "Especial" (cada um é um ramo de act() em systems/combat.js)
// price/lv = vendido pelo artesão da feira (fica em G.owned); sem price = Rhanon já sabe desde o começo
const SPECIALS = [
  {id:"arremesso", n:"Jogar a lança", cost:3, d:"Joga a lança com força: 10 a 15 de dano, mas erra 20% das vezes. 3 PE."},
  {id:"tocha",  n:"Tocha",  cost:6, price:80, lv:2, d:"Uma onda de fogo, mais lenta: 14 a 18 de dano. Se o bicho fraquejar, ganha “Mais uma!”. 6 PE."},
  {id:"flecha", n:"Flecha", cost:3, d:"Mira com calma: 40% de chance de crítico (dano dobrado). 3 PE. Precisa de arco."},
  {id:"cura", n:"Reza de cura", cost:6, skill:"cura", d:"O Rhanon reza para a mata e recupera 30% da vida (com Reza forte, 45% e tira veneno e queimadura). 6 PE."}
];
const MOVES = {arranhao:"Arranhão", bote:"Bote", rugido:"Rugido"};
