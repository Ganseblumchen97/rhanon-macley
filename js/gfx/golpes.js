/* Efeitos dos especiais de elemento na batalha: cada um tem desenho e impacto próprios, pintados quadro a quadro num canvas
   de pixel por cima do palco (como a cena da posse, pytunaCine em combat.js).
   elemFx(kind, weak) começa o efeito e devolve em quantos ms ele acerta o bicho (ELEM_AT); quem chama (strike, combat.js)
   arma o anel do tempo certo e aplica o dano nessa hora. kind: "cipo" (chicote que sai em curva, enrola e estala),
   "raio" (o palco escurece, a lança carrega e o raio desce em galhos), "agua" (jato em arco que arrebenta em respingos),
   "vento" (riscos com caracol que empurram o bicho) e "fire" (labareda que cresce no caminho, bola de fogo, brasas e fumaça).
   weak = acertou a fraqueza: mais partículas e uma onda de choque na cor do elemento.
   Elemento novo: tempos em ELEM_AT/ELEM_END, cor em ELEM_COR e um desenho em `pinta`.
   No fim do arquivo, na mesma tela: a lança arremessada (throwFx), os cortes da Fúria (furyFx), o Observar (observeFx),
   comer um item (eatFx) e o escudo do Defender (guardFx). */
const ELEM_AT = {cipo: 620, raio: 700, agua: 760, vento: 700, fire: 1300};
const ELEM_END = {cipo: 1150, raio: 1300, agua: 1450, vento: 1250, fire: 2150};
const ELEM_COR = {cipo: "#c9f2a8", raio: "#fff27a", agua: "#d2f0ff", vento: "#ffffff", fire: "#ffd23a"};
function elemFx(kind, weak, parado) {   // parado (ms): pinta só esse instante e deixa na tela, sem som (para conferir os desenhos)
  const at = ELEM_AT[kind], st = $("stage");
  st.querySelectorAll(".elem-cine").forEach(c => c.remove());
  if ((REDUCE && parado == null) || !at) return REDUCE ? 250 : 0;
  const cv = document.createElement("canvas"), sr = st.getBoundingClientRect(), k = Math.max(2, Math.round(sr.width / 360));
  cv.className = "elem-cine"; cv.width = Math.ceil(sr.width / k); cv.height = Math.ceil(sr.height / k); st.appendChild(cv);
  const x = cv.getContext("2d"), W = cv.width, H = cv.height, hr = $("hero").getBoundingClientRect(), br = $("beast").getBoundingClientRect();
  const em = (r, fx, fy) => [(r.left + r.width * fx - sr.left) / k, (r.top + r.height * fy - sr.top) / k];
  const M = kind === "fire" ? em(hr, .74, .2) : kind === "raio" ? em(hr, .8, .06) : em(hr, .78, .4);   // de onde sai: mão, ponta da lança ou tocha
  const B = em(br, .5, .5), bw = br.width / k, bh = br.height / k, pes = (br.bottom - sr.top) / k;
  // pincéis de pixel (sem suavização): quadradinho, disco, linha grossa e anel
  const cl = u => Math.max(0, Math.min(1, u)), sai = u => 1 - (1 - u) ** 3, rr = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const dot = (px, py, s, c) => { x.fillStyle = c; x.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s); };
  const disc = (px, py, r, c) => { x.fillStyle = c; for (let j = -Math.ceil(r); j <= r; j++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - j * j))); if (w > 0 || r < 1) x.fillRect(Math.round(px) - w, Math.round(py) + j, w * 2 + 1, 1); } };
  const seg = (x0, y0, x1, y1, w, c) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; x.fillStyle = c; for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w); };
  const anel = (px, py, rx, ry, c, w = 1, a0 = 0, a1 = Math.PI * 2) => { const n = Math.ceil((rx + ry) * 1.6); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; dot(px + Math.cos(a) * rx, py + Math.sin(a) * ry, w, c); } };
  const N = weak ? 1.7 : 1;
  const onda = dt => {   // fraqueza: duas ondas e riscos para fora, na cor do elemento
    if (!weak || dt < 0 || dt > 300) return;
    const u = sai(dt / 300); x.globalAlpha = 1 - dt / 300;
    anel(B[0], B[1], 6 + u * 44, 6 + u * 44, ELEM_COR[kind], 2); anel(B[0], B[1], 4 + u * 28, 4 + u * 28, "#ffffff", 1);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3, r0 = 10 + u * 30, r1 = r0 + 9; seg(B[0] + Math.cos(a) * r0, B[1] + Math.sin(a) * r0, B[0] + Math.cos(a) * r1, B[1] + Math.sin(a) * r1, 1, ELEM_COR[kind]); }
    x.globalAlpha = 1;
  };
  const pinta = {
    cipo(e) {
      const G = ["#3f9a3a", "#2a6a2a", "#7ac84a"], dt = e - at, bate = [B[0] - bw * .28, B[1]];
      if (e < 180) { for (let i = 0; i < 11; i++) { const a = i * .9 + e / 40, r = 2 + i * .5; dot(M[0] + Math.cos(a) * r, M[1] + Math.sin(a) * r, 2, G[i % 2]); } }   // o cipó enrolado na mão
      const u0 = cl((e - 180) / (at - 180)), ext = e < 180 ? 0 : e < at + 140 ? sai(u0) : 1 - cl((dt - 140) / 300) ** 2;
      if (ext > 0) {
        const amp = e < at ? (1 - u0) * 48 + 6 : 6, cx = (M[0] + bate[0]) / 2, cy = Math.min(M[1], bate[1]) - amp, pts = [];
        for (let s = 0; s <= ext; s += 1 / 70) {
          const q = 1 - s, bx = q * q * M[0] + 2 * q * s * cx + s * s * bate[0], by = q * q * M[1] + 2 * q * s * cy + s * s * bate[1];
          pts.push([bx, by + Math.sin(s * 14 - e / 45) * 12 * s * (1 - s) * (e < at ? 1 : .35), s]);
        }
        for (const p of pts) dot(p[0], p[1], 6, "#122a14");
        pts.forEach((p, i) => { dot(p[0], p[1], 4, i % 6 === 5 ? G[1] : G[0]); dot(p[0], p[1] - 1, 2, G[2]); });
        pts.forEach((p, i) => { if (i % 7 === 3) { const s = i % 14 === 3 ? -1 : 1; dot(p[0] + 1, p[1] + s * 5, 3, G[2]); dot(p[0] + 3, p[1] + s * 6, 2, G[0]); } });   // folhinhas, um lado e o outro
        const tip = pts[pts.length - 1]; disc(tip[0], tip[1], 2, "#c9f2a8");
      }
      if (dt >= 0) {
        if (dt < 380) { x.globalAlpha = dt < 260 ? 1 : 1 - (dt - 260) / 120; const v = cl(dt / 130) * Math.PI * 3.2; anel(B[0], B[1], bw * .42, bh * .16, "#122a14", 4, Math.PI, Math.PI + v); anel(B[0], B[1], bw * .42, bh * .16, G[0], 2, Math.PI, Math.PI + v); x.globalAlpha = 1; }   // dá a volta no bicho
        if (dt < 120) { const L = 5 + 10 * (1 - dt / 120); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; seg(bate[0] - Math.cos(a) * L, bate[1] - Math.sin(a) * L, bate[0] + Math.cos(a) * L, bate[1] + Math.sin(a) * L, i % 2 ? 1 : 2, "#ffffff"); } }   // o estalo
        for (let i = 0; i < 13 * N; i++) {   // folhas voando
          const a = rr(i) * Math.PI * 2, sp = 40 + rr(i + 9) * 60, t = dt / 1000; if (dt > 560) break;
          const fx = bate[0] + Math.cos(a) * sp * t, fy = bate[1] + Math.sin(a) * sp * t + 90 * t * t, vira = Math.sin(dt / 60 + i) > 0;
          x.fillStyle = G[i % 3 === 0 ? 2 : 0]; x.fillRect(Math.round(fx), Math.round(fy), vira ? 3 : 2, vira ? 1 : 2);
        }
      }
    },
    raio(e) {
      const dt = e - at, Y = "#fff27a", escuro = e < at + 250 ? cl(e / 300) * .55 : .55 * (1 - cl((dt - 250) / 300));
      x.fillStyle = `rgba(8,10,36,${escuro})`; x.fillRect(0, 0, W, H);
      const raio = (seed, w, galhos) => {
        const x0 = B[0] + (rr(seed) - .5) * 34, n = 9, pts = [];
        for (let j = 0; j <= n; j++) pts.push([x0 + (B[0] - x0) * j / n + (j && j < n ? (rr(seed * 7 + j) - .5) * 26 : 0), -4 + (B[1] + 4) * j / n]);
        const risca = (P, ws) => { for (const [wd, c] of ws) for (let j = 0; j + 1 < P.length; j++) seg(P[j][0], P[j][1], P[j + 1][0], P[j + 1][1], wd, c); };
        if (galhos) for (const [j0, lado] of [[3, -1], [5, 1], [6, -1]].slice(0, weak ? 3 : 2)) {
          const g = [pts[j0]]; for (let q = 1; q <= 4; q++) g.push([g[q - 1][0] + lado * (6 + rr(seed + q * 3 + j0) * 8), g[q - 1][1] + 5 + rr(seed + q + j0) * 7]);
          risca(g, [[2, "#d8a80c"], [1, Y]]);
        }
        risca(pts, w > 1 ? [[5, "rgba(216,168,12,.55)"], [3, Y], [1, "#ffffff"]] : [[1, Y]]);
      };
      if (e < at) {   // a lança carrega: faíscas vindo para a ponta, e dois raios finos de aviso
        for (let i = 0; i < 12; i++) { const u = (e / 260 + rr(i)) % 1, a = rr(i + 3) * Math.PI * 2, r = (1 - u) * 28; dot(M[0] + Math.cos(a) * r, M[1] + Math.sin(a) * r, u > .7 ? 2 : 1, i % 2 ? Y : "#ffffff"); }
        disc(M[0], M[1], 2 + e / at * 3, Y); disc(M[0], M[1], 1 + e / at * 1.5, "#ffffff");
        if ((e > at - 200 && e < at - 160) || (e > at - 95 && e < at - 60)) raio(e > at - 100 ? 5 : 11, 1, false);
      } else {
        if (dt < 240) raio(20 + Math.floor(dt / 55), 3, true);
        if (dt < 70 || (weak && dt > 120 && dt < 170)) { x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(0, 0, W, H); }
        if (dt < 300) { x.globalAlpha = 1 - dt / 300; disc(B[0], B[1], 9 + dt / 30, Y); disc(B[0], B[1], 5 + dt / 50, "#ffffff"); x.globalAlpha = 1; }
        if (dt < 560) for (let i = 0; i < 6 * N; i++) {   // faíscas correndo pelo corpo
          if ((Math.floor(dt / 60) + i) % 2) continue;
          const a = rr(i) * Math.PI * 2 + dt / 90, px = B[0] + Math.cos(a) * bw * .45, py = B[1] + Math.sin(a) * bh * .4;
          seg(px, py, px + 3, py - 3, 1, Y); seg(px + 3, py - 3, px + 5, py + 1, 1, "#ffffff"); seg(px + 5, py + 1, px + 8, py - 2, 1, Y);
        }
      }
    },
    agua(e) {
      const A = ["#2a8ad8", "#86d6ff", "#d2f0ff", "#123a66"], dt = e - at, alto = 46 + Math.abs(B[0] - M[0]) * .12;
      if (e < 250) { const r = 2 + e / 250 * 5; disc(M[0], M[1], r + 1, A[3]); disc(M[0], M[1], r, A[0]); disc(M[0] - 1, M[1] - 1, r * .55, A[1]); dot(M[0] - 2, M[1] - 2, 1, "#ffffff"); }   // a água junta na cuia
      const cab = cl((e - 250) / (at - 250)), rabo = cl((e - 470) / (at - 250));
      if (cab > 0 && rabo < 1) {
        const pts = [];
        for (let s = rabo; s <= cab; s += .012) pts.push([M[0] + (B[0] - M[0]) * s, M[1] + (B[1] - M[1]) * s - Math.sin(s * Math.PI) * alto + Math.sin(s * 40 - e / 30) * 1.5, 3.4 + Math.sin(s * Math.PI) * 2 + (cab - s < .05 ? 2 : 0)]);
        for (const p of pts) disc(p[0], p[1], p[2] + 1.2, A[3]);
        for (const p of pts) disc(p[0], p[1], p[2], A[0]);
        pts.forEach((p, i) => { disc(p[0] - .5, p[1] - p[2] * .4, p[2] * .55, A[1]); if (i % 5 === 0) dot(p[0], p[1] - p[2] * .6, 1, "#ffffff"); });
        for (let i = 0; i < 8; i++) { const p = pts[Math.floor(rr(i + Math.floor(e / 90)) * pts.length)]; if (p) dot(p[0] + (rr(i + 2) - .5) * 14, p[1] + 4 + rr(i + 5) * 8, 1 + (i % 2), A[1 + i % 2]); }   // gotas soltas
      }
      if (dt >= 0) {
        if (dt < 180) { x.globalAlpha = 1 - dt / 180; anel(B[0], B[1], 4 + dt / 180 * 10, 4 + dt / 180 * 10, A[2], 2); x.globalAlpha = 1; }
        if (dt < 640) for (let i = 0; i < 16 * N; i++) {   // respingos em leque para cima
          const a = -Math.PI * (.1 + .8 * rr(i)), sp = 50 + rr(i + 5) * 70, t = dt / 1000;
          dot(B[0] + Math.cos(a) * sp * t, B[1] + Math.sin(a) * sp * t + 160 * t * t, i % 3 ? 2 : 3, A[i % 3]);
        }
        for (const d0 of [0, 130]) if (dt > d0 && dt < d0 + 480) { const u = (dt - d0) / 480, rx = 6 + u * bw * .6; x.globalAlpha = 1 - u; anel(B[0], pes - 2, rx, rx * .22, A[1], 1); x.globalAlpha = 1; }   // marola no chão
        if (dt > 150 && dt < 690) for (let i = 0; i < 5; i++) { const u = ((dt - 150) / 490 + rr(i + 2)) % 1; dot(B[0] + (rr(i) - .5) * bw * .6, B[1] + u * bh * .5, 1, A[1]); dot(B[0] + (rr(i) - .5) * bw * .6, B[1] + u * bh * .5 + 1, 1, A[2]); }   // o bicho pingando
      }
    },
    vento(e) {
      const V = ["#ffffff", "#cfeaf2", "#9ac8d8"], dt = e - at, fim = B[0] + 40;
      if (e < 240) for (let j = 0; j < 3; j++) for (let a = 0; a < 1.3; a += .16) { const an = e / 50 + j * 2.09 + a, r = 5 + a * 4; dot(M[0] + Math.cos(an) * r, M[1] + Math.sin(an) * r, 1, V[j % 2]); }   // redemoinho na mão
      for (let i = 0; i < 6; i++) {   // riscos de vento com um caracol no caminho
        const u = cl((e - 200 - i * 45) / 460); if (u <= 0 || e > at + 320) continue;
        const cab = sai(u) * 1.25, rabo = cab - .38, sc = .42 + (i % 3) * .13, off = (i - 2.5) * 7 + Math.sin(i * 2.1) * 4;
        for (let s = Math.max(0, rabo); s <= Math.min(cab, 1.25); s += .006) {
          const m = Math.min(1, s); let px = M[0] + (fim - M[0]) * s, py = M[1] + (B[1] - M[1]) * m + off * Math.sin(m * Math.PI * .9 + .3);
          if (Math.abs(s - sc) < .09) { const f = (s - sc + .09) / .18 * Math.PI * 2; px -= Math.sin(f) * 6; py -= (1 - Math.cos(f)) * 6; }
          x.globalAlpha = cl((s - rabo) / .38) * (e > at + 200 ? 1 - (e - at - 200) / 120 : 1);
          dot(px, py, cab - s < .06 ? 3 : 2, V[i % 2]);
        }
        x.globalAlpha = 1;
      }
      if (e > 200 && e < at + 250) for (let i = 0; i < 10; i++) { const s = (e / 500 + rr(i)) % 1; dot(M[0] + (fim - M[0]) * s, M[1] + (B[1] - M[1]) * s + (rr(i + 4) - .5) * 40 + Math.sin(e / 90 + i) * 3, 1, V[2]); }   // poeira e folhinhas levadas
      if (dt >= 0 && dt < 440) {
        x.globalAlpha = 1 - dt / 440;
        for (let j = 0; j < 2; j++) for (let a = 0; a < 2.3; a += .1) { const an = dt / 40 + j * Math.PI + a, r = 8 + dt / 440 * bw * .5; dot(B[0] + Math.cos(an) * r, B[1] + Math.sin(an) * r * .55, a > 1.6 ? 2 : 1, V[0]); }   // o redemoinho pega o bicho
        for (let i = 0; i < 5 * N; i++) { const py = B[1] + (rr(i) - .5) * bh * .8, x0 = B[0] + bw * .3 + dt * .1; seg(x0, py, x0 + 12 + rr(i + 3) * 14, py, 1, V[1]); }
        x.globalAlpha = 1;
      }
    },
    fire(e) {
      const F = ["#fff3a0", "#ffd23a", "#f2740c", "#d62828"], S0 = 800, dt = e - at;
      for (let i = 0; S0 + i * 14 < Math.min(e, at + 200); i++) {   // a labareda: cada chama nasce na tocha e cresce no caminho
        const age = e - (S0 + i * 14); if (age > 520) continue;
        const s = age / 520, wob = Math.sin(i * 1.7 + age / 60) * (3 + s * 7), px = M[0] + (B[0] - M[0]) * s, py = M[1] + (B[1] - M[1]) * s - Math.sin(s * Math.PI) * 10 + wob, r = 2 + s * 6.5 + rr(i) * 1.5, c = s < .25 ? 0 : s < .5 ? 1 : s < .75 ? 2 : 3;
        disc(px, py, r, F[c]); if (c > 0) disc(px - 1, py - 1, r * .5, F[c - 1]);
      }
      if (dt >= 0) {
        if (dt < 320) { const r = 6 + sai(dt / 320) * (weak ? 26 : 18); x.globalAlpha = dt < 220 ? 1 : 1 - (dt - 220) / 100; disc(B[0], B[1], r, F[3]); disc(B[0], B[1], r * .75, F[2]); disc(B[0], B[1] + 1, r * .5, F[1]); disc(B[0], B[1] + 2, r * .25, F[0]); x.globalAlpha = 1; }   // a bola de fogo
        if (dt > 150) for (let i = 0; i < 5; i++) { const u = cl((dt - 150 - i * 40) / 620); if (u <= 0 || u >= 1) continue; x.globalAlpha = .5 * (1 - u); disc(B[0] + (rr(i) - .5) * bw * .6, B[1] - u * 34 - i * 3, 4 + u * 4, "#3a3038"); x.globalAlpha = 1; }   // fumaça subindo
        for (let i = 0; i < 14 * N; i++) {   // brasas
          const vida = 500 + rr(i + 7) * 330; if (dt > vida) continue;
          const u = dt / vida; dot(B[0] + (rr(i) - .5) * bw * .8 + Math.sin(dt / 120 + i) * 3, B[1] + bh * .2 - dt / 1000 * (30 + rr(i + 3) * 40), u < .5 ? 2 : 1, F[u < .3 ? 0 : u < .6 ? 1 : u < .85 ? 2 : 3]);
        }
      }
    }
  };
  if (parado != null) { pinta[kind](parado); onda(parado - at); return at; }
  const t0 = performance.now(), fimT = ELEM_END[kind];
  const frame = now => {
    if (!cv.isConnected) return;
    const e = Math.max(0, now - t0);
    x.clearRect(0, 0, W, H);
    pinta[kind](e); onda(e - at);
    if (e < fimT) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
  // sons e o tranco do vento
  const som = (ms, id) => setTimeout(() => cv.isConnected && sfx(id), ms);
  if (kind === "cipo") som(at - 200, "planta");
  if (kind === "raio") { som(250, "choque"); som(at, "choque"); som(at + 90, "choque"); }
  if (kind === "agua") som(250, "agua");
  if (kind === "vento") { som(200, "vento"); setTimeout(() => cv.isConnected && $("beast").animate([{transform: "translateX(0)"}, {transform: `translateX(${weak ? 22 : 12}px)`, offset: .3}, {transform: "translateX(0)"}], {duration: 420, easing: "ease-out"}), at); }
  if (kind === "fire") { som(800, "fire"); som(1010, "fire"); som(1220, "fire"); }
  return at;
}

