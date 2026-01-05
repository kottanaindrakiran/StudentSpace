import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Grid3X3, Video, FolderKanban,
  UserPlus, Edit2, MoreHorizontal, Trash2, Loader2, LogOut, Bookmark, Github, Linkedin, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser, useFollowCounts } from '@/hooks/useCurrentUser';
import { useUserPosts } from '@/hooks/usePosts';
import { useUserProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import { FollowListModal } from '@/components/profile/FollowListModal';
import { SharePostModal } from '@/components/feed/SharePostModal';
import { ProfileGridItem } from '@/components/profile/ProfileGridItem';

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const openFollowList = (type: "followers" | "following") => {
    setFollowListType(type);
    setIsFollowListOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/login');
  };

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: followCounts } = useFollowCounts(currentUser?.id);
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(currentUser?.id);
  const { data: userProjects, isLoading: projectsLoading } = useUserProjects(currentUser?.id);

  // Fetch Saved Posts
  const { data: savedPosts, isLoading: savedLoading } = useQuery({
    queryKey: ['saved-posts', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id, posts(*, user:users(*))') // Fetch the post details through the bookmark
        .eq('user_id', currentUser.id);

      if (error) throw error;
      // Flatten the response to get just the posts
      return data.map(item => item.posts).filter(post => post !== null) as any[];
    },
    enabled: !!currentUser?.id
  });


  const handleEditProfile = () => {
    setIsEditOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "Your post has been removed.",
      });

      // Refresh posts
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: "Your project has been removed.",
      });

      // Refresh projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['userProjects'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleDownloadProject = (url: string | null, title: string) => {
    if (!url) {
      toast({ title: "Error", description: "No file available", variant: "destructive" });
      return;
    }
    window.open(url, '_blank');
    toast({ title: "Downloading", description: `Downloading ${title}...` });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
          <Button variant="gradient" onClick={() => window.location.href = '/login'}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const isAlumni = currentUser.batch_end && currentUser.batch_end < currentYear;
  const batchString = currentUser.batch_start && currentUser.batch_end
    ? `${currentUser.batch_start}-${currentUser.batch_end}`
    : '';

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">{currentUser.name || 'My Profile'}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditProfile}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center gap-6 mb-8"
        >
          {/* Avatar */}
          {/* Avatar */}
          <div className="relative">
            {currentUser.profile_photo ? (
              <img
                src={currentUser.profile_photo}
                alt={currentUser.name || 'Profile'}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center ring-4 ring-primary/20">
                <UserPlus className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            {isAlumni && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium whitespace-nowrap">
                Alumni
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold mb-1">{currentUser.name || 'Anonymous'}</h2>
            <p className="text-muted-foreground mb-2">
              {currentUser.branch || 'Unknown Branch'} • {batchString}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              📍 {currentUser.campus || 'Unknown Campus'}, {currentUser.college || 'Unknown College'}
            </p>

            {/* Bio */}
            {currentUser.bio && (
              <p className="text-sm mb-4 max-w-md mx-auto sm:mx-0 whitespace-pre-wrap">{currentUser.bio}</p>
            )}

            {/* Social Links */}
            {(currentUser.github_link || currentUser.linkedin_link) && (
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                {currentUser.github_link && (
                  <a href={currentUser.github_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {currentUser.linkedin_link && (
                  <a href={currentUser.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-center sm:justify-start gap-6 mb-4">
              <div className="text-center">
                <div className="font-bold">{userPosts?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openFollowList('followers')}>
                <div className="font-bold">{followCounts?.followers || 0}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openFollowList('following')}>
                <div className="font-bold">{followCounts?.following || 0}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-center sm:justify-start">
              <Button variant="gradient" size="sm" onClick={handleEditProfile}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </motion.div>

        <SharePostModal
          user={currentUser}
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
        />

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-muted rounded-xl p-1">
            <TabsTrigger value="posts" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="videos" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft">
              <Video className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft">
              <FolderKanban className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft">
              <Bookmark className="w-4 h-4 mr-2" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : userPosts && userPosts.length > 0 ? (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {userPosts.map((post, idx) => (
                  <ProfileGridItem
                    key={post.id}
                    post={post}
                    isOwner={true}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid3X3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : userPosts?.filter(p => p.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) || (p.media_urls && p.media_urls[0].match(/\.(mp4|webm|ogg|mov)$/i))).length || 0 > 0 ? (
              <div className="columns-3 gap-4 space-y-4">
                {userPosts?.filter(p => p.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) || (p.media_urls && p.media_urls[0].match(/\.(mp4|webm|ogg|mov)$/i))).map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group cursor-pointer break-inside-avoid mb-4"
                  >
                    <div className="relative w-full rounded-lg overflow-hidden bg-black/5">
                      <video
                        src={post.media_urls?.[0] || post.media_url}
                        className="w-full h-auto object-contain"
                        controls
                      />
                    </div>
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 pointer-events-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive pointer-events-auto"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No videos yet</p>
                <p className="text-sm text-muted-foreground mt-1">Share your first video!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {projectsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : userProjects && userProjects.length > 0 ? (
              <div className="space-y-4">
                {userProjects.map((project, idx) => {
                  const formattedTime = project.created_at
                    ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
                    : '';

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-card rounded-2xl shadow-soft p-4 flex flex-col sm:flex-row gap-4 group relative"
                    >
                      <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <FolderKanban className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold mb-1 truncate pr-8">{project.project_title || 'Untitled'}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadProject(project.zip_file_url, project.project_title || 'Project')}>
                                <FolderKanban className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description || 'No description'}</p>

                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm" className="h-8" onClick={() => handleDownloadProject(project.zip_file_url, project.project_title || 'Project')}>
                            <FolderKanban className="w-3.5 h-3.5 mr-2" />
                            Download
                          </Button>
                          {formattedTime && (
                            <p className="text-xs text-muted-foreground ml-auto">{formattedTime}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
              </div>
            )}
          </TabsContent>

          {/* SAVED CONTENT TAB */}
          <TabsContent value="saved" className="mt-4">
            {savedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : savedPosts && savedPosts.length > 0 ? (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {savedPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative group cursor-pointer break-inside-avoid mb-4"
                    onClick={() => navigate('/feed')} // Should probably open post details or just go to feed
                  >
                    <div className="relative w-full rounded-lg overflow-hidden bg-black/5">
                      {post.media_urls?.[0]?.match(/\.(mp4|webm|ogg|mov)$/i) || post.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          src={post.media_urls?.[0] || post.media_url}
                          className="w-full h-auto object-contain"
                          controls
                        />
                      ) : (
                        <img
                          src={post.media_urls?.[0] || post.media_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&h=300&fit=crop'}
                          alt="Saved Content"
                          className="w-full h-auto object-contain"
                        />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                      <div className="flex items-center gap-2">
                        <img src={post.user?.profile_photo} className="w-5 h-5 rounded-full" />
                        <span className="text-xs truncate">{post.user?.name}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No saved posts yet</p>
                <p className="text-sm text-muted-foreground mt-1">Bookmark posts to see them here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditProfileDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentUser={currentUser}
      />

      {currentUser && (
        <FollowListModal
          userId={currentUser.id}
          type={followListType}
          isOpen={isFollowListOpen}
          onOpenChange={setIsFollowListOpen}
        />
      )}
    </div>
  );
};

export default Profile;
