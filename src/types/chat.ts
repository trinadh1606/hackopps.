export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  media_url: string | null;
  modality: string;
  state: string;
  priority: string;
  haptics_pattern: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  created_by: string;
  created_at: string;
}

export interface Participant {
  conversation_id: string;
  user_id: string;
  role: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  ability_profile: any;
}

export interface PresenceState {
  user_id: string;
  online: boolean;
  typing: boolean;
  last_seen: string;
}