/* ---------- a mesma tela de pixel para os outros golpes (lança arremessada e Fúria) ----------
   golpeTela() põe o canvas por cima do palco e devolve os pincéis; T.roda(desenha, fim) chama desenha(ms) a cada quadro. */
function golpeTela() {
  const st = $("stage"); st.querySelectorAll(".elem-cine").forEach(c => c.remove());
  const cv = document.createElement("canvas"), sr = st.getBoundingClientRect(), k = Math.max(2, Math.round(sr.width / 360));
  cv.className = "elem-cine"; cv.width = Math.ceil(sr.width / k); cv.height = Math.ceil(sr.height / k); st.appendChild(cv);
  const x = cv.getContext("2d"), W = cv.width, H = cv.height;
  const T = {
    cv, x, W, H, k,
    em: (el, fx, fy) => { const r = el.getBoundingClientRect(); return [(r.left + r.width * fx - sr.left) / k, (r.top + r.height * fy - sr.top) / k]; },
    tam: el => { const r = el.getBoundingClientRect(); return [r.width / k, r.height / k]; },
    cl: u => Math.max(0, Math.min(1, u)), sai: u => 1 - (1 - u) ** 3,
    rr: i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); },
    dot: (px, py, s, c) => { x.fillStyle = c; x.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s); },
    disc: (px, py, r, c) => { x.fillStyle = c; for (let j = -Math.ceil(r); j <= r; j++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(Math.round(px) - w, Math.round(py) + j, w * 2 + 1, 1); } },
    seg: (x0, y0, x1, y1, w, c) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; x.fillStyle = c; for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w); },
    anel: (px, py, rx, ry, c, w = 1) => { const n = Math.ceil((rx + ry) * 1.6); for (let i = 0; i <= n; i++) { const a = Math.PI * 2 * i / n; T.dot(px + Math.cos(a) * rx, py + Math.sin(a) * ry, w, c); } },
    roda(desenha, fim, parado) {
      if (parado != null) { desenha(parado); return; }
      const t0 = performance.now(), frame = now => { if (!cv.isConnected) return; const e = Math.max(0, now - t0); x.clearRect(0, 0, W, H); x.globalAlpha = 1; desenha(e); if (e < fim) requestAnimationFrame(frame); else cv.remove(); };
      requestAnimationFrame(frame);
    }
  };
  return T;
}
/* jogar a lança: brilho na ponta enquanto ele ergue, um anel de ar na hora de soltar, a lança voa num arco baixo com rastro
   e riscos de velocidade, crava no bicho tremendo e solta lascas (ou passa por cima e some, se errou). Solta em THROW_SAI e
   acerta em THROW_AT; weak = ponto fraco, com rastro e anel dourados. */
