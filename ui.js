function places(n){ const out=[]; const h=Math.floor(n/100)*100, d=Math.floor(n%100/10)*10, u=n%10; if(h) out.push(h); if(d) out.push(d); if(u) out.push(u); return out; }
function help(q){
  const {op,a,b,r}=q;
  if(op==="add"||op==="sub"){
    const s = op==="add"?"+":"−", f = op==="add" ? (x,y)=>x+y : (x,y)=>x-y;
    if(b<10){
      const u=a%10;
      if(op==="add" && u+b>=10){ const t=10-u, n=a+t; return `${a} + ${t} = ${n}<br>${n} + ${b-t} = ${r}<span class="note">Je coupe ${b} en ${t} et ${b-t} pour passer par la dizaine ${n}.</span>`; }
      if(op==="sub" && u<b){
        if(u===0) return `${a} − 10 = ${a-10}<br>${a-10} + ${10-b} = ${r}<span class="note">J'enlève 10, puis je rends les ${10-b} de trop.</span>`;
        const n=a-u; return `${a} − ${u} = ${n}<br>${n} − ${b-u} = ${r}<span class="note">Je coupe ${b} en ${u} et ${b-u} pour passer par la dizaine ${n}.</span>`;
      }
    }
    const parts=places(b); let cur=a, lines=[];
    for(const p of parts){ const nx=f(cur,p); lines.push(`${cur} ${s} ${p} = ${nx}`); cur=nx; }
    return lines.join("<br>")+`<span class="note">Je découpe ${b} en ${parts.join(" + ")} et j'avance étape par étape.</span>`;
  }
  if(op==="mul"){
    if(q.form==="du*u"){ const d=Math.floor(a/10)*10, u=a%10; return `${d} x ${b} = ${d*b}<br>${u} x ${b} = ${u*b}<br>${d*b} + ${u*b} = ${r}<span class="note">Je multiplie les dizaines, puis les unités, et j'additionne.</span>`; }
    const t=q.t, n=r/t;
    if(n<=1) return `${n} x ${t} = ${r}<span class="note">${n===1?"Une fois "+t+", c'est "+t+".":"Zéro fois, c'est zéro."}</span>`;
    return `${n-1} x ${t} = ${(n-1)*t}<br>${(n-1)*t} + ${t} = ${r}<span class="note">Je pars de ${n-1} x ${t} et j'ajoute encore ${t}.</span>`;
  }
  return `${r} x ${b} = ${a}<br>donc ${a} : ${b} = ${r}<span class="note">Dans la maison, le toit est ${a} et en bas ${r} x ${b}. Je cherche dans la table de ${b}.</span>`;
}

/* ---------- records par combinaison d'opérations, par filou ---------- */
const sorted = arr => [...arr].sort((x,y)=>String(x).localeCompare(String(y),undefined,{numeric:true}));
/* Les clés sont préfixées par le filou (ex. "retenues:add:du+u:avec") : ça sépare proprement
   records et statistiques par filou, même quand deux filous partageraient la même combinaison. */
function comboKeyCalc(filou){
  const k=[];
  if(filou!=="tables"){
    const c=S.cfgs.retenues;
    if(c.add.on&&c.add.forms.length) k.push(`add:${sorted(c.add.forms).join(",")}:${c.add.pass}`);
    if(c.sub.on&&c.sub.forms.length) k.push(`sub:${sorted(c.sub.forms).join(",")}:${c.sub.pass}`);
  }
  if(filou!=="retenues"){
    const c=S.cfgs.tables;
    if(c.mul.on&&(c.mul.tables.length||c.mul.extra.length)) k.push(`mul:${sorted(c.mul.tables).join(",")}:${sorted(c.mul.extra).join(",")}`);
    if(c.div.on&&c.div.tables.length) k.push(`div:${sorted(c.div.tables).join(",")}`);
  }
  return k.join("|");
}
function scopedKey(filou){
  if(filou==="faussaire"){
    const act = S.activite||"dictee";
    const c = S.cfgs.faussaire[act];
    return `faussaire:${act}:${sorted(c.series).join(",")}`;
  }
  if(filou==="deguiseur"){
    const act = S.activite||"verbe";
    const c = S.cfgs.deguiseur[act];
    return `deguiseur:${act}:${sorted(c.series).join(",")}`;
  }
  if(filou==="pagaille"){
    const act = S.activite||"ordre";
    const c = S.cfgs.pagaille[act];
    return `pagaille:${act}:${sorted(c.series).join(",")}`;
  }
  if(filou==="menteur"){
    return `menteur:${sorted(S.cfgs.menteur.themes).join(",")}`;
  }
  return `${filou}:${comboKeyCalc(filou)}`;
}
const PASS_TXT = {avec:"avec passage", sans:"sans passage", mix:"avec ou sans passage"};
const FAUSSAIRE_ACT_LABEL = {dictee:"Dictée", trou:"Le trou du Faussaire", correction:"Repérer et corriger",
  verbe:"Trouver le verbe", habille:"Habillé ou en pyjama ?", infinitif:"Écrire l'infinitif", habiller:"Habiller les verbes",
  ordre:"Le grand livre en désordre", intrus:"Trouve l'intrus"};
const FILOU_LABEL = {retenues:"Le Faussaire des Retenues", tables:"Le Tricheur des Tables", mix:"Calcul mélangé"};
function describeCombo(combo){
  if(!combo) return "Aucune épreuve réglée";
  return combo.split("|").map(part=>{
    const [op,x,y]=part.split(":");
    if(op==="add"||op==="sub"){ const forms=x.split(",").map(f=>FORMS[op][f]?FORMS[op][f][0]:f).join(", "); return `${op==="add"?"Additions":"Soustractions"} ${forms}, ${PASS_TXT[y]||y}`; }
    if(op==="mul"){ const t=x?`tables de ${x.split(",").join(", ")}`:""; const e=y?"DU x U":""; return `Multiplications ${[t,e].filter(Boolean).join(" et ")}`; }
    if(op==="div") return `Divisions tables de ${x.split(",").join(", ")}`;
    return part;
  }).join(" · ");
}
function describeKey(key){
  if(!key) return "Aucune épreuve réglée";
  const i = key.indexOf(":");
  const filou = i<0 ? key : key.slice(0,i);
  const rest = i<0 ? "" : key.slice(i+1);
  if(filou==="faussaire"||filou==="deguiseur"){
    const j = rest.indexOf(":");
    const act = j<0 ? rest : rest.slice(0,j);
    const series = j<0 ? "" : rest.slice(j+1);
    return series ? `${FAUSSAIRE_ACT_LABEL[act]||act} · séries ${series.split(",").join(", ")}` : `${FAUSSAIRE_ACT_LABEL[act]||act} · aucune série`;
  }
  if(filou==="pagaille"){
    const j = rest.indexOf(":");
    const act = j<0 ? rest : rest.slice(0,j);
    const niv = j<0 ? "" : rest.slice(j+1);
    const txt = niv ? niv.split(",").map(n=>PAGAILLE_NIVEAU_LABEL[n]||n).join(", ") : "";
    return txt ? `${FAUSSAIRE_ACT_LABEL[act]||act} · ${txt}` : `${FAUSSAIRE_ACT_LABEL[act]||act} · aucune difficulté`;
  }
  if(filou==="menteur"){
    return rest ? `Le Menteur · thèmes ${rest.split(",").map(t=>MENTEUR_THEME_LABEL[t]||t).join(", ")}` : "Le Menteur · aucun thème";
  }
  if(filou==="retenues"||filou==="tables"||filou==="mix"){
    return describeCombo(rest);
  }
  return key;
}
const currentRecord = () => S.records[scopedKey(S.filou)]||0;
/* ---------- statistiques détaillées par épreuve réglée (même clé que les records) ---------- */
function curStats(){
  const k = scopedKey(S.filou);
  if(!S.stats[k]) S.stats[k] = {tries:0, errors:0, opens:0};
  return S.stats[k];
}
function saveStats(){ store.set(pk("coffre-stats",ACTIVE_ID), S.stats); }

