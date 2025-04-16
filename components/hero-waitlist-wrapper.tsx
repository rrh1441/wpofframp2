// components/hero-waitlist-wrapper.tsx
"use client"; // Explicit client boundary

import { WaitlistForm } from "./waitlist-form";

// This component's sole purpose is to render the WaitlistForm
// within an explicit client boundary, even if the parent is already client-side.
export function HeroWaitlistWrapper() {
    return (
        <div className="mt-6"> {/* Keep the margin-top here */}
            <WaitlistForm />
        </div>
    );
}