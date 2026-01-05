import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DbUser } from "@/types/database";
import { Loader2, User, Upload } from "lucide-react";

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: DbUser | null;
}

const branches = [
    "CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Biotech", "Other"
];

const EditProfileDialog = ({ isOpen, onClose, currentUser }: EditProfileDialogProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        branch: "",
        passingYear: "",
        bio: "",
        github_link: "",
        linkedin_link: ""
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || "",
                branch: currentUser.branch || "",
                passingYear: currentUser.batch_end ? currentUser.batch_end.toString() : "",
                bio: currentUser.bio || "",
                github_link: currentUser.github_link || "",
                linkedin_link: currentUser.linkedin_link || ""
            });
            setPreviewUrl(currentUser.profile_photo || null);
        }
    }, [currentUser, isOpen]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhoto(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // Cleanup object URL on component unmount or next change
            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);
        try {
            let profilePhotoUrl = currentUser.profile_photo;

            // 1. Upload new photo if selected
            if (selectedPhoto) {
                const fileExt = selectedPhoto.name.split('.').pop();
                const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedPhoto);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                profilePhotoUrl = publicUrl;
            }

            // 2. Update User Profile
            // Calculate batch_start roughly if year changed (assuming 4 years)
            const batchEnd = parseInt(formData.passingYear);
            const batchStart = batchEnd ? batchEnd - 4 : null;

            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    branch: formData.branch,
                    batch_end: batchEnd,
                    batch_start: batchStart,
                    profile_photo: profilePhotoUrl,
                    bio: formData.bio,
                    github_link: formData.github_link,
                    linkedin_link: formData.linkedin_link
                })
                .eq('id', currentUser.id);

            if (error) throw error;

            // 3. Refresh UI
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            await queryClient.invalidateQueries({ queryKey: ['user', currentUser.id] });

            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });

            onClose();
        } catch (error: any) {
            console.error("Update failed:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => (currentYear + 5 - i).toString());

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <div className="text-sm text-muted-foreground">Make changes to your profile here. Click save when you're done.</div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/10">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <User className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                <Upload className="w-6 h-6 text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground">Click to change photo</p>
                    </div>

                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        {/* Branch */}
                        <div className="space-y-2">
                            <Label htmlFor="branch">Branch</Label>
                            <Select
                                value={formData.branch}
                                onValueChange={(value) => setFormData({ ...formData, branch: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch} value={branch}>
                                            {branch}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Passing Year */}
                        <div className="space-y-2">
                            <Label htmlFor="year">Passing Year (Batch End)</Label>
                            <Select
                                value={formData.passingYear}
                                onValueChange={(value) => setFormData({ ...formData, passingYear: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="github">GitHub Link</Label>
                                <Input
                                    id="github"
                                    value={formData.github_link}
                                    onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                                    placeholder="https://github.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn Link</Label>
                                <Input
                                    id="linkedin"
                                    value={formData.linkedin_link}
                                    onChange={(e) => setFormData({ ...formData, linkedin_link: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="gradient" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileDialog;
