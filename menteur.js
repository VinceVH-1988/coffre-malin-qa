function poolMenteur(){
  const active = new Set((S.cfgs.menteur && S.cfgs.menteur.themes) || DEFAULT_MENTEUR_CFG.themes);
  return CONTENU.menteur.filter(it=>active.has(it.theme));
}
function pickMenteurItem(){
  const pool = poolMenteur();
  if(!pool.length) return null;
  let it, guard=0;
  do{ it = pick(pool); } while(it.question===S.lastMenteur && guard++<20);
  S.lastMenteur = it.question;
  return it;
}
function openMenteurQuiz(){
  S.filou = "menteur";
  hideAllScreens();
  $("menteur-screen").classList.add("show");
  if(minuteurDue()) return showMinuteurLock();
  generateMenteurItem();
}
function generateMenteurItem(){
  S.mItem = pickMenteurItem();
  S.mAnswered = false;
  renderMenteur();
}
function renderMenteur(){
  const it = S.mItem;
  $("menteur-rappel").style.display = "none";
  $("menteur-rappel").classList.remove("wrong");
  $("menteur-next").style.display = "none";
  const wrap = $("menteur-choices"); wrap.innerHTML = "";
  if(!it){
    $("menteur-question").textContent = "Aucune question réglée pour ce profil.";
    return;
  }
  $("menteur-question").textContent = it.question;
  if(it.type==="vf"){
    const vBtn = document.createElement("button");
    vBtn.type="button"; vBtn.className="vx-btn vx-true"; vBtn.setAttribute("aria-label","Vrai"); vBtn.textContent="✓";
    vBtn.addEventListener("click", ()=>submitMenteur(true));
    const xBtn = document.createElement("button");
    xBtn.type="button"; xBtn.className="vx-btn vx-false"; xBtn.setAttribute("aria-label","Faux"); xBtn.textContent="✗";
    xBtn.addEventListener("click", ()=>submitMenteur(false));
    wrap.appendChild(vBtn); wrap.appendChild(xBtn);
  }else{
    shuffle(it.choix).forEach(c=>{
      const b=document.createElement("button"); b.type="button"; b.className="choice-chip"; b.textContent=c;
      b.addEventListener("click", ()=>submitMenteur(c));
      wrap.appendChild(b);
    });
  }
}
function submitMenteur(answer){
  if(S.mAnswered || !S.mItem) return;
  S.mAnswered = true;
  const it = S.mItem;
  const correct = answer===it.reponse;
  curStats().tries++;
  if(!correct) curStats().errors++;
  saveStats();
  const rappelEl = $("menteur-rappel");
  rappelEl.innerHTML = (correct ? "Bonne réponse ! " : "Et non ! ") + it.rappel;
  rappelEl.classList.toggle("wrong", !correct);
  rappelEl.style.display = "block";
  $("menteur-choices").querySelectorAll("button").forEach(b=>b.disabled=true);
  $("menteur-next").style.display = "inline-block";
}
$("menteur-next").addEventListener("click", ()=>{ if(minuteurDue()) return showMinuteurLock(); generateMenteurItem(); });
$("menteur-back").addEventListener("click", showFilous);

/* ---------- aide après une erreur ---------- */
