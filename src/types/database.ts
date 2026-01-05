// Application types derived from Supabase schema
import type { Tables } from '@/integrations/supabase/types';

export type DbUser = Tables<'users'> & {
  bio?: string | null;
  github_link?: string | null;
  linkedin_link?: string | null;
};
export type DbPost = Tables<'posts'>;
export type DbProject = Tables<'projects'>;
export type DbMessage = Tables<'messages'>;
export type DbCollege = Tables<'colleges'>;
export type DbCampus = Tables<'campuses'>;

// Extended types with relations
export interface PostWithUser extends DbPost {
  user: DbUser | null;
  media_urls?: string[] | null;
}

export interface ProjectWithUser extends DbProject {
  user: DbUser | null;
}

export interface MessageWithUsers extends DbMessage {
  sender: DbUser | null;
  receiver: DbUser | null;
}

// Conversation type for messages list
export interface Conversation {
  user: DbUser;
  lastMessage: string;
  time: string;
  unread: boolean;
}