const THROW_SAI = 330, THROW_AT = 590;
function throwFx(miss, weak, parado) {
  if (REDUCE && parado == null) return;
  const T = golpeTela(), {x, dot, seg, anel, cl, sai, rr, W} = T, M = T.em($("hero"), .86, .18), B = T.em($("beast"), .5, .5), [bw, bh] = T.tam($("beast")), [, hh] = T.tam($("hero"));
  const alvo = miss ? [W + 40, B[1] - bh * .9 - 12] : [B[0] - bw * .2, B[1]], sl = spearLook(), L = Math.max(18, Math.min(34, hh * .8)), OURO = "#ffd23a", cor = weak ? OURO : "#ffffff";
  const base = Math.atan2(alvo[1] - M[1], alvo[0] - M[0]);
  const lanca = (px, py, ang, alpha = 1) => {   // (px, py) = onde começa a ponta
    const c = Math.cos(ang), s = Math.sin(ang); x.globalAlpha = alpha;
    seg(px - c * L, py - s * L, px + c * 5, py + s * 5, 4, "#1a1426"); seg(px - c * L, py - s * L, px, py, 2, sl.p);
    dot(px - c * 3, py - s * 3, 3, sl.band || "#cfd8dc");
    for (let i = 0; i <= 5; i++) dot(px + c * i, py + s * i, i < 2 ? 3 : i < 4 ? 2 : 1, sl.m);
    x.globalAlpha = 1;
  };
  const em = u => [M[0] + (alvo[0] - M[0]) * u, M[1] + (alvo[1] - M[1]) * u - Math.sin(Math.min(1, u) * Math.PI) * 10, base + (.5 - Math.min(1, u)) * -.3];
  T.roda(e => {
    if (e > 120 && e < THROW_SAI) { const l = 2 + (e - 120) / 210 * 6, f = Math.floor(e / 45) % 2; seg(M[0] - l, M[1], M[0] + l, M[1], 1, cor); seg(M[0], M[1] - l, M[0], M[1] + l, 1, cor); if (f) { seg(M[0] - l * .5, M[1] - l * .5, M[0] + l * .5, M[1] + l * .5, 1, cor); seg(M[0] - l * .5, M[1] + l * .5, M[0] + l * .5, M[1] - l * .5, 1, cor); } }   // brilho na ponta
    if (e < THROW_SAI) return;
    const v = e - THROW_SAI, u = v / (THROW_AT - THROW_SAI);
    if (v < 200) { x.globalAlpha = 1 - v / 200; anel(M[0], M[1], 3 + sai(v / 200) * 16, 2 + sai(v / 200) * 9, "#ffffff", 1); x.globalAlpha = 1; }   // o ar na hora de soltar
    if (u < 1 || (miss && u < 2.2)) {
      const [px, py, ang] = em(u), c = Math.cos(ang), s = Math.sin(ang);
      for (let i = 0; i < 6; i++) { const o = (i - 2.5) * 3, d0 = L + 4 + (i % 3) * 5, l = 10 + rr(i) * 14; x.globalAlpha = .65; seg(px - c * d0 - s * o, py - s * d0 + c * o, px - c * (d0 + l) - s * o, py - s * (d0 + l) + c * o, 1, i % 2 ? cor : "#ffffff"); }   // riscos de velocidade
      for (let g = 4; g >= 1; g--) { const q = u - g * .07; if (q > 0) { const [gx, gy, ga] = em(q); lanca(gx, gy, ga, .34 - g * .07); } }   // rastro
      lanca(px, py, ang);
    }
    if (!miss && e >= THROW_AT) {
      const dt = e - THROW_AT, treme = base + Math.sin(dt / 22) * .14 * Math.max(0, 1 - dt / 260);
      if (dt < 420) lanca(alvo[0] + Math.cos(base) * 3, alvo[1] + Math.sin(base) * 3, treme, dt < 260 ? 1 : 1 - (dt - 260) / 160);   // cravada, tremendo
      if (dt < 220) {
        const q = sai(dt / 220); x.globalAlpha = 1 - dt / 220;
        anel(alvo[0], alvo[1], 4 + q * 18, 4 + q * 18, "#ffffff", 2); if (weak) anel(alvo[0], alvo[1], 6 + q * 30, 6 + q * 30, OURO, 2);
        for (let i = 0; i < (weak ? 12 : 8); i++) { const a = i / (weak ? 12 : 8) * Math.PI * 2 + .2, r0 = 6 + q * 14; seg(alvo[0] + Math.cos(a) * r0, alvo[1] + Math.sin(a) * r0, alvo[0] + Math.cos(a) * (r0 + 7), alvo[1] + Math.sin(a) * (r0 + 7), 1, i % 2 ? cor : "#ffffff"); }
        x.globalAlpha = 1;
      }
      if (dt < 460) for (let i = 0; i < 9; i++) { const a = Math.PI + (rr(i) - .5) * 2.2, sp = 40 + rr(i + 4) * 50, t = dt / 1000; dot(alvo[0] + Math.cos(a) * sp * t, alvo[1] + Math.sin(a) * sp * t + 140 * t * t, i % 3 ? 1 : 2, i % 2 ? "#d9b25a" : "#ffffff"); }   // lascas
    }
  }, miss ? THROW_SAI + 620 : THROW_AT + 480, parado);
}
/* Fúria: o palco escurece avermelhado, riscos de velocidade na corrida, brasas subindo, e cada estocada risca um corte em
   meia-lua no bicho (de cima para baixo, de baixo para cima, um anel no giro); o último são duas meias-luas cruzadas, estrela
   e uma onda dourada. Chamado junto com o estado "fury" do HERO_A, nos mesmos tempos (FURY_LEAD, FURY_GAP). n = quantos golpes. */
