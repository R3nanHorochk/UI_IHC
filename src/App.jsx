import React, {useEffect} from 'react';
import screens from './design/screens.json';
import useAppModel from './useAppModel.js';

const flatten=n=>[n,...n.children.flatMap(flatten)];
const salary=j=>j.salary?.replace(',00','')+' / mês';
function geometry(n){
  const text=n.type==='TEXT';
  return {width:n.width, ...(text?{minHeight:n.height,fontSize:n.fontSize,fontWeight:n.fontWeight,lineHeight:`${Math.round(n.fontSize*n.lineHeight)}px`,color:n.fill||'#925807',whiteSpace:n.textResize==='WIDTH_AND_HEIGHT'?'pre':'pre-wrap'}:{background:n.fill,display:'flex',flexDirection:n.layout==='HORIZONTAL'?'row':'column',gap:n.gap,padding:n.padding.map(x=>x+'px').join(' '),alignItems:({CENTER:'center',MAX:'flex-end',STRETCH:'stretch'}[n.align]||'flex-start'),justifyContent:({CENTER:'center',MAX:'flex-end',SPACE_EVENLY:'space-between'}[n.justify]||'flex-start')}),...(n.stroke&&n.border?{border:`${n.border}px solid ${n.stroke}`} : {}),borderRadius:n.radius||undefined,opacity:n.opacity!==1?n.opacity:undefined};
}
export default function App(){
  const m=useAppModel();
  useEffect(()=>{
    if(!m.dialog)return;
    const previous=document.activeElement,dialog=document.querySelector('[role="dialog"]');
    const trap=e=>{if(e.key!=='Tab')return;const items=[...dialog.querySelectorAll('button:not(:disabled),select,input,a[href]')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}};
    dialog?.addEventListener('keydown',trap);return()=>{dialog?.removeEventListener('keydown',trap);previous?.focus();};
  },[m.dialog]);
  const reference=new URLSearchParams(location.search).has('reference');
  const root=reference?(screens.find(s=>s.id===m.screenId)||m.screen):m.screen;
  function dynamicText(text,ctx={},n){
    if(reference)return text;
    const job=ctx.job||(m.jobForm?m.jobDraft:m.job),app=ctx.application||m.application;
    let t=text||'';
    if(ctx.sidebar||ctx.header)return t;
    if(t==='3 vagas encontradas')return `${m.jobs.length} ${m.jobs.length===1?'vaga encontrada':'vagas encontradas'}`;
    if(t==='1 vaga publicada')return `${m.companyJobs.length} ${m.companyJobs.length===1?'vaga publicada':'vagas publicadas'}`;
    if(t.startsWith('Há 12 inscrições')){const count=m.db.applications.filter(a=>a.jobId===job.id&&a.status!=='Cancelada').length,pending=m.questions.filter(q=>!q.answer).length;return `Há ${count} ${count===1?'inscrição':'inscrições'} na vaga ${job.title} e ${pending} ${pending===1?'dúvida aguardando':'dúvidas aguardando'} sua resposta.`;}
    if(t==='Mostrando uma candidatura de exemplo.')return m.jobApplications.length?`Mostrando ${Math.min(m.applicationPage+1,m.jobApplications.length)} de ${m.jobApplications.length} candidaturas.`:'Nenhuma candidatura recebida.';
    if(t==='Indicadores demonstrativos desde a publicação da vaga.')return 'Indicadores desde a publicação da vaga.';
    if(n?.id==='18:888')return String(job.views||0);
    if(n?.id==='18:891')return String(m.jobApplications.length);
    if(n?.id==='18:894')return String(m.questions.filter(q=>!q.answer).length);
    if(n?.id==='12:374'&&app)return app.status==='Enviada'?`◉ Enviada  —  ${app.date}\n\n○ Em análise\n\n○ Retorno da empresa`:`✓ Enviada  —  ${app.date}\n\n${app.status==='Em análise'?'◉':'✓'} Em análise\n\n${app.status==='Em análise'?'○ Retorno da empresa':`◉ ${app.status}`}`;
    if(t.startsWith('Preferências ilustrativas.'))return 'Suas preferências são salvas automaticamente.';
    if(t.startsWith('As informações cadastrais'))return t;
    if(m.screenId==='16:295'&&n?.id==='18:924')return m.question?.text||'Nenhuma dúvida recebida.';
    if(m.screenId==='16:295'&&n?.id==='18:923')return m.question?`${m.question.name} • ${m.question.date}`:'';
    if(job){
      t=t.replaceAll('Auxiliar administrativo',job.title||'Título da vaga').replaceAll('R$ 1.900 / mês',salary(job)).replaceAll('R$ 1.900,00',job.salary||'').replaceAll('Nº 1024',`Nº ${job.id||'—'}`);
      t=t.replaceAll('Empresa Horizonte',job.company||'Empresa Horizonte').replaceAll('18/10/2026',job.date||'18/10/2026').replaceAll('Centro, São Paulo / SP',`${job.district}, ${job.city} / ${job.state}`).replaceAll('Centro • São Paulo / SP',`${job.district} • ${job.city} / ${job.state}`).replaceAll('Rua Exemplo, 120',job.address||'');
      t=t.replaceAll('Presencial',job.mode||'Presencial').replaceAll('período integral',`período ${(job.period||'Integral').toLowerCase()}`).replaceAll('• Integral',`• ${job.period||'Integral'}`);
      if(t.startsWith('Organize documentos')||t.startsWith('Ensino médio completo; atendimento'))t=job.description||'';
      if(t.startsWith('Benefícios:'))t=`Benefícios: ${job.benefits}`;
      if(t.startsWith('Centro • a aproximadamente'))t=`${job.district} • a aproximadamente ${String(job.distance||1.8).replace('.',',')} km\nEndereço completo informado pela empresa.`;
    }
    if(app){t=t.replaceAll('Ana Souza',app.name).replaceAll('Nº 2041',`Nº ${app.id}`).replace(/Situação: (Enviada|Em análise|Aprovada|Reprovada)/g,`Situação: ${app.status}`);if(ctx.application&&t.includes('• inscrição em'))t=`${job.company} • inscrição em ${app.date}`;}
    if(m.screenId==='16:287'){
      const p=app?.resume||m.db.profiles[app?.userId]||m.db.profiles.ana;
      if(t.startsWith('Ensino médio completo • Escola'))t=p.education.map(e=>`${e.course} • ${e.institution}\n${e.dates}`).join('\n\n');
      if(t==='Organização • Atendimento • Informática')t=p.skills.join(' • ');
      if(t.startsWith('Assistente de atendimento •'))t=p.experience.map(e=>`${e.position} • ${e.company}\n${e.dates} • ${e.mode}\n${e.description}`).join('\n\n');
    }
    return t;
  }
  function Field({n,ctx}){
    const label=n.props['Rótulo'],error=m.error(label,ctx),value=reference?n.props.Valor:m.value(label,n.props.Valor,ctx);
    const htmlId=`field-${n.id.replaceAll('/','-').replaceAll(':','-')}-${ctx.index||0}`;
    const options=label==='Período *'?['Integral','Meio período','Noturno','Flexível']:label.startsWith('Modalidade')?['Presencial','Híbrido','Remoto']:label==='Nível *'?['Fundamental','Médio','Técnico','Superior','Pós-graduação']:label==='Distância'?['Qualquer distância','Até 2 km','Até 5 km','Até 10 km','Até 50 km']:label==='Data de publicação'?['Qualquer data','Últimos 7 dias','Últimos 30 dias']:null;
    const multiline=/Descrição|Mensagem|dúvida|resposta/i.test(label);
    const props={id:htmlId,value:value??'',placeholder:n.props.Valor,'aria-label':label,'aria-invalid':!!error,'aria-describedby':error?htmlId+'-error':undefined,onChange:e=>m.change(label,e.target.value,ctx),disabled:m.busy||reference,required:label.includes('*')};
    return <label key={`${n.id}-${ctx.index||0}`} className="design-field design-node" data-design-id={n.id} style={{width:n.width}} htmlFor={htmlId}><span>{label}</span>{options?<select {...props}><option value="">{n.props.Valor||'Selecione'}</option>{options.map(v=><option key={v}>{v}</option>)}</select>:multiline?<textarea {...props} rows={1}/>:<input {...props} onKeyDown={e=>{if(label==='Adicionar habilidade'&&e.key==='Enter'){e.preventDefault();const skill=e.target.value.trim();if(skill&&!m.profile.skills.includes(skill)){m.setProfile(p=>({...p,skills:[...p.skills,skill]}));m.setDirty(true);m.change(label,'');}}}}/>}{error&&<small id={htmlId+'-error'} className="field-error">{error}</small>}</label>;
  }
  function Empty({children}){return <div className="empty-state" role="status">{children}</div>;}
  function render(n,ctx={},key=n.id){
    if(!n.visible)return null;
    ctx={...ctx,sidebar:ctx.sidebar||n.name==='Navegação lateral',header:ctx.header||n.name==='Cabeçalho'};
    const style=geometry(n),attrs={'data-design-id':n.id,'data-name':n.name};
    if(n.justify==='SPACE_BETWEEN')style.justifyContent='space-between';
    if(n.id==='11:569'){delete style.border;style.boxShadow='inset 0 -1px 0 #808080';}
    if(n.id==='39:710')style.lineHeight='24px';
    if(n===root){style.minHeight=840;style.width=1200;style.padding=0;return <div key={key} {...attrs} className="screen design-node" style={style}>{n.children.map(c=>render(c,ctx))}</div>;}
    if(!reference&&n.name==='Área principal'){
      let content=n.children;
      if(m.screenId==='4:17824'){
        const template=content.find(c=>c.name==='Auxiliar administrativo');
        return <main key={key} tabIndex={-1} id="main-content" {...attrs} className="design-node" style={style}>{content.slice(0,2).map(c=>render(c,ctx))}{m.myApplications.length?m.myApplications.map(a=>render(template,{...ctx,application:a,job:m.db.jobs.find(j=>j.id===a.jobId),repeated:true},a.id)):<Empty>Você ainda não tem candidaturas ativas. Busque vagas para começar.</Empty>}</main>;
      }
      return <main key={key} tabIndex={-1} id="main-content" {...attrs} className="design-node" style={style}>{content.map(c=>render(c,ctx))}{['10:7','10:4','16:293'].includes(m.screenId)&&conversation()}{m.screenId==='4:18637'&&m.jobApplications.length>1&&<div className="inline-controls"><button className="aux-button" disabled={!m.applicationPage} onClick={()=>{m.setApplicationPage(p=>p-1);m.selectApplication(m.jobApplications[m.applicationPage-1]);}}>Anterior</button><button className="aux-button" disabled={m.applicationPage>=m.jobApplications.length-1} onClick={()=>{m.setApplicationPage(p=>p+1);m.selectApplication(m.jobApplications[m.applicationPage+1]);}}>Próxima</button></div>}{m.screenId==='16:295'&&m.questions.length>1&&<label className="inline-controls">Dúvida<select aria-label="Selecionar dúvida" value={m.question?.id} onChange={e=>m.setQuestionId(e.target.value)}>{m.questions.map(q=><option key={q.id} value={q.id}>{q.name}: {q.text.slice(0,60)}</option>)}</select></label>}{m.screenId==='16:295'&&m.question?.answer&&<div className="conversation"><strong>Resposta enviada</strong><p>{m.question.answer}</p></div>}</main>;
    }
    if(!reference&&n.name==='Lista de vagas'){
      const card=n.children.find(c=>c.component==='Card / Vaga')||flatten(screens.find(s=>s.id==='4:17884')).find(c=>c.component==='Card / Vaga');
      return <div key={key} {...attrs} className="design-node" style={style}>{n.children.filter(c=>c.component!=='Card / Vaga').map(c=>render(c,ctx))}{m.jobs.length?m.jobs.map(j=>render(card,{...ctx,job:j},j.id)):<Empty>Nenhuma vaga encontrada. Altere ou limpe os filtros.</Empty>}</div>;
    }
    if(!reference&&n.name==='Vaga e ações'&&!ctx.repeated)return m.companyJobs.length?m.companyJobs.map(j=>render(n,{...ctx,job:j,repeated:true},j.id)):<Empty>Nenhuma vaga cadastrada. Selecione Registrar vaga para publicar uma oportunidade.</Empty>;
    if(!reference&&n.name==='Candidatura e ações'&&!ctx.repeated){const a=m.jobApplications[m.applicationPage]||m.jobApplications[0];return a?render(n,{...ctx,application:a,repeated:true},a.id):<Empty>Nenhuma candidatura recebida para esta vaga.</Empty>;}
    if(!reference&&n.name==='Escolaridade'&&n.children.some(c=>c.name==='Curso e nível')&&!ctx.section)return m.profile.education.map((_,i)=>render(n,{...ctx,section:'education',index:i},`${key}-${i}`));
    if(!reference&&n.name==='Experiência profissional'&&!ctx.section)return m.profile.experience.map((_,i)=>render(n,{...ctx,section:'experience',index:i},`${key}-${i}`));
    if(n.component==='Campo / Texto')return Field({n,ctx});
    if(n.component?.startsWith('Botão')){
      let label=n.props['Rótulo'];
      const disabled=n.component==='Botão / Desativado'||label==='✓ Já é candidato'||(!reference&&m.busy)||(!reference&&label==='Me candidatar'&&m.job.status!=='Aberta');
      style.height=n.height;style.color=n.children[0]?.fill||'#925807';style.fontWeight=500;style.fontSize=14;style.lineHeight='20px';
      return <button type="button" key={key} {...attrs} className="design-node design-button" style={style} disabled={disabled} onClick={()=>!reference&&m.act(n,ctx)}>{label}</button>;
    }
    if(n.component==='Card / Vaga'){
      const j=ctx.job;const props=!reference&&j?{'Título':j.title,'Empresa':j.company,'Resumo':`${j.mode} • até ${Math.ceil(j.distance)} km`,'Salário':`${salary(j)}  ↗`}:n.props;
      const texts=[props['Título'],props.Empresa,props.Resumo,props['Salário']];
      return <button key={key} type="button" {...attrs} className="design-node job-card" style={style} onClick={()=>m.selectJob(j?.id||m.db.jobs.find(j=>j.title===props['Título'])?.id||m.job.id)}>{n.children.map((c,i)=><span key={c.id} style={{...geometry(c),width:'auto',whiteSpace:'pre-wrap',textAlign:'left'}}>{texts[i]}</span>)}</button>;
    }
    if(n.component?.startsWith('Resumo /')){
      const j=ctx.job||m.job,a=ctx.application||m.application;
      const texts=n.component==='Resumo / Vaga gerenciada'?[j.title,`Nº ${j.id} • publicada em ${j.date}`,`${j.type} • ${j.mode} • ${salary(j)}`,`${j.status} • ${m.db.applications.filter(a=>a.jobId===j.id&&a.status!=='Cancelada').length} inscrições`]:[a?.name||'Nenhum candidato',`Nº ${a?.id||'—'} • inscrição em ${a?.date||'—'}`,'Ensino médio • Atendimento • Organização',`Situação: ${a?.status||'—'}`];
      return <div key={key} {...attrs} className="design-node" style={style}>{n.children.map((c,i)=>render(reference?c:{...c,text:texts[i]},ctx))}</div>;
    }
    if(n.type==='TEXT'){
      let text=dynamicText(n.text,ctx,n);
      if(!reference&&n.text?.startsWith('[ Organização'))return <div key={key} className="inline-controls" style={{width:n.width}}>{m.profile.skills.map(skill=><button className="chip" key={skill} aria-label={`Remover habilidade ${skill}`} onClick={()=>{m.setProfile(p=>({...p,skills:p.skills.filter(s=>s!==skill)}));m.setDirty(true);}}>[ {skill} × ]</button>)}</div>;
      if(!reference&&n.text?.includes('Finalizado')&&ctx.section==='education')return <div key={key} className="inline-controls" style={{width:n.width}}>{[['Finalizado',true],['Em andamento',false]].map(([label,v])=><label key={label}><input type="radio" name={`education-${ctx.index}`} checked={m.profile.education[ctx.index].completed===v} onChange={()=>{m.setProfile(p=>({...p,education:p.education.map((e,i)=>i===ctx.index?{...e,completed:v}:e)}));m.setDirty(true);}}/>{label}</label>)}</div>;
      if(!reference&&n.text?.startsWith('Emprego atual:')&&ctx.section==='experience')return <div key={key} className="inline-controls" style={{width:n.width}}>Emprego atual: {[['Sim',true],['Não',false]].map(([label,v])=><label key={label}><input type="radio" name={`experience-${ctx.index}`} checked={m.profile.experience[ctx.index].current===v} onChange={()=>{m.setProfile(p=>({...p,experience:p.experience.map((e,i)=>i===ctx.index?{...e,current:v}:e)}));m.setDirty(true);}}/>{label}</label>)}</div>;
      if(!reference&&n.id==='18:1043')return <div key={key} style={{...style,lineHeight:'20px',color:'#2d0f0f'}}>{[['applications','Novas inscrições'],['questions','Dúvidas recebidas']].map(([k,label])=><label className="settings-line" key={k}>{label}: <input type="checkbox" checked={m.db.preferences[k]} onChange={e=>m.run('preferences',{[k]:e.target.checked})}/>{m.db.preferences[k]?'ativadas':'desativadas'}</label>)}<label className="settings-line">Resumo de atividade: <select value={m.db.preferences.summary} onChange={e=>m.run('preferences',{summary:e.target.value})}><option>semanal</option><option>diário</option><option>desativado</option></select></label></div>;
      if(!reference&&['Início','Processos','Documentos'].includes(n.text)&&ctx.header)return <button key={key} className="plain-link design-text" style={style} onClick={()=>m.go({'Início':'4:17802','Processos':'4:17824','Documentos':'4:17968'}[n.text])}>{text}</button>;
      if(!reference&&n.text==='tramporapido')return <button key={key} {...attrs} className="plain-link brand-link design-text" style={style} onClick={()=>m.go(m.isRep?'4:18288':'4:17802')}>{text}</button>;
      const Tag=n.fontSize>=24?'h2':'p';return <Tag key={key} {...attrs} className="design-node design-text" style={style}>{text}</Tag>;
    }
    const Tag=n.name==='Navegação lateral'?'nav':n.name==='Cabeçalho'?'header':'div';
    if(n.name==='logo-mark'){style.height=n.height;}
    const content=n.children.map(c=>render(c,ctx));
    return <Tag key={key} {...attrs} aria-label={Tag==='nav'?'Menu principal':undefined} className={`design-node ${n.layout==='HORIZONTAL'?'layout-row':''}`} style={style}>{content}{!reference&&ctx.section&&ctx.index>0&&((ctx.section==='education'&&n.name==='Escolaridade')||(ctx.section==='experience'&&n.name==='Experiência profissional'))&&<button className="aux-button" onClick={()=>{m.setProfile(p=>({...p,[ctx.section]:p[ctx.section].filter((_,i)=>i!==ctx.index)}));m.setDirty(true);}}>Remover {ctx.section==='education'?'escolaridade':'experiência'}</button>}</Tag>;
  }
  function conversation(){
    const messages=m.db.messages.filter(msg=>msg.applicationId===m.application?.id),questions=m.db.questions.filter(q=>q.jobId===m.job.id&&q.userId==='ana');
    if(!messages.length&&!questions.some(q=>q.answer))return null;
    return <section className="conversation" aria-label="Mensagens"><strong>Mensagens</strong>{messages.map(msg=><p key={msg.id}><strong>{msg.from==='ana'?'Você':'Empresa'} · {msg.date}</strong><br/>{msg.text}</p>)}{questions.filter(q=>q.answer).map(q=><p key={q.id}><strong>{q.text}</strong><br/>{q.answer}</p>)}</section>;
  }
  return <><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Pular para o conteúdo</a>{render(root)}{!reference&&<footer className="utility"><span>Acessar como:</span><button onClick={()=>m.switchRole(false)}>Candidato</button><button onClick={()=>m.switchRole(true)}>Representante</button><details><summary>Demonstração</summary><label>Tela <select aria-label="Ir para tela do protótipo" value={m.screenId} onChange={e=>m.go(e.target.value)}>{screens.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button onClick={m.reset}>Restaurar dados iniciais</button></details></footer>}{m.busy&&<><div className="status-loading"/><div className="notice" role="status">Processando…</div></>}{m.notice&&!m.busy&&<div className={`notice ${m.notice.error?'error':''}`} role={m.notice.error?'alert':'status'}>{m.notice.text}</div>}{m.dialog&&<div className="dialog-backdrop" onKeyDown={e=>{if(e.key==='Escape')m.setDialog(null);}}><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="dialog"><h2 id="dialog-title">{m.dialog.title}</h2><p>{m.dialog.text}</p><div className="dialog-actions">{m.dialog.choose?<><button autoFocus className="aux-button" onClick={()=>m.switchRole(false)}>Candidato</button><button className="aux-button aux-primary" onClick={()=>m.switchRole(true)}>Representante</button></>:<><button autoFocus className="aux-button" onClick={()=>m.setDialog(null)}>Voltar</button><button className="aux-button aux-primary" onClick={m.dialog.confirm}>Confirmar</button></>}</div></section></div>}</>;
}
