import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat, sendMessage, deleteMessage } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DbUser } from '@/types/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SharedPostCard } from '@/components/chat/SharedPostCard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SharedPostPreview = ({ postId }: { postId: string }) => {
    const { data: post, isLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            const { data } = await supabase.from('posts').select('*, user:users(*)').eq('id', postId).single();
            return data;
        }
    });

    if (isLoading) return <div className="h-20 bg-muted animate-pulse rounded-md" />;
    if (!post) return <div className="text-xs text-muted-foreground p-2 border rounded">Post unavailable</div>;

    return (
        <Link to={`/feed/post/${postId}`} className="block mt-2 border rounded-lg overflow-hidden bg-card hover:bg-muted/50 transition-colors">
            {post.media_url && (
                <div className="h-32 w-full bg-black/5 relative">
                    {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video src={post.media_url} className="h-full w-full object-cover" />
                    ) : (
                        <img src={post.media_url} alt="Content" className="h-full w-full object-cover" />
                    )}
                </div>
            )}
            <div className="p-2">
                <div className="flex items-center gap-2 mb-1">
                    <img src={post.user?.profile_photo || ''} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-semibold">{post.user?.name}</span>
                </div>
                <p className="text-xs line-clamp-2">{post.caption}</p>
            </div>
        </Link>
    );
};

const SharedProjectPreview = ({ projectId }: { projectId: string }) => {
    const { data: project, isLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const { data } = await supabase.from('projects').select('*, user:users(*)').eq('id', projectId).single();
            return data;
        }
    });

    if (isLoading) return <div className="h-20 bg-muted animate-pulse rounded-md" />;
    if (!project) return <div className="text-xs text-muted-foreground p-2 border rounded">Project unavailable</div>;

    return (
        <Link to={`/feed/projects`} className="block mt-2 border rounded-lg overflow-hidden bg-card hover:bg-muted/50 transition-colors">
            {project.zip_file_url && (
                <div className="h-32 w-full bg-muted relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                    {/* Placeholder icon since zip files don't have thumbnails easily */}
                    <div className="flex flex-col items-center text-muted-foreground">
                        <FolderIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Project</span>
                    </div>
                </div>
            )}
            <div className="p-2">
                <div className="flex items-center gap-2 mb-1">
                    <img src={project.user?.profile_photo || ''} className="w-5 h-5 rounded-full" />
                    <span className="text-xs font-semibold">{project.user?.name}</span>
                </div>
                <h4 className="text-sm font-bold truncate">{project.project_title}</h4>
                <p className="text-xs line-clamp-1 text-muted-foreground">{project.description}</p>
            </div>
        </Link>
    );
};

const SharedUserPreview = ({ userId }: { userId: string }) => {
    const { data: user, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: async () => {
            const { data } = await supabase.from('users').select('*').eq('id', userId).single();
            return data;
        }
    });

    if (isLoading) return <div className="h-16 bg-muted animate-pulse rounded-md" />;
    if (!user) return <div className="text-xs text-muted-foreground p-2 border rounded">User unavailable</div>;

    return (
        <Link to={`/feed/profile/${userId}`} className="block mt-2 border rounded-lg overflow-hidden bg-card hover:bg-muted/50 transition-colors p-3 flex items-center gap-3">
            <img src={user.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                className="w-10 h-10 rounded-full object-cover" />
            <div>
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{user.college}</p>
            </div>
        </Link>
    );
};

