import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export const useNotifications = () => {
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    // Query: Fetch Notifications
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
            *,
            actor:users!actor_id (name, profile_photo)
        `)
                .eq('user_id', currentUser!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        refetchInterval: 10000 // Poll every 10s for simplicity (Real-time is better but this is quick)
    });

    // Mutation: Mark as Read
    const { mutate: markAsRead } = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        }
    });

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

    return { notifications, isLoading, unreadCount, markAsRead };
};