/* ---------- minuteur de temps de jeu quotidien ----------
   Le temps n'est compté que pendant une épreuve (jamais dans les menus). Une erreur ou une réussite en
   cours ne sont jamais interrompues : le blocage n'est posé qu'aux points d'arrêt naturels déjà existants
   (restart(), closeCatch(), question suivante du Menteur), jamais en pleine saisie d'une réponse. */
function saveMinuteurUsage(){ store.set(pk("coffre-minuteur-usage",ACTIVE_ID), S.minuteurUsage); }
function minuteurLimitSeconds(filou){
  if(S.minuteur.mode==="global") return S.minuteur.global*60;
  if(S.minuteur.mode==="perFilou") return (S.minuteur.perFilou[filou]||0)*60;
  return Infinity;
}
function minuteurUsedSeconds(filou){ return S.minuteur.mode==="global" ? S.minuteurUsage.seconds : (S.minuteurUsage.perFilou[filou]||0); }
function minuteurBonusSeconds(filou){ return S.minuteur.mode==="global" ? (S.minuteurUsage.bonusGlobal||0) : (S.minuteurUsage.bonusPerFilou[filou]||0); }
function minuteurDue(){
  if(!ACTIVE_ID || !S.minuteur || S.minuteur.mode==="none" || !S.filou) return false;
  return minuteurUsedSeconds(S.filou) >= minuteurLimitSeconds(S.filou) + minuteurBonusSeconds(S.filou);
}
function isPlayingEpreuve(){
  if(!ACTIVE_ID) return false;
  if($("menteur-screen").classList.contains("show")) return true;
  const menus = ["profiles","filous","activites","home","avatarcreate","settings","pin"];
  if(menus.some(id=>$(id).classList.contains("show"))) return false;
  return !!S.mode;
}
function tickMinuteur(){
  if(!ACTIVE_ID || !S.minuteurUsage) return;
  const today = todayStr();
  if(S.minuteurUsage.date !== today){ S.minuteurUsage = {date:today, seconds:0, perFilou:{}, bonusGlobal:0, bonusPerFilou:{}}; saveMinuteurUsage(); }
  if(!S.minuteur || S.minuteur.mode==="none") return;
  if(!isPlayingEpreuve()) return;
  if(S.minuteur.mode==="global") S.minuteurUsage.seconds++;
  else S.minuteurUsage.perFilou[S.filou] = (S.minuteurUsage.perFilou[S.filou]||0)+1;
  saveMinuteurUsage();
}
setInterval(tickMinuteur, 1000);
function showMinuteurLock(){ $("minuteur-lock").classList.add("show"); }
function minuteurUnlock(){
  const bonus = (S.minuteur.bonus||0)*60;
  if(S.minuteur.mode==="global") S.minuteurUsage.bonusGlobal = (S.minuteurUsage.bonusGlobal||0) + bonus;
  else S.minuteurUsage.bonusPerFilou[S.filou] = (S.minuteurUsage.bonusPerFilou[S.filou]||0) + bonus;
  saveMinuteurUsage();
  $("minuteur-lock").classList.remove("show");
  if($("menteur-screen").classList.contains("show")) generateMenteurItem();
  else goHome();
}
$("minuteur-lock-unlock").addEventListener("click", ()=>pinOpen("minuteur"));

/* Ajuste la taille de la réponse écrite à sa longueur, pour ne jamais déborder de la plaque. */
function fitAnswer(){
  const el=$("answer"), n=(el.textContent||"").length;
  el.classList.toggle("long", n>8 && n<=13);
  el.classList.toggle("xlong", n>13);
}

/* ---------- affichage ---------- */
function buildBolts(){
  if(S.mode==="infini"||S.mode==="montre"){ $("bolts-l").innerHTML=""; $("bolts-r").innerHTML=""; return; }
  const n=curCfg().target, left=Math.ceil(n/2);
  $("bolts-l").innerHTML = '<span class="bolt"></span>'.repeat(left);
  $("bolts-r").innerHTML = '<span class="bolt"></span>'.repeat(n-left);
}
/* Ce que l'enfant enchaîne : des calculs, des phrases, des mots, des verbes ou des listes. */
function uniteDe(kind){
  if(kind==="calc") return "calculs";
  if(kind==="verbe"||kind==="habille"||kind==="infinitif") return "phrases";
  if(kind==="habiller") return "verbes";
  if(kind==="ordre"||kind==="intrus") return "listes";
  return "mots";
}
function leadText(){
  const kind = currentKind();
  const unite = uniteDe(kind);
  $("title").textContent = S.mode==="infini" ? "Mode infini" : S.mode==="montre" ? "Contre la montre" : "Le coffre des Filous";
  $("lead").innerHTML = S.mode==="infini"
    ? `Enchaîne les ${unite} justes le plus longtemps possible.`
    : S.mode==="montre"
    ? `Résous le plus de calculs possible en <b>2 minutes</b>.`
    : `Réussis <b>${curCfg().target}</b> ${unite} d'affilée pour ouvrir le coffre. Une seule erreur, et il se referme !`;
}
function render(){
  const kind = currentKind();
  if(kind==="dictee") return renderDictee();
  if(kind==="trou") return renderTrou();
  if(kind==="correction") return renderCorrection();
  if(kind==="verbe") return renderVerbe();
  if(kind==="habille") return renderHabille();
  if(kind==="infinitif") return renderInfinitif();
  if(kind==="habiller") return renderHabiller();
  if(kind==="ordre") return renderOrdre();
  if(kind==="intrus") return renderIntrus();
  if(!S.q) return;
  const q=S.q, txt=`${q.a} ${SYM[q.op]} ${q.b} =`;
  $("calc").textContent = txt; $("calc").classList.toggle("long", txt.length>10);
  const ans=$("answer"); ans.textContent=S.input; ans.classList.toggle("empty",!S.input); fitAnswer();
  const p=$("progress");
  if(S.mode==="infini"){ p.textContent = S.newRec ? `Série : ${S.streak} · Nouveau record !` : `Série : ${S.streak} · Record : ${S.records[S.recKey]||0}`; p.classList.toggle("rec",S.newRec); }
  else if(S.mode==="montre"){
    const rem = Math.max(0,montreRemaining), mm=Math.floor(rem/60), ss=String(rem%60).padStart(2,"0");
    p.textContent = `Temps : ${mm}:${ss} · Calculs justes : ${montreScore}`;
    p.classList.remove("rec");
  }
  else { p.textContent = `Verrous ouverts : ${S.streak} sur ${curCfg().target}`; p.classList.remove("rec"); }
  document.querySelectorAll(".bolt").forEach((el,i)=>el.classList.toggle("done", i<S.streak));
}

