/* Locais do mapa grande (Pará ou Brasil), sublocais de Ananindeua e de Belém, loja e equipamentos. */
const REQ = {lv: 4, money: 150};   // para Curitiba aparecer e a passagem
const CURITIBA_OPEN = false;       // false = Curitiba fica escondida (foco em Ananindeua por enquanto)
/* Mapa grande: um por região ("norte", "nordeste") ou "brasil" (a aldeia e Curitiba).
   Cada mapa tem o contorno (land), um rio opcional, a trilha tracejada (route) e onde fica cada local de LOC. */
let MAP_REGION = "norte";   // mapa grande da cidade atual (CITY[...].map); muda quando o Rhanon voa para outra região (syncRegion)
const MAP_REGIONS = {
  // Norte inteiro (a partir de longitude/latitude): contorno da região, ilha de Marajó, rio Amazonas e rio Tapajós.
  // A aldeia fica na beira do Tapajós; o barco de linha desce o Tapajós e o Amazonas até Belém (path = caminho do barco)
  norte: {n: "Norte", aria: "Mapa estilizado da região Norte, com a aldeia no Tapajós e Belém",
    land: ["M23 379 L45 334 L102 315 L113 252 L102 215 L117 205 L152 186 L168 202 L226 194 L209 145 L254 143 L293 120 L310 139 L316 190 L348 198 L385 186 L426 182 L459 180 L480 139 L492 166 L512 190 L515 213 L500 227 L488 244 L504 260 L533 260 L543 246 L558 239 L592 248 L588 280 L570 309 L566 334 L582 360 L594 383 L599 438 L590 492 L562 498 L533 500 L508 490 L500 430 L451 420 L381 418 L344 377 L336 408 L305 424 L299 502 L266 494 L217 481 L199 444 L172 430 L135 453 L92 453 L90 422 L53 424Z",
      "M500 235 L521 229 L545 239 L543 252 L521 262 L500 252Z"],
    river: "M102 315 Q102 315 128 304 Q154 293 182 296 Q209 299 238 300 Q266 301 287 296 Q308 291 332 288 Q357 284 386 280 Q416 276 438 269 Q459 262 474 255 Q488 248 498 242 L508 237 M361 403 Q361 403 367 382 Q373 362 382 342 Q390 321 396 309 Q402 297 409 286 L416 276",
    route: ["ananindeua", "belem"], pos: {ananindeua: [379, 342], belem: [543, 257]}, path: "M379 342 Q379 342 384 332 Q390 321 396 309 Q402 297 409 286 Q416 276 438 269 Q459 262 474 259 Q488 256 500 261 Q512 266 520 265 Q529 264 536 260 L543 257"},
  // Nordeste: o contorno da região (a partir de longitude/latitude), a ilha de São Luís e o rio São Francisco; a estrada
  // liga as cidades em ordem (São Luís, Teresina, Recife e Petrolina, que volta para o sertão na beira do São Francisco)
  nordeste: {n: "Nordeste", aria: "Mapa estilizado do Nordeste, com São Luís, Teresina, Recife e Petrolina",
    land: ["M150 63 L215 103 L314 116 L439 144 L542 184 L580 249 L576 280 L545 330 L492 370 L439 432 L420 488 L393 596 L367 584 L222 491 L143 500 L154 370 L150 345 L105 286 L97 200 L51 190 L116 169 L135 128Z",
      "M210 100 L222 94 L230 103 L220 110Z"],   // continente e a ilha de São Luís
    river: "M230 494 C250 440 300 360 363 320 S470 320 519 354",   // rio São Francisco
    route: ["saoluis", "teresina", "recife", "petrolina"], pos: {saoluis: [222, 112], teresina: [276, 188], recife: [564, 280], petrolina: [362, 326]}},
  // Centro-Oeste: Mato Grosso, Mato Grosso do Sul, Goiás e o Distrito Federal (a partir de longitude/latitude) e o rio
  // Paraguai descendo pelo Pantanal; a estrada desce de Cuiabá para Bonito e de lá atravessa o cerrado até Brasília
  centroeste: {n: "Centro-Oeste", aria: "Mapa estilizado do Centro-Oeste, com Cuiabá, Bonito e Brasília",
    land: ["M55 94 L148 49 L190 106 L295 109 L391 124 L382 214 L430 220 L514 217 L523 280 L481 310 L460 364 L388 397 L358 424 L313 460 L286 508 L271 550 L238 547 L229 502 L163 493 L169 430 L157 355 L94 319 L97 241 L52 160Z",
      "M452 296 L474 296 L474 312 L452 312Z"],   // a região e o quadradinho do Distrito Federal
    river: "M196 280 C172 300 160 330 170 360 C178 390 164 410 170 430 S160 470 163 493",   // rio Paraguai, pelo Pantanal
    route: ["cuiaba", "bonito", "brasilia"], pos: {cuiaba: [217, 298], bonito: [205, 463], brasilia: [463, 304]}},
  // Sudeste: Minas Gerais, Espírito Santo, Rio de Janeiro e São Paulo (a partir de longitude/latitude) e o rio São
  // Francisco nascendo na serra da Canastra; a estrada desce de Belo Horizonte para Ouro Preto (o Rio e São Paulo vêm depois)
  sudeste: {n: "Sudeste", aria: "Mapa estilizado do Sudeste, com Belo Horizonte e Ouro Preto",
    land: ["M112 273 L238 222 L268 126 L322 84 L398 54 L532 113 L566 205 L587 277 L537 344 L490 415 L440 420 L377 436 L310 462 L238 512 L213 487 L154 420 L70 403 L24 394 L87 331Z"],
    river: "M306 302 C330 250 360 200 365 150 S390 80 398 54",   // rio São Francisco, da Canastra para o norte
    route: ["bh", "ouropreto"], pos: {bh: [409, 290], ouropreto: [446, 336]}},
  // area = pedaço de cada região (recortado pelo contorno, então pode passar dele); icon = desenho de MAP_ICON no ponto dela
  brasil: {n: "Brasil", aria: "Mapa do Brasil em silhueta, com rota entre a aldeia e Curitiba",
    area: {norte: "M80 80 H358 V178 L352 230 L340 280 L345 300 L320 305 L300 300 L230 310 L170 362 H80Z",
      nordeste: "M358 80 H480 V365 L400 362 L345 355 V300 L340 280 L352 230 L358 178Z",
      centroeste: "M80 362 H170 L230 310 L300 300 L320 305 L345 300 V355 L315 370 L300 400 L285 428 L267 452 H80Z",
      sudeste: "M345 355 L400 362 L480 365 V452 H352 L300 440 L285 428 L300 400 L315 370Z",
      sul: "M80 452 H267 L285 428 L300 440 L352 452 H480 V560 H80Z"},
    icon: {norte: "manguezal", nordeste: "caatinga", centroeste: "pantanal", sudeste: "tiradentes", sul: "curitiba"},
    land: ["M205 106 L262 101 320 128 350 175 382 190 405 196 440 228 444 268 427 302 416 322 394 387 374 421 361 442 343 479 326 527 294 538 263 507 267 465 246 433 226 401 204 370 165 359 110 349 99 311 126 286 109 254 147 213 162 180 172 139Z"],
    route: ["ananindeua", "curitiba"], pos: {ananindeua: [268, 172], curitiba: [315, 478]}}
};
/* Regiões do Brasil (mapa do Brasil, systems/world-map.js; ver HISTORIA.md): a viagem vai do Norte ao Sul. pos = ponto no
   contorno de MAP_REGIONS.brasil (viewBox 600x620); map = mapa grande da região (por enquanto só o Pará, no Norte);
   airport = aeroporto que abre os voos de ida e volta para as regiões já visitadas (G.regions). open: false = em breve. */
