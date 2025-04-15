// components/hero-preview.tsx (API Check folded, UI rearranged, detailed errors via API)
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Icons
import { Download, Loader2, AlertCircle, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react"; // Removed Search icon as it's no longer on default button state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Keep TooltipProvider if other tooltips might be added
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { THEMES, ThemeKey } from "@/lib/constants";
import type { PreviewResult } from "@/app/api/preview/route";
import { cn } from "@/lib/utils";

// Layout Imports
import { ModernLayout } from './themes/ModernLayout';
import { MatrixLayout } from './themes/MatrixLayout';
import { GhibliLayout } from './themes/GhibliLayout';

const themeKeys = ['modern', 'matrix', 'ghibli'] as ThemeKey[];

const themeLayoutMap: Record<ThemeKey, React.FC<{ mdxContent: string }>> = {
    modern: ModernLayout,
    matrix: MatrixLayout,
    ghibli: GhibliLayout,
};

const exampleSites = [
  { name: "Harvard Gazette", url: "https://news.harvard.edu/gazette/" },
  { name: "Minimalist Baker", url: "https://minimalistbaker.com/" },
];

const normalizeUrl = (inputUrl: string): string => {
    let normalized = inputUrl.trim();
    if (!normalized) return "";
    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    try {
        const urlObj = new URL(normalized);
        normalized = urlObj.origin + urlObj.pathname.replace(/\/$/, "") + urlObj.search + urlObj.hash;
        return normalized;
    } catch (e) {
        console.warn("Could not normalize URL, returning as is:", inputUrl);
        return inputUrl;
    }
};

const themeButtonStyles: Record<ThemeKey, string> = {
    modern: "bg-white hover:bg-gray-100 text-gray-800 border-gray-300 font-sans",
    matrix: "bg-black hover:bg-gray-900 text-green-400 border-green-700 font-mono",
    ghibli: "bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 font-serif",
};

// Type for API Check Status
type ApiCheckStatus = 'idle' | 'loading' | 'success' | 'error';


export default function HeroPreview() {
  const [url, setUrl] = useState("");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("modern");
  const [isLoading, setIsLoading] = useState(false); // Loading previews (set AFTER successful API check)
  const [previewResults, setPreviewResults] = useState<{ [key in ThemeKey]?: PreviewResult }>({});
  const [fetchError, setFetchError] = useState<string | null>(null); // Preview fetch error
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("migrated");
  const [resultsUrl, setResultsUrl] = useState<string | null>(null);
  const [failedThemes, setFailedThemes] = useState<Set<ThemeKey>>(new Set());

  // State for API Check (still needed for status/message display)
  const [apiCheckStatus, setApiCheckStatus] = useState<ApiCheckStatus>('idle');
  const [apiCheckMessage, setApiCheckMessage] = useState<string | null>(null);
  // Combined loading state for the main button's initial API check phase
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  useEffect(() => {
    // Debounce URL changes and reset states
    const handler = setTimeout(() => {
        const normalizedInputUrl = url ? normalizeUrl(url) : "";
        if ((normalizedInputUrl && resultsUrl && normalizedInputUrl !== resultsUrl) || (url === "" && resultsUrl !== null)) {
            console.log("https://www.merriam-webster.com/dictionary/change Resetting preview results and API status.");
            setPreviewResults({});
            setFetchError(null);
            setMigrationError(null);
            setResultsUrl(null);
            setFailedThemes(new Set());
            setApiCheckStatus('idle'); // Reset API status
            setApiCheckMessage(null);
            setIsCheckingApi(false); // Reset check loading state
            setIsLoading(false); // Reset preview loading state
        } else if (url === "" && (apiCheckStatus !== 'idle' || isLoading)) {
             // Also reset if URL cleared while showing status/loading
             setApiCheckStatus('idle');
             setApiCheckMessage(null);
             setIsCheckingApi(false);
             setIsLoading(false);
        }
    }, 300);
    return () => clearTimeout(handler);
  // Watch relevant states
  }, [url, resultsUrl, apiCheckStatus, isLoading]);


  // --- Preview Fetching Logic (called *after* successful API check) ---
  const fetchSingleThemePreview = async (targetUrl: string, themeKey: ThemeKey): Promise<PreviewResult> => {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wpUrl: targetUrl, theme: themeKey }),
      });
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.error || `HTTP error fetching ${themeKey}! Status: ${response.status}`);
      }
      return responseBody as PreviewResult;
  }

  const fetchAllThemePreviews = useCallback(async (targetUrl: string) => {
    // This function now assumes the API check was already successful
    const normalizedTargetUrl = normalizeUrl(targetUrl);
    console.log(`[API Batch] Fetching previews for URL: ${normalizedTargetUrl}`);

    setIsLoading(true); // Set preview loading state TRUE
    setFetchError(null);
    setMigrationError(null);
    setFailedThemes(new Set());

    if (resultsUrl !== normalizedTargetUrl) {
        console.log(`[Cache] Clearing results for new URL ('${normalizedTargetUrl}' != '${resultsUrl}')`);
        setPreviewResults({});
    }
    setResultsUrl(normalizedTargetUrl);

    // --- Promise execution remains the same ---
    const promises = themeKeys.map(themeKey =>
      fetchSingleThemePreview(normalizedTargetUrl, themeKey)
        .then(data => ({ theme: themeKey, status: 'fulfilled', value: data }))
        .catch(error => ({ theme: themeKey, status: 'rejected', reason: error }))
    );
    const results = await Promise.all(promises);

    // --- State updates remain the same ---
    const newResults: { [key in ThemeKey]?: PreviewResult } = {};
    const currentFailedThemes = new Set<ThemeKey>();
    let firstError: string | null = null;
    let firstSuccessfulTheme: ThemeKey | null = null;
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        newResults[result.theme] = result.value;
        if (!firstSuccessfulTheme) firstSuccessfulTheme = result.theme;
      } else {
        console.error(`[API Batch] Fetch failed for theme ${result.theme}:`, result.reason);
        currentFailedThemes.add(result.theme);
        if (!firstError) firstError = result.reason instanceof Error ? result.reason.message : String(result.reason);
      }
    });
    setPreviewResults(newResults);
    setFailedThemes(currentFailedThemes);
    if(firstError && Object.keys(newResults).length === 0) {
        setFetchError(firstError);
    } else {
        setFetchError(null);
    }
    setActiveTheme(newResults.modern ? 'modern' : firstSuccessfulTheme || 'modern');
    setCurrentTab('migrated');

    setIsLoading(false); // Set preview loading state FALSE
    console.log(`[API Batch] Finished. Loaded: ${Object.keys(newResults).length}, Failed: ${currentFailedThemes.size}`);

  }, [resultsUrl]); // Keep original dependencies


  // --- Combined Handler for "Generate Previews" Button ---
  const handleGenerateClick = useCallback(async () => {
    // 1. Initial Input/State Check
    if (!url) {
        setApiCheckStatus('error'); // Use API status state for input error too
        setApiCheckMessage("Please enter a URL first.");
        return;
    }
    // Prevent concurrent runs
    if (isCheckingApi || isLoading || isMigrating) {
        console.log("Generate action skipped: Already checking API, loading previews, or migrating.");
        return;
    }
    const targetUrl = normalizeUrl(url);
     if (!targetUrl) {
        setApiCheckStatus('error');
        setApiCheckMessage("Invalid URL format. Please enter a valid URL.");
        return;
    }
    // Optional: Prevent re-run if results already exist for this URL
    if (resultsUrl === targetUrl) {
         console.log("[UI Action] Previews already generated for this URL. Skipping generate.");
         // Ensure status is success if results exist
         if(apiCheckStatus !== 'success') {
            setApiCheckStatus('success');
            setApiCheckMessage("WordPress REST API was previously checked successfully for this URL.");
         }
         setFetchError(null); // Clear any transient errors
         return;
     }

    // 2. Perform API Check
    console.log(`[Generate Button] Triggered. Starting API Check for URL: ${targetUrl}`);
    setIsCheckingApi(true); // Start check loading indicator
    setApiCheckStatus('loading');
    setApiCheckMessage(null); // Clear previous message
    setFetchError(null); // Clear previous preview fetch errors
    // Reset previous results immediately if URL is different (improves UX)
    if (resultsUrl !== targetUrl) {
         setPreviewResults({});
         setResultsUrl(null);
    }


    let checkSuccessful = false;
    try {
        const response = await fetch("/api/check-wp-api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wpUrl: targetUrl }), // Send original URL for context in potential errors
        });
        const result: { success: boolean; message: string; code?: string } = await response.json();

        setApiCheckStatus(result.success ? 'success' : 'error'); // Update status based on check result
        setApiCheckMessage(result.message); // Show detailed message from backend

        if (response.ok && result.success) {
            console.log(`[API Check Step] Succeeded. Proceeding to fetch previews.`);
            checkSuccessful = true;
        } else {
             console.error(`[API Check Step] Failed: ${result.message || `Status: ${response.status}`}`);
             checkSuccessful = false;
        }

    } catch (error) {
        console.error("[API Check Step] Fetch failed:", error);
        setApiCheckStatus('error');
        // Use a generic message here as the API route provides detailed network error messages
        setApiCheckMessage("An error occurred while trying to reach the API checker. Check the browser console.");
        checkSuccessful = false;
    } finally {
        setIsCheckingApi(false); // Finish check loading indicator
    }

    // 3. Fetch Previews (only if API check was successful)
    if (checkSuccessful) {
        await fetchAllThemePreviews(targetUrl);
    } else {
         // Ensure preview loading is false if check failed
         setIsLoading(false);
         setResultsUrl(null); // Prevent showing stale results area if check fails for new URL
    }

  }, [url, isCheckingApi, isLoading, isMigrating, resultsUrl, apiCheckStatus, fetchAllThemePreviews]); // Dependencies


  const handleExampleClick = useCallback(async (exampleUrl: string) => {
    // 1. Initial State Check
    if (isLoading || isMigrating || isCheckingApi) return;
    const normalizedExampleUrl = normalizeUrl(exampleUrl);

    // Set URL and Reset States Immediately
    setUrl(normalizedExampleUrl);
    console.log(`[UI Action] Example button clicked: ${normalizedExampleUrl}. Triggering check & generate flow.`);
    setPreviewResults({});
    setFetchError(null);
    setMigrationError(null);
    setResultsUrl(null); // Clear results URL immediately
    setFailedThemes(new Set());
    setApiCheckStatus('idle'); // Reset status before check
    setApiCheckMessage(null);
    setIsLoading(false); // Ensure preview loading is off initially

    // 2. Perform API Check for Example
    setIsCheckingApi(true);
    setApiCheckStatus('loading');

    let checkSuccessful = false;
    try {
        const response = await fetch("/api/check-wp-api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wpUrl: normalizedExampleUrl }),
        });
        const result: { success: boolean; message: string; code?: string } = await response.json();

        setApiCheckStatus(result.success ? 'success' : 'error');
        setApiCheckMessage(result.message); // Show detailed message

        if (response.ok && result.success) {
            console.log(`[API Check Step - Example] Succeeded. Proceeding.`);
            checkSuccessful = true;
        } else {
             console.error(`[API Check Step - Example] Failed: ${result.message || `Status: ${response.status}`}`);
            checkSuccessful = false;
        }
    } catch (error) {
        console.error("[API Check Step - Example] Fetch failed:", error);
        setApiCheckStatus('error');
        setApiCheckMessage("An error occurred while trying to reach the API checker for the example URL.");
        checkSuccessful = false;
    } finally {
        setIsCheckingApi(false); // Finish check loading indicator
    }

    // 3. Fetch Previews for Example (only if API check was successful)
    if (checkSuccessful) {
        await fetchAllThemePreviews(normalizedExampleUrl);
    } else {
        // Ensure preview loading is false if check failed
        setIsLoading(false);
         setResultsUrl(null); // Ensure no stale results URL
    }
}, [isLoading, isMigrating, isCheckingApi, fetchAllThemePreviews]); // Dependencies


  const handleThemeSelectionChange = useCallback(async (newTheme: ThemeKey) => {
    if (isLoading || isMigrating || newTheme === activeTheme) return;

    if (previewResults[newTheme]) {
      console.log(`[UI Action] Switching to pre-loaded theme: ${newTheme}`);
      setActiveTheme(newTheme);
      setFetchError(null);
      return;
    }

    if (resultsUrl && failedThemes.has(newTheme)) {
        console.log(`[UI Action] Data for theme ${newTheme} missing. Attempting fallback fetch for URL: ${resultsUrl}`);
        setIsLoading(true);
        setFetchError(null);

        try {
            const resultData = await fetchSingleThemePreview(resultsUrl, newTheme);
            console.log(`[API Fallback] Success for theme: ${newTheme}.`);
            setPreviewResults(prev => ({ ...prev, [newTheme]: resultData }));
            setFailedThemes(prev => {
                const updated = new Set(prev);
                updated.delete(newTheme);
                return updated;
            });
            setActiveTheme(newTheme);
            setFetchError(null);
        } catch (error: any) {
            console.error(`[API Fallback] Fetch failed for theme ${newTheme}:`, error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            setFetchError(`Retry failed for theme '${THEMES[newTheme]?.name || newTheme}': ${errorMsg}`);
            setFailedThemes(prev => new Set(prev).add(newTheme));
        } finally {
            setIsLoading(false);
        }
    } else if (resultsUrl) {
         console.warn(`Theme data for ${newTheme} not found, and it wasn't marked as failed.`);
         setActiveTheme(newTheme);
         setFetchError(null);
    } else {
         console.warn(`Cannot fetch fallback for ${newTheme} as no resultsUrl is set.`);
    }
  }, [isLoading, isMigrating, activeTheme, previewResults, resultsUrl, failedThemes]);


  const handleMigrate = async () => {
      // ... (migration logic remains unchanged) ...
       if (!resultsUrl || !activeTheme || !previewResults[activeTheme]) {
        setMigrationError("Cannot migrate. Please ensure the preview for the active theme has loaded successfully."); return;
      }
      console.log(`[Migrate] Starting migration for ${resultsUrl} with theme ${activeTheme}`);
      setIsMigrating(true); setMigrationError(null); setFetchError(null);

      try {
        const response = await fetch("/api/migrate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wpUrl: resultsUrl, theme: activeTheme }),
        });

        if (!response.ok) {
          let errorMsg = `Migration failed! Status: ${response.status}`;
          try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* ignore parsing error */ }
          if (response.status === 429) { errorMsg = "Migration limit reached for this session (1 per hour). Please try again later."; }
          throw new Error(errorMsg);
        }
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/zip')) { throw new Error('Migration error: Server did not return a valid ZIP file.'); }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        const disposition = response.headers.get('Content-Disposition');
        let filename = `${activeTheme}_site.zip`;
        if (disposition && disposition.includes('filename=')) {
            const filenameRegex = /filename\*?=['"]?([^'";]+)['"]?(?:;|$)/;
            const matches = filenameRegex.exec(disposition);
            if (matches?.[1]) { filename = decodeURIComponent(matches[1].replace(/['"]/g, '')); }
        }
        link.setAttribute('download', filename);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

      } catch (error: any) { console.error("[Migrate] Migration/Download failed:", error); setMigrationError(`${error.message || "Unknown migration error"}`);
      } finally { setIsMigrating(false); }
  };

  // --- Rendering Logic ---

  const renderSkeleton = () => ( <div className="p-6 space-y-4 animate-pulse"> <Skeleton className="h-8 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-40 w-full" /> <Skeleton className="h-4 w-full mt-4" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" /> </div> );

  const renderPreviewArea = () => {
    // --- (renderPreviewArea logic remains largely unchanged) ---
    const hasAnyPreviewData = resultsUrl && Object.keys(previewResults).length > 0;
    const activePreviewData = previewResults[activeTheme];
    const firstLoadedResult = hasAnyPreviewData ? Object.values(previewResults).find(r => r !== undefined) : undefined;
    const ActiveLayout = themeLayoutMap[activeTheme];

    if (fetchError && !isLoading && resultsUrl && !hasAnyPreviewData) {
         return (<div className="p-4 md:p-6"><Alert variant="destructive" className="m-4"><AlertCircle className="h-4 w-4" /> <AlertTitle>Preview Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert></div>);
    }
    if (isCheckingApi || isLoading || (!resultsUrl && apiCheckStatus === 'idle' && !fetchError)) {
        return renderSkeleton();
    }
    if(!isLoading && !hasAnyPreviewData && resultsUrl && fetchError){
         return (<div className="p-4 md:p-6"><Alert variant="destructive" className="m-4"><AlertCircle className="h-4 w-4" /> <AlertTitle>Loading Failed</AlertTitle><AlertDescription>{fetchError || "Could not load preview data for any theme."}</AlertDescription></Alert></div>);
    }
    if (apiCheckStatus === 'error' && !isLoading && !isCheckingApi) {
        // Show skeleton here, error message is shown in the alert near input
        return renderSkeleton();
    }
     if (!url && !resultsUrl) {
        return (<div className="text-center py-10 text-muted-foreground">Enter a URL and click "Generate Previews".</div>);
     }

    if (!hasAnyPreviewData && !isLoading && !isCheckingApi && apiCheckStatus !== 'error') {
         return (<div className="text-center py-10 text-muted-foreground">
             {fetchError ? `Preview loading failed: ${fetchError}` : (apiCheckStatus === 'success' ? 'Loading previews...' : 'Generate previews to see the results here.')}
         </div>);
    }

     return (
       <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
          <div className="border-b px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between min-h-[50px]">
             <TabsList className="grid w-full sm:w-auto grid-cols-2">
                 <TabsTrigger value="original" disabled={!firstLoadedResult}>Original HTML</TabsTrigger>
                 <TabsTrigger value="migrated" disabled={!activePreviewData}>Preview Theme</TabsTrigger>
             </TabsList>
         </div>
         <TabsContent value="original" className="p-4 md:p-6 overflow-auto border-t sm:border-t-0 rounded-b-md flex-grow bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {!firstLoadedResult ? <div className="text-muted-foreground p-4">Original content could not be loaded.</div> : (
               <>
                 <h2 className="text-xl font-semibold border-b pb-2 mb-4">{firstLoadedResult.title || 'Original Content'}</h2>
                  {firstLoadedResult.author && firstLoadedResult.date && (<div className="text-xs text-muted-foreground mb-4">By {firstLoadedResult.author} on {new Date(firstLoadedResult.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>)}
                  <div className="prose prose-sm sm:prose max-w-none" dangerouslySetInnerHTML={{ __html: firstLoadedResult.originalHtml || "<p>Original content not available.</p>" }}/>
               </>
           )}
         </TabsContent>
         <TabsContent value="migrated" className="p-4 md:p-6 overflow-auto border-t sm:border-t-0 rounded-b-md flex-grow bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
             <div className="min-h-[300px] relative">
                {!activePreviewData ? (
                   <div className="text-center py-10 text-muted-foreground">
                       {failedThemes.has(activeTheme)
                           ? `Preview for '${THEMES[activeTheme]?.name || activeTheme}' failed to load. Click its button to retry.`
                           : `Preview data for '${THEMES[activeTheme]?.name || activeTheme}' is unavailable. Select another theme.`
                       }
                  </div>
                 ) : (
                  ActiveLayout && <ActiveLayout mdxContent={activePreviewData.mdx || ""} />
                )
               }
             </div>
         </TabsContent>
       </Tabs>
     );
  };


  // --- API Status Alert Rendering ---
  const renderApiStatusAlert = () => {
    // Show only when not idle and not actively loading previews (isLoading)
    // Exception: Show loading state even if isLoading might be true briefly later
    if (apiCheckStatus === 'idle' || (isLoading && apiCheckStatus !== 'loading')) return null;

    let variant: "default" | "destructive" | "success" = "default";
    let Icon = Info;
    let title = "API Status";

    if (apiCheckStatus === 'loading') {
        Icon = Loader2;
        title = "Checking API Status...";
        variant = "default";
    } else if (apiCheckStatus === 'success') {
        // Hide persistent success message once previews start loading or are loaded
        if (isLoading || resultsUrl) return null;
        Icon = CheckCircle2;
        title = "API Check Successful";
        variant = "success";
    } else if (apiCheckStatus === 'error') {
        Icon = AlertTriangle;
        title = "API Check Failed"; // Title is simple, message below has details
        variant = "destructive";
    }

    // Use whitespace-pre-wrap to respect newlines in the detailed error messages
    return (
        <Alert variant={variant} className={cn(
            "mt-4 transition-opacity duration-300",
             apiCheckStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300' : '',
             apiCheckStatus === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300' : '',
        )}>
            <Icon className={cn("h-4 w-4 mt-1 flex-shrink-0", apiCheckStatus === 'loading' ? 'animate-spin' : '')} />
            <div className="ml-2"> {/* Added div for better alignment */}
                <AlertTitle>{title}</AlertTitle>
                {apiCheckMessage && (
                    <AlertDescription className="whitespace-pre-wrap text-sm">
                        {apiCheckMessage}
                    </AlertDescription>
                 )}
            </div>
        </Alert>
    );
  };


  // --- Main Component Return ---
  return (
    <TooltipProvider delayDuration={100}>
    <div className="flex flex-col w-full space-y-6">

      {/* Top Section - Input & Actions */}
      <div className="w-full">
         <Card id="input-section" className="border rounded-lg shadow-sm">
          <CardHeader className="pb-4 pt-5 px-5">
             <h3 className="text-lg font-medium">Enter URL or Try an Example</h3>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {/* URL Input */}
            <div>
                 <Input
                    id="wordpress-url"
                    type="url"
                    placeholder="Enter Your URL Here (e.g., https://your-site.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 text-base sm:text-sm"
                    aria-label="WordPress Site URL"
                    disabled={isCheckingApi || isLoading || isMigrating}
                />
            </div>

             {/* Example Site Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                 {exampleSites.map((site) => (
                  <Button
                    key={site.name}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExampleClick(site.url)}
                    disabled={isCheckingApi || isLoading || isMigrating}
                    className="font-normal justify-center text-center h-9"
                  >
                     {(isCheckingApi || isLoading) && normalizeUrl(url) === normalizeUrl(site.url) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                     {site.name}
                  </Button>
                ))}
              </div>

             {/* Moved: Initial Theme Selection Buttons */}
             <div className="pt-2">
                <Label className="pb-2 block text-sm font-medium">Select Preview Theme</Label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {themeKeys.map((themeId) => {
                         const hasFailed = resultsUrl && failedThemes.has(themeId);
                         const isLoaded = resultsUrl && !!previewResults[themeId];
                         const isDisabled = isCheckingApi || isLoading || isMigrating || (hasFailed && !isLoaded);

                         return (
                             <Button
                                key={`select-${themeId}`}
                                variant={'outline'}
                                size="default"
                                onClick={() => handleThemeSelectionChange(themeId)}
                                disabled={isDisabled}
                                className={cn(
                                    "h-10 px-3 justify-center border transition-all duration-150 ease-in-out relative",
                                    themeButtonStyles[themeId],
                                    activeTheme === themeId ? 'ring-2 ring-offset-2 ring-blue-600 shadow-md scale-105 font-semibold' : 'font-normal opacity-90 hover:opacity-100',
                                    hasFailed ? 'border-red-500 text-red-600 opacity-70 hover:opacity-80' : '',
                                    isDisabled && !isLoading && !isCheckingApi ? 'cursor-not-allowed opacity-70' : ''
                                )}
                                title={hasFailed ? `Loading failed for ${THEMES[themeId]?.name || themeId}. Click to retry.` : `Select ${THEMES[themeId]?.name || themeId} Theme`}
                             >
                                 {THEMES[themeId]?.name || themeId}
                             </Button>
                         );
                    })}
                  </div>
            </div>

            {/* Generate Button (Text Changed) */}
             <Button
                onClick={handleGenerateClick}
                disabled={!url || isCheckingApi || isLoading || isMigrating || (resultsUrl === normalizeUrl(url))}
                className="w-full px-6" size="lg"
            >
                 {isCheckingApi ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking API...</>
                 ) : isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Previews...</>
                 ) : (
                     // Text Changed Here
                    "Generate Previews"
                 )}
            </Button>

            {/* Render API Status Alert */}
            {renderApiStatusAlert()}

          </CardContent>
        </Card>
      </div>

       {/* Preview Window Section */}
       <div className="w-full">
            <div className="border rounded-lg overflow-hidden shadow-lg bg-background w-full">
                <div className="bg-muted border-b px-4 py-2 flex items-center text-xs">
                    <div className="flex space-x-1.5"> <div className="w-2.5 h-2.5 rounded-full bg-red-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/90"></div> <div className="w-2.5 h-2.5 rounded-full bg-green-500/90"></div> </div>
                    <div className="flex-1 text-center font-medium text-muted-foreground truncate px-4">{previewResults[activeTheme]?.title || (apiCheckStatus === 'error' ? "API Check Failed" : (isLoading || isCheckingApi ? "Loading..." : "WP Offramp Preview"))}</div>
                    <div className="w-10"></div>
                </div>
                <div className="min-h-[500px] overflow-hidden relative w-full">
                    {renderPreviewArea()}
                </div>
            </div>
        </div>

      {/* Migration Card Section */}
      {resultsUrl && Object.keys(previewResults).length > 0 && previewResults[activeTheme] && !fetchError && (
        <div className="w-full">
           <Card>
               <CardHeader className="pb-2">
                   <h3 className="text-lg font-medium">Migrate & Download</h3>
                   <p className="text-sm text-muted-foreground"> Generates a complete Next.js project for the <span className="font-medium">{THEMES[activeTheme]?.name || activeTheme}</span> theme. </p>
               </CardHeader>
               <CardContent>
               {migrationError && ( <Alert variant="destructive" className="mb-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Migration Error</AlertTitle> <AlertDescription>{migrationError}</AlertDescription> </Alert> )}
               <Button size="lg" onClick={handleMigrate} disabled={isMigrating || isLoading || !previewResults[activeTheme]} className="w-full">
                   {isMigrating ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Migrating & Zipping...</> ) : ( <><Download className="mr-2 h-4 w-4" />Migrate & Download ZIP ({THEMES[activeTheme]?.name || activeTheme} Theme)</> )}
               </Button>
               <p className="text-xs text-muted-foreground mt-2 text-center"> Free migration limited to one page per session (per browser, resets hourly). </p>
               </CardContent>
           </Card>
        </div>
      )}
      {/* Message if results loaded but active theme is missing */}
      {resultsUrl && Object.keys(previewResults).length > 0 && !previewResults[activeTheme] && !isLoading && !isCheckingApi &&(
          <div className="text-center text-muted-foreground p-4 border rounded-md bg-muted">
              {failedThemes.has(activeTheme)
                  ? `Preview for '${THEMES[activeTheme]?.name || activeTheme}' failed to load initially. Click its button above to retry.`
                  : `Preview data for '${THEMES[activeTheme]?.name || activeTheme}' is unavailable. Select another theme.`
              }
          </div>
      )}

    </div>
    </TooltipProvider>
  );
}