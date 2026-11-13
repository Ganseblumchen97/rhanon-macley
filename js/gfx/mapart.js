/* desenhos dos pontos dos mapas: cada área tem um disco da cor dela com um desenhinho que lembra o lugar (oca na aldeia,
   canoa no igarapé, mandacaru na caatinga...). MAP_ICON[k] = [cor do disco, desenho em SVG numa caixa de -9 a 9].
   No mapa grande, as cidades usam o desenho do lugar de chegada (CITY_ICON). */
const MI = {k: "#1a1426", c: "#f6e9c4", l: "#6fc06a", L: "#2f7a3a", t: "#7a4a24", w: "#8fd8ff", r: "#e2363d", s: 'stroke="#1a1426" stroke-width="1.2"'};
const MI_TREE = (x, y, r, col) => `<rect x="${x - 1.3}" y="${y}" width="2.6" height="${r + 2}" fill="${MI.t}"/><circle cx="${x}" cy="${y - r * .55}" r="${r}" fill="${col}" ${MI.s}/>`;
const MI_WAVE = (y, col = MI.w, w = 1.8) => `<path d="M-8 ${y} q2 -2.6 4 0 t4 0 t4 0 t4 0" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
const MI_HOUSE = (wall, roof) => `<rect x="-7.5" y="-3" width="15" height="10" fill="${wall}" ${MI.s}/><path d="M-9 -3 L0 -9 L9 -3Z" fill="${roof}" ${MI.s}/><rect x="-5" y="-0.5" width="3" height="3" fill="${MI.c}"/><rect x="2" y="-0.5" width="3" height="3" fill="${MI.c}"/><rect x="-1.5" y="3" width="3" height="4" fill="${MI.k}"/>`;
const MAP_ICON = {
  aldeia: ["#a8541c", `<path d="M-8 7 Q-8 -9 0 -9 Q8 -9 8 7Z" fill="#d8b060" ${MI.s}/><path d="M-5 -4 Q0 -7 5 -4 M-6 1 Q0 -2 6 1" fill="none" stroke="#9a7430" stroke-width="1"/><path d="M-2 7 V2 H2 V7" fill="${MI.k}"/>`],
  feira: ["#c8902a", `<rect x="-8" y="-1" width="16" height="8" fill="${MI.c}" ${MI.s}/><path d="M-9.5 -1 L-6.5 -8 H6.5 L9.5 -1Z" fill="${MI.r}" ${MI.s}/><path d="M-2.5 -8 L-3.5 -1 M2.5 -8 L3.5 -1" stroke="${MI.c}" stroke-width="1.6"/><circle cx="-4" cy="3" r="1.6" fill="#7a3ab0"/><circle cx="1" cy="3" r="1.6" fill="#ffd23a"/>`],
  mata: ["#3f9a5c", MI_TREE(0, 1, 6.5, MI.l)],
  fechada: ["#1f5a34", MI_TREE(-3.5, 2, 5, MI.L) + MI_TREE(3.5, 0, 5.5, "#4a9a4a")],
  rio: ["#2a7ab8", MI_WAVE(-3) + MI_WAVE(3) + MI_WAVE(8, "#cfeeff", 1.2)],
  igarape: ["#1f6a8a", `<path d="M-9 1 Q0 7 9 1Z" fill="${MI.t}" ${MI.s}/><path d="M3 -8 L-1 4" stroke="${MI.c}" stroke-width="1.6" stroke-linecap="round"/>` + MI_WAVE(7)],
  manguezal: ["#3a4a2a", `<circle cy="-5" r="5.5" fill="${MI.L}" ${MI.s}/><path d="M0 -1 V6 M0 2 Q-5 3 -6 6 M0 2 Q5 3 6 6" fill="none" stroke="#c8a060" stroke-width="1.8" stroke-linecap="round"/>` + MI_WAVE(6, "#c8a060", 1.4) + MI_WAVE(9, "#8fd8ff", 1.2)],   // igapó: árvore com o pé na água
  seringal: ["#6a5a4a", `<rect x="-3" y="-3" width="6" height="11" fill="#8a6a4a" ${MI.s}/><ellipse cy="-6" rx="8" ry="4.5" fill="#4a8a42" ${MI.s}/><path d="M-3 0 L3 2.5 M-3 3.5 L3 6" stroke="${MI.c}" stroke-width="1.2"/><path d="M3 4 h4.5 v3.5 h-4.5z" fill="${MI.c}" ${MI.s}/>`],
  varzea: ["#a8862a", `<ellipse cy="2" rx="5" ry="6" fill="#4a4a54" ${MI.s}/><path d="M-4.5 -2 Q-10 -4 -8 -9 M4.5 -2 Q10 -4 8 -9" fill="none" stroke="${MI.c}" stroke-width="2" stroke-linecap="round"/><circle cx="-2" cy="1" r="1" fill="${MI.c}"/><circle cx="2" cy="1" r="1" fill="${MI.c}"/>`],
  parada: ["#1f5a8a", `<path d="M-9 1 H9 L6 6 H-7Z" fill="#1f4a8a" ${MI.s}/><rect x="-6" y="-5" width="11" height="6" fill="${MI.c}" ${MI.s}/><rect x="-7" y="-7" width="13" height="2" fill="#2a8a5a" ${MI.s}/><path d="M-4 -3 h2 M0 -3 h2 M4 -3 h1" stroke="#2a5a8a" stroke-width="1.4"/>` + MI_WAVE(8, "#cfeeff", 1.2)],
  veropeso: ["#1f5a8a", `<path d="M-8 7 V-2 L-5 -7 L-2 -2 V7Z M2 7 V-2 L5 -7 L8 -2 V7Z" fill="#9fd0e8" ${MI.s}/><rect x="-2" y="0" width="4" height="7" fill="${MI.c}" ${MI.s}/>` + MI_WAVE(8, "#cfeeff", 1.2)],
  cidadevelha: ["#2a4a8a", MI_HOUSE("#5a8ad8", MI.r)],
  porto: ["#4a5a6a", `<path d="M-6 8 V-8 H8 M-6 -3 L3 -8 M6 -8 V-1" fill="none" stroke="${MI.c}" stroke-width="2" stroke-linecap="round"/><rect x="3.5" y="-1" width="5" height="3.5" fill="${MI.r}" ${MI.s}/>`],
  baixadas: ["#5a6a3a", `<rect x="-7" y="-5" width="14" height="6" fill="#d8b060" ${MI.s}/><path d="M-8.5 -5 L0 -9.5 L8.5 -5Z" fill="${MI.t}" ${MI.s}/><path d="M-5 1 V8 M0 1 V8 M5 1 V8" stroke="${MI.t}" stroke-width="1.6"/>` + MI_WAVE(6)],
  praiagrande: ["#1f6a9a", MI_HOUSE("#cfe4f6", "#e8743a") + `<path d="M-6 4 h12" stroke="#2a5aa8" stroke-width="1" stroke-dasharray="1.5 1.5"/>`],
  mangueilha: ["#5a4a2a", `<circle cy="-5" r="5" fill="${MI.L}" ${MI.s}/><path d="M0 -2 V8 M0 1 Q-6 3 -7 8 M0 1 Q6 3 7 8" fill="none" stroke="#c8a060" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="5" cy="6" rx="3" ry="2" fill="${MI.r}" ${MI.s}/>`],
  lencois: ["#2a8ac8", `<path d="M-9 6 Q-4 -5 1 6Z" fill="${MI.c}" ${MI.s}/><path d="M-2 6 Q4 -8 9 6Z" fill="#f0dca0" ${MI.s}/>` + MI_WAVE(8, "#cfeeff", 1.4)],
  trocatroca: ["#b85a2a", `<rect x="-8" y="-1" width="16" height="8" fill="${MI.c}" ${MI.s}/><path d="M-9.5 -1 L-6.5 -8 H6.5 L9.5 -1Z" fill="#2a8a5a" ${MI.s}/><circle cx="-3" cy="3" r="1.6" fill="#e8a020"/><circle cx="2" cy="3" r="1.6" fill="${MI.r}"/>`],
  encontro: ["#2a6a8a", `<path d="M-9 -6 Q-3 -2 0 2 M9 -6 Q3 -2 0 2 M0 2 V9" fill="none" stroke="${MI.w}" stroke-width="2.6" stroke-linecap="round"/><path d="M9 -6 Q3 -2 0 2" fill="none" stroke="#c8a060" stroke-width="2.6" stroke-linecap="round"/>`],
  recifeantigo: ["#8a3a6a", MI_HOUSE("#f0c040", "#2a8a8a")],
  olinda: ["#3a7a4a", `<path d="M-9 9 Q0 2 9 9Z" fill="${MI.l}" ${MI.s}/><rect x="-4" y="-3" width="8" height="8" fill="${MI.c}" ${MI.s}/><path d="M-5 -3 L0 -7 L5 -3Z" fill="${MI.r}" ${MI.s}/><path d="M0 -11 V-7 M-1.6 -9.4 H1.6" stroke="${MI.k}" stroke-width="1.2"/>`],
  orla: ["#2a7a9a", `<path d="M-9 1 Q0 7 9 1 L7 -1 H-7Z" fill="${MI.t}" ${MI.s}/><path d="M-9 1 Q-10 -4 -7 -6 L-6 -2Z" fill="#e8a020" ${MI.s}/><path d="M1 -1 V-9 L6 -2Z" fill="${MI.c}" ${MI.s}/>` + MI_WAVE(7)],
  beira: ["#2a7a8a", `<path d="M-8 2 Q0 6 8 2 L6 -1 H-6Z" fill="${MI.t}" ${MI.s}/><path d="M-8 2 Q-10 -3 -7 -6 Q-4 -7 -4 -3 L-5 -1Z" fill="#e5401c" ${MI.s}/><circle cx="-6.5" cy="-4.5" r="1" fill="#ffd23a"/>` + MI_WAVE(7)],   // barquinho com a carranca de juba vermelha
  caatinga: ["#b8763a", `<path d="M-1.6 8 V-7 Q0 -9.5 1.6 -7 V8Z" fill="#5a9a3a" ${MI.s}/><path d="M-1.6 1 H-5 V-4 M1.6 3 H5 V-2" fill="none" stroke="#5a9a3a" stroke-width="2.4" stroke-linecap="round"/>`],
  serra: ["#a84a2a", `<path d="M-9 7 L-3 -6 L1 1 L4 -3 L9 7Z" fill="#d8784a" ${MI.s}/><path d="M-3 -6 L-1 -2 L-5 -2Z" fill="${MI.c}"/>`],
  parquebsb: ["#6a8a2a", `<rect x="-1" y="-3" width="2" height="10" fill="${MI.t}"/><path d="M0 -3 L-8 -7 M0 -3 L-7 -1 M0 -3 L8 -7 M0 -3 L7 -1 M0 -3 L-3 -9 M0 -3 L3 -9" stroke="#5a9a3a" stroke-width="2.2" stroke-linecap="round"/>` + MI_WAVE(8)],   // buriti na vereda
  planopiloto: ["#3a7ab8", `<rect x="-3" y="-9" width="2.2" height="12" fill="${MI.c}" ${MI.s}/><rect x=".8" y="-9" width="2.2" height="12" fill="${MI.c}" ${MI.s}/><path d="M-9 3 H9 L7 7 H-7Z" fill="#cfd8dc" ${MI.s}/><path d="M-8 3 Q-6.5 -1 -4 -1 V3Z M4 3 V-1 Q6.5 -1 8 3Z" fill="${MI.c}" ${MI.s}/>`],   // o Congresso: as duas torres e as cúpulas
  centrobonito: ["#2a9aa8", MI_HOUSE("#f0e6d0", "#c8603a") + `<circle cx="6" cy="6" r="2.4" fill="${MI.w}" ${MI.s}/>`],   // casinha e a fonte
  gruta: ["#3a3a5a", `<path d="M-9 8 Q-9 -8 0 -8 Q9 -8 9 8Z" fill="#7a7468" ${MI.s}/><path d="M-5 8 Q-5 -3 0 -3 Q5 -3 5 8Z" fill="${MI.k}"/><ellipse cx="0" cy="6" rx="4" ry="1.6" fill="#3a8aff"/><path d="M-2 -3 l1 3 l1 -3 M2 -3 l.6 2 l.6 -2" fill="${MI.c}"/>`],   // boca da gruta, estalactites e o lago azul
  rioprata: ["#2aa8b8", `<path d="M-9 -2 Q0 4 9 -2 V9 H-9Z" fill="#7ae0e8" ${MI.s}/><path d="M-5 3 l4 -2 v4 Z M1 1 q3 -1 5 1 q-2 2 -5 1Z" fill="#e8a020"/>` + MI_WAVE(-4, "#cfeeff", 1.4)],   // água transparente com os peixes
  chapada: ["#b8583a", `<path d="M-9 8 V-4 L-5 -7 H-1 V8Z M3 8 V-6 L6 -8 L9 -5 V8Z" fill="#d8784a" ${MI.s}/><path d="M-1 -5 Q1 -5 1 -3 V8 H3 V-4" fill="none" stroke="${MI.w}" stroke-width="1.8"/>` + MI_WAVE(8)],   // paredão com a cachoeira no meio
  pantanal: ["#3a8a7a", `<path d="M-2 8 V-1 M2 8 V-1" stroke="${MI.k}" stroke-width="1.4"/><ellipse cx="0" cy="-2" rx="5" ry="3.5" fill="${MI.c}" ${MI.s}/><path d="M-3 -3 V-8" stroke="${MI.k}" stroke-width="2.4"/><rect x="-4.2" y="-5" width="2.4" height="1.6" fill="${MI.r}"/><path d="M-3 -8.5 L-9 -7" stroke="${MI.k}" stroke-width="1.6" stroke-linecap="round"/>` + MI_WAVE(8)],   // tuiuiú no alagado
  tiradentes: ["#2a5aa8", `<rect x="-8" y="-2" width="16" height="9" fill="${MI.c}" ${MI.s}/><rect x="-8" y="-8" width="4" height="6" fill="${MI.c}" ${MI.s}/><rect x="4" y="-8" width="4" height="6" fill="${MI.c}" ${MI.s}/><path d="M-8 -8 L-6 -10 L-4 -8 M4 -8 L6 -10 L8 -8" fill="#c88a3a" stroke="#1a1426" stroke-width="1"/><path d="M-1.6 7 V2 H1.6 V7" fill="#6d4329"/><circle cy="-1" r="1.3" fill="#2a5aa8"/>`],   // igreja barroca de duas torres
  mina: ["#4a3a2a", `<path d="M-9 8 L-9 -4 L9 -4 L9 8Z" fill="#7a6a5a" ${MI.s}/><path d="M-6 8 L-6 -1 L6 -1 L6 8Z" fill="${MI.k}"/><rect x="-10" y="-7" width="20" height="3" fill="#9c6339" ${MI.s}/><path d="M-4 7.5 L4 7.5" stroke="#b8a070" stroke-width="1.5"/><circle cx="0" cy="3" r="1.4" fill="#ffd23a"/>`],   // boca da mina com escora de madeira e um brilho de ouro lá dentro
  ladeiras: ["#6a5a4a", `<path d="M-9 8 L9 -2 L9 8Z" fill="#8a847a" ${MI.s}/><path d="M-5 6 l2 -1 M0 3 l2 -1 M5 0 l2 -1" stroke="#5a544a" stroke-width="1.2"/><rect x="-8" y="-6" width="7" height="7" fill="${MI.c}" ${MI.s}/><path d="M-9 -6 L-4.5 -9.5 L0 -6Z" fill="${MI.r}" ${MI.s}/><rect x="-6" y="-4" width="2" height="2" fill="#2a5aa8"/>`],   // ladeira de pedra e casarão
  serracurral: ["#4a6a8a", `<path d="M-9 7 L-4 -3 L-1 1 L3 -7 L9 7Z" fill="#8a6a5a" ${MI.s}/><path d="M3 -7 L5 -3 L1 -3Z" fill="${MI.c}"/><path d="M-9 7 L-6 3 L-3 5 L0 2 L4 4 L9 7Z" fill="#5a8a4a"/>`],   // a serra cor de ferro com mata embaixo
  copacabana: ["#2a8ac8", `<path d="M-9 4 Q-8 -8 -4 -7 Q-1 -4 0 4Z M0 4 Q3 -2 6 -1 Q9 1 9 4Z" fill="#5a8a5a" ${MI.s}/>` + MI_WAVE(7)],   // o Pão de Açúcar e o mar
  tijuca: ["#2a6a3a", `<path d="M-9 8 L-3 -5 L1 -5 L9 8Z" fill="#3a8a3a" ${MI.s}/><path d="M-1 -10 V-5 M-3 -8.5 H1" stroke="${MI.c}" stroke-width="1.4"/>` + MI_TREE(-6, 3, 3, "#2a6a2a")],   // o morro coberto de mata
  paulista: ["#5a5a6a", `<rect x="-5" y="-9" width="10" height="9" fill="#8ab0d0" ${MI.s}/><rect x="-9" y="-1" width="18" height="5" fill="#9aa0a8" ${MI.s}/><rect x="-9" y="-1" width="2" height="9" fill="${MI.r}" ${MI.s}/><rect x="7" y="-1" width="2" height="9" fill="${MI.r}" ${MI.s}/>`],   // o museu de pernas vermelhas e o prédio atrás
  ibirapuera: ["#4a9a4a", `<ellipse cy="5" rx="9" ry="3" fill="${MI.w}" ${MI.s}/>` + MI_TREE(-4, -3, 4, "#4a9a3a") + `<ellipse cx="4" cy="1" rx="3.5" ry="2.2" fill="#a8703f" ${MI.s}/>`],   // o lago, a árvore e a capivara
  mercadocentral: ["#3a7ab8", `<path d="M-8 -1 V5 Q0 9 8 5 V-1Z" fill="#e8c860" ${MI.s}/><ellipse cy="-1" rx="8" ry="3.4" fill="#f8e6a0" ${MI.s}/><path d="M0 -1 L8 -1 L8 5 L0 5Z" fill="#f8e6a0" ${MI.s}/><circle cx="3" cy="2" r=".9" fill="#c8a040"/><circle cx="5.5" cy="3.5" r=".7" fill="#c8a040"/>`],   // queijo minas com a fatia cortada
  portocuiaba: ["#c8603a", MI_TREE(-3, 1, 5, "#f0c020") + `<path d="M2 8 V-1 H9 V8Z" fill="${MI.c}" ${MI.s}/><path d="M1 -1 L5.5 -5 L10 -1Z" fill="${MI.r}" ${MI.s}/>`],   // ipê-amarelo e casario
  setecidades: ["#a8603a", `<path d="M-9 8 V0 Q-9 -5 -5 -5 Q-2 -5 -2 0 V8Z M0 8 V-3 Q0 -9 5 -9 Q9 -9 9 -3 V8Z" fill="#c8845a" ${MI.s}/><path d="M3 -4 l2 2 l2 -2 M-7 1 h3" stroke="#e8402a" stroke-width="1.1" fill="none"/>`],   // as pedras de Sete Cidades com pintura antiga
  arrecifes: ["#2a8ac8", `<path d="M-2 8 Q-1 0 2 -5" stroke="${MI.t}" stroke-width="2" fill="none"/><path d="M2 -5 Q-6 -8 -8 -3 M2 -5 Q8 -9 9 -2 M2 -5 Q0 -11 -4 -10 M2 -5 Q6 -11 8 -9" stroke="#3a9a3a" stroke-width="2.2" stroke-linecap="round" fill="none"/>` + MI_WAVE(8, "#cfeeff", 1.4)],   // coqueiro na praia
  cataratas: ["#2a7a5a", `<path d="M-10 -6 H10 V8 H-10Z" fill="#5a5650" ${MI.s}/><path d="M-7 -6 V8 M-2 -6 V8 M3 -6 V8 M8 -6 V8" stroke="${MI.w}" stroke-width="2.4"/><path d="M-10 8 Q0 4 10 8" fill="none" stroke="#f0f8ff" stroke-width="1.6"/>`],   // as quedas d'água
  dunas: ["#2a8aa8", `<path d="M-10 6 Q-5 -6 1 4 Q5 -3 10 6Z" fill="#f0e6cc" ${MI.s}/>` + MI_WAVE(8)],   // as dunas e o mar
  coxilhas: ["#7a9a4a", `<path d="M-10 8 Q-5 -2 0 4 Q5 -4 10 8Z" fill="#a8c070" ${MI.s}/>` + MI_TREE(4, -2, 4, "#3a6a2a")],   // as coxilhas com um umbu no alto
  lagoa: ["#2a6ab8", `<path d="M-10 4 H10" stroke="${MI.c}" stroke-width="2"/><path d="M-6 4 V-7 M6 4 V-7" stroke="#c8c8d0" stroke-width="2"/><path d="M-10 2 Q-6 -8 0 0 Q6 -8 10 2" fill="none" stroke="#c8c8d0" stroke-width="1.4"/>` + MI_WAVE(7)],   // a ponte Hercílio Luz
  estancia: ["#6a8a3a", `<path d="M-6 -2 Q-7 8 0 9 Q7 8 6 -2Z" fill="#8a5a2a" ${MI.s}/><ellipse cy="-2" rx="6" ry="2" fill="#3a8a3a" ${MI.s}/><path d="M2 -2 L6 -10" stroke="#c8c8d0" stroke-width="1.8"/>`],   // a cuia de chimarrão com a bomba
  centrofoz: ["#7a4ac8", `<path d="M-2 9 L-1 -8 L1 -8 L2 9Z" fill="${MI.c}" ${MI.s}/><rect x="-2" y="-2" width="4" height="3" fill="#3a9a4a"/><rect x="-2" y="1" width="4" height="3" fill="#e8402a"/><rect x="-2" y="4" width="4" height="3" fill="#4a8ad8"/>` + MI_WAVE(8)],   // o Marco das Três Fronteiras, com as cores dos três países
  largoordem: ["#3a5a8a", `<path d="M-9 9 V-1 L0 -8 L9 -1 V9Z" fill="#d8b8e0" ${MI.s}/><path d="M-3 9 V1 H3 V9Z M-7 -1 H7" fill="#6a8ab8" stroke="#6a8ab8" stroke-width="1"/>`],   // a Ópera de Arame, de vidro e ferro
  barigui: ["#3a7a4a", `<rect x="-1" y="0" width="2" height="9" fill="${MI.t}"/><path d="M-9 0 Q0 -5 9 0 M-7 -4 Q0 -8 7 -4" fill="none" stroke="#2f6a34" stroke-width="2.6" stroke-linecap="round"/><path d="M4 -9 l3 1 l-3 1Z" fill="#2a5ad8"/>`],   // araucária com a gralha-azul no topo
  araucaria: ["#1a2a3a", `<rect x="-1" y="0" width="2" height="9" fill="${MI.t}"/><path d="M-9 0 Q0 -5 9 0 M-7 -4 Q0 -8 7 -4" fill="none" stroke="#1e4e2a" stroke-width="2.6" stroke-linecap="round"/><circle cx="5" cy="-8" r="3.5" fill="#2a2a34"/><path d="M3.6 -8.4 h1.2 M5.6 -8.4 h1.2" stroke="#ff2a2a" stroke-width="1"/>`],   // araucária com a fumaça de Pytuna
  curitiba: ["#4a3a8a", `<rect x="-1.2" y="-1" width="2.4" height="9" fill="${MI.t}"/><path d="M-8 -1 Q0 -6 8 -1 M-6 -5 Q0 -9 6 -5" fill="none" stroke="#3a7a3a" stroke-width="2.6" stroke-linecap="round"/>`]
};
MAP_ICON.terminal = MAP_ICON.parada;   // o cais de Belém também é o barco de linha
// rodoviárias do Nordeste: o ônibus de viagem de lado, com as janelas e as rodas
MAP_ICON.rodo_slz = MAP_ICON.rodo_the = MAP_ICON.rodo_pet = MAP_ICON.rodo_rec = ["#3a6a4a", `<rect x="-9" y="-6" width="18" height="11" rx="2" fill="${MI.c}" ${MI.s}/><path d="M-8 1 H8" stroke="#2a8a5a" stroke-width="2"/><path d="M-7 -4 h3 m1 0 h3 m1 0 h3" stroke="#2a4a6a" stroke-width="2.4"/><rect x="5" y="-4" width="3" height="4" fill="#2a4a6a"/><circle cx="-5" cy="6" r="2" fill="${MI.k}"/><circle cx="5" cy="6" r="2" fill="${MI.k}"/>`];
// aeroportos (última parada da cidade): o avião de linha visto de cima, com as asas abertas e a cauda
MAP_ICON.aero_bel = MAP_ICON.aero_rec = MAP_ICON.aero_bsb = MAP_ICON.aero_cnf = MAP_ICON.aero_gru = MAP_ICON.aero_igu = ["#3a5a8a", `<path d="M0 -10 Q2 -9 2 -5 V-1 L10 3 V5 L2 3 V7 L5 9 V10 L0 9 L-5 10 V9 L-2 7 V3 L-10 5 V3 L-2 -1 V-5 Q-2 -9 0 -10Z" fill="${MI.c}" ${MI.s}/><path d="M-1 -6 H1" stroke="#2a4a6a" stroke-width="2"/>`];
// no mapa grande, cada cidade aparece com o desenho do lugar dela
const CITY_ICON = {ananindeua: "aldeia", belem: "veropeso", saoluis: "praiagrande", teresina: "encontro", recife: "recifeantigo", petrolina: "orla", cuiaba: "portocuiaba", bonito: "centrobonito", brasilia: "planopiloto", bh: "mercadocentral", ouropreto: "tiradentes", riodejaneiro: "copacabana", saopaulo: "paulista", foz: "centrofoz", cwb: "largoordem", pampa: "estancia", floripa: "lagoa"};
// disco do ponto do mapa (r = raio): cor da área, aro claro e o desenho; sem desenho, a bolinha de antes
function mapIcon(k, r = 15) {
  const a = MAP_ICON[k]; if (!a) return `<circle r="10"/>`;
  return `<g class="micon"><circle class="mdisc" r="${r}" fill="${a[0]}"/><g transform="scale(${(r / 13).toFixed(2)})">${a[1]}</g></g>`;
}

/* ---------- mapa do Brasil com relevo e vegetação (openBrasil, systems/world-map.js) ----------
   brasilFundo() = o que fica atrás da terra: mar com ondinhas, os países vizinhos em tom de papel, a espuma da costa e a
   rosa dos ventos. brasilTerreno(apagada) = o que fica por cima das regiões pintadas: rios, serras e chapadas em lugares
   fixos (BR_RIOS, BR_FIXOS) e a vegetação de cada região espalhada dentro dela (BR_MATO: floresta fechada no Norte,
   mandacaru no sertão, árvore torta do cerrado, mata e serra no Sudeste, araucária e capim do pampa no Sul).
   A espalhada usa sorteio com semente fixa (sempre o mesmo mapa), só dentro do contorno e longe dos pontos das regiões.
   apagada(k) = região ainda fechada: o desenho dela fica cinza. Tudo em coordenadas do viewBox do mapa (80 80 400 480). */
const BR_RIOS = [
  "M100 268 C150 262 200 250 250 222 S310 170 334 152",            // Amazonas
  "M150 178 C180 200 215 215 240 228", "M180 345 C205 310 225 270 262 214", "M262 300 C265 270 270 240 284 196",   // Negro, Madeira, Tapajós
  "M300 300 C300 260 305 220 310 178", "M330 330 C328 280 335 220 342 162",                                        // Xingu, Tocantins
  "M360 400 C362 360 372 330 392 312 S420 298 428 298",            // São Francisco
  "M222 330 C216 360 222 390 236 420", "M330 390 C300 410 275 430 262 452",                                        // Paraguai, Paraná
  "M330 460 C305 462 285 458 262 452", "M320 478 C295 476 275 480 252 492"];                                       // Iguaçu, Uruguai
const BR_GLIFO = {
  arvore: `<circle r="5" fill="#2b6e38" stroke="#123a1c" stroke-width=".8"/><circle cx="-1.4" cy="-1.6" r="2.8" fill="#4d9c50"/>`,
  mata: `<circle r="4.4" fill="#2f7a4a" stroke="#123a1c" stroke-width=".8"/><circle cx="-1.2" cy="-1.4" r="2.3" fill="#5aa868"/>`,
  cacto: `<path d="M0 6V-6M0 0H-3.5V-3.5M0 -1.5H3.5V-5" fill="none" stroke="#1c3a1c" stroke-width="3.4" stroke-linecap="round"/><path d="M0 6V-6M0 0H-3.5V-3.5M0 -1.5H3.5V-5" fill="none" stroke="#5a9a4a" stroke-width="1.9" stroke-linecap="round"/>`,
  seco: `<path d="M-3 4L0 -1L3 4M0 -1V-4M-2 -3L0 -1L2.5 -3.5" fill="none" stroke="#7a5a2e" stroke-width="1.1" stroke-linecap="round"/>`,
  cerrado: `<path d="M0 6C-2 3 2 1 0 -2" fill="none" stroke="#5a3c1e" stroke-width="1.6" stroke-linecap="round"/><ellipse cy="-4" rx="5.5" ry="3" fill="#7a9a3a" stroke="#2e3e14" stroke-width=".8"/><ellipse cx="-1.5" cy="-4.8" rx="2.6" ry="1.3" fill="#a0bc54"/>`,
  morro: `<path d="M-9 5L-1 -8L4 -1L7 -4L11 5Z" fill="#9a8662" stroke="#3e3222" stroke-width=".9" stroke-linejoin="round"/><path d="M-1 -8L4 -1L1 5H-3Z" fill="#6e5c40"/><path d="M-1 -8L-3 -4L0 -5L1.5 -3.5Z" fill="#efe6d0"/>`,
  serra: `<path d="M-8 4L-2 -6L2 0L5 -3L9 4Z" fill="#5c8a5a" stroke="#1e3a24" stroke-width=".9" stroke-linejoin="round"/><path d="M-2 -6L2 0L0 4H-3Z" fill="#3c6a44"/>`,
  chapada: `<path d="M-9 5L-6 -4H6L9 5Z" fill="#c08a54" stroke="#4a2e16" stroke-width=".9" stroke-linejoin="round"/><path d="M2 -4H6L9 5H4Z" fill="#94623a"/><path d="M-6 -4H6" stroke="#e8c890" stroke-width="1.2"/>`,
  araucaria: `<path d="M0 7V-4" stroke="#4a3018" stroke-width="1.5"/><path d="M-6 -3C-3 -1 3 -1 6 -3M-5 -6C-2 -4 2 -4 5 -6M-3 -8.5C-1 -7 1 -7 3 -8.5" fill="none" stroke="#1e4a2a" stroke-width="2.3" stroke-linecap="round"/><path d="M-6 -3C-3 -1 3 -1 6 -3M-5 -6C-2 -4 2 -4 5 -6" fill="none" stroke="#3a7a46" stroke-width="1" stroke-linecap="round"/>`,
  capim: `<path d="M-3 3L-4 -2M0 3V-3.5M3 3L4 -2" fill="none" stroke="#5a7a2a" stroke-width="1.2" stroke-linecap="round"/>`,
  duna: `<path d="M-8 3C-4 -4 3 -4 8 3Z" fill="#f2e2b0" stroke="#a88a4a" stroke-width=".8"/><path d="M-1 -2C2 -1 5 1 8 3" fill="none" stroke="#d8c080" stroke-width="1"/>`,
  coqueiro: `<path d="M0 6C1 2 0 -1 -1 -4" fill="none" stroke="#6a4a22" stroke-width="1.5" stroke-linecap="round"/><path d="M-1 -4L-6 -3M-1 -4L-5 -8M-1 -4L0 -9M-1 -4L4 -7M-1 -4L5 -3" fill="none" stroke="#2e7a3a" stroke-width="1.6" stroke-linecap="round"/>`,
  brejo: `<path d="M-7 2C-5 0 -3 4 -1 2S3 0 5 2" fill="none" stroke="#3a8ac0" stroke-width="1.4" stroke-linecap="round"/><path d="M4 0V-5M6 0L7.5 -4" stroke="#3a7a3a" stroke-width="1.1" stroke-linecap="round"/>`,
  queda: `<path d="M-5 -5H5V5H-5Z" fill="#e8f6ff" stroke="#3a6a9a" stroke-width=".9"/><path d="M-3 -5V5M0 -5V5M3 -5V5" stroke="#86c8ee" stroke-width="1.1"/><path d="M-7 6C-3 3 3 3 7 6" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`
};
// o que tem lugar certo: [glifo, x, y, tamanho]
const BR_FIXOS = [
  ["morro", 212, 116, 1], ["morro", 158, 172, .9], ["serra", 300, 232, .9], ["serra", 250, 128, .8],                               // Roraima, Pico da Neblina, Carajás, Tumucumaque
  ["duna", 372, 182, .9], ["duna", 386, 190, .8], ["duna", 399, 197, .7], ["chapada", 404, 302, .9], ["morro", 428, 236, .7], ["serra", 398, 226, .7],   // Lençóis, Diamantina, Borborema, Araripe
  ["coqueiro", 441, 222, .9], ["coqueiro", 443, 262, .9], ["coqueiro", 426, 318, .9], ["coqueiro", 418, 352, .8],
  ["chapada", 246, 352, 1], ["chapada", 318, 318, .9], ["brejo", 228, 388, 1], ["brejo", 222, 372, .9], ["brejo", 236, 402, .9], ["brejo", 214, 358, .8],   // Guimarães, Veadeiros, Pantanal
  ["morro", 384, 392, .9], ["morro", 372, 404, .8], ["morro", 398, 378, .8], ["serra", 380, 356, .9], ["serra", 386, 336, .8], ["serra", 362, 420, .7],   // Mantiqueira, Serra do Mar, Espinhaço
  ["serra", 326, 468, .9], ["serra", 316, 484, .8], ["queda", 266, 452, .8]];                                                         // Serra Geral e as Cataratas
// vegetação espalhada por região: [glifo, quantos, distância mínima, filtro (x, y) opcional, tamanho]
const BR_MATO = {
  norte: [["arvore", 110, 11.5]],
  nordeste: [["cacto", 16, 17, (x, y) => x < 432], ["seco", 14, 15, (x, y) => x < 436]],
  centroeste: [["cerrado", 24, 16]],
  sudeste: [["mata", 16, 12, (x, y) => x > 350], ["cerrado", 5, 16, (x, y) => x <= 350]],
  sul: [["araucaria", 11, 15, (x, y) => y < 494], ["capim", 12, 12, (x, y) => y >= 494]]
};
// caminho só com M, L, H, V e Z (as áreas das regiões e o contorno) -> lista de pontos
function brPontos(d) {
  const tk = d.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g), pts = []; let c = "", i = 0, x = 0, y = 0;
  while (i < tk.length) {
    if (/[MLHVZ]/.test(tk[i])) { c = tk[i++]; if (c === "Z") continue; }
    if (c === "H") x = +tk[i++]; else if (c === "V") y = +tk[i++]; else { x = +tk[i++]; y = +tk[i++]; }
    pts.push([x, y]);
  }
  return pts;
}
const brDentro = (P, x, y) => { let d = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) d = !d; return d; };
let BR_CACHE = null;
function brasilEspalha() {   // sorteia uma vez (semente fixa) onde fica cada planta
  if (BR_CACHE) return BR_CACHE;
  const B = MAP_REGIONS.brasil, terra = brPontos(B.land[0]), out = {}; let s = 20261;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648, postos = BR_FIXOS.map(f => [f[1], f[2], 10]);
  const naTerra = (x, y) => [[0, 0], [6, 0], [-6, 0], [0, 6], [0, -6]].every(([a, b]) => brDentro(terra, x + a, y + b));
  const livre = (x, y, dist) => Object.values(REGIONS).every(r => Math.hypot(x - r.pos[0], y - r.pos[1]) > 24 && !(Math.abs(x - r.pos[0]) < 40 && y > r.pos[1] + 12 && y < r.pos[1] + 36)) && postos.every(p => Math.hypot(x - p[0], y - p[1]) > Math.max(dist, p[2]) * .85);
  for (const k of Object.keys(BR_MATO)) {
    const area = brPontos(B.area[k]); out[k] = [];
    for (const [g, n, dist, filtro] of BR_MATO[k]) {
      let postosAqui = 0;
      for (let tent = 0; tent < 4000 && postosAqui < n; tent++) {
        const x = 96 + rnd() * 360, y = 96 + rnd() * 450;
        if (!brDentro(area, x, y) || !naTerra(x, y) || (filtro && !filtro(x, y)) || !livre(x, y, dist)) continue;
        postos.push([x, y, dist]); out[k].push([g, Math.round(x), Math.round(y), .8 + rnd() * .3]); postosAqui++;
      }
    }
    out[k].sort((a, b) => a[2] - b[2]);   // os de baixo por cima
  }
  for (const f of BR_FIXOS) { const k = Object.keys(B.area).find(q => brDentro(brPontos(B.area[q]), f[1], f[2])) || "norte"; out[k].push(f); }
  return BR_CACHE = out;
}
function brasilFundo() {
  const B = MAP_REGIONS.brasil, land = B.land.map(d => `<path d="${d}"/>`).join(""); let s = 7, ondas = "";
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648, terra = brPontos(B.land[0]);
  for (let i = 0; i < 46; i++) { const x = 86 + rnd() * 388, y = 86 + rnd() * 468; if (x > 300 - (y - 80) * .05 && !brDentro(terra, x, y) && !brDentro(terra, x - 14, y) && !brDentro(terra, x, y + 10)) ondas += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}q3 -3 6 0t6 0"/>`; }
  return `<rect class="br-mar" x="80" y="80" width="400" height="480" rx="10"/><g class="br-ondas">${ondas}</g>` +
    `<path class="br-vizinho" d="M80 80H304L312 98L250 300L300 548L288 560H80Z"/>` +
    `<g class="br-espuma">${land}</g>` +
    `<g class="br-rosa" transform="translate(118 512)"><circle r="15"/><path d="M0 -19L4 -4L19 0L4 4L0 19L-4 4L-19 0L-4 -4Z"/><path class="n" d="M0 -19L4 -4H-4Z"/><text y="-22" text-anchor="middle">N</text></g>` +
    `<text class="br-oceano" transform="translate(452 452) rotate(-72)" text-anchor="middle">${t("Oceano Atlântico")}</text>`;
}
function brasilTerreno(apagada) {
  const E = brasilEspalha(), rios = BR_RIOS.map(d => `<path d="${d}"/>`).join("");
  const mato = Object.keys(E).map(k => `<g class="br-mato${apagada(k) ? " shut" : ""}">` + E[k].map(([g, x, y, z]) => `<g transform="translate(${x} ${y}) scale(${(+z).toFixed(2)})">${BR_GLIFO[g]}</g>`).join("") + `</g>`).join("");
  return `<g class="br-terreno" clip-path="url(#brLand)"><g class="br-rios-b">${rios}</g><g class="br-rios">${rios}</g>${mato}</g>`;
}

