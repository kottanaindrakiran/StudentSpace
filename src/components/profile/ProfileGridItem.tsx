import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Trash2, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostWithUser } from '@/types/database';

interface ProfileGridItemProps {
    post: PostWithUser;
    onDelete?: (postId: string) => void;
    isOwner?: boolean;
    onClick?: () => void;
}

export const ProfileGridItem = ({ post, onDelete, isOwner = false, onClick }: ProfileGridItemProps) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const mediaUrls = post.media_urls || (post.media_url ? [post.media_url] : []);
    const hasMultiple = mediaUrls.length > 1;

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev + 1) % mediaUrls.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSlide((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
    };

    const isVideo = (url: string) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group break-inside-avoid mb-4"
            onClick={onClick}
        >
            <div className="relative w-full rounded-lg overflow-hidden bg-black/5">
                {/* Media Content */}
                {isVideo(mediaUrls[currentSlide]) ? (
                    <video
                        src={mediaUrls[currentSlide]}
                        className="w-full h-auto object-contain"
                        controls
                    />
                ) : (
                    <img
                        src={mediaUrls[currentSlide] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=300&fit=crop'}
                        alt="Post content"
                        className="w-full h-auto object-contain"
                    />
                )}

                {/* Multiple Media Indicators/Controls */}
                {hasMultiple && (
                    <>
                        {/* Layer Icon to indicate multiple (Instagram style) */}
                        <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-md pointer-events-none">
                            <Layers className="w-4 h-4 text-white" />
                        </div>

                        {/* Navigation Arrows (visible on hover) */}
                        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 pointer-events-auto"
                                onClick={prevSlide}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 pointer-events-auto"
                                onClick={nextSlide}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                            {mediaUrls.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-white' : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Owner Actions (Delete) */}
            {isOwner && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!hasMultiple && (
                        <div className="bg-black/50 rounded-lg flex items-center p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-400 hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(post.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    {hasMultiple && (
                        // If multiple, move delete to bottom or keep it accessible but distinct from layer icon
                        // The layer icon is top-right, so we can put actions top-left or change layer icon position.
                        // Let's hide layer icon if owner actions are visible or put actions top-left.
                        // For now, let's put actions TOP LEFT.
                        <div className="absolute top-0 right-8 bg-black/50 rounded-lg flex items-center p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-400 hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(post.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