function furyFx(n, parado) {
  if (REDUCE && parado == null) return;
  const T = golpeTela(), {x, dot, disc, seg, anel, cl, sai, rr, W, H} = T, Hm = T.em($("hero"), .5, .55), B = T.em($("beast"), .5, .5), [bw, bh] = T.tam($("beast")), [, hh] = T.tam($("hero"));
  const pes = B[1] + bh / 2, OURO = "#ffd23a", total = FURY_LEAD + FURY_GAP * (n - 1) + 520, R0 = Math.max(bw, bh);
  const corte = (cx, cy, R, a0, a1, th, rev, c1, c2) => {   // meia-lua: mais grossa no meio, miolo c1 e fio de fora c2
    const fim = a0 + (a1 - a0) * rev, st = (a1 > a0 ? 1 : -1) / R;
    for (let a = a0; (a1 > a0 ? a <= fim : a >= fim); a += st) { const w = Math.max(1, th * Math.sin(Math.PI * (a - a0) / (a1 - a0))); for (let r = R - w; r <= R; r++) dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .9, 1, r > R - 1.5 ? c2 : c1); }
  };
  T.roda(e => {
    const veu = e < total - 250 ? cl(e / 150) * .38 : .38 * (1 - cl((e - (total - 250)) / 250));
    x.fillStyle = `rgba(44,6,10,${veu})`; x.fillRect(0, 0, W, H);
    if (e < FURY_LEAD + 80) {   // a corrida: riscos passando e poeira no rastro
      x.globalAlpha = .75 * (1 - cl((e - FURY_LEAD + 60) / 140));
      for (let i = 0; i < 10; i++) { const y = Hm[1] - hh * .45 + rr(i) * hh * .9, xx = Hm[0] - 16 + (B[0] - bw * .5 - Hm[0]) * cl(e / 200) - ((e * .5 + rr(i + 2) * 90) % 90); seg(xx, y, xx + 14 + rr(i) * 16, y, 1, i % 3 ? "#ffffff" : OURO); }
      for (let i = 0; i < 5; i++) { const u = cl((e - i * 35) / 260); if (u > 0 && u < 1) { x.globalAlpha = .5 * (1 - u); disc(Hm[0] + (B[0] - bw * .6 - Hm[0]) * i / 5, Hm[1] + hh * .42 - u * 5, 2 + u * 4, "#d8d2c0"); } }
      x.globalAlpha = 1;
    }
    if (e > FURY_LEAD - 100 && e < total - 150) for (let i = 0; i < 14; i++) {   // brasas da fúria
      const u = (e / 700 + rr(i)) % 1; x.globalAlpha = 1 - u;
      dot(B[0] - bw * .6 + (rr(i + 1) - .5) * bw * 1.7 + Math.sin(e / 100 + i) * 2, pes - u * bh * 1.3, u < .5 ? 2 : 1, [OURO, "#f2740c", "#e5001c"][i % 3]);
    }
    x.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const dt = e - (FURY_LEAD + i * FURY_GAP); if (dt < 0 || dt > 320) continue;
      const last = i === n - 1, giro = n >= 4 && i === n - 2, rev = cl(dt / 110), R = R0 * (last ? .78 : .6), cx = B[0] + R * .3, toque = [cx - R, B[1]];
      x.globalAlpha = dt < 160 ? 1 : 1 - (dt - 160) / 160;
      if (giro) { corte(B[0], B[1], R * 1.15, Math.PI * .1, Math.PI * 2.1, 5, rev, "#ffffff", "#bff3ff"); }
      else if (last) {
        corte(cx, B[1] - 2, R, Math.PI + 1, Math.PI - 1, 9, rev, "#ffffff", OURO); corte(cx + 3, B[1] + 2, R * .92, Math.PI - 1.05, Math.PI + 1.05, 7, cl((dt - 40) / 110), "#fff2a0", "#e5001c");
        const q = sai(cl(dt / 260));
        anel(B[0], B[1], 6 + q * R0 * .9, 6 + q * R0 * .9, OURO, 2); anel(B[0], B[1], 4 + q * R0 * .6, 4 + q * R0 * .6, "#ffffff", 1);
        for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2 + .26, r0 = 8 + q * R0 * .5; seg(B[0] + Math.cos(a) * r0, B[1] + Math.sin(a) * r0, B[0] + Math.cos(a) * (r0 + 10), B[1] + Math.sin(a) * (r0 + 10), j % 2 ? 1 : 2, j % 2 ? "#ffffff" : OURO); }
        if (dt < 55) { x.globalAlpha = .5; x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H); }
      } else if (i % 2) corte(cx, B[1] + 4, R * .95, Math.PI - .95, Math.PI + .95, 7, rev, "#ffffff", OURO);   // de baixo para cima
      else corte(cx, B[1] - 3, R, Math.PI + .95, Math.PI - .95, 7, rev, "#ffffff", OURO);                         // de cima para baixo
      x.globalAlpha = 1;
      if (dt < 240) for (let j = 0; j < (last ? 12 : 6); j++) { const a = Math.PI + (rr(i * 9 + j) - .5) * 2.4, sp = 50 + rr(j + 3) * 70, t = dt / 1000; dot(toque[0] + Math.cos(a) * sp * t, toque[1] + Math.sin(a) * sp * t + 120 * t * t, j % 3 ? 1 : 2, j % 2 ? OURO : "#ffffff"); }   // faíscas
    }
  }, total, parado);
}

