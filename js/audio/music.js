/* Música: o motor MUS toca todas as faixas (título, mapas, exploração e batalhas). */
const hz = n => 440 * 2 ** ((n - 69) / 12);
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
   "funkSudeste" (o tema do Sudeste em MPB e em funk carioca: exploração em São Paulo e no Rio), "mpbSudesteNight" e
   "funkSudesteNight" (as duas à noite), "battleSaoPaulo" (samba-jazz: a MPB acelerada) e "battleRio" (funk 150), "battleBoss" (chefe: abertura
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

  /* ===== som novo ("HD", MUS.hd): o mesmo arranjo de cada faixa, com instrumentos e mixagem de produção =====
     Quando HD está ligado, os instrumentos de baixo (synth, kick, snare, hat, noiseHit, flute, ep, pad, berimbau,
     atabaque, tapa) desviam para as versões daqui: corda por modelo físico (Karplus-Strong) no berimbau, pele com dois
     modos no atabaque, flauta com sopro e vibrato que entra devagar, piano elétrico FM, lead analógico no lugar da onda
     quadrada, baixo com grave e a bateria com batedor, corpo e esteira. Cada voz tem lugar no estéreo e envios de reverb
     e eco (hdOut); a mixagem (build) ganha equalização, compressor de cola, saturação suave e limitador. As notas e os
     ritmos não mudam: só o timbre e a mistura. */
  // volume que nasce em zero: o som começa numa fração de amostra e, com o volume no máximo antes da nota, uma amostra
  // escapava inteira (o estalo)
  const gz = () => { const g = X.createGain(); g.gain.value = 0; return g; };
  /* calibração: cada instrumento novo soa com o mesmo volume do antigo (medidos sozinhos, na mesma nota e na mesma força),
     para o equilíbrio que os arranjos já têm continuar valendo */
  const CAL = {bass: .56, sq: 1.2, lead: .84, flute: .55, ep: .28, pad: .7, bell: .77, kick: .31, snare: .19, noise: .41, berimbau: 3.9,
    viola: 1.6, aco: .64, nylon: 1.05, tapa: .72, triangulo: 1.5, sanfona: .72, guitar: .77, brass: .34, choir: .76, toll: .4, agogo: .67};
  let HD = false, S16 = false, SUAVE = false;   // S16: a variante "16 bits" (MUS.hd = "16"); SUAVE: a faixa pede som macio (suave: true, como a MPB)
  function hdOut(node, pan = 0, rev = 0, del = 0) {
    let o = node;
    if (pan) { const p = X.createStereoPanner(); p.pan.value = pan; node.connect(p); o = p; }
    o.connect(bus.mix);
    if (rev && bus.rev) { const g = gz(); g.gain.value = rev; o.connect(g).connect(bus.rev); }
    if (del && bus.dly) { const g = gz(); g.gain.value = S16 ? del * 1.6 : del; o.connect(g).connect(bus.dly); }
  }
  function hdEnv(g, when, a, vol, hold, rel) {
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + a);
    if (hold > a) g.gain.setValueAtTime(vol, when + hold);
    g.gain.setTargetAtTime(0, when + Math.max(a, hold), rel / 3);
  }
  let HD_SAT = null;
  const hdSatCurve = () => HD_SAT || (HD_SAT = (() => { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const v = i / 511.5 - 1; c[i] = Math.tanh(v * 1.6) / Math.tanh(1.6); } return c; })());
  // metal do chimbal: seis ondas quadradas desafinadas (como no 808) com um pouco de ruído
  let HD_METAL = null;
  function hdMetal() {
    if (HD_METAL && HD_METAL.sampleRate === X.sampleRate) return HD_METAL;
    const sr = X.sampleRate, b = X.createBuffer(1, Math.floor(sr * .5), sr), d = b.getChannelData(0), fs = [205.3, 304.4, 369.6, 522.7, 540, 800].map(f => f * 2.6);
    for (let i = 0; i < d.length; i++) { let v = 0; for (const f of fs) v += Math.sign(Math.sin(2 * Math.PI * f * i / sr)); d[i] = v / 6 * .7 + (Math.random() * 2 - 1) * .3; }
    return HD_METAL = b;
  }
  // corda por modelo físico (Karplus-Strong): um estalo de ruído que circula num atraso do tamanho da onda e vai
  // perdendo o agudo a cada volta, como a corda de verdade; guardada por nota
  const HD_KS = new Map();
  function hdString(freq, sec = 1, damp = .996, bright = .5) {
    const sr = X.sampleRate, key = sr + ":" + freq.toFixed(2) + ":" + sec + ":" + damp + ":" + bright;
    if (HD_KS.has(key)) return HD_KS.get(key);
    const n = Math.floor(sr * sec), b = X.createBuffer(1, n, sr), d = b.getChannelData(0), N = Math.max(2, Math.round(sr / freq));
    let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev + (r - prev) * bright; d[i] = prev; }   // estalo (mais ou menos brilhante)
    for (let i = N; i < n; i++) d[i] = damp * .5 * (d[i - N] + d[i - N - 1 < 0 ? 0 : i - N - 1]);
    HD_KS.set(key, b); return b;
  }
  /* ----- variante 16 bits (S16): o som dos consoles de 16 bits com mixagem de hoje -----
     FM de dois operadores (como o chip do Mega Drive) no lead e no baixo: a moduladora brilha forte no ataque e vai
     fechando, o que dá o "estalo" do baixo e o metal do lead; a caixa ganha reverb cortado; o eco vem no jeito do Super
     Nintendo (retorno abafado e mais presente, ver buildHD) e os pads ficam mais escuros e lentos. */
  function fmVoz(freq, when, dur, vol, o) {
    const car = X.createOscillator(), mod = X.createOscillator(), idx = gz(), g = gz(), end = when + dur;
    car.frequency.value = freq; car.detune.value = o.det || 0; mod.frequency.value = freq * o.ratio; mod.detune.value = o.det || 0;
    idx.gain.setValueAtTime(freq * o.i0, when); idx.gain.setTargetAtTime(freq * o.i1, when + .004, o.tau);
    mod.connect(idx).connect(car.frequency);
    if (o.vib && dur > .35) {   // vibrato que entra devagar nas notas longas
      const lfo = X.createOscillator(), dep = gz(); lfo.frequency.value = 5.4;
      dep.gain.setValueAtTime(0, when); dep.gain.setValueAtTime(0, when + .15); dep.gain.linearRampToValueAtTime(freq * .005, when + Math.min(.6, dur * .7));
      lfo.connect(dep); dep.connect(car.frequency); dep.connect(mod.frequency); lfo.start(when); lfo.stop(end + .4);
    }
    hdEnv(g, when, o.a || .004, vol, dur * (o.hold || .9), o.rel || .1);
    car.connect(g); car.start(when); mod.start(when); car.stop(end + .5); mod.stop(end + .5);
    return g;
  }
  // decai = nota do synth() do arranjo, que cai logo depois do ataque (sem isso, segura a nota inteira)
  function s16Lead(freq, when, dur, vol, decai) {   // lead FM: duas vozes um pouco desafinadas, uma de cada lado
    const env = decai ? {hold: .02, rel: dur * .35} : {};
    for (const [det, pan] of [[-6, -.45], [6, .45]]) hdOut(fmVoz(freq, when, dur, vol * .95, {ratio: 1, i0: 2.2, i1: 1.1, tau: .12, det, vib: !decai, a: .006, ...env}), pan, .2, .32);
  }
  function s16Bass(freq, when, dur, vol, decai) {   // baixo FM com estalo, e um seno por baixo para o grave
    const g = fmVoz(freq, when, dur, vol * .85, {ratio: 1, i0: 2.2, i1: .4, tau: .045, a: .002, hold: decai ? .02 : .85, rel: decai ? dur * .35 : .06}), sat = X.createWaveShaper();
    sat.curve = hdSatCurve(); g.connect(sat); hdOut(sat);
    const s = X.createOscillator(), gs = gz(); s.frequency.value = freq; hdEnv(gs, when, .003, vol * .35, decai ? dur * .02 : dur * .85, decai ? dur * .35 : .06);
    s.connect(gs); hdOut(gs); s.start(when); s.stop(when + dur + .3);
  }
  /* flauta de verdade dentro do 16 bits (como as amostras do Super Nintendo): mais do que o timbre, o jeito de tocar.
     Cada nota começa com o golpe de língua e sobe de leve até a altura (o sopro); notas seguidas e perto saem ligadas,
     escorregando da anterior sem novo ataque; nas notas longas o vibrato entra aos poucos e o som cresce um pouco; nas
     pausas entre frases, um respiro. Topo levemente abafado e o eco do SNES por cima. */
  let FL_LAST = null;   // a nota anterior da flauta (para ligar e respirar)
  function s16RealFlute(freq, when, dur, vol) {
    const prev = FL_LAST && when >= FL_LAST.when ? FL_LAST : null, gap = prev ? when - prev.end : 9;
    const liga = prev && gap < .045 && Math.abs(Math.log2(freq / prev.freq) * 12) <= 2.2;   // liga os passos pequenos; salto e começo de frase têm golpe de língua
    FL_LAST = {when, end: when + dur, freq};
    const end = when + dur, longa = dur > .4, body = gz(), f = X.createBiquadFilter(), snes = X.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = Math.min(8000, freq * 8); snes.type = "lowpass"; snes.frequency.value = SUAVE ? 4200 : 6500; snes.Q.value = .5;
    const pres = X.createBiquadFilter(); pres.type = "peaking"; pres.frequency.value = 2600; pres.Q.value = .9; pres.gain.value = SUAVE ? 0 : 4;   // presença: a melodia na frente
    // volume: ataque (macio se ligada), cresce um pouco nas longas, solta devagar no fim
    const v = vol * 2.05;
    body.gain.setValueAtTime(liga ? v * .7 : 0, when); body.gain.linearRampToValueAtTime(v * (longa ? .85 : 1), when + (liga ? .02 : .045));
    if (longa) body.gain.linearRampToValueAtTime(v * 1.05, when + dur * .85);
    body.gain.setTargetAtTime(0, when + dur * .92, .06);
    f.connect(pres).connect(snes).connect(body); hdOut(body, -.12, .2, .2);
    // altura: escorrega da nota anterior (ligada) ou sobe de um pouco abaixo (golpe de língua); vibrato nas longas
    const pitch = X.createConstantSource(); pitch.offset.value = 0;
    if (liga) { pitch.offset.setValueAtTime((prev.freq - freq), when); pitch.offset.setTargetAtTime(0, when, .012); }
    else { pitch.offset.setValueAtTime(-freq * .022, when); pitch.offset.setTargetAtTime(0, when + .005, .02); }
    pitch.start(when); pitch.stop(end + .3);
    let lfo = null;
    if (longa) {
      lfo = X.createOscillator(); const dep = gz(); lfo.frequency.value = 5 + Math.random() * .4;
      dep.gain.setValueAtTime(0, when); dep.gain.setValueAtTime(0, when + .2); dep.gain.linearRampToValueAtTime(freq * .006, when + Math.min(.75, dur * .8));
      lfo.connect(dep); lfo.start(when); lfo.stop(end + .3); lfo.dep = dep;
    }
    for (const [type, mul, k] of [["sine", 1, .78], ["triangle", 1, .22], ["sine", 2, .12], ["sine", 3, .04]]) {
      const o = X.createOscillator(), og = gz(); o.type = type; o.frequency.value = freq * mul; og.gain.value = k;
      const pm = gz(); pm.gain.value = mul; pitch.connect(pm).connect(o.frequency); if (lfo) lfo.dep.connect(pm);
      o.connect(og).connect(f); o.start(when); o.stop(end + .3);
    }
    // sopro contínuo na altura da nota
    const n = noiseSrc(), bp = X.createBiquadFilter(), gn = gz(); bp.type = "bandpass"; bp.frequency.value = Math.min(9000, freq * 2); bp.Q.value = 2;
    gn.gain.setValueAtTime(0, when); gn.gain.linearRampToValueAtTime(vol * .26, when + .04); gn.gain.setTargetAtTime(0, when + dur * .9, .05);
    n.connect(bp).connect(gn); hdOut(gn, -.12, .18); n.start(when); n.stop(end + .2);
    if (!liga) {   // golpe de língua: um "t" curto de ar
      const t = noiseSrc(), tb = X.createBiquadFilter(), tg = gz(); tb.type = "bandpass"; tb.frequency.value = Math.min(8000, freq * 3.5); tb.Q.value = 1.5;
      tg.gain.setValueAtTime(vol * .55, when); tg.gain.setTargetAtTime(0, when + .003, .012); t.connect(tb).connect(tg); hdOut(tg, -.15, .15); t.start(when); t.stop(when + .08);
    }
    if (gap > .3 && gap < 9) {   // respiro antes de começar a frase
      const r = noiseSrc(), rf = X.createBiquadFilter(), rg = gz(), t0 = Math.max(when - .22, prev ? prev.end + .02 : when - .22);
      rf.type = "bandpass"; rf.frequency.value = 1400; rf.Q.value = .8;
      rg.gain.setValueAtTime(0, t0); rg.gain.linearRampToValueAtTime(vol * .14, t0 + .12); rg.gain.linearRampToValueAtTime(0, when - .02);
      r.connect(rf).connect(rg); hdOut(rg, -.15, .2); r.start(t0); r.stop(when);
    }
  }
  function s16Snare(when, vol) {   // caixa com reverb cortado (o "gated reverb" da época)
    hdSnare(when, vol * .9);
    const n = noiseSrc(), bp = X.createBiquadFilter(), g = gz(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = .6;
    g.gain.setValueAtTime(vol * .5, when); g.gain.setValueAtTime(vol * .4, when + .11); g.gain.linearRampToValueAtTime(0, when + .14);
    n.connect(bp).connect(g); hdOut(g, 0, .3); n.start(when); n.stop(when + .2);
  }

  // lead analógico (no lugar da onda quadrada): duas serrilhadas abertas no estéreo, filtro que fecha um pouco depois do
  // ataque, vibrato que entra devagar nas notas longas, com eco e sala
  function hdLead(freq, when, dur, vol, cutoff = 2600, decai) {
    if (S16) return s16Lead(freq, when, dur, vol, decai);
    const f = X.createBiquadFilter(), g = gz(), end = when + dur, cut = Math.min(cutoff * 1.9, freq * 10);
    f.type = "lowpass"; f.Q.value = .9; f.frequency.setValueAtTime(cut * 1.6, when); f.frequency.setTargetAtTime(cut, when + .02, .08);
    hdEnv(g, when, .012, vol * 1.45, dur * .92, .14);
    f.connect(g); hdOut(g, .08, .26, .14);
    const lfo = X.createOscillator(), dep = gz(); lfo.frequency.value = 5.2;
    dep.gain.setValueAtTime(0, when); if (dur > .35) dep.gain.linearRampToValueAtTime(freq * .004, when + Math.min(.6, dur * .7));
    lfo.connect(dep); lfo.start(when); lfo.stop(end + .3);
    for (const [det, pan, k] of [[-9, -.65, .62], [9, .65, .62], [0, 0, .3]]) {
      const o = X.createOscillator(), og = gz(), p = X.createStereoPanner();
      o.type = k < .5 ? "square" : "sawtooth"; o.frequency.value = freq; o.detune.value = det; og.gain.value = k; p.pan.value = pan;
      dep.connect(o.frequency); o.connect(og).connect(p).connect(f); o.start(when); o.stop(end + .3);
    }
  }
  // baixo: seno no grave (o que se sente) e serrilhada filtrada com saturação (o que se ouve em caixinha pequena)
  function hdBass(freq, when, dur, vol, bright = 600, decai) {
    if (S16) return s16Bass(freq, when, dur, vol, decai);
    const g = gz(), s = X.createOscillator(), z = X.createOscillator(), f = X.createBiquadFilter(), gsz = gz(), sat = X.createWaveShaper();
    s.type = "sine"; s.frequency.value = freq; z.type = "sawtooth"; z.frequency.value = freq; sat.curve = hdSatCurve();
    f.type = "lowpass"; f.Q.value = 1.5; f.frequency.setValueAtTime(bright * 2.4, when); f.frequency.setTargetAtTime(bright, when + .005, .05);
    gsz.gain.value = .9; hdEnv(g, when, .004, vol * .5, dur * .9, .07);
    s.connect(g); z.connect(f).connect(gsz).connect(g); g.connect(sat); hdOut(sat);
    s.start(when); z.start(when); s.stop(when + dur + .3); z.stop(when + dur + .3);
  }
  function hdSynth(type, freq, when, dur, vol, cutoff) {
    if ((type === "triangle" || type === "sawtooth") && freq < 260 && dur > .09) return hdBass(freq, when, dur, vol * CAL.bass, type === "sawtooth" ? Math.min(cutoff || 900, 900) : 520, true), true;
    if (type === "square" || (type === "sawtooth" && freq >= 260)) return hdLead(freq, when, dur, (type === "sawtooth" ? vol * .8 : vol) * CAL.sq, cutoff || 2600, true), true;
    return false;
  }
  function hdKick(when, vol) {
    const o = X.createOscillator(), g = gz(), sat = X.createWaveShaper(); sat.curve = hdSatCurve();
    o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(54, when + .05); o.frequency.exponentialRampToValueAtTime(44, when + .3);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * .8, when + .002); g.gain.setValueAtTime(vol * .8, when + .03); g.gain.setTargetAtTime(0, when + .03, .085);
    o.connect(g).connect(sat); hdOut(sat); o.start(when); o.stop(when + .55);
    const n = noiseSrc(), hp = X.createBiquadFilter(), gn = gz(); hp.type = "highpass"; hp.frequency.value = 3000;   // batedor
    gn.gain.setValueAtTime(vol * .45, when); gn.gain.exponentialRampToValueAtTime(.0001, when + .012); n.connect(hp).connect(gn); hdOut(gn); n.start(when); n.stop(when + .02);
  }
  function hdSnare(when, vol) {
    for (const [fq, k] of [[185, .55], [330, .3]]) {   // corpo (dois modos da pele)
      const o = X.createOscillator(), g = gz(); o.type = "triangle";
      o.frequency.setValueAtTime(fq * 1.08, when); o.frequency.exponentialRampToValueAtTime(fq, when + .03);
      g.gain.setValueAtTime(vol * k, when); g.gain.setTargetAtTime(0, when + .005, .03); o.connect(g); hdOut(g, 0, .14); o.start(when); o.stop(when + .2);
    }
    const n = noiseSrc(), hp = X.createBiquadFilter(), pk = X.createBiquadFilter(), g = gz();   // esteira
    hp.type = "highpass"; hp.frequency.value = 1100; pk.type = "peaking"; pk.frequency.value = 5200; pk.gain.value = 1;
    g.gain.setValueAtTime(vol * 1.25, when); g.gain.setTargetAtTime(0, when + .004, .055);
    n.connect(hp).connect(pk).connect(g); hdOut(g, 0, .18); n.start(when); n.stop(when + .35);
  }
  function hdHat(when, vol, open) {
    const s = X.createBufferSource(), hp = X.createBiquadFilter(), g = gz();
    s.buffer = hdMetal(); hp.type = "highpass"; hp.frequency.value = 7400;
    g.gain.setValueAtTime(vol * 2.6, when); g.gain.setTargetAtTime(0, when + .002, open ? .045 : .014);
    s.connect(hp).connect(g); hdOut(g, .45, open ? .1 : 0); s.start(when, Math.random() * .3); s.stop(when + (open ? .4 : .1));
  }
  // percussão de ruído (pandeiro, caxixi, chiado, chocalhos): cada faixa de agudo num lugar do estéreo
  function hdNoise(when, dur, vol, type, freq, q) {
    const n = noiseSrc(), f = X.createBiquadFilter(), g = gz();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; g.gain.setValueAtTime(vol * 2.4, when); g.gain.setTargetAtTime(0, when + .002, dur / 3.2);
    n.connect(f).connect(g); hdOut(g, freq >= 6000 ? .55 : freq >= 4000 ? -.5 : freq >= 2000 ? .3 : -.2, .08);
    n.start(when); n.stop(when + dur * 1.6 + .03);
  }
  // flauta: corpo em seno com um pouco de triângulo, sopro contínuo na altura da nota, chiado no ataque e vibrato
  // que entra devagar
  function hdFlute(freq, when, dur, vol) {
    const g = gz(), f = X.createBiquadFilter(), end = when + dur;
    f.type = "lowpass"; f.frequency.value = Math.min(9000, freq * 8);
    hdEnv(g, when, .06, vol * 1.55, dur * .9, .16);
    f.connect(g); hdOut(g, -.15, .34, .14);
    const lfo = X.createOscillator(), dep = gz(); lfo.frequency.value = 5;
    dep.gain.setValueAtTime(0, when); if (dur > .3) { dep.gain.setValueAtTime(0, when + .18); dep.gain.linearRampToValueAtTime(freq * .006, when + Math.min(.7, dur * .8)); }
    lfo.connect(dep); lfo.start(when); lfo.stop(end + .4);
    for (const [type, mul, k] of [["sine", 1, .8], ["triangle", 1, .32], ["sine", 2, .08]]) {
      const o = X.createOscillator(), og = gz(); o.type = type; o.frequency.value = freq * mul; og.gain.value = k;
      dep.connect(o.frequency); o.connect(og).connect(f); o.start(when); o.stop(end + .4);
    }
    const n = noiseSrc(), bp = X.createBiquadFilter(), gn = gz();   // sopro
    bp.type = "bandpass"; bp.frequency.value = Math.min(9000, freq * 2); bp.Q.value = 2.2;
    hdEnv(gn, when, .03, vol * .22, dur * .85, .1); n.connect(bp).connect(gn); hdOut(gn, -.15, .3); n.start(when); n.stop(end + .3);
    const c = noiseSrc(), cb = X.createBiquadFilter(), cg = gz();   // chiado do ataque
    cb.type = "bandpass"; cb.frequency.value = Math.min(10000, freq * 4); cb.Q.value = 3;
    cg.gain.setValueAtTime(vol * .5, when); cg.gain.setTargetAtTime(0, when + .005, .02); c.connect(cb).connect(cg); hdOut(cg, -.1, .2); c.start(when); c.stop(when + .1);
  }
  // piano elétrico (FM, como um Rhodes): a modulação forte no ataque dá o "tine" e vai amaciando; solta mais comprido
  function hdEp(freq, when, dur, vol) {
    const car = X.createOscillator(), mod = X.createOscillator(), idx = gz(), g = gz(), len = Math.max(dur, .25) + .5;
    car.frequency.value = freq; mod.frequency.value = freq; idx.gain.setValueAtTime(freq * (SUAVE ? .65 : 1.6), when); idx.gain.setTargetAtTime(freq * (SUAVE ? .08 : .15), when + .005, .12);
    mod.connect(idx).connect(car.frequency); car.connect(g);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * 2.1, when + .003); g.gain.setTargetAtTime(vol * .9, when + .01, .15); g.gain.setTargetAtTime(0, when + Math.max(dur, .2), .18);
    hdOut(g, Math.max(-.6, Math.min(.6, Math.log2(freq / 440) * .5)), .22);
    car.start(when); mod.start(when); car.stop(when + len + .5); mod.stop(when + len + .5);
  }
  // pad: serrilhadas macias abertas no estéreo, com o filtro respirando devagar
  function hdPad(notes, when, dur, vol) {
    const f = X.createBiquadFilter(), g = gz(), lfo = X.createOscillator(), dep = gz(), pE = X.createStereoPanner(), pD = X.createStereoPanner();
    f.type = "lowpass"; f.frequency.value = S16 ? 620 : 850; f.Q.value = .4; lfo.frequency.value = .18; dep.gain.value = S16 ? 180 : 260; lfo.connect(dep).connect(f.frequency);
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol * (S16 ? 1.8 : 1.5), when + (S16 ? 1.8 : 1.2));
    g.gain.setValueAtTime(vol * 1.5, when + dur - .4); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .9);
    pE.pan.value = -.85; pD.pan.value = .85; pE.connect(f); pD.connect(f); f.connect(g); hdOut(g, 0, .45);
    for (const m of notes.slice(0, 3)) for (const det of [-9, 9]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; o.connect(det < 0 ? pE : pD); o.start(when); o.stop(when + dur + 1); }
    lfo.start(when); lfo.stop(when + dur + 1);
  }
  // berimbau: a corda de aço por modelo físico, com a cabaça abrindo e fechando (o "uóng") e um pouco do som direto
  function hdBerimbau(m, when, vol) {
    const fr = mtof(m), s = X.createBufferSource(), f = X.createBiquadFilter(), g = gz(), dry = gz();
    s.buffer = hdString(fr, .9, .9965, .4); s.playbackRate.setValueAtTime(1.025, when); s.playbackRate.exponentialRampToValueAtTime(1, when + .05);
    f.type = "bandpass"; f.Q.value = 5; f.frequency.setValueAtTime(fr * 2, when); f.frequency.exponentialRampToValueAtTime(fr * 7, when + .12); f.frequency.exponentialRampToValueAtTime(fr * 2.5, when + .45);
    const hp = X.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = fr * .9;   // a cabaça não deixa o grave da corda inteiro
    g.gain.setValueAtTime(vol * 1.9, when); g.gain.setTargetAtTime(0, when + .25, .14); dry.gain.value = .05;
    s.connect(f).connect(g); s.connect(hp).connect(dry).connect(g); hdOut(g, -.42, .16); s.start(when); s.stop(when + .9);
  }
  // atabaque: pele com dois modos (o segundo some antes) e o tapa da mão
  function hdAtabaque(when, vol, high) {
    const f0 = high ? 230 : 150, pan = high ? .38 : -.22;
    for (const [mul, k, tau] of [[1, 1, .09], [1.59, .35, .04]]) {
      const o = X.createOscillator(), g = gz(); o.frequency.setValueAtTime(f0 * mul * 1.12, when); o.frequency.exponentialRampToValueAtTime(f0 * mul * .62, when + .2);
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * k * (mul > 1 ? 1.6 : .8), when + .002); g.gain.setTargetAtTime(0, when + .004, tau);
      o.connect(g); hdOut(g, pan, .1); o.start(when); o.stop(when + .45);
    }
    const n = noiseSrc(), bp = X.createBiquadFilter(), gn = gz(); bp.type = "bandpass"; bp.frequency.value = high ? 1400 : 900; bp.Q.value = 1.2;
    gn.gain.setValueAtTime(vol * .6, when); gn.gain.setTargetAtTime(0, when + .002, .012); n.connect(bp).connect(gn); hdOut(gn, pan, .08); n.start(when); n.stop(when + .06);
  }
  function hdTapa(when, vol) {
    const n = noiseSrc(), bp = X.createBiquadFilter(), g = gz(); bp.type = "bandpass"; bp.frequency.value = 1150; bp.Q.value = 1.1;
    g.gain.setValueAtTime(vol * 1.2, when); g.gain.setTargetAtTime(0, when + .002, .018); n.connect(bp).connect(g); hdOut(g, .48, .16); n.start(when); n.stop(when + .1);
    const o = X.createOscillator(), go = gz(); o.frequency.setValueAtTime(380, when); o.frequency.exponentialRampToValueAtTime(300, when + .03);
    go.gain.setValueAtTime(vol * .7, when); go.gain.setTargetAtTime(0, when + .002, .02); o.connect(go); hdOut(go, .48, .1); o.start(when); o.stop(when + .12);
  }
  // sala do som novo: reflexões curtas no começo e uma cauda que vai ficando mais escura
  function makeRoom(sec = 2.4) {
    const sr = X.sampleRate, len = Math.floor(sr * sec), buf = X.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c); let lp = 0;
      for (const [ms, k] of [[11, .5], [19, .38], [27, .3], [41, .24], [53, .2]]) d[Math.floor(sr * (ms + c * 3) / 1000)] += k * (c ? -1 : 1);
      for (let i = Math.floor(sr * .02); i < len; i++) { const u = i / len, a = .55 - .45 * u; lp += ((Math.random() * 2 - 1) - lp) * a; d[i] += lp * Math.pow(1 - u, 2.6) * .7; }
    }
    const conv = X.createConvolver(); conv.buffer = buf; return conv;
  }  /* ----- o resto dos instrumentos no som novo ----- */
  // sanfona: três palhetas por nota (uma afinada e duas um pouco para cima e para baixo: o tremido da "musette"),
  // timbre anasalado de palheta, o fole entrando macio e as notas longas inchando um pouco
  function hdSanfona(freq, when, dur, vol) {
    const f = X.createBiquadFilter(), nas = X.createBiquadFilter(), g = gz(), end = when + dur, pE = X.createStereoPanner(), pD = X.createStereoPanner();
    f.type = "lowpass"; f.frequency.value = Math.min(5200, freq * 7); f.Q.value = .6;
    nas.type = "peaking"; nas.frequency.value = 1250; nas.Q.value = 1.1; nas.gain.value = 4;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * .95, when + .035);
    if (dur > .4) g.gain.linearRampToValueAtTime(vol * 1.1, when + dur * .8); else g.gain.setValueAtTime(vol * .95, when + Math.max(.04, dur - .05));
    g.gain.setTargetAtTime(0, when + Math.max(.04, dur - .03), .035);
    pE.pan.value = -.3; pD.pan.value = .3; pE.connect(f); pD.connect(f); f.connect(nas).connect(g); hdOut(g, .05, .18, .08);
    for (const [det, dest, k] of [[0, null, .5], [-11, pE, .42], [11, pD, .42]]) {
      const o = X.createOscillator(), sq = X.createOscillator(), og = gz(), sg = gz();
      o.type = "sawtooth"; o.frequency.value = freq; o.detune.value = det; og.gain.value = k;
      sq.type = "square"; sq.frequency.value = freq; sq.detune.value = det; sg.gain.value = k * .35;
      const to = dest || f; o.connect(og).connect(to); sq.connect(sg).connect(to);
      o.start(when); sq.start(when); o.stop(end + .2); sq.stop(end + .2);
    }
  }
  // corda beliscada por modelo físico: a nota sai de hdString e o tempo de soar vem do quanto a corda segura (damp)
  function hdPluck(freq, when, dur, vol, o) {
    const s = X.createBufferSource(), g = gz(), len = Math.min(o.max || 1.4, dur + .4);
    s.buffer = hdString(freq, o.sec || 1.6, o.damp, o.bright);
    if (o.vib) {   // vibrato na corda (a guitarrada): mexe a velocidade da leitura
      const lfo = X.createOscillator(), dep = gz(); lfo.frequency.value = 5.5;
      dep.gain.setValueAtTime(0, when); dep.gain.linearRampToValueAtTime(.007, when + .3); lfo.connect(dep).connect(s.playbackRate); lfo.start(when); lfo.stop(when + len + .1);
    }
    g.gain.setValueAtTime(vol, when); g.gain.setValueAtTime(vol, when + len - .12); g.gain.linearRampToValueAtTime(0, when + len);
    let out = s;
    if (o.lp) {   // filtro de topo; com lpTo ele fecha logo depois do toque (a polpa do dedo no náilon)
      const f = X.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(o.lp, when);
      if (o.lpTo) f.frequency.setTargetAtTime(o.lpTo, when + .01, .1);
      s.connect(f); out = f;
    }
    if (o.body) { const b = X.createBiquadFilter(); b.type = "peaking"; b.frequency.value = o.body; b.Q.value = 1; b.gain.value = 4; out.connect(b); out = b; }
    if (o.drive) { const w = X.createWaveShaper(), c = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 255.5 - 1; c[i] = Math.tanh(x * o.drive) / Math.tanh(o.drive); } w.curve = c; out.connect(w); out = w; }
    out.connect(g); hdOut(g, o.pan || 0, o.rev ?? .16, o.del || 0);
    s.start(when); s.stop(when + len + .05);
    if (o.pick) { const n = noiseSrc(), hp = X.createBiquadFilter(), gn = gz(); hp.type = "highpass"; hp.frequency.value = 4500;   // a palheta/unha na corda
      gn.gain.setValueAtTime(vol * o.pick, when); gn.gain.setTargetAtTime(0, when + .001, .004); n.connect(hp).connect(gn); hdOut(gn, o.pan || 0); n.start(when); n.stop(when + .03); }
  }
  // viola caipira: cada par de cordas de aço com a nota e a oitava, um pouco desafinadas (o brilho que "chora")
  function hdViola(freq, when, dur, vol) {
    if (freq < 165) return hdPluck(freq, when, dur, vol * 2, {damp: .997, bright: .3, max: 1.3, lp: 1500, body: 180, pick: .05, pan: .15, rev: .12});   // o polegar no baixo: uma corda só, encorpada
    hdPluck(freq, when, dur, vol * 1.5, {damp: .9965, bright: .38, max: 1.3, lp: 2900, body: 1900, pick: .12, pan: .28, rev: .18});
    hdPluck(freq * 2 * 1.003, when + .004, dur, vol * .6, {damp: .995, bright: .38, max: 1, lp: 3400, pan: .38, rev: .18});
  }
  // violão: de aço (brilhante, com palheta) ou de náilon (macio, abafado)
  function hdViolao(freq, when, dur, vol, aco) {
    if (aco) hdPluck(freq, when, dur, vol * 1.6, {damp: .9955, bright: .2, max: 1.1, lp: 1800, body: 1200, pan: -.22, rev: .15});
    else hdPluck(freq, when, dur, vol * 1.7, {damp: .9945, bright: .14, max: 1.5, lp: Math.min(1600, freq * 6), lpTo: Math.max(260, freq * 2.6), body: 700, pan: -.22, rev: .18});
  }
  // guitarra da guitarrada: corda que segura mais, um pouco de saturação, vibrato depois do ataque e eco
  function hdGuitar(freq, when, dur, vol, bright = 2600) {
    hdPluck(freq, when, dur, vol * 1.7, {damp: .9982, bright: .8, max: 1.8, sec: 2, lp: Math.max(2400, bright * 1.2), drive: 1.8, vib: dur > .3, pan: .2, rev: .2, del: .22, pick: .25});
  }
  // metais em FM (como os naipes do Mega Drive): o brilho cresce no ataque, como quem sopra forte, e assenta
  function hdBrass(notes, when, dur, vol) {
    for (const m of notes) for (const [det, pan] of [[-7, -.4], [7, .4]]) {
      const fq = mtof(m), car = X.createOscillator(), mod = X.createOscillator(), idx = gz(), g = gz();
      car.frequency.value = fq; car.detune.value = det; mod.frequency.value = fq; mod.detune.value = det;
      idx.gain.setValueAtTime(fq * .5, when); idx.gain.linearRampToValueAtTime(fq * 4.2, when + .06); idx.gain.setTargetAtTime(fq * 2.6, when + .06, .15);
      mod.connect(idx).connect(car.frequency); car.connect(g);
      hdEnv(g, when, .03, vol * 1.2 / Math.sqrt(notes.length), dur * .85, .12); hdOut(g, pan, .22, .08);
      car.start(when); mod.start(when); car.stop(when + dur + .5); mod.stop(when + dur + .5);
    }
  }
  // guitarra distorcida do chefe: duas gravações (uma de cada lado), saturação pesada e a caixa do amplificador
  function hdDist(freq, when, dur, vol, cutoff = 1600) {
    for (const [det, pan] of [[-8, -.55], [8, .55]]) {
      const ws = X.createWaveShaper(), cab = X.createBiquadFilter(), mid = X.createBiquadFilter(), g = gz();
      ws.curve = distCurve(); cab.type = "lowpass"; cab.frequency.value = Math.max(2200, cutoff * 1.5); mid.type = "peaking"; mid.frequency.value = 900; mid.gain.value = 4;
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * .8, when + .005); g.gain.setValueAtTime(vol * .8, when + dur * .75); g.gain.setTargetAtTime(0, when + dur * .75, .04);
      for (const [type, mul] of [["sawtooth", 1], ["sawtooth", .5]]) { const o = X.createOscillator(); o.type = type; o.frequency.value = freq * mul; o.detune.value = det; o.connect(ws); o.start(when); o.stop(when + dur + .3); }
      ws.connect(cab).connect(mid).connect(g); hdOut(g, pan, .12);
    }
  }
  // coro: serrilhadas por duas formantes de vogal ("aah"), entrando devagar, com um leve vibrato
  function hdChoir(notes, when, dur, vol) {
    const f1 = X.createBiquadFilter(), f2 = X.createBiquadFilter(), g = gz(), lfo = X.createOscillator(), dep = gz(), pE = X.createStereoPanner(), pD = X.createStereoPanner();
    f1.type = "bandpass"; f1.frequency.value = 720; f1.Q.value = 2.4; f2.type = "bandpass"; f2.frequency.value = 1150; f2.Q.value = 3;
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol * 2.4, when + .6); g.gain.setValueAtTime(vol * 2.4, when + dur - .3); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .8);
    pE.pan.value = -.6; pD.pan.value = .6; [pE, pD].forEach(p => { p.connect(f1); p.connect(f2); }); f1.connect(g); f2.connect(g); hdOut(g, 0, .5);
    lfo.frequency.value = 4.6; dep.gain.value = 5; lfo.connect(dep); lfo.start(when); lfo.stop(when + dur + 1);
    for (const m of notes) for (const det of [-10, 0, 10]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; dep.connect(o.detune); o.connect(det < 0 ? pE : det > 0 ? pD : (m % 2 ? pE : pD)); o.start(when); o.stop(when + dur + 1); }
  }
  // sino em FM: moduladora em razão não inteira (o metal) com o brilho caindo devagar
  function hdBellFM(freq, when, vol, dur, ratio = 3.5, pan = .3) {
    const car = X.createOscillator(), mod = X.createOscillator(), idx = gz(), g = gz();
    car.frequency.value = freq; mod.frequency.value = freq * ratio; idx.gain.setValueAtTime(freq * (SUAVE ? .8 : 2), when); idx.gain.setTargetAtTime(freq * .2, when + .005, dur * .25);
    mod.connect(idx).connect(car.frequency); car.connect(g);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * 1.3, when + .003); g.gain.setTargetAtTime(0, when + .01, dur * .35);
    hdOut(g, pan, .32, .15); car.start(when); mod.start(when); car.stop(when + dur + .5); mod.stop(when + dur + .5);
  }
  // surdo: pele grande (dois modos) e a batida abafada
  function hdSurdo(when, vol) {
    for (const [mul, k, tau] of [[1, 1, .16], [1.52, .3, .06]]) {
      const o = X.createOscillator(), g = gz(); o.frequency.setValueAtTime(100 * mul, when); o.frequency.exponentialRampToValueAtTime(50 * mul, when + .3);
      g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol * k * .95, when + .003); g.gain.setTargetAtTime(0, when + .005, tau);
      o.connect(g); hdOut(g, -.1, .12); o.start(when); o.stop(when + .7);
    }
    const n = noiseSrc(), lp = X.createBiquadFilter(), gn = gz(); lp.type = "lowpass"; lp.frequency.value = 600;
    gn.gain.setValueAtTime(vol * .3, when); gn.gain.setTargetAtTime(0, when + .002, .015); n.connect(lp).connect(gn); hdOut(gn, -.1); n.start(when); n.stop(when + .06);
  }
  // 808 do funk: o grave que cai, com saturação e no centro
  function hdBumbo808(freq, when, dur, vol) {
    const o = X.createOscillator(), g = gz(), sat = X.createWaveShaper(); sat.curve = hdSatCurve();
    o.frequency.setValueAtTime(freq * 3, when); o.frequency.exponentialRampToValueAtTime(freq, when + .05);
    g.gain.setValueAtTime(vol * .9, when); g.gain.setValueAtTime(vol * .75, when + dur * .5); g.gain.setTargetAtTime(0, when + dur * .5, dur * .18);
    o.connect(sat).connect(g); hdOut(g); o.start(when); o.stop(when + dur + .3);
  }


  /* ----- instrumentos ----- */
  function synth(type, freq, when, dur, vol, cutoff) {
    if (HD && hdSynth(type, freq, when, dur, vol, cutoff)) return;
    const o = X.createOscillator(), g = X.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    if (cutoff) { const f = X.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; o.connect(f).connect(g); } else o.connect(g);
    if (HD) hdOut(g, type === "sine" ? .15 : 0, type === "sine" ? .25 : .1); else g.connect(bus.mix);
    o.start(when); o.stop(when + dur + .02);
  }
  function bell(freq, when, vol, dur = 1.6) { if (HD) return hdBellFM(freq, when, vol * CAL.bell, dur, 3.5, .3); synth("sine", freq, when, dur, vol); synth("sine", freq * 2.003, when, dur * .5, vol * .25); }
  function ep(freq, when, dur, vol) { if (HD) return hdEp(freq, when, dur, vol * CAL.ep); synth("sine", freq, when, dur, vol); synth("triangle", freq * 2, when, dur * .25, vol * .3); }
  function pad(notes, when, dur, vol = .012) {
    if (HD) return hdPad(notes, when, dur, vol * CAL.pad);
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
    if (HD) return hdNoise(when, dur, vol * CAL.noise, type, freq, q);
    const n = noiseSrc(), f = X.createBiquadFilter(), g = X.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    n.connect(f).connect(g).connect(bus.mix); n.start(when); n.stop(when + dur + .02);
  }
  function kick(when, vol) {
    if (HD) return hdKick(when, vol * CAL.kick);
    const o = X.createOscillator(), g = X.createGain();
    o.frequency.setValueAtTime(120, when); o.frequency.exponentialRampToValueAtTime(42, when + .12);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .22);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .25);
  }
  const snare = (when, vol) => { if (HD) return S16 ? s16Snare(when, vol * CAL.snare) : hdSnare(when, vol * CAL.snare); noiseHit(when, .13, vol, "bandpass", 1800); synth("triangle", 190, when, .08, vol * .5); };
  const hat = (when, vol, open) => HD ? hdHat(when, vol, open) : noiseHit(when, open ? .12 : .03, vol, "highpass", 7000);
  // sanfona: duas palhetas um pouco desafinadas entre si (o "musette" que faz o som tremer), timbre de palheta filtrado
  // e o fole entrando macio
  function sanfona(freq, when, dur, vol) {
    if (HD) return hdSanfona(freq, when, dur, vol * CAL.sanfona);
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
    if (HD) return hdViola(freq, when, dur, vol * CAL.viola);
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
    if (HD) vol *= CAL.triangulo;
    for (const [fq, k] of [[2600, 1], [4180, .5], [5930, .3]]) synth("sine", fq, when, open ? .4 : .05, vol * k);
  }
  // violão: corda beliscada que fecha rápido; aco = de aço (o do sertanejo, brilhante, com a palheta), senão de náilon
  // (o da MPB e da bossa, macio). strum = o acorde batido, corda por corda (para cima, up, começa pelas agudas)
  function violao(freq, when, dur, vol, aco) {
    if (HD) return hdViolao(freq, when, dur, vol * (aco ? CAL.aco : CAL.nylon), aco);
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
    if (HD) return hdBumbo808(freq, when, dur, vol);
    const o = X.createOscillator(), g = X.createGain(), sat = X.createWaveShaper(), cv = new Float32Array(256);
    for (let k = 0; k < 256; k++) { const v = k / 128 - 1; cv[k] = Math.tanh(v * 2.2); }
    sat.curve = cv; o.type = "sine"; o.frequency.setValueAtTime(freq * 3, when); o.frequency.exponentialRampToValueAtTime(freq, when + .05);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.setValueAtTime(vol * .8, when + dur * .5); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(sat).connect(g).connect(bus.mix); o.start(when); o.stop(when + dur + .02);
  }
  function palma(when, vol) { for (let k = 0; k < 3; k++) noiseHit(when + k * .009, k < 2 ? .01 : .09, vol, "bandpass", 1400, 1.2); }
  function flute(freq, when, dur, vol) {
    if (HD) return S16 ? s16RealFlute(freq, when, dur, vol * CAL.flute) : hdFlute(freq, when, dur, vol * CAL.flute);
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
    if (HD) return hdLead(freq, when, dur, vol * CAL.lead, 2200);
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
    n.connect(f).connect(g); if (HD) hdOut(g, 0, .3); else g.connect(bus.mix); n.start(when); n.stop(when + dur + .02);
  }
  function clap(when) { noiseHit(when, .05, .025, "bandpass", 1200); noiseHit(when + .012, .09, .03, "bandpass", 1200); }
  function drop(when) {
    const o = X.createOscillator(), g = X.createGain(), f0 = 600 + Math.random() * 500;
    o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f0 * 2.5, when + .05);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(.015, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + .08);
    o.connect(g); if (HD) hdOut(g, .35, .2, .2); else g.connect(bus.mix); o.start(when); o.stop(when + .1);
  }
  // instrumentos da mata
  // berimbau: corda com "uóng" da cabaça abrindo e fechando (filtro passa-banda que sobe e desce)
  function berimbau(m, when, vol) {
    if (HD) return hdBerimbau(m, when, vol * CAL.berimbau);
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
    if (HD) return hdAtabaque(when, vol, high);
    const o = X.createOscillator(), g = X.createGain(), f0 = high ? 230 : 150;
    o.type = "sine"; o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f0 * .55, when + .18);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .28);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .3);
  }
  const tapa = (when, vol) => { if (HD) return hdTapa(when, vol * CAL.tapa); noiseHit(when, .05, vol, "bandpass", 900, 1.4); synth("triangle", 320, when, .05, vol * .6); };
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
  function agogo(when, high, vol = .014) { if (HD) return hdBellFM(high ? 1320 : 990, when, vol * CAL.agogo, .3, 2.76, .45); const f = high ? 1320 : 990; synth("sine", f, when, .18, vol); synth("sine", f * 2.76, when, .06, vol * .4); }
  // surdo/atabaque grave e comprido, para a música do chefe
  function surdo(when, vol) {
    if (HD) return hdSurdo(when, vol);
    const o = X.createOscillator(), g = X.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(95, when); o.frequency.exponentialRampToValueAtTime(48, when + .35);
    g.gain.value = 0; g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .5);
    o.connect(g).connect(bus.mix); o.start(when); o.stop(when + .55);
  }

  // guitarra da guitarrada paraense: corda beliscada brilhante, com vibrato depois do ataque
  function guitar(freq, when, dur, vol, bright = 2600) {
    if (HD) return hdGuitar(freq, when, dur, vol * CAL.guitar, bright);
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
    if (HD) return hdDist(freq, when, dur, vol, cutoff);
    const ws = X.createWaveShaper(), f = X.createBiquadFilter(), g = X.createGain();
    ws.curve = distCurve(); f.type = "lowpass"; f.frequency.value = cutoff;
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .005); g.gain.setValueAtTime(vol, when + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .05);
    for (const [type, mul] of [["sawtooth", 1], ["square", .5]]) { const o = X.createOscillator(); o.type = type; o.frequency.value = freq * mul; o.connect(ws); o.start(when); o.stop(when + dur + .08); }
    ws.connect(f).connect(g).connect(bus.mix);
  }
  // metais (acorde de serrilhadas com o filtro abrindo, como um naipe tocando forte)
  function brass(notes, when, dur, vol) {
    if (HD) return hdBrass(notes, when, dur, vol * CAL.brass);
    const f = X.createBiquadFilter(), g = X.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(500, when); f.frequency.exponentialRampToValueAtTime(2800, when + .08); f.frequency.exponentialRampToValueAtTime(900, when + dur);
    g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .03); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .1);
    f.connect(g).connect(bus.mix);
    for (const m of notes) for (const det of [-9, 9]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(when); o.stop(when + dur + .15); }
  }
  // coro grave (um "aah" escuro): pad com formante de vogal
  function choir(notes, when, dur, vol) {
    if (HD) return hdChoir(notes, when, dur, vol * CAL.choir);
    const f = X.createBiquadFilter(), f2 = X.createBiquadFilter(), g = X.createGain();
    f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 1.2; f2.type = "lowpass"; f2.frequency.value = 1400;
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .5); g.gain.setValueAtTime(vol, when + dur - .3); g.gain.exponentialRampToValueAtTime(.0001, when + dur + .6);
    f.connect(f2).connect(g).connect(bus.mix);
    for (const m of notes) for (const det of [-12, 0, 12]) { const o = X.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = det; o.connect(f); o.start(when); o.stop(when + dur + .7); }
  }
  // sino grave de alerta (badalada)
  function toll(m, when, vol) { if (HD) return hdBellFM(mtof(m), when, vol * 1.2 * CAL.toll, 3.2, 1.4, 0); synth("sine", mtof(m), when, 3, vol); synth("sine", mtof(m) * 2.4, when, 1.4, vol * .35); synth("sine", mtof(m) * 3.9, when, .6, vol * .2); }

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
  /* Tema do Sul (leitmotif): em mi menor, no jeito da milonga e do chamamé. O motivo "si–sol–lá–si" gira em volta da
     quinta e sobe, no 4-2-2 de quem canta de pé no galpão. A: mi menor–dó–ré–si com sétima (a cadência da milonga), um
     acorde a cada dois compassos, terminando no si que pede a volta. B (a resposta, que sobe e esquenta): sol–ré–lá
     menor–si com sétima, cantada pelo violão e com a gaita (a sanfona do Sul) fazendo a terça. */
  const SUL_THEME = {
    A: [[0, 0, 71, 4], [0, 4, 67, 2], [0, 6, 69, 2], [0, 8, 71, 4], [0, 12, 74, 4], [1, 0, 72, 6], [1, 6, 71, 2], [1, 8, 67, 8],
        [2, 0, 72, 4], [2, 4, 67, 2], [2, 6, 69, 2], [2, 8, 72, 4], [2, 12, 76, 4], [3, 0, 74, 6], [3, 6, 72, 2], [3, 8, 71, 8],
        [4, 0, 74, 4], [4, 4, 69, 2], [4, 6, 71, 2], [4, 8, 72, 4], [4, 12, 74, 4], [5, 0, 76, 8], [5, 8, 74, 4], [5, 12, 72, 4],
        [6, 0, 71, 4], [6, 4, 75, 2], [6, 6, 78, 2], [6, 8, 76, 4], [6, 12, 75, 4], [7, 0, 71, 12]],
    B: [[0, 0, 79, 6], [0, 6, 78, 2], [0, 8, 76, 4], [0, 12, 74, 4], [1, 0, 71, 8], [1, 8, 74, 4], [1, 12, 79, 4],
        [2, 0, 78, 6], [2, 6, 76, 2], [2, 8, 74, 4], [2, 12, 72, 4], [3, 0, 69, 8], [3, 8, 71, 4], [3, 12, 74, 4],
        [4, 0, 72, 4], [4, 4, 76, 4], [4, 8, 81, 4], [4, 12, 79, 4], [5, 0, 76, 8], [5, 8, 72, 4], [5, 12, 69, 4],
        [6, 0, 71, 4], [6, 4, 75, 4], [6, 8, 78, 4], [6, 12, 81, 4], [7, 0, 75, 12]]
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
    // Foz do Iguaçu e o mapa do Sul: chamamé. O violão faz o rasguido no 3-3-2 (para baixo, para cima, para baixo), o
    // baixo e o bombo leguero marcam o um, e a gaita (a sanfona do Sul) segura os acordes e canta o tema. Forma:
    // introdução só de violão - A (a gaita canta) - B (o violão canta a resposta, a gaita faz a terça) - A' (oitava
    // acima, a gaita com a flauta)
    localSul: {
      bpm: 96, wet: .3, level: .4, swing: .14, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 40, notes: [52, 55, 59, 64]}, {bass: 48, notes: [52, 55, 60, 64]}, {bass: 38, notes: [50, 54, 57, 62]}, {bass: 47, notes: [51, 54, 57, 59]}],
      chordsB: [{bass: 43, notes: [50, 55, 59, 62]}, {bass: 38, notes: [50, 54, 57, 62]}, {bass: 45, notes: [52, 57, 60, 64]}, {bass: 47, notes: [51, 54, 57, 59]}],
      batida: {0: 0, 6: 1, 12: 0},   // o rasguido: 3-3-2 (0 = para baixo, 1 = para cima)
      // segunda voz: a nota da escala de mi menor duas casas abaixo
      terca(m) { const sc = [4, 6, 7, 9, 11, 0, 2], k = sc.indexOf(((m % 12) + 12) % 12); if (k < 0) return m - 3; const pc = sc[(k + 5) % 7]; const d = ((m % 12) - pc + 12) % 12; return m - (d || 12); },
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUL_THEME.B : SUL_THEME.A, part === "A2" ? 12 : 0, part === "A2");
        if (s in this.batida) strum(chord.notes.slice(this.batida[s] ? 1 : 0), t, d * 3, this.batida[s] ? .014 : .022, this.batida[s]);
        if (s === 0) { violao(mtof(chord.bass), t, d * 6, .03); synth("triangle", mtof(chord.bass - 12), t, d * 7, .07); }
        if (s === 8) { violao(mtof(chord.bass + 7), t, d * 5, .024); synth("triangle", mtof(chord.bass - 5), t, d * 5, .05); }
        if (part !== "I") {
          if (s === 0) kick(t, .07); else if (s === 6) kick(t, .03);   // bombo leguero
          if (s === 0 && barIn % 2 === 0) chord.notes.forEach(m => sanfona(mtof(m + 12), t, d * 31, .003));   // a gaita segurando
        }
        if (Math.random() < .002) bird(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95;
        if (part === "B") { violao(mtof(m.note - 12), t, len, .03); sanfona(mtof(this.terca(m.note)), t, len, .012); }   // o violão canta, a gaita faz a terça
        else { sanfona(mtof(m.note), t, len, .02); if (part === "A2") flute(mtof(m.note), t, len * .9, .01); }
      }
    },
    // Sul à noite: milonga. O violão sozinho no balanço 3-3-2 do bordão, os acordes dedilhados por cima, e o tema na
    // corda grave, devagar; na parte B a gaita responde de longe, baixinho. Grilos e a coruja do frio
    localSulNight: {
      bpm: 66, wet: .5, level: .4, swing: .1, form: ["I", "A", "B", "A"], melody: null,
      dedilha: {2: 1, 4: 2, 8: 3, 10: 2, 14: 1},
      play(i, t, d) {
        const N = TRACKS.localSul, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUL_THEME.B : SUL_THEME.A, -12);
        if (s === 0 || s === 6 || s === 12) violao(mtof(chord.bass + (s === 6 ? 7 : 0)), t, d * 5, .03);   // o bordão da milonga
        if (s in this.dedilha) violao(mtof(chord.notes[this.dedilha[s]] + 12), t, d * 4, .009);
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes, t, d * 32, .008); synth("sine", mtof(chord.bass - 12), t, d * 30, .05); }
        if (s % 8 === 4 && Math.random() < .5) cricket(t);
        if (Math.random() < .002) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95;
        if (part === "B") sanfona(mtof(m.note + 12), t, len, .009);
        else violao(mtof(m.note), t, len, .026);
      }
    },
    // à noite, cada região tem a sua faixa de exploração e de mapa (musicStart troca sozinho, como no Norte): o tema da
    // região mais lento, com pouca gente tocando, grilos e coruja. Nordeste: o forró vira seresta de sanfona no sertão,
    // a zabumba só marca o um e o triângulo aberto responde de longe. Forma: sanfona sozinha - A (meia frase do tema,
    // grave) - B (só o pad e os grilos) - A' (a frase inteira, oitava abaixo, com a flauta)
    localNordesteNight: {
      bpm: 76, wet: .5, level: .4, swing: .1, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 43, notes: [55, 59, 62, 65]}, {bass: 41, notes: [53, 57, 60, 64]}, {bass: 36, notes: [52, 55, 60, 62]}, {bass: 38, notes: [54, 57, 60, 62]}],
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4], chord = this.chords[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "A" ? themeLine(NORDESTE_THEME.A, -12, false, 4) : part === "A2" ? themeLine(NORDESTE_THEME.A, -12) : null;
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes, t, d * 32, .011); synth("sine", mtof(chord.bass - 12), t, d * 30, .06); }
        if (s === 0 && barIn % 2 === 0) chord.notes.forEach(m => sanfona(mtof(m + 12), t, d * 30, .0028));   // sanfona segurando o acorde
        if (part !== "I" && part !== "B") {
          if (s === 0) kick(t, .05);   // zabumba só no um
          if (s === 10 && bar % 2) tapa(t, .015);
          if (s === 8) triangulo(t, .004, true);
        }
        if (s === 0 && barIn % 4 === 0) bell(mtof(chord.notes[3] + 12), t, .012, 2.6);
        if (s % 8 === 4 && Math.random() < .55) cricket(t);
        if (Math.random() < .0018) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (m) { sanfona(mtof(m.note + 12), t, m.len * d * .95, .013); if (part === "A2") flute(mtof(m.note + 24), t, m.len * d * .9, .012); }
      }
    },
    // Centro-Oeste à noite: moda de viola na beira do fogo. A viola ponteia devagar, uma corda por semínima, o baixo só
    // no um, e o tema vem em dueto de terças, sem bateria; na parte B só a sanfona respira a resposta, bem baixinho
    localCentroOesteNight: {
      bpm: 70, wet: .5, level: .42, swing: .1, form: ["I", "A", "B", "A"], melody: null,
      chords: [{bass: 45, notes: [57, 61, 64, 69]}, {bass: 50, notes: [57, 62, 66, 69]}, {bass: 40, notes: [56, 59, 62, 64]}, {bass: 45, notes: [57, 61, 64, 69]}],
      chordsB: [{bass: 42, notes: [54, 57, 61, 66]}, {bass: 38, notes: [54, 57, 62, 66]}, {bass: 40, notes: [56, 59, 64, 68]}, {bass: 45, notes: [57, 61, 64, 69]}],
      pontea: [0, 2, 1, 3],
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? CENTROESTE_THEME.B : CENTROESTE_THEME.A, -12);
        if (s % 4 === 0) viola(mtof(chord.notes[this.pontea[s / 4]] + 12), t, d * 6, .009);   // ponteado devagar
        if (s === 0) { viola(mtof(chord.bass), t, d * 10, .03); synth("sine", mtof(chord.bass - 12), t, d * 14, .05); }
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes, t, d * 32, .009); chord.notes.forEach(m => sanfona(mtof(m + 12), t, d * 30, .0022)); }
        if (s % 8 === 4 && Math.random() < .55) cricket(t);
        if (Math.random() < .002) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95, terca = TRACKS.localCentroOeste.terca;
        if (part === "B") sanfona(mtof(m.note + 12), t, len, .011);
        else { viola(mtof(m.note + 12), t, len, .022); viola(mtof(terca(m.note) + 12), t, len, .014); }   // o dueto, baixinho
      }
    },
    // Minas à noite: seresta. O violão de náilon dedilhado (não mais o de aço batido), um baixo macio e o tema do
    // Sudeste na flauta, como serenata debaixo da janela; na parte B a sanfona responde. Sem bateria
    localSudesteNight: {
      bpm: 72, wet: .5, level: .38, swing: .1, form: ["I", "A", "B", "A2"], melody: null,
      chords: [{bass: 38, notes: [50, 54, 57, 62, 66]}, {bass: 47, notes: [47, 51, 54, 57, 59]}, {bass: 40, notes: [52, 55, 59, 62, 64]}, {bass: 45, notes: [52, 55, 57, 61, 64]}],
      chordsB: [{bass: 43, notes: [50, 55, 59, 62, 67]}, {bass: 43, notes: [50, 55, 58, 62, 67]}, {bass: 42, notes: [49, 54, 57, 61, 64]}, {bass: 45, notes: [52, 55, 57, 61, 64]}],
      dedilha: [0, 2, 3, 4, 2, 3, 1, 3],   // uma corda por colcheia
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? this.chordsB : this.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 0 : -12, part === "A2");
        if (s % 2 === 0) violao(mtof(chord.notes[this.dedilha[s / 2]]), t, d * 4, .016);   // náilon dedilhado
        if (s === 0) synth("sine", mtof(chord.bass - 12), t, d * 14, .07);
        if (s === 8 && barIn % 2) synth("sine", mtof(chord.bass - 5), t, d * 6, .05);
        if (s === 0 && barIn % 2 === 0) pad(chord.notes, t, d * 32, .008);
        if (s % 8 === 4 && Math.random() < .5) cricket(t);
        if (Math.random() < .0018) owl(t);
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .95;
        if (part === "B") sanfona(mtof(m.note), t, len, .012);
        else flute(mtof(m.note), t, len, .018);
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
    // São Paulo (exploração de dia): MPB. Violão de náilon na batida da bossa, piano elétrico com acordes de
    // sétima e nona, escovinha e o tema do Sudeste na flauta; B no piano elétrico, A' com o vibrafone dobrando
    mpbSudeste: {
      bpm: 116, wet: .34, level: .42, suave: true, swing: .1, form: ["I", "A", "B", "A2"], melody: null,
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
    // Rio de Janeiro (exploração de dia): funk carioca. O tamborzão (o grave do 808 e o tambor), palma, chimbal e um
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
    // Rio à noite: funk melody na beira do mar. O tamborzão abafado e lento (só o grave e um tambor), o tema no piano
    // elétrico com eco e a onda do mar passando a cada dois compassos; na parte B só o pad e o mar
    funkSudesteNight: {
      bpm: 96, wet: .48, level: .36, swing: .06, form: ["I", "A", "B", "A2"], melody: null,
      play(i, t, d) {
        const N = TRACKS.localSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" || part === "B" ? null : themeLine(SUDESTE_THEME.A, part === "A2" ? 0 : -12, part === "A2");
        if (s === 0 && barIn % 2 === 0) { pad(chord.notes.slice(1), t, d * 32, .009); sweep(t, d * 24, .012); }   // a onda
        if (part !== "I" && part !== "B") {
          if (s === 0 || s === 10) bumbo808(mtof(chord.bass - 12), t, d * 4, .04);
          if (s === 6) atabaque(t, .035, false);
          if (s === 12) palma(t, .008);
        }
        if (s === 8 && barIn % 4 === 3) bell(mtof(chord.notes[3] + 12), t, .008, 2);
        const m = this.melody && this.melody[i % 128];
        if (m) ep(mtof(m.note), t, m.len * d * .95, .022);
      }
    },
    // São Paulo à noite: bossa de apartamento. O violão de náilon na batida da bossa, bem devagar e baixinho, escovinha
    // só no um, o baixo macio e o tema na flauta grave; na parte B o piano elétrico responde. Garoa: um chiado fino
    mpbSudesteNight: {
      bpm: 80, suave: true, wet: .5, level: .4, swing: .1, form: ["I", "A", "B", "A2"], melody: null,
      play(i, t, d) {
        const N = TRACKS.mpbSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)];
        if (i % 128 === 0) this.melody = part === "I" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, -12, part === "A2");
        if (s === 0 || s === 8) violao(mtof(chord.bass + (s && barIn % 2 ? 7 : 0)), t, d * 6, .036);
        if (N.bossa.includes(s)) chord.notes.forEach((m, k) => violao(mtof(m), t + k * .008, d * 2.6, .011));
        if (s === 0 && part !== "I") noiseHit(t, .05, .003, "bandpass", 4200, .8);   // escovinha
        if (s === 0 && barIn % 2 === 0) { synth("sine", mtof(chord.bass - 12), t, d * 14, .055); pad(chord.notes, t, d * 32, .007); }
        if (s % 4 === 2) noiseHit(t, .2, .0012, "highpass", 6000);   // a garoa
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        if (part === "B") ep(mtof(m.note), t, m.len * d * .95, .024);
        else flute(mtof(m.note + 12), t, m.len * d * .95, .016);
      }
    },
    // batalha no Rio: funk 150. O tamborzão dobrado e rápido, palma no 2 e no 4, o tema no sintetizador e o metal
    // respondendo na parte B; C = ponte só de tambor que cresce. Forma A - A' - B - C
    battleRio: {
      bpm: 150, wet: .16, level: .4, form: ["A", "A2", "B", "C"], melody: null,
      tambor: {0: "b", 3: "t", 6: "b", 8: "t", 10: "b", 12: "t", 14: "t", 15: "t"},
      play(i, t, d) {
        const N = TRACKS.localSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)], h = this.tambor[s], bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 12 : 0, part !== "A"); hat(t, .02, true); }
        if (h === "b") bumbo808(mtof(chord.bass - 12), t, d * 2.5, .055);
        if (h === "t") { atabaque(t, .08, s >= 14); noiseHit(t, .05, .012, "bandpass", 700, 1.2); }
        if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) palma(t, .024);
        if (s % 2 === 0) hat(t, s % 4 ? .004 : .008);
        if (bridge) return;
        if (part === "B" && [0, 3, 6, 10].includes(s)) chord.notes.slice(1).forEach(m => synth("sawtooth", mtof(m + 12), t, d * 1.1, .006, 2600));   // metal
        const m = this.melody && this.melody[i % 128];
        if (m) { lead(mtof(m.note), t, m.len * d * .85, .018); synth("sawtooth", mtof(m.note - 12), t, m.len * d * .85, .007, 1800); }
      }
    },
    // batalha em São Paulo: samba-rock. Bumbo e caixa de rock com o balanço do samba, agogô, o violão batendo na batida
    // da bossa acelerada e o tema na guitarra (lead); B no piano elétrico. Forma A - A' - B - C (ponte de bateria)
    // batalha em São Paulo: samba-jazz (a MPB acelerada, no jeito dos trios dos anos 60), com os acordes e o tema do
    // Sudeste da MPB: bumbo de samba com a antecipação antes de cada tempo, condução em semicolcheias, aro e violão de
    // náilon na batida da bossa, ganzá empurrando, baixo de samba (tônica e quinta) e o tema na flauta e no piano elétrico.
    // Forma A - A2 (tema uma oitava acima, com o piano dobrando) - B (a resposta no piano) - C (ponte de percussão e a virada)
    battleSaoPaulo: {
      bpm: 150, wet: .22, level: .4, swing: .05, suave: true, form: ["A", "A2", "B", "C"], melody: null,
      baixo: [[0, 0, .1], [3, 0, .05], [4, 7, .08], [8, 0, .1], [11, 12, .05], [12, 7, .08]],   // [passo, intervalo, força]
      play(i, t, d) {
        const N = TRACKS.mpbSudeste, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)], bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "C" ? null : themeLine(part === "B" ? SUDESTE_THEME.B : SUDESTE_THEME.A, part === "A2" ? 12 : 0, part !== "A"); hat(t, .02, true); }
        // bateria de samba-jazz: bumbo no tempo e na antecipação, condução, aro na clave da bossa e a caixa no 2 e no 4
        if (s % 4 === 0 || s % 4 === 3) kick(t, s % 4 === 0 ? .085 : .04);
        hat(t, s % 4 === 2 ? .009 : .0045, s === 14 && barIn % 2 === 1);
        if (N.bossa.includes(s)) noiseHit(t, .025, .016, "bandpass", 2600, 3);   // aro (a baqueta no aro da caixa)
        if (!battleFill(t, d, s, barIn, build) && !bridge && (s === 4 || s === 12)) snare(t, .022);
        ganza(t, s % 4 === 2 ? .012 : .005);
        if (bridge) { if (s === 0 || s === 8) surdo(t, .07); return; }
        // baixo de samba e o violão na batida da bossa; piano elétrico em acordes curtos no contratempo
        const bl = this.baixo.find(([at]) => at === s);
        if (bl) synth("triangle", mtof(chord.bass - 12 + bl[1]), t, d * 1.6, bl[2]);
        if (N.bossa.includes(s)) chord.notes.forEach((m, k) => violao(mtof(m), t + k * .005, d * 1.6, .013));
        if (part !== "A" && (s === 2 || s === 10)) chord.notes.forEach(m => ep(mtof(m + 12), t, d * 1.2, .006));
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .9;
        if (part === "B") { ep(mtof(m.note), t, len, .03); flute(mtof(m.note - 12), t, len, .012); }
        else { flute(mtof(m.note), t, len, .03); if (part === "A2") ep(mtof(m.note - 12), t, len, .014); }
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
    // créditos do fim (endCredits): os dois temas emendados, sem pressa. A - o tema do Rhanon (versão de viagem) no
    // piano elétrico, só com pad: a lembrança da estrada; A' - o mesmo tema na flauta, com caxixi e um bumbo bem leve;
    // B - o tema de Jaci na flauta com a harpa em arpejo: a lua voltando; B' - Jaci uma oitava acima, sino dobrando e o
    // ritmo inteiro, e volta ao começo. Tudo em dó maior / lá menor, então um tema emenda no outro sem troca de tom
    creditos: {
      bpm: 76, wet: .55, level: .44, form: ["A", "A2", "B", "B2"], melody: null,
      chords: {A: P4_CHORDS, B: [{bass: 36, notes: [60, 64, 67, 71]}, {bass: 45, notes: [57, 60, 64, 67]}, {bass: 41, notes: [57, 60, 65, 69]}, {bass: 43, notes: [55, 59, 62, 67]}]},
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4], jaci = part[0] === "B";
        const chord = jaci ? this.chords.B[Math.floor(barIn / 2)] : this.chords.A[barIn % 4];
        if (i % 128 === 0) this.melody = jaci ? themeLine(JACI_THEME, part === "B2" ? 12 : 0) : themeLine(RHANON_THEME.viagem, part === "A2" ? 0 : -12, part === "A2");
        if (s === 0 && (jaci ? barIn % 2 === 0 : true)) { pad(chord.notes, t, d * (jaci ? 32 : 16), .011); synth("sine", mtof(chord.bass), t, d * (jaci ? 30 : 15), .055); }
        if (part !== "A" && s % 2 === 1) caxixi(t, s % 4 === 3 ? .008 : .004);
        if ((part === "A2" || part === "B2") && (s === 0 || s === 10)) kick(t, .06);
        if (part === "B2" && (s === 4 || s === 12)) snare(t, .02);
        if (jaci && s % 2 === 0) synth("triangle", mtof(chord.notes[(s / 2) % 4] + 12), t, d * 3, .007);   // harpa em arpejo
        if (part === "A" && [3, 6, 10, 14].includes(s)) chord.notes.forEach(m => ep(mtof(m), t, .2, .008));
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        if (part === "A") ep(mtof(m.note + 12), t, m.len * d * .9, .05);
        else flute(mtof(m.note), t, m.len * d * .95, .03);
        if (part === "B2") bell(mtof(m.note + 12), t, .01, 1.6);
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
    // batalha no Sul: vanerão (a vaneira gaúcha). Bumbo no um e no três, caixa no contratempo, a gaita batendo os acordes
    // nos contratempos (o pulo da vaneira), o baixo indo e vindo entre a fundamental e a quinta e o violão no 2 e no 4.
    // Forma: introdução de gaita - A (a gaita canta o tema, com a terça) - B (o violão canta a resposta) - A' (oitava
    // acima, com floreios) - C (ponte de bateria que cresce)
    battleSul: {
      bpm: 152, wet: .2, level: .44, swing: .02, form: ["I", "A", "B", "A2", "C"], melody: null,
      play(i, t, d) {
        const N = TRACKS.localSul, s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 5];
        const chord = (part === "B" ? N.chordsB : N.chords)[Math.floor(barIn / 2)];
        const bridge = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (i % 128 === 0) { this.melody = part === "I" || part === "C" ? null : themeLine(part === "B" ? SUL_THEME.B : SUL_THEME.A, part === "A2" ? 12 : 0, part !== "A"); hat(t, .02, true); }
        if (part !== "I") {
          if (s === 0 || s === 8) kick(t, s ? .09 : .11);
          if (!battleFill(t, d, s, barIn, build) && (s === 4 || s === 12)) snare(t, .028);
          if (s % 2 === 0) hat(t, s % 4 === 2 ? .01 : .006);
        }
        if (bridge) { if (s % 4 === 2) reco(t, .008); return; }
        if (s % 4 === 2) chord.notes.forEach(m => sanfona(mtof(m + 12), t, d * 1.2, part === "I" ? .006 : .0045));   // o pulo da vaneira
        if (part !== "I") {
          if (s === 0 || s === 8) synth("triangle", mtof(chord.bass - 12 + (s ? 7 : 0)), t, d * 3, .1);
          if (s === 6 || s === 14) synth("triangle", mtof(chord.bass - 12 + (s === 6 ? 4 : 9)), t, d * 1.5, .06);
          if (s === 4 || s === 12) strum(chord.notes.slice(1), t, d * 2, .012, s === 12);
        }
        const m = this.melody && this.melody[i % 128];
        if (!m) return;
        const len = m.len * d * .9;
        if (part === "B") { lead(mtof(m.note - 12), t, len, .016); sanfona(mtof(N.terca(m.note)), t, len, .012); }
        else { sanfona(mtof(m.note), t, len, .022); sanfona(mtof(N.terca(m.note)), t, len, .012); if (part === "A2") lead(mtof(m.note - 12), t, len, .01); }
      }
    },
    // luta contra bug do freela: o trabalho do Rhanon, não a trama, então toca o tema DELE (RHANON_THEME.abertura) e não
    // o da região. Synthwave de 8 bits nos acordes da tela inicial (P5_CHORDS, um por compasso): bumbo reto, chimbal
    // aberto no contratempo, baixo pulsando em oitavas, arpejo de semicolcheia e o tema num lead quadrado dobrado.
    // Forma: A (tema) - A' (tema oitava acima, com floreios) - B (arpejo e acordes picados, com "falhas" de ruído) -
    // C (meia frase do tema e a caixa enchendo até a volta)
    battleBug: {
      bpm: 140, wet: .16, level: .44, swing: 0, form: ["A", "A2", "B", "C"], chords: P5_CHORDS, melody: null,
      arp: [0, 1, 2, 3, 2, 1, 3, 2],
      play(i, t, d) {
        const s = i % 16, bar = Math.floor(i / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4], chord = this.chords[bar % 4];
        if (i % 128 === 0) this.melody = part === "B" ? null : themeLine(RHANON_THEME.abertura, part === "A2" ? 12 : 0, part === "A2", part === "C" ? 4 : 8);
        if (s % 4 === 0) kick(t, .12);
        if (s === 4 || s === 12) { snare(t, .045); clap(t); }
        if (part === "C" && barIn >= 6 && s % 2 === 1) snare(t, .012 + (barIn - 6) * .01);   // a caixa enche até a volta
        if (s % 4 === 2) hat(t, .014, true); else if (s % 2 === 0) hat(t, .005);
        if (s % 2 === 0) synth("sawtooth", mtof(chord.bass - 12 + (s % 4 === 2 ? 12 : 0)), t, d * 1.6, .045, 900);   // baixo pulsando
        const n = chord.notes[this.arp[s % 8]] + 12 + (part === "A2" && s >= 8 ? 12 : 0);
        synth("square", mtof(n), t, d * .8, part === "B" ? .014 : .009, 3200);   // arpejo
        if (s === 0 && barIn % 2 === 0) pad(chord.notes, t, d * 32, .008);
        if (part === "B" && [0, 6, 10].includes(s)) chord.notes.forEach(m => synth("sawtooth", mtof(m), t, d * 1.5, .01, 2400));   // acordes picados
        if (part === "B" && s === 14 && Math.random() < .6) for (let k = 0; k < 4; k++) noiseHit(t + k * d * .25, .02, .02, "bandpass", 1500 + Math.random() * 4000, 6);   // falha no código
        const m = this.melody && this.melody[i % 128];
        if (m) { synth("square", mtof(m.note), t, m.len * d * .9, .024, 2600); synth("sawtooth", mtof(m.note + 12) * 1.003, t, m.len * d * .9, .007, 3000); }
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
    /* Pytuna segura o chefe (pytunaPossess em combat.js): o tema de Pytuna (PYTUNA_THEME) em versão de batalha. Os acordes
       saem das notas do próprio tema (ré menor, mi bemol, lá bemol, dó sustenido diminuto: o trítono no meio) e o riff
       distorcido martela ré e lá bemol. Abre com o coro e a badalada da cena dele; A = bateria cheia com o tema no metal,
       uma oitava acima; B = meio-tempo pesado com o tema grave no coro e no baixo; C = a fumaça girando (coração e surdo)
       crescendo de volta para o A. */
    battlePytuna: {
      bpm: 136, wet: .32, level: .3,
      chords: [{bass: 38, notes: [50, 53, 57, 62]}, {bass: 39, notes: [51, 55, 58, 63]}, {bass: 44, notes: [51, 56, 60, 63]}, {bass: 37, notes: [49, 52, 55, 58]}],
      form: ["A", "B", "A2", "C"], riff: [0, 0, 12, 0, 6, 0, 12, 0, 0, 0, 13, 0, 6, 0, 1, 0], intro: 32, melody: null,
      play(i, t, d) {
        if (i < this.intro) {   // abertura: a fumaça volta para dentro do chefe
          const s = i % 16, bar = Math.floor(i / 16);
          if (i === 0) { choir([26, 33, 38], t, d * 32, .022); toll(38, t, .05); sweep(t, d * 32, .035); }
          if (s === 0 || s === 3) kick(t, s ? .08 : .12);   // o coração da cena dele, agora acelerando
          if (bar === 1 && s % 2 === 0) snare(t, .015 + s * .003);
          if (bar === 1 && s === 8) toll(44, t, .04);   // a badalada no trítono
          return;
        }
        const j = i - this.intro, s = j % 16, bar = Math.floor(j / 16), barIn = bar % 8, part = this.form[Math.floor(bar / 8) % 4];
        const chord = this.chords[Math.floor(barIn / 2)], notes = chord.notes;
        const half = part === "B", brk = part === "C" && barIn < 4, build = part === "C" && barIn >= 4;
        if (j % 128 === 0) {   // o tema tem 4 compassos: toca duas vezes, a segunda com enfeite
          const sh = half ? 0 : part === "A2" ? 24 : 12, a = themeLine(PYTUNA_THEME, sh), b = themeLine(PYTUNA_THEME, sh, part === "A2");
          this.melody = part === "C" ? null : [...a.slice(0, 64), ...b.slice(0, 64)];
          hat(t, .03, true);
        }
        if (s === 0 && barIn % 2 === 0) { choir(notes.slice(0, 3).map(n => n - 12), t, d * 32, brk ? .024 : .014); toll(notes[0] + (half ? 0 : 12), t, .03); }
        if (brk || build) {   // ponte: a fumaça girando, coração e surdo; a virada cresce no fim
          if (s === 0 || s === 3) kick(t, .14); if (s === 8 || s === 14) surdo(t, .12);
          if (s % 4 === 2) sweep(t, d * 2, .01);
          if (build && !battleFill(t, d, s, barIn, true) && (s === 4 || s === 12)) snare(t, .04);
          return;
        }
        if (half) { if (s === 0 || s === 10) kick(t, .16); if (s === 8) { snare(t, .08); clap(t); } if (s === 14 || s === 15) surdo(t, .11); }
        else {
          if ([0, 3, 6, 8, 11].includes(s)) kick(t, .14);
          if (!battleFill(t, d, s, barIn, false) && (s === 4 || s === 12)) { snare(t, .07); clap(t); }
        }
        if (s % 2 === 0) hat(t, s % 4 === 2 ? .013 : .006, s === 6 && half);
        const r = this.riff[s];   // riff no trítono: ré, ré agudo, lá bemol
        if (!half || s % 4 === 0) dist(mtof(chord.bass + 12 + r), t, d * (half ? 3.6 : .9), half ? .032 : .024, half ? 1000 : 1400);
        if (s === 0 || (s === 10 && !half)) brass(notes.slice(1).map(n => n + 12), t, d * (s === 0 ? 3 : 1.5), .011);
        if (s === 0) synth("sine", mtof(chord.bass), t, d * 15, .09);
        const m = this.melody && this.melody[j % 128];
        if (m) {
          if (half) { synth("sawtooth", mtof(m.note + 12), t, m.len * d, .02, 700); synth("sine", mtof(m.note), t, m.len * d, .06); }   // a voz de fumaça da cena, grave
          else { lead(mtof(m.note), t, m.len * d * .9, .014); synth("sawtooth", mtof(m.note - 12), t, m.len * d * .9, .007, 1600); }
        }
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

  // mixagem do som novo: envio de sala (rev) e de eco pingue-pongue de 3/16 (dly), grave e "ar" um pouco acima,
  // compressor de cola, saturação suave e limitador
  let HD_LEVEL = .26;
  function buildHD(tr) {
    const m = X.createGain(), mix = X.createGain(), lv = X.createGain();
    m.gain.value = .0001; lv.gain.value = LEVEL * HD_LEVEL; SUAVE = !!tr.suave;
    const rev = X.createGain(), room = makeRoom(), rhp = X.createBiquadFilter(), wet = X.createGain(), amb = X.createGain();
    rhp.type = "highpass"; rhp.frequency.value = 260; wet.gain.value = .85; amb.gain.value = tr.wet * .45;
    rev.connect(room).connect(rhp).connect(wet).connect(m); mix.connect(amb).connect(rev);   // um pouco de sala em tudo
    const dly = X.createGain(), dl = X.createDelay(2), dr = X.createDelay(2), fb = X.createGain(), lp = X.createBiquadFilter(), pl = X.createStereoPanner(), pr = X.createStereoPanner(), dOut = X.createGain();
    dl.delayTime.value = dr.delayTime.value = 60 / tr.bpm / 4 * 3; fb.gain.value = S16 ? .46 : .3; lp.type = "lowpass"; lp.frequency.value = S16 ? 2200 : 3400;
    pl.pan.value = -.6; pr.pan.value = .6; dOut.gain.value = S16 ? .62 : .5;
    if (S16) { const e = X.createGain(); e.gain.value = .07; mix.connect(e).connect(dly); }   // um pouco de eco em tudo, como no SNES
    dly.connect(dl); dl.connect(pl).connect(dOut); dl.connect(dr); dr.connect(pr).connect(dOut); dr.connect(lp).connect(fb).connect(dl);
    dOut.connect(m); dOut.connect(rev); mix.connect(m);
    const lo = X.createBiquadFilter(), hi = X.createBiquadFilter(), comp = X.createDynamicsCompressor(), sat = X.createWaveShaper(), lim = X.createDynamicsCompressor();
    lo.type = "lowshelf"; lo.frequency.value = 80; lo.gain.value = S16 ? 1.5 : .5; hi.type = "highshelf"; hi.frequency.value = 6000; hi.gain.value = S16 ? 1.5 : 5.5;
    comp.threshold.value = -20; comp.ratio.value = 2.5; comp.attack.value = .015; comp.release.value = .22; comp.knee.value = 8;
    sat.curve = hdSatCurve(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .08;
    let topo = hi;
    if (SUAVE) {   // faixa macia: topo mais baixo, um filtro leve em cima e corpo no médio-grave
      hi.gain.value = -3.5; hi.frequency.value = 4500;
      const corpo = X.createBiquadFilter(), teto = X.createBiquadFilter(); corpo.type = "peaking"; corpo.frequency.value = 220; corpo.Q.value = .7; corpo.gain.value = 2.5;
      teto.type = "lowpass"; teto.frequency.value = 8500; teto.Q.value = .5; hi.connect(corpo).connect(teto); topo = teto;
    }
    m.connect(lo).connect(hi); topo.connect(comp).connect(lv).connect(sat).connect(lim).connect(DEST);
    return {master: m, mix, rev, dly};
  }
  function build(tr) {
    if (HD) return buildHD(tr);
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
  // monta por trechos (pausa a cada segundo e agenda só o seguinte): montar tudo de uma vez deixa milhares de nós
  // trabalhando em silêncio. hd = com o som novo (o padrão é o que estiver ligado)
  async function render(id, sec = 20, rate = 44100, hd = HD && S16 ? "16" : HD) {
    const snap = () => ({X, DEST, bus, track, step, nextTime, HD, S16, SUAVE, FL_LAST}), load = q => ({X, DEST, bus, track, step, nextTime, HD, S16, SUAVE, FL_LAST} = q);
    const live = snap(), off = new OfflineAudioContext(2, Math.floor(rate * sec), rate);
    load({X: off, DEST: off.destination, bus: null, track: ALL[id], step: 0, nextTime: .05, HD: !!hd, S16: hd === "16" || hd === "16f", SUAVE: false, FL_LAST: null});
    bus = build(track); bus.master.gain.setValueAtTime(track.level, 0);
    let st = snap(); load(live);
    const chunk = upTo => {
      const back = snap(); load(st);
      const d = 60 / track.bpm / 4;
      while (nextTime < Math.min(upTo, sec - .3)) { track.play(step, nextTime + (track.swing && step % 2 ? d * track.swing : 0), d); nextTime += d; step++; }
      st = snap(); load(back);
    };
    chunk(1.2);
    for (let w = 1; w < sec - .3; w++) off.suspend(w).then(() => { chunk(w + 1.2); off.resume(); });
    return off.startRendering();
  }
  // teste: grava instrumentos soltos, sem faixa (fn recebe os instrumentos e agenda as notas a partir de 0,05 s)
  async function renderInst(fn, sec = 3, hd = "16", rate = 44100) {
    const snap = () => ({X, DEST, bus, track, step, nextTime, HD, S16, SUAVE, FL_LAST}), load = q => ({X, DEST, bus, track, step, nextTime, HD, S16, SUAVE, FL_LAST} = q);
    const live = snap(), off = new OfflineAudioContext(2, Math.floor(rate * sec), rate);
    load({X: off, DEST: off.destination, bus: null, track: {bpm: 120, wet: .2, level: .4}, step: 0, nextTime: 0, HD: !!hd, S16: hd === "16", SUAVE: false, FL_LAST: null});
    try {
      bus = build(track); bus.master.gain.setValueAtTime(track.level, 0);
      fn({synth, kick, snare, hat, noiseHit, flute, lead, ep, pad, bell, berimbau, atabaque, tapa, sanfona, viola, violao, strum, bumbo808, palma, guitar, dist, brass, choir, toll, surdo, agogo, triangulo, ganza, reco, mtof});
    } finally { load(live); }
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
  return {get hd() { return HD && S16 ? "16" : HD; }, set hd(v) { HD = !!v; S16 = v === "16" || v === "16f"; }, set hdLevel(v) { HD_LEVEL = v; }, has: id => !!ALL[id], renderInst, play, reload() { const id = trackId; if (!id) return; track = null; play(id, .6); }, stop: (sec = .6) => { if (X) fadeOut(sec); }, measure, render, beat, get current() { return trackId; }};
})();

/* ----- o que o resto do jogo usa ----- */
function musicStart(id) {
  id = id || "battleCapo";
  // fora do Norte, exploração e mapa tocam a faixa da região (Nordeste: toada do boi; Centro-Oeste: toada caipira;
  // Sudeste: sertanejo universitário), e à noite a versão noturna dela
  const REGION_LOCAL = {nordeste: "localNordeste", centroeste: "localCentroOeste", sudeste: "localSudeste", sul: "localSul"};
  // no Sudeste cada estado tem o seu: o Rio toca funk e São Paulo, MPB (Minas fica com o sertanejo da região)
  const CITY_LOCAL = {riodejaneiro: "funkSudeste", saopaulo: "mpbSudeste"};
  const regLocal = id === "local" ? CITY_LOCAL[curCity()] || REGION_LOCAL[regionOfCity(curCity())] : id === "map" ? REGION_LOCAL[MAP_REGION] : null;
  if (regLocal) id = G.night ? regLocal + "Night" : regLocal;
  if (id === "local" && G.night) id = "localNight";   // à noite a música da exploração muda de clima
  if (id === "map" && MAP_REGION === "norte") id = G.night ? "mapParaNight" : "mapPara";   // mapa do Norte: guitarrada de dia e de noite
  if (MUS.has(id)) MUS.play(id);
  else MUS.stop(.4);
}
function musicStop() { MUS.stop(.7); }