const REGIONS = {
  norte:       {n: "Norte", pos: [215, 200], color: "#3f9a5c", open: true, map: "norte", airport: "Aeroporto de Belém",
    txt: "Onde tudo começou: a aldeia Jasytatá, na beira do Tapajós, e Belém. Os bichos e encantados da floresta ficaram bravos com a fumaça de Pytuna."},
  nordeste:    {n: "Nordeste", pos: [385, 245], color: "#e8a020", open: true, map: "nordeste", airport: "Aeroporto de São Luís",
    txt: "Sertão, dunas e mangue. Dizem que lá a fumaça secou tudo, e a Comadre Fulozinha anda perdida na mata."},
  centroeste:  {n: "Centro-Oeste", pos: [262, 335], color: "#c8603a", open: true, map: "centroeste", airport: "Aeroporto de Cuiabá",
    txt: "O Pantanal, o cerrado e Brasília. Um céu tão grande que a lua devia brilhar mais."},
  sudeste:     {n: "Sudeste", pos: [352, 410], color: "#3a7ab8", open: true, map: "sudeste", airport: "Aeroporto de Confins",
    txt: "Cidades que não dormem e mata atlântica nas serras. Mais luz de poste que de lua."},
  sul:         {n: "Sul", pos: [300, 490], color: "#7a4ac8", open: false,
    txt: "Onde a mata de pinheiro acaba. Foi pra lá que a fumaça fugiu. E é lá que fica Curitiba."}
};
const LOC = {
  ananindeua: {n: "Aldeia Jasytatá (PA)", s: "Jasytatá", x: 322, y: 168, txt: "Sua aldeia. A mata ao redor anda brava, e cada lembrança que os bichos deixam rende uns trocados."},
  belem: {n: "Belém (PA)", s: "Belém", txt: "A capital do Pará, na beira da baía do Guajará. Prédios, casarões de azulejo, o Ver-o-Peso... e bicho e malandro bem mais fortes que os da mata."},
  teresina: {n: "Teresina (PI)", s: "Teresina", txt: "A capital mais quente do Brasil, entre dois rios: o Parnaíba e o Poti. No encontro das águas, dizem, mora o Cabeça de Cuia."},
  petrolina: {n: "Petrolina (PE)", s: "Petrolina", txt: "O sertão de Pernambuco, na beira do Velho Chico: caatinga seca, bode solto, carranca na proa dos barcos e um rio que nunca deixa a cidade sem água."},
  recife: {n: "Recife (PE)", s: "Recife", txt: "A Veneza brasileira, cortada por rios e pontes: frevo, maracatu, cordel na feira e Olinda logo ali, no alto da ladeira."},
  brasilia: {n: "Brasília (DF)", s: "Brasília", txt: "A capital no meio do cerrado, desenhada em forma de avião: eixo, superquadra, concreto branco e um céu enorme. É aqui que se decide o que o país faz com a mata."},
  bonito: {n: "Bonito (MS)", s: "Bonito", txt: "Uma cidade pequena no meio de rios tão transparentes que o peixe parece voar. Gruta, cachoeira, flutuação... e a água mais limpa do Brasil, que a fumaça agora quer sujar."},
  cuiaba: {n: "Cuiabá (MT)", s: "Cuiabá", txt: "O meio da América do Sul, na beira do rio Cuiabá: calor de quarenta graus, viola de cocho, peixe na brasa e o Pantanal começando logo ali. O Centro-Oeste começa aqui."},
  bh: {n: "Belo Horizonte (MG)", s: "Belo Horizonte", txt: "A capital de Minas, cercada de serra por todo lado: pão de queijo, Mercado Central, ladeira e gente que fala \"uai\". O Sudeste começa aqui."},
  ouropreto: {n: "Ouro Preto (MG)", s: "Ouro Preto", txt: "A cidade do ouro, toda de ladeira, pedra e igreja barroca: sino tocando, casarão de janela azul e mina velha cavada na serra. De noite, dizem, um menino de uma perna só apronta nas ruas."},
  saoluis: {n: "São Luís (MA)", s: "São Luís", txt: "A ilha do Maranhão: casarão de azulejo, maré que sobe e desce metros num dia e bumba-meu-boi em toda esquina. O Nordeste começa aqui."},
  curitiba: {n: "Curitiba (PR)", s: "Curitiba", x: 315, y: 478, txt: "Cidade grande, frio e oportunidades na programação. Conquiste a primeira vaga, complete missões de trabalho e tente uma empresa melhor."}
};
/* Mapa da aldeia no Tapajós (viewBox 440x325): uma trilha só, em zigue-zague, na ordem de dificuldade (ROUTE).
   Embaixo, da esquerda para a direita, até cruzar o rio; no meio, de volta para a esquerda, cruzando de novo;
   e no fim, lá em cima, o porto do Tapajós, de onde sai o barco de linha para a capital. */