/* Observar: o palco escurece um pouco, uma linha pontilhada vai dos olhos do Rhanon até o bicho, quatro cantoneiras fecham
   em volta dele enquanto uma faixa de luz o percorre e, quando travam (OBS.trava), aparece o que ele previu: o vulto claro
   do bicho dando o bote que vem, duas vezes, e uma estrela dourada no ponto fraco (o próximo ataque sai crítico).
   id = o bicho (para o vulto, com o quadro de ataque de gfx/beasts.js); sem desenho, fica só a mira. */
const OBS = {mira: 300, trava: 650, fim: 1300};
function observeFx(id, parado) {
  if (REDUCE && parado == null) return;
  const T = golpeTela(), {x, dot, seg, anel, cl, sai, W, H} = T, O = T.em($("hero"), .6, .2), B = T.em($("beast"), .5, .5), [bw, bh] = T.tam($("beast")), AZ = "#bfe8ff", OURO = "#ffd23a";
  let vulto = null;   // o bicho no quadro do bote, todo claro
  try {
    const fr = beastFrame(id, "attack", 0, false);
    if (fr) { vulto = document.createElement("canvas"); vulto.width = fr.width; vulto.height = fr.height; const g = vulto.getContext("2d"); g.drawImage(fr, 0, 0); g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(200,232,255,.85)"; g.fillRect(0, 0, fr.width, fr.height); }
  } catch (_) {}
  const canto = (cx, cy, sx, sy, L, c) => { seg(cx, cy, cx + sx * L, cy, 2, c); seg(cx, cy, cx, cy + sy * L, 2, c); };
  T.roda(e => {
    const veu = e < OBS.fim - 250 ? cl(e / 200) * .3 : .3 * (1 - cl((e - (OBS.fim - 250)) / 250));
    x.fillStyle = `rgba(6,14,30,${veu})`; x.fillRect(0, 0, W, H);
    // o olhar: pontilhado correndo dos olhos até o bicho
    if (e < OBS.trava + 150) { const n = 16, ate = cl(e / OBS.mira); x.globalAlpha = e < OBS.trava ? 1 : 1 - (e - OBS.trava) / 150; for (let i = 0; i < n; i++) { const s = (i + (e / 90) % 1) / n; if (s <= ate) dot(O[0] + (B[0] - O[0]) * s, O[1] + (B[1] - O[1]) * s, i % 4 === 0 ? 2 : 1, AZ); } x.globalAlpha = 1; }
    // cantoneiras fechando em volta do bicho
    if (e > OBS.mira - 100) {
      const u = sai(cl((e - (OBS.mira - 100)) / (OBS.trava - OBS.mira + 100))), abre = 1 + (1 - u) * 1.3, hw = bw * .5 * abre + 3, hh = bh * .5 * abre + 3, travou = e >= OBS.trava;
      const pisca = travou && e < OBS.trava + 220 && Math.floor((e - OBS.trava) / 55) % 2 === 0, c = pisca ? "#ffffff" : travou ? OURO : AZ;
      x.globalAlpha = e > OBS.fim - 200 ? cl((OBS.fim - e) / 200) : 1;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) canto(B[0] + sx * hw, B[1] + sy * hh, -sx, -sy, 6, c);
      if (!travou) { const sy = B[1] - bh * .5 + ((e - OBS.mira + 100) / 260 % 1) * bh; x.globalAlpha = .55; seg(B[0] - bw * .5, sy, B[0] + bw * .5, sy, 1, "#ffffff"); x.globalAlpha = .25; seg(B[0] - bw * .5, sy - 2, B[0] + bw * .5, sy - 2, 2, AZ); }   // a faixa de luz percorrendo o bicho
      x.globalAlpha = 1;
    }
    if (e >= OBS.trava) {
      const dt = e - OBS.trava;
      if (dt < 180) { x.globalAlpha = 1 - dt / 180; anel(B[0], B[1], 6 + sai(dt / 180) * bw * .6, 6 + sai(dt / 180) * bw * .6, "#ffffff", 1); x.globalAlpha = 1; }
      // o golpe previsto: o vulto do bicho dá o bote na direção do Rhanon e some, duas vezes
      if (vulto) for (const t0 of [60, 300]) {
        const v = cl((dt - t0) / 260); if (v <= 0 || v >= 1) continue;
        const q = sai(v) * .34; x.globalAlpha = .5 * (1 - v); x.imageSmoothingEnabled = false;
        x.drawImage(vulto, Math.round(B[0] - bw / 2 + (O[0] - B[0]) * q), Math.round(B[1] - bh / 2 + (O[1] + 20 - B[1]) * q), Math.round(bw), Math.round(bh));
        x.globalAlpha = 1;
      }
      // o ponto fraco: estrela dourada pulsando
      if (dt < OBS.fim - OBS.trava - 100) { const l = 3 + Math.abs(Math.sin(dt / 110)) * 4, px = B[0] - bw * .12, py = B[1] - bh * .08; seg(px - l, py, px + l, py, 1, OURO); seg(px, py - l, px, py + l, 1, OURO); dot(px, py, 2, "#ffffff"); }
    }
  }, OBS.fim, parado);
}

