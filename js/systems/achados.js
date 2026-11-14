/* Achados das trilhas: coisas no cenário para quebrar, cortar e derrubar, com a cara de cada região.
   - No chão (lança ou flecha quebra): potes, cestos, balaios, cabaças e caixotes (ACH_REG[região].chao).
   - Mato alto (",") que a lança corta: o tufo some (o quadrado vira chão) e às vezes sai um trocado.
   - Pendurado numa árvore (só a flecha derruba): cacho de açaí, cabaça, ramo de guaraná, ramo de café ou pinha. Balança
     bem pouco; com chuva, garoa ou ventania o vento empurra mais, inclusive na queda (achVento).
   Só nas trilhas (nada de quebrar a casa e o ganha-pão de ninguém nas fases seguras). Os lugares são escolhidos ao entrar na
   fase, sempre os mesmos (semente pelo nome da fase, como os recantos de secrets.js), sem mexer no stages.js, e não
   bloqueiam o caminho. O que cai vai para EX.loot (moeda, item da bolsa ou lembrança) e entra na bolsa quando o Rhanon passa
   por cima (pickLoot em explore.js). Dinheiro só na primeira entrada do dia em cada fase (G.achados[fase] = dia). */
const ACH_REG = {
  norte:      {chao: ["pote_marajoara", "cesto"], pend: "acai", fruta: "acai", comida: ["mandioca", "acai"]},
  nordeste:   {chao: ["pote_barro", "balaio"], pend: "cabaca", fruta: "cajuina", comida: ["tapioca", "cajuina"]},
  centroeste: {chao: ["cabaca_chao", "cesto"], pend: "guarana", fruta: "guarana", comida: ["pamonha", "guarana"]},
  sudeste:    {chao: ["caixote", "cesto"], pend: "cafe", fruta: "cafe", comida: ["pao_queijo", "cafe"]},
  sul:        {chao: ["caixote_erva", "cesto"], pend: "pinha", fruta: "pinhao", comida: ["chipa", "pinhao"]}
};
const ACH_ROPE = 4;   // quanto o pendurado fica abaixo da copa (pixels)
// cores dos cacos de cada objeto quebrado (as duas primeiras são o material)
const ACH_CACO = {pote_marajoara: ["#d89a5a", "#b8743a", "#2a1a12", "#f4ecd8"], pote_barro: ["#c8804a", "#a05a30", "#e0a070"], cesto: ["#e0c070", "#b89040"],
  balaio: ["#d8b060", "#9a7030", "#e0302a"], cabaca_chao: ["#d8b860", "#a88838"], caixote: ["#c89a60", "#9a7040"], caixote_erva: ["#c89a60", "#9a7040", "#3a7a3a"]};

