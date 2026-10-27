/* Segredos das trilhas do Norte (SECRETS em data/world.js). Cada fase de caça esconde um recanto no meio da mata (ou
   entre os prédios, em Belém), cavado ao entrar na fase (secretRows), sempre no mesmo lugar (3x2; onde a mata é rala, um corredor ou só o baú atrás da entrada). A entrada (Y) fica fechada
   por algo que só um elemento abre fora da batalha, gastando os PE do especial; dentro tem um baú (J) com dinheiro,
   comida e uma lembrança que o Pajé conta. G.secrets[zona]: 1 = passagem aberta, 2 = baú já aberto. */
const SECRET_OPEN = 1, SECRET_LOOTED = 2;
const secretState = z => (G.secrets || {})[z] || 0;
// devolve as linhas da fase com o recanto cavado (entrada Y, baú J no fundo); sem lugar que sirva, as linhas de sempre
function secretRows(zone, rows) {
  if (!SECRETS[zone]) return rows;
  const H = rows.length, W = rows[0].length, at = (x, y) => (rows[y] || "")[x] || "";
  const fill = ch => ch === "T" || ch === "#", walk = ch => ch !== "" && ".,f-".includes(ch);
  const busy = (x, y) => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if ("SEGBF".includes(at(x + i, y + j) || "_")) return true; return false; };
  let cands = [];
  for (const [hw, deep] of [[1, 2], [0, 2], [0, 1]]) {   // recanto 3x2; onde a mata é rala, corredor de 1 ou só o baú atrás da entrada
  if (cands.length) break;
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (!fill(at(x, y)) || busy(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!walk(at(x - dx, y - dy))) continue;   // a entrada encosta num lugar onde o Rhanon anda
      const px = dy ? 1 : 0, py = dx ? 1 : 0, pocket = [];   // 2 de fundo atrás da entrada
      for (let d = 1; d <= deep; d++) for (let w = -hw; w <= hw; w++) pocket.push([x + dx * d + px * w, y + dy * d + py * w]);
      const inPocket = (a, b) => pocket.some(([qx, qy]) => qx === a && qy === b);
      // fechado por todos os lados: só se entra pela entrada
      const ok = pocket.every(([qx, qy]) => qx > 0 && qy > 0 && qx < W - 1 && qy < H - 1 &&
        [-1, 0, 1].every(j => [-1, 0, 1].every(i => (qx + i === x && qy + j === y) || inPocket(qx + i, qy + j) || fill(at(qx + i, qy + j)))));
      if (ok) cands.push({x, y, pocket, chest: [x + dx * deep, y + dy * deep]});   // baú no fundo, no meio
    }
  }
  }
  if (!cands.length) return rows;
  const c = cands[Math.floor(seeded([...zone].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7)) * cands.length)];
  const g = rows.map(r => [...r]);
  c.pocket.forEach(([qx, qy]) => { g[qy][qx] = "."; });
  g[c.y][c.x] = "Y"; g[c.chest[1]][c.chest[0]] = "J";
  return g.map(r => r.join(""));
}
// a entrada (Y) bloqueia até o segredo abrir; o baú (J) sempre bloqueia
const secretSolid = ch => ch === "J" || (ch === "Y" && !secretState(EX.zone));
// o especial do elemento que abre o segredo desta fase
const secretSpecial = () => SPECIALS.find(s => s.elem === SECRETS[EX.zone].elem);
function secretPanel(say, d) {
  const S = SECRETS[EX.zone], sp = secretSpecial(), lock = specialLock(sp);
  say(S.n, S.d + (lock ? " " + t("Precisa de {elemento}: {golpe}.", {elemento: ELEMENTS[S.elem].n.toLowerCase(), golpe: sp.n}) : ""));
  if (!lock) btn(t("Usar {golpe} · {n} PE", {golpe: sp.n, n: sp.cost}), () => secretOpen(sp), G.sp < sp.cost, d);
}
function secretOpen(sp) {
  vit(); if (G.sp < sp.cost || secretState(EX.zone)) return;
  G.sp -= sp.cost; G.secrets[EX.zone] = SECRET_OPEN; save(); exHud();
  sfx({fogo: "fire", agua: "agua", vento: "vento", raio: "choque", planta: "planta"}[sp.elem]);
  const s = EX.spots.find(q => q.kind === "segredo");
  if (s) for (let i = 0; i < 14; i++) EX.fx.push({x: s.x + (Math.random() - .5) * 14, y: s.y + (Math.random() - .5) * 14, vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 40, life: .6, col: ELEMENTS[sp.elem].c});
  EX.spots = EX.spots.filter(q => q.kind !== "segredo"); exCloseDialog();
  exToast(t("O caminho abriu! Tem um canto escondido ali dentro."));
}
function secretChest(say, d) {
  if (secretState(EX.zone) >= SECRET_LOOTED) return say(t("Baú"), t("Vazio. Só ficou o cheiro de mato."));
  say(t("Baú escondido"), t("Um baú de palha trançada, guardado aqui faz tempo."));
  btn(t("Abrir"), secretLoot, false, d);
}
function secretLoot() {
  vit(); const z = EX.zone, S = SECRETS[z]; if (secretState(z) >= SECRET_LOOTED) return;
  const money = 30 + (ZONES[z].lv || 1) * 8, food = S.item;
  G.secrets[z] = SECRET_LOOTED; G.money += money; G.items[food] = (G.items[food] || 0) + 2; save(); sfx("more"); exHud(); exCloseDialog();
  exToast(t("No baú: R$ {n} e {item} ×2.", {n: money, item: ITEMS[food].n.toLowerCase()}));
  setTimeout(() => narrate([S.lore]), 900);   // o Pajé lembra uma história daquele lugar
}
// o que fecha a entrada, desenhado por cima do chão (some quando o segredo abre): cada elemento tem o seu
function drawSecretBlock(x, sx, sy, elem, now) {
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(sx + a, sy + b, w, h); };
  if (elem === "fogo") {   // moita seca: galhos cinza-amarelados
    R(1, 4, 14, 11, OUTLINE); R(2, 5, 12, 9, "#a08a4a"); R(3, 6, 4, 3, "#c9b06a"); R(9, 7, 4, 4, "#7a6a3a"); R(5, 10, 6, 3, "#8a7440");
    R(4, 2, 1, 4, "#7a6a3a"); R(10, 1, 1, 5, "#7a6a3a"); R(13, 3, 1, 3, "#7a6a3a");
  } else if (elem === "planta") {   // cipoal: cipós grossos trançados
    R(0, 1, 16, 15, OUTLINE); R(1, 2, 14, 13, "#1f4a24");
    for (let i = 0; i < 4; i++) { R(2 + i * 3, 2, 2, 13, i % 2 ? "#3f7a3a" : "#2f6a2f"); R(1, 4 + i * 3, 14, 1, "#4a8a3a"); }
    R(5, 6, 2, 2, "#7ac84a"); R(10, 11, 2, 2, "#7ac84a");
  } else if (elem === "agua") {   // barranco de barro seco, rachado
    R(0, 3, 16, 13, OUTLINE); R(1, 4, 14, 11, "#9a6a3a"); R(1, 4, 14, 2, "#b8844a");
    R(4, 7, 1, 4, "#5a3a1a"); R(5, 10, 3, 1, "#5a3a1a"); R(10, 6, 1, 3, "#5a3a1a"); R(11, 8, 2, 1, "#5a3a1a");
  } else if (elem === "vento") {   // monte de folhas secas que balança
    const b = Math.floor(now / 400) % 2;
    R(0, 5, 16, 11, OUTLINE); R(1, 6, 14, 9, "#b8742a"); R(2, 4 + b, 5, 3, "#d8942a"); R(8, 5 - b, 6, 3, "#c86a2a");
    R(3, 9, 3, 2, "#e8b44a"); R(9, 11, 4, 2, "#8a4a1a");
  } else {   // raio: grade de ferro com trava elétrica piscando
    R(0, 0, 16, 16, OUTLINE); R(1, 1, 14, 14, "#4a5560");
    for (let i = 0; i < 4; i++) R(2 + i * 4, 1, 2, 14, "#8a96a0");
    R(5, 6, 6, 4, "#2a3036"); R(7, 7, 2, 2, Math.floor(now / 300) % 2 ? "#ffd23a" : "#8a6a1a");
  }
}
// baú de palha trançada: fechado com faixa dourada; aberto, a tampa fica para trás
function drawChest(x, sx, sy, open, now) {
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(sx + a, sy + b, w, h); };
  R(2, 7, 12, 8, OUTLINE); R(3, 8, 10, 6, "#b8843a"); R(3, 11, 10, 1, "#8a5a24");
  if (open) { R(2, 4, 12, 4, OUTLINE); R(3, 5, 10, 2, "#c99a4a"); R(4, 8, 8, 2, "#3a2414"); return; }
  R(2, 5, 12, 3, OUTLINE); R(3, 6, 10, 1, "#d8aa5a"); R(7, 8, 2, 3, "#ffd23a");
  if (Math.floor(now / 500) % 3 === 0) R(12, 4, 1, 1, "#ffffff");   // brilhinho
}
