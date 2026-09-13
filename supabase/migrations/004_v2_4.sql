-- رحلتنا V2.4: Reactions + Notifications + Realtime

CREATE TABLE IF NOT EXISTS public.encouragement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encouragement_id uuid NOT NULL REFERENCES public.encouragements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('heart','fire','clap','muscle','star')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (encouragement_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS encouragement_reactions_encouragement_idx
  ON public.encouragement_reactions(encouragement_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('encouragement','reaction')),
  encouragement_id uuid REFERENCES public.encouragements(id) ON DELETE CASCADE,
  reaction_id uuid REFERENCES public.encouragement_reactions(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.encouragement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS encouragement_reactions_select ON public.encouragement_reactions;
CREATE POLICY encouragement_reactions_select ON public.encouragement_reactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.encouragements e
    WHERE e.id = encouragement_reactions.encouragement_id
      AND (e.sender_id = auth.uid() OR e.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS encouragement_reactions_insert ON public.encouragement_reactions;
CREATE POLICY encouragement_reactions_insert ON public.encouragement_reactions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.encouragements e
    WHERE e.id = encouragement_reactions.encouragement_id
      AND (e.sender_id = auth.uid() OR e.recipient_id = auth.uid())
  )
);

DROP POLICY IF EXISTS encouragement_reactions_delete ON public.encouragement_reactions;
CREATE POLICY encouragement_reactions_delete ON public.encouragement_reactions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.encouragement_reactions TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_new_encouragement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, encouragement_id, title, body)
  VALUES (
    NEW.recipient_id,
    NEW.sender_id,
    'encouragement',
    NEW.id,
    'وصلك تشجيع جديد ❤️',
    left(NEW.message, 140)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_encouragement ON public.encouragements;
CREATE TRIGGER trg_notify_new_encouragement
AFTER INSERT ON public.encouragements
FOR EACH ROW EXECUTE FUNCTION public.notify_new_encouragement();

CREATE OR REPLACE FUNCTION public.notify_new_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e public.encouragements%ROWTYPE;
  reaction_label text;
BEGIN
  SELECT * INTO e FROM public.encouragements WHERE id = NEW.encouragement_id;
  IF e.id IS NULL OR e.sender_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  reaction_label := CASE NEW.reaction
    WHEN 'heart' THEN '❤️'
    WHEN 'fire' THEN '🔥'
    WHEN 'clap' THEN '👏'
    WHEN 'muscle' THEN '💪'
    WHEN 'star' THEN '⭐'
    ELSE '✨'
  END;

  INSERT INTO public.notifications (user_id, actor_id, type, encouragement_id, reaction_id, title, body)
  VALUES (
    e.sender_id,
    NEW.user_id,
    'reaction',
    e.id,
    NEW.id,
    'حد تفاعل مع كلمتك ' || reaction_label,
    left(e.message, 140)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_reaction ON public.encouragement_reactions;
CREATE TRIGGER trg_notify_new_reaction
AFTER INSERT ON public.encouragement_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_new_reaction();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.encouragement_reactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
