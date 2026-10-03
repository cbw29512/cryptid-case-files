const CASES=[
{id:"bigfoot",label:"Bigfoot / Sasquatch",file:"cases/bigfoot.json"},
{id:"mothman",label:"Mothman",file:"cases/mothman.json"},
{id:"blank",label:"Blank Case File",file:"cases/blank.json"}
];

const state={id:null,original:null};
const select=document.getElementById("caseSelect");
const sightings=document.getElementById("sightingsList");
const evidence=document.getElementById("evidenceList");

function report(where,error){console.error("[Cryptid Case Files] "+where,error)}

function clone(value){
  try{return JSON.parse(JSON.stringify(value))}
  catch(error){report("clone failed",error);return {}}
}

function readPath(obj,path){
  try{return path.split(".").reduce(function(v,k){return v==null?undefined:v[k]},obj)}
  catch(error){report("read "+path,error);return ""}
}

function writePath(obj,path,value){
  try{
    const keys=path.split(".");
    let cursor=obj;
    for(let i=0;i<keys.length-1;i++){
      if(!cursor[keys[i]]||typeof cursor[keys[i]]!=="object")cursor[keys[i]]={};
      cursor=cursor[keys[i]];
    }
    cursor[keys[keys.length-1]]=value;
  }catch(error){report("write "+path,error)}
}

function key(){return "cryptid-case-file:"+state.id}

function saved(){
  try{
    const raw=localStorage.getItem(key());
    return raw?JSON.parse(raw):null;
  }catch(error){report("load draft",error);return null}
}

function fillFields(data){
  try{
    document.querySelectorAll("[data-field]").forEach(function(el){
      const value=readPath(data,el.dataset.field);
      el.textContent=Array.isArray(value)?value.join(", "):(value==null?"":value);
    });
  }catch(error){report("fill fields",error)}
}

function fillRecord(card,data){
  try{
    card.querySelectorAll("[data-key]").forEach(function(el){el.textContent=data&&data[el.dataset.key]?data[el.dataset.key]:""});
    const remove=card.querySelector(".remove");
    if(remove)remove.addEventListener("click",function(){card.remove();renumber()});
  }catch(error){report("fill record",error)}
}

function addSighting(data){
  try{
    const frag=document.getElementById("sightingTemplate").content.cloneNode(true);
    fillRecord(frag.querySelector(".sighting-card"),data||{});
    sightings.appendChild(frag);
    renumber();
  }catch(error){report("add sighting",error)}
}

function addEvidence(data){
  try{
    const frag=document.getElementById("evidenceTemplate").content.cloneNode(true);
    fillRecord(frag.querySelector(".evidence-card"),data||{});
    evidence.appendChild(frag);
    renumber();
  }catch(error){report("add evidence",error)}
}

function renumber(){
  try{
    sightings.querySelectorAll(".record-number").forEach(function(el,i){el.textContent="STATEMENT "+String(i+1).padStart(2,"0")});
    evidence.querySelectorAll(".record-number").forEach(function(el,i){el.textContent="EVIDENCE "+String(i+1).padStart(2,"0")});
  }catch(error){report("renumber",error)}
}

function render(data){
  try{
    fillFields(data);
    sightings.innerHTML="";
    evidence.innerHTML="";
    (data.sightings||[]).forEach(addSighting);
    (data.evidence||[]).forEach(addEvidence);
  }catch(error){report("render",error)}
}

function collectRecord(card){
  const out={};
  try{card.querySelectorAll("[data-key]").forEach(function(el){out[el.dataset.key]=el.innerText.trim()})}
  catch(error){report("collect record",error)}
  return out;
}

function collect(){
  try{
    const data=clone(state.original||{});
    document.querySelectorAll("[data-field]").forEach(function(el){
      let value=el.innerText.trim();
      if(el.dataset.field==="aliases")value=value.split(",").map(function(v){return v.trim()}).filter(Boolean);
      writePath(data,el.dataset.field,value);
    });
    data.sightings=Array.from(sightings.querySelectorAll(".sighting-card")).map(collectRecord);
    data.evidence=Array.from(evidence.querySelectorAll(".evidence-card")).map(collectRecord);
    return data;
  }catch(error){report("collect case",error);return clone(state.original||{})}
}

async function loadCase(id){
  try{
    const item=CASES.find(function(c){return c.id===id});
    if(!item)throw new Error("Unknown case "+id);
    const response=await fetch(item.file,{cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const data=await response.json();
    state.id=id;
    state.original=clone(data);
    render(saved()||data);
  }catch(error){
    report("load case",error);
    alert("The case file could not be loaded.");
  }
}

function save(){
  try{localStorage.setItem(key(),JSON.stringify(collect()));alert("Draft saved in this browser.")}
  catch(error){report("save draft",error);alert("The draft could not be saved.")}
}

function reset(){
  try{
    if(!confirm("Reset this case and erase the browser draft?"))return;
    localStorage.removeItem(key());
    render(clone(state.original));
  }catch(error){report("reset",error)}
}

function start(){
  try{
    CASES.forEach(function(item){
      const opt=document.createElement("option");
      opt.value=item.id;opt.textContent=item.label;select.appendChild(opt);
    });
    select.addEventListener("change",function(){loadCase(select.value)});
    document.getElementById("saveBtn").addEventListener("click",save);
    document.getElementById("resetBtn").addEventListener("click",reset);
    document.getElementById("printBtn").addEventListener("click",function(){try{window.print()}catch(error){report("print",error)}});
    document.getElementById("addSightingBtn").addEventListener("click",function(){addSighting({})});
    document.getElementById("addEvidenceBtn").addEventListener("click",function(){addEvidence({})});
    loadCase(CASES[0].id);
  }catch(error){report("startup",error)}
}
start();