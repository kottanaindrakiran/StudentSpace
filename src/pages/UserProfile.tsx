import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Grid3X3, Video, FolderKanban,
    UserPlus, UserCheck, MessageCircle, ArrowLeft, Loader2, Github, Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser, useFollowCounts, useUserProfile } from '@/hooks/useCurrentUser';
import { useUserPosts } from '@/hooks/usePosts';
import { useUserProjects } from '@/hooks/useProjects';
import { useIsFollowing, useFollow, useIsMutualFollow } from '@/hooks/useFollow';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

import { FollowListModal } from '@/components/profile/FollowListModal';
import { SharePostModal } from '@/components/feed/SharePostModal';
import { ProfileGridItem } from '@/components/profile/ProfileGridItem';

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isFollowListOpen, setIsFollowListOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false); // Add state
    const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

    const openFollowList = (type: "followers" | "following") => {
        setFollowListType(type);
        setIsFollowListOpen(true);
    };

    const { data: currentUser } = useCurrentUser();
    const { data: user, isLoading: userLoading } = useUserProfile(userId);
    const { data: followCounts } = useFollowCounts(userId);
    const { data: userPosts, isLoading: postsLoading } = useUserPosts(userId);
    const { data: userProjects, isLoading: projectsLoading } = useUserProjects(userId);

    const { data: isFollowing } = useIsFollowing(userId);
    const { isMutual } = useIsMutualFollow(userId);
    const { follow, unfollow, isLoading: isActionLoading } = useFollow(userId!);

    const handleDownloadProject = (url: string | null, title: string) => {
        if (!url) {
            toast({ title: "Error", description: "No file available", variant: "destructive" });
            return;
        }
        window.open(url, '_blank');
        toast({ title: "Downloading", description: `Downloading ${title}...` });
    };

    const handleMessageClick = () => {
        if (isMutual) {
            navigate(`/feed/messages/${userId}`);
        } else {
            toast({
                title: "Cannot Message",
                description: "You can only message users who follow you back (Mutual Follow).",
                variant: 'destructive'
            });
        }
    };

    const isMe = currentUser?.id === userId;

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">User not found</p>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const currentYear = new Date().getFullYear();
    const isAlumni = user.batch_end && user.batch_end < currentYear;
    const batchString = user.batch_start && user.batch_end
        ? `${user.batch_start}-${user.batch_end}`
        : '';

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="container max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-bold">{user.name}</h1>
                    </div>
                </div>
            </header>

            <div className="container max-w-2xl mx-auto px-4 py-6">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-center gap-6 mb-8"
                >
                    {/* Avatar */}
                    <div className="relative">
                        {user.profile_photo ? (
                            <img
                                src={user.profile_photo}
                                alt={user.name || 'Profile'}
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
                        <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                        <p className="text-muted-foreground mb-2">
                            {user.branch || 'Unknown Branch'} • {batchString}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            📍 {user.campus || 'Unknown Campus'}, {user.college || 'Unknown College'}
                        </p>

                        {/* Bio */}
                        {user.bio && (
                            <p className="text-sm mb-4 max-w-md mx-auto sm:mx-0 whitespace-pre-wrap">{user.bio}</p>
                        )}

                        {/* Social Links */}
                        {(user.github_link || user.linkedin_link) && (
                            <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
                                {user.github_link && (
                                    <a href={user.github_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                        <Github className="w-5 h-5" />
                                    </a>
                                )}
                                {user.linkedin_link && (
                                    <a href={user.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
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
                        {!isMe && (
                            <div className="flex gap-2 justify-center sm:justify-start">
                                {/* Follow Button */}
                                <Button
                                    variant={isFollowing ? "outline" : "gradient"}
                                    size="sm"
                                    disabled={isActionLoading}
                                    onClick={() => isFollowing ? unfollow() : follow()}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Follow
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleMessageClick}
                                    className={!isMutual ? "opacity-50" : ""}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message
                                </Button>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" className="mt-2 w-full sm:w-auto" onClick={() => setIsShareOpen(true)}>
                            Share Profile
                        </Button>
                    </div>
                </motion.div>

                <SharePostModal
                    user={user}
                    isOpen={isShareOpen}
                    onOpenChange={setIsShareOpen}
                />

                {/* Tabs */}
                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-muted rounded-xl p-1">
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
                                        isOwner={false} // Other user's profile
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
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No videos yet</p>
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
                                {userProjects.map((project, idx) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-card rounded-2xl shadow-soft p-4 flex gap-4 group relative"
                                    >
                                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                            <FolderKanban className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold mb-1 truncate pr-8">{project.project_title || 'Untitled'}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description || 'No description'}</p>

                                            <div className="flex items-center gap-2 mt-3">
                                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleDownloadProject(project.zip_file_url, project.project_title || 'Project')}>
                                                    <FolderKanban className="w-3.5 h-3.5 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No projects yet</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {userId && (
                    <FollowListModal
                        userId={userId}
                        type={followListType}
                        isOpen={isFollowListOpen}
                        onOpenChange={setIsFollowListOpen}
                        college={user?.college}
                        campus={user?.campus}
                    />
                )}
            </div>
        </div>
    );
};


export default UserProfile;
