import { motion } from 'framer-motion';
import PostCard from '@/components/feed/PostCard';
import { useOtherCollegePosts } from '@/hooks/usePosts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Building2, Loader2, BookOpen, Calendar, MapPin, Laptop } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { states } from '@/data/constants';

const OtherCollegesFeed = () => {
  const { data: currentUser } = useCurrentUser();
  const { data: posts, isLoading, error } = useOtherCollegePosts(currentUser?.college || undefined);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);

  // Scroll Listener for Video Autoplay
  useEffect(() => {
    const handleScroll = () => {
      const videoPosts = document.querySelectorAll('[data-video-post-id]');
      let centerPostId: string | null = null;
      let minDistance = Infinity;
      const windowHeight = window.innerHeight;

      videoPosts.forEach((post) => {
        const rect = post.getBoundingClientRect();
        const postCenter = rect.top + rect.height / 2;
        const windowCenter = windowHeight / 2;
        const distance = Math.abs(windowCenter - postCenter);

        // Check if post is mostly visible
        const isVisible = rect.top < windowHeight - 100 && rect.bottom > 100;

        if (isVisible && distance < minDistance) {
          minDistance = distance;
          centerPostId = post.getAttribute('data-video-post-id');
        }
      });

      if (centerPostId !== playingPostId) {
        setPlayingPostId(centerPostId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [playingPostId]);

  const categories = [
    { id: 'All', label: 'All Posts', icon: <Building2 className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'event', label: 'Event', icon: <Calendar className="w-4 h-4" /> },
    { id: 'campus-life', label: 'Campus Life', icon: <MapPin className="w-4 h-4" /> },
    { id: 'project', label: 'Project', icon: <Laptop className="w-4 h-4" /> },
  ];

  const filteredPosts = posts?.filter(post => {
    // State Filter
    if (selectedState !== 'All') {
      if (post.user?.state !== selectedState) return false;
    }

    if (selectedCategory === 'All') return true;
    return post.post_type === selectedCategory;
  }) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Other Colleges</h1>
              <p className="text-sm text-muted-foreground">Explore posts from other campuses</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-transparent rounded-2xl p-4 border border-warning/20">
            <h3 className="font-semibold text-warning mb-1">🏫 Cross-Campus Connect</h3>
            <p className="text-sm text-muted-foreground">
              Discover what's happening at other colleges. Connect, collaborate, and learn from students across different institutions.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* State Filter */}
            <div className="w-full sm:w-[200px]">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 flex-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    selectedCategory === category.id
                      ? "bg-warning text-warning-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {category.icon}
                  {category.label}
                </button>
              ))}
            </div>
          </div>

        </motion.div>

        {/* Posts */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-destructive">Error loading posts</p>
            </motion.div>
          ) : posts && posts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
                  {/* College Badge */}
                  <div className="px-4 pt-4">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-warning/10 text-warning font-medium">
                      📍 {post.user?.college || 'Unknown College'} • {post.user?.campus || 'Unknown Campus'}
                    </span>
                  </div>
                  <PostCard post={post} isPlaying={post.id === playingPostId} />
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts from other colleges yet</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherCollegesFeed;
