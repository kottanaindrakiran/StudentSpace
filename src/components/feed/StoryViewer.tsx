import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, User, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
    caption?: string | null;
    user?: {
        name: string;
        profile_photo: string | null;
    };
}

interface Viewer {
    id: string;
    viewer: {
        id: string;
        name: string;
        profile_photo: string | null;
    };
}

interface StoryViewerProps {
    stories: Story[];
    onClose: () => void;
}

const StoryViewer = ({ stories, onClose }: StoryViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const story = stories[currentIndex];
    const user = story.user;

    // Hooks
    const { data: currentUser } = useCurrentUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // View stats (Owner only)
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [viewCount, setViewCount] = useState(0);
    const [isViewersOpen, setIsViewersOpen] = useState(false);

    // Record View & Fetch Stats
    useEffect(() => {
        if (!currentUser || !story) return;

        const recordView = async () => {
            if (currentUser.id !== story.user_id) {
                // Try to record view, ignore if already exists (constraint)
                await supabase
                    .from('story_views' as any)
                    .insert({ story_id: story.id, viewer_id: currentUser.id })
                    .maybeSingle();
            }
        };

        const fetchViews = async () => {
            // Only fetch if owner
            if (currentUser.id === story.user_id) {
                const { data, count } = await supabase
                    .from('story_views' as any)
                    .select('*, viewer:users(id, name, profile_photo)', { count: 'exact' })
                    .eq('story_id', story.id);

                if (data) setViewers(data as any);
                if (count !== null) setViewCount(count);
            }
        };

        recordView();
        fetchViews();
    }, [story.id, currentUser]);


    // Reset progress on change
    useEffect(() => {
        setProgress(0);
        setIsViewersOpen(false); // Close viewers list on next slide
        console.log('Current story type:', story.media_type);

        if (story.media_type === 'image') {
            const timer = setTimeout(() => {
                handleNext();
            }, 5000);

            // Animate progress for image
            const startTime = Date.now();
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const p = Math.min((elapsed / 5000) * 100, 100);
                setProgress(p);
            }, 50); // updates every 50ms

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [currentIndex, story.media_type, stories.length, onClose]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleVideoEnd = () => {
        handleNext();
    };

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            if (dur > 0) {
                setProgress((current / dur) * 100);
            }
        }
    };

    const handleDelete = async () => {
        if (!currentUser || currentUser.id !== story.user_id) return;

        try {
            // 1. Delete from Storage
            const fileName = story.media_url.split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from('story-media')
                    .remove([`${currentUser.id}/${fileName}`]);
            }

            // 2. Delete from DB
            // Cast to any to avoid type errors with missing table definitions
            const { error } = await (supabase
                .from('stories' as any)
                .delete()
                .eq('id', story.id) as any);

            if (error) throw error;

            toast({ title: "Story deleted" });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            onClose();

        } catch (error) {
            console.error(error);
            toast({ title: "Error deleting story", variant: "destructive" });
        }
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        >
            {/* Close Button */}
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white z-50 hover:bg-white/10 w-10 h-10 rounded-full" onClick={onClose}>
                <X className="w-6 h-6" />
            </Button>

            {/* Navigation Areas */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" onClick={handleNext} />

            <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 sm:h-[80vh] sm:w-auto mx-auto my-auto">
                {/* Progress Bars */}
                <div className="absolute top-3 inset-x-3 flex gap-1 z-20">
                    {stories.map((st, idx) => (
                        <div key={st.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                                animate={{ width: idx === currentIndex ? `${progress}%` : (idx < currentIndex ? '100%' : '0%') }}
                                transition={{ duration: 0, ease: "linear" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-6 left-4 right-16 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white/20">
                            <AvatarImage src={user?.profile_photo || undefined} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <span className="text-white font-semibold drop-shadow-md text-sm">{user?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Delete Button (Owner Only) */}
                        {currentUser?.id === story.user_id && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-red-500/20 hover:text-red-500 w-10 h-10 rounded-full transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center bg-black/20">
                    {story.media_type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={story.media_url}
                            className="w-full h-full object-contain"
                            autoPlay
                            playsInline
                            onEnded={handleVideoEnd}
                            onTimeUpdate={handleVideoTimeUpdate}
                        // Removed muted attribute to allow sound
                        />
                    ) : (
                        <img
                            src={story.media_url}
                            alt="Story"
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* Caption */}
                {story.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-6 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
                        <p className="text-white text-center font-medium drop-shadow-md leading-relaxed">{story.caption}</p>
                    </div>
                )}

                {/* Viewers Footer (Owner Only) */}
                {currentUser?.id === story.user_id && (
                    <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 gap-2 pl-2 pr-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsViewersOpen(true);
                            }}
                        >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-medium">{viewCount} View{viewCount !== 1 ? 's' : ''}</span>
                        </Button>
                    </div>
                )}

                {/* Viewers List Modal */}
                <AnimatePresence>
                    {isViewersOpen && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-xl z-40 max-h-[60%] flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()} // Prevent clicking through to story nav
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="text-white font-semibold text-sm">Story Viewers</h3>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => setIsViewersOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="overflow-y-auto p-2 flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                {viewers.length === 0 ? (
                                    <div className="text-white/40 text-center py-8 text-sm">No views yet</div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {viewers.map((v) => (
                                            <div key={v.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <Avatar className="w-8 h-8 border border-white/10">
                                                    <AvatarImage src={v.viewer.profile_photo || undefined} />
                                                    <AvatarFallback className="bg-white/10 text-white text-xs">{v.viewer.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-white text-sm font-medium">{v.viewer.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>,
        document.body
    );
};

export default StoryViewer;
