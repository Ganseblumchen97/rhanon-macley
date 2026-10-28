/* Música: motor novo (MUS) para título, mapas e batalhas; motor antigo só para entrevista e trabalho. */
const hz = n => 440 * 2 ** ((n - 69) / 12);
/* Trilha de entrevista: chiptune corporativo, leve tensão e acordes jazzy. */
function stepInterview(s, t) {
  const b=s>>4, i=s&15, roots=[53,48,50,45][b%4], seq=[0,3,7,10,7,3,5,7,0,4,7,11,7,4,2,5];
  if (i%2===0) tone(hz(72+seq[i]+(b%2?2:0)),t,.13,"triangle",.045);
  if ([0,6,8,14].includes(i)) [0,3,7,10].forEach((n,j)=>tone(hz(roots+24+n),t,.24,"sine",j===0?.035:.018));
  if (i===4||i===12) tone(hz(roots-12),t,.16,"triangle",.055);
  if (i===7||i===15) noise(t,.018,.009,6500);
}
/* Trilha de trabalho: loop eletrônico focado, pulsação constante e arpejos. */
function stepWork(s, t) {
  const b=s>>4, i=s&15, roots=[45,41,48,43][b%4], pat=[0,7,12,7,3,7,10,7,0,7,14,7,5,7,12,7];
  tone(hz(roots+pat[i]),t,.075,"square",.035);
  if (i%4===0) tone(hz(roots-12),t,.18,"triangle",.12);
  if (i===4||i===12) tone(hz(roots+19),t,.11,"triangle",.045);
  if (i%4===2) noise(t,.018,.012,7200);
}
/* ===== Música (motor da vitrine) =====
   Cada faixa passa por um barramento com reverb e compressor, entra e sai com transição suave
   e é composta por instrumentos sintetizados (sino, flauta, piano elétrico, pad, baixo, bateria,
   berimbau, atabaque, caxixi). As faixas do Norte (batalha, chefe, aldeia e mapa do Pará) tocam o tema fixo da região
   (NORTE_THEME), cada uma com a sua roupa; os enfeites e os solos da parte B do mapa ainda são sorteados.
   Faixas: "title" (abertura), "map" (mapa grande: Pará/Brasil), "local" (Ananindeua, toque de capoeira com flauta),
   "localNight" (Ananindeua à noite), "battleCapo" (batalha na mata: a roda de capoeira acelerada), "battleCarimbo"
   (batalha na água: carimbó), "battleGuitarrada" (batalha em Belém: guitarrada), "localNordeste" (São Luís e o
   mapa do Maranhão: toada de bumba-meu-boi com sanfona e triângulo, e o tema do Nordeste), "pytuna" (cenas de Pytuna,
   com o tema dele), "jaci" (fim de capítulo: a lua volta a brilhar, com o tema dela), "battleNordeste" (batalha em São Luís: forró
   com o tema do Nordeste), "localCentroOeste" (Cuiabá e o mapa do Centro-Oeste: toada caipira com viola ponteada, sanfona e o
   tema do Centro-Oeste em dueto), "battleCentroOeste" (batalha no Centro-Oeste: pagode de viola com bateria sertaneja), "localSudeste" (Belo Horizonte e o mapa do Sudeste: sertanejo
   universitário com o tema do Sudeste em dupla), "battleMinas" (batalha em Minas: o mesmo, acelerado), "mpbSudeste" e
   "funkSudeste" (o tema do Sudeste em MPB e em funk carioca, para São Paulo e o Rio; ainda sem uso), "battleBoss" (chefe: abertura
   sombria, tambores de guerra e guitarra distorcida), "mapPara"/"mapParaNight" (mapa do Pará: guitarrada de dia e de noite);
   "battleP3/P4/P5" são as batalhas antigas (sem uso agora). Entrevista e trabalho seguem com as faixas antigas. */
