/* Entrevistas e missões de trabalho em Curitiba (perguntas com resposta certa). */
function startChallenge(kind) {
  $("homeButton").hidden = true;
  challengeKind = kind;
  mode = kind === "work" ? "work" : kind === "betterInterview" ? "betterInterview" : "interview";
  activeQuestions = kind === "work" ? WORK_QUESTIONS.slice((G.jobMissions||0)%3).concat(WORK_QUESTIONS.slice(0,(G.jobMissions||0)%3)).slice(0,3) : kind === "betterInterview" ? BETTER_INTERVIEW : INTERVIEW;
  interviewIndex = 0; busy = false; musicStop();
  const mh = 40 + 6 * (G.lv - 1); p = {hp:mh, max:mh, sp:20, msp:20, def:false, atento:false, man:0};
  $("map").hidden = true; $("over").hidden = true; $("cmds").innerHTML = "";
  const title = kind === "work" ? "Missão de trabalho" : kind === "betterInterview" ? "Entrevista sênior" : "Entrevista";
  $("plate").querySelector("b").textContent = title; $("plate").querySelector(".lv").textContent = kind === "work" ? "Tarefa 1/3" : `Pergunta 1/${activeQuestions.length}`;
  const isWork = kind === "work"; $("game").classList.toggle("working-mode", isWork);
  $("stage").classList.toggle("working", isWork);
  $("workScene").hidden = !isWork;
  $("beast").innerHTML = "";
  if (!isWork) $("beast").appendChild(interviewerSprite());
  $("beast").style.display = isWork ? "none" : "";
  $("beast").className = "beast"; $("beast").style.top = "calc(46% - 13 * var(--px) + 12px)"; $("beast").style.right = "12%"; $("beast").setAttribute("aria-label", kind === "work" ? "Escritório" : "Entrevistador");
  refreshHero(true); $("hero").style.display = isWork ? "none" : "";
  $("officePerson").innerHTML = ""; $("officePerson").appendChild(workerSprite());
  $("intent").style.display = ""; $("ehp").parentElement.style.display = "none"; $("spTxt").parentElement.style.display = "none"; $("sp").parentElement.style.display = "none";
  lines = [kind === "work" ? "Você recebeu uma tarefa de programação. Resolva os três desafios para concluir a missão." : kind === "betterInterview" ? "A empresa oferece salário maior. Mostre que sua experiência cresceu." : "Você se senta diante do recrutador. Responda corretamente às cinco perguntas para conquistar a vaga."];
  $("lvTxt").textContent = title; renderInterview(); musicStart(kind === "work" ? "work" : "interview");
  // o entrevistador também respira e se mexe
  const c = $("beast").querySelector("canvas");
  if (c && !isWork) BEAST_A.mount($("beast"), c, {id: "entrevistador", person: true});
}
function renderInterview() {
  const q = activeQuestions[interviewIndex];
  $("pv").style.width = (100 * p.hp / p.max) + "%"; $("pvTxt").textContent = p.hp + " / " + p.max;
  $("log").innerHTML = `<p>${lines[lines.length-1] || ""}</p>`;
  $("intentTxt").textContent = challengeKind === "work" ? `Tarefa ${interviewIndex+1} de ${activeQuestions.length}` : `Pergunta ${interviewIndex+1} de ${activeQuestions.length}`;
  $("intent").className = "intent known"; $("status").textContent = "Responda com atenção. Resposta errada custa PV.";
  $("desc").textContent = q.q; $("cmds").innerHTML = "";
  if (challengeKind === "work") {
    $("game")?.classList.add("working-mode");
    const screen = $("monitorScreen");
    screen.innerHTML = `<div class="monitor-task">OBJETIVO ${interviewIndex+1}/${activeQuestions.length}</div><div class="monitor-question">${q.q}</div><div class="monitor-answers" id="monitorAnswers"></div><div class="monitor-foot"><span>▲ ▼ SELECIONAR</span><span>ENTER / CLIQUE</span></div>`;
    q.a.forEach((answer, idx) => { const b=document.createElement("button"); b.className="monitor-answer"; b.type="button"; b.innerHTML=`<b>${String.fromCharCode(65+idx)}.</b> ${answer}`; b.addEventListener("click",()=>answerInterview(idx)); $("monitorAnswers").appendChild(b); });
    $("cmds").innerHTML = ""; $("desc").textContent = "Escolha a resposta diretamente no monitor.";
  } else {
    $("game")?.classList.remove("working-mode");
    q.a.forEach((answer, idx) => { const b=document.createElement("button"); b.className="cmd"; b.type="button"; b.innerHTML=`<span>${String.fromCharCode(65+idx)}. ${answer}</span>`; b.addEventListener("click",()=>answerInterview(idx)); $("cmds").appendChild(b); });
  }
}
function answerInterview(choice) {
  if (busy || !["interview","betterInterview","work"].includes(mode)) return; busy = true;
  const q = activeQuestions[interviewIndex];
  HERO_A.set(choice === q.ok ? "cheer" : "hurt");
  if (choice === q.ok) {
    lines.push("Resposta correta! " + q.why); sfx("more"); interviewIndex++;
    if (interviewIndex >= activeQuestions.length) { lines.push(challengeKind === "work" ? "Missão concluída!" : "Você respondeu a tudo corretamente!"); $("log").innerHTML = lines.slice(-3).map(l=>`<p>${l}</p>`).join(""); setTimeout(()=>finishChallenge(true),350); return; }
    setTimeout(()=>{ busy=false; $("plate").querySelector(".lv").textContent=challengeKind === "work" ? `Tarefa ${interviewIndex+1}/3` : `Pergunta ${interviewIndex+1}/${activeQuestions.length}`; renderInterview(); },450);
  } else {
    const d = rnd(9,13); p.hp = Math.max(0,p.hp-d); lines.push(`Resposta incorreta. −${d} PV. ${q.why}`); sfx("hurt");
    if (p.hp <= 0) { renderInterview(); setTimeout(()=>finishChallenge(false),350); return; }
    setTimeout(()=>{ busy=false; renderInterview(); },550);
  }
}
function finishChallenge(success) {
  busy=true; musicStop();
  if (success && challengeKind === "interview") { G.job=true; G.jobXp=G.jobXp||0; save(); fanfare("win"); }
  else if (success && challengeKind === "betterInterview") { G.betterJob=true; save(); fanfare("win"); }
  else if (success && challengeKind === "work") {
    const xp=60, cash=G.betterJob?140:85; G.jobXp=(G.jobXp||0)+xp; G.jobMissions=(G.jobMissions||0)+1; G.xp+=xp; G.money+=cash;
    while(G.xp>=need(G.lv)){G.xp-=need(G.lv);G.lv++;}
    save(); fanfare("win");
  } else fanfare("lose");
  if (success && challengeKind === "work") { $("overTitle").textContent="Missão concluída!"; $("overTxt").textContent=`Boa entrega! Você ganhou 60 XP de programador, R$ ${G.betterJob?140:85} e agora tem ${G.jobXp} XP profissional. ${!G.betterJob && G.jobXp>=150 ? "Uma entrevista para uma empresa melhor foi desbloqueada!" : "Continue trabalhando para evoluir."}`; }
  else if (success && challengeKind === "betterInterview") { $("overTitle").textContent="Novo emprego conquistado!"; $("overTxt").textContent="Rhanon conseguiu uma vaga melhor. Agora veste blazer, gravata e óculos escuros, e recebe mais pelas missões."; }
  else if (success) { $("overTitle").textContent="Você conseguiu o emprego!"; $("overTxt").textContent="Rhanon passou na entrevista e conquistou a primeira vaga de programador em Curitiba. Complete missões para ganhar XP profissional e desbloquear uma empresa melhor."; }
  else { $("overTitle").textContent="Desafio encerrado"; $("overTxt").textContent="Você perdeu todos os PV. Respire, revise os conceitos e tente novamente."; }
  $("again").textContent = success ? "Continuar" : "Tentar novamente";
  $("over").hidden=false; $("again").focus();
}
