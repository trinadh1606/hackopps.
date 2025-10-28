-- Create profiles table for user ability settings
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  ability_profile JSONB NOT NULL DEFAULT '{"profile":"DEAF","prefs":{}}',
  device_prefs JSONB DEFAULT '{"brailleTable":"english","hapticStrength":0.8,"ttsVoice":"default","offlineOnly":false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create participants junction table
CREATE TABLE public.participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  media_url TEXT,
  modality TEXT NOT NULL DEFAULT 'text',
  priority TEXT NOT NULL DEFAULT 'normal',
  state TEXT NOT NULL DEFAULT 'new',
  haptics_pattern JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create caregivers table
CREATE TABLE public.caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.participants 
    WHERE participants.conversation_id = conversations.id 
    AND participants.user_id = auth.uid()
  ));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Participants policies
CREATE POLICY "Users can view participants in their conversations" ON public.participants FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.participants p 
    WHERE p.conversation_id = participants.conversation_id 
    AND p.user_id = auth.uid()
  ));
CREATE POLICY "Conversation creators can add participants" ON public.participants FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_id 
    AND conversations.created_by = auth.uid()
  ));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.participants 
    WHERE participants.conversation_id = messages.conversation_id 
    AND participants.user_id = auth.uid()
  ));
CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.participants 
      WHERE participants.conversation_id = messages.conversation_id 
      AND participants.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Caregivers policies
CREATE POLICY "Users can view their own caregivers" ON public.caregivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own caregivers" ON public.caregivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own caregivers" ON public.caregivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own caregivers" ON public.caregivers FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, ability_profile)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    '{"profile":"DEAF","prefs":{}}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();