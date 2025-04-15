// components/hero-preview.tsx (Full Code - V2 - Properly Removed failedThemes artifacts)
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Keep if original HTML tab is needed, otherwise remove
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Icons
import { Download, Loader2, AlertCircle, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
// Alert Component for Status/Errors
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Modal Component (Using Shadcn Dialog as an example)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
// Tooltip Provider (Optional, keep if other tooltips exist/planned)
import { TooltipProvider } from "@/components/ui/tooltip";
// Skeleton Loader
import { Skeleton } from "@/components/ui/skeleton";
// Constants and Types
import { THEMES, ThemeKey } from "@/lib/constants";
// Import V2 HomepagePost type (ensure path is correct)
import type { HomepagePost } from "@/app/api/homepage-preview/route";
// Utils
import { cn } from "@/lib/utils";
// Layout Imports (Themes)
import { ModernLayout } from './themes/ModernLayout';
import { MatrixLayout } from './themes/MatrixLayout';
import { GhibliLayout } from './themes/GhibliLayout';
// Toast Notification
import toast, { Toaster } from 'react-hot-toast';

const themeKeys = ['modern', 'matrix', 'ghibli'] as ThemeKey[];

// Mapping themes to layout components
const themeLayoutMap: Record<ThemeKey, React.FC<{
    posts?: HomepagePost[]; // For homepage rendering
    mdxContent?: string; // For modal/single view rendering
    onClickPost?: (index: number) => void; // Callback for clicking posts in layout
}>> = {
    modern: ModernLayout,
    matrix: MatrixLayout,
    ghibli: GhibliLayout,
};

// --- Helper Functions ---
const normalizeUrl = (inputUrl: string): string => {
    let normalized = inputUrl.trim();
    if (!normalized) return "";
    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    try {
        const urlObj = new URL(normalized);
        return urlObj.origin;
    } catch (e) {
        console.warn("Could not normalize URL, returning as is:", inputUrl);
        return inputUrl;
    }
};

// --- Constants ---
const themeButtonStyles: Record<ThemeKey, string> = {
    modern: "bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-sans",
    matrix: "bg-black hover:bg-gray-900 text-green-400 border-green-700 font-mono",
    ghibli: "bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 font-serif",
};

// Definition for Example Site buttons
const exampleSites = [
  { name: "Harvard Gazette", url: "https://news.harvard.edu/gazette/" },
  { name: "Minimalist Baker", url: "https://minimalistbaker.com/" },
];

// --- Types ---
type ApiCheckStatus = 'idle' | 'loading' | 'success' | 'error';
type ModalContent = {
    title: string;
    mdx: string;
    id: number;
    link: string;
} | null;


// --- Main Component ---
export default function HeroPreview() {
  // --- State ---
  const [url, setUrl] = useState("");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("modern");
  const [isLoading, setIsLoading] = useState(false); // Loading homepage previews
  const [isCheckingApi, setIsCheckingApi] = useState(false); // Loading API check
  const [isMigrating, setIsMigrating] = useState(false);

  // API Check State
  const [apiCheckStatus, setApiCheckStatus] = useState<ApiCheckStatus>('idle');
  const [apiCheckMessage, setApiCheckMessage] = useState<string | null>(null);

  // Preview Data State (V2 Homepage Posts)
  const [homepagePosts, setHomepagePosts] = useState<HomepagePost[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resultsUrl, setResultsUrl] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPostContent, setModalPostContent] = useState<ModalContent>(null);

  // Migration State
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Debounce URL changes and reset relevant states
    const handler = setTimeout(() => {
        const normalizedInputUrl = url ? normalizeUrl(url) : "";
        if ((normalizedInputUrl && resultsUrl && normalizedInputUrl !== resultsUrl) || (!url && resultsUrl)) {
            console.log("https://www.merriam-webster.com/dictionary/change Resetting states.");
            setHomepagePosts([]);
            setFetchError(null);
            setMigrationError(null);
            setResultsUrl(null);
            // REMOVED: setFailedThemes(new Set());
            setApiCheckStatus('idle');
            setApiCheckMessage(null);
            setIsCheckingApi(false);
            setIsLoading(false);
            setIsModalOpen(false);
            setModalPostContent(null);
        }
    }, 300);
    return () => clearTimeout(handler);
    // Dependencies only include things read *inside* the effect
  }, [url, resultsUrl]);


  // --- API Callbacks ---

  // Fetches V2 homepage preview data
  const fetchHomepagePreview = useCallback(async (targetUrl: string) => {
    console.log(`[Homepage Preview] Fetching for URL: ${targetUrl}`);
    setIsLoading(true);
    setFetchError(null);
    setMigrationError(null);
    setHomepagePosts([]);
    setResultsUrl(targetUrl);

    try {
        const response = await fetch("/api/homepage-preview", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ wpUrl: targetUrl }),
        });

        if (!response.ok) {
            let errorMsg = `Failed to fetch homepage preview (Status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMsg = errorData.message || errorMsg;
             } catch (e) {
                 try {
                    const errorText = await response.text();
                    errorMsg += `\nServer Response: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
                 } catch (textErr) {/* Ignore */}
             }
             if (response.status === 504) { errorMsg = `The server took too long (504 Timeout).`; }
            throw new Error(errorMsg);
        }

        const data: { homepagePosts: HomepagePost[] } = await response.json();
        if (!data.homepagePosts || data.homepagePosts.length === 0) { throw new Error("No posts found."); }

        console.log(`[Homepage Preview] Success. Received ${data.homepagePosts.length} posts.`);
        setHomepagePosts(data.homepagePosts);
        setFetchError(null);

    } catch (error: any) {
        console.error("[Homepage Preview] Fetch failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown preview fetch error.";
        setFetchError(errorMsg);
        setHomepagePosts([]);
        setResultsUrl(null);
    } finally {
        setIsLoading(false);
    }
  }, []);


  // Combined Handler for "Generate Previews" Button (V2)
  const handleGenerateClick = useCallback(async () => {
    if (!url) { setApiCheckStatus('error'); setApiCheckMessage("Please enter a site URL first."); return; }
    if (isCheckingApi || isLoading || isMigrating) return;

    const targetUrl = normalizeUrl(url);
    if (!targetUrl) { setApiCheckStatus('error'); setApiCheckMessage("Invalid URL format."); return; }
    if (resultsUrl === targetUrl && homepagePosts.length > 0) { console.log("Preview already generated."); return; }

    // Start API Check
    console.log(`[Generate Button] Starting API Check for URL: ${targetUrl}`);
    setIsCheckingApi(true);
    setApiCheckStatus('loading');
    setApiCheckMessage(null);
    setFetchError(null);
    if (resultsUrl !== targetUrl) {
         setHomepagePosts([]); setResultsUrl(null); setIsModalOpen(false); setModalPostContent(null);
    }

    let checkSuccessful = false;
    try {
        const response = await fetch("/api/check-wp-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }) });
        const result = await response.json();
        setApiCheckStatus(result.success ? 'success' : 'error');
        setApiCheckMessage(result.message);
        checkSuccessful = response.ok && result.success;
        if (!checkSuccessful) console.error(`[API Check Step] Failed: ${result.message || `Status: ${response.status}`}`);
        else console.log(`[API Check Step] Succeeded.`);
    } catch (error) {
        console.error("[API Check Step] Fetch failed:", error);
        setApiCheckStatus('error'); setApiCheckMessage("Error checking API status."); checkSuccessful = false;
    } finally {
        setIsCheckingApi(false);
    }

    // Fetch Homepage Preview if check successful
    if (checkSuccessful) {
        await fetchHomepagePreview(targetUrl);
    } else {
         setIsLoading(false); setResultsUrl(null);
    }
  }, [url, isCheckingApi, isLoading, isMigrating, resultsUrl, apiCheckStatus, homepagePosts.length, fetchHomepagePreview]);


  // Handler for Example Site Button Click
  const handleExampleClick = useCallback(async (exampleUrl: string) => {
    if (isLoading || isMigrating || isCheckingApi) return;
    const targetUrl = normalizeUrl(exampleUrl);

    setUrl(targetUrl);
    console.log(`[UI Action] Example clicked: ${targetUrl}.`);
    // Reset states
    setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null);
    setApiCheckStatus('idle'); setApiCheckMessage(null); setIsLoading(false); setIsModalOpen(false); setModalPostContent(null);

    // Start API Check
    setIsCheckingApi(true); setApiCheckStatus('loading');
    let checkSuccessful = false;
    try {
        const response = await fetch("/api/check-wp-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }) });
        const result = await response.json();
        setApiCheckStatus(result.success ? 'success' : 'error'); setApiCheckMessage(result.message);
        checkSuccessful = response.ok && result.success;
        if (!checkSuccessful) console.error(`[API Check Step - Example] Failed: ${result.message || `Status: ${response.status}`}`);
        else console.log(`[API Check Step - Example] Succeeded.`);
    } catch (error) {
        console.error("[API Check Step - Example] Fetch failed:", error);
        setApiCheckStatus('error'); setApiCheckMessage("Error checking example API status."); checkSuccessful = false;
    } finally {
        setIsCheckingApi(false);
    }

    // Fetch Homepage Preview if check successful
    if (checkSuccessful) {
        await fetchHomepagePreview(targetUrl);
    } else {
        setIsLoading(false); setResultsUrl(null);
    }
}, [isLoading, isMigrating, isCheckingApi, fetchHomepagePreview]);


  // --- Click Handlers ---
  // REMOVED: handleThemeSelectionChange function definition is gone

  // Handles clicks on post cards within the preview area
  const handlePostCardClick = useCallback((postIndex: number) => {
    if (postIndex === 0 && homepagePosts[0]?.fullContent) {
        const post = homepagePosts[0];
        setModalPostContent({ title: post.title, mdx: post.fullContent.mdx, id: post.id, link: post.link });
        setIsModalOpen(true);
    } else if (postIndex > 0) {
        toast.dismiss();
        toast("Full preview is only available for the most recent post.", { duration: 4000, position: 'bottom-center' });
    }
  }, [homepagePosts]);


  // --- Migration Handler ---
  const handleMigrate = async () => {
      const mostRecentPost = homepagePosts[0];
      if (!resultsUrl || !activeTheme || !mostRecentPost || !mostRecentPost.fullContent) {
          setMigrationError("Cannot migrate. Ensure the homepage preview has loaded successfully.");
          return;
      }
      console.log(`[Migrate V2] Starting migration for ${resultsUrl} with theme ${activeTheme}`);
      setIsMigrating(true); setMigrationError(null); setFetchError(null);

      try {
          const migrationPayload = {
              wpUrl: resultsUrl,
              theme: activeTheme,
              homepagePostsData: homepagePosts.map((post, index) => ({
                   id: post.id, title: post.title, link: post.link, excerpt: post.excerpt,
                   featuredMediaUrl: post.featuredMediaUrl, authorName: post.authorName, date: post.date,
                   fullContent: index === 0 ? post.fullContent : undefined,
              }))
          };
          const response = await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(migrationPayload) });

          if (!response.ok) {
              let errorMsg = `Migration failed! Status: ${response.status}`;
              try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) {/* ignore */}
              if (response.status === 429) { errorMsg = "Rate limit reached."; }
              throw new Error(errorMsg);
          }
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('application/zip')) { throw new Error('Server did not return a valid ZIP file.'); }

          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          const disposition = response.headers.get('Content-Disposition');
          let filename = `${activeTheme}_homepage_site.zip`;
          if (disposition && disposition.includes('filename=')) { /* ... filename parsing ... */ }
          link.setAttribute('download', filename);
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
          console.error("[Migrate V2] Failed:", error);
          setMigrationError(`${error.message || "Unknown migration error"}`);
      } finally {
          setIsMigrating(false);
      }
  };


  // --- Rendering Logic ---
  const renderSkeleton = () => ( <div className="p-6 space-y-4 animate-pulse"> <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-60 w-full" /> <Skeleton className="h-4 w-full mt-4" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" /> </div> );

  const renderPreviewArea = () => {
    const ActiveLayout = themeLayoutMap[activeTheme];
    if (isCheckingApi || isLoading) { return renderSkeleton(); }
    if (apiCheckStatus === 'error' && !isCheckingApi) { return renderSkeleton(); } // Error shown in alert
    if (fetchError && !isLoading && homepagePosts.length === 0) { return (<div className="p-4 md:p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /> <AlertTitle>Preview Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert></div>); }
    if (!resultsUrl || homepagePosts.length === 0) { return (<div className="text-center py-10 text-muted-foreground">Enter site URL & click "Generate Previews".</div>); }
    if (ActiveLayout) {
        // Pass posts data and the click handler to the layout component
        return <ActiveLayout posts={homepagePosts} onClickPost={handlePostCardClick} />;
    }
    return (<div className="p-4 text-red-600">Error: Theme layout missing.</div>);
  };

  const renderApiStatusAlert = () => {
    if (apiCheckStatus === 'idle' || (isLoading && apiCheckStatus !== 'loading')) return null;
    if (apiCheckStatus === 'success' && (isLoading || homepagePosts.length > 0)) return null;

    let variant: "default" | "destructive" | "success" = "default";
    let Icon = Info; let title = "API Status";
    if (apiCheckStatus === 'loading') { Icon = Loader2; title = "Checking API..."; variant = "default"; }
    else if (apiCheckStatus === 'success') { Icon = CheckCircle2; title = "API Check OK"; variant = "success"; }
    else if (apiCheckStatus === 'error') { Icon = AlertTriangle; title = "API Check Failed"; variant = "destructive"; }

    return ( <Alert variant={variant} className={cn("mt-4", /* color styles */)}> <Icon className={cn("h-4 w-4 mt-1 shrink-0", apiCheckStatus==='loading' && 'animate-spin')} /> <div className="ml-2"> <AlertTitle>{title}</AlertTitle> {apiCheckMessage && <AlertDescription className="whitespace-pre-wrap text-sm">{apiCheckMessage}</AlertDescription>} </div> </Alert> );
  };


  // --- Main Component Return ---
  return (
    <TooltipProvider delayDuration={100}>
      <Toaster />
      <div className="flex flex-col w-full space-y-6">

        {/* Input Card */}
        <div className="w-full">
           <Card id="input-section">
            <CardHeader className="pb-4 pt-5 px-5"> <h3 className="text-lg font-medium">Enter Site URL or Try Example</h3> </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div> <Input id="wordpress-url" type="url" placeholder="Enter Base Site URL (e.g., https://your-site.com)" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isCheckingApi || isLoading || isMigrating} /> </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"> {exampleSites.map((site) => ( <Button key={site.name} variant="secondary" size="sm" onClick={() => handleExampleClick(site.url)} disabled={isCheckingApi || isLoading || isMigrating}> {(isCheckingApi || isLoading) && normalizeUrl(url) === normalizeUrl(site.url) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {site.name} </Button> ))} </div>
              <div className="pt-2"> <Label className="pb-2 block text-sm font-medium">Select Preview Theme</Label> <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"> {themeKeys.map((themeId) => ( <Button key={`select-${themeId}`} variant={'outline'} size="default" onClick={() => setActiveTheme(themeId)} disabled={isCheckingApi || isLoading || isMigrating} className={cn("h-10 px-3", themeButtonStyles[themeId], activeTheme === themeId ? 'ring-2 ring-offset-2 ring-blue-600' : '')} > {THEMES[themeId]?.name || themeId} </Button> ))} </div> </div>
              <Button onClick={handleGenerateClick} disabled={!url || isCheckingApi || isLoading || isMigrating || (resultsUrl === normalizeUrl(url) && homepagePosts.length > 0)} className="w-full" size="lg"> {isCheckingApi ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking API...</>) : isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Previews...</>) : ("Generate Previews")} </Button>
              {renderApiStatusAlert()}
            </CardContent>
          </Card>
        </div>

         {/* Preview Window */}
         <div className="w-full">
              <div className="border rounded-lg overflow-hidden shadow-lg bg-background w-full">
                  <div className="bg-muted border-b px-4 py-2 flex items-center text-xs">
                      <div className="flex space-x-1.5"> <div className="w-2.5 h-2.5 rounded-full bg-red-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-green-500/90"></div> </div>
                      <div className="flex-1 text-center font-medium text-muted-foreground truncate px-4"> {resultsUrl ? new URL(resultsUrl).hostname : "WP Offramp Preview"} </div>
                      <div className="w-10"></div>
                  </div>
                  <div className="min-h-[500px] overflow-hidden relative w-full">
                      {renderPreviewArea()}
                  </div>
              </div>
          </div>

        {/* Migration Card */}
        {homepagePosts.length > 0 && !fetchError && resultsUrl && (
          <div className="w-full">
             <Card>
                 <CardHeader className="pb-2"> <h3 className="text-lg font-medium">Migrate & Download</h3> <p className="text-sm text-muted-foreground"> Generates Next.js project ({THEMES[activeTheme]?.name || activeTheme} theme). </p> </CardHeader>
                 <CardContent>
                 {migrationError && ( <Alert variant="destructive" className="mb-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Migration Error</AlertTitle> <AlertDescription>{migrationError}</AlertDescription> </Alert> )}
                 <Button size="lg" onClick={handleMigrate} disabled={isMigrating || isLoading || isCheckingApi || !homepagePosts[0]?.fullContent} className="w-full"> {isMigrating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Migrating...</>) : (<><Download className="mr-2 h-4 w-4" />Migrate & Download ZIP</>)} </Button>
                 <p className="text-xs text-muted-foreground mt-2 text-center"> Free migration limited per session. </p>
                 </CardContent>
             </Card>
          </div>
        )}

        {/* Modal for Detailed Post Preview */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[80%] lg:max-w-[1000px] max-h-[90vh] flex flex-col"> {/* Adjust size */}
                 <DialogHeader className="flex-shrink-0"> {/* Prevent header shrinking */}
                    <DialogTitle className="truncate pr-10">{modalPostContent?.title || "Post Preview"}</DialogTitle>
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                         <XCircle className="h-5 w-5" /> {/* Use XCircle or similar */}
                         <span className="sr-only">Close</span>
                    </DialogClose>
                 </DialogHeader>
                 <div className="overflow-y-auto p-4 flex-grow border-t"> {/* Add border, padding */}
                    {modalPostContent?.mdx && themeLayoutMap[activeTheme] ? (
                        React.createElement(themeLayoutMap[activeTheme], { mdxContent: modalPostContent.mdx })
                    ) : ( <p>Loading content...</p> )}
                 </div>
            </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}


// --- Type Definitions ---
// (Ideally move to a shared types file, e.g., types/index.ts)

// Type for the data expected for each post from /api/homepage-preview
// Ensure this matches the actual structure returned by your API route
interface HomepagePost {
  id: number;
  title: string;
  link: string;
  excerpt: string; // Assuming excerpt is pre-rendered HTML string
  featuredMediaUrl: string | null;
  authorName: string;
  date: string; // ISO 8601 date string
  fullContent?: { // Optional: only present for the first post
    originalHtml: string;
    mdx: string;
  };
}

// Type for theme constants if not already defined elsewhere
interface Theme {
    name: string;
    // Add other theme properties if needed
}

// Augment global constants type if necessary (example)
declare global {
    const THEMES: Record<ThemeKey, Theme>;
}