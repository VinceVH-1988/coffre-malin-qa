let ART = {}; // peuplé au démarrage par loadIllustrations() (voir boot.js)
const REWARD = {feu:"Feu d'artifice", code:"Code du cadenas"};
const VILLAIN = {
  add:{name:"Le Faussaire des Retenues", art:"retenues"}, sub:{name:"Le Faussaire des Retenues", art:"retenues"},
  mul:{name:"Le Tricheur des Tables", art:"tables"}, div:{name:"Le Tricheur des Tables", art:"tables"},
  faussaire:{name:"Le Faussaire", art:"faussaire_mot"},
  deguiseur:{name:"Le Déguiseur", art:"deguiseur"}
};
const SYM = {add:"+", sub:"−", mul:"x", div:":"};
const FORMS = {
  add:{ "u+u":["U + U",[2,9],[2,9]], "du+u":["DU + U",[11,98],[2,9]], "du+du":["DU + DU",[11,98],[11,98]], "cdu+du":["CDU + DU",[100,899],[11,99]], "cdu+cdu":["CDU + CDU",[100,899],[100,899]] },
  sub:{ "u-u":["U − U",[2,9],[2,9]], "du-u":["DU − U",[11,99],[2,9]], "du-du":["DU − DU",[20,99],[11,89]], "cdu-du":["CDU − DU",[100,999],[11,99]], "cdu-cdu":["CDU − CDU",[200,999],[100,899]] }
};
const PASS = {avec:"Avec", sans:"Sans", mix:"Mélangé"};
const DEFAULT_RETENUES = {
  code:"5472", target:6, reward:"feu",
  add:{on:true, forms:["du+u"], pass:"avec", max:null},
  sub:{on:true, forms:["du-u"], pass:"avec", max:null}
};
const DEFAULT_TABLES = {
  code:"5472", target:6, reward:"feu",
  mul:{on:true, tables:[2,5,10], extra:[]},
  div:{on:false, tables:[2,5,10]}
};
const DEFAULT_MIX = { code:"5472", target:6, reward:"feu" };
const DEFAULT_FAUSSAIRE_ACTIVITY = { code:"5472", target:6, reward:"feu", series:[1,2,3,4,5,6,7,8] };
const DEFAULT_DEGUISEUR_ACTIVITY = { code:"5472", target:6, reward:"feu", series:[1,2,3,4,5], fusionInfinitif:true };
const DEFAULT_MENTEUR_CFG = { themes:["temps"] };
/* mode: "none" (par défaut, pas de limite), "global" (une limite commune à tous les filous du profil)
   ou "perFilou" (une limite propre à chaque filou). bonus : minutes offertes à chaque déblocage parent. */
const DEFAULT_MINUTEUR = { mode:"none", global:20, perFilou:{retenues:20, tables:20, mix:20, faussaire:20, deguiseur:20, menteur:20}, bonus:15 };
const DEFAULTS_BY_FILOU = {
  retenues:DEFAULT_RETENUES, tables:DEFAULT_TABLES, mix:DEFAULT_MIX,
  faussaire_dictee:DEFAULT_FAUSSAIRE_ACTIVITY, faussaire_trou:DEFAULT_FAUSSAIRE_ACTIVITY, faussaire_correction:DEFAULT_FAUSSAIRE_ACTIVITY,
  deguiseur_verbe:DEFAULT_DEGUISEUR_ACTIVITY, deguiseur_habille:DEFAULT_DEGUISEUR_ACTIVITY, deguiseur_infinitif:DEFAULT_DEGUISEUR_ACTIVITY,
  menteur:DEFAULT_MENTEUR_CFG
};
const CFG_STORE_KEY = {
  retenues:"coffre-cfg-retenues", tables:"coffre-cfg-tables", mix:"coffre-cfg-mix",
  faussaire_dictee:"coffre-cfg-faussaire-dictee", faussaire_trou:"coffre-cfg-faussaire-trou", faussaire_correction:"coffre-cfg-faussaire-correction",
  deguiseur_verbe:"coffre-cfg-deguiseur-verbe", deguiseur_habille:"coffre-cfg-deguiseur-habille", deguiseur_infinitif:"coffre-cfg-deguiseur-infinitif",
  menteur:"coffre-cfg-menteur"
};

