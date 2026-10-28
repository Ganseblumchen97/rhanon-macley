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
  recife: [
    "Recife! Rio pra todo lado, ponte em cima de ponte. Chamam de Veneza brasileira, mas eu nunca fui em Veneza.",
    "Foi lá que o menino fez o segundo trabalho de programador: um aplicativo de cordel para um poeta da feira.",
    {r: "Vô, o Seu Dedé fez um cordel sobre mim depois."},
    "Fez mesmo? Então tu é famoso no Nordeste inteiro. Mas aqui na aldeia continua lavando a panela."
  ],
  petrolina: [
    "Petrolina, no sertão. Depois de tanto mar e tanto mangue, o menino desceu do ônibus e só viu poeira, sol e mandacaru.",
    "Mas lá passa o São Francisco, o Velho Chico. No meio da seca, um rio que nunca para. O povo de lá chama ele de pai.",
    {r: "E tinha bode pra todo lado, vô. Um deles comeu minha corda do arco."},
    "Bode come tudo, curumim. Até corda de arco. Agora deixa eu contar da caatinga."
  ],
  bonito: [
    "De Cuiabá o menino desceu de ônibus até Bonito, no Mato Grosso do Sul. E viu a água mais limpa da vida dele.",
    "Rio tão transparente que o peixe parecia voar, curumim. Dava pra ver a areia do fundo, a pedra, a sucuri dormindo.",
    {r: "Igual o Tapajós na seca, vô. Só que mais azul."},
    "Pois é. E a fumaça queria sujar justo essa água. Logo essa."
  ],
  cuiaba: [
    "De avião outra vez, agora pro meio do Brasil. Cuiabá, curumim: tão longe do mar que o mar nem sabe que ela existe.",
    "Lá o céu é enorme, sem morro e sem mata fechada pra esconder. Jaci devia brilhar mais. Foi ali que o menino viu quanto ela já tinha perdido.",
    {r: "E fazia quarenta graus, vô. A lança esquentava na mão."},
    "Esquentava mesmo. E o povo de lá ainda come peixe na brasa no meio do dia. Agora deixa eu contar do Pantanal."
  ],
  teresina: [
    "Teresina! A cidade mais quente do Brasil. O menino suava até a lança.",
    "Ela fica entre dois rios, o Parnaíba e o Poti. E no encontro deles mora uma assombração que os pescadores respeitam.",
    {r: "O Cabeça de Cuia, vô. Todo mundo no ônibus falava dele."},
    "Pois é. Vamos ver se tu acalma até ele."
  ],
  belem: [
    "Belém! O menino nunca tinha visto tanta gente junta. Nem tanto urubu.",
    "Na capital a fumaça era outra: saía de carro, de fábrica, de gente apressada. E as visagens de lá ficaram confusas também.",
    {r: "Vô, tu nunca foi em Belém."},
    "Fui em sonho, que é mais barato que ônibus. Agora deixa eu contar."
  ]
};
const NARRA_BOSS = {
  ariranha_mae: ["A Ariranha-mãe cuidava de todas as tocas do Rio da Prata, curumim. Bando de ariranha é família, e família defende os filhotes.", "A fumaça fez ela achar que o menino vinha pegar os pequenos.", {r: "Eu só queria atravessar o rio, vô. Ela gritou tão alto que meu ouvido zuniu o dia inteiro."}, "Grito de mãe é assim mesmo. O meu também era, e tu nunca reclamou."],
  mae_ouro: ["A Mãe-do-ouro é uma luz que guarda as riquezas da terra e do rio. Quem é ganancioso, ela faz se perder atrás do brilho.", "A fumaça confundiu ela: achou que o rio inteiro estava sendo roubado. E de certo jeito estava, curumim. Lama de garimpo, lixo, fumaça.", {r: "Ela me deu uma pepita, vô. Eu devolvi pro rio."}, "Por isso ela te deixou passar. Quem devolve, ela protege."],
  guara_rei: ["O Lobo-guará-rei andava pelo cerrado inteiro, curumim, de perna comprida pra ver por cima do capim. Plantava lobeira por onde passava.", "A queimada comeu o capim dele. Lobo sem capim fica no aberto, com medo, e medo vira raiva.", {r: "Ele não queria brigar, vô. Queria só voltar pra casa."}, "E tu mostrou o caminho. Por isso que o cerrado ainda tem lobo, menino."],
  pe_garrafa: ["O Pé-de-garrafa grita igual gente perdida no mato, curumim. Quem vai atrás do grito se perde também.", "Mas ele mesmo era o mais perdido. A fumaça apagou as estrelas que ele usava pra voltar pra toca.", {r: "Eu ensinei ele a achar o Cruzeiro do Sul, vô. Ele pulou de alegria. Num pé só."}, "Agora quem se perde na Chapada é ajudado por ele. Dizem que o grito virou assobio de quem mostra a trilha."],
  onca_dagua: ["A Onça-d'água era a dona do Pantanal, curumim. Atravessava corixo nadando e pegava jacaré dentro do rio.", "A fumaça das queimadas deixou ela sem lugar pra ficar. Bicho sem casa fica bravo, igual gente.", {r: "Ela me olhou um tempão antes de ir embora, vô. Parecia que tava agradecendo."}, "Tava mesmo. Onça não esquece quem ajudou. Nem quem atrapalhou."],
  minhocao: ["O Minhocão do Pantanal cava a margem por baixo e o barranco desaba. Os pescadores antigos tinham medo dele.", "Mas ele só cavava assim quando o rio estava doente. A fumaça entrou na água, e ele cavou até quase derrubar a cidade.", {r: "Ele era do tamanho de um barco, vô. Grosso igual tronco de piúva."}, "E tu acalmou ele com uma lança. Eu, se fosse tu, tinha corrido. Mas eu sou velho e sabido."],
  carranca: ["A carranca foi feita pra proteger os barqueiros do Velho Chico, curumim. Cara feia de madeira pra espantar o que mora no fundo do rio.", "A fumaça entrou na madeira, e a carranca esqueceu de quem cuidava. Soltou-se da proa e desceu o rio sozinha, brava com todo mundo.", {r: "Quando ela acalmou, vô, um barqueiro veio buscar ela de canoa. Disse que era da família dele fazia três gerações."}, "Carranca boa volta pra casa. Igual neto."],
  nego_dagua: ["O Nego d'água é o dono do fundo do São Francisco. Ri alto, vira canoa de quem pesca demais e espanta o peixe pra outro lado.", "Pescador sabido deixa um agrado na pedra da margem, e ele deixa a rede encher. A fumaça fez ele esquecer dos agrados.", {r: "Eu deixei um pedaço de rapadura pra ele, vô. Ele riu tanto que a água tremeu."}, "E a rapadura? Pois é. Pagou a passagem do teu barco de volta."],
  tapejara: ["O Tapejara voava por aquelas bandas no tempo dos dinossauros, curumim. Virou pedra, e a pedra guardou ele cem milhões de anos.", "A fumaça acordou o bicho no lugar errado, no tempo errado. O menino acalmou ele, e ele voltou a dormir no paredão.", {r: "Vô, ele piscou pra mim antes de virar pedra de novo."}, "Pedra que pisca. Só tu mesmo pra ver uma coisa dessas."],
  lobisomem: ["O Lobisomem é gente, curumim. Gente com uma sina pesada: toda sexta de lua cheia vira bicho e corre sete encruzilhadas.", "A fumaça fez a sina durar mais que a noite. O menino segurou o bicho até o galo cantar.", {r: "De manhã ele era só um vaqueiro cansado, vô. Me ofereceu café."}, "E tu tomou? Café de lobisomem... Tá explicado por que tu não dormia direito naquela época."],
  bode_rei: ["O Bode-rei era o pai de todo o rebanho solto da caatinga. Chifre torto, barba comprida e cabeça mais dura que pedra.", {r: "Ele me deu três cabeçadas, vô. Três!"}, "E tu deu quantas nele? Pois é. Bode não guarda rancor: depois foi comer uma palma ali do lado."],
  fulozinha: ["A Comadre Fulozinha é a dona da mata do sertão, curumim. Menina pequena, cabelo comprido até o pé, e um assobio que se ouve de longe.", "Ela protege os bichos de caçador. A fumaça fez ela achar que todo mundo era caçador, até o menino.", {r: "Eu deixei fumo e mingau pra ela, vô. Do jeito que o povo ensinou."}, "Fez certo. Ela agradeceu com uma trança no teu cabelo, lembra? Tu ficou dias sem conseguir desfazer."],
  teiu_rei: ["O Teiú-rei tomava sol no alto da Sé desde o tempo dos holandeses, diz o povo de Olinda.", "A fumaça não deixava ele dormir. O menino acalmou o bicho e ele voltou pra pedra quentinha."],
  meia_noite: ["O Homem da Meia-Noite é o boneco gigante mais antigo de Olinda. Sai no Carnaval e dança até o sol nascer.", "A fumaça fez ele dançar fora de hora, de cara fechada. O menino acalmou o boneco, e ele voltou a sorrir.", {r: "Ele me ensinou o passo do frevo, vô."}, "Tu? Dançando frevo? Isso eu queria ter visto."],
  surubim: ["O Surubim é o rei do fundo do Parnaíba, curumim. Pintado igual onça, com bigode de velho.", {r: "Ele fez cócegas com o bigode, vô."}, "Era agradecimento. Peixe não sabe abraçar."],
  cabeca_cuia: ["O Cabeça de Cuia foi gente: um pescador que maltratou a mãe e ficou com a cabeça pesada de remorso, assombrando o rio.", "A fumaça deixou ele mais bravo ainda. O menino acalmou o homem, e pela primeira vez em muito tempo ele chorou.", {r: "Ele disse que ia pedir perdão pra mãe dele, vô."}, "Então a maldição já tá ficando mais leve."],
  sucuarana: ["A suçuarana é prima da onça, curumim, só que da cor da areia. Nas dunas ninguém via ela chegar.", "O menino só viu porque ela fez sombra. E lá no Lençóis quase não tem sombra."],
  boi_bumba: ["O Boi Bumbá! No Maranhão o boi morre e ressuscita todo ano, na festa. Mas a fumaça deixou ele preso no meio do caminho.", {r: "Ele dançou comigo antes de ir embora, vô."}, "Dançou mesmo? Então tu acalmou direito. Boi que dança tá em paz."],
  mero: ["O Mero é o avô dos peixes do mangue, curumim. Tão velho que já viu a ilha nascer. Bravo assim, só de fumaça.", {r: "Ele me olhou com cara de quem pedia desculpa, vô."}, "Pedia mesmo. Bicho velho tem educação."],
  serpente: ["Dizem que a Serpente dorme debaixo de São Luís, e no dia em que morder o rabo a ilha afunda.", "A fumaça fez ela se mexer no sono. O menino acalmou a bicha, e a ilha ficou no lugar.", {r: "Vô, ela ficou me encarando um tempão depois."}, "Encantado não esquece quem ajudou."],
  queixada_chefe: ["O primeiro chefe foi o queixada mais velho do bando. Quando a fumaça saiu dele, espirrou três vezes e voltou pro mato com os filhotes."],
  onca_rei: ["A Onça-Rei! Até eu tremi quando ele me contou. Era uma onça do tamanho de uma anta.", {r: "Do tamanho de uma capivara, vô."}, "Uma capivara bem grande, então."],
  cobra_grande: ["A Cobra-Grande dormia no fundo do rio fazia cem anos. Acordou de mau humor por causa da fumaça. Quem não acordaria?"],
  pirarucu: ["O Pirarucu respira fora d'água, sabia? Depois que voltou a si, subiu pra respirar e ficou um tempão olhando o menino, agradecido."],
  caranguejo_rei: ["No igapó ele enfrentou um jacaré do tamanho de uma canoa.", {r: "Era um caranguejo, vô."}, "Um caranguejo do tamanho de uma canoa! Foi o que eu disse."],
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
   norte = fim do capítulo, quando os 20 chefes do Norte estão acalmados (Jaci inteira de novo); nordeste = fim do
   Nordeste, com os chefes de lá acalmados (a calma de Guaraci, guaraciCalm). */
const NARRA_PYT = {
  noite: [
    "Foi na primeira noite que ele viu. A fumaça desceu do céu, devagar, e ficou olhando pra ele.",
    {p: "Então tu é o curumim da lança de pedra da lua... Some daqui. A noite é minha."},
    {r: "Quem é tu?"},
    {p: "Pytuna. A noite sem lua. Quando Jaci apagar de vez, ninguém vai ver o que eu levo da mata."},
    "E sumiu no escuro, deixando um cheiro de mato queimado."
  ],
  // quem acalma o último chefe de Ananindeua antes de passar uma noite na mata conhece o Pytuna aqui (e não na primeira noite)
  bufalo_touro_primeiro: [
    "Quando o último bicho do Tapajós voltou a si, uma fumaça desceu do céu, devagar, e ficou olhando pro menino.",
    {p: "Então tu é o curumim da lança de pedra da lua... Acalmou meus bichos tudinho."},
    {r: "Quem é tu?"},
    {p: "Pytuna. A noite sem lua. Quando Jaci apagar de vez, ninguém vai ver o que eu levo da mata."},
    {p: "Tu acalma um, acalma dez... A fumaça não acaba, curumim. Ela vem de toda parte."},
    {r: "Então eu vou atrás de onde ela vem."},
    {p: "Vem. Te espero na cidade grande."}
  ],
  bufalo_touro: [
    "Quando o último bicho do Tapajós voltou a si, a fumaça apareceu de novo. Mais fina. Mais brava.",
    {p: "Tu acalma um, acalma dez... A fumaça não acaba, curumim. Ela vem de toda parte."},
    {r: "Então eu vou atrás de onde ela vem."},
    {p: "Vem. Te espero na cidade grande."}
  ],
  jacare_canal: [
    "Em Belém ela já não falava tão alto. Jaci estava voltando, e a fumaça sabia.",
    {p: "A capital também não te segurou... Tá bom. Lá pro Sul, onde a mata de pinheiro acaba, eu sou maior que tu."},
    "E o vento levou ela pro Sul. Foi a última vez que o Norte viu Pytuna."
  ],
  // Nordeste: a fumaça volta quente e seca, deixando Guaraci bravo; aparece depois do último chefe de dia de cada cidade
  sucuarana: [
    "Nas dunas dos Lençóis a fumaça apareceu de novo, curumim. Mas não era a mesma: vinha quente, seca, cheirando a capim queimado.",
    {p: "Achou que eu tinha ficado no Norte? Aqui eu nem preciso da noite, curumim. Aqui eu seco o dia."},
    {r: "Tu tá deixando Guaraci bravo."},
    {p: "Sol bravo seca rio, seca roça, seca gente. Quanto mais seco, mais eu cresço."}
  ],
  surubim: [
    "No encontro dos rios, a fumaça ficou rodando em cima da água, sem conseguir secar nada.",
    {p: "Dois rios teimosos... Mas o sertão é grande, curumim. Lá tu não acha água pra te esconder."},
    {r: "Então eu levo a minha."}
  ],
  teiu_rei: [
    "No alto de Olinda, Pytuna se misturou com a fumaça da cidade, dos carros, das fábricas.",
    {p: "Tá vendo? Aqui eu nem preciso trabalhar. Eles mesmos fazem fumaça pra mim."},
    {r: "E fazem festa também, frevo, maracatu. Disso tu não entende nada."},
    "A fumaça não respondeu. Foi embora pro sertão, pro lado do Velho Chico."
  ],
  // Centro-Oeste: a fumaça vira queimada de verdade, e ela fala de Brasília, onde se decide o que queima
  guara_rei: [
    "No alto da Chapada, com o vale inteiro lá embaixo, a fumaça subiu de uma queimada perto e veio se sentar do lado do menino.",
    {p: "Viu o tamanho desse céu, curumim? Aqui eu cresço sozinha. Basta um capim seco e um descuidado."},
    {r: "Tem gente que planta fogo de propósito. Não é descuido."},
    {p: "Então tu já entendeu. Quem manda no fogo não mora no mato. Mora na cidade do meio, a de concreto."},
    "E a fumaça foi pro leste, na direção de Brasília."
  ],
  carranca: [
    "Na beira do Velho Chico, quando a carranca voltou pra proa, a fumaça desceu baixinha, sem força.",
    {p: "Carranca, rezadeira, cordel... Esse povo ri de tudo, até do sol rachando o chão."},
    {r: "É assim que eles aguentam. E é assim que tu perde."},
    {p: "Perdi o sertão. O resto do Brasil ainda é meu. Me procura no meio do mapa, onde o céu é maior."},
    "E o vento quente levou ela pro oeste, pro cerrado."
  ],
  nordeste: [
    "E quando o último encantado do Nordeste se acalmou, curumim, Guaraci baixou a cabeça.",
    "Choveu no sertão naquela noite. Chuva grossa, de molhar o mandacaru e encher o açude.",
    {r: "O povo saiu na rua pra tomar banho de chuva, vô. Até o Bode-rei."},
    "O Nordeste tinha aprendido a rir com o sol bravo. Naquela noite riu com chuva. Mas a fumaça seguiu pro meio do Brasil.",
    "Essa parte fica pra amanhã. Dorme, curumim."
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