/* ---------- accueil (écran du filou choisi) ---------- */
function applyKindUI(){
  const kind = currentKind();
  const isDeg = kind==="verbe"||kind==="habille"||kind==="infinitif"||kind==="habiller";
  const isPag = kind==="ordre"||kind==="intrus";
  $("pad").style.display = kind==="calc" ? "grid" : "none";
  $("dictee-pad").classList.toggle("show", kind==="dictee"||kind==="infinitif"||kind==="habiller");
  $("choice-pad").classList.toggle("show", kind==="trou"||kind==="correction");
  $("verbe-pad").classList.toggle("show", kind==="verbe");
  $("habille-pad").classList.toggle("show", kind==="habille");
  $("calc").style.display = kind==="calc" ? "block" : "none";
  $("word-listen").style.display = kind==="dictee" ? "inline-block" : "none";
  $("word-note").style.display = kind==="dictee" ? "block" : "none";
  $("word-zones").style.display = (kind==="trou"||kind==="correction") ? "block" : "none";
  $("sentence-zone").style.display = isDeg ? "flex" : "none";
  $("pagaille-zone").style.display = isPag ? "flex" : "none";
  $("pagaille-pad").classList.toggle("show", isPag);
  $("pagaille-validate").style.display = kind==="ordre" ? "" : "none";
  $("answer").style.display = (kind==="calc"||kind==="dictee"||kind==="infinitif"||kind==="habiller") ? "flex" : "none";
  $("go-montre").style.display = kind==="calc" ? "flex" : "none";
}
function goHome(){
  stopFx(); clearMontreInterval(); S.locked=true; $("catch").classList.remove("show");
  $("vault").classList.remove("open"); $("pad").style.visibility="visible"; $("again").style.display="none";
  const f = FILOUS.find(x=>x.id===S.filou);
  const kind = currentKind();
  const isWord = kind!=="calc";
  applyKindUI();
  const acts = ACTIVITIES_BY_FILOU[S.filou];
  const titre = acts ? (acts.find(a=>a.id===S.activite)||{}).nom : (f ? f.nom : "Le coffre des Filous");
  $("home-title").textContent = titre || "Le coffre des Filous";
  $("home-art").innerHTML = ART[f.art];
  $("home-back").textContent = acts ? "Épreuves" : "Filous";
  $("filous-link").textContent = acts ? "Épreuves" : "Filous";
  const unite = uniteDe(kind);
  $("desc-coffre").textContent = isWord ? `Réussis ${curCfg().target} ${unite} d'affilée pour ouvrir le coffre.` : `Réussis ${curCfg().target} calculs d'affilée pour ouvrir le coffre.`;
  const r=currentRecord();
  $("desc-infini").textContent = r ? `Des ${unite} sans fin. Ton record : ${r}` : `Des ${unite} sans fin. Établis ton premier record !`;
  if(kind==="calc"){
    const recMontre = S.records["montre:"+scopedKey(S.filou)]||0;
    $("desc-montre").textContent = recMontre ? `Le plus de calculs en 2 minutes. Ton record : ${recMontre}` : `Le plus de calculs en 2 minutes. Établis ton premier record !`;
  }
  $("home-info").textContent = (kind==="calc" ? "Calculs : " : "Épreuve : ") + describeKey(scopedKey(S.filou));
  $("home").classList.add("show");
}
function startMode(m){
  S.mode=m; S.recKey = m==="montre" ? "montre:"+scopedKey(S.filou) : scopedKey(S.filou); S.newRec=false;
  $("home").classList.remove("show"); restart();
}

/* ---------- contre la montre ---------- */
let montreInterval=null, montreRemaining=120, montreScore=0;
function clearMontreInterval(){ if(montreInterval){ clearInterval(montreInterval); montreInterval=null; } }
function montreTick(){
  if(S.locked) return;
  montreRemaining--; render();
  if(montreRemaining<=0) finishMontre();
}
function finishMontre(){
  clearMontreInterval(); S.locked=true;
  const prev=S.records[S.recKey]||0, isRecord = montreScore>prev;
  if(isRecord){ S.records[S.recKey]=montreScore; store.set(pk("coffre-records",ACTIVE_ID),S.records); }
  $("in-label").textContent = "Temps écoulé !";
  $("code-out").textContent = String(montreScore);
  $("code-out").classList.remove("words");
  $("in-hint").textContent = isRecord ? "Nouveau record de calculs !" : `Ton record : ${Math.max(prev,montreScore)} calculs.`;
  setTimeout(()=>$("vault").classList.add("open"),350);
  if(isRecord) setTimeout(()=>fireworks(3000),900);
  $("pad").style.visibility="hidden"; $("again").style.display="inline-block";
  $("lead").textContent = `Tu as résolu ${montreScore} calcul${montreScore>1?"s":""} en 2 minutes !`;
}

