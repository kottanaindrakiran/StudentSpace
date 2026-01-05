import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderArchive, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DbUser } from '@/types/database';

interface CreateProjectProps {
    onClose?: () => void;
}

const CreateProject = ({ onClose }: CreateProjectProps) => {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [user, setUser] = useState<DbUser | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
                setUser(data);
            }
        };
        fetchUser();
    }, []);

    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.rar,.7z';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setSelectedFile(file);
            }
        };
        input.click();
    };

    const handlePost = async () => {
        if (!title.trim() || !description.trim() || !selectedFile) {
            toast({
                title: "Missing Information",
                description: "Please provide a title, description, and upload a project file.",
                variant: "destructive",
            });
            return;
        }

        if (!user) {
            toast({ title: "Unauthorized", description: "You must be logged in to upload projects.", variant: "destructive" });
            return;
        }

        if (user.verification_status !== 'verified') {
            toast({ title: "Access Denied", description: "Only verified users can upload projects.", variant: "destructive" });
            return;
        }

        setIsPosting(true);
        try {
            let fileUrl = null;

            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('project-files') // Bucket must exist
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // Project files shouldn't ideally be publicURL if we want access control, but for now complying with download requirement and assuming public bucket or signed url.
            // Using public URL for simplicity as per requirements "Others can download".
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(filePath);

            fileUrl = publicUrl;

            const { error } = await supabase.from('projects').insert({
                user_id: user.id,
                project_title: title,
                description: description,
                zip_file_url: fileUrl,
                branch: user.branch,
            });

            if (error) throw error;

            toast({
                title: "Project Uploaded! 🎉",
                description: "Your project is now available for others to see.",
            });

            onClose?.();

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to upload project.",
                variant: "destructive",
            });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl shadow-soft p-6 w-full max-w-lg mx-auto relative"
        >
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                <X className="w-4 h-4" />
            </Button>

            <h2 className="text-xl font-bold mb-4">Upload Project</h2>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Project Title</label>
                    <Input
                        placeholder="Enter project title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea
                        placeholder="Describe your project..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                {selectedFile ? (
                    <div className="p-3 bg-muted rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FolderArchive className="w-4 h-4 text-primary" />
                            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setSelectedFile(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" className="w-full" onClick={handleFileSelect}>
                        <FolderArchive className="w-4 h-4 mr-2" />
                        Select ZIP File
                    </Button>
                )}

                <Button
                    variant="gradient"
                    className="w-full"
                    onClick={handlePost}
                    disabled={!title || !description || !selectedFile || isPosting}
                >
                    <Send className="w-4 h-4 mr-2" />
                    {isPosting ? 'Uploading...' : 'Upload Project'}
                </Button>
            </div>
        </motion.div>
    );
};

export default CreateProject;
