function poolDeguiseurActivity(act){
  const active = new Set(curCfg().series);
  let pool = CONTENU.deguiseur.filter(it=>active.has(it.serie));
  if(act==="verbe"||act==="infinitif") pool = pool.filter(it=>it.type==="habille");
  return pool;
}
function pickDItem(act){
  const pool = poolDeguiseurActivity(act);
  if(!pool.length) return null;
  let it, guard=0;
  do{ it = pick(pool); } while(it.phrase===S.lastDItem && guard++<20);
  S.lastDItem = it.phrase;
  return it;
}
function generateDItem(){
  S.dItem = pickDItem(S.activite); S.selectedTokens = []; S.input = ""; S.verbeStep = "find"; render();
}
function renderDProgress(){
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
}
function sentenceTokensHTML(it, highlightIdx){
  const hl = highlightIdx || [];
  const parts = [];
  let i = 0;
  while(i < it.tokens.length){
    if(hl.includes(i)){
      const group = [];
      while(i < it.tokens.length && hl.includes(i)){ group.push(it.tokens[i]); i++; }
      parts.push(`<span class="hlverb">${group.join(" ")}</span>`);
    }else{
      parts.push(`<span>${it.tokens[i]}</span>`);
      i++;
    }
  }
  return parts.join(" ");
}
function renderVerbe(){
  if(!S.dItem) return;
  const it = S.dItem;
  if(S.verbeStep==="infinitif"){
    $("verbe-pad").classList.remove("show");
    $("dictee-pad").classList.add("show");
    $("sentence-zone").innerHTML = sentenceTokensHTML(it, it.verbeIdx);
    const ans=$("answer"); ans.style.display="flex"; ans.textContent=S.input; ans.classList.toggle("empty",!S.input);
    renderDProgress();
    return;
  }
  $("dictee-pad").classList.remove("show");
  $("verbe-pad").classList.add("show");
  $("answer").style.display="none";
  const zone = $("sentence-zone");
  zone.innerHTML = it.tokens.map((t,i)=>`<button type="button" class="tokbtn${S.selectedTokens.includes(i)?" selected":""}" data-i="${i}">${t}</button>`).join(" ");
  zone.querySelectorAll(".tokbtn").forEach(b=>{
    b.addEventListener("click", ()=>{
      if(S.locked) return;
      const i = +b.dataset.i;
      const idx = S.selectedTokens.indexOf(i);
      if(idx>=0) S.selectedTokens.splice(idx,1); else S.selectedTokens.push(i);
      renderVerbe();
    });
  });
  renderDProgress();
}
function submitVerbe(){
  if(S.locked || !S.dItem) return;
  if(S.verbeStep==="infinitif") return submitInfinitif();
  curStats().tries++;
  const it = S.dItem;
  const a = [...S.selectedTokens].sort((x,y)=>x-y);
  const b = [...it.verbeIdx].sort((x,y)=>x-y);
  const ok = a.length===b.length && a.length>0 && a.every((v,i)=>v===b[i]);
  if(ok){
    if(curCfg().fusionInfinitif !== false){
      S.verbeStep = "infinitif"; S.input = ""; render();
    }else{
      handleFaussaireSuccess(null);
    }
  }else{
    const verbTxt = it.verbeIdx.map(i=>it.tokens[i]).join(" ");
    const msg = `Le verbe habillé était <b>${verbTxt}</b>.`;
    const steps = it.negatif ? `${it.negatif}<span class="note">Le verbe conjugué se trouve entre « ne » et « pas ».</span>` : `La bonne réponse était : <b>${verbTxt}</b>`;
    handleFaussaireError(msg, steps);
  }
}
function renderHabille(){
  if(!S.dItem) return;
  const it = S.dItem;
  $("sentence-zone").innerHTML = sentenceTokensHTML(it, it.verbeIdx);
  renderDProgress();
}
function submitHabille(choice){
  if(S.locked || !S.dItem) return;
  curStats().tries++;
  const it = S.dItem;
  if(choice===it.type){
    handleFaussaireSuccess(null);
  }else{
    const label = it.type==="habille" ? "habillé" : "en pyjama";
    const msg = `Ce verbe était <b>${label}</b>.`;
    const steps = `Habillé : il change avec la personne, on sait qui fait l'action et quand.<br>En pyjama : il ne change jamais, il se termine par ER, IR, OIR ou RE.`;
    handleFaussaireError(msg, steps);
  }
}
function renderInfinitif(){
  if(!S.dItem) return;
  const it = S.dItem;
  $("sentence-zone").innerHTML = sentenceTokensHTML(it, it.verbeIdx);
  const ans=$("answer"); ans.textContent=S.input; ans.classList.toggle("empty",!S.input);
  renderDProgress();
}
function submitInfinitif(){
  if(S.locked || !S.input || !S.dItem) return;
  curStats().tries++;
  const it = S.dItem;
  if(normWord(S.input)===normWord(it.infinitif)){
    handleFaussaireSuccess(null);
  }else{
    const msg = `Tu as écrit <b>${S.input}</b>. La bonne réponse était <b>${it.infinitif}</b>.`;
    const steps = `L'infinitif : <b>${it.infinitif}</b><span class="note">Petit truc : « C'est l'action de ${it.infinitif}… » ou « Il faut ${it.infinitif}… ».</span>`;
    handleFaussaireError(msg, steps);
  }
}

/* ---------- Le Menteur : quiz d'éveil sans enjeu (pas de coffre, pas de record) ---------- */
