/* Fases de exploração (vista de cima, estilo Pokémon de GBA). Cada letra é um quadrado de 16x16:
   T árvore   o pedra   ~ água          (bloqueiam)
   . grama    , mato alto   f flores   - trilha   = ponte
   S início do Rhanon   E saída para a aldeia   a bicho da zona (sorteado ao entrar)
   B chefe da zona   G passagem para a próxima fase (abre quando o chefe cai)
   Aldeia e feira (safe: sem bichos): H oca (2x2)   K barraca   F fogueira   N tenda   P aldeão
   V comprador de peles   C barraca de comida   R artesão (roupas e armas)
   Fogueira, tenda, vendedores e aldeões são "pontos de conversa": chegando perto, Z abre o painel deles.
   Todas as linhas de uma fase precisam ter o mesmo tamanho. */
const STAGES = {
  aldeia: {
    safe: true,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTT",
      "TT...,,........,,....TTT",
      "T..HH.....HH.....HH...TT",
      "T..HH..f..HH..f..HH...TT",
      "T...-..P...-......-....T",
      "T...---------------....T",
      "T.....,,....-...,,.....T",
      "T..N........-.......P..T",
      "T.......F...-..........T",
      "T....f......-..P.f.....T",
      "T..,,.......-.....,,...T",
      "TTTTTTTTTTTT-TTTTTTTTTTT",
      "TTTTTTTTTTTTSTTTTTTTTTTT",
      "TTTTTTTTTTTTETTTTTTTTTTT"
    ]
  },
  feira: {
    safe: true,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTT",
      "TT....,,........,,....TT",
      "T..KKK....KKK....KKK...T",
      "T...V......C......R....T",
      "T......................T",
      "T..----------------....T",
      "T..-..f.....,,....-....T",
      "T..-...KKK.....o..-....T",
      "T..-...........,,.-....T",
      "T..----------------....T",
      "T..........-...........T",
      "TTTTTTTTTTT-TTTTTTTTTTTT",
      "TTTTTTTTTTTSTTTTTTTTTTTT",
      "TTTTTTTTTTTETTTTTTTTTTTT"
    ]
  },
  mata: {
    next: "fechada",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTT,,,,-,TT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTT,,,.,.B.,T",
      "TTTTTTTTTTTTTTTTTTTTTTTTT,,...f...,T",
      "TTTTTTTTTTTTTTTTTTTTTTTTT,.......,,T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTT-TTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTT,,-,,TTTTT",
      "TTTTTTTTTTTTTTT,,a,,,,,,,,,,-,,TTTTT",
      "TTTTTTTTTTTT-----------------,,TTTTT",
      "TTTTTTTTTTTT-..o....,,,,a,,,,.TTTTTT",
      "TTTTTTTTTTTT-....f..,,,,,,,,..TTTTTT",
      "TTTTTTTTTTTT-TTTTTT...TTTTTTTTTTTTTT",
      "TTTTTT,,,,,,-,,,TTTTTTTTTTTTTTTTTTTT",
      "TTTTT,,a,,,,-,a,,TTTTTTTTTTTTTTTTTTT",
      "TTTTT,,,,o,,-,,,,TTTTT.....TTTTTTTTT",
      "TTTTTT,,,,,,-,,,TTTT,,,a,,,TTTTTTTTT",
      "TTTTTTT.....-....TTT,,,,,,,TTTTTTTTT",
      "TTTTTTTT....-.......,,,,,,,TTTTTTTTT",
      "TTTTTTTTTT..-..f....,,a,,,,TTTTTTTTT",
      "T.ES---------TTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  },
  fechada: {
    next: "rio",
    rows: [
      "TTTGTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,-,TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T,.B.,TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T,...,,TTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,-,TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTT-TTTTTTTTT,,,,,TTTTTTTTTTTTTTTTTT",
      "TTT-------------,a,,TTTTTTTTTTTTTTTT",
      "TTTTTTToTTTTTTT-,,,,TTTTT,,,,TTTTTTT",
      "TTTTTTTTTTTTTTT-TTTTTTTTT,a,,TTTTTTT",
      "TTTTTTTTT,,,,,,-,,,,,,,,,,,,,TTTTTTT",
      "TTTTTTTTT,a,o,,-,,o,,,a,,,,,,TTTTTTT",
      "TTTTTTTTTT,,,,,-,,,,,,,,,o,,,TTTTTTT",
      "TTTTTTTTTTTTTTT-TTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTT---------TTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTT-TTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTT,,,a,,,-,,a,,,TTTTTT",
      "TTTTTTTTTTTTTTTT,o,,,,,-,,,,o,TTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTT----------SET",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  },
  rio: {
    next: null,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T,,,,,~~~~~~~~~~~~~~~~~~~~~~~,,.B.,T",
      "T,a,,,~~~~~~~~~~~~~~~~~~~~~~~,....,T",
      "T,,,,,~~~~~~~~~~~~~~~~~~~~~~~,,-,,,T",
      "T,,-,,~~~~~~~~~~~~~~~~~~~~~~~,,-,,,T",
      "T,,-,,~~~~~~~~~~~~~~~~~~~~~~~,a-,,,T",
      "T,,-,,~~~~~~~~~~~~~~~~~~~~~~~,,-,,,T",
      "T,,---=======================---,,,T",
      "T,,-,,~~~~~~~~~~~~~~~~~~~~~~~,,,,,,T",
      "T,,-,,~~~~~~~~~~o~~~~~~~~~~~~,,a,,,T",
      "T,a-,,~~~~~~~~~~~~~~~~~~~~~~~,,,,,,T",
      "T,,-,,~~~~~~~~~~~~~~~~~~~~~~~,,,a,,T",
      "T,,-,,,,~~~~~~~~~~~~~~~~~~~~~,,,,,,T",
      "T,,-,,a,,,~~~~~~~~~~~~~~~~~~~TTTTTTT",
      "T,,-,,,,,,,,~~~~~~~~~~~~~~~~TTTTTTTT",
      "T.ES,,,,a,,,,,~~~~~~~~~~~TTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  }
};
const SOLID = "To~GHKFNVPCR";      // G deixa de bloquear quando o chefe da fase cai
const ONE_HIT_LEVELS = 2;        // níveis acima do bicho para abatê-lo só com o golpe de abertura
