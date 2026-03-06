"use client";
import { useState, useRef, useCallback } from "react";
import { Montserrat } from "next/font/google";
import Image from "next/image";

const montserrat = Montserrat({ subsets: ["latin"], display: "swap" });

const C = {
  tabNavBg:"#f5f5f5",tabInactiveBg:"#eeeeee",tabInactiveText:"#777777",
  tabActiveBg:"#1c1c1c",tabActiveText:"#ffffff",tabBorder:"#dddddd",
  panelBg:"#f9f9f9",panelBorder:"#dddddd",
  cardBg:"#ffffff",cardBorder:"#eeeeee",cardShadow:"0 4px 20px rgba(0,0,0,0.06)",
  promisesBg:"linear-gradient(145deg,#f7faf2 0%,#ecf5e0 100%)",
  greenCheck:"#5a9a3a",greyCheck:"#bbbbbb",
  labelColor:"#888888",valueColor:"#1f1f1f",
  bodyText:"#4a4a4a",disclaimerText:"#999999",noteText:"#3a3a3a",divider:"#dedede",
};

interface HeroIng  { name:string; image:string; benefit1:string; benefit2:string; }
interface UseStep  { title:string; text:string; image:string; }

export interface ProductTabsProps {
  description?:string; ingredients?:string;
  hero_ingredients?:HeroIng[]; usage_steps?:UseStep[];
  before_image?:string|null; after_image?:string|null;
  comparison_our_image?:string|null; comparison_other_image?:string|null;
  comparison_promises_image?:string|null;
  our_product_features?:string[]; others_features?:string[];
  best_before?:string; net_content?:string; country_of_origin?:string;
  manufactured_by?:string; powered_by?:string; marketed_by?:string;
  customer_care_phone?:string; customer_care_email?:string;
  productImage?:string|null; otherImage?:string|null; additionalInfoImage?:string|null;
}

const DD="Experience the power of our specially formulated product, crafted to deliver visible results. Enriched with powerful actives, it nourishes from root to tip, leaving your hair healthy and radiant.";
const DI="Aqua, Argan Oil, Aloe Barbadensis Leaf Extract, Panthenol, Glycerin, Biotin, Vitamin E, Rosmarinus Officinalis Leaf Extract, Phenoxyethanol, Sodium Benzoate, Citric Acid.";
const DHI:HeroIng[]=[{name:"Argan Oil",image:"",benefit1:"Deeply nourishes and restores moisture",benefit2:"Enhances shine, softness and smoothness"},{name:"Biotin (Vitamin B7)",image:"",benefit1:"Strengthens and thickens hair",benefit2:"Prevents hair loss and breakage"}];
const DUS:UseStep[]=[{title:"Apply",text:"Apply an appropriate amount evenly through wet or dry hair.",image:""},{title:"Massage",text:"Gently massage into the scalp and work through lengths for 2-3 minutes.",image:""},{title:"Rinse",text:"Rinse thoroughly with water. Repeat if necessary for best results.",image:""}];
const DOF=["Powered by clinically-proven active ingredients","Deeply nourishes scalp with premium botanicals","Sulphate-free, Paraben-free and Derma-tested"];
const DOT=["May not contain targeted active ingredients","May cause dryness with harsh chemical bases","May contain sulphates and parabens"];
const DAI={bestBefore:"18 Months",netContent:"",countryOfOrigin:"India",manufacturedBy:"",poweredBy:"",marketedBy:"",customerCarePhone:"",customerCareEmail:""};
const DPR=[{label:"No Sulphate"},{label:"No Parabens"},{label:"No Phthalates"},{label:"Derma-Tested"},{label:"Cruelty-Free"}];

