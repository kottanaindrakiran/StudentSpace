import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Check, Users } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SharePostModalProps {
    post?: any; // Post or Project
    user?: any; // User Profile to share
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SharePostModal({ post, user, isOpen, onOpenChange }: SharePostModalProps) {
    const { data: currentUser } = useCurrentUser();
    const [search, setSearch] = useState("");
    const [sentTo, setSentTo] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    // Fetch mutual followers (people we can chat with)
    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['share-users', currentUser?.id],
        enabled: isOpen && !!currentUser,
        queryFn: async () => {
            // 1. Who does current user follow?
            const { data: following } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUser!.id);

            const followingIds = new Set(following?.map(f => f.following_id) || []);

            // 2. Who follows current user?
            const { data: followers } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', currentUser!.id);

            // Mutuals are intersection
            const mutualIds = followers?.map(f => f.follower_id).filter(id => followingIds.has(id)) || [];

            if (mutualIds.length === 0) return [];

            const { data: profiles } = await supabase
                .from('users')
                .select('*')
                .in('id', mutualIds);

            return profiles || [];
        }
    });

    // Fetch Groups
    const { data: groups, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['share-groups', currentUser?.id],
        enabled: isOpen && !!currentUser,
        queryFn: async () => {
            // Get groups where user is a member
            const { data: memberships } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', currentUser!.id);

            if (!memberships || memberships.length === 0) return [];

            const groupIds = memberships.map(m => m.group_id);

            const { data: groupsData } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds);

            return groupsData || [];
        }
    });

    const sendPostMutation = useMutation({
        mutationFn: async ({ targetId, type }: { targetId: string, type: 'user' | 'group' }) => {
            let payload: any = {};
            let table = 'messages';

            if (type === 'user') {
                payload = {
                    sender_id: currentUser!.id,
                    receiver_id: targetId,
                };
            } else {
                table = 'group_messages';
                payload = {
                    sender_id: currentUser!.id,
                    group_id: targetId,
                };
            }

            const messageText = user
                ? "Shared a profile"
                : post?.project_title
                    ? "Shared a project"
                    : "Shared a post";

            // Handle Key Difference: 'messages' uses 'message', 'group_messages' uses 'content'
            if (type === 'group') {
                payload.content = messageText;

                // Group Messages Sharing Columns
                if (user) payload.shared_user_id = user.id;
                else if (post) {
                    if (post.project_title) payload.shared_project_id = post.id;
                    else payload.shared_post_id = post.id;
                }

            } else {
                payload.message = messageText;

                // Direct Messages Sharing Columns
                if (user) payload.shared_user_id = user.id;
                else if (post) {
                    if (post.project_title) payload.shared_project_id = post.id;
                    else payload.shared_post_id = post.id;
                }
            }

            const { error } = await supabase
                .from(table)
                .insert(payload);

            if (error) throw error;
            return targetId;
        },
        onSuccess: (targetId) => {
            setSentTo(prev => new Set(prev).add(targetId));
            toast({ title: "Sent", description: "Shared successfully" });
        },
        onError: (error) => {
            console.error("Share error:", error);
            toast({ title: "Error", description: "Failed to share", variant: "destructive" });
        }
    });

    const filteredUsers = users?.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.college?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredGroups = groups?.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Share {user ? 'Profile' : 'Post'}</DialogTitle>
                    <DialogDescription>
                        Send this to your friends or groups
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="friends" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="friends">Friends</TabsTrigger>
                        <TabsTrigger value="groups">Groups</TabsTrigger>
                    </TabsList>

                    <TabsContent value="friends" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            {isLoadingUsers ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
                            ) : filteredUsers && filteredUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar>
                                                    <AvatarImage src={u.profile_photo} />
                                                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 truncate">
                                                    <p className="text-sm font-medium truncate">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.college?.split(',')[0]}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={sentTo.has(u.id) ? "ghost" : "default"}
                                                disabled={sentTo.has(u.id) || sendPostMutation.isPending}
                                                onClick={() => sendPostMutation.mutate({ targetId: u.id, type: 'user' })}
                                            >
                                                {sentTo.has(u.id) ? (
                                                    <span className="flex items-center text-green-600"><Check className="w-4 h-4 mr-1" /> Sent</span>
                                                ) : (
                                                    "Send"
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No mutual followers found.
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="groups" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            {isLoadingGroups ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
                            ) : filteredGroups && filteredGroups.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredGroups.map(g => (
                                        <div key={g.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar>
                                                    <AvatarImage src={g.image_url} />
                                                    <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 truncate">
                                                    <p className="text-sm font-medium truncate">{g.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{g.type === 'my-college' ? 'Campus Group' : 'Group'}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={sentTo.has(g.id) ? "ghost" : "default"}
                                                disabled={sentTo.has(g.id) || sendPostMutation.isPending}
                                                onClick={() => sendPostMutation.mutate({ targetId: g.id, type: 'group' })}
                                            >
                                                {sentTo.has(g.id) ? (
                                                    <span className="flex items-center text-green-600"><Check className="w-4 h-4 mr-1" /> Sent</span>
                                                ) : (
                                                    "Send"
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No groups found.
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
