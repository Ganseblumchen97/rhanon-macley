/* Bichos, zonas de caça e peles.
   Para criar um bicho novo: acrescente uma linha em ANIMALS e coloque o id no pool de uma zona.
   Visual: um desenho com o mesmo id em gfx/beasts.js (QUADS para quadrúpedes, ou uma função própria),
   ou só um "emoji" provisório. "special" é o ataque especial (ver special() em systems/combat.js).
   "lv" é o nível do bicho: estando ONE_HIT_LEVELS acima dele, o Rhanon abate com um golpe só na exploração. */
const MV = (a, b, c) => ({arranhao: a, bote: b, rugido: c});   // nomes dos 3 golpes: normal, forte e especial
const ANIMALS = [
  {id:"onca", lv:7, name:"Onça-pintuda",hp:60,xp:45,gold:[30,50],damage:[5,14],size:"grande",intro:"Uma onça-pintuda bloqueia a trilha perto do rio. Ela já viu você."},
  {id:"calango", lv:1, name:"Calango",hp:22,xp:12,gold:[5,12],damage:[2,4],size:"pequeno",moves:MV("Mordida","Corrida","Chicotada de cauda"),intro:"Um calango veloz cruza a trilha e se prepara para fugir."},
  {id:"tatu", lv:2, name:"Tatu-galinha",hp:38,xp:28,gold:[15,25],damage:[4,7],size:"médio",moves:MV("Arranhão","Investida","Enrolar-se"),intro:"Um tatu-galinha se fecha em posição defensiva no caminho."},
  {id:"jacare", lv:9, name:"Jacaré",hp:82,xp:68,gold:[40,65],damage:[8,13],size:"grande",moves:MV("Mordida","Bote do jacaré","Caudada"),intro:"Um jacaré enorme bloqueia a margem do rio. Não será uma presa fácil."},
  {id:"preguica", lv:1, name:"Preguiça", hp:30, xp:14, gold:[4,9], damage:[1,3], size:"pequeno", emoji:"🦥", special:"sono", moves:MV("Arranhão lento","Abraço preguiçoso","Cochilo"), intro:"Uma preguiça desce o tronco sem pressa. Ela nem parece ter visto você."},
  {id:"cassaco", lv:2, name:"Cassaco", hp:26, xp:18, gold:[6,12], damage:[2,5], size:"pequeno", emoji:"🦨", special:"fedor", moves:MV("Mordida","Investida","Fedor"), intro:"Um cassaco sai do mato erguendo o rabo de um jeito suspeito."},
  {id:"macaco", lv:3, name:"Macaco-prego", hp:34, xp:24, gold:[8,16], damage:[3,6], size:"médio", emoji:"🐒", special:"roubo", moves:MV("Arranhão","Pulo","Roubo"), intro:"Um macaco-prego observa sua mandioca lá do galho. Ele tem planos."},
  {id:"queixada", lv:6, name:"Queixada", hp:48, xp:34, gold:[14,24], damage:[5,9], size:"médio", emoji:"🐗", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"Um bando de queixadas estala os dentes entre as folhas."},
  {id:"piranha", lv:8, name:"Cardume de piranhas", hp:28, xp:22, gold:[8,14], damage:[2,5], size:"médio", emoji:"🐟", special:"cardume", moves:MV("Mordidas","Frenesi","Cardume"), intro:"A água ferve de repente: um cardume de piranhas sentiu cheiro de sangue."},
  {id:"sucuri", lv:10, name:"Sucuri", hp:70, xp:55, gold:[30,45], damage:[5,9], size:"grande", emoji:"🐍", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"Um tronco se mexe na margem. Era uma sucuri, e ela já está de olho em você."},
  {id:"surucucu", lv:5, name:"Surucucu", hp:44, xp:40, gold:[18,30], damage:[4,8], size:"médio", emoji:"🐍", special:"picada", moves:MV("Mordida","Bote","Picada"), intro:"Entre as folhas secas, uma surucucu se enrola. Um passo errado e acabou."},
  {id:"harpia", lv:7, name:"Harpia", hp:52, xp:48, gold:[22,36], damage:[6,11], size:"grande", emoji:"🦅", special:"mergulho", moves:MV("Garras","Voo rasante","Mergulho"), intro:"Uma harpia pousa no galho mais alto e te encara como presa."},
  {id:"cotia", lv:1, name:"Cotia", hp:20, xp:10, gold:[4,8], damage:[1,3], size:"pequeno", moves:MV("Mordida","Corrida","Guincho"), intro:"Uma cotia rói uma castanha no meio da trilha. Ela para e te encara."},
  {id:"quati", lv:3, name:"Quati", hp:30, xp:20, gold:[7,13], damage:[3,5], size:"médio", special:"roubo", moves:MV("Arranhão","Investida","Roubo"), intro:"Um quati de rabo listrado fareja sua bolsa. Ele quer o que é seu."},
  {id:"tamandua", lv:4, name:"Tamanduá-bandeira", hp:50, xp:32, gold:[12,22], damage:[4,8], size:"médio", special:"abraco", moves:MV("Garrada","Investida","Abraço de tamanduá"), intro:"Um tamanduá-bandeira se levanta nas patas de trás e abre os braços."},
  {id:"jaguatirica", lv:6, name:"Jaguatirica", hp:46, xp:42, gold:[18,30], damage:[5,10], size:"médio", special:"salto", moves:MV("Arranhão","Bote","Salto do galho"), intro:"Olhos amarelos piscam entre as folhas. Uma jaguatirica se prepara para pular."},
  {id:"anta", lv:8, name:"Anta", hp:90, xp:60, gold:[30,46], damage:[6,11], size:"grande", special:"estouro", moves:MV("Mordida","Empurrão","Atropelo"), intro:"O chão treme: uma anta enorme abre caminho pelo mato, direto para você."},
  {id:"caranguejeira", lv:5, name:"Caranguejeira", hp:28, xp:30, gold:[10,18], damage:[3,6], size:"pequeno", special:"picada", moves:MV("Mordida","Pulo","Picada venenosa"), intro:"Uma aranha caranguejeira do tamanho da sua mão sai de um buraco no chão."},
  {id:"capivara", lv:8, name:"Capivara", hp:60, xp:36, gold:[16,26], damage:[3,7], size:"médio", special:"sono", moves:MV("Mordida","Empurrão","Cochilo na lama"), intro:"Uma capivara enorme mastiga capim na margem. Tranquila... até você chegar perto."},
  {id:"ariranha", lv:9, name:"Ariranha", hp:56, xp:50, gold:[22,34], damage:[5,9], size:"médio", special:"frenesi", moves:MV("Mordida","Mergulho","Frenesi"), intro:"Uma ariranha sai da água guinchando. Elas nunca andam sozinhas por muito tempo."},
  {id:"poraque", lv:10, name:"Poraquê", hp:64, xp:62, gold:[26,40], damage:[6,10], size:"médio", special:"choque", moves:MV("Mordida","Bote","Choque"), intro:"A água da margem estala. Um poraquê se enrola, carregado de eletricidade."},  {id:"queixada_chefe", lv:5, boss:true, name:"Queixada-chefe", hp:95, xp:90, gold:[60,80], damage:[6,11], size:"chefe", emoji:"🐗", tint:"saturate(1.6) hue-rotate(-25deg)", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"O maior macho do bando bloqueia a trilha. Os outros esperam atrás dele."},
  {id:"cobra_grande", lv:12, boss:true, name:"Cobra-Grande", hp:125, xp:120, gold:[80,110], damage:[7,12], size:"chefe", emoji:"🐍", tint:"hue-rotate(160deg) saturate(1.4)", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"As águas ficam paradas. Dizem que a Cobra-Grande dorme no fundo do rio... dizem."},
  // bichos da noite (NIGHT_ZONES) e chefes do folclore
  {id:"morcego", lv:2, name:"Morcego", hp:24, xp:18, gold:[5,10], damage:[2,5], size:"pequeno", special:"drenar", moves:MV("Mordida","Rasante","Chupar sangue"), intro:"Um guincho fino corta o escuro. Um morcego dá rasantes em volta da sua cabeça."},
  {id:"coruja", lv:2, name:"Coruja", hp:26, xp:18, gold:[5,10], damage:[2,5], size:"pequeno", special:"mergulho", moves:MV("Bicada","Voo rasante","Mergulho"), intro:"Dois olhos amarelos se acendem num galho. A coruja gira a cabeça e te encara."},
  {id:"lobo", lv:4, name:"Lobo-guará", hp:46, xp:32, gold:[12,22], damage:[4,8], size:"médio", special:"uivo", moves:MV("Mordida","Bote","Uivo"), intro:"Pernas compridas, pelo vermelho e um uivo longo: um lobo-guará fareja a trilha."},
  {id:"morcego_vampiro", lv:7, name:"Morcego-vampiro", hp:40, xp:40, gold:[16,26], damage:[5,9], size:"pequeno", tint:"hue-rotate(-25deg) saturate(1.6) brightness(.8)", special:"drenar", moves:MV("Mordida","Rasante","Chupar sangue"), intro:"Uma nuvem de asas sai do oco de uma árvore. O maior deles mostra os dentes."},
  {id:"morcego_pescador", lv:9, name:"Morcego-pescador", hp:48, xp:48, gold:[20,32], damage:[6,10], size:"médio", tint:"hue-rotate(160deg) saturate(.8)", special:"mergulho", moves:MV("Garras","Rasante","Mergulho"), intro:"Algo grande voa rente à água e arranca um peixe do lago. Agora ele olha para você."},
  {id:"chupacabra", lv:6, boss:true, name:"Chupa-cabra", hp:110, xp:110, gold:[70,90], damage:[5,10], size:"chefe", special:"drenar", moves:MV("Garras","Salto","Chupar o sangue"), intro:"Algo secou as galinhas da aldeia. Os olhos vermelhos no escuro respondem quem foi: o Chupa-cabra."},
  {id:"mula", lv:10, boss:true, name:"Mula sem cabeça", hp:140, xp:150, gold:[100,130], damage:[8,13], size:"chefe", special:"fogo", moves:MV("Coice","Galope","Labareda"), intro:"Ferraduras batendo no escuro e um pescoço em chamas: a Mula sem cabeça corta a mata fechada."},
  {id:"boitata", lv:13, boss:true, name:"Boitatá", hp:160, xp:180, gold:[120,160], damage:[8,13], size:"chefe", special:["prender", "chocalho"], moves:MV("Mordida","Bote de fogo","Encantamento"), intro:"O lago se acende. Uma cobra de fogo de olhos enormes sobe da água: é o Boitatá, guardião da mata."},
  // igarapé (depois do rio): de dia e de noite
  {id:"tracaja", lv:10, name:"Tracajá", hp:78, xp:64, gold:[28,42], damage:[6,11], size:"médio", special:"casco", moves:MV("Mordida","Empurrão","Recolher no casco"), intro:"Um tracajá toma sol num tronco caído. Quando você chega perto, ele estica o pescoço e não foge."},
  {id:"garca", lv:11, name:"Garça-branca", hp:70, xp:70, gold:[30,44], damage:[8,13], size:"médio", special:"mergulho", moves:MV("Bicada","Asa aberta","Bicada certeira"), intro:"Parada numa perna só, uma garça-branca vira o bico comprido na sua direção."},
  {id:"boto", lv:12, name:"Boto-cor-de-rosa", hp:88, xp:80, gold:[34,50], damage:[8,13], size:"grande", special:"cardume", moves:MV("Focinhada","Salto","Redemoinho"), intro:"A água se abre e um boto-cor-de-rosa bufa bem perto. Ele não gosta de visita."},
  {id:"jacaretinga", lv:11, name:"Jacaretinga", tint:"saturate(.6) brightness(1.15) hue-rotate(15deg)", hp:84, xp:72, gold:[32,48], damage:[8,14], size:"grande", moves:MV("Mordida","Bote","Caudada"), intro:"Olhos e narinas na superfície: um jacaretinga espera quieto no igarapé."},
  {id:"sapo", lv:10, name:"Sapo-cururu", hp:66, xp:58, gold:[24,36], damage:[6,11], size:"pequeno", special:"picada", moves:MV("Linguada","Pulo","Leite venenoso"), intro:"Um sapo-cururu do tamanho de um prato coaxa no barranco. As costas brilham de veneno."},
  {id:"pirarucu", lv:14, boss:true, name:"Pirarucu", hp:165, xp:210, gold:[120,160], damage:[9,15], size:"chefe", special:"estouro", moves:MV("Mordida","Rabanada","Pulo para fora d'água"), intro:"Uma sombra de três metros sobe para respirar e afunda de novo. O pirarucu, gigante do igarapé, te viu."},
  {id:"boto_encantado", lv:15, boss:true, name:"Boto encantado", hp:175, xp:230, gold:[130,170], damage:[9,15], size:"chefe", special:["encanto", "drenar"], moves:MV("Focinhada","Salto","Encanto"), intro:"Uma música toca longe e um boto de chapéu branco aparece na beira. Dizem que ele encanta quem anda sozinho de noite."},
  // manguezal (depois do igarapé)
  {id:"caranguejo", lv:12, name:"Caranguejo-uçá", hp:92, xp:84, gold:[34,50], damage:[8,14], size:"médio", special:"prender", moves:MV("Pinçada","Investida de lado","Prender na garra"), intro:"A lama borbulha e um caranguejo-uçá sai da toca com as garras abertas."},
  {id:"guaxinim", lv:13, name:"Mão-pelada", hp:90, xp:88, gold:[36,52], damage:[9,14], size:"médio", special:"roubo", moves:MV("Arranhão","Investida","Mão leve"), intro:"Um mão-pelada lava um caranguejo na água... e larga tudo para olhar a sua bolsa."},
  {id:"macarico", lv:12, name:"Maçarico", hp:80, xp:80, gold:[30,46], damage:[9,14], size:"pequeno", special:"mergulho", moves:MV("Bicada","Corrida na lama","Bicada certeira"), intro:"Um bando de maçaricos corre na beira da lama. Um deles não gostou de você."},
  {id:"caranguejo_rei", lv:16, boss:true, name:"Caranguejo-rei", hp:190, xp:260, gold:[150,190], damage:[10,16], size:"chefe", tint:"hue-rotate(150deg) saturate(1.5)", special:["prender", "estouro"], moves:MV("Pinçada","Martelada de garra","Prender na garra"), intro:"As raízes do mangue estalam. Um caranguejo do tamanho de uma canoa sobe da lama: o Caranguejo-rei."},
  {id:"matinta", lv:17, boss:true, name:"Matinta Perera", hp:195, xp:280, gold:[160,200], damage:[10,17], size:"chefe", special:["assobio", "drenar"], moves:MV("Bengalada","Voo do rasga-mortalha","Assobio"), intro:"Um assobio fino corta a noite: \"fiiit\". Quem não oferece fumo para a Matinta Perera não dorme em paz."},
  // seringal abandonado (depois do manguezal)
  {id:"urubu", lv:14, name:"Urubu-rei", hp:98, xp:96, gold:[38,56], damage:[9,15], size:"médio", tint:"grayscale(.6) brightness(.55) contrast(1.3)", special:"fedor", moves:MV("Bicada","Voo rasante","Vômito"), intro:"Três voltas no céu e um urubu-rei pousa no galho seco. Ele acha que você está com cara de janta."},
  {id:"cobra_cipo", lv:14, name:"Cobra-cipó", hp:90, xp:94, gold:[36,54], damage:[10,15], size:"médio", special:"salto", moves:MV("Mordida","Bote","Bote do galho"), intro:"O que parecia um cipó verde se mexe. A cobra-cipó desce do galho bem na sua frente."},
  {id:"ourico", lv:15, name:"Ouriço-cacheiro", hp:104, xp:100, gold:[40,58], damage:[9,15], size:"médio", special:"espinhos", moves:MV("Mordida","Investida","Chuva de espinhos"), intro:"Um ouriço-cacheiro se arrepia inteiro no tronco de uma seringueira. Cada espinho é uma agulha."},
  {id:"gaviao_real", lv:18, boss:true, name:"Gavião-real", hp:205, xp:300, gold:[170,210], damage:[11,17], size:"chefe", tint:"sepia(.5) saturate(1.4) brightness(.9)", special:"mergulho", moves:MV("Garras","Voo rasante","Mergulho do alto"), intro:"Uma sombra enorme cobre as seringueiras. O gavião-real, dono do céu do seringal, desce para te enfrentar."},
  {id:"curupira", lv:19, boss:true, name:"Curupira", hp:210, xp:320, gold:[180,220], damage:[11,18], size:"chefe", special:["confusao", "fogo"], moves:MV("Pancada","Corrida para trás","Pegadas trocadas"), intro:"Pegadas que vão para o lado errado, um assobio e um cabelo de fogo entre as árvores: o Curupira protege a mata de quem caça demais."},
  // várzea dos búfalos (depois do seringal): a última trilha de Ananindeua antes de Belém
  {id:"bufalo", lv:17, name:"Búfalo", hp:120, xp:110, gold:[44,64], damage:[11,17], size:"grande", special:"estouro", moves:MV("Chifrada","Investida","Estouro na lama"), intro:"Um búfalo levanta a cabeça do capim alagado e bufa. Na várzea, quem manda é ele."},
  {id:"soco", lv:16, name:"Socó-boi", hp:100, xp:104, gold:[40,58], damage:[10,16], size:"médio", special:"mergulho", moves:MV("Bicada","Asa aberta","Bicada certeira"), intro:"Escondido no capim, um socó-boi fica imóvel de bico para o alto... até você chegar perto."},
  {id:"jararaca", lv:17, name:"Jararaca", hp:104, xp:108, gold:[42,62], damage:[11,16], size:"médio", special:"picada", moves:MV("Mordida","Bote","Picada venenosa"), intro:"Um chiado no capim molhado: uma jararaca se arma, de cabeça triangular, pronta para o bote."},
  {id:"bufalo_touro", lv:20, boss:true, name:"Búfalo-touro", hp:235, xp:340, gold:[190,240], damage:[12,19], size:"chefe", tint:"brightness(.75) contrast(1.3) sepia(.3)", special:"estouro", moves:MV("Chifrada","Investida","Estouro da manada"), intro:"A lama treme. O touro da manada, de chifres do tamanho de um remo, abaixa a cabeça e raspa a pata no chão."},
  {id:"mapinguari", lv:22, boss:true, name:"Mapinguari", hp:265, xp:400, gold:[220,280], damage:[13,20], size:"chefe", special:["fedor", "estouro"], moves:MV("Garrada","Pisão","Bocarra"), intro:"Um cheiro horrível e passos pesados no escuro. O Mapinguari, gigante de um olho só, abre a boca que tem na barriga."},
  {id:"onca_rei", lv:9, boss:true, name:"Onça-Rei", hp:140, xp:150, gold:[100,140], damage:[9,15], size:"chefe", tint:"hue-rotate(-20deg) saturate(1.5) brightness(.8)", moves:MV("Arranhão","Bote","Rugido"), intro:"A mata inteira fica em silêncio. A Onça-Rei desce da pedra, e ela não está de passagem."}
];
// zonas de caça: nível mínimo, sorteio com peso [id, peso] e o chefe (aparece após 4 vitórias)
const ZONES = {
  mata:    {n: "Mata", lv: 1, pool: [["preguica",3],["cassaco",3],["calango",3],["tatu",3],["macaco",2],["cotia",3],["quati",2],["tamandua",1]], boss: "queixada_chefe"},
  rio:     {n: "Beira do rio", lv: 2, pool: [["jacare",3],["piranha",3],["sucuri",2],["capivara",3],["ariranha",2],["poraque",2]], boss: "cobra_grande"},
  igarape: {n: "Igarapé", lv: 10, pool: [["tracaja",3],["garca",3],["jacaretinga",2],["ariranha",2],["boto",3],["piranha",1]], boss: "pirarucu"},
  varzea: {n: "Várzea dos búfalos", lv: 16, pool: [["bufalo",3],["soco",3],["jararaca",3],["capivara",1],["jacaretinga",1]], boss: "bufalo_touro"},
  seringal: {n: "Seringal abandonado", lv: 14, pool: [["urubu",3],["cobra_cipo",3],["ourico",3],["guaxinim",1]], boss: "gaviao_real"},
  manguezal: {n: "Manguezal", lv: 12, pool: [["caranguejo",3],["guaxinim",3],["macarico",3],["garca",1],["jacaretinga",1],["piranha",2]], boss: "caranguejo_rei"},
  fechada: {n: "Mata fechada", lv: 3, pool: [["surucucu",3],["onca",2],["harpia",2],["queixada",2],["jaguatirica",3],["anta",1],["caranguejeira",3]], boss: "onca_rei"}
};
// na batalha, estes bichos ficam meio dentro de um laguinho (os outros, no chão de terra)
const WATER_BATTLE = new Set(["piranha", "poraque", "jacare", "ariranha", "sucuri", "cobra_grande", "boitata", "boto", "jacaretinga", "pirarucu", "boto_encantado", "tracaja"]);
// à noite (G.night) cada zona tem outros bichos e um chefe do folclore; o resto (mapa, passagem) é o mesmo
const NIGHT_ZONES = {
  mata:    {pool: [["morcego",3],["coruja",3],["lobo",2],["cassaco",2],["tatu",1]], boss: "chupacabra"},
  fechada: {pool: [["morcego_vampiro",3],["lobo",2],["onca",2],["jaguatirica",2],["caranguejeira",2],["surucucu",2]], boss: "mula"},
  rio:     {pool: [["jacare",3],["sucuri",2],["poraque",2],["morcego_pescador",3],["capivara",1]], boss: "boitata"},
  igarape: {pool: [["sapo",3],["jacaretinga",3],["morcego_pescador",2],["boto",2],["poraque",1]], boss: "boto_encantado"},
  manguezal: {pool: [["guaxinim",3],["caranguejo",3],["morcego_vampiro",2],["coruja",2],["poraque",1]], boss: "matinta"},
  seringal: {pool: [["ourico",3],["cobra_cipo",3],["urubu",2],["morcego_vampiro",2]], boss: "curupira"},
  varzea: {pool: [["bufalo",3],["jararaca",3],["morcego_vampiro",2],["sapo",2],["boto",1]], boss: "mapinguari"}
};
const zoneDef = z => G.night && NIGHT_ZONES[z] ? {...ZONES[z], ...NIGHT_ZONES[z], n: ZONES[z].n + " à noite"} : ZONES[z];
// chefe vencido: de dia é a zona; à noite, "zona:noite" (os chefes do folclore não abrem passagens)
const bossKey = z => G.night && NIGHT_ZONES[z] ? z + ":noite" : z;
// nome do item que cada bicho deixa (os outros viram "Pele de <bicho>")
const PELT = {morcego: "Asas de morcego", coruja: "Penas de coruja", lobo: "Pelo de lobo-guará", morcego_vampiro: "Asas de morcego-vampiro", morcego_pescador: "Asas de morcego-pescador",
  chupacabra: "Presas do Chupa-cabra", mula: "Ferradura em brasa", boitata: "Escama de fogo do Boitatá", piranha: "Escamas de piranha", jacare: "Couro de jacaré", sucuri: "Couro de sucuri", surucucu: "Couro de surucucu", cobra_grande: "Couro da Cobra-Grande", harpia: "Penas de harpia", tatu: "Casco de tatu", calango: "Couro de calango", poraque: "Couro de poraquê", caranguejeira: "Presas de caranguejeira", ariranha: "Pele de ariranha", tamandua: "Pelos de tamanduá",
  tracaja: "Casco de tracajá", garca: "Penas de garça", boto: "Dente de boto", jacaretinga: "Couro de jacaretinga", sapo: "Pele de sapo-cururu", pirarucu: "Escamas de pirarucu", boto_encantado: "Chapéu do Boto",
  caranguejo: "Casco de caranguejo", guaxinim: "Pelo de mão-pelada", macarico: "Penas de maçarico", caranguejo_rei: "Garra do Caranguejo-rei", matinta: "Xale da Matinta",
  urubu: "Penas de urubu-rei", cobra_cipo: "Couro de cobra-cipó", ourico: "Espinhos de ouriço", gaviao_real: "Penas de gavião-real", curupira: "Mecha de fogo do Curupira",
  bufalo: "Couro de búfalo", soco: "Penas de socó", jararaca: "Couro de jararaca", bufalo_touro: "Chifre do Búfalo-touro", mapinguari: "Pelo do Mapinguari"};
