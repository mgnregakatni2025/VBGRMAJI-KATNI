/* ===== रिमार्क सिस्टम — डिलीट / रिकवरी / जॉब कार्ड डिलीट / भूमि विवाद / गलत मैपिंग / अन्य ===== */
(function(){
 "use strict";
 const RMK_STORE="mgn_remarks_v1";
 const RMK_FILE="remark.json";
 const REPO_PRIMARY="VBGRMAJI-KATNI";
 const REPO_FALLBACK="VBGRMAJI-KATNI";

 /* ===== Firebase Realtime Database (क्लाउड में रिमार्क सेव) ===== */
 const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDfQEJq-NkPlHyyyuz-7sIZtYXPW7qzcb4",
  authDomain: "mgn-katni-remarks.firebaseapp.com",
  databaseURL: "https://mgn-katni-remarks-default-rtdb.firebaseio.com",
  projectId: "mgn-katni-remarks",
  storageBucket: "mgn-katni-remarks.firebasestorage.app",
  messagingSenderId: "865561956022",
  appId: "1:865561956022:web:9b22142a3855391cbd6017",
  measurementId: "G-0GQZ73X9ZG"
 };
 const FB_PATH="remarks";
 let FB_APP=null, FB_DB=null;
 function fbInit(){
  if(FB_DB)return true;
  try{
   if(!window.firebase||!window.firebase.initializeApp)return false;
   if(!FB_APP){
    try{FB_APP=window.firebase.app();}
    catch(e){FB_APP=window.firebase.initializeApp(FIREBASE_CONFIG);}
   }
   FB_DB=window.firebase.database(FB_APP);
   return true;
  }catch(e){console.error("FB init err:",e);return false;}
 }
 function fbEnabled(){return fbInit();}

 const OPTIONS=[
  {id:"delete",label:"डिलीट",icon:"🗑️",bg:"#ffebee",fg:"#c62828"},
  {id:"recovery",label:"रिकवरी",icon:"🔄",bg:"#e8f5e9",fg:"#2e7d32"},
  {id:"job_card_delete",label:"जॉब कार्ड डिलीट",icon:"💳",bg:"#fff3e0",fg:"#e65100"},
  {id:"land_dispute",label:"भूमि विवाद",icon:"🏞️",bg:"#e3f2fd",fg:"#0d47a1"},
  {id:"wrong_mapping",label:"गलत मैपिंग",icon:"🗺️",bg:"#f3e5f5",fg:"#6a1b9a"},
  {id:"other",label:"अन्य",icon:"✍️",bg:"#f3f4f6",fg:"#37474f"}
 ];
 const OPT_MAP={};OPTIONS.forEach(o=>OPT_MAP[o.id]=o);

 let remarks=[];
 let curCode=null;
 let curLabel=null;
 let curLabelId=null;

 function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
 function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}

 function persistLocal(){try{localStorage.setItem(RMK_STORE,JSON.stringify(remarks));}catch(e){}}
 function encFbKey(code){return String(code||"").replace(/[.#$\/\[\]]/g,"_");}
 function decFbKey(key){return key;}
 async function persistFirebase(){
  if(!fbEnabled())return false;
  try{
   const payload={};
   remarks.forEach(r=>{payload[encFbKey(r.work_code)]=r;});
   await FB_DB.ref(FB_PATH).set(payload);
   return true;
  }catch(e){console.error("FB persist err:",e);return false;}
 }
 async function persistRemote(){
  /* पहले Firebase पर सेव करने की कोशिश */
  if(await persistFirebase())return true;
  /* server.py के /save-remark पर POST — remark.json डिस्क पर लिखता है */
  try{
   const res=await fetch("save-remark",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(remarks)
   });
   if(res.ok)return true;
  }catch(e){}
  /* अगर सर्वर नहीं है तो डाउनलोड फॉलबैक */
  try{
   const blob=new Blob([JSON.stringify(remarks,null,1)],{type:"application/json"});
   const a=document.createElement("a");
   a.href=URL.createObjectURL(blob);
   a.download=RMK_FILE;
   document.body.appendChild(a);a.click();document.body.removeChild(a);
   setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }catch(e){}
  return false;
 }
 function pillText(rk){
  if(!rk)return "";
  /* "अन्य" चुना हो तो लिखा हुआ टेक्स्ट दिखाएँ */
  return (rk.label_id==="other"&&rk.detail)?rk.detail:rk.label;
 }
 async function saveRmk(){
  persistLocal();
  await persistRemote();
  const code=curCode||"";
  document.querySelectorAll('#modalBody tr.wk-detail').forEach(tr=>{
   if(tr.dataset.workCode!==code)return;
   const rk=getRemark(code);
   const td=tr.querySelector("td.td-rmk");
   if(td&&rk){
    const txt=pillText(rk);
    td.innerHTML=`<span class="rmk-pill" title="${esc(rk.label+(rk.detail?" — "+rk.detail:""))}" data-code="${esc(code)}">🏷️ ${esc(txt)}</span>`;
   }
  });
  refreshRmkBar();
 }
 function getRemark(code){
  if(!code)return null;
  let f=null;
  for(let i=remarks.length-1;i>=0;i--){if(String(remarks[i].work_code)===String(code)){f=remarks[i];break;}}
  return f;
 }
 function applyRmk(work_code,label_id,label,detail){
  remarks=remarks.filter(r=>String(r.work_code)!==String(work_code));
  remarks.push({work_code,label_id,label,detail:detail||"",date:today()});
  saveRmk();
 }

 /* ===== रिमार्क मेनू ===== */
 function openRmkMenu(code){
  curCode=code;
  const codeEl=document.getElementById("rmkMenuCode");
  if(codeEl)codeEl.textContent=code?"# "+code:"";
  const list=document.getElementById("rmkMenuList");
  list.innerHTML=OPTIONS.map(o=>{
   const ex=getRemark(code);
   const cur=ex&&ex.label_id===o.id;
   return `<div class="rmk-opt" data-rmk-id="${o.id}" style="${cur?'box-shadow:inset 0 0 0 2px var(--pri)':''}">
     <span class="rmk-ic" style="background:${o.bg};color:${o.fg}">${o.icon}</span>
     ${o.label}${cur?'<span style="margin-left:auto;font-size:10px;color:var(--grn);font-weight:700">✓ लागू</span>':""}</div>`;
  }).join("");
  document.getElementById("rmkMenu").style.display="flex";
  document.body.style.overflow="hidden";
 }
 function closeRmkMenu(){document.getElementById("rmkMenu").style.display="none";}
 function closeHinModal(){document.getElementById("hinModal").style.display="none";}
 function closeRemarkMenus(){
  closeRmkMenu();closeHinModal();
  const wm=document.getElementById("workModal");
  if(!wm||wm.style.display!=="flex")document.body.style.overflow="";
 }
 function openHinModal(){
  const input=document.getElementById("hinInput");
  input.value="";
  document.getElementById("hinPrev").textContent="";
  document.getElementById("hinModal").style.display="flex";
  document.body.style.overflow="hidden";
  setTimeout(()=>{input.focus();},50);
 }

 function refreshRmkBar(){
  const bar=document.getElementById("rmkBarList");
  if(!bar)return;
  const seen=new Set();const items=[];
  document.querySelectorAll('#modalBody tr.wk-detail').forEach(tr=>{
   const c=tr.dataset.workCode;
   if(!c||seen.has(c))return;seen.add(c);
   const rk=getRemark(c);
   if(rk)items.push(`<span class="rmk-pill" style="margin-right:4px" title="${esc(rk.label+(rk.detail?" — "+rk.detail:""))}" data-code="${esc(c)}">🏷️ ${esc(pillText(rk))}</span>`);
  });
  bar.innerHTML=items.length?items.join(""):'<span style="color:var(--muted)">कोई रिमार्क नहीं</span>';
 }

 /* ===== रोमन → हिंदी ट्रांसलिटरेशन (शब्दकोश + ITRANS) ===== */
 const DICT={
  aaj:"आज",aak:"आज",dk:"का",ka:"का",ki:"की",ke:"के",ko:"को",se:"से",me:"में",
  main:"मैं",tum:"तुम",hum:"हम",aap:"आप",ap:"आप",hai:"है",hain:"हैं",tha:"था",
  the:"थे",thi:"थी",ho:"हो",haan:"हाँ",nahi:"नहीं",aur:"और",ya:"या",par:"पर",
  to:"तो",bhi:"भी",hi:"ही",sab:"सब",kuch:"कुछ",bahut:"बहुत",ye:"ये",wo:"वो",
  us:"उस",mera:"मेरा",apna:"अपना",hamara:"हमारा",ek:"एक",do:"दो",teen:"तीन",
  char:"चार",din:"दिन",raat:"रात",subah:"सुबह",ghar:"घर",kaam:"काम",
  karya:"कार्य",panchayat:"पंचायत",gram:"ग्राम",gaon:"गाँव",khet:"खेत",
  zameen:"ज़मीन",bhoomi:"भूमि",vivad:"विवाद",galat:"गलत",sahi:"सही",
  theek:"ठीक",kiya:"किया",karna:"करना",gaya:"गया",gayi:"गई",hua:"हुआ",
  jana:"जाना",aana:"आना",mazdoor:"मज़दूर",shramik:"श्रमिक",adhikari:"अधिकारी",
  mukhya:"मुख्य",khand:"खंड",jila:"जिला",zila:"ज़िला",vikas:"विकास",
  upyantri:"उपयंत्री",sachiv:"सचिव",sarpanch:"सरपंच",sadasya:"सदस्य",
  delete:"डिलीट",recovery:"रिकवरी",card:"कार्ड",job:"जॉब",mapping:"मैपिंग",
  wrong:"गलत",jab:"जब",tab:"तब",kyon:"क्यों",lekin:"लेकिन",thoda:"थोड़ा",
  yah:"यह",koi:"कोई",kya:"क्या",mujhe:"मुझे",humne:"हमने",aapne:"आपने",
  yahan:"यहाँ",wahan:"वहाँ",abhi:"अभी",kal:"कल",andar:"अंदर",bahar:"बाहर",
  baat:"बात",khabar:"खबर",shikayat:"शिकायत",nirikshan:"निरीक्षण",audit:"ऑडिट",
  prashikshan:"प्रशिक्षण",anudan:"अनुदान",roigar:"रोजगार",rozgar:"रोज़गार",
  yojana:"योजना",yojna:"योजना",kendr:"केंद्र",nidhi:"निधि",khata:"खाता",
  pasibook:"पासबुक",voucher:"वाउचर",payment:"पेमेंट",paisa:"पैसा",
  rupaye:"रुपये",mehnat:"मेहनत",kamai:"कमाई",karch:"खर्च",kharcha:"खर्चा",
  baki:"बाकी",shudh:"शुद्ध",ganda:"गंदा",saaf:"साफ",kshetra:"क्षेत्र",
  sthal:"स्थल",karyalay:"कार्यालय",udyam:"उद्यम",swachh:"स्वच्छ",
  bhagidari:"भागीदारी",gramin:"ग्रामीण",nagar:"नगर",shahar:"शहर",
  diya:"दिया",diye:"दिए",kar:"कर",gay:"गया",gai:"गई",hue:"हुए",
  lagta:"लगता",lagna:"लगना",hona:"होना",dekhna:"देखना",milna:"मिलना",
  dena:"देना",lena:"लेना",rehna:"रहना",kholna:"खोलना",band:"बंद",
  khula:"खुला",khuli:"खुली",naya:"नया",nayi:"नई",purana:"पुराना",
  puri:"पूरी",poora:"पूरा",thik:"ठीक",sach:"सच",saman:"सामान",nam:"नाम",
  uttar:"उत्तर",dakshin:"दक्षिण",pashchim:"पश्चिम",madhya:"मध्य",
  complete:"कंपलीट",karo:"करो",ho:"हो",raha:"रहा",rahi:"रही",rahe:"रहे",
  de:"दे",lo:"लो",le:"ले",padho:"पढ़ो",likho:"लिखो",kamai:"कमाई",
  kharcha:"खर्चा",rasta:"रास्ता",nirmaan:"निर्माण",nirman:"निर्माण",
  pura:"पूरा",puri:"पूरी",pure:"पूरे",nahi:"नहीं",hua:"हुआ",hue:"हुए",
  hui:"हुई",kya:"क्या",kaun:"कौन",kab:"कब",kahan:"कहाँ",kis:"किस",
  jiska:"जिसका",jisme:"जिसमें",uska:"उसका",usme:"उसमें",isme:"इसमें"
 };
 const C={
  k:"क",kh:"ख",g:"ग",gh:"घ",ng:"ङ",c:"च",ch:"च",j:"ज",jh:"झ",ny:"ञ",
  t:"त",th:"थ",d:"द",dh:"ध",n:"न",p:"प",ph:"फ",b:"ब",bh:"भ",m:"म",
  y:"य",r:"र",l:"ल",v:"व",w:"व",s:"स",sh:"श",h:"ह",ksh:"क्ष",gy:"ज्ञ",
  shr:"श्र",tr:"त्र",T:"ट",Th:"ठ",D:"ड",Dh:"ढ",N:"ण",S:"श",z:"ज़",f:"फ़",q:"क़"
 };
 const VOW={a:"अ",aa:"आ",i:"इ",ee:"ई",u:"उ",oo:"ऊ",e:"ए",ai:"ऐ",o:"ओ",au:"औ"};
 const MATRA={aa:"ा",i:"ि",ee:"ी",u:"ु",oo:"ू",e:"े",ai:"ै",o:"ो",au:"ौ"};
 const HAL="्";
 function latinToHindi(word){
  if(!word)return "";
  const lw=word.toLowerCase();
  if(DICT[lw])return DICT[lw];
  let out="",i=0;
  while(i<word.length){
   const c=word[i];
   if(!/[a-zA-Z]/.test(c)){out+=c;i++;continue;}
   let tok="",kind="";
   for(let L=3;L>=1&&!tok;L--){
    const sub=word.substr(i,L).toLowerCase();
    if(C[sub]){tok=sub;kind="c";}
    else if(VOW[sub]){tok=sub;kind="v";}
   }
   if(!tok){out+=c;i++;continue;}
   if(kind==="c"){
    out+=C[tok];i+=tok.length;
    const rest=word.substr(i).toLowerCase();
    let mt=null;
    for(let L=2;L>=1&&!mt;L--){const s=rest.substr(0,L);if(MATRA[s])mt=s;}
    if(mt){out+=MATRA[mt];i+=mt.length;continue;}
    if(rest[0]==="a"){i+=1;continue;}
    if(rest.length){
     let nextCons=false;
     for(let L=3;L>=1&&!nextCons;L--){const s=rest.substr(0,L);if(C[s])nextCons=true;}
     if(nextCons){out+=HAL;continue;}
    }
    continue;
   }else{out+=VOW[tok];i+=tok.length;}
  }
  return out;
 }
 function toDevanagari(text){
  if(!text)return "";
  let out="",i=0;
  while(i<text.length){
   const c=text[i];
   if(/[a-zA-Z]/.test(c)){
    let run="";
    while(i<text.length&&/[a-zA-Z0-9]/.test(text[i])){run+=text[i];i++;}
    out+=latinToHindi(run);
   }else{out+=c;i++;}
  }
  return out;
 }

 /* ===== इवेंट बाइंडिंग ===== */
 function init(){
  document.getElementById("rmkMenuList").addEventListener("click",e=>{
   const opt=e.target.closest(".rmk-opt");
   if(!opt)return;
   const id=opt.dataset.rmkId;
   const o=OPT_MAP[id];
   if(!o)return;
   if(id==="other"){
    curLabel=o.label;curLabelId=o.id;
    closeRmkMenu();
    openHinModal();
   }else{
    applyRmk(curCode,o.id,o.label,"");
    closeRmkMenu();
   }
  });
  document.getElementById("hinCancel").addEventListener("click",closeHinModal);
  document.getElementById("hinSave").addEventListener("click",()=>{
   const raw=document.getElementById("hinInput").value;
   const detail=toDevanagari(raw);
   applyRmk(curCode,curLabelId||"other",curLabel||"अन्य",detail);
   closeHinModal();
  });
  document.getElementById("hinInput").addEventListener("input",e=>{
   document.getElementById("hinPrev").textContent=toDevanagari(e.target.value);
  });
  document.getElementById("rmkMenu").addEventListener("click",e=>{if(e.target===e.currentTarget)closeRmkMenu();});
  document.getElementById("hinModal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeHinModal();});
 }

 function loadLocal(){
  try{const s=localStorage.getItem(RMK_STORE);if(s){remarks=JSON.parse(s);if(!Array.isArray(remarks))remarks=[];}}catch(e){remarks=[];}
 }
 function getRepoUrls(fname){
  return [`https://raw.githubusercontent.com/mgnregakatni2025/${REPO_PRIMARY}/main/${fname}`,
   `https://raw.githubusercontent.com/mgnregakatni2025/${REPO_PRIMARY}/master/${fname}`,
   `https://raw.githubusercontent.com/mgnregakatni2025/${REPO_FALLBACK}/main/${fname}`,
   `https://raw.githubusercontent.com/mgnregakatni2025/${REPO_FALLBACK}/master/${fname}`];
 }
 async function fetchFromSources(fname){
  const local=[fname,`./${fname}`,`/${fname}`];
  for(const u of local){try{const r=await fetch(u,{cache:"no-store"});if(r.ok)return await r.text();}catch(e){}}
  for(const u of getRepoUrls(fname)){try{const r=await fetch(u,{cache:"no-store"});if(r.ok)return await r.text();}catch(e){}}
  return null;
 }
 async function loadFirebase(){
  if(!fbEnabled())return false;
  try{
   const snap=await FB_DB.ref(FB_PATH).once("value");
   const val=snap.val();
   if(!val)return false;
   const arr=[];
   Object.keys(val).forEach(key=>{const r=val[key];if(r&&typeof r==="object"){arr.push(r);}});
   if(arr.length){remarks=arr;persistLocal();refreshRmkBar();return true;}
   return false;
  }catch(e){return false;}
 }
 async function loadRemote(){
  /* Firebase चालू हो तो पहले वहाँ से (क्लाउड ही असली स्रोत) */
  if(await loadFirebase())return;
  const txt=await fetchFromSources(RMK_FILE);
  if(!txt)return;
  try{
   const d=JSON.parse(txt);
   if(!Array.isArray(d))return;
   /* फ़ाइल (remark.json) ही असली स्रोत है — उसे ही दिखाएँ */
   remarks=d;
   persistLocal();
   refreshRmkBar();
  }catch(e){}
 }

 /* ग्लोबल एक्सपोज़ */
 window.getRemark=getRemark;
 window.applyRmk=applyRmk;
 window.openRmkMenu=openRmkMenu;
 window.refreshRmkBar=refreshRmkBar;
 window.closeRemarkMenus=closeRemarkMenus;
 window.toDevanagari=toDevanagari;
 window.pillText=pillText;

 loadLocal();
 loadRemote();
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
 else init();
})();
