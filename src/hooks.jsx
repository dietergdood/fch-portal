/* ═══════════════════════════════════════════════════════════════
   ClubCampus Hooks & shared components — hooks.jsx
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect } from "react";
import { BP_MOBILE, BP_TABLET } from "./constants";

function useBreakpoint(){const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return{isMobile:w<BP_MOBILE,isTablet:w>=BP_MOBILE&&w<BP_TABLET,isDesktop:w>=BP_TABLET,width:w};}
function useIsMobile(){return useBreakpoint().isMobile;}

function ModalOrSheet({open,onClose,children,maxWidth=660}){
  const isMobile=useIsMobile();
  if(!open) return null;
  if(isMobile) return(
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}}/>
      {/* Sheet */}
      <div style={{position:"relative",background:"var(--surface)",borderRadius:"20px 20px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 -4px 32px rgba(0,0,0,0.18)"}}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:40,height:4,borderRadius:2,background:"var(--border)"}}/>
        </div>
        <div style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch"}}>
          {children}
        </div>
      </div>
    </div>
  );
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",borderRadius:20,width:"100%",maxWidth,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>
        {children}
      </div>
    </div>
  );
}

/* -- ROLLEN-DEFINITIONEN -- */
/* ── PORTAL-ROLLEN (Zugriffsrechte) ────────────────────────────
   Steuern Navigation + Sichtbarkeit im Portal.
   Unabhängig von der Vereinsfunktion (FUNKTIONEN).
───────────────────────────────────────────────────────────── */
/* ── ClubCampus-Farben (Standard-Branding) ── */
/* Vereinsname global lesbar (aus localStorage wenn kein appTheme prop) */

export { useBreakpoint, useIsMobile, ModalOrSheet };