const SUB = {
  aldeia:  {n: "Aldeia", x: 48, y: 242, txt: "A casa do Rhanon. Fogueira pra descansar, tenda pra dormir e gente conhecida."},
  feira:   {n: "Vila Paranã", s: "Vila", x: 122, y: 262, txt: "A vila ribeirinha do Tapajós, com feira na beira do rio: mandioca, peixe assado, açaí e maniçoba. Aqui se vende lembrança e se compra comida."},
  mata:    {n: "Mata", x: 188, y: 236, txt: "Trilhas conhecidas. Bichos pequenos e médios, bons para começar."},
  fechada: {n: "Mata fechada", x: 254, y: 264, txt: "Folhas altas, pouca luz e predadores de verdade."},
  rio:     {n: "Beira do rio", x: 376, y: 240, txt: "Do outro lado da ponte: água, lama e dentes. Olho no que se mexe na margem."},
  igarape: {n: "Igarapé", x: 402, y: 156, txt: "Rio acima, a água entra na mata em canais estreitos. Tracajá, garça, boto... e algo enorme lá no fundo."},
  manguezal: {n: "Igapó", x: 290, y: 128, txt: "A mata alagada: árvore com o pé dentro do rio e água escura parada. Caranguejo de água doce, mão-pelada e, de noite, um assobio que ninguém quer ouvir."},
  seringal: {n: "Seringal", x: 212, y: 160, txt: "Seringueiras velhas com marca de faca e a casa do seringueiro caindo aos pedaços. Lá ninguém anda de noite."},
  varzea: {n: "Várzea", x: 120, y: 134, txt: "Campo alagado de capim alto, como no Marajó. Búfalo, socó escondido e, dizem os vaqueiros, um gigante que fede de longe."},
  parada: {n: "Porto do Tapajós", s: "Porto", x: 52, y: 62, txt: "No fim da trilha, o porto do rio. Na bilheteria de madeira, o comandante vende a passagem do barco de linha pra Belém."},
  /* Belém (episódio 2): o ônibus chega no terminal; a trilha passa pelo Ver-o-Peso (feira, sem bichos) e segue
     pela Cidade Velha, pelo Porto e pelas Baixadas, cada vez mais difícil */
  terminal: {city: "belem", n: "Cais da Escadinha", s: "Cais", x: 392, y: 262, txt: "O barco de linha encosta aqui, na escadinha do cais. A passagem vale ida e volta: dá pra voltar pra aldeia quando quiser."},
  beira: {city: "petrolina", n: "Beira do Velho Chico", s: "Beira", x: 400, y: 228, txt: "Rio abaixo, longe da orla: capim alto, barranco de martim-pescador e o São Francisco largo, verde e manso. De noite, uma gargalhada boia no meio da água."},
  serra: {city: "petrolina", n: "Serra do Araripe", s: "Serra", x: 290, y: 56, txt: "Lá no alto, a chapada: paredão de pedra cheio de fóssil, mata verde na encosta e encruzilhada de estrada de terra. Nas sextas de lua cheia, ninguém sobe."},
  caatinga: {city: "petrolina", n: "Caatinga", x: 120, y: 110, txt: "A mata branca do sertão: galho seco, mandacaru e chão rachado. Bode, preá, tatu-bola... e, de noite, um assobio fino no meio dos espinhos."},
  orla: {city: "petrolina", n: "Orla do Velho Chico", s: "Orla", x: 300, y: 210, txt: "A beira do São Francisco em Petrolina: barquinho de carranca, feira de bode e de queijo, pensão e o povo do sertão, que ri de tudo."},
  centrobonito: {city: "bonito", n: "Centro de Bonito", s: "Centro", x: 300, y: 150, txt: "A rua principal de Bonito: casinha baixa, sorveteria, guia de turismo em cada esquina, a pensão e uma fonte de água tão clara que dá pra contar as pedrinhas."},
  parquebsb: {city: "brasilia", n: "Parque Nacional de Brasília", s: "Parque", x: 92, y: 84, txt: "Cerrado de verdade, a poucos minutos do concreto: campo aberto, vereda de buriti, piscina de água mineral e bicho de todo tamanho. De noite, uma pedra voa do nada e um menino ri no escuro."},
  planopiloto: {city: "brasilia", n: "Plano Piloto", s: "Plano Piloto", x: 214, y: 172, txt: "O centro de Brasília: superquadra de prédio sobre pilotis, comércio da quadra, ipê-roxo na calçada e a pensão. Na banca da esquina, a brigada de incêndio procura um programador."},
  gruta: {city: "bonito", n: "Gruta do Lago Azul", s: "Gruta", x: 96, y: 92, txt: "Uma caverna funda na serra da Bodoquena, com um lago de água azul lá embaixo. Estalactite, morcego, fóssil de bicho de dez mil anos... e, de noite, um assobio de quem cuida da mata."},
  rioprata: {city: "bonito", n: "Rio da Prata", x: 140, y: 236, txt: "Um rio de água cristalina que nasce no meio da mata: peixe nadando do lado, sucuri no fundo de areia branca e ariranha gritando na margem. De noite, uma luz dourada anda em cima da água."},
  chapada: {city: "cuiaba", n: "Chapada dos Guimarães", s: "Chapada", x: 92, y: 84, txt: "Lá em cima, a serra de arenito vermelho: cerrado de árvore torta, cachoeira caindo do paredão e arara no fim da tarde. De noite, um grito de gente que não é gente."},
  pantanal: {city: "cuiaba", n: "Pantanal", x: 140, y: 262, txt: "Rio abaixo, a planície que alaga: capim alto, baías de água parada, corixo cortando o campo e bicho de todo lado. Tuiuiú, arara-azul, jacaré às centenas... e, de noite, o barranco que desaba sozinho."},
  ladeiras: {city: "ouropreto", n: "Ladeiras de Ouro Preto", s: "Ladeiras", x: 120, y: 240, txt: "Ruas de pedra que sobem e descem entre igreja e casarão, com quintal de mata no meio. De dia, bicho e espertalhão vendendo ouro de tolo; de noite, um assobio e um redemoinho no meio da rua."},
  tiradentes: {city: "ouropreto", n: "Praça Tiradentes", s: "Praça", x: 248, y: 150, txt: "O coração de Ouro Preto: a praça no alto do morro, o museu, a igreja, casarão colorido de janela azul, pensão e o povo da cidade, que fala devagar e conta causo."},
  serracurral: {city: "bh", n: "Serra do Curral", s: "Serra", x: 150, y: 282, txt: "A serra que fecha Belo Horizonte pelo sul: campo de pedra cor de ferro, mata nas grotas e a cidade inteira lá embaixo. De noite, dizem, uma árvore seca anda pela trilha."},
  mercadocentral: {city: "bh", n: "Mercado Central", s: "Mercado", x: 226, y: 196, txt: "O mercado mais famoso de Minas: queijo da Canastra, doce de leite, pimenta, gaiola de passarinho e cheiro de pão de queijo. Do lado, a pensão e uns mineiros de prosa comprida."},
  portocuiaba: {city: "cuiaba", n: "Porto de Cuiabá", s: "Porto", x: 268, y: 206, txt: "O bairro mais velho de Cuiabá, na beira do rio: o mercado do peixe, casario baixo, rede na pensão e gente que fala \"tchá\" e \"pai do céu\" em toda frase."},
  olinda: {city: "recife", n: "Olinda", x: 250, y: 70, txt: "A cidade alta, vizinha do Recife: ladeira de pedra, igreja no alto, casario colorido e quintal cheio de bicho. De noite, dizem, um boneco gigante desce a ladeira sozinho."},
  recifeantigo: {city: "recife", n: "Recife Antigo", x: 300, y: 170, txt: "O bairro do Recife Antigo, no Marco Zero: casarão colorido, rua de pedra, o rio Capibaribe chegando no mar e um cordelista que precisa de um programador."},
  trocatroca: {city: "teresina", n: "Troca-Troca", x: 260, y: 170, txt: "O mercado do Troca-Troca, no centro de Teresina: rede, cerâmica, cajuína gelada e gente pechinchando. Tem pensão e comida."},
  encontro: {city: "teresina", n: "Encontro dos rios", x: 120, y: 120, txt: "Onde o Poti deságua no Parnaíba: praia de rio, mata ciliar, lontra, jacaré... e, nas noites de cheia, o Cabeça de Cuia."},
  lencois: {city: "saoluis", n: "Lençóis", x: 186, y: 64, txt: "Dunas brancas até onde a vista alcança e, entre elas, lagoas azuis de água da chuva. Pouca sombra e muito bicho bravo com o sol."},
  mangueilha: {city: "saoluis", n: "Manguezal da ilha", x: 104, y: 214, txt: "O mangue da ilha de São Luís, onde a maré sobe e desce metros: guará vermelho, siri, carcará... e um peixe do tamanho de uma canoa no canal."},
  praiagrande: {city: "saoluis", n: "Praia Grande", x: 214, y: 168, txt: "O centro histórico de São Luís: ladeira de pedra, casarão coberto de azulejo português e a feira da praia. Tem pensão, comida e gente que conta história."},
  veropeso: {city: "belem", n: "Ver-o-Peso", x: 252, y: 250, txt: "A feira mais famosa do Pará, na beira da baía: peixe, açaí, erva de cheiro, urubu no telhado de ferro... e rede na pensão."},
  cidadevelha: {city: "belem", n: "Cidade Velha", x: 128, y: 266, txt: "Rua de pedra, casarão de azulejo e praça com mangueira. Pombo, gato, iguana... e malandro de olho na bolsa."},
  porto: {city: "belem", n: "Porto e Docas", x: 86, y: 160, txt: "Galpão velho, guindaste e barco chegando de todo canto. Rato do tamanho de gato e golpista esperando quem desce."},
  baixadas: {city: "belem", n: "Baixadas", x: 262, y: 146, txt: "Do outro lado do canal, palafitas ligadas por pontes de tábua. Na maré cheia, a rua vira rio."}
};
/* cada cidade tem o seu mapa local (viewBox 440x325): a trilha única em ordem (route), o contorno (land), o rio ou
   canal que a trilha cruza (com as pontes calculadas) e a estrada que sai do mapa (road), com a placa (sign);
   look = terreno do mapa (mata, cidade, litoral ou sertão; sem look, mata) */
