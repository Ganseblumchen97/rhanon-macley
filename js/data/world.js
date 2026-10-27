/* Locais do mapa grande (Pará ou Brasil), sublocais de Ananindeua e de Belém, loja e equipamentos. */
const REQ = {lv: 4, money: 150};   // para Curitiba aparecer e a passagem
const CURITIBA_OPEN = false;       // false = Curitiba fica escondida (foco em Ananindeua por enquanto)
/* Mapa grande: "para" (por enquanto: Ananindeua aberta e Belém, a capital, em breve) ou "brasil" (Ananindeua e Curitiba).
   Cada mapa tem o contorno (land), um rio opcional, a trilha tracejada (route) e onde fica cada local de LOC. */
const MAP_REGION = "para";
const MAP_REGIONS = {
  para: {n: "Pará", aria: "Mapa estilizado do Pará, com Ananindeua e Belém",
    land: ["M63 224 L97 167 L154 110 L211 91 L241 103 L306 179 L333 224 L382 259 L431 255 L458 236 L485 209 L530 221 L549 232 L530 285 L500 323 L466 384 L454 437 L428 490 L393 559 L287 544 L173 540 L127 502 L82 464 L127 357 L150 285 L97 262Z",
      "M367 213 L401 194 L439 202 L447 221 L424 243 L386 247Z"],   // continente e a ilha de Marajó (a partir de longitude/latitude)
    river: "M63 281 C130 286 190 282 230 276 S310 240 338 222",   // rio Amazonas
    // a BR-316 sai de Ananindeua para o sudoeste e faz uma volta antes de chegar a Belém (curve: os dois pontos de controle)
    route: ["ananindeua", "belem"], pos: {ananindeua: [494, 238], belem: [398, 312]}, curve: [18, 74, 86, -2]},
  brasil: {n: "Brasil", aria: "Mapa do Brasil em silhueta, com rota entre Ananindeua e Curitiba",
    land: ["M205 106 L262 101 320 128 350 175 382 190 405 196 440 228 444 268 427 302 416 322 394 387 374 421 361 442 343 479 326 527 294 538 263 507 267 465 246 433 226 401 204 370 165 359 110 349 99 311 126 286 109 254 147 213 162 180 172 139Z"],
    route: ["ananindeua", "curitiba"], pos: {ananindeua: [322, 168], curitiba: [315, 478]}}
};
const LOC = {
  ananindeua: {n: "Ananindeua (PA)", s: "Ananindeua", x: 322, y: 168, txt: "Sua aldeia. A mata ao redor anda brava, e cada lembrança que os bichos deixam rende uns trocados."},
  belem: {n: "Belém (PA)", s: "Belém", txt: "A capital do Pará, na beira da baía do Guajará. Prédios, casarões de azulejo, o Ver-o-Peso... e bicho e malandro bem mais fortes que os da mata."},
  curitiba: {n: "Curitiba (PR)", s: "Curitiba", x: 315, y: 478, txt: "Cidade grande, frio e oportunidades na programação. Conquiste a primeira vaga, complete missões de trabalho e tente uma empresa melhor."}
};
/* Mapa de Ananindeua (viewBox 440x325): uma trilha só, em zigue-zague, na ordem de dificuldade (ROUTE).
   Embaixo, da esquerda para a direita, até cruzar o rio; no meio, de volta para a esquerda, cruzando de novo;
   e no fim, lá em cima, a cabine do cobrador na BR-316, de onde sai o ônibus para a capital. */
const SUB = {
  aldeia:  {n: "Aldeia", x: 48, y: 242, txt: "A casa do Rhanon. Fogueira pra descansar, tenda pra dormir e gente conhecida."},
  feira:   {n: "Feira", x: 122, y: 262, txt: "Mandioca, peixe assado, açaí e maniçoba. Aqui se vende lembrança e se compra comida."},
  mata:    {n: "Mata", x: 188, y: 236, txt: "Trilhas conhecidas. Bichos pequenos e médios, bons para começar."},
  fechada: {n: "Mata fechada", x: 254, y: 264, txt: "Folhas altas, pouca luz e predadores de verdade."},
  rio:     {n: "Beira do rio", x: 376, y: 240, txt: "Do outro lado da ponte: água, lama e dentes. Olho no que se mexe na margem."},
  igarape: {n: "Igarapé", x: 402, y: 156, txt: "Rio acima, a água entra na mata em canais estreitos. Tracajá, garça, boto... e algo enorme lá no fundo."},
  manguezal: {n: "Manguezal", x: 290, y: 128, txt: "A mata vira lama e raiz. Caranguejo, mão-pelada e, de noite, um assobio que ninguém quer ouvir."},
  seringal: {n: "Seringal", x: 212, y: 160, txt: "Seringueiras velhas com marca de faca e a casa do seringueiro caindo aos pedaços. Lá ninguém anda de noite."},
  varzea: {n: "Várzea", x: 120, y: 134, txt: "Campo alagado de capim alto, como no Marajó. Búfalo, socó escondido e, dizem os vaqueiros, um gigante que fede de longe."},
  parada: {n: "Cabine da BR-316", s: "BR-316", x: 52, y: 62, txt: "No fim da trilha, a estrada. Na cabine de madeira, o cobrador vende a passagem do ônibus pra Belém."},
  /* Belém (episódio 2): o ônibus chega no terminal; a trilha passa pelo Ver-o-Peso (feira, sem bichos) e segue
     pela Cidade Velha, pelo Porto e pelas Baixadas, cada vez mais difícil */
  terminal: {city: "belem", n: "Terminal rodoviário", s: "Terminal", x: 392, y: 262, txt: "O ônibus da BR-316 para aqui. A passagem vale ida e volta: dá pra voltar pra Ananindeua quando quiser."},
  veropeso: {city: "belem", n: "Ver-o-Peso", x: 252, y: 250, txt: "A feira mais famosa do Pará, na beira da baía: peixe, açaí, erva de cheiro, urubu no telhado de ferro... e rede na pensão."},
  cidadevelha: {city: "belem", n: "Cidade Velha", x: 128, y: 266, txt: "Rua de pedra, casarão de azulejo e praça com mangueira. Pombo, gato, iguana... e malandro de olho na bolsa."},
  porto: {city: "belem", n: "Porto e Docas", x: 86, y: 160, txt: "Galpão velho, guindaste e barco chegando de todo canto. Rato do tamanho de gato e golpista esperando quem desce."},
  baixadas: {city: "belem", n: "Baixadas", x: 262, y: 146, txt: "Do outro lado do canal, palafitas ligadas por pontes de tábua. Na maré cheia, a rua vira rio."}
};
/* cada cidade tem o seu mapa local (viewBox 440x325): a trilha única em ordem (route), o contorno (land), o rio ou
   canal que a trilha cruza (com as pontes calculadas) e a estrada que sai do mapa (road), com a placa (sign) */