/* comer um item na batalha: a comida aparece na mão, do lado do rosto, e some em três mordidas com farelo caindo; depois
   dois anéis de luz sobem pelo corpo e sinais de "+" flutuam (verde = PV, azul = PE). Junto com o estado "eat" do HERO_A. */
const EAT_MS = 1150;
function eatFx(pe, parado) {
  if (REDUCE && parado == null) return;
  const T = golpeTela(), {x, dot, disc, seg, anel, cl, rr} = T, M = T.em($("hero"), .36, .47), C = T.em($("hero"), .5, .55), [hw, hh] = T.tam($("hero"));
  const cor = pe ? ["#8a4ab0", "#b88ad8", "#5a2a7a"] : ["#e8b060", "#ffd9a0", "#a8702a"], luz = pe ? ["#86d6ff", "#ffffff"] : ["#7dff9a", "#ffffff"], pes = C[1] + hh * .42;
  T.roda(e => {
    if (e > 110 && e < 700) {   // a comida, menor a cada mordida
      const n = e < 250 ? 0 : Math.min(3, 1 + Math.floor((e - 250) / 150)), r = 3.4 - n * .9;
      if (r > .6) { disc(M[0] - 3, M[1], r + 1, "#241426"); disc(M[0] - 3, M[1], r, cor[0]); dot(M[0] - 4, M[1] - 1, 1, cor[1]); }
      for (let j = 0; j < 3; j++) { const dt = e - (250 + j * 150); if (dt < 0 || dt > 260) continue; for (let i = 0; i < 4; i++) { const t = dt / 1000; dot(M[0] - 3 + (rr(i + j * 5) - .6) * 60 * t, M[1] + 2 + 120 * t * t - 20 * t, 1, cor[i % 3]); } }   // farelo
    }
    if (e > 620) {
      const dt = e - 620;
      for (const d0 of [0, 170]) { const u = cl((dt - d0) / 380); if (u <= 0 || u >= 1) continue; x.globalAlpha = 1 - u * .7; anel(C[0], pes - u * hh * .85, hw * .34, 2, luz[0], 1); x.globalAlpha = 1; }   // anéis subindo
      for (let i = 0; i < 6; i++) {   // "+" flutuando
        const u = cl((dt - i * 55) / 420); if (u <= 0 || u >= 1) continue;
        const px = C[0] + (rr(i) - .5) * hw * .7, py = C[1] + hh * .1 - u * hh * .55; x.globalAlpha = 1 - u;
        seg(px - 2, py, px + 2, py, 1, luz[i % 2]); seg(px, py - 2, px, py + 2, 1, luz[i % 2]); x.globalAlpha = 1;
      }
    }
  }, EAT_MS, parado);
}
/* defender: um escudo de luz em arco na frente do Rhanon (do lado do bicho), que acende com um clarão, cintila e apaga, e a
   poeira dos pés firmando no chão. curto = só o lampejo (quando a guarda segura um golpe). */