/* ----- desenho (pixel art 14x16 com contorno automático; chão = ancorado embaixo no meio, pendurado = no alto no meio) ----- */
const ACH_ART = {};
const ACH_DRAW = {
  pote_marajoara: (R, E) => { E(7, 10.5, 5, 4.5, "#d89a5a"); E(8.6, 11.8, 3.4, 3, "#b8743a"); E(5, 8.4, 1.2, 1.4, "#f0c088"); R(5, 4, 4, 2, "#b8743a"); R(4, 3, 6, 1, "#d89a5a");
    R(3, 8, 9, 1, "#2a1a12"); for (let x = 3; x < 12; x += 2) R(x, 9, 1, 1, "#f4ecd8"); R(3, 10, 9, 1, "#2a1a12"); },   // a faixa de grafismo marajoara
  pote_barro: (R, E) => { E(7, 10.5, 5, 4.5, "#c8804a"); E(8.6, 11.8, 3.4, 3, "#a05a30"); E(5, 8.4, 1.2, 1.4, "#e8a878"); R(5, 4, 4, 2, "#a05a30"); R(4, 3, 6, 1, "#c8804a"); R(3, 9, 9, 1, "#e0a070"); },
  cesto: (R, E) => { R(2, 7, 11, 8, "#e0c070"); for (let y = 8; y < 15; y += 2) R(2, y, 11, 1, "#b89040"); for (let x = 4; x < 13; x += 3) R(x, 7, 1, 8, "#c8a050"); R(1, 6, 13, 2, "#a87a34");
    R(4, 3, 1, 3, "#a87a34"); R(10, 3, 1, 3, "#a87a34"); R(5, 2, 5, 1, "#a87a34"); },   // cesto de palha com alça
  balaio: (R, E) => { R(1, 9, 12, 6, "#d8b060"); for (let y = 10; y < 15; y += 2) R(1, y, 12, 1, "#a8803a"); R(0, 8, 14, 2, "#9a7030"); E(5, 7, 2, 1.6, "#e0302a"); E(9, 7, 2, 1.6, "#f2c230"); E(7, 6, 1.6, 1.4, "#5fae52"); },
  cabaca_chao: (R, E) => { E(7, 11.5, 4.5, 3.5, "#d8b860"); E(7, 6.5, 2.5, 2.5, "#d8b860"); R(5, 8, 1, 7, "#a88838"); R(9, 8, 1, 7, "#a88838"); E(8.5, 12.5, 2.4, 2, "#b89848"); R(7, 3, 1, 2, "#6a5420"); },
  caixote: (R, E) => { R(1, 6, 12, 9, "#c89a60"); R(1, 9, 12, 1, "#9a7040"); R(1, 12, 12, 1, "#9a7040"); R(1, 6, 2, 9, "#a87a48"); R(11, 6, 2, 9, "#a87a48"); R(3, 6, 8, 1, "#e0b880"); },
  caixote_erva: (R, E) => { ACH_DRAW.caixote(R, E); R(4, 9, 6, 3, "#3a7a3a"); R(6, 10, 2, 1, "#8fd06a"); },   // caixote de erva-mate com o rótulo
  // pendurados: o cabinho começa no alto, no meio (é ali que a corda prende)
  acai: (R, E) => { R(7, 0, 1, 4, "#6a8a3a"); R(5, 3, 5, 1, "#6a8a3a"); for (const [x, y] of [[5, 6], [8, 6], [6.5, 8.5], [9.5, 8.5], [4, 9], [7, 11], [5.5, 12.5], [8.5, 12.5], [7, 14]]) { E(x, y, 1.6, 1.6, "#4a1e5a"); R(Math.round(x - 1), Math.round(y - 1), 1, 1, "#9a5aaa"); } },
  cabaca: (R, E) => { R(7, 0, 1, 3, "#a88a5a"); E(7, 5.5, 2.4, 2.4, "#d8b860"); E(7, 11, 4, 3.6, "#d8b860"); R(5, 9, 1, 5, "#a88838"); R(9, 9, 1, 5, "#a88838"); E(8.4, 12, 2, 1.8, "#b89848"); },
  guarana: (R, E) => { R(7, 0, 1, 3, "#5a7a2a"); for (const [x, y] of [[4.5, 6], [9.5, 6], [7, 9], [4, 11.5], [10, 11.5], [7, 13.5]]) { E(x, y, 2, 2, "#d8302a"); R(Math.round(x - 1), Math.round(y - 1), 2, 2, "#f4ecd8"); R(Math.round(x - .5), Math.round(y - .5), 1, 1, "#1a1426"); } },   // o "olho" do guaraná
  cafe: (R, E) => { R(7, 0, 1, 14, "#6a4a2a"); E(3, 5, 2.6, 1.2, "#3a7a3a"); E(11, 7, 2.6, 1.2, "#3a7a3a"); for (const [x, y, c] of [[5, 8, "#d8302a"], [9, 9, "#d8302a"], [5, 11, "#b82020"], [9, 12, "#5fae52"], [6, 14, "#d8302a"], [8.5, 15, "#d8302a"]]) E(x, y, 1.4, 1.4, c); },
  pinha: (R, E) => { R(7, 0, 1, 3, "#5a3418"); E(7, 9, 4.5, 5.6, "#8a5a30"); for (let y = 5; y < 15; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 11; x += 2) R(x, y, 1, 1, "#5a3418"); E(5.5, 7.5, 1.2, 1.6, "#b07a48"); }
};
function achArt(kind) {
  if (ACH_ART[kind]) return ACH_ART[kind];
  const W = 14, H = 16, g = Array.from({length: H}, () => new Array(W).fill(null));
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = Math.round(x) + i, Y = Math.round(y) + j; if (X >= 0 && Y >= 0 && X < W && Y < H) g[Y][X] = c; } };
  const E = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry; if (u * u + v * v <= 1) R(x, y, 1, 1, c); } };
  ACH_DRAW[kind](R, E);
  const cv = document.createElement("canvas"); cv.width = W + 2; cv.height = H + 2; const x = cv.getContext("2d");
  const tem = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && g[Y][X];
  for (let Y = -1; Y <= H; Y++) for (let X = -1; X <= W; X++) {   // contorno escuro em volta de tudo (1 pixel de margem no canvas)
    const c = tem(X, Y) || ((tem(X - 1, Y) || tem(X + 1, Y) || tem(X, Y - 1) || tem(X, Y + 1)) && OUTLINE);
    if (c) { x.fillStyle = c; x.fillRect(X + 1, Y + 1, 1, 1); }
  }
  return ACH_ART[kind] = cv;
}