const CITY = {
  ananindeua: {n: "Jasytatá", map: "norte", cabin: false, route: ["aldeia", "feira", "mata", "fechada", "rio", "igarape", "manguezal", "seringal", "varzea", "parada"],
    land: "10,70 60,20 190,8 305,18 395,55 430,140 428,235 398,300 300,316 170,314 60,304 12,255 5,160",
    river: "M318,24 C305,70 358,96 346,140 C334,190 300,222 316,318", road: "M52,62 C34,44 18,32 -4,26", sign: [6, 18, "← Belém"], home: "aldeia", gate: "parada"},
  belem: {n: "Belém", look: "cidade", map: "norte", cabin: false, route: ["terminal", "veropeso", "cidadevelha", "porto", "baixadas"],
    land: "40,40 150,14 300,10 400,40 432,130 430,240 400,300 300,316 160,316 40,300 22,230 36,150 20,90",
    bay: "M0,0 L44,0 C28,40 46,80 28,110 C40,150 22,200 38,240 C28,270 34,300 46,325 L0,325Z",   // baía do Guajará
    river: "M206,20 C190,70 214,116 186,160 C170,190 160,204 150,214", road: "M392,262 C410,276 424,286 446,292", sign: [366, 320, "Tapajós →"], home: "veropeso", gate: "terminal"},
  // São Luís (Nordeste): a ilha, com o rio Anil e a estrada para o aeroporto; a Praia Grande, o manguezal e os Lençóis
  saoluis: {n: "São Luís", look: "litoral", map: "nordeste", route: ["praiagrande", "mangueilha", "lencois"], cabin: false,
    land: "30,120 80,60 170,30 280,26 370,56 420,120 426,210 390,280 300,312 180,316 80,290 26,220",
    bay: "M0,0 L120,0 C90,30 60,60 34,96 C20,130 12,170 0,190Z",   // baía de São Marcos
    river: "M260,40 C250,90 236,120 226,150 C214,186 236,230 230,290", road: "M262,200 C320,230 380,250 446,262", sign: [350, 290, "✈ Aeroporto"], home: "praiagrande", gate: "praiagrande"},
  // Teresina (Nordeste): entre o Parnaíba (oeste) e o Poti (leste), que se encontram ao norte; a estrada vai para São Luís
  teresina: {n: "Teresina", look: "sertao", map: "nordeste", route: ["trocatroca", "encontro"], cabin: false,
    land: "40,40 180,20 320,30 420,90 430,200 400,290 280,316 150,312 50,280 20,170",
    river: "M60,320 C90,240 70,160 110,100 C130,70 150,40 160,0", road: "M300,200 C350,220 400,250 446,270", sign: [340, 300, "São Luís →"], home: "trocatroca", gate: "trocatroca"},
  // Recife (Nordeste): o Recife Antigo, numa ilha entre o Capibaribe e o mar; a estrada vai para Teresina. Olinda vem depois
  recife: {n: "Recife", look: "litoral", map: "nordeste", route: ["recifeantigo", "olinda"], cabin: false,
    land: "20,40 160,20 330,30 420,80 430,200 400,290 260,316 120,312 30,270 10,160",
    bay: "M330,0 L440,0 L440,325 L410,325 C400,240 420,160 380,90 C360,50 340,20 330,0Z",   // o mar
    river: "M0,200 C80,190 160,210 240,180 C300,160 330,170 370,150", road: "M120,200 C80,230 40,250 -6,262", sign: [8, 300, "← Teresina"], home: "recifeantigo", gate: "recifeantigo"},
  // Petrolina (Nordeste, sertão): a orla do São Francisco, embaixo, e a caatinga subindo para o norte; a estrada vai para Recife
  petrolina: {n: "Petrolina", look: "sertao", map: "nordeste", route: ["orla", "caatinga", "serra", "beira"], cabin: false,
    land: "30,30 170,16 320,26 420,70 432,190 400,250 300,262 160,266 40,250 12,140",
    bay: "M0,250 C80,268 180,272 300,262 C360,256 400,262 440,250 L440,325 L0,325Z",   // o rio São Francisco
    river: "M0,262 C80,280 180,284 300,274 C360,268 400,274 440,262", road: "M300,210 C350,190 400,170 446,160", sign: [356, 150, "Recife →"], home: "orla", gate: "orla"},
  // Cuiabá (Centro-Oeste): o rio Cuiabá descendo pelo meio, com o Porto na margem leste; a estrada atravessa a ponte para
  // Várzea Grande, onde fica o aeroporto. Pantanal e Chapada vêm depois
  cuiaba: {n: "Cuiabá", look: "cerrado", map: "centroeste", route: ["portocuiaba", "pantanal", "chapada"], cabin: false,
    land: "30,40 170,18 320,24 420,80 432,200 400,290 280,316 150,312 40,280 14,160",
    river: "M150,0 C170,60 190,110 200,160 C210,210 180,260 170,325", road: "M268,206 C190,200 120,190 60,170 C40,164 20,160 -6,156", sign: [10, 146, "← ✈ Aeroporto"], home: "portocuiaba", gate: "portocuiaba"},
  // Bonito (Centro-Oeste, Mato Grosso do Sul): o rio Formoso cortando a serra da Bodoquena; a estrada sobe para Cuiabá.
  // O centro, o Rio da Prata e a Gruta do Lago Azul
  bonito: {n: "Bonito", look: "cerrado", map: "centroeste", route: ["centrobonito", "rioprata", "gruta"], cabin: false,
    land: "26,50 160,20 320,26 420,84 430,200 396,292 270,316 140,312 40,276 14,160",
    river: "M60,0 C90,80 200,110 230,180 C250,230 220,280 240,325", road: "M300,150 C340,110 390,70 446,40", sign: [360, 30, "Cuiabá →"], home: "centrobonito", gate: "centrobonito"},
  // Brasília (Centro-Oeste): o Plano Piloto no meio, o Lago Paranoá à direita e um córrego do cerrado; a estrada sai para
  // Bonito pelo oeste. O Plano Piloto e o Parque Nacional, lá em cima
  brasilia: {n: "Brasília", look: "cerrado", map: "centroeste", route: ["planopiloto", "parquebsb"], cabin: false,
    land: "24,40 170,16 330,22 420,80 432,200 396,292 270,316 140,312 40,278 12,160",
    bay: "M330,0 L440,0 L440,325 L360,325 C330,280 350,240 320,200 C300,170 330,120 310,80 C300,50 320,20 330,0Z",   // Lago Paranoá
    river: "M110,0 C120,80 96,160 124,325", road: "M214,172 C160,190 90,200 -6,214", sign: [8, 236, "← Bonito"], home: "planopiloto", gate: "planopiloto"},
  // Belo Horizonte (Sudeste): o centro no meio das serras, o ribeirão Arrudas cortando a cidade e a estrada subindo para
  // o norte, até o Aeroporto de Confins. O Mercado Central e a Serra do Curral, lá embaixo, depois do ribeirão
  bh: {n: "Belo Horizonte", look: "minas", map: "sudeste", route: ["mercadocentral", "serracurral"], cabin: false,
    land: "26,44 170,18 320,24 420,80 432,200 400,290 280,316 150,312 40,280 14,160",
    river: "M0,236 C90,226 160,250 240,236 C320,222 380,240 440,226", road: "M226,196 C240,140 270,90 300,40 C310,24 316,10 320,-6", sign: [326, 18, "✈ Confins ↑"], home: "mercadocentral", gate: "mercadocentral"},
  // Ouro Preto (Sudeste): a Praça Tiradentes no alto, as ladeiras descendo para o sudoeste e o ribeirão do Funil lá
  // embaixo; a estrada sobe para Belo Horizonte, ao norte
  ouropreto: {n: "Ouro Preto", look: "minas", map: "sudeste", route: ["tiradentes", "ladeiras"], cabin: false,
    land: "26,44 170,18 320,24 420,80 432,200 400,290 280,316 150,312 40,280 14,160",
    river: "M0,290 C100,280 180,300 260,286 C340,272 390,290 440,280", road: "M248,150 C270,110 300,70 330,30 C336,20 340,10 344,-6", sign: [350, 18, "Belo Horizonte ↑"], home: "tiradentes", gate: "tiradentes"}
};
/* Segredos das trilhas do Norte (systems/secrets.js): o que fecha o recanto escondido de cada fase (n, d), o elemento
   que abre (elem, usado fora da batalha), a comida do baú (item) e a lembrança que o Pajé conta ao abrir (lore). */
