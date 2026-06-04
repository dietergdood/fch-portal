import { useState, useEffect, useRef, createContext, useContext } from "react";
import { FONT, BP_MOBILE, BP_TABLET, BTN_COLOR as BTN, BTN_TXT, BTN_HOV, ACCENT, ACCENT2, ACCENT20, ACCENT15, ACCENT12, GN, R, RL, BL, AM, BK, GR, GB } from "./constants";
import { TI, TI_PATHS } from "./icons.jsx";
import { LOGO_B64, ThemeCtx, useTheme, PWA_CSS, hexToRgba, darkenHex, THEME_DEFAULT_STATIC, useBreakpoint, useIsMobile, ModalOrSheet, InfoBox, Btn, Card, Chip, Stat, Av, Tabs, STitle } from "./theme.jsx";
import { ROSTER, USER_ACCOUNTS, SCHEDULE } from "./demoData.js";
import { SideNav, TopBar, MobileNav, RoleSwitcher, getNavForRole, getRole, NAV_BY_ROLE, ProfileModal } from "./NavigationModul.jsx";
import { Dashboard, DashboardAdmin, DashboardAdministration, DashboardFunktionaer, DashboardTrainer, DashboardSpieler, DashboardEltern } from "./DashboardModul.jsx";
import { TeamView, TeamOverview, EventsList } from "./TeamModul.jsx";
import { SlotModal, SpielDetail, TermineModul, SpielplanModul, TableTab } from "./TermineModul.jsx";
import { TrainingsplanModul, PlaetzeView } from "./TrainingsplanModul.jsx";
import { TeamsVerwaltungModul, TeamsAdminView } from "./TeamsVerwaltungModul.jsx";
import MitgliederModul, { MembersView } from "./MitgliederModul.jsx";
import KaderModul from "./KaderModul.jsx";
import { HelferModul, HelpersList } from "./HelferModul.jsx";
import NachrichtenModul from "./NachrichtenModul.jsx";
import { TeamModuleMatrix, PortalverwaltungView } from "./PortalverwaltungModul.jsx";
import { BusesView, MaterialView, LockersView, MediaView, WikiView, DocsView, NewsView, AttendanceCentral, ProfileView, DarkModeRow, DataCheckView, getTeamsFromFunktionen, getTeamsFromGruppen } from "./PlatzhalterModul.jsx";

/* -- SUPABASE wird als Prop von App.jsx übergeben (kein Import hier) -- */

/* -- Farben & Konstanten via ./constants.js -- */

/* ── TEAM-HIERARCHIE (Baumstruktur) ── */
const TEAM_HIERARCHY={
  "Aktivfussball":{
    "Aktive Herren":  ["Aktive Herren"],
    "Aktive Frauen":  ["Aktive Frauen"],
  },
  "Juniorenfussball":{
    "Junioren A":["Junioren A"],
    "Junioren B":["Junioren B"],
    "Junioren C":["Junioren C"],
    "Junioren D":["Junioren D-9","Junioren D-7"],
  },
  "Kinderfussball Junioren":{
    "Junioren E":["Junioren E"],
    "Junioren F":["Junioren F"],
    "Junioren G":["Junioren G"],
  },
  "Juniorinnenfussball":{
    "Juniorinnen B / FF-21":["Juniorinnen FF-21"],
    "Juniorinnen C / FF-17":["Juniorinnen FF-17"],
    "Juniorinnen D / FF-14":["Juniorinnen FF-14 9v9","Juniorinnen FF-14 7v7","Juniorinnen FF-14"],
  },
  "Kinderfussball Juniorinnen":{
    "Juniorinnen E / FF-11":["Juniorinnen FF-11"],
    "Juniorinnen F / FF-9": ["Juniorinnen FF-9"],
    "Juniorinnen G / FF-7": ["Juniorinnen FF-7"],
  },
  "Seniorenfussball":{
    "Senioren 30+":["Senioren 30+"],
    "Senioren 40+":["Senioren 40+"],
    "Senioren 50+":["Senioren 50+"],
    "Senioren 60+":["Senioren 60+"],
  },
};



/* ── PWA THEME SYSTEM ── */

/* ── Globales CSS (wird per useEffect injiziert) ── */
if(typeof window!=="undefined"&&!window.storage){
  window.storage={
    get:async(k)=>{const v=localStorage.getItem(k);return v?{value:v}:null;},
    set:async(k,v)=>{localStorage.setItem(k,v);return{key:k,value:v};},
    delete:async(k)=>{localStorage.removeItem(k);return{key:k,deleted:true};},
    list:async(prefix="")=>{const keys=Object.keys(localStorage).filter(k=>k.startsWith(prefix));return{keys};},
  };
}

/* Icons via ./icons.js */

/* ── Shared navigation target (cross-module) ── */
const NAV_TARGET={tab:null,filter:null,kindTeam:null,openEvId:null,selectedSpiel:null};
const FIELD_VIS = {
  administrator: ["dob","nat","heimatort","ahv","pass","street","plz","city","canton","country","email","tel","pass","parent1","parent2","js","fairgate"],
  administration:["dob","nat","heimatort","ahv","pass","street","plz","city","canton","country","email","tel","parent1","parent2","js","fairgate"],
  funktionaer:   ["dob","pass","street","plz","city","email","tel"],
  trainer:       ["dob","nat","heimatort","pass","street","plz","city","email","tel","parent1","parent2"],
  spieler:       ["dob","pass","street","plz","city","email","tel"],
  eltern:        ["dob","pass","street","plz","city","email","tel"],
};

/* -- DATA -- */
const NR_CACHE={data:Object.fromEntries(ROSTER.map(p=>[p.id,p.rueckennr||""]))};
(async()=>{
  try{
    const res=await window.storage.get("rueckennrn");
    if(res){const d=JSON.parse(res.value);Object.assign(NR_CACHE.data,d);}
  }catch(e){}
})();


function Skel({h=14,w="100%",br=6,mb=0,style={}}){
  return <div style={{height:h,width:w,borderRadius:br,marginBottom:mb,background:"linear-gradient(90deg,var(--border) 25%,var(--surface2) 50%,var(--border) 75%)",backgroundSize:"200% 100%",animation:"cc-shimmer 1.5s infinite",...style}}/>;
}
function SkelCard(){
  return(
    <div className="cc-card" style={{borderRadius:14,padding:"20px 22px",border:"0.5px solid"}}>
      <Skel h={10} w="38%" br={4} mb={14}/>
      <Skel h={30} w="55%" br={6} mb={8}/>
      <Skel h={10} w="72%" br={4}/>
    </div>
  );
}
function SkelList({rows=4}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {Array.from({length:rows},(_,i)=>(
        <div key={i} className="cc-card" style={{borderRadius:12,padding:"14px 18px",border:"0.5px solid",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"var(--border)",animation:"cc-shimmer 1.5s infinite",flexShrink:0}}/>
          <div style={{flex:1}}><Skel h={11} w="60%" br={4} mb={7}/><Skel h={9} w="40%" br={4}/></div>
        </div>
      ))}
    </div>
  );
}

/* Reusable Modal/BottomSheet - desktop: centered modal, mobile: slides up from bottom */
/* ── PERSON PICKER ── */
function PersonPicker({value,onChange,placeholder="Person suchen…",style={}}){
  const [q,setQ]=useState(value||"");
  const [open,setOpen]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{ setQ(value||""); },[value]);
  useEffect(()=>{
    const fn=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);

  const suggestions=q.length>0
    ? MEMBERS.filter(m=>m.name.toLowerCase().includes(q.toLowerCase())).slice(0,8)
    : MEMBERS.filter(m=>m.role==="Trainer"||m.role==="Vorstand").slice(0,8);

  function select(name){ setQ(name); onChange(name); setOpen(false); }

  return(
    <div ref={ref} style={{position:"relative",...style}}>
      <input
        value={q}
        onChange={e=>{ setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={()=>setOpen(true)}
        placeholder={placeholder}
        style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,
          fontSize:13,fontFamily:FONT,background:"var(--surface2)",color:"var(--text)",
          boxSizing:"border-box",outline:"none"}}
      />
      {open&&suggestions.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:200,
          background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)",overflow:"hidden"}}>
          {suggestions.map(m=>(
            <button key={m.id} onMouseDown={()=>select(m.name)} style={{
              width:"100%",padding:"9px 14px",border:"none",background:"none",
              cursor:"pointer",display:"flex",alignItems:"center",gap:12,
              textAlign:"left",fontFamily:FONT
            }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Av name={m.name} size={26} bg="var(--surface2)"/>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{m.name}</div>
                <div style={{fontSize:11,color:"var(--sub)"}}>{m.role}{m.team&&m.team!=="-"?" · "+m.team:""}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getVereinsnameStatic(){
  try{const t=localStorage.getItem("cc-theme");return t?(JSON.parse(t).vereinsname||"ClubCampus"):"ClubCampus";}catch{return "ClubCampus";}
}
/* Hex → rgba() für Hover-Farben */

const ROLES = {
  administrator: {
    label:"Administrator", color:"var(--text)", bg:"#F5F5F5", icon:"settings",
    desc:"Vollzugriff: alle Module, Systemeinstellungen, Benutzerverwaltung",
    level:7
  },
  vorstand: {
    label:"Vorstand", color:"var(--text)", bg:"#F5F5F5", icon:"scale",
    desc:"Strategische Übersicht: alle Teams, Mitglieder lesen, Auswertungen — kein System, kein AHV",
    level:6
  },
  administration: {
    label:"Administration", color:"var(--text)", bg:"#F5F5F5", icon:"briefcase",
    desc:"Vereinsbüro: Stammdaten, Mitglieder, alle Teams, Exporte — kein System",
    level:5
  },
  funktionaer: {
    label:"Funktionär", color:"var(--text)", bg:"#F5F5F5", icon:"heart-handshake",
    desc:"Module + Teams gemäss zugewiesener Gruppe/Funktion",
    level:4
  },
  trainer: {
    label:"Trainer", color:"var(--text)", bg:"#F5F5F5", icon:"ball-football",
    desc:"Eigene Teams: Kader, Trainings, Anwesenheiten",
    level:3
  },
  spieler: {
    label:"Spieler", color:"var(--text)", bg:"#F5F5F5", icon:"target",
    desc:"Eigenes Team lesen: Spielplan, Termine, Helfereinsätze",
    level:2
  },
  eltern: {
    label:"Eltern", color:"var(--text)", bg:"#F5F5F5", icon:"user",
    desc:"Nur eigene Kinder: Termine, Anwesenheit, Abstimmungen",
    level:1
  },
};

/* ── VEREINSFUNKTIONEN (organisatorisch) ───────────────────────
   Was jemand im Verein IST – unabhängig vom Portal-Zugang.
   Gespeichert in mitglieder.funktion
───────────────────────────────────────────────────────────── */
const FUNKTIONEN = [
  "Spieler",
  "Trainer",
  "Assistent/in",
  "Goalietrainer",
  "Vorstand",
  "Kassier",
  "Materialwart",
  "Platzwart",
  "Schiedsrichter",
  "Elternteil",
  "Ehrenmitglied",
  "Passivmitglied",
  "Gönner",
  "Sonstige",
];

/* ── MITGLIEDTYPEN ─────────────────────────────────────────── */
const MITGLIEDTYPEN = [
  "Aktivmitglied",
  "Passivmitglied",
  "Ehrenmitglied",
  "Freimitglied",
  "Gönner",
];

/* -- SAFE ROLES LOOKUP -- */
/* ── Termintyp-Berechtigungen ──────────────────────────
   typ: "vereinsanlass" | "team_event" | "spiel" | "training"
   meineTeams: Array mit Teamnamen des Benutzers
─────────────────────────────────────────────────────── */
function kannTerminLesen(role){ return true; /* alle sehen Termine */ }

function kannTerminAnmelden(role){
  return ["administrator","administration","funktionaer","trainer","spieler","eltern"].includes(role);
}

function kannTerminErstellen(role, typ, team, meineTeams=[]){
  if(role==="administrator"||role==="administration") return true;
  if(role==="funktionaer") return typ==="vereinsanlass";
  if(role==="trainer"){
    if(typ==="team_event") return !team||(meineTeams||[]).includes(team);
    if(typ==="spiel")      return (meineTeams||[]).includes(team); // Treffpunkt etc.
    return false; // Trainer kann keine Vereinsanlässe erstellen
  }
  return false;
}

function kannTerminBearbeiten(role, typ, team, meineTeams=[]){
  return kannTerminErstellen(role, typ, team, meineTeams);
}

function kannTerminAbsagen(role, typ, team, meineTeams=[]){
  return kannTerminErstellen(role, typ, team, meineTeams);
}

function kannHelferEinsatzErstellen(role, typ, team, meineTeams=[]){
  if(role==="administrator"||role==="administration"||role==="funktionaer") return true;
  if(role==="trainer") return typ==="team"&&(meineTeams||[]).includes(team);
  return false;
}

function getTerminTypLabel(typ){
  return {vereinsanlass:"Vereinsanlass",team_event:"Team-Event",spiel:"Spiel",training:"Training"}[typ]||typ||"Termin";
}

/* ── Funktionär: effektive Zugriffstufe berechnen ─────
   Gruppe = Default-Stufe, Funktion = Override (höher gewinnt)
─────────────────────────────────────────────────────── */
const STUFE_RANG={lesen:1,schreiben:2,verwalten:3};

function maxStufe(a, b){
  if(!a) return b; if(!b) return a;
  return STUFE_RANG[a]>STUFE_RANG[b]?a:b;
}

function getEffektiveStufeForFunktionaer(dbFunktionen, modulKey){
  let best=null;
  (dbFunktionen||[]).forEach(f=>{
    /* Gruppen-Default */
    const gs=f.portal_gruppen?.modul_stufen?.[modulKey]||f.gruppe_modul_stufen?.[modulKey];
    if(gs) best=maxStufe(best,gs);
    /* Funktions-Override */
    const fo=f.stufe_override?.[modulKey];
    if(fo) best=maxStufe(best,fo);
  });
  return best; /* null = kein Zugriff */
}

function getModuleForFunktionaer(dbFunktionen){
  const mods=new Set();
  (dbFunktionen||[]).forEach(f=>{
    /* Module aus Gruppe */
    (f.portal_gruppen?.module||f.gruppe_module||[]).forEach(m=>mods.add(m));
    /* module_override überschreibt (Einschränkung) */
    if(f.module_override?.length>0){
      /* nur die override-Module behalten */
    }
  });
  return[...mods];
}

function getNr(id){return NR_CACHE.data[id]||"";}

const TABLES={
  "Cc-Junioren":[
  {rank:1,team:"FC Küsnacht",   sp:12,s:9,u:2,n:1,tore:"34:12",diff:22, pts:29,me:false},
  {rank:2,team:getVereinsnameStatic(), sp:12,s:8,u:2,n:2,tore:"28:14",diff:14, pts:26,me:true},
  {rank:3,team:"SC Männedorf",  sp:12,s:6,u:3,n:3,tore:"24:18",diff:6,  pts:21,me:false}
]};
/* Fallback for routes without team context */
const TABLE=TABLES["Cc-Junioren"]
const ATT_EVENTS=[];
/* Initial Zusagen/Absagen pro Ereignis und Spieler-ID
   status: "zu"|"ab"|"fraglich"|null  */
const ATT_INITIAL=(()=>{
  const init = {};
  return init;
})();
const ATT_LOG=[];

const GANTT=[];

/* -- TRAININGSPLÄTZE -- */
const TRAININGSPLAETZE_DEFAULT = [
  {id:"hauptplatz_a", name:"Hauptplatz A",       active:true,  halfn:["Hüttliseite","Rappiseite"]},
  {id:"nebenplatz_b", name:"Nebenplatz B",        active:true,  halfn:["Bergseite","Seeseite"]},
  {id:"platz_c",      name:"Platz C",             active:true,  halfn:[]},
  {id:"halle",        name:"Turnhalle (Winter)",  active:false, halfn:[]},
  {id:"erlenbach",    name:"Platz Erlenbach",     active:false, halfn:[]},
];
// Runtime array — loaded from localStorage or default
const TRAININGSPLAETZE = TRAININGSPLAETZE_DEFAULT.slice();

const EVENTS=[
  {id:1,date:"10.06.2026",time:"19:00",title:"Elternabend Cc-Junioren",type:"Team-Event",rsvp:true, res:{y:11,n:2,o:5},loc:"Vereinslokal"},
  {id:2,date:"14.06.2026",time:"09:00",title:"Grümpelturnier 2026",   type:"Vereinsanlass",     rsvp:false,loc:"Sportanlage Aabach"},
  {id:3,date:"20.06.2026",time:"18:30",title:"Saisonabschluss C-Jun.",type:"Team-Event",rsvp:true, res:{y:14,n:1,o:3},loc:"Vereinslokal"},
  {id:4,date:"25.06.2026",time:"19:30",title:"Generalversammlung",    type:"Vereinsanlass",     rsvp:true, res:{y:42,n:8,o:15},loc:"Mehrzweckhalle"},
];

const POLLS=[
  {id:1,title:"Treffpunkt Auswärtsspiel Sa 24.05.",options:["Sportanlage 08:30","Bahnhof Meilen 09:00","Direkt am Spielort"],votes:[5,8,2],closed:false,target:"Spieler & Eltern"},
  {id:2,title:"Trainingsort nächste Woche",         options:["Platz A","Platz B","Egal"],                                    votes:[6,3,4],closed:true, target:"Spieler"},
];

const HELPER_GRUPPEN=["Alle","Trainer","Spieler","Eltern","Cc-Junioren Eltern","D-Junioren Eltern","Vorstand","Funktionäre","Administration"];
const HELPER_EVENTS=[
  {
    id:1,name:"Grümpelturnier 2026",date:"Sa 14.06.2026 - So 15.06.2026",loc:"Sportanlage Aabach",color:"var(--sub)",
    einsaetze:[
      {id:101,name:"Aufbau",    date:"Fr 13.06.2026",time:"14:00-18:00",ort:"Sportanlage",gruppen:["Alle"],
       schichten:[{id:1001,label:"Aufbau 14:00-18:00 Uhr",max:5,helfer:["Thomas Müller","Daniel Huber","Laura Imhof","Luca Meier","Tim Keller"]}]},
      {id:102,name:"Grill",     date:"Sa 14.06.2026",time:"10:00-22:00",ort:"Grillstand",gruppen:["Alle"],
       schichten:[
         {id:1002,label:"Grill 10:00-14:00 Uhr",max:3,helfer:["Anna Meier","Beat Keller","Laura Keller"]},
         {id:1003,label:"Grill 14:00-18:00 Uhr",max:3,helfer:["Petra Bauer","Stefan Bauer"]},
         {id:1004,label:"Grill 18:00-22:00 Uhr",max:3,helfer:[]},
       ]},
      {id:103,name:"Getränkeausgabe",date:"Sa 14.06.2026",time:"10:00-22:00",ort:"Bar",gruppen:["Alle"],
       schichten:[
         {id:1005,label:"Bar 10:00-14:00 Uhr",max:4,helfer:["Kurt Wolf","Monika Schmid"]},
         {id:1006,label:"Bar 14:00-18:00 Uhr",max:4,helfer:["Hans Fischer"]},
         {id:1007,label:"Bar 18:00-22:00 Uhr",max:4,helfer:[]},
       ]},
      {id:104,name:"Turnierbüro",date:"Sa 14.06.2026",time:"09:00-18:00",ort:"Sekretariat",gruppen:["Funktionäre","Administration"],
       schichten:[
         {id:1008,label:"Büro 09:00-13:00 Uhr",max:2,helfer:["Sandra Berger"]},
         {id:1009,label:"Büro 13:00-18:00 Uhr",max:2,helfer:[]},
       ]},
      {id:105,name:"Schiedsrichter",date:"Sa 14.06.2026",time:"09:00-18:00",ort:"Spielfelder",gruppen:["Cc-Junioren Eltern","D-Junioren Eltern"],
       schichten:[
         {id:1010,label:"SR 09:00-13:00 Feld 1 Uhr",max:2,helfer:["Peter Müller"]},
         {id:1011,label:"SR 13:00-18:00 Feld 1 Uhr",max:2,helfer:[]},
         {id:1012,label:"SR 09:00-13:00 Feld 2 Uhr",max:2,helfer:[]},
         {id:1013,label:"SR 13:00-18:00 Feld 2 Uhr",max:2,helfer:[]},
       ]},
      {id:106,name:"Abbau",date:"So 15.06.2026",time:"17:00-20:00",ort:"Sportanlage",gruppen:["Alle"],
       schichten:[{id:1014,label:"Abbau 17:00-20:00 Uhr",max:6,helfer:["Thomas Müller","Daniel Huber","Markus Weber","Sandra Zimmermann"]}]},
    ]
  },
  {
    id:2,name:"Generalversammlung 2026",date:"Mi 25.06.2026",loc:"Mehrzweckhalle Herrliberg",color:"var(--sub)",
    einsaetze:[
      {id:201,name:"Empfang",date:"Mi 25.06.2026",time:"18:00-19:00",ort:"Eingang",gruppen:["Vorstand"],
       schichten:[{id:2001,label:"Empfang 18:00-19:00 Uhr",max:2,helfer:["Laura Imhof","Luca Meier"]}]},
      {id:202,name:"Apéro-Service",date:"Mi 25.06.2026",time:"20:30-22:00",ort:"Foyer",gruppen:["Alle"],
       schichten:[{id:2002,label:"Apéro 20:30-22:00 Uhr",max:4,helfer:["Anna Meier","Beat Keller"]}]},
    ]
  },
  {
    id:3,name:"Saisonstart-Apéro 2026",date:"Sa 05.04.2026",loc:"Vereinslokal Herrliberg",color:"var(--sub)",
    einsaetze:[
      {id:301,name:"Apéro-Service",date:"05.04.2026",time:"17:00-19:00",ort:"Vereinslokal",gruppen:["Alle"],
       schichten:[
         {id:3001,label:"Service 17:00-19:00 Uhr",max:4,helfer:["Anna Meier","Kurt Wolf","Monika Schmid"]},
       ]},
    ]
  },
];

const HELPERS=[
  {id:1, name:"Thomas Müller", gruppe:"Trainer",           soll:2,geleistet:1,schichten:[1001,1014]},
  {id:2, name:"Daniel Huber",  gruppe:"Trainer",           soll:2,geleistet:0,schichten:[1001,1014]},
  {id:3, name:"Laura Imhof",   gruppe:"Vorstand",          soll:1,geleistet:0,schichten:[1008]},
  {id:4, name:"Anna Meier",    gruppe:"Cc-Junioren Eltern", soll:2,geleistet:1,schichten:[1002,2002]},
  {id:5, name:"Beat Keller",   gruppe:"Cc-Junioren Eltern", soll:2,geleistet:0,schichten:[1002,2002]},
  {id:6, name:"Petra Bauer",   gruppe:"Cc-Junioren Eltern", soll:2,geleistet:0,schichten:[1003]},
  {id:7, name:"Kurt Wolf",     gruppe:"Cc-Junioren Eltern", soll:2,geleistet:1,schichten:[1005]},
  {id:8, name:"Monika Schmid", gruppe:"Cc-Junioren Eltern", soll:2,geleistet:2,schichten:[1005]},
  {id:9, name:"Hans Fischer",  gruppe:"D-Junioren Eltern", soll:2,geleistet:0,schichten:[1006]},
  {id:10,name:"Peter Müller",  gruppe:"D-Junioren Eltern", soll:2,geleistet:0,schichten:[1010]},
  {id:11,name:"Sandra Berger", gruppe:"Administration",    soll:1,geleistet:0,schichten:[1008]},
  {id:12,name:"Noah Beispiel",    gruppe:"Cc-Junioren Eltern", soll:3,geleistet:2,schichten:[]},
  {id:13,name:"Luca Test",        gruppe:"Trainer",            soll:0,geleistet:0,schichten:[]},
  /* Test-Accounts */
  {id:14,name:"Luca Meier",       gruppe:"Cc-Junioren",        soll:2,geleistet:1,schichten:[1001,2001]},
  {id:15,name:"Tim Keller",       gruppe:"1. Mannschaft Herren",soll:2,geleistet:0,schichten:[1001]},
  {id:16,name:"Laura Keller",     gruppe:"1. Mannschaft Frauen",soll:2,geleistet:0,schichten:[1002]},
  {id:17,name:"Stefan Bauer",     gruppe:"Trainer",            soll:2,geleistet:0,schichten:[1003]},
  {id:18,name:"Markus Weber",     gruppe:"Trainer",            soll:2,geleistet:0,schichten:[1014]},
  {id:19,name:"Sandra Zimmermann",gruppe:"Trainer",            soll:2,geleistet:0,schichten:[1014]},
  {id:20,name:"Marianne Keller",  gruppe:"1. Mannschaft Herren",soll:2,geleistet:1,schichten:[1002]},
  {id:21,name:"Petra Weber",      gruppe:"Ca-Junioren Eltern", soll:2,geleistet:0,schichten:[1003]},
  {id:22,name:"Claudia Brunner",  gruppe:"Da-Junioren Eltern", soll:2,geleistet:0,schichten:[1005]},
];

const BUSES=[
  {id:1,name:"Bus A (9-Plätzer)",reservations:[
    {date:"Sa 24.05.",time:"09:00-14:00",by:"Thomas Müller",team:"Cc-Junioren",purpose:"Auswärtsspiel FC Küsnacht"},
    {date:"Mi 28.05.",time:"16:30-19:30",by:"Daniel Huber", team:"D-Junioren",purpose:"Auswärtsspiel SC Männedorf"},
  ]},
  {id:2,name:"Bus B (15-Plätzer)",reservations:[
    {date:"Sa 07.06.",time:"08:00-14:00",by:"Sabine Koch",team:"A-Junioren",purpose:"Turnierfahrt Rapperswil"},
  ]},
];

const MATERIAL=[
  {id:1,team:"Cc-Junioren",type:"Bestellung", item:"Neue Bälle (Grösse 4)",     by:"Thomas Müller",date:"20.05.2026",status:"In Bearbeitung"},
  {id:2,team:"D-Junioren",type:"Defekt",     item:"Kaputte Torpumpe",           by:"Daniel Huber", date:"18.05.2026",status:"Erledigt"},
  {id:3,team:"Cc-Junioren",type:"Tenüs",      item:"Tenüs Grösse 140 (3×)",     by:"Thomas Müller",date:"15.05.2026",status:"Offen"},
  {id:4,team:"A-Junioren",type:"Mangel",     item:"Zu wenig Leibchen",          by:"Marco Senn",   date:"12.05.2026",status:"Offen"},
];

const LOCKERS=[
  {name:"Garderobe 1",assignments:[
    {team:"Cc-Junioren",start:16,end:18,day:"Sa",type:"Heim",color:R},
    {team:"A-Junioren",start:17,end:19.5,day:"Mi",type:"Heim",color:GN},
  ]},
  {name:"Garderobe 2",assignments:[
    {team:"FC Küsnacht",start:16,end:18,day:"Sa",type:"Gast",color:"var(--sub)"},
  ]},
  {name:"Garderobe 3",assignments:[
    {team:"Aktive 1",start:19,end:21,day:"Do",type:"Heim",color:"#7C3AED"},
  ]},
];

const MEDIA=[
  {id:1,title:"Matchbericht - Sieg vs. FC Thalwil 2:1",cat:"Matchbericht",  team:"Cc-Junioren",date:"18.05.2026",area:["Webseite","Instagram"],status:"Eingereicht",  author:"Thomas Müller"},
  {id:2,title:"Fotos Trainingscamp",                    cat:"Foto",          team:"A-Junioren",date:"05.05.2026",area:["Webseite"],            status:"Freigegeben",  author:"Laura Imhof"},
  {id:3,title:"Vereinsfest Erfolgsmeldung",             cat:"Vereinsanlass", team:"Verein",    date:"01.05.2026",area:["Webseite","Newsletter"],status:"Veröffentlicht",author:getVereinsnameStatic()},
];

const MEMBERS=[
  {id:1,name:"Thomas Müller",role:"Trainer",team:"Cc-Junioren",type:"Aktivmitglied",ort:"Herrliberg",status:"Vollständig"},
  {id:2,name:"Daniel Huber", role:"Trainer",team:"D-Junioren",type:"Aktivmitglied",ort:"Meilen",    status:"Vollständig"},
  {id:3,name:"Laura Imhof",  role:"Vorstand",team:"-",         type:"Aktivmitglied",ort:"Herrliberg",status:"Vollständig"},
  {id:4,name:"Anna Meier",   role:"Eltern",  team:"Cc-Junioren",type:"Passivmitglied",ort:"Herrliberg",status:"Prüfung fällig"},
  {id:5,name:"Beat Keller",  role:"Eltern",  team:"Cc-Junioren",type:"Passivmitglied",ort:"Meilen",   status:"Vollständig"},
  {id:6,name:"Marco Senn",   role:"Materialwart",team:"-",     type:"Funktionär",   ort:"Herrliberg",status:"Vollständig"},
  {id:7,name:"Sabine Koch",  role:"Trainer", team:"A-Junioren",type:"Aktivmitglied",ort:"Küsnacht",  status:"Sync-Fehler"},
];

const WIKI=[
  {title:"Trainerhandbuch - Einführung",     cat:"Trainer",       updated:"01.01.2026"},
  {title:"Nutzungsregeln Vereinsbusse",      cat:"Vereinsbus",    updated:"15.03.2026"},
  {title:"Garderobenprozesse am Spieltag",   cat:"Spieltag",      updated:"01.02.2026"},
  {title:"J+S-Informationen für Trainer",    cat:"J+S",           updated:"01.09.2024"},
  {title:"Helfereinsätze - Ablauf & Regeln", cat:"Helfereinsatz", updated:"10.04.2026"},
  {title:"Kommunikationsregeln im Verein",   cat:"Kommunikation", updated:"01.01.2026"},
];

const NEWS=[
  {id:1,title:"Einladung Elternabend Cc-Junioren",date:"20.05.2026",author:"Thomas Müller",target:"Cc-Junioren",channel:"Portal-Nachricht",content:"Wir laden alle Eltern herzlich zum Elternabend am 10. Juni 2026 ein. Rückmeldung bis 05. Juni."},
  {id:2,title:"Grümpelturnier - Helfer gesucht!", date:"18.05.2026",author:getVereinsnameStatic(), target:"Alle",      channel:"E-Mail + Portal", content:"Am 14./15. Juni findet unser Grümpelturnier statt. Bitte über das Helfermodul anmelden."},
  {id:3,title:"Neue Tenüs für Juniorenteams",    date:"15.05.2026",author:"Administration",target:"Junioren",  channel:"Portal-Nachricht",content:"Die neuen Tenüs sind eingetroffen. Abholen ab Dienstag, alte Tenüs mitbringen."},

  {id:5,title:"Vorbereitung Derby vs. FC Küsnacht",date:"02.05.2026",author:"Marco Weber",target:"1. Mannschaft Herren",channel:"Portal-Nachricht",content:"Dieses Wochenende empfangen wir den FC Küsnacht zum Saisonderby. Aufstellung und Treffpunkt wie gewohnt, bitte pünktlich erscheinen."},
  {id:6,title:"Saisonauftakt gelingt: 3:0 gegen FC Uster",date:"05.05.2026",author:"Marco Weber",target:"1. Mannschaft Herren",channel:"Portal-Nachricht",content:"Ein starker Start in die neue Saison! Mit einem überzeugenden 3:0 gegen FC Uster zeigten wir von Beginn weg gute Leistungen. Weiter so!"},
  {id:7,title:"Neuer Trainer ab Sommer 2026",date:"10.05.2026",author:getVereinsnameStatic(),target:"Alle",channel:"Portal-Nachricht",content:"Wir freuen uns, bekannt zu geben, dass Marco Weber ab Sommer 2026 die 2. Mannschaft übernimmt. Herzlich willkommen!"},
  {id:8,title:"Trainingsabend mit Videoanalyse",date:"14.05.2026",author:"Daniel Huber",target:"2. Mannschaft Herren",channel:"Portal-Nachricht",content:"Am kommenden Mittwoch analysieren wir die letzten beiden Spiele per Video. Bitte alle pünktlich um 18:45 in der Kabine."},
  {id:9,title:"Einladung Saisonabschlussessen",date:"16.05.2026",author:"Sabine Koch",target:"1. Mannschaft Frauen",channel:"Portal-Nachricht",content:"Das Saisonabschlussessen findet am 28. Juni im Vereinslokal statt. Bitte bis 15. Juni anmelden."},
  {id:10,title:"Zwei Neuzugänge bei den Frauen",date:"08.05.2026",author:getVereinsnameStatic(),target:"Alle",channel:"Portal-Nachricht",content:"Wir heissen Lara Zimmermann und Mia Brunner herzlich willkommen im Team der 1. Mannschaft Frauen!"},
  {id:11,title:"Talentförderung: Auswahl Kantonalverband",date:"19.05.2026",author:"Lukas Frei",target:"Ba-Junioren",channel:"Portal-Nachricht",content:"Herzliche Gratulation an Nico Moser und Tim Gerber, die in das Kantonalverbands-Sichtungstraining eingeladen wurden!"},
  {id:12,title:"Trainingslager Juni - Anmeldung offen",date:"12.05.2026",author:"Lukas Frei",target:"Ba-Junioren",channel:"Portal-Nachricht",content:"Das Trainingslager findet vom 20.-22. Juni statt. Anmeldung bis 01. Juni über das Portal. Kosten: CHF 80.-"},
  {id:13,title:"Sieg im Lokalderby gegen SC Männedorf",date:"11.05.2026",author:"Patrick Schmid",target:"Bb-Junioren",channel:"Portal-Nachricht",content:"Mit einem knappen aber verdienten 2:1 im Derby konnten wir drei wichtige Punkte holen. Grosses Lob ans gesamte Team!"},
  {id:14,title:"Elternabend - Thema Spielphilosophie",date:"17.05.2026",author:"Andrea Bauer",target:"Ca-Junioren",channel:"Portal-Nachricht",content:"Einladung zum Elternabend am 5. Juni um 19:30 Uhr im Vereinslokal. Hauptthema: Spielphilosophie und Entwicklungsziele."},
  {id:15,title:"Neue Trainingsbälle eingetroffen",date:"13.05.2026",author:"Administration",target:"Alle",channel:"Portal-Nachricht",content:"Die bestellten Trainingsbälle sind eingetroffen. Bitte beim ersten Training abholen und die alten mitbringen."},
  {id:16,title:"Turniereinladung Hombrechtikon Cup",date:"09.05.2026",author:"Stefan Keller",target:"Db-Junioren",channel:"Portal-Nachricht",content:"Wir haben eine Einladung zum Hombrechtikon Cup erhalten. Teilnahme am 21. Juni. Anmeldung bis 26. Mai nötig."},
  {id:17,title:"Erste Mannschaftsfotos geschossen",date:"20.05.2026",author:"Sabine Koch",target:"C-Juniorinnen",channel:"Portal-Nachricht",content:"Am letzten Samstag wurden die offiziellen Mannschaftsfotos aufgenommen. Bilder folgen in den nächsten Tagen im Medienbereich."},
  {id:18,title:"Freude am Fussball - Bericht Saison",date:"21.05.2026",author:"Marco Weber",target:"F-Juniorinnen",channel:"Portal-Nachricht",content:"Was für eine tolle Saison mit unseren Kleinsten! 12 begeisterte Spielerinnen, viele neue Freundschaften und jede Menge Spass."},
];

const PSTATS=[
  {name:"Luca Meier",  sp:11,tore:7,assists:3,gelb:1,rot:0},
  {name:"Noah Keller", sp:12,tore:4,assists:6,gelb:2,rot:0},
  {name:"Finn Bauer",  sp:10,tore:6,assists:2,gelb:0,rot:0},
  {name:"Elias Wolf",  sp:12,tore:0,assists:0,gelb:0,rot:0},
  {name:"Jan Schmid",  sp:11,tore:2,assists:4,gelb:0,rot:0},
  {name:"Leon Fischer",sp:8, tore:1,assists:1,gelb:3,rot:1},
];

/* ==========================================
   KLEINE HILFKOMPONENTEN
========================================== */
/* ==========================================
   ROLLEN-SWITCHER MODAL
========================================== */
/* ==========================================
   LAYOUT
========================================== */
/* ==========================================
   MEIN TEAM (rollenabhängig)
========================================== */
function MitgliedDetail({person,role,onClose,nr,onUpdateNr}){
  const isMobile=useIsMobile();
  const vis=FIELD_VIS[role]||[];
  const can=(field)=>vis.includes(field);
  const canEdit=["trainer","administrator","administration"].includes(role);
  const [editingNr,setEditingNr]=useState(false);
  const [nrVal,setNrVal]=useState(nr||"");

  const Row=({label,value,mono,blue})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 14px",borderBottom:"0.5px solid var(--border)",gap:12}}>
      <span style={{fontSize:13,color:"var(--sub)",flexShrink:0,minWidth:120}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:blue?BL:mono?"#666":BK,textAlign:"right",wordBreak:"break-word",fontFamily:mono?"monospace":"inherit"}}>{value||"-"}</span>
    </div>
  );

  const NrRow=()=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderBottom:"0.5px solid var(--border)",gap:12}}>
      <span style={{fontSize:13,color:"var(--sub)",flexShrink:0,minWidth:120}}>{"Rückennummer"}</span>
      {canEdit&&editingNr?(
        <input autoFocus type="number" min="1" max="99" value={nrVal}
          onChange={e=>setNrVal(e.target.value)}
          onBlur={()=>{setEditingNr(false);if(onUpdateNr)onUpdateNr(nrVal);}}
          onKeyDown={e=>{if(e.key==="Enter"){setEditingNr(false);if(onUpdateNr)onUpdateNr(nrVal);}}}
          style={{width:60,padding:"3px 7px",border:`1.5px solid ${R}`,borderRadius:6,fontSize:13,fontWeight:700,textAlign:"right",color:R,outline:"none"}}
        />
      ):(
        <div onClick={canEdit?()=>setEditingNr(true):undefined}
          style={{display:"flex",alignItems:"center",gap:8,cursor:canEdit?"pointer":"default"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{nrVal||"-"}</span>
          {canEdit&&<span style={{fontSize:13,color:"var(--sub)"}}><TI n="edit"/></span>}
        </div>
      )}
    </div>
  );

  return(
    <div onClick={onClose} style={isMobile?{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"rgba(0,0,0,0.5)"}:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={isMobile?{position:"relative",background:"var(--surface)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,0.18)"}:{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>

        {/* Header */}
        <div style={{background:R,borderRadius:"16px 16px 0 0",padding:"20px 22px",display:"flex",alignItems:"center",gap:16,position:"sticky",top:0,zIndex:1}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,flexShrink:0}}>
            {(person.firstName[0]||"")+(person.lastName[0]||"")}
          </div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontWeight:800,fontSize:18,lineHeight:1.2}}>{person.firstName} {person.lastName}</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:13,marginTop:4,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <Chip text={person.pos||"-"} color="#fff" bg="rgba(255,255,255,0.25)"/>
              {(person.teams||["Cc-Junioren"]).map((t,i)=>(
                <span key={i} style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>{i>0&&<span style={{opacity:0.5,margin:"0 3px"}}>·</span>}{t}</span>
              ))}
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>Saison 2024/25</span>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",color:"#fff",fontSize:21,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>×</button>
        </div>

        <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>

          {/* PERSONALIEN */}
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Personalien</div>
            <div style={{background:"var(--surface2)",borderRadius:10,overflow:"hidden"}}>
              <Row label="Name"          value={person.lastName}/>
              <Row label="Vorname"       value={person.firstName}/>
              <Row label="Team(s)"       value={(person.teams||["Cc-Junioren"]).join(" · ")}/>
              {can("dob")      &&<Row label="Geburtsdatum"      value={person.dob}/>}
              {can("nat")      &&<Row label="Nationalität"       value={person.nat}/>}
              {can("heimatort")&&<Row label="Heimatort / Geburtsort" value={person.heimatort}/>}
              {can("ahv")      &&<Row label="AHV-Nummer"        value="••••••••••" mono/>}
              {can("pass")     &&<Row label="Spielerpass"        value={person.pass}/>}
              {can("js")       &&<Row label="J+S Nummer"         value={person.js}/>}
              {can("fairgate") &&<Row label="Fairgate-ID"        value={person.fairgate} mono/>}
            </div>
          </div>

          {/* ADRESSE */}
          {(can("street")||can("plz")||can("city")||can("canton")||can("country"))&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Adresse</div>
              <div style={{background:"var(--surface2)",borderRadius:10,overflow:"hidden"}}>
                {can("street") &&<Row label="Strasse"  value={person.street}/>}
                {can("plz")    &&<Row label="PLZ"      value={person.plz}/>}
                {can("city")   &&<Row label="Ort"      value={person.city}/>}
                {can("canton") &&<Row label="Kanton"   value={person.canton}/>}
                {can("country")&&<Row label="Land"     value={person.country}/>}
              </div>
            </div>
          )}

          {/* KOMMUNIKATION PERSÖNLICH */}
          {(can("email")||can("tel"))&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Kommunikation Persönlich</div>
              <div style={{background:"var(--surface2)",borderRadius:10,overflow:"hidden"}}>
                {can("email")&&<Row label="E-Mail"  value={person.email} blue/>}
                {can("tel")  &&<Row label="Telefon" value={person.tel}/>}
              </div>
            </div>
          )}

          {/* ERZIEHUNGSBERECHTIGTE PERSON 1 */}
          {can("parent1")&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Erziehungsberechtigte Person 1</div>
              <div style={{background:"var(--surface2)",borderRadius:10,overflow:"hidden"}}>
                <Row label="Name"    value={person.p1Last}/>
                <Row label="Vorname" value={person.p1First}/>
                <Row label="E-Mail"  value={person.p1Email} blue/>
                <Row label="Telefon" value={person.p1Tel}/>
              </div>
            </div>
          )}

          {/* ERZIEHUNGSBERECHTIGTE PERSON 2 */}
          {can("parent2")&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Erziehungsberechtigte Person 2</div>
              <div style={{background:"var(--surface2)",borderRadius:10,overflow:"hidden"}}>
                <Row label="Name"    value={person.p2Last}/>
                <Row label="Vorname" value={person.p2First}/>
                <Row label="E-Mail"  value={person.p2Email} blue/>
                <Row label="Telefon" value={person.p2Tel}/>
              </div>
            </div>
          )}

          {/* Rollenhinweis */}
          <div style={{padding:"8px 12px",background:"var(--surface)",borderRadius:8,fontSize:13,color:"var(--sub)",display:"flex",alignItems:"center",gap:8}}>
            <span><TI n="eye"/></span>
            <span>Feldsichtbarkeit gemäss Rolle: <strong>{getRole(role).label}</strong></span>
          </div>
        </div>
      </div>
      </div>
  );
}

