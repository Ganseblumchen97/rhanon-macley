/* Comandos de batalha e nomes padrão dos golpes dos bichos. */
const CMDS = [
  {id:"atacar",   n:"Lançar",   d:"Arremessa a lança. 6 a 10 de dano."},
  {id:"tocha",    n:"Tocha",    d:"Fogo! Custa 6 PE. Se o animal fraquejar, você ganha “Mais uma!”."},
  {id:"observar", n:"Observar", d:"Revela o próximo golpe do animal e deixa seu próximo ataque crítico."},
  {id:"defender", n:"Defender", d:"Reduz o dano do próximo golpe e recupera 3 PE."},
  {id:"mandioca", n:"Mandioca", d:"Come para curar 15 de vida."},
  {id:"fugir",    n:"Fugir",    d:"Chance maior se o animal estiver ferido ou observado."}
];
const MOVES = {arranhao:"Arranhão", bote:"Bote", rugido:"Rugido"};
