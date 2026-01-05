import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostWithUser } from '@/types/database';

export const usePosts = (filters?: { branch?: string; search?: string; college?: string }) => {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.college) {
        // Filter posts where the user belongs to the same college
        // This requires a join filter, but Supabase simple filtering on related tables is tricky with just .eq() on top level
        // We'll filter in JS for now or use !inner join if we want strict SQL filtering
        // For simplicity/speed in this context, fetching all and filtering in SQL if possible or JS

        // Actually, we can filter by the author's college if we had it denormalized or via RLS
        // But since we want to see posts from *my* college, we need to filter where user.college == myCollege
        // The current query joins user:users(*). We can't easily filter by joined column in simple syntax without !inner

        // Let's use !inner to filter by joined user table
        query = supabase
          .from('posts')
          .select(`
            *,
            user:users!inner(*)
            `)
          .eq('user.college', filters.college)
          .order('created_at', { ascending: false });
      }

      if (filters?.branch && filters.branch !== 'All') {
        query = query.eq('branch', filters.branch);
      }

      if (filters?.search) {
        query = query.ilike('caption', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PostWithUser[];
    },
  });
};

export const useAlumniPosts = () => {
  return useQuery({
    queryKey: ['posts', 'alumni'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter posts from alumni (users whose batch_end is before current year)
      const alumniPosts = (data as PostWithUser[]).filter(post =>
        post.user?.batch_end && post.user.batch_end < currentYear
      );

      return alumniPosts;
    },
  });
};

export const useOtherCollegePosts = (userCollege?: string) => {
  return useQuery({
    queryKey: ['posts', 'other-colleges', userCollege],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If we have a user college, filter out posts from that college
      if (userCollege) {
        return (data as PostWithUser[]).filter(post =>
          post.user?.college !== userCollege
        );
      }

      return data as PostWithUser[];
    },
  });
};

export const useUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostWithUser[];
    },
  });
};
