/* ---------- Madame Pagaille : l'ordre alphabétique (fiche F11 de l'école) ----------
   « series » contient les niveaux réglés : 1 = on compare la 1re lettre, 2 = la 2e, 3 = la 3e.
   Les listes de contenu.json sont rangées dans le bon ordre ; l'app les mélange à l'affichage. */
function poolPagaille(act){
  const niveaux = new Set((curCfg().series||[]).map(Number));
  return (CONTENU.pagaille||[]).filter(it => it.type===act && niveaux.has(Number(it.niveau)));
}
function pickPItem(act){
  const pool = poolPagaille(act);
  if(!pool.length) return null;
  let it, guard=0;
  do{ it = pick(pool); } while(it.mots.join("·")===S.lastPItem && guard++<20);
  S.lastPItem = it.mots.join("·");
  return it;
}
/* Mélange en s'assurant que la liste affichée n'est pas déjà dans l'ordre alphabétique. */
function shuffleDesordre(mots){
  if(mots.length<2) return [...mots];
  let out, guard=0;
  do{ out = shuffle(mots); } while(out.every((m,i)=>m===mots[i]) && guard++<20);
  return out;
}
function generatePItem(){
  S.pItem = pickPItem(S.activite);
  S.pOrdre = [];
  S.pMots = S.pItem ? (S.activite==="ordre" ? shuffleDesordre(S.pItem.mots) : [...S.pItem.mots]) : [];
  render();
}
function renderPProgress(){
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
}
function renderOrdre(){
  const zone = $("pagaille-zone");
  if(!S.pItem){ zone.innerHTML = '<div class="pag-vide">Aucune liste réglée pour ce profil.</div>'; $("pagaille-pad").classList.remove("show"); return; }
  zone.innerHTML = S.pOrdre.map((m,i)=>`<button type="button" class="pag-slot" data-m="${i}"><span class="pag-num">${i+1}</span>${m}</button>`).join("");
  zone.querySelectorAll(".pag-slot").forEach(b=>b.addEventListener("click", ()=>{
    if(S.locked) return;
    S.pOrdre.splice(+b.dataset.m,1);
    render();
  }));
  const bank = $("pagaille-mots");
  const restants = S.pMots.filter(m=>!S.pOrdre.includes(m));
  bank.innerHTML = restants.map(m=>`<button type="button" class="pag-mot cursive">${m}</button>`).join("");
  bank.querySelectorAll(".pag-mot").forEach(b=>b.addEventListener("click", ()=>{
    if(S.locked) return;
    S.pOrdre.push(b.textContent);
    render();
  }));
  const done = S.pOrdre.length===S.pMots.length;
  $("pagaille-validate").disabled = !done;
  renderPProgress();
}
function submitOrdre(){
  if(S.locked || !S.pItem) return;
  if(S.pOrdre.length!==S.pMots.length) return;
  curStats().tries++;
  const bon = S.pItem.mots;
  if(S.pOrdre.every((m,i)=>m===bon[i])){
    handleFaussaireSuccess(null);
  }else{
    const msg = `Ce n'était pas le bon ordre.`;
    const steps = `<b>${bon.join(" · ")}</b><span class="note">On regarde la 1re lettre ; si elle est identique, la 2e ; si la 2e est identique, la 3e, et ainsi de suite.</span>`;
    handleFaussaireError(msg, steps);
  }
}
function renderIntrus(){
  const zone = $("pagaille-zone");
  const bank = $("pagaille-mots");
  if(!S.pItem){ zone.innerHTML = '<div class="pag-vide">Aucune liste réglée pour ce profil.</div>'; bank.innerHTML=""; return; }
  /* La consigne reste dans le coffre ; les mots à toucher descendent dans la zone basse,
     pour que les cibles soient grandes (le coffre est petit sur un iPhone). */
  zone.innerHTML = '<div class="pag-consigne">Un seul mot est mal rangé.</div>';
  bank.innerHTML = S.pMots.map((m,i)=>`<button type="button" class="pag-mot cursive" data-i="${i}">${m}</button>`).join("");
  bank.querySelectorAll(".pag-mot").forEach(b=>b.addEventListener("click", ()=>submitIntrus(b.textContent)));
  renderPProgress();
}
function submitIntrus(mot){
  if(S.locked || !S.pItem) return;
  curStats().tries++;
  if(mot===S.pItem.intrus){
    handleFaussaireSuccess(null);
  }else{
    const msg = `L'intrus était <b>${S.pItem.intrus}</b>.`;
    const place = S.pItem.place ? `<span class="note">Sa place : ${S.pItem.place}.</span>` : "";
    const steps = `<b>${S.pItem.intrus}</b>${place}`;
    handleFaussaireError(msg, steps);
  }
}
$("pagaille-validate").addEventListener("click", submitOrdre);
