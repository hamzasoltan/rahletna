export type Status='pending'|'in_progress'|'completed'|'skipped';
export type Priority=0|1|2|3;
export type Task={id:string;user_id:string;title:string;description:string|null;task_date:string;due_time:string|null;status:Status;category:string;priority:Priority;goal_id:string|null;completed_at:string|null;created_at:string;updated_at:string};
export type Profile={id:string;display_name:string;avatar_url:string|null;bio:string|null;created_at:string;updated_at:string};
export type Goal={id:string;user_id:string;title:string;description:string|null;target_date:string|null;status:'active'|'completed'|'paused';created_at:string;updated_at:string};
export type Habit={id:string;user_id:string;goal_id:string|null;title:string;frequency:string;target_per_week:number;active:boolean;created_at:string};
export type Connection={id:string;requester_id:string;recipient_id:string|null;invite_code:string;status:'pending'|'connected'|'revoked';created_at:string;updated_at:string};
export type Encouragement={id:string;sender_id:string;recipient_id:string;message:string;created_at:string};
