/* Efeitos sonoros 8-bit, fanfarras e som de impacto. Tudo sai pelo ganho master, que o botão de som silencia. */
let AC, master, muted = false, NB, musicOut = null, sfxOut = null;   // master = som ligado/desligado; musicOut/sfxOut = volumes das opções
// o navegador só libera o áudio depois de um gesto do jogador; chamado em cada clique
function audio() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted ? 0 : .5; master.connect(AC.destination);
    musicOut = AC.createGain(); musicOut.connect(master); sfxOut = AC.createGain(); sfxOut.connect(master);
    applyVolumes();
  }
  if (AC.state === "suspended") AC.resume();
}
function tone(f, t, d, type, v, f2) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(sfxOut); o.start(t); o.stop(t + d + .02);
}
// 1 segundo de ruído branco, criado uma vez
function noiseBuffer() {
  if (!NB) { NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
}
function noise(t, d, v, hp) {
  noiseBuffer();
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = hp; s.buffer = NB;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(sfxOut); s.start(t); s.stop(t + d + .02);
}
const SFX = {
  blip:  t => tone(660, t, .05, "square", .05),
  spear: t => tone(900, t, .18, "square", .07, 200),
  // golpe que acerta, em camadas: estalo agudo (ataque), baque grave (peso) e ruído curto (textura)
  hit:   t => { tone(1400, t, .025, "square", .06, 500); tone(160, t, .16, "sine", .2, 45); noise(t, .12, .2, 500); tone(220, t, .15, "square", .1, 60); },
  // golpe perfeito: o baque de sempre, um "ting" brilhante por cima e um sub-grave
  perfeito: t => { SFX.hit(t); tone(1975, t + .01, .18, "triangle", .09); tone(2637, t + .05, .22, "triangle", .06); tone(70, t, .3, "sine", .18, 35); },
  // bloqueio na hora: metal batendo (duas parciais desafinadas) e um baque curto
  bloqueio: t => { tone(880, t, .2, "square", .06, 820); tone(1320, t, .16, "triangle", .07, 1250); noise(t, .06, .14, 3000); tone(120, t, .1, "sine", .14, 70); },
  // o anel ficou verde: tique discreto marcando a janela do tempo certo
  janela: t => tone(1568, t, .03, "triangle", .035),
  // ônibus na estrada: ronco grave do motor
  barco: t => { tone(58, t, .35, "sawtooth", .05, 54); tone(116, t + .02, .12, "square", .02, 110); tone(116, t + .18, .12, "square", .02, 110); noise(t, .25, .03, 300); },   // motor do barco de linha: toc-toc grave
  apito: t => { tone(196, t, .7, "sawtooth", .06, 192); tone(247, t, .7, "square", .025, 244); tone(196, t + .85, 1.1, "sawtooth", .06, 190); tone(247, t + .85, 1.1, "square", .025, 240); },   // apito do barco saindo
  onibus: t => { tone(70, t, .4, "sawtooth", .05, 60); tone(105, t + .05, .3, "square", .025, 95); noise(t, .3, .04, 200); },
  // esquiva: um "fuup" de ar (ruído agudo descendo) e um toque leve no chão
  esquiva: t => { noise(t, .16, .1, 2200); tone(900, t, .12, "triangle", .04, 300); tone(140, t + .1, .06, "sine", .06, 90); },
  // fúria pronta / golpe da fúria: subida rápida e um acorde forte
  furia: t => { [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * .04, .12, "square", .06)); [523, 659, 784].forEach(f => tone(f, t + .18, .35, "sawtooth", .045)); noise(t + .18, .25, .12, 1200); },
  crit:  t => { noise(t, .18, .25, 400); tone(440, t, .25, "square", .14, 80); tone(880, t + .05, .2, "square", .08, 160); },
  fire:  t => { noise(t, .4, .18, 1500); tone(300, t, .4, "sawtooth", .06, 900); },
  heal:  t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .07, .1, "square", .08)),
  guard: t => tone(150, t, .12, "triangle", .2, 100),
  look:  t => { tone(700, t, .08, "square", .06); tone(1000, t + .1, .08, "square", .06); },
  roar:  t => { noise(t, .5, .2, 200); tone(110, t, .5, "sawtooth", .14, 55); },
  // apresentação do chefe: sirene de alerta (dois tons, três vezes) e o rugido longo e grave que faz o chão tremer
  alarme: t => { for (let k = 0; k < 3; k++) { tone(880, t + k * .26, .11, "square", .045); tone(622, t + k * .26 + .13, .11, "square", .045); } },
  rugidoChefe: t => { noise(t, 1.1, .26, 260); tone(95, t, 1.1, "sawtooth", .16, 38); tone(142, t + .05, .9, "square", .07, 60); tone(48, t, 1.2, "sine", .22, 30); noise(t + .1, .7, .12, 900); },
  claw:  t => { noise(t, .1, .2, 3000); tone(1200, t, .12, "square", .06, 300); },
  agua:  t => { noise(t, .3, .14, 1200); tone(420, t, .2, "triangle", .05, 1300); tone(1300, t + .18, .1, "sine", .03, 600); },   // jato d'água do bicho
  vento: t => { noise(t, .5, .16, 700); noise(t + .15, .4, .1, 1600); tone(500, t, .45, "sine", .03, 900); },   // sopro de vento do Rhanon
  planta: t => { noise(t, .18, .14, 2400); tone(260, t, .16, "triangle", .06, 900); noise(t + .2, .05, .22, 4000); tone(1800, t + .2, .05, "square", .04, 700); },   // cipó estalando, folhas cortando
  choque: t => { [0, .05, .1, .16].forEach((o, i) => tone(i % 2 ? 1800 : 260, t + o, .05, "square", .05, i % 2 ? 900 : 520)); noise(t, .22, .08, 5000); },   // raio do poraquê
  hurt:  t => { tone(300, t, .2, "square", .12, 90); noise(t, .1, .18, 600); },
  more:  t => [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .06, .08, "square", .08)),
  // armeiro fabricando: três marteladas na bigorna e um brilho de "pronto!"
  forja: t => {
    [0, .2, .4].forEach((d, i) => { tone(1760 + i * 220, t + d, .16, "triangle", .1); tone(2640 + i * 330, t + d, .06, "square", .03); noise(t + d, .05, .16, 2500); tone(140, t + d, .08, "square", .08, 70); });
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + .62 + i * .06, .12, "square", .07));
  },
  // golpe crítico: "ting!" agudo em duas notas e um impacto grave
  ronco: t => ronco(t),
  galo: t => galo(t),
  missao: t => { tone(880, t, .12, "triangle", .08); tone(1320, t + .12, .22, "triangle", .08); tone(1760, t + .26, .18, "sine", .04); },
  uivo: t => uivo(t),
  critico: t => { tone(1568, t, .08, "square", .08); tone(2093, t + .07, .3, "triangle", .09); noise(t + .02, .3, .24, 300); tone(95, t + .02, .38, "sawtooth", .17, 40); }
};
function sfx(n) { if (AC) SFX[n](AC.currentTime); }
// abafa a música por um instante (golpe forte, fúria) para o impacto aparecer, e volta ao volume das opções
function musicDuck(ms = 450) {
  if (!AC || !musicOut) return;
  const g = musicOut.gain, t = AC.currentTime, v = OPT.music;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(v * .3, t + .03); g.setValueAtTime(v * .3, t + ms / 1000 * .4); g.linearRampToValueAtTime(v, t + ms / 1000);
}
/* ---------- vozes: ronco, galo e os bichos ---------- */
// oscilador com entrada suave, deslize de f até f2 e vibrato opcional (vib Hz, depth Hz)
function voice(f, t, d, type, v, f2, vib = 0, depth = 0) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = vib; lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + .05); }
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.04, d / 4)); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(sfxOut); o.start(t); o.stop(t + d + .05);
}
// ruído filtrado numa faixa (sopro, chiado, fungada); rise = segundos subindo antes de cair
function hum(t, d, v, freq, q = 2, rise = .02) {
  noiseBuffer();
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q; s.buffer = NB; s.loop = true;
  v *= 2.5;   // o filtro de faixa tira muito volume do ruído
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + rise); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(sfxOut); s.start(t, Math.random() * .5); s.stop(t + d + .05);
}
// ronco: puxa o ar arranhando e solta num assobio
function ronco(t) {
  hum(t, .75, .22, 180, 3, .5); voice(62, t, .75, "sawtooth", .05, 75, 22, 8);
  voice(1500, t + .85, .45, "sine", .09, 2000);
}
// uivo de lobo: sobe devagar, segura tremendo e cai
function uivo(t) {
  voice(360, t, .55, "triangle", .13, 620, 5, 6); voice(620, t + .5, 1.1, "triangle", .14, 380, 6, 16);
  voice(720, t + .5, 1.0, "sine", .05, 470, 6, 18); hum(t, 1.4, .03, 900, 1, .4);
}
// galo: "có-có-ri-cóóó"
function galo(t) {
  [[560, .11], [640, .11], [820, .17]].forEach(([f, d], i) => voice(f, t + i * .15, d, "sawtooth", .1, f * 1.05, 7, 12));
  voice(980, t + .5, .75, "sawtooth", .12, 640, 7, 25); hum(t + .5, .6, .04, 1800, 1);
}
// cada família de bicho tem um grito; k = volume (exploração mais baixo que a batalha)
const CRIES = {
  felino: (t, k) => { voice(95, t, .75, "sawtooth", .16 * k, 62, 26, 14); hum(t, .65, .14 * k, 380, 1.5, .1); },
  felinoP: (t, k) => { voice(170, t, .5, "sawtooth", .12 * k, 110, 30, 18); hum(t, .4, .1 * k, 700, 1.5, .06); },
  bode: (t, k) => voice(560, t, .7, "sawtooth", .09 * k, 500, 22, 45),   // béééé tremido
  roedor: (t, k) => [0, .11, .24].forEach((o, i) => voice(1800 + i * 200, t + o, .07, "triangle", .08 * k, 2500 - i * 300)),
  porco: (t, k) => [0, .16, .3].forEach(o => { voice(130, t + o, .12, "sawtooth", .12 * k, 85); hum(t + o, .1, .1 * k, 300, 2); }),
  macaco: (t, k) => { voice(380, t, .12, "triangle", .1 * k, 420); voice(420, t + .16, .12, "triangle", .1 * k, 470); voice(650, t + .34, .32, "triangle", .12 * k, 950, 9, 30); },
  ave: (t, k) => { voice(2600, t, .55, "sawtooth", .07 * k, 1300, 32, 120); voice(1300, t, .5, "triangle", .06 * k, 900); },
  cobra: (t, k) => hum(t, .9, .09 * k, 5000, .7, .25),
  jacare: (t, k) => { voice(55, t, .9, "sawtooth", .16 * k, 48, 9, 6); hum(t, .8, .14 * k, 140, 2, .2); },
  calango: (t, k) => [0, .07, .14].forEach(o => hum(t + o, .03, .14 * k, 3000, 3)),
  anta: (t, k) => voice(1200, t, .55, "sine", .1 * k, 1750, 6, 40),
  capivara: (t, k) => [0, .14].forEach(o => { voice(520, t + o, .08, "square", .07 * k, 300); hum(t + o, .06, .08 * k, 900, 2); }),
  ariranha: (t, k) => [0, .08, .16, .26].forEach((o, i) => voice(1400 + (i % 2) * 400, t + o, .06, "square", .05 * k, 1100)),
  preguica: (t, k) => voice(1550, t, .9, "sine", .08 * k, 1150, 5, 25),
  fungada: (t, k) => [0, .2].forEach(o => hum(t + o, .18, .14 * k, 650, 2.5, .05)),
  tatu: (t, k) => [0, .09, .18, .27].forEach(o => hum(t + o, .06, .1 * k, 950, 3)),
  piranha: (t, k) => { [0, .12].forEach(o => { hum(t + o, .05, .16 * k, 1300, 2); voice(320, t + o, .05, "square", .06 * k, 140); }); [800, 1150].forEach((f, i) => voice(f, t + .3 + i * .07, .05, "sine", .06 * k, f * 1.3)); },
  eletrico: (t, k) => { voice(60, t, .55, "square", .08 * k, 70, 45, 30); hum(t, .5, .12 * k, 4500, 1); },
  aranha: (t, k) => { hum(t, .3, .1 * k, 2800, 1.5, .05); [.32, .38, .44].forEach(o => hum(t + o, .02, .14 * k, 4000, 4)); },
  morcego: (t, k) => [0, .06, .12, .2, .26].forEach((o, i) => voice(3200 - i * 150, t + o, .04, "square", .04 * k, 4200)),
  coruja: (t, k) => [0, .45].forEach((o, i) => voice(i ? 330 : 380, t + o, .35, "sine", .12 * k, i ? 300 : 340, 4, 6)),
  lobo: (t, k) => { voice(380, t, .4, "triangle", .1 * k, 560, 5, 6); voice(560, t + .38, .6, "triangle", .1 * k, 400, 6, 12); },
  chupa: (t, k) => { voice(1800, t, .4, "sawtooth", .08 * k, 900, 40, 160); hum(t + .3, .6, .1 * k, 4500, .8, .1); },
  mula: (t, k) => { voice(700, t, .5, "sawtooth", .08 * k, 450, 18, 60); voice(450, t + .45, .3, "sawtooth", .07 * k, 300, 14, 30); hum(t, .9, .08 * k, 1500, .7, .1); },
  boitata: (t, k) => { hum(t, .8, .1 * k, 5000, .7, .2); [.4, .46, .52, .58, .64, .7].forEach(o => hum(t + o, .03, .12 * k, 3500, 5)); voice(70, t, .9, "sawtooth", .06 * k, 55, 10, 5); }
};
CRIES.gente = (t, k) => { voice(240, t, .12, "square", .09 * k, 300); voice(330, t + .14, .2, "square", .09 * k, 260); };   // "Ei!"
CRIES.visagem = (t, k) => { voice(520, t, 1.1, "sine", .08 * k, 900, 5, 40); hum(t, 1, .06 * k, 1200, 3, .3); };   // lamento que sobe
CRIES.assobio = (t, k) => [0, .5].forEach((o, i) => voice(i ? 2100 : 1700, t + o, .45, "sine", .07 * k, i ? 2700 : 2300, 7, 25));   // assobio fino, duas vezes (Comadre Fulozinha)
const CRY_OF = {onca: "felino", jaguatirica: "felinoP", cotia: "roedor", cassaco: "roedor", quati: "roedor", queixada: "porco", macaco: "macaco",
  harpia: "ave", sucuri: "cobra", surucucu: "cobra", jacare: "jacare", calango: "calango", anta: "anta", capivara: "capivara", ariranha: "ariranha",
  preguica: "preguica", tamandua: "fungada", tatu: "tatu", piranha: "piranha", poraque: "eletrico", caranguejeira: "aranha",
  morcego: "morcego", coruja: "coruja", lobo: "lobo", chupacabra: "chupa", mula: "mula", boitata: "boitata",
  tracaja: "tatu", garca: "ave", boto: "ariranha", jacaretinga: "jacare", sapo: "calango", pirarucu: "piranha", boto_encantado: "ariranha",
  caranguejo: "aranha", caranguejo_rei: "aranha", guaxinim: "roedor", macarico: "ave", matinta: "coruja",
  urubu: "ave", gaviao_real: "ave", cobra_cipo: "cobra", ourico: "fungada", curupira: "macaco",
  bufalo: "anta", bufalo_touro: "anta", soco: "ave", jararaca: "cobra", mapinguari: "felino",
  pombo: "ave", gato: "felinoP", iguana: "calango", iguana_rei: "calango", caramelo: "lobo", cachorro_bravo: "lobo", batedor: "gente", golpista: "gente", ladrao_bike: "gente",
  mulher_branco: "visagem", visagem_mare: "visagem", ratazana: "roedor", ratao: "roedor", rato_dagua: "roedor", mucura: "roedor", urubu_porto: "ave", gaivota: "ave", carao: "ave", piau: "piranha", martim: "ave", cobra_dagua: "cobra", carranca: "visagem", nego_dagua: "gente", piraputanga: "piranha", mutum: "ave", bugio: "macaco", sucuri_amarela: "cobra", gato_palheiro: "felinoP", ariranha_mae: "ariranha", mae_ouro: "visagem", seriema: "ave", arara_vermelha: "ave", tatu_canastra: "tatu", tamandua_mirim: "fungada", coruja_buraqueira: "coruja", guara_rei: "lobo", pe_garrafa: "visagem", tuiuiu: "ave", arara_azul: "ave", dourado: "piranha", cervo: "anta", jacare_pantanal: "jacare", urutau: "coruja", onca_dagua: "felino", minhocao: "cobra", soldadinho: "ave", moco: "roedor", veado: "anta", gato_mato: "felinoP", tapejara: "ave", lobisomem: "lobo", prea: "roedor", tatu_bola: "tatu", periquito: "ave", jiboia: "cobra", bode: "bode", rasga_mortalha: "coruja", bode_rei: "bode", fulozinha: "assobio", sagui: "macaco", maracaja: "felinoP", teiu: "calango", galo_campina: "ave", teiu_rei: "calango", meia_noite: "gente", lontra: "ariranha", jacare_papo: "jacare", cagado: "tatu", bigua: "ave", surubim: "piranha", cabeca_cuia: "visagem", tatupeba: "tatu", cascavel: "cobra", raposa: "lobo", traira: "piranha", asa_branca: "ave", sucuarana: "felino", boi_bumba: "anta", guara: "ave", garca_moura: "ave", carcara: "ave", siri: "aranha", mero: "piranha", serpente: "cobra",
  cobra_norato: "boitata", jacare_canal: "jacare"};
