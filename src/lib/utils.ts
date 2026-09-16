export function dateKey(d:Date=new Date()){
  const year=d.getFullYear();
  const month=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

export const today=()=>dateKey();

export function addDaysKey(key:string,days:number){
  const [year,month,day]=key.split('-').map(Number);
  const d=new Date(year,month-1,day);
  d.setDate(d.getDate()+days);
  return dateKey(d);
}

export function monthStartKey(key:string){
  const [year,month]=key.split('-').map(Number);
  return `${year}-${String(month).padStart(2,'0')}-01`;
}

export function nextMonthStartKey(key:string){
  const [year,month]=key.split('-').map(Number);
  const d=new Date(year,month-1,1);
  d.setMonth(d.getMonth()+1);
  return dateKey(d);
}

export function monthEndKey(key:string){
  return addDaysKey(nextMonthStartKey(key),-1);
}

export const fmtDate=(d:string)=>new Intl.DateTimeFormat('ar-EG',{weekday:'long',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
export const pct=(done:number,total:number)=>total?Math.round(done/total*100):0;

export function streak(tasks:{task_date:string;status:string}[]){
  const days=new Set(tasks.filter(t=>t.status==='completed').map(t=>t.task_date));
  let d=today();
  let n=0;
  while(days.has(d)){
    n++;
    d=addDaysKey(d,-1);
  }
  return n;
}
