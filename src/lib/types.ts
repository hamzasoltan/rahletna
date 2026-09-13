export type Status='pending'|'in_progress'|'completed'|'skipped';
export type Priority=0|1|2|3;
export type Task={id:string;user_id:string;title:string;description:string|null;task_date:string;due_time:string|null;status:Status;category:string;priority:Priority;goal_id:string|null;completed_at:string|null;created_at:string;updated_at:string};
export type Gender='male'|'female';
export type Profile={id:string;display_name:string;avatar_url:string|null;bio:string|null;gender:Gender|null;created_at:string;updated_at:string};
export type Goal={id:string;user_id:string;title:string;description:string|null;start_date:string|null;target_date:string|null;status:'active'|'completed'|'paused';created_at:string;updated_at:string};
export type Habit={id:string;user_id:string;goal_id:string|null;title:string;frequency:string;target_per_week:number;days_of_week:number[];active:boolean;created_at:string};
export type Connection={id:string;requester_id:string;recipient_id:string|null;invite_code:string;status:'pending'|'connected'|'revoked';created_at:string;updated_at:string};
export type Encouragement={id:string;sender_id:string;recipient_id:string;message:string;created_at:string};
export type ReactionType='heart'|'fire'|'clap'|'muscle'|'star';
export type EncouragementReaction={id:string;encouragement_id:string;user_id:string;reaction:ReactionType;created_at:string};
export type Notification={id:string;user_id:string;actor_id:string|null;type:'encouragement'|'reaction'|'theme_request';encouragement_id:string|null;reaction_id:string|null;title:string;body:string;read_at:string|null;created_at:string};

export type HabitLog={id:string;habit_id:string;user_id:string;log_date:string;completed:boolean};
export type Milestone={id:string;goal_id:string;user_id:string;title:string;completed:boolean;position:number;created_at:string};

export type ThemeConfig={primary:string;soft:string;bg:string;surface:string;text:string;muted:string;line:string;danger:string};
export type UserTheme={id:string;owner_id:string;name:string;config:ThemeConfig;created_at:string;updated_at:string};
export type ThemeSettings={user_id:string;active_theme_id:string|null;shared_mode:boolean;updated_at:string};
export type ThemeRequest={id:string;theme_id:string;requester_id:string;recipient_id:string;status:'pending'|'accepted'|'rejected';created_at:string;responded_at:string|null};
