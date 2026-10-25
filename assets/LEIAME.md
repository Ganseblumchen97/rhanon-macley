# Arte do jogo (imagens PNG)

Coloque aqui as imagens e registre cada uma em `js/data/art.js`. Enquanto uma imagem não está registrada,
o jogo usa o desenho feito em código, então dá para trocar a arte aos poucos.

## Regras gerais

- **PNG com fundo transparente**, sem suavização (pixel art "duro"), sem sombra no chão (o jogo desenha a sombra).
- **Escala 3 em tudo**: cada pixel do jogo vira 3x3 na imagem. Os tamanhos abaixo já estão em escala 3.
  A exploração é desenhada em escala 3 (`RS` em `js/systems/explore.js`); se mudar a escala, mude lá também.
- Personagens **com os pés encostados na borda de baixo** e centralizados na largura.
- Animação: quadros do mesmo tamanho **lado a lado** numa imagem só; informe `frames` em `art.js`.
- Bichos desenhados **olhando para a esquerda** (o jogo espelha quando andam para a direita).

## O que desenhar

| Chave em art.js | Tamanho (escala 3) | Observações |
|---|---|---|
| `hero/battle` | 60 x 84 | Rhanon na batalha, **de costas** (olhando para o bicho), com a lança. |
| `hero/battle/<estado>` | 60 x 84 por quadro | Opcional: `throw`, `torch`, `guard`, `hurt`, `eat`, `observe`, `cheer`, `victory`, `defeat`, `flee`, `walk`, `idle`. Sem ele, usa `hero/battle`. |
| `hero/walk/down` | 60 x 84 por quadro | Exploração, de frente. 4 quadros (parado, passo, parado, outro passo) = 240 x 84. |
| `hero/walk/up` | 60 x 84 por quadro | De costas, 4 quadros. |
| `animal/<id>` | até ~102 x 66 | Bicho na batalha. Pequenos ~60-70 de largura, médios ~70-85, grandes ~85-102. Chefe sem arte própria usa a do bicho base com outra cor. |
| `animal/<id>/mapa` | até ~48 x 36 | Bicho na exploração (vista de cima, menor). |
| `cutin/eyes` | 8:3, ex.: 768 x 288 | Close dos olhos para a cinemática. Pode ser mais detalhado que o resto; o jogo acende o brilho por cima. |

Ids dos bichos: `onca`, `calango`, `tatu`, `jacare`, `preguica`, `cassaco`, `macaco`, `queixada`, `piranha`,
`sucuri`, `surucucu`, `harpia`, `queixada_chefe`, `cobra_grande`, `onca_rei`.

## Exemplo em js/data/art.js

```js
const ART_LIST = {
  "hero/battle":    {src: "assets/rhanon/batalha.png", scale: 3},
  "hero/walk/down": {src: "assets/rhanon/andando_frente.png", scale: 3, frames: 4},
  "animal/onca":    {src: "assets/bichos/onca.png", scale: 3},
  "cutin/eyes":     {src: "assets/cinematica/olhos.png", scale: 1},
};
```

Ainda não aceitam imagem (próximos passos): terreno das fases, cenário da batalha e tela inicial.
