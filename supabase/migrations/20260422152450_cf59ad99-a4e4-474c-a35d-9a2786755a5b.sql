DROP POLICY IF EXISTS "Admins read detection logs" ON public.detection_logs;
CREATE POLICY "Public can read detection logs"
ON public.detection_logs
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins read scan images" ON public.scan_images;
CREATE POLICY "Public can read scan images"
ON public.scan_images
FOR SELECT
TO anon, authenticated
USING (true);