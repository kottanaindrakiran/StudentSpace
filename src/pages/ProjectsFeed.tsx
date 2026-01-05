import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Download, Heart, MessageCircle, Share2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import CreateProject from '@/components/feed/CreateProject';
import { ProjectCard } from '@/components/feed/ProjectCard';

import { useCurrentUser } from '@/hooks/useCurrentUser';

const ProjectsFeed = () => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: projects, isLoading, error } = useProjects();
  const { data: currentUser } = useCurrentUser();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Projects</h1>
                <p className="text-sm text-muted-foreground">Discover & share student projects</p>
              </div>
            </div>
            <Button variant="gradient" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </header>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <CreateProject onClose={() => setIsCreateOpen(false)} />
        </div>
      )}

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading projects</p>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to upload a project!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsFeed;