/* ----- lugares (ao entrar numa trilha; startExplore) ----- */
function achSetup(zone) {
  EX.ach = []; EX.rows = EX.rows.slice();   // cópia: cortar o mato muda as linhas desta visita, nunca as do STAGES
  if (EX.st.safe) return;
  const reg = regionOfCity(cityOf(zone)) || "norte", R = ACH_REG[reg] || ACH_REG.norte, cidade = polishBiome(EX.pal) === "cidade";
  const rows = EX.rows, H = rows.length, W = rows[0].length, at = (x, y) => (rows[y] || "")[x] || "";
  let k = [...zone].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 11);
  const rng = () => seeded(k++);
  const busy = (x, y) => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if ("SEGBFYJ".includes(at(x + i, y + j) || "_")) return true; return false; };
  const solid = ch => ch === "T" || ch === "#", chao = [], pend = [], chega = stageReach(rows), alcanca = (x, y) => chega.has(x + "," + y);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = at(x, y);
    if ((c === "." || c === ",") && alcanca(x, y) && !busy(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => solid(at(x + i, y + j)))) chao.push([x, y]);   // na beira do mato
    if (c === "T" && ".,-".includes(at(x, y + 1) || "_") && alcanca(x, y + 1) && !busy(x, y + 1)) pend.push([x, y]);   // galho em cima de onde se anda
  }
  const pick = (list, n, gap, longe = []) => {
    const out = []; let tries = 0;
    while (out.length < n && list.length && tries++ < 500) {
      const p = list[Math.floor(rng() * list.length)];
      if (out.concat(longe).every(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) >= gap)) out.push(p);
    }
    return out;
  };
  const area = W * H, kinds = cidade ? ["caixote"] : R.chao;
  const nos = pick(chao, Math.max(4, Math.min(9, Math.round(area / 110))), 4);
  nos.forEach(([tx, ty], i) => EX.ach.push({kind: kinds[i % kinds.length], tx, ty, x: tx * TILE + 8, y: ty * TILE + 13}));
  if (!cidade) pick(pend, Math.max(2, Math.min(4, Math.round(area / 260))), 5, nos).forEach(([tx, ty]) =>
    EX.ach.push({kind: R.pend, pend: true, tx, ty, ax: tx * TILE + 8, ay: ty * TILE + 12, ground: (ty + 1) * TILE + 12, seed: rng() * 6.28}));
  vit(); EX.achMoney = G.achados[zone] !== G.day; G.achados[zone] = G.day; save();   // dinheiro: só na primeira entrada do dia
  EX.achReg = R;
}

/* ----- vento: com chuva, garoa ou ventania o pendurado balança mais e a queda é empurrada ----- */
const ACH_VENTO = {chuva: .7, garoa: .4, ventania: 1};
const achVento = () => ACH_VENTO[weatherNow()] || 0;
function achSwing(o, now) {   // deslocamento de lado do pendurado (pixels)
  const v = achVento(), a = Math.sin(now / 1100 + o.seed) * .05 + v * (.1 + .08 * Math.sin(now / 380 + o.seed * 2));
  return Math.sin(a) * (ACH_ROPE + 9);
}

