export const today=()=>new Date().toISOString().slice(0,10);
export const fmtDate=(d:string)=>new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
export const pct=(done:number,total:number)=>total?Math.round(done/total*100):0;
export function streak(tasks:{task_date:string;status:string}[]){const days=new Set(tasks.filter(t=>t.status==='completed').map(t=>t.task_date)); let d=new Date(); let n=0; while(days.has(d.toISOString().slice(0,10))){n++; d.setDate(d.getDate()-1)} return n;}
