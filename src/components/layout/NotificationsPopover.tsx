import { useState } from 'react';
import { Bell, Heart, User, MessageCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const NotificationsPopover = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [open, setOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen && notifications) {
            // Optional: mark all as read when closing? 
            // Or mark them when rendered?
            // Let's just keep them unread until clicked or explicitly marked?
            // User expectations vary. Let's leave them unread to be safe, or mark visible ones.
            // A common pattern is marking as read when the list is opened.
            notifications.forEach((n: any) => {
                if (!n.is_read) markAsRead(n.id);
            });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
            case 'follow': return <User className="w-4 h-4 text-blue-500 fill-current" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-green-500 fill-current" />;
            default: return <Bell className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/80">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b font-semibold text-sm flex justify-between items-center">
                    Notifications
                    {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications && notifications.length > 0 ? (
                        <div className="flex flex-col">
                            {notifications?.map((notification: any) => (
                                <Link
                                    key={notification.id}
                                    to={notification.link || '#'}
                                    className={cn(
                                        "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-0",
                                        !notification.is_read && "bg-muted/20"
                                    )}
                                    onClick={() => setOpen(false)}
                                >
                                    {/* Actor Avatar */}
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={(notification.actor as any)?.profile_photo || ''} />
                                        <AvatarFallback>{(notification.actor as any)?.name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            <span className="font-semibold">{(notification.actor as any)?.name}</span>{' '}
                                            <span className="text-muted-foreground font-normal">
                                                {notification.type === 'follow' && 'started following you'}
                                                {notification.type === 'like' && 'liked your project'}
                                                {notification.type === 'comment' && 'commented on your project'}
                                                {notification.type === 'message' && 'sent you a message'}
                                            </span>
                                        </p>
                                        {notification.content && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                "{notification.content}"
                                            </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {notification.type === 'follow' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                            Follow Back
                                        </Button>
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No notifications yet
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
