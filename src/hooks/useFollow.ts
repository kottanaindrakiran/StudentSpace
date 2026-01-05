import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './use-toast';

export const useIsFollowing = (targetUserId?: string) => {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['isFollowing', targetUserId, currentUser?.id],
        enabled: !!targetUserId && !!currentUser,
        queryFn: async () => {
            if (!currentUser || !targetUserId) return false;

            const { count, error } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', currentUser.id)
                .eq('following_id', targetUserId);

            if (error) throw error;
            return count !== null && count > 0;
        },
    });
};

export const useFollow = (targetUserId: string) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: currentUser } = useCurrentUser();

    const { mutate: follow, isPending: isFollowPending } = useMutation({
        mutationFn: async () => {
            if (!currentUser) throw new Error("Not logged in");

            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: currentUser.id,
                    following_id: targetUserId
                });

            if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['isFollowing', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['followCounts', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['followCounts', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['isMutualFollow', targetUserId] });
            toast({ title: "Followed", description: "You are now following this user." });
        },
        onError: (error: any) => {
            toast({
                title: "Cannot Follow",
                description: error.message || "Failed to follow user.",
                variant: "destructive"
            });
        }
    });

    const { mutate: unfollow, isPending: isUnfollowPending } = useMutation({
        mutationFn: async () => {
            if (!currentUser) throw new Error("Not logged in");

            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUser.id)
                .eq('following_id', targetUserId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['isFollowing', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['followCounts', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['followCounts', currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['isMutualFollow', targetUserId] });
            toast({ title: "Unfollowed" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to unfollow user.",
                variant: "destructive"
            });
        }
    });

    return {
        follow,
        unfollow,
        isLoading: isFollowPending || isUnfollowPending
    };
};

export const useAmIFollowed = (userId: string | undefined) => {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['isFollowedBy', userId, currentUser?.id],
        queryFn: async () => {
            if (!userId || !currentUser) return false;

            const { count, error } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId)
                .eq('following_id', currentUser.id);

            if (error) {
                console.error("Error checking if followed by user:", error);
                return false;
            }

            return count !== null && count > 0;
        },
        enabled: !!userId && !!currentUser,
    });
};

export const useIsMutualFollow = (userId: string | undefined) => {
    const { data: isFollowing } = useIsFollowing(userId);
    const { data: isFollowedBy } = useAmIFollowed(userId);

    return {
        isMutual: !!(isFollowing && isFollowedBy),
        isFollowing,
        isFollowedBy
    };
};
