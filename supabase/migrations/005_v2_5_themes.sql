-- رحلتنا V2.5: Personal Themes + Shared Theme Requests

CREATE TABLE IF NOT EXISTS public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'ثيمي',
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.theme_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_theme_id uuid REFERENCES public.themes(id) ON DELETE SET NULL,
  shared_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.theme_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK(requester_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS themes_owner_idx ON public.themes(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS theme_requests_recipient_idx ON public.theme_requests(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS theme_requests_requester_idx ON public.theme_requests(requester_id, created_at DESC);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS themes_select ON public.themes;
CREATE POLICY themes_select ON public.themes FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_connected_to(owner_id));
DROP POLICY IF EXISTS themes_insert ON public.themes;
CREATE POLICY themes_insert ON public.themes FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS themes_update ON public.themes;
CREATE POLICY themes_update ON public.themes FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS themes_delete ON public.themes;
CREATE POLICY themes_delete ON public.themes FOR DELETE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS theme_settings_select ON public.theme_settings;
CREATE POLICY theme_settings_select ON public.theme_settings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_connected_to(user_id));
DROP POLICY IF EXISTS theme_settings_insert ON public.theme_settings;
CREATE POLICY theme_settings_insert ON public.theme_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS theme_settings_update ON public.theme_settings;
CREATE POLICY theme_settings_update ON public.theme_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS theme_requests_select ON public.theme_requests;
CREATE POLICY theme_requests_select ON public.theme_requests FOR SELECT TO authenticated USING (requester_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS theme_requests_insert ON public.theme_requests;
CREATE POLICY theme_requests_insert ON public.theme_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND public.is_connected_to(recipient_id));
DROP POLICY IF EXISTS theme_requests_update ON public.theme_requests;
CREATE POLICY theme_requests_update ON public.theme_requests FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.theme_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.theme_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_theme_request(p_request_id uuid, p_accept boolean)
RETURNS public.theme_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.theme_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.theme_requests WHERE id = p_request_id AND recipient_id = auth.uid() AND status = 'pending' FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'طلب الثيم غير موجود أو تم التعامل معه بالفعل'; END IF;
  IF p_accept THEN
    INSERT INTO public.theme_settings(user_id,active_theme_id,shared_mode,updated_at)
    VALUES(r.requester_id,r.theme_id,true,now())
    ON CONFLICT(user_id) DO UPDATE SET active_theme_id=EXCLUDED.active_theme_id,shared_mode=true,updated_at=now();
    INSERT INTO public.theme_settings(user_id,active_theme_id,shared_mode,updated_at)
    VALUES(r.recipient_id,r.theme_id,true,now())
    ON CONFLICT(user_id) DO UPDATE SET active_theme_id=EXCLUDED.active_theme_id,shared_mode=true,updated_at=now();
  END IF;
  UPDATE public.theme_requests SET status=CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END,responded_at=now() WHERE id=r.id RETURNING * INTO r;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_theme_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.notifications(user_id,actor_id,type,title,body,created_at)
  VALUES(NEW.recipient_id,NEW.requester_id,'theme_request','اقتراح ثيم جماعي 🎨','وصلك اقتراح لتفعيل ثيم جماعي في رحلتكما.',now());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_theme_request ON public.theme_requests;
CREATE TRIGGER trg_notify_theme_request AFTER INSERT ON public.theme_requests FOR EACH ROW EXECUTE FUNCTION public.notify_theme_request();

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.themes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- V2.4 notification type extension
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK(type IN ('encouragement','reaction','theme_request'));

NOTIFY pgrst, 'reload schema';