const SECRETS = {
  mata:     {elem: "fogo", item: "mandioca", n: "Moita seca", d: "Uma moita seca e espinhenta tapa um vão no meio do mato. Do outro lado tem alguma coisa.",
    lore: "Ali no fundo da mata o menino achou o baú que eu tinha escondido quando era moço. Esqueci de contar pra ele. Tava lá, me esperando."},
  fechada:  {elem: "planta", item: "peixe", n: "Cipoal", d: "Um cipoal grosso e trançado fecha a passagem. Dá pra puxar os cipós, se tiver jeito.",
    lore: "Os mateiros antigos guardavam comida no meio do cipoal. Bicho nenhum passa por ali. Gente esperta passa."},
  rio:      {elem: "agua", item: "peixe", n: "Barranco de barro seco", d: "Um barranco de barro seco e rachado. Molhado, ele desmancha.",
    lore: "Na seca o rio recua e o barro endurece igual pedra. Na cheia, desmancha. O menino só fez a cheia chegar mais cedo."},
  igarape:  {elem: "vento", item: "acai", n: "Monte de folhas", d: "Um monte de folhas secas, alto que só, esconde um buraco no mato. Um vento forte espalhava tudo.",
    lore: "Debaixo das folhas do igarapé tem caminho que só o Boto conhece. E agora o Rhanon. O Boto não gostou muito, não."},
  manguezal: {elem: "planta", item: "acai", n: "Raízes trançadas", d: "As raízes das árvores alagadas se trançaram e fecharam um vão na água rasa.",
    lore: "No igapó, a cheia sobe até a copa das árvores e o peixe come fruta. Escondido nas raízes, o menino achou o que um pescador deixou pra trás."},
  seringal: {elem: "fogo", item: "manicoba", n: "Galhada seca", d: "Galhos secos de seringueira velha empilhados. Pegam fogo rapidinho.",
    lore: "No seringal abandonado ficou muita coisa dos seringueiros. Gente que trabalhou muito e ganhou pouco. O menino guardou o que achou com respeito."},
  varzea:   {elem: "vento", item: "manicoba", n: "Capim alto e embolado", d: "Um capinzal alto e embolado, mais alto que o Rhanon. Uma ventania abria caminho.",
    lore: "Os búfalos deitam no capim da várzea e deixam ele todo amassado. Debaixo de um desses ninhos o menino achou um baú. Cheirava a búfalo."},
  cidadevelha: {elem: "raio", item: "acai", n: "Portão com trava elétrica", d: "Um portão de ferro antigo com uma trava elétrica quebrada. Sem energia, não abre.",
    lore: "Os casarões da Cidade Velha guardam quintal escondido. Tem um que ninguém abria fazia cem anos. O menino abriu com um raio. Imagina a cara do vizinho."},
  porto:    {elem: "raio", item: "peixe", n: "Grade do depósito", d: "A grade de um depósito velho do porto, com uma trava elétrica sem força.",
    lore: "No porto tudo chega e tudo sai. Num depósito esquecido o menino achou o que um barco deixou e ninguém veio buscar."},
  baixadas: {elem: "agua", item: "manicoba", n: "Lama seca", d: "Um monte de lama seca tapa o vão entre duas casas. Com água, ela amolece.",
    lore: "Nas Baixadas o povo vive com a maré: ela sobe, ela desce, ela leva e traz. Naquele canto ela trouxe um presente."}
};
/* Clima do Norte: um por dia, sorteado pelo número do dia (o mesmo dia tem sempre o mesmo tempo, sem campo no save).
   boost = quanto cada elemento pesa na batalha; more = bichos que aparecem mais; dodge = chance (%) do golpe do bicho
   passar raspando. fight = aviso no começo da luta. Cada região nova terá o próprio clima (WEATHER_ODDS por cidade). */
const WEATHER = {
  limpo:    {n: "Tempo bom"},
  chuva:    {n: "Chuva", boost: {agua: 1.2, raio: 1.2, fogo: .8}, more: ["sapo", "ariranha", "poraque", "jacaretinga"], fight: "Tá chovendo: água e raio ficam mais fortes, e o fogo mais fraco."},
  neblina:  {n: "Neblina", dodge: 12, more: ["coruja", "garca", "soco"], fight: "Neblina: às vezes o golpe do bicho passa raspando."},
  mormaco:  {n: "Mormaço", boost: {fogo: 1.2, agua: .9}, more: ["calango", "iguana"], fight: "Mormaço: o fogo fica mais forte."},
  ventania: {n: "Ventania", boost: {vento: 1.2, planta: 1.1}, more: ["harpia", "urubu", "gaivota"], fight: "Ventania: o vento e as folhas ficam mais fortes."}
};
// chance de cada tempo por cidade; Belém tem a chuva da tarde quase todo dia
const WEATHER_ODDS = {ananindeua: [["limpo", 35], ["chuva", 30], ["neblina", 15], ["mormaco", 12], ["ventania", 8]],
  belem: [["limpo", 25], ["chuva", 45], ["neblina", 8], ["mormaco", 14], ["ventania", 8]],
  saoluis: [["limpo", 30], ["chuva", 25], ["neblina", 5], ["mormaco", 25], ["ventania", 15]],   // ilha de muito sol e vento
  petrolina: [["limpo", 45], ["chuva", 5], ["neblina", 5], ["mormaco", 40], ["ventania", 5]],   // sertão: sol e calor quase todo dia
  recife: [["limpo", 30], ["chuva", 35], ["neblina", 5], ["mormaco", 20], ["ventania", 10]],   // litoral: chuva de verão e brisa do mar
  teresina: [["limpo", 35], ["chuva", 10], ["neblina", 5], ["mormaco", 45], ["ventania", 5]],   // a capital mais quente do Brasil
  cuiaba: [["limpo", 35], ["chuva", 20], ["neblina", 5], ["mormaco", 30], ["ventania", 10]],   // calorão do meio do Brasil e chuva de verão
  bonito: [["limpo", 40], ["chuva", 25], ["neblina", 15], ["mormaco", 15], ["ventania", 5]],   // serra de mata: neblina de manhã cedo
  brasilia: [["limpo", 40], ["chuva", 15], ["neblina", 5], ["mormaco", 25], ["ventania", 15]],   // planalto: seca comprida e vento
  ouropreto: [["limpo", 30], ["chuva", 30], ["neblina", 25], ["mormaco", 5], ["ventania", 10]],   // cidade alta: neblina e chuva fina
  bh: [["limpo", 35], ["chuva", 25], ["neblina", 20], ["mormaco", 10], ["ventania", 10]]};   // serra: neblina de manhã e chuva de verão
function weatherOn(day, city = curCity()) {
  if (day <= 1) return "limpo";   // primeiro dia (tutorial): tempo bom
  const odds = WEATHER_ODDS[city] || WEATHER_ODDS.ananindeua;
  let r = seeded(day * 17 + ({belem: 5, saoluis: 11, teresina: 13, recife: 17, petrolina: 19, cuiaba: 23, bonito: 29, brasilia: 31, bh: 37, ouropreto: 41}[city] || 0)) * odds.reduce((a, [, w]) => a + w, 0);
  for (const [k, w] of odds) if ((r -= w) < 0) return k;
  return "limpo";
}
const weatherNow = () => { const w = weatherOn(G.day); return G.night && w === "mormaco" ? "limpo" : w; };   // mormaço some de noite
const weatherBoost = k => (WEATHER[weatherNow()].boost || {})[k] || 1;
const curCity = () => CITY[G.loc] ? G.loc : "ananindeua";
/* voos entre regiões, de ida e volta e de graça (pagos pelo freela da região de onde se sai), sempre liberados. open =
   a região de antes está completa (chefes acalmados e o freela entregue); sem isso, voar para a região nova (de a para b)
   avisa o que falta (flightMissing) e pergunta antes, mas dá para voltar depois. paid = quem paga */