// grito do bicho (chefe soma um rugido grave por baixo)
function animalCry(id, boss = false, k = 1) {
  if (!AC) return;
  const t = AC.currentTime, c = CRIES[CRY_OF[ART[id] || id]] || CRIES.porco;
  c(t, k * 1.6); if (boss) SFX.roar(t);
}
/* entrada do chefe: o grito do próprio bicho vem na frente (animalCry) e este ronco grave entra logo depois, mais baixo,
   com altura e "rouquidão" tiradas do id. Antes um rugido fixo igual para todos abafava o grito: todo chefe soava igual */
function bossRoar(id) {
  if (!AC || muted) return;
  let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  const f = 52 + h % 46, t = AC.currentTime + .45, wave = ["sawtooth", "square", "triangle"][h % 3];
  noise(t, .8, .11, 160 + h % 520);
  tone(f, t, .95, wave, .09, f * (.4 + (h % 5) * .08));
  tone(f * (1.5 + (h % 4) * .25), t + .06, .6, "square", .03, f * .8);
}
function toggleMute() {
  muted = !muted; if (master) master.gain.value = muted ? 0 : .5;
  $("mute").setAttribute("aria-pressed", muted);
}
/* ----- fanfarra de vitória, derrota e fuga (curtas e suaves, como na vitrine) ----- */
/* motivo da região onde o Rhanon está (o mesmo dos temas da música: NORTE_THEME, NORDESTE_THEME e CENTROESTE_THEME em music.js), para os
   jingles de vitória, derrota e subida de nível: as quatro notas do motivo, a nota "de casa" do tema, o acorde maior
   dela (o fim triunfal) e o baixo. A batalha nunca resolve; a vitória resolve. */
