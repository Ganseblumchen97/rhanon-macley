/* Bichos, zonas de caça e peles.
   Para criar um bicho novo: acrescente uma linha em ANIMALS e coloque o id no pool de uma zona.
   Visual: use "rows" + "palette" (pixel art em texto), um desenho em SPR (data/sprites.js) com o mesmo id,
   ou só um "emoji" provisório. "special" é o ataque especial (ver special() em systems/combat.js).
   "lv" é o nível do bicho: estando ONE_HIT_LEVELS acima dele, o Rhanon abate com um golpe só na exploração. */
const MV = (a, b, c) => ({arranhao: a, bote: b, rugido: c});   // nomes dos 3 golpes: normal, forte e especial
const ANIMALS = [
  {id:"onca", lv:4, name:"Onça-pintuda",hp:60,xp:45,gold:[30,50],damage:[5,14],size:"grande",rows:ONCA,palette:PAL_O,intro:"Uma onça-pintuda bloqueia a trilha perto do rio. Ela já viu você."},
  {id:"calango", lv:1, name:"Calango",hp:22,xp:12,gold:[5,12],damage:[2,4],size:"pequeno",rows:["....gggg....","...gggggg...","..gggkkggg..",".ggggggggggg","ggggggggggggg","..ggg..ggg..","..kk....kk.."],palette:{g:"#68a84f",k:"#142515"},moves:MV("Mordida","Corrida","Chicotada de cauda"),intro:"Um calango veloz cruza a trilha e se prepara para fugir."},
  {id:"tatu", lv:2, name:"Tatu-galinha",hp:38,xp:28,gold:[15,25],damage:[4,7],size:"médio",rows:[".....kkkk.....","...kkddddkk...","..kddddddddk..",".kddddddddddk.","kddddddddddddk",".kkddddddddkk.","...kkk..kkk..."],palette:{k:"#1a0f0a",d:"#9c6339"},moves:MV("Arranhão","Investida","Enrolar-se"),intro:"Um tatu-galinha se fecha em posição defensiva no caminho."},
  {id:"jacare", lv:5, name:"Jacaré",hp:82,xp:68,gold:[40,65],damage:[8,13],size:"grande",rows:["....gggggg........","..gggggggggg......","gggggkkggggggggggg","ggggggggggggggggggg",".ggggggggggggggggg.","..gggggggggggggg...","...kk....kk..kk...."],palette:{g:"#4d8050",k:"#142515"},moves:MV("Mordida","Bote do jacaré","Caudada"),intro:"Um jacaré enorme bloqueia a margem do rio. Não será uma presa fácil."},
  {id:"preguica", lv:1, name:"Preguiça", hp:30, xp:14, gold:[4,9], damage:[1,3], size:"pequeno", emoji:"🦥", special:"sono", moves:MV("Arranhão lento","Abraço preguiçoso","Cochilo"), intro:"Uma preguiça desce o tronco sem pressa. Ela nem parece ter visto você."},
  {id:"cassaco", lv:1, name:"Cassaco", hp:26, xp:18, gold:[6,12], damage:[2,5], size:"pequeno", emoji:"🦨", special:"fedor", moves:MV("Mordida","Investida","Fedor"), intro:"Um cassaco sai do mato erguendo o rabo de um jeito suspeito."},
  {id:"macaco", lv:2, name:"Macaco-prego", hp:34, xp:24, gold:[8,16], damage:[3,6], size:"médio", emoji:"🐒", special:"roubo", moves:MV("Arranhão","Pulo","Roubo"), intro:"Um macaco-prego observa sua mandioca lá do galho. Ele tem planos."},
  {id:"queixada", lv:3, name:"Queixada", hp:48, xp:34, gold:[14,24], damage:[5,9], size:"médio", emoji:"🐗", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"Um bando de queixadas estala os dentes entre as folhas."},
  {id:"piranha", lv:4, name:"Cardume de piranhas", hp:28, xp:22, gold:[8,14], damage:[2,5], size:"médio", emoji:"🐟", special:"cardume", moves:MV("Mordidas","Frenesi","Cardume"), intro:"A água ferve de repente: um cardume de piranhas sentiu cheiro de sangue."},
  {id:"sucuri", lv:5, name:"Sucuri", hp:70, xp:55, gold:[30,45], damage:[5,9], size:"grande", emoji:"🐍", tint:"hue-rotate(55deg)", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"Um tronco se mexe na margem. Era uma sucuri, e ela já está de olho em você."},
  {id:"surucucu", lv:3, name:"Surucucu", hp:44, xp:40, gold:[18,30], damage:[4,8], size:"médio", emoji:"🐍", tint:"hue-rotate(-45deg) saturate(1.5)", special:"picada", moves:MV("Mordida","Bote","Picada"), intro:"Entre as folhas secas, uma surucucu se enrola. Um passo errado e acabou."},
  {id:"harpia", lv:4, name:"Harpia", hp:52, xp:48, gold:[22,36], damage:[6,11], size:"grande", emoji:"🦅", special:"mergulho", moves:MV("Garras","Voo rasante","Mergulho"), intro:"Uma harpia pousa no galho mais alto e te encara como presa."},
  {id:"queixada_chefe", lv:4, boss:true, name:"Queixada-chefe", hp:95, xp:90, gold:[60,80], damage:[6,11], size:"chefe", emoji:"🐗", tint:"saturate(1.6) hue-rotate(-25deg)", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"O maior macho do bando bloqueia a trilha. Os outros esperam atrás dele."},
  {id:"cobra_grande", lv:7, boss:true, name:"Cobra-Grande", hp:125, xp:120, gold:[80,110], damage:[7,12], size:"chefe", emoji:"🐍", tint:"hue-rotate(160deg) saturate(1.4)", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"As águas ficam paradas. Dizem que a Cobra-Grande dorme no fundo do rio... dizem."},
  {id:"onca_rei", lv:6, boss:true, name:"Onça-Rei", hp:140, xp:150, gold:[100,140], damage:[9,15], size:"chefe", rows:ONCA, palette:PAL_O, tint:"hue-rotate(-20deg) saturate(1.5) brightness(.8)", moves:MV("Arranhão","Bote","Rugido"), intro:"A mata inteira fica em silêncio. A Onça-Rei desce da pedra, e ela não está de passagem."}
];
// zonas de caça: nível mínimo, sorteio com peso [id, peso] e o chefe (aparece após 4 vitórias)
const ZONES = {
  mata:    {n: "Mata", lv: 1, pool: [["preguica",3],["cassaco",3],["calango",3],["tatu",3],["macaco",2]], boss: "queixada_chefe"},
  rio:     {n: "Beira do rio", lv: 2, pool: [["jacare",3],["piranha",3],["sucuri",2]], boss: "cobra_grande"},
  fechada: {n: "Mata fechada", lv: 3, pool: [["surucucu",3],["onca",3],["harpia",2],["queixada",2]], boss: "onca_rei"}
};
// nome do item que cada bicho deixa (os outros viram "Pele de <bicho>")
const PELT = {piranha: "Escamas de piranha", jacare: "Couro de jacaré", sucuri: "Couro de sucuri", surucucu: "Couro de surucucu", cobra_grande: "Couro da Cobra-Grande", harpia: "Penas de harpia", tatu: "Casco de tatu", calango: "Couro de calango"};
// jeito de cada bicho se mexer parado (ver makeBeastActor em gfx/actors.js) e brilho dos chefes
const MOTION = {
  sucuri: "sway", surucucu: "sway", cobra_grande: "sway", piranha: "swim", harpia: "hover", macaco: "hop",
  preguica: "slow", tatu: "curl", calango: "jitter", queixada: "snort", queixada_chefe: "snort", jacare: "slow2"
};
const AURA = {queixada_chefe: ["#ff8a3a", "#ffd23a"], cobra_grande: ["#7cf2ff", "#b06ad6"], onca_rei: ["#e5001c", "#ffd23a"]};
