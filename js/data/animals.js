/* Bichos, zonas de caça e peles.
   Para criar um bicho novo: acrescente uma linha em ANIMALS e coloque o id no pool de uma zona.
   Visual: um desenho com o mesmo id em gfx/beasts.js (QUADS para quadrúpedes, ou uma função própria),
   ou só um "emoji" provisório. "special" é o ataque especial (ver special() em systems/combat.js).
   "lv" é o nível do bicho: estando ONE_HIT_LEVELS acima dele, o Rhanon abate com um golpe só na exploração. */
const MV = (a, b, c) => ({arranhao: a, bote: b, rugido: c});   // nomes dos 3 golpes: normal, forte e especial
const ANIMALS = [
  {id:"onca", lv:7, name:"Onça-pintuda",hp:60,xp:45,gold:[30,50],damage:[5,14],size:"grande",intro:"Uma onça-pintuda fecha a trilha. Ela já viu Rhanon."},
  {id:"calango", lv:1, name:"Calango",hp:22,xp:12,gold:[5,12],damage:[2,4],size:"pequeno",moves:MV("Mordida","Corrida","Chicotada de cauda"),intro:"Um calango cruza a trilha num pique só."},
  {id:"tatu", lv:2, name:"Tatu-galinha",hp:38,xp:28,gold:[15,25],damage:[4,7],size:"médio",moves:MV("Arranhão","Investida","Enrolar-se"),intro:"Um tatu-galinha se fecha todo no meio do caminho."},
  {id:"jacare", lv:9, name:"Jacaré",hp:82,xp:68,gold:[40,65],damage:[8,13],size:"grande",moves:MV("Mordida","Bote do jacaré","Caudada"),intro:"Um jacaré enorme toma conta da margem. Presa fácil não é."},
  {id:"preguica", lv:1, name:"Preguiça", hp:30, xp:14, gold:[4,9], damage:[1,3], size:"pequeno", emoji:"🦥", special:"sono", moves:MV("Arranhão lento","Abraço preguiçoso","Cochilo"), intro:"Uma preguiça desce o tronco sem a menor pressa."},
  {id:"cassaco", lv:2, name:"Cassaco", hp:26, xp:18, gold:[6,12], damage:[2,5], size:"pequeno", emoji:"🦨", special:"fedor", moves:MV("Mordida","Investida","Fedor"), intro:"Um cassaco sai do mato de rabo erguido. Mau sinal."},
  {id:"macaco", lv:3, name:"Macaco-prego", hp:34, xp:24, gold:[8,16], damage:[3,6], size:"médio", emoji:"🐒", special:"roubo", moves:MV("Arranhão","Pulo","Roubo"), intro:"Lá do galho, um macaco-prego olha a mandioca da bolsa. Ele tem planos."},
  {id:"queixada", lv:6, name:"Queixada", hp:48, xp:34, gold:[14,24], damage:[5,9], size:"médio", emoji:"🐗", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"Um bando de queixadas estala os dentes no meio das folhas."},
  {id:"piranha", lv:8, name:"Cardume de piranhas", hp:28, xp:22, gold:[8,14], damage:[2,5], size:"médio", emoji:"🐟", special:"cardume", moves:MV("Mordidas","Frenesi","Cardume"), intro:"A água ferve: um cardume de piranhas sentiu cheiro de sangue."},
  {id:"sucuri", lv:10, name:"Sucuri", hp:70, xp:55, gold:[30,45], damage:[5,9], size:"grande", emoji:"🐍", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"Um tronco se mexe na margem. Não é tronco: é uma sucuri."},
  {id:"surucucu", lv:5, name:"Surucucu", hp:44, xp:40, gold:[18,30], damage:[4,8], size:"médio", emoji:"🐍", special:"picada", moves:MV("Mordida","Bote","Picada"), intro:"Uma surucucu se enrola nas folhas secas. Um passo errado e já era."},
  {id:"harpia", lv:7, name:"Harpia", hp:52, xp:48, gold:[22,36], damage:[6,11], size:"grande", emoji:"🦅", special:"mergulho", moves:MV("Garras","Voo rasante","Mergulho"), intro:"Uma harpia pousa no galho mais alto e encara Rhanon como presa."},
  {id:"cotia", lv:1, name:"Cotia", hp:20, xp:10, gold:[4,8], damage:[1,3], size:"pequeno", moves:MV("Mordida","Corrida","Guincho"), intro:"Uma cotia para de roer a castanha e encara Rhanon."},
  {id:"quati", lv:3, name:"Quati", hp:30, xp:20, gold:[7,13], damage:[3,5], size:"médio", special:"roubo", moves:MV("Arranhão","Investida","Roubo"), intro:"Um quati de rabo listrado fareja a bolsa. Ele quer o que é dos outros."},
  {id:"tamandua", lv:4, name:"Tamanduá-bandeira", hp:50, xp:32, gold:[12,22], damage:[4,8], size:"médio", special:"abraco", moves:MV("Garrada","Investida","Abraço de tamanduá"), intro:"Um tamanduá-bandeira fica em pé e abre os braços."},
  {id:"jaguatirica", lv:6, name:"Jaguatirica", hp:46, xp:42, gold:[18,30], damage:[5,10], size:"médio", special:"salto", moves:MV("Arranhão","Bote","Salto do galho"), intro:"Olhos amarelos piscam nas folhas. Uma jaguatirica vai pular."},
  {id:"anta", lv:8, name:"Anta", hp:90, xp:60, gold:[30,46], damage:[6,11], size:"grande", special:"estouro", moves:MV("Mordida","Empurrão","Atropelo"), intro:"O chão treme: uma anta enorme vem abrindo o mato."},
  {id:"caranguejeira", lv:5, name:"Caranguejeira", hp:28, xp:30, gold:[10,18], damage:[3,6], size:"pequeno", special:"picada", moves:MV("Mordida","Pulo","Picada venenosa"), intro:"Uma caranguejeira do tamanho de uma mão sai do buraco."},
  {id:"capivara", lv:8, name:"Capivara", hp:60, xp:36, gold:[16,26], damage:[3,7], size:"médio", special:"sono", moves:MV("Mordida","Empurrão","Cochilo na lama"), intro:"Uma capivara mastiga capim na margem, tranquila... até Rhanon chegar perto."},
  {id:"ariranha", lv:9, name:"Ariranha", hp:56, xp:50, gold:[22,34], damage:[5,9], size:"médio", special:"frenesi", moves:MV("Mordida","Mergulho","Frenesi"), intro:"Uma ariranha sai da água guinchando. Onde tem uma, tem a família."},
  {id:"poraque", lv:10, name:"Poraquê", hp:64, xp:62, gold:[26,40], damage:[6,10], size:"médio", special:"choque", moves:MV("Mordida","Bote","Choque"), intro:"A água da margem estala: um poraquê carregado de eletricidade."},
  {id:"queixada_chefe", lv:5, boss:true, name:"Queixada-chefe", hp:95, xp:90, gold:[60,80], damage:[6,11], size:"chefe", emoji:"🐗", tint:"saturate(1.6) hue-rotate(-25deg)", special:"estouro", moves:MV("Mordida","Investida","Estouro do bando"), intro:"O maior macho do bando fecha a trilha. Os outros esperam atrás."},
  {id:"cobra_grande", lv:12, boss:true, name:"Cobra-Grande", hp:125, xp:120, gold:[80,110], damage:[7,12], size:"chefe", emoji:"🐍", tint:"hue-rotate(160deg) saturate(1.4)", special:"constricao", moves:MV("Mordida","Bote","Constrição"), intro:"As águas param. Dizem que a Cobra-Grande dorme no fundo do rio... dizem."},
  // bichos da noite (NIGHT_ZONES) e chefes do folclore
  {id:"morcego", lv:2, name:"Morcego", hp:24, xp:18, gold:[5,10], damage:[2,5], size:"pequeno", special:"drenar", moves:MV("Mordida","Rasante","Chupar sangue"), intro:"Um guincho fino no escuro, e um morcego passa raspando a cabeça."},
  {id:"coruja", lv:2, name:"Coruja", hp:26, xp:18, gold:[5,10], damage:[2,5], size:"pequeno", special:"mergulho", moves:MV("Bicada","Voo rasante","Mergulho"), intro:"Dois olhos amarelos se acendem no galho. A coruja gira a cabeça."},
  {id:"lobo", lv:4, name:"Lobo-guará", hp:46, xp:32, gold:[12,22], damage:[4,8], size:"médio", special:"uivo", moves:MV("Mordida","Bote","Uivo"), intro:"Perna comprida, pelo vermelho, uivo longo: um lobo-guará fareja a trilha."},
  {id:"morcego_vampiro", lv:7, name:"Morcego-vampiro", hp:40, xp:40, gold:[16,26], damage:[5,9], size:"pequeno", tint:"hue-rotate(-25deg) saturate(1.6) brightness(.8)", special:"drenar", moves:MV("Mordida","Rasante","Chupar sangue"), intro:"Uma nuvem de asas sai do oco da árvore. O maior mostra os dentes."},
  {id:"morcego_pescador", lv:9, name:"Morcego-pescador", hp:48, xp:48, gold:[20,32], damage:[6,10], size:"médio", tint:"hue-rotate(160deg) saturate(.8)", special:"mergulho", moves:MV("Garras","Rasante","Mergulho"), intro:"Algo voa rente à água e arranca um peixe. Agora olha pra Rhanon."},
  {id:"chupacabra", lv:6, boss:true, name:"Chupa-cabra", hp:110, xp:110, gold:[70,90], damage:[5,10], size:"chefe", special:"drenar", moves:MV("Garras","Salto","Chupar o sangue"), intro:"Olhos vermelhos no escuro. Foi ele que secou as galinhas: o Chupa-cabra."},
  {id:"mula", lv:10, boss:true, name:"Mula sem cabeça", hp:140, xp:150, gold:[100,130], damage:[8,13], size:"chefe", special:"fogo", moves:MV("Coice","Galope","Labareda"), intro:"Ferradura batendo e um pescoço em chamas: a Mula sem cabeça."},
  {id:"boitata", lv:13, boss:true, name:"Boitatá", hp:160, xp:180, gold:[120,160], damage:[8,13], size:"chefe", special:["prender", "chocalho"], moves:MV("Mordida","Bote de fogo","Encantamento"), intro:"O lago se acende e uma cobra de fogo sobe da água: o Boitatá."},
  // igarapé (depois do rio): de dia e de noite
  {id:"tracaja", lv:10, name:"Tracajá", hp:78, xp:64, gold:[28,42], damage:[6,11], size:"médio", special:"casco", moves:MV("Mordida","Empurrão","Recolher no casco"), intro:"Um tracajá toma sol num tronco. Estica o pescoço e não foge."},
  {id:"garca", lv:11, name:"Garça-branca", hp:70, xp:70, gold:[30,44], damage:[8,13], size:"médio", special:"mergulho", moves:MV("Bicada","Asa aberta","Bicada certeira"), intro:"Numa perna só, uma garça-branca aponta o bico comprido."},
  {id:"boto", lv:12, name:"Boto-cor-de-rosa", hp:88, xp:80, gold:[34,50], damage:[8,13], size:"grande", special:"cardume", moves:MV("Focinhada","Salto","Redemoinho"), intro:"Um boto-cor-de-rosa bufa bem perto. Ele não gosta de visita."},
  {id:"jacaretinga", lv:11, name:"Jacaretinga", tint:"saturate(.6) brightness(1.15) hue-rotate(15deg)", hp:84, xp:72, gold:[32,48], damage:[8,14], size:"grande", moves:MV("Mordida","Bote","Caudada"), intro:"Só olhos e narinas fora d'água: um jacaretinga espera quieto."},
  {id:"sapo", lv:10, name:"Sapo-cururu", hp:66, xp:58, gold:[24,36], damage:[6,11], size:"pequeno", special:"picada", moves:MV("Linguada","Pulo","Leite venenoso"), intro:"Um sapo-cururu do tamanho de um prato coaxa no barranco. As costas brilham de veneno."},
  {id:"pirarucu", lv:14, boss:true, name:"Pirarucu", hp:165, xp:210, gold:[120,160], damage:[9,15], size:"chefe", special:"estouro", moves:MV("Mordida","Rabanada","Pulo para fora d'água"), intro:"Uma sombra de três metros sobe pra respirar. O pirarucu viu Rhanon."},
  {id:"boto_encantado", lv:15, boss:true, name:"Boto encantado", hp:175, xp:230, gold:[130,170], damage:[9,15], size:"chefe", special:["encanto", "drenar"], moves:MV("Focinhada","Salto","Encanto"), intro:"Uma música toca longe e um boto de chapéu branco aparece na beira."},
  // manguezal (depois do igarapé)
  {id:"caranguejo", lv:12, name:"Caranguejo-uçá", hp:92, xp:84, gold:[34,50], damage:[8,14], size:"médio", special:"prender", moves:MV("Pinçada","Investida de lado","Prender na garra"), intro:"A lama borbulha e um caranguejo-uçá sai de garras abertas."},
  {id:"guaxinim", lv:13, name:"Mão-pelada", hp:90, xp:88, gold:[36,52], damage:[9,14], size:"médio", special:"roubo", moves:MV("Arranhão","Investida","Mão leve"), intro:"Um mão-pelada larga o caranguejo que lavava e olha pra bolsa."},
  {id:"macarico", lv:12, name:"Maçarico", hp:80, xp:80, gold:[30,46], damage:[9,14], size:"pequeno", special:"mergulho", moves:MV("Bicada","Corrida na lama","Bicada certeira"), intro:"Um bando de maçaricos corre na lama. Um deles não foi com a cara do Rhanon."},
  {id:"caranguejo_rei", lv:16, boss:true, name:"Caranguejo-rei", hp:190, xp:260, gold:[150,190], damage:[10,16], size:"chefe", tint:"hue-rotate(150deg) saturate(1.5)", special:["prender", "estouro"], moves:MV("Pinçada","Martelada de garra","Prender na garra"), intro:"As raízes do mangue estalam. Um caranguejo do tamanho de uma canoa: o Caranguejo-rei."},
  {id:"matinta", lv:17, boss:true, name:"Matinta Perera", hp:195, xp:280, gold:[160,200], damage:[10,17], size:"chefe", special:["assobio", "drenar"], moves:MV("Bengalada","Voo do rasga-mortalha","Assobio"), intro:"Um assobio fino corta a noite: \"fiiit\". Quem não oferece fumo pra Matinta Perera não dorme em paz."},
  // seringal abandonado (depois do manguezal)
  {id:"urubu", lv:14, name:"Urubu-rei", hp:98, xp:96, gold:[38,56], damage:[9,15], size:"médio", tint:"grayscale(.6) brightness(.55) contrast(1.3)", special:"fedor", moves:MV("Bicada","Voo rasante","Vômito"), intro:"Um urubu-rei pousa no galho seco. Acha que Rhanon tem cara de janta."},
  {id:"cobra_cipo", lv:14, name:"Cobra-cipó", hp:90, xp:94, gold:[36,54], damage:[10,15], size:"médio", special:"salto", moves:MV("Mordida","Bote","Bote do galho"), intro:"O cipó verde se mexe. Era uma cobra-cipó."},
  {id:"ourico", lv:15, name:"Ouriço-cacheiro", hp:104, xp:100, gold:[40,58], damage:[9,15], size:"médio", special:"espinhos", moves:MV("Mordida","Investida","Chuva de espinhos"), intro:"Um ouriço-cacheiro se arrepia todo. Cada espinho é uma agulha."},
  {id:"gaviao_real", lv:18, boss:true, name:"Gavião-real", hp:205, xp:300, gold:[170,210], damage:[11,17], size:"chefe", tint:"sepia(.5) saturate(1.4) brightness(.9)", special:"mergulho", moves:MV("Garras","Voo rasante","Mergulho do alto"), intro:"Uma sombra enorme cobre o seringal. O gavião-real desce pra briga."},
  {id:"curupira", lv:19, boss:true, name:"Curupira", hp:210, xp:320, gold:[180,220], damage:[11,18], size:"chefe", special:["confusao", "fogo"], moves:MV("Pancada","Corrida para trás","Pegadas trocadas"), intro:"Pegadas ao contrário e um cabelo de fogo entre as árvores: o Curupira."},
  // várzea dos búfalos (depois do seringal): a última trilha de Ananindeua antes de Belém
  {id:"bufalo", lv:17, name:"Búfalo", hp:120, xp:110, gold:[44,64], damage:[11,17], size:"grande", special:"estouro", moves:MV("Chifrada","Investida","Estouro na lama"), intro:"Um búfalo levanta a cabeça do capim alagado e bufa. Aqui quem manda é ele."},
  {id:"soco", lv:16, name:"Socó-boi", hp:100, xp:104, gold:[40,58], damage:[10,16], size:"médio", special:"mergulho", moves:MV("Bicada","Asa aberta","Bicada certeira"), intro:"Um socó-boi parado de bico pro alto... até Rhanon chegar perto."},
  {id:"jararaca", lv:17, name:"Jararaca", hp:104, xp:108, gold:[42,62], damage:[11,16], size:"médio", special:"picada", moves:MV("Mordida","Bote","Picada venenosa"), intro:"Um chiado no capim molhado: uma jararaca se arma pro bote."},
  {id:"bufalo_touro", lv:20, boss:true, name:"Búfalo-touro", hp:235, xp:340, gold:[190,240], damage:[12,19], size:"chefe", tint:"brightness(.75) contrast(1.3) sepia(.3)", special:"estouro", moves:MV("Chifrada","Investida","Estouro da manada"), intro:"A lama treme. O touro da manada abaixa os chifres e raspa a pata."},
  {id:"mapinguari", lv:22, boss:true, name:"Mapinguari", hp:265, xp:400, gold:[220,280], damage:[13,20], size:"chefe", special:["fedor", "estouro"], moves:MV("Garrada","Pisão","Bocarra"), intro:"Um fedor horrível e passos pesados. O Mapinguari abre a boca da barriga."},
  // Belém (episódio 2): Cidade Velha (níveis 20-22), Porto e Docas (22-24) e Baixadas (24-26); "gente" = malandros e golpistas
  {id:"pombo", lv:20, name:"Pombo", hp:130, xp:130, gold:[50,70], damage:[12,18], size:"pequeno", special:"mergulho", moves:MV("Bicada","Rasante","Revoada"), intro:"Um pombo gordo da praça estufa o peito. Medo de quê?"},
  {id:"gato", lv:21, name:"Gato de rua", hp:138, xp:136, gold:[52,74], damage:[13,19], size:"pequeno", tint:"grayscale(1) brightness(.8) contrast(1.2)", special:"frenesi", moves:MV("Arranhão","Pulo","Unhada sem parar"), intro:"Em cima do muro do casarão, um gato de rua arqueia as costas e bufa."},
  {id:"iguana", lv:21, name:"Iguana", hp:150, xp:140, gold:[54,76], damage:[13,19], size:"médio", tint:"hue-rotate(-25deg) saturate(1.3) brightness(1.1)", special:"salto", moves:MV("Mordida","Chicotada de cauda","Salto do galho"), intro:"Uma iguana cai da mangueira bem na frente de Rhanon. A cauda estala."},
  {id:"caramelo", lv:22, name:"Vira-lata caramelo", hp:146, xp:144, gold:[56,78], damage:[14,20], size:"médio", special:"uivo", moves:MV("Mordida","Investida","Latido"), intro:"Um vira-lata caramelo, dono da rua, rosna e chama a turma."},
  {id:"batedor", lv:21, name:"Batedor de carteira", hp:140, xp:150, gold:[60,84], damage:[13,19], size:"médio", special:["roubo", "dinheiro"], moves:MV("Empurrão","Rasteira","Mão leve"), intro:"Um rapaz de boné esbarra em Rhanon \"sem querer\". A mão já ia na bolsa."},
  {id:"iguana_rei", lv:24, boss:true, name:"Iguana-rei da praça", hp:290, xp:450, gold:[240,300], damage:[15,22], size:"chefe", tint:"hue-rotate(40deg) saturate(1.6)", special:["salto", "estouro"], moves:MV("Mordida","Chicotada de cauda","Queda do alto"), intro:"No alto da maior mangueira, a iguana mais velha da Cidade Velha abre a papada."},
  {id:"mulher_branco", lv:25, boss:true, name:"Mulher de Branco", hp:300, xp:480, gold:[250,310], damage:[15,23], size:"chefe", special:["encanto", "drenar"], moves:MV("Toque gelado","Vulto","Lamento"), intro:"O lampião apaga. Uma moça de branco flutua na rua de pedra e chama Rhanon pelo nome."},
  {id:"ratazana", lv:22, name:"Ratazana do porto", hp:150, xp:150, gold:[58,80], damage:[14,20], size:"pequeno", special:"frenesi", moves:MV("Mordida","Corrida","Mordidas sem parar"), intro:"Uma ratazana do tamanho de um gato sai das cordas do cais. E vem mais atrás."},
  {id:"urubu_porto", lv:23, name:"Urubu do porto", hp:156, xp:156, gold:[60,82], damage:[14,21], size:"médio", tint:"grayscale(.6) brightness(.5) contrast(1.3)", special:"fedor", moves:MV("Bicada","Voo rasante","Vômito"), intro:"Um urubu do porto sentiu cheiro de peixe. Acha que é na bolsa do Rhanon."},
  {id:"gaivota", lv:22, name:"Gaivota", hp:148, xp:152, gold:[58,80], damage:[14,20], size:"médio", special:"mergulho", moves:MV("Bicada","Grito","Mergulho"), intro:"Uma gaivota grita no guindaste e mergulha direto em Rhanon."},
  {id:"golpista", lv:23, name:"Golpista do cais", hp:154, xp:166, gold:[66,90], damage:[14,21], size:"médio", special:["dinheiro", "fedor"], moves:MV("Empurrão","Conversa fiada","Golpe do bilhete"), intro:"\"Ei, parente! Tenho um bilhete premiado, égua, só preciso de uma ajudinha pra trocar...\" É golpe."},
  {id:"ratao", lv:26, boss:true, name:"Ratão do galpão", hp:320, xp:520, gold:[260,330], damage:[16,24], size:"chefe", tint:"brightness(.7) contrast(1.4) hue-rotate(-10deg)", special:["frenesi", "fedor"], moves:MV("Mordida","Investida","Mordidas sem parar"), intro:"O galpão range. O rei dos ratos, grande como um cachorro, sai de trás dos sacos de castanha."},
  {id:"cobra_norato", lv:27, boss:true, name:"Cobra Norato", hp:340, xp:560, gold:[280,350], damage:[16,25], size:"chefe", special:["constricao", "prender"], moves:MV("Mordida","Bote","Abraço do rio"), intro:"A baía fica lisa como espelho. Olhos de luz sobem junto ao cais: a Cobra Norato."},
  {id:"mucura", lv:24, name:"Mucura", hp:160, xp:166, gold:[62,86], damage:[15,22], size:"pequeno", tint:"sepia(.4) brightness(.9)", special:"fedor", moves:MV("Mordida","Investida","Fedor"), intro:"Uma mucura sai de baixo da palafita. Não vai dividir o lixo com ninguém."},
  {id:"rato_dagua", lv:24, name:"Rato-d'água", hp:158, xp:164, gold:[62,86], damage:[15,22], size:"pequeno", tint:"sepia(.6) saturate(1.2) brightness(.8)", special:"frenesi", moves:MV("Mordida","Mergulho","Mordidas sem parar"), intro:"Um rato-d'água sobe a estaca da palafita, molhado e de dente amarelo."},
  {id:"cachorro_bravo", lv:25, name:"Cachorro bravo", hp:170, xp:172, gold:[66,90], damage:[16,23], size:"médio", special:"frenesi", moves:MV("Mordida","Bote","Mordida sem largar"), intro:"Um cachorro preto de corrente arrebentada não deixa ninguém passar na ponte."},
  {id:"ladrao_bike", lv:25, name:"Ladrão de bicicleta", hp:166, xp:180, gold:[72,98], damage:[16,23], size:"médio", special:["dinheiro", "roubo"], moves:MV("Empurrão","Atropelo","Passada rápida"), intro:"Um rapaz numa bicicleta sem freio vem a toda pela ponte, de olho na bolsa."},
  {id:"jacare_canal", lv:28, boss:true, name:"Jacaré do canal", hp:350, xp:600, gold:[290,360], damage:[17,26], size:"chefe", tint:"brightness(.6) saturate(.7) hue-rotate(20deg)", special:["estouro", "prender"], moves:MV("Mordida","Bote do jacaré","Caudada"), intro:"O canal escuro debaixo das palafitas se mexe. O jacaré mais velho das Baixadas abre a boca."},
  {id:"visagem_mare", lv:29, boss:true, name:"Visagem da maré", hp:360, xp:640, gold:[300,380], damage:[17,27], size:"chefe", special:["assobio", "drenar"], moves:MV("Toque gelado","Vulto","Assobio da maré"), intro:"A maré sobe sem vento. Um vulto molhado na ponte some e aparece mais perto."},
  {id:"onca_rei", lv:9, boss:true, name:"Onça-Rei", hp:140, xp:150, gold:[100,140], damage:[9,15], size:"chefe", tint:"hue-rotate(-20deg) saturate(1.5) brightness(.8)", moves:MV("Arranhão","Bote","Rugido"), intro:"A mata fica em silêncio. A Onça-Rei desce da pedra, e não está de passagem."}
];
/* Elementos (ELEMENTS em data/commands.js): [fraqueza, ...resistências]. Na batalha, o especial do elemento da fraqueza
   tira 1,5× e dá "Mais uma!"; o de uma resistência tira metade. Cada um só aparece depois de usado no bicho (elemKnown).
   Mais ou menos: pelo seco e mata = fraco a fogo; quem voa = fraco a planta e resiste a vento; quem vive na água = fraco a
   raio e resiste a água e fogo; quem é de fogo ou de sol = fraco a água
   (os de fogo e o Curupira, dono da mata, resistem a planta).
   Bicho novo: uma linha aqui (o teste geral confere que nenhum ficou sem). */
