/* Efeitos sonoros 8-bit, fanfarras e som de impacto. Tudo sai pelo ganho master, que o botão de som silencia. */
let AC, master, muted = false, NB;
// o navegador só libera o áudio depois de um gesto do jogador; chamado em cada clique
function audio() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = muted ? 0 : .5; master.connect(AC.destination); }
  if (AC.state === "suspended") AC.resume();
}
function tone(f, t, d, type, v, f2) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02);
}
function noise(t, d, v, hp) {
  if (!NB) { NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = hp; s.buffer = NB;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .02);
}
const SFX = {
  blip:  t => tone(660, t, .05, "square", .05),
  spear: t => tone(900, t, .18, "square", .07, 200),
  hit:   t => { noise(t, .12, .2, 500); tone(220, t, .15, "square", .12, 60); },
  crit:  t => { noise(t, .18, .25, 400); tone(440, t, .25, "square", .14, 80); tone(880, t + .05, .2, "square", .08, 160); },
  fire:  t => { noise(t, .4, .18, 1500); tone(300, t, .4, "sawtooth", .06, 900); },
  heal:  t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .07, .1, "square", .08)),
  guard: t => tone(150, t, .12, "triangle", .2, 100),
  look:  t => { tone(700, t, .08, "square", .06); tone(1000, t + .1, .08, "square", .06); },
  roar:  t => { noise(t, .5, .2, 200); tone(110, t, .5, "sawtooth", .14, 55); },
  claw:  t => { noise(t, .1, .2, 3000); tone(1200, t, .12, "square", .06, 300); },
  hurt:  t => { tone(300, t, .2, "square", .12, 90); noise(t, .1, .18, 600); },
  more:  t => [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .06, .08, "square", .08))
};
function sfx(n) { if (AC) SFX[n](AC.currentTime); }
function toggleMute() {
  muted = !muted; if (master) master.gain.value = muted ? 0 : .5;
  $("mute").setAttribute("aria-pressed", muted);
}
/* ----- fanfarra de vitória, derrota e fuga (curtas e suaves, como na vitrine) ----- */
function fanfare(kind) {
  if (!AC) return;
  const t = AC.currentTime + .05, out = AC.createGain(), lp = AC.createBiquadFilter();
  out.gain.value = .9; lp.type = "lowpass"; lp.frequency.value = 3800; lp.connect(out).connect(master);
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
    m.gain.value = .5; out.connect(m).connect(master);
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
  n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + .36);
  tone(140, t + .3, .6, "sine", .35, 38); noise(t + .3, .25, .2, 120);
  tone(1320, t + .3, .25, "square", .04, 1320); tone(1980, t + .32, .3, "triangle", .03);
}