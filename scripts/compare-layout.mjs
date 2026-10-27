import {chromium} from '@playwright/test';
import fs from 'node:fs';
const screens=JSON.parse(fs.readFileSync('src/design/screens.json'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:840}});
const reports=[];
try {
 for(const s of screens){
  await page.goto(`${process.env.APP_URL||'http://127.0.0.1:5174/'}?reference=1#${s.id}`);await page.evaluate(()=>document.fonts.ready);
  const actual=await page.locator('[data-design-id]').evaluateAll(nodes=>Object.fromEntries(nodes.map(el=>{const r=el.getBoundingClientRect();return [el.dataset.designId,{x:r.x,y:r.y,width:r.width,height:r.height}]})));
  const errors=[];let checked=0;
  function visit(n,x=0,y=0,root=false){
    const nx=root?0:x+n.x,ny=root?0:y+n.y,a=actual[n.id];
    if(a&&n!==s){checked++;const delta=Math.max(Math.abs(a.x-nx),Math.abs(a.y-ny),Math.abs(a.width-n.width));if(delta>2)errors.push({id:n.id,name:n.name,delta,expected:{x:nx,y:ny,w:n.width},actual:a});}
    if(n.component)return;for(const c of n.children)visit(c,nx,ny);
  }visit(s,0,0,true);
  reports.push({id:s.id,name:s.name,checked,errors});
 }
 fs.writeFileSync('design-reference/review/layout.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify({checked:reports.reduce((a,b)=>a+b.checked,0),screens:reports.length,errors:reports.reduce((a,b)=>a+b.errors.length,0),worst:reports.flatMap(r=>r.errors.map(e=>({...e,screen:r.id}))).sort((a,b)=>b.delta-a.delta).slice(0,12)},null,2));
}finally{await browser.close();}