function Check({green}:{green:boolean}){return <span style={{color:green?C.greenCheck:C.greyCheck,fontSize:14,flexShrink:0}}>&#10003;</span>;}
function PromiseIcon(){return(<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#5a9a3a" strokeWidth="1.5"/><path d="M8 14l4 4 8-8" stroke="#5a9a3a" strokeWidth="2" strokeLinecap="round"/></svg>);}
function IngPlaceholder({i}:{i:number}){const p=[{bg:"#c8dff0",c1:"#a0c4e0"},{bg:"#f5e6a3",c1:"#e8d060"}],c=p[i%p.length];return(<svg width="100%" height="100%" viewBox="0 0 120 160"><rect width="120" height="160" fill={c.bg} rx="8"/><circle cx="60" cy="80" r="40" fill={c.c1} opacity="0.5"/></svg>);}
function GreenLg(){return(<svg width="90" height="160" viewBox="0 0 90 160"><rect x="25" y="20" width="40" height="130" rx="12" fill="#4a8c3f"/><rect x="33" y="10" width="24" height="18" rx="6" fill="#3a7a2f"/></svg>);}
function Silver(){return(<svg width="70" height="140" viewBox="0 0 70 140"><rect x="15" y="20" width="40" height="110" rx="10" fill="#aaaaaa"/><rect x="22" y="10" width="26" height="16" rx="5" fill="#999"/></svg>);}
function GreenSm(){return(<svg width="60" height="110" viewBox="0 0 60 110"><rect x="12" y="15" width="36" height="88" rx="10" fill="#5a9a3a"/><rect x="18" y="7" width="24" height="14" rx="5" fill="#4a8a2a"/></svg>);}
function StepIcon({n}:{n:number}){const p=[{bg:"#e8f4fd",b:"#4a9fd4"},{bg:"#f0fae8",b:"#5a9a3a"},{bg:"#fff8e8",b:"#e0a030"}],c=p[(n-1)%p.length];return(<div style={{width:32,height:32,borderRadius:"50%",background:c.bg,border:`1.5px solid ${c.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:c.b}}>{n}</div>);}
function InfoRow({label,value}:{label:string;value?:string}){if(!value)return null;return(<div style={{display:"flex",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.divider}`}}><div style={{width:180,flexShrink:0,fontSize:13,color:C.labelColor,fontWeight:600}}>{label}</div><div style={{fontSize:13,color:C.valueColor,lineHeight:1.6}}>{value}</div></div>);}
function SecLabel({c}:{c:React.ReactNode}){return(<div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:C.labelColor,textTransform:"uppercase",marginBottom:20}}>{c}</div>);}

function BAPSlider({bUrl,aUrl}:{bUrl?:string|null;aUrl?:string|null}){
  const [pos,setPos]=useState(50);
  const ref=useRef<HTMLDivElement>(null);
  const drag=useRef(false);
  const upd=useCallback((x:number)=>{const r=ref.current?.getBoundingClientRect();if(!r)return;setPos(Math.min(Math.max(((x-r.left)/r.width)*100,0),100));},[]);
  const down=useCallback((e:React.MouseEvent)=>{drag.current=true;upd(e.clientX);const mv=(ev:MouseEvent)=>{if(drag.current)upd(ev.clientX);};const up=()=>{drag.current=false;window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);},[upd]);
  const base={position:"absolute" as const,inset:0};
  return(
    <div ref={ref} onMouseDown={down} onTouchMove={e=>upd(e.touches[0].clientX)} onTouchStart={e=>upd(e.touches[0].clientX)}
      style={{position:"relative",width:"100%",aspectRatio:"16/9",borderRadius:16,overflow:"hidden",cursor:"ew-resize",userSelect:"none",background:"#1a1a2e",boxShadow:"0 8px 32px rgba(0,0,0,0.15)"}}>
      <div style={base}>
        {aUrl?<Image src={aUrl} alt="After" fill sizes="(max-width:768px) 100vw,70vw" style={{objectFit:"cover"}}/>:<svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="#1a2e1a"/><text x="320" y="310" textAnchor="middle" fill="#c9e265" fontSize="22" fontWeight="700">After</text></svg>}
        <div style={{position:"absolute",bottom:16,right:16,background:"rgba(90,154,58,0.9)",color:"white",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700}}>After</div>
      </div>
      <div style={{...base,clipPath:`inset(0 ${100-pos}% 0 0)`,transition:"clip-path 0.05s linear"}}>
        {bUrl?<Image src={bUrl} alt="Before" fill sizes="(max-width:768px) 100vw,70vw" style={{objectFit:"cover"}}/>:<svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="#3a3a4a"/><text x="320" y="310" textAnchor="middle" fill="#aaa" fontSize="22" fontWeight="700">Before</text></svg>}
        <div style={{position:"absolute",bottom:16,left:16,background:"rgba(80,80,80,0.85)",color:"white",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700}}>Before</div>
      </div>
      <div style={{position:"absolute",top:0,bottom:0,left:`${pos}%`,width:3,background:"white",transform:"translateX(-50%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:`${pos}%`,transform:"translate(-50%,-50%)",width:44,height:44,borderRadius:"50%",background:"white",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 10L2 10M2 10L5 7M2 10L5 13" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 10L18 10M18 10L15 7M18 10L15 13" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.5)",color:"white",padding:"4px 14px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>Drag to compare</div>
    </div>
  );
}

type Tab="description"|"why"|"ingredients"|"additional";
const TABS:[Tab,string][]=[["description","Description"],["why","Why choose this?"],["ingredients","All ingredients"],["additional","Additional information"]];

export default function ProductTabs(p:ProductTabsProps){
  const [tab,setTab]=useState<Tab>("description");
  const desc=p.description?.trim()||DD;
  const ingr=p.ingredients?.trim()||DI;
  const rhi=p.hero_ingredients||[];
  const hi=rhi.filter(i=>i.name?.trim()).length>0?rhi.filter(i=>i.name?.trim()):DHI;
  const rus=p.usage_steps||[];
  const us=rus.filter(s=>s.title?.trim()||s.text?.trim()).length>0?rus.filter(s=>s.title?.trim()||s.text?.trim()):DUS;
  const bUrl=p.before_image||null,aUrl=p.after_image||null;
  const oi=p.comparison_our_image||null,ci=p.comparison_other_image||null,pri=p.comparison_promises_image||null;
  const of_=(p.our_product_features||[]).filter(f=>f?.trim()).length>0?(p.our_product_features||[]).filter(f=>f?.trim()):DOF;
  const ot_=(p.others_features||[]).filter(f=>f?.trim()).length>0?(p.others_features||[]).filter(f=>f?.trim()):DOT;
  const inf={
    bestBefore:p.best_before?.trim()||DAI.bestBefore,netContent:p.net_content?.trim()||DAI.netContent,
    countryOfOrigin:p.country_of_origin?.trim()||DAI.countryOfOrigin,manufacturedBy:p.manufactured_by?.trim()||DAI.manufacturedBy,
    poweredBy:p.powered_by?.trim()||DAI.poweredBy,marketedBy:p.marketed_by?.trim()||DAI.marketedBy,
    ph:p.customer_care_phone?.trim()||DAI.customerCarePhone,em:p.customer_care_email?.trim()||DAI.customerCareEmail,
  };

  return(
    <div className={montserrat.className} style={{width:"100%",maxWidth:1100,margin:"0 auto"}}>

      {/* ── TAB BAR — scrollable on mobile, no overflow clip ── */}
      <div style={{
        display:"flex",
        background:C.tabNavBg,
        borderRadius:16,
        border:`1px solid ${C.tabBorder}`,
        marginBottom:4,
        overflowX:"auto",
        overflowY:"hidden",
        scrollbarWidth:"none",
        /* hide webkit scrollbar */
        WebkitOverflowScrolling:"touch",
      } as React.CSSProperties}>
        <style>{`.hi-tabs::-webkit-scrollbar{display:none}`}</style>
        {TABS.map(([id,label],i)=>(
          <button
            key={id}
            onClick={()=>setTab(id)}
            style={{
              /* shrink:0 so button never collapses; grow:1 fills space on desktop */
              flex:"1 0 auto",
              padding:"16px 22px",
              fontSize:14,
              fontWeight:600,
              fontFamily:"inherit",
              cursor:"pointer",
              border:"none",
              borderRight:i<TABS.length-1?`1px solid ${C.tabBorder}`:"none",
              background:tab===id?C.tabActiveBg:C.tabInactiveBg,
              color:tab===id?C.tabActiveText:C.tabInactiveText,
              transition:"background 0.2s,color 0.2s",
              outline:"none",
              whiteSpace:"nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{background:C.panelBg,border:`1px solid ${C.panelBorder}`,borderRadius:16,padding:"40px 48px"}}>

        {/* TAB 1 */}
        <div style={{display:tab==="description"?"block":"none"}}>
          <div style={{display:"flex",flexDirection:"column",gap:48}}>
            <div style={{maxWidth:760}}><SecLabel c="Description"/><p style={{fontSize:15,lineHeight:1.8,color:C.bodyText,margin:0}}>{desc}</p></div>
            <div>
              <SecLabel c="Hero Ingredients"/>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                {hi.map((item,idx)=>(
                  <div key={idx} style={{flex:"1 1 260px",background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:14,boxShadow:C.cardShadow,padding:20,display:"flex",gap:16,alignItems:"flex-start"}}>
                    <div style={{width:80,height:100,flexShrink:0,borderRadius:10,overflow:"hidden"}}>
                      {item.image?<Image src={item.image} alt={item.name} width={80} height={100} style={{objectFit:"cover",width:"100%",height:"100%"}}/>:<IngPlaceholder i={idx}/>}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.valueColor,marginBottom:10}}>{item.name}</div>
                      {[item.benefit1,item.benefit2].filter(Boolean).map((b,bi)=>(
                        <div key={bi} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}><Check green/><span style={{fontSize:13,color:C.bodyText,lineHeight:1.5}}>{b}</span></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SecLabel c="How To Use"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
                {us.map((s,idx)=>(
                  <div key={idx} style={{background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:14,boxShadow:C.cardShadow,overflow:"hidden",position:"relative"}}>
                    {s.image&&<div style={{width:"100%",aspectRatio:"4/3",overflow:"hidden",position:"relative"}}><Image src={s.image} alt={s.title} fill sizes="(max-width:768px) 100vw,33vw" style={{objectFit:"cover"}}/></div>}
                    <div style={{padding:"20px 20px 24px",position:"relative"}}>
                      <div style={{position:"absolute",top:-8,right:12,fontSize:64,fontWeight:900,color:"#f0f0f0",lineHeight:1,userSelect:"none"}}>{idx+1}</div>
                      <div style={{marginBottom:14}}><StepIcon n={idx+1}/></div>
                      <div style={{fontSize:14,fontWeight:700,color:C.valueColor,marginBottom:8,position:"relative"}}>{s.title}</div>
                      <div style={{fontSize:13,color:C.bodyText,lineHeight:1.6,position:"relative"}}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(bUrl||aUrl)&&(
              <div><SecLabel c="Before and After"/><BAPSlider bUrl={bUrl} aUrl={aUrl}/><p style={{fontSize:12,color:C.disclaimerText,marginTop:12,textAlign:"center"}}>Results may vary. Images shown are for illustrative purposes.</p></div>
            )}
          </div>
        </div>

        {/* TAB 2 */}
        <div style={{display:tab==="why"?"block":"none"}}>
          <SecLabel c="Why Choose This?"/>
          <div style={{fontSize:12,color:C.disclaimerText,marginBottom:28}}>Comparison of best in business</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 240px",background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:14,boxShadow:C.cardShadow,padding:24}}>
              <div style={{fontSize:13,fontWeight:700,color:C.valueColor,marginBottom:16,textAlign:"center"}}>Our Product</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:20,minHeight:100}}>{oi?<Image src={oi} alt="Our Product" width={90} height={160} style={{objectFit:"contain"}}/>:<GreenLg/>}</div>
              {of_.map((f,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-start"}}><Check green/><span style={{fontSize:13,color:C.bodyText,lineHeight:1.5}}>{f}</span></div>))}
            </div>
            <div style={{flex:"1 1 240px",background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:14,boxShadow:C.cardShadow,padding:24}}>
              <div style={{fontSize:13,fontWeight:700,color:C.valueColor,marginBottom:16,textAlign:"center"}}>Others</div>
              <div style={{display:"flex",justifyContent:"center",marginBottom:20,minHeight:100}}>{ci?<Image src={ci} alt="Competitor" width={70} height={140} style={{objectFit:"contain"}}/>:<Silver/>}</div>
              {ot_.map((f,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-start"}}><Check green={false}/><span style={{fontSize:13,color:C.bodyText,lineHeight:1.5}}>{f}</span></div>))}
            </div>
            <div style={{flex:"1 1 240px",background:C.promisesBg,border:`1px solid ${C.cardBorder}`,borderRadius:14,boxShadow:C.cardShadow,padding:24}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.1em",color:C.greenCheck,marginBottom:16,textAlign:"center"}}>OUR PROMISES</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                {DPR.map((pr,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><PromiseIcon/><span style={{fontSize:11,fontWeight:600,color:C.valueColor,textAlign:"center"}}>{pr.label}</span></div>))}
              </div>
              <div style={{display:"flex",justifyContent:"center"}}>{pri?<Image src={pri} alt="Product" width={60} height={110} style={{objectFit:"contain"}}/>:<GreenSm/>}</div>
            </div>
          </div>
        </div>

        {/* TAB 3 */}
        <div style={{display:tab==="ingredients"?"block":"none",maxWidth:760}}>
          <SecLabel c="All Ingredients"/>
          <p style={{fontSize:14,lineHeight:1.9,color:C.bodyText,margin:"0 0 20px 0"}}>{ingr}{" "}<span style={{color:C.disclaimerText,fontSize:12}}>Disclaimer: Ingredients listed may vary slightly from products received. Refer to packaging for the most up-to-date information.</span></p>
        </div>

        {/* TAB 4 */}
        <div style={{display:tab==="additional"?"block":"none",maxWidth:760}}>
          <SecLabel c="Additional Information"/>
          <InfoRow label="Best Before" value={inf.bestBefore}/>
          <InfoRow label="Net Content" value={inf.netContent}/>
          <InfoRow label="Country of Origin" value={inf.countryOfOrigin}/>
          <InfoRow label="Manufactured By" value={inf.manufacturedBy}/>
          <InfoRow label="Powered By" value={inf.poweredBy}/>
          <InfoRow label="Marketed By" value={inf.marketedBy}/>
          {(inf.ph||inf.em)&&(
            <div style={{padding:"20px 0",borderBottom:`1px solid ${C.divider}`}}>
              <div style={{fontSize:13,fontWeight:700,color:C.valueColor,marginBottom:8}}>Customer Care Support:</div>
              <div style={{fontSize:13,color:C.bodyText,lineHeight:1.8}}>
                {inf.ph&&<>Call {inf.ph}</>}
                {inf.ph&&inf.em&&" or write to us at "}
                {inf.em&&<a href={`mailto:${inf.em}`} style={{color:C.greenCheck}}>{inf.em}</a>}
              </div>
            </div>
          )}
          <div style={{padding:"16px 0",fontSize:12,color:C.noteText,lineHeight:1.7}}><strong>Note:</strong> Prices include benefits of GST Reform 2.0 with reduced GST rates.</div>
        </div>
      </div>
    </div>
  );
}