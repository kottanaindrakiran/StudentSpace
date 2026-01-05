import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useGroupChat = (groupId?: string) => {
    const queryClient = useQueryClient();

    // Get current user
    const { data: authData } = useQuery({
        queryKey: ['auth-user'],
        queryFn: async () => {
            const { data } = await supabase.auth.getUser();
            return data;
        }
    });
    const user = authData?.user;

    useEffect(() => {
        if (!groupId) return;

        // Subscribe to new messages
        const channel = supabase
            .channel(`group-chat:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, DELETE, etc.)
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    // Invalidate query to refetch
                    queryClient.invalidateQueries({ queryKey: ['group-chat', groupId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, queryClient]);

    return useQuery({
        queryKey: ['group-chat', groupId],
        enabled: !!groupId && !!user,
        queryFn: async () => {
            if (!groupId) return [];

            const { data, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    sender:users!group_messages_sender_id_fkey(*)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as any[]; // Cast to match expected structure
        },
    });
};

export const sendGroupMessage = async (
    groupId: string,
    message: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video' | 'document' | 'zip' | 'sticker'
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from('group_messages')
        .insert({
            group_id: groupId,
            sender_id: user.id,
            content: message, // Note: Schema uses 'content' not 'message'
            media_url: attachmentUrl, // Schema uses 'media_url'
            type: attachmentType || 'text', // Schema uses 'type'
        });

    if (error) throw error;
};

export const deleteGroupMessage = async (messageId: string) => {
    const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

    if (error) throw error;
};
