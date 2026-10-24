/* Perguntas da entrevista, da entrevista sênior e das missões de trabalho. */
const INTERVIEW = [
  {q:"Em JavaScript, qual palavra declara uma variável que pode receber outro valor?", a:["const", "let", "return"], ok:1, why:"let permite reatribuir um valor à variável."},
  {q:"O que uma chave primária (PRIMARY KEY) faz em uma tabela?", a:["Identifica cada registro de forma única", "Ordena todos os resultados automaticamente", "Criptografa os dados"], ok:0, why:"A chave primária identifica cada registro e não deve se repetir."},
  {q:"Qual comando SQL consulta dados de uma tabela?", a:["UPDATE", "DELETE", "SELECT"], ok:2, why:"SELECT é usado para consultar dados."},
  {q:"Uma função retorna um erro inesperado. Qual é a melhor primeira atitude?", a:["Apagar o código e reescrever tudo", "Reproduzir o erro e analisar a mensagem/log", "Ignorar se funcionar às vezes"], ok:1, why:"Reproduzir o problema e ler os logs ajuda a encontrar a causa."},
  {q:"Ao receber uma tarefa pouco clara, o que é mais profissional?", a:["Confirmar requisitos e exemplos com quem pediu", "Assumir qualquer coisa sem avisar", "Começar a programar e não testar"], ok:0, why:"Alinhar requisitos reduz retrabalho e deixa as expectativas claras."}
];
const BETTER_INTERVIEW = [
  {q:"Uma consulta SQL está lenta. Qual é um bom próximo passo?", a:["Adicionar índices sem analisar nada", "Examinar o plano de execução e os filtros", "Trocar SELECT por DELETE"], ok:1, why:"O plano de execução ajuda a encontrar gargalos antes de alterar a consulta."},
  {q:"O que é importante ao revisar um pull request?", a:["Ver lógica, testes e legibilidade", "Aprovar sem ler para acelerar", "Alterar tudo para o seu estilo"], ok:0, why:"Uma boa revisão verifica correção, clareza e testes."},
  {q:"Uma API externa retorna HTTP 429. O que isso normalmente indica?", a:["Senha incorreta", "Limite de requisições atingido", "Banco de dados apagado"], ok:1, why:"HTTP 429 indica excesso de requisições; respeite limites e backoff."},
  {q:"Por que usar controle de versão como Git?", a:["Para dispensar testes", "Para guardar histórico e colaborar com segurança", "Para executar SQL mais rápido"], ok:1, why:"Git registra mudanças e facilita colaboração e recuperação."},
  {q:"Uma correção funciona localmente, mas falha em produção. Qual abordagem é melhor?", a:["Investigar diferenças de ambiente e logs", "Remover a validação", "Culpar o usuário e encerrar"], ok:0, why:"Comparar ambientes e analisar logs ajuda a isolar a causa."}
];
const WORK_QUESTIONS = [
  {q:"Missão: corrigir um erro reportado. Qual é o primeiro passo?", a:["Reproduzir o erro e consultar os logs", "Apagar a função inteira", "Publicar direto em produção"], ok:0, why:"Reproduzir o erro dá uma base confiável para investigar."},
  {q:"Missão: buscar clientes cadastrados no banco. Qual comando usar?", a:["INSERT", "SELECT", "DROP"], ok:1, why:"SELECT consulta registros sem alterá-los."},
  {q:"Missão: evitar que uma alteração quebre algo existente. O que fazer?", a:["Pular os testes", "Renomear arquivos aleatoriamente", "Executar testes relevantes antes de entregar"], ok:2, why:"Testes ajudam a detectar regressões antes da entrega."},
  {q:"Missão: um requisito está ambíguo. Qual atitude é melhor?", a:["Confirmar o comportamento esperado", "Inventar a regra", "Ignorar o requisito"], ok:0, why:"Alinhar o requisito reduz retrabalho."},
  {q:"Missão: proteger uma consulta SQL que recebe entrada do usuário. O que preferir?", a:["Concatenar tudo como texto", "Usar consultas parametrizadas", "Desativar o banco"], ok:1, why:"Parâmetros ajudam a evitar SQL injection."},
  {q:"Missão: uma alteração está pronta. Como entregá-la com mais segurança?", a:["Fazer commit sem revisar", "Remover o histórico", "Revisar o diff e validar os testes"], ok:2, why:"Revisar a mudança e validar testes reduz riscos."}
];