/* ---------- filous (registre) ---------- */
const FILOUS = [
  {id:"retenues", nom:"Le Faussaire des Retenues", domaine:"Calcul : additions et soustractions", art:"retenues", ready:true, scope:"retenues", kind:"calc", categorie:"calcul"},
  {id:"tables", nom:"Le Tricheur des Tables", domaine:"Calcul : multiplications et divisions", art:"tables", ready:true, scope:"tables", kind:"calc", categorie:"calcul"},
  {id:"mix", nom:"Calcul mélangé", domaine:"Toutes tes opérations réglées, au hasard", art:"mix", ready:true, scope:"mix", combo:true, kind:"calc", categorie:"calcul"},
  {id:"deguiseur", nom:"Le Déguiseur", domaine:"Trouver le verbe, habillé ou en pyjama, l'infinitif", art:"deguiseur", ready:true, kind:"deguiseur", categorie:"francais"},
  {id:"faussaire", nom:"Le Faussaire", domaine:"Dictée, trou et corrections", art:"faussaire_mot", ready:true, kind:"faussaire", categorie:"francais"},
  {id:"menteur", nom:"Le Menteur", domaine:"Quiz d'éveil, vrai ou faux", art:"menteur", ready:true, kind:"menteur", categorie:"eveil"}
];
const FILOU_KIND = Object.fromEntries(FILOUS.map(f=>[f.id, f.kind]));
const MULTI_ACTIVITY_FILOUS = new Set(["faussaire","deguiseur"]);
function currentKind(){ return MULTI_ACTIVITY_FILOUS.has(S.filou) ? S.activite : FILOU_KIND[S.filou]; }
const FAUSSAIRE_ACTIVITIES = [
  {id:"dictee", nom:"Dictée", desc:"Écoute le mot et écris-le au clavier."},
  {id:"trou", nom:"Le trou du Faussaire", desc:"Trouve la bonne lettre manquante."},
  {id:"correction", nom:"Repérer et corriger", desc:"Regarde si le mot est juste, puis corrige-le."}
];
const DEGUISEUR_ACTIVITIES = [
  {id:"verbe", nom:"Trouver le verbe", desc:"Touche le verbe habillé dans la phrase."},
  {id:"habille", nom:"Habillé ou en pyjama ?", desc:"Le verbe en évidence est-il habillé ou en pyjama ?"},
  {id:"infinitif", nom:"Écrire l'infinitif", desc:"Écris l'infinitif du verbe habillé."}
];
const ACTIVITIES_BY_FILOU = {faussaire: FAUSSAIRE_ACTIVITIES, deguiseur: DEGUISEUR_ACTIVITIES};
const MENTEUR_THEME_LABEL = {temps:"Temps : saisons et mois", belgique:"Éveil : la Belgique", toussaint:"Éveil : Toussaint et fête des morts"};
const CATEGORIES = [["calcul","Calcul"],["francais","Français"],["eveil","Éveil"]];
function buildEpreuveTabs(deguiseurFusionOn){
  return CATEGORIES.map(([cat,label])=>{
    const tabs=[];
    FILOUS.filter(f=>f.ready && f.categorie===cat).forEach(f=>{
      if(ACTIVITIES_BY_FILOU[f.id]){
        ACTIVITIES_BY_FILOU[f.id].forEach(a=>{
          if(f.id==="deguiseur" && a.id==="infinitif" && deguiseurFusionOn) return;
          tabs.push([f.id+":"+a.id, a.nom]);
        });
      }else{
        tabs.push([f.id, f.nom]);
      }
    });
    return {cat, label, tabs};
  }).filter(g=>g.tabs.length);
}

/* ---------- avatars ---------- */
const SKIN = ["#ffe0bd","#f1c27d","#c68642","#8d5524"];
const HAIR = ["#2b1b12","#6b4226","#c1652f","#e8c547","#b9c5d2"];
const EYES = ["#2a9d8f","#1f3a5f","#6b4226","#4a7c3c"];
const COAT = ["#1f3a5f","#8a1f2b","#2f6b3a","#5b3a8a","#b5651d"];
const ACCESSORY_OPTIONS = [["aucun","Aucun"],["casquette","Casquette"],["loupe","Loupe"],["lunettes","Lunettes"]];
const DEFAULT_AVATAR = {skin:SKIN[0], hair:HAIR[0], eyes:EYES[0], hairLength:"court", coat:COAT[0], accessory:"aucun"};

