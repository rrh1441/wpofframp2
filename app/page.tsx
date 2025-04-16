// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Sparkles, ShieldCheck, BarChartBig, Code2, ArrowRight, BriefcaseBusiness, Palette, Mail } from "lucide-react"; // Added Mail
import HeroPreview from "@/components/hero-preview";
import { THEMES } from "@/lib/constants";
import { WaitlistForm } from "@/components/waitlist-form"; // <-- Import the reusable component

// Theme array without 'drudge'
const themeKeys = ['modern', 'matrix', 'ghibli'];

const whoIsItForData = [
  {
    icon: BarChartBig,
    title: "Content Creators & Bloggers",
    description: "Perfect for migrating blogs, personal sites, or online publications with lots of articles seeking speed and simplicity."
  },
  {
    icon: BriefcaseBusiness,
    title: "Small Businesses & Marketers",
    description: "Need a professional, fast, and secure web presence for lead generation or branding without WordPress maintenance."
  },
  {
    icon: Palette,
    title: "Portfolio Owners",
    description: "Visually showcase your design, photography, or artwork on a fast-loading site without WordPress theme limitations."
  },
  {
    icon: Rocket,
    title: "Performance Seekers",
    description: "Ideal if your WordPress site feels slow and you crave the instant loads of a static site generator like Next.js."
  },
  {
    icon: ShieldCheck,
    title: "Security Conscious Users",
    description: "Eliminate worries about plugin vulnerabilities and constant WordPress security patches with inherently secure static sites."
  },
  {
    icon: Code2,
    title: "Developers & Agencies",
    description: "Quickly convert client WordPress sites to a modern, maintainable stack (Next.js, Tailwind CSS) without manual migration."
  }
];


export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-2 items-center text-xl font-bold">
            <Image src="/offramp.svg" width={24} height={24} alt="Offramp logo" />
            <span>WP Offramp</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="#details">How It Works</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="#details">Themes</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                 <Link href="#who-is-it-for">Who It's For</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                 <Link href="#waitlist">Join Waitlist</Link> {/* Added link to waitlist */}
                </Button>
              <Button size="sm" asChild>
                <Link href="#top">Try Now</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Top Hero Section */}
        <section id="top" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-10">
              <div className="flex flex-col justify-center space-y-6 text-center max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    The Escape Hatch from WordPress
                  </h1>
                  <p className="text-lg text-muted-foreground md:text-xl">
                    Break free from bloat, performance bottlenecks, and endless updates
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

        {/* Combined Section: How It Works & Themes */}
        <section id="details" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20">

              {/* Left Column: How It Works */}
              <div className="flex flex-col space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
                  <p className="text-muted-foreground md:text-lg">
                    Three simple steps to transform your WordPress site
                  </p>
                </div>
                <div className="grid gap-6">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"> 1 </div>
                          <CardTitle className="text-xl">Enter Your URL</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Paste your WordPress site URL or choose example</p>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"> 2 </div>
                          <CardTitle className="text-xl">Preview Themes</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Instantly switch between beautiful themes</p>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"> 3 </div>
                          <CardTitle className="text-xl">Migrate & Deploy</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">Download your new Next.js project as a ZIP to deploy</p>
                      </CardContent>
                    </Card>
                </div>
              </div>

              {/* Right Column: Themes */}
              <div className="flex flex-col space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Beautiful Themes</h2>
                  <p className="text-muted-foreground md:text-lg">
                    Make your content shine
                  </p>
                </div>
                  <div className="grid grid-cols-1 gap-6">
                    {themeKeys.map((key, index) => {
                      const theme = THEMES[key as keyof typeof THEMES];
                      if (!theme) return null;
                      return (
                          <Card key={key} className="h-full flex flex-col">
                              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"> {index + 1} </div>
                                  <CardTitle className="text-xl">{theme.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="flex-grow">
                                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                              </CardContent>
                          </Card>
                      );
                    })}
                  </div>
              </div>
            </div> {/* End of two-column grid */}

            {/* Centered CTA Button */}
            <div className="mt-16 flex justify-center">
                 <Button size="lg" asChild>
                   <Link href="#top">
                     Reimagine Your Site Now <ArrowRight className="ml-2 h-5 w-5" />
                   </Link>
                 </Button>
            </div>

          </div> {/* End of container */}
        </section>

        {/* "Who Is It For?" Section */}
        <section id="who-is-it-for" className="w-full py-12 md:py-24 lg:py-32 border-t">
            <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">WP Offramp is Best For</h2>
              </div>
              {/* Grid layout for cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pt-4">
                  {whoIsItForData.map((item, index) => (
                    <Card key={index} className="text-left h-full flex flex-col">
                      <CardHeader className="flex flex-row items-start gap-4 pb-3">
                        <item.icon className="h-8 w-8 mt-1 text-primary shrink-0" aria-hidden="true" />
                        <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{item.title}</CardTitle>
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

        {/* --- ADDED Waitlist Form Instance #2 Section --- */}
        <section id="waitlist" className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted">
          <div className="container px-4 md:px-6 flex flex-col items-center">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-8 text-center">
               Stay Updated
             </h2>
             <WaitlistForm />
          </div>
        </section>
        {/* --- End Waitlist Form Instance #2 Section --- */}

      </main>

      {/* Footer - Updated */}
       <footer className="w-full border-t py-6 md:py-0">
         <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
           <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
             © {currentYear} WP Offramp. All rights reserved.
           </p>
           {/* Updated: Removed Terms/Privacy, Contact is mailto */}
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