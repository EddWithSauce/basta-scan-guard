DROP POLICY IF EXISTS "Anyone can insert detection logs" ON public.detection_logs;
CREATE POLICY "Anyone can insert detection logs"
ON public.detection_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  scan_type = ANY (ARRAY['live','capture','upload'])
  AND final_status = ANY (ARRAY['ALLOWED','NOT_ALLOWED','UNSURE'])
  AND COALESCE(array_length(detected_labels, 1), 0) = COALESCE(array_length(confidence_scores, 1), 0)
  AND COALESCE(array_length(detected_labels, 1), 0) <= 25
  AND (image_url IS NULL OR length(trim(image_url)) > 0)
  AND (notes IS NULL OR length(notes) <= 5000)
);

DROP POLICY IF EXISTS "Anyone can insert scan images" ON public.scan_images;
CREATE POLICY "Anyone can insert scan images"
ON public.scan_images
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(storage_path)) > 0
  AND (public_url IS NULL OR length(trim(public_url)) > 0)
  AND (mime_type IS NULL OR mime_type LIKE 'image/%')
  AND (size_bytes IS NULL OR size_bytes >= 0)
);