const MUS = (() => {
  let X = null, DEST = null;              // contexto de áudio e saída (troca no teste offline)
  let bus = null, timer = null, nextTime = 0, step = 0, track = null, trackId = null, NB2 = null;
  const LEVEL = 3;                        // volume geral da música antes do controle de som do jogo
  const mtof = m => 440 * 2 ** ((m - 69) / 12);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function noiseSrc() {
    if (!NB2 || NB2.sampleRate !== X.sampleRate) {
      NB2 = X.createBuffer(1, X.sampleRate * 2, X.sampleRate);
      const d = NB2.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = X.createBufferSource(); s.buffer = NB2; s.loop = true; return s;
  }
  function makeReverb(sec = 3.2) {
    const len = Math.floor(X.sampleRate * sec), buf = X.createBuffer(2, len, X.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
    const conv = X.createConvolver(); conv.buffer = buf; return conv;
  }

  /* ----- instrumentos ----- */
  function synth(type, freq, when, dur, vol, cutoff) {
    const o = X.createOscillator(), g = X.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    if (cutoff) { const f = X.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; o.connect(f).connect(g); } else o.connect(g);
    g.connect(bus.mix); o.start(when); o.stop(when + dur + .02);
  }
  function bell(freq, when, vol, dur = 1.6) { synth("sine", freq, when, dur, vol); synth("sine", freq * 2.003, when, dur * .5, vol * .25); }
  function ep(freq, when, dur, vol) { synth("sine", freq, when, dur, vol); synth("triangle", freq * 2, when, dur * .25, vol * .3); }
  function pad(notes, when, dur, vol = .012) {
    const f = X.createBiquadFilter(), g = X.createGain();
    f.type = "lowpass"; f.frequency.value = 900;
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 1.2);
    g.gain.setValueAtTime(vol, when + dur - .4); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .8);
    f.connect(g).connect(bus.mix);
    for (const m of notes.slice(0, 3)) for (const detune of [-7, 7]) {
      const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = detune;
      o.connect(f); o.start(when); o.stop(when + dur + .9);
    }
  }
  function noiseHit(when, dur, vol, type, freq, q = .7) {
    const n = noiseSrc(), f = X.createBiquadFilter(), g = X.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    n.connect(f).connect(g).connect(bus.mix); n.start(when); n.stop(when + dur + .02);
  }
  function kick(when, vol) {
    const o = X.createOscillator(), g = X.createGain();
    o.frequency.setValueAtTime(120, when); o.frequency.exponentialRampToValueAtTime(42, when + .12);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .22);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .25);
  }
  const snare = (when, vol) => { noiseHit(when, .13, vol, "bandpass", 1800); synth("triangle", 190, when, .08, vol * .5); };
  const hat = (when, vol, open) => noiseHit(when, open ? .12 : .03, vol, "highpass", 7000);
  // sanfona: duas palhetas um pouco desafinadas entre si (o "musette" que faz o som tremer), timbre de palheta filtrado
  // e o fole entrando macio
  function sanfona(freq, when, dur, vol) {
    const f = X.createBiquadFilter(), g = X.createGain();
    f.type = "lowpass"; f.frequency.value = Math.min(4200, freq * 6); f.Q.value = .8;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .03);
    g.gain.setValueAtTime(vol, when + Math.max(.04, dur - .06)); g.gain.linearRampToValueAtTime(0, when + dur + .05);
    f.connect(g).connect(bus.mix);
    for (const [type, det, k] of [["sawtooth", -9, .55], ["sawtooth", 9, .55], ["square", 0, .25]]) {
      const o = X.createOscillator(), og = X.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = det; og.gain.value = k;
      o.connect(og).connect(f); o.start(when); o.stop(when + dur + .1);
    }
  }
  // viola caipira (sertanejo de raiz): cinco pares de cordas de aço beliscados, cada par com a nota e a oitava (um
  // pouquinho desafinadas, o que dá o brilho que "chora"), ataque metálico e o som fechando devagar
  function viola(freq, when, dur, vol) {
    const f = X.createBiquadFilter(), g = X.createGain(), end = when + Math.min(dur, 1.2);
    f.type = "lowpass"; f.frequency.setValueAtTime(Math.min(7000, freq * 9), when); f.frequency.exponentialRampToValueAtTime(Math.min(2200, freq * 3), when + .35); f.Q.value = 1.2;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .002); g.gain.exponentialRampToValueAtTime(vol * .35, when + .12); g.gain.exponentialRampToValueAtTime(.0001, end + .15);
    f.connect(g).connect(bus.mix);
    for (const [type, mul, det, k] of [["sawtooth", 1, -5, 1], ["sawtooth", 2, 7, .55], ["triangle", 1, 4, .8]]) { const o = X.createOscillator(), og = X.createGain(); o.type = type; o.frequency.value = freq * mul; o.detune.value = det; og.gain.value = k; o.connect(og).connect(f); o.start(when); o.stop(end + .2); }
    noiseHit(when, .012, vol * .5, "highpass", 5000);   // a palheta (unha) na corda
  }
  // ganzá (chocalho de lata) e o reco-reco de bambu raspado
  const ganza = (when, vol) => noiseHit(when, .06, vol, "bandpass", 6200, 1.1);
  function reco(when, vol) { for (let k = 0; k < 4; k++) noiseHit(when + k * .018, .014, vol, "bandpass", 2400, 4); }
  // triângulo: ferro tocado (parciais inarmônicos); aberto soa, fechado (mão abafando) é só um tic
  function triangulo(when, vol, open) {
    for (const [fq, k] of [[2600, 1], [4180, .5], [5930, .3]]) synth("sine", fq, when, open ? .4 : .05, vol * k);
  }
  // violão: corda beliscada que fecha rápido; aco = de aço (o do sertanejo, brilhante, com a palheta), senão de náilon
  // (o da MPB e da bossa, macio). strum = o acorde batido, corda por corda (para cima, up, começa pelas agudas)
  function violao(freq, when, dur, vol, aco) {
    const f = X.createBiquadFilter(), g = X.createGain(), end = when + Math.min(dur, aco ? 1 : 1.4);
    f.type = "lowpass"; f.frequency.setValueAtTime(Math.min(aco ? 6500 : 3200, freq * (aco ? 8 : 5)), when); f.frequency.exponentialRampToValueAtTime(Math.min(1800, freq * 2.5), when + .25);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .003); g.gain.exponentialRampToValueAtTime(vol * .4, when + .1); g.gain.exponentialRampToValueAtTime(.0001, end + .1);
    f.connect(g).connect(bus.mix);
    for (const [type, mul, det, k] of aco ? [["sawtooth", 1, -4, .6], ["sawtooth", 1, 5, .45], ["triangle", 2, 0, .3]] : [["triangle", 1, 0, 1], ["sine", 2, 0, .25]]) {
      const o = X.createOscillator(), og = X.createGain(); o.type = type; o.frequency.value = freq * mul; o.detune.value = det; og.gain.value = k; o.connect(og).connect(f); o.start(when); o.stop(end + .15);
    }
    if (aco) noiseHit(when, .01, vol * .4, "highpass", 5000);
  }
  function strum(notes, when, dur, vol, up, aco) { (up ? [...notes].reverse() : notes).forEach((m, k) => violao(mtof(m), when + k * .011, dur, vol * (1 - k * .08), aco)); }
  // funk carioca: o grave do 808 (cai do agudo para a nota e fica soando) e a palma
  function bumbo808(freq, when, dur, vol) {
    const o = X.createOscillator(), g = X.createGain(), sat = X.createWaveShaper(), cv = new Float32Array(256);
    for (let k = 0; k < 256; k++) { const v = k / 128 - 1; cv[k] = Math.tanh(v * 2.2); }
    sat.curve = cv; o.type = "sine"; o.frequency.setValueAtTime(freq * 3, when); o.frequency.exponentialRampToValueAtTime(freq, when + .05);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.setValueAtTime(vol * .8, when + dur * .5); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(sat).connect(g).connect(bus.mix); o.start(when); o.stop(when + dur + .02);
  }
  function palma(when, vol) { for (let k = 0; k < 3; k++) noiseHit(when + k * .009, k < 2 ? .01 : .09, vol, "bandpass", 1400, 1.2); }
  function flute(freq, when, dur, vol) {
    const o = X.createOscillator(), g = X.createGain(), lfo = X.createOscillator(), depth = X.createGain();
    o.type = "triangle"; o.frequency.value = freq; lfo.frequency.value = 5; depth.gain.value = freq * .005;
    lfo.connect(depth).connect(o.frequency);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .12);
    g.gain.setValueAtTime(vol, when + Math.max(.13, dur - .25)); g.gain.linearRampToValueAtTime(0, when + dur + .15);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + dur + .2); lfo.start(when); lfo.stop(when + dur + .2);
    // sopro: um pouco de ar no começo da nota
    noiseHit(when, .09, vol * .25, "bandpass", Math.min(9000, freq * 3), 2);
  }
  function lead(freq, when, dur, vol) {
    const o = X.createOscillator(), f = X.createBiquadFilter(), g = X.createGain(), lfo = X.createOscillator(), depth = X.createGain();
    o.type = "square"; o.frequency.value = freq; f.type = "lowpass"; f.frequency.value = 2200;
    lfo.frequency.value = 6; depth.gain.value = freq * .004; lfo.connect(depth).connect(o.frequency);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .01);
    g.gain.setValueAtTime(vol, when + dur * .8); g.gain.linearRampToValueAtTime(0, when + dur + .05);
    o.connect(f).connect(g).connect(bus.mix); o.start(when); o.stop(when + dur + .08); lfo.start(when + .1); lfo.stop(when + dur + .08);
  }
  function sweep(when, dur, vol) {
    const n = noiseSrc(), f = X.createBiquadFilter(), g = X.createGain();
    f.type = "bandpass"; f.Q.value = 1.5; f.frequency.setValueAtTime(300, when); f.frequency.exponentialRampToValueAtTime(6000, when + dur);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + dur - .02); g.gain.linearRampToValueAtTime(0, when + dur);
    n.connect(f).connect(g).connect(bus.mix); n.start(when); n.stop(when + dur + .02);
  }
  function clap(when) { noiseHit(when, .05, .025, "bandpass", 1200); noiseHit(when + .012, .09, .03, "bandpass", 1200); }
  function drop(when) {
    const o = X.createOscillator(), g = X.createGain(), f0 = 600 + Math.random() * 500;
    o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f0 * 2.5, when + .05);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(.015, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + .08);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .1);
  }
  // instrumentos da mata
  // berimbau: corda com "uóng" da cabaça abrindo e fechando (filtro passa-banda que sobe e desce)
  function berimbau(m, when, vol) {
    const fr = mtof(m), o = X.createOscillator(), body = X.createOscillator(), f = X.createBiquadFilter(), g = X.createGain();
    o.type = "sawtooth"; body.type = "triangle";
    o.frequency.setValueAtTime(fr * 1.025, when); o.frequency.exponentialRampToValueAtTime(fr, when + .05);
    body.frequency.setValueAtTime(fr * 1.025, when); body.frequency.exponentialRampToValueAtTime(fr, when + .05);
    f.type = "bandpass"; f.Q.value = 5; f.frequency.setValueAtTime(fr * 2, when); f.frequency.exponentialRampToValueAtTime(fr * 7, when + .12); f.frequency.exponentialRampToValueAtTime(fr * 2.5, when + .45);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .004); g.gain.exponentialRampToValueAtTime(.0001, when + .6);
    o.connect(f).connect(g); body.connect(g); g.connect(bus.mix);
    o.start(when); o.stop(when + .65); body.start(when); body.stop(when + .65);
  }
  // chiado do berimbau com a pedra encostada + caxixi
  const chi = (when, vol) => { noiseHit(when, .045, vol, "bandpass", 3200, 1.2); noiseHit(when + .01, .03, vol * .6, "highpass", 6500); };
  const caxixi = (when, vol) => noiseHit(when, .05, vol, "bandpass", 5200, 1.5);
  // atabaque: grave com o tom caindo; tapa é seco e médio
  function atabaque(when, vol, high) {
    const o = X.createOscillator(), g = X.createGain(), f0 = high ? 230 : 150;
    o.type = "sine"; o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f0 * .55, when + .18);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .28);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .3);
  }
  const tapa = (when, vol) => { noiseHit(when, .05, vol, "bandpass", 900, 1.4); synth("triangle", 320, when, .05, vol * .6); };
  // passarinho: dois piados curtos subindo
  function bird(when) {
    const f0 = 2300 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const o = X.createOscillator(), g = X.createGain(), t = when + i * .11;
      o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + .06);
      g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.006, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .08);
      o.connect(g).connect(bus.mix); o.start(t); o.stop(t + .1);
    }
  }

  // grilo: "cri-cri" de pulsos bem agudos (noite)
  function cricket(when) {
    for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) {
      const t = when + k * .16 + j * .022, o = X.createOscillator(), g = X.createGain();
      o.type = "sine"; o.frequency.value = 4400 + Math.random() * 300;
      g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.004, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .018);
      o.connect(g).connect(bus.mix); o.start(t); o.stop(t + .02);
    }
  }
  // coruja ao longe: "hu-huu"
  function owl(when) {
    [[0, 380, .25], [.38, 340, .5]].forEach(([o0, f0, len]) => {
      const t = when + o0, o = X.createOscillator(), g = X.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .9, t + len);
      g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.012, t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g).connect(bus.mix); o.start(t); o.stop(t + len + .02);
    });
  }
  // agogô: sino de duas bocas (alto e baixo), metálico
  function agogo(when, high, vol = .014) { const f = high ? 1320 : 990; synth("sine", f, when, .18, vol); synth("sine", f * 2.76, when, .06, vol * .4); }
  // surdo/atabaque grave e comprido, para a música do chefe
  function surdo(when, vol) {
    const o = X.createOscillator(), g = X.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(95, when); o.frequency.exponentialRampToValueAtTime(48, when + .35);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .5);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .55);
  }

  // guitarra da guitarrada paraense: corda beliscada brilhante, com vibrato depois do ataque
  function guitar(freq, when, dur, vol, bright = 2600) {
    const f = X.createBiquadFilter(), g = X.createGain(), lfo = X.createOscillator(), depth = X.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(bright, when); f.frequency.exponentialRampToValueAtTime(bright * .35, when + Math.min(dur, .6));
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .004); g.gain.exponentialRampToValueAtTime(vol * .45, when + .12); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .2);
    lfo.frequency.value = 5.5; depth.gain.setValueAtTime(0, when); depth.gain.linearRampToValueAtTime(freq * .006, when + .25);
    lfo.connect(depth);
    for (const det of [-6, 6]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq; o.detune.value = det; depth.connect(o.frequency); o.connect(f); o.start(when); o.stop(when + dur + .25); }
    f.connect(g).connect(bus.mix); lfo.start(when); lfo.stop(when + dur + .25);
  }
  // guitarra distorcida (riff do chefe): onda serrilhada passando por uma saturação pesada
  let DIST = null;
  function distCurve() {
    if (DIST) return DIST;
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 6); }
    return DIST = c;
  }
  function dist(freq, when, dur, vol, cutoff = 1600) {
    const ws = X.createWaveShaper(), f = X.createBiquadFilter(), g = X.createGain();
    ws.curve = distCurve(); f.type = "lowpass"; f.frequency.value = cutoff;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .005); g.gain.setValueAtTime(vol, when + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .05);
    for (const [type, mul] of [["sawtooth", 1], ["square", .5]]) { const o = X.createOscillator(); o.type = type; o.frequency.value = freq * mul; o.connect(ws); o.start(when); o.stop(when + dur + .08); }
    ws.connect(f).connect(g).connect(bus.mix);
  }
  // metais (acorde de serrilhadas com o filtro abrindo, como um naipe tocando forte)
  function brass(notes, when, dur, vol) {
    const f = X.createBiquadFilter(), g = X.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(500, when); f.frequency.exponentialRampToValueAtTime(2800, when + .08); f.frequency.exponentialRampToValueAtTime(900, when + dur);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .03); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .1);
    f.connect(g).connect(bus.mix);
    for (const m of notes) for (const det of [-9, 9]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(when); o.stop(when + dur + .15); }
  }
  // coro grave (um "aah" escuro): pad com formante de vogal
  function choir(notes, when, dur, vol) {
    const f = X.createBiquadFilter(), f2 = X.createBiquadFilter(), g = X.createGain();
    f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 1.2; f2.type = "lowpass"; f2.frequency.value = 1400;
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .5); g.gain.setValueAtTime(vol, when + dur - .3); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .6);
    f.connect(f2).connect(g).connect(bus.mix);
    for (const m of notes) for (const det of [-12, 0, 12]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(when); o.stop(when + dur + .7); }
  }
  // sino grave de alerta (badalada)
  function toll(m, when, vol) { synth("sine", mtof(m), when, 3, vol); synth("sine", mtof(m) * 2.4, when, 1.4, vol * .35); synth("sine", mtof(m) * 3.9, when, .6, vol * .2); }

  // viradas e melodias das batalhas (iguais às da vitrine)
  function battleFill(t, d, s, barIn, build) {
    if (build) {
      const every = [0, 4, 2, 1][barIn - 4];
      if (every && s % every === 0) snare(t, .012 + (barIn - 4) * .008);
      if (barIn === 7 && s === 0) sweep(t, d * 16, .03);
      return false;
    }
    if (barIn === 7 && s >= 12) { snare(t, .02 + (s - 12) * .01); return true; }
    return false;
  }
  function battleMelody(list, scale, shift = 0) {
    const out = new Array(128).fill(null);
    const rhythms = [[[0, 3], [3, 3], [6, 2], [8, 4], [12, 4]], [[0, 2], [2, 2], [4, 4], [10, 6]], [[0, 6], [6, 2], [8, 8]], [[0, 4], [4, 4], [8, 2], [10, 2], [12, 4]]];
    let prev = 72;
    for (let b = 0; b < 4; b++) {
      const tones = list[b].notes.map(n => n + shift).filter(n => n >= 64 && n <= 84);
      for (const [k, [at, len]] of pick(rhythms).entries()) {
        const pool = (k === 0 || at === 8) && tones.length ? tones : scale;
        const near = [...pool].sort((x, y) => Math.abs(x - prev) - Math.abs(y - prev));
        prev = near[Math.min(near.length - 1, Math.floor(Math.random() * 3))];
        out[b * 16 + at] = {note: prev, len};
      }
    }
    for (let k = 0; k < 48; k++) out[64 + k] = out[k];
    const last = list[3].resolve || list[3].notes;
    out[112] = {note: last[2] + shift, len: 12};
    return out;
  }
  /* Tema do Norte (leitmotif da região): uma frase fixa que volta sempre igual, para ficar na cabeça.
     [compasso, passo, nota, duração], em semicolcheias. O motivo é "lá–ré–dó–lá" no ritmo 3-3-2 da roda (tresillo).
     A = a frase sobre ré menor–dó–si bemol–lá (a cadência andaluza dos acordes da batalha); B = a resposta sobre sol menor–
     fá–mi bemol–lá, que fecha com o mesmo 3-3-2 subindo pelo acorde de lá. Cada região nova terá o seu tema. */
  const NORTE_THEME = {
    A: [[0, 0, 69, 3], [0, 3, 74, 3], [0, 6, 72, 2], [0, 8, 69, 6], [0, 14, 67, 2],
        [1, 0, 67, 3], [1, 3, 69, 3], [1, 6, 72, 2], [1, 8, 67, 8],
        [2, 0, 65, 3], [2, 3, 67, 3], [2, 6, 69, 2], [2, 8, 70, 4], [2, 12, 69, 4],
        [3, 0, 69, 3], [3, 3, 73, 3], [3, 6, 76, 2], [3, 8, 73, 8],
        [4, 0, 69, 3], [4, 3, 74, 3], [4, 6, 72, 2], [4, 8, 69, 6], [4, 14, 72, 2],
        [5, 0, 76, 3], [5, 3, 74, 3], [5, 6, 72, 2], [5, 8, 67, 8],
        [6, 0, 74, 3], [6, 3, 72, 3], [6, 6, 70, 2], [6, 8, 69, 4], [6, 12, 67, 4],
        [7, 0, 69, 4], [7, 4, 73, 4], [7, 8, 69, 8]],
    B: [[0, 0, 74, 6], [0, 6, 72, 2], [0, 8, 70, 4], [0, 12, 67, 4],
        [1, 0, 72, 6], [1, 6, 69, 2], [1, 8, 65, 8],
        [2, 0, 70, 6], [2, 6, 67, 2], [2, 8, 63, 4], [2, 12, 67, 4],
        [3, 0, 69, 3], [3, 3, 73, 3], [3, 6, 76, 2], [3, 8, 79, 4], [3, 12, 76, 4],
        [4, 0, 74, 6], [4, 6, 72, 2], [4, 8, 70, 4], [4, 12, 74, 4],
        [5, 0, 77, 6], [5, 6, 76, 2], [5, 8, 72, 8],
        [6, 0, 75, 6], [6, 6, 74, 2], [6, 8, 70, 4], [6, 12, 67, 4],
        [7, 0, 69, 3], [7, 3, 73, 3], [7, 6, 76, 2], [7, 8, 69, 8]],
    // o mesmo motivo alongado (6-6-4, um acorde a cada dois compassos), para a aldeia e o mapa: lentoA sobre ré menor–
    // si bemol–dó–lá menor, lentoB sobre sol menor–fá–mi bemol–lá
    lentoA: [[0, 0, 69, 6], [0, 6, 74, 6], [0, 12, 72, 4], [1, 0, 69, 12],
        [2, 0, 65, 6], [2, 6, 69, 6], [2, 12, 70, 4], [3, 0, 69, 12],
        [4, 0, 67, 6], [4, 6, 72, 6], [4, 12, 74, 4], [5, 0, 76, 8], [5, 8, 74, 4], [5, 12, 72, 4],
        [6, 0, 69, 6], [6, 6, 72, 6], [6, 12, 76, 4], [7, 0, 69, 12]],
    lentoB: [[0, 0, 74, 6], [0, 6, 72, 6], [0, 12, 70, 4], [1, 0, 67, 12],
        [2, 0, 72, 6], [2, 6, 69, 6], [2, 12, 65, 4], [3, 0, 69, 12],
        [4, 0, 70, 6], [4, 6, 67, 6], [4, 12, 70, 4], [5, 0, 74, 12],
        [6, 0, 69, 6], [6, 6, 73, 6], [6, 12, 76, 4], [7, 0, 76, 8], [7, 8, 73, 8]],
    // chefe: o motivo alongado no modo frígio da faixa do chefe (ré menor–mi bemol–dó menor–dó sustenido diminuto–lá)
    chefeA: [[0, 0, 69, 6], [0, 6, 74, 6], [0, 12, 72, 4], [1, 0, 69, 12],
        [2, 0, 67, 6], [2, 6, 70, 6], [2, 12, 72, 4], [3, 0, 70, 12],
        [4, 0, 67, 6], [4, 6, 72, 6], [4, 12, 75, 4], [5, 0, 74, 8], [5, 8, 72, 4], [5, 12, 70, 4],
        [6, 0, 70, 6], [6, 6, 73, 6], [6, 12, 76, 4], [7, 0, 69, 12]],
    chefeB: [[0, 0, 74, 6], [0, 6, 72, 6], [0, 12, 70, 4], [1, 0, 65, 12],
        [2, 0, 69, 6], [2, 6, 73, 6], [2, 12, 76, 4], [3, 0, 73, 12],
        [4, 0, 70, 6], [4, 6, 74, 6], [4, 12, 79, 4], [5, 0, 77, 12],
        [6, 0, 76, 6], [6, 6, 73, 6], [6, 12, 69, 4], [7, 0, 69, 12]]
  };
  /* Tema do Nordeste (leitmotif): toada de bumba-meu-boi em sol mixolídio (o fá natural dá o sabor nordestino).
     O motivo é "ré–si–ré–mi" no ritmo 4-2-2 da toada, e cada frase desce de volta; um acorde a cada dois compassos:
     sol–fá–dó–ré com sétima. */
  const NORDESTE_THEME = {
    A: [[0, 0, 74, 4], [0, 4, 71, 2], [0, 6, 74, 2], [0, 8, 76, 4], [0, 12, 74, 4], [1, 0, 71, 12],
        [2, 0, 72, 4], [2, 4, 69, 2], [2, 6, 72, 2], [2, 8, 77, 4], [2, 12, 76, 4], [3, 0, 72, 12],
        [4, 0, 76, 4], [4, 4, 72, 2], [4, 6, 76, 2], [4, 8, 79, 4], [4, 12, 77, 4], [5, 0, 76, 8], [5, 8, 74, 4], [5, 12, 72, 4],
        [6, 0, 74, 4], [6, 4, 78, 2], [6, 6, 81, 2], [6, 8, 79, 4], [6, 12, 78, 4], [7, 0, 74, 12]]
  };
  /* Tema do Centro-Oeste (leitmotif): moda de viola sertaneja em lá maior. O motivo desce em terças, "mi–dó
     sustenido–ré–si", no ritmo 4-2-2 de quem canta, e tem sempre uma segunda voz uma terça abaixo (o dueto caipira, ver
     terca em localCentroOeste). A: lá–ré–mi com sétima–lá, um acorde a cada dois compassos. B (a resposta, que sobe e
     abre): fá sustenido menor–ré–mi–lá, cantada pela sanfona. */
  const CENTROESTE_THEME = {
    A: [[0, 0, 76, 4], [0, 4, 73, 2], [0, 6, 74, 2], [0, 8, 71, 4], [0, 12, 73, 4], [1, 0, 69, 12],
        [2, 0, 78, 4], [2, 4, 74, 2], [2, 6, 76, 2], [2, 8, 73, 4], [2, 12, 74, 4], [3, 0, 71, 12],
        [4, 0, 80, 4], [4, 4, 76, 2], [4, 6, 78, 2], [4, 8, 74, 4], [4, 12, 76, 4], [5, 0, 74, 8], [5, 8, 73, 4], [5, 12, 71, 4],
        [6, 0, 73, 4], [6, 4, 76, 2], [6, 6, 81, 2], [6, 8, 80, 4], [6, 12, 78, 4], [7, 0, 81, 12]],
    B: [[0, 0, 73, 6], [0, 6, 76, 2], [0, 8, 78, 4], [0, 12, 76, 4], [1, 0, 73, 8], [1, 8, 69, 4], [1, 12, 71, 4],
        [2, 0, 74, 6], [2, 6, 78, 2], [2, 8, 81, 4], [2, 12, 78, 4], [3, 0, 74, 12],
        [4, 0, 76, 4], [4, 4, 80, 4], [4, 8, 83, 4], [4, 12, 80, 4], [5, 0, 78, 8], [5, 8, 76, 4], [5, 12, 74, 4],
        [6, 0, 73, 4], [6, 4, 71, 4], [6, 8, 73, 4], [6, 12, 76, 4], [7, 0, 69, 12]]
  };
  /* Tema do Sudeste (leitmotif): em ré maior, um arpejo que sobe "ré–fá sustenido–lá–si" e cai devagar, no 3-3-2 que
     cabe em qualquer roupa (sertanejo em Minas, MPB em São Paulo, funk no Rio). A: ré–si com sétima–mi menor–lá com
     sétima, um acorde a cada dois compassos; no si com sétima o motivo volta meio tom acima (o ré vira ré sustenido).
     B (a resposta, que abre): sol–sol menor (o empréstimo mineiro)–fá sustenido menor–lá com sétima. */
  const SUDESTE_THEME = {
    A: [[0, 0, 74, 3], [0, 3, 78, 3], [0, 6, 81, 2], [0, 8, 83, 4], [0, 12, 81, 4], [1, 0, 78, 6], [1, 6, 76, 2], [1, 8, 74, 8],
        [2, 0, 75, 3], [2, 3, 78, 3], [2, 6, 81, 2], [2, 8, 83, 4], [2, 12, 81, 4], [3, 0, 78, 6], [3, 6, 76, 2], [3, 8, 71, 8],
        [4, 0, 79, 3], [4, 3, 76, 3], [4, 6, 71, 2], [4, 8, 74, 4], [4, 12, 76, 4], [5, 0, 79, 6], [5, 6, 78, 2], [5, 8, 76, 8],
        [6, 0, 73, 3], [6, 3, 76, 3], [6, 6, 79, 2], [6, 8, 78, 4], [6, 12, 76, 4], [7, 0, 73, 4], [7, 4, 71, 2], [7, 6, 73, 2], [7, 8, 74, 8]],
    B: [[0, 0, 83, 6], [0, 6, 81, 2], [0, 8, 79, 4], [0, 12, 78, 4], [1, 0, 79, 8], [1, 8, 74, 4], [1, 12, 71, 4],
        [2, 0, 82, 6], [2, 6, 81, 2], [2, 8, 79, 4], [2, 12, 77, 4], [3, 0, 79, 8], [3, 8, 74, 4], [3, 12, 70, 4],
        [4, 0, 73, 3], [4, 3, 76, 3], [4, 6, 81, 2], [4, 8, 78, 4], [4, 12, 76, 4], [5, 0, 73, 8], [5, 8, 69, 4], [5, 12, 71, 4],
        [6, 0, 73, 3], [6, 3, 76, 3], [6, 6, 79, 2], [6, 8, 78, 4], [6, 12, 76, 4], [7, 0, 73, 4], [7, 4, 71, 2], [7, 6, 73, 2], [7, 8, 74, 8]]
  };
  /* Tema de Pytuna (leitmotif do vilão, igual em todas as regiões): "ré – mi bemol – lá bemol – dó sustenido", grave e
     lento. Sobe meio tom, salta o trítono (ré a lá bemol, o intervalo mais instável que existe) e cai num dó sustenido
     que não resolve: a fumaça que nunca assenta. Na segunda frase o salto escorrega meio tom e volta para o ré. */
  const PYTUNA_THEME = [[0, 0, 50, 6], [0, 6, 51, 2], [0, 8, 56, 8], [1, 0, 49, 16],
    [2, 0, 50, 6], [2, 6, 51, 2], [2, 8, 56, 4], [2, 12, 55, 4], [3, 0, 50, 16]];
  /* Tema do Rhanon (leitmotif do herói, igual em todas as regiões): começa com um salto de quarta para cima, "mi – lá",
     como a estocada da lança, e segue subindo, "si – dó". A primeira frase para no acorde de mi (em suspenso); a segunda
     sobe até o lá agudo e volta. abertura = sobre os acordes da tela inicial (lá menor com nona, ré com nona, fá com
     sétima maior, mi com nona aumentada); viagem = sobre os do mapa do Brasil (fá, sol, mi menor, lá menor) */
  const RHANON_THEME = {
    abertura: [[0, 0, 64, 2], [0, 2, 69, 4], [0, 6, 71, 2], [0, 8, 72, 6], [0, 14, 71, 2],
      [1, 0, 69, 4], [1, 4, 66, 2], [1, 6, 69, 2], [1, 8, 74, 8],
      [2, 0, 72, 2], [2, 2, 76, 4], [2, 6, 77, 2], [2, 8, 76, 4], [2, 12, 72, 4],
      [3, 0, 71, 4], [3, 4, 68, 4], [3, 8, 64, 8],
      [4, 0, 64, 2], [4, 2, 69, 4], [4, 6, 71, 2], [4, 8, 72, 6], [4, 14, 71, 2],
      [5, 0, 69, 4], [5, 4, 74, 2], [5, 6, 76, 2], [5, 8, 78, 8],
      [6, 0, 81, 6], [6, 6, 79, 2], [6, 8, 77, 4], [6, 12, 76, 4],
      [7, 0, 76, 4], [7, 4, 74, 2], [7, 6, 71, 2], [7, 8, 68, 8]],
    viagem: [[0, 0, 64, 2], [0, 2, 69, 4], [0, 6, 72, 2], [0, 8, 76, 6], [0, 14, 74, 2],
      [1, 0, 74, 4], [1, 4, 71, 2], [1, 6, 74, 2], [1, 8, 79, 8],
      [2, 0, 76, 2], [2, 2, 79, 4], [2, 6, 74, 2], [2, 8, 71, 4], [2, 12, 67, 4],
      [3, 0, 69, 4], [3, 4, 72, 4], [3, 8, 76, 8],
      [4, 0, 64, 2], [4, 2, 69, 4], [4, 6, 72, 2], [4, 8, 76, 6], [4, 14, 74, 2],
      [5, 0, 74, 4], [5, 4, 71, 2], [5, 6, 74, 2], [5, 8, 79, 8],
      [6, 0, 76, 2], [6, 2, 79, 4], [6, 6, 74, 2], [6, 8, 71, 4], [6, 12, 67, 4],
      [7, 0, 69, 4], [7, 4, 72, 2], [7, 6, 76, 2], [7, 8, 81, 8]]
  };
  /* Tema de Jaci (leitmotif da lua, igual em todas as regiões): "sol – mi – ré – dó – ré", um salto de sexta para cima
     que desce devagar e para num ré que flutua, sem fechar: esperança, não vitória. Em dó maior, um acorde a cada dois
     compassos (dó – lá menor – fá – sol); a última frase sobe até o fá e volta para o ré. O jingle curto (jaciJingle em
     sfx.js) usa as cinco primeiras notas. */
  const JACI_THEME = [[0, 0, 67, 2], [0, 2, 76, 6], [0, 8, 74, 2], [0, 10, 72, 6], [1, 0, 74, 12],
    [2, 0, 69, 2], [2, 2, 76, 6], [2, 8, 74, 2], [2, 10, 72, 6], [3, 0, 69, 12],
    [4, 0, 65, 2], [4, 2, 72, 6], [4, 8, 74, 2], [4, 10, 76, 6], [5, 0, 77, 8], [5, 8, 76, 4], [5, 12, 74, 4],
    [6, 0, 74, 4], [6, 4, 79, 4], [6, 8, 76, 4], [6, 12, 74, 4], [7, 0, 74, 16]];
  // tema → 128 passos (oito compassos); shift muda a oitava (ou o tom: +7 leva para lá menor); com enfeite, as notas
  // longas às vezes ganham um floreio rápido no fim (o sorteio fica só aí: o desenho da frase não muda); upTo = só os
  // primeiros compassos (o resto fica em silêncio)
  function themeLine(theme, shift = 0, enfeite = false, upTo = 8) {
    const out = new Array(128).fill(null);
    for (const [bar, at, note, len] of theme) {
      if (bar >= upTo) continue;
      const i = bar * 16 + at;
      if (enfeite && len >= 6 && Math.random() < .5) { out[i] = {note: note + shift, len: len - 2}; out[i + len - 2] = {note: note + shift + pick([2, 3, -2]), len: 2}; }
      else out[i] = {note: note + shift, len};
    }
    return out;
  }
  // camada de percussão da mata por cima das batalhas (caxixi e atabaque), bem baixinha
  function mataLayer(s, t, bar, intensity) {
    if (s % 2 === 1) caxixi(t, (s % 4 === 3 ? .012 : .006) * intensity);
    if (s === 6 || s === 14) atabaque(t, .07 * intensity, bar % 2 === 1 && s === 14);
  }

  /* ----- faixas ----- */
  const P3_CHORDS = [
    {bass: 41, notes: [53, 57, 60, 64, 67]}, {bass: 40, notes: [52, 55, 59, 62, 66]},
    {bass: 38, notes: [50, 53, 57, 60, 64]}, {bass: 43, notes: [55, 60, 62, 67, 69], resolve: [55, 59, 62, 67, 71]}
  ];
  const P3_CHORDS_B = [
    {bass: 46, notes: [53, 57, 60, 62, 65]}, {bass: 45, notes: [52, 55, 60, 64, 67]},
    {bass: 43, notes: [50, 53, 57, 58, 62]}, {bass: 48, notes: [53, 55, 60, 65, 67], resolve: [52, 55, 60, 64, 67]}
  ];
  const P4_CHORDS = [{bass: 41, notes: [65, 69, 72, 76]}, {bass: 43, notes: [67, 71, 74, 77]}, {bass: 40, notes: [64, 67, 71, 74]}, {bass: 45, notes: [69, 72, 76, 79]}];
  const P5_CHORDS = [{bass: 45, notes: [60, 64, 67, 71]}, {bass: 50, notes: [60, 64, 66, 69]}, {bass: 41, notes: [60, 64, 65, 69]}, {bass: 40, notes: [62, 67, 68, 71]}];
  const BLUES = [69, 72, 74, 75, 76, 79, 81];

  const TRACKS = {
    // Abertura: acid-jazz/funk em Lá menor com balanço, baixo sincopado, acordes em "stab"; o tema do Rhanon (RHANON_THEME)
    // a cada oito compassos, alternando com frases de improviso
    title: {
      bpm: 118, wet: .18, level: .5, swing: .18, chords: P5_CHORDS,
      bassline: [[0, 0], [3, 12], [6, 0], [7, 10], [10, 7], [12, 0], [14, 12]], lick: null, theme: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), chord = this.chords[bar % 4];
        if (s === 0 || s === 7 || s === 10) kick(t, .13);
        if (s === 4 || s === 12) snare(t, .055); else if ((s === 9 || s === 15) && Math.random() < .4) snare(t, .015);
        hat(t, s % 4 === 2 ? .02 : .008, s === 14 && bar % 2);
        const b = this.bassline.find(([at]) => at === s);
        if (b) synth("sawtooth", mtof(chord.bass + b[1]), t, d * 1.5, .05, 700);
        if (s === 2 || s === 9) chord.notes.forEach(m => ep(mtof(m), t, s === 2 ? .3 : .15, .014));
        // tema do Rhanon (RHANON_THEME) a cada oito compassos, alternando com o improviso de antes
        if (i % 128 === 0) this.theme = Math.floor(i / 128) % 2 === 0 ? themeLine(RHANON_THEME.abertura, 0, i > 0) : null;
        if (this.theme) { const m = this.theme[i % 128]; if (m) { synth("square", mtof(m.note), t, m.len * d * .9, .024, 2200); synth("triangle", mtof(m.note - 12), t, m.len * d * .9, .012); } return; }
        if (s === 0) this.lick = bar % 2 && Math.random() < .8 ? makeLick(8) : null;
        const m = this.lick && this.lick[s];
        if (m) synth("square", mtof(m), t, d * 1.4, .02, 1800);
      }
    },
    // Mapa do Brasil: pop animado de viagem (Fmaj7, G7, Em7, Am7) com piano elétrico no contratempo e o tema do Rhanon
    map: {
      bpm: 112, wet: .2, level: .45, chords: P4_CHORDS, phrase: [],
      play(i, t, d) {
        const s = i % 16, chord = this.chords[Math.floor(i / 16) % 4];
        if (i % 128 === 0) this.phrase = themeLine(RHANON_THEME.viagem, 0, i > 0);   // tema do Rhanon, versão de viagem
        if (s === 0 || s === 8 || (s === 11 && Math.random() < .5)) kick(t, .13);
        if (s === 4 || s === 12) snare(t, .05);
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .022 : .012);
        if (s % 2 === 0) synth("triangle", mtof(chord.bass + (s % 4 === 2 ? 12 : 0)), t, d * 1.8, .09);
        if ([3, 6, 10, 14].includes(s)) chord.notes.forEach(m => ep(mtof(m), t, .22, .016));
        const m = this.phrase[i % 128];
        if (m) synth("square", mtof(m.note), t, m.len * d * .9, .022, 2400);
      }
    },
    // Ananindeua: toque de capoeira (berimbau, caxixi, atabaque e pandeiro) com pad, baixo e flauta pentatônica.
    // Forma A - A' - B - A'' (~1min20s): A só o toque e o pad; A' e B trazem a flauta; A'' sobe a flauta e
    // "respira" no fim, ficando só o berimbau. Passarinhos e gotas aparecem de vez em quando.
    local: {
      bpm: 96, wet: .38, level: .42, swing: .12,
      chords: [
        {bass: 38, notes: [50, 53, 57, 60, 64]},                                   // Dm9
        {bass: 46, notes: [50, 53, 57, 58, 62]},                                   // Bbmaj7
        {bass: 48, notes: [52, 55, 57, 60, 62]},                                   // C6/9
        {bass: 45, notes: [52, 55, 57, 60, 64], resolve: [52, 55, 57, 59, 64]}     // Am7 -> Am9
      ],
      chordsB: [
        {bass: 43, notes: [50, 53, 55, 58, 62]},                                   // Gm7
        {bass: 41, notes: [52, 53, 57, 60, 64]},                                   // Fmaj7
        {bass: 39, notes: [50, 55, 58, 62, 67]},                                   // Ebmaj7
        {bass: 45, notes: [50, 55, 57, 61, 64], resolve: [49, 52, 55, 57, 61]}     // A7sus -> A7
      ],
      form: ["A", "A2", "B", "A3"],
      toque: ["c.c.d...c.c.h.h.", "c.c.d..hc.c.d.h."],
      melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[Math.floor(barIn / 2)];
        const notes = chord.resolve && barIn % 2 ? chord.resolve : chord.notes;
        const rest = part === "A3" && barIn >= 6;
        if (i % 128 === 0) this.melody = part === "A" ? null : themeLine(NORTE_THEME[part === "B" ? "lentoB" : "lentoA"], part === "A3" ? 12 : 0, part === "A3");   // tema do Norte, devagar
        // harmonia: pad e baixo a cada acorde (2 compassos)
        if (s === 0 && barIn % 2 === 0) { pad(notes, t, d * 32, rest ? .008 : .011); synth("sine", mtof(chord.bass), t, d * 30, .07); }
        // berimbau: dong (corda solta), ding (com a moeda) e chiado
        const b = this.toque[bar % 2][s];
        if (b === "c") chi(t, .022); else if (b === "d") berimbau(50, t, .05); else if (b === "h") berimbau(52, t, .045);
        if (!rest) {
          // atabaque e pandeiro
          if (s === 0 || s === 10) atabaque(t, .09);
          if (s === 6 && bar % 2) atabaque(t, .06, true);
          if (s === 4 || s === 12) tapa(t, .02);
          if (s % 2 === 0) noiseHit(t, .04, s % 4 === 2 ? .012 : .006, "highpass", 6500);
          if (s % 2 === 1 && Math.random() < .5) caxixi(t, .006);
          // sino suave no começo de cada compasso
          if (s === 0) bell(mtof(notes[4] + 12), t, .02, 1.8);
        }
        if (Math.random() < .008) bird(t);
        if (part === "B" && Math.random() < .02) drop(t);
        const m = this.melody && this.melody[i % 128];
        if (m && !rest) flute(mtof(m.note), t, m.len * d, .03);
      },
      // frase de flauta por acorde, perto da nota anterior, com pausas de vez em quando
      makeMelody(list, lift) {
        const out = new Array(128).fill(null), penta = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84];
        const rhythms = [[[0, 6], [6, 2], [8, 8], [20, 4], [24, 8]], [[0, 8], [10, 6], [16, 12]], [[2, 4], [6, 2], [8, 6], [16, 4], [20, 4], [24, 8]], [[0, 12], [16, 6], [24, 6]]];
        let prev = 74;
        for (let c = 0; c < 4; c++) {
          if (Math.random() < .2) continue;
          const tones = list[c].notes.map(n => n + 12).concat(penta).filter(n => n >= 67 && n <= 84);
          for (const [at, len] of pick(rhythms)) {
            const near = [...tones].sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev));
            prev = near[Math.min(near.length - 1, Math.floor(Math.random() * 3))];
            out[c * 32 + at] = {note: prev + lift, len};
          }
        }
        return out;
      }
    },
    // Ananindeua à noite: a mesma roda de capoeira, mais lenta e baixinha, com acordes mais escuros, flauta grave,
    // grilos e uma coruja ao longe no lugar dos passarinhos
    localNight: {
      bpm: 84, wet: .5, level: .4, swing: .12,
      chords: [
        {bass: 38, notes: [50, 53, 57, 62, 64]},                                   // Dm(add9)
        {bass: 46, notes: [50, 53, 58, 62, 64]},                                   // Bb(add9)
        {bass: 43, notes: [50, 55, 58, 62, 65]},                                   // Gm9
        {bass: 45, notes: [49, 52, 57, 61, 64], resolve: [49, 52, 55, 58, 61]}     // A7 -> A7(b9)
      ],
      chordsB: [
        {bass: 41, notes: [48, 53, 57, 60, 64]},                                   // Fmaj7
        {bass: 40, notes: [50, 55, 58, 62, 67]},                                   // Em7(b5)
        {bass: 39, notes: [50, 55, 58, 62, 67]},                                   // Ebmaj7
        {bass: 45, notes: [49, 52, 55, 57, 61], resolve: [49, 52, 55, 58, 61]}     // A7sus -> A7(b9)
      ],
      form: ["A", "A2", "B", "A3"],
      toque: ["c...d...c.c.h...", "c...d..hc...d..."],
      melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[Math.floor(barIn / 2)];
        const notes = chord.resolve && barIn % 2 ? chord.resolve : chord.notes;
        if (i % 128 === 0) this.melody = part === "A" || part === "B" ? null : themeLine(NORTE_THEME.lentoA, -12, false, 4);   // meia frase do tema, grave; depois só grilos
        if (s === 0 && barIn % 2 === 0) { pad(notes, t, d * 32, .012); synth("sine", mtof(chord.bass), t, d * 30, .06); }
        const b = this.toque[bar % 2][s];
        if (b === "c") chi(t, .014); else if (b === "d") berimbau(50, t, .04); else if (b === "h") berimbau(52, t, .035);
        if (s === 0) atabaque(t, .06);
        if (s === 10 && bar % 2) atabaque(t, .04, true);
        if (s % 4 === 3 && Math.random() < .4) caxixi(t, .004);
        if (s === 0 && barIn % 2 === 0) bell(mtof(notes[4]), t, .016, 2.6);
        if (s % 8 === 4 && Math.random() < .5) cricket(t);
        if (Math.random() < .002) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (m) flute(mtof(m.note), t, m.len * d, .026);
      }
    },
    // São Luís e o mapa do Maranhão: toada de bumba-meu-boi misturada com forró. O batuque do boi (matraca, pandeirão,
    // maracá) fica por baixo; por cima, zabumba e triângulo de forró, a sanfona puxando os acordes no contratempo e
    // tocando o tema do Nordeste (NORDESTE_THEME), com a flauta dobrando na volta A'. Forma: introdução de batuque - A - A' - A
    localNordeste: {
      bpm: 112, wet: .3, level: .4, swing: .06, form: ["I", "A", "A2", "A"], melody: null,
      chords: [{bass: 43, notes: [55, 59, 62, 67]}, {bass: 41, notes: [53, 57, 60, 65]}, {bass: 36, notes: [52, 55, 60, 64]}, {bass: 38, notes: [54, 57, 60, 62]}],
      matraca: "x.xxx.xxx.xxx.xx",
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4], chord = this.chords[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(NORDESTE_THEME.A, part === "A2" ? 12 : 0, part === "A2");   // tema do Nordeste
        if (this.matraca[s] === "x") noiseHit(t, .025, s % 4 === 0 ? .018 : .009, "bandpass", 2600, 3);   // matracas
        triangulo(t, s % 4 === 2 ? .01 : .005, s % 4 === 2);   // triângulo: fechado no tempo, aberto no contratempo
        if (s === 0 || s === 8) { surdo(t, .1); noiseHit(t, .12, .02, "lowpass", 400); }   // pandeirão
        if (s === 6 || s === 14) surdo(t, .05);
        if (s === 0 || s === 7 || s === 10) kick(t, .08);   // zabumba
        if (s === 4 || s === 12) tapa(t, .025);
        if (s % 2 === 1) caxixi(t, .007);   // maracá
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes, t, d * 32, .009); synth("triangle", mtof(chord.bass), t, d * 6, .09); }
        if (s === 8) synth("triangle", mtof(chord.bass + 7), t, d * 4, .07);
        if (part !== "I" && [2, 6, 10, 14].includes(s)) chord.notes.slice(1).forEach(m => sanfona(mtof(m + 12), t, d * 1.2, .0045));   // sanfona puxando os acordes
        if (Math.random() < .004) bird(t);
        const m = this.melody && this.melody[i % 128];
        if (m) { sanfona(mtof(m.note), t, m.len * d * .92, .016); if (part === "A2") flute(mtof(m.note + 12), t, m.len * d * .9, .016); }   // tema na sanfona
      }
    },
    // Cuiabá e o mapa do Centro-Oeste: toada caipira, devagar. A viola caipira ponteia os acordes (dedilhado), o baixo
    // marca o tempo e a sanfona segura os acordes ao fundo, no jeito do chamamé; o tema do Centro-Oeste vem em dueto de
    // terças, como dupla sertaneja. Forma: introdução só de viola - A (dueto na viola) - B (a sanfona canta a resposta) -
    // A' (oitava acima, a sanfona e a viola juntas)
    localCentroOeste: {
      bpm: 92, wet: .32, level: .42, swing: .08, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 45, notes: [57, 61, 64, 69]}, {bass: 50, notes: [57, 62, 66, 69]}, {bass: 40, notes: [56, 59, 62, 64]}, {bass: 45, notes: [57, 61, 64, 69]}],
      chordsB: [{bass: 42, notes: [54, 57, 61, 66]}, {bass: 38, notes: [54, 57, 62, 66]}, {bass: 40, notes: [56, 59, 64, 68]}, {bass: 45, notes: [57, 61, 64, 69]}],
      pontea: [0, 2, 1, 3, 2, 1, 3, 2],   // ordem das cordas no dedilhado, uma a cada colcheia
      // segunda voz: a nota da escala de lá maior duas casas abaixo (terça maior ou menor, conforme cair)
      terca(m) { const sc = [9, 11, 1, 2, 4, 6, 8], k = sc.indexOf(((m % 12) + 12) % 12); if (k < 0) return m - 3; const pc = sc[(k + 5) % 7]; let d = ((m % 12) - pc + 12) % 12; return m - (d || 12); },
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? CENTROESTE_THEME.B : CENTROESTE_THEME.A, part === "A2" ? 12 : 0, part === "A2");
        if (s % 2 === 0) viola(mtof(chord.notes[this.pontea[s / 2]] + 12), t, d * 3, part === "I" ? .016 : .011);   // ponteado
        if (s === 0) { viola(mtof(chord.bass), t, d * 6, .04); synth("triangle", mtof(chord.bass - 12), t, d * 7, .06); }   // baixo
        if (s === 8) { viola(mtof(chord.bass + 7), t, d * 6, .032); synth("triangle", mtof(chord.bass - 5), t, d * 6, .05); }
        if (part !== "I") {
          if (s === 0 && barIn % 2 === 0) chord.notes.forEach(m => sanfona(mtof(m + 12), t, d * 31, .0035));   // sanfona ao fundo
          ganza(t, s % 4 === 0 ? .007 : .003);
          if (s === 0 || s === 10) kick(t, .04);
        }
        if (Math.random() < .002) bird(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95;
        if (part === "B") { sanfona(mtof(m.note), t, len, .017); viola(mtof(this.terca(m.note)), t, len, .016); }   // a sanfona canta, a viola faz a terça
        else { viola(mtof(m.note), t, len, .03); viola(mtof(this.terca(m.note)), t, len, .021); if (m.len >= 8) viola(mtof(m.note), t + d * 4, len * .5, .016); }   // o dueto
        if (part === "A2") sanfona(mtof(m.note - 12), t, len, .012);
      }
    },
    // Belo Horizonte e o mapa do Sudeste: sertanejo universitário. Violão de aço na batida pop (para baixo e para cima),
    // bateria com palma no 2 e no 4, baixo e a sanfona segurando os acordes; o tema do Sudeste em dupla, uma voz e a
    // terça embaixo (terca). Forma: introdução de violão - A (a dupla) - B (a sanfona canta a resposta) - A' (oitava
    // acima, a dupla com a sanfona dobrando)
    localSudeste: {
      bpm: 100, wet: .26, level: .32, swing: .04, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 38, notes: [50, 54, 57, 62, 66]}, {bass: 47, notes: [47, 51, 54, 57, 59]}, {bass: 40, notes: [52, 55, 59, 62, 64]}, {bass: 45, notes: [52, 55, 57, 61, 64]}],
      chordsB: [{bass: 43, notes: [50, 55, 59, 62, 67]}, {bass: 43, notes: [50, 55, 58, 62, 67]}, {bass: 42, notes: [49, 54, 57, 61, 64]}, {bass: 45, notes: [52, 55, 57, 61, 64]}],
      batida: {0: 0, 4: 0, 6: 1, 10: 1, 12: 0, 14: 1},   // passo: 0 = para baixo, 1 = para cima
      // segunda voz da dupla: a nota da escala de ré maior duas casas abaixo
      terca(m) { const sc = [2, 4, 6, 7, 9, 11, 1], k = sc.indexOf(((m % 12) + 12) % 12); if (k < 0) return m - 3; const pc = sc[(k + 5) % 7]; const d = ((m % 12) - pc + 12) % 12; return m - (d || 12); },
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 12 : 0, part === "A2");
        if (s in this.batida) strum(chord.notes.slice(this.batida[s] ? 2 : 0), t, d * 3, this.batida[s] ? .016 : .024, this.batida[s], true);
        if (part !== "I") {
          if (s === 0 || s === 8 || (s === 10 && barIn % 2)) kick(t, .1);
          if (s === 4 || s === 12) { snare(t, .022); palma(t, .012); }
          if (s % 2 === 0) hat(t, .006);
          if ([0, 7, 8, 12].includes(s)) synth("triangle", mtof(chord.bass - 12 + (s === 12 ? 7 : s === 7 ? 12 : 0)), t, d * 2.5, .1);
          if (s === 0 && barIn % 2 === 0) chord.notes.slice(1).forEach(m => sanfona(mtof(m + 12), t, d * 31, .003));
        }
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .92;
        if (part === "B") { sanfona(mtof(m.note), t, len, .018); violao(mtof(this.terca(m.note)), t, len, .012, true); }
        else { lead(mtof(m.note - 12), t, len, .016); lead(mtof(this.terca(m.note) - 12), t, len, .009); if (part === "A2") sanfona(mtof(m.note), t, len, .012); }   // a dupla
      }
    },
    // batalha em Minas: o mesmo sertanejo universitário acelerado, bumbo dobrado, violão batendo em colcheia e a
    // guitarra (lead) com o tema. Forma A - A' - B - C (ponte de bateria que cresce)
    battleMinas: {
      bpm: 150, wet: .2, level: .44, swing: .02, form: ["A", "A2", "B", "C"], melody: null,
      play(i, t, d) {
        const N = TRACKS.localSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)], bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 12 : 0, part !== "A"); hat(t, .02, true); }
        if (s === 0 || s === 3 || s === 8 || s === 11) kick(t, .1);
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) { snare(t, .03); palma(t, .014); }
        hat(t, s % 4 === 2 ? .01 : .005);
        if (bridge) return;
        if (s % 2 === 0) strum(chord.notes.slice(s % 4 ? 2 : 0), t, d * 1.6, s % 4 ? .005 : .008, s % 4 === 2, true);
        if (s % 4 === 0 || s === 14) synth("triangle", mtof(chord.bass - 12 + (s === 8 ? 7 : 0)), t, d * 1.8, .1);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .9;
        if (part === "B") { sanfona(mtof(m.note), t, len, .02); sanfona(mtof(N.terca(m.note)), t, len, .01); }
        else { lead(mtof(m.note - (part === "A2" ? 0 : 12)), t, len, .018); lead(mtof(N.terca(m.note) - 12), t, len, .009); }
      }
    },
    // (para escolher o estilo de São Paulo) MPB: violão de náilon na batida da bossa, piano elétrico com acordes de
    // sétima e nona, escovinha e o tema do Sudeste na flauta; B no piano elétrico, A' com o vibrafone dobrando
    mpbSudeste: {
      bpm: 116, wet: .34, level: .42, swing: .1, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 38, notes: [54, 57, 61, 64]}, {bass: 47, notes: [51, 54, 57, 60]}, {bass: 40, notes: [55, 59, 62, 66]}, {bass: 45, notes: [55, 59, 61, 66]}],
      chordsB: [{bass: 43, notes: [54, 59, 62, 66]}, {bass: 43, notes: [52, 58, 62, 67]}, {bass: 42, notes: [52, 57, 61, 64]}, {bass: 45, notes: [55, 59, 61, 66]}],
      bossa: [0, 3, 6, 10, 13],   // a batida do violão da bossa (os acordes); o polegar faz o baixo no 1 e no 3
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, 0, part === "A2");
        if (s === 0 || s === 8) violao(mtof(chord.bass + (s && barIn % 2 ? 7 : 0)), t, d * 6, .05);
        if (this.bossa.includes(s)) chord.notes.forEach((m, k) => violao(mtof(m), t + k * .006, d * 2.4, .016));
        if (part !== "I") {
          noiseHit(t, .05, s % 4 === 0 ? .006 : .003, "bandpass", 4200, .8);   // escovinha
          if (s === 0 || s === 10) kick(t, .035);
          if (s === 0 && barIn % 2 === 0) { chord.notes.forEach(m => ep(mtof(m + 12), t, d * 24, .007)); synth("sine", mtof(chord.bass - 12), t, d * 14, .06); }
        }
        if (Math.random() < .002) bird(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95;
        if (part === "B") ep(mtof(m.note), t, len, .03);
        else { flute(mtof(m.note), t, len, .026); if (part === "A2") bell(mtof(m.note + 12), t, .008, 1.2); }
      }
    },
    // (para escolher o estilo do Rio) funk carioca: o tamborzão (o grave do 808 e o tambor), palma, chimbal e um
    // sintetizador cantando o tema; B com o metal (acordes curtos) respondendo
    funkSudeste: {
      bpm: 130, wet: .16, level: .32, form: ["I", "A", "B", "A2"], melody: null,
      tambor: {0: "b", 3: "t", 6: "b", 8: "t", 10: "b", 12: "t", 14: "t"},   // b = grave do 808, t = tambor
      play(i, t, d) {
        const N = TRACKS.localSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)], h = this.tambor[s];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 12 : 0, part === "A2");
        if (h === "b") bumbo808(mtof(chord.bass - 12), t, d * (s === 10 ? 4 : 3), .05);
        if (h === "t") { atabaque(t, .07, s === 14); noiseHit(t, .06, .012, "bandpass", 700, 1.2); }
        if (part === "I") return;
        if (s === 4 || s === 12) palma(t, .02);
        if (s % 2 === 0) hat(t, s % 4 ? .004 : .007);
        if (part === "B" && [0, 3, 6].includes(s) && barIn % 2 === 0) chord.notes.slice(1).forEach(m => synth("sawtooth", mtof(m + 12), t, d * 1.2, .006, 2400));   // metal
        if (s === 0 && barIn % 2 === 0) pad(chord.notes.slice(1), t, d * 32, .006);
        const m = this.melody && this.melody[i % 128];
        if (m) { lead(mtof(m.note), t, m.len * d * .85, .016); synth("sawtooth", mtof(m.note - 12), t, m.len * d * .85, .006, 1800); }
      }
    },
    // Pytuna em cena: zumbido grave do coro, vento, coração batendo e a badalada; o tema de Pytuna (PYTUNA_THEME) numa voz
    // de fumaça (serra abafada com o grave por baixo), repetindo uma oitava acima na segunda volta. Toca nas cenas dele
    pytuna: {
      bpm: 70, wet: .55, level: .42, melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), lap = Math.floor(i / 64);
        if (i % 64 === 0) { this.melody = themeLine(PYTUNA_THEME, lap % 2 ? 12 : 0); choir([26, 33, 38], t, d * 64, .022); sweep(t, d * 32, .03); }
        if (s === 0 && bar % 2 === 0) toll(38, t, .035);
        if (s === 0 || s === 3) kick(t, s ? .06 : .09);   // coração
        if (s === 8 && bar % 2 === 1) surdo(t, .07);
        if (i % 32 === 16) sweep(t, d * 16, .02);   // a fumaça passando
        const m = this.melody && this.melody[i % 64];   // o tema tem 4 compassos
        if (m) { synth("sawtooth", mtof(m.note + 12), t, m.len * d, .02, 700); synth("sine", mtof(m.note), t, m.len * d, .05); synth("triangle", mtof(m.note + 19), t, m.len * d * .6, .004); }
      }
    },
    // Jaci volta a brilhar (fim do capítulo): sinos, pad aberto, harpa em arpejo e o tema de Jaci (JACI_THEME) na flauta,
    // repetindo uma oitava acima com o sino dobrando. Sem bateria: só o brilho da lua
    jaci: {
      bpm: 80, wet: .6, level: .42, melody: null,
      chords: [{bass: 36, notes: [60, 64, 67, 71]}, {bass: 45, notes: [57, 60, 64, 67]}, {bass: 41, notes: [57, 60, 65, 69]}, {bass: 43, notes: [55, 59, 62, 67]}],
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, lap = Math.floor(i / 128), chord = this.chords[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = themeLine(JACI_THEME, lap % 2 ? 12 : 0);
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes, t, d * 32, .012); synth("sine", mtof(chord.bass), t, d * 30, .06); }
        if (s % 2 === 0) { const n = chord.notes[(s / 2) % 4] + 12; synth("triangle", mtof(n), t, d * 3, .008); }   // harpa em arpejo
        if (s === 0) bell(mtof(chord.notes[3] + 12), t, .014, 2.4);
        const m = this.melody && this.melody[i % 128];
        if (m) { flute(mtof(m.note), t, m.len * d * .95, .03); if (lap % 2) bell(mtof(m.note + 12), t, .01, 1.6); }
      }
    },
    // batalha no Nordeste: forró acelerado (baião de batalha) com zabumba, triângulo, sanfona puxando os acordes e o tema
    // do Nordeste (NORDESTE_THEME) na sanfona; matraca do boi por baixo. Forma A - A' (oitava acima, com floreios) - A - C
    // (C = ponte só de zabumba e triângulo com virada crescente)
    battleNordeste: {
      bpm: 148, wet: .22, level: .46, swing: .05, form: ["A", "A2", "A", "C"], melody: null,
      play(i, t, d) {
        const N = TRACKS.localNordeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4], chord = N.chords[Math.floor(barIn / 2)];
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(NORDESTE_THEME.A, part === "A2" ? 12 : 0, part === "A2"); hat(t, .02, true); }   // tema do Nordeste
        triangulo(t, s % 4 === 2 ? .012 : .006, s % 4 === 2);
        if (s === 0 || s === 6 || s === 8) kick(t, s === 6 ? .08 : .11);   // zabumba no baião
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) tapa(t, .03);
        if (bridge) return;
        if (s % 4 === 1) noiseHit(t, .02, .008, "bandpass", 2600, 3);   // matraca
        if (s === 0 || s === 6 || s === 8 || s === 12) synth("triangle", mtof(chord.bass + (s === 6 || s === 12 ? 7 : 0)), t, d * 1.6, .1);
        if ([2, 6, 10, 14].includes(s)) chord.notes.slice(1).forEach(m => sanfona(mtof(m + 12), t, d * 1.1, .005));
        if (s === 0 && barIn % 2 === 0) pad(chord.notes, t, d * 32, .006);
        const m = this.melody && this.melody[i % 128];
        if (m) { sanfona(mtof(m.note), t, m.len * d * .9, part === "A2" ? .02 : .018); if (part === "A2") flute(mtof(m.note + 12), t, m.len * d * .9, .012); }
      }
    },
    // batalha no Centro-Oeste: pagode de viola (o balanço sincopado do Tião Carreiro) com a bateria do sertanejo de
    // hoje: bumbo, caixa no 2 e no 4 e chimbal; baixo andando e a sanfona. Forma: introdução só com o ponteio do pagode -
    // A (tema na viola, em dueto) - B (a sanfona solando a resposta do tema, com outros acordes) - A' (oitava acima,
    // viola e sanfona juntas, com floreios) - C (ponte de bateria que cresce)
    battleCentroOeste: {
      bpm: 138, wet: .2, level: .46, swing: .03, form: ["I", "A", "B", "A2", "C"], melody: null,
      pagode: [0, 3, 6, 8, 10, 11, 14],   // as batidas do ponteio do pagode de viola
      riff: [2, 1, 3, 2, 1, 2, 3],
      play(i, t, d) {
        const N = TRACKS.localCentroOeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 5];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)];
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "I" || part === "C" ? null : themeLine(part === "B" ? CENTROESTE_THEME.B : CENTROESTE_THEME.A, part === "A2" ? 12 : 0, part !== "A"); hat(t, .02, true); }
        // bateria: bumbo no 1 e no "e" do 3, caixa no 2 e no 4, chimbal nas colcheias (aberto no contratempo do fim)
        if (part !== "I") {
          if (s === 0 || s === 7 || s === 10) kick(t, s ? .08 : .11);
          if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) snare(t, .03);
          if (s % 2 === 0) hat(t, s === 14 ? .012 : .007, s === 14);
        }
        if (bridge) { if (s % 4 === 2) reco(t, .008); return; }
        // ponteio do pagode: a viola bate as cordas no balanço quebrado, com o polegar no baixo
        const k = this.pagode.indexOf(s);
        if (k >= 0) viola(mtof(chord.notes[this.riff[k]] + 12), t, d * 2, part === "I" ? .02 : .013);
        if (s === 0 || s === 8) viola(mtof(chord.bass + (s ? 7 : 0)), t, d * 3, .045);
        if (part !== "I") {
          if ([0, 6, 8, 12].includes(s)) synth("triangle", mtof(chord.bass - 12 + (s === 6 || s === 12 ? 7 : 0)), t, d * 1.8, .09);   // baixo andando
          if (s === 4 || s === 12) chord.notes.slice(1).forEach(m => sanfona(mtof(m + 12), t, d * 1.5, .004));   // sanfona no contratempo
        }
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .9;
        if (part === "B") { sanfona(mtof(m.note), t, len, .02); viola(mtof(N.terca(m.note)), t, len, .014); }
        else { viola(mtof(m.note), t, len, .034); viola(mtof(N.terca(m.note)), t, len, .022); if (part === "A2") sanfona(mtof(m.note), t, len, .014); }
      }
    },
    // batalha: a roda de capoeira acelerada (toque de São Bento Grande), com atabaque, pandeiro, baixo marcado
    // e a flauta tocando o tema do Norte (NORTE_THEME). Forma A - B - A' (tema uma oitava acima, com floreios) - C
    // (C = ponte só de percussão com virada crescente)
    battleCapo: {
      bpm: 132, wet: .24, level: .32, swing: .08,
      chords: [{bass: 38, notes: [50, 53, 57, 62]}, {bass: 36, notes: [48, 52, 55, 60]}, {bass: 46, notes: [50, 53, 58, 62]}, {bass: 45, notes: [49, 52, 57, 61]}],
      chordsB: [{bass: 43, notes: [50, 55, 58, 62]}, {bass: 41, notes: [48, 53, 57, 60]}, {bass: 39, notes: [51, 55, 58, 63]}, {bass: 45, notes: [49, 52, 55, 61], resolve: [49, 52, 57, 61]}],
      scale: [62, 65, 67, 69, 72, 74, 77, 79, 81], form: ["A", "B", "A2", "C"],
      toque: ["d.c.h.c.d.c.hhc.", "d.c.h.c.d.chc.h."], bassline: [[0, 0], [3, 12], [6, 7], [8, 0], [11, 10], [14, 12]], melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[barIn % 4];
        const notes = chord.resolve && s >= 8 ? chord.resolve : chord.notes;
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(NORTE_THEME[part === "B" ? "B" : "A"], part === "A2" ? 12 : 0, part === "A2"); hat(t, .02, true); }   // tema do Norte
        // berimbau sempre; na ponte ele puxa a roda sozinho com o atabaque
        const b = this.toque[bar % 2][s];
        if (b === "c") chi(t, .02); else if (b === "d") berimbau(50, t, .05); else if (b === "h") berimbau(52, t, .045);
        if (s === 0 || s === 8) atabaque(t, .1); if (s === 3 || s === 11) atabaque(t, .07, true); if (s === 14) atabaque(t, .06, true);
        if (bridge) { if (s === 4 || s === 12) tapa(t, .022); return; }
        if (s === 0 || s === 7 || s === 10) kick(t, .1);
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) tapa(t, .03);
        noiseHit(t, .035, s % 4 === 2 ? .016 : .007, "highpass", 6500);   // pandeiro
        if (s % 2 === 1) caxixi(t, .007);
        const bl = this.bassline.find(([at]) => at === s);
        if (bl) synth("triangle", mtof(chord.bass + bl[1]), t, d * 1.6, .1);
        if (s === 0) pad(notes, t, d * 16, .008);
        if (s === 6 || s === 14) notes.slice(1, 4).forEach(m => ep(mtof(m + 12), t, .14, .01));
        if (s === 0) bell(mtof(notes[3] + 12), t, .016, .8);
        const m = this.melody && this.melody[i % 128];
        if (m) flute(mtof(m.note), t, m.len * d * .9, part === "A2" ? .038 : .034);   // o tema na frente da mistura
      }
    },
    // batalha na água (rio, igarapé, manguezal, várzea): carimbó, com curimbó grave e agudo, maracas sem parar, banjo
    // no contratempo e o tema do Norte na flauta saltitada, com a guitarra segurando as notas por baixo. Mesmos acordes
    // e forma da roda (A - B - A' - C), para o tema ser o mesmo
    battleCarimbo: {
      bpm: 138, wet: .26, level: .32, swing: .1, form: ["A", "B", "A2", "C"], melody: null,
      curimbo: "g..a..a.g.a.a..a", bassline: [[0, 0], [3, 7], [6, 12], [8, 0], [11, 7], [14, 10]],
      play(i, t, d) {
        const C = TRACKS.battleCapo, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? C.chordsB : C.chords, chord = list[barIn % 4], notes = chord.resolve && s >= 8 ? chord.resolve : chord.notes;
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(NORTE_THEME[part === "B" ? "B" : "A"], part === "A2" ? 12 : 0, part === "A2"); hat(t, .02, true); }   // tema do Norte
        const c = this.curimbo[s];   // curimbó: g = grave, a = agudo
        if (c === "g") atabaque(t, .1); else if (c === "a") atabaque(t, .065, true);
        caxixi(t, s % 4 === 2 ? .014 : .006);   // maracas
        if (bridge) { if (s === 4 || s === 12) clap(t); return; }
        if (s === 0 || s === 8) kick(t, .09);
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) tapa(t, .028);
        const bl = this.bassline.find(([at]) => at === s);
        if (bl) synth("triangle", mtof(chord.bass + bl[1]), t, d * 1.4, .1);
        if (s % 4 === 2) notes.slice(1, 4).forEach(m => guitar(mtof(m + 12), t, d * .7, .006, 3400));   // banjo no contratempo
        if (s === 0) pad(notes, t, d * 16, .006);
        if (Math.random() < .01) drop(t);
        const m = this.melody && this.melody[i % 128];
        if (m) { flute(mtof(m.note), t, Math.min(m.len, 3) * d * .8, part === "A2" ? .038 : .034); guitar(mtof(m.note - 12), t, m.len * d, .007, 1800); }
      }
    },
    // batalha em Belém (Cidade Velha, Porto, Baixadas): guitarrada acelerada, com bateria de cidade, baixo andando,
    // curimbó e maracas por baixo, piano elétrico no contratempo e o tema do Norte na guitarra, com repique nas notas
    // longas (na volta A', a flauta dobra uma oitava acima). Mesmos acordes e forma da roda
    battleGuitarrada: {
      bpm: 144, wet: .22, level: .32, swing: .06, form: ["A", "B", "A2", "C"], melody: null,
      bassline: [[0, 0], [3, 7], [6, 12], [8, 0], [10, 7], [13, 10], [14, 12]],
      play(i, t, d) {
        const C = TRACKS.battleCapo, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? C.chordsB : C.chords, chord = list[barIn % 4], notes = chord.resolve && s >= 8 ? chord.resolve : chord.notes;
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(NORTE_THEME[part === "B" ? "B" : "A"], 0, part === "A2"); hat(t, .03, true); }   // tema do Norte
        if (s === 0 || s === 8 || (s === 6 && bar % 2) || s === 11) kick(t, .12);
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .018 : .009, s === 14 && barIn === 7);
        if ([0, 3, 6, 10].includes(s)) atabaque(t, s === 0 ? .08 : .055, s === 3 || s === 10);   // curimbó
        if (s % 2 === 1) caxixi(t, .008);
        if (bridge) { if (s === 4 || s === 12) snare(t, .04); return; }
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) { snare(t, .05); if (part === "B") clap(t); }
        const bl = this.bassline.find(([at]) => at === s);
        if (bl) synth("triangle", mtof(chord.bass + bl[1]), t, d * 1.4, .11);
        if (s === 2 || s === 6 || s === 10 || s === 14) notes.slice(1, 4).forEach(m => ep(mtof(m + 12), t, .12, .01));   // piano no contratempo
        if (s === 0) pad(notes, t, d * 16, .006);
        const m = this.melody && this.melody[i % 128];
        if (m) {
          guitar(mtof(m.note), t, m.len * d, .022); if (m.len >= 6) guitar(mtof(m.note), t + d * 2, d * 2, .009);   // repique de guitarrada
          if (part === "A2") flute(mtof(m.note + 12), t, m.len * d * .9, .012);
        }
      }
    },
    // chefe: começa com um zumbido grave, badalada e tambores (o chefe se apresenta); depois tambores de guerra, riff
    // de guitarra distorcida em ré frígio, metais nos tempos fortes, coro escuro e a melodia em menor harmônico.
    // Forma: abertura (só na primeira volta) e A - B - A' - C (B em meio-tempo com cordas em trêmulo; C só tambores e coro)
    battleBoss: {
      bpm: 148, wet: .28, level: .3,
      chords: [{bass: 38, notes: [50, 53, 57, 62]}, {bass: 39, notes: [51, 55, 58, 63]}, {bass: 36, notes: [48, 51, 55, 60]}, {bass: 37, notes: [49, 52, 55, 58], resolve: [49, 52, 57, 61]}],
      chordsB: [{bass: 34, notes: [50, 53, 58, 62]}, {bass: 33, notes: [49, 52, 57, 61]}, {bass: 31, notes: [50, 55, 58, 62]}, {bass: 33, notes: [49, 52, 55, 58], resolve: [49, 53, 57, 61]}],
      form: ["A", "B", "A2", "C"], riff: [0, 0, 12, 0, 1, 0, 12, 0, 0, 0, 10, 0, -1, 0, 8, 7], intro: 32, melody: null,
      play(i, t, d) {
        if (i < this.intro) {   // abertura: o chão treme antes da luta
          const s = i % 16, bar = Math.floor(i / 16);
          if (i === 0) { choir([26, 33, 38], t, d * 32, .02); toll(50, t, .05); }
          if (s === 0 || s === 8) surdo(t, .16); if (s === 6 || s === 14) surdo(t, .09);
          if (bar === 1 && s === 0) { sweep(t, d * 16, .04); toll(51, t, .04); }
          if (bar === 1 && s >= 8 && s % 2 === 0) snare(t, .02 + (s - 8) * .006);
          return;
        }
        const j = i - this.intro, s = j % 16, bar = Math.floor(j / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[Math.floor(barIn / 2)];
        const notes = chord.resolve && barIn % 2 ? chord.resolve : chord.notes;
        const half = part === "B", brk = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (j % 128 === 0) { this.melody = part === "C" ? null : themeLine(NORTE_THEME[part === "B" ? "chefeB" : "chefeA"], 0, part === "A2"); hat(t, .03, true); }   // tema do Norte, pesado
        if (s === 0 && barIn % 2 === 0) { choir(notes.slice(0, 3).map(n => n - 12), t, d * 32, brk ? .02 : .013); toll(notes[0] + 12, t, .03); }
        if (brk || build) {   // ponte: coração batendo, tambores e o coro; a virada cresce no fim
          if (s === 0 || s === 3) kick(t, .14); if (s === 8 || s === 14) surdo(t, .12);
          if (build && !battleFill(t, d, s, barIn, true) && (s === 4 || s === 12)) snare(t, .04);
          return;
        }
        // tambores de guerra
        if (half) { if (s === 0 || s === 10) kick(t, .15); if (s === 8) { snare(t, .07); clap(t); } if (s === 14 || s === 15) surdo(t, .1); }
        else {
          if ([0, 3, 8, 11].includes(s)) kick(t, .14);
          if (!battleFill(t, d, s, barIn, false) && (s === 4 || s === 12)) { snare(t, .065); clap(t); }
          if (s === 14 || s === 15) surdo(t, .09 + (s - 14) * .03);
        }
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .014 : .007, s === 6 && half);
        // riff distorcido (no meio-tempo só as cabeças de tempo) e metais nos tempos fortes
        const r = this.riff[s];
        if (!half || s % 4 === 0) dist(mtof(chord.bass + 12 + r), t, d * (half ? 3.6 : .9), half ? .03 : .024, half ? 1100 : 1500);
        if (s === 0 || (s === 10 && !half)) brass(notes.slice(1).map(n => n + 12), t, d * (s === 0 ? 3 : 1.5), .012);
        if (half) synth("sawtooth", mtof(notes[3] + 12), t, d * .9, .007, 3200);   // cordas em trêmulo
        if (s === 0) synth("sine", mtof(chord.bass), t, d * 15, .09);
        const m = this.melody && this.melody[j % 128];
        if (m) { lead(mtof(m.note), t, m.len * d, part === "A2" ? .015 : .012); flute(mtof(m.note - 12), t, m.len * d, .018); }
      }
    },
    // mapa do Pará de dia: guitarrada/carimbó com cara de cidade. Bateria com caixa e chimbal, baixo andando, curimbó
    // (atabaque) e maracas por baixo, piano elétrico no contratempo e a guitarra solando. Forma A - A' - B - A''
    mapPara: {
      bpm: 116, wet: .24, level: .42, swing: .1,
      chords: [{bass: 45, notes: [57, 60, 64, 67, 72]}, {bass: 38, notes: [57, 62, 65, 69, 72]}, {bass: 43, notes: [55, 59, 62, 67, 71]}, {bass: 48, notes: [55, 60, 64, 67, 72]}],
      chordsB: [{bass: 41, notes: [57, 60, 65, 69, 72]}, {bass: 43, notes: [55, 59, 62, 67, 71]}, {bass: 45, notes: [57, 60, 64, 69, 72]}, {bass: 40, notes: [56, 59, 62, 64, 68], resolve: [56, 59, 62, 64, 71]}],
      form: ["A", "A2", "B", "A3"], bassline: [[0, 0], [3, 7], [6, 12], [8, 0], [10, 7], [13, 10], [14, 12]], melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[Math.floor(barIn / 2)];
        const notes = chord.resolve && barIn % 2 ? chord.resolve : chord.notes;
        if (i % 128 === 0) this.melody = part === "A" ? null : part === "B" ? TRACKS.local.makeMelody(list, 0) : themeLine(NORTE_THEME.lentoA, part === "A2" ? 7 : -5, part === "A3");   // tema do Norte em lá menor; no B a guitarra improvisa
        // bateria de cidade
        if (s === 0 || s === 8 || (s === 6 && bar % 2)) kick(t, .12);
        if (s === 4 || s === 12) { snare(t, .045); if (part === "B") clap(t); }
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .018 : .009, s === 14 && barIn === 7);
        // carimbó: curimbó grave/agudo e maracas
        if ([0, 3, 6, 10].includes(s)) atabaque(t, s === 0 ? .09 : .06, s === 3 || s === 10);
        if (s % 2 === 1) caxixi(t, s % 4 === 3 ? .012 : .007);
        const b = this.bassline.find(([at]) => at === s);
        if (b) synth("triangle", mtof(chord.bass + b[1] - 12), t, d * 1.6, .11);
        if (s === 2 || s === 6 || s === 10 || s === 14) notes.slice(1, 4).forEach(m => ep(mtof(m), t, .16, .011));   // piano no contratempo
        if (s === 0 && barIn % 2 === 0) pad(notes, t, d * 32, part === "A" ? .008 : .006);
        if (part === "A" && (s === 0 || s === 8)) guitar(mtof(notes[4]), t, d * 4, .012);   // guitarra pontuando enquanto não sola
        const m = this.melody && this.melody[i % 128];
        if (m) { guitar(mtof(m.note), t, m.len * d, .02); if (m.len >= 6) guitar(mtof(m.note), t + d * 2, d * 2, .008); }   // nota longa: repique de guitarrada
        if (Math.random() < .004) bird(t);
      }
    },
    // mapa do Pará à noite: a mesma harmonia, mais lenta, com piano elétrico, percussão de mão macia, grilos e a
    // guitarra grave e com eco; a cidade acesa ao longe e a mata em volta
    mapParaNight: {
      bpm: 88, wet: .48, level: .4, swing: .12,
      chords: [{bass: 45, notes: [57, 60, 64, 67, 71]}, {bass: 38, notes: [57, 60, 62, 65, 69]}, {bass: 43, notes: [55, 59, 62, 65, 69]}, {bass: 40, notes: [56, 59, 62, 64, 68], resolve: [55, 59, 62, 64, 67]}],
      chordsB: [{bass: 41, notes: [57, 60, 64, 65, 69]}, {bass: 40, notes: [55, 59, 62, 64, 67]}, {bass: 38, notes: [57, 60, 62, 65, 72]}, {bass: 40, notes: [56, 59, 62, 64, 68], resolve: [56, 59, 62, 65, 68]}],
      form: ["A", "A2", "B", "A3"], melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[Math.floor(barIn / 2)];
        const notes = chord.resolve && barIn % 2 ? chord.resolve : chord.notes;
        if (i % 128 === 0) this.melody = part === "A" ? null : part === "B" ? TRACKS.local.makeMelody(list, -12) : themeLine(NORTE_THEME.lentoA, -5, false, 6);   // tema do Norte (a guitarra toca uma oitava acima)
        if (s === 0 || (s === 10 && bar % 2)) kick(t, .07);
        if (s === 8) noiseHit(t, .06, .02, "bandpass", 2400, 2);   // aro da caixa
        if (s % 4 === 2) noiseHit(t, .07, .006, "highpass", 5000);   // vassourinha
        if (s === 0 || s === 6) atabaque(t, .05, s === 6);
        if (s % 4 === 3 && Math.random() < .5) caxixi(t, .005);
        if (s === 0) synth("sine", mtof(chord.bass - 12), t, d * 14, .08);
        if (s === 0 || s === 7) notes.slice(0, 4).forEach(m => ep(mtof(m), t, s === 0 ? .9 : .4, .012));
        if (s === 0 && barIn % 2 === 0) { pad(notes, t, d * 32, .01); bell(mtof(notes[4] + 12), t, .012, 2.4); }
        if (s % 8 === 4 && Math.random() < .5) cricket(t);
        if (Math.random() < .0015) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (m) guitar(mtof(m.note + 12), t, m.len * d, .016, 1800);
      }
    }
  };
  function makeLick(from, dense) {
    const out = new Array(16).fill(null); let idx = 3;
    for (let k = from; k < 15; k++) {
      if (Math.random() < .35) continue;
      idx = Math.max(0, Math.min(BLUES.length - 1, idx + pick([-2, -1, 1, 1, 2])));
      out[k] = BLUES[idx];
    }
    return out;
  }

  // batalhas: mesmas estruturas da vitrine (A - B - A' - C, com ponte em meio-tempo e virada crescente)
  const BATTLE = {
    // bicho pequeno: breakbeat (~140 BPM) com sinos em arpejo rápido
    battleP3: {
      bpm: 140, wet: .3, level: .45, chords: P3_CHORDS, chordsB: P3_CHORDS_B,
      scale: [64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81], form: ["A", "B", "A2", "C"],
      waves: [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 4, 2, 1, 3, 4, 3], [4, 2, 3, 1, 2, 0, 1, 2]], wave: null, melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[barIn % 4];
        const notes = chord.resolve && s >= 8 ? chord.resolve : chord.notes;
        const half = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.wave = part === "A" ? this.waves[0] : pick(this.waves); this.melody = part === "B" || part === "A2" ? battleMelody(list, this.scale, 12) : null; hat(t, .03, true); }
        if (half) { if (s === 0) kick(t, .13); if (s === 8) snare(t, .045); if (s % 4 === 0) hat(t, .008); }
        else {
          if (s === 0 || s === 10 || (s === 3 && bar % 2)) kick(t, .13);
          if (!battleFill(t, d, s, barIn, build)) { if (s === 4 || s === 12) snare(t, .05); else if ((s === 7 || s === 15) && Math.random() < .5) snare(t, .014); }
          if (s % 2 === 0) hat(t, s % 4 === 2 ? .016 : .008, s === 14);
          mataLayer(s, t, bar, 1);
        }
        if (s === 0) pad(notes, t, d * 16, half ? .013 : .009);
        if (half) { if (s === 0) synth("sine", mtof(chord.bass), t, d * 14, .08); }
        else if (s === 0 || s === 6 || s === 10) synth("sine", mtof(chord.bass), t, d * (s === 0 ? 5 : 3), .08);
        if (part === "A2" && (s === 6 || s === 14)) notes.slice(1, 4).forEach(m => ep(mtof(m + 12), t, .15, .012));
        if (!half || s % 4 === 0) bell(mtof(notes[this.wave[s % 8]] + 12), t, s % 4 === 0 ? .03 : .02, half ? 1 : .5);
        const m = this.melody && this.melody[i % 128];
        if (m) lead(mtof(m.note), t, m.len * d, .014);
      }
    },
    // bicho médio: pop-rock animado (~150 BPM) com guitarra em quintas e refrão "pra cima"
    battleP4: {
      bpm: 150, wet: .15, level: .46, chords: P4_CHORDS,
      chordsB: [{bass: 38, notes: [65, 69, 72, 74]}, {bass: 46, notes: [65, 69, 70, 74]}, {bass: 48, notes: [64, 67, 70, 72]}, {bass: 41, notes: [64, 65, 69, 72]}],
      scaleA: [64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81], scaleB: [64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81], form: ["A", "B", "A2", "C"], melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[barIn % 4];
        const half = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : battleMelody(list, part === "B" ? this.scaleB : this.scaleA); hat(t, .03, true); }
        if (half) { if (s === 0) kick(t, .13); if (s === 8) snare(t, .05); if (s % 4 === 2) hat(t, .01); }
        else {
          if (part === "B" ? s % 4 === 0 : (s === 0 || s === 8 || s === 10)) kick(t, .13);
          if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) { snare(t, .055); if (part === "A2") clap(t); }
          if (part === "B") { if (s % 4 === 2) hat(t, .02, true); } else if (s % 2 === 0) hat(t, s % 4 === 0 ? .016 : .01);
          if (part !== "B") mataLayer(s, t, bar, .8);
        }
        if (half) { if (s === 0) synth("square", mtof(chord.bass), t, d * 14, .04, 600); }
        else if (s % 2 === 0) synth("square", mtof(chord.bass + (s === 14 || (part === "B" && s % 4 === 2) ? 12 : 0)), t, d * 1.8, .04, 700);
        if (half) { if (s === 0) chord.notes.forEach(m => ep(mtof(m), t, d * 14, .014)); }
        else if (part === "A2" ? s % 2 === 0 : (s === 0 || s === 6 || s === 10)) {
          const len = part === "A2" ? 1.6 : s === 0 ? 5 : 3, vol = part === "A2" ? .008 : .012;
          [0, 7, 12].forEach(iv => synth("sawtooth", mtof(chord.bass + 24 + iv), t, d * len, vol, 1500));
        }
        const m = this.melody && this.melody[i % 128];
        if (m) { if (part === "B") lead(mtof(m.note), t, m.len * d, .016); else synth("square", mtof(m.note), t, m.len * d * .9, .02, 2800); }
      }
    },
    // bicho grande e chefes: acid-jazz agitado (~150 BPM) com metais, improviso e jazz lento na ponte
    battleP5: {
      bpm: 150, wet: .15, level: .5, swing: .1, chords: P5_CHORDS,
      chordsB: [{bass: 41, notes: [64, 67, 69, 72]}, {bass: 43, notes: [62, 65, 69, 71]}, {bass: 40, notes: [62, 67, 69, 71]}, {bass: 45, notes: [60, 64, 67, 71]}],
      bassline: [[0, 0], [2, 12], [3, 0], [6, 10], [7, 12], [8, 0], [10, 7], [11, 10], [13, 0], [14, 12]], walk: [[0, 0], [4, 3], [8, 5], [12, 7]],
      form: ["A", "B", "A2", "C"], lick: null, melody: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const list = part === "B" ? this.chordsB : this.chords, chord = list[barIn % 4];
        const half = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "B" ? battleMelody(list, BLUES, 12) : null; hat(t, .03, true); }
        if (half) { if (s === 0 || s === 10) kick(t, .11); if (s === 8) snare(t, .05); if (s % 4 === 0) hat(t, .012, true); }
        else {
          if (s === 0 || s === 6 || s === 10) kick(t, .13);
          if (!battleFill(t, d, s, barIn, build)) { if (s === 4 || s === 12) snare(t, .055); else if ([3, 9, 15].includes(s) && Math.random() < .45) snare(t, .014); }
          hat(t, s % 4 === 2 ? .018 : .009, s === 14);
          if (part === "A2") mataLayer(s, t, bar, 1);
        }
        const b = (half ? this.walk : this.bassline).find(([at]) => at === s);
        if (b) synth("sawtooth", mtof(chord.bass + b[1]), t, d * (half ? 3.5 : 1.2), .045, half ? 700 : 800);
        if (half) { if (s === 0) chord.notes.forEach(m => ep(mtof(m), t, d * 14, .014)); }
        else if (s === 2 || s === 7 || s === 10 || (part === "A2" && s === 14)) chord.notes.forEach(m => { synth("sawtooth", mtof(m), t, d * 1.5, .009, 2200); synth("sawtooth", mtof(m) * 1.005, t, d * 1.5, .009, 2200); });
        if (part === "B") {
          const m = this.melody && this.melody[i % 128];
          if (m) { synth("sawtooth", mtof(m.note), t, m.len * d, .011, 2400); synth("sawtooth", mtof(m.note) * 1.006, t, m.len * d, .011, 2400); }
        } else if (!half && !build) {
          if (s === 0) this.lick = Math.random() < (part === "A2" ? 1 : .9) ? makeLick(part === "A2" ? 2 : 8) : null;
          const m = this.lick && this.lick[s];
          if (m) synth("square", mtof(m), t, d * 1.3, .02, 2000);
        }
      }
    }
  };
  const ALL = {...TRACKS, ...BATTLE};

  function build(tr) {
    const m = X.createGain(), mix = X.createGain(), dry = X.createGain(), wet = X.createGain(), verb = makeReverb(), comp = X.createDynamicsCompressor(), lv = X.createGain();
    m.gain.value = .0001; dry.gain.value = .7; wet.gain.value = tr.wet; lv.gain.value = LEVEL;
    mix.connect(dry).connect(m); mix.connect(verb).connect(wet).connect(m);
    m.connect(comp).connect(lv).connect(DEST);
    return {master: m, mix};
  }
  function schedule(horizon = document.hidden ? 1.5 : .3) {
    const d = 60 / track.bpm / 4;
    while (nextTime < X.currentTime + horizon) {
      track.play(step, nextTime + (track.swing && step % 2 ? d * track.swing : 0), d);
      nextTime += d; step++;
    }
  }
  function fadeOut(sec) {
    if (!bus) return;
    clearInterval(timer);
    const b = bus, t = X.currentTime;
    bus = null; track = null; trackId = null;
    b.master.gain.cancelScheduledValues(t);
    b.master.gain.setValueAtTime(Math.max(b.master.gain.value, .0001), t);
    b.master.gain.exponentialRampToValueAtTime(.0001, t + sec);
    setTimeout(() => b.master.disconnect(), sec * 1000 + 400);
  }
  // "fuuip" curto anunciando a batalha
  function riser() {
    const t = X.currentTime, n = noiseSrc(), f = X.createBiquadFilter(), g = X.createGain();
    f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + .35);
    g.gain.value = 0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .3); g.gain.linearRampToValueAtTime(0, t + .38);
    n.connect(f).connect(g).connect(DEST); n.start(t); n.stop(t + .4);
  }
  function play(id, fadeIn) {
    if (!AC) return;
    X = AC; DEST = musicOut;   // canal da música (volume nas opções)
    const next = ALL[id];
    if (bus && next === track) return;
    const wasBattle = trackId && trackId.startsWith("battle");
    fadeOut(.5);
    try { AC.resume().catch(() => {}); } catch (_) {}
    if (id.startsWith("battle") && !wasBattle) riser();
    track = next; trackId = id; bus = build(track); step = 0;
    nextTime = X.currentTime + .1;
    bus.master.gain.setValueAtTime(.0001, X.currentTime);
    bus.master.gain.exponentialRampToValueAtTime(track.level, X.currentTime + (fadeIn || (id.startsWith("battle") ? .4 : 1.5)));
    schedule();
    timer = setInterval(schedule, 100);
  }
  // teste: renderiza alguns segundos de uma faixa fora do tempo real (devolve o AudioBuffer, para ouvir ou gravar)
  async function render(id, sec = 20, rate = 44100) {
    const save = {X, DEST, bus, track, step, nextTime};
    const off = new OfflineAudioContext(2, Math.floor(rate * sec), rate);
    X = off; DEST = off.destination; track = ALL[id]; bus = build(track); step = 0; nextTime = .05;
    bus.master.gain.setValueAtTime(track.level, 0);
    schedule(sec - .5);
    ({X, DEST, bus, track, step, nextTime} = save);
    return off.startRendering();
  }
  // teste: pico e volume médio de alguns segundos da faixa
  async function measure(id, sec = 20) {
    const buf = await render(id, sec), a = buf.getChannelData(0);
    let peak = 0, sum = 0; for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > peak) peak = v; sum += a[i] * a[i]; }
    return {peak: +peak.toFixed(3), rms: +Math.sqrt(sum / a.length).toFixed(4)};
  }
  // tempo da música tocando agora, em batidas (para os aldeões dançarem no ritmo); null sem música
  function beat() { if (!track || !X || X.state !== "running") return null; const d = 60 / track.bpm / 4; return (step - (nextTime - X.currentTime) / d) / 4; }
  return {has: id => !!ALL[id], play, stop: (sec = .6) => { if (X) fadeOut(sec); }, measure, render, beat, get current() { return trackId; }};
})();

