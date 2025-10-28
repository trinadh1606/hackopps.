-- Step 1: Create security definer function to check participation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  );
$$;

-- Step 2: Drop old recursive policies on participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.participants;

-- Step 3: Create new non-recursive policies
CREATE POLICY "Users can view participants in their conversations"
ON public.participants
FOR SELECT
TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "Conversation creators can add participants"
ON public.participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = participants.conversation_id
      AND created_by = auth.uid()
  )
);

-- Step 4: Also update conversations and messages policies to use the function
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.is_conversation_participant(auth.uid(), id));

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (public.is_conversation_participant(auth.uid(), conversation_id));