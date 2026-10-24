/* Carregador das imagens listadas em ART_LIST (data/art.js). */
const IMG = {};
// carrega tudo em paralelo; imagem que falha só gera um aviso e o jogo segue com o desenho em código
function loadArt() {
  return Promise.all(Object.entries(ART_LIST).map(([k, d]) => new Promise(done => {
    const im = new Image();
    im.onload = () => { const frames = d.frames || 1; IMG[k] = {img: im, scale: d.scale || 1, frames, w: im.width / frames, h: im.height}; done(); };
    im.onerror = () => { console.warn("[arte] não carregou:", d.src); done(); };
    im.src = d.src;
  })));
}
// quadro i da arte k num canvas próprio, com data-scale; null se a arte não existe
function artCanvas(k, i = 0) {
  const a = IMG[k]; if (!a) return null;
  const c = document.createElement("canvas"); c.width = a.w; c.height = a.h; c.dataset.scale = a.scale;
  c.getContext("2d").drawImage(a.img, (i % a.frames) * a.w, 0, a.w, a.h, 0, 0, a.w, a.h);
  return c;
}
