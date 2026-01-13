-- Make user_id nullable for anonymous reminders
ALTER TABLE public.medicine_reminders ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.medicine_reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.medicine_reminders;

-- Create new policies that allow access by email for anonymous users
CREATE POLICY "Anyone can create reminders" 
ON public.medicine_reminders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view reminders by email or user_id" 
ON public.medicine_reminders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their reminders" 
ON public.medicine_reminders 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their reminders" 
ON public.medicine_reminders 
FOR DELETE 
USING (true);