/* ----- motor antigo: só as faixas de entrevista e trabalho ----- */
const LEGACY = {interview: {step: stepInterview, interval: .16}, work: {step: stepWork, interval: .105}};
let legacyTimer = null, legacyId = null;
function legacyStart(id) {
  if (legacyTimer && legacyId === id) return;
  legacyStop();
  legacyId = id;
  if (!AC || !LEGACY[id]) return;
  const tr = LEGACY[id]; let step = 0, nextT = AC.currentTime + .05;
  legacyTimer = setInterval(() => { while (nextT < AC.currentTime + .25) { tr.step(step, nextT); nextT += tr.interval; step = (step + 1) % 256; } }, 60);
}
function legacyStop() { if (legacyTimer) clearInterval(legacyTimer); legacyTimer = null; }

/* ----- o que o resto do jogo usa ----- */
function musicStart(id) {
  id = id || "battleCapo";
  if ((id === "local" && regionOfCity(curCity()) === "nordeste") || (id === "map" && MAP_REGION === "nordeste")) id = "localNordeste";   // Nordeste: a toada do boi
  if ((id === "local" && regionOfCity(curCity()) === "centroeste") || (id === "map" && MAP_REGION === "centroeste")) id = "localCentroOeste";   // Centro-Oeste: a toada caipira
  if ((id === "local" && regionOfCity(curCity()) === "sudeste") || (id === "map" && MAP_REGION === "sudeste")) id = "localSudeste";   // Sudeste: sertanejo universitário (Minas)
  if (id === "local" && G.night) id = "localNight";   // à noite a música da exploração muda de clima
  if (id === "map" && MAP_REGION === "norte") id = G.night ? "mapParaNight" : "mapPara";   // mapa do Norte: guitarrada de dia e de noite
  if (MUS.has(id)) { legacyStop(); MUS.play(id); }
  else { MUS.stop(.4); legacyStart(id); }
}
function musicStop() { legacyStop(); MUS.stop(.7); }