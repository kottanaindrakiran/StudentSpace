
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Download, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLike, useCommentsCount } from '@/hooks/useInteractions';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { SharePostModal } from '@/components/feed/SharePostModal';

interface ProjectCardProps {
    project: any; // Type should be imported from types but using any for speed/compatibility with ProjectsFeed
    index?: number;
}

export const ProjectCard = ({ project, index = 0 }: ProjectCardProps) => {
    const { toast } = useToast();
    const { data: currentUser } = useCurrentUser();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const [isShareOpen, setIsShareOpen] = useState(false);

    const { likes, isLiked, toggleLike } = useLike(project.id, 'project');
    const { data: commentsCount } = useCommentsCount(project.id, 'project');

    const handleDownload = (url: string | null, title: string) => {
        if (!url) {
            toast({
                title: "Error",
                description: "No project file available.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Download Started",
            description: `Downloading ${title}...`,
        });

        window.open(url, '_blank');
    };

    const handleShare = () => {
        setIsShareOpen(true);
    };

    const batchString = project.user?.batch_start && project.user?.batch_end
        ? `${project.user.batch_start}-${project.user.batch_end}`
        : '';
    const formattedTime = project.created_at
        ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
        : '';

    // Check if project is from another college
    const isOtherCollege = project.user?.college && currentUser?.college && project.user.college !== currentUser.college;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
                <Card className="overflow-hidden">
                    {/* Thumbnail */}
                    {project.zip_file_url && (
                        <div className="relative aspect-video bg-muted flex items-center justify-center">
                            <FolderKanban className="w-12 h-12 text-muted-foreground" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-3 right-3 shadow-sm"
                                onClick={() => handleDownload(project.zip_file_url, project.project_title || 'Project')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                        {/* College Badge if Applicable */}
                        {isOtherCollege && (
                            <div className="mb-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                                    📍 {project.user?.college} {project.user?.campus ? `• ${project.user.campus}` : ''}
                                </span>
                            </div>
                        )}

                        <h3 className="font-bold text-lg mb-2">{project.project_title || 'Untitled Project'}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {project.description || 'No description provided'}
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                            <img
                                src={project.user?.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                                alt={project.user?.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                                <p className="text-sm font-medium">{project.user?.name || 'Anonymous'}</p>
                                <p className="text-xs text-muted-foreground">
                                    {project.user?.branch || 'Unknown'} • {batchString}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 border-t border-border pt-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("gap-2", isLiked && "text-destructive")}
                                    onClick={() => toggleLike()}
                                >
                                    <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                                    <span className="text-xs">{likes}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setIsCommentsOpen(true)}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-xs">{commentsCount || 0}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleDownload(project.zip_file_url, project.project_title || 'Project')}
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </Button>
                        </div>

                        {formattedTime && (
                            <p className="text-xs text-muted-foreground mt-3">{formattedTime}</p>
                        )}
                    </div>
                </Card>
            </motion.div>

            <CommentsSheet
                entityId={project.id}
                type="project"
                isOpen={isCommentsOpen}
                onOpenChange={setIsCommentsOpen}
            />
            <SharePostModal
                post={project}
                isOpen={isShareOpen}
                onOpenChange={setIsShareOpen}
            />
        </>
    );
};
