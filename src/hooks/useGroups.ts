
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { toast } from 'sonner';

export type Group = {
    id: string;
    name: string;
    description: string | null;
    type: 'my-college' | 'other-colleges';
    college: string | null;
    created_by: string | null;
    image_url: string | null;
    created_at: string;
};

export const useGroups = () => {
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    const { data: myCollegeGroups, isLoading: isLoadingMyCollege } = useQuery({
        queryKey: ['groups', 'my-college', currentUser?.college],
        enabled: !!currentUser?.college,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('type', 'my-college')
                .eq('college', currentUser?.college!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Temporary cast until types are updated
            return data as unknown as Group[];
        },
    });

    const { data: otherCollegeGroups, isLoading: isLoadingOtherColleges } = useQuery({
        queryKey: ['groups', 'other-colleges'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('type', 'other-colleges')
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Temporary cast
            return data as unknown as Group[];
        },
    });

    const createGroup = useMutation({
        mutationFn: async (newGroup: {
            name: string;
            description?: string;
            type: 'my-college' | 'other-colleges';
            members?: string[];
        }) => {
            if (!currentUser) throw new Error('Not authenticated');

            const groupData = {
                name: newGroup.name,
                description: newGroup.description,
                type: newGroup.type,
                created_by: currentUser.id,
                college: newGroup.type === 'my-college' ? currentUser.college : null,
            };

            const { data, error } = await supabase
                .from('groups')
                .insert(groupData)
                .select()
                .single();

            if (error) throw error;

            // Auto-add creator as admin
            const membersToAdd = [
                {
                    group_id: data.id,
                    user_id: currentUser.id,
                    role: 'admin'
                }
            ];

            // Add selected members
            if (newGroup.members && newGroup.members.length > 0) {
                newGroup.members.forEach(memberId => {
                    if (memberId !== currentUser.id) {
                        membersToAdd.push({
                            group_id: data.id,
                            user_id: memberId,
                            role: 'member'
                        });
                    }
                });
            }

            const { error: memberError } = await supabase
                .from('group_members')
                .insert(membersToAdd);

            if (memberError) {
                console.error('Error adding admin:', memberError);
                // Non-blocking but good to know
            }

            return data as unknown as Group;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Group created successfully!');
        },
        onError: (error) => {
            console.error('Error creating group:', error);
            toast.error('Failed to create group');
        },
    });

    const addMember = useMutation({
        mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
            const { error } = await supabase
                .from('group_members')
                .insert({ group_id: groupId, user_id: userId, role: 'member' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-members'] });
            toast.success('Member added successfully');
        },
        onError: () => toast.error('Failed to add member'),
    });

    const removeMember = useMutation({
        mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group-members'] });
            toast.success('Member removed successfully');
        },
        onError: () => toast.error('Failed to remove member'),
    });

    const updateGroup = useMutation({
        mutationFn: async ({ groupId, updates }: { groupId: string; updates: { name?: string; description?: string; image_url?: string } }) => {
            const { error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Group updated successfully');
        },
        onError: () => toast.error('Failed to update group'),
    });

    return {
        myCollegeGroups,
        otherCollegeGroups,
        isLoading: isLoadingMyCollege || isLoadingOtherColleges,
        createGroup,
        addMember,
        removeMember,
        updateGroup
    };
};
