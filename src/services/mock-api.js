export class ApiError extends Error {
  constructor(message, code = 'INVALID', fields = {}) { super(message); this.code = code; this.fields = fields; }
}
export const jobLabels = {title:'Vaga *',period:'Período *',salary:'Salário *',benefits:'Benefícios *',description:'Descrição e requisitos *'};
export function validateJob(job) {
  const errors={}; for(const [key,label] of Object.entries(jobLabels)) if(!String(job[key]||'').trim()) errors[label]='Preencha este campo.';
  if(job.salary && !(Number(String(job.salary).replace(/[^\d,]/g,'').replace(',','.'))>0)) errors['Salário *']='Informe um salário maior que zero.';
  if(Object.keys(errors).length) throw new ApiError('Confira os campos destacados.','VALIDATION',errors);
}
export function validateProfile(profile) {
  const errors={};
  profile.education.forEach((e,i)=>{for(const [key,label] of Object.entries({course:'Título do curso *',level:'Nível *',institution:'Instituição *'})) if(!e[key]?.trim()) errors[`education.${i}.${label}`]='Preencha este campo.';});
  profile.experience.forEach((e,i)=>{for(const [key,label] of Object.entries({position:'Cargo *',company:'Empresa *',dates:'Data de início * / data de fim *',mode:'Modalidade *'})) if(!e[key]?.trim()) errors[`experience.${i}.${label}`]='Preencha este campo.';});
  if(Object.keys(errors).length) throw new ApiError('Confira os campos do currículo.','VALIDATION',errors);
}
export function createMockApi(seed, storage, delay=300) {
  const storageKey='tramporapido.db.v1';
  const clone=v=>structuredClone(v);
  let db; try { db=JSON.parse(storage?.getItem(storageKey)); } catch { /* restaura o JSON inicial quando o armazenamento é inválido */ }
  if(!db||db.version!==seed.version||!Array.isArray(db.jobs)) db=clone(seed);
  const persist=next=>{storage?.setItem(storageKey,JSON.stringify(next));db=next;};
  let serial=Promise.resolve();
  function transaction(session, action, payload={}, options={}) {
    const task=serial.then(async()=>{
      await new Promise(resolve=>setTimeout(resolve,delay));
      if(options.fail) throw new ApiError('Não foi possível concluir. Seus dados foram preservados.','NETWORK');
      const next=clone(db), user=next.users.find(u=>u.id===session);
      if(!user) throw new ApiError('Acesso negado.','FORBIDDEN');
      const opKey=options.key?`${session}:${action}:${options.key}`:null;
      if(opKey&&next.operations[opKey]) return clone(next.operations[opKey]);
      const candidate=()=>{if(user.role!=='candidate')throw new ApiError('Acesso negado.','FORBIDDEN');};
      const findJob=id=>{const j=next.jobs.find(j=>j.id===id);if(!j||j.status==='Excluída')throw new ApiError('Esta vaga não está disponível.','NOT_FOUND');return j;};
      const ownJob=id=>{const j=findJob(id);if(user.role!=='representative'||j.companyId!==user.companyId)throw new ApiError('Acesso negado.','FORBIDDEN');return j;};
      const app=id=>{const a=next.applications.find(a=>a.id===id);if(!a)throw new ApiError('Candidatura não encontrada.','NOT_FOUND');return a;};
      const today=()=>new Date().toLocaleDateString('pt-BR');
      const id=prefix=>prefix+crypto.randomUUID();
      const content=(value,label)=>{if(!value?.trim())throw new ApiError('Escreva uma mensagem.','VALIDATION',{[label]:'Este campo não pode ficar vazio.'});return value.trim();};
      let result;
      switch(action) {
        case 'publish': {
          if(user.role!=='representative')throw new ApiError('Acesso negado.','FORBIDDEN');
          validateJob(payload.job);
          if(payload.job.id){const j=ownJob(payload.job.id);if(j.version!==payload.job.version)throw new ApiError('A vaga foi alterada. Reabra os dados antes de salvar.','CONFLICT');Object.assign(j,payload.job,{companyId:user.companyId,version:j.version+1});result=j;}
          else {result={...payload.job,id:String(Math.max(1026,...next.jobs.map(j=>Number(j.id)||0))+1),companyId:user.companyId,company:next.companies.find(c=>c.id===user.companyId).name,status:'Aberta',version:1,views:0,type:'CLT',distance:1.8};next.jobs.push(result);} break;
        }
        case 'delete': result=ownJob(payload.id); result.status='Excluída';result.version++;break;
        case 'close': result=ownJob(payload.id);result.status='Encerrada';result.version++;break;
        case 'apply': {
          candidate();const j=findJob(payload.jobId);if(j.status!=='Aberta')throw new ApiError('Esta vaga não aceita novas candidaturas.','CLOSED');
          if(next.applications.some(a=>a.jobId===j.id&&a.userId===user.id&&a.status!=='Cancelada'))throw new ApiError('Você já é candidato a esta vaga.','DUPLICATE');
          validateProfile(next.profiles[user.id]);result={id:id('a-'),jobId:j.id,userId:user.id,name:user.name,date:today(),status:'Enviada',message:payload.message||'',resume:clone(next.profiles[user.id])};next.applications.push(result);break;
        }
        case 'cancel': candidate();result=app(payload.id);if(result.userId!==user.id)throw new ApiError('Acesso negado.','FORBIDDEN');result.status='Cancelada';break;
        case 'decision': result=app(payload.id);ownJob(result.jobId);if(result.status==='Cancelada')throw new ApiError('Esta candidatura foi cancelada.','CONFLICT');if(!['Aprovada','Reprovada'].includes(payload.status))throw new ApiError('Situação inválida.');result.status=payload.status;break;
        case 'profile': candidate();validateProfile(payload.profile);next.profiles[user.id]=clone(payload.profile);result=next.profiles[user.id];break;
        case 'question': candidate();findJob(payload.jobId);result={id:id('q-'),jobId:payload.jobId,userId:user.id,name:user.name,date:today(),text:content(payload.text,'Sua dúvida *'),answer:''};next.questions.push(result);break;
        case 'answer': {result=next.questions.find(q=>q.id===payload.id);if(!result)throw new ApiError('Dúvida não encontrada.','NOT_FOUND');ownJob(result.jobId);result.answer=content(payload.text,'Sua resposta *');result.answeredAt=today();break;}
        case 'message': {const a=app(payload.applicationId);if(user.role==='representative')ownJob(a.jobId);else if(a.userId!==user.id)throw new ApiError('Acesso negado.','FORBIDDEN');result={id:id('m-'),applicationId:a.id,jobId:a.jobId,from:user.id,to:user.role==='representative'?a.userId:next.jobs.find(j=>j.id===a.jobId).companyId,text:content(payload.text,'Mensagem *'),date:today()};next.messages.push(result);break;}
        case 'preferences': if(user.role!=='representative')throw new ApiError('Acesso negado.','FORBIDDEN');next.preferences={...next.preferences,...payload};result=next.preferences;break;
        case 'view': result=findJob(payload.id);result.views++;break;
        default:throw new ApiError('Operação desconhecida.');
      }
      if(opKey)next.operations[opKey]=clone(result);
      persist(next);return clone(result);
    });
    serial=task.catch(()=>{});return task;
  }
  return {transaction,snapshot:()=>clone(db),refresh:()=>{try{const saved=JSON.parse(storage?.getItem(storageKey));if(saved?.version===seed.version)db=saved;}catch{}return clone(db);},reset:()=>{persist(clone(seed));return clone(db);}};
}