function guardFx(curto, parado) {
  if (REDUCE && parado == null) return;
  const T = golpeTela(), {x, dot, disc, cl, sai, rr} = T, C = T.em($("hero"), .5, .5), [hw, hh] = T.tam($("hero")), R = hh * .58, fim = curto ? 380 : 760;
  T.roda(e => {
    const abre = sai(cl(e / 140)), some = e > fim - 220 ? cl((fim - e) / 220) : 1, a0 = -1.5, a1 = .45;
    for (let a = a0; a <= a0 + (a1 - a0) * abre; a += 1 / R) {   // o arco: borda clara, miolo azul e um véu por dentro
      const px = C[0] + Math.cos(a) * R, py = C[1] + Math.sin(a) * R * .95, k = Math.sin(Math.PI * (a - a0) / (a1 - a0));
      x.globalAlpha = some * (e < 90 ? 1 : .85); dot(px, py, 2, e < 90 ? "#ffffff" : "#bff3ff");
      x.globalAlpha = some * .5; dot(px - Math.cos(a) * 2, py - Math.sin(a) * 2, 2, "#5ab8e8");
      if (k > .3 && (Math.round(a * R) % 3 === 0)) { x.globalAlpha = some * .22; dot(px - Math.cos(a) * 5, py - Math.sin(a) * 5, 2, "#bff3ff"); }
    }
    for (let i = 0; i < 4; i++) { const a = a0 + (a1 - a0) * ((e / 520 + i / 4) % 1); x.globalAlpha = some; dot(C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R * .95, 2, "#ffffff"); dot(C[0] + Math.cos(a) * (R + 2), C[1] + Math.sin(a) * (R + 2) * .95, 1, "#ffffff"); }   // cintilar correndo pelo arco
    if (!curto && e < 380) for (let i = 0; i < 6; i++) { const u = e / 380; x.globalAlpha = .55 * (1 - u); disc(C[0] + (i - 2.5) * hw * .16 + (rr(i) - .5) * 4, C[1] + hh * .44 - u * 4, 1.5 + u * 2.5, "#d8d2c0"); }   // poeira dos pés
    x.globalAlpha = 1;
  }, fim, parado);
}
