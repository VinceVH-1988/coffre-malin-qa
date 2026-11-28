const clone = o => JSON.parse(JSON.stringify(o));
const S = {
  cfgs:{
    retenues:clone(DEFAULT_RETENUES), tables:clone(DEFAULT_TABLES), mix:clone(DEFAULT_MIX),
    faussaire:{dictee:clone(DEFAULT_FAUSSAIRE_ACTIVITY), trou:clone(DEFAULT_FAUSSAIRE_ACTIVITY), correction:clone(DEFAULT_FAUSSAIRE_ACTIVITY)},
    deguiseur:{verbe:clone(DEFAULT_DEGUISEUR_ACTIVITY), habille:clone(DEFAULT_DEGUISEUR_ACTIVITY), infinitif:clone(DEFAULT_DEGUISEUR_ACTIVITY), habiller:clone(DEFAULT_DEGUISEUR_HABILLER)},
    pagaille:{ordre:clone(DEFAULT_PAGAILLE_ACTIVITY), intrus:clone(DEFAULT_PAGAILLE_ACTIVITY)},
    menteur:clone(DEFAULT_MENTEUR_CFG)
  },
  stats:{tries:0,errors:0,best:0,opens:0}, records:{}, mode:"coffre", recKey:"", newRec:false, streak:0,
  q:null, word:null, lastWord:"", spoken:false, item:null, lastItem:"", picked:null, itemIsFaux:false,
  dItem:null, lastDItem:"", selectedTokens:[], verbeStep:"find",
  cItem:null, lastCItem:"",
  pItem:null, lastPItem:"", pOrdre:[], pMots:[],
  mItem:null, lastMenteur:"", mAnswered:false,
  input:"", last:"", locked:true, filou:"retenues", activite:"dictee"
};
function curCfg(){
  if(S.filou==="faussaire") return (S.cfgs.faussaire && S.cfgs.faussaire[S.activite]) || S.cfgs.faussaire.dictee;
  if(S.filou==="deguiseur") return (S.cfgs.deguiseur && S.cfgs.deguiseur[S.activite]) || S.cfgs.deguiseur.verbe;
  if(S.filou==="pagaille") return (S.cfgs.pagaille && S.cfgs.pagaille[S.activite]) || S.cfgs.pagaille.ordre;
  return S.cfgs[S.filou] || S.cfgs.retenues;
}
const $ = id => document.getElementById(id);
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- stockage : localStorage dans l'app, window.storage dans Claude ---------- */
const store = {
  async get(k){
    try{ const v = localStorage.getItem(k); if(v!==null) return JSON.parse(v); }catch(e){}
    try{ if(window.storage){ const r = await window.storage.get(k); if(r&&r.value) return JSON.parse(r.value); } }catch(e){}
    return null;
  },
  async set(k,v){
    try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){}
    try{ if(window.storage) await window.storage.set(k, JSON.stringify(v), false); }catch(e){}
  },
  async del(k){
    try{ localStorage.removeItem(k); }catch(e){}
    try{ if(window.storage) await window.storage.set(k, null, false); }catch(e){}
  }
};
function mergeCfgFor(filou, saved){
  const c = clone(DEFAULTS_BY_FILOU[filou]);
  if(!saved) return c;
  for(const k of Object.keys(c)){
    if(saved[k]===undefined) continue;
    if(Array.isArray(c[k])) c[k] = Array.isArray(saved[k]) ? saved[k].slice() : c[k];
    else if(typeof c[k]==="object" && c[k]!==null) c[k] = Object.assign(c[k], saved[k]);
    else c[k] = saved[k];
  }
  return c;
}
function mergeMinuteurCfg(saved){
  const c = clone(DEFAULT_MINUTEUR);
  if(!saved) return c;
  if(saved.mode) c.mode = saved.mode;
  if(saved.global!=null) c.global = saved.global;
  if(saved.bonus!=null) c.bonus = saved.bonus;
  if(saved.perFilou) Object.assign(c.perFilou, saved.perFilou);
  return c;
}
function todayStr(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }

/* ================= profils ================= */
let PROFILES = [];
let ACTIVE_ID = null;
let PIN = "0000";
const pk = (base,id) => `${base}:${id}`;

async function loadProfiles(){
  PROFILES = (await store.get("brigade-profils")) || [];
  ACTIVE_ID = await store.get("brigade-profil-actif");
  const savedPin = await store.get("brigade-pin");
  if(savedPin) PIN = savedPin;
}
async function saveProfiles(){ await store.set("brigade-profils", PROFILES); }
async function setActiveProfile(id){ ACTIVE_ID = id; await store.set("brigade-profil-actif", id); }

