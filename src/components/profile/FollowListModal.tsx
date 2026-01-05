import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { User, School, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface FollowListModalProps {
    userId: string;
    type: "followers" | "following" | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    college?: string;
    campus?: string;
}

export const FollowListModal = ({ userId, type, isOpen, onOpenChange, college: propCollege, campus: propCampus }: FollowListModalProps) => {
    const { data: userProfile } = useUserProfile(userId);
    const college = propCollege || userProfile?.college;
    const campus = propCampus || userProfile?.campus;

    const { data: users, isLoading } = useQuery({
        queryKey: ["followList", userId, type],
        enabled: !!userId && !!type && isOpen,
        queryFn: async () => {
            if (type === "followers") {
                // Fetch who follows me (I am the following_id)
                // We want the profiles of the *followers*
                const { data, error } = await supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("following_id", userId);

                if (error) throw error;
                const ids = data.map(d => d.follower_id);

                if (ids.length === 0) return [];

                const { data: profiles, error: profileError } = await supabase
                    .from("users")
                    .select("*")
                    .in("id", ids);

                if (profileError) throw profileError;
                return profiles;

            } else {
                // Fetch who I follow (I am the follower_id)
                // We want the profiles of the *following*
                const { data, error } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", userId);

                if (error) throw error;
                const ids = data.map(d => d.following_id);

                if (ids.length === 0) return [];

                const { data: profiles, error: profileError } = await supabase
                    .from("users")
                    .select("*")
                    .in("id", ids);

                if (profileError) throw profileError;
                return profiles;
            }
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="capitalize">{type}</DialogTitle>
                    <DialogDescription>
                        List of users {type === 'followers' ? 'who follow this user' : 'this user is following'}.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="same" className="w-full mt-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="same">
                            <School className="w-4 h-4 mr-2" />
                            Same Campus
                        </TabsTrigger>
                        <TabsTrigger value="others">
                            <Globe className="w-4 h-4 mr-2" />
                            Others
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="same" className="mt-2">
                        <ScrollArea className="h-[300px] pr-4">
                            <UserList
                                users={users?.filter(u => {
                                    const normalize = (str?: string) => str?.toLowerCase().trim() || "";
                                    const uCol = normalize(u.college);
                                    const pCol = normalize(college);
                                    const uCam = normalize(u.campus);
                                    const pCam = normalize(campus);

                                    const collegeMatch = (uCol && pCol) ? (uCol.includes(pCol) || pCol.includes(uCol)) : uCol === pCol;
                                    const campusMatch = (uCam && pCam) ? (uCam.includes(pCam) || pCam.includes(uCam)) : uCam === pCam;

                                    return collegeMatch && campusMatch;
                                })}
                                isLoading={isLoading}
                                onOpenChange={onOpenChange}
                                emptyMessage="No users from same campus found."
                            />
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="others" className="mt-2">
                        <ScrollArea className="h-[300px] pr-4">
                            <UserList
                                users={users?.filter(u => {
                                    const normalize = (str?: string) => str?.toLowerCase().trim() || "";
                                    const uCol = normalize(u.college);
                                    const pCol = normalize(college);
                                    const uCam = normalize(u.campus);
                                    const pCam = normalize(campus);

                                    const collegeMatch = (uCol && pCol) ? (uCol.includes(pCol) || pCol.includes(uCol)) : uCol === pCol;
                                    const campusMatch = (uCam && pCam) ? (uCam.includes(pCam) || pCam.includes(uCam)) : uCam === pCam;

                                    return !(collegeMatch && campusMatch);
                                })}
                                isLoading={isLoading}
                                onOpenChange={onOpenChange}
                                emptyMessage="No users from other campuses/colleges found."
                            />
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

const UserList = ({ users, isLoading, onOpenChange, emptyMessage }: { users: any[] | undefined, isLoading: boolean, onOpenChange: (b: boolean) => void, emptyMessage: string }) => {
    if (isLoading) return <div className="text-center text-sm text-muted-foreground py-4">Loading...</div>;
    if (!users || users.length === 0) return <div className="text-center text-sm text-muted-foreground py-4">{emptyMessage}</div>;

    return (
        <div className="space-y-4">
            {users.map((user) => (
                <Link
                    key={user.id}
                    to={`/feed/profile/${user.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={user.profile_photo || ""} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user.college?.split(',')[0]} • {user.branch}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
};