/* -- Kaderliste mit Feldsichtbarkeit -- */
function RosterTab({role,team,initialSelected=null,teamRosterData=null}){
  const isMobile=useIsMobile();
  const vis=FIELD_VIS[role]||[];
  const [search,setSearch]=useState("");
  /* teamRosterData aus DB wenn vorhanden, sonst ROSTER Fallback */
  const baseRoster=teamRosterData||(team?ROSTER.filter(p=>(p.teams||[]).includes(team)):ROSTER);
  const initPlayer=typeof initialSelected==="number"?baseRoster.find(p=>p.id===initialSelected)||null:initialSelected;
  const [selected,setSelected]=useState(initPlayer);
  const [positions,setPositions]=useState(()=>Object.fromEntries(baseRoster.map(p=>[p.id,p.pos])));
  const [rueckennrn,setRueckennrn]=useState(()=>Object.fromEntries(baseRoster.map(p=>[p.id,p.rueckennr||""])));
  const [editingPos,setEditingPos]=useState(null);
  const [editingNr,setEditingNr]=useState(null);

  /* Load persisted numbers on mount */
  const [nrLoaded,setNrLoaded]=useState(false);
  if(!nrLoaded){
    setNrLoaded(true);
    (async()=>{
      try{
        const res=await window.storage.get("rueckennrn");
        if(res){
          const d=JSON.parse(res.value);
          Object.assign(NR_CACHE.data,d);
          setRueckennrn(prev=>({...prev,...d}));
        }
      }catch(e){}
    })();
  }

  const saveNr=(newNrn)=>{
    setRueckennrn(newNrn);
    Object.assign(NR_CACHE.data,newNrn);
    window.storage.set("rueckennrn",JSON.stringify(newNrn)).catch(()=>{});
  };
  const canEditPos=role==="trainer"||role==="administrator"||role==="administration";
  const POSITION_GROUPS=[
    {label:"Torwart",     options:["TW"]},
    {label:"Verteidiger", options:["V","IV","RV","LV"]},
    {label:"Mittelfeld",  options:["MF","DM","ZM","LM","RM"]},
    {label:"Sturm",       options:["ST"]},
  ];
  /* Filter by search */
  const teamRoster=baseRoster;
  const filtered=teamRoster.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));

  /* Sorting */
  const [sortKey,setSortKey]=useState("name");
  const [sortDir,setSortDir]=useState(1); /* 1=asc, -1=desc */
  const [groupByFunktion,setGroupByFunktion]=useState(true);
  const [showExport,setShowExport]=useState(false);
  const EXPORT_ROLES=["trainer","funktionaer","vorstand","administration","administrator"];
  const canExport=EXPORT_ROLES.includes(role);
  const [exportFields,setExportFields]=useState(["name","role","pos","nr"]);

  const handleSort=(key)=>{
    if(sortKey===key) setSortDir(d=>d*-1);
    else{setSortKey(key);setSortDir(1);}
  };

  const f=[...filtered].sort((a,b)=>{
    let va,vb;
    if(sortKey==="name"){
      va=String((a.lastName||"")+(a.firstName||"")||a.name||"");
      vb=String((b.lastName||"")+(b.firstName||"")||b.name||"");
      return String(va||'').localeCompare(String(vb||''))*sortDir;
    }
    if(sortKey==="pos"){
      va=positions[a.id]||""; vb=positions[b.id]||"";
      return String(va||'').localeCompare(String(vb||''))*sortDir;
    }
    if(sortKey==="nr"){
      va=rueckennrn[a.id]?parseInt(rueckennrn[a.id]):9999;
      vb=rueckennrn[b.id]?parseInt(rueckennrn[b.id]):9999;
      return (va-vb)*sortDir;
    }
    return 0;
  });

  /* Gruppierung nach Funktion */
  const FUNKTION_ORDER=["Trainer/in","Co-Trainer/in","Assistent/in","Goalietrainer/in","Masseur/in","Admin","TW","V","IV","RV","LV","DM","ZM","MF","LM","RM","ST"];
  const normFunktion=(s)=>{
    if(!s) return "-";
    const l=s.toLowerCase();
    if(l.includes("goalietrain")||l.includes("goalitrain")) return "Goalietrainer/in";
    if(l.includes("co-train")||l.includes("co train")||l.includes("cotrainer")) return "Co-Trainer/in";
    if(l.includes("assistent")||l.includes("assistenz")) return "Assistent/in";
    if(l.includes("masseur")||l.includes("physiother")) return "Masseur/in";
    if(l.includes("admin")||l.includes("sekretär")||l.includes("aktuarin")) return "Admin";
    if(l.includes("train")) return "Trainer/in";
    return s;
  };
  const getFunktionLabel=(p)=>normFunktion(p.role||positions[p.id])||"-";
  const grouped=groupByFunktion
    ?Object.entries(f.reduce((acc,p)=>{
        const key=getFunktionLabel(p)||"Spieler";
        if(!acc[key]) acc[key]=[];
        acc[key].push(p);
        return acc;
      },{}))
      .sort(([a],[b])=>{
        const ia=FUNKTION_ORDER.indexOf(a); const ib=FUNKTION_ORDER.indexOf(b);
        if(ia>=0&&ib>=0) return ia-ib;
        if(ia>=0) return -1; if(ib>=0) return 1;
        return String(a||"").localeCompare(String(b||""));
      })
      .map(([key,items])=>({key,items}))
    :[{key:null,items:f}];

  const SortIcon=({col})=>{
    if(sortKey!==col) return <span style={{color:"var(--sub)",fontSize:13,marginLeft:3}}>{"↕"}</span>;
    return <span style={{color:R,fontSize:13,marginLeft:3}}>{sortDir===1?<TI n="upload"/>:"↓"}</span>;
  };

  const COL_DEF_ALL=[
    {key:"name",    label:"Name / Vorname", always:true},
    {key:"role",    label:"Funktion",       always:true},
    {key:"pos",     label:"Position",       always:true},
    {key:"nr",      label:"Nr.",            always:true},
    {key:"dob",     label:"Geburtsdatum",   field:"dob"},
    {key:"email",   label:"E-Mail",         field:"email"},
    {key:"tel",     label:"Telefon",        field:"tel"},
    {key:"pass",    label:"Spielerpass",    field:"pass"},
    {key:"js",      label:"J+S Nr.",        field:"js"},
    {key:"ahv",     label:"AHV-Nummer",     field:"ahv"},
    {key:"fairgate",label:"Fairgate-ID",    field:"fairgate"},
  ];
  const SIMPLE_ROLES=["trainer","spieler","eltern"];
  const isSimpleView=SIMPLE_ROLES.includes(role);
  const COL_DEF=isSimpleView
    ?COL_DEF_ALL.filter(c=>["name","role","pos","nr"].includes(c.key))
    :COL_DEF_ALL;
  const cols=COL_DEF.filter(c=>c.always||vis.includes(c.field));

  return(
    <div>
      {selected&&<MitgliedDetail person={selected} role={role} onClose={()=>setSelected(null)} nr={rueckennrn[selected.id]} onUpdateNr={v=>saveNr({...rueckennrn,[selected.id]:v})}/>}
      {/* Export Modal */}
      {showExport&&(
        <div onClick={()=>setShowExport(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:16,padding:24,width:340,maxWidth:"90vw",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Kaderliste exportieren</div>
            <div style={{fontSize:13,color:"var(--sub)",marginBottom:16}}>Felder auswählen die exportiert werden sollen</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {COL_DEF_ALL.map(c=>(
                <label key={c.key} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 10px",borderRadius:8,background:"var(--surface2)",cursor:"pointer"}}>
                  <input type="checkbox" checked={exportFields.includes(c.key)}
                    onChange={e=>setExportFields(prev=>e.target.checked?[...prev,c.key]:prev.filter(k=>k!==c.key))}
                    style={{width:16,height:16,accentColor:BK,cursor:"pointer"}}/>
                  <span style={{fontSize:13,color:"var(--text)"}}>{c.label}</span>
                </label>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{
                const fields=COL_DEF_ALL.filter(c=>exportFields.includes(c.key));
                const header=fields.map(c=>c.label).join(";");
                const rows=f.map(p=>{
                  return fields.map(c=>{
                    if(c.key==="name") return `${p.lastName||""} ${p.firstName||""}`.trim()||p.name||"";
                    if(c.key==="role") return p.role||"Spieler/in";
                    if(c.key==="pos") return positions[p.id]||"";
                    if(c.key==="nr") return rueckennrn[p.id]||"";
                    return p[c.field]||p[c.key]||"";
                  }).join(";");
                }).join("\n");
                const csv=`${header}\n${rows}`;
                const a=document.createElement("a");
                a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
                a.download=`Kader_${team||"Export"}_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                setShowExport(false);
              }} style={{flex:1,padding:"12px 20px",borderRadius:10,border:"none",background:BTN,color:BTN_TXT,transition:"background 0.15s",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>
                CSV herunterladen
              </button>
              <button onClick={()=>setShowExport(false)} style={{padding:"9px 16px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",fontSize:13,cursor:"pointer",fontFamily:FONT,color:"var(--sub)"}}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Spieler suchen…" style={{padding:"7px 12px",border:"0.5px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",width:200}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {canExport&&(
              <button onClick={()=>setShowExport(true)} style={{
                display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:8,
                border:"1px solid var(--border)",background:"transparent",
                color:"var(--sub)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT
              }}>
                <TI n="file-download" size={15} style={{color:GN}}/>Export
              </button>
            )}
          <button onClick={()=>setGroupByFunktion(g=>!g)} style={{
            display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:8,
            border:`1px solid ${groupByFunktion?BK:"var(--border)"}`,
            background:groupByFunktion?BK+"15":"transparent",
            color:groupByFunktion?BK:"var(--sub)",fontSize:13,fontWeight:600,
            cursor:"pointer",fontFamily:FONT
          }}>
            <TI n="layout-list" size={13}/>Gruppieren
          </button>
          <InfoBox text={`${f.length} Mitglieder`} color={BL}/>
        </div>
      </div>
      {isMobile?(
        <Card style={{padding:0}}>
          {groupByFunktion
            ? grouped.flatMap(({key,items})=>[
                key&&<div key={`grp-${key}`} style={{
                  padding:"8px 16px 5px",
                  fontSize:11,fontWeight:700,color:"var(--sub)",
                  textTransform:"uppercase",letterSpacing:0.6,
                  background:"var(--surface2)",
                  borderTop:"0.5px solid var(--border)"
                }}>{key} <span style={{fontWeight:400,opacity:0.6}}>({items.length})</span></div>,
                ...items.map((p,i)=>(
                  <div key={p.id} onClick={()=>setSelected(p)}
                    style={{display:"flex",alignItems:"center",gap:16,padding:"14px 16px",borderTop:`0.5px solid ${GB}`,cursor:"pointer",background:"var(--surface)"}}
                    className="hov-row">
                    <Av name={p.name} size={32} bg={ACCENT20}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{p.lastName} {p.firstName}</div>
                      <div style={{fontSize:13,color:"var(--sub)",marginTop:3,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                        {positions[p.id]&&<span style={{background:"var(--surface2)",color:"var(--sub)",padding:"2px 8px",borderRadius:20}}>{positions[p.id]}</span>}
                        {rueckennrn[p.id]&&<span style={{color:"var(--sub)"}}>Nr. {rueckennrn[p.id]}</span>}
                      </div>
                    </div>
                    <span style={{color:"var(--sub)",fontSize:18}}>›</span>
                  </div>
                ))
              ]).filter(Boolean)
            : filtered.map((p,i)=>(
                <div key={p.id} onClick={()=>setSelected(p)}
                  style={{display:"flex",alignItems:"center",gap:16,padding:"16px",borderTop:i>0?`0.5px solid ${GB}`:"none",cursor:"pointer",background:"var(--surface)"}}
                  className="hov-row">
                  <Av name={p.name} size={32} bg={ACCENT20}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>{p.lastName} {p.firstName}</div>
                    <div style={{fontSize:13,color:"var(--sub)",marginTop:3,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {positions[p.id]&&<span style={{background:"var(--surface2)",color:"var(--sub)",padding:"2px 9px",borderRadius:20}}>{positions[p.id]}</span>}
                      {rueckennrn[p.id]&&<span style={{color:"var(--sub)"}}>Nr. {rueckennrn[p.id]}</span>}
                      {p.role&&<span style={{background:"#7C3AED18",color:"#7C3AED",padding:"2px 9px",borderRadius:20}}>{p.role}</span>}
                    </div>
                  </div>
                  <span style={{color:"var(--sub)",fontSize:18}}>›</span>
                </div>
              ))
          }
        </Card>
      ):(
      <Card style={{padding:0,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
          <thead>
            <tr style={{background:"var(--surface2)"}}>
              {cols.map((c,i)=>{
                const sortable=["name","pos","nr"].includes(c.key);
                return(
                  <th key={i}
                    onClick={sortable?()=>handleSort(c.key):undefined}
                    style={{padding:"9px 13px",textAlign:"left",fontWeight:sortable&&sortKey===c.key?800:600,color:"var(--sub)",fontSize:13,textTransform:"uppercase",letterSpacing:0.4,whiteSpace:"nowrap",cursor:sortable?"pointer":"default",userSelect:"none"}}>
                    {c.label}{sortable&&<SortIcon col={c.key}/>}
                  </th>
                );
              })}
              <th style={{padding:"9px 13px",width:32}}/>
            </tr>
          </thead>
          <tbody>
            {(()=>{
              const spieler=f.filter(p=>!p.role);
              const trainer=f.filter(p=>p.role);
              const renderRow=(p,i,bg)=>(
              <tr
                key={p.id}
                onClick={()=>setSelected(p)}
                className="hov-row"
                style={{borderTop:"0.5px solid var(--border)",background:bg,cursor:"pointer"}}>
                {cols.map((c,j)=>{
                  if(c.key==="role") return(
                    <td key={j} style={{padding:"9px 13px"}}>
                      {p.role
                        ?<span style={{fontSize:11,background:"#7C3AED18",color:"#7C3AED",fontWeight:700,padding:"2px 7px",borderRadius:8,whiteSpace:"nowrap"}}>{p.role}</span>
                        :<span style={{fontSize:13,color:"var(--sub)"}}>Spieler/in</span>
                      }
                    </td>
                  );
                  if(c.key==="nr") return(
                    <td key={j} style={{padding:"9px 10px",width:44,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
                      {canEditPos&&editingNr===p.id?(
                        <input
                          autoFocus
                          type="number"
                          min="1" max="99"
                          value={rueckennrn[p.id]}
                          onChange={e=>saveNr({...rueckennrn,[p.id]:e.target.value})}
                          onBlur={()=>setEditingNr(null)}
                          onKeyDown={e=>{if(e.key==="Enter")setEditingNr(null);}}
                          style={{width:38,padding:"3px 5px",border:`1.5px solid ${R}`,borderRadius:6,fontSize:13,fontWeight:700,textAlign:"center",color:R,outline:"none"}}
                        />
                      ):(
                        <div onClick={canEditPos?()=>setEditingNr(p.id):undefined}
                          title={canEditPos?"Rückennr. bearbeiten":undefined}
                          style={{cursor:canEditPos?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                          {rueckennrn[p.id]
                            ?<span style={{fontSize:13,fontWeight:600,color:"var(--sub)"}}>{rueckennrn[p.id]}</span>
                            :<span style={{fontSize:13,color:"var(--sub)"}}>-</span>
                          }
                          {canEditPos&&<span style={{fontSize:13,color:"var(--sub)"}}><TI n="edit"/></span>}
                        </div>
                      )}
                    </td>
                  );
                  if(c.key==="name") return(
                    <td key={j} style={{padding:"9px 13px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Av name={p.name} size={26} bg={ACCENT20}/>
                        <div>
                          <div style={{fontWeight:600,whiteSpace:"nowrap",color:"var(--sub)"}}>{p.lastName} {p.firstName}</div>
                          {p.role&&<span style={{fontSize:13,background:"#7C3AED18",color:"#7C3AED",fontWeight:700,padding:"1px 5px",borderRadius:8}}>{p.role}</span>}
                          {!p.role&&p.teams&&p.teams.length>1&&(
                            <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                              {p.teams.map((t,i)=><span key={i} style={{fontSize:13,background:i===0?R+"15":"#EFF6FF",color:i===0?R:BL,fontWeight:600,padding:"1px 5px",borderRadius:8}}>{t}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                  if(c.key==="pos") return(
                    <td key={j} style={{padding:"9px 13px"}} onClick={e=>e.stopPropagation()}>
                      {canEditPos&&editingPos===p.id?(
                        <select
                          autoFocus
                          value={positions[p.id]||""}
                          onChange={e=>{setPositions(prev=>({...prev,[p.id]:e.target.value}));setEditingPos(null);}}
                          onBlur={()=>setEditingPos(null)}
                          style={{padding:"4px 10px",border:`1.5px solid ${R}`,borderRadius:6,fontSize:13,fontWeight:600,color:R,background:"var(--surface)",cursor:"pointer",outline:"none"}}>
                          <option value="">- keine -</option>
                          {POSITION_GROUPS.map(g=>(
                            <optgroup key={g.label} label={g.label}>
                              {g.options.map(pos=><option key={pos} value={pos}>{pos}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      ):(
                        <div
                          onClick={canEditPos?()=>setEditingPos(p.id):undefined}
                          title={canEditPos?"Position bearbeiten":undefined}
                          style={{display:"inline-flex",alignItems:"center",gap:4,cursor:canEditPos?"pointer":"default"}}>
                          {positions[p.id]
                            ?<Chip text={positions[p.id]} color="#555" bg="#F3F4F6"/>
                            :<span style={{fontSize:13,color:"var(--sub)",fontStyle:"italic"}}>-</span>
                          }
                          {canEditPos&&<span style={{fontSize:13,color:"var(--sub)"}}><TI n="edit"/></span>}
                        </div>
                      )}
                    </td>
                  );
                  if(c.key==="ahv")     return <td key={j} style={{padding:"9px 13px",color:"var(--sub)",fontSize:13}}>••••••••••</td>;
                  if(c.key==="address") return <td key={j} style={{padding:"9px 13px",color:"var(--sub)",fontSize:13,whiteSpace:"nowrap"}}>{p.street}, {p.plz} {p.city}</td>;
                  if(c.key==="parent")  return <td key={j} style={{padding:"9px 13px",color:"var(--sub)",fontSize:13,whiteSpace:"nowrap"}}>{p.p1First} {p.p1Last}</td>;
                  return <td key={j} style={{padding:"9px 13px",color:c.field==="email"?BL:"#555",fontSize:13,whiteSpace:"nowrap"}}>{p[c.field]||"-"}</td>;
                })}
                <td style={{padding:"9px 13px",textAlign:"right",color:"var(--sub)",fontSize:13}}>›</td>
              </tr>
              );
              const ROLLE_ORDER=["Trainer","Assistent/in","Coach","Admin"];
              const trainerSorted=[...trainer].sort((a,b)=>{
                const ia=ROLLE_ORDER.indexOf(a.role||"");
                const ib=ROLLE_ORDER.indexOf(b.role||"");
                const ra=ia===-1?99:ia;
                const rb=ib===-1?99:ib;
                return ra!==rb?ra-rb:String(a.lastName||'').localeCompare(String(b.lastName||''));
              });
              return groupByFunktion
                ? grouped.flatMap(({key,items})=>[
                    key&&<tr key={`grp-${key}`}>
                      <td colSpan={cols.length+1} style={{padding:"6px 13px",background:"var(--surface2)",borderTop:"0.5px solid var(--border)"}}>
                        <span style={{fontSize:11,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.6}}>
                          {key} <span style={{fontWeight:400,opacity:0.6}}>({items.length})</span>
                        </span>
                      </td>
                    </tr>,
                    ...items.map((p,i)=>renderRow(p,i,i%2===0?"var(--surface)":"var(--surface2)")),
                  ]).filter(Boolean)
                : [
                    trainer.length>0&&(
                      <tr key="trainer-divider">
                        <td colSpan={cols.length+1} style={{padding:"6px 13px",background:"var(--surface2)",borderTop:"0.5px solid var(--border)"}}>
                          <span style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5}}>Trainer &amp; Staff</span>
                        </td>
                      </tr>
                    ),
                    ...trainerSorted.map((p,i)=>renderRow(p,i,"#fafaf8")),
                    spieler.length>0&&(
                      <tr key="spieler-divider">
                        <td colSpan={cols.length+1} style={{padding:"6px 13px",background:"var(--surface2)",borderTop:"0.5px solid var(--border)"}}>
                          <span style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5}}>Spieler</span>
                        </td>
                      </tr>
                    ),
                    ...spieler.map((p,i)=>renderRow(p,i,i%2===0?"var(--surface)":"var(--surface2)")),
                  ];
            })()}
          </tbody>
        </table>
      </Card>
      )}
    </div>
  );
}

/* -- TRAININGSPLAN STATE (localStorage) -- */
/* == TRAININGSPLAN DATA == */
const INITIAL_PLAENE = [
  {
    id: "plan_1",
    name: "Trainingsplan Saison 2025/26",
    valid_from: "2025-08-01",
    valid_until: "2026-06-30",
    active: true,
    slots: GANTT.flatMap((d,di) => d.slots.map((s,si) => ({
      id: "slot_"+di+"_"+si,
      weekday: d.day,
      team: s.team,
      start: s.start,
      end: s.end,
      ort: s.field,
      end_ort: "",
      half: "",
      end_half: "",
      wechsel_zeit: "",
      color: s.color,
    })))
  }
];

/* == PLATZ-GANTT == */
function PlatzGantt({plan,wochenSlots,dayDates,DAYS,dagIndexes,today,displayStart,displayEnd,teamFilter,TEAM_COLORS,canEdit,onClickSlot,onNewSlot,GB,GR,BK,BL}){
  const aktivePlaetze = TRAININGSPLAETZE.filter(function(p){return p.active;});
  const idxMap = dagIndexes || DAYS.map(function(_,i){return i;});
  const alleCols = aktivePlaetze.reduce(function(acc,p){
    const halfn = p.halfn||[];
    if(halfn.length > 0){
      halfn.forEach(function(h){ acc.push({platz:p, half:h, key:p.id+"_"+h}); });
    } else {
      acc.push({platz:p, half:null, key:p.id});
    }
    return acc;
  },[]);

  const totalCols = alleCols.length;
  // In Tagesansicht breitere Spalten
  const timeW = 64;
  const nDays = DAYS.length;
  const nCols = nDays * totalCols;
  const minColW = DAYS.length === 1 ? 100 : 52;
  const maxColW = DAYS.length === 1 ? 200 : 120;
  const [containerW, setContainerW] = useState(800);
  const containerRef = useRef(null);
  useEffect(function(){
    function measure(){
      if(containerRef.current){
        setContainerW(containerRef.current.offsetWidth - timeW - 4);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return function(){ window.removeEventListener("resize", measure); };
  }, []);
  const fitsColW = Math.floor(containerW / nCols);
  const colW = Math.max(minColW, Math.min(maxColW, fitsColW));
  const dayW = totalCols * colW;
  const H15 = 18;

  const slots15 = [];
  for(let h=displayStart; h<displayEnd; h++){
    slots15.push(h, h+0.25, h+0.5, h+0.75);
  }

  function fmtT15(v){
    const hh = String(Math.floor(v)).padStart(2,"0");
    const mm = String(Math.round((v%1)*60)).padStart(2,"0");
    return hh+":"+mm;
  }

  function fmtDate(d){
    return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0");
  }

  return (
    <div ref={containerRef} style={{width:"100%", overflowX:"auto", WebkitOverflowScrolling:"touch", fontFamily:FONT, fontSize:13}}>
      <div style={{minWidth: timeW + nDays*dayW}}>

        {/* Headers */}
        <div style={{display:"flex", background:"var(--surface)", borderBottom:"1.5px solid #D1CFC8", height:44, boxSizing:"border-box", alignItems:"center"}}>
          <div style={{width:timeW, flexShrink:0, borderRight:"1px solid var(--border)", height:"100%"}}/>
          {DAYS.map(function(day,di){
            const d = dayDates[idxMap[di]];
            const isToday = d.toDateString()===today.toDateString();
            const hasSlots = (wochenSlots[idxMap[di]]||[]).length > 0;
            return (
              <div key={di} style={{width:dayW, flexShrink:0, borderRight:"1.5px solid #C8C5BC", background:isToday?"#EEF2FF":"transparent", textAlign:"center", padding:"4px", height:"100%", boxSizing:"border-box", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                <div style={{fontSize:13, fontWeight:700, letterSpacing:0.5, color:isToday?"#4F46E5":hasSlots?BK:"#888580", textTransform:"uppercase"}}>{day}</div>
                <div style={{fontSize:13, marginTop:1, color:isToday?"#6366F1":"#6B7280", fontWeight:isToday?600:400}}>{fmtDate(d)}</div>
              </div>
            );
          })}
        </div>

        {/* Platz-Namen */}
        <div style={{display:"flex", background:"var(--surface2)", borderBottom:"0.5px solid var(--border)", height:22, boxSizing:"border-box", alignItems:"center"}}>
          <div style={{width:timeW, flexShrink:0, borderRight:"1px solid var(--border)", height:"100%"}}/>
          {DAYS.map(function(_,di){
            const isToday = dayDates[idxMap[di]].toDateString()===today.toDateString();
            return aktivePlaetze.map(function(p,pi){
              const spanCols = (p.halfn||[]).length||1;
              const isLast = pi===aktivePlaetze.length-1;
              return (
                <div key={di+"_"+p.id} style={{width:spanCols*colW, flexShrink:0, borderRight:isLast?"1.5px solid #C8C5BC":"1px solid #DDD9CF", background:isToday?"#E8ECFF":"transparent", textAlign:"center", padding:"2px 3px", height:"100%", boxSizing:"border-box", display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <div style={{fontSize:13, fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{p.name}</div>
                </div>
              );
            });
          })}
        </div>

        {/* Hälften */}
        <div style={{display:"flex", background:"var(--surface2)", borderBottom:"1.5px solid var(--border)", height:18, boxSizing:"border-box", alignItems:"center"}}>
          <div style={{width:timeW, flexShrink:0, borderRight:"1px solid var(--border)", height:"100%"}}/>
          {DAYS.map(function(_,di){
            const isToday = dayDates[idxMap[di]].toDateString()===today.toDateString();
            return alleCols.map(function(col,ci){
              const isLast = ci===alleCols.length-1;
              return (
                <div key={di+"_"+col.key} style={{width:colW, flexShrink:0, borderRight:isLast?"1.5px solid #C8C5BC":"0.5px solid #DDD9CF", background:isToday?"#DDE1F8":"transparent", textAlign:"center", padding:"1px 2px", height:"100%", boxSizing:"border-box", display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <div style={{fontSize:13, fontWeight:600, color:"var(--sub)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:0.3}}>{col.half||""}</div>
                </div>
              );
            });
          })}
        </div>

        {/* Grid */}
        <div style={{display:"flex"}}>

          {/* Zeitachse */}
          <div style={{width:timeW, flexShrink:0, borderRight:"1px solid var(--border)", background:"var(--surface2)"}}>
            {slots15.map(function(t,i){
              const isHour = t%1===0;
              const isHalf = Math.round((t%1)*60)===30;
              return (
                <div key={t} style={{
                  height:H15,
                  borderTop:i>0?"0.5px solid "+(isHour?"#D1CFC8":isHalf?"#E8E6DF":"#F0EFEB"):"none",
                  boxSizing:"border-box",
                  display:"flex", alignItems:"flex-start", justifyContent:"flex-end",
                  paddingRight:5, paddingTop:1
                }}>
                  {isHour && <span style={{fontSize:13, color:"var(--sub)", fontWeight:600, letterSpacing:-0.3}}>{fmtT15(t)}</span>}
                  {!isHour && <span style={{fontSize:13, color:"#D1D5DB", fontWeight:400}}>{fmtT15(t)}</span>}
                </div>
              );
            })}
          </div>

          {/* 7 Tage */}
          {DAYS.map(function(day,di){
            const realDi = idxMap[di];
            const isToday = dayDates[realDi].toDateString()===today.toDateString();
            const daySlots = (wochenSlots[realDi]||[]).filter(function(s){ return teamFilter==="alle"||s.team===teamFilter; });
            const totalH = H15*slots15.length;

            return (
              <div key={di} style={{display:"flex", borderRight:"1.5px solid #C8C5BC", background:isToday?"#F8F9FF":"transparent"}}>
                {alleCols.map(function(col,ci){
                  const platzHaelften = col.platz.halfn||[];
                  const hasHaelften = platzHaelften.length > 0;
                  const isFirstHaelfte = hasHaelften && col.half===platzHaelften[0];
                  const numHaelften = platzHaelften.length||1;

                  const colSlots = daySlots.filter(function(s){
                    if(!hasHaelften){
                      return s.location===col.platz.name || (s.end_ort&&s.end_ort===col.platz.name);
                    }
                    var p1platz = s.location;
                    var p2platz = s.end_ort||s.location;
                    var p1h = s.half;
                    var p2h = s.end_half;
                    if(!s.wechsel_zeit){
                      if(col.platz.name!==p1platz) return false;
                      if(!p1h) return true;
                      return p1h===col.half;
                    }
                    var p1here = col.platz.name===p1platz && (!p1h ? true : p1h===col.half);
                    var p2here = col.platz.name===p2platz && (!p2h ? true : p2h===col.half);
                    return p1here || p2here;
                  });

                  return (
                    <div key={col.key}
                      style={{width:colW, flexShrink:0, position:"relative", height:totalH, borderRight:ci<alleCols.length-1?"0.5px solid #E8E6DF":"none", cursor:canEdit?"crosshair":"default"}}
                      onClick={canEdit ? function(e){
                        if(e.target !== e.currentTarget) return;
                        var rect = e.currentTarget.getBoundingClientRect();
                        var relY = e.clientY - rect.top;
                        var rawTime = displayStart + relY / (H15*4);
                        var snapped = Math.round(rawTime*4)/4;
                        snapped = Math.max(displayStart, Math.min(displayEnd-1, snapped));
                        onNewSlot({
                          weekday: DAYS[di],
                          start: snapped,
                          end: Math.min(snapped+1.5, displayEnd),
                          ort: col.platz.name,
                          half: col.half||"",
                        });
                      } : undefined}>
                      {slots15.map(function(t,i){
                        const isHour = t%1===0;
                        const isHalf = Math.round((t%1)*60)===30;
                        return (
                          <div key={t} style={{position:"absolute", top:i*H15, left:0, right:0, height:H15, borderTop:i>0?"0.5px solid "+(isHour?"#D1CFC8":isHalf?"#E8E6DF":"#F2F1ED"):"none", pointerEvents:"none"}}/>
                        );
                      })}
                      {colSlots.map(function(s,si){
                        const col2 = s.color||TEAM_COLORS[s.team]||BL;
                        var blocks = [];
                        if(!s.wechsel_zeit){
                          var isFullP = hasHaelften&&!s.half;
                          if(isFullP && !isFirstHaelfte){ /* skip */ }
                          else {
                            var sr = (isFullP && isFirstHaelfte) ? -(numHaelften-1)*colW-1 : 1;
                            blocks.push({start:s.start, end:s.end, right:sr});
                          }
                        } else {
                          var p1platz = s.location;
                          var p2platz = s.end_ort||s.location;
                          var p1h = s.half;
                          var p2h = s.end_half;
                          var p1here = col.platz.name===p1platz && (!p1h ? true : p1h===col.half);
                          var p2here = col.platz.name===p2platz && (!p2h ? true : p2h===col.half);
                          if(p1here){
                            var isFullP1 = hasHaelften&&!p1h&&col.platz.name===p1platz;
                            var sr1 = (isFullP1 && isFirstHaelfte) ? -(numHaelften-1)*colW-1 : 1;
                            if(!isFullP1 || isFirstHaelfte){
                              blocks.push({start:s.start, end:s.wechsel_zeit, right:sr1});
                            }
                          }
                          if(p2here){
                            var isFullP2 = hasHaelften&&!p2h&&col.platz.name===p2platz;
                            var otherPlatz = col.platz.name===p2platz;
                            var p2Cols = otherPlatz ? (p2platz===p1platz ? numHaelften : (TRAININGSPLAETZE.find(function(pp){return pp.name===p2platz;})||{}).halfn?.length||1) : 1;
                            var sr2 = (isFullP2 && (isFirstHaelfte||!hasHaelften)) ? -(p2Cols-1)*colW-1 : 1;
                            if(!isFullP2 || isFirstHaelfte || !hasHaelften){
                              blocks.push({start:s.wechsel_zeit, end:s.end, right:sr2});
                            }
                          }
                        }
                        return blocks.map(function(b,bi){
                          var top = (b.start-displayStart)*H15*4;
                          var h = (b.end-b.start)*H15*4-2;
                          return (
                            <div key={si+"_"+bi} onClick={function(){onClickSlot(s);}} title={s.team+" "+fmtT15(b.start)+"-"+fmtT15(b.end)}
                              style={{
                                position:"absolute", top:top+1, left:2, right:b.right<1?b.right:2,
                                height:Math.max(h,14),
                                background:col2,
                                borderRadius:4,
                                borderLeft:"3px solid rgba(255,255,255,0.35)",
                                padding:"2px 4px",
                                overflow:"hidden", cursor:"pointer",
                                zIndex:b.right<1?2:1,
                                boxSizing:"border-box",
                                boxShadow:"0 1px 3px rgba(0,0,0,0.18)"
                              }}>
                              <div style={{color:"#fff", fontWeight:700, fontSize:13, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:0.2}}>{s.team}</div>
                              {h>28 && <div style={{color:"rgba(255,255,255,0.82)", fontSize:13, letterSpacing:0.1}}>{fmtT15(b.start)}-{fmtT15(b.end)}</div>}
                            </div>
                          );
                        });
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
function TrainingGantt({team: teamProp, role, kannSchreiben, kannVerwalten, sb:supabase}){
  const START = 7, END = 22, H = 52;
  const isMobile = useIsMobile();
  const canEdit = role==="administrator"||role==="administration";

  const [plaene, setPlaene] = useState(INITIAL_PLAENE);
  const [aktiverPlan, setAktiverPlan] = useState("plan_1");
  const [vorschauPlan, setVorschauPlan] = useState(null); // null = aktiver Plan, sonst Plan-ID
  const [teamFilter, setTeamFilter] = useState(teamProp||"alle");
  const [kwOffset, setKwOffset] = useState(0);
  const [ausnahmen, setAusnahmen] = useState({});
  const [ganttMode, setGanttMode] = useState("tag");
  const [editSlot, setEditSlot] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showAusnahmeModal, setShowAusnahmeModal] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteSlot, setDeleteSlot] = useState(null);
  const [trainerNachrichten, setTrainerNachrichten] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [newSlotPrefill, setNewSlotPrefill] = useState(null);
  const [showPlanVerwaltung, setShowPlanVerwaltung] = useState(false);
  const [trainingsTab, setTrainungsTab] = useState("gantt");
  const [ansicht, setAnsicht] = useState("woche"); // "woche" | "tag"
  const [selectedDay, setSelectedDay] = useState(0); // 0=Mo..6=So

  useEffect(function(){
    (async function(){
      try{
        // Supabase laden
        if(supabase){
          // Pläne laden
          const {data: plaeneData} = await supabase.from("trainingsplan_vorlagen").select("*").order("valid_from");
          if(plaeneData && plaeneData.length > 0){
            // Slots pro Plan laden
            const {data: slotsData} = await supabase.from("trainingsplan_slots").select("*");
            const slots = slotsData || [];
            const plaeneMitSlots = plaeneData.map(function(p){
              return {
                ...p,
                slots: slots.filter(function(s){ return s.template_id === p.id; }).map(function(s){
                  return {
                    id: s.id,
                    weekday: s.weekday,
                    team: s.team,
                    start: s.start_zeit,
                    end: s.end_zeit,
                    location: s.location,
                    end_ort: s.end_ort||"",
                    half: s.half||"",
                    end_half: s.end_half||"",
                    wechsel_zeit: s.wechsel_zeit||"",
                    color: s.color||"",
                  };
                }),
              };
            });
            setPlaene(plaeneMitSlots);
            // Aktiven Plan setzen
            const aktiver = plaeneMitSlots.find(function(p){ return p.active; });
            if(aktiver) setAktiverPlan(aktiver.id);
          } else {
            // Fallback: localStorage
            const r = await window.storage.get("trainingsPlaene");
            if(r) setPlaene(JSON.parse(r.value));
          }
          // Ausnahmen laden
          const {data: ausnahmenData} = await supabase.from("trainingsplan_ausnahmen").select("*");
          if(ausnahmenData){
            const ausnahmenMap = {};
            ausnahmenData.forEach(function(a){
              const key = a.week_nr_key;
              if(!ausnahmenMap[key]) ausnahmenMap[key] = [];
              ausnahmenMap[key].push({
                id: a.id,
                slot_id: a.slot_id,
                type: a.type,
                datum: a.date,
                kw_key: a.week_nr_key,
                neue_start_zeit: a.neue_start_zeit,
                neue_end_zeit: a.neue_end_zeit,
                neues_ort: a.neues_ort,
                neue_half: a.neue_half,
                grund: a.grund||"",
              });
            });
            setAusnahmen(ausnahmenMap);
          }
        } else {
          // Kein Supabase — localStorage
          const r = await window.storage.get("trainingsPlaene");
          if(r) setPlaene(JSON.parse(r.value));
          const a = await window.storage.get("trainingsAusnahmen");
          if(a) setAusnahmen(JSON.parse(a.value));
        }
        const tn = await window.storage.get("trainer_benachrichtigungen");
        if(tn){ const alle=JSON.parse(tn.value); setTrainerNachrichten(alle.filter(function(n){return !n.gelesen;})); }
      }catch(e){ console.warn("[FCH] Trainingsplan laden Fehler:", e.message); }
    })();
  },[]);

  async function savePlaene(p){
    setPlaene(p);
    if(supabase){
      try{
        for(const plan of p){
          await supabase.from("trainingsplan_vorlagen").upsert({
            id: plan.id,
            name: plan.name,
            valid_from: plan.valid_from,
            valid_until: plan.valid_until,
            active: plan.active,
          });
          if(plan.slots){
            for(const s of plan.slots){
              await supabase.from("trainingsplan_slots").upsert({
                id: s.id,
                template_id: s.template_id||plan.id,
                weekday: s.weekday,
                team: s.team,
                start_zeit: s.start,
                end_zeit: s.end,
                location: s.location,
                end_ort: s.end_ort||null,
                half: s.half||null,
                end_haelfte: s.end_half||null,
                wechsel_zeit: s.wechsel_zeit||null,
                color: s.color||null,
              });
            }
          }
        }
      }catch(e){ console.warn("[FCH] savePlaene Fehler:", e.message); }
    } else {
      window.storage.set("trainingsPlaene", JSON.stringify(p));
    }
  }

  async function saveAusnahmen(a){
    setAusnahmen(a);
    if(supabase){
      try{
        // Alle Ausnahmen als flache Liste
        const alle = Object.values(a).flat();
        for(const ausnahme of alle){
          await supabase.from("trainingsplan_ausnahmen").upsert({
            id: ausnahme.id,
            slot_id: ausnahme.slot_id||null,
            type: ausnahme.type,
            week_nr: ausnahme.week_nr,
            year: ausnahme.year,
            neue_start_zeit: ausnahme.neue_start_zeit||null,
            neue_end_zeit: ausnahme.neue_end_zeit||null,
            neuer_ort: ausnahme.neues_ort||null,
            neue_haelfte: ausnahme.neue_half||null,
            grund: ausnahme.grund||null,
          });
        }
      }catch(e){ console.warn("[FCH] saveAusnahmen Fehler:", e.message); }
    } else {
      window.storage.set("trainingsAusnahmen", JSON.stringify(a));
    }
  }

  const today = new Date(2026,4,24);
  function getMonday(d){ const day=d.getDay(); const diff=d.getDate()-day+(day===0?-6:1); return new Date(new Date(d).setDate(diff)); }
  const monday = new Date(getMonday(new Date(today)));
  monday.setDate(monday.getDate() + kwOffset*7);
  const DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
  const dayDates = DAYS.map(function(_,i){ const d=new Date(monday); d.setDate(d.getDate()+i); return d; });
  function getKW(d){ const jan4=new Date(d.getFullYear(),0,4); const diff=d-jan4; return Math.ceil((diff/86400000+jan4.getDay()+1)/7); }
  const kw = getKW(monday);
  function fmtDate(d){ return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0"); }
  function fmtTime(v){ return String(Math.floor(v)).padStart(2,"0")+":"+(v%1===0?"00":"30"); }

  const angezeigterPlanId = vorschauPlan || aktiverPlan;
  const plan = plaene.find(function(p){return p.id===angezeigterPlanId;})||plaene[0];
  const isVorschau = vorschauPlan && vorschauPlan!==aktiverPlan;
  const kwKey = monday.getFullYear()+"_"+kw;
  const kwAusnahmen = ausnahmen[kwKey]||[];

  const FCH_TEAMS = [
    "1. Mannschaft","2. Mannschaft","3. Mannschaft","4. Mannschaft",
    "Ältere Junioren A","Ältere Junioren B",
    "Cc-Junioren","Dc-Junioren","Ec-Junioren","Fc-Junioren",
    "Gc-Junioren","Hc-Junioren","Ic-Junioren",
    "Frauen","Mädchen",
  ];
  const alleTeams = Array.from(new Set([
    ...FCH_TEAMS,
    ...(plan?.slots||[]).map(function(s){return s.team;})
  ])).sort();
  const TEAM_COLORS = {};
  (plan?.slots||[]).forEach(function(s){ TEAM_COLORS[s.team]=s.color; });

  // Prüfe ob die aktuelle Woche innerhalb der Plan-Gültigkeit liegt
  const wocheStart = monday;
  const wocheEnd = new Date(monday); wocheEnd.setDate(wocheEnd.getDate()+6);
  const planGueltigAb  = plan?.valid_from  ? new Date(plan.valid_from)  : null;
  const planGueltigBis = plan?.valid_until ? new Date(plan.valid_until) : null;
  // Plan gilt diese Woche wenn: wocheEnd >= valid_from UND (kein valid_until ODER wocheStart <= valid_until)
  const planGueltigDieseWoche =
    (!planGueltigAb  || wocheEnd   >= planGueltigAb) &&
    (!planGueltigBis || wocheStart <= planGueltigBis);

  const wochenSlots = DAYS.map(function(day){
    if(!planGueltigDieseWoche) return [];
    const basis = (plan?.slots||[])
      .filter(function(s){ return s.weekday===day; })
      .filter(function(s){
        // Gilt dieser Slot ab dieser KW?
        if(!s.valid_from_week) return true;
        const [cy,ck] = kwKey.split("_").map(Number);
        const [gy,gk] = s.valid_from_week.split("_").map(Number);
        return cy>gy || (cy===gy && ck>=gk);
      })
      .filter(function(s){ return !kwAusnahmen.some(function(a){ return a.type==="absage"&&a.slot_id===s.id; }); })
      .map(function(s){
        const va = kwAusnahmen.find(function(a){ return a.type==="verschiebung"&&a.slot_id===s.id; });
        const oa = kwAusnahmen.find(function(a){ return a.type==="location"&&a.slot_id===s.id; });
        if(va) return Object.assign({},s,{start:va.neue_start,end:va.neue_end,isVerschoben:true});
        if(oa) return Object.assign({},s,{ort:oa.neuer_ort,isOrtGeaendert:true});
        return s;
      });
    const zusatz = kwAusnahmen
      .filter(function(a){ return a.type==="zusatz"&&a.weekday===day; })
      .map(function(a){ return Object.assign({},a,{isZusatz:true}); });
    return basis.concat(zusatz);
  });

  const DEFAULT_START = 14.5; // 14:30 Uhr
  const DEFAULT_END   = 22;   // 22:00 Uhr
  const allStarts = wochenSlots.reduce(function(acc,ss){ return acc.concat(ss.map(function(s){return s.start;})); },[]);
  const allEnds   = wochenSlots.reduce(function(acc,ss){ return acc.concat(ss.map(function(s){return s.end;})); },[]);
  const minStart  = allStarts.length ? Math.min.apply(null,allStarts) : DEFAULT_START;
  const maxEnd    = allEnds.length   ? Math.max.apply(null,allEnds)   : DEFAULT_END;
  // Nur früher als Standard wenn ein Slot wirklich früher startet
  const displayStart = minStart < DEFAULT_START ? Math.max(7, Math.floor(minStart)) : DEFAULT_START;
  // Mindestens bis DEFAULT_END, sonst bis zum Ende des letzten Slots (aufgerundet)
  const displayEnd = Math.max(DEFAULT_END, Math.ceil(maxEnd));
  const trainerAbsagen = kwAusnahmen.filter(function(a){ return a.type==="absage"&&a.von_termin; });

  function handleSlotSave(slot){
    const cleanSlot = Object.assign({},slot);
    delete cleanSlot.nurDieseWoche;

    if(slot.nurDieseWoche){
      if(editSlot&&editSlot.id){
        // Edit existing: save as Ausnahme for this week
        const ausnahme = {
          type: "verschiebung",
          slot_id: editSlot.id,
          weekday: slot.weekday||editSlot.weekday,
          team: slot.team||editSlot.team,
          neue_start: slot.start,
          neue_end: slot.end,
          neuer_ort: slot.location,
          von_termin: false,
        };
        const next = Object.assign({},ausnahmen);
        next[kwKey] = (ausnahmen[kwKey]||[])
          .filter(function(a){ return !(a.slot_id===editSlot.id&&a.type==="verschiebung"); })
          .concat([ausnahme]);
        saveAusnahmen(next);
      } else {
        // New slot: save as zusatz Ausnahme for selected week only
        const targetKwKey = slot.selectedKwKey||kwKey;
        const zusatz = Object.assign({},cleanSlot,{
          type: "zusatz",
          weekday: cleanSlot.weekday,
          isZusatz: true,
          id: "zusatz_"+Date.now(),
        });
        const next = Object.assign({},ausnahmen);
        next[targetKwKey] = (ausnahmen[targetKwKey]||[]).concat([zusatz]);
        saveAusnahmen(next);
      }
    } else {
      // Save permanently — ab der gewählten KW (valid_from)
      delete cleanSlot.selectedKwKey;
      const gueltigAb = slot.selectedKwKey || null; // kwKey format: "2026_21"
      const updated = plaene.map(function(p){
        if(p.id!==angezeigterPlanId) return p;
        return Object.assign({},p,{slots: editSlot&&editSlot.id
          ? p.slots.map(function(s){ return s.id===editSlot.id?Object.assign({},s,cleanSlot):s; })
          : p.slots.concat([Object.assign({},cleanSlot,{id:"slot_"+Date.now(), valid_from_week:gueltigAb})])
        });
      });
      savePlaene(updated);
    }
    setShowSlotModal(false);
    setEditSlot(null);
  }

  function handleSlotDeleteInit(slotId){
    const slot = (plan?.slots||[]).find(function(s){ return s.id===slotId; });
    if(!slot) return;
    const td = new Date(2026,4,24);
    const zukunftigeEvents = ATT_EVENTS.filter(function(e){
      if(e.type!=="Training"||e.team!==slot.team) return false;
      const parts = e.date.split(" ");
      const dm = parts.length>1?parts[1]:parts[0];
      const dparts = dm.split(".");
      const evDate = new Date((parseInt(dparts[2])||2026),parseInt(dparts[1])-1,parseInt(dparts[0]));
      return evDate>=td;
    });
    setDeleteSlot(Object.assign({},slot,{zukunftigeEvents:zukunftigeEvents, selectedEvIds:new Set()}));
    setShowDeleteDialog(true);
    setShowSlotModal(false);
  }

  async function handleSlotDeleteConfirm(slot, selectedEvIds){
    const updated = plaene.map(function(p){
      if(p.id!==angezeigterPlanId) return p;
      return Object.assign({},p,{slots:p.slots.filter(function(s){ return s.id!==slot.id; })});
    });
    savePlaene(updated);
    // Slot aus Supabase löschen
    if(supabase && slot.id){
      try{
        await supabase.from("trainingsplan_slots").delete().eq("id", slot.id);
      }catch(e){ console.warn("[FCH] Slot löschen Fehler:", e.message); }
    }
    if(selectedEvIds.size>0){
      try{
        const cr = await window.storage.get("cancelled_events");
        const cancelled = cr?JSON.parse(cr.value):{};
        selectedEvIds.forEach(function(id){ cancelled[id]=true; });
        await window.storage.set("cancelled_events",JSON.stringify(cancelled));
      }catch(e){}
    }
    setShowDeleteDialog(false);
    setDeleteSlot(null);
    setEditSlot(null);
  }

  function handleAusnahmeSave(ausnahme, fuerAlleWochen){
    if(fuerAlleWochen){
      if(ausnahme.type==="absage"){ handleSlotDeleteInit(ausnahme.slot_id); }
      else if(ausnahme.type==="verschiebung"){
        const updated = plaene.map(function(p){
          if(p.id!==angezeigterPlanId) return p;
          return Object.assign({},p,{slots:p.slots.map(function(s){ return s.id===ausnahme.slot_id?Object.assign({},s,{start:ausnahme.neue_start,end:ausnahme.neue_end}):s; })});
        });
        savePlaene(updated);
      } else if(ausnahme.type==="location"){
        const updated = plaene.map(function(p){
          if(p.id!==angezeigterPlanId) return p;
          return Object.assign({},p,{slots:p.slots.map(function(s){ return s.id===ausnahme.slot_id?Object.assign({},s,{ort:ausnahme.neuer_ort}):s; })});
        });
        savePlaene(updated);
      }
    } else {
      const next = Object.assign({},ausnahmen);
      next[kwKey] = (ausnahmen[kwKey]||[]).filter(function(a){ return !(a.slot_id===ausnahme.slot_id&&a.type===ausnahme.type); }).concat([ausnahme]);
      saveAusnahmen(next);
    }
    setShowAusnahmeModal(false);
  }

  function handleAusnahmeRemove(ausnahme){
    const next = Object.assign({},ausnahmen);
    next[kwKey] = (ausnahmen[kwKey]||[]).filter(function(a){ return a!==ausnahme; });
    saveAusnahmen(next);
  }

  function handlePlanSave(planData){
    if(editPlan&&editPlan.id){
      savePlaene(plaene.map(function(p){ return p.id===editPlan.id?Object.assign({},p,planData):p; }));
    } else {
      const newPlan = Object.assign({},planData,{id:"plan_"+Date.now(),slots:[]});
      savePlaene(plaene.concat([newPlan]));
      setAktiverPlan(newPlan.id);
    }
    setShowPlanEditor(false);
    setEditPlan(null);
  }

  function handlePlanDuplizieren(plan){
    const copy = Object.assign({},plan,{
      id:"plan_"+Date.now(),
      name:plan.name+" (Kopie)",
      active:false,
      slots:(plan.slots||[]).map(function(s){ return Object.assign({},s,{id:"slot_"+Date.now()+Math.random()}); }),
    });
    savePlaene(plaene.concat([copy]));
  }

  function handlePlanAktivieren(id){
    savePlaene(plaene.map(function(p){ return Object.assign({},p,{active:p.id===id}); }));
    setAktiverPlan(id);
  }

  function handlePlanLoeschen(id){
    if(plaene.length<=1){ alert("Mindestens ein Plan muss vorhanden sein."); return; }
    const next = plaene.filter(function(p){ return p.id!==id; });
    savePlaene(next);
    if(aktiverPlan===id) setAktiverPlan(next[0].id);
  }

  function handleDragStart(e, s){
    if(!canEdit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragState({slotId:s.id, duration:s.end-s.start, offsetY:e.clientY-rect.top});
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("slotId", s.id);
  }

  function handleDrop(e, day){
    e.preventDefault();
    if(!dragState) return;
    const slotId = e.dataTransfer.getData("slotId");
    const s = (plan?.slots||[]).find(function(x){ return x.id===slotId; });
    if(!s) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top - dragState.offsetY;
    const rawTime = displayStart + relY / H;
    const newStart = Math.max(displayStart, Math.min(displayEnd-dragState.duration, Math.round(rawTime*4)/4));
    const newEnd = newStart + dragState.duration;
    const updated = plaene.map(function(p){
      if(p.id!==angezeigterPlanId) return p;
      return Object.assign({},p,{slots:p.slots.map(function(x){ return x.id===slotId?Object.assign({},x,{weekday:day,start:newStart,end:newEnd}):x; })});
    });
    savePlaene(updated);
    setDragState(null);
  }

  function Btn2({children, onClick, active, small, danger}){
    return (
      <button onClick={onClick} style={{padding:small?"4px 10px":"6px 14px", borderRadius:20, border:"1px solid "+(danger?R:active?BK:GB), background:danger?RL:active?BK:"#fff", color:danger?R:active?"#fff":"#555", fontSize:13, fontWeight:active?600:400, cursor:"pointer", whiteSpace:"nowrap"}}>{children}</button>
    );
  }

  return (
    <div>
      {/* Plan-Verwaltung Overlay */}
      {showPlanVerwaltung&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:3000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,paddingBottom:20,overflowY:"auto"}}>
          <div style={{background:"var(--surface)",borderRadius:16,padding:"0 0 16px",maxWidth:540,width:"100%",margin:"0 16px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"0.5px solid "+GB}}>
              <div style={{fontWeight:700,fontSize:16}}>Trainingsplan-Versionen</div>
              <button onClick={function(){setShowPlanVerwaltung(false);}} style={{background:"none",border:"none",fontSize:21,cursor:"pointer",color:"var(--sub)",lineHeight:1}}>x</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:13,color:"var(--sub)",marginBottom:4}}>Aktiviere einen Plan um ihn im GANTT anzuzeigen. Dupliziere einen Plan als Vorlage fur eine neue Version.</div>
              {plaene.map(function(p){
                const isAktiv = p.id===aktiverPlan;
                const slotCount = (p.slots||[]).length;
                return(
                  <div key={p.id} style={{border:"1.5px solid "+(isAktiv?BL:GB),borderRadius:12,padding:"12px 14px",background:isAktiv?"#EFF6FF":"#fff"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <div style={{fontWeight:700,fontSize:14,color:isAktiv?BL:BK}}>{p.name}</div>
                          {isAktiv&&<span style={{fontSize:13,padding:"2px 8px",borderRadius:20,background:BL,color:"#fff",fontWeight:600}}>Aktiv</span>}
                          {p.active&&!isAktiv&&<span style={{fontSize:13,padding:"2px 8px",borderRadius:20,background:"var(--surface)",color:GN,fontWeight:600}}>Aktiviert</span>}
                        </div>
                        <div style={{fontSize:13,color:"var(--sub)"}}>
                          {p.valid_from?p.valid_from.split("-").reverse().join("."):"–"}
                          {" bis "}
                          {p.valid_until?p.valid_until.split("-").reverse().join("."):"unbegrenzt"}
                          {" · "+slotCount+" Training"+(slotCount===1?"":"s")}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexShrink:0}}>
                        {!isAktiv&&(
                          <button onClick={function(){handlePlanAktivieren(p.id);}}
                            style={{padding:"8px 14px",borderRadius:8,border:"1.5px solid "+BL,background:"var(--surface)",color:BL,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                            Aktivieren
                          </button>
                        )}
                        <button onClick={function(){setEditPlan(p);setShowPlanEditor(true);setShowPlanVerwaltung(false);}} title="Bearbeiten"
                          style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}><TI n="edit"/></button>
                        <button onClick={function(){handlePlanDuplizieren(p);}} title="Duplizieren"
                          style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>≡</button>
                        {plaene.length>1&&!isAktiv&&(
                          <button onClick={function(){if(window.confirm("Plan \""+p.name+"\" loeschen?")){handlePlanLoeschen(p.id);}}} title="Loeschen"
                            style={{width:28,height:28,borderRadius:6,border:"0.5px solid "+R+"30",background:RL,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}><TI n="trash"/></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={function(){setEditPlan(null);setShowPlanEditor(true);setShowPlanVerwaltung(false);}}
                style={{padding:"10px",borderRadius:10,border:"1.5px dashed "+GB,background:"transparent",color:"var(--sub)",fontSize:13,cursor:"pointer",textAlign:"center",marginTop:4}}>
                + Neuen Plan erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Tab-Navigation === */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",background:"var(--surface2)",borderRadius:10,padding:3,gap:4}}>
          {[{v:"gantt",l:"GANTT"},{v:"plaetze",l:"Plätze",adminOnly:true},{v:"plaene",l:"Pläne",adminOnly:true}].map(function(t){
            if(t.adminOnly&&!canEdit) return null;
            var isActive = trainingsTab===t.v;
            return(
              <button key={t.v} onClick={function(){setTrainungsTab(t.v);}}
                style={{padding:"8px 14px",borderRadius:8,border:"none",background:isActive?"#fff":"transparent",color:isActive?BK:"#888",fontWeight:isActive?700:400,fontSize:13,cursor:"pointer",boxShadow:isActive?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {t.l}
              </button>
            );
          })}
        </div>
        {trainingsTab==="gantt"&&canEdit&&(
          <Btn2 small onClick={function(){setEditSlot(null);setShowSlotModal(true);}}>+ Training</Btn2>
        )}
        {trainingsTab==="plaene"&&canEdit&&(
          <Btn2 small onClick={function(){setEditPlan(null);setShowPlanEditor(true);}}>+ Neuer Plan</Btn2>
        )}
      </div>

      {/* === Tab: Plane === */}
      {trainingsTab==="plaene"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontSize:13,color:"var(--sub)",marginBottom:4}}>Aktiviere einen Plan um ihn im GANTT anzuzeigen. Dupliziere ihn als Vorlage fur eine neue Version.</div>
          {plaene.map(function(p){
            const isAktiv = p.id===aktiverPlan;
            const slotCount = (p.slots||[]).length;
            return(
              <div key={p.id} style={{border:"1.5px solid "+(isAktiv?BL:GB),borderRadius:12,padding:"14px 16px",background:isAktiv?"#EFF6FF":"#fff"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{fontWeight:700,fontSize:14,color:isAktiv?BL:BK}}>{p.name}</div>
                      {isAktiv&&<span style={{fontSize:13,padding:"2px 8px",borderRadius:20,background:BL,color:"#fff",fontWeight:600}}>Aktiv</span>}
                    </div>
                    <div style={{fontSize:13,color:"var(--sub)"}}>
                      {p.valid_from?p.valid_from.split("-").reverse().join("."):"–"}
                      {" bis "}
                      {p.valid_until?p.valid_until.split("-").reverse().join("."):"unbegrenzt"}
                      {" · "+slotCount+" Training"+(slotCount===1?"":"s")}
                    </div>
                  </div>
                  {canEdit&&(
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      {!isAktiv&&<button onClick={function(){handlePlanAktivieren(p.id);}} style={{padding:"8px 14px",borderRadius:8,border:"1.5px solid "+BL,background:"var(--surface)",color:BL,fontSize:13,fontWeight:600,cursor:"pointer"}}>Aktivieren</button>}
                      <button onClick={function(){setEditPlan(p);setShowPlanEditor(true);}} style={{width:30,height:30,borderRadius:8,border:"0.5px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}><TI n="edit"/></button>
                      <button onClick={function(){handlePlanDuplizieren(p);}} style={{width:30,height:30,borderRadius:8,border:"0.5px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>≡</button>
                      {plaene.length>1&&!isAktiv&&<button onClick={function(){if(window.confirm("Plan loeschen?")){handlePlanLoeschen(p.id);}}} style={{width:30,height:30,borderRadius:8,border:"0.5px solid "+R+"30",background:RL,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}><TI n="trash"/></button>}
                    </div>
                  )}
                </div>
                {isAktiv&&<button onClick={function(){setTrainungsTab("gantt");}} style={{marginTop:10,width:"100%",padding:"7px",borderRadius:8,border:"1px solid "+BL+"40",background:"transparent",color:BL,fontSize:13,cursor:"pointer"}}>Zum GANTT →</button>}
                {!isAktiv&&canEdit&&(
                  <button onClick={function(){setVorschauPlan(p.id);setTrainungsTab("gantt");}}
                    style={{marginTop:10,width:"100%",padding:"7px",borderRadius:8,border:"1px solid #FDE68A",background:"var(--surface)",color:"#92400E",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    Vorschau im GANTT →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === Tab: Platze === */}
      {trainingsTab==="plaetze"&&<PlaetzeView/>}

      {/* === Tab: GANTT === */}
      {trainingsTab==="gantt"&&(
      <div>

      {/* Ausserhalb Gültigkeitsspanne */}
      {!planGueltigDieseWoche&&(
        <div style={{padding:"10px 14px",background:"var(--surface2)",border:"1px solid #D1D5DB",borderRadius:10,marginBottom:12,fontSize:13,color:"var(--sub)",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>&#128197;</span>
          <span>
            Diese Woche liegt ausserhalb der Gültigkeitsspanne des Plans
            {planGueltigAb&&<strong style={{color:"var(--text)"}}> ({plan.valid_from&&plan.valid_from.split("-").reverse().join(".")} – {plan.valid_until?plan.valid_until.split("-").reverse().join("."):"unbegrenzt"})</strong>}.
            Keine Trainings angezeigt.
          </span>
        </div>
      )}
      {isVorschau&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px 14px",background:"var(--surface)",border:"1.5px solid #FDE68A",borderRadius:10,marginBottom:12}}>
          <div>
            <span style={{fontSize:13,fontWeight:700,color:"#92400E"}}>Vorschau: </span>
            <span style={{fontSize:13,color:"#92400E"}}>{plan.name}</span>
            <span style={{fontSize:13,color:"#B45309",marginLeft:8}}>Nicht der aktive Plan</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){handlePlanAktivieren(vorschauPlan);setVorschauPlan(null);}}
              style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid "+BL,background:"var(--surface)",color:BL,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              Jetzt aktivieren
            </button>
            <button onClick={function(){setVorschauPlan(null);}}
              style={{padding:"8px 14px",borderRadius:8,border:"0.5px solid #FDE68A",background:"var(--surface)",color:"#92400E",fontSize:13,cursor:"pointer"}}>
              Schliessen
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:isVorschau?"#92400E":BK}}>
              {isVorschau&&<span style={{fontSize:13,background:"#FDE68A",color:"#92400E",padding:"2px 7px",borderRadius:20,marginRight:7,fontWeight:600}}>Vorschau</span>}
              {plan?plan.name:"Trainingsplan"}
            </div>
            <div style={{fontSize:13,color:"var(--sub)",marginTop:2}}>
              {plan&&plan.valid_from?"Gueltig: "+fmtDate(new Date(plan.valid_from))+" - "+(plan.valid_until?fmtDate(new Date(plan.valid_until)):"unbegrenzt"):""}
            </div>
          </div>
          {canEdit && (
            <Btn2 small onClick={function(){setEditSlot(null);setShowSlotModal(true);}}>+ Training</Btn2>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={function(){
              if(ansicht==="tag"){ setSelectedDay(function(d){return d===0?6:d-1;}); }
              else { setKwOffset(function(o){return o-1;}); }
            }} style={{width:28,height:28,borderRadius:"50%",border:"1px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:14}}>&#8249;</button>
            <div style={{textAlign:"center",minWidth:130}}>
              {ansicht==="woche" ? (
                <>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>KW {kw}</div>
                  <div style={{fontSize:13,color:"var(--sub)"}}>{fmtDate(dayDates[0])} - {fmtDate(dayDates[6])}.{dayDates[6].getFullYear()}</div>
                </>
              ) : (
                <>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{DAYS[selectedDay]}, {fmtDate(dayDates[selectedDay])}.{dayDates[selectedDay].getFullYear()}</div>
                  <div style={{fontSize:13,color:"var(--sub)"}}>KW {kw}</div>
                </>
              )}
            </div>
            <button onClick={function(){
              if(ansicht==="tag"){ setSelectedDay(function(d){return d===6?0:d+1;}); }
              else { setKwOffset(function(o){return o+1;}); }
            }} style={{width:28,height:28,borderRadius:"50%",border:"1px solid "+GB,background:"var(--surface)",cursor:"pointer",fontSize:14}}>&#8250;</button>
            {kwOffset!==0 && <button onClick={function(){setKwOffset(0);setSelectedDay(0);}} style={{padding:"5px 12px",borderRadius:20,border:"1px solid "+GB,background:"var(--surface)",color:"var(--sub)",fontSize:13,cursor:"pointer"}}>Heute</button>}
          </div>
          {ansicht==="tag" && (
            <div style={{display:"flex",gap:4,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              {DAYS.map(function(d,i){
                const isToday = dayDates[i].toDateString()===today.toDateString();
                const isSelected = selectedDay===i;
                return(
                  <button key={i} onClick={function(){setSelectedDay(i);}}
                    style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid "+(isSelected?BK:isToday?"#6366F1":GB),background:isSelected?BK:isToday?"#EEF2FF":"#fff",color:isSelected?"#fff":isToday?"#4F46E5":"#555",fontSize:13,fontWeight:isSelected?700:400,cursor:"pointer",flexShrink:0}}>
                    {d}
                  </button>
                );
              })}
            </div>
          )}
          {kwAusnahmen.length>0 && (
            <span style={{fontSize:13,fontWeight:600,padding:"3px 8px",borderRadius:20,background:"var(--surface)",color:"#D97706",border:"1px solid #FED7AA"}}>
              {kwAusnahmen.length} Ausnahme{kwAusnahmen.length>1?"n":""}
            </span>
          )}
          {/* Team-Filter Dropdown */}
          <select value={teamFilter} onChange={function(e){setTeamFilter(e.target.value);}}
            style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+GB,background:"var(--surface)",fontSize:13,outline:"none",cursor:"pointer",maxWidth:180}}>
            <option value="alle">Alle Mannschaften</option>
            {alleTeams.map(function(t){
              return <option key={t} value={t}>{t}</option>;
            })}
          </select>
          <div style={{flex:1}}/>
          {/* Ansicht-Toggle */}
          <div style={{display:"flex",background:"var(--surface2)",borderRadius:20,padding:3,gap:4}}>
            {[{v:"woche",l:"Woche"},{v:"tag",l:"Tag"}].map(function(a){
              return(
                <button key={a.v} onClick={function(){setAnsicht(a.v);}}
                  style={{padding:"5px 12px",borderRadius:20,border:"none",background:ansicht===a.v?"#fff":"transparent",color:ansicht===a.v?BK:"#999",fontWeight:ansicht===a.v?600:400,fontSize:13,cursor:"pointer",boxShadow:ansicht===a.v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>
                  {a.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gantt Grid */}
      <div style={{background:"var(--surface)",border:"0.5px solid "+GB,borderRadius:12,overflow:"hidden"}}>
          <PlatzGantt
            wochenSlots={ansicht==="tag" ? wochenSlots.map(function(ss,i){ return i===selectedDay?ss:[]; }) : wochenSlots}
            dayDates={dayDates}
            DAYS={ansicht==="tag" ? [DAYS[selectedDay]] : DAYS}
            dagIndexes={ansicht==="tag" ? [selectedDay] : DAYS.map(function(_,i){return i;})}
            today={today}
            displayStart={displayStart}
            displayEnd={displayEnd}
            teamFilter={teamFilter}
            TEAM_COLORS={TEAM_COLORS}
            canEdit={canEdit}
            onClickSlot={function(s){ if(canEdit){setEditSlot(s);setShowSlotModal(true);}}}
            onNewSlot={canEdit ? function(prefill){
              setEditSlot(null);
              setNewSlotPrefill(prefill);
              setShowSlotModal(true);
            } : undefined}
            GB={GB} GR={GR} BK={BK} BL={BL}
          />
      </div>

      {/* Legende */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
        {alleTeams.filter(function(t){return teamFilter==="alle"||t===teamFilter;}).map(function(t){
          return (
            <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,color:"var(--sub)"}}>
              <div style={{width:10,height:10,borderRadius:4,background:TEAM_COLORS[t]||BL}}/>
              {t}
            </div>
          );
        })}
      </div>

      {/* Trainer-Benachrichtigungen */}
      {trainerNachrichten.filter(function(n){return n.type==="training_geloescht";}).length>0 && (
        <div style={{marginTop:12,border:"1px solid #2563EB40",borderRadius:12,overflow:"hidden"}}>
          <div style={{background:"var(--surface)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <span style={{fontSize:13,fontWeight:700,color:BL}}>Training dauerhaft aus dem Plan entfernt</span>
            <button onClick={async function(){
              try{
                const nr = await window.storage.get("trainer_benachrichtigungen");
                if(nr){ const alle=JSON.parse(nr.value).map(function(n){return Object.assign({},n,{gelesen:true});}); await window.storage.set("trainer_benachrichtigungen",JSON.stringify(alle)); setTrainerNachrichten([]); }
              }catch(e){}
            }} style={{fontSize:13,padding:"5px 12px",borderRadius:20,border:"1px solid #2563EB40",background:"var(--surface)",color:BL,cursor:"pointer"}}>Gelesen</button>
          </div>
        </div>
      )}

      {/* Trainer-Absagen Banner */}
      {trainerAbsagen.length>0 && (
        <div style={{marginTop:12,border:"1px solid "+R+"40",borderRadius:12,overflow:"hidden"}}>
          <div style={{background:RL,padding:"10px 14px",borderBottom:"1px solid "+R+"20"}}>
            <span style={{fontSize:13,fontWeight:700,color:R}}>{trainerAbsagen.length} Training{trainerAbsagen.length>1?"s":""} diese Woche vom Trainer abgesagt</span>
          </div>
          {trainerAbsagen.map(function(a,i){
            const slot=(plan?plan.slots||[]:[]||[]).find(function(s){return s.id===a.slot_id;});
            return (
              <div key={i} style={{padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:i<trainerAbsagen.length-1?"0.5px solid "+GB:"none",background:"var(--surface)"}}>
                <div>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{a.team}</span>
                  <span style={{fontSize:13,color:"var(--sub)",marginLeft:8}}>{a.weekday}{slot?" "+fmtTime(slot.start)+"-"+fmtTime(slot.end)+" Uhr":""}</span>
                </div>
                <span style={{fontSize:13,padding:"2px 8px",borderRadius:20,background:RL,color:R,fontWeight:600}}>Abgesagt</span>
              </div>
            );
          })}
          <div style={{padding:"8px 14px",background:"#FFF5F5"}}>
            <span style={{fontSize:13,color:"var(--sub)"}}>Administration wurde automatisch benachrichtigt</span>
          </div>
        </div>
      )}

      {/* Losch-Dialog */}
      {showDeleteDialog&&deleteSlot && (
        <ModalOrSheet open onClose={function(){setShowDeleteDialog(false);setDeleteSlot(null);}} maxWidth={480}>
          <div style={{padding:"0 0 8px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"0.5px solid "+GB}}>
              <div style={{fontWeight:700,fontSize:14}}>Training loeschen</div>
              <button onClick={function(){setShowDeleteDialog(false);setDeleteSlot(null);}} style={{background:"none",border:"none",fontSize:21,cursor:"pointer",color:"var(--sub)"}}>x</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:16}}>
              <div style={{padding:"12px",background:RL,borderRadius:8,border:"1px solid "+R+"30"}}>
                <div style={{fontSize:13,fontWeight:700,color:R,marginBottom:2}}>Training wird dauerhaft aus dem Plan entfernt</div>
                <div style={{fontSize:13,color:"var(--sub)"}}>{deleteSlot.team} - {deleteSlot.weekday} {fmtTime(deleteSlot.start)}-{fmtTime(deleteSlot.end)} Uhr</div>
              </div>
              {deleteSlot.zukunftigeEvents.length>0 ? (
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Welche Termine absagen?</div>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <button onClick={function(){setDeleteSlot(function(s){return Object.assign({},s,{selectedEvIds:new Set(s.zukunftigeEvents.map(function(e){return e.id;}))});});}} style={{fontSize:13,padding:"5px 12px",borderRadius:20,border:"1px solid "+GB,background:"var(--surface)",cursor:"pointer"}}>Alle</button>
                    <button onClick={function(){setDeleteSlot(function(s){return Object.assign({},s,{selectedEvIds:new Set()});});}} style={{fontSize:13,padding:"5px 12px",borderRadius:20,border:"1px solid "+GB,background:"var(--surface)",cursor:"pointer"}}>Keine</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
                    {deleteSlot.zukunftigeEvents.map(function(e){
                      const selected = deleteSlot.selectedEvIds.has(e.id);
                      return (
                        <div key={e.id} onClick={function(){setDeleteSlot(function(s){const next=new Set(s.selectedEvIds);selected?next.delete(e.id):next.add(e.id);return Object.assign({},s,{selectedEvIds:next});});}} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",borderRadius:8,border:"1px solid "+(selected?R:GB),background:selected?RL:"#fff",cursor:"pointer"}}>
                          <div style={{width:16,height:16,borderRadius:4,border:"1.5px solid "+(selected?R:"#ccc"),background:selected?R:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {selected && <span style={{color:"#fff",fontSize:13,fontWeight:700}}>v</span>}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{e.date}</div>
                            <div style={{fontSize:13,color:"var(--sub)"}}>{e.time} Uhr</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{padding:"12px",background:"var(--surface2)",borderRadius:8,fontSize:13,color:"var(--sub)"}}>Keine zukuenftigen Termine vorhanden.</div>
              )}
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){handleSlotDeleteConfirm(deleteSlot,deleteSlot.selectedEvIds);}} style={{flex:1,padding:"8px 14px",borderRadius:10,border:"none",background:R,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  Training loeschen{deleteSlot.selectedEvIds.size>0?" & "+deleteSlot.selectedEvIds.size+" Termin"+(deleteSlot.selectedEvIds.size>1?"e":"")+" absagen":""}
                </button>
                <button onClick={function(){setShowDeleteDialog(false);setDeleteSlot(null);}} style={{padding:"10px 18px",borderRadius:10,border:"1px solid "+GB,background:"var(--surface)",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
              </div>
            </div>
          </div>
        </ModalOrSheet>
      )}

      {/* Slot-Modal */}
      {showSlotModal&&canEdit && (
        <SlotModal
          slot={editSlot}
          prefill={newSlotPrefill}
          plan={plan}
          teams={alleTeams}
          kwKey={kwKey}
          kw={kw}
          monday={monday}
          ausnahmen={kwAusnahmen}
          onSave={handleSlotSave}
          onDelete={editSlot?function(){handleSlotDeleteInit(editSlot.id);}:null}
          onAusnahme={function(a,forAll){handleAusnahmeSave(a,forAll);}}
          onClose={function(){setShowSlotModal(false);setEditSlot(null);setNewSlotPrefill(null);}}
        />
      )}

      {/* Plan-Editor */}
      {showPlanEditor&&canEdit && (
        <PlanEditorModal
          plan={editPlan}
          plaene={plaene}
          onSave={handlePlanSave}
          onClose={function(){setShowPlanEditor(false);setEditPlan(null);}}
        />
      )}
    </div>
    )}

    </div>
  );
}


/* -- Slot-Bearbeitungs-Modal -- */
function PlanEditorModal({plan, plaene, onSave, onClose}){
  const [form, setForm] = useState({
    name: plan?.name||"Neuer Trainingsplan",
    valid_from: plan?.valid_from||new Date().toISOString().split("T")[0],
    valid_until: plan?.valid_until||"",
    active: plan?.active??true,
  });

  return(
    <ModalOrSheet open onClose={onClose} maxWidth={480}>
      <div style={{padding:"0 0 8px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"0.5px solid var(--border)"}}>
          <div style={{fontWeight:700,fontSize:14}}>{plan?.id?"Plan bearbeiten":"Neuer Plan"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:21,cursor:"pointer",color:"var(--sub)"}}>×</button>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Name</div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Gültig ab</div>
              <input type="date" value={form.valid_from} onChange={e=>setForm(f=>({...f,valid_from:e.target.value}))}
                style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Gültig bis</div>
              <input type="date" value={form.valid_until} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))}
                style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"var(--surface2)",borderRadius:8}}>
            <input type="checkbox" id="planAktiv" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}
              style={{width:16,height:16,cursor:"pointer"}}/>
            <label htmlFor="planAktiv" style={{fontSize:13,cursor:"pointer"}}>Plan aktiv (erscheint bei Teams als Termine)</label>
          </div>
          <button onClick={()=>onSave(form)}
            style={{width:"100%",padding:"12px 20px",borderRadius:10,border:"none",background:BTN,color:BTN_TXT,transition:"background 0.15s",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            Speichern
          </button>
        </div>
      </div>
    </ModalOrSheet>
  );
}

/* -- Spiel-Detailansicht Modal (FVRZ-Stil) -- */
/* -- Spiel-Detailansicht Modal (FVRZ-Stil) -- */
function ScheduleTab({role,team,initialSelected}){
  const isMobile=useIsMobile();
  const [selected,setSelected]=useState(initialSelected||null);
  const canEdit=["trainer","administrator","administration"].includes(role);
  const parseGDate=(d)=>{const c=(d||"").replace(/^[A-Za-zÄÖÜäöü]{2,3}\s+/,"").trim();const p=c.split(".");return p.length>=2?`2026-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`:"";}
  useEffect(()=>{
    if(NAV_TARGET.selectedSpiel){
      setSelected(NAV_TARGET.selectedSpiel);
      NAV_TARGET.selectedSpiel=null;
    }
  },[]);
  const allGames=team ? SCHEDULE.filter(g=>g.team===team) : SCHEDULE;
  const playedGames=allGames.filter(g=>g.result).sort((a,b)=>parseGDate(a.date).localeCompare(parseGDate(b.date)));
  const upcomingGames=allGames.filter(g=>!g.result).sort((a,b)=>parseGDate(a.date).localeCompare(parseGDate(b.date)));
  const games=[...playedGames,...upcomingGames];
  const [motmAll,setMotmAll]=useState({
    4:{"demo_voter1":1,"demo_voter2":2,"demo_voter3":2,"demo_voter4":5},
    5:{"demo_voter1":2,"demo_voter2":1,"demo_voter3":3},
  });
  return(
    <>
      {selected&&<SpielDetail spiel={selected} onClose={()=>setSelected(null)} canEdit={canEdit} motmAll={motmAll} setMotmAll={setMotmAll}/>}
      <Card style={{padding:0,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
          <thead>
            <tr style={{background:"var(--surface2)"}}>
              {["Datum","Zeit","Gegner","H/A","Ort","Wettbewerb","Resultat",""].map((h,i)=>(
                <th key={i} style={{padding:"9px 13px",textAlign:"left",fontWeight:600,color:"var(--sub)",fontSize:13,textTransform:"uppercase",letterSpacing:0.4,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((g,i)=>(
              <tr
                key={g.id}
                onClick={()=>setSelected(g)}
                className="hov-row"
                style={{borderTop:"0.5px solid var(--border)",background:g.result?"var(--surface2)":"var(--surface)",cursor:"pointer",height:isMobile?52:40}}>
                <td style={{padding:"11px 13px",fontWeight:600,whiteSpace:"nowrap"}}>{g.date}</td>
                {!isMobile&&<td style={{padding:"9px 13px"}}>{g.time+" Uhr"}</td>}
                <td style={{padding:"9px 13px",fontWeight:600}}>{g.opponent}</td>
                <td style={{padding:"9px 13px"}}><Chip text={g.home?"H":"A"} color={g.home?"#16A34A":"#6B7280"}/></td>
                {!isMobile&&<><td style={{padding:"9px 13px",color:"var(--sub)",fontSize:13}}>{g.venue.split(",")[0]}</td>
                <td style={{padding:"9px 13px",color:"var(--sub)",fontSize:13}}>{g.comp}</td></>}
                <td style={{padding:"9px 13px"}}>{g.result?<span style={{fontWeight:600,fontSize:13,color:"var(--text)"}}>{g.result}{g.htResult&&<span style={{fontWeight:400,fontSize:13,color:"var(--sub)",marginLeft:5}}>({g.htResult})</span>}</span>:<Chip text="Ausstehend" color="#999" bg="#f5f5f5"/>}</td>
                <td style={{padding:"9px 13px",color:"var(--sub)",fontSize:13}}>›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function AttendanceTab({role,team,setActive,onNavigateToSpiel,myRosterId:myRosterIdProp,initialFilter="alle",responses:responsesProp,onResponseChange,allTeams,account,kannSchreiben,kannVerwalten}){
  const isMobile=useIsMobile();
  const isTrainer=["trainer"].includes(role);
  const isAdmin=["administrator","administration","funktionaer"].includes(role);
  const isSpieler=role==="spieler";
  const isEltern=role==="eltern";
  const kinder=account?.kinder||[];
  const hasMultiKinder=isEltern&&kinder.length>1;
  const [activeKind,setActiveKind]=useState(kinder[0]||null);
  const hasMultiTeams=(allTeams&&allTeams.length>1)||(isEltern&&hasMultiKinder);
  const [selectedTeam,setSelectedTeam]=useState("alle");
  useEffect(()=>{setSelectedTeam("alle");},[allTeams?.join(",")]);
  /* Dynamic myId: for eltern use child matching selected team */
  const myId=(()=>{
    if(hasMultiKinder&&allTeams){
      const matchingKind=selectedTeam!=="alle"?kinder.find(k=>k.team===selectedTeam):kinder[0];
      return matchingKind?.rosterId||myRosterIdProp||1;
    }
    return myRosterIdProp||(isSpieler?1:isEltern?1:isTrainer?200:null);
  })();

  /* Events: if allTeams provided show all teams, filtered by selectedTeam or active child */
  const teamEvents=(()=>{
    /* Eltern with multiple kids + allTeams → show all kids' events */
    if(hasMultiKinder&&allTeams&&allTeams.length>0){
      const teams=selectedTeam==="alle"?allTeams:[selectedTeam];
      return ATT_EVENTS.filter(e=>teams.some(t=>e.team===t)||e.subtype==="Vereinsanlass");
    }
    /* Multi-team (trainer) */
    if(allTeams&&allTeams.length>0){
      const teams=selectedTeam==="alle"?allTeams:[selectedTeam];
      return ATT_EVENTS.filter(e=>teams.some(t=>e.team===t)||e.subtype==="Vereinsanlass");
    }
    return team?ATT_EVENTS.filter(e=>e.team===team||e.subtype==="Vereinsanlass"):ATT_EVENTS;
  })();
  const activeTeamForRoster=selectedTeam!=="alle"?selectedTeam:(allTeams?.[0]||team);
  const teamRoster=activeTeamForRoster?ROSTER.filter(p=>(p.teams||[]).includes(activeTeamForRoster)):ROSTER.filter(p=>(p.teams||[]).includes("Cc-Junioren"));

  const [responsesLocal,setResponsesLocal]=useState(ATT_INITIAL);
  const responses=responsesProp||responsesLocal;
  const setResponses=(r)=>{
    if(onResponseChange) onResponseChange(r);
    else setResponsesLocal(r);
  };
  const [selEvent,setSelEvent]=useState(teamEvents[0]?.id||1);
  const [modalOpen,setModalOpen]=useState(()=>{
    if(NAV_TARGET.openEvId){const id=NAV_TARGET.openEvId;NAV_TARGET.openEvId=null;setSelEvent(id);return true;}
    return false;
  });
  const [activeFilters,setActiveFilters]=useState(()=>{
    if(Array.isArray(initialFilter)) return new Set(initialFilter);
    return new Set(initialFilter==="alle"||!initialFilter?[]:[ initialFilter]);
  });
  useEffect(()=>{
    if(Array.isArray(initialFilter)) setActiveFilters(new Set(initialFilter));
    else setActiveFilters(new Set(initialFilter==="alle"||!initialFilter?[]:[ initialFilter]));
  },[initialFilter]);
  const toggleFilter=(f)=>{
    if(f==="alle"){setActiveFilters(new Set());return;}
    setActiveFilters(prev=>{
      const next=new Set(prev);
      next.has(f)?next.delete(f):next.add(f);
      return next;
    });
  };
  const isFilterActive=(f)=>f==="alle"?activeFilters.size===0:activeFilters.has(f);
  const [timeFilter,setTimeFilter]=useState("kommend");
  const [showMoreEvents,setShowMoreEvents]=useState(false);
  const [cancelledEvents,setCancelledEvents]=useState({});
  const [aufgebotState,setAufgebotState]=useState({});
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("aufgebot_state");if(r)setAufgebotState(JSON.parse(r.value));}catch(e){}
    })();
  },[]);
  const toggleAufgebot=(evId,pid)=>{
    setAufgebotState(prev=>{
      const evList=prev[evId]||[];
      const next=evList.includes(pid)?evList.filter(x=>x!==pid):[...evList,pid];
      const updated={...prev,[evId]:next};
      window.storage.set("aufgebot_state",JSON.stringify(updated)).catch(()=>{});
      return updated;
    });
  };
  const isInAufgebot=(evId,pid)=>(aufgebotState[evId]||[]).includes(pid);
  useEffect(()=>{
    (async()=>{try{const r=await window.storage.get("cancelled_events");if(r)setCancelledEvents(JSON.parse(r.value));}catch(e){}}
    )();
  },[]);
  const toggleCancel=(evId)=>{
    setCancelledEvents(prev=>{
      const next={...prev,[evId]:!prev[evId]};
      window.storage.set("cancelled_events",JSON.stringify(next)).catch(()=>{});

      // Sync mit GANTT: Training-Event → Ausnahme in trainingsAusnahmen schreiben
      const ev=ATT_EVENTS.find(e=>e.id===evId&&e.type==="Training");
      if(ev){
        (async()=>{
          try{
            // KW berechnen
            const [wd,dm]=ev.date.split(" ");
            const [day,mon,yr]=(dm||ev.date).split(".").map(Number);
            const evDate=new Date(yr||2026,mon-1,day);
            const jan4=new Date(evDate.getFullYear(),0,4);
            const kw=Math.ceil(((evDate-jan4)/86400000+jan4.getDay()+1)/7);
            const kwKey=`${evDate.getFullYear()}_${kw}`;

            // Passenden GANTT-Slot finden
            const WOCHENTAGE=["So","Mo","Di","Mi","Do","Fr","Sa"];
            const weekday=WOCHENTAGE[evDate.getDay()];
            const r=await window.storage.get("trainingsPlaene");
            if(r){
              const plaene=JSON.parse(r.value);
              const aktiverPlan=plaene.find(p=>p.active)||plaene[0];
              const matchSlot=aktiverPlan?.slots?.find(s=>
                s.weekday===weekday&&s.team===ev.team
              );
              if(matchSlot){
                const ar=await window.storage.get("trainingsAusnahmen");
                const ausnahmen=ar?JSON.parse(ar.value):{};
                const kwAusnahmen=ausnahmen[kwKey]||[];
                const isCancelling=!prev[evId]; // next state
                let newKwAusnahmen;
                if(isCancelling){
                  // Absage hinzufügen
                  newKwAusnahmen=[
                    ...week_nrAusnahmen.filter(a=>!(a.slot_id===matchSlot.id&&a.type==="absage")),
                    {type:"absage",slot_id:matchSlot.id,weekday,team:ev.team,evId,von_termin:true}
                  ];
                } else {
                  // Absage rückgängig
                  newKwAusnahmen=kwAusnahmen.filter(a=>!(a.slot_id===matchSlot.id&&a.type==="absage"&&a.von_termin));
                }
                await window.storage.set("trainingsAusnahmen",JSON.stringify({...ausnahmen,[kwKey]:newKwAusnahmen}));

                // Benachrichtigung für Administration
                if(isCancelling){
                  const nr=await window.storage.get("admin_benachrichtigungen");
                  const bestehende=nr?JSON.parse(nr.value):[];
                  const neue=[...bestehende,{
                    id:Date.now(),
                    type:"training_absage",
                    titel:`Training abgesagt: ${ev.team}`,
                    inhalt:`${weekday} ${ev.date} · ${ev.time} Uhr · abgesagt vom Trainer`,
                    team:ev.team,
                    datum:ev.date,
                    gelesen:false,
                    created_at:new Date().toISOString(),
                  }];
                  await window.storage.set("admin_benachrichtigungen",JSON.stringify(neue));
                }
              }
            }
          }catch(e){}
        })();
      }
      return next;
    });
  };
  const [showNoteFor,setShowNoteFor]=useState(null);
  const [attLoaded,setAttLoaded]=useState(false);

  /* Load persisted responses on mount */
  if(!attLoaded){
    setAttLoaded(true);
    (async()=>{
      try{
        const res=await window.storage.get("att_responses");
        if(res){
          const stored=JSON.parse(res.value);
          const merged={...ATT_INITIAL};
          Object.keys(stored).forEach(evId=>{merged[evId]={...ATT_INITIAL[evId],...stored[evId]};});
          setResponses(merged);
        }
      }catch(e){}
    })();
  }

  const saveResp=(newResp)=>{
    setResponses(newResp);
    /* Only persist user-changed entries (delta vs ATT_INITIAL) */
    const delta={};
    Object.keys(newResp).forEach(evId=>{
      Object.keys(newResp[evId]||{}).forEach(pid=>{
        const cur=newResp[evId]?.[pid]?.status;
        const init=ATT_INITIAL[evId]?.[pid]?.status;
        if(cur!==init){
          if(!delta[evId]) delta[evId]={};
          delta[evId][pid]=newResp[evId][pid];
        }
      });
    });
    window.storage.set("att_responses",JSON.stringify(delta)).catch(()=>{});
  };

  const parseEvDate2=(d)=>{
    if(!d) return "";
    const c=d.replace(/^[A-Za-zÄÖÜäöü]{2,3}\s+/,"").trim();
    const p=c.split(".");
    return p.length>=2?`2026-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`:"";
  };
  const TODAY="2026-05-23";
  const isPast=(ev)=>parseEvDate2(ev.date)<TODAY;

  const getResp=(evId,pid)=>{
    const stored=responses[evId]?.[pid];
    if(stored?.status) return stored;
    const ev=ATT_EVENTS.find(e=>e.id===evId);
    if(ev?.type==="Training") return {status:"zu",note:""};
    return {status:null,note:""};
  };

  const setResp=(evId,pid,status,note)=>{
    const updated={
      ...responses,
      [evId]:{...responses[evId],[pid]:{status,note:note!==undefined?note:(responses[evId]?.[pid]?.note||"")}}
    };
    saveResp(updated);
  };

  const evCounts=(ev)=>{
    const pids=teamRoster.map(p=>p.id);
    return{
      zu:      pids.filter(id=>getResp(ev.id,id).status==="zu").length,
      ab:      pids.filter(id=>getResp(ev.id,id).status==="ab").length,
      unent:   pids.filter(id=>getResp(ev.id,id).status==="unentschuldigt").length,
      aufgebot:pids.filter(id=>isInAufgebot(ev.id,id)).length,
      frag:    pids.filter(id=>getResp(ev.id,id).status==="fraglich").length,
      offen:   pids.filter(id=>!getResp(ev.id,id).status).length,
      total:   pids.length,
    };
  };

  const STATUS_CFG={
    "zu":             {label:"Zusage",        color:GN,    bg:"#ECFDF5", icon:"✓"},
    "ab":             {label:"Absage",         color:R,     bg:RL,        icon:"✕"},
    "unentschuldigt": {label:"Unentschuldigt", color:AM, bg:"#FFF7ED", icon:"!"},
    "fraglich":       {label:"Fraglich",       color:AM,    bg:"#FFFBEB", icon:"?"},
    "aufgebot":       {label:"Aufgebot",     color:"var(--cc-accent)",bg:"#EEF2FF",icon:"ball-football"},
    null:             {label:"Ausstehend",     color:"var(--sub)",bg:"#f5f5f5", icon:"-"},
  };

  const parseEvDate=(d)=>{
    if(!d) return "";
    const clean=d.replace(/^[A-Za-zÄÖÜäöü]{2,3}\s+/,"").trim();
    const parts=clean.split(".");
    if(parts.length>=2) return `2026-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
    return "";
  };
  const filteredEvents=teamEvents
    .filter(e=>timeFilter==="alle"||(timeFilter==="kommend"&&!isPast(e))||(timeFilter==="vergangen"&&isPast(e)))
    .filter(e=>{
      if(activeFilters.size===0) return true;
      if(activeFilters.has("training")&&e.type==="Training") return true;
      if(activeFilters.has("spiele")&&e.type==="Spiel") return true;
      if(activeFilters.has("team-event")&&e.type==="Veranstaltung"&&e.subtype==="Team-Event") return true;
      if(activeFilters.has("vereinsanlass")&&e.type==="Veranstaltung"&&e.subtype==="Vereinsanlass") return true;
      return false;
    })
    .sort((a,b)=>{
      const da=parseEvDate(a.date), db=parseEvDate(b.date);
      return timeFilter==="vergangen"?String(db||"").localeCompare(String(da||"")):String(da||"").localeCompare(String(db||""));
    });
  const selEv=teamEvents.find(e=>e.id===selEvent)||teamEvents[0];

  /* Modal state - shared between trainer and spieler/eltern views */
  const [editingDeadline,setEditingDeadline]=useState(false);
  const [deadlines,setDeadlines]=useState(()=>Object.fromEntries(ATT_EVENTS.map(e=>[e.id,e.deadline||""])));
  const [autoReminder,setAutoReminder]=useState(()=>Object.fromEntries(ATT_EVENTS.map(e=>[e.id,true])));
  const [reminderTimes,setReminderTimes]=useState(()=>Object.fromEntries(ATT_EVENTS.map(e=>[e.id,"3h"])));
  const REMINDER_OPTIONS=[
    {v:"30m",l:"30 Min. vorher"},
    {v:"1h", l:"1 Std. vorher"},
    {v:"2h", l:"2 Std. vorher"},
    {v:"3h", l:"3 Std. vorher"},
    {v:"6h", l:"6 Std. vorher"},
    {v:"12h",l:"12 Std. vorher"},
    {v:"24h",l:"1 Tag vorher"},
    {v:"48h",l:"2 Tage vorher"},
  ];

  const getReminderTime=(dl)=>{
    if(!dl) return null;
    try{
      const parts=dl.split(",");
      const datePart=parts[0].trim();
      const timePart=(parts[1]||"").trim();
      if(!timePart) return null;
      const [h,m]=timePart.split(":").map(Number);
      let rh=h-3;
      const rday=rh<0?"Vortag":"";
      if(rh<0) rh+=24;
      return `${datePart}${rday?" ("+rday+")":""}, ${String(rh).padStart(2,"0")}:${String(m).padStart(2,"0")} Uhr`;
    }catch(e){return null;}
  };

  const openEvent=(id)=>{setSelEvent(id);setModalOpen(true);setEditingDeadline(false);};

  /* Trainer notes per event */
  const [trainerNotes,setTrainerNotes]=useState({});
  const [editingNote,setEditingNote]=useState(false);
  const [besammlungen,setBesammlungen]=useState(()=>Object.fromEntries(ATT_EVENTS.map(e=>[e.id,
    e.treffpunkt?{date:e.date||"",time:(e.treffpunkt.match(/^\d{2}:\d{2}/)||[""])[0],ort:e.treffpunkt.replace(/^\d{2}:\d{2}\s*/,"")}:
    {date:"",time:"",ort:""}
  ])));
  const [editingBesammlung,setEditingBesammlung]=useState(false);
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get("trainer_notes");if(r)setTrainerNotes(JSON.parse(r.value));}catch(e){}
      try{const r=await window.storage.get("besammlungen");if(r)setBesammlungen(prev=>({...prev,...JSON.parse(r.value)}));}catch(e){}
    })();
  },[]);
  const saveTrainerNote=(evId,text)=>{
    const updated={...trainerNotes,[evId]:text};
    setTrainerNotes(updated);
    window.storage.set("trainer_notes",JSON.stringify(updated)).catch(()=>{});
  };
  const saveBesammlung=(evId,field,value)=>{
    const updated={...besammlungen,[evId]:{...(besammlungen[evId]||{}),date:"",time:"",ort:"",...besammlungen[evId],[field]:value}};
    setBesammlungen(updated);
    window.storage.set("besammlungen",JSON.stringify(updated)).catch(()=>{});
  };

  const canEditEvent=(ev)=>{
    if(!ev) return false;
    /* Stufe aus Portalverwaltung prüfen falls verfügbar */
    if(kannVerwalten&&!kannVerwalten("events")) return false;
    const typ=ev.subtype==="Vereinsanlass"?"vereinsanlass":ev.subtype==="Team-Event"?"team_event":ev.type==="Spiel"?"spiel":"training";
    return kannTerminBearbeiten(role, typ, ev.team, allTeams||[team]);
  };

  const canCreateEvent=(typ="team_event")=>{
    return kannTerminErstellen(role, typ, null, allTeams||[team]);
  };

  const canDeleteEvent=(ev)=>{
    if(!ev) return false;
    const typ=ev.subtype==="Vereinsanlass"?"vereinsanlass":ev.subtype==="Team-Event"?"team_event":ev.type==="Spiel"?"spiel":"training";
    return kannTerminAbsagen(role, typ, ev.team, allTeams||[team]);
  };

  /* Spieler/Eltern: gleiche Kartenansicht wie Trainer */
  if(!isTrainer&&myId){
    return(
      <div>
        {/* Modal auch für Spieler/Eltern */}
        {modalOpen&&selEv&&(
          <div onClick={()=>setModalOpen(false)} style={isMobile?{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"rgba(0,0,0,0.5)"}:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div onClick={e=>e.stopPropagation()} style={isMobile?{position:"relative",background:"var(--surface)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,0.18)"}:{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>
              {/* Header */}
              {(()=>{
                const hBg=selEv.type==="Spiel"?"#EFF6FF":selEv.subtype==="Vereinsanlass"?"linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)":selEv.type==="Veranstaltung"?`linear-gradient(135deg,${AM} 0%,#b45309 100%)`:"#F0FDF4";
                const hLight=selEv.type==="Spiel"||selEv.type==="Training";
                const hTxt=hLight?"#1a1a1a":"#fff";
                const hTxtSub=hLight?"rgba(0,0,0,0.5)":"rgba(255,255,255,0.75)";
                const hBtn=hLight?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.18)";
                return(
                  <div style={{background:hBg,borderRadius:"20px 20px 0 0",padding:"20px 22px",color:"#fff"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <span style={{background:hBtn,color:hTxt,fontSize:13,fontWeight:700,padding:"3px 10px",borderRadius:20,textTransform:"uppercase",letterSpacing:0.6}}>{selEv.subtype||selEv.type}</span>
                      <button onClick={()=>setModalOpen(false)} style={{background:hBtn,border:"none",borderRadius:"50%",width:30,height:30,color:hTxt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                    <div style={{fontWeight:800,fontSize:21,lineHeight:1.2,marginBottom:12,color:hTxt}}>
                      {selEv.opponent?"vs. "+selEv.opponent:selEv.type==="Training"?"Training":selEv.title||selEv.type}
                    </div>
                    {/* Info Pills */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><TI n="calendar" style={{marginRight:3}}/> {selEv.date}{selEv.endDate?" - "+selEv.endDate:""}</span>
                      <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><TI n="clock" style={{marginRight:3}}/> {selEv.time} Uhr</span>
                      <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><TI n="map-pin" style={{marginRight:3}}/> {selEv.location}</span>
                      {selEv.treffpunkt&&<span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><TI n="target" style={{marginRight:3}}/> {selEv.treffpunkt}</span>}
                    </div>
                  </div>
                );
              })()}
              {/* Beschreibung */}
              {selEv.description&&(
                <div style={{padding:"14px 20px",borderBottom:"0.5px solid var(--border)",display:"flex",gap:12,background:"var(--surface)"}}>
                  <span style={{fontSize:16,flexShrink:0}}>ℹ️</span>
                  <p style={{margin:0,fontSize:13,color:"var(--text)",lineHeight:1.65}}>{selEv.description}</p>
                </div>
              )}
              {/* Weitere Informationen */}
              {(trainerNotes[selEv.id]||besammlungen[selEv.id])&&(
                <div style={{padding:"14px 20px",borderBottom:"0.5px solid var(--border)",background:"var(--surface)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>≡ Weitere Informationen</div>
                  {besammlungen[selEv.id]&&(besammlungen[selEv.id].time||besammlungen[selEv.id].location)&&(
                    <div style={{marginBottom:trainerNotes[selEv.id]?8:0}}>
                      <div style={{fontSize:13,color:"var(--sub)",fontWeight:600,marginBottom:2}}><TI n="target" style={{marginRight:3}}/> Treffpunkt</div>
                      <div style={{fontSize:13,color:"var(--text)",fontWeight:600}}>
                        {besammlungen[selEv.id].date&&<span style={{marginRight:8}}><TI n="calendar" style={{marginRight:3}}/> {besammlungen[selEv.id].date}</span>}
                        {besammlungen[selEv.id].time&&<span style={{marginRight:8}}><TI n="clock" style={{marginRight:3}}/> {besammlungen[selEv.id].time} Uhr</span>}
                        {besammlungen[selEv.id].location&&<span><TI n="target" style={{marginRight:3}}/> {besammlungen[selEv.id].location}</span>}
                      </div>
                    </div>
                  )}
                  {trainerNotes[selEv.id]&&(
                    <div>
                      <div style={{fontSize:13,color:"var(--sub)",fontWeight:600,marginBottom:2}}><TI n="edit" style={{marginRight:3}}/> Bemerkungen</div>
                      <p style={{margin:0,fontSize:13,color:"#1a3a2a",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{trainerNotes[selEv.id]}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Zum Spielplan Link bei Spielen */}
              {selEv.type==="Spiel"&&onNavigateToSpiel&&(
                <div style={{padding:"10px 20px",background:"var(--surface)",borderBottom:`0.5px solid #DBEAFE`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,color:BL,fontWeight:600}}><TI n="ball-football" style={{marginRight:4}}/> Dieses Spiel im Spielplan ansehen</span>
                  <button onClick={()=>{const match=SCHEDULE.find(g=>g.date===selEv.date&&g.opponent===selEv.opponent);setModalOpen(false);if(match)onNavigateToSpiel(match);}}
                    style={{fontSize:13,fontWeight:700,color:BL,background:"var(--surface)",border:`1px solid ${BL}`,borderRadius:20,padding:"5px 12px",cursor:"pointer"}}>
                    Zum Spielplan →
                  </button>
                </div>
              )}
              {/* Eigene RSVP */}
              {selEv.rsvp!==false&&(
                <div style={{padding:"14px 20px"}}>
                  {/* Aufgebot-Banner für Spieler/Eltern */}
                  {!isTrainer&&!isAdmin&&isInAufgebot(selEv.id,myId)&&(
                    <div style={{background:"var(--surface)",border:"1.5px solid #818CF8",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:18}}><TI n="ball-football"/></span>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:"var(--cc-accent)"}}>Du bist im Aufgebot!</div>
                        <div style={{fontSize:13,color:"var(--sub)",marginTop:2}}>
                          {selEv.treffpunkt?`Treffpunkt: ${selEv.treffpunkt}`:"Treffpunkt folgt"}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Aufgebotene Mitspieler */}
                  {!isTrainer&&!isAdmin&&selEv.type==="Spiel"&&(()=>{
                    const ichSelbst=teamRoster.find(p=>p.id===myId);
                    const mitspieler=teamRoster.filter(p=>p.id!==myId&&isInAufgebot(selEv.id,p.id));
                    const alleAufgebotene=[...(isInAufgebot(selEv.id,myId)&&ichSelbst?[{...ichSelbst,ich:true}]:[]),...mitspieler];
                    if(alleAufgebotene.length===0) return null;
                    return(
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Aufgebot ({alleAufgebotene.length})</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {alleAufgebotene.map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:p.ich?"#4F46E5":"#EEF2FF",borderRadius:8}}>
                              <Av name={p.name} size={26} bg={p.ich?"rgba(255,255,255,0.3)":"#6366F1"}/>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:700,color:p.ich?"#fff":"#4F46E5"}}>{p.firstName} {p.lastName}{p.ich?" (Du)":""}</div>
                                {p.pos&&p.pos!=="-"&&<div style={{fontSize:13,color:p.ich?"rgba(255,255,255,0.7)":"#818CF8"}}>{p.pos}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Meine Rückmeldung</div>
                  <div style={{display:"flex",gap:12}}>
                    {["zu","ab"].map(s=>{
                      const resp=getResp(selEv.id,myId);
                      const active=resp.status===s;
                      return(
                        <button key={s} onClick={()=>setResp(selEv.id,myId,active?null:s)}
                          style={{flex:1,padding:"8px 14px",borderRadius:10,border:`1.5px solid ${active?(s==="zu"?GN:R):GB}`,background:active?(s==="zu"?"#ECFDF5":RL):"#fff",color:active?(s==="zu"?GN:R):"#888",fontWeight:active?700:400,fontSize:13,cursor:"pointer"}}>
                          {s==="zu"?"✓ Zusagen":"✕ Absagen"}
                        </button>
                      );
                    })}
                  </div>
                  {getResp(selEv.id,myId).status==="ab"&&(
                    <textarea value={getResp(selEv.id,myId).note||""} onChange={e=>setResp(selEv.id,myId,"ab",e.target.value)}
                      placeholder="Begründung (optional)…" rows={2}
                      style={{width:"100%",marginTop:8,padding:"6px 9px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:FONT}}/>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Statistik-Header */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:14}}>
          {(()=>{
            const rsvpEvs=teamEvents.filter(e=>!(e.subtype==="Vereinsanlass"&&e.rsvp===false));
            const spielTrainEvs=rsvpEvs.filter(e=>e.type==="Training"||e.type==="Spiel");

            /* Vergangene Events → Anwesenheitsquote */
            const pastST=spielTrainEvs.filter(e=>isPast(e));
            const pastZu=pastST.filter(e=>getResp(e.id,myId).status==="zu").length;
            const pastPct=pastST.length?Math.round(pastZu/pastST.length*100):null;

            /* Trainings */
            const pastTrain=spielTrainEvs.filter(e=>e.type==="Training"&&isPast(e));
            const pastTrainZu=pastTrain.filter(e=>getResp(e.id,myId).status==="zu").length;
            const trainPct=pastTrain.length?Math.round(pastTrainZu/pastTrain.length*100):null;

            /* Spiele */
            const pastSpiele=spielTrainEvs.filter(e=>e.type==="Spiel"&&isPast(e));
            const pastSpieleZu=pastSpiele.filter(e=>getResp(e.id,myId).status==="zu").length;
            const spielPct=pastSpiele.length?Math.round(pastSpieleZu/pastSpiele.length*100):null;

            const fmt=(pct,zu,total,label)=>pct!==null?[pct+"%",zu+"/"+total+" "+label]:["-","Noch keine "+label];
            const col=(pct)=>pct===null?"#aaa":pct>=80?GN:pct>=60?AM:R;

            const [tv,ts]=fmt(pastPct,pastZu,pastST.length,"Spiele & Trainings");
            const [trv,trs]=fmt(trainPct,pastTrainZu,pastTrain.length,"Trainings");
            const [spv,sps]=fmt(spielPct,pastSpieleZu,pastSpiele.length,"Spiele");
            return[
              <Stat key="t"  label="Anwesenheit Total" value={tv}  sub={ts}  color={col(pastPct)}/>,
              <Stat key="tr" label="Trainings"          value={trv} sub={trs} color={col(trainPct)}/>,
              <Stat key="sp" label="Spiele"             value={spv} sub={sps} color={col(spielPct)}/>,
            ];
          })()}
        </div>

        {/* Team-Filter (nur wenn mehrere Teams) */}
        {hasMultiTeams&&(
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{fontSize:13,color:"var(--sub)",fontWeight:600,alignSelf:"center",marginRight:2}}>{isEltern?"Kind:":"Team:"}</span>
            {["alle",...allTeams].map(t=>{
              const active=selectedTeam===t;
              const kind=isEltern?kinder.find(k=>k.team===t):null;
              const label=t==="alle"?(isEltern?"Alle Kinder":"Alle Teams"):kind?`${kind.name.split(" ")[0]} · ${t}`:t;
              return(
                <button key={t} onClick={()=>setSelectedTeam(t)}
                  style={{padding:"5px 12px",borderRadius:20,border:`0.5px solid ${active?ACCENT:GB}`,background:active?"var(--cc-hover)":"#fff",color:"var(--text)",fontSize:13,fontWeight:active?700:400,cursor:"pointer"}}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {/* Filter */}
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:14}}>
          {/* Typ-Pills scrollbar */}
          <div style={{display:"flex",alignItems:"center",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",flex:1,minWidth:0}}>
            {[
              {k:"alle",l:"Alle"},
              {k:"training",l:"Trainings"},
              {k:"spiele",l:"Spiele"},
              {k:"team-event",l:"Teamevents"},
              {k:"vereinsanlass",l:"Vereinsanlass"},
            ].map(f=>{
              const active=isFilterActive(f.k);
              return(
                <button key={f.k} onClick={()=>toggleFilter(f.k)}
                  style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${active?"#1A1A1A":GB}`,background:active?"#1A1A1A":"transparent",color:active?"#fff":"#666",fontSize:13,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                  {f.l}
                </button>
              );
            })}
          </div>
          {/* Zeit-Toggle - eigene Zeile auf Mobile durch flex-basis 100% */}
          <button onClick={()=>setTimeFilter(p=>p==="kommend"?"vergangen":"kommend")}
            style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--sub)",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,flexBasis:"100%",transition:"all 0.15s"}}>
            <span style={{fontSize:13,opacity:0.6}}>{"▾"}</span>
            <span>{timeFilter==="kommend"?"Vergangene Termine":"Kommende Termine"}</span>
          </button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(showMoreEvents?filteredEvents:filteredEvents.slice(0,5)).map(ev=>{
            const resp=getResp(ev.id,myId);
            const past=isPast(ev);
            const accentColor=ev.type==="Spiel"?BL:ev.subtype==="Vereinsanlass"?"#7C3AED":ev.type==="Veranstaltung"?AM:GN;
            const dateParts=ev.date.split(" ");
            const weekday=dateParts[0]||"";
            const dayMonth=dateParts[1]||ev.date;
            const MONTHS=["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
            const dayNum=dayMonth.split(".")[0];
            const monNum=parseInt(dayMonth.split(".")[1])||0;
            const monName=MONTHS[monNum]||"";
            const isZu=resp.status==="zu";
            const isAb=resp.status==="ab";
            const isCancelled=!!cancelledEvents[ev.id];
            const canCancel=isTrainer&&!past&&(ev.type==="Training"||ev.subtype==="Team-Event");
            const showRsvp=!past&&!canCancel&&!(ev.subtype==="Vereinsanlass"&&ev.rsvp===false);
            const inAufgebot=!past&&isInAufgebot(ev.id,myId);

            return(
              <div key={ev.id}
                onMouseEnter={e=>e.currentTarget.style.background=isCancelled?"#FFF5F5":"#FAFAF8"}
                onMouseLeave={e=>e.currentTarget.style.background=isCancelled?"#FFF5F5":"var(--surface)"}
                style={{
                background:isCancelled?"#FFF5F5":"#fff",
                border:"0.5px solid var(--border)",
                borderRadius:14,
                overflow:"hidden",
                display:"flex",
                flexDirection:"column",
                opacity:past?0.65:1,
              }}>
                {/* Haupt-Inhalt */}
                <div onClick={()=>openEvent(ev.id)} style={{flex:1,padding:"12px 14px",minWidth:0,display:"flex",alignItems:"center",gap:16,cursor:"pointer"}}>
                  {/* Datum-Block */}
                  <div style={{width:62,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--surface2)",borderRadius:10,padding:"8px 6px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{weekday}</div>
                    <div style={{fontSize:18,fontWeight:700,color:"var(--text)",lineHeight:1}}>{dayNum}</div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{monName}</div>
                  </div>
                  {/* Text */}
                  <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{fontWeight:600,fontSize:14,color:isCancelled?"#aaa":"#1A1A1A",textDecoration:isCancelled?"line-through":"none"}}>
                        {ev.opponent?"vs. "+ev.opponent:ev.type==="Training"?"Training · "+ev.team:ev.title||ev.type}
                      </div>
                      <span style={{background:accentColor+"18",color:accentColor,fontSize:13,fontWeight:700,padding:"2px 8px",borderRadius:20,flexShrink:0}}>
                        {ev.subtype||ev.type}
                      </span>
                      {isCancelled&&<span style={{fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:20,background:RL,color:R,flexShrink:0}}>⚠ Abgesagt</span>}
                      {inAufgebot&&<span style={{fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:20,background:"var(--surface)",color:"var(--cc-accent)",flexShrink:0}}><TI n="ball-football" style={{marginRight:3}}/> Aufgebot</span>}
                      {past&&<span style={{fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:20,background:isZu?"#ECFDF5":isAb?RL:"#F3F4F6",color:isZu?GN:isAb?R:"#aaa",flexShrink:0}}>{isZu?"✓ Anwesend":isAb?"✕ Abwesend":"-"}</span>}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"2px 6px",fontSize:13,color:"var(--sub)"}}>
                      <span><TI n="clock" style={{marginRight:3}}/> {ev.time} Uhr</span>
                      {ev.type==="Spiel"&&ev.treffpunkt&&(<>
                        <span style={{color:"var(--border)"}}>·</span>
                        <span><TI n="target" style={{marginRight:3}}/> <span style={{fontWeight:600,color:"var(--sub)"}}>Treffpunkt: </span>{ev.treffpunkt}</span>
                      </>)}
                    </div>
                  </div>
                </div>

                {/* RSVP-Buttons - segmentierter Toggle */}
                {showRsvp&&(
                  <div style={{padding:"10px 12px",borderTop:"0.5px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",background:"var(--surface2)",borderRadius:10,padding:3,gap:4}}>
                      <button onClick={()=>setResp(ev.id,myId,isZu?null:"zu")}
                        style={{flex:1,padding:"8px 14px",border:"none",borderRadius:8,background:isZu?"#16A34A":"transparent",color:isZu?"#fff":(!isZu&&!isAb)?"#888":"#bbb",fontSize:13,fontWeight:isZu?700:400,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:14}}>▲</span>
                        <span>{isZu?"Zugesagt":"Zusagen"}</span>
                      </button>
                      <div style={{width:1,background:GB,flexShrink:0,margin:"4px 0"}}/>
                      <button onClick={()=>setResp(ev.id,myId,isAb?null:"ab")}
                        style={{flex:1,padding:"8px 14px",border:"none",borderRadius:8,background:isAb?"#DC2626":"transparent",color:isAb?"#fff":(!isZu&&!isAb)?"#888":"#bbb",fontSize:13,fontWeight:isAb?700:400,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:14}}>▽</span>
                        <span>{isAb?"Abgesagt":"Absagen"}</span>
                      </button>
                    </div>
                  </div>
                )}
                {showRsvp&&isAb&&(
                  <div style={{borderTop:"0.5px solid var(--border)",padding:"8px 12px"}} onClick={e=>e.stopPropagation()}>
                    <textarea value={resp.note} onChange={e=>setResp(ev.id,myId,"ab",e.target.value)}
                      placeholder="Begründung (optional)…" rows={2}
                      style={{width:"100%",padding:"6px 9px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:FONT}}/>
                  </div>
                )}
                {canCancel&&(
                  <div style={{borderTop:"0.5px solid var(--border)",display:"flex",justifyContent:"flex-end",padding:"8px 12px"}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>toggleCancel(ev.id)}
                      style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${isCancelled?R:GB}`,background:isCancelled?RL:"transparent",color:isCancelled?R:"#bbb",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      {isCancelled?"↩ Rückgängig":"✕ Absagen"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filteredEvents.length>5&&(
            <button onClick={()=>setShowMoreEvents(p=>!p)}
              style={{padding:'12px 0',borderRadius:12,border:"0.5px solid var(--border)",background:'#fff',color:'#555',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%'}}>
              {showMoreEvents?`↑ Weniger anzeigen`:`+ ${filteredEvents.length-5} weitere anzeigen`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return(
    <div>
      {/* Modal */}
      {modalOpen&&selEv&&(
        <div onClick={()=>setModalOpen(false)} style={isMobile?{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end",background:"rgba(0,0,0,0.5)"}:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={isMobile?{position:"relative",background:"var(--surface)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,0.18)"}:{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth:660,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>
            {/* Modal Header */}
            {(()=>{
              const hBg=selEv.type==="Spiel"?"#EFF6FF":selEv.subtype==="Vereinsanlass"?"linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)":selEv.type==="Veranstaltung"?`linear-gradient(135deg,${AM} 0%,#b45309 100%)`:"#F0FDF4";
                const hLight=selEv.type==="Spiel"||selEv.type==="Training";
                const hTxt=hLight?"#1a1a1a":"#fff";
                const hTxtSub=hLight?"rgba(0,0,0,0.5)":"rgba(255,255,255,0.75)";
                const hBtn=hLight?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.18)";
              return(
                <div style={{background:hBg,borderRadius:"20px 20px 0 0",padding:"20px 22px",overflow:"hidden"}}>
                  {cancelledEvents[selEv.id]&&(
                    <div style={{background:hBtn,borderRadius:10,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,border:"0.5px solid rgba(0,0,0,0.1)"}}>
                      <span style={{fontSize:16}}>⚠</span>
                      <span style={{color:hTxt,fontWeight:700,fontSize:13}}>Dieser Termin wurde abgesagt</span>
                      {isTrainer&&<button onClick={()=>toggleCancel(selEv.id)} style={{marginLeft:"auto",fontSize:13,padding:"3px 10px",borderRadius:20,border:"0.5px solid rgba(255,255,255,0.4)",background:"transparent",color:"#fff",cursor:"pointer",fontWeight:600}}>↩ Rückgängig</button>}
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <span style={{background:hBtn,color:hTxt,fontSize:13,fontWeight:700,padding:"3px 10px",borderRadius:20,letterSpacing:0.8,textTransform:"uppercase"}}>
                      {selEv.subtype||selEv.type}
                    </span>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      {isTrainer&&!isPast(selEv)&&(selEv.type==="Training"||selEv.subtype==="Team-Event")&&(
                        <button onClick={()=>toggleCancel(selEv.id)}
                          style={{display:"flex",alignItems:"center",gap:8,background:cancelledEvents[selEv.id]?hBtn:hBtn,border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:20,padding:"5px 12px",cursor:"pointer",color:hTxt,fontSize:13,fontWeight:700}}>
                          {cancelledEvents[selEv.id]?"↩ Reaktivieren":"✕ Training absagen"}
                        </button>
                      )}
                      <button onClick={()=>setModalOpen(false)}
                        style={{background:hBtn,border:"none",borderRadius:"50%",width:30,height:30,color:hTxt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  </div>
                  <div style={{color:hTxt,fontWeight:800,fontSize:21,lineHeight:1.15,marginBottom:12,letterSpacing:-0.3}}>
                    {selEv.opponent?"vs. "+selEv.opponent:selEv.type==="Training"?"Training":selEv.title||selEv.type}
                  </div>
                  {/* Info Pills */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                    <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20}}><TI n="calendar" style={{marginRight:3}}/> {selEv.date}{selEv.endDate?" - "+selEv.endDate:""}</span>
                    <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20}}><TI n="clock" style={{marginRight:3}}/> {selEv.time} Uhr</span>
                    <span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20}}><TI n="map-pin" style={{marginRight:3}}/> {selEv.location}</span>
                    {(()=>{const b=besammlungen[selEv.id]||{};const t=b.time||"";const o=b.location||selEv.treffpunkt||"";return (t||o)?<span style={{background:hBtn,color:hTxt,fontSize:13,padding:"4px 10px",borderRadius:20}}><TI n="target" style={{marginRight:3}}/> {t?t+" Uhr":""}{t&&o?" · ":""}{o}</span>:null;})()}
                  </div>
                  {/* Deadline & Erinnerung - für alle editierbaren Events */}
                  {canEditEvent(selEv)&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",paddingTop:10,borderTop:"0.5px solid rgba(0,0,0,0.1)"}}>
                      <span style={{color:hTxtSub,fontSize:13,fontWeight:700,letterSpacing:0.5}}>⏰ DEADLINE</span>
                      {editingDeadline?(
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="date"
                            defaultValue={(()=>{const d=deadlines[selEv.id];if(!d)return"";try{const p=d.split(",")[0].trim().replace(/^\S+\s+/,"").split(".");return `2026-${p[1]?.padStart(2,"0")}-${p[0]?.padStart(2,"0")}`;}catch(e){return "";}})()}
                            onBlur={e=>{const d=e.target.value;if(d){const[y,m,day]=d.split("-");const days=["So","Mo","Di","Mi","Do","Fr","Sa"];const wd=days[new Date(d).getDay()];const time=(deadlines[selEv.id]||"").split(",")[1]?.trim()||"18:00";setDeadlines(prev=>({...prev,[selEv.id]:`${wd} ${day}.${m}.${y}, ${time}`}));}setEditingDeadline(false);}}
                            style={{background:"rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.2)",borderRadius:6,padding:"3px 8px",color:hTxt,fontSize:13,outline:"none",colorScheme:"dark"}} autoFocus/>
                          <input type="time"
                            defaultValue={(deadlines[selEv.id]||"").split(",")[1]?.trim()||"18:00"}
                            onBlur={e=>{const t=e.target.value;if(t){const curDate=(deadlines[selEv.id]||"").split(",")[0].trim();setDeadlines(prev=>({...prev,[selEv.id]:`${curDate}, ${t}`}));}}}
                            style={{background:"rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.2)",borderRadius:6,padding:"3px 8px",color:hTxt,fontSize:13,outline:"none",colorScheme:"dark",width:80}}/>
                          <button onClick={()=>setEditingDeadline(false)}
                            style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}}>✓</button>
                        </div>
                      ):(
                        <span onClick={()=>setEditingDeadline(true)}
                          style={{color:hTxt,fontWeight:600,fontSize:13,cursor:"pointer",background:hBtn,padding:"3px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}>
                          {deadlines[selEv.id]||"Setzen"}{deadlines[selEv.id]?" Uhr":""}
                        </span>
                      )}
                      <button onClick={()=>setAutoReminder(prev=>({...prev,[selEv.id]:!prev[selEv.id]}))}
                        style={{display:"flex",alignItems:"center",gap:8,background:hBtn,border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:20,padding:"5px 12px",cursor:"pointer",color:hTxt,fontSize:13}}>
                        <span style={{width:22,height:12,borderRadius:6,background:autoReminder[selEv.id]?(hLight?"rgba(0,0,0,0.25)":"rgba(255,255,255,0.85)"):"rgba(0,0,0,0.15)",position:"relative",display:"inline-block",flexShrink:0}}>
                          <span style={{position:"absolute",top:2,left:autoReminder[selEv.id]?11:2,width:8,height:8,borderRadius:"50%",background:autoReminder[selEv.id]?GN:(hLight?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.4)")}}/>
                        </span>
                        <span style={{opacity:autoReminder[selEv.id]?1:0.5,color:hTxt}}>
                          {autoReminder[selEv.id]?"◬ Erinnerung":"Keine Erinnerung"}
                        </span>
                      </button>
                      {autoReminder[selEv.id]&&(
                        <select value={reminderTimes[selEv.id]||"3h"}
                          onChange={e=>setReminderTimes(prev=>({...prev,[selEv.id]:e.target.value}))}
                          style={{background:hBtn,border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:20,padding:"5px 12px",color:hTxt,fontSize:13,cursor:"pointer",outline:"none"}}>
                          {REMINDER_OPTIONS.map(o=><option key={o.v} value={o.v} style={{color:"var(--text)",background:"var(--surface)"}}>{o.l}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Beschreibung für Vereinsanlass/Team-Event */}
            {selEv.description&&(
              <div style={{padding:"14px 20px",background:"var(--surface)",borderBottom:"0.5px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0,marginTop:1}}>ℹ️</span>
                <p style={{margin:0,fontSize:13,color:"var(--text)",lineHeight:1.7}}>{selEv.description}</p>
              </div>
            )}
            {/* Weitere Informationen */}
            <div style={{padding:"14px 20px",borderBottom:"0.5px solid var(--border)",background:"var(--surface)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5}}>≡ Weitere Informationen</div>
                {canEditEvent(selEv)&&(
                  <button onClick={()=>setEditingNote(v=>!v)}
                    style={{fontSize:13,fontWeight:600,color:editingNote?R:BL,background:"transparent",border:"none",cursor:"pointer",padding:"2px 6px"}}>
                    {editingNote?"Fertig ✓":"Bearbeiten"}
                  </button>
                )}
              </div>
              {/* Besammlung */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:13,color:"var(--sub)",fontWeight:600,marginBottom:6}}><TI n="target" style={{marginRight:3}}/> Treffpunkt</div>
                {editingNote&&canEditEvent(selEv)?(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div>
                        <div style={{fontSize:13,color:"var(--sub)",marginBottom:2}}>Datum</div>
                        <input type="date" value={(()=>{const d=besammlungen[selEv.id]?.date||selEv.date||"";const c=d.replace(/^[A-Za-zÄÖÜäöü]{2,3}\s+/,"").trim();const p=c.split(".");return p.length>=2?`2026-${p[1]?.padStart(2,"0")}-${p[0]?.padStart(2,"0")}`:"";})()}
                          onChange={e=>{const v=e.target.value;if(v){const[y,m,d]=v.split("-");const days=["So","Mo","Di","Mi","Do","Fr","Sa"];const wd=days[new Date(v).getDay()];saveBesammlung(selEv.id,"date",`${wd} ${d}.${m}.`);}}}
                          style={{width:"100%",padding:"7px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:13,color:"var(--sub)",marginBottom:2}}>Uhrzeit</div>
                        <input type="time" value={besammlungen[selEv.id]?.time||""}
                          onChange={e=>saveBesammlung(selEv.id,"time",e.target.value)}
                          style={{width:"100%",padding:"7px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:13,color:"var(--sub)",marginBottom:2}}>Ort</div>
                      <input value={besammlungen[selEv.id]?.location||""} onChange={e=>saveBesammlung(selEv.id,"location",e.target.value)}
                        placeholder="z.B. Sportanlage Aabach, Parkplatz Bahnhof…"
                        style={{width:"100%",padding:"7px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:13,boxSizing:"border-box",outline:"none"}}/>
                    </div>
                  </div>
                ):(()=>{
                  const b=besammlungen[selEv.id]||{};
                  const hasData=b.time||b.location||b.date;
                  return hasData?(
                    <div style={{fontSize:13,color:"var(--text)"}}>
                      {b.date&&<span style={{marginRight:8}}><TI n="calendar" style={{marginRight:3}}/> {b.date}</span>}
                      {b.time&&<span style={{marginRight:8}}><TI n="clock" style={{marginRight:3}}/> {b.time} Uhr</span>}
                      {b.location&&<span><TI n="map-pin" style={{marginRight:3}}/> {b.location}</span>}
                    </div>
                  ):<div style={{fontSize:13,color:"var(--sub)",fontStyle:"italic"}}>Noch nicht gesetzt</div>;
                })()}
              </div>
              {/* Notizen */}
              <div>
                <div style={{fontSize:13,color:"var(--sub)",fontWeight:600,marginBottom:4}}><TI n="edit" style={{marginRight:3}}/> Bemerkungen</div>
                {editingNote&&canEditEvent(selEv)?(
                  <textarea value={trainerNotes[selEv.id]||""} onChange={e=>saveTrainerNote(selEv.id,e.target.value)}
                    placeholder="Bemerkungen, Taktik-Hinweise, Infos für Spieler und Eltern…" rows={3}
                    style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${GN}`,borderRadius:10,fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:FONT,lineHeight:1.6,outline:"none",color:"var(--text)"}}/>
                ):trainerNotes[selEv.id]?(
                  <p style={{margin:0,fontSize:13,color:"#1a3a2a",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{trainerNotes[selEv.id]}</p>
                ):(
                  canEditEvent(selEv)&&<div style={{fontSize:13,color:"var(--sub)",fontStyle:"italic"}}>Noch keine Notizen.</div>
                )}
              </div>
            </div>
            {/* Zum Spielplan Link bei Spielen */}
            {selEv.type==="Spiel"&&onNavigateToSpiel&&(
              <div style={{padding:"10px 20px",background:"var(--surface)",borderBottom:`0.5px solid #DBEAFE`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:13,color:BL,fontWeight:600}}><TI n="ball-football" style={{marginRight:4}}/> Dieses Spiel im Spielplan ansehen</span>
                <button onClick={()=>{const match=SCHEDULE.find(g=>g.date===selEv.date&&g.opponent===selEv.opponent);setModalOpen(false);if(match)onNavigateToSpiel(match);}}
                  style={{fontSize:13,fontWeight:700,color:BL,background:"var(--surface)",border:`1px solid ${BL}`,borderRadius:20,padding:"5px 12px",cursor:"pointer"}}>
                  Zum Spielplan →
                </button>
              </div>
            )}
            {/* Readonly banner for trainer on Vereinsanlass with RSVP */}
            {(isTrainer||isAdmin)&&!canEditEvent(selEv)&&selEv.rsvp!==false&&(
              <div style={{padding:"8px 16px",background:"var(--surface)",borderBottom:`0.5px solid #FED7AA`,fontSize:13,color:"#92400E",display:"flex",alignItems:"center",gap:8}}>
                <span>{"ℹ️"}</span>
                <span>Vereinsanlass - nur Administratoren können Anwesenheiten bearbeiten. Du siehst die Übersicht als Lesezugriff.</span>
              </div>
            )}
            {/* Stats + Spieler-Liste nur wenn RSVP aktiv und Trainer/Admin */}
            {selEv.rsvp!==false&&(isTrainer||isAdmin)&&(
            <>
            {/* Stats */}
            {(()=>{
              const c=evCounts(selEv);
              const items=[{v:c.zu,l:"Zusagen",c:GN,bg:"#ECFDF5"},{v:c.ab,l:"Absagen",c:R,bg:RL},{v:c.unent,l:"Unentschuldigt",c:AM,bg:"#FFF7ED"},{v:c.offen,l:"Ausstehend",c:"#aaa",bg:GR}];
              return(
                <div style={{display:"flex",gap:8,padding:"14px 20px",borderBottom:"0.5px solid var(--border)",background:"var(--surface)"}}>
                  {items.map(s=>(
                    <div key={s.l} style={{flex:1,background:s.bg,borderRadius:10,padding:"10px 8px",textAlign:"center",border:`0.5px solid ${s.c}20`}}>
                      <div style={{fontSize:24,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:13,color:s.c,fontWeight:600,marginTop:3,opacity:0.8}}>{s.l}</div>
                    </div>
                  ))}
                  {c.aufgebot>0&&(
                    <div style={{flex:1,background:"var(--surface)",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"0.5px solid #818CF820"}}>
                      <div style={{fontSize:24,fontWeight:800,color:"var(--sub)",lineHeight:1}}>{c.aufgebot}</div>
                      <div style={{fontSize:13,color:"var(--sub)",fontWeight:600,marginTop:3,opacity:0.8}}>Aufgebot</div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Spieler-Liste */}
            <div style={{padding:"0 0 4px"}}>
              <div style={{padding:"8px 20px 4px",background:"var(--surface2)",borderBottom:"0.5px solid var(--border)"}}>
                <div style={{display:"grid",gridTemplateColumns:`1fr auto auto${selEv.type==="Spiel"?" auto":""}`,fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,gap:"0 16px"}}>
                  <span>Spieler</span><span style={{textAlign:"center"}}>Status</span><span style={{minWidth:80,textAlign:"left"}}>Begründung</span>{selEv.type==="Spiel"&&<span style={{textAlign:"center",color:"var(--cc-accent)"}}><TI n="ball-football"/></span>}
                </div>
              </div>
              {teamRoster.map((p,i)=>{
                const resp=getResp(selEv.id,p.id);
                const editingNote=showNoteFor===p.id;
                const statusColor=resp.status==="zu"?GN:resp.status==="ab"?R:resp.status==="unentschuldigt"?AM:resp.status==="fraglich"?AM:"#F3F4F6";
                return(
                  <div key={p.id} style={{display:"grid",gridTemplateColumns:`1fr auto auto${selEv.type==="Spiel"?" auto":""}`,alignItems:"center",gap:"0 16px",padding:"8px 20px",borderBottom:"0.5px solid var(--border)",background:resp.status==="zu"?"#F9FFFB":resp.status==="ab"?"#FFF9F9":resp.status==="unentschuldigt"?"#FFF7ED":"#fff"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:4,height:28,borderRadius:2,background:statusColor,flexShrink:0}}/>
                      <Av name={p.name} size={28} bg={resp.status==="zu"?GN:resp.status==="ab"?R:resp.status==="unentschuldigt"?AM:resp.status==="fraglich"?AM:"#D1D5DB"}/>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{p.firstName} {p.lastName}</div>
                        {getNr(p.id)&&<div style={{fontSize:13,color:"var(--sub)"}}>{"#"+getNr(p.id)}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      {(canEditEvent(selEv)?(selEv.type==="Spiel"?["zu","ab","unentschuldigt"]:selEv.type==="Veranstaltung"?["zu","ab"]:["zu","ab","unentschuldigt"]):[]).map(s=>{
                        const cfg=STATUS_CFG[s];
                        const active=resp.status===s;
                        return(
                          <button key={s} onClick={()=>{setResp(selEv.id,p.id,s);if(s==="ab")setShowNoteFor(p.id);else setShowNoteFor(null);}}
                            title={cfg.label}
                            style={{width:s==="aufgebot"?32:26,height:s==="aufgebot"?32:26,borderRadius:"50%",border:`1.5px solid ${active?cfg.color:"var(--surface2)"}`,background:active?cfg.color:"#fff",color:active?"#fff":"#ccc",fontSize:s==="aufgebot"?13:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {cfg.icon}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{minWidth:80}}>
                      {editingNote?(
                        <textarea value={resp.note} onChange={e=>setResp(selEv.id,p.id,"ab",e.target.value)}
                          readOnly={!canEditEvent(selEv)}
                          onBlur={()=>setShowNoteFor(null)}
                          placeholder="Begründung…" rows={2} autoFocus
                          style={{width:"100%",padding:"3px 6px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,resize:"none",fontFamily:FONT}}/>
                      ):(
                        <span style={{fontSize:13,color:resp.note?"#555":"#ccc",fontStyle:resp.note?"normal":"italic"}}>{resp.note||"-"}</span>
                      )}
                    </div>
                    {selEv.type==="Spiel"&&(
                      <button onClick={()=>toggleAufgebot(selEv.id,p.id)} title="Im Aufgebot"
                        style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${isInAufgebot(selEv.id,p.id)?"#4F46E5":"#F3F4F6"}`,background:isInAufgebot(selEv.id,p.id)?"#4F46E5":"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <TI n="ball-football"/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            </>
            )}
          </div>
          </div>
      )}

      {/* Ereignisliste */}

      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",flex:1,minWidth:0}}>
          {["alle","training","spiele","team-event","vereinsanlass"].map(f=>{
            const active=isFilterActive(f);
            return(
              <button key={f} onClick={()=>toggleFilter(f)}
                style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${active?"#1A1A1A":GB}`,background:active?"#1A1A1A":"transparent",color:active?"#fff":"#666",fontSize:13,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                {f==="alle"?"Alle":f==="training"?"Trainings":f==="spiele"?"Spiele":f==="team-event"?"Teamevents":"Vereinsanlass"}
              </button>
            );
          })}
        </div>
        <button onClick={()=>setTimeFilter(p=>p==="kommend"?"vergangen":"kommend")}
          style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--sub)",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,flexBasis:"100%",transition:"all 0.15s"}}>
          <span style={{fontSize:13,opacity:0.6}}>{"▾"}</span>
          <span>{timeFilter==="kommend"?"Vergangene Termine":"Kommende Termine"}</span>
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {(showMoreEvents?filteredEvents:filteredEvents.slice(0,5)).map(ev=>{
          const c=evCounts(ev);
          const noRsvp=ev.subtype==="Vereinsanlass"&&ev.rsvp===false;
          const isCancelled=!!cancelledEvents[ev.id];
          const canCancel=isTrainer&&!isPast(ev)&&(ev.type==="Training"||ev.subtype==="Team-Event");
          const accentColor=ev.type==="Spiel"?BL:ev.subtype==="Vereinsanlass"?"#7C3AED":ev.type==="Veranstaltung"?AM:GN;
          const dateParts=ev.date.split(" ");
          const weekday=dateParts[0]||"";
          const dayMonth=dateParts[1]||ev.date;
          const MONTHS=["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
          const dayNum=dayMonth.split(".")[0];
          const monNum=parseInt(dayMonth.split(".")[1])||0;
          const monName=MONTHS[monNum]||dayMonth.split(".")[1];
          const isSpiel=ev.type==="Spiel";
          const isVerein=ev.subtype==="Vereinsanlass";
          const isVeranst=ev.type==="Veranstaltung"&&!isVerein;
          const needsRichCard=isSpiel||isVerein||isVeranst;
          const headerBg=isSpiel?"#1a3a2a":isVerein?"#4C1D95":"#78350F";
          return(
            <div key={ev.id}
              style={{background:"var(--surface)",border:"0.5px solid var(--border)",borderRadius:14,overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column",opacity:isCancelled?0.7:1}}
              onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--surface)"}>

              {needsRichCard?(
                /* -- SPIEL / ANLASS: dunkler Header -- */
                <>
                  <div onClick={()=>openEvent(ev.id)} style={{background:headerBg,padding:"12px 14px",display:"flex",alignItems:"center",gap:0}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:56,paddingRight:14}}>
                      <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:0.6}}>{weekday}</div>
                      <div style={{fontSize:21,fontWeight:700,color:"#fff",lineHeight:1.1}}>{dayNum}.</div>
                      <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:0.4}}>{monName}</div>
                    </div>
                    <div style={{width:1,alignSelf:"stretch",background:"rgba(255,255,255,0.15)",marginRight:14,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#fff",lineHeight:1.25,textDecoration:isCancelled?"line-through":"none"}}>
                        {ev.opponent?"vs. "+ev.opponent:ev.title||ev.type}
                      </div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:2}}>
                        {isSpiel?(ev.home?"Heimspiel":"Auswärtsspiel"):ev.subtype||ev.type}
                        {isCancelled&&" · ⚠ Abgesagt"}
                      </div>
                    </div>
                  </div>
                  <div onClick={()=>openEvent(ev.id)} style={{display:"flex",borderBottom:"0.5px solid var(--border)"}}>
                    {[
                      {label:"Treffen",time:ev.treffpunkt?(ev.treffpunkt.match(/\d{2}:\d{2}/)||[""])[0]||"-":"-"},
                      {label:"Beginn", time:ev.time||"-"},
                      {label:"Ende",   time:ev.endTime||"-"},
                    ].map((t,i,arr)=>(
                      <div key={i} style={{flex:1,padding:"12px 8px",borderRight:i<arr.length-1?`0.5px solid ${GB}`:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{fontSize:13,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.8}}>{t.label}</div>
                        <div style={{fontSize:18,fontWeight:700,color:"var(--text)",lineHeight:1}}>{t.time}</div>
                      </div>
                    ))}
                  </div>
                </>
              ):(
                /* -- TRAINING / STANDARD: schlank wie Bild 2 -- */
                <div onClick={()=>openEvent(ev.id)} style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:16}}>
                  <div style={{width:58,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--surface2)",borderRadius:10,padding:"8px 6px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>{weekday}</div>
                    <div style={{fontSize:18,fontWeight:700,color:"var(--text)",lineHeight:1}}>{dayNum}</div>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--sub)",textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{monName}</div>
                  </div>
                  <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <div style={{fontWeight:600,fontSize:14,color:isCancelled?"#aaa":"#1A1A1A",textDecoration:isCancelled?"line-through":"none"}}>
                        {ev.type==="Training"?"Training · "+ev.team:ev.title||ev.type}
                      </div>
                      <span style={{background:accentColor+"18",color:accentColor,fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:20,flexShrink:0}}>
                        {ev.subtype||ev.type}
                      </span>
                      {isCancelled&&<span style={{fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:20,background:RL,color:R}}>⚠ Abgesagt</span>}
                    </div>
                    <div style={{fontSize:13,color:"var(--sub)"}}><TI n="clock" style={{marginRight:3}}/> {ev.time} Uhr</div>
                  </div>
                </div>
              )}

              {/* Stat-Blöcke - immer, Aufgebot nur bei Spielen */}
              {!noRsvp&&(
                <div style={{display:"flex",borderTop:"0.5px solid var(--border)",borderBottom:"0.5px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
                  {[
                    {label:"Zusagen",  value:c.zu,    color:"#16A34A"},
                    {label:"Absagen",  value:c.ab,    color:R},
                    {label:"Unentsch.",value:c.unent, color:"#D97706"},
                    {label:"Offen",    value:c.offen, color:"var(--sub)"},
                    ...(isSpiel?[{label:"Aufgebot",value:c.aufgebot,color:"var(--cc-accent)"}]:[]),
                  ].map((s,i,arr)=>(
                    <div key={i} style={{flex:1,padding:"9px 2px",borderRight:i<arr.length-1?`0.5px solid ${GB}`:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:14,fontWeight:700,color:s.value>0?s.color:"var(--border)",lineHeight:1}}>{s.value}</div>
                      <div style={{fontSize:13,color:s.value>0?s.color:"var(--sub)",marginTop:3,textTransform:"uppercase",letterSpacing:0.3,fontWeight:600,opacity:0.8}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* RSVP-Toggle */}
              {!isAdmin&&!noRsvp&&myId&&(()=>{
                const resp=getResp(ev.id,myId);
                const isZu=resp.status==="zu";
                const isAb=resp.status==="ab";
                const none=!isZu&&!isAb;
                return(
                  <div style={{padding:"10px 12px",background:"var(--surface)"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",background:"var(--surface2)",borderRadius:10,padding:3,gap:4}}>
                      <button onClick={()=>setResp(ev.id,myId,isZu?null:"zu")}
                        style={{flex:1,padding:"8px 14px",border:"none",borderRadius:8,background:isZu?"#16A34A":"transparent",color:isZu?"#fff":none?"#888":"#bbb",fontSize:13,fontWeight:isZu?700:400,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:14}}>▲</span>
                        <span>{isZu?"Zugesagt":"Zusagen"}</span>
                      </button>
                      <div style={{width:1,background:GB,flexShrink:0,margin:"4px 0"}}/>
                      <button onClick={()=>setResp(ev.id,myId,isAb?null:"ab")}
                        style={{flex:1,padding:"8px 14px",border:"none",borderRadius:8,background:isAb?"#DC2626":"transparent",color:isAb?"#fff":none?"#888":"#bbb",fontSize:13,fontWeight:isAb?700:400,cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:14}}>▽</span>
                        <span>{isAb?"Abgesagt":"Absagen"}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
        {filteredEvents.length>5&&(
          <button onClick={()=>setShowMoreEvents(p=>!p)}
            style={{padding:"8px 0",borderRadius:10,border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%"}}>
            {showMoreEvents?`↑ Weniger anzeigen`:`+ ${filteredEvents.length-5} weitere anzeigen`}
          </button>
        )}
      </div>
    </div>
  );
}

function PollsTab({role}){
  const canCreate=role==="trainer"||role==="administrator"||role==="administration";
  const [votes,setVotes]=useState({});
  return(
    <div>
      {canCreate&&(
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
          <Btn variant="primary" color="#F3F4F6">+ Abstimmung erstellen</Btn>
        </div>
      )}
      {!canCreate&&<InfoBox text="Spieler und Eltern können an Abstimmungen teilnehmen, aber keine erstellen." color={BL}/>}
      <div style={{marginTop:14}}>
        {POLLS.map((p,i)=>(
          <Card key={i} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700}}>{p.title}</h3>
                <Chip text={p.target} color={BL}/>
                {" "}<Chip text={p.closed?"Geschlossen":"Offen"} color={p.closed?"#888":GN} bg={p.closed?"#f5f5f5":"#ECFDF5"}/>
              </div>
              <span style={{fontSize:13,color:"var(--sub)"}}>{p.votes.reduce((a,b)=>a+b,0)} Stimmen</span>
            </div>
            {p.options.map((opt,j)=>{
              const tot=p.votes.reduce((a,b)=>a+b,0);
              const pct=tot?Math.round(p.votes[j]/tot*100):0;
              const my=votes[i]===j;
              return(
                <div key={j} onClick={()=>!p.closed&&setVotes(v=>({...v,[i]:j}))} style={{marginBottom:7,cursor:p.closed?"default":"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2}}>
                    <span style={{fontWeight:my?700:400}}>{opt}{my?" ✓":""}</span>
                    <span style={{color:"var(--sub)",fontWeight:600}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:GB,borderRadius:4}}>
                    <div style={{height:"100%",width:`${pct}%`,background:my?R:BL,borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatsTab({team="Cc-Junioren"}){
  /* Generate per-team stats from ROSTER + seeded random */
  const seed=(str)=>str.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rnd=(n,min,max)=>{let s=seed(n+team);s=((s*1664525+1013904223)&0xFFFFFFFF)>>>0;return min+Math.floor((s/0xFFFFFFFF)*(max-min+1));};
  const players=ROSTER.filter(p=>(p.teams||[]).includes(team)&&!p.role);
  const stats=players.map(p=>{
    const nm=`${p.firstName} ${p.lastName}`;
    return{name:nm,sp:rnd(nm+"sp",6,14),tore:rnd(nm+"t",0,9),assists:rnd(nm+"a",0,7),gelb:rnd(nm+"g",0,3),rot:rnd(nm+"r",0,1)};
  }).sort((a,b)=>b.tore-a.tore);
  if(stats.length===0) return <Card><div style={{textAlign:"center",color:"var(--sub)",padding:20}}>Keine Spielerstatistiken verfügbar.</div></Card>;
  return(
    <Card style={{padding:0,overflowX:"auto"}}>      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{background:"var(--surface2)"}}>
            {["Spieler","Spiele","Tore","Assists","Gelb","Rot"].map((h,i)=>(
              <th key={i} style={{padding:"9px 13px",textAlign:i>0?"center":"left",fontWeight:600,color:"var(--sub)",fontSize:13,textTransform:"uppercase"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((p,i)=>(
            <tr key={i} style={{borderTop:"0.5px solid var(--border)"}}>
              <td style={{padding:"9px 13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><Av name={p.name} size={26} bg={R}/><span style={{fontWeight:600}}>{p.name}</span></div>
              </td>
              <td style={{padding:"9px 13px",textAlign:"center"}}>{p.sp}</td>
              <td style={{padding:"9px 13px",textAlign:"center",fontWeight:p.tore>=5?700:400,color:p.tore>=5?R:BK}}>{p.tore}</td>
              <td style={{padding:"9px 13px",textAlign:"center"}}>{p.assists}</td>
              <td style={{padding:"9px 13px",textAlign:"center"}}>{p.gelb>0?<span style={{background:"#FCD34D",color:"#78350F",padding:"1px 7px",borderRadius:4,fontWeight:700,fontSize:13}}>{p.gelb}</span>:"-"}</td>
              <td style={{padding:"9px 13px",textAlign:"center"}}>{p.rot>0?<span style={{background:R,color:"#fff",padding:"1px 7px",borderRadius:4,fontWeight:700,fontSize:13}}>{p.rot}</span>:"-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ==========================================
   ADMIN-EXKLUSIVE VIEWS
========================================== */
/* Vereinsfunktion → farbiger Chip */
function RolleChip({rolle}){
  const colors={
    "Spieler":     {c:"#22C55E",bg:"#F0FDF4"},
    "Trainer":     {c:"#F97316",bg:"#FFF7ED"},
    "Assistent/in":{c:"#F97316",bg:"#FFF7ED"},
    "Goalietrainer":{c:"#F97316",bg:"#FFF7ED"},
    "Vorstand":    {c:"#8B5CF6",bg:"#F5F3FF"},
    "Kassier":     {c:"#8B5CF6",bg:"#F5F3FF"},
    "Materialwart":{c:"#3B82F6",bg:"#EFF6FF"},
    "Platzwart":   {c:"#3B82F6",bg:"#EFF6FF"},
    "Schiedsrichter":{c:"#EC4899",bg:"#FDF2F8"},
    "Elternteil":  {c:"#06B6D4",bg:"#ECFEFF"},
    "Ehrenmitglied":{c:"#f8de09",bg:"#FFFBEB"},
    "Passivmitglied":{c:"#9CA3AF",bg:"#F9FAFB"},
    "Gönner":      {c:"#9CA3AF",bg:"#F9FAFB"},
  };
  const s=colors[rolle]||{c:"#9CA3AF",bg:"#F9FAFB"};
  return <Chip text={rolle||"-"} color={s.c} bg={s.bg}/>;
}

function FieldVisView(){
  const fields=[
    {name:"Profilbild",       spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"✓",administration:"✓",administrator:"✓"},
    {name:"Name / Vorname",   spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"✓",administration:"✓",administrator:"✓"},
    {name:"Geburtsdatum",     spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"✓",administration:"✓",administrator:"✓"},
    {name:"Adresse",          spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"E-Mail / Telefon", spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"Spielerpass",      spieler:"✓",eltern:"✓",trainer:"✓",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"Nationalität",     spieler:"-", eltern:"-", trainer:"✓",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"Elternkontakte",   spieler:"-", eltern:"Eigene Kinder",trainer:"✓",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"J+S Nummer",       spieler:"-", eltern:"-", trainer:"Je nach Recht",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"AHV-Nummer",       spieler:"-", eltern:"-", trainer:"-",funktionaer:"Je nach Recht",administration:"✓",administrator:"✓"},
    {name:"Fairgate-ID/Sync", spieler:"-", eltern:"-", trainer:"-",funktionaer:"-",administration:"✓",administrator:"✓"},
  ];
  const rc=c=>{
    if(c==="✓") return{color:GN,bg:"#ECFDF5"};
    if(c==="-") return{color:"var(--sub)",bg:"#fafafa"};
    return{color:AM,bg:"#FFFBEB"};
  };
  return(
    <div>
      <h1 style={{fontSize:21,fontWeight:800,margin:"0 0 8px"}}>Feldsichtbarkeit</h1>
      <p style={{color:"var(--sub)",fontSize:13,margin:"0 0 18px"}}>Konfigurierbar pro Rolle (Kap. 6.1)</p>
      <Card style={{padding:0,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
          <thead>
            <tr style={{background:"var(--surface2)"}}>
              <th style={{padding:"9px 13px",textAlign:"left",fontWeight:600,color:"var(--sub)",fontSize:13,textTransform:"uppercase",letterSpacing:0.4}}>Feld</th>
              {["Spieler","Eltern","Trainer","Funktionäre","Administration","Administrator"].map((h,i)=>(
                <th key={i} style={{padding:"9px 13px",textAlign:"center",fontWeight:600,color:"var(--sub)",fontSize:13,textTransform:"uppercase",letterSpacing:0.4}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f,i)=>(
              <tr key={i} style={{borderTop:"0.5px solid var(--border)",background:i%2===0?"var(--surface)":"var(--surface2)"}}>
                <td style={{padding:"9px 13px",fontWeight:600}}>{f.name}</td>
                {["spieler","eltern","trainer","funktionaer","administration","administrator"].map((r,j)=>{
                  const v=f[r];const s=rc(v);
                  return <td key={j} style={{padding:"9px 13px",textAlign:"center"}}><Chip text={v} color={s.color} bg={s.bg}/></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SyncView(){ return <PortalverwaltungView initialTab="api"/>; }
function AuditView(){ return <PortalverwaltungView initialTab="audit"/>; }

/* ══════════════════════════════════════════════════════════════════
   PORTALVERWALTUNG — Zentrales Admin-Cockpit
   Tabs: Module & Rechte | Benutzer & Rollen | Feldsichtbarkeit |
         API-Verbindungen | Audit-Logs
   ══════════════════════════════════════════════════════════════════ */
function getHelperName(role,account){
  if(account?.name) return account.name;
  if(role==="spieler") return "Luca Meier";
  if(role==="eltern")  return "Anna Meier";
  if(role==="trainer") return "Thomas Müller";
  return "Sandra Berger";
}

/* Alle möglichen Übergabe-Empfänger (alle Helfer ausser dem aktuellen) */
const ALLE_HELFER_NAMEN = HELPERS.map(h=>h.name);

function BemerkungEdit({notes,onSave}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(notes||"");
  if(editing) return(
    <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
      <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Bemerkung…"
        style={{padding:"2px 7px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,outline:"none",width:130}}
        onKeyDown={e=>{if(e.key==="Enter"){onSave(draft);setEditing(false);}if(e.key==="Escape")setEditing(false);}}/>
      <button onClick={()=>{onSave(draft);setEditing(false);}} style={{padding:"1px 6px",borderRadius:6,fontSize:13,fontWeight:600,border:`0.5px solid ${GN}`,background:"var(--surface)",color:GN,cursor:"pointer"}}>✓</button>
      <button onClick={()=>setEditing(false)} style={{padding:"1px 6px",borderRadius:6,fontSize:13,border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)",cursor:"pointer"}}>✕</button>
    </div>
  );
  return <button onClick={e=>{e.stopPropagation();setEditing(true);setDraft(notes||"");}} style={{marginTop:3,fontSize:13,color:"var(--sub)",background:"none",border:"none",cursor:"pointer",padding:0}}><TI n="edit" style={{marginRight:3}}/> Bemerkung</button>;
}

function SchichtKarte({schicht,einsatz,meinName,canEdit,canFreigeben,canZuteilen,teamMitglieder,schichtenState,onEintragen,onFreigeben,onÜbertragen,freigabeAnfragen,notes,onSaveBemerkung}){
  const helfer=schichtenState[schicht.id]??schicht.helfer;
  const filled=helfer.length, max=schicht.max;
  const pct=Math.round(filled/max*100);
  const voll=filled>=max;
  const ichDrin=helfer.includes(meinName);
  const anfrageData=(freigabeAnfragen||{})[schicht.id];
  const anfragePending=anfrageData?.name===meinName;

  const [showTransfer,setShowTransfer]=useState(false);
  const [transferTarget,setTransferTarget]=useState("");
  const [showAnfrageForm,setShowAnfrageForm]=useState(false);
  const [anfrageBegruendung,setAnfrageBegruendung]=useState("");
  const [showAnfrageOk,setShowAnfrageOk]=useState(false);
  const [showZuteilen,setShowZuteilen]=useState(false);
  const [zuteilTarget,setZuteilTarget]=useState("");
  const [zuteilSearch,setZuteilSearch]=useState("");
  const [showHelfer,setShowHelfer]=useState(false);

  let sc=GN,sb="#ECFDF5",st=`${filled}/${max} belegt`;
  if(voll){sc="#888";sb="#f5f5f5";st="Besetzt";}
  else if(filled===0){sc=R;sb=RL;st="Offen";}
  else{sc=AM;sb="#FFFBEB";}

  const handleÜbertragen=()=>{
    if(!transferTarget) return;
    onÜbertragen(schicht.id, meinName, transferTarget);
    setShowTransfer(false);
    setTransferTarget("");
  };

  const handleAnfrageSenden=()=>{
    if(!anfrageBegruendung.trim()) return;
    onFreigeben(schicht.id, meinName, anfrageBegruendung.trim());
    setShowAnfrageForm(false);
    setAnfrageBegruendung("");
    setShowAnfrageOk(true);
    setTimeout(()=>setShowAnfrageOk(false), 3000);
  };

  const handleZuteilen=()=>{
    if(!zuteilTarget) return;
    onEintragen(schicht.id,zuteilTarget);
    setShowZuteilen(false);
    setZuteilTarget("");
    setZuteilSearch("");
  };

  const zuteilKandidaten=(teamMitglieder||[]).filter(n=>!helfer.includes(n));

  const statusColor=anfragePending?AM:voll?GN:filled>0?AM:R;
  const statusBg=anfragePending?"#FFFBEB":voll?"#ECFDF5":filled>0?"#FFFBEB":"#FEF2F2";
  const statusText=anfragePending?"⏳ Angefragt":`${filled}/${max}`;

  return(
    <div style={{border:`1px solid ${ichDrin?GN+"60":anfragePending?AM+"60":voll?"#e5e7eb":"#e5e7eb"}`,borderRadius:12,overflow:"hidden",background:ichDrin?"#F0FDF4":anfragePending?"#FFFBEB":voll?"#FAFAF8":"#fff"}}>
      {/* Colored top strip */}
      <div style={{height:3,background:voll?GN:filled>0?AM:R}}/>
      <div style={{padding:"14px 16px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--text)",lineHeight:1.2}}>{schicht.label}</div>
            <div style={{fontSize:13,color:"var(--sub)",marginTop:3,display:"flex",alignItems:"center",gap:4}}>
              <span><TI n="map-pin"/></span><span>{einsatz.location}</span>
            </div>
            {notes&&<div style={{fontSize:13,color:AM,marginTop:3,fontStyle:"italic"}}><TI n="edit" style={{marginRight:3}}/> {notes}</div>}
            {canEdit&&onSaveBemerkung&&<BemerkungEdit notes={notes} onSave={onSaveBemerkung}/>}
          </div>
          <span style={{fontSize:13,fontWeight:700,padding:"3px 9px",borderRadius:20,background:statusBg,color:statusColor,flexShrink:0,whiteSpace:"nowrap"}}>
            {statusText}
          </span>
        </div>

        {/* Fortschrittsbalken */}
        <div style={{height:6,background:"var(--surface2)",borderRadius:4,marginBottom:10}}>
          <div style={{height:"100%",width:`${pct}%`,background:voll?GN:filled>0?AM:R,borderRadius:4}}/>
        </div>

        {/* Plätze Zähler */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:ichDrin||!voll?10:0}}>
          <button onClick={()=>setShowHelfer(v=>!v)}
            style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:0,fontSize:13,color:"var(--sub)"}}>
            <span style={{fontSize:13,display:"inline-block",transform:showHelfer?"rotate(90deg)":"none"}}>▶</span>
            <span><strong style={{color:"var(--text)"}}>{filled}</strong> / {max} belegt</span>
          </button>
          {ichDrin&&<span style={{fontSize:13,color:GN,fontWeight:700}}>Du dabei ✓</span>}
        </div>

        {showHelfer&&(
          <div style={{marginBottom:10,display:"flex",flexDirection:"column",gap:4}}>
            {helfer.map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:h===meinName?"#DCFCE7":"#F3F4F6",borderRadius:6,padding:"4px 8px"}}>
                <Av name={h} size={16} bg={h===meinName?GN:"#9CA3AF"}/>
                <span style={{fontSize:13,fontWeight:h===meinName?700:500,color:h===meinName?GN:"#374151",flex:1}}>{h}</span>
                {h===meinName&&<span style={{fontSize:13,color:GN}}>Du</span>}
              </div>
            ))}
            {Array.from({length:max-filled},(_,i)=>(
              <div key={`f${i}`} style={{display:"flex",alignItems:"center",gap:8,background:"var(--surface)",border:"1px dashed #D1D5DB",borderRadius:6,padding:"4px 8px"}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:"#E5E7EB",flexShrink:0}}/>
                <span style={{fontSize:13,color:"var(--sub)"}}>Freier Platz</span>
              </div>
            ))}
          </div>
        )}

      {/* Aktionsbereich */}
      {ichDrin?(
        <div>
          {/* Haupt-Buttons (solange kein Formular offen und keine Anfrage pending) */}
          {!showTransfer&&!showAnfrageForm&&!anfragePending&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>setShowTransfer(true)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`0.5px solid #0891B2`,background:"var(--surface)",color:"#0891B2"}}>
                ⇄ Übertragen
              </button>
              <button onClick={()=>setShowAnfrageForm(true)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`0.5px solid ${AM}`,background:"var(--surface)",color:AM}}>
                ↩ Freigabe anfragen
              </button>
            </div>
          )}

          {/* Bestätigung nach Absenden */}
          {showAnfrageOk&&(
            <div style={{fontSize:13,color:GN,fontWeight:600,padding:"3px 0"}}>✓ Anfrage gesendet - wird von Funktionär/Admin geprüft.</div>
          )}

          {/* Ausstehende Anfrage */}
          {anfragePending&&!showAnfrageOk&&(
            <div style={{background:AM+"12",border:`0.5px solid ${AM}`,borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:13,color:AM,fontWeight:700,marginBottom:3}}>⏳ Freigabe ausstehend</div>
              <div style={{fontSize:13,color:"var(--sub)"}}>Begründung: <em>{"\"" + (anfrageData?.begruendung||"") + "\""}</em></div>
            </div>
          )}

          {/* Freigabe-Anfrage Formular */}
          {showAnfrageForm&&(
            <div style={{padding:"10px 12px",background:"var(--surface)",border:`0.5px solid ${AM}`,borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:700,color:AM,marginBottom:6}}>Grund für die Freigabe-Anfrage</div>
              <textarea
                value={anfrageBegruendung}
                onChange={e=>setAnfrageBegruendung(e.target.value)}
                placeholder="z.B. Terminkonflikt, Krankheit, familiärer Grund …"
                rows={3}
                style={{width:"100%",padding:"6px 8px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,resize:"vertical",boxSizing:"border-box",marginBottom:7,fontFamily:FONT}}
              />
              <div style={{display:"flex",gap:8}}>
                <button
                  onClick={handleAnfrageSenden}
                  disabled={!anfrageBegruendung.trim()}
                  style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:anfrageBegruendung.trim()?"pointer":"default",border:"none",background:anfrageBegruendung.trim()?AM:"#ccc",color:"#fff"}}>
                  Anfrage senden
                </button>
                <button onClick={()=>{setShowAnfrageForm(false);setAnfrageBegruendung("");}} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)"}}>Abbrechen</button>
              </div>
            </div>
          )}

          {/* Übertragung-Formular */}
          {showTransfer&&(
            <div style={{padding:"9px 11px",background:"var(--surface)",border:`0.5px solid #0891B2`,borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:600,color:"#0891B2",marginBottom:6}}>Schicht an wen übertragen?</div>
              {/* Suchfeld */}
              <div style={{position:"relative",marginBottom:6}}>
                <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"var(--sub)",pointerEvents:"none"}}><TI n="search"/></span>
                <input
                  value={zuteilSearch}
                  onChange={e=>{setZuteilSearch(e.target.value);setTransferTarget("");}}
                  placeholder="Person suchen…"
                  style={{width:"100%",padding:"5px 8px 5px 26px",border:`0.5px solid ${zuteilSearch?"#0891B2":GB}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}
                />
                {zuteilSearch&&<button onClick={()=>{setZuteilSearch("");setTransferTarget("");}} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--sub)",lineHeight:1}}>×</button>}
              </div>
              {/* Gefilterte Liste */}
              {(()=>{
                const kandidaten=ALLE_HELFER_NAMEN.filter(n=>n!==meinName&&!helfer.includes(n));
                const gefiltert=kandidaten.filter(n=>!zuteilSearch||n.toLowerCase().includes(zuteilSearch.toLowerCase()));
                if(gefiltert.length===0) return <div style={{fontSize:13,color:"var(--sub)",padding:"4px 0",marginBottom:7}}>Keine Treffer.</div>;
                return(
                  <div style={{maxHeight:140,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,marginBottom:7}}>
                    {gefiltert.map(n=>{
                      const h=HELPERS.find(m=>m.name===n);
                      const info=h?.gruppe||h?.role||"";
                      const selected=transferTarget===n;
                      return(
                        <button key={n} onClick={()=>setTransferTarget(selected?"":n)}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,border:`0.5px solid ${selected?"#0891B2":GB}`,background:selected?"#ECFEFF":"#fff",cursor:"pointer",textAlign:"left"}}>
                          <Av name={n} size={20} bg={selected?"#0891B2":"#9CA3AF"}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:selected?700:400,color:selected?"#0891B2":"#374151"}}>{n}</div>
                            {info&&<div style={{fontSize:13,color:"var(--sub)"}}>{info}</div>}
                          </div>
                          {selected&&<span style={{fontSize:13,color:"#0891B2",flexShrink:0}}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleÜbertragen} disabled={!transferTarget} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:transferTarget?"pointer":"default",border:"none",background:transferTarget?"#0891B2":"#ccc",color:"#fff"}}>Übertragen</button>
                <button onClick={()=>{setShowTransfer(false);setTransferTarget("");}} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)"}}>Abbrechen</button>
              </div>
            </div>
          )}
        </div>
      ):!voll?(
        <div>
          {/* Trainer: Zuteilungs-Dropdown */}
          {canZuteilen&&!showZuteilen&&(
            <button onClick={()=>setShowZuteilen(true)} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"var(--surface2)",color:"var(--text)"}}>
              + Zuteilen
            </button>
          )}
          {/* Standard Eintragen für alle anderen */}
          {!canZuteilen&&(
            <button onClick={()=>onEintragen(schicht.id,meinName)} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"var(--surface2)",color:"var(--text)"}}>
              ✓ Eintragen
            </button>
          )}
          {/* Zuteilungs-Formular */}
          {canZuteilen&&showZuteilen&&(
            <div style={{padding:"9px 11px",background:"var(--surface)",border:`0.5px solid ${GN}`,borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:600,color:GN,marginBottom:6}}>Wen zuteilen?</div>
              {/* Suchfeld */}
              <div style={{position:"relative",marginBottom:6}}>
                <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"var(--sub)",pointerEvents:"none"}}><TI n="search"/></span>
                <input
                  value={zuteilSearch}
                  onChange={e=>{setZuteilSearch(e.target.value);setZuteilTarget("");}}
                  placeholder="Name suchen…"
                  style={{width:"100%",padding:"5px 8px 5px 26px",border:`0.5px solid ${zuteilSearch?GN:GB}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box"}}
                />
                {zuteilSearch&&<button onClick={()=>{setZuteilSearch("");setZuteilTarget("");}} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--sub)",lineHeight:1}}>×</button>}
              </div>
              {/* Gefilterte Liste */}
              {(()=>{
                const gefiltert=zuteilKandidaten.filter(n=>n.toLowerCase().includes(zuteilSearch.toLowerCase()));
                if(gefiltert.length===0) return <div style={{fontSize:13,color:"var(--sub)",padding:"4px 0"}}>Keine Treffer.</div>;
                return(
                  <div style={{maxHeight:140,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,marginBottom:7}}>
                    {gefiltert.map(n=>{
                      const gruppe=HELPERS.find(m=>m.name===n)?.gruppe||"";
                      const selected=zuteilTarget===n;
                      return(
                        <button key={n} onClick={()=>setZuteilTarget(selected?"":n)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,border:`0.5px solid ${selected?GN:GB}`,background:selected?GN+"18":"#fff",cursor:"pointer",textAlign:"left",width:"100%"}}>
                          <Av name={n} size={20} bg={selected?GN:"#bbb"}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:selected?700:400,color:selected?GN:BK}}>
                              {n}{n===meinName&&<span style={{fontSize:13,color:GN,marginLeft:5}}>(ich)</span>}
                            </div>
                            {gruppe&&<div style={{fontSize:13,color:"var(--sub)",marginTop:1}}>{gruppe}</div>}
                          </div>
                          {selected&&<span style={{fontSize:13,color:GN,flexShrink:0}}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleZuteilen} disabled={!zuteilTarget} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:zuteilTarget?"pointer":"default",border:"none",background:zuteilTarget?GN:"#ccc",color:"#fff"}}>Zuteilen</button>
                <button onClick={()=>{setShowZuteilen(false);setZuteilTarget("");setZuteilSearch("");}} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)"}}>Abbrechen</button>
              </div>
            </div>
          )}
        </div>
      ):(
        <div style={{marginTop:10}}>
          <button disabled style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"default",border:"0.5px solid var(--border)",background:"var(--surface2)",color:"var(--sub)"}}>Besetzt</button>
        </div>
      )}

      {/* Funktionär/Admin: Freigabe-Anfrage mit Begründung bestätigen */}
      {canFreigeben&&anfragePending&&(
        <div style={{marginTop:8,padding:"9px 12px",background:AM+"12",border:`0.5px solid ${AM}`,borderRadius:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div>
              <div style={{fontSize:13,color:AM,fontWeight:700,marginBottom:2}}>Freigabe-Anfrage von {anfrageData?.name}</div>
              <div style={{fontSize:13,color:"var(--sub)"}}>Begründung: <em>{"\"" + (anfrageData?.begruendung||"") + "\""}</em></div>
            </div>
            <button onClick={()=>onFreigeben(schicht.id,null)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:AM,color:"#fff",flexShrink:0}}>Freigeben ✓</button>
          </div>
        </div>
      )}
      {/* Admin/Funktionär: jemanden direkt austragen */}
      {canFreigeben&&!ichDrin&&helfer.length>0&&(
        <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
          {helfer.map((h,i)=>(
            <button key={i} onClick={()=>onFreigeben(schicht.id,h)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:`0.5px solid ${R}`,background:"var(--surface)",color:R}}>
              {h} ✕
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

/* Einzelne Schicht-Zeile im "Mein Einsatz"-Tab - mit eigenem Freigabe-Formular */
function MeinSchichtEintrag({schicht,anfragePending,anfrageData,meinName,onÜbertragen,onFreigeben}){
  const [showAnfrageForm,setShowAnfrageForm]=useState(false);
  const [begruendung,setBegruendung]=useState("");
  const [showTransfer,setShowTransfer]=useState(false);
  const [transferTarget,setTransferTarget]=useState("");
  const [sent,setSent]=useState(false);

  const handleSenden=()=>{
    if(!begruendung.trim()) return;
    onFreigeben(schicht.id,meinName,begruendung.trim());
    setShowAnfrageForm(false);
    setBegruendung("");
    setSent(true);
    setTimeout(()=>setSent(false),3000);
  };

  const handleÜbertragen=()=>{
    if(!transferTarget.trim()) return;
    onÜbertragen(schicht.id,meinName,transferTarget.trim());
    setShowTransfer(false);
    setTransferTarget("");
  };

  return(
    <div style={{background:"var(--surface)",border:`${anfragePending?"1.5px":"0.5px"} solid ${anfragePending?"#F59E0B":GB}`,borderRadius:10,overflow:"hidden",borderTop:`4px solid ${schicht.eventColor||AM}`}}>
      {/* Event-Label */}
      <div style={{padding:"14px 18px",background:"var(--surface)",borderBottom:"0.5px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--text)",letterSpacing:-0.2}}>{schicht.eventName}</div>
          <div style={{fontSize:13,color:"var(--sub)",marginTop:3,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span>{schicht.einsatzName}</span>
            {schicht.einsatzDate&&<><span style={{opacity:0.4}}>{"|"}</span><span>{""+schicht.einsatzDate}</span></>}
            {schicht.einsatzOrt&&<><span style={{opacity:0.4}}>{"|"}</span><span>{""+schicht.einsatzOrt}</span></>}
          </div>
        </div>
        <div style={{flexShrink:0}}>
          {anfragePending
            ?<Chip text="⏳ Freigabe ausstehend" color={AM} bg="#FFFBEB"/>
            :<Chip text="Geplant ⏳" color={AM} bg="#FFFBEB"/>
          }
        </div>
      </div>
      <div style={{padding:"10px 14px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:8}}>
        <div>
          <div style={{fontWeight:700,fontSize:13}}>{schicht.label}</div>
        </div>
      </div>

      {/* Bestätigung nach Absenden */}
      {sent&&<div style={{fontSize:13,color:GN,fontWeight:600,marginBottom:6}}>✓ Anfrage gesendet - wird von Funktionär/Admin geprüft.</div>}

      {/* Ausstehende Anfrage: Begründung anzeigen */}
      {anfragePending&&(
        <div style={{fontSize:13,color:AM,background:"var(--surface)",borderRadius:6,padding:"6px 9px",border:`0.5px solid ${AM}40`}}>
          <span style={{fontWeight:700}}>Begründung:</span> <em>{"\"" + (anfrageData?.begruendung||"") + "\""}</em><br/>
          <span style={{color:"var(--sub)",marginTop:3,display:"block"}}>Wartet auf Freigabe durch Funktionär/Admin.</span>
        </div>
      )}

      {/* Aktionen (nur wenn keine Anfrage pending) */}
      {!anfragePending&&!sent&&(
        <div>
          {!showAnfrageForm&&!showTransfer&&(
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowTransfer(true)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`0.5px solid #0891B2`,background:"var(--surface)",color:"#0891B2"}}>
                ⇄ Übertragen
              </button>
              <button onClick={()=>setShowAnfrageForm(true)} style={{padding:"4px 10px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",border:`0.5px solid ${AM}`,background:"var(--surface)",color:AM}}>
                ↩ Freigabe anfragen
              </button>
            </div>
          )}

          {/* Freigabe-Formular */}
          {showAnfrageForm&&(
            <div style={{padding:"9px 11px",background:"var(--surface)",border:`0.5px solid ${AM}`,borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:700,color:AM,marginBottom:6}}>Grund für die Freigabe-Anfrage</div>
              <textarea
                value={begruendung}
                onChange={e=>setBegruendung(e.target.value)}
                placeholder="z.B. Terminkonflikt, Krankheit, familiärer Grund …"
                rows={3}
                style={{width:"100%",padding:"6px 8px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,resize:"vertical",boxSizing:"border-box",marginBottom:7,fontFamily:FONT}}
              />
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleSenden} disabled={!begruendung.trim()} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:begruendung.trim()?"pointer":"default",border:"none",background:begruendung.trim()?AM:"#ccc",color:"#fff"}}>
                  Anfrage senden
                </button>
                <button onClick={()=>{setShowAnfrageForm(false);setBegruendung("");}} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)"}}>Abbrechen</button>
              </div>
            </div>
          )}

          {/* Übertragung-Formular */}
          {showTransfer&&(
            <div style={{padding:"9px 11px",background:"var(--surface)",border:`0.5px solid ${BL}`,borderRadius:8}}>
              <div style={{fontSize:13,fontWeight:600,color:BL,marginBottom:6}}>Schicht übertragen an:</div>
              <select value={transferTarget} onChange={e=>setTransferTarget(e.target.value)} style={{width:"100%",padding:"5px 8px",border:"0.5px solid var(--border)",borderRadius:6,fontSize:13,marginBottom:7}}>
                <option value="">- Person auswählen -</option>
                {ALLE_HELFER_NAMEN.filter(n=>n!==meinName).map(n=>(
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleÜbertragen} disabled={!transferTarget} style={{padding:"4px 11px",borderRadius:6,fontSize:13,fontWeight:600,cursor:transferTarget?"pointer":"default",border:"none",background:transferTarget?"#0891B2":"#ccc",color:"#fff"}}>Übertragen</button>
                <button onClick={()=>{setShowTransfer(false);setTransferTarget("");}} style={{padding:"4px 10px",borderRadius:6,fontSize:13,cursor:"pointer",border:"0.5px solid var(--border)",background:"var(--surface)",color:"var(--sub)"}}>Abbrechen</button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/* ==========================================
   PROFIL MODAL
========================================== */
/* ── DARK MODE ROW (für ProfileModal) ── */
function getFieldVisibility(role){
  const lvl = ROLES[role]?.level||0;
  return {
    showAhv:       lvl>=5 && role==="administration" || role==="administrator",
    showGebdat:    lvl>=3,   // ab trainer
    showAdresse:   lvl>=5,   // ab administration
    showTelefon:   lvl>=3,   // ab trainer
    showEmail:     lvl>=2,   // ab spieler (eigene)
    showPass:      lvl>=3,   // ab trainer
    showFairgateId:lvl>=5,   // ab administration
    showNotizen:   lvl>=5,   // ab administration
  };
}

/* ── Dynamische Navigation für funktionaer/stufenleitung ─────
   Baut die Nav-Items aus den zugewiesenen Gruppen auf.
   Alle anderen Rollen nutzen NAV_BY_ROLE direkt.
──────────────────────────────────────────────────────────── */
const ALL_NAV_ITEMS=[
  {key:"dashboard",          icon:"layout-dashboard", label:"Home"},
  {key:"members",            icon:"users",            label:"Mitglieder"},
  {key:"team",               icon:"ball-football",    label:"Meine Stufe"},
  {key:"training",           icon:"calendar",         label:"Trainingsplan"},
  {key:"schedule",           icon:"flag",             label:"Spielplan"},
  {key:"attendance_central", icon:"chart-bar",        label:"Anwesenheiten"},
  {key:"news",               icon:"news",             label:"News"},
  {key:"events",             icon:"calendar-event",   label:"Termine"},
  {key:"helpers",            icon:"heart-handshake",  label:"Helfereinsätze"},
  {key:"buses",              icon:"bus",              label:"Vereinsbusse"},
  {key:"material",           icon:"package",          label:"Material"},
  {key:"lockers",            icon:"door-exit",        label:"Garderoben"},
  {key:"media",              icon:"speakerphone",     label:"Medien & Berichte"},
  {key:"wiki",               icon:"book",             label:"Wiki"},
  {key:"docs",               icon:"file-text",        label:"Dokumente"},
  {key:"portal",             icon:"settings",         label:"Portalverwaltung"},
];

/* ==========================================
   APP ROOT
========================================== */
function LoginScreen({onLogin, sb, appTheme}){
  const isMobile=useIsMobile();
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [resetSent,setResetSent]=useState(false);
  const [showReset,setShowReset]=useState(false);

  async function handleLogin(e){
    e.preventDefault();
    setLoading(true); setError("");
    try{
      const {data,error:err}=await sb.auth.signInWithPassword({email,password:pw});
      if(err) throw err;
      onLogin(data.session);
    }catch(err){
      setError(err.message==="Invalid login credentials"
        ?"E-Mail oder Passwort falsch."
        :err.message||"Fehler beim Einloggen.");
    }
    setLoading(false);
  }

  async function handleReset(e){
    e.preventDefault();
    setLoading(true); setError("");
    try{
      const {error:err}=await sb.auth.resetPasswordForEmail(email,{
        redirectTo: window.location.origin
      });
      if(err) throw err;
      setResetSent(true);
    }catch(err){
      setError(err.message||"Fehler beim Senden.");
    }
    setLoading(false);
  }

  return(
    <div style={{minHeight:"100dvh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,WebkitFontSmoothing:"antialiased",color:"var(--text)"}}>
      <div style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"transparent",borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12,overflow:"hidden"}}><img src={appTheme?.logo||LOGO_B64} style={{width:64,height:64,objectFit:"cover",display:"block"}} alt="Logo"/></div>
          <div style={{fontWeight:800,fontSize:21,color:"var(--text)",marginTop:4}}>{appTheme?.vereinsname||getVereinsnameStatic()}</div>
          <div style={{fontSize:14,color:"var(--sub)",marginTop:3,fontWeight:600}}>{"ClubCampus"}</div>
        </div>

        <div style={{background:"var(--surface)",borderRadius:16,padding:28,boxShadow:"var(--card-shadow)",border:"1px solid var(--border)"}}>
          {!showReset ? (
            <>
              <div style={{fontWeight:700,fontSize:16,color:"var(--text)",marginBottom:20}}>Anmelden</div>
              <form onSubmit={handleLogin}>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:13,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:5}}>E-Mail</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+GB,fontSize:14,outline:"none",boxSizing:"border-box"}}
                    placeholder="name@mail.ch" autoComplete="email"/>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:13,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:5}}>Passwort</label>
                  <div style={{position:"relative"}}>
                    <input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} required
                      style={{width:"100%",padding:"10px 40px 10px 12px",borderRadius:8,border:"1px solid "+GB,fontSize:14,outline:"none",boxSizing:"border-box"}}
                      placeholder="••••••••" autoComplete="current-password"/>
                    <button type="button" onClick={()=>setShowPw(p=>!p)}
                      style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--sub)",padding:4,display:"flex",alignItems:"center"}}>
                      <TI n={showPw?"eye-off":"eye"} size={16}/>
                    </button>
                  </div>
                </div>
                {error&&<div style={{fontSize:13,color:"#DC2626",background:"#FEF2F2",padding:"8px 12px",borderRadius:8,marginBottom:14}}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:ACCENT,color:"var(--text)",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
                  {loading?"Wird angemeldet…":"Anmelden"}
                </button>
              </form>
              <button onClick={()=>{setShowReset(true);setError("");}}
                style={{marginTop:14,width:"100%",background:"none",border:"none",color:"var(--sub)",fontSize:13,cursor:"pointer",textAlign:"center"}}>
                Passwort vergessen?
              </button>
            </>
          ) : (
            <>
              <div style={{fontWeight:700,fontSize:16,color:"var(--text)",marginBottom:6}}>Passwort zurücksetzen</div>
              <div style={{fontSize:13,color:"var(--sub)",marginBottom:20}}>Wir senden dir einen Link per E-Mail.</div>
              {resetSent ? (
                <div style={{fontSize:13,color:GN,background:"var(--surface)",padding:"12px",borderRadius:8,textAlign:"center"}}>
                  E-Mail gesendet! Bitte prüfe dein Postfach.
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:13,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:5}}>E-Mail</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                      style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+GB,fontSize:14,outline:"none",boxSizing:"border-box"}}
                      placeholder="name@mail.ch"/>
                  </div>
                  {error&&<div style={{fontSize:13,color:"#DC2626",background:"#FEF2F2",padding:"8px 12px",borderRadius:8,marginBottom:14}}>{error}</div>}
                  <button type="submit" disabled={loading}
                    style={{width:"100%",padding:"8px 14px",borderRadius:8,border:"none",background:ACCENT,color:"var(--text)",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                    {loading?"Wird gesendet…":"Link senden"}
                  </button>
                </form>
              )}
              <button onClick={()=>{setShowReset(false);setResetSent(false);setError("");}}
                style={{marginTop:14,width:"100%",background:"none",border:"none",color:"var(--sub)",fontSize:13,cursor:"pointer",textAlign:"center"}}>
                ← Zurück zum Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NachrichtenModul — Broadcast & Diskussions-Modul
   ══════════════════════════════════════════════════════════════════ */
/* NachrichtenModul via ./NachrichtenModul.jsx */

function Portal({supabaseClient}){
  const sbRef = useRef(supabaseClient||supabase||null);
  const sb = sbRef.current;
  const [session,setSession]=useState(sb ? undefined : null);
  const [dbUser,setDbUser]=useState(null);
  const [dbTeams,setDbTeams]=useState([]);
  const [dbStufen,setDbStufen]=useState([]);
  const [dbMitglieder,setDbMitglieder]=useState([]);
  const [dbFunktionen,setDbFunktionen]=useState([]); // portal_funktionen des eingeloggten Benutzers
  /* Globale Modul-Konfiguration (aus Portalverwaltung) */
  const [moduleAktiv,setModuleAktiv]=useState(()=>{
    try{const s=localStorage.getItem("cc-module-aktiv");return s?JSON.parse(s):{};}catch{return {};}
  });
  const [moduleRechte,setModuleRechte]=useState(()=>{
    try{const s=localStorage.getItem("cc-module-rechte");return s?JSON.parse(s):null;}catch{return null;}
  });
  const [accountKey,setAccountKey]=useState("trainer");
  const [activeSubRole,setActiveSubRole]=useState(null);
  const [active,setActive]=useState(()=>{
    try{
      const hash=window.location.hash.replace("#","");
      if(hash) return hash;
      return sessionStorage.getItem("cc-active")||"dashboard";
    }catch{return "dashboard";}
  });
  const setActivePersist=(key)=>{
    try{
      sessionStorage.setItem("cc-active",key);
      window.history.pushState({page:key},"","#"+key);
    }catch{}
    setActive(key);
    setCustomBack(null);
  };
  const {isMobile,isTablet}=useBreakpoint();
  const [mobileProfileOpen,setMobileProfileOpen]=useState(false);
  const [customBack,setCustomBack]=useState(null);
  const customBackRef=useRef(null);
  const setCustomBackAndRef=(fn)=>{customBackRef.current=fn||null;setCustomBack(fn);};

  /* Browser Zurück/Vor via popstate */
  useEffect(()=>{
    const onPop=(e)=>{
      /* Sub-Navigation offen (z.B. Team-Detail): zurück zur Übersicht */
      if(customBackRef.current){
        customBackRef.current();
        customBackRef.current=null;
        setCustomBack(null);
        return;
      }
      const key=e.state?.page||(window.location.hash.replace("#","")||"dashboard");
      setActive(key);
      try{sessionStorage.setItem("cc-active",key);}catch{}
    };
    window.addEventListener("popstate",onPop);
    /* Initialen Hash-State setzen damit der erste Zurück-Schritt funktioniert */
    try{
      const cur=window.location.hash.replace("#","")||"dashboard";
      if(!window.history.state?.page){
        window.history.replaceState({page:cur},"","#"+cur);
      }
    }catch{}
    return()=>window.removeEventListener("popstate",onPop);
  },[]);
  /* ── Dark Mode ── */
  const [dark,setDark]=useState(()=>{
    try{const s=localStorage.getItem("cc-dark");return s?JSON.parse(s):window.matchMedia("(prefers-color-scheme: dark)").matches;}catch{return false;}
  });
  const toggleDark=()=>setDark(d=>{const n=!d;try{localStorage.setItem("cc-dark",n);}catch{}return n;});

  /* ── App-Level Theme State ── */
  const [appTheme,setAppTheme]=useState(()=>{
    try{const s=localStorage.getItem("cc-theme");return s?{...THEME_DEFAULT_STATIC,...JSON.parse(s)}:THEME_DEFAULT_STATIC;}catch{return THEME_DEFAULT_STATIC;}
  });

  /* ── Tenant State ── */
  const [tenant,setTenant]=useState(null); // {slug, name, theme}

  /* Tenant aus Supabase laden */
  async function loadTenant(){
    if(!sb) return;
    try{
      /* Theme aus vereine laden - kein Login nötig (public read) */
      const{data,error}=await sb.from("vereine").select("id,name,theme").single();
      if(error||!data) return;
      setTenant(data);
      const t={...THEME_DEFAULT_STATIC,...(data.theme||{})};
      setAppTheme(t);
      applyThemeCss(t);
      /* localStorage aktualisieren */
      try{localStorage.setItem("cc-theme",JSON.stringify(t));}catch{}
    }catch(e){console.warn("[CC] loadTenant:",e.message);}
  }

  /* ── Inter Font + PWA Globals ── */
  useEffect(()=>{
    if(!document.getElementById("inter-font")){
      const l=document.createElement("link");l.id="inter-font";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    if(!document.getElementById("cc-pwa-css")){
      const s=document.createElement("style");s.id="cc-pwa-css";s.textContent=PWA_CSS;
      document.head.appendChild(s);
    }
    let m=document.querySelector("meta[name=viewport]");
    if(!m){m=document.createElement("meta");m.name="viewport";document.head.appendChild(m);}
    m.content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=yes";
    /* PWA Standalone – Adressleiste ausblenden */
    const setMeta=(n,v)=>{let t=document.querySelector(`meta[name="${n}"]`);if(!t){t=document.createElement("meta");t.name=n;document.head.appendChild(t);}t.content=v;};
    setMeta("apple-mobile-web-app-capable","yes");
    setMeta("apple-mobile-web-app-status-bar-style","black-translucent");
    setMeta("mobile-web-app-capable","yes");
    setMeta("apple-mobile-web-app-title",appTheme?.vereinsname||getVereinsnameStatic());
    /* manifest.json link – falls noch nicht vorhanden */
    if(!document.querySelector("link[rel=manifest]")){
      const lm=document.createElement("link");lm.rel="manifest";lm.href="/manifest.json";
      document.head.appendChild(lm);
    }
    let th=document.querySelector("meta[name=theme-color]");
    if(!th){th=document.createElement("meta");th.name="theme-color";document.head.appendChild(th);}
    th.content=dark?"#0a0a0c":"#141414";
  },[dark]);

  /* Theme beim Start laden - erst localStorage, dann Supabase */
  useEffect(()=>{
    /* 1. Sofort localStorage anwenden (schnell, kein Flicker) */
    try{
      const s=localStorage.getItem("cc-theme");
      if(s) applyThemeCss({...THEME_DEFAULT_STATIC,...JSON.parse(s)});
      else applyThemeCss(THEME_DEFAULT_STATIC);
    }catch{
      applyThemeCss(THEME_DEFAULT_STATIC);
    }
    /* 2. Supabase laden (überschreibt localStorage mit aktuellen Werten) */
    loadTenant();
  },[]);

  // Auth-Session beim Start prüfen
  useEffect(()=>{
    if(!sb){ setSession(null); return; }
    sb.auth.getSession().then(({data:{session}})=>{
      setSession(session||null);
      if(session){ loadDbUser(session.user.id, session.user.email); loadDbTeams(); loadDbStufen(); loadDbMitglieder(); loadDbFunktionen(session?.user?.id); loadModuleConfig(); loadTheme(); }
    });
    const {data:{subscription}}=sb.auth.onAuthStateChange(function(_,session){
      setSession(session||null);
      if(session){ loadDbUser(session.user.id, session.user.email); loadDbTeams(); loadDbStufen(); loadDbMitglieder(); loadTheme(); }
      else setDbUser(null);
    });

    /* Realtime: Theme-Änderungen sofort übernehmen */
    let themeSub=null;
    try{
      themeSub=sb.channel("theme-changes")
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"vereine"},
          payload=>{
            const t={...THEME_DEFAULT_STATIC,...(payload.new?.theme||{})};
            setAppTheme(t);
            applyThemeCss(t);
            try{localStorage.setItem("cc-theme",JSON.stringify(t));}catch{}
          })
        .subscribe();
    }catch{}

    return function(){ subscription.unsubscribe(); if(themeSub) sb.removeChannel(themeSub); };
  },[]);

  async function loadDbUser(uid, email){
    try {
      const {data, error} = await sb.from("benutzer").select("*").eq("id",uid).single();
      if(data){
        setDbUser(data);
      } else {
        console.warn("[FCH] benutzer nicht gefunden:", error?.message);
        setDbUser({id:uid, email:email||"", role:"administrator", teams:[], name:email||"Benutzer"});
      }
    } catch(e) {
      console.warn("[FCH] loadDbUser error:", e.message);
      setDbUser({id:uid, email:email||"", role:"administrator", teams:[], name:email||"Benutzer"});
    }
  }

  async function loadDbTeams(){
    if(!sb) return;
    try{
      const{data}=await sb.from("teams").select("*, team_module(modul,aktiv)").eq("aktiv",true).order("hauptbereich").order("name");
      if(data&&data.length>0) setDbTeams(data.map(t=>({
        ...t,
        module_aktiv:(t.team_module||[]).filter(m=>m.aktiv).map(m=>m.modul)
      })));
    }catch(e){ console.warn("[FCH] loadDbTeams:", e.message); }
  }

  /* ── Theme aus Supabase laden ── */
  async function loadTheme(){
    if(!sb) return;
    try{
      const{data,error}=await sb.from("vereine").select("theme").single();
      if(error||!data) return;
      const saved=data.theme||{};
      const t={...THEME_DEFAULT_STATIC,...saved};
      setAppTheme(t);
      applyThemeCss(t);
      try{localStorage.setItem("cc-theme",JSON.stringify(t));}catch{}
    }catch(e){
      console.warn("[CC] loadTheme:",e.message);
    }
  }

  function applyThemeCss(t){
    /* Inject style tag to override [data-theme] CSS rules */
    let s=document.getElementById("cc-theme-vars");
    if(!s){s=document.createElement("style");s.id="cc-theme-vars";document.head.appendChild(s);}
    const nav=t.navBg||"#000000";
    const navT=t.navText||"#FFFFFF";
    const navA=t.navAccent||t.vereinsfarbe1||"#FFBF00";
    const navAT=t.navAccentText||t.vereinsfarbe2||"#000000";
    const avBg=t.avatarBg||t.vereinsfarbe1||"#FFBF00";
    const avTxt=t.avatarText||t.vereinsfarbe2||"#000000";
    const navH=t.navHover||"#1A1A1A";
    const acc=t.vereinsfarbe1||"#FFBF00";
    const acc2=t.vereinsfarbe2||"#000000";
    const btn=t.btnPrimary||"#FFBF00";
    const btnT=t.btnPrimaryText||"#000000";
    const btnHov=darkenHex(t.btnPrimary||"#FFBF00");
    s.textContent=`:root,[data-theme],[data-theme=dark],[data-theme=light]{
      --cc-accent:${acc}!important;
      --cc-accent2:${acc2}!important;
      --cc-hover:${hexToRgba(acc,0.19)}!important;
      --cc-accent-20:${hexToRgba(acc,0.12)}!important;
      --cc-accent-15:${hexToRgba(acc,0.09)}!important;
      --cc-accent-12:${hexToRgba(acc,0.07)}!important;
      --nav:${nav}!important;
      --nav-t:${navT}!important;
      --nav-a:${navA}!important;
      --nav-accent-text:${navAT}!important;
      --avatar-bg:${avBg}!important;
      --avatar-text:${avTxt}!important;
      --nav-b:color-mix(in srgb,${nav} 80%,white 20%)!important;
      --nav-hover:${navH}!important;
      --btn-primary:${btn}!important;
      --btn-primary-text:${btnT}!important;
      --btn-hover:${btnHov}!important;
    }
    .cc-btn-primary:hover{background:var(--btn-hover)!important;transition:background 0.15s;}`;
  }

  async function loadModuleConfig(){
    if(!sb) return;
    try{
      const[mcR,mrR]=await Promise.all([
        sb.from("module_config").select("modul,aktiv"),
        sb.from("modul_rechte").select("modul,rolle,hat_zugriff,stufe"),
      ]);
      if(mcR.data&&mcR.data.length>0){
        const ma={};
        mcR.data.forEach(r=>{ma[r.modul]=r.aktiv!==false;});
        setModuleAktiv(ma);
        try{localStorage.setItem("cc-module-aktiv",JSON.stringify(ma));}catch{}
      }
      if(mrR.data&&mrR.data.length>0){
        const mr={};
        mrR.data.forEach(r=>{
          if(!mr[r.rolle]) mr[r.rolle]=[];
          if(r.hat_zugriff) mr[r.rolle].push(r.modul);
        });
        setModuleRechte(mr);
        try{localStorage.setItem("cc-module-rechte",JSON.stringify(mr));}catch{}
      }
    }catch(e){ console.warn("[FCH] loadModuleConfig:", e.message); }
  }

  async function loadDbStufen(){
    if(!sb) return;
    try{
      const{data}=await sb.from("team_stufen").select("*").order("ebene").order("sortorder");
      if(data&&data.length>0) setDbStufen(data);
    }catch(e){ console.warn("[FCH] loadDbStufen:", e.message); }
  }

  async function loadDbFunktionen(uid){
    if(!sb||!uid) return;
    try{
      const{data}=await sb.from("benutzer_funktionen")
        .select("funktion_id, portal_funktionen(*, portal_gruppen(*))")
        .eq("benutzer_id",uid);
      if(data) setDbFunktionen(data.map(d=>d.portal_funktionen).filter(Boolean));
    }catch(e){ console.warn("[FCH] loadDbFunktionen:", e.message); }
  }

  async function loadDbMitglieder(){
    if(!sb) return;
    try{
      const{data}=await sb.from("mitglieder").select("*").eq("aktiv",true).order("nachname").order("vorname");
      if(data&&data.length>0) setDbMitglieder(data);
    }catch(e){ console.warn("[FCH] loadDbMitglieder:", e.message); }
  }

  async function handleLogout(){
    if(sb) await sb.auth.signOut();
    setSession(null); setDbUser(null); setActive("dashboard");
  }

  // Lade-Screen (initial oder während dbUser lädt nach Login)
  if(session===undefined){
    return(
      <div style={{minHeight:"100dvh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:16,overflow:"hidden",display:"inline-flex",marginBottom:12}}>
            <img src={appTheme?.logo||LOGO_B64} style={{width:64,height:64,objectFit:"cover"}} alt="Logo"/>
          </div>
          <div style={{fontSize:13,color:"var(--sub)"}}>Wird geladen…</div>
        </div>
      </div>
    );
  }

  // Login-Screen wenn nicht eingeloggt (oder kein Supabase)
  if(sb && !session){
    return <LoginScreen sb={sb} onLogin={s=>setSession(s)} appTheme={appTheme}/>;
  }

  // Rolle aus DB-User oder Demo-Fallback
  const effectiveAccountKey = dbUser ? "db_user" : accountKey;
  const dbAccount = dbUser ? {
    name: dbUser.name||dbUser.email||"Benutzer",
    rollen: [dbUser.role||"spieler"],
    primaryRole: dbUser.role||"spieler",
    kinder: [],
    teams: dbUser.teams||[],
    email: dbUser.email||"",
  } : null;

  const account = dbAccount || USER_ACCOUNTS[accountKey] || USER_ACCOUNTS.trainer;
  const rawRole = activeSubRole || account.primaryRole || "spieler";
  const role = rawRole.toLowerCase()
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue");
  const kinder = account.kinder||[];
  const spielerTeam = account.teams?.length>0 ? account.teams : [];
  const trainerTeams = account.teams||["Cc-Junioren"];
  const meineTeams = role==="trainer"
    ? trainerTeams
    : kinder.length>0 ? [...new Set(kinder.map(k=>k.team))]
    : spielerTeam.length>0 ? spielerTeam : ["Cc-Junioren"];
  const myRosterId = account.rosterId||(role==="spieler"?1:role==="eltern"?1:role==="trainer"?200:null);
  /* Dynamische Navigation (funktionaer/stufenleitung aus Gruppen) */
  /* Modul-Sichtbarkeit prüfen: global + pro Rolle */
  const isModuleVisible=(key)=>{
    if(key==="dashboard") return true;
    if(role==="administrator") return true; // Admin sieht immer alles
    if(moduleAktiv[key]===false) return false; // global deaktiviert
    /* Nur blocken wenn Rolle explizit konfiguriert UND mehr als 3 Module hat
       (verhindert dass neue Module geblockt werden weil localStorage alt ist) */
    if(moduleRechte&&moduleRechte[role]!==undefined&&moduleRechte[role].length>3&&!moduleRechte[role].includes(key)) return false;
    return true;
  };

  const effectiveNav = getNavForRole(role, dbFunktionen)
    .filter(n=>isModuleVisible(n.key));

  /* ── App-Level Zugriffstufen-Hilfsfunktionen ── */
  const APP_ZUGRIFF_DEFAULT={
    administrator:  {_all:"verwalten"},
    vorstand:       {_all:"lesen"},
    administration: {_all:"verwalten",dashboard:"lesen"},
    funktionaer:    {_all:"lesen"},
    trainer:        {_all:"lesen",team:"verwalten",training:"verwalten",events:"verwalten",attendance_central:"schreiben",helpers:"verwalten",buses:"schreiben",material:"schreiben",media:"schreiben",wiki:"schreiben",members:"schreiben",schedule:"lesen"},
    spieler:        {_all:"lesen",events:"schreiben",helpers:"schreiben",buses:"schreiben"},
    eltern:         {_all:"lesen",events:"schreiben",helpers:"schreiben",schedule:"lesen"},
  };

  function getZugriff(modulKey){
    /* Funktionäre: Stufe via Gruppen & Funktionen */
    if(role==="funktionaer"){
      return getEffektiveStufeForFunktionaer(dbFunktionen, modulKey);
    }
    const effR=moduleRechte||{};
    const hatZugriff=effR[role]?effR[role].includes(modulKey):(APP_ZUGRIFF_DEFAULT[role]?.[modulKey]||APP_ZUGRIFF_DEFAULT[role]?._all||"lesen")!=="none";
    if(!hatZugriff) return null;
    const zs=typeof zugriffStufen!=="undefined"?zugriffStufen:null;
    return zs?.[role]?.[modulKey]||APP_ZUGRIFF_DEFAULT[role]?.[modulKey]||APP_ZUGRIFF_DEFAULT[role]?._all||"lesen";
  }

  const kannLesen   =(mod)=>!!getZugriff(mod);
  const kannSchreiben=(mod)=>["schreiben","verwalten"].includes(getZugriff(mod));
  const kannVerwalten=(mod)=>getZugriff(mod)==="verwalten";

  const handleAccountChange=(key)=>{
    setAccountKey(key);
    setActiveSubRole(null);
    setActive("dashboard");
  };

  const getView=()=>{
    if(!isModuleVisible(active)) return <Dashboard role={role} setActive={setActive} account={account} meineTeams={meineTeams} myRosterId={myRosterId}/>;
    switch(active){
      case "dashboard":         return <Dashboard role={role} setActive={setActive} account={account} meineTeams={meineTeams} myRosterId={myRosterId}/>;
      case "team":              return role==="administrator"||role==="administration"?<TeamsAdminView sb={sb} dbTeams={dbTeams} setDbTeams={setDbTeams} dbStufen={dbStufen} setDbStufen={setDbStufen} setCustomBack={setCustomBackAndRef}/>:<TeamView role={role} trainerTeams={trainerTeams} setActive={setActive} myRosterId={myRosterId} account={account} dbTeams={dbTeams} isModuleVisible={isModuleVisible} dbMitglieder={dbMitglieder}/>;
      case "members":           return <MembersView role={role} dbMitglieder={dbMitglieder} kannSchreiben={kannSchreiben} kannVerwalten={kannVerwalten}/>;
      case "users":             return <PortalverwaltungView initialTab="users" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "fieldvis":          return <PortalverwaltungView initialTab="feldvis" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "portal":            return <PortalverwaltungView initialTab="module" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "training":          return <TrainingGantt role={role} team={role==="trainer"?meineTeams?.[0]:undefined} kannSchreiben={kannSchreiben} kannVerwalten={kannVerwalten} sb={sb}/>;
      case "schedule":          return <ScheduleTab role={role}/>;
      case "attendance_central":return <AttendanceCentral/>;
      case "events":            return <div style={{maxWidth:900}}><h1 style={{fontSize:21,fontWeight:800,margin:"0 0 6px"}}>Termine</h1><p style={{fontSize:13,color:"var(--sub)",margin:"0 0 18px"}}>Bitte alle notwendigen Termine zu- oder absagen.</p><AttendanceTab role={role} team={meineTeams?.[0]||"Cc-Junioren"} allTeams={meineTeams} myRosterId={myRosterId} account={account} setActive={setActive} kannSchreiben={kannSchreiben} kannVerwalten={kannVerwalten} onNavigateToSpiel={(spiel)=>{NAV_TARGET.tab="spielplan";NAV_TARGET.selectedSpiel=spiel;setActive("team");}}/></div>;
      case "helpers":           return <HelpersList role={role} meineTeams={meineTeams} account={account} kannSchreiben={kannSchreiben} kannVerwalten={kannVerwalten}/>;
      case "buses":             return <BusesView role={role} kannSchreiben={kannSchreiben} kannVerwalten={kannVerwalten}/>;
      case "material":          return <MaterialView/>;
      case "lockers":           return <LockersView/>;
      case "media":             return <MediaView/>;
      case "nachrichten":       return <NachrichtenModul sb={sb} role={role} account={account} dbTeams={dbTeams} gruppen={dbFunktionen.map(f=>f.portal_gruppen).filter(Boolean)} kannSchreiben={kannSchreiben("nachrichten")} kannVerwalten={kannVerwalten("nachrichten")}/>;
      case "news":              return <NewsView role={role} meineTeams={meineTeams}/>;
      case "wiki":              return <WikiView/>;
      case "docs":              return <DocsView/>;
      case "exports":           return <PortalverwaltungView initialTab="api" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "sync":              return <PortalverwaltungView initialTab="api" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "audit":             return <PortalverwaltungView initialTab="audit" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "datacheck":         return <PortalverwaltungView initialTab="module" moduleAktiv={moduleAktiv} setModuleAktiv={setModuleAktiv} moduleRechte={moduleRechte} setModuleRechte={setModuleRechte} sb={sb} appTheme={appTheme} setAppTheme={setAppTheme} applyThemeCss={applyThemeCss} vereinId={tenant?.id}/>;
      case "profile":           return <ProfileView role={role} myRosterId={myRosterId} account={account}/>;
      default:                  return <Dashboard role={role} setActive={setActive}/>;
    }
  };

  return(
    <ThemeCtx.Provider value={{dark,toggle:toggleDark}}>
      <div data-theme={dark?"dark":"light"} style={{display:"flex",minHeight:"100dvh",background:"var(--bg)",fontFamily:FONT,WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale",color:"var(--text)",transition:"background 0.25s,color 0.25s"}}>
        {!isMobile&&<SideNav role={role} active={active} setActive={setActivePersist} account={account} sb={sb} onNameUpdated={n=>setDbUser(u=>u?{...u,name:n}:u)} onLogout={sb&&session?handleLogout:undefined} appTheme={appTheme}/>}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {isMobile&&<TopBar role={role} active={active} setActive={setActivePersist}
            account={account} activeSubRole={activeSubRole} setActiveSubRole={setActiveSubRole}
            onRoleChange={(key)=>handleAccountChange(key)} isMobile={isMobile}
            onLogout={sb&&session ? handleLogout : undefined}
            onOpenProfile={()=>setMobileProfileOpen(true)}
            onBack={customBack} appTheme={appTheme}/>}
          <main key={active} className="cc-page" style={{flex:1,padding:isMobile?"16px 14px calc(90px + env(safe-area-inset-bottom, 0px))":isTablet?"20px 24px 28px":"32px 36px 32px",overflowY:"auto",overflowX:"hidden",maxWidth:isMobile?"100%":1200,margin:"0 auto",width:"100%"}}>{getView()}</main>
          {isMobile&&<MobileNav role={role} active={active} setActive={setActivePersist} account={account} sb={sb} onNameUpdated={n=>setDbUser(u=>u?{...u,name:n}:u)} onLogout={sb&&session?handleLogout:undefined} effectiveNav={effectiveNav}/>}
        </div>
      </div>
      {isMobile&&<ProfileModal open={mobileProfileOpen} onClose={()=>setMobileProfileOpen(false)} account={account} role={role} sb={sb} onNameUpdated={n=>setDbUser(u=>u?{...u,name:n}:u)} onLogout={sb&&session?handleLogout:undefined}/>}
    </ThemeCtx.Provider>
  );
}

export default Portal;