import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import Webcam from 'react-webcam';
import {
    Send, Image as ImageIcon, Video, Mic, Smile, MoreVertical,
    Phone, Video as VideoIcon, ArrowLeft, Loader2, Download, Camera, Sticker, FolderKanban as FolderIcon, Search,
    Paperclip, X, FileText, Trash2, RefreshCcw
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { STICKERS } from '@/data/stickers';

const Chat = () => {
    // ... (Existing hooks and state) ...
    const { userId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const webcamRef = useRef<Webcam>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stickerSearch, setStickerSearch] = useState('');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const { data: currentUser } = useCurrentUser();
    const { data: messages, isLoading } = useChat(userId);
    const [partner, setPartner] = useState<DbUser | null>(null);

    // Derived state for filtered stickers
    const filteredStickers = STICKERS.filter(s =>
        s.tags.some(tag => tag.toLowerCase().includes(stickerSearch.toLowerCase()))
    );

    // ... (Existing useEffects) ...
    // Fetch partner details
    useEffect(() => {
        const fetchPartner = async () => {
            if (userId) {
                const { data } = await supabase.from('users').select('*').eq('id', userId).single();
                setPartner(data);
            }
        };
        fetchPartner();
    }, [userId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ... (Existing handlers) ...
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const dataURLtoFile = (dataurl: string, filename: string) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const capturePhoto = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const file = dataURLtoFile(imageSrc, `camera_${Date.now()}.jpg`);
            setAttachment(file);
            setIsCameraOpen(false);
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleSendSticker = async (url: string) => {
        if (!userId) return;
        try {
            await sendMessage(userId, '', url, 'sticker'); // 'sticker' type
            queryClient.invalidateQueries({ queryKey: ['chat', userId] });
        } catch (error) {
            console.error('Failed to send sticker:', error);
        }
    };

    const handleSend = async () => {
        if ((!newMessage.trim() && !attachment) || !userId) return;

        try {
            let attachmentUrl = undefined;
            let attachmentType: 'image' | 'video' | 'document' | 'zip' | 'sticker' | undefined = undefined;

            if (attachment) {
                setIsUploading(true);
                const fileExt = attachment.name.split('.').pop();
                const filePath = `${currentUser?.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, attachment);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;

                if (attachment.type.startsWith('image/')) attachmentType = 'image';
                else if (attachment.type.startsWith('video/')) attachmentType = 'video';
                else if (attachment.name.endsWith('.zip') || attachment.type.includes('zip')) attachmentType = 'zip';
                else attachmentType = 'document';
            }

            await sendMessage(userId, newMessage, attachmentUrl, attachmentType);

            // Invalidate to show new message immediately
            queryClient.invalidateQueries({ queryKey: ['chat', userId] });

            setNewMessage('');
            setAttachment(null);
            setIsUploading(false);
        } catch (error) {
            console.error('Failed to send message:', error);
            setIsUploading(false);
        }
    };

    // ... (Delete handler) ...
    const handleDelete = async () => {
        if (!messageToDelete) return;
        try {
            await deleteMessage(messageToDelete);
            queryClient.invalidateQueries({ queryKey: ['chat', userId] });
            setMessageToDelete(null);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const lastWord = newMessage.split(' ').pop()?.toLowerCase();
    const suggestedStickers = (lastWord && lastWord.length > 2)
        ? STICKERS.filter(s => s.tags.some(tag => tag === lastWord))
        : [];

    return (
        <div className="flex flex-col h-[100dvh] bg-background">
            {/* Header */}
            {/* ... (Header remains same) ... */}
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border p-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/feed/messages')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    {partner ? (
                        <div className="flex items-center gap-3">
                            <img
                                src={partner.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                                alt={partner.name || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <h1 className="font-bold">{partner.name}</h1>
                                <span className="text-xs text-muted-foreground block">
                                    {partner.branch} • {partner.campus}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
                    )}
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : messages && messages.length > 0 ? (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div
                                    className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted text-foreground rounded-tl-none'
                                        }`}
                                >
                                    {/* Attachment rendering */}
                                    {msg.attachment_url && (
                                        <div className="mb-2 space-y-2">
                                            {(msg.attachment_type === 'image' || msg.attachment_type === 'sticker') && (
                                                <div className="relative group/image">
                                                    <img
                                                        src={msg.attachment_url}
                                                        alt="Attachment"
                                                        className={`rounded-lg max-h-60 object-cover ${msg.attachment_type === 'sticker' ? 'bg-transparent max-h-32' : 'bg-black/5'}`}
                                                    />
                                                </div>
                                            )}
                                            {msg.attachment_type === 'video' && (
                                                <video src={msg.attachment_url} controls className="rounded-lg max-h-60 bg-black/10" />
                                            )}
                                            {/* Download Link (Skip for stickers) */}
                                            {msg.attachment_type !== 'sticker' && (
                                                <a
                                                    href={msg.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-xs ${isMe ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'}`}
                                                >
                                                    {msg.attachment_type === 'image' || msg.attachment_type === 'video' ? (
                                                        <ArrowLeft className="w-4 h-4 rotate-[-90deg]" />
                                                    ) : (
                                                        <Download className="w-4 h-4" />
                                                    )}
                                                    Download Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Shared Post Card */}
                                    {(msg as any).shared_post && (
                                        <div className="mb-2 w-64">
                                            <SharedPostCard post={(msg as any).shared_post} />
                                        </div>
                                    )}

                                    {/* Shared Content */}
                                    {/* msg.shared_post_id is now handled by msg.shared_post */}
                                    {msg.shared_project_id && <SharedProjectPreview projectId={msg.shared_project_id} />}
                                    {msg.shared_user_id && <SharedUserPreview userId={msg.shared_user_id} />}

                                    {msg.message && <p className="text-sm">{msg.message}</p>}

                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        <p className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                                        </p>
                                        {isMe && (
                                            <button
                                                onClick={() => setMessageToDelete(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-100"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No messages yet. Say hello!</p>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                {attachment && (
                    <div className="mb-2 flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-xs truncate flex-1">{attachment.name}</span>
                        <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2 items-end"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    // accept="image/*,video/*,application/pdf,application/zip" 
                    />

                    {/* Camera */}
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground">
                                <Camera className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="flex flex-col items-center gap-4 relative">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="rounded-lg w-full"
                                    videoConstraints={{ facingMode }}
                                />
                                <div className="flex gap-2 w-full">
                                    <Button onClick={toggleCamera} variant="outline" className="flex-1">
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Flip
                                    </Button>
                                    <Button onClick={capturePhoto} className="flex-1">Capture</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Stickers */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground">
                                <Sticker className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3">
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                        placeholder="Search stickers..."
                                        className="h-8 pl-7 text-xs"
                                        value={stickerSearch}
                                        onChange={(e) => setStickerSearch(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                    {filteredStickers.map((sticker, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendSticker(sticker.url)}
                                            className="hover:bg-muted p-1 rounded transition-colors aspect-square flex items-center justify-center overflow-hidden bg-muted/20"
                                        >
                                            <img src={sticker.url} alt="Sticker" className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                    {filteredStickers.length === 0 && (
                                        <div className="col-span-3 text-center text-xs text-muted-foreground py-4">
                                            No stickers found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* File Upload */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="w-5 h-5 text-muted-foreground" />
                    </Button>

                    <div className="relative flex-1">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="pr-10 text-base md:text-sm"
                            disabled={isUploading}
                            inputMode="text"
                            enterKeyHint="send"
                        />
                        {/* Emoji Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button type="submit" variant="gradient" size="icon" disabled={(!newMessage.trim() && !attachment) || isUploading}>
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>

            <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this message? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Chat;
