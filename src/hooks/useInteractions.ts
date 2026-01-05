
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { toast } from '@/hooks/use-toast';

// Unified hook for Likes (Posts or Projects)
export const useLike = (entityId: string, type: 'post' | 'project' = 'post') => {
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();
    const table = 'likes';
    const idColumn = type === 'post' ? 'post_id' : 'project_id';

    // Fetch like status and count
    const { data: likeData, isLoading } = useQuery({
        queryKey: ['likes', type, entityId],
        queryFn: async () => {
            // Get count
            const query = supabase
                .from(table as any)
                .select('*', { count: 'exact', head: true });

            if (type === 'post') {
                query.eq('post_id', entityId);
            } else {
                query.eq('project_id', entityId);
            }

            const { count, error } = await query;

            if (error) throw error;

            let isLiked = false;
            if (currentUser?.id) {
                const userQuery = supabase
                    .from(table as any)
                    .select('id')
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (type === 'post') {
                    (userQuery as any).eq('post_id', entityId);
                } else {
                    (userQuery as any).eq('project_id', entityId);
                }

                const { data } = await userQuery;
                if (data) isLiked = true;
            }

            return { count: count || 0, isLiked };
        },
        enabled: true
    });

    const toggleLike = useMutation({
        mutationFn: async () => {
            if (!currentUser) throw new Error("Not logged in");

            if (likeData?.isLiked) {
                const query = supabase.from(table as any).delete().eq('user_id', currentUser.id);
                if (type === 'post') {
                    const { error } = await query.eq('post_id', entityId);
                    if (error) throw error;
                } else {
                    const { error } = await query.eq('project_id', entityId);
                    if (error) throw error;
                }
            } else {
                if (type === 'post') {
                    const { error } = await supabase
                        .from(table as any)
                        .insert({ post_id: entityId, user_id: currentUser.id });
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from(table as any)
                        .insert({ project_id: entityId, user_id: currentUser.id } as any);
                    if (error) throw error;
                }
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['likes', type, entityId] });
            const previousData = queryClient.getQueryData(['likes', type, entityId]);

            queryClient.setQueryData(['likes', type, entityId], (old: any) => ({
                count: old?.isLiked ? (old.count - 1) : (old ? old.count + 1 : 1),
                isLiked: !old?.isLiked
            }));

            return { previousData };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['likes', type, entityId], context?.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['likes', type, entityId] });
        }
    });

    return {
        likes: likeData?.count || 0,
        isLiked: likeData?.isLiked || false,
        toggleLike: toggleLike.mutate,
        isLoading
    };
};

export const useLikePost = (postId: string) => useLike(postId, 'post');
export const useLikeProject = (projectId: string) => useLike(projectId, 'project');

// Unified hook for Comments Count (Posts or Projects)
export const useCommentsCount = (entityId: string, type: 'post' | 'project' = 'post') => {
    const idColumn = type === 'post' ? 'post_id' : 'project_id';

    return useQuery({
        queryKey: ['comments-count', type, entityId],
        queryFn: async () => {
            const query = supabase
                .from('comments' as any)
                .select('*', { count: 'exact', head: true });

            if (type === 'post') {
                query.eq('post_id', entityId);
            } else {
                query.eq('project_id', entityId);
            }

            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        }
    });
};

export const useBookmark = (postId: string) => {
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    const { data: isBookmarked, isLoading } = useQuery({
        queryKey: ['bookmark', postId],
        queryFn: async () => {
            if (!currentUser) return false;
            const { data } = await supabase
                .from('bookmarks')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', currentUser.id)
                .maybeSingle();
            return !!data;
        },
        enabled: !!currentUser
    });

    const toggleBookmark = useMutation({
        mutationFn: async () => {
            if (!currentUser) throw new Error("Not logged in");

            if (isBookmarked) {
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('bookmarks')
                    .insert({ post_id: postId, user_id: currentUser.id });
                if (error) throw error;
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['bookmark', postId] });
            const previousState = queryClient.getQueryData(['bookmark', postId]);
            queryClient.setQueryData(['bookmark', postId], !isBookmarked);

            // Optimistic Toast
            toast({
                title: !isBookmarked ? "Post Saved" : "Post Unsaved",
                description: !isBookmarked ? "Post saved to your collection." : "Post removed from your collection.",
                duration: 2000,
            });

            return { previousState };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['bookmark', postId], context?.previousState);
            toast({ title: "Error", description: "Failed to update bookmark", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark', postId] });
            queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
        }
    });

    return {
        isBookmarked: !!isBookmarked,
        toggleBookmark: toggleBookmark.mutate,
        isLoading
    };
};
