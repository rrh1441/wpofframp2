// --- components/waitlist-form.tsx ---
"use client";

import React, { useState, useCallback, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';

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
            const { error } = await supabase
                .from('waitlist_submissions')
                .insert({ email: trimmedEmail })
                .select()
                .throwOnError();

            toast.success('Thanks for joining the waitlist!', { id: toastId });
            setEmail('');
        } catch (error: any) {
            console.error("Waitlist submission error:", error);
            toast.dismiss(toastId);
            if (error?.code === '23505') {
                toast.error('This email is already on the waitlist.');
            } else {
                // Ensure the specific RLS error message is displayed if available
                const message = error.message.includes('security policy')
                    ? `Submission failed: ${error.message}`
                    : `Submission failed: ${error.message || 'Please try again.'}`;
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [email]);

    return (
        // --- MODIFIED className: Removed max-w-md and mx-auto ---
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Join the Waitlist</CardTitle>
                <CardDescription>Be the first to know when we launch new features and capabilities. Multi-page and full-site migration coming soon, along with custom themes and managed migrations.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="waitlist-email">Email Address</Label>
                        <Input id="waitlist-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required/>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
                        {isLoading ? 'Submitting...' : 'Join Waitlist'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}