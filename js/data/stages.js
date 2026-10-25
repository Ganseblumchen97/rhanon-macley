/* Fases de exploração (vista de cima, estilo Pokémon de GBA). Cada letra é um quadrado de 16x16:
   T árvore   o pedra   ~ água          (bloqueiam)
   . grama    , mato alto   f flores   - trilha   = ponte
   S início do Rhanon   E saída para a aldeia   a bicho da zona (sorteado ao entrar)
   B chefe da zona   G passagem para a próxima fase (abre quando o chefe cai)
   Aldeia e feira (safe: sem bichos): H oca (3x2, porta no quadrado do meio)   K barraca   F fogueira   N tenda   P aldeão
   V comprador de peles   C barraca de comida   R artesão (roupas e armas)
   Fogueira, tenda, vendedores e aldeões são "pontos de conversa": chegando perto, Z abre o painel deles.
   Todas as linhas de uma fase precisam ter o mesmo tamanho. */
const STAGES = {
  aldeia: {
    safe: true,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTT",
      "TT...,,........,,....TTT",
      "T.HHH.....HHH.....HHH..T",
      "T.HHH..f..HHH..f..HHH..T",
      "T..-.......-.......-...T",
      "T..-----------------...T",
      "T.....,,...-....,,.....T",
      "T..P.......-........P..T",
      "T.......F..-...........T",
      "T....f.....-...P.f.....T",
      "T..,,......-......,,...T",
      "TTTTTTTTTTT-TTTTTTTTTTTT",
      "TTTTTTTTTTTSTTTTTTTTTTTT",
      "TTTTTTTTTTTETTTTTTTTTTTT"
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
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT,f-,oT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.f,f-..T",
      "TTTTTTTTTTTTTTTTTTTTTTTT,.,.fTTTTTTTTTTTTTTTTTTTTTTT,,..B..T",
      "TTTTTTTTTTTTTTTTTTTTTT,..,.,.,.TTTTTTTTTTTTTTTTTTTTT,...-,.T",
      "TTTTTTTTTTTTTTTTTT.....,.,,..,..TTTTTTTTTTTTTTTTTTTTTT,,-.,T",
      "TTTTTTTTTTTTTTTT.,-------------aTTTTTTTTTTTTTTTTTTTT,,,.-.TT",
      "TTTTTTTTTTTTTTT...-.,.........-,TTTTTTTTTTTTTTTTTTf.,...-,.T",
      "TTTTTTTTTTTTTT,..,-.,..,.,,,,.-,.TTTTTTTTTTTTTTTTT.a,.,.-..T",
      "TTTTTTTTTTTTTTf...-.a..T....,,-..,TTTTTTTTTTTTTTTT,,..,.-,.T",
      "TTTTTTTTTT...,.,,.-....TTT,,..-....TTTTTTTTTTTTTTTTTf...-,TT",
      "TTTTTTTT..........-.,.TTTT,..,-.,.,TTTTTTTTTTTTTTTTT.,a.-.TT",
      "TTTTTTa...,.......-,,TTTTT...,-,o.,...,TTTTTTTTTTTT,-----.TT",
      "TTTTT.-------------,.TTTTTT,..-..,.Ff,ff,TTTTTTTTTT.-.,..TTT",
      "TTTTT,-,,...a.,....TTTTTTTTT,.-,.,....,,.,TTTTTTTT.,-..TTTTT",
      "TTTTT.-.,..,...a,TTTTTTTTTTT..-----------..TTTTTT,..-.,.TTTT",
      "TTTT,.-,.,..,.,TTTTTTTTTTTTTTT.,........-..TTTTT..a.-.,,.TTT",
      "TTTT..-a,,,..TTTTTTTTTTTTTTTTTTT.o,,....-..TTTTT..,.-..f.TTT",
      "TTTT,.-.,..f,TTTTTTTTTTTTTTTTTTTTT,,.,.,-...TTTT....-.,.,TTT",
      "TTTT..-,o,,.TTTTTTTTTTTTTTTTTTTTTTTT....-....TTT.,,,-,o.aTTT",
      "TTTT,.-..,,.,..TTTTTTTTTTTTTTTTTTTTT....-,,..TTT,,,,-,,f.TTT",
      "TTTT.,---------..TTTTTTTTTTTTTTTTTTT,,.,-,.....,...,-.,.TTTT",
      "TTTTTT,,,.,..,-.,.,TTTTTTTTTTTTTTTTTTa..-..a.....f,.-.oTTTTT",
      "TTTTTTTTT.a,,,-,,,.,TTTTTTTTTTTTTTTTTT.,-....,,..,..-.TTTTTT",
      "TTTTTTTTT,...a-,..f,TTTTTTTTTTTTTTTTTTT.-------------,TTTTTT",
      "TTTTTT,.,..,.,-,..,,TTTTTTTTTTTTTTTTTTTT,..,,,a...a.,TTTTTTT",
      "TT.......,...,-...,TTTTTTTTTTTTTTTTTTTTTTT.....,.,.TTTTTTTTT",
      "TES------------,,TTTTTTTTTTTTTTTTTTTTTTTTTTT,.,..TTTTTTTTTTT",
      "TT...,..,,...,.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  },
  fechada: {
    next: "rio",
    rows: [
      "TTTTTGTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTT,f-.,TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T.,,,-....TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T.,.,B..,.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T...,-..,...TTTTTTTTTTTTTTTTTTTTTTf.fa.TTTTTTTTTTTTTTTTTTTTT",
      "TTT..-....,....TTTTTTTTTTTTTTTTT.f.,.f,o...TTTTTTTTTTTTTTTTT",
      "TTT..----------..TTTTTTTTTTTTT,....,,.,,...TTTTTTTTTTTTTTTTT",
      "TTTTT,...,.,,.-,oTTTTTTTTTTTT.-------------.aTTTTTTTTTTTTTTT",
      "TTTTTTT..f,...-..,TTTTTTTTTTT,-.....a.....-,,TTTTTTTTTTTTTTT",
      "TTTTTTTTTTT,.,-..fTTTTTTTTTT..-,.......,,.-,.,TTTTTTTTTTTTTT",
      "TTTTTTTTTTT.o,-.,.TTTTTTTTT.a.-,.,,.o.,,,,-...TTTTTTTTTTTTTT",
      "TTTTTTTTTTTT..-..TTTTTTTTT,.,.-,...TTTT...-..f.f,.fTTTTTTTTT",
      "TTTTTTTT,.,..,-..TTTTTTTTT..,,-.,.,TTTTT,.-.,.,..,.,.TTTTTTT",
      "TTTTTTTT..a,..-aoTTTTTTTTT.,,.-..,,TTTTTT,-..,..,..a,.,TTTTT",
      "TTTTTTT,-------..TTTTTTTTT.,.,-..f.TTTTTT,-------------.TTTT",
      "TTTTTTT.-,..,..TTTTTTTTTTT,.,.-.o.,TTTTTTT.,,.....,...-,TTTT",
      "TTTTTT,.-......TTTTTTTTTTTT,,a-...TTTTTTTTTT,,,.,.....-.TTTT",
      "TTTTTo..-...TTTTTTTTTTT..F,.,.-..TTTTTTTTTTTTT,.,...,,-,TTTT",
      "TTTT.,.,-....TTTTTTTTf,.,o,..,-.,TTTTTTTTTTTTT,.f...,.-aTTTT",
      "TTTT..,,-af,.TTTTTTT,....,,.,.-..TTTTTTTTTTTTT.o,.,,,.-.TTTT",
      "TTTT,.,.-.,ofTTTTTT.-----------..TTTTTTTTTTTTTT,,.f.,.-.TTTT",
      "TTTT....-,...TTTTTT.-..,.,.....TTTTTTTTTTTTTTT,,...,.,-.TTTT",
      "TTTT.,.,-....TTTTT..-,.oa.,..aTTTTTTTTTTTTTTT.---------,TTTT",
      "TTTTT,a,-.,,...,,.,,-,...,..TTTTTTTTTTTTTTTTT,-......,.TTTTT",
      "TTTTTT,.-.f.a,,.,...-..,TTTTTTTTTTTTTTTTTTTTT,-.TTTTTTTTTTTT",
      "TTTTTTT.-a...,....a.-..fTTTTTTTTTTTTTTTTTTTTT.-.TTTTTTTTTTTT",
      "TTTTTTT.-------------..TTTTTTTTTTTTTTTTTTTTTT,-.TTTTTTTTTTTT",
      "TTTTTTTT.,......,..,,TTTTTTTTTTTTTTTTTTTTTTTT.-,.,..,f.TTTTT",
      "TTTTTTTTTT.,ao,,..,TTTTTTTTTTTTTTTTTTTTTTTTT,,-,..,,...,..TT",
      "TTTTTTTTTTTTo,,..TTTTTTTTTTTTTTTTTTTTTTTTTTT..-----------SET",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT,......,,,.,TT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  },
  rio: {
    next: null,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTT,.,..T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTTTT..,,.TT~~~~~TTTTTTTTTT.f..B,,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTT,..f,.o,.~~~~~TTTTTTTTTT,.,,-.,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTT....,...f~~~~~TTTTTTTTTT..f.-.fT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTT,,....,,.~~~~~.,,.TTTTTTTT.,-.fT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTTT.,,a.,.,.~~~~~,a.....TTTTTT.-.TT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTT.---------=====-------,.TTTT.-.TT",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTT.-.....,..~~~~~,.,...-..TTTf.-,,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTT.-....,a..~~~~~,,.,,.-.aTT..,-..T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTT,-.,....,T~~~~~T.....-..TT.a.-.,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTT,-,F.....T~~~~~T.,.,,-..TT,,.-,.T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTT..-..,,..aT~~~~~T,.,.,-.,TT..,-.,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTT.,-,....,.T~~~~~TT...a-.TTT.,,-.,T",
      "TTTTTTTTTTTTTTTTT~~~~~TTTTo,-.,.,.,.T~~~~~TTT...-.TTTT..-..T",
      "TTTTTTTTTT,...TTT~~~~~TTTT,.-,.,,..TT~~~~~TTTTT,-.TTTTT.-,TT",
      "TTTTTTTTTT..,a.,.~~~~~......-.,..,TTT~~~~~TTTT..-..,.TT.-.TT",
      "TTTTTTTT,,-------=====-------.TTTTTTT~~~~~TTTT,,-..f.,T.-,TT",
      "TTTTTTTTT,-.,....~~~~~...,.a.TTTTTTTT~~~~~TTTT..-a,,.,..-,TT",
      "TTTTTTTTT,-..,,.T~~~~~,.....,TTTTTTTT~~~~~TTTTf.---------.TT",
      "TTTT...,..-,.a,.T~~~~~.....,,TTTTTTTT~~~~~TTTT......,....TTT",
      "TTT,.,a...-,,,.,T~~~~~..a....TTTTTTTT~~~~~TTTTT,o....,TTTTTT",
      "TT..,.,,,.-....TT~~~~~Tf..,aTTTTTTTTT~~~~~TTTTTT.....TTTTTTT",
      "TT.,,,....-,..TTT~~~~~TT,.,TTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TT.......,-.TTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TT.,..,...-aTTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TES--------,TTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TT....,..,.TTTTTT~~~~~TTTTTTTTTTTTTTT~~~~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ]
  }
};
const SOLID = "To~GHKFNVPCR";      // G deixa de bloquear quando o chefe da fase cai
const ONE_HIT_LEVELS = 2;        // níveis acima do bicho para abatê-lo só com o golpe de abertura