const ELEM_OF = {
  preguica: ["fogo"], cassaco: ["vento"], calango: ["agua"], tatu: ["agua", "fogo"], macaco: ["vento"], cotia: ["fogo"], quati: ["fogo"], tamandua: ["fogo"],
  queixada_chefe: ["fogo"], morcego: ["planta", "vento"], coruja: ["planta", "vento"], lobo: ["fogo"], chupacabra: ["fogo"],
  surucucu: ["agua"], onca: ["fogo"], harpia: ["planta", "vento"], queixada: ["fogo"], jaguatirica: ["agua"], anta: ["raio"], caranguejeira: ["fogo"],
  onca_rei: ["agua", "fogo"], morcego_vampiro: ["planta", "vento"], mula: ["agua", "fogo", "planta"],
  jacare: ["raio", "agua", "fogo"], piranha: ["raio", "agua", "fogo"], sucuri: ["raio", "agua", "fogo"], capivara: ["fogo"], ariranha: ["raio", "agua", "fogo"], poraque: ["vento", "raio", "fogo"],
  cobra_grande: ["raio", "agua", "fogo"], morcego_pescador: ["planta", "vento"], boitata: ["agua", "fogo", "planta"],
  tracaja: ["raio", "agua", "fogo"], garca: ["planta", "vento"], boto: ["raio", "agua", "fogo"], jacaretinga: ["raio", "agua", "fogo"], sapo: ["fogo", "agua"], pirarucu: ["raio", "agua", "fogo"], boto_encantado: ["vento", "agua", "fogo"],
  caranguejo: ["raio", "agua", "fogo"], guaxinim: ["fogo"], macarico: ["planta", "vento"], caranguejo_rei: ["raio", "agua", "fogo"], matinta: ["fogo", "vento"],
  urubu: ["planta", "vento"], cobra_cipo: ["fogo"], ourico: ["agua"], gaviao_real: ["planta", "vento"], curupira: ["agua", "fogo", "planta"],
  bufalo: ["fogo"], soco: ["planta", "vento"], jararaca: ["agua"], bufalo_touro: ["raio", "agua", "fogo"], mapinguari: ["vento", "raio"],
  pombo: ["planta", "vento"], gato: ["agua"], iguana: ["agua"], caramelo: ["fogo"], batedor: ["raio"], iguana_rei: ["agua", "fogo"], mulher_branco: ["fogo", "vento"],
  ratazana: ["fogo"], urubu_porto: ["planta", "vento"], gaivota: ["planta", "vento"], golpista: ["raio"], ratao: ["fogo", "agua"], cobra_norato: ["raio", "agua", "fogo"],
  mucura: ["fogo"], rato_dagua: ["raio", "agua", "fogo"], cachorro_bravo: ["agua"], ladrao_bike: ["vento"], jacare_canal: ["raio", "agua", "fogo"], visagem_mare: ["fogo", "agua"]
};
// quanto o elemento k pesa contra o bicho a: 1.5 (fraqueza), .5 (uma das resistências) ou 1
const elemMult = (a, k) => { const [w, ...r] = ELEM_OF[a.id] || []; return k && k === w ? 1.5 : k && r.includes(k) ? .5 : 1; };
/* como no Persona: o Rhanon só descobre o que o elemento k faz no bicho a usando o golpe nele (G.bestiary[id].el[k]).
   Com o app de cordel no notebook (freela do Recife, G.portfolio.app_cordel), vê tudo dos bichos que já enfrentou. */
