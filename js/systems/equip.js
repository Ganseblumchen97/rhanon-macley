/* Tela de equipamento: o Rhanon no meio, de braços abertos como o Homem Vitruviano (círculo e quadrado atrás),
   e um espaço para cada parte (EQ_SLOTS) em volta. Abre pela bolsa ou com E na exploração; trocar já salva.
   Setas escolhem o espaço, 1-9 equipam o item da lista, Z/Enter passam para o próximo, X/Esc/E fecham. */
const EQ_SLOTS = [
  {slot: "weapon", n: "Arma"}, {slot: "ranged", n: "Arco", none: "Sem arco"},       // coluna da esquerda
  {slot: "torso", n: "Tronco", none: "Sem camisa"}, {slot: "legs", n: "Pernas"}      // coluna da direita
];
let EQ_SEL = 0;   // espaço escolhido (índice em EQ_SLOTS)
const EQ_POSE = {lh: [3, 24], rh: [29, 24], lf: [10, 40], rf: [22, 40]};   // braços na horizontal, pernas um pouco abertas
function eqFigure() {
  const fig = document.createElement("div"), img = document.createElement("img");
  fig.className = "eq-fig";
  fig.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="44"/><rect x="14" y="22" width="72" height="72"/><line x1="50" y1="4" x2="50" y2="98"/><line x1="4" y1="52" x2="96" y2="52"/></svg>';
  img.src = rigCanvas("front", EQ_POSE, {...rhanonLook(), bowBack: false}, 1).toDataURL(); img.alt = "";
  fig.append(img);
  return fig;
}
// desenho do item num quadradinho de 16x16, com o mesmo contorno do Rhanon: lança e arco com as cores de look,
// roupa com a cor dela (tanga quando a calça não tem cor); vazio = sem desenho
function gearIcon(slot, it) {
  const box = document.createElement("span"); box.className = "eq-icon";
  if (!it) return box;
  const d = rigGrid(1, 16, 16), C = {...RIG_PAL, ...it.look};
  if (slot === "weapon") rigSpear(d, C, 2, 14, 10, 6);
  else if (slot === "ranged") { rigBow(d, C, 5, 1, 15); d.part().limb(3, 8, 12, 8, 1, "#c9a46a").dots([[13, 8]], C.m); }
  else if (slot === "torso") d.part().poly([[4, 2], [6, 2], [8, 5], [10, 2], [12, 2], [13, 14], [3, 14]], it.color, it.shade, 9);
  else if (it.color) d.part().poly([[3, 2], [13, 2], [13, 15], [9, 15], [8, 7], [7, 15], [3, 15]], it.color, it.shade, 9);
  else d.part().rect(3, 4, 10, 2, C.t).poly([[5, 6], [11, 6], [10, 11], [8, 13], [6, 11]], C.t, C.T, 9);
  box.append(d.canvas());
  return box;
}
// itens que podem ir num espaço: os seus (G.owned) e, quando dá para ficar sem, a opção vazia
function eqChoices(s) {
  const out = Object.entries(EQUIP[s.slot]).filter(([id]) => G.owned[id]).map(([id, it]) => ({id, it}));
  return s.none && out.length ? [{id: null, it: {n: s.none}}, ...out] : out;
}
const eqStats = () => `ATQ +${weaponAtk()}${G.equip.ranged ? ` · flecha +${EQUIP.ranged[G.equip.ranged].atk || 0}` : ""} · DEF ${defense()}`;
function openEquip(msg) {
  vit(); audio();
  const o = $("equipar"), box = o.querySelector(".info"), q = G.equip;
  box.innerHTML = `<h2>Equipamento</h2><p class="hint">${eqStats()}</p>`;
  const wrap = document.createElement("div"), cols = [document.createElement("div"), document.createElement("div")];
  wrap.className = "eq-wrap"; cols.forEach(c => { c.className = "eq-col"; });
  EQ_SLOTS.forEach((s, i) => {
    const it = q[s.slot] && EQUIP[s.slot][q[s.slot]], b = document.createElement("button");
    b.type = "button"; b.className = "eq-slot" + (i === EQ_SEL ? " sel" : "");
    b.innerHTML = `<small>${s.n}</small><b>${it ? it.n : s.none || "—"}</b><i>${it ? gearBonus(s.slot, it) : s.slot === "ranged" ? "o armeiro da feira faz" : ""}</i>`;
    b.prepend(gearIcon(s.slot, it));
    b.addEventListener("click", () => { EQ_SEL = i; sfx("blip"); openEquip(); });
    cols[i < 2 ? 0 : 1].append(b);
  });
  wrap.append(cols[0], eqFigure(), cols[1]);
  box.append(wrap);
  // lista do espaço escolhido: o que está em uso fica marcado
  const s = EQ_SLOTS[EQ_SEL], list = eqChoices(s), pick = document.createElement("div");
  pick.className = "eq-pick"; pick.innerHTML = `<h3>${s.n}</h3>`;
  box.append(pick);
  list.forEach(c => {
    const on = q[s.slot] === c.id;
    btn(c.it.n + (on ? " <small>usando</small>" : c.id ? ` <small>${gearBonus(s.slot, c.it)}</small> ${gearCmp(s.slot, c.it)}` : ""), () => { if (!on) eqSet(s.slot, c.id); }, false, pick);
    pick.lastElementChild.classList.toggle("sel", on);
    const sp = pick.lastElementChild.firstElementChild, key = sp.querySelector(".key");   // desenho depois do número da tecla
    sp.insertBefore(gearIcon(s.slot, c.id && c.it), key ? key.nextSibling : sp.firstChild);
  });
  if (!list.length) lh(s.slot === "ranged" ? "Ainda sem arco. O armeiro da feira faz um." : "Nada pra trocar aqui ainda.", pick);
  if (msg) lh(msg, box);
  box.insertAdjacentHTML("beforeend", '<p class="hint eq-keys">Setas escolhem o espaço · Z troca para o próximo · 1-9 equipam direto · X fecha</p>');
  btn("Fechar", closeEquip, false, box);
  if (o.hidden) { o.hidden = false; sfx("blip"); }
}
function eqSet(slot, id) {
  G.equip[slot] = id; save(); sfx("guard");
  const it = id && EQUIP[slot][id];
  openEquip(it ? `${slot === "torso" || slot === "legs" ? "Vestiu" : "Pegou"}: ${it.n}.` : `${EQ_SLOTS.find(s => s.slot === slot).none}.`);
}
function closeEquip() {
  $("equipar").hidden = true; sfx("blip");
  if (EX && !$("explore").hidden) { if (EX.dialog === "inventario") exOpenDialog("inventario"); }
  else if (!$("local").hidden && $("linfo").querySelector("h2")?.textContent === "Inventário") showInv();
}
function setupEquip() {
  $("equipar").addEventListener("click", ev => { if (ev.target === $("equipar")) closeEquip(); });
  $("exEquip").addEventListener("click", () => { if (EX && !EX.locked && !EX.camp && EX.dialog !== "tutorial") openEquip(); });
  // com a tela aberta o teclado é só dela (antes da exploração e dos mapas)
  document.addEventListener("keydown", ev => {
    if ($("equipar").hidden || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.stopImmediatePropagation();
    const k = ev.key, flip = {ArrowUp: 1, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 2}[k];   // cima/baixo: mesma coluna; lados: troca de coluna
    if (flip) { ev.preventDefault(); EQ_SEL ^= flip; sfx("blip"); openEquip(); }
    else if (/^[1-9]$/.test(k)) pressPanel($("equipar").querySelectorAll(".eq-pick .cmd")[+k - 1]);
    else if ((k === "Enter" || k === " " || k === "z" || k === "Z") && !ev.repeat) {   // Z troca para o próximo item
      ev.preventDefault();
      const s = EQ_SLOTS[EQ_SEL], list = eqChoices(s), at = list.findIndex(c => c.id === G.equip[s.slot]);
      if (list.length > 1) eqSet(s.slot, list[(at + 1) % list.length].id);
    }
    else if (["Escape", "x", "X", "e", "E", "i", "I"].includes(k) && !ev.repeat) { ev.preventDefault(); closeEquip(); }   // X volta
  }, true);
}