const CITY = {
  ananindeua: {n: "Ananindeua", route: ["aldeia", "feira", "mata", "fechada", "rio", "igarape", "manguezal", "seringal", "varzea", "parada"],
    land: "10,70 60,20 190,8 305,18 395,55 430,140 428,235 398,300 300,316 170,314 60,304 12,255 5,160",
    river: "M318,24 C305,70 358,96 346,140 C334,190 300,222 316,318", road: "M52,62 C34,44 18,32 -4,26", sign: [6, 18, "← Belém"], home: "aldeia", gate: "parada"},
  belem: {n: "Belém", route: ["terminal", "veropeso", "cidadevelha", "porto", "baixadas"],
    land: "40,40 150,14 300,10 400,40 432,130 430,240 400,300 300,316 160,316 40,300 22,230 36,150 20,90",
    bay: "M0,0 L44,0 C28,40 46,80 28,110 C40,150 22,200 38,240 C28,270 34,300 46,325 L0,325Z",   // baía do Guajará
    river: "M206,20 C190,70 214,116 186,160 C170,190 160,204 150,214", road: "M392,262 C410,276 424,286 446,292", sign: [366, 320, "Ananindeua →"], home: "veropeso", gate: "terminal"}
};
const curCity = () => G.loc === "belem" ? "belem" : "ananindeua";
const cityOf = k => (SUB[k] && SUB[k].city) || "ananindeua";
const ROUTE = Object.values(CITY).flatMap(c => c.route);   // todos os locais das duas cidades
const EDGES = Object.values(CITY).flatMap(c => c.route.slice(1).map((k, i) => [c.route[i], k]));
/* ônibus da BR-316 entre Ananindeua (cabine da parada) e Belém (terminal): a passagem é comprada uma vez na cabine
   (G.passagem) e vale ida e volta. open = false fecharia Belém de novo (a cabine só mostraria o preço). */
const BUS = {price: 800, open: true};
/* Notebook do Rhanon (missão do começo, só em jogo novo; ver HISTORIA.md): o Mateiro entrega quebrado depois do tutorial,
   o técnico da feira vende a BATERIA, o macaco-prego larga o TECLADO e a ariranha o CARREGADOR quando são acalmados, e
   ele liga na tomada da cabine da BR-316. Ligado, chega o primeiro freela e o caderno vira digital. */
const NB_PARTS = ["bateria", "teclado", "carregador"];
const NB_BATTERY = 40;                                     // preço da bateria no técnico
const NB_DROP = {macaco: "teclado", ariranha: "carregador"};   // bicho que larga a peça ao ser acalmado
/* Freelas: um por capital. bugs = lutas em sequência (BUGS em data/animals.js), pay = R$ na entrega, prog = programa que
   fica no notebook (G.portfolio[id]) e dá uma vantagem no jogo. */
const FREELAS = {
  site_feira: {n: "Site da feira do Ver-o-Peso", client: "Dona Graça", bugs: ["bug_loop", "bug_404", "bug_prazo"], pay: 300,
    prog: "Lembranças valem 20% a mais na feira (o site mostra o preço certo)."}
};
const PENSAO = {noite: 10, dormir: 15};   // diária da rede na pensão do Ver-o-Peso (barata: não atrapalha a progressão)
// local que só abre depois do chefe de outro (NEED) e a próxima fase na passagem do fim da trilha (NEXT_Z)
const NEED = {fechada: "mata", rio: "fechada", igarape: "rio", manguezal: "igarape", seringal: "manguezal", varzea: "seringal", parada: "varzea", porto: "cidadevelha", baixadas: "porto"}, NEXT_Z = {mata: "fechada", fechada: "rio", rio: "igarape", igarape: "manguezal", manguezal: "seringal", seringal: "varzea", cidadevelha: "porto", porto: "baixadas"};
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
