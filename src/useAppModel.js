import {useEffect,useRef,useState} from 'react';
import seed from './data/seed.json';
import screens from './design/screens.json';
import {createMockApi,validateJob,validateProfile,ApiError} from './services/mock-api.js';
export const api=createMockApi(seed,window.localStorage);
export const jobFields={'Vaga *':'title','Período *':'period','Data':'date','Modalidade':'mode','Estado':'state','Município':'city','Bairro':'district','Rua / número':'address','Salário *':'salary','Benefícios *':'benefits','Descrição e requisitos *':'description'};
const educationFields={'Título do curso *':'course','Nível *':'level','Instituição *':'institution','Início / conclusão':'dates'};
const experienceFields={'Cargo *':'position','Empresa *':'company','Data de início * / data de fim *':'dates','Modalidade *':'mode','Descrição das atividades':'description'};
const blankJob=()=>({title:'',period:'',date:new Date().toLocaleDateString('pt-BR'),mode:'',state:'',city:'',district:'',address:'',salary:'',benefits:'',description:''});
const initialScreen=()=>{const hash=decodeURIComponent(location.hash.slice(1));return screens.some(s=>s.id===hash)?hash:'4:18288';};
const jobFormScreens=['4:18328','4:18362','4:18428','4:18468','4:18508','4:18550','4:18574','16:283','16:297'];
export default function useAppModel(){
  const [db,setDb]=useState(()=>api.snapshot()),[screenId,setScreenId]=useState(initialScreen),[jobId,setJobId]=useState(()=>sessionStorage.getItem('tr.job')||'1024'),[applicationId,setApplicationId]=useState(()=>sessionStorage.getItem('tr.application')||'2041');
  const [jobDraft,setJobDraft]=useState(()=>['4:18328','4:18362'].includes(initialScreen())?blankJob():{...seed.jobs[0]}),[profile,setProfile]=useState(()=>api.snapshot().profiles.ana);
  const [values,setValues]=useState({}),[filters,setFilters]=useState({}),[filterDraft,setFilterDraft]=useState({}),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null),[dialog,setDialog]=useState(null),[dirty,setDirty]=useState(false),[applicationPage,setApplicationPage]=useState(0);
  const lock=useRef(false),operation=useRef(crypto.randomUUID()),returnTo=useRef(null);
  const screen=screens.find(s=>s.id===screenId),isRep=screen.name.startsWith('Representante'),session=isRep?'carlos':'ana';
  const job=db.jobs.find(j=>j.id===jobId)||db.jobs[0];
  const application=db.applications.find(a=>a.id===applicationId);
  const applied=db.applications.some(a=>a.userId==='ana'&&a.jobId===jobId&&a.status!=='Cancelada');
  const jobs=db.jobs.filter(j=>j.status==='Aberta'&&(!filters.distance||j.distance<=Number(filters.distance))&&(!filters.search||`${j.title} ${j.description} ${j.district}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(filters.search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')))&&(!filters.days||new Date()-new Date(j.date.split('/').reverse().join('-')+'T00:00:00')<=Number(filters.days)*86400000));
  const companyJobs=db.jobs.filter(j=>j.companyId==='horizonte'&&j.status!=='Excluída');
  const myApplications=db.applications.filter(a=>a.userId==='ana'&&a.status!=='Cancelada');
  const jobApplications=db.applications.filter(a=>a.jobId===jobId&&a.status!=='Cancelada');
  const questions=db.questions.filter(q=>q.jobId===jobId);
  const [questionId,setQuestionId]=useState('q1');
  const question=questions.find(q=>q.id===questionId)||questions[0];
  useEffect(()=>{sessionStorage.setItem('tr.job',jobId);sessionStorage.setItem('tr.application',applicationId);},[jobId,applicationId]);
  useEffect(()=>{const listener=()=>{setScreenId(initialScreen());setErrors({});};window.addEventListener('hashchange',listener);const sync=()=>setDb(api.refresh());window.addEventListener('storage',sync);return()=>{window.removeEventListener('hashchange',listener);window.removeEventListener('storage',sync);};},[]);
  useEffect(()=>{document.title=`${screen.name.replace(' — ',' · ')} | tramporapido`;},[screen]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(null),6000);return()=>clearTimeout(t);},[notice]);
  function go(id){if(!screens.some(s=>s.id===id))return;setErrors({});setScreenId(id);location.hash=id;window.scrollTo(0,0);requestAnimationFrame(()=>document.querySelector('main')?.focus({preventScroll:true}));}
  function fail(error){setErrors(error.fields||{});setNotice({text:error.message,error:true});requestAnimationFrame(()=>document.querySelector('[aria-invalid="true"]')?.focus());}
  async function run(action,payload,target,opts={}){
    if(lock.current)return;lock.current=true;setBusy(true);setErrors({});
    try {const result=await api.transaction(session,action,payload,{key:operation.current,...opts});setDb(api.snapshot());setDirty(false);operation.current=crypto.randomUUID();if(action==='publish')setJobId(result.id);if(action==='apply')setApplicationId(result.id);if(target)go(target);return result;}
    catch(e){if(e.code==='NETWORK'&&action==='publish')go('16:297');else if(e.code==='NETWORK'&&action==='apply')go('10:9');else if(e.code==='DUPLICATE')go('4:18242');fail(e);}
    finally{lock.current=false;setBusy(false);}
  }
  function selectJob(id,target='4:17923'){const j=db.jobs.find(j=>j.id===id);if(!j||j.status==='Excluída'){fail(new Error('Esta vaga não está disponível.'));return;}setJobId(id);setApplicationPage(0);const a=db.applications.find(a=>a.jobId===id&&a.userId==='ana'&&a.status!=='Cancelada');if(a)setApplicationId(a.id);go(target==='4:17923'&&a?'4:18242':target);if(!isRep)api.transaction('ana','view',{id}).then(()=>setDb(api.snapshot())).catch(fail);}
  function selectApplication(a){setApplicationId(a.id);setJobId(a.jobId);}
  function value(label,fallback='',ctx={}){
    if(ctx.section==='education')return profile.education[ctx.index||0]?.[educationFields[label]]??'';
    if(ctx.section==='experience')return profile.experience[ctx.index||0]?.[experienceFields[label]]??'';
    if(jobFormScreens.includes(screenId)&&jobFields[label])return jobDraft[jobFields[label]]??'';
    if(screenId==='10:2')return filterDraft[label]??'';
    return values[`${screenId}:${jobId}:${label}`]??(/Mensagem ao representante/.test(label)?'Olá! Tenho interesse na vaga e experiência na área.':'');
  }
  function change(label,newValue,ctx={}){
    setErrors(e=>({...e,[label]:undefined,[`${ctx.section}.${ctx.index||0}.${label}`]:undefined}));
    if(ctx.section){setProfile(p=>({...p,[ctx.section]:p[ctx.section].map((entry,i)=>i===(ctx.index||0)?{...entry,[(ctx.section==='education'?educationFields:experienceFields)[label]]:newValue}:entry)}));setDirty(true);}
    else if(jobFormScreens.includes(screenId)&&jobFields[label]){setJobDraft(d=>({...d,[jobFields[label]]:newValue}));setDirty(true);}
    else if(screenId==='10:2')setFilterDraft(v=>({...v,[label]:newValue}));
    else setValues(v=>({...v,[`${screenId}:${jobId}:${label}`]:newValue}));
  }
  const error=(label,ctx={})=>errors[`${ctx.section}.${ctx.index||0}.${label}`]||errors[label];
  function messageValue(pattern){const prefix=`${screenId}:${jobId}:`;const entry=Object.entries(values).find(([key])=>key.startsWith(prefix)&&pattern.test(key.slice(prefix.length)));return entry?.[1]||'';}
  function discard(callback){if(dirty)setDialog({title:'Descartar alterações?',text:'As alterações ainda não salvas serão descartadas.',confirm:()=>{setDirty(false);setDialog(null);callback();}});else callback();}
  async function act(n,ctx={}){
    if(busy)return;const label=n.props?.['Rótulo']||n.name,target=n.target;
    const activeJob=ctx.job||job,activeApp=ctx.application||application;
    if(ctx.job)setJobId(ctx.job.id);if(ctx.application)selectApplication(ctx.application);
    if(label==='Login'){setDialog({title:'Entrar no tramporapido',text:'Escolha como deseja acessar.',choose:true});return;}
    if(label.includes('Menu')){if(screenId==='4:18302')go('4:18288');else go(target|| (isRep?'4:18302':'4:17802'));return;}
    if(label==='Preencher com exemplo'){const d={...seed.jobs[0]};delete d.id;delete d.version;setJobDraft(d);setDirty(true);go('4:18468');return;}
    if(label==='Registrar vaga'){discard(()=>{setJobDraft(blankJob());operation.current=crypto.randomUUID();go('4:18328');});return;}
    if(label==='Alterar'||label==='Alterar vaga'){setJobDraft({...activeJob});setDirty(false);go('4:18428');return;}
    if(label==='Continuar'||label==='Continuar alterações'||label==='Publicar'){
      try{validateJob(jobDraft);go(label==='Publicar'?(jobDraft.id?'16:283':'4:18574'):(jobDraft.id?'4:18550':'4:18508'));}catch(e){fail(e);}return;
    }
    if(label==='Confirmar e publicar'||(label==='Tentar novamente'&&isRep)||label==='Simular falha de publicação'){await run('publish',{job:jobDraft},jobDraft.id?'16:284':'4:18595',{fail:label.startsWith('Simular')});return;}
    if(label==='Confirmar exclusão'){await run('delete',{id:activeJob.id},'4:18621');return;}
    if(label==='Confirmar encerramento'){await run('close',{id:activeJob.id},'16:286');return;}
    if(label==='Confirmar aprovação'||label==='Confirmar reprovação'){await run('decision',{id:activeApp?.id,status:label==='Confirmar aprovação'?'Aprovada':'Reprovada'},target);return;}
    if(label==='Confirmar cancelamento'){await run('cancel',{id:activeApp?.id},'10:6');return;}
    if(label==='Me candidatar'){go(applied?'4:18242':'4:18065');return;}
    if(label==='Enviar candidatura'||label==='Simular falha no envio'||(label==='Tentar novamente'&&!isRep)){
      const message=values[`4:18065:${jobId}:Mensagem ao representante (opcional)`]??'Olá! Tenho interesse na vaga e experiência na área.';
      await run('apply',{jobId,message},'4:18110',{fail:label.startsWith('Simular')});return;
    }
    if(label==='Salvar currículo'){try{validateProfile(profile);await run('profile',{profile},'4:18197');}catch(e){fail(e);}return;}
    if(label==='Continuar para experiências'){try{validateProfile({...profile,experience:[]});go('4:18149');}catch(e){fail(e);}return;}
    if(label==='+ Adicionar escolaridade'){setProfile(p=>({...p,education:[...p.education,{course:'',level:'',institution:'',dates:'',completed:true}]}));setDirty(true);return;}
    if(label==='+ Adicionar experiência'){setProfile(p=>({...p,experience:[...p.experience,{position:'',company:'',dates:'',mode:'',description:'',current:false}]}));setDirty(true);return;}
    if(label==='Ver validação de campos'){setProfile(p=>({...p,experience:p.experience.map((e,i)=>i===0?{...e,position:''}:e)}));go('4:18016');setErrors({'experience.0.Cargo *':'Preencha este campo.'});return;}
    if(label==='Corrigir cargo'){go('4:18149');return;}
    if(label==='Corrigir preenchimento'){go('4:18328');return;}
    if(label==='Cancelar alterações'){discard(()=>{setProfile(db.profiles.ana);go('4:17968');});return;}
    if(label==='Cancelar'&&isRep){discard(()=>go('4:18383'));return;}
    if(label==='Aplicar filtros'){const next={distance:filterDraft['Distância']?.match(/\d+/)?.[0],search:filterDraft['Vaga de']||'',days:filterDraft['Data de publicação']?.match(/\d+/)?.[0]};setFilters(next);go('4:17884');return;}
    if(label==='Limpar filtros'){setFilters({});setFilterDraft({});go('4:17884');return;}
    if(label==='Ver exemplo sem resultados'){setFilters({search:'nenhuma-oportunidade'});go('10:8');return;}
    if(label==='Abrir primeira vaga'){if(jobs[0])selectJob(jobs[0].id);return;}
    if(label==='Enviar dúvida'&&screenId==='10:3'){await run('question',{jobId,text:messageValue(/dúvida/i)},'10:4');return;}
    if(label==='Enviar mensagem'){await run('message',{applicationId:activeApp?.id,text:messageValue(/mensagem/i)},'16:293');return;}
    if(label==='Enviar resposta'){await run('answer',{id:question?.id,text:messageValue(/resposta/i)},'16:296');return;}
    if(label==='Revisar dados'||label==='Voltar para preenchimento'){go(jobDraft.id?'4:18428':'4:18468');return;}
    if(['Gerenciar vagas','Gerenciamento de vagas','Buscar vagas','Minhas candidaturas','Perfil / Currículo'].includes(label)&&dirty){discard(()=>go(target||screenId));return;}
    if(label==='Ver inscrições'&&companyJobs[0]){setJobId(companyJobs[0].id);const a=db.applications.find(a=>a.jobId===companyJobs[0].id);if(a)setApplicationId(a.id);}
    if(['Inscrições e dúvidas','Acompanhar candidaturas','Consultar inscrições'].includes(label)){setApplicationPage(0);const a=db.applications.find(a=>a.jobId===activeJob.id&&a.status!=='Cancelada');if(a)setApplicationId(a.id);}
    if(label==='Entrar em contato'&&!isRep){go('10:3');return;}
    if(n.component==='Card / Vaga'){selectJob(ctx.job?.id||db.jobs.find(j=>j.title===n.props['Título'])?.id||jobId);return;}
    if(target){if(target==='4:17923'||target==='4:18242')selectJob(activeJob.id);else go(target);}
  }
  function switchRole(rep){discard(()=>{setDialog(null);go(rep?'4:18288':'4:17802');});}
  function reset(){setDialog({title:'Restaurar dados de demonstração?',text:'Vagas, candidaturas, mensagens e currículos voltarão aos dados iniciais.',confirm:()=>{setDb(api.reset());setProfile(structuredClone(seed.profiles.ana));setJobDraft(blankJob());setJobId('1024');setApplicationId('2041');setValues({});setFilters({});setFilterDraft({});setDirty(false);setDialog(null);go('4:18288');}});}
  return {db,screen,screenId,isRep,job,jobDraft,profile,application,applied,jobs,companyJobs,myApplications,jobApplications,questions,question,questionId,setQuestionId,errors,busy,notice,dialog,setDialog,go,act,value,change,error,run,selectJob,selectApplication,switchRole,reset,setProfile,setDirty,setNotice,applicationPage,setApplicationPage,jobForm:jobFormScreens.includes(screenId),values};
}
