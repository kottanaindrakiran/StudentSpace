import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Video, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CreateStoryProps {
    onClose: () => void;
}

const CreateStory = ({ onClose }: CreateStoryProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handlePost = async () => {
        if (!file || !currentUser) return;

        setIsPosting(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;
            const fileType = file.type.startsWith('video/') ? 'video' : 'image';

            // 1. Upload Media
            const { error: uploadError } = await supabase.storage
                .from('story-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('story-media')
                .getPublicUrl(filePath);

            // 2. Create Story Record
            // Type assertion to bypass missing table definition in generated types
            const { error: dbError } = await (supabase
                .from('stories' as any)
                .insert({
                    user_id: currentUser.id,
                    media_url: publicUrl,
                    media_type: fileType,
                    caption: caption.trim() || null,
                }) as any);

            if (dbError) throw dbError;

            toast({ title: "Story Added!", description: "Your story is now visible for 24 hours." });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            onClose();

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: "Failed to post story.", variant: "destructive" });
        } finally {
            setIsPosting(false);
        }
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={onClose}>
                <X className="w-6 h-6" />
            </Button>

            <div className="w-full max-w-md bg-transparent flex flex-col items-center gap-6">
                {!previewUrl ? (
                    <div className="flex flex-col gap-4 w-full">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[9/16] bg-muted/20 border-2 border-dashed border-muted-foreground/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                        >
                            <div className="p-4 rounded-full bg-muted/20 mb-4">
                                <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-white font-medium">Click to select photo or video</p>
                            <p className="text-white/60 text-sm mt-1">Supports JPG, PNG, MP4</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                ) : (
                    <div className="w-full relative flex flex-col gap-4">
                        <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl">
                            {file?.type.startsWith('video/') ? (
                                <video src={previewUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                            ) : (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            )}

                            <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-4 left-4"
                                onClick={() => { setFile(null); setPreviewUrl(null); }}
                            >
                                Change
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                className="bg-muted/20 border-none text-white placeholder:text-white/50 resize-none min-h-[50px] rounded-xl"
                            />
                            <Button
                                variant="gradient"
                                size="icon"
                                className="h-full aspect-square rounded-xl"
                                onClick={handlePost}
                                disabled={isPosting}
                            >
                                {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>,
        document.body
    );
};

export default CreateStory;
