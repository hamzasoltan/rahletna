import React,{useEffect,useMemo,useState} from 'react';import{createRoot}from'react-dom/client';import{Moon,Sun,Check,Plus,Trash2,LogOut,Heart,Link2,Copy,Target,CalendarDays,UserRound,Home,Camera}from'lucide-react';import{supabase}from'./lib/supabase';import*as api from'./lib/api';import{fmtDate,pct,streak,today}from'./lib/utils';import type{Goal,Profile,Task,Connection,Habit}from'./lib/types';import'./styles.css';

type SessionUser={id:string;email?:string};
function App(){const [user,setUser]=useState<SessionUser|null>(null);const [loading,setLoading]=useState(true);const [profile,setProfile]=useState<Profile|null>(null);const [connection,setConnection]=useState<Connection|null>(null);const [partner,setPartner]=useState<Profile|null>(null);const [view,setView]=useState('home');const [dark,setDark]=useState(localStorage.getItem('theme')==='dark');
useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('theme',dark?'dark':'light')},[dark]);
useEffect(()=>{supabase.auth.getSession().then(({data})=>setUser(data.session?.user?{id:data.session.user.id,email:data.session.user.email}:null)).finally(()=>setLoading(false));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user?{id:s.user.id,email:s.user.email}:null));return()=>data.subscription.unsubscribe()},[]);
useEffect(()=>{if(!user)return;Promise.all([api.getProfile(user.id),api.getConnection(user.id)]).then(async([p,c])=>{setProfile(p);setConnection(c);if(c?.status==='connected'){const pid=c.requester_id===user.id?c.recipient_id:c.requester_id;if(pid)setPartner(await api.getProfile(pid))}}).catch(console.error)},[user]);
if(loading)return <div className="center"><div className="spinner"/></div>;if(!user)return <Auth/>;if(!profile)return <ProfileSetup user={user} onDone={setProfile}/>;if(!connection||connection.status!=='connected')return <Connect user={user} connection={connection} onConnected={async()=>{const c=await api.getConnection(user.id);if(!c)return;setConnection(c);if(c.status==='connected'){const pid=c.requester_id===user.id?c.recipient_id:c.requester_id;if(pid){const pp=await api.getProfile(pid);setPartner(pp)}}}}/>;if(!partner)return <div className="center"><div className="spinner"/></div>;
return <Shell profile={profile} partner={partner!} view={view} setView={setView} dark={dark} setDark={setDark} onLogout={()=>supabase.auth.signOut()}><Dashboard user={user} profile={profile} partner={partner!} view={view} onProfileUpdated={setProfile}/></Shell>}

