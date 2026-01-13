-- Drop the insecure public policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.doctor_reviews;

-- Create a secure policy that only allows users to view their own reviews
CREATE POLICY "Users can view their own reviews" 
ON public.doctor_reviews 
FOR SELECT 
USING (auth.uid() = user_id);