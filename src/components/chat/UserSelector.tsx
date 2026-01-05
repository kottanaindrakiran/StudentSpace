import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';
import { useState } from 'react';

interface UserSelectorProps {
    type: 'my-college' | 'other-colleges';
    currentUserCollege?: string | null;
    selectedUserIds: string[];
    onToggleUser: (userId: string) => void;
}

export const UserSelector = ({ type, currentUserCollege, selectedUserIds, onToggleUser }: UserSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: users, isLoading } = useUsers({
        search: searchQuery,
        // If type is my-college, filter by current user's college.
        // If type is other-colleges, we generally want everyone or maybe filter OUT my college?
        // For now, based on requirements: "my college shows only my college students", "other college show all friends"
        college: type === 'my-college' ? currentUserCollege : undefined,
    });

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search students..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="h-[300px] overflow-y-auto border rounded-md p-2 space-y-2">
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : users && users.length > 0 ? (
                    users.map(user => (
                        <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUserIds.includes(user.id)
                                ? 'bg-primary/10 border-primary/20 border'
                                : 'hover:bg-muted'
                                }`}
                            onClick={() => onToggleUser(user.id)}
                        >
                            <div className="relative">
                                <img
                                    src={user.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                {selectedUserIds.includes(user.id) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center ring-2 ring-background">
                                        <Check className="w-2 h-2" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{user.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.branch} • {user.college}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No students found
                    </div>
                )}
            </div>
        </div>
    );
};
