/* ═══════════════════════════════════════════════════════════════
   ClubCampus KaderModul — KaderModul.jsx
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { FONT, GN, R, BL, BK } from "./constants.js";
import { TI } from "./icons.jsx";
import { useIsMobile, Card, Av, Row, Between, Col, Btn, Input, ModalOrSheet, ModalTitle } from "./theme.jsx";
import { ROSTER } from "./demoData.js";

const FIELD_VIS = {
  administrator: ["dob","nat","heimatort","ahv","pass","street","plz","city","canton","country","email","tel","parent1","parent2","js","fairgate"],
  administration:["dob","nat","heimatort","ahv","pass","street","plz","city","canton","country","email","tel","parent1","parent2","js","fairgate"],
  funktionaer:   ["dob","pass","street","plz","city","email","tel"],
  trainer:       ["dob","nat","heimatort","pass","street","plz","city","email","tel","parent1","parent2"],
  spieler:       ["dob","pass","street","plz","city","email","tel"],
  eltern:        ["dob","pass","street","plz","city","email","tel"],
};

const NR_CACHE = {data: Object.fromEntries(ROSTER.map(p=>[p.id,p.rueckennr||""]))};

const POSITION_GROUPS = [
  {label:"Torwart",     options:["TW"]},
  {label:"Verteidiger", options:["V","IV","RV","LV"]},
  {label:"Mittelfeld",  options:["MF","DM","ZM","LM","RM"]},
  {label:"Sturm",       options:["ST"]},
];

const FUNKTION_ORDER = ["Trainer/in","Co-Trainer/in","Assistent/in","Goalietrainer/in","Masseur/in","Admin","TW","V","IV","RV","LV","DM","ZM","MF","LM","RM","ST"];

const COL_DEF_ALL = [
  {key:"name",     label:"Name / Vorname", always:true},
  {key:"role",     label:"Funktion",       always:true},
  {key:"pos",      label:"Position",       always:true},
  {key:"nr",       label:"Nr.",            always:true},
  {key:"dob",      label:"Geburtsdatum",   field:"dob"},
  {key:"email",    label:"E-Mail",         field:"email"},
  {key:"tel",      label:"Telefon",        field:"tel"},
  {key:"pass",     label:"Spielerpass",    field:"pass"},
  {key:"js",       label:"J+S Nr.",        field:"js"},
  {key:"ahv",      label:"AHV-Nummer",     field:"ahv"},
  {key:"fairgate", label:"Fairgate-ID",    field:"fairgate"},
];

function normFunktion(s){
  if(!s) return "-";
  const l = s.toLowerCase();
  if(l.includes("goalietrain")||l.includes("goalitrain")) return "Goalietrainer/in";
  if(l.includes("co-train")||l.includes("co train")||l.includes("cotrainer")) return "Co-Trainer/in";
  if(l.includes("assistent")||l.includes("assistenz")) return "Assistent/in";
  if(l.includes("masseur")||l.includes("physiother")) return "Masseur/in";
  if(l.includes("admin")||l.includes("sekretär")||l.includes("aktuarin")) return "Admin";
  if(l.includes("train")) return "Trainer/in";
  return s;
}

function GruppenHeader({label, count, colSpan}){
  return(
    <tr>
      <td colSpan={colSpan} className="cc-section-hdr" style={{padding:"6px 14px"}}>
        {label}
        <span className="cc-count">({count})</span>
      </td>
    </tr>
  );
}

function PosBadge({pos}){
  if(!pos) return <span style={{color:"var(--sub)",fontSize:13}}>-</span>;
  return <span className="cc-chip-toggle" style={{fontSize:11,padding:"2px 8px",borderRadius:6,cursor:"default"}}>{pos}</span>;
}

function FunktionBadge({role}){
  const label = role||"Spieler/in";
  return <span className="cc-chip-toggle" style={{cursor:"default"}}>{label}</span>;
}

function KaderModul({role, team, initialSelected=null, teamRosterData=null}){
  const isMobile = useIsMobile();
  const vis = FIELD_VIS[role]||[];
  const canEdit = ["trainer","administrator","administration"].includes(role);
  const canExport = ["trainer","funktionaer","vorstand","administration","administrator"].includes(role);
  const isSimple = ["trainer","spieler","eltern"].includes(role);

  const baseRoster = teamRosterData||(team ? ROSTER.filter(p=>(p.teams||[]).includes(team)) : ROSTER);
  const initPlayer = typeof initialSelected==="number" ? baseRoster.find(p=>p.id===initialSelected)||null : initialSelected;

  const [selected,   setSelected]   = useState(initPlayer);
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState("name");
  const [sortDir,    setSortDir]    = useState(1);
  const [groupBy,    setGroupBy]    = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [editingNr,  setEditingNr]  = useState(null);
  const [exportFields, setExportFields] = useState(["name","role","pos","nr"]);
  const [positions,  setPositions]  = useState(()=>Object.fromEntries(baseRoster.map(p=>[p.id,p.pos])));
  const [rueckennrn, setRueckennrn] = useState(()=>Object.fromEntries(baseRoster.map(p=>[p.id,p.rueckennr||""])));
  const [nrLoaded,   setNrLoaded]   = useState(false);

  if(!nrLoaded){
    setNrLoaded(true);
    (async()=>{
      try{
        const res = await window.storage.get("rueckennrn");
        if(res){ const d=JSON.parse(res.value); Object.assign(NR_CACHE.data,d); setRueckennrn(p=>({...p,...d})); }
      }catch(e){}
    })();
  }

  const saveNr = (newNrn) => {
    setRueckennrn(newNrn);
    Object.assign(NR_CACHE.data, newNrn);
    window.storage.set("rueckennrn", JSON.stringify(newNrn)).catch(()=>{});
  };

  const handleSort = (key) => {
    if(sortKey===key) setSortDir(d=>d*-1);
    else { setSortKey(key); setSortDir(1); }
  };

  const cols = (isSimple ? COL_DEF_ALL.filter(c=>["name","role","pos","nr"].includes(c.key)) : COL_DEF_ALL)
    .filter(c=>c.always||vis.includes(c.field));

  const filtered = [...baseRoster]
    .filter(p=>p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sortKey==="name"){
        const va=String((a.lastName||"")+(a.firstName||"")||a.name||"");
        const vb=String((b.lastName||"")+(b.firstName||"")||b.name||"");
        return va.localeCompare(vb)*sortDir;
      }
      if(sortKey==="pos"){ return String(positions[a.id]||"").localeCompare(String(positions[b.id]||""))*sortDir; }
      if(sortKey==="nr"){
        const va=rueckennrn[a.id]?parseInt(rueckennrn[a.id]):9999;
        const vb=rueckennrn[b.id]?parseInt(rueckennrn[b.id]):9999;
        return (va-vb)*sortDir;
      }
      return 0;
    });

  const grouped = groupBy
    ? Object.entries(filtered.reduce((acc,p)=>{
        const key = normFunktion(p.role||positions[p.id])||"Spieler/in";
        if(!acc[key]) acc[key]=[];
        acc[key].push(p); return acc;
      },{}))
      .sort(([a],[b])=>{
        const ia=FUNKTION_ORDER.indexOf(a), ib=FUNKTION_ORDER.indexOf(b);
        if(ia>=0&&ib>=0) return ia-ib;
        if(ia>=0) return -1; if(ib>=0) return 1;
        return a.localeCompare(b);
      })
      .map(([key,items])=>({key,items}))
    : [{key:null, items:filtered}];

  const SortIcon = ({col}) => sortKey===col
    ? <TI n={sortDir===1?"arrow-up":"arrow-down"} size={13} style={{marginLeft:3,color:"var(--cc-accent)"}}/>
    : <TI n="arrows-sort" size={13} style={{marginLeft:3,color:"var(--sub)",opacity:0.5}}/>;

  const handleExport = () => {
    const fields = COL_DEF_ALL.filter(c=>exportFields.includes(c.key));
    const header = fields.map(c=>c.label).join(";");
    const rows = filtered.map(p=>fields.map(c=>{
      if(c.key==="name") return `${p.lastName||""} ${p.firstName||""}`.trim()||p.name;
      if(c.key==="nr")   return rueckennrn[p.id]||"-";
      if(c.key==="pos")  return positions[p.id]||"-";
      if(c.key==="role") return p.role||"Spieler/in";
      return p[c.field]||"-";
    }).join(";")).join("\n");
    const csv = `${header}\n${rows}`;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download = `Kader_${team||"Export"}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setShowExport(false);
  };

  /* ── Mobile Row ── */
  const MobileRow = ({p}) => (
    <div onClick={()=>setSelected(p)} className="cc-list-row">
      <Av name={p.name} size="md"/>
      <div style={{flex:1,minWidth:0}}>
        <div className="cc-list-name" style={{marginBottom:3}}>
          {p.lastName} {p.firstName}
        </div>
        <Row gap={6} wrap>
          {positions[p.id]&&<PosBadge pos={positions[p.id]}/>}
          {rueckennrn[p.id]&&<span style={{fontSize:12,color:"var(--sub)"}}>Nr. {rueckennrn[p.id]}</span>}
          {p.role&&<FunktionBadge role={p.role}/>}
        </Row>
      </div>
      <TI n="chevron-right" size={16} style={{color:"var(--sub)",flexShrink:0}}/>
    </div>
  );

  /* ── Desktop Row ── */
  const DesktopRow = ({p}) => (
    <tr onClick={()=>setSelected(p)} className="cc-tr" style={{cursor:"pointer"}}>
      {cols.map((c,j)=>{
        if(c.key==="name") return(
          <td key={j} className="cc-td">
            <Row gap={10}>
              <Av name={p.name} size="sm"/>
              <span className="cc-list-name">
                {p.lastName} {p.firstName}
              </span>
            </Row>
          </td>
        );
        if(c.key==="role") return(
          <td key={j} className="cc-td"><FunktionBadge role={p.role}/></td>
        );
        if(c.key==="pos") return(
          <td key={j} className="cc-td" onClick={e=>e.stopPropagation()}>
            {canEdit&&editingPos===p.id?(
              <select autoFocus value={positions[p.id]||""}
                onChange={e=>{setPositions(prev=>({...prev,[p.id]:e.target.value}));setEditingPos(null);}}
                onBlur={()=>setEditingPos(null)}
                className="cc-input" style={{width:"auto"}}>
                <option value="">- keine -</option>
                {POSITION_GROUPS.map(g=>(
                  <optgroup key={g.label} label={g.label}>
                    {g.options.map(pos=><option key={pos} value={pos}>{pos}</option>)}
                  </optgroup>
                ))}
              </select>
            ):(
              <Row gap={6} style={{cursor:canEdit?"pointer":"default"}}
                onClick={canEdit?()=>setEditingPos(p.id):undefined}>
                <PosBadge pos={positions[p.id]}/>
                {canEdit&&<TI n="edit" size={13} style={{color:"var(--sub)",opacity:0.5}}/>}
              </Row>
            )}
          </td>
        );
        if(c.key==="nr") return(
          <td key={j} className="cc-td" onClick={e=>e.stopPropagation()}>
            {canEdit&&editingNr===p.id?(
              <input autoFocus type="number" min="1" max="99"
                value={rueckennrn[p.id]}
                onChange={e=>saveNr({...rueckennrn,[p.id]:e.target.value})}
                onBlur={()=>setEditingNr(null)}
                onKeyDown={e=>{if(e.key==="Enter")setEditingNr(null);}}
                className="cc-input" style={{width:56,textAlign:"center"}}/>
            ):(
              <Row gap={4} style={{cursor:canEdit?"pointer":"default"}}
                onClick={canEdit?()=>setEditingNr(p.id):undefined}>
                <span style={{fontSize:13,color:"var(--sub)"}}>{rueckennrn[p.id]||"-"}</span>
                {canEdit&&<TI n="edit" size={13} style={{color:"var(--sub)",opacity:0.5}}/>}
              </Row>
            )}
          </td>
        );
        if(c.key==="ahv") return <td key={j} className="cc-td" style={{color:"var(--sub)"}}>••••••••</td>;
        return <td key={j} className="cc-td" style={{color:c.field==="email"?BL:"var(--sub)",whiteSpace:"nowrap"}}>{p[c.field]||"-"}</td>;
      })}
      <td className="cc-td" style={{textAlign:"right"}}>
        <TI n="chevron-right" size={16} style={{color:"var(--sub)"}}/>
      </td>
    </tr>
  );

  return(
    <div>
      {/* Detail Modal */}
      <ModalOrSheet open={!!selected} onClose={()=>setSelected(null)} maxWidth={540}>
        {selected&&(
          <>
            <div className="cc-modal-hdr">
              <Row gap={12}>
                <Av name={selected.name} size="lg"/>
                <Col gap={2}>
                  <span style={{fontWeight:600,fontSize:16,color:"var(--text)"}}>
                    {selected.lastName} {selected.firstName}
                  </span>
                  <FunktionBadge role={selected.role}/>
                </Col>
              </Row>
              <button className="cc-icon-btn" onClick={()=>setSelected(null)}>
                <TI n="x" size={14}/>
              </button>
            </div>
            <div className="cc-modal-body">
              {selected.dob&&vis.includes("dob")&&(
                <Row gap={8}>
                  <span className="cc-detail-label">Geburtsdatum</span>
                  <span style={{fontSize:13,color:"var(--text)"}}>{selected.dob}</span>
                </Row>
              )}
              {selected.email&&vis.includes("email")&&(
                <Row gap={8}>
                  <span className="cc-detail-label">E-Mail</span>
                  <span style={{fontSize:13,color:BL}}>{selected.email}</span>
                </Row>
              )}
              {selected.tel&&vis.includes("tel")&&(
                <Row gap={8}>
                  <span className="cc-detail-label">Telefon</span>
                  <span style={{fontSize:13,color:"var(--text)"}}>{selected.tel}</span>
                </Row>
              )}
            </div>
          </>
        )}
      </ModalOrSheet>

      {/* Export Modal */}
      <ModalOrSheet open={showExport} onClose={()=>setShowExport(false)} maxWidth={360}>
        <div className="cc-modal-hdr">
          <ModalTitle>Kaderliste exportieren</ModalTitle>
          <button className="cc-icon-btn" onClick={()=>setShowExport(false)}><TI n="x" size={14}/></button>
        </div>
        <div className="cc-modal-body">
          <p style={{fontSize:13,color:"var(--sub)"}}>Felder auswählen die exportiert werden sollen</p>
          <Col gap={6}>
            {COL_DEF_ALL.map(c=>(
              <label key={c.key} className="cc-check-row">
                <input type="checkbox" checked={exportFields.includes(c.key)}
                  onChange={e=>setExportFields(prev=>e.target.checked?[...prev,c.key]:prev.filter(k=>k!==c.key))}
                  style={{width:16,height:16,accentColor:"var(--text)",cursor:"pointer"}}/>
                <span style={{fontSize:13,color:"var(--text)"}}>{c.label}</span>
              </label>
            ))}
          </Col>
        </div>
        <div className="cc-modal-ftr">
          <Btn onClick={()=>setShowExport(false)}>Abbrechen</Btn>
          <Btn variant="primary" onClick={handleExport}>Exportieren</Btn>
        </div>
      </ModalOrSheet>

      {/* Toolbar */}
      <Between style={{marginBottom:12,flexWrap:"wrap",gap:8}}>
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Spieler suchen…" style={{width:200}}/>
        <Row gap={8}>
          {canExport&&(
            <Btn onClick={()=>setShowExport(true)}>
              <TI n="file-download" size={14}/>Export
            </Btn>
          )}
          <Btn onClick={()=>setGroupBy(g=>!g)} style={groupBy?{background:"var(--text)",color:"var(--bg)"}:{}}>
            <TI n="layout-list" size={14}/>Gruppieren
          </Btn>
          <span className="cc-chip-toggle" style={{cursor:"default",fontWeight:600}}>
            {filtered.length} Mitglieder
          </span>
        </Row>
      </Between>

      {/* Mobile */}
      {isMobile?(
        <div className="cc-list">
          {grouped.flatMap(({key,items})=>[
            key&&(
              <div key={`h-${key}`} className="cc-section-hdr" style={{padding:"6px 14px",margin:0}}>
                {key}
                <span className="cc-count">({items.length})</span>
              </div>
            ),
            ...items.map(p=><MobileRow key={p.id} p={p}/>),
          ]).filter(Boolean)}
          {filtered.length===0&&(
            <div className="cc-empty">Keine Spieler gefunden</div>
          )}
        </div>
      ):(
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                {cols.map((c,i)=>{
                  const sortable = ["name","pos","nr"].includes(c.key);
                  return(
                    <th key={i} className="cc-th"
                      onClick={sortable?()=>handleSort(c.key):undefined}
                      style={{cursor:sortable?"pointer":"default",userSelect:"none"}}>
                      <Row gap={4}>{c.label}{sortable&&<SortIcon col={c.key}/>}</Row>
                    </th>
                  );
                })}
                <th className="cc-th" style={{width:32}}/>
              </tr>
            </thead>
            <tbody>
              {grouped.flatMap(({key,items})=>[
                key&&<GruppenHeader key={`h-${key}`} label={key} count={items.length} colSpan={cols.length+1}/>,
                ...items.map(p=><DesktopRow key={p.id} p={p}/>),
              ]).filter(Boolean)}
              {filtered.length===0&&(
                <tr><td colSpan={cols.length+1} className="cc-empty">Keine Spieler gefunden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default KaderModul;
