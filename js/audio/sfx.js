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
  claw:  t => { noise(t, .1, .2, 3000); tone(1200, t, .12, "square", .06, 300); },
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
const CRY_OF = {onca: "felino", jaguatirica: "felinoP", cotia: "roedor", cassaco: "roedor", quati: "roedor", queixada: "porco", macaco: "macaco",
  harpia: "ave", sucuri: "cobra", surucucu: "cobra", jacare: "jacare", calango: "calango", anta: "anta", capivara: "capivara", ariranha: "ariranha",
  preguica: "preguica", tamandua: "fungada", tatu: "tatu", piranha: "piranha", poraque: "eletrico", caranguejeira: "aranha",
  morcego: "morcego", coruja: "coruja", lobo: "lobo", chupacabra: "chupa", mula: "mula", boitata: "boitata",
  tracaja: "tatu", garca: "ave", boto: "ariranha", jacaretinga: "jacare", sapo: "calango", pirarucu: "piranha", boto_encantado: "ariranha",
  caranguejo: "aranha", caranguejo_rei: "aranha", guaxinim: "roedor", macarico: "ave", matinta: "coruja",
  urubu: "ave", gaviao_real: "ave", cobra_cipo: "cobra", ourico: "fungada", curupira: "macaco",
  bufalo: "anta", bufalo_touro: "anta", soco: "ave", jararaca: "cobra", mapinguari: "felino",
  pombo: "ave", gato: "felinoP", iguana: "calango", iguana_rei: "calango", caramelo: "lobo", cachorro_bravo: "lobo", batedor: "gente", golpista: "gente", ladrao_bike: "gente",
  mulher_branco: "visagem", visagem_mare: "visagem", ratazana: "roedor", ratao: "roedor", rato_dagua: "roedor", mucura: "roedor", urubu_porto: "ave", gaivota: "ave",
  cobra_norato: "boitata", jacare_canal: "jacare"};
// grito do bicho (chefe soma um rugido grave por baixo)
function animalCry(id, boss = false, k = 1) {
  if (!AC) return;
  const t = AC.currentTime, c = CRIES[CRY_OF[ART[id] || id]] || CRIES.porco;
  c(t, k * 1.6); if (boss) SFX.roar(t);
}
function toggleMute() {
  muted = !muted; if (master) master.gain.value = muted ? 0 : .5;
  $("mute").setAttribute("aria-pressed", muted);
}
/* ----- fanfarra de vitória, derrota e fuga (curtas e suaves, como na vitrine) ----- */
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
  if (kind === "win") {
    [[67, 0], [69, 1], [71, 2]].forEach(([m, at]) => note(m, at * S, S * .9, .06, "pulse"));
    for (const [i, vol] of [.06, .022, .008].entries()) { note(72, (3 + i * 2) * S, S * (i ? 1.5 : 2), vol, "pulse", !i); note(76, (3 + i * 2) * S, S * (i ? 1.5 : 2), vol * .8, "pulse", !i); }
    note(55, 0, S * 3, .09, "triangle"); note(48, 3 * S, S * 5, .09, "triangle");
  } else if (kind === "flee") {
    [72, 74, 76, 79].forEach((m, i) => note(m, i * .06, .08, .045, "triangle"));
    note(84, .26, .25, .03, "triangle", true);
  } else {
    [[67, 0], [66, 1], [65, 2]].forEach(([m, at]) => note(m, at * .16, .15, .05, "triangle"));
    note(64, .5, .7, .05, "triangle", true); note(40, .5, .7, .08, "triangle");
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
function levelUpJingle() {
  if (!AC || muted) return;
  const t = AC.currentTime + .05, S = .1;
  [[67, 0, .09], [72, 1, .09], [76, 2, .09], [79, 3, .36], [77, 6.6, .12], [76, 7.8, .12], [74, 9, .12], [76, 10.2, .65]]   // [nota, início (x S), duração]
    .forEach(([m, at, d]) => { tone(hz(m), t + at * S, d + .05, "square", .07); tone(hz(m + 12), t + at * S, d, "triangle", .025); });
  [[48, 0], [55, 3], [53, 6.6], [48, 10.2]].forEach(([m, at]) => tone(hz(m), t + at * S, .5, "triangle", .12));
  [60, 64, 67, 72].forEach((m, i) => tone(hz(m), t + 10.2 * S + i * .02, .9, "triangle", .03));
}