/* ---------- jeu ---------- */
function submit(){
  const kind = currentKind();
  if(kind==="dictee") return submitWord();
  if(kind==="trou"||kind==="correction") return;
  if(kind==="infinitif") return submitInfinitif();
  if(kind==="habiller") return submitHabiller();
  if(kind==="ordre") return submitOrdre();
  if(kind==="intrus") return;
  if(kind==="verbe"){ if(S.verbeStep==="infinitif") return submitVerbe(); return; }
  if(kind==="habille") return;
  if(S.locked || !S.input) return;
  curStats().tries++;
  if(parseInt(S.input,10)===S.q.r){
    if(S.mode==="montre"){
      montreScore++; saveStats();
      render(); return generate();
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
  }else{
    curStats().errors++; saveStats();
    const v=VILLAIN[S.q.op];
    $("catch-who").innerHTML = ART[v.art];
    let msg = `Tu as écrit <b>${S.input}</b>. La bonne réponse était <b>${S.q.r}</b>.`;
    if(S.mode==="montre"){
      $("catch-title").textContent = `${v.name} t'a eu !`;
      msg += `<br>Calculs justes jusqu'ici : <b>${montreScore}</b>`;
      $("catch-ok").textContent = "Je continue";
    }else if(S.mode==="infini"){
      $("catch-title").textContent = `${v.name} t'a eu !`;
      const rec=S.records[S.recKey]||0;
      msg += S.newRec ? `<br><b>Nouveau record : ${S.streak} !</b>` : (S.base===0 && S.streak>0 ? `<br>Série : <b>${S.streak}</b>. C'est ton premier record !` : `<br>Série : <b>${S.streak}</b> · Record : <b>${rec}</b>`);
      $("catch-ok").textContent = "Je continue";
    }else{
      $("catch-title").textContent = `${v.name} a refermé le coffre !`;
      $("catch-ok").textContent = "Je recommence";
    }
    $("catch-msg").innerHTML = msg;
    $("steps").innerHTML = help(S.q);
    S.streak=0; S.newRec=false; S.locked=true;
    $("vault").classList.remove("shake"); void $("vault").offsetWidth; $("vault").classList.add("shake");
    render(); $("catch").classList.add("show"); $("catch-ok").focus();
  }
}
function openVault(){
  S.locked=true; curStats().opens++; saveStats();
  const code = curCfg().reward==="code";
  $("in-label").textContent = code ? "Le coffre est ouvert ! Le code du cadenas est :" : "Félicitations, inspecteur !";
  $("code-out").textContent = code ? curCfg().code : "Tu as ouvert le coffre !";
  $("code-out").classList.toggle("words", !code);
  $("in-hint").textContent = code ? "Écris-le sur ta fiche et ouvre le vrai coffre." : "Les Filous sont battus.";
  setTimeout(()=>$("vault").classList.add("open"),350);
  if(!code) setTimeout(()=>fireworks(5000),900);
  $("pad").style.visibility="hidden"; $("again").style.display="inline-block";
  $("lead").textContent="Bravo inspecteur, les Filous sont battus !";
}
function restart(){
  if(minuteurDue()) return showMinuteurLock();
  stopFx(); clearMontreInterval(); $("vault").classList.remove("open"); $("pad").style.visibility="visible"; $("again").style.display="none";
  applyKindUI(); $("word-note").textContent="";
  S.streak=0; S.newRec=false; S.base=S.records[S.recKey]||0; S.locked=false; leadText(); buildBolts();
  if(S.mode==="montre"){ montreScore=0; montreRemaining=120; montreInterval=setInterval(montreTick,1000); }
  generate();
}
function press(k){
  if(S.locked) return;
  if(k==="del") S.input=S.input.slice(0,-1);
  else if(k==="ok") return submit();
  else if(S.input.length<4) S.input+=k;
  render();
}
$("pad").addEventListener("click",e=>{const b=e.target.closest("button"); if(b) press(b.dataset.k);});
buildKeyboard($("word-kb"),
  ch=>{ if(S.locked) return; if(S.input.length<30) S.input+=ch; render(); },
  ()=>{ if(S.locked) return; S.input=S.input.slice(0,-1); render(); }
);
$("word-validate").addEventListener("click", submit);
$("verbe-validate").addEventListener("click", submitVerbe);
$("hp-habille").addEventListener("click", ()=>submitHabille("habille"));
$("hp-pyjama").addEventListener("click", ()=>submitHabille("pyjama"));
$("word-listen").addEventListener("click", ()=>{
  if(!S.word) return;
  speakText(S.word.mot);
  S.spoken=true; render();
});
document.addEventListener("keydown",e=>{
  if($("settings").classList.contains("show") || $("profiles").classList.contains("show") || $("filous").classList.contains("show") || $("avatarcreate").classList.contains("show")) return;
  if($("home").classList.contains("show") && !$("pin").classList.contains("show")) return;
  if($("pin").classList.contains("show")){
    if(/^[0-9]$/.test(e.key)) pinPress(e.key); else if(e.key==="Backspace") pinPress("del"); else if(e.key==="Escape") pinPress("cancel");
    return;
  }
  if($("catch").classList.contains("show")){ if(e.key==="Enter"){e.preventDefault();closeCatch();} return; }
  if(/^[0-9]$/.test(e.key)) press(e.key);
  else if(e.key==="Backspace") press("del");
  else if(e.key==="Enter"){ e.preventDefault(); press("ok"); }
});
function closeCatch(){
  $("catch").classList.remove("show");
  if(minuteurDue()) return showMinuteurLock();
  S.base=S.records[S.recKey]||0; S.locked=false; generate();
}
$("catch-ok").addEventListener("click",closeCatch);
$("again").addEventListener("click",restart);
$("home-back").addEventListener("click",()=>{ if(ACTIVITIES_BY_FILOU[S.filou]) showActivites(); else showFilous(); });
$("profiles-link").addEventListener("click",showProfiles);
$("filous-link").addEventListener("click",()=>{ if(!ACTIVE_ID) return showProfiles(); if(ACTIVITIES_BY_FILOU[S.filou]) return showActivites(); showFilous(); });
$("filous-back").addEventListener("click",showProfiles);
$("go-coffre").addEventListener("click",()=>startMode("coffre"));
$("go-infini").addEventListener("click",()=>startMode("infini"));
$("go-montre").addEventListener("click",()=>startMode("montre"));

/* ---------- feu d'artifice ---------- */
let fxRun=null;
function stopFx(){ if(fxRun){ cancelAnimationFrame(fxRun.raf); fxRun=null; } const c=$("fx"); c.getContext("2d").clearRect(0,0,c.width,c.height); }
function fireworks(duration){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stopFx();
  const c=$("fx"), ctx=c.getContext("2d"), dpr=Math.min(2,devicePixelRatio||1);
  c.width=innerWidth*dpr; c.height=innerHeight*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  const cols=["#f2b134","#d64545","#2a9d8f","#ffffff","#7fb3ff","#ff9ad5"], parts=[];
  const t0=performance.now(); let next=0;
  function burst(){
    const x=innerWidth*(.15+.7*Math.random()), y=innerHeight*(.12+.4*Math.random()), col=cols[Math.floor(Math.random()*cols.length)], n=60;
    for(let i=0;i<n;i++){ const a=Math.PI*2*i/n, v=2+Math.random()*3.2; parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,col}); }
  }
  function step(t){
    const el=t-t0;
    if(el<duration && t>=next){ burst(); next=t+260+Math.random()*320; }
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i]; p.vy+=.06; p.vx*=.985; p.vy*=.985; p.x+=p.vx; p.y+=p.vy; p.life-=.013;
      if(p.life<=0){ parts.splice(i,1); continue; }
      ctx.globalAlpha=p.life; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,2.6,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    if(el<duration || parts.length){ fxRun.raf=requestAnimationFrame(step); } else stopFx();
  }
  fxRun={raf:requestAnimationFrame(step)};
}

/* ---------- réglages ---------- */
let draft=null;
let settingsTab="retenues";
/* Onglets des réglages : "commun" (profils, code parent, version du contenu) ou "child" (tout ce qui est
   propre à un enfant : filous actifs, minuteur, épreuves, records, statistiques). settingsChildId indique
   quel enfant est affiché/édité dans l'onglet "child", indépendamment du profil actif en train de jouer. */
