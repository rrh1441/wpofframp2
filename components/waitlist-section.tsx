// components/waitlist-section.tsx
"use client"; // <--- Mark this wrapper as a Client Component

import { WaitlistForm } from "@/components/waitlist-form";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted">
      <div className="container px-4 md:px-6 flex flex-col items-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-8 text-center">
          Stay Updated
        </h2>
        <WaitlistForm /> {/* Render the original form inside the client wrapper */}
      </div>
    </section>
  );
}