const FLIGHTS = [
  {a: "belem", b: "saoluis", open: () => !!G.portfolio.site_feira && NORTE_BOSSES().every(k => BS()[k]), paid: "O voo de ida e volta é pago pela empresa do site da feira.",
},
  {a: "recife", b: "cuiaba", open: () => !!G.portfolio.app_cordel && NORDESTE_BOSSES().every(k => BS()[k]), paid: "O voo de ida e volta é pago com o dinheiro do app de cordel.",
},
  {a: "brasilia", b: "bh", open: () => !!G.portfolio.mapa_queimadas && CENTROESTE_BOSSES().every(k => BS()[k]), paid: "O voo de ida e volta é pago com o dinheiro do mapa de queimadas.",
}
];
const AIRPORT = {belem: "Aeroporto de Belém", saoluis: "Aeroporto de São Luís", recife: "Aeroporto do Recife", cuiaba: "Aeroporto de Cuiabá", brasilia: "Aeroporto de Brasília", bh: "Aeroporto de Confins"};
// voos de um aeroporto: os de FLIGHTS (que abrem a região nova) e, de lá, voo direto para qualquer outro aeroporto de
// cidade onde o Rhanon já esteve (G.seen da chegada dela); só aeroporto: cidade sem AIRPORT não tem voo
const flightsFrom = c => {
  if (!AIRPORT[c]) return [];
  const own = FLIGHTS.filter(f => f.a === c || f.b === c).map(f => Object.assign({to: f.a === c ? f.b : f.a}, f));
  const more = Object.keys(AIRPORT).filter(k => k !== c && !own.some(f => f.to === k) && G.seen[CITY[k].home]).map(k => ({to: k, a: c, b: k, open: () => true}));
  return [...own, ...more];
};
const flightOpen = (to = "saoluis") => FLIGHTS.some(f => (f.a === to || f.b === to) && f.open());
// o que falta na região de onde o voo sai (chefes sem acalmar e o freela dela), para o aviso antes de partir
function flightMissing(f) {
  const reg = regionOfCity(f.a), all = {norte: NORTE_BOSSES, nordeste: NORDESTE_BOSSES, centroeste: CENTROESTE_BOSSES}[reg]();
  const left = all.filter(k => !BS()[k]).length, out = [];
  if (left) out.push(t(left === 1 ? "1 chefe sem acalmar" : "{n} chefes sem acalmar", {n: left}));
  Object.entries(FREELA_AT).filter(([ph, id]) => regionOfCity(cityOf(ph)) === reg && !G.portfolio[id]).forEach(([, id]) => out.push(t("o freela de {cliente}", {cliente: FREELAS[id].client})));
  return out;
}
const cityOf = k => (SUB[k] && SUB[k].city) || "ananindeua";
const ROUTE = Object.values(CITY).flatMap(c => c.route);   // todos os locais das duas cidades
const EDGES = Object.values(CITY).flatMap(c => c.route.slice(1).map((k, i) => [c.route[i], k]));
/* ônibus da BR-316 entre Ananindeua (cabine da parada) e Belém (terminal): a passagem é comprada uma vez na cabine
   (G.passagem) e vale ida e volta. open = false fecharia Belém de novo (a cabine só mostraria o preço). */
const BUS = {price: 800, open: true};
/* linhas de ônibus do Nordeste, de uma cidade (from) até a outra (chave): cada uma com passagem própria de ida e volta
   (pass = campo em G), vendida no mapa do Nordeste depois de acalmar o chefe de dia da cidade de onde sai (open) */
const BUS_LINES = {
  teresina: {from: "saoluis", price: 900, pass: "passagemTHE", open: () => !!BS().lencois, lock: "O ônibus para Teresina sai depois que a Suçuarana dos Lençóis for acalmada."},
  recife:   {from: "teresina", price: 1000, pass: "passagemREC", open: () => !!BS().encontro, lock: "O ônibus para Recife sai depois que o Surubim do Encontro dos rios for acalmado."},
  petrolina: {from: "recife", price: 1100, pass: "passagemPET", open: () => !!BS().olinda, lock: "O ônibus para Petrolina sai depois que o Teiú-rei de Olinda for acalmado."},
  bonito: {from: "cuiaba", price: 1200, pass: "passagemBON", open: () => !!BS().chapada, lock: "O ônibus para Bonito sai depois que o Lobo-guará-rei da Chapada for acalmado."},
  ouropreto: {from: "bh", price: 1400, pass: "passagemOPR", open: () => !!BS().serracurral, lock: "O ônibus para Ouro Preto sai depois que o Muriqui-rei da Serra do Curral for acalmado."},
  brasilia: {from: "bonito", price: 1300, pass: "passagemBSB", open: () => !!BS().gruta, lock: "O ônibus para Brasília sai depois que a Preguiça-gigante da Gruta do Lago Azul for acalmada."}
};
// linha de ônibus entre as cidades a e b (em qualquer sentido), ou nada
const busLine = (a, b) => (BUS_LINES[b] && BUS_LINES[b].from === a && BUS_LINES[b]) || (BUS_LINES[a] && BUS_LINES[a].from === b && BUS_LINES[a]) || null;
/* Notebook do Rhanon (missão do começo, só em jogo novo; ver HISTORIA.md): o Mateiro entrega quebrado depois do tutorial,
   o técnico da feira vende a BATERIA, o macaco-prego larga o TECLADO e a ariranha o CARREGADOR quando são acalmados, e
   ele liga na tomada da bilheteria do porto do Tapajós. Ligado, chega o primeiro freela e o caderno vira digital. */
const NB_PARTS = ["bateria", "teclado", "carregador"];
const NB_BATTERY = 40;                                     // preço da bateria no técnico
const NB_DROP = {macaco: "teclado", ariranha: "carregador"};   // bicho que larga a peça ao ser acalmado
/* Freelas: um por capital. bugs = lutas em sequência (BUGS em data/animals.js), pay = R$ na entrega, prog = programa que
   fica no notebook (G.portfolio[id]) e dá uma vantagem no jogo. */
