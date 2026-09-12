import { supabase } from './supabase';
import type { Goal, Habit, Profile, Task, Connection, Encouragement } from './types';

export async function getProfile(id:string){const {data,error}=await supabase.from('profiles').select('*').eq('id',id).single(); if(error) throw error; return data as Profile;}

export async function uploadAvatar(userId:string,file:File){
  if(!file.type.startsWith('image/')) throw new Error('اختار صورة فقط.');
  if(file.size>5*1024*1024) throw new Error('حجم الصورة يجب ألا يتجاوز 5MB.');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const path=`${userId}/avatar-${Date.now()}.${ext}`;
  const {error:uploadError}=await supabase.storage.from('avatars').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if(uploadError) throw uploadError;
  const {data}=supabase.storage.from('avatars').getPublicUrl(path);
  const profile=await updateProfile(userId,{avatar_url:data.publicUrl});
  return profile;
}

export async function updateProfile(id:string,p:Partial<Profile>){const {data,error}=await supabase.from('profiles').update({...p,updated_at:new Date().toISOString()}).eq('id',id).select().single(); if(error) throw error; return data as Profile;}
export async function getConnection(userId:string){const {data,error}=await supabase.from('connections').select('*').or(`requester_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:false}).limit(1).maybeSingle(); if(error) throw error; return data as Connection|null;}
export async function createInvite(userId:string){const code=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase(); const {data,error}=await supabase.from('connections').insert({requester_id:userId,invite_code:code,status:'pending'}).select().single(); if(error) throw error; return data as Connection;}
export async function acceptInvite(code:string){const {data,error}=await supabase.rpc('accept_invite',{p_invite_code:code.trim().toUpperCase()}); if(error) throw error; return data as Connection;}
export async function getTasks(userId:string, from:string, to:string){const {data,error}=await supabase.from('tasks').select('*').eq('user_id',userId).gte('task_date',from).lte('task_date',to).order('task_date',{ascending:true}).order('created_at',{ascending:true}); if(error) throw error; return (data??[]) as Task[];}
export async function upsertTask(task:Partial<Task>&{user_id:string}){
  if(task.id){
    const {id,user_id,...changes}=task;
    const {data,error}=await supabase.from('tasks').update(changes).eq('id',id).eq('user_id',user_id).select().single();
    if(error) throw error;
    return data as Task;
  }
  const {data,error}=await supabase.from('tasks').insert(task).select().single();
  if(error) throw error;
  return data as Task;
}
export async function deleteTask(id:string){const {error}=await supabase.from('tasks').delete().eq('id',id); if(error) throw error;}
export async function getGoals(userId:string){const {data,error}=await supabase.from('goals').select('*').eq('user_id',userId).order('created_at',{ascending:false}); if(error) throw error; return (data??[]) as Goal[];}
export async function saveGoal(g:Partial<Goal>&{user_id:string}){
  if(g.id){
    const {id,user_id,...changes}=g;
    const {data,error}=await supabase.from('goals').update(changes).eq('id',id).eq('user_id',user_id).select().single();
    if(error) throw error;
    return data as Goal;
  }
  const {data,error}=await supabase.from('goals').insert(g).select().single();
  if(error) throw error;
  return data as Goal;
}
export async function deleteGoal(id:string,userId:string){const {error}=await supabase.from('goals').delete().eq('id',id).eq('user_id',userId); if(error) throw error;}
export async function setGoalStatus(id:string,userId:string,status:Goal['status']){const {data,error}=await supabase.from('goals').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId).select().single(); if(error) throw error; return data as Goal;}
export async function getHabits(userId:string){const {data,error}=await supabase.from('habits').select('*').eq('user_id',userId).order('created_at',{ascending:false}); if(error) throw error; return (data??[]) as Habit[];}
export async function saveHabit(h:Partial<Habit>&{user_id:string}){if(h.id){const {id,user_id,...changes}=h;const {data,error}=await supabase.from('habits').update(changes).eq('id',id).eq('user_id',user_id).select().single();if(error)throw error;return data as Habit;}const {data,error}=await supabase.from('habits').insert(h).select().single();if(error)throw error;return data as Habit;}
export async function deleteHabit(id:string,userId:string){const {error}=await supabase.from('habits').delete().eq('id',id).eq('user_id',userId);if(error)throw error;}
export async function getHabitLogs(userId:string,date:string){const {data,error}=await supabase.from('habit_logs').select('*').eq('user_id',userId).eq('log_date',date);if(error)throw error;return data??[];}
export async function logHabit(habitId:string,userId:string,date:string,completed:boolean){const {data,error}=await supabase.from('habit_logs').upsert({habit_id:habitId,user_id:userId,log_date:date,completed},{onConflict:'habit_id,log_date'}).select().single(); if(error) throw error; return data;}
export async function getEncouragements(userId:string){const {data,error}=await supabase.from('encouragements').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:false}).limit(50); if(error) throw error; return (data??[]) as Encouragement[];}
export async function sendEncouragement(senderId:string,recipientId:string,message:string){const {error}=await supabase.from('encouragements').insert({sender_id:senderId,recipient_id:recipientId,message}); if(error) throw error;}
export async function deleteEncouragement(id:string,userId:string){const {error}=await supabase.from('encouragements').delete().eq('id',id).eq('sender_id',userId);if(error)throw error;}