const elemApp = () => !!G.portfolio?.app_cordel;
const elemKnown = (a, k) => !a.bug && !!ELEM_OF[a.id] && (!!G.bestiary[a.id]?.el?.[k] || (elemApp() && !!G.bestiary[a.id]?.seen));
function elemLearn(a, k) { if (a.bug) return; noteSeen(a.id); const b = G.bestiary[a.id]; (b.el || (b.el = {}))[k] = true; }
// zonas de caça: nível mínimo, sorteio com peso [id, peso] e o chefe (aparece após 4 vitórias)
const ZONES = {
  mata:    {n: "Mata", lv: 1, pool: [["preguica",3],["cassaco",3],["calango",3],["tatu",3],["macaco",2],["cotia",3],["quati",2],["tamandua",1]], boss: "queixada_chefe"},
  rio:     {n: "Beira do rio", lv: 2, pool: [["jacare",3],["piranha",3],["sucuri",2],["capivara",3],["ariranha",2],["poraque",2]], boss: "cobra_grande"},
  igarape: {n: "Igarapé", lv: 10, pool: [["tracaja",3],["garca",3],["jacaretinga",2],["ariranha",2],["boto",3],["piranha",1]], boss: "pirarucu"},
  cidadevelha: {n: "Cidade Velha", lv: 20, pool: [["pombo",3],["gato",3],["iguana",3],["caramelo",2],["batedor",3]], boss: "iguana_rei"},
  porto: {n: "Porto e Docas", lv: 22, pool: [["ratazana",3],["urubu_porto",3],["gaivota",3],["golpista",3]], boss: "ratao"},
  baixadas: {n: "Baixadas", lv: 24, pool: [["mucura",3],["rato_dagua",3],["cachorro_bravo",3],["ladrao_bike",3]], boss: "jacare_canal"},
  varzea: {n: "Várzea dos búfalos", lv: 16, pool: [["bufalo",3],["soco",3],["jararaca",3],["capivara",1],["jacaretinga",1]], boss: "bufalo_touro"},
  seringal: {n: "Seringal abandonado", lv: 14, pool: [["urubu",3],["cobra_cipo",3],["ourico",3],["guaxinim",1]], boss: "gaviao_real"},
  manguezal: {n: "Manguezal", lv: 12, pool: [["caranguejo",3],["guaxinim",3],["macarico",3],["garca",1],["jacaretinga",1],["piranha",2]], boss: "caranguejo_rei"},
  fechada: {n: "Mata fechada", lv: 3, pool: [["surucucu",3],["onca",2],["harpia",2],["queixada",2],["jaguatirica",3],["anta",1],["caranguejeira",3]], boss: "onca_rei"}
};
// na batalha, estes bichos ficam meio dentro de um laguinho (os outros, no chão de terra)
const WATER_BATTLE = new Set(["cobra_norato", "jacare_canal", "piranha", "poraque", "jacare", "ariranha", "sucuri", "cobra_grande", "boitata", "boto", "jacaretinga", "pirarucu", "boto_encantado", "tracaja"]);
// à noite (G.night) cada zona tem outros bichos e um chefe do folclore; o resto (mapa, passagem) é o mesmo
const NIGHT_ZONES = {
  mata:    {pool: [["morcego",3],["coruja",3],["lobo",2],["cassaco",2],["tatu",1]], boss: "chupacabra"},
  fechada: {pool: [["morcego_vampiro",3],["lobo",2],["onca",2],["jaguatirica",2],["caranguejeira",2],["surucucu",2]], boss: "mula"},
  rio:     {pool: [["jacare",3],["sucuri",2],["poraque",2],["morcego_pescador",3],["capivara",1]], boss: "boitata"},
  igarape: {pool: [["sapo",3],["jacaretinga",3],["morcego_pescador",2],["boto",2],["poraque",1]], boss: "boto_encantado"},
  manguezal: {pool: [["guaxinim",3],["caranguejo",3],["morcego_vampiro",2],["coruja",2],["poraque",1]], boss: "matinta"},
  seringal: {pool: [["ourico",3],["cobra_cipo",3],["urubu",2],["morcego_vampiro",2]], boss: "curupira"},
  varzea: {pool: [["bufalo",3],["jararaca",3],["morcego_vampiro",2],["sapo",2],["boto",1]], boss: "mapinguari"},
  cidadevelha: {pool: [["gato",3],["caramelo",3],["batedor",3],["morcego_vampiro",1]], boss: "mulher_branco"},
  porto: {pool: [["ratazana",3],["golpista",3],["urubu_porto",2],["morcego_pescador",1]], boss: "cobra_norato"},
  baixadas: {pool: [["rato_dagua",3],["cachorro_bravo",3],["ladrao_bike",3],["mucura",2]], boss: "visagem_mare"}
};
const zoneDef = z => G.night && NIGHT_ZONES[z] ? {...ZONES[z], ...NIGHT_ZONES[z], n: ZONES[z].n + " à noite"} : ZONES[z];
// chefe vencido: de dia é a zona; à noite, "zona:noite" (os chefes do folclore não abrem passagens)
const bossKey = z => G.night && NIGHT_ZONES[z] ? z + ":noite" : z;
// gênero e nome próprio, para as frases: "a onça-pintuda saiu correndo", "o Curupira caiu" (bicho novo feminino: id em FEM)
const FEM = new Set(["onca", "preguica", "sucuri", "surucucu", "harpia", "cotia", "jaguatirica", "anta", "caranguejeira", "capivara", "ariranha",
  "cobra_grande", "coruja", "mula", "garca", "matinta", "cobra_cipo", "jararaca", "iguana", "iguana_rei", "mulher_branco", "ratazana", "gaivota",
  "cobra_norato", "mucura", "visagem_mare", "onca_rei"]);
