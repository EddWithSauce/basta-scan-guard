-- Roles enum + table (separate, per security guidance)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins manage user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- detection_logs
CREATE TABLE public.detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  scan_type text NOT NULL CHECK (scan_type IN ('live','capture','upload')),
  final_status text NOT NULL CHECK (final_status IN ('ALLOWED','NOT_ALLOWED','UNSURE')),
  detected_labels text[] NOT NULL DEFAULT '{}',
  confidence_scores numeric[] NOT NULL DEFAULT '{}',
  image_url text,
  notes text
);

ALTER TABLE public.detection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert detection logs"
ON public.detection_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read detection logs"
ON public.detection_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete detection logs"
ON public.detection_logs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update detection logs"
ON public.detection_logs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX detection_logs_created_at_idx ON public.detection_logs (created_at DESC);
CREATE INDEX detection_logs_status_idx ON public.detection_logs (final_status);

-- scan_images
CREATE TABLE public.scan_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  detection_log_id uuid REFERENCES public.detection_logs(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  mime_type text,
  size_bytes integer
);

ALTER TABLE public.scan_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert scan images"
ON public.scan_images FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins read scan images"
ON public.scan_images FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete scan images"
ON public.scan_images FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- system_settings
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage system_settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for scan snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', true);

CREATE POLICY "Public can upload scan files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'scans');

CREATE POLICY "Public can read scan files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'scans');

CREATE POLICY "Admins delete scan files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scans' AND public.has_role(auth.uid(), 'admin'));