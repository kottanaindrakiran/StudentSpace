import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, User, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PostWithUser } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useLikePost, useCommentsCount } from '@/hooks/useInteractions';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { SharePostModal } from '@/components/feed/SharePostModal';


interface PostCardProps {
  post: PostWithUser;
  isPlaying?: boolean;
}

import { Link } from 'react-router-dom';

const PostCard = ({ post, isPlaying = false }: PostCardProps) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { likes, isLiked, toggleLike } = useLikePost(post.id);
  const { data: commentsCount } = useCommentsCount(post.id);

  // Handle auto-play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        // Use a promise to handle play() to avoid "The play() request was interrupted" errors
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Autoplay prevented:", error);
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleLike = () => {
    toggleLike();
  };

  const categoryColors: Record<string, string> = {
    academic: 'bg-blue-500/10 text-blue-600',
    event: 'bg-orange-500/10 text-orange-600',
    'campus-life': 'bg-green-500/10 text-green-600',
    project: 'bg-purple-500/10 text-purple-600',
    alumni: 'bg-amber-500/10 text-amber-600',
  };

  const categoryLabels: Record<string, string> = {
    academic: '📚 Academic',
    event: '🎉 Event',
    'campus-life': '🏫 Campus Life',
    project: '💻 Project',
    alumni: '🎓 Alumni',
  };

  const currentYear = new Date().getFullYear();
  const isAlumni = post.user?.batch_end && post.user.batch_end < currentYear;
  const batchString = post.user?.batch_start && post.user?.batch_end
    ? `${post.user.batch_start}-${post.user.batch_end}`
    : '';

  const formattedTime = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-soft overflow-hidden"
      data-video-post-id={post.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? post.id : undefined}
    >


      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/feed/profile/${post.user?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {post.user?.profile_photo ? (
            <img
              src={post.user.profile_photo}
              alt={post.user.name || 'User'}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{post.user?.name || 'Anonymous'}</span>
              {isAlumni && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                  Alumni
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.user?.branch || 'Unknown'} • {batchString}
            </p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Category Tag */}
      {post.post_type && (
        <div className="px-4 pb-2">
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            categoryColors[post.post_type] || 'bg-muted text-muted-foreground'
          )}>
            {categoryLabels[post.post_type] || post.post_type}
          </span>
        </div>
      )}

      {/* Content */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed">{post.caption}</p>
        </div>
      )}

      {/* Image/Video Carousel */}
      {post.media_urls && post.media_urls.length > 0 ? (
        <div className="relative flex justify-center bg-black overflow-hidden group">
          {post.media_urls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.nextElementSibling;
                  if (container) container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <User className="w-5 h-5 rotate-180" /> {/* Using generic icon as arrow replacement if ChevronLeft not imported */}
              </button>
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full">
                {post.media_urls.map((url, i) => (
                  <div key={i} className="flex-shrink-0 w-full snap-center flex justify-center items-center bg-black">
                    {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video
                        src={url}
                        className="w-full max-h-[600px] h-auto object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Slide ${i + 1}`}
                        className="w-full h-auto max-h-[600px] object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const container = e.currentTarget.previousElementSibling;
                  if (container) container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <User className="w-5 h-5" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {post.media_urls.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 backdrop-blur-sm" />
                ))}
              </div>
            </>
          )}

          {/* Single Media Item logic inside the same block if needed, or fallback */}
          {post.media_urls.length === 1 && (
            post.media_urls[0].match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video
                ref={videoRef}
                src={post.media_urls[0]}
                className="w-full max-h-[600px] h-auto object-contain"
                controls
                loop
                muted={false}
                playsInline
              />
            ) : post.media_urls[0].match(/\.(zip|rar|pdf)$/i) || post.post_type === 'project' ? (
              <div className="w-full p-8 bg-muted/30 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-foreground">Project File</h4>
                  <p className="text-sm text-muted-foreground mb-3">{post.media_urls[0].split('/').pop()}</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(post.media_urls![0], '_blank')}>
                    Download File
                  </Button>
                </div>
              </div>
            ) : (
              <img
                src={post.media_urls[0]}
                alt="Post content"
                className="w-full h-auto max-h-[600px] object-contain"
              />
            )
          )}
        </div>
      ) : post.media_url ? (
        // Fallback for old posts
        <div className="relative flex justify-center bg-black/5 overflow-hidden">
          {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
            <video
              ref={videoRef}
              src={post.media_url}
              className="w-full max-h-[600px] h-auto object-contain"
              controls
              loop
              muted={false}
              playsInline
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post content"
              className="w-full h-auto max-h-[600px] object-contain"
            />
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between border-t border-border/50">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 rounded-full",
              isLiked && "text-destructive"
            )}
            onClick={handleLike}
          >
            <motion.div
              initial={false}
              animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </motion.div>
            <span className="text-xs font-medium">{likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setIsCommentsOpen(true)}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">{commentsCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="w-5 h-5" />
          </Button>

        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current text-primary")} />
        </Button>
      </div>

      {/* Timestamp */}
      {formattedTime && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">{formattedTime}</p>
        </div>
      )}
      <CommentsSheet
        entityId={post.id}
        type="post"
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
      />
      <SharePostModal
        post={post}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
      />
    </motion.div>
  );
};

export default PostCard;
