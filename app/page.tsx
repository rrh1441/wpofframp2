// --- app/page.tsx ---
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Rocket,
  Sparkles,
  ShieldCheck,
  BarChartBig,
  Code2,
  ArrowRight,
  BriefcaseBusiness,
  Palette,
  Mail,
  Menu,
  X,
} from "lucide-react";
import HeroPreview from "@/components/hero-preview";
import { THEMES } from "@/lib/constants";

const themeKeys = ["modern", "matrix", "ghibli"];

const whoIsItForData = [
  {
    icon: BarChartBig,
    title: "Content Creators & Bloggers",
    description:
      "Perfect for migrating blogs, personal sites, or online publications with lots of articles seeking speed and simplicity.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Small Businesses & Marketers",
    description:
      "Need a professional, fast, and secure web presence for lead generation or branding without WordPress maintenance.",
  },
  {
    icon: Palette,
    title: "Portfolio Owners",
    description:
      "Visually showcase your design, photography, or artwork on a fast-loading site without WordPress theme limitations.",
  },
  {
    icon: Rocket,
    title: "Performance Seekers",
    description:
      "Ideal if your WordPress site feels slow and you crave the instant loads of a static site generator like Next.js.",
  },
  {
    icon: ShieldCheck,
    title: "Security Conscious Users",
    description:
      "Eliminate worries about plugin vulnerabilities and constant WordPress security patches with inherently secure static sites.",
  },
  {
    icon: Code2,
    title: "Developers & Agencies",
    description:
      "Quickly convert client WordPress sites to a modern, maintainable stack (Next.js, Tailwind CSS) without manual migration.",
  },
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex gap-2 items-center text-xl font-bold">
            <Image src="/offramp.svg" width={24} height={24} alt="Offramp logo" />
            <span>WP Offramp</span>
          </div>
          <div className="sm:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
          <nav className="hidden sm:flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="#details">How It Works</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#details">Themes</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#who-is-it-for">Who It's For</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="#top">Try Now</Link>
            </Button>
          </nav>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-4 space-y-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="#details">How It Works</Link>
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="#details">Themes</Link>
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="#who-is-it-for">Who It's For</Link>
            </Button>
            <Button size="sm" className="w-full" asChild>
              <Link href="#top">Try Now</Link>
            </Button>
          </div>
        )}
      </header>

      {/* ... rest of your page remains unchanged ... */}
    </div>
  );
}
