import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbUser } from '@/types/database';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // User might not have a profile yet
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as DbUser;
    },
  });
};

export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId!)
        .single();

      if (error) throw error;
      return data as DbUser;
    },
  });
};

export const useFollowCounts = (userId?: string) => {
  return useQuery({
    queryKey: ['followCounts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [followersResult, followingResult] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId!),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId!),
      ]);

      return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      };
    },
  });
};