const JINGLE = {norte: {motif: [69, 74, 72, 69], home: 74, chord: [62, 66, 69], bass: 50},
  nordeste: {motif: [74, 71, 74, 76], home: 79, chord: [67, 71, 74], bass: 43},
  centroeste: {motif: [76, 73, 74, 71], home: 69, chord: [57, 61, 64], bass: 45}};
const jingleMotif = () => JINGLE[regionOfCity(curCity())] || JINGLE.norte;
function fanfare(kind) {
  if (!AC) return;
  const t = AC.currentTime + .05, out = AC.createGain(), lp = AC.createBiquadFilter();
  out.gain.value = .9; lp.type = "lowpass"; lp.frequency.value = 3800; lp.connect(out).connect(sfxOut);
  const mf = m => 440 * 2 ** ((m - 69) / 12);
  const note = (m, at, dur, vol, timbre, vibrato) => {
    const when = t + at, o = AC.createOscillator(), g = AC.createGain();
    o.type = timbre === "triangle" ? "triangle" : "square"; o.frequency.value = mf(m);
    if (vibrato) { const lfo = AC.createOscillator(), dp = AC.createGain(); lfo.frequency.value = 6; dp.gain.value = mf(m) * .006; lfo.connect(dp).connect(o.frequency); lfo.start(when + .08); lfo.stop(when + dur); }
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .006); g.gain.setValueAtTime(vol, when + dur * .6); g.gain.linearRampToValueAtTime(0, when + dur);
    o.connect(g).connect(lp); o.start(when); o.stop(when + dur + .01);
  };
  const S = .075;
  const J = jingleMotif();
  if (kind === "win") {   // vitória: o motivo da região no 3-3-2 e, enfim, a nota de casa com o acorde maior (curto: a festa segue com a barra de XP)
    J.motif.slice(0, 3).forEach((m, i) => { note(m, [0, .2, .4][i], [.19, .19, .13][i], .05, "triangle"); note(m + 12, [0, .2, .4][i], .1, .012); });
    note(J.home, .55, .75, .06, "triangle", true); J.chord.forEach(m => note(m, .55, .75, .022, "triangle")); note(J.bass - 12, .55, .6, .1, "triangle");
  } else if (kind === "flee") {
    [72, 74, 76, 79].forEach((m, i) => note(m, i * .06, .08, .045, "triangle"));
    note(84, .26, .25, .03, "triangle", true);
  } else {   // derrota: o motivo lento e uma oitava abaixo, parando na última nota sem resolver
    J.motif.forEach((m, i) => note(m - 12, i * .26, i === 3 ? .9 : .24, .05, "triangle", i === 3));
    note(J.motif[3] - 24, .78, .9, .08, "triangle");
  }
}
// impacto da faixa de encontro: subida rápida de notas e uma lâmina cravando (inspirado na abertura do menu da vitrine)
function impactSound() {
  if (!AC || muted) return;
  try {
    const t = AC.currentTime, out = AC.createDynamicsCompressor(), m = AC.createGain();
    m.gain.value = .5; out.connect(m).connect(sfxOut);
    const notes = [330, 392, 440, 523, 587, 659, 784], stp = .026;
    notes.forEach((freq, i) => {
      const when = t + i * stp, o = AC.createOscillator(), og = AC.createGain();
      o.type = "square"; o.frequency.value = freq;
      og.gain.setValueAtTime(.0001, when); og.gain.exponentialRampToValueAtTime(.02 + i * .01, when + .004); og.gain.exponentialRampToValueAtTime(.0001, when + stp * 1.6);
      o.connect(og).connect(out); o.start(when); o.stop(when + stp * 1.7);
    });
    const hit = t + notes.length * stp + .02;
    for (const [freq, vol, dur] of [[180, .3, .14], [410, .18, .09], [870, .1, .06]]) {
      const o = AC.createOscillator(), og = AC.createGain();
      o.frequency.setValueAtTime(freq * 1.15, hit); o.frequency.exponentialRampToValueAtTime(freq, hit + .02);
      og.gain.setValueAtTime(vol, hit); og.gain.exponentialRampToValueAtTime(.0001, hit + dur);
      o.connect(og).connect(out); o.start(hit); o.stop(hit + dur + .01);
    }
  } catch (_) {}
}

