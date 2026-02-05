-- Fix the permissive notifications insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Service role (edge functions) can insert notifications
-- Regular users can only insert their own notifications
CREATE POLICY "Users or system can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);