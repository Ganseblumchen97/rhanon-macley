/* Idiomas. O português continua escrito onde sempre esteve (no código e nos dados); cada outro idioma fica em
   js/data/lang/<id>.js como TX.<id> = {t: {"texto em português": "tradução"}, article(bicho, maiúscula)}.
   t("texto", {nome: valor}) devolve a tradução do idioma escolhido (ou o próprio português, se faltar) e troca
   {nome} pelo valor. Os nomes e falas dos dados (bichos, locais, itens...) são trocados uma vez ao abrir o jogo
   (applyLangData, chamada no main.js), e os textos fixos do index.html por translateStatic.
   O idioma fica em localStorage["rhanon-opcoes"].lang; sem escolha, vale o do navegador (?lang=en na URL força um,
   só naquela abertura). Trocar recarrega a página. Só o arquivo do idioma escolhido é baixado (pedido logo abaixo,
   antes dos outros scripts); chinês, japonês e coreano também baixam a fonte Noto do idioma (LANG_FONT).
   Falta de tradução: node tools/conferir_textos.js lista o que cada idioma ainda não tem. */
const LANGS = {pt: "Português", en: "English", es: "Español", fr: "Français"};
// fonte com os caracteres de cada idioma que as fontes do jogo não têm (o Google Fonts baixa só os que aparecem)
const LANG_FONT = {zh: "Noto Sans SC", ja: "Noto Sans JP", ko: "Noto Sans KR"};
const TX = {};
const LANG = (() => {
  let l = (location.search.match(/[?&]lang=(\w+)/) || [])[1];   // ?lang=en na URL vale só nesta abertura (testes)
  if (!LANGS[l]) try { l = (JSON.parse(localStorage.getItem("rhanon-opcoes")) || {}).lang; } catch (_) {}
  if (!LANGS[l]) l = (navigator.language || "pt").slice(0, 2).toLowerCase();
  return LANGS[l] ? l : "pt";
})();
// pede o arquivo do idioma (e a fonte dele) já agora: document.write faz o navegador carregar e rodar antes dos próximos
// scripts, como se a tag estivesse no index.html. A versão no endereço fura o cache de quem joga, como o ?v= das outras.
if (LANG !== "pt") {
  document.documentElement.lang = LANG;
  document.write(`<script src="js/data/lang/${LANG}.js?v=${GAME_VERSION}"><\/script>`);
  if (LANG_FONT[LANG]) document.write(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${LANG_FONT[LANG].replace(/ /g, "+")}:wght@400;700;900&display=swap">`);
}
// aviso mostrado na tela inicial e nas Opções quando o idioma não é o português (o texto vem traduzido)
const LANG_NOTE = "Tradução feita por IA a partir do português: pode haver erros.";
function t(pt, vars) {
  let s = LANG !== "pt" && TX[LANG] && TX[LANG].t[pt] || pt;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k] : m);
  return vars && LANG !== "pt" && TX[LANG] && TX[LANG].fix ? TX[LANG].fix(s) : s;   // ajustes do idioma (no espanhol, "a el" -> "al")
}
function setLang(l) {
  if (!LANGS[l] || l === LANG) return;
  let o = {}; try { o = JSON.parse(localStorage.getItem("rhanon-opcoes")) || {}; } catch (_) {}
  o.lang = l; try { localStorage.setItem("rhanon-opcoes", JSON.stringify(o)); } catch (_) {}
  location.reload();
}
/* Campos de texto dos dados que a tradução troca (também lidos por tools/conferir_textos.js).
   [nome da variável global, caminho]: "*" = cada valor de um objeto ou cada item de uma lista; "@x" = o campo x. */
