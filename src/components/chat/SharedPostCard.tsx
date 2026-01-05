import { useNavigate } from 'react-router-dom';
import { DbPost } from '@/types/database';
import { Play } from 'lucide-react';

interface SharedPostCardProps {
    post: DbPost; // Or a tailored type if needed
}

export const SharedPostCard = ({ post }: SharedPostCardProps) => {
    const navigate = useNavigate();

    // Determine media to show (image or video thumbnail)
    const mediaUrl = post.media_url || ((post as any).media_urls && (post as any).media_urls[0]);
    const isVideo = mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <div
            className="group cursor-pointer bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg overflow-hidden border border-border/50 transition-colors"
            onClick={() => navigate(`/feed?highlight=${post.id}`)}
        >
            <div className="flex gap-2">
                {/* Thumbnail */}
                {mediaUrl && (
                    <div className="w-20 h-20 bg-muted relative flex-shrink-0">
                        {isVideo ? (
                            <video src={mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                            <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
                        )}
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-6 h-6 text-white fill-white opacity-80" />
                            </div>
                        )}
                    </div>
                )}

                {/* Content Snippet */}
                <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-xs truncate opacity-70">
                        {post.post_type === 'project' ? 'Shared Project' : 'Shared Post'}
                    </p>
                    {post.caption ? (
                        <p className="text-sm line-clamp-2 leading-snug">
                            {post.caption}
                        </p>
                    ) : (
                        <p className="text-xs italic text-muted-foreground">Attached content</p>
                    )}
                </div>
            </div>
        </div>
    );
};
