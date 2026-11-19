/* ---------- contenu.json : réseau d'abord, repli cache ---------- */
let CONTENU = {version:"0.0.0", date:"", dictee:[], deguiseur:[], faussaire:[], menteur:[]};
async function loadContenu(){
  try{
    const res = await fetch("contenu.json", {cache:"no-cache"});
    if(res.ok){ const data = await res.json(); CONTENU = data; await store.set("brigade-contenu", data); return; }
  }catch(e){}
  const cached = await store.get("brigade-contenu");
  if(cached) CONTENU = cached;
}

/* ---------- illustrations : chaque filou/méchant a son propre fichier SVG ---------- */
const ILLUSTRATION_FILES = ["retenues","tables","deguiseur","faussaire_mot","menteur","mix"];
async function loadIllustrations(){
  const next = {};
  await Promise.all(ILLUSTRATION_FILES.map(async key=>{
    try{
      const res = await fetch(`illustrations/${key}.svg`, {cache:"no-cache"});
      if(res.ok){ const svg = await res.text(); next[key] = svg; await store.set(`brigade-illustration-${key}`, svg); return; }
    }catch(e){}
    const cached = await store.get(`brigade-illustration-${key}`);
    next[key] = cached || "";
  }));
  ART = next;
}

(async()=>{
  await loadProfiles();
  const migratedId = await migrateIfNeeded();
  await loadContenu();
  await loadIllustrations();
  if(migratedId){
    await loadActiveProfileData();
    openAvatarCreate(migratedId);
  } else if(ACTIVE_ID && PROFILES.find(p=>p.id===ACTIVE_ID)){
    await loadActiveProfileData();
    showFilous();
  } else {
    showProfiles();
  }
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{});
})();
