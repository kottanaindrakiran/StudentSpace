
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CommentsSheetProps {
    entityId: string;
    type?: 'post' | 'project';
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommentsSheet({ entityId, type = 'post', isOpen, onOpenChange }: CommentsSheetProps) {
    const [newComment, setNewComment] = useState("");
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    const idColumn = type === 'post' ? 'post_id' : 'project_id';

    // Fetch comments
    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', type, entityId],
        enabled: isOpen,
        queryFn: async () => {
            const query = supabase
                .from('comments')
                .select('*, user:users(*)')
                .order('created_at', { ascending: true }); // Oldest first

            if (type === 'post') {
                query.eq('post_id', entityId);
            } else {
                query.eq('project_id', entityId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        }
    });

    // Add comment mutation
    const addCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!currentUser) throw new Error("Not logged in");

            const payload: any = {
                user_id: currentUser.id,
                content
            };

            if (type === 'post') {
                payload.post_id = entityId;
            } else {
                payload.project_id = entityId;
            }

            const { error } = await supabase
                .from('comments')
                .insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, entityId] });
            setNewComment("");
        }
    });

    // Delete comment mutation
    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', type, entityId] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addCommentMutation.mutate(newComment);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[80vh] sm:h-[600px] flex flex-col p-0 rounded-t-xl sm:rounded-l-xl">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Comments</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : comments && comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={comment.user?.profile_photo} />
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none text-sm">
                                            <span className="font-semibold block text-xs mb-1">
                                                {comment.user?.name || 'Unknown User'}
                                            </span>
                                            <p>{comment.content}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pl-2">
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                            {currentUser?.id === comment.user_id && (
                                                <button
                                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                                    className="text-[10px] text-red-500 font-medium hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            No comments yet. Be the first!
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1"
                            disabled={addCommentMutation.isPending}
                        />
                        <Button type="submit" size="icon" disabled={!newComment.trim() || addCommentMutation.isPending}>
                            {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
