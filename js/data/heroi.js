/* Quem viaja: o Rhanon ou a Franciscane (G.heroi, escolhido no jogo novo; ver heroi() em core/state.js).
   Os dois são um casal desde a aldeia. Quem não foi escolhido já está em Curitiba (conseguiu o emprego antes) e manda
   cartas pelo notebook (CARTAS). O texto do jogo continua escrito na versão do Rhanon; jogando com a Franciscane, t()
   (core/lang.js) usa a versão dela daqui (HERO_FEM) ou, se não tiver, só troca o nome (heroSwap).
   Nas versões dela, o Rhanon que está em Curitiba vem escrito "Rhanon⁠" (marcado: heroSwap não troca).
   Frase nova que fala do herói no masculino ("o menino", "ele", "cansado", "maninho"): uma linha aqui e nos TX.<id>.heroFem. */

/* Cartas de quem está em Curitiba: chegam no E-mail do notebook ao entrar na cidade (nbMailArrive), uma por região, e a
   última em Curitiba. G.mail[id] como os freelas (1 nova, 2 lida). Assinatura e remetente saem de parName(). */
const CARTAS = {
  carta_belem: {city: "belem", as: "Chegou?",
    txt: "Me disseram que o barco chegou em Belém. Toma um açaí por mim, com farinha, que aqui ninguém sabe o que é isso. Faz frio até dentro do escritório. Tô te esperando."},
  carta_saoluis: {city: "saoluis", as: "De avião!",
    txt: "Tu andou de avião?! Logo tu, que tinha medo da canoa virar. Aqui na empresa todo mundo já sabe teu nome de tanto que eu falo. Cuidado com essa fumaça, viu?"},
  carta_cuiaba: {city: "cuiaba", as: "Quente aí?",
    txt: "Vi no jornal que o Centro-Oeste tá queimando. Promete que tu não vai entrar no fogo pra salvar bicho sozinho? Tá, eu sei que vai. Pelo menos leva água."},
  carta_bh: {city: "bh", as: "Pão de queijo",
    txt: "Me manda uma foto do pão de queijo de Minas, que aqui chamam qualquer coisa de pão de queijo. Ontem a lua apareceu inteirinha por um minuto. Foi tu?"},
  carta_pampa: {city: "pampa", as: "Tá perto",
    txt: "Tu tá no Sul! Comprei um casaco pra ti, porque eu te conheço e tu vai chegar de camiseta. Tem uma nuvem escura parada em cima da cidade faz dias. Não gosto dela."},
  carta_cwb: {city: "cwb", as: "Largo da Ordem",
    txt: "Tu chegou, eu sei: a nuvem escura ficou mais escura. Faz o que tem que fazer lá na mata. Quando a lua voltar, eu te espero no Largo da Ordem, debaixo da araucária."}
};