// em que fase fica o cliente de cada freela (W no mapa)
const FREELA_AT = {veropeso: "site_feira", recifeantigo: "app_cordel", planopiloto: "mapa_queimadas"};
const FREELAS = {
  site_feira: {n: "Site da feira do Ver-o-Peso", client: "Dona Graça", look: "cliente", bugs: ["bug_loop", "bug_404", "bug_prazo"], pay: 300,
    prog: "Lembranças valem 20% a mais na feira (o site mostra o preço certo).",
    ask: "Preciso de um site pra feira, com o preço das coisas. Pago R$ {n}. Só que o código tá cheio de bug...",
    thanks: "Égua, ficou lindo! Toma, tá pago, e com gorjeta.",
    after: "O site tá bombando, menino! Todo mundo agora sabe o preço das coisas antes de chegar."},
  // Recife: o Seu Dedé, cordelista, quer os folhetos num aplicativo; o programa mostra no caderno o que cada elemento faz
  // nos bichos já enfrentados (elemApp em data/animals.js)
  app_cordel: {n: "App de cordel do Seu Dedé", client: "Seu Dedé", look: "cordelista", bugs: ["bug_memoria", "bug_acento", "bug_mutante"], pay: 500,
    prog: "O caderno mostra o que cada elemento faz nos bichos que você já enfrentou.",
    ask: "Oxente, tu é o programador? Quero meus cordéis num aplicativo, pro povo ler no celular. Pago R$ {n}. Mas o código que me fizeram tá todo bichado...",
    thanks: "Arretado demais! Meus folhetos no celular, com xilogravura e tudo. Toma, que tu mereceu.",
    after: "O povo agora lê cordel até no ônibus, menino. Já tô escrevendo um sobre tu e a lança de pedra da lua."},
  // Brasília: a Iara, da brigada de incêndio do cerrado, precisa de um mapa que mostre os focos de queimada na hora;
  // com ele, os bichos tomados pela fumaça chegam na luta mais fracos (combat.js, init)
  mapa_queimadas: {n: "Mapa de queimadas da brigada", client: "Iara", look: "brigadista", bugs: ["bug_falso", "bug_coordenada", "bug_lento"], pay: 700,
    prog: "A brigada apaga os focos antes: os bichos tomados pela fumaça chegam na luta com 10% menos PV.",
    ask: "Tu que é o programador que veio do Norte? Sou da brigada do cerrado. Preciso de um mapa que mostre os focos de queimada na hora, pra gente chegar antes do fogo. Pago R$ {n}. O sistema que fizeram pra nós vive dando pau...",
    thanks: "Funcionou! Apareceu um foco agorinha lá pros lados do Parque e a equipe já tá indo. Toma, tu salvou muito cerrado hoje.",
    after: "Com o teu mapa a gente chega antes do fogo crescer, menino. Tem bicho vivo hoje por causa de umas linhas de código."}
};
const PENSAO = {descanso: 8, noite: 10, dormir: 15};   // diária da rede na pensão do Ver-o-Peso (barata: não atrapalha a progressão)
// local que só abre depois do chefe de outro (NEED) e a próxima fase na passagem do fim da trilha (NEXT_Z)
const NEED = {ladeiras: "tiradentes", serracurral: "mercadocentral", parquebsb: "planopiloto", gruta: "rioprata", rioprata: "centrobonito", chapada: "pantanal", pantanal: "portocuiaba", beira: "serra", serra: "caatinga", caatinga: "orla", olinda: "recifeantigo", encontro: "trocatroca", lencois: "mangueilha", fechada: "mata", rio: "fechada", igarape: "rio", manguezal: "igarape", seringal: "manguezal", varzea: "seringal", parada: "varzea", porto: "cidadevelha", baixadas: "porto"}, NEXT_Z = {rioprata: "gruta", pantanal: "chapada", serra: "beira", caatinga: "serra", mangueilha: "lencois", mata: "fechada", fechada: "rio", rio: "igarape", igarape: "manguezal", manguezal: "seringal", seringal: "varzea", cidadevelha: "porto", porto: "baixadas"};
/* Itens da bolsa (vendidos na barraca de comida; usados na batalha em "Itens" ou no inventário).
   Para criar um item novo, acrescente uma linha: hp/sp = quanto recupera. */
const ITEMS = {
  mandioca: {n: "Mandioca", price: 10, hp: 15, sp: 0},
  peixe:    {n: "Peixe assado", price: 18, hp: 20, sp: 0},
  acai:     {n: "Açaí", price: 15, hp: 0, sp: 10},
  manicoba: {n: "Maniçoba", price: 45, hp: 30, sp: 15}
};
/* Pedidos dos aldeões (um por vez). giver = aldeão que pede (aldeao1 Mateiro, aldeao2 Ancião, aldeao3 Aldeã);
   need: {kill: bicho, n} (vencer, conta a partir do aceite) ou {pelt: bicho, n} (entregar peles);
   night = só aparece à noite; reward: dinheiro e itens da bolsa. */
const QUESTS = [
  {id: "cotias", giver: "aldeao1", need: {pelt: "cotia", n: 3}, reward: {money: 40, items: {mandioca: 2}},
    text: "As cotias tão roendo a mandioca da roça. Acalma elas e me traz 3 castanhas que elas guardam, que eu te pago.", thanks: "Égua, isso! Agora a roça descansa. Toma, é teu."},
  {id: "chocalho", giver: "aldeao2", need: {pelt: "tatu", n: 2}, reward: {money: 55},
    text: "Quero fazer um chocalho novo pra roda. Preciso de 2 cascos de tatu.", thanks: "Que cascos bonitos! Esse chocalho vai soar longe."},
  {id: "cesta", giver: "aldeao3", need: {kill: "macaco", n: 2}, reward: {money: 30, items: {manicoba: 1}},
    text: "Um macaco-prego roubou minha cesta de novo! Dá um susto em 2 macacos lá na mata, por favor.", thanks: "Agora eles pensam duas vezes antes de voltar. Valeu, maninho!"},
  {id: "queixadas", giver: "aldeao1", lv: 5, need: {kill: "queixada", n: 3}, reward: {money: 90},
    text: "Tem um bando de queixada passando perto da aldeia. Vence 3 deles lá na mata fechada.", thanks: "Pai d'égua, guardião! A aldeia dorme mais tranquila."},
  {id: "piranhas", giver: "aldeao3", lv: 7, need: {kill: "piranha", n: 2}, reward: {money: 70, items: {peixe: 2}},
    text: "As piranhas não deixam ninguém lavar roupa no rio. Acerta 2 delas com flecha.", thanks: "O rio é nosso de novo! Leva esses peixes assados."},
  {id: "morcegos", giver: "aldeao2", night: true, need: {kill: "morcego", n: 3}, reward: {money: 50, items: {acai: 2}},
    text: "Esses morcegos não me deixam dormir. Espanta 3 deles da mata hoje de noite.", thanks: "Silêncio, finalmente. Toma um açaí pra viagem."},
  {id: "penas", giver: "aldeao3", night: true, need: {pelt: "coruja", n: 2}, reward: {money: 45},
    text: "Dizem que pena de coruja traz sonho bom. Me traz 2 penas de coruja?", thanks: "Vou pendurar na rede. Brigada, Rhanon!"},
  {id: "galinhas", giver: "aldeao1", night: true, lv: 5, need: {kill: "chupacabra", n: 1}, reward: {money: 150},
    text: "Alguma coisa tá secando as galinhas de noite... Vai até o fim da mata e acaba com isso.", thanks: "Era o Chupa-cabra mesmo?! Égua, tu é corajoso. Merece isso."}
];
const itemEffect = it => [it.hp && `+${it.hp} PV`, it.sp && `+${it.sp} PE`].filter(Boolean).join(" e ");
/* Equipamentos: para criar um item novo, basta acrescentar uma linha em legs, torso ou weapon.
   look (armas e arcos) = cores do desenho, as mesmas chaves de RIG_PAL (gfx/rig.js): p/P haste e sombra, m ponta,
   band amarração perto da ponta, long ponta comprida; b madeira do arco, fl penas nas pontas do arco. */
const EQUIP = {
  legs:   {tanga: {n: "Tanga", def: 0, lv: 1, price: 0}, short: {n: "Short", def: 2, lv: 3, price: 60, color: "#3b6ea5", shade: "#27496e"},
           brim: {n: "Calça de brim da capital", def: 9, lv: 21, price: 340, color: "#2a3a5a", shade: "#1a2440"}},
  torso:  {regata: {n: "Regata", def: 2, lv: 5, price: 90, color: "#e9e2cf", shade: "#c9bfa4"}},
  weapon: {lanca: {n: "Lança", atk: 0, lv: 1, price: 0}},
  // arma de longe (X na exploração); sem ela, o Rhanon só ataca de perto com a lança
  ranged: {arco: {n: "Arco e flecha", atk: 0, lv: 3, price: 120}}
};
/* Feitos pelo armeiro da feira com peles (craft: {bicho: quantas peles}) mais um pouco de dinheiro (cost). Entram no mesmo
   EQUIP do slot e depois aparecem no inventário para vestir/usar como os outros. */
