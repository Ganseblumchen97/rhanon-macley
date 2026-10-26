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
   berimbau, atabaque, caxixi). As melodias são refeitas a cada trecho, então a música não fica igual.
   Faixas: "title" (abertura), "map" (mapa grande: Pará/Brasil), "local" (Ananindeua, toque de capoeira com flauta),
   "localNight" (Ananindeua à noite), "battleCapo" (batalha: a roda de capoeira acelerada), "battleBoss" (chefe: abertura
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
    // Abertura: acid-jazz/funk em Lá menor com balanço, baixo sincopado, acordes em "stab" e frases de improviso
    title: {
      bpm: 118, wet: .18, level: .5, swing: .18, chords: P5_CHORDS,
      bassline: [[0, 0], [3, 12], [6, 0], [7, 10], [10, 7], [12, 0], [14, 12]], lick: null,
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), chord = this.chords[bar % 4];
        if (s === 0 || s === 7 || s === 10) kick(t, .13);
        if (s === 4 || s === 12) snare(t, .055); else if ((s === 9 || s === 15) && Math.random() < .4) snare(t, .015);
        hat(t, s % 4 === 2 ? .02 : .008, s === 14 && bar % 2);
        const b = this.bassline.find(([at]) => at === s);
        if (b) synth("sawtooth", mtof(chord.bass + b[1]), t, d * 1.5, .05, 700);
        if (s === 2 || s === 9) chord.notes.forEach(m => ep(mtof(m), t, s === 2 ? .3 : .15, .014));
        if (s === 0) this.lick = bar % 2 && Math.random() < .8 ? makeLick(8) : null;
        const m = this.lick && this.lick[s];
        if (m) synth("square", mtof(m), t, d * 1.4, .02, 1800);
      }
    },
    // Mapa do Brasil: pop animado de viagem (Fmaj7, G7, Em7, Am7) com piano elétrico no contratempo e refrão gerado
    map: {
      bpm: 112, wet: .2, level: .45, chords: P4_CHORDS, scale: [72, 74, 76, 79, 81, 84, 86], phrase: [],
      play(i, t, d) {
        const s = i % 16, chord = this.chords[Math.floor(i / 16) % 4];
        if (i % 64 === 0) this.phrase = this.makePhrase();
        if (s === 0 || s === 8 || (s === 11 && Math.random() < .5)) kick(t, .13);
        if (s === 4 || s === 12) snare(t, .05);
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .022 : .012);
        if (s % 2 === 0) synth("triangle", mtof(chord.bass + (s % 4 === 2 ? 12 : 0)), t, d * 1.8, .09);
        if ([3, 6, 10, 14].includes(s)) chord.notes.forEach(m => ep(mtof(m), t, .22, .016));
        const m = this.phrase[i % 32];
        if (m) synth("square", mtof(m), t, d * 1.7, .022, 2400);
      },
      makePhrase() {
        const out = new Array(32).fill(null); let idx = 2;
        for (let k = 0; k < 28; k++) {
          if (Math.random() > (k % 2 ? .12 : .5)) continue;
          idx = Math.max(0, Math.min(this.scale.length - 1, idx + pick([-2, -1, -1, 1, 1, 2])));
          out[k] = this.scale[idx];
        }
        return out;
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
        if (i % 128 === 0) this.melody = part === "A" ? null : this.makeMelody(list, part === "A3" ? 12 : 0);
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
        if (i % 128 === 0) this.melody = part === "A" ? null : TRACKS.local.makeMelody(list, -12);
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
    // batalha: a roda de capoeira acelerada (toque de São Bento Grande), com atabaque, pandeiro, baixo marcado
    // e flauta mais agitada. Forma A - B - A' - C (C = ponte só de percussão com virada crescente)
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
        if (i % 128 === 0) { this.melody = part === "C" ? null : battleMelody(list, this.scale, part === "A2" ? 12 : 0); hat(t, .02, true); }
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
        if (m) flute(mtof(m.note), t, m.len * d * .9, part === "A2" ? .032 : .028);
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
        if (j % 128 === 0) { this.melody = part === "C" ? null : TRACKS.local.makeMelody(list, 0); hat(t, .03, true); }
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
        if (i % 128 === 0) this.melody = part === "A" ? null : TRACKS.local.makeMelody(list, part === "A3" ? 12 : 0);
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
        if (i % 128 === 0) this.melody = part === "A" ? null : TRACKS.local.makeMelody(list, -12);
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
  // teste: renderiza alguns segundos de uma faixa fora do tempo real e devolve o pico e o volume médio
  async function measure(id, sec = 20) {
    const save = {X, DEST, bus, track, step, nextTime};
    const off = new OfflineAudioContext(2, Math.floor(44100 * sec), 44100);
    X = off; DEST = off.destination; track = ALL[id]; bus = build(track); step = 0; nextTime = .05;
    bus.master.gain.setValueAtTime(track.level, 0);
    schedule(sec - .5);
    ({X, DEST, bus, track, step, nextTime} = save);
    const buf = await off.startRendering(), a = buf.getChannelData(0);
    let peak = 0, sum = 0; for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > peak) peak = v; sum += a[i] * a[i]; }
    return {peak: +peak.toFixed(3), rms: +Math.sqrt(sum / a.length).toFixed(4)};
  }
  // tempo da música tocando agora, em batidas (para os aldeões dançarem no ritmo); null sem música
  function beat() { if (!track || !X || X.state !== "running") return null; const d = 60 / track.bpm / 4; return (step - (nextTime - X.currentTime) / d) / 4; }
  return {has: id => !!ALL[id], play, stop: (sec = .6) => { if (X) fadeOut(sec); }, measure, beat, get current() { return trackId; }};
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
  if (id === "local" && G.night) id = "localNight";   // à noite a música da exploração muda de clima
  if (id === "map" && MAP_REGION === "para") id = G.night ? "mapParaNight" : "mapPara";   // mapa do Pará: guitarrada de dia e de noite
  if (MUS.has(id)) { legacyStop(); MUS.play(id); }
  else { MUS.stop(.4); legacyStart(id); }
}
function musicStop() { legacyStop(); MUS.stop(.7); }