/* ---------- vegetação e relevo nos mapas das regiões e das cidades (os mesmos desenhos do mapa do Brasil: BR_GLIFO) ----------
   mapaEspalha(...) sorteia, com semente fixa pelo nome do lugar, onde fica cada planta: só dentro do contorno, longe dos
   pontos clicáveis (e do nome embaixo deles), da trilha, da estrada e do rio. MAPA_MATO_REG = o que nasce em cada região
   (mapa grande) e MAPA_MATO_CID = em cada tipo de cidade (CITY[...].look). Chamados em setupMapRegion (world-map.js) e
   buildLocalNodes (local.js); `?visual=velho` deixa os mapas como antes. Lista: [glifo, quantos, distância mínima, filtro (x, y) opcional]. */
const MAPA_MATO_REG = {
  norte: [["serra", 4, 80], ["arvore", 120, 21]],
  nordeste: [["chapada", 3, 90], ["duna", 6, 46], ["coqueiro", 9, 40], ["cacto", 24, 32], ["seco", 20, 28]],
  centroeste: [["chapada", 5, 74], ["brejo", 9, 42], ["cerrado", 46, 28]],
  sudeste: [["morro", 10, 50], ["mata", 46, 25]],
  sul: [["serra", 6, 60], ["araucaria", 30, 27, (x, y) => y < 340], ["capim", 30, 22, (x, y) => y >= 300]]   // araucária em cima (Paraná e Santa Catarina), capim do pampa embaixo
};
const MAPA_MATO_CID = {
  mata: [["arvore", 70, 16]], cidade: [["mata", 16, 24]], litoral: [["duna", 5, 40], ["coqueiro", 16, 26], ["mata", 16, 22]],
  sertao: [["chapada", 2, 70], ["cacto", 18, 26], ["seco", 18, 22]], cerrado: [["chapada", 3, 64], ["cerrado", 30, 22]],
  minas: [["morro", 7, 42], ["mata", 24, 20]], sul: [["araucaria", 20, 24], ["capim", 18, 20]]
};
// pontos ao longo de um caminho do SVG (para a vegetação não nascer em cima dele); sem medida, lista vazia
function mapaAmostra(el, passo = 10) {
  const out = []; if (!el || !el.getAttribute("d")) return out;
  try { const L = el.getTotalLength(); for (let u = 0; u <= L; u += passo) { const p = el.getPointAtLength(u); out.push([p.x, p.y]); } } catch (_) {}
  return out;
}
// polys = contornos (listas de pontos); evita = [x, y, raio]; nomes = pontos com nome embaixo; esc = tamanho dos desenhos
function mapaEspalha(chave, polys, mix, evita, nomes, esc, caixa) {
  let s = 17; for (const ch of chave) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648, postos = evita.slice(), out = [], m = 7 * esc;
  const dentro = (x, y) => polys.some(P => brDentro(P, x, y)), naTerra = (x, y) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].every(([a, b]) => dentro(x + a, y + b));
  const semNome = (x, y) => nomes.every(([nx, ny]) => !(Math.abs(x - nx) < 46 * esc && y > ny + 10 && y < ny + 40 * esc));
  for (const [g, n, dist, filtro] of mix) {
    let k = 0;
    for (let tent = 0; tent < 5000 && k < n; tent++) {
      const x = caixa[0] + rnd() * caixa[2], y = caixa[1] + rnd() * caixa[3];
      if ((filtro && !filtro(x, y)) || !naTerra(x, y) || !semNome(x, y) || !postos.every(p => Math.hypot(x - p[0], y - p[1]) > Math.max(dist * .8, p[2]))) continue;
      postos.push([x, y, dist * .8]); out.push([g, Math.round(x), Math.round(y), esc * (.85 + rnd() * .3)]); k++;
    }
  }
  return out.sort((a, b) => a[2] - b[2]).map(([g, x, y, z]) => `<g transform="translate(${x} ${y}) scale(${z.toFixed(2)})">${BR_GLIFO[g]}</g>`).join("");
}
const mapaPolido = () => typeof POLISH === "undefined" || POLISH;
function mapaRegiaoMato() {   // mapa grande da região aberta (MAP_REGION)
  const svg = $("mapsvg"), g = $("mapdeco"); if (!g) return;
  const R = MAP_REGIONS[MAP_REGION], mix = MAPA_MATO_REG[MAP_REGION];
  if (!mapaPolido() || !mix) { g.innerHTML = ""; return; }
  const nomes = Object.values(R.pos).map(p => [p[0], p[1]]), evita = nomes.map(p => [p[0], p[1], 30]);
  for (const p of mapaAmostra($("route"), 12)) evita.push([p[0], p[1], 13]);
  for (const p of mapaAmostra(svg.querySelector(".land .river"), 12)) evita.push([p[0], p[1], 12]);
  g.innerHTML = mapaEspalha("reg-" + MAP_REGION, R.land.map(brPontos), mix, evita, nomes, 1.5, [0, 0, 600, 620]);
}
function mapaCidadeMato() {   // mapa da cidade atual
  const g = $("ldeco"); if (!g) return;
  const C = CITY[curCity()], mix = MAPA_MATO_CID[C.look || "mata"];
  if (!mapaPolido() || !mix) { g.innerHTML = ""; return; }
  const terra = C.land.trim().split(/\s+/).map(p => p.split(",").map(Number)), nomes = C.route.map(k => [SUB[k].x, SUB[k].y]), evita = nomes.map(p => [p[0], p[1], 24]);
  for (const el of [...document.querySelectorAll("#lroutes .lroute"), $("lriver"), document.querySelector("#lroad .lroad")]) for (const p of mapaAmostra(el, 9)) evita.push([p[0], p[1], 11]);
  g.innerHTML = mapaEspalha("cid-" + curCity(), [terra], mix, evita, nomes, 1.05, [0, 0, 440, 325]);
}
