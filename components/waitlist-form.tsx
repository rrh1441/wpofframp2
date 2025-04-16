// components/waitlist-form.tsx
"use client";

import React, { useState, useCallback, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient'; // Correct default import

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error('Please enter your email address.');
            return;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Submitting your email...');

        try {
            // Insert into Supabase
            const { error } = await supabase
                .from('waitlist_submissions')
                .insert({ email: trimmedEmail })
                .select() // Optionally select to confirm insert, though not strictly needed here
                .throwOnError(); // Throws error on failure, including RLS or constraints

            // Success
            toast.success('Thanks for joining the waitlist!', { id: toastId });
            setEmail(''); // Clear input on success

        } catch (error: any) {
            console.error("Waitlist submission error:", error);
            toast.dismiss(toastId); // Dismiss loading toast

            // Handle specific Supabase unique constraint violation (duplicate email)
            if (error?.code === '23505') { // PostgreSQL unique violation code
                toast.error('This email is already on the waitlist.');
            } else {
                toast.error(`Submission failed: ${error.message || 'Please try again.'}`);
            }
        } finally {
            setIsLoading(false); // Ensure loading state is reset
        }
    }, [email]); // Dependency array includes email

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Join the Waitlist
                </CardTitle>
                <CardDescription>
                    Be the first to know when we launch new features.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="waitlist-email">Email Address</Label>
                        <Input
                            id="waitlist-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required // Added basic HTML5 required validation
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isLoading ? 'Submitting...' : 'Join Waitlist'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Export as default if needed elsewhere, but named export works fine for direct import
// export default WaitlistForm;