let settingsScope="child";
let settingsChildId=null;
let draftFilousActifs=null;
let draftStats={};
let draftRecords={};
async function loadSettingsChild(id){
  settingsChildId = id;
  const bundle = (id===ACTIVE_ID)
    ? {cfgs:S.cfgs, filousActifs:S.filousActifs, minuteur:S.minuteur, stats:S.stats, records:S.records}
    : await loadProfileBundle(id);
  draft = {
    retenues:clone(bundle.cfgs.retenues), tables:clone(bundle.cfgs.tables), mix:clone(bundle.cfgs.mix),
    faussaire:{dictee:clone(bundle.cfgs.faussaire.dictee), trou:clone(bundle.cfgs.faussaire.trou), correction:clone(bundle.cfgs.faussaire.correction)},
    deguiseur:{verbe:clone(bundle.cfgs.deguiseur.verbe), habille:clone(bundle.cfgs.deguiseur.habille), infinitif:clone(bundle.cfgs.deguiseur.infinitif), habiller:clone(bundle.cfgs.deguiseur.habiller)},
    pagaille:{ordre:clone(bundle.cfgs.pagaille.ordre), intrus:clone(bundle.cfgs.pagaille.intrus)},
    menteur:clone(bundle.cfgs.menteur),
    minuteur:clone(bundle.minuteur)
  };
  draftFilousActifs = clone(bundle.filousActifs || {retenues:true, tables:true, faussaire:true, deguiseur:true, pagaille:true, menteur:true});
  draftStats = bundle.stats || {};
  draftRecords = bundle.records || {};
  const epreuveTabs = buildEpreuveTabs(draft.deguiseur.verbe.fusionInfinitif !== false);
  if(!epreuveTabs.flatMap(g=>g.tabs).some(t=>t[0]===settingsTab)) settingsTab = epreuveTabs[0].tabs[0][0];
}
const CALC_TABS=[["retenues","Faussaire des Retenues"],["tables","Tricheur des Tables"],["mix","Calcul mélangé"]];
function chip(label,pressed,onClick){ const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=label; b.setAttribute("aria-pressed",pressed); b.onclick=()=>{onClick(); fillSettings();}; return b; }
function toggleIn(arr,v){ const i=arr.indexOf(v); i<0?arr.push(v):arr.splice(i,1); }
function cfgAt(obj, tab){ const i=tab.indexOf(":"); return i<0 ? obj[tab] : obj[tab.slice(0,i)][tab.slice(i+1)]; }
function hasActiveOps(filouId, c){
  if(filouId==="retenues") return (c.add.on&&c.add.forms.length)||(c.sub.on&&c.sub.forms.length);
  if(filouId==="tables") return (c.mul.on&&(c.mul.tables.length||c.mul.extra.length))||(c.div.on&&c.div.tables.length);
  if(filouId==="faussaire"||filouId.startsWith("faussaire:")||filouId==="deguiseur"||filouId.startsWith("deguiseur:")||filouId==="pagaille"||filouId.startsWith("pagaille:")) return c.series && c.series.length>0;
  if(filouId==="menteur") return c.themes && c.themes.length>0;
  return true;
}
function ensureMinOp(filouId, c){
  if(filouId==="retenues" && !hasActiveOps("retenues",c)){
    c.add.on=true; if(!c.add.forms.length) c.add.forms=["du+u"];
  }else if(filouId==="tables" && !hasActiveOps("tables",c)){
    c.mul.on=true; if(!c.mul.tables.length && !c.mul.extra.length) c.mul.tables=[2,5,10];
  }else if((filouId==="faussaire"||filouId.startsWith("faussaire:")||filouId==="deguiseur"||filouId.startsWith("deguiseur:")||filouId==="pagaille"||filouId.startsWith("pagaille:")) && !hasActiveOps(filouId,c)){
    c.series=[1];
  }else if(filouId==="menteur" && !hasActiveOps("menteur",c)){
    c.themes=["temps"];
  }
}
function renderSettingsChildTabs(){
  const wrap = $("settings-child-tabs"); wrap.innerHTML = "";
  const commun = document.createElement("button");
  commun.type="button"; commun.className="chip"; commun.textContent="Commun";
  commun.setAttribute("aria-pressed", settingsScope==="commun");
  commun.onclick = ()=>{ settingsScope="commun"; fillSettings(); };
  wrap.appendChild(commun);
  PROFILES.forEach(p=>{
    const b=document.createElement("button");
    b.type="button"; b.className="chip"; b.textContent=p.prenom || "(sans prénom)";
    b.setAttribute("aria-pressed", settingsScope==="child" && settingsChildId===p.id);
    b.onclick = async ()=>{ settingsScope="child"; await loadSettingsChild(p.id); fillSettings(); };
    wrap.appendChild(b);
  });
  const label = $("settings-scope-label");
  if(settingsScope==="commun") label.textContent = "Réglages communs à tous les profils.";
  else{ const p = PROFILES.find(x=>x.id===settingsChildId); label.textContent = p ? `Réglages de ${p.prenom || "ce profil"}.` : ""; }
  document.querySelectorAll("[data-scope]").forEach(el=>{ el.style.display = el.dataset.scope===settingsScope ? "" : "none"; });
}
function fillSettingsProfiles(){
  renderSettingsChildTabs();
  const ul = $("p-list"); ul.innerHTML = "";
  PROFILES.forEach(p=>{
    const li = document.createElement("li");
    const info = document.createElement("div"); info.className="pinfo";
    info.innerHTML = `<div class="pav">${generateAvatarSVG(p.avatar)}</div><div class="pnm">${p.prenom}${p.id===ACTIVE_ID?" (actif)":""}</div>`;
    const btns = document.createElement("div"); btns.className="pbtns";
    const editBtn = document.createElement("button"); editBtn.type="button"; editBtn.className="pbtn"; editBtn.textContent="Modifier";
    editBtn.addEventListener("click", ()=>{ settingsOpenAfterSave=true; openAvatarCreate(p.id); });
    const delBtn = document.createElement("button"); delBtn.type="button"; delBtn.className="pbtn danger"; delBtn.textContent="Supprimer";
    delBtn.addEventListener("click", ()=>deleteProfile(p.id));
    btns.appendChild(editBtn); btns.appendChild(delBtn);
    li.appendChild(info); li.appendChild(btns);
    ul.appendChild(li);
  });
  const fToggles = $("f-toggles"); fToggles.innerHTML = "";
  FILOUS.filter(f=>f.ready && !f.combo).forEach(f=>{
    const row = document.createElement("div"); row.className="field";
    row.innerHTML = `<label>${f.nom}</label>`;
    const sw = document.createElement("label"); sw.className="switch";
    const input = document.createElement("input"); input.type="checkbox";
    input.checked = draftFilousActifs ? (draftFilousActifs[f.id]!==false) : true;
    input.addEventListener("change", async ()=>{
      draftFilousActifs[f.id] = input.checked;
      await store.set(pk("brigade-filous",settingsChildId), draftFilousActifs);
      if(input.checked && draft[f.id]){
        ensureMinOp(f.id, draft[f.id]);
        if(CFG_STORE_KEY[f.id]) await store.set(pk(CFG_STORE_KEY[f.id],settingsChildId), draft[f.id]);
      }
      if(settingsChildId===ACTIVE_ID){
        S.filousActifs = draftFilousActifs;
        if(input.checked && draft[f.id] && S.cfgs[f.id]) S.cfgs[f.id] = draft[f.id];
      }
      fillSettings();
    });
    const span = document.createElement("span");
    sw.appendChild(input); sw.appendChild(span);
    row.appendChild(sw);
    fToggles.appendChild(row);
  });
  const notReady = FILOUS.filter(f=>!f.ready);
  if(notReady.length){
    const info = document.createElement("div"); info.className="sub";
    info.textContent = "Bientôt disponibles : " + notReady.map(f=>f.nom).join(", ");
    fToggles.appendChild(info);
  }
  $("content-info").textContent = `Version ${CONTENU.version} du ${CONTENU.date}`;
  fillMinuteurSettings();
}
const MINUTEUR_MODE_LABEL = {none:"Aucune limite", global:"Limite globale", perFilou:"Limite par filou"};
function fillMinuteurSettings(){
  const dm = draft.minuteur;
  const modeChips = document.querySelector('[data-radio="minuteur-mode"]'); modeChips.innerHTML="";
  for(const [k,label] of Object.entries(MINUTEUR_MODE_LABEL)) modeChips.appendChild(chip(label, dm.mode===k, ()=>{ dm.mode=k; }));
  $("f-minuteur-global").style.display = dm.mode==="global" ? "" : "none";
  $("minuteur-perfilou").style.display = dm.mode==="perFilou" ? "" : "none";
  $("f-minuteur-bonus").style.display = dm.mode==="none" ? "none" : "";
  $("s-minuteur-global").value = dm.global || "";
  $("s-minuteur-bonus").value = dm.bonus || "";
  const pf = $("minuteur-perfilou"); pf.innerHTML = "";
  if(dm.mode==="perFilou"){
    FILOUS.filter(f=>f.ready).forEach(f=>{
      const row = document.createElement("div"); row.className="field";
      row.innerHTML = `<label>${f.nom}</label>`;
      const input = document.createElement("input"); input.type="number"; input.inputMode="numeric"; input.min="1"; input.max="300";
      input.value = dm.perFilou[f.id] || "";
      input.addEventListener("input", e=>{ const v=parseInt(e.target.value,10); dm.perFilou[f.id] = isNaN(v)?0:v; });
      row.appendChild(input);
      pf.appendChild(row);
    });
  }
}
$("s-minuteur-global").addEventListener("input", e=>{ const v=parseInt(e.target.value,10); draft.minuteur.global = isNaN(v)?0:v; });
$("s-minuteur-bonus").addEventListener("input", e=>{ const v=parseInt(e.target.value,10); draft.minuteur.bonus = isNaN(v)?0:v; });
$("p-add").addEventListener("click", ()=>{ settingsOpenAfterSave=true; openAvatarCreate(null); });
function fillSettings(){
  const epreuveTabs = buildEpreuveTabs(draft.deguiseur.verbe.fusionInfinitif !== false);
  const tabsEl=$("calc-tabs"); tabsEl.innerHTML="";
  for(const group of epreuveTabs){
    const catLabel=document.createElement("div"); catLabel.className="tab-cat"; catLabel.textContent=group.label;
    tabsEl.appendChild(catLabel);
    const row=document.createElement("div"); row.className="chips";
    for(const [k,label] of group.tabs) row.appendChild(chip(label, settingsTab===k, ()=>{settingsTab=k;}));
    tabsEl.appendChild(row);
  }
  if(!epreuveTabs.flatMap(g=>g.tabs).some(t=>t[0]===settingsTab)) settingsTab = epreuveTabs[0].tabs[0][0];
  document.querySelectorAll("[data-tab]").forEach(el=>{ el.style.display = (settingsScope==="child" && el.dataset.tab===settingsTab) ? "" : "none"; });
  const tabLabel = epreuveTabs.flatMap(g=>g.tabs).find(t=>t[0]===settingsTab)[1];
  $("coffre-tab-title").textContent = "Mode coffre — " + tabLabel;
  $("g-coffre-mode").style.display = (settingsScope==="child" && settingsTab!=="menteur") ? "" : "none";

  const d=cfgAt(draft,settingsTab);
  $("s-pin").value=PIN;
  if(settingsTab!=="menteur"){
    $("s-code").value=d.code; $("s-target").value=d.target;
    const rw=document.querySelector('[data-radio="reward"]'); rw.innerHTML="";
    for(const [k,label] of Object.entries(REWARD)) rw.appendChild(chip(label, d.reward===k, ()=>{d.reward=k;}));
    $("f-code").style.display = d.reward==="code" ? "" : "none";
  }

  const keys=Object.keys(draftRecords).filter(k=>draftRecords[k]>0).sort((a,b)=>draftRecords[b]-draftRecords[a]);
  $("recs").innerHTML = keys.length ? keys.map(k=>{
    const isMontre = k.startsWith("montre:");
    const base = isMontre ? k.slice(7) : k;
    const label = (isMontre ? "Contre la montre · " : "") + describeKey(base);
    const unit = isMontre ? " calculs" : "";
    return `<li><span>${label}</span><b>${draftRecords[k]}${unit}</b></li>`;
  }).join("") : "<li><span>Aucun record pour l'instant.</span></li>";

  if(settingsTab==="retenues"){
    const dr=draft.retenues;
    for(const op of ["add","sub"]){
      const sw=document.querySelector(`input[data-op="${op}"]`); sw.checked=dr[op].on;
      $("g-"+op).classList.toggle("off",!dr[op].on);
      const fl=document.querySelector(`[data-list="${op}-forms"]`); fl.innerHTML="";
      for(const [k,[label]] of Object.entries(FORMS[op])) fl.appendChild(chip(label, dr[op].forms.includes(k), ()=>toggleIn(dr[op].forms,k)));
      const pl=document.querySelector(`[data-radio="${op}-pass"]`); pl.innerHTML="";
      for(const [k,label] of Object.entries(PASS)) pl.appendChild(chip(label, dr[op].pass===k, ()=>{dr[op].pass=k;}));
    }
    $("s-add-max").value = dr.add.max || "";
    $("s-sub-max").value = dr.sub.max || "";
  }else if(settingsTab==="tables"){
    const dt=draft.tables;
    for(const op of ["mul","div"]){
      const sw=document.querySelector(`input[data-op="${op}"]`); sw.checked=dt[op].on;
      $("g-"+op).classList.toggle("off",!dt[op].on);
    }
    for(const op of ["mul","div"]){
      const tl=document.querySelector(`[data-list="${op}-tables"]`); tl.innerHTML="";
      for(let t=2;t<=10;t++) tl.appendChild(chip(String(t), dt[op].tables.includes(t), ()=>toggleIn(dt[op].tables,t)));
    }
    const ex=document.querySelector('[data-list="mul-extra"]'); ex.innerHTML="";
    ex.appendChild(chip("DU x U", dt.mul.extra.includes("du*u"), ()=>toggleIn(dt.mul.extra,"du*u")));
  }else if(settingsTab.startsWith("faussaire:")){
    const df=d;
    const act = settingsTab.slice("faussaire:".length);
    const source = act==="dictee" ? CONTENU.dictee : CONTENU.faussaire;
    const seriesAvailable=[...new Set(source.map(w=>w.serie))].sort((a,b)=>a-b);
    const sl=document.querySelector(`[data-list="${settingsTab}-series"]`); sl.innerHTML="";
    for(const sNum of seriesAvailable) sl.appendChild(chip("Série "+sNum, df.series.includes(sNum), ()=>toggleIn(df.series,sNum)));
  }else if(settingsTab.startsWith("deguiseur:")){
    const df=d;
    const source = settingsTab==="deguiseur:habiller" ? (CONTENU.conjugaison||[]) : CONTENU.deguiseur;
    const seriesAvailable=[...new Set(source.map(w=>w.serie))].sort((a,b)=>a-b);
    const sl=document.querySelector(`[data-list="${settingsTab}-series"]`); sl.innerHTML="";
    for(const sNum of seriesAvailable) sl.appendChild(chip("Série "+sNum, df.series.includes(sNum), ()=>toggleIn(df.series,sNum)));
    if(settingsTab==="deguiseur:verbe") $("s-fusion-infinitif").checked = df.fusionInfinitif !== false;
    if(settingsTab==="deguiseur:habiller") $("s-radical-preecrit").checked = df.radicalPreEcrit !== false;
  }else if(settingsTab.startsWith("pagaille:")){
    const dp=d;
    const act = settingsTab.slice("pagaille:".length);
    const niveaux=[...new Set((CONTENU.pagaille||[]).filter(x=>x.type===act).map(x=>Number(x.niveau)))].sort((a,b)=>a-b);
    const nl=document.querySelector(`[data-list="${settingsTab}-niveaux"]`); nl.innerHTML="";
    for(const n of niveaux) nl.appendChild(chip(PAGAILLE_NIVEAU_LABEL[n]||("Niveau "+n), dp.series.includes(n), ()=>toggleIn(dp.series,n)));
  }else if(settingsTab==="menteur"){
    const dm=d;
    const themesAvailable=[...new Set(CONTENU.menteur.map(x=>x.theme))];
    const tl=document.querySelector('[data-list="menteur-themes"]'); tl.innerHTML="";
    for(const th of themesAvailable) tl.appendChild(chip(MENTEUR_THEME_LABEL[th]||th, dm.themes.includes(th), ()=>toggleIn(dm.themes,th)));
  }

  const statKeys=Object.keys(draftStats).filter(k=>draftStats[k].tries>0).sort((a,b)=>draftStats[b].tries-draftStats[a].tries);
  $("stats").innerHTML = statKeys.length ? statKeys.map(k=>{
    const s=draftStats[k], rate=s.tries?Math.round(100*(s.tries-s.errors)/s.tries):0;
    return `<li><span>${describeKey(k)}</span><b>${s.tries} essai${s.tries>1?"s":""} · ${rate} % · ${s.opens} coffre${s.opens>1?"s":""}</b></li>`;
  }).join("") : "<li><span>Aucune statistique pour l'instant.</span></li>";
  fillSettingsProfiles();
}
document.querySelectorAll('input[data-op]').forEach(sw=>sw.addEventListener("change",()=>{ draft[settingsTab][sw.dataset.op].on=sw.checked; fillSettings(); }));
$("s-fusion-infinitif").addEventListener("change",e=>{ draft.deguiseur.verbe.fusionInfinitif = e.target.checked; fillSettings(); });
$("s-radical-preecrit").addEventListener("change",e=>{ draft.deguiseur.habiller.radicalPreEcrit = e.target.checked; fillSettings(); });
$("s-code").addEventListener("input",e=>{ cfgAt(draft,settingsTab).code=e.target.value.replace(/\D/g,""); });
$("s-pin").addEventListener("input",e=>{ draftPin=e.target.value.replace(/\D/g,"").slice(0,4); });
$("s-target").addEventListener("input",e=>{ cfgAt(draft,settingsTab).target=e.target.value; });
$("s-add-max").addEventListener("input",e=>{ const v=parseInt(e.target.value,10); draft.retenues.add.max = (e.target.value===""||isNaN(v)) ? null : v; });
$("s-sub-max").addEventListener("input",e=>{ const v=parseInt(e.target.value,10); draft.retenues.sub.max = (e.target.value===""||isNaN(v)) ? null : v; });
let draftPin = "0000";
async function openSettings(){
  settingsScope = "child";
  await loadSettingsChild(ACTIVE_ID);
  draftPin=PIN; $("warn").textContent=""; fillSettings(); $("settings").classList.add("show"); $("settings").scrollTop=0;
}
$("s-cancel").addEventListener("click",()=>$("settings").classList.remove("show"));
$("r-reset").addEventListener("click",async ()=>{
  if(!confirm("Effacer tous les records ?")) return;
  draftRecords = {};
  await store.set(pk("coffre-records",settingsChildId), draftRecords);
  if(settingsChildId===ACTIVE_ID) S.records = draftRecords;
  fillSettings();
});
$("s-reset").addEventListener("click",async ()=>{
  if(!confirm("Effacer toutes les statistiques ?")) return;
  draftStats = {};
  await store.set(pk("coffre-stats",settingsChildId), draftStats);
  if(settingsChildId===ACTIVE_ID) S.stats = draftStats;
  fillSettings();
});
$("s-save").addEventListener("click",async ()=>{
  if(!/^\d{4}$/.test(String(draftPin||""))){ $("warn").textContent="Le code du parent doit faire exactement 4 chiffres."; return; }

  for(const key of ["retenues","tables","mix","faussaire:dictee","faussaire:trou","faussaire:correction","deguiseur:verbe","deguiseur:habille","deguiseur:infinitif","deguiseur:habiller","pagaille:ordre","pagaille:intrus"]){
    const d=cfgAt(draft,key);
    d.code = String(d.code||"").replace(/\D/g,"") || "5472";
    d.target = Math.min(20,Math.max(2,parseInt(d.target,10)||6));
  }

  const dr=draft.retenues, dt=draft.tables;

  if(dr.add.max!=null){
    dr.add.max = Math.max(1, parseInt(dr.add.max,10)||0);
    if(dr.add.on && dr.add.forms.length){
      const minSum = Math.min(...dr.add.forms.map(f=>{ const [,ra,rb]=FORMS.add[f]; return ra[0]+rb[0]; }));
      if(dr.add.max < minSum){ settingsTab="retenues"; fillSettings(); $("warn").textContent = `Le résultat maximum des additions (${dr.add.max}) est trop petit pour les nombres choisis (minimum possible : ${minSum}).`; return; }
    }
  }
  if(dr.sub.max!=null){
    dr.sub.max = Math.max(1, parseInt(dr.sub.max,10)||0);
    if(dr.sub.on && dr.sub.forms.length){
      const minA = Math.min(...dr.sub.forms.map(f=>FORMS.sub[f][1][0]));
      if(dr.sub.max < minA){ settingsTab="retenues"; fillSettings(); $("warn").textContent = `Le nombre de départ maximum des soustractions (${dr.sub.max}) est trop petit pour les nombres choisis (minimum possible : ${minA}).`; return; }
    }
  }
  /* U − U (deux nombres à un chiffre) ne peut jamais produire de retenue : si c'est la seule forme active,
     « avec passage » est un réglage impossible à satisfaire ; on repasse silencieusement à « sans passage ». */
  if(dr.sub.pass==="avec" && dr.sub.forms.length && dr.sub.forms.every(f=>f==="u-u")) dr.sub.pass="sans";

  // les épreuves du Faussaire et du Déguiseur ne peuvent jamais rester sans série active : correction silencieuse
  for(const act of ["dictee","trou","correction"]) ensureMinOp("faussaire:"+act, draft.faussaire[act]);
  for(const act of ["verbe","habille","infinitif","habiller"]) ensureMinOp("deguiseur:"+act, draft.deguiseur[act]);
  for(const act of ["ordre","intrus"]) ensureMinOp("pagaille:"+act, draft.pagaille[act]);
  ensureMinOp("menteur", draft.menteur);

  draftFilousActifs = draftFilousActifs || {};
  const notes=[];
  for(const [id,label] of [["retenues","Le Faussaire des Retenues"],["tables","Le Tricheur des Tables"]]){
    if(!hasActiveOps(id,draft[id]) && draftFilousActifs[id]!==false){ draftFilousActifs[id]=false; notes.push(`${label} a été désactivé : plus aucune épreuve n'était active.`); }
  }
  await store.set(pk("brigade-filous",settingsChildId), draftFilousActifs);

  if(draft.minuteur.mode==="global") draft.minuteur.global = Math.max(1, parseInt(draft.minuteur.global,10)||20);
  if(draft.minuteur.mode==="perFilou") for(const f of FILOUS.filter(x=>x.ready)) draft.minuteur.perFilou[f.id] = Math.max(1, parseInt(draft.minuteur.perFilou[f.id],10)||20);
  if(draft.minuteur.mode!=="none") draft.minuteur.bonus = Math.max(1, parseInt(draft.minuteur.bonus,10)||15);
  await store.set(pk("coffre-minuteur",settingsChildId), draft.minuteur);

  await store.set(pk(CFG_STORE_KEY.retenues,settingsChildId), dr);
  await store.set(pk(CFG_STORE_KEY.tables,settingsChildId), dt);
  await store.set(pk(CFG_STORE_KEY.mix,settingsChildId), draft.mix);
  await store.set(pk(CFG_STORE_KEY.faussaire_dictee,settingsChildId), draft.faussaire.dictee);
  await store.set(pk(CFG_STORE_KEY.faussaire_trou,settingsChildId), draft.faussaire.trou);
  await store.set(pk(CFG_STORE_KEY.faussaire_correction,settingsChildId), draft.faussaire.correction);
  await store.set(pk(CFG_STORE_KEY.deguiseur_verbe,settingsChildId), draft.deguiseur.verbe);
  await store.set(pk(CFG_STORE_KEY.deguiseur_habille,settingsChildId), draft.deguiseur.habille);
  await store.set(pk(CFG_STORE_KEY.deguiseur_infinitif,settingsChildId), draft.deguiseur.infinitif);
  await store.set(pk(CFG_STORE_KEY.deguiseur_habiller,settingsChildId), draft.deguiseur.habiller);
  await store.set(pk(CFG_STORE_KEY.pagaille_ordre,settingsChildId), draft.pagaille.ordre);
  await store.set(pk(CFG_STORE_KEY.pagaille_intrus,settingsChildId), draft.pagaille.intrus);
  await store.set(pk(CFG_STORE_KEY.menteur,settingsChildId), draft.menteur);
  PIN = draftPin; await store.set("brigade-pin", PIN);

  // si l'enfant édité est bien celui qui joue actuellement, la session en cours reflète tout de suite les changements
  if(settingsChildId===ACTIVE_ID){
    S.filousActifs = draftFilousActifs;
    S.minuteur = draft.minuteur;
    S.cfgs.retenues = dr; S.cfgs.tables = dt; S.cfgs.mix = draft.mix; S.cfgs.faussaire = draft.faussaire; S.cfgs.deguiseur = draft.deguiseur; S.cfgs.pagaille = draft.pagaille; S.cfgs.menteur = draft.menteur;
  }

  $("settings").classList.remove("show");
  if(notes.length) alert(notes.join("\n"));
  showFilous();
});

