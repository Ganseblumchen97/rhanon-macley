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
  saoluis: [
    "E foi de avião! O menino que nunca tinha saído do Pará, lá em cima das nuvens, agarrado na poltrona.",
    "São Luís é uma ilha. A maré sobe e desce tanto que o mar parece respirar. E em toda esquina tem boi: bumba-meu-boi, com matraca e pandeirão.",
    {r: "Vô, o senhor também foi de sonho até lá?"},
    "Fui, e nem enjoei. O Nordeste tem outros encantados, curumim. A fumaça chegou lá também. Agora deixa eu contar."
  ],
  belem: [
    "Belém! O menino nunca tinha visto tanta gente junta. Nem tanto urubu.",
    "Na capital a fumaça era outra: saía de carro, de fábrica, de gente apressada. E as visagens de lá ficaram confusas também.",
    {r: "Vô, tu nunca foi em Belém."},
    "Fui em sonho, que é mais barato que ônibus. Agora deixa eu contar."
  ]
};
const NARRA_BOSS = {
  mero: ["O Mero é o avô dos peixes do mangue, curumim. Tão velho que já viu a ilha nascer. Bravo assim, só de fumaça.", {r: "Ele me olhou com cara de quem pedia desculpa, vô."}, "Pedia mesmo. Bicho velho tem educação."],
  serpente: ["Dizem que a Serpente dorme debaixo de São Luís, e no dia em que morder o rabo a ilha afunda.", "A fumaça fez ela se mexer no sono. O menino acalmou a bicha, e a ilha ficou no lugar.", {r: "Vô, ela ficou me encarando um tempão depois."}, "Encantado não esquece quem ajudou."],
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
/* Pytuna, a Noite sem Lua (a fumaça que apaga Jaci): {p: "..."} é a fala dele, com o retrato de fumaça e olhos vermelhos.
   NARRA_PYT: noite = primeira noite na exploração; os outros, depois do chefe com esse id (último de dia de cada cidade).
   norte = fim do capítulo, quando os 20 chefes do Norte estão acalmados (Jaci inteira de novo). */
const NARRA_PYT = {
  noite: [
    "Foi na primeira noite que ele viu. A fumaça desceu do céu, devagar, e ficou olhando pra ele.",
    {p: "Então tu é o curumim da lança de pedra da lua... Some daqui. A noite é minha."},
    {r: "Quem é tu?"},
    {p: "Pytuna. A noite sem lua. Quando Jaci apagar de vez, ninguém vai ver o que eu levo da mata."},
    "E sumiu no escuro, deixando um cheiro de mato queimado."
  ],
  bufalo_touro: [
    "Quando o último bicho de Ananindeua voltou a si, a fumaça apareceu de novo. Mais fina. Mais brava.",
    {p: "Tu acalma um, acalma dez... A fumaça não acaba, curumim. Ela vem de toda parte."},
    {r: "Então eu vou atrás de onde ela vem."},
    {p: "Vem. Te espero na cidade grande."}
  ],
  jacare_canal: [
    "Em Belém ela já não falava tão alto. Jaci estava voltando, e a fumaça sabia.",
    {p: "A capital também não te segurou... Tá bom. Lá pro Sul, onde a mata de pinheiro acaba, eu sou maior que tu."},
    "E o vento levou ela pro Sul. Foi a última vez que o Norte viu Pytuna."
  ],
  norte: [
    "E foi assim que o Norte voltou a ver Jaci inteira, curumim. Olha lá em cima.",
    "Mas a fumaça não acabou. Foi embora pro Sul, devagarinho, como quem não quer nada.",
    {r: "Então é pra lá que eu vou, vô."},
    "O resto dessa história fica pra outra noite. Agora dorme."
  ]
};
const NARRA_HINT = {
  pontos: "Foi aí que ele lembrou: tinha aprendido coisa nova e nem tinha usado. Aperta H, curumim.",
  arco: "O menino apanhou até lembrar que o armeiro da feira fazia arco. De longe, bicho bravo não morde.",
  talisma: "Eu tinha luar de chefe guardado pra fazer talismã pra ele. Mas o teimoso não vinha falar comigo.",
  nivel: "Às vezes ele voltava pras trilhas de antes, pra ficar mais forte. Não tem vergonha nisso.",
  tempo: "Ele aprendeu a apertar Z na hora certa: golpe perfeito e bloqueio. Quem acerta o tempo acalma até onça.",
  fogo: "O bicho daquela trilha tinha medo de fogo. E o menino lá, sem tocha. O artesão da feira vendia uma.",
  agua: "Bicho de fogo e bicho de sol não aguentam água. Foi o artesão da feira que fez uma cuia pra ele.",
  vento: "Tinha bicho ali que não aguentava vento. Eu ensinei o sopro pra ele, depois que ele aprendeu o Espírito da mata.",
  planta: "Bicho que voa se enrosca no cipó. O artesão da feira trançava um chicote, e o menino lá, batendo de lança em morcego.",
  raio: "Bicho de água não gosta de raio. O artesão da feira fazia um com faísca de poraquê, e o menino nem sabia."
};