// cinemática da batalha: "fuuip" subindo e um impacto grave quando os olhos acendem; na emboscada, um baque seco
function cutinSound(kind) {
  if (!AC || muted) return;
  const t = AC.currentTime;
  if (kind === "ambush") { noise(t, .35, .25, 300); tone(90, t, .4, "sawtooth", .16, 40); tone(880, t, .12, "square", .05, 220); return; }
  const n = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  if (!NB) noise(t, .001, 0, 1000);   // cria o buffer de ruído
  n.buffer = NB; n.loop = true; f.type = "bandpass"; f.Q.value = 3;
  f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + .3);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .28); g.gain.exponentialRampToValueAtTime(.0001, t + .34);
  n.connect(f).connect(g).connect(sfxOut); n.start(t); n.stop(t + .36);
  tone(140, t + .3, .6, "sine", .35, 38); noise(t + .3, .25, .2, 120);
  tone(1320, t + .3, .25, "square", .04, 1320); tone(1980, t + .32, .3, "triangle", .03);
}
// subir de nível: fanfarra curta e triunfante (melodia original no espírito dos RPGs clássicos)
/* barra de XP enchendo (estilo Pokémon): um tom que sobe junto com a barra, picotado em degraus; no fim, um "plim".
   dur em segundos; from/to = quanto da barra (0 a 1), para o tom começar e parar na altura certa */
