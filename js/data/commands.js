/* Comandos de batalha e nomes padrão dos golpes dos bichos. */
const CMDS = [
  {id:"atacar",   n:"Lançar",   d:"Arremessa a lança. 6 a 10 de dano."},
  {id:"especial", n:"Especial", d:"Ataques especiais que gastam PE: tocha e flecha."},
  {id:"observar", n:"Observar", d:"Revela o próximo golpe do animal e deixa seu próximo ataque crítico."},
  {id:"defender", n:"Defender", d:"Reduz o dano do próximo golpe e recupera 3 PE."},
  {id:"item",     n:"Itens",    d:"Abre a bolsa: mandioca, peixe, açaí, maniçoba... Usar um item gasta o turno."},
  {id:"fugir",    n:"Fugir",    d:"Chance maior se o animal estiver ferido ou observado."}
];
// aba "Especial" (cada um é um ramo de act() em systems/combat.js)
const SPECIALS = [
  {id:"tocha",  n:"Tocha",  cost:6, d:"Fogo! Custa 6 PE. Se o animal fraquejar, você ganha “Mais uma!”."},
  {id:"flecha", n:"Flecha", cost:3, d:"Tiro com o arco: 40% de chance de crítico (dano dobrado). Custa 3 PE. Precisa de arco."}
];
const MOVES = {arranhao:"Arranhão", bote:"Bote", rugido:"Rugido"};