const LANG_FIELDS = [
  ["ANIMALS", "*", "@name"], ["ANIMALS", "*", "@intro"], ["ANIMALS", "*", "@moves", "*"], ["MOVES", "*"],
  ["ANIMAL_FACTS", "*"], ["PELT", "*"], ["ZONES", "*", "@n"], ["NIGHT_ZONES", "*", "@n"],
  ["SUB", "*", "@n"], ["SUB", "*", "@s"], ["SUB", "*", "@txt"], ["CITY", "*", "@n"], ["MAP_REGIONS", "*", "@n"], ["MAP_REGIONS", "*", "@aria"],
  ["LOC", "*", "@n"], ["LOC", "*", "@s"], ["LOC", "*", "@txt"],
  ["ITEMS", "*", "@n"], ["EQUIP", "*", "*", "@n"], ["CMDS", "*", "@n"], ["CMDS", "*", "@d"], ["SPECIALS", "*", "@n"], ["SPECIALS", "*", "@d"],
  ["QUESTS", "*", "@text"], ["QUESTS", "*", "@thanks"], ["VILLAGER_NAME", "*"], ["VILLAGER_TIPS", "*"], ["BELEM_TIPS", "*"],
  ["TUTORIAL", "*"], ["SAFE_TIP", "*"], ["SPOT_LABEL", "*"], ["EQ_SLOTS", "*", "@n"], ["EQ_SLOTS", "*", "@none"], ["CHARM_FX", "*"], ["BUGS", "*", "@name"], ["BUGS", "*", "@intro"], ["BUGS", "*", "@moves", "*"], ["FREELAS", "*", "@n"], ["FREELAS", "*", "@client"], ["FREELAS", "*", "@prog"], ["BUG_CMD", "*"], ["NARRA", "*", "*"], ["NARRA", "*", "*", "@r"], ["NARRA_BOSS", "*", "*"], ["NARRA_BOSS", "*", "*", "@r"], ["NARRA_HINT", "*"], ["REGIONS", "*", "@n"], ["REGIONS", "*", "@txt"], ["REGIONS", "*", "@airport"], ["NARRA_PYT", "*", "*"], ["NARRA_PYT", "*", "*", "@r"], ["NARRA_PYT", "*", "*", "@p"],
  ["SKILL_TREES", "*", "@n"], ["SKILL_TREES", "*", "@d"], ["SKILL_TREES", "*", "nodes", "*", "@n"], ["SKILL_TREES", "*", "nodes", "*", "@d"]
];
// percorre um caminho de LANG_FIELDS e chama fn(objeto, chave) em cada texto encontrado
function langWalk(root, path, fn) {
  if (root == null || typeof root !== "object") return;   // texto solto no meio do caminho (ex.: fala que não é {r: ...})
  const [step, ...rest] = path, keys = step === "*" ? Object.keys(root) : step[0] === "@" ? [step.slice(1)] : [step];
  keys.forEach(k => {
    if (!(k in root)) return;
    if (rest.length) langWalk(root[k], rest, fn);
    else if (typeof root[k] === "string") fn(root, k);
  });
}
function applyLangData() {
  if (LANG === "pt" || !TX[LANG]) return;
  LANG_FIELDS.forEach(([name, ...path]) => {
    let root; try { root = eval(name); } catch (_) { return; }   // const globais não ficam em window
    langWalk(root, path, (o, k) => { o[k] = t(o[k]); });
  });
}
// textos fixos do index.html: troca cada texto e cada aria-label/title que tenha tradução
function translateStatic() {
  if (LANG === "pt" || !TX[LANG]) return;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim();
    if (s && TX[LANG].t[s]) n.nodeValue = n.nodeValue.replace(s, TX[LANG].t[s]);
  }
  document.querySelectorAll("[aria-label], [title]").forEach(el => ["aria-label", "title"].forEach(a => {
    const v = el.getAttribute(a); if (v && TX[LANG].t[v]) el.setAttribute(a, TX[LANG].t[v]);
  }));
  document.title = t(document.title);
  $("titleScreen").querySelector(".t-menu").insertAdjacentHTML("beforeend", `<p class="lang-note">${t(LANG_NOTE)}</p>`);
}
