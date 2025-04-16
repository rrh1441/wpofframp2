// components/waitlist-form.tsx
"use client"; // This component needs client-side interactivity

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import toast from 'react-hot-toast'; // Assuming Toaster is rendered in a parent layout/page

// Correctly import the default export from your supabaseClient file
import supabase from '@/lib/supabaseClient';

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm() {
  const [waitlistEmail, setWaitlistEmail] = useState<string>("");
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState<boolean>(false);

  const handleWaitlistSubmit = useCallback(async () => {
    if (isSubmittingWaitlist) return;

    // Check if supabase client is available (good safeguard, but primary fix was the import)
    if (!supabase) {
        console.error("Supabase client is still not available even after import correction. Check lib/supabaseClient.ts and environment variables.");
        toast.error("Waitlist feature is currently unavailable. Please try again later.");
        return;
    }

    if (!waitlistEmail || !EMAIL_REGEX.test(waitlistEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmittingWaitlist(true);
    const submissionToastId = toast.loading('Submitting email...');

    try {
      // Attempt to insert the email
      const { error } = await supabase
        .from('waitlist_submissions')
        .insert({ email: waitlistEmail })
        .select() // Using select() helps confirm insert/catch RLS issues
        .throwOnError(); // Throws error if Supabase returns one

      toast.success("You've joined the waitlist!", { id: submissionToastId });
      setWaitlistEmail(""); // Clear input on success

    } catch (error: any) {
      console.error("Waitlist submission error:", error);
      let errorMessage = "Could not submit email. Please try again.";

      if (error && typeof error === 'object' && 'code' in error) { // Check if it looks like a Supabase error
          if (error.code === '23505') { // Unique constraint violation
              errorMessage = "This email is already on the waitlist!";
              toast.success(errorMessage, { id: submissionToastId });
              setWaitlistEmail(""); // Clear input even if already exists
              // No 'return' here, finally block should still run
          } else if (typeof error.code === 'string' && error.code.startsWith('PGRST')) {
             errorMessage = `Database error (${error.code}). Please try again.`;
           } else if (typeof error.code === 'string' && error.code.startsWith('PGRST') && error.message?.includes(' RLS ')) {
             errorMessage = `Database access error. Check RLS setup.`;
           } else {
              // Handle other Supabase error codes if needed
              errorMessage = `An unexpected database error occurred (${error.code}).`;
           }
      } else if (error instanceof Error) { // Handle generic JS/network errors
          errorMessage = `Submission failed: ${error.message}`;
      }
      // Only show error toast if it wasn't the "already subscribed" success case
      if (error?.code !== '23505') {
          toast.error(errorMessage, { id: submissionToastId });
      }

    } finally {
      setIsSubmittingWaitlist(false);
    }
  }, [waitlistEmail, isSubmittingWaitlist]);

  return (
    <Card id="waitlist-section-standalone">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-lg">Join the Waitlist</CardTitle>
        <CardDescription>Be the first to know about new features and releases.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-grow w-full">
            <Label htmlFor="waitlist-email-standalone" className="sr-only">Email Address</Label>
            <Input
              id="waitlist-email-standalone" // Use unique ID if using multiple forms, though maybe not needed now
              type="email"
              placeholder="you@example.com"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              disabled={isSubmittingWaitlist}
            />
          </div>
          <Button
            onClick={handleWaitlistSubmit}
            disabled={isSubmittingWaitlist || !waitlistEmail}
            className="w-full sm:w-auto"
          >
            {isSubmittingWaitlist ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
            ) : (
              <><Mail className="mr-2 h-4 w-4" /> Join Waitlist</>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-1">
          We respect your privacy. No spam.
        </p>
      </CardContent>
    </Card>
  );
}