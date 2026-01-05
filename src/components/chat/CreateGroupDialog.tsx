
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Search, UserPlus, Check, X } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserSelector } from './UserSelector';

interface CreateGroupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'my-college' | 'other-colleges';
}

export const CreateGroupDialog = ({ isOpen, onClose, type }: CreateGroupDialogProps) => {
    const [step, setStep] = useState<1 | 2>(1); // 1: Select Members, 2: Details
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { createGroup } = useGroups();
    const { data: currentUser } = useCurrentUser();

    // Fetch users for member selection
    // If 'my-college', filter by college. Ideally the backend handles this or useUsers supports it.
    const { data: users, isLoading: isLoadingUsers } = useUsers({
        search: searchQuery,
        // If type is my-college, we might want to pass college filter
        // Assuming useUsers supports 'college' filter
        college: type === 'my-college' ? currentUser?.college : undefined,
    });

    const handleClose = () => {
        setStep(1);
        setName('');
        setDescription('');
        setSelectedMembers([]);
        setSearchQuery('');
        onClose();
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createGroup.mutateAsync({
                name,
                description,
                type,
                members: selectedMembers,
            });
            handleClose();
        } catch (error) {
            console.error('Failed to create group', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter out current user from list
    const filteredUsers = users?.filter(u => u.id !== currentUser?.id) || [];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>
                        {step === 1 ? 'Add People' : 'Group Details'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {step === 1 && (
                        <div className="flex flex-col h-full bg-background rounded-lg">
                            <div className="flex-1 overflow-hidden p-4">
                                <UserSelector
                                    type={type}
                                    currentUserCollege={currentUser?.college}
                                    selectedUserIds={selectedMembers}
                                    onToggleUser={toggleMember}
                                />
                                {selectedMembers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-2">Selected ({selectedMembers.length})</h4>
                                        <div className="flex gap-2flex-wrap gap-2">
                                            {selectedMembers.map(memberId => {
                                                const user = users?.find(u => u.id === memberId);
                                                if (!user) return null;
                                                return (
                                                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                                                        {user.name}
                                                        <X
                                                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                            onClick={() => toggleMember(memberId)}
                                                        />
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form id="create-group-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Coding Club"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What's this group about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Creating group with {selectedMembers.length} member{selectedMembers.length !== 1 && 's'}.
                            </div>
                        </form>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleNext}>
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
                                Back
                            </Button>
                            <Button type="submit" form="create-group-form" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Group
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
