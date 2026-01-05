import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface UserFilter {
    search?: string;
    role?: 'student' | 'alumni' | 'all'; // We might need to drive this by batch year if role column isn't strict
    college?: string;
    branch?: string;
    batch?: string;
}

export const useUsers = (filters: UserFilter) => {
    const { data: currentUser } = useCurrentUser();

    return useQuery({
        queryKey: ['users', filters],
        enabled: !!currentUser,
        queryFn: async () => {
            let query = supabase
                .from('users')
                .select('*');

            // Filter by search query (name or email)
            if (filters.search) {
                // Simple OR search on name and email
                // Using ilike for case-insensitive partial match
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            // Filter by Role (Student vs Alumni based on batch_end)
            if (filters.role && filters.role !== 'all') {
                const currentYear = new Date().getFullYear();
                if (filters.role === 'student') {
                    // Students are those whose batch ends in current year or future
                    query = query.gte('batch_end', currentYear);
                } else if (filters.role === 'alumni') {
                    // Alumni are those whose batch ended before current year
                    query = query.lt('batch_end', currentYear);
                }
            }

            // Filter by College (Exact match)
            if (filters.college && filters.college !== 'All') {
                query = query.eq('college', filters.college);
            }

            // Filter by Branch (Exact match)
            if (filters.branch && filters.branch !== 'All') {
                query = query.eq('branch', filters.branch);
            }

            // Filter by Batch (Exact match)
            if (filters.batch && filters.batch !== 'All') {
                query = query.eq('batch_end', parseInt(filters.batch));
            }

            // Limit results for performance
            query = query.limit(50);

            // Order by name
            query = query.order('name');

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching users:', error);
                throw error;
            }

            return data;
        },
    });
};
