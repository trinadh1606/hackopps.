-- Drop the existing SELECT policy on conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

-- Create new policy that allows both participants AND creators to view
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  -- Allow if user is a participant
  is_conversation_participant(auth.uid(), id)
  OR
  -- Allow if user is the creator
  auth.uid() = created_by
);