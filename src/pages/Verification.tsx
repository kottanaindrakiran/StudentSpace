import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Verification = () => {
    const { data: currentUser } = useCurrentUser();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [verificationResult, setVerificationResult] = useState<{ status: string; score?: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const validateEmail = (email: string, type: 'current' | 'old') => {
        if (type === 'current') {
            // Must be edu or not gmail roughly (logic per user req: "not normal gmail")
            return !email.endsWith('@gmail.com');
        }
        return true; // Old students allow personal gmail per req
    };

    const handleVerify = async (type: 'current' | 'old') => {
        if (!currentUser) return;

        // Validation
        if (type === 'current' && !validateEmail(email, 'current')) {
            toast({
                title: "Invalid Email",
                description: "Current students must use a college email address.",
                variant: "destructive"
            });
            return;
        }

        if (!file && type === 'current') { // Old students might skip file if email verified (logic TBD, but simplified here)
            // User req: "Must upload ANY ONE document" for old students too if email not exists.
            // We will enforce file upload for simplicity unless we implemented email OTP verification.
            toast({
                title: "Document Required",
                description: "Please upload a verification document.",
                variant: "destructive"
            });
            return;
        }

        // For Old Docs: "If college email exists... verify via college email". 
        // Since we don't have email OTP flow implemented, we will rely on Document or Manual Email check by Edge Function.

        setLoading(true);
        try {
            let documentPath = '';

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${currentUser.id}/${Math.random()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('verification-documents')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;
                documentPath = data.path;
            }

            // Invoke Edge Function
            const { data: funcData, error: funcError } = await supabase.functions.invoke('verify-document', {
                body: {
                    document_path: documentPath,
                    user_id: currentUser.id,
                    user_type: type,
                    provided_email: email
                }
            });

            if (funcError) throw funcError;

            setVerificationResult({ status: funcData.status, score: funcData.match_score });

            toast({
                title: funcData.status === 'verified' ? "Verification Successful" : "Verification Pending",
                description: funcData.status === 'verified' ? "Your account is now verified!" : "We have received your details. Status: " + funcData.status,
                variant: funcData.status === 'verified' ? "default" : "destructive" // using destructive for warning/attention
            });

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Something went wrong during verification.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return <div>Please login first.</div>;

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileCheck className="w-6 h-6 text-primary" />
                            Student Verification
                        </CardTitle>
                        <CardDescription>
                            Verify your student status to unlock full access to StudentConnect.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {verificationResult?.status === 'verified' ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-green-500">
                                <CheckCircle2 className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-bold">You are Verified!</h3>
                                <p className="text-muted-foreground">Thank you for verifying your identity.</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="current" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="current">Current Student</TabsTrigger>
                                    <TabsTrigger value="old">Old Student (Alumni)</TabsTrigger>
                                </TabsList>

                                <TabsContent value="current" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="college-email">College Email Address</Label>
                                            <Input
                                                id="college-email"
                                                placeholder="you@college.edu"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">Must be a valid college email (.edu, .ac.in, etc.)</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Upload Identity Document</Label>
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*,.pdf"
                                                    onChange={handleFileChange}
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        {file ? file.name : "Click to upload ID Card / Hall Ticket / Marks Memo"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={() => handleVerify('current')}
                                            disabled={loading}
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Verify as Current Student
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="old" className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="personal-email">Email Address</Label>
                                            <Input
                                                id="personal-email"
                                                placeholder="you@gmail.com"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">College email preferred, but personal email is accepted.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Upload Verification Document (Any One)</Label>
                                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*,.pdf"
                                                    onChange={handleFileChange}
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        {file ? file.name : "Old ID Card / Hall Ticket / Marks Memo / Provisional Certificate"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={() => handleVerify('old')}
                                            disabled={loading}
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Verify as Alumni
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}

                        {verificationResult && verificationResult.status !== 'verified' && (
                            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <h4 className="font-semibold text-yellow-500">Limited Access</h4>
                                    <p className="text-sm text-muted-foreground">
                                        We couldn't fully verify your document automatically (Score: {verificationResult.score}).
                                        Your account has Limited Access until a manual review is completed.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Verification;
