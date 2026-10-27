import fs from 'node:fs';
const document = JSON.parse(fs.readFileSync('design-reference/local/document.json'));
const key = g => g ? `${g.sessionID}:${g.localID}` : '';
const nodes = new Map(document.nodeChanges.map(n => [key(n.guid), n]));
const children = new Map();
for (const n of nodes.values()) { const p=key(n.parentIndex?.guid); if(!children.has(p)) children.set(p,[]); children.get(p).push(n); }
for (const list of children.values()) list.sort((a,b)=>(a.parentIndex.position<b.parentIndex.position?-1:1));
const color = paints => { const p=paints?.find(p=>p.visible!==false&&p.type==='SOLID'); return p ? `#${['r','g','b'].map(c=>Math.round(p.color[c]*255).toString(16).padStart(2,'0')).join('')}` : undefined; };
function normalize(n, instance, props={}) {
  const id=key(n.guid), symbol=nodes.get(key(n.symbolData?.symbolID));
  if(symbol) {
    const values={}; for(const def of symbol.componentPropDefs||[]) values[key(def.id)]=def.initialValue?.textValue?.characters;
    for(const p of n.componentPropAssignments||[]) values[key(p.defID)]=p.value?.textValue?.characters;
    const merged={...symbol,...n}; delete merged.symbolData;
    return {...normalize(merged,n,values),component:symbol.name,props:Object.fromEntries((symbol.componentPropDefs||[]).map(p=>[p.name,values[key(p.id)]])),children:(children.get(key(symbol.guid))||[]).map(c=>normalize(c,n,values))};
  }
  const override=instance?.derivedSymbolData?.find(o=>key(o.guidPath?.guids?.at(-1))===id);
  const styleRef=nodes.get(key(n.styleIdForText?.guid));
  const t={...n,...override};
  const font=styleRef||t; const fontMeta=t.derivedTextData?.fontMetaData?.[0];
  let text=t.textData?.characters;
  for(const ref of t.componentPropRefs||[]) if(ref.componentPropNodeField==='TEXT_DATA'&&props[key(ref.defID)]!==undefined) text=props[key(ref.defID)];
  const size=t.size||{x:0,y:0};
  const out={id:instance?key(instance.guid)+'/'+id:id,name:t.name,type:t.type,width:size.x,height:size.y,x:t.transform?.m02||0,y:t.transform?.m12||0,fill:color(t.fillPaints),stroke:color(t.strokePaints),border:t.strokePaints?.length?t.strokeWeight:0,radius:t.rectangleTopLeftCornerRadius||0,layout:t.stackMode,gap:t.stackSpacing||0,padding:[t.stackVerticalPadding||0,t.stackPaddingRight??t.stackHorizontalPadding??0,t.stackPaddingBottom??t.stackVerticalPadding??0,t.stackHorizontalPadding||0],align:t.stackCounterAlignItems,justify:t.stackPrimaryAlignItems,text,visible:t.visible!==false,opacity:t.opacity??1,fontSize:font.fontSize||14,fontWeight:fontMeta?.fontWeight||({'Regular':400,'Medium':500,'Semi Bold':600,'Bold':700}[font.fontName?.style]||400),lineHeight:font.lineHeight?.units==='RAW'?font.lineHeight.value:font.lineHeight?.units==='PIXELS'?font.lineHeight.value/(font.fontSize||14):1.45,auto:t.stackPrimarySizing!=='FIXED',textResize:t.textAutoResize,target:key(t.prototypeInteractions?.find(i=>!i.isDeleted)?.actions?.[0]?.transitionNodeID)};
  out.children=(children.get(id)||[]).map(c=>normalize(c,instance,props)).filter(c=>c.visible);
  return out;
}
const screens=(children.get('2:5')||[]).filter(n=>/^(Candidato|Representante) —/.test(n.name)).map(n=>normalize(n));
fs.mkdirSync('src/design',{recursive:true});
fs.writeFileSync('src/design/screens.json',JSON.stringify(screens));
fs.writeFileSync('design-reference/screens.md',screens.map(s=>`- ${s.id}: ${s.name}`).join('\n')+'\n');
console.log(`${screens.length} telas preparadas.`);
