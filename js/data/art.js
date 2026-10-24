/* Arte em imagem (PNG) que substitui os desenhos feitos em código. Enquanto um item não está aqui,
   o jogo continua usando o desenho em código, então dá para trocar a arte aos poucos.
   Campos: src  caminho a partir da pasta do jogo (coloque os arquivos em assets/)
           scale  quantos pixels da imagem valem 1 pixel do jogo (3 = arte 3x mais detalhada; use o mesmo em tudo)
           frames  quadros lado a lado na mesma imagem (animação), padrão 1
   Chaves que o jogo procura:
     animal/<id>            bicho na batalha (ex.: animal/onca). Chefe sem arte própria usa a do bicho base com cor trocada.
     animal/<id>/mapa       bicho na exploração
     hero/battle            Rhanon na batalha; opcional por estado: hero/battle/<estado>
                            (idle, throw, torch, guard, hurt, eat, observe, cheer, victory, defeat, flee, walk)
     hero/walk/down|up|side Rhanon na exploração (side = olhando para a direita); frames = quadros da caminhada
     cutin/eyes             close dos olhos na cinemática de abertura da batalha (largura:altura perto de 8:3)
   Tamanhos sugeridos com scale 3 estão em assets/LEIAME.md.
   Exemplo: "animal/onca": {src: "assets/bichos/onca.png", scale: 3}, */
const ART_LIST = {
};