const CRAFT = {
  weapon: {lanca_dente: {n: "Lança de dente de jacaré", atk: 3, lv: 6, craft: {jacare: 2}, cost: 60, look: {tip: "dente", m: "#f2e6c4", band: "#5a8a3a"}},
           lanca_presa: {n: "Lança da onça", atk: 5, lv: 9, craft: {onca: 2, queixada: 1}, cost: 120, look: {tip: "presa", m: "#fff8e0", band: "#e0a030", long: true}},
           lanca_pirarucu: {n: "Lança de escama de pirarucu", atk: 8, lv: 13, craft: {pirarucu: 1, tracaja: 2}, cost: 160, look: {tip: "osso", m: "#eef0e8", band: "#c8303a", p: "#c9a46a", P: "#8a6a3a", long: true}},
           lanca_chifre: {n: "Lança do Búfalo-touro", atk: 11, lv: 18, craft: {bufalo_touro: 1, bufalo: 2}, cost: 260, look: {tip: "chifre", m: "#4a4044", band: "#d9b25a", p: "#a07a40", P: "#6b4e26", long: true}},
           lanca_aco: {n: "Lança com ponta de aço do porto", atk: 15, lv: 24, craft: {ratao: 1, ratazana: 3}, cost: 380, look: {tip: "aco", m: "#a8bccb", band: "#5a6670", p: "#6b4a2a", P: "#45301a", long: true}}},
  torso:  {colete_sucuri: {n: "Colete de pele trocada de sucuri", def: 4, lv: 8, craft: {sucuri: 2}, cost: 90, color: "#5a7a3a", shade: "#3a5a24"},
           colete_tracaja: {n: "Colete de placas de tracajá", def: 6, lv: 12, craft: {tracaja: 3}, cost: 140, color: "#4a5a3a", shade: "#2e3a24"},
           gibao_bufalo: {n: "Gibão de pelo de búfalo", def: 9, lv: 17, craft: {bufalo: 3, jararaca: 1}, cost: 240, color: "#3a3234", shade: "#221c1e"},
           jaqueta_jacare: {n: "Jaqueta do Jacaré do canal", def: 13, lv: 26, craft: {jacare_canal: 1, cachorro_bravo: 2}, cost: 440, color: "#4a4a2e", shade: "#2e2e1a"}},
  legs:   {calca_anta: {n: "Calça de pelo de anta", def: 3, lv: 7, craft: {anta: 1, capivara: 1}, cost: 70, color: "#5a4a40", shade: "#3a2e28"},
           calca_jacaretinga: {n: "Calça com dentes de jacaretinga", def: 5, lv: 13, craft: {jacaretinga: 2, caranguejo: 1}, cost: 130, color: "#6a7a4a", shade: "#4a5632"},
           perneira_jararaca: {n: "Perneira de pele trocada de jararaca", def: 7, lv: 16, craft: {jararaca: 2, ourico: 1}, cost: 200, color: "#7a6a4a", shade: "#54482e"}},
  ranged: {arco_harpia: {n: "Arco com penas de harpia", atk: 3, lv: 7, craft: {harpia: 1}, cost: 60, look: {b: "#b8844a", fl: "#9aa0a8"}},
           arco_gaviao: {n: "Arco com penas de gavião-real", atk: 6, lv: 17, craft: {gaviao_real: 1, urubu: 2}, cost: 220, look: {b: "#5a3a2a", fl: "#f4f4f4"}},
           arco_gaivota: {n: "Arco de fibra com penas de gaivota", atk: 9, lv: 23, craft: {gaivota: 2, iguana_rei: 1}, cost: 320, look: {b: "#d8c49a", fl: "#ffffff"}}}
};
for (const s in CRAFT) Object.assign(EQUIP[s], CRAFT[s]);
/* Talismãs do Pajé da aldeia (espaço "amulet" do equipamento, um por vez). Cada um sai das peles de um chefe
   (o chefe deixa de 1 a 3 por luta, então dá umas duas ou três revanches) mais um trocado (cost).
   Os dos chefes de dia dão status (atk, def, hp = PV máximo, sp = PE máximo); os da noite dão um efeito (fx, com
   a chance ou a parte em % em ch) e os noturnos mais fortes juntam um status com o efeito. Efeitos (charmFx, combat.js):
   sangra/queima = o golpe pode deixar o bicho sangrando ou queimando; dreno = cura parte do dano dado; turno = chance
   de agir de novo; encanto = chance do bicho perder a vez; esquiva = chance de escapar do golpe; espinho = devolve
   parte do dano recebido. night: true = amuleto de chefe da noite (cor e ícone). */
const CHARMS = {
  t_queixada:   {n: "Talismã do Queixada", lv: 5, craft: {queixada_chefe: 4}, cost: 40, atk: 2},
  t_chupacabra: {n: "Amuleto do Chupa-cabra", lv: 6, craft: {chupacabra: 5}, cost: 60, night: true, fx: "dreno", ch: 20},
  t_onca:       {n: "Talismã da Onça-Rei", lv: 9, craft: {onca_rei: 4}, cost: 80, atk: 4},
  t_mula:       {n: "Amuleto da Mula", lv: 10, craft: {mula: 5}, cost: 100, night: true, fx: "queima", ch: 25},
  t_cobra:      {n: "Talismã da Cobra-Grande", lv: 12, craft: {cobra_grande: 4}, cost: 120, hp: 20},
  t_boitata:    {n: "Amuleto do Boitatá", lv: 13, craft: {boitata: 5}, cost: 130, night: true, fx: "turno", ch: 15},
  t_pirarucu:   {n: "Talismã do Pirarucu", lv: 14, craft: {pirarucu: 4}, cost: 140, def: 3, hp: 15},
  t_boto:       {n: "Amuleto do Boto", lv: 15, craft: {boto_encantado: 5}, cost: 150, night: true, fx: "encanto", ch: 20},
  t_caranguejo: {n: "Talismã do Caranguejo-rei", lv: 16, craft: {caranguejo_rei: 4}, cost: 160, def: 6},
  t_matinta:    {n: "Amuleto da Matinta", lv: 17, craft: {matinta: 5}, cost: 170, night: true, fx: "sangra", ch: 30},
  t_gaviao:     {n: "Talismã do Gavião-real", lv: 18, craft: {gaviao_real: 4}, cost: 180, atk: 5, sp: 10},
  t_curupira:   {n: "Amuleto do Curupira", lv: 19, craft: {curupira: 5}, cost: 190, night: true, atk: 4, fx: "esquiva", ch: 20},
  t_bufalo:     {n: "Talismã do Búfalo-touro", lv: 20, craft: {bufalo_touro: 4}, cost: 200, atk: 6, def: 4},
  t_mapinguari: {n: "Amuleto do Mapinguari", lv: 22, craft: {mapinguari: 5}, cost: 220, night: true, def: 6, fx: "espinho", ch: 30},
  t_iguana:     {n: "Talismã da Iguana-rei", lv: 24, craft: {iguana_rei: 4}, cost: 240, def: 8, hp: 30},
  t_mulher:     {n: "Amuleto da Mulher de Branco", lv: 25, craft: {mulher_branco: 5}, cost: 250, night: true, sp: 15, fx: "turno", ch: 20},
  t_ratao:      {n: "Talismã do Ratão", lv: 26, craft: {ratao: 4}, cost: 260, atk: 8, sp: 15},
  t_norato:     {n: "Amuleto da Cobra Norato", lv: 27, craft: {cobra_norato: 5}, cost: 270, night: true, atk: 8, fx: "sangra", ch: 35},
  t_jacare:     {n: "Talismã do Jacaré do canal", lv: 28, craft: {jacare_canal: 4}, cost: 280, atk: 9, def: 7, hp: 30},
  t_visagem:    {n: "Amuleto da Visagem da maré", lv: 29, craft: {visagem_mare: 5}, cost: 290, night: true, hp: 40, fx: "dreno", ch: 25}
};
EQUIP.amulet = CHARMS;