function xpFillSound(dur, from = 0, to = 1) {
  if (!AC || muted || dur <= 0) return;
  const t = AC.currentTime + .02, o = AC.createOscillator(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
  o.type = "square"; o.frequency.setValueAtTime(380 + 700 * from, t); o.frequency.linearRampToValueAtTime(380 + 700 * to, t + dur);
  lfo.type = "square"; lfo.frequency.value = 28; lg.gain.value = .018;   // picota o tom: "tititititi"
  g.gain.setValueAtTime(.022, t); g.gain.setValueAtTime(.022, t + dur - .02); g.gain.linearRampToValueAtTime(0, t + dur);
  lfo.connect(lg).connect(g.gain); o.connect(g).connect(sfxOut);
  o.start(t); lfo.start(t); o.stop(t + dur + .02); lfo.stop(t + dur + .02);
}
// PV e PE enchendo no descanso: um "lilili" suave subindo (triângulo, mais manso que o da barra de XP)
function healFillSound(dur) {
  if (!AC || muted || dur <= 0) return;
  const t = AC.currentTime + .02, o = AC.createOscillator(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(hz(64), t); o.frequency.linearRampToValueAtTime(hz(81), t + dur);
  lfo.type = "square"; lfo.frequency.value = 14; lg.gain.value = .03;
  g.gain.setValueAtTime(.04, t); g.gain.setValueAtTime(.04, t + dur - .03); g.gain.linearRampToValueAtTime(0, t + dur);
  lfo.connect(lg).connect(g.gain); o.connect(g).connect(sfxOut);
  o.start(t); lfo.start(t); o.stop(t + dur + .02); lfo.stop(t + dur + .02);
}
// descansou tudo: o acorde da região subindo em arpejo e a nota de casa, devagar (a cantiga da fogueira)
function restJingle() {
  if (!AC || muted) return;
  const t = AC.currentTime + .03, J = jingleMotif();
  J.chord.forEach((m, i) => { tone(hz(m + 12), t + i * .13, .5, "triangle", .045); tone(hz(m + 24), t + i * .13, .12, "sine", .015); });
  tone(hz(J.home + 12), t + .42, .9, "triangle", .05); tone(hz(J.bass), t + .42, .9, "triangle", .07);
}
function xpDing() { if (!AC || muted) return; const t = AC.currentTime + .02; tone(hz(84), t, .09, "square", .04); tone(hz(91), t + .08, .22, "square", .035); }
// chefe acalmado: um pedaço da luz de Jaci volta. O começo do tema dela (JACI_THEME) em sinos, e um brilho subindo no fim
function jaciJingle() {
  if (!AC || muted) return;
  const t = AC.currentTime + .05;
  [[67, 0, .14], [76, .14, .34], [74, .48, .14], [72, .62, .34], [74, .96, .9]].forEach(([m, at, d]) => {
    tone(hz(m), t + at, d + .4, "sine", .07); tone(hz(m + 12), t + at, d * .6 + .2, "sine", .02); tone(hz(m), t + at, d * .8, "triangle", .02);
  });
  [86, 91, 93, 98].forEach((m, i) => tone(hz(m), t + 1.1 + i * .07, .35, "sine", .012));   // brilho
}
// subiu de nível: as quatro notas do motivo da região, rápidas e brilhantes, e o acorde de casa subindo até a nota final
function levelUpJingle() {
  if (!AC || muted) return;
  const J = jingleMotif(), t = AC.currentTime + .05, S = .09, up = [...J.chord.map(m => m + 12), J.home + 12];
  J.motif.forEach((m, i) => { tone(hz(m + 12), t + i * S, S + .03, "square", .06); tone(hz(m + 24), t + i * S, S, "triangle", .02); });
  up.slice(0, -1).forEach((m, i) => tone(hz(m), t + (4.6 + i * .7) * S, .1, "square", .055));
  const end = t + (4.6 + (up.length - 1) * .7) * S;
  tone(hz(up.at(-1)), end, .7, "square", .07); tone(hz(up.at(-1) + 12), end, .6, "triangle", .025);
  J.chord.forEach((m, i) => tone(hz(m), end + i * .02, .9, "triangle", .03)); tone(hz(J.bass - 12), end, .6, "triangle", .12);
  tone(hz(J.bass - 12), t, .4, "triangle", .1);
}