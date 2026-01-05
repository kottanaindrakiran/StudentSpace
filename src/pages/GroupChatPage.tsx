import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    ArrowLeft, MoreVertical, Send, Paperclip,
    Smile, Loader2, Trash2, UserPlus, FileText, X, Camera, Sticker, Search, FolderKanban as FolderIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGroupChat, sendGroupMessage, deleteGroupMessage } from '@/hooks/useGroupChat';
import { useGroups } from '@/hooks/useGroups';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import Webcam from 'react-webcam';
import { UserSelector } from '@/components/chat/UserSelector';
import { STICKERS } from '@/data/stickers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

// --- Shared Content Preview Components ---

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
                    <Avatar className="w-5 h-5">
                        <AvatarImage src={post.user?.profile_photo} />
                        <AvatarFallback>{post.user?.name?.[0]}</AvatarFallback>
                    </Avatar>
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
                    <div className="flex flex-col items-center text-muted-foreground">
                        <FolderIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Project</span>
                    </div>
                </div>
            )}
            <div className="p-2">
                <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-5 h-5">
                        <AvatarImage src={project.user?.profile_photo} />
                        <AvatarFallback>{project.user?.name?.[0]}</AvatarFallback>
                    </Avatar>
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
            <Avatar className="w-10 h-10">
                <AvatarImage src={user.profile_photo} />
                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{user.college}</p>
            </div>
        </Link>
    );
};

// --- Main Component ---

const GroupChatPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    // State
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stickerSearch, setStickerSearch] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const webcamRef = useRef<Webcam>(null);

    // Hooks
    const { data: messages, isLoading: isLoadingMessages } = useGroupChat(groupId);
    const { addMember, removeMember, updateGroup } = useGroups();

    // Fetch Group Details
    const { data: group, isLoading: isLoadingGroup } = useQuery({
        queryKey: ['group', groupId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();
            if (error) throw error;
            return data as any;
        },
        enabled: !!groupId,
    });

    // Fetch Group Members
    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ['group-members', groupId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('group_members')
                .select('*, user:users(*)')
                .eq('group_id', groupId);
            if (error) throw error;
            return data;
        },
        enabled: !!groupId,
    });

    const isAdmin = group?.created_by === currentUser?.id;

    // Effects
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handlers
    const handleSend = async () => {
        if ((!newMessage.trim() && !attachment) || !groupId) return;

        try {
            setIsUploading(true);
            let attachmentUrl = undefined;
            let attachmentType: any = undefined;

            if (attachment) {
                const fileExt = attachment.name.split('.').pop();
                const filePath = `${groupId}/${Date.now()}.${fileExt}`;

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
                else attachmentType = 'file';
            }

            await sendGroupMessage(groupId, newMessage, attachmentUrl, attachmentType);

            setNewMessage('');
            setAttachment(null);
            queryClient.invalidateQueries({ queryKey: ['group-chat', groupId] });
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('Failed to send message');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendSticker = async (url: string) => {
        if (!groupId) return;
        try {
            await sendGroupMessage(groupId, '', url, 'sticker');
            queryClient.invalidateQueries({ queryKey: ['group-chat', groupId] });
        } catch (error) {
            console.error('Failed to send sticker:', error);
        }
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            await deleteGroupMessage(messageToDelete);
            queryClient.invalidateQueries({ queryKey: ['group-chat', groupId] });
            setMessageToDelete(null);
            toast.success("Message deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error('Failed to delete message');
        }
    };

    const handleAddMembers = async () => {
        if (!groupId || selectedNewMembers.length === 0) return;
        try {
            // Add all selected members
            for (const userId of selectedNewMembers) {
                await addMember.mutateAsync({ groupId, userId });
            }
            setSelectedNewMembers([]);
            setIsAddMemberOpen(false);
            queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
        } catch (error) {
            console.error('Failed to add members', error);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!groupId) return;
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await removeMember.mutateAsync({ groupId, userId });
            queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
        } catch (error) {
            console.error('Failed to remove member', error);
        }
    };

    const handleUpdateGroupName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !newGroupName.trim()) return;

        try {
            await updateGroup.mutateAsync({ groupId, updates: { name: newGroupName } });
            setIsEditingName(false);
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        } catch (error) {
            console.error('Failed to update group', error);
        }
    };

    const handleDeleteGroup = async () => {
        if (!groupId) return;
        if (!confirm("Are you sure you want to delete this group? This cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId) as any;

            if (error) throw error;
            toast.success('Group deleted');
            navigate('/feed/messages');
        } catch (error) {
            console.error('Failed to delete group:', error);
            toast.error('Failed to delete group');
        }
    };

    // Helper functions
    const dataURLtoFile = (dataurl: string, filename: string) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const capturePhoto = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const file = dataURLtoFile(imageSrc, `camera_${Date.now()}.jpg`);
            setAttachment(file);
            setIsCameraOpen(false);
        }
    };

    const filteredStickers = STICKERS?.filter(s =>
        s.tags.some(tag => tag.toLowerCase().includes(stickerSearch.toLowerCase()))
    ) || [];

    if (isLoadingGroup) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!group) return <div className="p-8 text-center">Group not found</div>;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/feed/messages')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsInfoOpen(true)}>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                            {group.type === 'my-college' ? '👯' : '🌍'}
                        </div>
                        <div>
                            <h1 className="font-bold cursor-pointer hover:underline">{group.name}</h1>
                            <p className="text-xs text-muted-foreground">{members?.length || 0} members</p>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsInfoOpen(true)}>
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : messages && messages.length > 0 ? (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-4`}
                            >
                                {!isMe && (
                                    <Avatar className="w-8 h-8 mr-2 mt-1">
                                        <AvatarImage src={msg.sender?.profile_photo} />
                                        <AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                    {!isMe && <span className="text-[10px] text-muted-foreground ml-1 mb-1">{msg.sender?.name}</span>}
                                    <div className={`relative px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'
                                        }`}>
                                        {/* Attachments */}
                                        {msg.media_url && (
                                            <div className="mb-2">
                                                {(msg.type === 'image' || msg.type === 'sticker') && (
                                                    <img
                                                        src={msg.media_url}
                                                        alt="Attachment"
                                                        className={`rounded-lg max-h-60 object-cover ${msg.type === 'sticker' ? 'bg-transparent max-h-32' : ''}`}
                                                    />
                                                )}
                                                {msg.type === 'video' && (
                                                    <video src={msg.media_url} controls className="rounded-lg max-h-60 bg-black/10" />
                                                )}
                                                {(msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'sticker') && (
                                                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-xs">
                                                        <Paperclip className="w-3 h-3" /> Download File
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Shared Content Previews */}
                                        {msg.shared_post_id && <SharedPostPreview postId={msg.shared_post_id} />}
                                        {msg.shared_project_id && <SharedProjectPreview projectId={msg.shared_project_id} />}
                                        {msg.shared_user_id && <SharedUserPreview userId={msg.shared_user_id} />}

                                        {msg.content && <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground">
                                            {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ''}
                                        </span>
                                        {isMe && (
                                            <button onClick={() => setMessageToDelete(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded">
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
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p>No messages yet. Start the conversation!</p>
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
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-end">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setAttachment(e.target.files[0])} />

                    {/* Camera */}
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Camera className="w-5 h-5" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="flex flex-col items-center gap-4">
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-lg w-full" />
                                <Button onClick={capturePhoto} className="w-full">Capture</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Stickers */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Sticker className="w-5 h-5" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3">
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input placeholder="Search stickers..." className="h-8 pl-7 text-xs" value={stickerSearch} onChange={(e) => setStickerSearch(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                    {filteredStickers.map((sticker, i) => (
                                        <button key={i} type="button" onClick={() => handleSendSticker(sticker.url)} className="hover:bg-muted p-1 rounded aspect-square">
                                            <img src={sticker.url} alt="Sticker" className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <div className="relative flex-1">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="pr-10"
                            disabled={isUploading}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none">
                                <EmojiPicker onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button type="submit" variant="gradient" size="icon" disabled={(!newMessage.trim() && !attachment) || isUploading}>
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>

            {/* Group Info Sidebar */}
            <Sheet open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Group Info</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl mx-auto">
                                {group.type === 'my-college' ? '👯' : '🌍'}
                            </div>

                            {isEditingName ? (
                                <form onSubmit={handleUpdateGroupName} className="flex gap-2 max-w-[200px] mx-auto">
                                    <Input
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="h-8 text-center"
                                        autoFocus
                                    />
                                    <Button type="submit" size="sm" className="h-8">Save</Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setIsEditingName(false)}>Cancel</Button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-center gap-2 group/name">
                                    <h2 className="font-bold text-xl">{group.name}</h2>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setNewGroupName(group.name);
                                                setIsEditingName(true);
                                            }}
                                        >
                                            <div className="w-3 h-3 border-2 border-foreground/50 rounded-full" />
                                            ✏️
                                        </Button>
                                    )}
                                </div>
                            )}

                            <p className="text-muted-foreground text-sm">{group.description || 'No description'}</p>
                            <Badge variant="outline">{group.type === 'my-college' ? 'My College' : 'Cross-College'}</Badge>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Members ({members?.length || 0})</h3>
                                {isAdmin && (
                                    <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(true)}>
                                        <UserPlus className="w-4 h-4 mr-2" /> Add
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {members?.map((member: any) => (
                                    <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                        <Avatar>
                                            <AvatarImage src={member.user?.profile_photo} />
                                            <AvatarFallback>{member.user?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium text-sm truncate">
                                                {member.user?.name}
                                                {member.role === 'admin' && <span className="ml-2 text-xs text-primary">(Admin)</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{member.user?.college}</p>
                                        </div>
                                        {isAdmin && member.user_id !== currentUser?.id && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(member.user_id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="pt-6 border-t">
                                <Button variant="destructive" className="w-full" onClick={handleDeleteGroup}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Group
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent className="sm:max-w-[400px] h-[600px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add Members</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden p-1">
                        <UserSelector
                            type={group.type as any}
                            currentUserCollege={currentUser?.college}
                            selectedUserIds={selectedNewMembers}
                            onToggleUser={(id) => setSelectedNewMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMembers} disabled={selectedNewMembers.length === 0}>
                            Add {selectedNewMembers.length > 0 && `(${selectedNewMembers.length})`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default GroupChatPage;