// curiosidades do caderno de bichos (fauna de verdade; os chefes do folclore ganham a lenda)
const ANIMAL_FACTS = {
  onca: "Maior felino das Américas. Nada muito bem e tem a mordida mais forte entre os felinos.",
  calango: "Lagarto rápido que adora tomar sol nas pedras para esquentar o corpo.",
  tatu: "Cava tocas com as garras fortes e, quando se assusta, corre para dentro delas.",
  jacare: "Pode passar mais de uma hora debaixo d'água sem respirar.",
  preguica: "Desce da árvore só uma vez por semana, mais ou menos, para fazer cocô.",
  cassaco: "É o gambá: carrega os filhotes nas costas e se finge de morto quando está em perigo.",
  macaco: "Usa pedras como ferramenta para quebrar cocos e castanhas.",
  queixada: "Anda em bandos de dezenas e bate os dentes para assustar quem chega perto.",
  piranha: "Os dentes se encaixam como os de uma tesoura. Mas a maioria come mais frutas e restos do que gente acha.",
  sucuri: "Uma das maiores cobras do mundo. Não tem veneno: aperta a presa até ela parar de respirar.",
  surucucu: "A maior cobra venenosa das Américas. Sente o calor dos bichos no escuro.",
  harpia: "Uma das águias mais fortes do mundo. Caça macacos e preguiças no alto das árvores.",
  cotia: "Enterra castanhas para comer depois, esquece algumas e acaba plantando árvores.",
  quati: "Usa o focinho comprido para fuçar insetos e frutas no chão e nas árvores.",
  tamandua: "Come até 30 mil formigas e cupins por dia com a língua comprida e pegajosa.",
  jaguatirica: "Cada uma tem um desenho de pintas único, como uma impressão digital.",
  anta: "Maior mamífero terrestre do Brasil. Planta florestas espalhando sementes pelas fezes.",
  caranguejeira: "Apesar do tamanho, o veneno é fraco para gente. Os pelos das costas é que coçam.",
  capivara: "Maior roedor do mundo. Fica bem à vontade dentro d'água e tem os dedos com membrana.",
  ariranha: "Lontra gigante que vive em família e conversa com vários tipos de guinchos.",
  poraque: "Não é enguia de verdade, mas solta descargas elétricas de mais de 600 volts.",
  morcego: "Acha o caminho no escuro ouvindo o eco dos próprios guinchos.",
  coruja: "Consegue girar a cabeça quase uma volta inteira, sem mexer o corpo.",
  lobo: "O lobo-guará tem pernas longas para ver por cima do capim. Adora comer a fruta-do-lobo.",
  morcego_vampiro: "Só bebe sangue, mas tão pouquinho que o bicho mordido quase nem percebe.",
  morcego_pescador: "Pesca com as garras dos pés, voando rente à água de noite.",
  queixada_chefe: "O mais velho do bando. Onde ele vai, os outros queixadas vão atrás.",
  cobra_grande: "Lenda da Amazônia: uma cobra enorme que dorme no fundo dos rios e faz as águas mudarem de lugar.",
  onca_rei: "Dizem os mais velhos que ela é a dona da mata fechada e que nenhum caçador volta igual depois de vê-la.",
  chupacabra: "Lenda das Américas: um bicho de olhos vermelhos que aparece de noite e seca as criações.",
  mula: "Lenda brasileira: uma mula sem cabeça que solta fogo pelo pescoço e galopa nas noites de quinta para sexta.",
  boitata: "Lenda tupi: uma cobra de fogo de olhos enormes que protege a mata de quem a queima.",
  tracaja: "Tartaruga de rio da Amazônia. As fêmeas sobem nas praias de areia para enterrar os ovos na seca.",
  garca: "Pesca parada como estátua, numa perna só, e arpoa o peixe com o bico num golpe rápido.",
  boto: "O boto-cor-de-rosa fica mais rosado com a idade e consegue virar o pescoço, coisa rara entre os golfinhos.",
  jacaretinga: "Menor que o jacaré-açu, tem uma \"ponte\" de osso entre os olhos, como se usasse óculos.",
  sapo: "O cururu solta um leite venenoso pelas glândulas atrás da cabeça quando é apertado.",
  pirarucu: "Um dos maiores peixes de água doce do mundo. Sobe para respirar ar a cada poucos minutos, e as escamas viram lixa.",
  boto_encantado: "Lenda da Amazônia: nas noites de festa o boto vira um moço de branco, de chapéu para esconder o furo da cabeça, e encanta quem passa.",
  caranguejo: "O caranguejo-uçá vive em tocas na lama do mangue e troca de casca para crescer. Na época de acasalar, sai todo mundo de uma vez: é a \"andada\".",
  guaxinim: "O mão-pelada tem as patas da frente sem pelo, como mãos, e costuma molhar a comida antes de comer.",
  macarico: "Muitos maçaricos voam milhares de quilômetros do norte do mundo até as praias e mangues do Pará.",
  caranguejo_rei: "Os catadores contam de um caranguejo velho e enorme que nunca sai da toca de dia e manda no mangue inteiro.",
  matinta: "Lenda do Pará: uma velha que vira pássaro e assobia de noite. Quem promete fumo para ela, no outro dia recebe a visita da velha cobrando.",
  urubu: "O urubu-rei tem a cabeça colorida e o faro mais fino entre os urubus: os outros esperam ele abrir a carcaça.",
  cobra_cipo: "Fina e comprida, some no meio dos galhos. Caça lagartos e sapos no alto das árvores.",
  ourico: "O ouriço-cacheiro não lança espinhos: eles soltam fácil e grudam em quem encosta.",
  gaviao_real: "Outro nome da harpia, a águia mais forte das Américas. Cada casal precisa de um pedaço enorme de mata só para si.",
  curupira: "Lenda tupi: um menino de cabelo vermelho com os pés virados para trás, que confunde os caçadores com pegadas ao contrário.",
  bufalo: "Os búfalos chegaram ao Pará há mais de cem anos e se deram tão bem na Ilha de Marajó que lá até a polícia anda montada neles.",
  soco: "O socó-boi fica parado de bico para cima no meio do capim e o desenho das penas faz ele sumir na paisagem.",
  jararaca: "Causa a maioria das picadas de cobra no Brasil. Do veneno dela saiu um remédio de pressão usado no mundo todo.",
  bufalo_touro: "O mais velho da manada. Os vaqueiros da várzea contam que nenhuma cerca segura ele quando a água sobe.",
  mapinguari: "Lenda da Amazônia: um gigante peludo de um olho só, com a boca na barriga e um fedor que se sente de longe. Só anda de noite e grita para assustar os caçadores."
};
// jeito de cada bicho se mexer parado (ver makeBeastActor em gfx/actors.js) e brilho dos chefes
const MOTION = {
  sucuri: "sway", surucucu: "sway", cobra_grande: "sway", piranha: "swim", harpia: "hover", macaco: "hop",
  preguica: "slow", tatu: "curl", calango: "jitter", queixada: "snort", queixada_chefe: "snort", jacare: "slow2",
  morcego: "hover", morcego_vampiro: "hover", morcego_pescador: "hover", coruja: "hover", boitata: "sway", mula: "snort",
  boto: "swim", pirarucu: "swim", boto_encantado: "swim", sapo: "hop", tracaja: "slow", jacaretinga: "slow2",
  caranguejo: "jitter", caranguejo_rei: "jitter", macarico: "hop", matinta: "slow2",
  urubu: "hover", gaviao_real: "hover", cobra_cipo: "sway", ourico: "curl", curupira: "hop",
  bufalo: "snort", bufalo_touro: "snort", jararaca: "sway", mapinguari: "slow",
};
const AURA = {queixada_chefe: ["#ff8a3a", "#ffd23a"], cobra_grande: ["#7cf2ff", "#b06ad6"], onca_rei: ["#e5001c", "#ffd23a"],
  chupacabra: ["#e5001c", "#7a1a2a"], mula: ["#ff8a3a", "#ffd23a"], boitata: ["#ffd23a", "#ff5a1c"],
  pirarucu: ["#e5001c", "#ff8a3a"], boto_encantado: ["#ff9fd0", "#ffffff"], caranguejo_rei: ["#7cf2ff", "#ffffff"], matinta: ["#b06ad6", "#2a2230"],
  gaviao_real: ["#ffd23a", "#ffffff"], curupira: ["#ff5a1c", "#ffd23a"], bufalo_touro: ["#e5001c", "#ffffff"], mapinguari: ["#9bd34a", "#7a4a2a"]};
