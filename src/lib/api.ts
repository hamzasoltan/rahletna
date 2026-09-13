import { supabase } from './supabase';
import type { Goal, Habit, HabitLog, Milestone, Profile, Task, Connection, Encouragement, EncouragementReaction, ReactionType, Notification, ThemeSettings, UserTheme, ThemeRequest } from './types';

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
export async function saveHabit(h:Partial<Habit>&{user_id:string}){const {data,error}=await supabase.from('habits').insert(h).select().single(); if(error) throw error; return data as Habit;}
export async function deleteHabit(id:string,userId:string){const {error}=await supabase.from('habits').delete().eq('id',id).eq('user_id',userId); if(error) throw error;}
export async function getHabitLogs(userId:string,from:string,to:string){const {data,error}=await supabase.from('habit_logs').select('*').eq('user_id',userId).gte('log_date',from).lte('log_date',to); if(error) throw error; return (data??[]) as HabitLog[];}
export async function logHabit(habitId:string,userId:string,date:string,completed:boolean){const {data,error}=await supabase.from('habit_logs').upsert({habit_id:habitId,user_id:userId,log_date:date,completed},{onConflict:'habit_id,log_date'}).select().single(); if(error) throw error; return data as HabitLog;}
export async function getEncouragements(userId:string){const {data,error}=await supabase.from('encouragements').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:false}).limit(50); if(error) throw error; return (data??[]) as Encouragement[];}
export async function sendEncouragement(senderId:string,recipientId:string,message:string){const {error}=await supabase.from('encouragements').insert({sender_id:senderId,recipient_id:recipientId,message}); if(error) throw error;}

export async function getMilestones(goalId:string,userId:string){const {data,error}=await supabase.from('milestones').select('*').eq('goal_id',goalId).eq('user_id',userId).order('position').order('created_at');if(error)throw error;return(data??[]) as Milestone[]}
export async function saveMilestone(m:Partial<Milestone>&{user_id:string}){const {data,error}=await supabase.from('milestones').insert(m).select().single();if(error)throw error;return data as Milestone}
export async function toggleMilestone(id:string,userId:string,completed:boolean){const {data,error}=await supabase.from('milestones').update({completed}).eq('id',id).eq('user_id',userId).select().single();if(error)throw error;return data as Milestone}
export async function deleteMilestone(id:string,userId:string){const {error}=await supabase.from('milestones').delete().eq('id',id).eq('user_id',userId);if(error)throw error}

export async function deleteEncouragement(id:string,userId:string){const {error}=await supabase.from('encouragements').delete().eq('id',id).eq('sender_id',userId);if(error)throw error}
export async function getReactions(encouragementIds:string[]){if(!encouragementIds.length)return [] as EncouragementReaction[];const {data,error}=await supabase.from('encouragement_reactions').select('*').in('encouragement_id',encouragementIds).order('created_at',{ascending:true});if(error)throw error;return(data??[]) as EncouragementReaction[]}
export async function toggleReaction(encouragementId:string,userId:string,reaction:ReactionType){const {data:existing,error:findError}=await supabase.from('encouragement_reactions').select('id').eq('encouragement_id',encouragementId).eq('user_id',userId).eq('reaction',reaction).maybeSingle();if(findError)throw findError;if(existing){const {error}=await supabase.from('encouragement_reactions').delete().eq('id',existing.id).eq('user_id',userId);if(error)throw error;return null}const {data,error}=await supabase.from('encouragement_reactions').insert({encouragement_id:encouragementId,user_id:userId,reaction}).select().single();if(error)throw error;return data as EncouragementReaction}
export async function getNotifications(userId:string){const {data,error}=await supabase.from('notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(50);if(error)throw error;return(data??[]) as Notification[]}
export async function markNotificationRead(id:string,userId:string){const {data,error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId).select().single();if(error)throw error;return data as Notification}
export async function markAllNotificationsRead(userId:string){const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',userId).is('read_at',null);if(error)throw error}


export async function getThemeSettings(userId:string){const {data,error}=await supabase.from('theme_settings').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return data as ThemeSettings|null}
export async function ensureThemeSettings(userId:string){const existing=await getThemeSettings(userId);if(existing)return existing;const {data,error}=await supabase.from('theme_settings').insert({user_id:userId,active_theme_id:null,shared_mode:false}).select().single();if(error)throw error;return data as ThemeSettings}
export async function getUserThemes(userId:string){const {data,error}=await supabase.from('themes').select('*').eq('owner_id',userId).order('updated_at',{ascending:false});if(error)throw error;return(data??[]) as UserTheme[]}
export async function getTheme(id:string){const {data,error}=await supabase.from('themes').select('*').eq('id',id).single();if(error)throw error;return data as UserTheme}
export async function saveTheme(theme:Partial<UserTheme>&{owner_id:string}){if(theme.id){const {id,owner_id,...changes}=theme;const {data,error}=await supabase.from('themes').update(changes).eq('id',id).eq('owner_id',owner_id).select().single();if(error)throw error;return data as UserTheme}const {data,error}=await supabase.from('themes').insert(theme).select().single();if(error)throw error;return data as UserTheme}
export async function setActiveTheme(userId:string,themeId:string|null,sharedMode=false){const {data,error}=await supabase.from('theme_settings').upsert({user_id:userId,active_theme_id:themeId,shared_mode:sharedMode,updated_at:new Date().toISOString()},{onConflict:'user_id'}).select().single();if(error)throw error;return data as ThemeSettings}
export async function createThemeRequest(themeId:string,requesterId:string,recipientId:string){const {data,error}=await supabase.from('theme_requests').insert({theme_id:themeId,requester_id:requesterId,recipient_id:recipientId,status:'pending'}).select().single();if(error)throw error;return data as ThemeRequest}
export async function getThemeRequests(userId:string){const {data,error}=await supabase.from('theme_requests').select('*').or(`requester_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:false}).limit(30);if(error)throw error;return(data??[]) as ThemeRequest[]}
export async function respondThemeRequest(requestId:string,userId:string,accept:boolean){const {data,error}=await supabase.rpc('respond_theme_request',{p_request_id:requestId,p_accept:accept});if(error)throw error;return data as ThemeRequest}
