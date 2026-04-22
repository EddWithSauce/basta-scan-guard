
-- Roles enum and table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Detection logs
CREATE TYPE public.detection_status AS ENUM ('ALLOWED', 'NOT_ALLOWED', 'UNSURE');
CREATE TYPE public.detection_source AS ENUM ('live', 'capture', 'upload');

CREATE TABLE public.detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source public.detection_source NOT NULL,
  status public.detection_status NOT NULL,
  detected_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_confidence NUMERIC(5,4),
  image_path TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_detection_logs_created_at ON public.detection_logs (created_at DESC);
CREATE INDEX idx_detection_logs_status ON public.detection_logs (status);

ALTER TABLE public.detection_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (incl anon) can insert their own scans
CREATE POLICY "Anyone can insert detection logs"
ON public.detection_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Only admins can read/delete
CREATE POLICY "Admins can view all logs"
ON public.detection_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete logs"
ON public.detection_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for snapshots
INSERT INTO storage.buckets (id, name, public) VALUES ('snapshots', 'snapshots', false);

CREATE POLICY "Anyone can upload snapshots"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'snapshots');

CREATE POLICY "Admins can view snapshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'snapshots' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete snapshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'snapshots' AND public.has_role(auth.uid(), 'admin'));
