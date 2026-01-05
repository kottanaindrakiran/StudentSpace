import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, DbUser } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';

export const useConversations = (currentUserId?: string) => {
  return useQuery({
    queryKey: ['conversations', currentUserId],
    enabled: !!currentUserId,
    queryFn: async () => {
      // Get messages where user is sender or receiver
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*),
          receiver:users!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg) => {
        const isCurrentUserSender = msg.sender_id === currentUserId;
        const partner = isCurrentUserSender ? msg.receiver : msg.sender;

        if (partner && !conversationMap.has(partner.id)) {
          conversationMap.set(partner.id, {
            user: partner as DbUser,
            lastMessage: msg.message || '',
            time: msg.created_at
              ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: false })
              : '',
            unread: !isCurrentUserSender, // Simple unread logic
          });
        }
      });

      return Array.from(conversationMap.values());
    },
  });
};

export const useChat = (partnerId?: string) => {
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
    if (!partnerId || !user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`, // Listen for messages sent TO me
        },
        (payload) => {
          // Invalidate query to refetch
          // Or optimistic update if we want to be fancy.
          // For now simple invalidation.
          if (payload.new.sender_id === partnerId) {
            queryClient.invalidateQueries({ queryKey: ['chat', partnerId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, user, queryClient]);

  return useQuery({
    queryKey: ['chat', partnerId],
    enabled: !!partnerId && !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }); // Chat order

      if (error) throw error;
      return data;
    },
  });
};

export const sendMessage = async (
  receiverId: string,
  message: string,
  attachmentUrl?: string,
  attachmentType?: 'image' | 'video' | 'document' | 'zip',
  sharedPostId?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      message: message,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      shared_post_id: sharedPostId
    });

  if (error) throw error;
};

export const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
};
