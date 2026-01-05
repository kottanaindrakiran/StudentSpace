import { motion } from 'framer-motion';
import PostCard from '@/components/feed/PostCard';
import { useAlumniPosts } from '@/hooks/usePosts';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { GraduationCap, Loader2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

const OldStudentsFeed = () => {
  const navigate = useNavigate();
  const { data: alumniPosts, isLoading, error } = useAlumniPosts();
  const [activeTab, setActiveTab] = useState('all');

  const { data: currentUser } = useCurrentUser();
  const [filterCollege, setFilterCollege] = useState<'all' | 'my-college'>('my-college');

  const getFilteredPosts = (tab: string) => {
    if (!alumniPosts) return [];

    let posts = alumniPosts;

    // Filter by College
    if (filterCollege === 'my-college' && currentUser?.college) {
      posts = posts.filter(post => post.user?.college === currentUser.college);
    }

    // Filter by Tab
    if (tab === 'all') return posts;

    // For specific categories
    if (['college-days', 'career-updates', 'mentorship'].includes(tab)) {
      return posts.filter(post => post.post_type === tab);
    }

    // For 'projects' tab, filter posts that are of type 'project'
    if (tab === 'project') {
      return posts.filter(post => post.post_type === 'project');
    }

    return posts;
  };

  const filteredPosts = getFilteredPosts(activeTab);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Alumni Feed</h1>
              <p className="text-sm text-muted-foreground">Connect with seniors & alumni</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* College Filter Toggle */}
        <div className="flex justify-end relative z-50">
          <div className="bg-card/50 p-1 rounded-lg border border-border inline-flex">
            <button
              onClick={() => setFilterCollege('my-college')}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${filterCollege === 'my-college' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My College
            </button>
            <button
              onClick={() => setFilterCollege('all')}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${filterCollege === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All Colleges
            </button>
          </div>
        </div>

        {/* Alumni Network Banner - Now more prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-2xl p-6 border border-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded-full border border-indigo-500/20 font-medium">Alumni Network</span>
            </div>
            <h3 className="font-bold text-xl mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Connect & Grow</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Get career guidance, mentorship, and valuable insights from seniors who walked the same path.
            </p>
            <button
              onClick={() => navigate('/feed/people?tab=alumni')}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Find Mentors
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-2 bg-transparent p-0 mb-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-full border border-border bg-card/50">All</TabsTrigger>
            <TabsTrigger value="college-days" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 rounded-full border border-border bg-card/50">📸 College Days</TabsTrigger>
            <TabsTrigger value="career-updates" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-full border border-border bg-card/50">🚀 Career Updates</TabsTrigger>
            <TabsTrigger value="mentorship" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 rounded-full border border-border bg-card/50">🤝 Mentorship</TabsTrigger>
            <TabsTrigger value="project" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-full border border-border bg-card/50">💻 Projects</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">Error loading posts</div>
              ) : filteredPosts && filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/25">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'college-days' && <span className="text-2xl">📸</span>}
                    {activeTab === 'career-updates' && <span className="text-2xl">🚀</span>}
                    {activeTab === 'mentorship' && <span className="text-2xl">🤝</span>}
                    {activeTab === 'project' && <span className="text-2xl">💻</span>}
                    {activeTab === 'all' && <GraduationCap className="w-8 h-8 text-muted-foreground" />}
                  </div>
                  <h3 className="font-semibold text-foreground">No posts found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'all'
                      ? "No alumni posts yet. Be the first to share!"
                      : `No ${activeTab.replace('-', ' ')} posts yet.`}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OldStudentsFeed;
