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
  {id:"onca_rei", lv:9, boss:true, name:"Onça-Rei", hp:140, xp:150, gold:[100,140], damage:[9,15], size:"chefe", tint:"hue-rotate(-20deg) saturate(1.5) brightness(.8)", moves:MV("Arranhão","Bote","Rugido"), intro:"A mata inteira fica em silêncio. A Onça-Rei desce da pedra, e ela não está de passagem."}
];
// zonas de caça: nível mínimo, sorteio com peso [id, peso] e o chefe (aparece após 4 vitórias)
const ZONES = {
  mata:    {n: "Mata", lv: 1, pool: [["preguica",3],["cassaco",3],["calango",3],["tatu",3],["macaco",2],["cotia",3],["quati",2],["tamandua",1]], boss: "queixada_chefe"},
  rio:     {n: "Beira do rio", lv: 2, pool: [["jacare",3],["piranha",3],["sucuri",2],["capivara",3],["ariranha",2],["poraque",2]], boss: "cobra_grande"},
  fechada: {n: "Mata fechada", lv: 3, pool: [["surucucu",3],["onca",2],["harpia",2],["queixada",2],["jaguatirica",3],["anta",1],["caranguejeira",3]], boss: "onca_rei"}
};
// na batalha, estes bichos ficam meio dentro de um laguinho (os outros, no chão de terra)
const WATER_BATTLE = new Set(["piranha", "poraque", "jacare", "ariranha", "sucuri", "cobra_grande", "boitata"]);
// à noite (G.night) cada zona tem outros bichos e um chefe do folclore; o resto (mapa, passagem) é o mesmo
const NIGHT_ZONES = {
  mata:    {pool: [["morcego",3],["coruja",3],["lobo",2],["cassaco",2],["tatu",1]], boss: "chupacabra"},
  fechada: {pool: [["morcego_vampiro",3],["lobo",2],["onca",2],["jaguatirica",2],["caranguejeira",2],["surucucu",2]], boss: "mula"},
  rio:     {pool: [["jacare",3],["sucuri",2],["poraque",2],["morcego_pescador",3],["capivara",1]], boss: "boitata"}
};
const zoneDef = z => G.night && NIGHT_ZONES[z] ? {...ZONES[z], ...NIGHT_ZONES[z], n: ZONES[z].n + " à noite"} : ZONES[z];
// chefe vencido: de dia é a zona; à noite, "zona:noite" (os chefes do folclore não abrem passagens)
const bossKey = z => G.night && NIGHT_ZONES[z] ? z + ":noite" : z;
// nome do item que cada bicho deixa (os outros viram "Pele de <bicho>")
const PELT = {morcego: "Asas de morcego", coruja: "Penas de coruja", lobo: "Pelo de lobo-guará", morcego_vampiro: "Asas de morcego-vampiro", morcego_pescador: "Asas de morcego-pescador",
  chupacabra: "Presas do Chupa-cabra", mula: "Ferradura em brasa", boitata: "Escama de fogo do Boitatá", piranha: "Escamas de piranha", jacare: "Couro de jacaré", sucuri: "Couro de sucuri", surucucu: "Couro de surucucu", cobra_grande: "Couro da Cobra-Grande", harpia: "Penas de harpia", tatu: "Casco de tatu", calango: "Couro de calango", poraque: "Couro de poraquê", caranguejeira: "Presas de caranguejeira", ariranha: "Pele de ariranha", tamandua: "Pelos de tamanduá"};
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
  boitata: "Lenda tupi: uma cobra de fogo de olhos enormes que protege a mata de quem a queima."
};
// jeito de cada bicho se mexer parado (ver makeBeastActor em gfx/actors.js) e brilho dos chefes
const MOTION = {
  sucuri: "sway", surucucu: "sway", cobra_grande: "sway", piranha: "swim", harpia: "hover", macaco: "hop",
  preguica: "slow", tatu: "curl", calango: "jitter", queixada: "snort", queixada_chefe: "snort", jacare: "slow2",
  morcego: "hover", morcego_vampiro: "hover", morcego_pescador: "hover", coruja: "hover", boitata: "sway", mula: "snort",
};
const AURA = {queixada_chefe: ["#ff8a3a", "#ffd23a"], cobra_grande: ["#7cf2ff", "#b06ad6"], onca_rei: ["#e5001c", "#ffd23a"],
  chupacabra: ["#e5001c", "#7a1a2a"], mula: ["#ff8a3a", "#ffd23a"], boitata: ["#ffd23a", "#ff5a1c"]};
