-- رحلتنا V2.3: Solo Mode + Gender + Partner View

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_gender_check
CHECK (gender IS NULL OR gender IN ('male','female'));

-- الشريك يستطيع رؤية الأهداف والعادات فقط، بدون تعديلها.
DROP POLICY IF EXISTS goals_select ON public.goals;
CREATE POLICY goals_select ON public.goals
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_connected_to(user_id));

DROP POLICY IF EXISTS habits_select ON public.habits;
CREATE POLICY habits_select ON public.habits
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_connected_to(user_id));

DROP POLICY IF EXISTS habit_logs_select ON public.habit_logs;
CREATE POLICY habit_logs_select ON public.habit_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_connected_to(user_id));

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.goals, public.habits, public.habit_logs TO authenticated;