/* code d'accès du parent */
let pinIn="";
let pinPurpose="settings";
function pinOpen(purpose){ pinPurpose=purpose||"settings"; pinIn=""; $("pin-msg").textContent=""; pinRender(); $("pin").classList.add("show"); }
function pinRender(){ document.querySelectorAll("#dots span").forEach((d,i)=>d.classList.toggle("on",i<pinIn.length)); }
function pinClose(){ $("pin").classList.remove("show"); }
function pinPress(k){
  if(k==="cancel") return pinClose();
  if(k==="del"){ pinIn=pinIn.slice(0,-1); return pinRender(); }
  if(pinIn.length>=4) return;
  pinIn+=k; pinRender();
  if(pinIn.length===4){
    if(pinIn===String(PIN||"0000")){
      setTimeout(async ()=>{
        pinClose();
        if(pinPurpose==="newprofile"){ settingsOpenAfterSave=false; openAvatarCreate(null); }
        else if(pinPurpose==="minuteur"){ minuteurUnlock(); }
        else { await openSettings(); }
      },150);
    }
    else{ $("pin-msg").textContent="Code incorrect."; const d=$("dots"); d.classList.remove("bad"); void d.offsetWidth; d.classList.add("bad"); setTimeout(()=>{ pinIn=""; pinRender(); },350); }
  }
}
$("pin-pad").addEventListener("click",e=>{const b=e.target.closest("button"); if(b) pinPress(b.dataset.k);});
document.querySelectorAll("[data-pin]").forEach(b=>b.addEventListener("click",()=>pinOpen("settings")));

/* ---------- contenu.json : réseau d'abord, repli cache ---------- */
