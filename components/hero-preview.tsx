// components/hero-preview.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Info, Mail } from "lucide-react"; // Added Mail
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { THEMES, ThemeKey } from "@/lib/constants";
import type { HomepagePost } from "@/app/api/homepage-preview/route";
import { cn } from "@/lib/utils";
import { ModernLayout } from './themes/ModernLayout';
import { MatrixLayout } from './themes/MatrixLayout';
import { GhibliLayout } from './themes/GhibliLayout';
import toast, { Toaster } from 'react-hot-toast';
import { WaitlistForm } from "@/components/waitlist-form"; // <-- Import the reusable component

// ... (Keep existing constants, interfaces, helper functions: themeKeys, ThemeLayoutProps, themeLayoutMap, normalizeUrl, themeButtonStyles, exampleSites, ApiCheckStatus, ModalContent)

export default function HeroPreview() {
  // NO Waitlist state needed here

  const [url, setUrl] = useState("");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("ghibli");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [apiCheckStatus, setApiCheckStatus] = useState<ApiCheckStatus>('idle');
  const [apiCheckMessage, setApiCheckMessage] = useState<string | null>(null);
  const [homepagePosts, setHomepagePosts] = useState<HomepagePost[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resultsUrl, setResultsUrl] = useState<string | null>(null);
  const [displayedSiteName, setDisplayedSiteName] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPostContent, setModalPostContent] = useState<ModalContent>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // --- Existing Hooks and Functions ---
  // ... (Keep existing useEffect, fetchHomepagePreview, checkApi, handleGenerateClick, handleExampleClick, handlePostCardClick, handleMigrate functions - they should NOT reference any waitlist state) ...
  useEffect(() => {
    const handler = setTimeout(() => {
      const normalizedInputUrl = url ? normalizeUrl(url) : "";
      if ((normalizedInputUrl && resultsUrl && normalizedInputUrl !== resultsUrl) || (!url && resultsUrl)) {
        setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null);
        setApiCheckStatus('idle'); setApiCheckMessage(null); setDisplayedSiteName(null);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [url, resultsUrl]);

  const fetchHomepagePreview = useCallback(async (targetUrl: string, siteName?: string) => {
    console.log(`[Homepage Preview] Fetching for URL: ${targetUrl}`);
    setIsLoading(true); setFetchError(null); setMigrationError(null); setResultsUrl(targetUrl); setDisplayedSiteName(siteName || null);
    try {
        const response = await fetch("/api/homepage-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }), });
        if (!response.ok) { let errorMsg = `Failed (Status: ${response.status})`; try { const d = await response.json(); errorMsg = d.message || errorMsg; } catch (e) { try { const t = await response.text(); errorMsg += `: ${t.substring(0,100)}`;} catch(te){/*i*/} } if (response.status === 504) errorMsg = `Server timeout (504).`; throw new Error(errorMsg); }
        const data: { homepagePosts: HomepagePost[] } = await response.json();
        if (!data.homepagePosts || data.homepagePosts.length === 0) { throw new Error("No posts found."); }
        setHomepagePosts(data.homepagePosts); setFetchError(null);
        if (!siteName) { try { setDisplayedSiteName(new URL(targetUrl).hostname); } catch (e) { setDisplayedSiteName(targetUrl); } }
    } catch (error: any) { console.error("[Homepage Preview] Fetch failed:", error); setFetchError(error instanceof Error ? error.message : "Unknown preview fetch error."); setHomepagePosts([]); setResultsUrl(null); setDisplayedSiteName(null);
    } finally { setIsLoading(false); }
  }, []);

  const checkApi = useCallback(async (targetUrl: string): Promise<boolean> => {
    console.log(`[API Check] Starting for URL: ${targetUrl}`);
    setIsCheckingApi(true); setApiCheckStatus('loading'); setApiCheckMessage(null);
    try {
        const response = await fetch("/api/check-wp-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }) });
        const result = await response.json(); setApiCheckStatus(result.success ? 'success' : 'error'); setApiCheckMessage(result.message);
        if (!response.ok || !result.success) { console.error(`[API Check] Failed: ${result.message || `Status: ${response.status}`}`); return false; }
        console.log(`[API Check] Succeeded.`); return true;
    } catch (error) { console.error("[API Check] Fetch failed:", error); setApiCheckStatus('error'); setApiCheckMessage("Error checking API status."); return false;
    } finally { setIsCheckingApi(false); }
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (!url) { toast.error("Please enter a site URL."); return; }
    if (isCheckingApi || isLoading || isMigrating) return;
    const targetUrl = normalizeUrl(url); if (!targetUrl) { toast.error("Invalid URL format."); return; } if (resultsUrl === targetUrl && homepagePosts.length > 0) { toast("Preview already generated.", {duration: 2000}); return; }
    setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null); setDisplayedSiteName(null); setIsModalOpen(false); setModalPostContent(null);
    const apiOk = await checkApi(targetUrl); if (apiOk) { await fetchHomepagePreview(targetUrl); }
  }, [url, isCheckingApi, isLoading, isMigrating, resultsUrl, homepagePosts.length, checkApi, fetchHomepagePreview]);

  const handleExampleClick = useCallback(async (site: { name: string, url: string }) => {
    if (isLoading || isMigrating || isCheckingApi) return;
    const targetUrl = normalizeUrl(site.url); setUrl(targetUrl);
    setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null); setDisplayedSiteName(null); setIsModalOpen(false); setModalPostContent(null);
    const apiOk = await checkApi(targetUrl); if (apiOk) { await fetchHomepagePreview(targetUrl, site.name); }
  }, [isLoading, isMigrating, isCheckingApi, checkApi, fetchHomepagePreview]);

  const handlePostCardClick = useCallback((postIndex: number) => { if (postIndex === 0 && homepagePosts[0]?.fullContent?.mdx) { const post = homepagePosts[0]; setModalPostContent({ title: post.title, mdx: post.fullContent.mdx, id: post.id, link: post.link }); setIsModalOpen(true); } else if (postIndex > 0) { toast.dismiss(); toast("Full preview only available for the most recent post.", { duration: 4000, position: 'bottom-center' }); } else { toast.error("Could not load post content for preview.", { duration: 3000 }); } }, [homepagePosts]);

  const handleMigrate = async () => { const mostRecentPost = homepagePosts[0];
    if (!resultsUrl || !activeTheme || !mostRecentPost || !mostRecentPost.fullContent) { setMigrationError("Cannot migrate..."); return; }
   console.log(`[Migrate V2] Starting migration for ${resultsUrl} with theme ${activeTheme}`); setIsMigrating(true); setMigrationError(null); setFetchError(null); try { const payload = { wpUrl: resultsUrl, theme: activeTheme, homepagePostsData: homepagePosts.map((p, i) => ({ ...p, fullContent: i === 0 ? p.fullContent : undefined })) }; const response = await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) { let msg = `Migration failed! (Status: ${response.status})`; try{const d=await response.json(); msg=d.error||msg;}catch(e){} if(response.status===429) msg="Rate limit reached."; throw new Error(msg); } const contentType = response.headers.get('Content-Type'); if (!contentType || !contentType.includes('application/zip')) throw new Error('Server did not return ZIP.'); const blob = await response.blob(); const downloadUrl = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = downloadUrl; const disposition = response.headers.get('Content-Disposition'); let filename = `${activeTheme}_homepage_site.zip`; if (disposition?.includes('filename=')) { const matches = /filename\*?=['"]?([^'";]+)['"]?/.exec(disposition); if (matches?.[1]) filename = decodeURIComponent(matches[1]); } link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(downloadUrl); } catch (error: any) { console.error("[Migrate V2] Failed:", error); setMigrationError(`${error.message || "Unknown migration error"}`); } finally { setIsMigrating(false); } };

  // --- Rendering Logic ---

  const renderSkeleton = () => (
     <div className="p-6 space-y-4 animate-pulse">
         <Skeleton className="h-8 w-3/4" />
         <Skeleton className="h-4 w-1/2" />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
             <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-80 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
             </div>
              <div className="space-y-6 lg:space-y-8">
                  <div className="space-y-3">
                     <Skeleton className="h-48 w-full" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-5/6" />
                  </div>
                  <div className="space-y-3">
                     <Skeleton className="h-48 w-full" />
                     <Skeleton className="h-5 w-full" />
                     <Skeleton className="h-5 w-5/6" />
                  </div>
              </div>
         </div>
     </div>
   );

   const renderPreviewArea = () => {
     const ActiveLayout = themeLayoutMap[activeTheme];
     let fallbackName = "Website Preview";
     if (!displayedSiteName && resultsUrl) { try { fallbackName = new URL(resultsUrl).hostname; } catch (e) { fallbackName = resultsUrl; } }
     else if (!displayedSiteName && url) { try { fallbackName = new URL(normalizeUrl(url)).hostname; } catch (e) {/* ignore */} }
     const nameToPass = displayedSiteName || fallbackName;

     if (isCheckingApi || isLoading) { return renderSkeleton(); }
     if (apiCheckStatus === 'error' && !isCheckingApi) { return renderSkeleton(); }
     if (fetchError && !isLoading) { return (<div className="p-4 md:p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /> <AlertTitle>Preview Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert></div>); }
     if (!resultsUrl && url && !fetchError) { return (<div className="text-center py-10 text-muted-foreground">Click "Generate Previews".</div>); }
     if (!resultsUrl && !url) { return (<div className="text-center py-10 text-muted-foreground">Enter site URL & click "Generate Previews".</div>); }
     if (resultsUrl && homepagePosts.length === 0 && !isLoading && !fetchError) { return renderSkeleton(); }

     if (ActiveLayout && homepagePosts.length > 0) {
       console.log("Passing websiteName to layout:", nameToPass);
       return <ActiveLayout posts={homepagePosts} onClickPost={handlePostCardClick} websiteName={nameToPass} />;
     }

     if (!ActiveLayout) return (<div className="p-4 text-red-600">Error: Theme layout component missing.</div>);
     return renderSkeleton();
   };


   const renderApiStatusAlert = () => {
     if (isLoading || (homepagePosts.length > 0 && !fetchError)) return null;
     if (apiCheckStatus === 'idle') return null;
     let variant: "default" | "destructive" | "success" = "default"; let Icon = Info; let title = "API Status";
     if (apiCheckStatus === 'loading') { Icon = Loader2; title = "Checking API..."; variant = "default"; }
     else if (apiCheckStatus === 'success') { Icon = CheckCircle2; title = "API Check OK"; variant = "success"; }
     else if (apiCheckStatus === 'error') { Icon = AlertTriangle; title = "API Check Failed"; variant = "destructive"; }
     if (apiCheckStatus === 'success' && fetchError) return null;
     return ( <Alert variant={variant} className="mt-4"> <Icon className={cn("h-4 w-4 mt-1 shrink-0", apiCheckStatus==='loading' && 'animate-spin')} /> <div className="ml-2"> <AlertTitle>{title}</AlertTitle> {apiCheckMessage && <AlertDescription className="whitespace-pre-wrap text-sm">{apiCheckMessage}</AlertDescription>} </div> </Alert> );
   };


  // --- Main Component Return ---
  return (
    <TooltipProvider delayDuration={100}>
      <Toaster position="bottom-center" />
      <div className="flex flex-col w-full space-y-6">
        {/* Input Card */}
        <Card id="input-section">
          <CardHeader className="pb-4 pt-5 px-5">
            <h3 className="text-lg font-medium">Enter Site URL or Try Example</h3>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div>
              <Input
                id="wordpress-url"
                type="url"
                placeholder="e.g., https://your-site.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isCheckingApi || isLoading || isMigrating}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {exampleSites.map((site) => (
                <Button
                  key={site.name}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExampleClick(site)}
                  disabled={isCheckingApi || isLoading || isMigrating}
                >
                  {(isCheckingApi || isLoading) && normalizeUrl(url) === normalizeUrl(site.url) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {site.name}
                </Button>
              ))}
            </div>
            <div className="pt-2">
              <Label className="pb-2 block text-sm font-medium">Select Preview Theme</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {themeKeys.map((themeId) => (
                  <Button
                    key={`select-${themeId}`}
                    variant={'outline'}
                    size="default"
                    onClick={() => setActiveTheme(themeId)}
                    disabled={isCheckingApi || isLoading || isMigrating}
                    className={cn("h-10 px-3", themeButtonStyles[themeId], activeTheme === themeId ? 'ring-2 ring-offset-2 ring-blue-600' : '')}
                  >
                    {THEMES[themeId]?.name || themeId}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleGenerateClick}
              disabled={!url || isCheckingApi || isLoading || isMigrating}
              className="w-full"
              size="lg"
            >
              {isCheckingApi ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>) : isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>) : ("Generate Previews")}
            </Button>
            {renderApiStatusAlert()}
          </CardContent>
        </Card>

        {/* Preview Window */}
        <div className="w-full">
            <div className="border rounded-lg overflow-hidden shadow-lg bg-gray-100 w-full">
                <div className="bg-muted border-b px-4 py-2 flex items-center text-xs">
                    <div className="flex space-x-1.5"> <div className="w-2.5 h-2.5 rounded-full bg-red-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-green-500/90"></div> </div>
                    <div className="flex-1 text-center font-medium text-muted-foreground truncate px-4"> {displayedSiteName || (resultsUrl ? new URL(resultsUrl).hostname : "WP Offramp Preview") } </div>
                    <div className="w-10"></div>
                </div>
                <div className="min-h-[500px] overflow-hidden relative w-full bg-white">
                    {renderPreviewArea()}
                </div>
            </div>
        </div> {/* End of Preview Window Container */}

         {/* --- ADDED Waitlist Form Instance #1 --- */}
         {/* Only show this if a preview check/load is active, or if results/error exist */}
         {(isCheckingApi || isLoading || resultsUrl || fetchError) && (
             <div className="mt-6"> {/* Added margin-top */}
                <WaitlistForm />
             </div>
         )}
         {/* --- End Waitlist Form Instance #1 --- */}


        {/* Migration Card */}
        {homepagePosts.length > 0 && !fetchError && resultsUrl && (
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-medium">Migrate & Download</h3>
              <p className="text-sm text-muted-foreground">
                Generates Next.js project ({THEMES[activeTheme]?.name || activeTheme} theme).
              </p>
            </CardHeader>
            <CardContent>
              {migrationError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Migration Error</AlertTitle>
                  <AlertDescription>{migrationError}</AlertDescription>
                </Alert>
              )}
              <Button
                size="lg"
                onClick={handleMigrate}
                disabled={isMigrating || isLoading || isCheckingApi || !homepagePosts[0]?.fullContent}
                className="w-full"
              >
                {isMigrating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Migrating...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Migrate & Download ZIP</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Free migration limited per session.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[80%] lg:max-w-[1000px] max-h-[90vh] flex flex-col p-0">
                 <DialogHeader className="flex-shrink-0 px-6 pt-4 pb-2 pr-16 border-b">
                    <DialogTitle className="truncate">{modalPostContent?.title || "Post Preview"}</DialogTitle>
                 </DialogHeader>
                 <div className="overflow-y-auto flex-grow">
                     {modalPostContent?.mdx && themeLayoutMap[activeTheme] ? (
                        React.createElement(themeLayoutMap[activeTheme], { mdxContent: modalPostContent.mdx })
                     ) : (
                        <div className="p-6">Loading content...</div>
                     )}
                 </div>
            </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}