function buildAccessoryFrag(acc, coat){
  if(acc === "casquette"){
    return `
<path d="M60 90 Q60 50 100 50 Q140 50 140 90 Q120 76 100 78 Q80 76 60 90 Z" fill="${coat}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M118 82 Q150 84 150 96 Q148 102 132 98 Q124 92 118 82 Z" fill="${coat}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  if(acc === "loupe"){
    return `
<circle cx="146" cy="128" r="15" fill="#dff1f5" stroke="#222" stroke-width="3"/>
<path d="M157 139 L172 156" stroke="#6b4226" stroke-width="6" stroke-linecap="round"/>`;
  }
  if(acc === "lunettes"){
    return `
<circle cx="87" cy="99" r="12" fill="none" stroke="#222" stroke-width="3"/>
<circle cx="113" cy="99" r="12" fill="none" stroke="#222" stroke-width="3"/>
<path d="M99 99 L101 99" stroke="#222" stroke-width="3" stroke-linecap="round"/>
<path d="M75 97 L64 95" stroke="#222" stroke-width="3" stroke-linecap="round"/>
<path d="M125 97 L136 95" stroke="#222" stroke-width="3" stroke-linecap="round"/>`;
  }
  return "";
}

function generateAvatarSVG(a){
  const long = a.hairLength === "long";
  const coat = a.coat || COAT[0];
  const locks = long ? `
<path d="M68 92 Q56 132 66 174 Q79 161 76 120 Q80 100 72 90 Z" fill="${a.hair}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M132 92 Q144 132 134 174 Q121 161 124 120 Q120 100 128 90 Z" fill="${a.hair}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  const accessory = buildAccessoryFrag(a.accessory, coat);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
<rect x="4" y="4" width="192" height="232" rx="22" fill="#fdf6e3"/>
<ellipse cx="100" cy="222" rx="62" ry="8" fill="#000" opacity=".12"/>
<path d="M62 222 L70 150 Q100 136 130 150 L138 222 Z" fill="${coat}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="100" cy="182" r="3" fill="#f2b134"/><circle cx="100" cy="200" r="3" fill="#f2b134"/>
${locks}
<circle cx="100" cy="100" r="34" fill="${a.skin}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<ellipse cx="87" cy="98" rx="7" ry="6" fill="#fff" stroke="#222" stroke-width="2" stroke-linejoin="round"/><ellipse cx="113" cy="98" rx="7" ry="6" fill="#fff" stroke="#222" stroke-width="2" stroke-linejoin="round"/>
<circle cx="87" cy="99" r="3.6" fill="${a.eyes}"/><circle cx="113" cy="99" r="3.6" fill="${a.eyes}"/>
<circle cx="88" cy="100" r="1.5" fill="#222"/><circle cx="114" cy="100" r="1.5" fill="#222"/>
<path d="M80 88 Q87 83 94 87" fill="none" stroke="${a.hair}" stroke-width="3" stroke-linecap="round"/>
<path d="M106 87 Q113 83 120 88" fill="none" stroke="${a.hair}" stroke-width="3" stroke-linecap="round"/>
<path d="M88 116 Q100 126 112 116" fill="none" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="78" cy="110" r="5" fill="#d64545" opacity=".35"/><circle cx="122" cy="110" r="5" fill="#d64545" opacity=".35"/>
<path d="M66 96 Q66 66 100 66 Q134 66 134 96 Q124 82 100 84 Q76 82 66 96Z" fill="${a.hair}" stroke="#222" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
${accessory}
</svg>`;
}

/* ---------- clavier maison (ordre alphabétique) ---------- */
const KB_ROWS = [
  ["a","b","c","d","e","f","g","h","i"],
  ["j","k","l","m","n","o","p","q","r"],
  ["s","t","u","v","w","x","y","z"],
  ["é","è","ê","à","ù","â","î","ï","ô","ç","œ","'","-"]
];
function buildKeyboard(el, onKey, onBackspace){
  el.innerHTML = "";
  let maj = false;
  const letterButtons = [];
  const flatLetters = KB_ROWS.flat();
  KB_ROWS.forEach(row=>{
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    row.forEach(ch=>{
      const b=document.createElement("button");
      b.type="button"; b.className="kbd"; b.textContent=ch;
      b.addEventListener("click",()=>onKey(maj ? ch.toUpperCase() : ch));
      rowEl.appendChild(b);
      letterButtons.push(b);
    });
    el.appendChild(rowEl);
  });
  const ctrlRow = document.createElement("div");
  ctrlRow.className = "kb-row";
  const majBtn=document.createElement("button");
  majBtn.type="button"; majBtn.className="kbd kbd-maj"; majBtn.textContent="Maj";
  majBtn.setAttribute("aria-pressed","false");
  majBtn.addEventListener("click",()=>{
    maj = !maj;
    majBtn.classList.toggle("active", maj);
    majBtn.setAttribute("aria-pressed", String(maj));
    letterButtons.forEach((b,i)=>{ b.textContent = maj ? flatLetters[i].toUpperCase() : flatLetters[i]; });
  });
  ctrlRow.appendChild(majBtn);
  const sp=document.createElement("button"); sp.type="button"; sp.className="kbd kbd-wide"; sp.textContent="Espace";
  sp.addEventListener("click",()=>onKey(" ")); ctrlRow.appendChild(sp);
  const bs=document.createElement("button"); bs.type="button"; bs.className="kbd kbd-wide erase"; bs.textContent="Effacer";
  bs.addEventListener("click",onBackspace); ctrlRow.appendChild(bs);
  el.appendChild(ctrlRow);
}

