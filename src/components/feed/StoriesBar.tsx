import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CreateStory from './CreateStory';
import StoryViewer from './StoryViewer';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    expires_at: string;
    user?: {
        name: string;
        profile_photo: string | null;
    };
}

const StoriesBar = () => {
    const { data: currentUser } = useCurrentUser();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStoryUser, setSelectedStoryUser] = useState<string | null>(null);

    // Fetch stories
    // Logic: Fetch active stories where expires_at > now
    // And group by user is done on client or via ordering
    const { data: stories, isLoading } = useQuery({
        queryKey: ['stories'],
        queryFn: async () => {
            // Type assertion for missing 'stories' table in local Types
            const { data, error } = await (supabase
                .from('stories' as any)
                .select(`
                    *,
                    user:users(id, name, profile_photo)
                `) as any)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Story[];
        },
        // Refetch every minute to clear expired
        refetchInterval: 60000
    });

    // Group stories by user
    const userStories = stories?.reduce((acc, story) => {
        if (!acc[story.user_id]) {
            acc[story.user_id] = [];
        }
        acc[story.user_id].push(story);
        return acc;
    }, {} as Record<string, Story[]>) || {};

    const usersWithStories = Object.keys(userStories).map(userId => {
        const userSt = userStories[userId];
        return {
            userId,
            user: userSt[0].user,
            stories: userSt
        };
    });

    // Handle "My Story" logic
    // Check if current user has active stories
    const myStories = currentUser ? userStories[currentUser.id] || [] : [];

    // Filter out current user from the main list to show "My Story" separately or first
    const otherUsersStories = usersWithStories.filter(u => u.userId !== currentUser?.id);


    return (
        <div className="w-full bg-card/50 backdrop-blur-sm border-b border-border py-4 mb-4 overflow-x-auto no-scrollbar">
            <div className="container max-w-2xl mx-auto px-4 flex gap-4">
                {/* Add Story / My Story */}
                <div className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer" onClick={() => {
                    if (myStories.length > 0) {
                        setSelectedStoryUser(currentUser!.id);
                    } else {
                        setIsCreateOpen(true);
                    }
                }}>
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-full p-0.5 ${myStories.length > 0 ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 'bg-muted border-2 border-dashed border-muted-foreground/30'}`}>
                            <div className="w-full h-full rounded-full bg-card p-0.5 overflow-hidden relative">
                                {currentUser?.profile_photo ? (
                                    <img src={currentUser.profile_photo} alt="Me" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-full">
                                        <span className="text-xs font-bold text-muted-foreground">You</span>
                                    </div>
                                )}
                                {myStories.length === 0 && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {myStories.length > 0 && (
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-card">
                                <Plus className="w-3 h-3" onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCreateOpen(true);
                                }} />
                            </div>
                        )}
                        {myStories.length === 0 && (
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-card">
                                <Plus className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[70px]">Moments</span>
                </div>

                {/* Other Users Stories */}
                {otherUsersStories.map(({ userId, user, stories }) => (
                    <div key={userId} className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer" onClick={() => setSelectedStoryUser(userId)}>
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600">
                            <div className="w-full h-full rounded-full bg-card p-0.5 overflow-hidden">
                                {user?.profile_photo ? (
                                    <img src={user.profile_photo} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-full">
                                        <span className="text-xs font-bold text-muted-foreground">{user?.name?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-medium truncate max-w-[70px]">{user?.name || 'User'}</span>
                    </div>
                ))}

                {/* Loading Skeleton if needed, but react-query handles this gracefully usually */}
            </div>

            {/* Create Story Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <CreateStory onClose={() => setIsCreateOpen(false)} />
                )}
            </AnimatePresence>

            {/* View Story Modal */}
            <AnimatePresence>
                {selectedStoryUser && (
                    <StoryViewer
                        stories={userStories[selectedStoryUser]}
                        onClose={() => setSelectedStoryUser(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoriesBar;