/* ----- golpes ----- */
// lança (exStrike, quando não pegou bicho): quebra o objeto ao alcance ou corta o mato na frente dos pés
function achStrike(h) {
  if (!EX.ach) return false;
  const pts = [8, 15, 22].map(r => [h.x + h.aim.x * r, h.y - 8 + h.aim.y * r]);
  const o = EX.ach.find(q => !q.broken && !q.pend && pts.some(([px, py]) => Math.hypot(q.x - px, q.y - 6 - py) < 9));
  if (o) { achBreak(o); return true; }
  const feitos = new Set();
  for (const r of [9, 16]) {
    const tx = Math.floor((h.x + h.aim.x * r) / TILE), ty = Math.floor((h.y - 2 + h.aim.y * r) / TILE), key = tx + "," + ty;
    if (!feitos.has(key) && stageTile(tx, ty) === ",") { feitos.add(key); achCut(tx, ty); }
  }
  return feitos.size > 0;
}
// flecha (exUpdate, a cada passo da flecha): derruba o pendurado ou quebra o objeto do chão que ela atravessa
function achArrow(s, now) {
  if (!EX.ach) return false;
  const o = EX.ach.find(q => !q.broken && !q.fall && (q.pend ? Math.hypot(q.ax + achSwing(q, now) - s.x, q.ay + ACH_ROPE + 8 - s.y) < 8 : Math.hypot(q.x - s.x, q.y - 6 - s.y) < 8));
  if (!o) return false;
  if (o.pend) { o.fall = {x: o.ax + achSwing(o, now), y: o.ay + ACH_ROPE, vx: 0, vy: -20}; sfx("corte"); exBurst(o.ax, o.ay + 2, ["#5fae52", "#8fd06a"], 5); }   // a corda arrebenta
  else achBreak(o);
  return true;
}
function achBreak(o) {
  o.broken = true; sfx("quebra");
  const cols = ACH_CACO[o.kind] || ["#c89a60", "#9a7040"];
  for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, v = 25 + Math.random() * 45; EX.fx.push({x: o.x + (Math.random() - .5) * 8, y: o.y - 6, vx: Math.cos(a) * v, vy: -30 - Math.random() * 40, life: .45 + Math.random() * .3, col: cols[i % cols.length], g: 160}); }
  o.cacos = Array.from({length: 6}, (_, i) => [Math.round((Math.random() - .5) * 12), Math.round((Math.random() - .5) * 5), cols[i % cols.length]]);   // caquinhos que ficam no chão
  achLoot(o.x, o.y, "chao");
}
function achCut(tx, ty) {
  const r = EX.rows[ty]; EX.rows[ty] = r.slice(0, tx) + "." + r.slice(tx + 1);   // o tufo sai; o quadrado vira chão
  sfx("corte");
  for (let i = 0; i < 9; i++) EX.fx.push({x: tx * TILE + 3 + Math.random() * 10, y: ty * TILE + 8 + Math.random() * 6, vx: (Math.random() - .5) * 50, vy: -30 - Math.random() * 30, life: .5, col: i % 2 ? "#5fae52" : "#8fd06a", g: 120});
  achLoot(tx * TILE + 8, ty * TILE + 12, "mato");
}
// o que cai: trocados (só na primeira entrada do dia), comida da região ou uma lembrança comum dos bichos da trilha
function achLoot(x, y, de) {
  const R = EX.achReg || ACH_REG.norte, r = Math.random(), lv = G.lv || 1;
  const moeda = k => ({kind: "moeda", n: Math.max(1, Math.round((2 + lv * (.2 + Math.random() * .4)) * k))});
  let d = null;
  if (de === "mato") { if (r < .12 && EX.achMoney) d = moeda(.4); }
  else if (r < .45 && EX.achMoney) d = moeda(1);
  else if (r < .72) d = {kind: "item", id: R.comida[Math.floor(Math.random() * R.comida.length)]};
  else if (r < .87) { const pool = zoneDef(EX.zone).pool || []; const p = pool[Math.floor(Math.random() * pool.length)]; if (p) d = {id: p[0]}; }
  if (d) EX.loot.push({...d, x, y, t0: performance.now(), pula: true});
}