async function migrateIfNeeded(){
  if(PROFILES.length) return null;
  const legacyCfg = await store.get("coffre-cfg");
  const legacyStats = await store.get("coffre-stats");
  const legacyRecords = await store.get("coffre-records");
  if(!legacyCfg && !legacyStats && !legacyRecords) return null;
  const id = "p" + Date.now().toString(36);
  const base = legacyCfg || {};
  const retenues = mergeCfgFor("retenues", {code:base.code, target:base.target, reward:base.reward, add:base.add, sub:base.sub});
  const tables = mergeCfgFor("tables", {code:base.code, target:base.target, reward:base.reward, mul:base.mul, div:base.div});
  const mix = mergeCfgFor("mix", {code:base.code, target:base.target, reward:base.reward});
  if(legacyCfg && legacyCfg.pin) PIN = legacyCfg.pin;
  await store.set(pk(CFG_STORE_KEY.retenues,id), retenues);
  await store.set(pk(CFG_STORE_KEY.tables,id), tables);
  await store.set(pk(CFG_STORE_KEY.mix,id), mix);
  await store.set(pk(CFG_STORE_KEY.faussaire_dictee,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.faussaire_trou,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.faussaire_correction,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.deguiseur_verbe,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.deguiseur_habille,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.deguiseur_infinitif,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
  await store.set(pk(CFG_STORE_KEY.menteur,id), clone(DEFAULT_MENTEUR_CFG));
  await store.set(pk("coffre-stats",id), legacyStats || {tries:0,errors:0,best:0,opens:0});
  await store.set(pk("coffre-records",id), legacyRecords || {});
  await store.set(pk("brigade-filous",id), {retenues:true, tables:true, faussaire:true, deguiseur:true, menteur:true});
  const profile = {id, prenom:"", avatar:clone(DEFAULT_AVATAR), createdAt:Date.now()};
  PROFILES = [profile];
  await saveProfiles();
  await setActiveProfile(id);
  await store.set("brigade-pin", PIN);
  return id;
}

const KNOWN_FILOUS_FOR_KEYS = ["retenues","tables","mix","faussaire","deguiseur","pagaille","menteur"];
const isScopedRecordKey = k => KNOWN_FILOUS_FOR_KEYS.includes((k.startsWith("montre:")?k.slice(7):k).split(":")[0]);
/* Charge le paquet complet de données d'UN profil (cfgs, stats, records, filous actifs, minuteur), sans toucher
   à l'état S.* courant : sert à la fois à charger le profil actif (loadActiveProfileData) et à afficher/éditer,
   dans les réglages, un enfant qui n'est pas forcément celui en train de jouer (onglets par enfant). */
async function loadProfileBundle(id){
  const cfgs = {
    retenues: mergeCfgFor("retenues", await store.get(pk(CFG_STORE_KEY.retenues,id))),
    tables: mergeCfgFor("tables", await store.get(pk(CFG_STORE_KEY.tables,id))),
    mix: mergeCfgFor("mix", await store.get(pk(CFG_STORE_KEY.mix,id))),
    faussaire: {
      dictee: mergeCfgFor("faussaire_dictee", await store.get(pk(CFG_STORE_KEY.faussaire_dictee,id))),
      trou: mergeCfgFor("faussaire_trou", await store.get(pk(CFG_STORE_KEY.faussaire_trou,id))),
      correction: mergeCfgFor("faussaire_correction", await store.get(pk(CFG_STORE_KEY.faussaire_correction,id)))
    },
    deguiseur: {
      verbe: mergeCfgFor("deguiseur_verbe", await store.get(pk(CFG_STORE_KEY.deguiseur_verbe,id))),
      habille: mergeCfgFor("deguiseur_habille", await store.get(pk(CFG_STORE_KEY.deguiseur_habille,id))),
      infinitif: mergeCfgFor("deguiseur_infinitif", await store.get(pk(CFG_STORE_KEY.deguiseur_infinitif,id))),
      habiller: mergeCfgFor("deguiseur_habiller", await store.get(pk(CFG_STORE_KEY.deguiseur_habiller,id)))
    },
    pagaille: {
      ordre: mergeCfgFor("pagaille_ordre", await store.get(pk(CFG_STORE_KEY.pagaille_ordre,id))),
      intrus: mergeCfgFor("pagaille_intrus", await store.get(pk(CFG_STORE_KEY.pagaille_intrus,id)))
    },
    menteur: mergeCfgFor("menteur", await store.get(pk(CFG_STORE_KEY.menteur,id)))
  };
  const st = await store.get(pk("coffre-stats",id));
  const stats = (st && st.tries===undefined) ? st : {}; // ancien format (un seul bloc global) : on repart à zéro, détaillé par épreuve
  const recs = (await store.get(pk("coffre-records",id))) || {};
  const records = Object.keys(recs).every(isScopedRecordKey) ? recs : {}; // anciennes clés non préfixées par filou : on repart à zéro
  const filousActifs = (await store.get(pk("brigade-filous",id))) || {retenues:true, tables:true, faussaire:true, deguiseur:true, pagaille:true, menteur:true};
  const minuteur = mergeMinuteurCfg(await store.get(pk("coffre-minuteur",id)));
  return {cfgs, stats, records, filousActifs, minuteur};
}
async function loadActiveProfileData(){
  const id = ACTIVE_ID;
  const bundle = await loadProfileBundle(id);
  S.cfgs = bundle.cfgs; S.stats = bundle.stats; S.records = bundle.records; S.filousActifs = bundle.filousActifs; S.minuteur = bundle.minuteur;
  const today = todayStr();
  const mu = await store.get(pk("coffre-minuteur-usage",id));
  S.minuteurUsage = (mu && mu.date===today) ? mu : {date:today, seconds:0, perFilou:{}, bonusGlobal:0, bonusPerFilou:{}};
}

function currentProfile(){ return PROFILES.find(p=>p.id===ACTIVE_ID) || null; }

/* ---------- écran profils ---------- */
function renderProfileGrid(){
  const grid = $("profile-grid");
  grid.innerHTML = "";
  PROFILES.forEach(p=>{
    const card = document.createElement("div");
    card.className = "profile-card";
    card.innerHTML = `<div class="av">${generateAvatarSVG(p.avatar)}</div><div class="nm">${p.prenom || "(sans nom)"}</div>`;
    card.addEventListener("click", ()=>chooseProfile(p.id));
    grid.appendChild(card);
  });
  const add = document.createElement("div");
  add.className = "add-tile";
  add.innerHTML = `<span class="plus">+</span><span>Nouveau profil</span>`;
  add.addEventListener("click", ()=>{ pinOpen("newprofile"); });
  grid.appendChild(add);
}
async function chooseProfile(id){
  await setActiveProfile(id);
  await loadActiveProfileData();
  showFilous();
}
function showProfiles(){
  hideAllScreens();
  renderProfileGrid();
  $("profiles").classList.add("show");
}

/* ---------- écran filous ---------- */
function renderFilouList(){
  const profile = currentProfile();
  $("filous-title").textContent = profile ? `Les Filous de ${profile.prenom || "l'inspecteur"}` : "Les Filous";
  const list = $("filou-list");
  list.innerHTML = "";
  const retActive = S.filousActifs ? S.filousActifs.retenues !== false : true;
  const tabActive = S.filousActifs ? S.filousActifs.tables !== false : true;
  FILOUS.forEach(f=>{
    if(f.combo && !(retActive && tabActive)) return;
    const actif = f.combo ? true : (f.ready && S.filousActifs && S.filousActifs[f.id] !== false);
    const card = document.createElement("div");
    card.className = "filou-card" + (f.ready && actif ? "" : " soon");
    card.innerHTML = `<div class="ic">${ART[f.art]}</div><div class="tx"><div class="nm">${f.nom}</div><div class="dm">${f.domaine}</div>${(!f.ready) ? '<div class="soon-badge">Bientôt disponible</div>' : (!actif ? '<div class="soon-badge">Désactivé pour ce profil</div>' : "")}</div>`;
    if(f.ready && actif){ card.addEventListener("click", ()=>openFilou(f.id)); }
    list.appendChild(card);
  });
}
function openFilou(id){
  S.filou = id;
  hideAllScreens();
  if(id==="menteur") return openMenteurQuiz();
  if(ACTIVITIES_BY_FILOU[id]) showActivites();
  else goHome();
}
function showFilous(){
  clearMontreInterval();
  hideAllScreens();
  renderFilouList();
  $("filous").classList.add("show");
}
function hideAllScreens(){
  clearMontreInterval();
  $("profiles").classList.remove("show");
  $("filous").classList.remove("show");
  $("home").classList.remove("show");
  $("activites").classList.remove("show");
  $("menteur-screen").classList.remove("show");
}

/* ---------- écran de choix d'épreuve (Faussaire, Déguiseur, ...) ---------- */
const ACTIVITY_ICON = {faussaire:"faussaire_mot", deguiseur:"deguiseur", pagaille:"pagaille"};
function showActivites(){
  hideAllScreens();
  const f = FILOUS.find(x=>x.id===S.filou);
  $("activites-kicker").textContent = f ? f.nom.toUpperCase() : "";
  renderActiviteList();
  $("activites").classList.add("show");
}
function renderActiviteList(){
  const list=$("activite-list"); list.innerHTML="";
  const fusionOn = S.filou==="deguiseur" && (S.cfgs.deguiseur.verbe.fusionInfinitif !== false);
  const acts = (ACTIVITIES_BY_FILOU[S.filou] || []).filter(a => !(S.filou==="deguiseur" && a.id==="infinitif" && fusionOn));
  const icon = ART[ACTIVITY_ICON[S.filou]] || ART[S.filou] || "";
  acts.forEach(a=>{
    const desc = (S.filou==="deguiseur" && a.id==="verbe" && fusionOn)
      ? "Touche le verbe habillé dans la phrase, puis écris son infinitif."
      : a.desc;
    const card=document.createElement("div"); card.className="filou-card";
    card.innerHTML = `<div class="ic">${icon}</div><div class="tx"><div class="nm">${a.nom}</div><div class="dm">${desc}</div></div>`;
    card.addEventListener("click", ()=>{ S.activite=a.id; hideAllScreens(); goHome(); });
    list.appendChild(card);
  });
}
$("activites-back").addEventListener("click", showFilous);

/* ---------- création / édition d'avatar ---------- */
let avDraft = null;
let avEditingId = null;
function openAvatarCreate(editingId){
  avEditingId = editingId || null;
  const existing = editingId ? PROFILES.find(p=>p.id===editingId) : null;
  avDraft = existing ? {skin:existing.avatar.skin, hair:existing.avatar.hair, eyes:existing.avatar.eyes, hairLength:existing.avatar.hairLength, coat:existing.avatar.coat||COAT[0], accessory:existing.avatar.accessory||"aucun", prenom:existing.prenom} : {...clone(DEFAULT_AVATAR), prenom:""};
  $("av-title").textContent = existing ? "Modifier ton profil" : "Crée ton profil";
  $("av-warn").textContent = "";
  fillAvatarCreate();
  buildKeyboard($("av-kb"), ch=>{ avDraft.prenom += ch; renderNameBox(); }, ()=>{ avDraft.prenom = avDraft.prenom.slice(0,-1); renderNameBox(); });
  $("avatarcreate").classList.add("show");
}
function closeAvatarCreate(){ $("avatarcreate").classList.remove("show"); if(PROFILES.length) showProfiles(); }
function renderNameBox(){
  const box = $("av-name");
  box.textContent = avDraft.prenom;
  box.classList.toggle("empty", !avDraft.prenom);
}
function swatchRow(containerId, colors, key){
  const row = $(containerId);
  row.innerHTML = "";
  colors.forEach(c=>{
    const b = document.createElement("button");
    b.type="button"; b.className="swatch"; b.style.background=c;
    b.setAttribute("aria-pressed", avDraft[key]===c);
    b.addEventListener("click", ()=>{ avDraft[key]=c; fillAvatarCreate(); });
    row.appendChild(b);
  });
}
function fillAvatarCreate(){
  $("av-preview").innerHTML = generateAvatarSVG(avDraft);
  swatchRow("av-skin", SKIN, "skin");
  swatchRow("av-hair", HAIR, "hair");
  swatchRow("av-eyes", EYES, "eyes");
  swatchRow("av-coat", COAT, "coat");
  const lr = $("av-length"); lr.innerHTML = "";
  [["court","Court"],["long","Long"]].forEach(([k,label])=>{
    const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=label;
    b.setAttribute("aria-pressed", avDraft.hairLength===k);
    b.addEventListener("click", ()=>{ avDraft.hairLength=k; fillAvatarCreate(); });
    lr.appendChild(b);
  });
  const ar = $("av-accessory"); ar.innerHTML = "";
  ACCESSORY_OPTIONS.forEach(([k,label])=>{
    const b=document.createElement("button"); b.type="button"; b.className="chip"; b.textContent=label;
    b.setAttribute("aria-pressed", avDraft.accessory===k);
    b.addEventListener("click", ()=>{ avDraft.accessory=k; fillAvatarCreate(); });
    ar.appendChild(b);
  });
  renderNameBox();
}
$("av-cancel").addEventListener("click", closeAvatarCreate);
$("av-save").addEventListener("click", async ()=>{
  const prenom = avDraft.prenom.trim();
  if(!prenom){ $("av-warn").textContent = "Écris ton prénom avant d'enregistrer."; return; }
  const niceName = prenom.charAt(0).toUpperCase() + prenom.slice(1);
  const avatar = {skin:avDraft.skin, hair:avDraft.hair, eyes:avDraft.eyes, hairLength:avDraft.hairLength, coat:avDraft.coat, accessory:avDraft.accessory};
  const isNewProfile = !avEditingId;
  if(avEditingId){
    const p = PROFILES.find(x=>x.id===avEditingId);
    p.prenom = niceName; p.avatar = avatar;
  }else{
    const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    PROFILES.push({id, prenom:niceName, avatar, createdAt:Date.now()});
    await store.set(pk(CFG_STORE_KEY.retenues,id), clone(DEFAULT_RETENUES));
    await store.set(pk(CFG_STORE_KEY.tables,id), clone(DEFAULT_TABLES));
    await store.set(pk(CFG_STORE_KEY.mix,id), clone(DEFAULT_MIX));
    await store.set(pk(CFG_STORE_KEY.faussaire_dictee,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.faussaire_trou,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.faussaire_correction,id), clone(DEFAULT_FAUSSAIRE_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.deguiseur_verbe,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.deguiseur_habille,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.deguiseur_infinitif,id), clone(DEFAULT_DEGUISEUR_ACTIVITY));
    await store.set(pk(CFG_STORE_KEY.menteur,id), clone(DEFAULT_MENTEUR_CFG));
    await store.set(pk("coffre-stats",id), {tries:0,errors:0,best:0,opens:0});
    await store.set(pk("coffre-records",id), {});
    await store.set(pk("brigade-filous",id), {retenues:true, tables:true, faussaire:true, deguiseur:true, menteur:true});
    await setActiveProfile(id);
  }
  await saveProfiles();
  $("avatarcreate").classList.remove("show");
  if(ACTIVE_ID){ await loadActiveProfileData(); showFilous(); } else { showProfiles(); }
  if(settingsOpenAfterSave){
    settingsOpenAfterSave=false;
    if(isNewProfile && ACTIVE_ID){ settingsScope="child"; await loadSettingsChild(ACTIVE_ID); }
    fillSettings();
  }
});
let settingsOpenAfterSave = false;

async function deleteProfile(id){
  if(!confirm("Supprimer ce profil et toutes ses données ?")) return;
  PROFILES = PROFILES.filter(p=>p.id!==id);
  await saveProfiles();
  await store.del(pk(CFG_STORE_KEY.retenues,id)); await store.del(pk(CFG_STORE_KEY.tables,id)); await store.del(pk(CFG_STORE_KEY.mix,id));
  await store.del(pk(CFG_STORE_KEY.faussaire_dictee,id)); await store.del(pk(CFG_STORE_KEY.faussaire_trou,id)); await store.del(pk(CFG_STORE_KEY.faussaire_correction,id));
  await store.del(pk(CFG_STORE_KEY.deguiseur_verbe,id)); await store.del(pk(CFG_STORE_KEY.deguiseur_habille,id)); await store.del(pk(CFG_STORE_KEY.deguiseur_infinitif,id));
  await store.del(pk(CFG_STORE_KEY.menteur,id));
  await store.del(pk("coffre-stats",id)); await store.del(pk("coffre-records",id)); await store.del(pk("brigade-filous",id));
  if(ACTIVE_ID===id){
    ACTIVE_ID = PROFILES.length ? PROFILES[0].id : null;
    await store.set("brigade-profil-actif", ACTIVE_ID);
    if(ACTIVE_ID) await loadActiveProfileData();
  }
  if(PROFILES.length){
    await loadSettingsChild(settingsChildId===id ? ACTIVE_ID : settingsChildId);
    fillSettings();
  }else{
    $("settings").classList.remove("show"); showProfiles();
  }
}

/* ---------- génération ---------- */
