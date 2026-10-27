/* Falas do Pajé, que narra a história anos depois, na fogueira, para as crianças da aldeia (ver HISTORIA.md).
   Cada fala é um texto; {r: "..."} é o Rhanon corrigindo o avô (ele erra de vez em quando, de propósito).
   NARRA: aberturas (prologo = jogo novo, belem = primeira vez na capital). NARRA_BOSS: na primeira vez que cada chefe
   é acalmado. NARRA_HINT: dicas quando o jogador perde duas lutas seguidas (pajeHint em ui/narration.js escolhe). */
const NARRA = {
  prologo: [
    "Senta aqui perto do fogo, curumim. Essa história eu vi acontecer. Uma parte com os olhos, outra com o fumo.",
    "Foi no tempo em que Jaci, a lua, começou a apagar. Uma fumaça cinza subia de longe e deixava os bichos bravos.",
    "O Rhanon era um menino da nossa aldeia. Lança na mão e a cabeça cheia de computador. Sonhava com Curitiba, imagina.",
    "Naquela manhã ele acordou do lado dessa mesma fogueira. E foi aí que tudo começou."
  ],
  belem: [
    "Belém! O menino nunca tinha visto tanta gente junta. Nem tanto urubu.",
    "Na capital a fumaça era outra: saía de carro, de fábrica, de gente apressada. E as visagens de lá ficaram confusas também.",
    {r: "Vô, tu nunca foi em Belém."},
    "Fui em sonho, que é mais barato que ônibus. Agora deixa eu contar."
  ]
};
const NARRA_BOSS = {
  queixada_chefe: ["O primeiro chefe foi o queixada mais velho do bando. Quando a fumaça saiu dele, espirrou três vezes e voltou pro mato com os filhotes."],
  onca_rei: ["A Onça-Rei! Até eu tremi quando ele me contou. Era uma onça do tamanho de uma anta.", {r: "Do tamanho de uma capivara, vô."}, "Uma capivara bem grande, então."],
  cobra_grande: ["A Cobra-Grande dormia no fundo do rio fazia cem anos. Acordou de mau humor por causa da fumaça. Quem não acordaria?"],
  pirarucu: ["O Pirarucu respira fora d'água, sabia? Depois que voltou a si, subiu pra respirar e ficou um tempão olhando o menino, agradecido."],
  caranguejo_rei: ["No manguezal ele enfrentou um jacaré do tamanho de uma canoa.", {r: "Era um caranguejo, vô."}, "Um caranguejo do tamanho de uma canoa! Foi o que eu disse."],
  gaviao_real: ["O Gavião-real viu o menino lá do alto e desceu pra brigar. Depois que acalmou, ficou rodando em cima dele a tarde inteira, de guarda."],
  bufalo_touro: ["O Búfalo-touro da várzea era teimoso que só. A fumaça saiu pelo nariz dele, feito chaleira."],
  iguana_rei: ["A Iguana-rei tomava sol na praça desde antes da igreja. Acalmada, voltou pro banco dela como se nada fosse."],
  ratao: ["O Ratão do galpão era do tamanho de um cachorro. Acalmado, mostrou pro Rhanon onde os outros ratos escondiam as coisas roubadas."],
  jacare_canal: ["O Jacaré do canal era o mais velho de Belém. Disse que a fumaça vinha lá do Sul, onde a mata de pinheiro acaba. Jacaré fala, sim. Pra quem sabe ouvir."],
  chupacabra: ["O Chupa-cabra era só um bicho com fome e medo. A fumaça faz isso: transforma medo em raiva."],
  mula: ["A Mula sem cabeça soltava fogo pelo pescoço. Acalmada, apagou a chama e foi dormir. Mula também cansa."],
  boitata: ["O Boitatá é guardião da mata contra o fogo. Ver ele bravo foi o sinal de que a fumaça era coisa séria."],
  boto_encantado: ["O Boto encantado tirou o chapéu e agradeceu. Depois tentou levar tua tia pra dançar, mas essa é outra história."],
  matinta: ["A Matinta Perera pediu fumo, como sempre. O menino deu um pouco do meu. Nunca mais vi aquele fumo."],
  curupira: ["O Curupira fez o menino andar em círculo a noite toda com aquelas pegadas viradas. No fim, riu e chamou ele de amigo."],
  mapinguari: ["O Mapinguari fedia mais que a fumaça, mas tinha bom coração. E um olho só, que chorou quando ele voltou a si."],
  mulher_branco: ["A Mulher de Branco andava pelas ruas de pedra procurando alguém. Acalmada, disse que procurava a lua."],
  cobra_norato: ["A Cobra Norato é encantado bom, gente. A fumaça tinha prendido ele na forma de cobra. Foi ele quem disse que a fumaça vinha de longe, lá do Sul."],
  visagem_mare: ["A Visagem da maré molhou o menino da cabeça aos pés. Depois pediu desculpa. Visagem educada é raro."]
};
const NARRA_HINT = {
  pontos: "Foi aí que ele lembrou: tinha aprendido coisa nova e nem tinha usado. Aperta H, curumim.",
  arco: "O menino apanhou até lembrar que o armeiro da feira fazia arco. De longe, bicho bravo não morde.",
  talisma: "Eu tinha luar de chefe guardado pra fazer talismã pra ele. Mas o teimoso não vinha falar comigo.",
  nivel: "Às vezes ele voltava pras trilhas de antes, pra ficar mais forte. Não tem vergonha nisso.",
  tempo: "Ele aprendeu a apertar Z na hora certa: golpe perfeito e bloqueio. Quem acerta o tempo acalma até onça."
};
