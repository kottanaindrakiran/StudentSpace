import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '@/components/feed/PostCard';
import { PostWithUser } from '@/types/database';

const PostDetails = () => {
    const { postId } = useParams();
    const navigate = useNavigate();

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            if (!postId) throw new Error("Post ID required");
            const { data, error } = await supabase
                .from('posts')
                .select('*, user:users(*)')
                .eq('id', postId)
                .single();

            if (error) throw error;
            return data as PostWithUser;
        },
        enabled: !!postId
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">Post not found or unavailable.</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto px-4 py-6">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>

            <PostCard post={post} />
        </div>
    );
};

export default PostDetails;