const PROPER = new Set(["cobra_grande", "chupacabra", "mula", "boitata", "boto_encantado", "matinta", "curupira", "mapinguari", "mulher_branco", "cobra_norato", "onca_rei", "bug_loop", "bug_404", "bug_prazo"]);
const theName = (a, cap) => { if (LANG !== "pt" && TX[LANG] && TX[LANG].article) return TX[LANG].article(a, cap); const t = (FEM.has(a.id) ? "a " : "o ") + (PROPER.has(a.id) ? a.name : a.name.toLowerCase()); return cap ? t[0].toUpperCase() + t.slice(1) : t; };
const ending = (a, m, f) => FEM.has(a.id) ? f : m;   // "vencido"/"vencida"
/* Bugs do freela: lutam como bicho (mesma batalha), com o desenho de um bicho de base (ART) em cores de tela.
   bug: true = fora do caderno e das trilhas, sem lembrança; a luta acontece no cenário "codigo" (gfx/scenery.js). */
const BUGS = [
  {id:"bug_loop", bug:true, lv:19, name:"Loop Infinito", hp:150, xp:120, gold:[0,0], damage:[9,14], size:"grande", tint:"hue-rotate(110deg) saturate(2.4) brightness(1.15)", moves:MV("Volta de novo","Mordida no rabo","Travamento"), intro:"O site não carrega. No código, uma cobra morde o próprio rabo e gira sem parar: um Loop Infinito."},
  {id:"bug_404", bug:true, lv:20, name:"Erro 404", hp:160, xp:130, gold:[0,0], damage:[10,15], size:"médio", tint:"hue-rotate(250deg) saturate(2) brightness(1.2)", moves:MV("Página sumida","Link quebrado","Tela branca"), intro:"Clica em \"Preços\" e... nada. Um morcego de pixel some e aparece: o Erro 404."},
  {id:"bug_prazo", bug:true, lv:22, name:"O Prazo", hp:240, xp:200, gold:[0,0], damage:[11,17], size:"grande", tint:"hue-rotate(320deg) saturate(1.8) contrast(1.2)", moves:MV("Tique-taque","Mordida do relógio","Amanhã cedo"), intro:"Falta pouco pra entregar. Do canto da tela sai um caranguejo com um relógio no casco e os ponteiros afiados: O Prazo."}
];
// lembrança que cada bicho deixa quando é acalmado (o que ele perde de natural: pena, pele trocada, dente, espinho...);
// os chefes deixam o luar que a fumaça tinha prendido neles (material dos talismãs do Pajé). Sem nome aqui: "Lembrança de <bicho>"
const PELT = {queixada_chefe: "Luar do Queixada-chefe", onca_rei: "Luar da Onça-Rei", cobra_grande: "Luar da Cobra-Grande", chupacabra: "Luar do Chupa-cabra", mula: "Luar da Mula", boitata: "Luar do Boitatá", pirarucu: "Luar do Pirarucu", boto_encantado: "Luar do Boto", caranguejo_rei: "Luar do Caranguejo-rei", matinta: "Luar da Matinta", gaviao_real: "Luar do Gavião-real", curupira: "Luar do Curupira", bufalo_touro: "Luar do Búfalo-touro", mapinguari: "Luar do Mapinguari", iguana_rei: "Luar da Iguana-rei", mulher_branco: "Luar da Mulher de Branco", ratao: "Luar do Ratão", cobra_norato: "Luar da Cobra Norato", jacare_canal: "Luar do Jacaré do canal", visagem_mare: "Luar da Visagem", onca: "Tufo de pelo de onça", calango: "Pele trocada de calango", tatu: "Terra da toca do tatu", jacare: "Dente de jacaré", preguica: "Pelo de preguiça com musgo", cassaco: "Pelo de cassaco", macaco: "Castanha do macaco-prego", queixada: "Cerda de queixada", piranha: "Dente de piranha", sucuri: "Pele trocada de sucuri", surucucu: "Pele trocada de surucucu", harpia: "Pena de harpia", cotia: "Castanha da cotia", quati: "Pelo de quati", tamandua: "Pelos de tamanduá", jaguatirica: "Pelo de jaguatirica", anta: "Pelo de anta", caranguejeira: "Pele trocada de caranguejeira", capivara: "Pelo de capivara", ariranha: "Pelo de ariranha", poraque: "Faísca de poraquê", morcego: "Fruta mordida pelo morcego", coruja: "Pena de coruja", lobo: "Pelo de lobo-guará", morcego_vampiro: "Pelo de morcego-vampiro", morcego_pescador: "Peixinho do morcego-pescador", tracaja: "Placa de casco de tracajá", garca: "Pena de garça", boto: "Concha que o boto achou", jacaretinga: "Dente de jacaretinga", sapo: "Pele trocada de sapo-cururu", caranguejo: "Casca trocada de caranguejo", guaxinim: "Pelo de mão-pelada", macarico: "Pena de maçarico", urubu: "Pena de urubu-rei", cobra_cipo: "Pele trocada de cobra-cipó", ourico: "Espinho de ouriço", bufalo: "Pelo de búfalo", soco: "Pena de socó", jararaca: "Pele trocada de jararaca", pombo: "Pena de pombo", gato: "Pelo de gato de rua", iguana: "Pele trocada de iguana", caramelo: "Coleira de caramelo", batedor: "Relógio recuperado", ratazana: "Pelo de ratazana", urubu_porto: "Pena de urubu do porto", gaivota: "Pena de gaivota", golpista: "Bilhete premiado falso", mucura: "Pelo de mucura", rato_dagua: "Pelo de rato-d'água", cachorro_bravo: "Corrente arrebentada", ladrao_bike: "Campainha de bicicleta"};
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
  pirarucu: "Um dos maiores peixes de água doce do mundo. Sobe pra respirar a cada poucos minutos, e as escamas viram lixa.",
  boto_encantado: "Lenda da Amazônia: em noite de festa o boto vira um moço de branco, de chapéu pra esconder o furo da cabeça, e encanta quem passa.",
  caranguejo: "Vive em tocas na lama do mangue e troca de casca pra crescer. Na época de acasalar sai todo mundo de uma vez: é a \"andada\".",
  guaxinim: "O mão-pelada tem as patas da frente sem pelo, como mãos, e costuma molhar a comida antes de comer.",
  macarico: "Muitos maçaricos voam milhares de quilômetros do norte do mundo até as praias e mangues do Pará.",
  caranguejo_rei: "Os catadores contam de um caranguejo velho e enorme que nunca sai da toca de dia e manda no mangue inteiro.",
  matinta: "Lenda do Pará: uma velha que vira pássaro e assobia de noite. Quem promete fumo para ela, no outro dia recebe a visita da velha cobrando.",
  urubu: "O urubu-rei tem a cabeça colorida e o faro mais fino entre os urubus: os outros esperam ele abrir a carcaça.",
  cobra_cipo: "Fina e comprida, some no meio dos galhos. Caça lagartos e sapos no alto das árvores.",
  ourico: "O ouriço-cacheiro não lança espinhos: eles soltam fácil e grudam em quem encosta.",
  gaviao_real: "Outro nome da harpia, a águia mais forte das Américas. Cada casal precisa de um pedaço enorme de mata só para si.",
  curupira: "Lenda tupi: um menino de cabelo vermelho com os pés virados para trás, que confunde os caçadores com pegadas ao contrário.",
  bufalo: "Chegaram ao Pará há mais de cem anos. No Marajó se deram tão bem que até a polícia anda montada neles.",
  soco: "O socó-boi fica parado de bico para cima no meio do capim e o desenho das penas faz ele sumir na paisagem.",
  jararaca: "Causa a maioria das picadas de cobra no Brasil. Do veneno dela saiu um remédio de pressão usado no mundo todo.",
  bufalo_touro: "O mais velho da manada. Os vaqueiros da várzea contam que nenhuma cerca segura ele quando a água sobe.",
  mapinguari: "Lenda da Amazônia: gigante peludo de um olho só, com a boca na barriga e um fedor que se sente de longe. Anda de noite e grita pra assustar caçador.",
  pombo: "O pombo veio da Europa e se espalhou pelas cidades do mundo todo. Acha o caminho de casa de muito longe.",
  gato: "Gato de rua dorme até 16 horas por dia e caça rato e lagartixa pelos telhados dos casarões.",
  iguana: "As iguanas de Belém vivem nas mangueiras das praças. Descem para tomar sol e, se cair na água, nadam muito bem.",
  caramelo: "O vira-lata caramelo virou quase um símbolo do Brasil: esperto, resistente e dono de todas as ruas.",
  batedor: "Na multidão, a bolsa vai na frente do corpo. Batedor de carteira escolhe quem anda distraído olhando para cima.",
  iguana_rei: "Os vendedores da praça juram que há uma iguana com mais de um metro e meio que nunca desce da árvore mais alta.",
  mulher_branco: "Lenda de muitas cidades do Brasil: uma moça de branco que aparece de noite em ruas antigas. Em Belém, assombração se chama \"visagem\".",
  ratazana: "A ratazana nada bem, sobe em corda e cabe em buracos do tamanho de uma moeda grande.",
  urubu_porto: "Os urubus do Ver-o-Peso e do porto limpam os restos de peixe: sem eles, a beira da baía seria muito mais fedida.",
  gaivota: "Gaivota come quase tudo: peixe, caranguejo... e o salgado de quem bobear no cais.",
  golpista: "O golpe do bilhete premiado é velho: alguém diz que tem um bilhete ganhador e pede dinheiro para \"ajudar\". Desconfie de sorte fácil.",
  ratao: "Os estivadores contam de um rato do tamanho de um cachorro que vive no galpão mais velho do porto.",
  cobra_norato: "Lenda amazônica: Honorato nasceu encantado em cobra grande e nada pelos rios do Pará. Dizem que só um corajoso pode quebrar o encanto.",
  mucura: "É o gambá, chamado de mucura no Pará. Come insetos, frutas e até cobra, e não é afetado pelo veneno de muitas delas.",
  rato_dagua: "Vive na beira dos canais e nada muito bem, com os pés de trás meio de pato.",
  cachorro_bravo: "Cachorro preso em corrente fica mais bravo. Bicho bem cuidado e solto no quintal costuma ser bem mais calmo.",
  ladrao_bike: "Bicicleta boa merece cadeado bom, preso em coisa firme. Ladrão de bicicleta escolhe a que dá menos trabalho.",
  jacare_canal: "Em alguns canais de Belém ainda aparecem jacarés: eles vêm pelos rios e se escondem embaixo das palafitas.",
  visagem_mare: "Nas Baixadas contam de uma visagem que sobe com a maré cheia e anda pelas pontes de tábua. Quem é de lá não sai de casa nessa hora."
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
  pombo: "hop", gaivota: "hover", urubu_porto: "hover", iguana: "slow2", iguana_rei: "slow2", cobra_norato: "sway",
  batedor: "person", golpista: "person", ladrao_bike: "person", mulher_branco: "hover", visagem_mare: "hover",
};
const AURA = {queixada_chefe: ["#ff8a3a", "#ffd23a"], cobra_grande: ["#7cf2ff", "#b06ad6"], onca_rei: ["#e5001c", "#ffd23a"],
  chupacabra: ["#e5001c", "#7a1a2a"], mula: ["#ff8a3a", "#ffd23a"], boitata: ["#ffd23a", "#ff5a1c"],
  pirarucu: ["#e5001c", "#ff8a3a"], boto_encantado: ["#ff9fd0", "#ffffff"], caranguejo_rei: ["#7cf2ff", "#ffffff"], matinta: ["#b06ad6", "#2a2230"],
  gaviao_real: ["#ffd23a", "#ffffff"], curupira: ["#ff5a1c", "#ffd23a"], bufalo_touro: ["#e5001c", "#ffffff"], mapinguari: ["#9bd34a", "#7a4a2a"],
  iguana_rei: ["#7dff9a", "#ffd23a"], mulher_branco: ["#ffffff", "#bfe8ff"], ratao: ["#9a9aa0", "#e5001c"], cobra_norato: ["#7cf2ff", "#ffffff"], jacare_canal: ["#7a8a4a", "#ffd23a"], visagem_mare: ["#9ad8d0", "#ffffff"]};
