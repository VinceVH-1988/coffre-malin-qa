function carriesAdd(a,b){ let c=0,n=0; while(a>0||b>0){ const s=a%10+b%10+c; c = s>=10?1:0; n+=c; a=Math.floor(a/10); b=Math.floor(b/10);} return n; }
function borrowsSub(a,b){ let br=0,n=0; while(a>0||b>0){ const d=a%10-b%10-br; br = d<0?1:0; n+=br; a=Math.floor(a/10); b=Math.floor(b/10);} return n; }
function passOk(n,mode){ return mode==="mix" ? true : mode==="avec" ? n>0 : n===0; }

function genAddSub(op){
  const conf = S.cfgs.retenues[op];
  const mode = conf.pass==="mix" ? (Math.random()<.6?"avec":"sans") : conf.pass;
  /* Le formulaire est repioché à chaque essai : si l'une des formes réglées ne peut jamais satisfaire
     le mode de passage choisi (ex. U − U ne peut jamais avoir de retenue, une seule forme), une autre
     forme active peut quand même aboutir plutôt que de faire échouer toute la génération. */
  for(let i=0;i<800;i++){
    const form = pick(conf.forms), [,ra,rb] = FORMS[op][form];
    const a=rnd(...ra), b=rnd(...rb);
    if(op==="add"){ if(a+b>999 || (form==="du+u" && a+b>99)) continue; if(conf.max && a+b>conf.max) continue; if(!passOk(carriesAdd(a,b),mode)) continue; return {op,a,b,r:a+b,form}; }
    else { if(a-b<1) continue; if(conf.max && a>conf.max) continue; if(!passOk(borrowsSub(a,b),mode)) continue; return {op,a,b,r:a-b,form}; }
  }
  const form = pick(conf.forms), [,ra,rb] = FORMS[op][form];
  if(op==="add"){ const a=ra[0], b=rb[0]; return {op,a,b,r:a+b,form}; }
  const a=Math.max(ra[0],rb[0]+1), b=rb[0]; return {op,a,b,r:a-b,form};
}
function genMul(){
  const c=S.cfgs.tables.mul, tables = c.tables.length ? c.tables : [2,5,10];
  const useDu = c.extra.includes("du*u") && (tables.length===0 || Math.random()<.35);
  if(useDu){ const a=rnd(11,49), b=rnd(2,9); return {op:"mul",a,b,r:a*b,form:"du*u"}; }
  const t=pick(tables), q=rnd(1,10);
  return Math.random()<.5 ? {op:"mul",a:q,b:t,r:q*t,t,form:"table"} : {op:"mul",a:t,b:q,r:q*t,t,form:"table"};
}
function genDiv(){ const tables = S.cfgs.tables.div.tables.length ? S.cfgs.tables.div.tables : [2,5,10]; const t=pick(tables), q=rnd(1,10); return {op:"div",a:t*q,b:t,r:q,form:"table"}; }

/* Chaque filou de calcul a ses propres réglages (S.cfgs.retenues / S.cfgs.tables), jamais partagés :
   désactiver une opération dans l'un n'affecte que lui. Calcul mélangé lit les deux en lecture seule. */
function activeOpsForFilou(filou){
  const ops=[];
  if(filou!=="tables"){
    const cr=S.cfgs.retenues;
    if(cr.add.on && cr.add.forms.length) ops.push("add");
    if(cr.sub.on && cr.sub.forms.length) ops.push("sub");
  }
  if(filou!=="retenues"){
    const ct=S.cfgs.tables;
    if(ct.mul.on && (ct.mul.tables.length || ct.mul.extra.length)) ops.push("mul");
    if(ct.div.on && ct.div.tables.length) ops.push("div");
  }
  return ops.length ? ops : (filou==="tables" ? ["mul"] : ["add"]);
}
function generate(){
  const kind = currentKind();
  if(kind==="dictee") return generateWord();
  if(kind==="trou"||kind==="correction") return generateItem();
  if(kind==="verbe"||kind==="habille"||kind==="infinitif") return generateDItem();
  if(kind==="habiller") return generateCItem();
  if(kind==="ordre"||kind==="intrus") return generatePItem();
  let q, key, guard=0;
  do{
    const op = pick(activeOpsForFilou(S.filou));
    q = op==="mul" ? genMul() : op==="div" ? genDiv() : genAddSub(op);
    key = q.a+q.op+q.b;
  }while(key===S.last && guard++<20);
  S.q=q; S.last=key; S.input=""; render();
}

/* ---------- dictée (Le Faussaire) ---------- */