function Auth(){const[signup,setSignup]=useState(false);const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[name,setName]=useState('');const[busy,setBusy]=useState(false);const[error,setError]=useState('');async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');const r=signup?await supabase.auth.signUp({email,password,options:{data:{display_name:name}}}):await supabase.auth.signInWithPassword({email,password});setBusy(false);if(r.error)setError(r.error.message);else if(signup&&!r.data.session)setError('تم إنشاء الحساب. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.')}return <div className="auth"><div className="auth-card"><div className="logo">ر</div><h1>رحلتنا</h1><p>أنا أعمل على نفسي، وأنت تعمل على نفسك، لكننا لسنا وحدنا في الرحلة.</p><form onSubmit={submit}>{signup&&<input required placeholder="اسمك" value={name} onChange={e=>setName(e.target.value)}/>}<input required type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)}/><input required minLength={6} type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?'جاري التنفيذ…':signup?'إنشاء حساب':'تسجيل الدخول'}</button></form><button className="link" onClick={()=>setSignup(!signup)}>{signup?'لديك حساب؟ سجّل الدخول':'ليس لديك حساب؟ أنشئ حسابًا'}</button></div></div>}
function ProfileSetup({user,onDone}:{user:SessionUser;onDone:(p:Profile)=>void}){const[name,setName]=useState('');const[bio,setBio]=useState('');const[busy,setBusy]=useState(false);async function save(e:React.FormEvent){e.preventDefault();setBusy(true);try{const p=await api.updateProfile(user.id,{display_name:name.trim(),bio:bio.trim()});onDone(p)}catch(e){alert((e as Error).message)}finally{setBusy(false)}}return <div className="auth"><div className="auth-card"><div className="logo">ر</div><h1>خلينا نعرّفك</h1><p>الاسم ده هيظهر للشخص المرتبط بيك.</p><form onSubmit={save}><input required placeholder="اسمك" value={name} onChange={e=>setName(e.target.value)}/><textarea placeholder="نبذة قصيرة عنك (اختياري)" value={bio} onChange={e=>setBio(e.target.value)}/><button className="primary" disabled={busy}>{busy?'حفظ…':'متابعة'}</button></form></div></div>}
function Connect({user,connection,onConnected}:{user:SessionUser;connection:Connection|null;onConnected:()=>void}){const[code,setCode]=useState('');const[invite,setInvite]=useState(connection?.invite_code||'');const[busy,setBusy]=useState(false);async function create(){setBusy(true);try{const c=await api.createInvite(user.id);setInvite(c.invite_code)}catch(e){alert((e as Error).message)}finally{setBusy(false)}}async function join(){setBusy(true);try{await api.acceptInvite(code);onConnected()}catch(e){alert((e as Error).message)}finally{setBusy(false)}}return <div className="auth"><div className="auth-card wide"><div className="logo">ر</div><h1>مش هنمشي لوحدنا 🤝</h1><p>اربط حسابك بالشخص اللي هتشاركه الرحلة.</p>{invite?<div className="invite"><span>{invite}</span><button onClick={()=>navigator.clipboard.writeText(invite)}><Copy size={18}/></button><small>ابعت الكود للشخص الآخر</small></div>:<button className="primary" onClick={create} disabled={busy}><Link2 size={18}/> إنشاء كود دعوة</button>}<div className="divider">أو</div><input placeholder="الصق كود الدعوة هنا" value={code} onChange={e=>setCode(e.target.value)}/><button className="secondary" onClick={join} disabled={!code||busy}>الانضمام</button>{connection?.status==='pending'&&<p className="muted">مستني الطرف الآخر يستخدم كود الدعوة.</p>}</div></div>}
function Shell({children,profile,partner,view,setView,dark,setDark,onLogout}:{children:React.ReactNode;profile:Profile;partner:Profile;view:string;setView:(v:string)=>void;dark:boolean;setDark:(v:boolean)=>void;onLogout:()=>void}){const items=[['home','الرئيسية',Home],['goals','أهدافي',Target],['history','السجل',CalendarDays],['partner','رحلته',Heart],['profile','ملفي',UserRound]] as const;return <div className="app"><aside><div className="brand"><div className="logo small">ر</div><span>رحلتنا</span></div><nav>{items.map(([id,label,Icon])=><button className={view===id?'active':''} onClick={()=>setView(id)} key={id}><Icon size={19}/>{label}</button>)}</nav><div className="side-bottom"><button onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>} {dark?'الوضع النهاري':'الوضع الليلي'}</button><button onClick={onLogout}><LogOut size={18}/> خروج</button></div></aside><main><header><div><strong>مرحبًا، {profile.display_name} 👋</strong><span>{fmtDate(new Date().toISOString().slice(0,10))}</span></div><div className="partner-mini"><Avatar profile={partner}/><span>{partner.display_name}</span></div></header>{children}</main></div>}

