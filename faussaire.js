function poolFaussaire(){
  const active = new Set(curCfg().series);
  return CONTENU.dictee.filter(w=>active.has(w.serie));
}
function pickWord(){
  const pool = poolFaussaire();
  if(!pool.length) return null;
  let w, guard=0;
  do{ w = pick(pool); } while(w.mot===S.lastWord && guard++<20);
  S.lastWord = w.mot;
  return w;
}
function generateWord(){
  S.word = pickWord(); S.input=""; S.spoken=false; render();
}
function normWord(s){ return String(s||"").trim().toLowerCase().replace(/\s+/g," "); }
function checkWord(w, typed){
  const t = normWord(typed);
  if(t===normWord(w.mot)) return {ok:true, usedAlt:false};
  if(w.alt && w.alt.some(a=>normWord(a)===t)) return {ok:true, usedAlt:true};
  return {ok:false};
}
function speakText(text){
  try{
    if(!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance==="undefined") return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR"; u.rate = 0.85;
    window.speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
function renderDictee(){
  if(!S.word) return;
  const ans=$("answer"); ans.textContent=S.input; ans.classList.toggle("empty",!S.input);
  $("word-listen").textContent = S.spoken ? "Réécouter" : "Écouter";
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
}
function helpWord(w){
  let html = `La bonne réponse était : <b>${w.mot}</b>`;
  if(w.piege) html += `<span class="note">Piège : ${w.piege}</span>`;
  return html;
}
function submitWord(){
  if(S.locked || !S.input || !S.word) return;
  curStats().tries++;
  const res = checkWord(S.word, S.input);
  if(res.ok){
    const note = res.usedAlt ? `L'école écrit plutôt : « ${S.word.mot} ».` : null;
    handleFaussaireSuccess(note);
  }else{
    const msg = `Tu as écrit <b>${S.input}</b>. La bonne réponse était <b>${S.word.mot}</b>.`;
    handleFaussaireError(msg, helpWord(S.word));
  }
}

/* ---------- résultat partagé des 3 épreuves du Faussaire ---------- */
function handleFaussaireSuccess(noteMsg){
  if(noteMsg){
    $("word-note").textContent = noteMsg;
    clearTimeout(S._noteTimer); S._noteTimer = setTimeout(()=>{ $("word-note").textContent=""; },1600);
  }
  S.streak++; saveStats();
  if(S.mode==="infini"){
    const prev=S.records[S.recKey]||0;
    if(S.streak>prev){ S.records[S.recKey]=S.streak; store.set(pk("coffre-records",ACTIVE_ID),S.records); }
    if(!S.newRec && S.base>0 && S.streak>S.base){ S.newRec=true; fireworks(1800); }
    return generate();
  }
  if(S.streak>=curCfg().target){ render(); return openVault(); }
  generate();
}
function handleFaussaireError(msgHtml, stepsHtml){
  curStats().errors++; saveStats();
  const v=VILLAIN[S.filou];
  $("catch-who").innerHTML = ART[v.art];
  let msg = msgHtml;
  if(S.mode==="infini"){
    $("catch-title").textContent = `${v.name} t'a eu !`;
    const rec=S.records[S.recKey]||0;
    msg += S.newRec ? `<br><b>Nouveau record : ${S.streak} !</b>` : (S.base===0 && S.streak>0 ? `<br>Série : <b>${S.streak}</b>. C'est ton premier record !` : `<br>Série : <b>${S.streak}</b> · Record : <b>${rec}</b>`);
    $("catch-ok").textContent = "Je continue";
  }else{
    $("catch-title").textContent = `${v.name} a refermé le coffre !`;
    $("catch-ok").textContent = "Je recommence";
  }
  $("catch-msg").innerHTML = msg;
  $("steps").innerHTML = stepsHtml;
  S.streak=0; S.newRec=false; S.locked=true;
  $("vault").classList.remove("shake"); void $("vault").offsetWidth; $("vault").classList.add("shake");
  render(); $("catch").classList.add("show"); $("catch-ok").focus();
}

/* ---------- le trou du Faussaire & repérer-corriger (Le Faussaire) ---------- */
function poolFaussaireActivity(){
  const active = new Set(curCfg().series);
  return CONTENU.faussaire.filter(it=>active.has(it.serie));
}
function pickItem(){
  const pool = poolFaussaireActivity();
  if(!pool.length) return null;
  let it, guard=0;
  do{ it = pick(pool); } while(it.mot===S.lastItem && guard++<20);
  S.lastItem = it.mot;
  return it;
}
function generateItem(){
  S.item = pickItem(); S.picked = null; S.itemIsFaux = Math.random()<0.5; render();
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function renderChoices(choices, onPick){
  const wrap = $("word-choices");
  wrap.innerHTML = "";
  shuffle(choices).forEach(c=>{
    const b=document.createElement("button");
    b.type="button"; b.className="choice-chip"; b.textContent=c;
    b.addEventListener("click", ()=>onPick(c));
    wrap.appendChild(b);
  });
}
function helpItem(it){
  let html = `La bonne réponse était : <b>${it.mot}</b>`;
  if(it.piege) html += `<span class="note">Piège : ${it.piege}</span>`;
  return html;
}
function fitWordZones(){
  const el = $("word-zones");
  if(!el) return;
  el.style.fontSize = "";
  let guard = 0;
  while(el.scrollWidth > el.clientWidth + 1 && guard++ < 30){
    const cur = parseFloat(window.getComputedStyle(el).fontSize);
    if(!(cur>4)) break;
    el.style.fontSize = (cur*0.93) + "px";
  }
}
window.addEventListener("resize", ()=>{
  const kind = currentKind();
  if(kind==="trou"||kind==="correction") fitWordZones();
});
function renderTrou(){
  if(!S.item) return;
  const it = S.item;
  $("word-zones").innerHTML = it.zones.map((z,i)=> i===it.blank ? `<span class="blankzone">?</span>` : `<span>${z}</span>`).join("");
  fitWordZones();
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
  renderChoices(it.choices, submitTrouChoice);
}
function submitTrouChoice(choice){
  if(S.locked || !S.item) return;
  curStats().tries++;
  const it = S.item, correct = it.zones[it.blank];
  if(choice===correct){
    handleFaussaireSuccess(null);
  }else{
    const msg = `Tu as choisi <b>${choice}</b>. La bonne réponse était <b>${correct}</b>.`;
    handleFaussaireError(msg, helpItem(it));
  }
}
function wrongZoneText(it){ const f=it.choices.find(c=>c!==it.zones[it.blank]); return f!==undefined ? f : it.zones[it.blank]; }
function fauxForm(it){ const w=wrongZoneText(it); return it.zones.map((z,k)=>k===it.blank?w:z).join(""); }
function renderVX(onPick){
  const wrap = $("word-choices");
  wrap.innerHTML = "";
  const vBtn = document.createElement("button");
  vBtn.type="button"; vBtn.className="vx-btn vx-true"; vBtn.setAttribute("aria-label","Juste"); vBtn.textContent="✓";
  vBtn.addEventListener("click", ()=>onPick(true));
  const xBtn = document.createElement("button");
  xBtn.type="button"; xBtn.className="vx-btn vx-false"; xBtn.setAttribute("aria-label","Faux"); xBtn.textContent="✗";
  xBtn.addEventListener("click", ()=>onPick(false));
  wrap.appendChild(vBtn); wrap.appendChild(xBtn);
}
function renderCorrection(){
  if(!S.item) return;
  const it = S.item;
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
  if(S.picked===null){
    const zonesToShow = S.itemIsFaux ? it.zones.map((z,i)=> i===it.blank ? wrongZoneText(it) : z) : it.zones;
    $("word-zones").innerHTML = zonesToShow.map(z=>`<span>${z}</span>`).join("");
    fitWordZones();
    renderVX(submitCorrectionVX);
  }else{
    $("word-zones").innerHTML = it.zones.map((z,i)=> i===it.blank ? `<span class="blankzone">?</span>` : `<span>${z}</span>`).join("");
    fitWordZones();
    renderChoices(it.choices, submitCorrectionChoice);
  }
}
function submitCorrectionVX(choseJuste){
  if(S.locked || !S.item || S.picked!==null) return;
  curStats().tries++;
  const it = S.item, actuallyFaux = S.itemIsFaux;
  if(choseJuste && !actuallyFaux){
    handleFaussaireSuccess(null);
  }else if(!choseJuste && actuallyFaux){
    S.picked = "correcting";
    render();
  }else if(choseJuste && actuallyFaux){
    const msg = `Ce mot était fautif : <b>${fauxForm(it)}</b>.`;
    handleFaussaireError(msg, helpItem(it));
  }else{
    const msg = `Ce mot était bien écrit : <b>${it.mot}</b>.`;
    handleFaussaireError(msg, helpItem(it));
  }
}
function submitCorrectionChoice(choice){
  if(S.locked || !S.item) return;
  curStats().tries++;
  const it = S.item, correct = it.zones[it.blank];
  if(choice===correct){
    handleFaussaireSuccess(null);
  }else{
    const msg = `Tu as choisi <b>${choice}</b>. La bonne réponse était <b>${correct}</b>.`;
    handleFaussaireError(msg, helpItem(it));
  }
}

/* ---------- Le Déguiseur : trouver le verbe / habillé-pyjama / infinitif ---------- */
