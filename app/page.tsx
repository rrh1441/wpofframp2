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
import EnhancedStepGuide from "@/components/enhanced-step-guide";

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
    title: "Entrepreneurs",
    description:
      "Get a professional, fast, and secure web presence for lead generation or branding without WordPress maintenance.",
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
            <Image
              src="/offramp.svg"
              width={24}
              height={24}
              alt="Offramp logo"
            />
            <span>WP Offramp</span>
          </div>
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
          <nav className="hidden sm:flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="#details">
                <span>About</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#how-to-guide">
                <span>How To</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#who-is-it-for">
                <span>Who It's For</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="#top">
                <span>Try Now</span>
              </Link>
            </Button>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-4 space-y-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="#details" onClick={() => setMobileMenuOpen(false)}>
                <span>About</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link
                href="#how-to-guide"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>How To</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link
                href="#who-is-it-for"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Who It's For</span>
              </Link>
            </Button>
            <Button
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="#top" onClick={() => setMobileMenuOpen(false)}>
                <span>Try Now</span>
              </Link>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Section 1: Hero Preview */}
        <section id="top" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-10">
              <div className="flex flex-col justify-center space-y-6 text-center max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    The Escape Hatch from WordPress
                  </h1>
                  <p className="text-lg text-muted-foreground md:text-xl">
                    Break free from bloat, performance bottlenecks, and endless
                    updates
                  </p>
                </div>
              </div>
              <div className="w-full max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">
                  Reimagine Your Site
                </h2>
                <HeroPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Step-by-Step Guide */}
        <section
          id="how-to-guide"
          className="w-full pt-12 pb-12 md:pb-24 lg:pb-32 bg-background border-t"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8">
              <EnhancedStepGuide />
            </div>
          </div>
        </section>

        {/* Section 3: Details */}
        <section
          id="details"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted border-t"
        >
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20">
              <div className="flex flex-col space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    How WP Offramp Works
                  </h2>
                  <p className="text-muted-foreground md:text-lg">
                    Three simple steps to transform your WordPress site
                  </p>
                </div>
                <div className="grid gap-6">
                  {[
                    {
                      title: "1. Enter Your URL",
                      description:
                        "Paste your WordPress site URL or choose an example.",
                    },
                    {
                      title: "2. Preview & Download",
                      description:
                        "Instantly preview themes and download your Next.js ZIP.",
                    },
                    {
                      title: "3. Deploy Anywhere",
                      description:
                        "Push to GitHub and deploy seamlessly on Vercel or elsewhere.",
                    },
                  ].map((step, idx) => (
                    <Card key={idx} className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex flex-col space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Key Features
                  </h2>
                  <p className="text-muted-foreground md:text-lg">
                    Modern tech, zero hassle.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {[
                    {
                      icon: Rocket,
                      title: "Blazing Fast Speed",
                      description:
                        "Leverage Next.js static generation for instant page loads.",
                    },
                    {
                      icon: Code2,
                      title: "Modern Stack",
                      description:
                        "Built with Next.js, React, TypeScript, and Tailwind CSS.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Enhanced Security",
                      description:
                        "Reduce attack surface compared to traditional WordPress setups.",
                    },
                    {
                      icon: Sparkles,
                      title: "Easy Deployment",
                      description:
                        "Deploy effortlessly via GitHub and Vercel.",
                    },
                  ].map((feature, idx) => (
                    <Card key={idx} className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <feature.icon
                          className="h-6 w-6 text-primary shrink-0"
                          aria-hidden="true"
                        />
                        <CardTitle className="text-xl">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-16 flex justify-center">
              <Button size="lg" asChild>
                <Link href="#top">
                  <span>
                    Reimagine Your Site Now <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 4: Who It's For */}
        <section
          id="who-is-it-for"
          className="w-full py-12 md:py-24 lg:py-32 border-t"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  WP Offramp is Best For
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pt-4">
                {whoIsItForData.map((item, idx) => (
                  <Card key={idx} className="text-left h-full flex flex-col">
                    <CardHeader className="flex flex-row items-start gap-4 pb-3">
                      <item.icon
                        className="h-8 w-8 mt-1 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {item.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {currentYear} WP Offramp. All rights reserved.
          </p>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="mailto:support@simpleappsgroup.com">Contact</a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