/* Versão da Franciscane: "frase do jogo (versão do Rhanon)": "frase com ela" (português; os outros idiomas em TX.<id>.heroFem) */
const HERO_FEM = {
  // a história do Pajé
  "O Rhanon era um menino da nossa aldeia. Lança na mão e a cabeça cheia de computador. Ele e a Franciscane andavam juntos desde pequenos.":
    "A Franciscane era uma menina da nossa aldeia. Lança na mão e a cabeça cheia de computador. Ela e o Rhanon⁠ andavam juntos desde pequenos.",
  "Ela foi primeiro pra Curitiba: passou numa vaga de programadora e mandou pra ele o anúncio de outra. \"Vem, que aqui tem lugar pra ti.\"":
    "Ele foi primeiro pra Curitiba: passou numa vaga de programador e mandou pra ela o anúncio de outra. \"Vem, que aqui tem lugar pra ti.\"",
  "Naquela manhã ele acordou do lado dessa mesma fogueira, com o anúncio no bolso. E foi aí que tudo começou.":
    "Naquela manhã ela acordou do lado dessa mesma fogueira, com o anúncio no bolso. E foi aí que tudo começou.",
  "E o ônibus subiu o rio Iguaçu até o fim, curumim. Curitiba. A cidade do anúncio, onde a Franciscane esperava.":
    "E o ônibus subiu o rio Iguaçu até o fim, curumim. Curitiba. A cidade do anúncio, onde o Rhanon⁠ esperava.",
  "Era a Fran, vô. Ela disse que eu tava atrasado. Eu disse que tinha um Brasil inteiro no caminho.":
    "Era o Rhanon⁠, vô. Ele disse que eu tava atrasada. Eu disse que tinha um Brasil inteiro no caminho.",
  "E foi assim, curumim. O Rhanon e a Franciscane trabalham em Curitiba agora. Programam o dia inteiro e reclamam do frio.":
    "E foi assim, curumim. O Rhanon⁠ e a Franciscane trabalham em Curitiba agora. Programam o dia inteiro e reclamam do frio.",
  "Do Tapajós a Curitiba, o menino acalmou os bichos do Brasil inteiro, devolveu a lua pro avô e reencontrou a Franciscane.":
    "Do Tapajós a Curitiba, a menina acalmou os bichos do Brasil inteiro, devolveu a lua pro avô e reencontrou o Rhanon⁠.",
  "E foi de avião! O menino que nunca tinha saído do Pará, lá em cima das nuvens, agarrado na poltrona.":
    "E foi de avião! A menina que nunca tinha saído do Pará, lá em cima das nuvens, agarrada na poltrona.",
  "Foi lá que o menino fez o segundo trabalho de programador: um aplicativo de cordel para um poeta da feira.":
    "Foi lá que a menina fez o segundo trabalho de programadora: um aplicativo de cordel para um poeta da feira.",
  "Petrolina, no sertão. Depois do mar de São Luís e dos rios de Teresina, o menino desceu do ônibus e só viu poeira, sol e mandacaru.":
    "Petrolina, no sertão. Depois do mar de São Luís e dos rios de Teresina, a menina desceu do ônibus e só viu poeira, sol e mandacaru.",
  "Depois de BH, curumim, o menino pegou o ônibus pra Ouro Preto. Cidade velha, do tempo em que tiravam ouro da terra.":
    "Depois de BH, curumim, a menina pegou o ônibus pra Ouro Preto. Cidade velha, do tempo em que tiravam ouro da terra.",
  "E o menino entrou na última mata de araucária, curumim. Pinheiro velho, mais velho que a cidade, e um silêncio de doer o ouvido.":
    "E a menina entrou na última mata de araucária, curumim. Pinheiro velho, mais velho que a cidade, e um silêncio de doer o ouvido.",
  "Quando ele passou da primeira árvore, a noite caiu de uma vez. Sem lua nenhuma no céu.":
    "Quando ela passou da primeira árvore, a noite caiu de uma vez. Sem lua nenhuma no céu.",
  "E lá no fundo, numa clareira, alguém esperava por ele.":
    "E lá no fundo, numa clareira, alguém esperava por ela.",
  "E o menino chegou na cidade do meio, a de concreto, que o Pytuna tinha falado. Brasília.":
    "E a menina chegou na cidade do meio, a de concreto, que o Pytuna tinha falado. Brasília.",
  "De Cuiabá o menino desceu de ônibus até Bonito, no Mato Grosso do Sul. E viu a água mais limpa da vida dele.":
    "De Cuiabá a menina desceu de ônibus até Bonito, no Mato Grosso do Sul. E viu a água mais limpa da vida dela.",
  "Lá o céu é enorme, sem morro e sem mata fechada pra esconder. Jaci devia brilhar mais. Foi ali que o menino viu quanto ela já tinha perdido.":
    "Lá o céu é enorme, sem morro e sem mata fechada pra esconder. Jaci devia brilhar mais. Foi ali que a menina viu quanto ela já tinha perdido.",
  "Teresina! A cidade mais quente do Brasil. O menino suava até a lança.":
    "Teresina! A cidade mais quente do Brasil. A menina suava até a lança.",
  "Belém! O menino nunca tinha visto tanta gente junta. Nem tanto urubu.":
    "Belém! A menina nunca tinha visto tanta gente junta. Nem tanto urubu.",
  "Eu fiquei parado na frente dele, vô, sem lança levantada. Ele parou bem pertinho e cheirou minha mão.":
    "Eu fiquei parada na frente dele, vô, sem lança levantada. Ele parou bem pertinho e cheirou minha mão.",
  "A fumaça fez ela achar que todo mundo era caçador. Até o menino, que nunca caçou por esporte na vida.":
    "A fumaça fez ela achar que todo mundo era caçador. Até a menina, que nunca caçou por esporte na vida.",
  "A fumaça fez ela achar que o menino vinha pegar os pequenos.":
    "A fumaça fez ela achar que a menina vinha pegar os pequenos.",
  "E tu mostrou o caminho. Por isso que o cerrado ainda tem lobo, menino.":
    "E tu mostrou o caminho. Por isso que o cerrado ainda tem lobo, menina.",
  "A fumaça acordou o bicho no lugar errado, no tempo errado. O menino acalmou ele, e ele voltou a dormir no paredão.":
    "A fumaça acordou o bicho no lugar errado, no tempo errado. A menina acalmou ele, e ele voltou a dormir no paredão.",
  "A fumaça fez a sina durar mais que a noite. O menino segurou o bicho até o galo cantar.":
    "A fumaça fez a sina durar mais que a noite. A menina segurou o bicho até o galo cantar.",
  "Ela protege os bichos de caçador. A fumaça fez ela achar que todo mundo era caçador, até o menino.":
    "Ela protege os bichos de caçador. A fumaça fez ela achar que todo mundo era caçador, até a menina.",
  "A fumaça não deixava ele dormir. O menino acalmou o bicho e ele voltou pra pedra quentinha.":
    "A fumaça não deixava ele dormir. A menina acalmou o bicho e ele voltou pra pedra quentinha.",
  "A fumaça fez ele dançar fora de hora, de cara fechada. O menino acalmou o boneco, e ele voltou a sorrir.":
    "A fumaça fez ele dançar fora de hora, de cara fechada. A menina acalmou o boneco, e ele voltou a sorrir.",
  "A fumaça deixou ele mais bravo ainda. O menino acalmou o homem, e pela primeira vez em muito tempo ele chorou.":
    "A fumaça deixou ele mais bravo ainda. A menina acalmou o homem, e pela primeira vez em muito tempo ele chorou.",
  "O menino só viu porque ela fez sombra. E lá no Lençóis quase não tem sombra.":
    "A menina só viu porque ela fez sombra. E lá no Lençóis quase não tem sombra.",
  "A fumaça fez ela se mexer no sono. O menino acalmou a bicha, e a ilha ficou no lugar.":
    "A fumaça fez ela se mexer no sono. A menina acalmou a bicha, e a ilha ficou no lugar.",
  "A Onça-Rei! Até eu tremi quando ele me contou. Era uma onça do tamanho de uma anta.":
    "A Onça-Rei! Até eu tremi quando ela me contou. Era uma onça do tamanho de uma anta.",
  "O Pirarucu respira fora d'água, sabia? Depois que voltou a si, subiu pra respirar e ficou um tempão olhando o menino, agradecido.":
    "O Pirarucu respira fora d'água, sabia? Depois que voltou a si, subiu pra respirar e ficou um tempão olhando a menina, agradecido.",
  "No igapó ele enfrentou um jacaré do tamanho de uma canoa.":
    "No igapó ela enfrentou um jacaré do tamanho de uma canoa.",
  "O Gavião-real viu o menino lá do alto e desceu pra brigar. Depois que acalmou, ficou rodando em cima dele a tarde inteira, de guarda.":
    "O Gavião-real viu a menina lá do alto e desceu pra brigar. Depois que acalmou, ficou rodando em cima dela a tarde inteira, de guarda.",
  "A Matinta Perera pediu fumo, como sempre. O menino deu um pouco do meu. Nunca mais vi aquele fumo.":
    "A Matinta Perera pediu fumo, como sempre. A menina deu um pouco do meu. Nunca mais vi aquele fumo.",
  "O Curupira fez o menino andar em círculo a noite toda com aquelas pegadas viradas. No fim, riu e chamou ele de amigo.":
    "O Curupira fez a menina andar em círculo a noite toda com aquelas pegadas viradas. No fim, riu e chamou ela de amiga.",
  "A Visagem da maré molhou o menino da cabeça aos pés. Depois pediu desculpa. Visagem educada é raro.":
    "A Visagem da maré molhou a menina da cabeça aos pés. Depois pediu desculpa. Visagem educada é raro.",
  "No dia seguinte, de banho tomado e com a única camisa limpa, o menino foi pra entrevista.":
    "No dia seguinte, de banho tomado e com a única camisa limpa, a menina foi pra entrevista.",
  "Foi na primeira noite que ele viu. A fumaça desceu do céu, devagar, e ficou olhando pra ele.":
    "Foi na primeira noite que ela viu. A fumaça desceu do céu, devagar, e ficou olhando pra ela.",
  "Quando o último bicho do Tapajós voltou a si, uma fumaça desceu do céu, devagar, e ficou olhando pro menino.":
    "Quando o último bicho do Tapajós voltou a si, uma fumaça desceu do céu, devagar, e ficou olhando pra menina.",
  "No alto da Chapada, com o vale inteiro lá embaixo, a fumaça subiu de uma queimada perto e veio se sentar do lado do menino.":
    "No alto da Chapada, com o vale inteiro lá embaixo, a fumaça subiu de uma queimada perto e veio se sentar do lado da menina.",
  "E a fumaça foi embora pro escuro, deixando o lago frio. O menino sabia: a próxima noite ia ser a última.":
    "E a fumaça foi embora pro escuro, deixando o lago frio. A menina sabia: a próxima noite ia ser a última.",
  "No alto da Serra do Curral, com Belo Horizonte inteira acesa lá embaixo, a fumaça apareceu do lado do menino. Quase não dava pra ver, de tanta luz.":
    "No alto da Serra do Curral, com Belo Horizonte inteira acesa lá embaixo, a fumaça apareceu do lado da menina. Quase não dava pra ver, de tanta luz.",
  "E o vento frio levou a fumaça pro sul. Fazia tempo que o menino não sentia frio.":
    "E o vento frio levou a fumaça pro sul. Fazia tempo que a menina não sentia frio.",
  "Jasytatá, curumim: estrela. O nome da nossa aldeia. Lá no meio do Brasil o menino entendeu por quê.":
    "Jasytatá, curumim: estrela. O nome da nossa aldeia. Lá no meio do Brasil a menina entendeu por quê.",
  "E o menino juntou o dinheiro da startup e olhou pro sul. Curitiba estava perto. E a fumaça também.":
    "E a menina juntou o dinheiro da startup e olhou pro sul. Curitiba estava perto. E a fumaça também.",
  // dicas do Pajé (NARRA_HINT)
  "Foi aí que ele lembrou: tinha aprendido coisa nova e nem tinha usado. Aperta H, curumim.":
    "Foi aí que ela lembrou: tinha aprendido coisa nova e nem tinha usado. Aperta H, curumim.",
  "O menino apanhou até lembrar que o armeiro da feira fazia arco. De longe, bicho bravo não morde.":
    "A menina apanhou até lembrar que o armeiro da feira fazia arco. De longe, bicho bravo não morde.",
  "Eu tinha luar de chefe guardado pra fazer talismã pra ele. Mas o teimoso não vinha falar comigo.":
    "Eu tinha luar de chefe guardado pra fazer talismã pra ela. Mas a teimosa não vinha falar comigo.",
  "Às vezes ele voltava pras trilhas de antes, pra ficar mais forte. Não tem vergonha nisso.":
    "Às vezes ela voltava pras trilhas de antes, pra ficar mais forte. Não tem vergonha nisso.",
  "Ele aprendeu a apertar Z na hora certa: golpe perfeito e bloqueio. Quem acerta o tempo acalma até onça.":
    "Ela aprendeu a apertar Z na hora certa: golpe perfeito e bloqueio. Quem acerta o tempo acalma até onça.",
  "O bicho daquela trilha tinha medo de fogo. E o menino lá, sem tocha. O artesão da feira vendia uma.":
    "O bicho daquela trilha tinha medo de fogo. E a menina lá, sem tocha. O artesão da feira vendia uma.",
  "Bicho de fogo e bicho de sol não aguentam água. Foi o artesão da feira que fez uma cuia pra ele.":
    "Bicho de fogo e bicho de sol não aguentam água. Foi o artesão da feira que fez uma cuia pra ela.",
  "Tinha bicho ali que não aguentava vento. Eu ensinei o sopro pra ele, depois que ele aprendeu o Espírito da mata.":
    "Tinha bicho ali que não aguentava vento. Eu ensinei o sopro pra ela, depois que ela aprendeu o Espírito da mata.",
  "Bicho que voa se enrosca no cipó. O artesão da feira trançava um chicote, e o menino lá, batendo de lança em morcego.":
    "Bicho que voa se enrosca no cipó. O artesão da feira trançava um chicote, e a menina lá, batendo de lança em morcego.",
  "Bicho de água não gosta de raio. O artesão da feira fazia um com faísca de poraquê, e o menino nem sabia.":
    "Bicho de água não gosta de raio. O artesão da feira fazia um com faísca de poraquê, e a menina nem sabia.",
  // batalha
  "Rhanon tá preso, não dá pra fugir!": "Franciscane tá presa, não dá pra fugir!",
  "A luz de Jaci cai sobre o Rhanon: ele levanta com {n} PV!": "A luz de Jaci cai sobre a Franciscane: ela levanta com {n} PV!",
  "{bicho} assobia uma música encantada... −{n} PV e −5 PE. Rhanon fica tonto, sem defesa por 2 turnos.":
    "{bicho} assobia uma música encantada... −{n} PV e −5 PE. Franciscane fica tonta, sem defesa por 2 turnos.",
  "{bicho} dá um choque! −{n} PV e −4 PE. Rhanon fica travado e não consegue fugir.":
    "{bicho} dá um choque! −{n} PV e −4 PE. Franciscane fica travada e não consegue fugir.",
  "Rhanon tá muito ferido. Melhor descansar na aldeia antes de voltar pra mata.":
    "Franciscane tá muito ferida. Melhor descansar na aldeia antes de voltar pra mata.",
  "Um biguá preto seca as asas abertas no tronco. Quando vê o Rhanon, mergulha direto nele.":
    "Um biguá preto seca as asas abertas no tronco. Quando vê a Franciscane, mergulha direto nela.",
  // moradores e clientes falando com o herói
  "Ixi, tá vendo essa fumaça no horizonte? Todo ano é queimada. Mas esse ano a fumaça tem olho, menino. Juro por Deus.":
    "Ixi, tá vendo essa fumaça no horizonte? Todo ano é queimada. Mas esse ano a fumaça tem olho, menina. Juro por Deus.",
  "De noite, um redemoinho desce a ladeira assobiando. É o Saci, menino. Se pegar o gorro dele, ele te deve um favor.":
    "De noite, um redemoinho desce a ladeira assobiando. É o Saci, menina. Se pegar o gorro dele, ele te deve um favor.",
  "Oxe, chegou de Teresina? Aqui é sertão também, meu filho: sol de rachar e o Velho Chico pra refrescar. Prova o queijo coalho na brasa.":
    "Oxe, chegou de Teresina? Aqui é sertão também, minha filha: sol de rachar e o Velho Chico pra refrescar. Prova o queijo coalho na brasa.",
  "Eu ando nesse calçadão todo dia faz cinquenta anos, meu filho. O desenho é de onda, ó: igual o mar do lado.":
    "Eu ando nesse calçadão todo dia faz cinquenta anos, minha filha. O desenho é de onda, ó: igual o mar do lado.",
  "Eu vim do Piauí pra construir essa cidade, menino. Era só poeira vermelha e cerrado. Hoje tem até lago.":
    "Eu vim do Piauí pra construir essa cidade, menina. Era só poeira vermelha e cerrado. Hoje tem até lago.",
  "Dizem que de noite, na Cidade Velha, uma mulher de branco anda pelas ruas de pedra. É visagem, menino. Te benze.":
    "Dizem que de noite, na Cidade Velha, uma mulher de branco anda pelas ruas de pedra. É visagem, menina. Te benze.",
  "Sentiu esse pitiú? É peixe fresco, maninho. Cheiro de Ver-o-Peso.": "Sentiu esse pitiú? É peixe fresco, mana. Cheiro de Ver-o-Peso.",
  "Tu que é o menino que mexe com computador? Arruma um notebook que eu tenho trabalho pra ti.":
    "Tu que é a menina que mexe com computador? Arruma um notebook que eu tenho trabalho pra ti.",
  "Sem passagem não embarca, maninho.": "Sem passagem não embarca, mana.",
  "O marinheiro aponta para a bilheteria: \"Sem passagem não sobe, maninho. Compra ali com o comandante.\"":
    "O marinheiro aponta para a bilheteria: \"Sem passagem não sobe, mana. Compra ali com o comandante.\"",
  "O site tá bombando, menino! Todo mundo agora sabe o preço das coisas antes de chegar.":
    "O site tá bombando, menina! Todo mundo agora sabe o preço das coisas antes de chegar.",
  "O povo agora lê cordel até no ônibus, menino. Já tô escrevendo um sobre tu e a lança de pedra da lua.":
    "O povo agora lê cordel até no ônibus, menina. Já tô escrevendo um sobre tu e a lança de pedra da lua.",
  "Com o teu mapa a gente chega antes do fogo crescer, menino. Tem bicho vivo hoje por causa de umas linhas de código.":
    "Com o teu mapa a gente chega antes do fogo crescer, menina. Tem bicho vivo hoje por causa de umas linhas de código.",
  "Agora eles pensam duas vezes antes de voltar. Valeu, maninho!": "Agora eles pensam duas vezes antes de voltar. Valeu, mana!",
  "Era o Chupa-cabra mesmo?! Égua, tu é corajoso. Merece isso.": "Era o Chupa-cabra mesmo?! Égua, tu é corajosa. Merece isso.",
  // segredos (o baú escondido em cada trilha)
  "Ali no fundo da mata o menino achou o baú que eu tinha escondido quando era moço. Esqueci de contar pra ele. Tava lá, me esperando.":
    "Ali no fundo da mata a menina achou o baú que eu tinha escondido quando era moço. Esqueci de contar pra ela. Tava lá, me esperando.",
  "Na seca o rio recua e o barro endurece igual pedra. Na cheia, desmancha. O menino só fez a cheia chegar mais cedo.":
    "Na seca o rio recua e o barro endurece igual pedra. Na cheia, desmancha. A menina só fez a cheia chegar mais cedo.",
  "No igapó, a cheia sobe até a copa das árvores e o peixe come fruta. Escondido nas raízes, o menino achou o que um pescador deixou pra trás.":
    "No igapó, a cheia sobe até a copa das árvores e o peixe come fruta. Escondido nas raízes, a menina achou o que um pescador deixou pra trás.",
  "No seringal abandonado ficou muita coisa dos seringueiros. Gente que trabalhou muito e ganhou pouco. O menino guardou o que achou com respeito.":
    "No seringal abandonado ficou muita coisa dos seringueiros. Gente que trabalhou muito e ganhou pouco. A menina guardou o que achou com respeito.",
  "Os búfalos deitam no capim da várzea e deixam ele todo amassado. Debaixo de um desses ninhos o menino achou um baú. Cheirava a búfalo.":
    "Os búfalos deitam no capim da várzea e deixam ele todo amassado. Debaixo de um desses ninhos a menina achou um baú. Cheirava a búfalo.",
  "Os casarões da Cidade Velha guardam quintal escondido. Tem um que ninguém abria fazia cem anos. O menino abriu com um raio. Imagina a cara do vizinho.":
    "Os casarões da Cidade Velha guardam quintal escondido. Tem um que ninguém abria fazia cem anos. A menina abriu com um raio. Imagina a cara do vizinho.",
  "No porto tudo chega e tudo sai. Num depósito esquecido o menino achou o que um barco deixou e ninguém veio buscar.":
    "No porto tudo chega e tudo sai. Num depósito esquecido a menina achou o que um barco deixou e ninguém veio buscar.",
  "No mangue da ilha, as catadoras de caranguejo sabem cada buraco de cor. Uma delas escondeu ali um baú pra quem precisasse. O menino precisou.":
    "No mangue da ilha, as catadoras de caranguejo sabem cada buraco de cor. Uma delas escondeu ali um baú pra quem precisasse. A menina precisou.",
  "Nos Lençóis o vento muda as dunas de lugar todo dia. O que ele cobre hoje, ele descobre amanhã. O menino só apressou o vento.":
    "Nos Lençóis o vento muda as dunas de lugar todo dia. O que ele cobre hoje, ele descobre amanhã. A menina só apressou o vento.",
  "No Pantanal o fogo bom é o que o peão faz com cuidado. O ruim é o da fumaça do Pytuna. O menino usou o bom, pouquinho, e achou o baú do peão.":
    "No Pantanal o fogo bom é o que o peão faz com cuidado. O ruim é o da fumaça do Pytuna. A menina usou o bom, pouquinho, e achou o baú do peão.",
  "Na Chapada a água desce do alto em véu de noiva. Por trás do paredão tem fenda que só a água conhece. E agora o menino.":
    "Na Chapada a água desce do alto em véu de noiva. Por trás do paredão tem fenda que só a água conhece. E agora a menina.",
  "No meio de São Paulo tem um parque onde o povo vai respirar. Nos fundos do viveiro, o jardineiro guardava um baú pra quem chegasse cansado da cidade. O menino chegou.":
    "No meio de São Paulo tem um parque onde o povo vai respirar. Nos fundos do viveiro, o jardineiro guardava um baú pra quem chegasse cansado da cidade. A menina chegou.",
  // cartas de quem está em Curitiba (a chave é o texto da carta)
  "Vi no jornal que o Centro-Oeste tá queimando. Promete que tu não vai entrar no fogo pra salvar bicho sozinho? Tá, eu sei que vai. Pelo menos leva água.":
    "Vi no jornal que o Centro-Oeste tá queimando. Promete que tu não vai entrar no fogo pra salvar bicho sozinha? Tá, eu sei que vai. Pelo menos leva água."
};