function Dashboard({user,profile,partner,view,onProfileUpdated}:{user:SessionUser;profile:Profile;partner:Profile;view:string;onProfileUpdated:(p:Profile)=>void}){
const[start,setStart]=useState(today());
const[own,setOwn]=useState<Task[]>([]);
const[pTasks,setPTasks]=useState<Task[]>([]);
const[goals,setGoals]=useState<Goal[]>([]);
const[habits,setHabits]=useState<Habit[]>([]);
const[habitLogs,setHabitLogs]=useState<any[]>([]);
const[encouragements,setEncouragements]=useState<import('./lib/types').Encouragement[]>([]);
const[busy,setBusy]=useState(false);
const[modal,setModal]=useState(false);
const[toast,setToast]=useState('');
const[message,setMessage]=useState('');
const refresh=async()=>{
  const from=new Date(); from.setDate(1);
  const to=new Date(); to.setMonth(to.getMonth()+1);
  const f=from.toISOString().slice(0,10),t=to.toISOString().slice(0,10);
  const [a,b,g,h,e,l]=await Promise.all([
    api.getTasks(user.id,f,t),api.getTasks(partner.id,f,t),api.getGoals(user.id),api.getHabits(user.id),api.getEncouragements(user.id),api.getHabitLogs(user.id,start)
  ]);
  setOwn(a);setPTasks(b);setGoals(g);setHabits(h);setEncouragements(e);setHabitLogs(l);
};
useEffect(()=>{refresh().catch(e=>setToast((e as Error).message))},[user.id,partner.id]);
useEffect(()=>{
  const channel=supabase.channel(`rahletna-live-${user.id}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'tasks',filter:`user_id=eq.${user.id}`},()=>refresh().catch(()=>{}))
    .on('postgres_changes',{event:'*',schema:'public',table:'encouragements'},()=>refresh().catch(()=>{}))
    .subscribe();
  return()=>{supabase.removeChannel(channel)};
},[user.id,partner.id]);
const dayOwn=useMemo(()=>own.filter(t=>t.task_date===start),[own,start]);
const dayP=useMemo(()=>pTasks.filter(t=>t.task_date===start),[pTasks,start]);
const done=dayOwn.filter(t=>t.status==='completed').length;
const pDone=dayP.filter(t=>t.status==='completed').length;
async function toggle(t:Task){
  setBusy(true);try{
    const next=t.status==='completed'?'pending':'completed';
    const u=await api.upsertTask({id:t.id,user_id:user.id,status:next,completed_at:next==='completed'?new Date().toISOString():null,updated_at:new Date().toISOString()});
    setOwn(x=>x.map(i=>i.id===u.id?u:i));
  }catch(e){setToast((e as Error).message)}finally{setBusy(false)}
}
async function add(title:string,description:string,time:string,category:string,priority:string){
  try{
    const t=await api.upsertTask({user_id:user.id,title,description:description||null,due_time:time||null,task_date:start,status:'pending',category,priority:Number(priority) as 0|1|2|3});
    setOwn(x=>[...x,t]);setModal(false);
  }catch(e){setToast((e as Error).message)}
}
async function send(){
  if(!message.trim())return;
  try{
    await api.sendEncouragement(user.id,partner.id,message.trim());
    setMessage('');
    setToast('وصلت الرسالة ❤️');
    const e=await api.getEncouragements(user.id);setEncouragements(e);
  }catch(e){setToast((e as Error).message)}
}
if(view==='goals')return <Goals user={user} goals={goals} habits={habits} habitLogs={habitLogs} refresh={refresh}/>;
if(view==='history')return <History tasks={own}/>;
if(view==='partner')return <Partner partner={partner} tasks={pTasks}/>;
if(view==='profile')return <ProfileView profile={profile} onSaved={onProfileUpdated}/>;
const visibleMessages=encouragements.slice(0,6);
return <>
<section className="hero"><div><span className="eyebrow">اليوم • {fmtDate(start)}</span><h1>خطوة صغيرة كل يوم<br/><em>تقرّبك من نفسك اللي نفسك فيها.</em></h1><p>مش مطلوب منك الكمال. المطلوب إنك تكمل.</p></div><div className="ring" style={{'--p':`${pct(done,dayOwn.length)}%`} as React.CSSProperties}><b>{pct(done,dayOwn.length)}%</b><span>إنجازي اليوم</span></div></section>
<div className="grid two">
<section className="card"><div className="section-head"><div><h2>خطواتي اليوم</h2><span>{done} من {dayOwn.length} مكتملة</span></div><button className="icon-btn" onClick={()=>setModal(true)}><Plus size={20}/></button></div><div className="progress"><i style={{width:`${pct(done,dayOwn.length)}%`}}/></div>{dayOwn.length?<div className="tasks">{dayOwn.map(t=><TaskRow key={t.id} task={t} mine onToggle={()=>toggle(t)} onDelete={async()=>{try{await api.deleteTask(t.id);setOwn(x=>x.filter(i=>i.id!==t.id))}catch(e){setToast((e as Error).message)}}}/>)}</div>:<Empty text="لسه مفيش خطوات لليوم. ابدأ بأول خطوة."/>}</section>
<section className="card partner-card"><div className="section-head"><div><h2>{partner.display_name} اليوم</h2><span>{pDone} من {dayP.length} مكتملة</span></div><Avatar profile={partner}/></div><div className="progress"><i style={{width:`${pct(pDone,dayP.length)}%`}}/></div>{dayP.length?<div className="tasks">{dayP.map(t=><TaskRow key={t.id} task={t} mine={false}/>)}</div>:<Empty text="لسه مفيش خطوات مسجلة لليوم."/>}<div className="encourage"><Heart size={18}/><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="ابعت له كلمة تشجيع…"/><button onClick={send}>إرسال</button></div></section>
</div>
<section className="card messages-card"><div className="section-head"><div><h2>كلمات بيننا 💜</h2><span>تشجيع بسيط يكمل الرحلة</span></div></div>{visibleMessages.length?<div className="messages-list">{visibleMessages.map(m=><div className={`message ${m.sender_id===user.id?'mine':''}`} key={m.id}><div className="message-avatar">{m.sender_id===user.id?profile.display_name[0]:partner.display_name[0]}</div><div className="message-content"><div className="message-line"><strong>{m.sender_id===user.id?'أنت':partner.display_name}</strong>{m.sender_id===user.id&&<button className="message-delete" title="حذف الرسالة" onClick={async()=>{if(!window.confirm('حذف الرسالة؟'))return;try{await api.deleteEncouragement(m.id,user.id);setEncouragements(x=>x.filter(i=>i.id!==m.id))}catch(e){setToast((e as Error).message)}}}><Trash2 size={14}/></button>}</div><p>{m.message}</p><small>{new Date(m.created_at).toLocaleString('ar-EG',{dateStyle:'short',timeStyle:'short'})}</small></div></div>)}</div>:<Empty text="لسه مفيش رسائل. ابعت أول كلمة تشجيع ❤️"/>}</section>
<section className="stats grid three"><Stat label="سلسلة إنجازي" value={`${streak(own)} يوم`} icon="🔥"/><Stat label="أهدافي النشطة" value={`${goals.filter(g=>g.status==='active').length}`} icon="🎯"/><Stat label="عاداتي" value={`${habits.filter(h=>h.active).length}`} icon="🌱"/></section>
{modal&&<AddModal onClose={()=>setModal(false)} onAdd={add} busy={busy}/>} {toast&&<button className="toast" onClick={()=>setToast('')}>{toast}</button>}
</>}
function TaskRow({task,mine,onToggle,onDelete}:{task:Task;mine:boolean;onToggle?:()=>void;onDelete?:()=>void}){return <div className="task"><button className={`check ${task.status==='completed'?'done':''}`} disabled={!mine} onClick={onToggle}>{task.status==='completed'&&<Check size={15}/>}</button><div className="task-main"><strong className={task.status==='completed'?'strike':''}>{task.title}</strong><span>{task.category}{task.due_time?` • ${task.due_time.slice(0,5)}`:''}</span></div>{mine&&<button className="trash" onClick={onDelete}><Trash2 size={16}/></button>}</div>}
function AddModal({onClose,onAdd,busy}:{onClose:()=>void;onAdd:(a:string,b:string,c:string,d:string,e:string)=>void;busy:boolean}){const[a,setA]=useState('');const[b,setB]=useState('');const[c,setC]=useState('');const[d,setD]=useState('عام');const[e,setE]=useState('2');return <div className="overlay"><form className="modal" onSubmit={x=>{x.preventDefault();if(a.trim())onAdd(a,b,c,d,e)}}><div className="section-head"><h2>خطوة جديدة</h2><button type="button" className="icon-btn" onClick={onClose}>×</button></div><input required autoFocus placeholder="إيه الخطوة؟" value={a} onChange={x=>setA(x.target.value)}/><textarea placeholder="تفاصيل اختيارية" value={b} onChange={x=>setB(x.target.value)}/><div className="form-grid"><input type="time" value={c} onChange={x=>setC(x.target.value)}/><input placeholder="التصنيف" value={d} onChange={x=>setD(x.target.value)}/><select value={e} onChange={x=>setE(x.target.value)}><option value="0">عادي</option><option value="1">منخفضة</option><option value="2">متوسطة</option><option value="3">عالية</option></select></div><button className="primary" disabled={busy}>إضافة الخطوة</button></form></div>}
function Goals({user,goals,habits,habitLogs,refresh}:{user:SessionUser;goals:Goal[];habits:Habit[];habitLogs:any[];refresh:()=>Promise<void>}){
const[title,setTitle]=useState('');const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[habitModal,setHabitModal]=useState(false);const[habitTitle,setHabitTitle]=useState('');const[frequency,setFrequency]=useState('يومي');const[target,setTarget]=useState('7');const[habitGoal,setHabitGoal]=useState('');
async function add(){if(!title.trim())return;setBusy(true);setError('');try{await api.saveGoal({user_id:user.id,title:title.trim(),status:'active'});setTitle('');await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
async function toggleGoal(g:Goal){setBusy(true);setError('');try{await api.setGoalStatus(g.id,user.id,g.status==='completed'?'active':'completed');await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
async function removeGoal(g:Goal){if(!window.confirm(`حذف الهدف «${g.title}»؟\nلا يمكن التراجع عن الحذف.`))return;setBusy(true);setError('');try{await api.deleteGoal(g.id,user.id);await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
async function addHabit(e:React.FormEvent){e.preventDefault();if(!habitTitle.trim())return;setBusy(true);setError('');try{await api.saveHabit({user_id:user.id,title:habitTitle.trim(),frequency,target_per_week:Math.max(1,Math.min(7,Number(target)||1)),active:true,goal_id:habitGoal||null});setHabitTitle('');setFrequency('يومي');setTarget('7');setHabitGoal('');setHabitModal(false);await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
async function toggleHabit(h:Habit){const current=habitLogs.find(l=>l.habit_id===h.id)?.completed===true;setBusy(true);try{await api.logHabit(h.id,user.id,today(),!current);await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
async function removeHabit(h:Habit){if(!window.confirm(`حذف العادة «${h.title}»؟`))return;setBusy(true);try{await api.deleteHabit(h.id,user.id);await refresh()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
return <Page title="أهدافي" sub="الصورة الكبيرة، متقسمة لخطوات صغيرة.">
<div className="card"><div className="inline-form"><input placeholder="أضف هدفًا جديدًا…" value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}}/><button className="primary" onClick={add} disabled={busy||!title.trim()}><Plus size={18}/> إضافة</button></div>{error&&<div className="error goal-error">{error}</div>}</div>
<div className="grid two">{goals.map(g=><div className={`card goal-card ${g.status==='completed'?'goal-completed':''}`} key={g.id}>
<div className="goal-top"><div className="goal-icon"><Target size={20}/></div><span className={`badge ${g.status==='completed'?'success':''}`}>{g.status==='active'?'نشط':g.status==='completed'?'مكتمل':'متوقف'}</span></div>
<h2>{g.title}</h2><p>{g.description||'هدف جديد في رحلتك.'}</p>
<div className="goal-actions"><button className="secondary" onClick={()=>toggleGoal(g)} disabled={busy}><Check size={16}/>{g.status==='completed'?'إعادة فتح الهدف':'تم إتمام الهدف'}</button><button className="danger" onClick={()=>removeGoal(g)} disabled={busy}><Trash2 size={16}/> حذف</button></div>
</div>)}{!goals.length&&<Empty text="لسه مفيش أهداف. اكتب أول حاجة عايز تغيّرها في نفسك."/>}</div>
<div className="section-head habits-head"><div><h2 className="page-sub">عاداتي 🌱</h2><span>كررها كل يوم وابني استمراريتك.</span></div><button className="primary" onClick={()=>setHabitModal(true)}><Plus size={18}/> إضافة عادة</button></div>
<div className="card">{habits.length?habits.map(h=>{const done=habitLogs.some(l=>l.habit_id===h.id&&l.completed);return <div className={`habit ${done?'habit-done':''}`} key={h.id}><button className={`check ${done?'done':''}`} onClick={()=>toggleHabit(h)} disabled={busy}>{done&&<Check size={15}/>}</button><div><strong>{h.title}</strong><span>{h.frequency} • {h.target_per_week} مرات/أسبوع</span></div><div className="habit-actions"><span className="dot">{done?'تم اليوم ✓':h.active?'نشطة':'متوقفة'}</span><button className="trash" onClick={()=>removeHabit(h)} disabled={busy}><Trash2 size={16}/></button></div></div>}) : <Empty text="مفيش عادات لسه. أضف عادة صغيرة تقدر تلتزم بيها."/>}</div>
{habitModal&&<div className="overlay"><form className="modal" onSubmit={addHabit}><div className="section-head"><h2>عادة جديدة 🌱</h2><button type="button" className="icon-btn" onClick={()=>setHabitModal(false)}>×</button></div><input required autoFocus placeholder="مثال: شرب 2 لتر ماء" value={habitTitle} onChange={e=>setHabitTitle(e.target.value)}/><div className="form-grid"><select value={frequency} onChange={e=>setFrequency(e.target.value)}><option>يومي</option><option>أسبوعي</option><option>أيام محددة</option></select><input type="number" min="1" max="7" value={target} onChange={e=>setTarget(e.target.value)} placeholder="مرات/أسبوع"/></div><label>مرتبطة بهدف (اختياري)<select value={habitGoal} onChange={e=>setHabitGoal(e.target.value)}><option value="">بدون هدف</option>{goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label><button className="primary" disabled={busy}>إضافة العادة</button></form></div>}
</Page>}
function History({tasks}:{tasks:Task[]}){const days=[...new Set(tasks.map(t=>t.task_date))].sort().reverse();return <Page title="السجل" sub="شوف التقدم اللي حصل فعلًا، مش اللي كنت ناوي تعمله."><div className="history-list">{days.map(d=>{const ts=tasks.filter(t=>t.task_date===d),done=ts.filter(t=>t.status==='completed').length;return <div className="card history-day" key={d}><div><strong>{fmtDate(d)}</strong><span>{done} من {ts.length} مكتملة</span></div><b>{pct(done,ts.length)}%</b></div>})}{!days.length&&<Empty text="السجل هيبدأ يظهر مع أول يوم تسجل فيه خطواتك."/>}</div></Page>}
function Partner({partner,tasks}:{partner:Profile;tasks:Task[]}){const todayTasks=tasks.filter(t=>t.task_date===today());return <Page title={`رحلة ${partner.display_name}`} sub="شوف رحلته وادعمه، من غير ما تتدخل في خطواته."><div className="profile-hero card"><Avatar profile={partner} xl/><div><h2>{partner.display_name}</h2><p>{partner.bio||'لسه بيكتب حكايته.'}</p></div></div><div className="card"><div className="section-head"><h2>خطوات اليوم</h2><span>{todayTasks.filter(t=>t.status==='completed').length}/{todayTasks.length}</span></div>{todayTasks.map(t=><TaskRow key={t.id} task={t} mine={false}/>)}{!todayTasks.length&&<Empty text="مفيش خطوات مسجلة لليوم."/>}</div></Page>}
function Avatar({profile,xl=false,editable=false,onUpload}:{profile:Profile;xl?:boolean;editable?:boolean;onUpload?:(file:File)=>Promise<void>}){
const[busy,setBusy]=useState(false);
const ref=React.useRef<HTMLInputElement>(null);
async function pick(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file||!onUpload)return;setBusy(true);try{await onUpload(file)}catch(err){alert((err as Error).message)}finally{setBusy(false);e.target.value=''}}
return <div className={`avatar${xl?' xl':''} avatar-wrap${editable?' editable':''}`} onClick={()=>editable&&!busy&&ref.current?.click()} role={editable?'button':undefined} tabIndex={editable?0:undefined} onKeyDown={e=>{if(editable&&(e.key==='Enter'||e.key===' ')){e.preventDefault();ref.current?.click()}}}>{profile.avatar_url?<img src={profile.avatar_url} alt={profile.display_name}/>:(profile.display_name?.[0]||'ر')}{editable&&<span className="avatar-camera"><Camera size={16}/></span>}{editable&&<input ref={ref} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={pick}/>} {busy&&<span className="avatar-loading">…</span>}</div>
}

function ProfileView({profile,onSaved}:{profile:Profile;onSaved:(p:Profile)=>void}){
const[name,setName]=useState(profile.display_name);
const[bio,setBio]=useState(profile.bio||'');
const[busy,setBusy]=useState(false);
const[error,setError]=useState('');
useEffect(()=>{setName(profile.display_name);setBio(profile.bio||'')},[profile.id,profile.display_name,profile.bio]);
async function save(e:React.FormEvent){
  e.preventDefault();
  if(!name.trim())return;
  setBusy(true);setError('');
  try{const updated=await api.updateProfile(profile.id,{display_name:name.trim(),bio:bio.trim()||null});onSaved(updated)}
  catch(e){setError((e as Error).message)}finally{setBusy(false)}
}
return <Page title="ملفي" sub="المكان اللي تفتكر فيه أنت بتشتغل على إيه."><div className="card profile-edit"><div className="profile-hero"><Avatar profile={{...profile,display_name:name.trim()||profile.display_name}} xl editable onUpload={async(file)=>{const updated=await api.uploadAvatar(profile.id,file);onSaved(updated)}} /><div><h2>{name.trim()||profile.display_name}</h2><p>عدّل بياناتك، وهتظهر للشخص المرتبط بيك.</p></div></div><form onSubmit={save} className="profile-form"><label>الاسم<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} /></label><label>نبذة عنك<textarea maxLength={500} placeholder="اكتب نبذة قصيرة عن رحلتك…" value={bio} onChange={e=>setBio(e.target.value)} /></label>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?'جاري الحفظ…':'حفظ التعديلات'}</button></form></div></Page>}
function Page({title,sub,children}:{title:string;sub:string;children:React.ReactNode}){return <section className="page"><div className="page-head"><h1>{title}</h1><p>{sub}</p></div>{children}</section>}
function Empty({text}:{text:string}){return <div className="empty"><div>✦</div><p>{text}</p></div>}
function Stat({label,value,icon}:{label:string;value:string;icon:string}){return <div className="card stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>}

createRoot(document.getElementById('root')!).render(<App/>);