/* ----- a cada quadro: o pendurado caindo (o vento empurra) ----- */
function achUpdate(dt, now) {
  if (!EX.ach) return;
  const v = achVento();
  for (const o of EX.ach) {
    const f = o.fall; if (!f || o.broken) continue;
    f.vy += 420 * dt; f.vx += v * 40 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.y + 14 >= o.ground) {   // chegou no chão: a fruta fica ali para pegar
      o.broken = true; sfx("cai");
      exBurst(f.x, o.ground - 2, ["#d8c49a", "#a89a72"], 6);
      EX.loot.push({kind: "item", id: EX.achReg.fruta, art: o.kind, x: f.x, y: o.ground, t0: now, pula: true});
    }
  }
}

/* ----- desenho na exploração (exDraw) ----- */
function achDrawGround(x, cx, cy) {   // caquinhos dos objetos quebrados, no chão
  if (!EX.ach) return;
  for (const o of EX.ach) if (o.cacos) for (const [dx, dy, c] of o.cacos) { x.fillStyle = c; x.fillRect(Math.round(o.x - cx + dx), Math.round(o.y - cy + dy), 2, 1); }
}
function achDrawList(x, cx, cy, now) {   // objetos e pendurados, para entrar na ordenação por altura com o Rhanon e os bichos
  if (!EX.ach) return [];
  const out = [];
  for (const o of EX.ach) {
    if (o.broken) continue;
    if (!o.pend) { out.push({y: o.y, draw: () => { drawShadow(x, Math.round(o.x - cx), Math.round(o.y - cy), 10); x.drawImage(achArt(o.kind), Math.round(o.x - cx) - 8, Math.round(o.y - cy) - 16); }}); continue; }
    out.push({y: o.ground + 3, draw: () => {
      const ax = Math.round(o.ax - cx), ay = Math.round(o.ay - cy);
      if (o.fall) { x.drawImage(achArt(o.kind), Math.round(o.fall.x - cx) - 8, Math.round(o.fall.y - cy) - 1); return; }
      const dx = Math.round(achSwing(o, now));
      lineP(x, ax, ay, ax + dx, ay + ACH_ROPE, "#7a5a3a");   // a corda (ou o cabinho) até o galho
      x.drawImage(achArt(o.kind), ax + dx - 8, ay + ACH_ROPE - 1);
    }});
  }
  return out;
}
// achado no chão (moeda ou item): desenho em drawLoot (explore.js); pula ao cair
function drawAchLoot(x, l, cx, cy, now) {
  const el = now - l.t0, hop = l.pula && el < 380 ? Math.round(Math.sin(el / 380 * Math.PI) * 6) : 0;
  const sx = Math.round(l.x - cx), sy = Math.round(l.y - cy) - hop - (el > 380 ? Math.floor(now / 300) % 2 : 0);
  x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(sx - 3, Math.round(l.y - cy), 6, 1);
  if (l.kind === "moeda") {   // moedinha dourada que gira
    const w = [3, 2, 1, 2][Math.floor(now / 120) % 4];
    x.fillStyle = OUTLINE; x.fillRect(sx - w - 1, sy - 6, w * 2 + 2, 6); x.fillRect(sx - w, sy - 7, w * 2, 8);
    x.fillStyle = "#f2c230"; x.fillRect(sx - w, sy - 6, w * 2, 6); x.fillStyle = "#fff3a0"; x.fillRect(sx - w, sy - 6, 1, 3);
    return;
  }
  if (l.art) { x.drawImage(achArt(l.art), sx - 8, sy - 16); return; }   // a fruta que caiu da árvore
  // comida embrulhada na folha, amarrada
  x.fillStyle = OUTLINE; x.fillRect(sx - 4, sy - 6, 8, 6); x.fillRect(sx - 3, sy - 7, 6, 8);
  x.fillStyle = "#5fae52"; x.fillRect(sx - 3, sy - 6, 6, 5); x.fillStyle = "#3a7a3a"; x.fillRect(sx - 3, sy - 2, 6, 1);
  x.fillStyle = "#c8a050"; x.fillRect(sx - 1, sy - 6, 1, 5);
}
