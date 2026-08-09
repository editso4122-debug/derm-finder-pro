-- Lock down medicine_reminders to owner-only access
DROP POLICY IF EXISTS "Anyone can create reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can delete their reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can update their reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can view reminders by email or user_id" ON public.medicine_reminders;

-- Remove orphan guest rows that can no longer be owned
DELETE FROM public.medicine_reminders WHERE user_id IS NULL;

ALTER TABLE public.medicine_reminders ALTER COLUMN user_id SET NOT NULL;

REVOKE ALL ON public.medicine_reminders FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicine_reminders TO authenticated;
GRANT ALL ON public.medicine_reminders TO service_role;

ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
ON public.medicine_reminders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.medicine_reminders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.medicine_reminders FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.medicine_reminders FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Restrict doctor_reviews policies to authenticated role only
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.doctor_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.doctor_reviews;

REVOKE ALL ON public.doctor_reviews FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_reviews TO authenticated;
GRANT ALL ON public.doctor_reviews TO service_role;

CREATE POLICY "Users can view their own reviews"
ON public.doctor_reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
ON public.doctor_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.doctor_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.doctor_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);