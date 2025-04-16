// --- components/hero-preview.tsx ---
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Info, Mail } from "lucide-react";
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

// Dynamically import the wrapper for the waitlist form
const DynamicHeroWaitlistWrapper = dynamic(
    () => import('./hero-waitlist-wrapper').then(mod => mod.HeroWaitlistWrapper),
    {
        ssr: false, // Disable server-side rendering
        loading: () => <div className="mt-6 flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }
);

// Constants and interfaces (Assume these are correct and complete)
const themeKeys = ['modern', 'matrix', 'ghibli'] as ThemeKey[];
interface ThemeLayoutProps { posts?: HomepagePost[]; mdxContent?: string; onClickPost?: (index: number) => void; websiteName?: string; }
const themeLayoutMap: Record<ThemeKey, React.FC<ThemeLayoutProps>> = { modern: ModernLayout, matrix: MatrixLayout, ghibli: GhibliLayout, };
const normalizeUrl = (inputUrl: string): string => { let n = inputUrl.trim(); if (!n) return ""; if (!/^https?:\/\//i.test(n)) n = `https://${n}`; try { return new URL(n).origin; } catch (e) { return n; } };
const themeButtonStyles: Record<ThemeKey, string> = { modern: "bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-sans", matrix: "bg-black hover:bg-gray-900 text-green-400 border-green-700 font-mono", ghibli: "bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 font-serif", };
const exampleSites = [ { name: "Harvard Gazette", url: "https://news.harvard.edu/gazette/" }, { name: "Minimalist Baker", url: "https://minimalistbaker.com/" }, ];
type ApiCheckStatus = 'idle' | 'loading' | 'success' | 'error';
type ModalContent = { title: string; mdx: string; id: number; link: string; } | null;


export default function HeroPreview() {
    // State declarations (Assume these are correct)
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

    // Hooks and Functions (Assume these are correct)
    useEffect(() => { const handler = setTimeout(() => { const normalizedInputUrl = url ? normalizeUrl(url) : ""; if ((normalizedInputUrl && resultsUrl && normalizedInputUrl !== resultsUrl) || (!url && resultsUrl)) { setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null); setApiCheckStatus('idle'); setApiCheckMessage(null); setDisplayedSiteName(null); } }, 300); return () => clearTimeout(handler); }, [url, resultsUrl]);
    const fetchHomepagePreview = useCallback(async (targetUrl: string, siteName?: string) => { setIsLoading(true); setFetchError(null); setMigrationError(null); setResultsUrl(targetUrl); setDisplayedSiteName(siteName || null); try { const response = await fetch("/api/homepage-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }), }); if (!response.ok) { let errorMsg = `Failed (Status: ${response.status})`; try { const d = await response.json(); errorMsg = d.message || errorMsg; } catch (e) { try { const t = await response.text(); errorMsg += `: ${t.substring(0,100)}`;} catch(te){/*i*/} } if (response.status === 504) errorMsg = `Server timeout (504).`; throw new Error(errorMsg); } const data: { homepagePosts: HomepagePost[] } = await response.json(); if (!data.homepagePosts || data.homepagePosts.length === 0) { throw new Error("No posts found."); } setHomepagePosts(data.homepagePosts); setFetchError(null); if (!siteName) { try { setDisplayedSiteName(new URL(targetUrl).hostname); } catch (e) { setDisplayedSiteName(targetUrl); } } } catch (error: any) { console.error("[Homepage Preview] Fetch failed:", error); setFetchError(error instanceof Error ? error.message : "Unknown preview fetch error."); setHomepagePosts([]); setResultsUrl(null); setDisplayedSiteName(null); } finally { setIsLoading(false); } }, []);
    const checkApi = useCallback(async (targetUrl: string): Promise<boolean> => { setIsCheckingApi(true); setApiCheckStatus('loading'); setApiCheckMessage(null); try { const response = await fetch("/api/check-wp-api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wpUrl: targetUrl }) }); const result = await response.json(); setApiCheckStatus(result.success ? 'success' : 'error'); setApiCheckMessage(result.message); if (!response.ok || !result.success) { console.error(`[API Check] Failed: ${result.message || `Status: ${response.status}`}`); return false; } return true; } catch (error) { console.error("[API Check] Fetch failed:", error); setApiCheckStatus('error'); setApiCheckMessage("Error checking API status."); return false; } finally { setIsCheckingApi(false); } }, []);
    const handleGenerateClick = useCallback(async () => { if (!url) { toast.error("Please enter a site URL."); return; } if (isCheckingApi || isLoading || isMigrating) return; const targetUrl = normalizeUrl(url); if (!targetUrl) { toast.error("Invalid URL format."); return; } if (resultsUrl === targetUrl && homepagePosts.length > 0) { toast("Preview already generated.", {duration: 2000}); return; } setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null); setDisplayedSiteName(null); setIsModalOpen(false); setModalPostContent(null); const apiOk = await checkApi(targetUrl); if (apiOk) { await fetchHomepagePreview(targetUrl); } }, [url, isCheckingApi, isLoading, isMigrating, resultsUrl, homepagePosts.length, checkApi, fetchHomepagePreview]);
    const handleExampleClick = useCallback(async (site: { name: string, url: string }) => { if (isLoading || isMigrating || isCheckingApi) return; const targetUrl = normalizeUrl(site.url); setUrl(targetUrl); setHomepagePosts([]); setFetchError(null); setMigrationError(null); setResultsUrl(null); setDisplayedSiteName(null); setIsModalOpen(false); setModalPostContent(null); const apiOk = await checkApi(targetUrl); if (apiOk) { await fetchHomepagePreview(targetUrl, site.name); } }, [isLoading, isMigrating, isCheckingApi, checkApi, fetchHomepagePreview]);
    const handlePostCardClick = useCallback((postIndex: number) => { if (postIndex === 0 && homepagePosts[0]?.fullContent?.mdx) { const post = homepagePosts[0]; setModalPostContent({ title: post.title, mdx: post.fullContent.mdx, id: post.id, link: post.link }); setIsModalOpen(true); } else if (postIndex > 0) { toast.dismiss(); toast("Full preview only available for the most recent post.", { duration: 4000, position: 'bottom-center' }); } else { toast.error("Could not load post content for preview.", { duration: 3000 }); } }, [homepagePosts]);
    const handleMigrate = async () => { const mostRecentPost = homepagePosts[0]; if (!resultsUrl || !activeTheme || !mostRecentPost || !mostRecentPost.fullContent) { setMigrationError("Cannot migrate..."); return; } setIsMigrating(true); setMigrationError(null); setFetchError(null); try { const payload = { wpUrl: resultsUrl, theme: activeTheme, homepagePostsData: homepagePosts.map((p, i) => ({ ...p, fullContent: i === 0 ? p.fullContent : undefined })) }; const response = await fetch("/api/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) { let msg = `Migration failed! (Status: ${response.status})`; try{const d=await response.json(); msg=d.error||msg;}catch(e){} if(response.status===429) msg="Rate limit reached."; throw new Error(msg); } const contentType = response.headers.get('Content-Type'); if (!contentType || !contentType.includes('application/zip')) throw new Error('Server did not return ZIP.'); const blob = await response.blob(); const downloadUrl = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = downloadUrl; const disposition = response.headers.get('Content-Disposition'); let filename = `${activeTheme}_homepage_site.zip`; if (disposition?.includes('filename=')) { const matches = /filename\*?=['"]?([^'";]+)['"]?/.exec(disposition); if (matches?.[1]) filename = decodeURIComponent(matches[1]); } link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(downloadUrl); } catch (error: any) { console.error("[Migrate V2] Failed:", error); setMigrationError(`${error.message || "Unknown migration error"}`); } finally { setIsMigrating(false); } };
    const renderSkeleton = () => ( <div className="p-6 space-y-4 animate-pulse"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start"><div className="lg:col-span-2 space-y-4"><Skeleton className="h-80 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-5/6" /></div><div className="space-y-6 lg:space-y-8"><div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-5/6" /></div><div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-5/6" /></div></div></div></div> );
    const renderPreviewArea = () => { const ActiveLayout = themeLayoutMap[activeTheme]; let fallbackName = "Website Preview"; if (!displayedSiteName && resultsUrl) { try { fallbackName = new URL(resultsUrl).hostname; } catch (e) { fallbackName = resultsUrl; } } else if (!displayedSiteName && url) { try { fallbackName = new URL(normalizeUrl(url)).hostname; } catch (e) {/* ignore */} } const nameToPass = displayedSiteName || fallbackName; if (isCheckingApi || isLoading) { return renderSkeleton(); } if (apiCheckStatus === 'error' && !isCheckingApi) { return renderSkeleton(); } if (fetchError && !isLoading) { return (<div className="p-4 md:p-6"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /> <AlertTitle>Preview Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert></div>); } if (!resultsUrl && url && !fetchError) { return (<div className="text-center py-10 text-muted-foreground">Click "Generate Previews".</div>); } if (!resultsUrl && !url) { return (<div className="text-center py-10 text-muted-foreground">Enter site URL & click "Generate Previews".</div>); } if (resultsUrl && homepagePosts.length === 0 && !isLoading && !fetchError) { return renderSkeleton(); } if (ActiveLayout && homepagePosts.length > 0) { return <ActiveLayout posts={homepagePosts} onClickPost={handlePostCardClick} websiteName={nameToPass} />; } if (!ActiveLayout) return (<div className="p-4 text-red-600">Error: Theme layout component missing.</div>); return renderSkeleton(); };
    const renderApiStatusAlert = () => { if (isLoading || (homepagePosts.length > 0 && !fetchError)) return null; if (apiCheckStatus === 'idle') return null; let variant: "default" | "destructive" | "success" = "default"; let Icon = Info; let title = "API Status"; if (apiCheckStatus === 'loading') { Icon = Loader2; title = "Checking API..."; variant = "default"; } else if (apiCheckStatus === 'success') { Icon = CheckCircle2; title = "API Check OK"; variant = "success"; } else if (apiCheckStatus === 'error') { Icon = AlertTriangle; title = "API Check Failed"; variant = "destructive"; } if (apiCheckStatus === 'success' && fetchError) return null; return ( <Alert variant={variant} className="mt-4"> <Icon className={cn("h-4 w-4 mt-1 shrink-0", apiCheckStatus==='loading' && 'animate-spin')} /> <div className="ml-2"> <AlertTitle>{title}</AlertTitle> {apiCheckMessage && <AlertDescription className="whitespace-pre-wrap text-sm">{apiCheckMessage}</AlertDescription>} </div> </Alert> ); };


    // Component Return JSX
    return (
        <TooltipProvider delayDuration={100}>
            <Toaster position="bottom-center" />
            <div className="flex flex-col w-full space-y-6">
                {/* Input Card */}
                <Card id="input-section">
                    <CardHeader className="pb-4 pt-5 px-5"><h3 className="text-lg font-medium">Enter Site URL or Try Example</h3></CardHeader>
                    <CardContent className="space-y-4 px-5 pb-5">
                        <div><Input id="wordpress-url" type="url" placeholder="e.g., https://your-site.com" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isCheckingApi || isLoading || isMigrating}/></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">{exampleSites.map((site) => (<Button key={site.name} variant="secondary" size="sm" onClick={() => handleExampleClick(site)} disabled={isCheckingApi || isLoading || isMigrating}>{(isCheckingApi || isLoading) && normalizeUrl(url) === normalizeUrl(site.url) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{site.name}</Button>))}</div>
                        <div className="pt-2"><Label className="pb-2 block text-sm font-medium">Select Preview Theme</Label><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{themeKeys.map((themeId) => (<Button key={`select-${themeId}`} variant={'outline'} size="default" onClick={() => setActiveTheme(themeId)} disabled={isCheckingApi || isLoading || isMigrating} className={cn("h-10 px-3", themeButtonStyles[themeId], activeTheme === themeId ? 'ring-2 ring-offset-2 ring-blue-600' : '')}>{THEMES[themeId]?.name || themeId}</Button>))}</div></div>
                        <Button onClick={handleGenerateClick} disabled={!url || isCheckingApi || isLoading || isMigrating} className="w-full" size="lg">{isCheckingApi ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>) : isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>) : ("Generate Previews")}</Button>
                        {renderApiStatusAlert()}
                    </CardContent>
                </Card>

                {/* Preview Window */}
                <div className="w-full">
                    <div className="border rounded-lg overflow-hidden shadow-lg bg-gray-100 w-full">
                        <div className="bg-muted border-b px-4 py-2 flex items-center text-xs"><div className="flex space-x-1.5"> <div className="w-2.5 h-2.5 rounded-full bg-red-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-green-500/90"></div> </div><div className="flex-1 text-center font-medium text-muted-foreground truncate px-4"> {displayedSiteName || (resultsUrl ? new URL(resultsUrl).hostname : "WP Offramp Preview") } </div><div className="w-10"></div></div>
                        <div className="min-h-[500px] overflow-hidden relative w-full bg-white">{renderPreviewArea()}</div>
                    </div>
                </div>

                {/* --- Waitlist Form Instance REMOVED FROM HERE --- */}


                {/* Migration Card */}
                {homepagePosts.length > 0 && !fetchError && resultsUrl && (
                <Card>
                    <CardHeader className="pb-2"><h3 className="text-lg font-medium">Migrate & Download</h3><p className="text-sm text-muted-foreground">Generates Next.js project ({THEMES[activeTheme]?.name || activeTheme} theme).</p></CardHeader>
                    <CardContent>
                    {migrationError && (<Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Migration Error</AlertTitle><AlertDescription>{migrationError}</AlertDescription></Alert>)}
                    <Button size="lg" onClick={handleMigrate} disabled={isMigrating || isLoading || isCheckingApi || !homepagePosts[0]?.fullContent} className="w-full">{isMigrating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Migrating...</>) : (<><Download className="mr-2 h-4 w-4" />Migrate & Download ZIP</>)}</Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Free migration limited per session.</p>
                    </CardContent>
                </Card>
                )}
                {/* --- END Migration Card --- */}

                {/* --- MOVED: Dynam ically Imported Waitlist Form is now here --- */}
                <DynamicHeroWaitlistWrapper />

                {/* Modal Dialog */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[80%] lg:max-w-[1000px] max-h-[90vh] flex flex-col p-0">
                        <DialogHeader className="flex-shrink-0 px-6 pt-4 pb-2 pr-16 border-b"><DialogTitle className="truncate">{modalPostContent?.title || "Post Preview"}</DialogTitle></DialogHeader>
                        <div className="overflow-y-auto flex-grow">{modalPostContent?.mdx && themeLayoutMap[activeTheme] ? (React.createElement(themeLayoutMap[activeTheme], { mdxContent: modalPostContent.mdx })) : (<div className="p-6">Loading content...</div>)}</div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}