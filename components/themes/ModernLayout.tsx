// components/themes/ModernLayout.tsx (V2 - Restored V1 Manual Styling for Single Post)
"use client";

import React from "react";
import type { HomepagePost } from '@/app/api/homepage-preview/route'; // Adjust path if needed

// --- Helper Functions ---
function escapeRegex(string: string): string {
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseContentManually(mdxContent: string): { content: string; data: Record<string, any> } {
    // Keep your existing parsing logic, ensure it handles non-string input
    if (typeof mdxContent !== 'string') { return { content: '', data: {} }; }
    const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
    const match = mdxContent.match(frontmatterPattern);
    if (!match) { const titleMatch = mdxContent.match(/^#\s+(.*?)(\r?\n|$)/); return { content: mdxContent, data: titleMatch ? { title: titleMatch[1] } : {} }; }
    const frontmatterText = match[1]; const contentText = match[2]; const data: Record<string, any> = {};
    if (!frontmatterText.includes('\n')) { const props = frontmatterText.split(/\s+(?=\w+:)/); props.forEach(prop => { const kv = prop.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s][^\s]*))/); if (kv) { const k=kv[1], v=kv[2]||kv[3]||kv[4]; if (k&&v!==undefined) data[k]=v.replace(/\s+#\s+.*$/,'').trim(); } });
    } else { frontmatterText.split(/\r?\n/).forEach(line => { const kv = line.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*))/); if (kv) { const k=kv[1], v=kv[2]||kv[3]||kv[4]; if (k&&v!==undefined) data[k]=v.trim(); } }); }
    if (Object.keys(data).length === 0) { const titleMatch = contentText?.match(/^#\s+(.*?)(\r?\n|$)/); if (titleMatch) data.title = titleMatch[1]; }
    const contentToClean = contentText || ''; const cleanedArr = contentToClean.split(/\r?\n/).filter(l => !l.match(/^---/) && !l.match(/^\s*title:/) && !l.match(/^\s*date:/) && !l.match(/^\s*author:/) && !l.match(/^\s*featuredImage:/i));
    return { content: cleanedArr.join('\n'), data };
}
// --- End Helper Functions ---

// --- Define Props ---
interface ModernLayoutProps {
  posts?: HomepagePost[];
  mdxContent?: string;
  onClickPost?: (index: number) => void;
}

// --- Main Layout Component ---
export function ModernLayout({ posts, mdxContent, onClickPost }: ModernLayoutProps) {

    // --- Scenario 1: Render Single Post MDX View (for Modal) ---
    if (typeof mdxContent === 'string' && mdxContent.trim()) {
        // console.log("ModernLayout: Executing BRANCH 1 (Single Post / Modal View)");
        const { content, data } = parseContentManually(mdxContent);
        const lines = content.split(/\r?\n/);
        const cleanedLines = lines.filter(line => !line.match(/^---/) && !line.match(/^\s*title:/) && !line.match(/^\s*date:/) && !line.match(/^\s*author:/) && !line.match(/^\s*featuredImage:/i));
        let cleanedContent = cleanedLines.join('\n');
        const headingLines = cleanedContent.split(/\r?\n/);
        let foundHeading = false;
        const filteredLines = headingLines.filter(line => { if (!foundHeading && line.match(/^#\s+/)) { foundHeading = true; return false; } return true; });
        const processedContent = filteredLines.join('\n');
        const featuredImage = data.featuredImage || data.featuredimage || '';
        let finalContentBeforeReplacements = processedContent;

        // Remove duplicate featured image markdown link
        if (featuredImage) {
            const baseUrl = featuredImage.split('?')[0].split('#')[0];
            if (baseUrl) {
                const markdownImgRegex = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}\\s*\\)`, 'gi');
                if (markdownImgRegex.test(finalContentBeforeReplacements)) {
                    finalContentBeforeReplacements = finalContentBeforeReplacements.replace(markdownImgRegex, '');
                }
            }
        }

        // === ADD BACK MANUAL REPLACEMENTS ===
         const finalContentForHtml = finalContentBeforeReplacements
            .replace(/^# (.*$)/gm, "<h1>$1</h1>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,'<img src="$2" alt="$1" title="$3" style="max-width: 100%; display: block; margin: 1.5rem 0; border-radius: 0.25rem;" />')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #334155;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none; font-weight: 500;">$1</a>')
            .replace(/^> (.*$)/gm,'<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #64748b;">$1</blockquote>')
            // Paragraph logic might need careful testing/adjustment
            .replace(/^(?!<[h1-6>blockquote\s]|^\s*$)(.*?)(\r?\n|$)/gm, '<p style="color: #475569; margin: 1rem 0; line-height: 1.6;">$1</p>\n')
            .replace(/<\/p>\n<p/g, '</p><p')
        // === END MANUAL REPLACEMENTS ===

        // Render the single post view
        return (
            <div className="bg-white p-4 md:p-6 rounded-b-md w-full">
              {/* Render metadata */}
              {data.title && ( <div className="mb-4"> <h1 className="text-2xl font-bold">{data.title}</h1> {data.author && <p className="text-sm"> By <span className="font-medium">{data.author}</span> </p>} {data.date && <p className="text-sm">{new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>} {data.timeToRead && <p className="text-xs text-gray-500">{data.timeToRead} min read</p>} </div> )}
              {/* Explicitly render featured image */}
              {featuredImage && ( <div className="mb-6"> <img src={featuredImage} alt={data.title || "Featured image"} className="w-full max-h-96 object-cover rounded-md" /> </div> )}

              {/* === ADD BACK ORIGINAL V1 STYLES === */}
              <style jsx global>{`
                .modern-content { color: #475569; font-family: system-ui, -apple-system, sans-serif; width: 100%; max-width: 100%; }
                .modern-content h1, .modern-content h2, .modern-content h3, .modern-content h4, .modern-content h5, .modern-content h6 { color: #334155; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2; width: 100%; }
                .modern-content p { color: #475569; margin: 1rem 0; line-height: 1.6; display: block; width: 100%; }
                .modern-content a { color: #2563eb; text-decoration: none; font-weight: 500; }
                .modern-content a:hover { color: #1d4ed8; }
                .modern-content img { max-width: 100%; height: auto; margin: 1.5rem 0; border-radius: 0.25rem; display: block; }
                .modern-content ul, .modern-content ol { color: #475569; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; width: 100%; }
                .modern-content ul { list-style-type: disc; } .modern-content ol { list-style-type: decimal; }
                .modern-content li { margin: 0.25rem 0; color: #475569; display: list-item; }
                .modern-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #64748b; width: 100%; }
                .modern-content code:not(pre code) { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem; }
                .modern-content pre { background-color: #f8fafc; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e2e8f0; width: 100%; }
                .modern-content pre code { background-color: transparent; padding: 0; border-radius: 0; font-size: inherit; }
                .modern-content em { font-style: italic; } .modern-content strong { font-weight: 700; color: #334155; }
                .modern-content br { display: block; content: ""; margin-top: 0.5rem; }
                /* Keep V0 Homepage styles here too for simplicity, even though only needed in the other branch */
                .modern-homepage-layout .font-display { font-family: var(--font-playfair), Georgia, serif; }
                .modern-homepage-layout .post-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
                .modern-homepage-layout .post-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05); }
                .dark .modern-homepage-layout .post-card:hover { box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); }
                .modern-homepage-layout .author-avatar { border: 2px solid white; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                .dark .modern-homepage-layout .author-avatar { border: 2px solid hsl(var(--background)); }
                .modern-homepage-layout .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .modern-homepage-layout .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .modern-homepage-layout .featured-post-gradient { background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.7) 100%); }
                .modern-homepage-layout .category-badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 2rem; background-color: #e9f5ff; color: #0070f3; }
                .dark .modern-homepage-layout .category-badge { background-color: rgba(0, 112, 243, 0.2); color: #3b82f6; }
              `}</style>
              {/* === END V1 STYLES === */}

              {/* Render content using dangerouslySetInnerHTML - REMOVE PROSE CLASSES */}
              <div
                // Remove prose classes, use your original class if needed
                className="w-full modern-content"
                dangerouslySetInnerHTML={{
                  // Use the version with manual HTML/style replacements
                  __html: finalContentForHtml
                }}
              />
            </div>
          );
    }

    // --- Scenario 2: Render Homepage View ---
    else if (posts && posts.length > 0) {
        // console.log("ModernLayout: Executing BRANCH 2 (Homepage View)");
        if (posts.length < 3) {
            // Handle case with fewer than 3 posts if necessary
             return <div className="p-4 text-center text-gray-500">Not enough posts to display homepage layout.</div>;
        }
        const [featuredPost, post2, post3] = posts;

        // Render homepage using V0 structure and Tailwind + specific V0 styles from global style block above
        return (
            <div className="modern-homepage-layout bg-white dark:bg-neutral-900 p-4 md:p-6 space-y-12">
                 {/* Featured Post */}
                 <div className="featured-post post-card mb-12 cursor-pointer group" data-post-index={0} onClick={() => onClickPost?.(0)} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') onClickPost?.(0); }}>
                     <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl shadow-md">
                         <img src={featuredPost.featuredMediaUrl || '/placeholder.svg'} alt={featuredPost.title} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                         <div className="absolute inset-0 featured-post-gradient"></div>
                         <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                             <h2 className="text-3xl md:text-4xl font-display font-bold mb-3 leading-tight">{featuredPost.title}</h2>
                             <div className="text-md text-white/90 mb-4 max-w-3xl line-clamp-2" dangerouslySetInnerHTML={{ __html: featuredPost.excerpt || ''}} />
                             <div className="flex items-center mt-4">
                                 <div className="w-8 h-8 rounded-full bg-gray-700 mr-3 overflow-hidden author-avatar flex items-center justify-center"><img src="/placeholder-logo.svg" alt={featuredPost.authorName} className="object-contain w-6 h-6 invert dark:invert-0" /></div>
                                 <div>
                                     <div className="font-medium text-sm">{featuredPost.authorName}</div>
                                     <div className="text-xs text-white/80">{new Date(featuredPost.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
                 {/* Regular Posts */}
                 <h2 className="text-2xl font-display font-bold pb-4 border-b border-slate-200 dark:border-neutral-700">More Articles</h2>
                 <div className="space-y-10">
                     {[post2, post3].map((post, index) => (
                        <article key={post.id} className="post-card bg-card rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 md:flex transition-shadow hover:shadow-md cursor-pointer" data-post-index={index + 1} onClick={() => onClickPost?.(index + 1)} role="button" tabIndex={0} onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') onClickPost?.(index + 1); }}>
                            <div className="md:w-2/5 relative h-60 md:h-auto flex-shrink-0 bg-slate-100 dark:bg-neutral-800">{post.featuredMediaUrl && <img src={post.featuredMediaUrl} alt={post.title} className="object-cover w-full h-full" />}</div>
                            <div className="p-6 md:w-3/5">
                                <h3 className="text-xl font-display font-bold mb-3 leading-snug text-slate-800 dark:text-slate-100">{post.title}</h3>
                                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.excerpt || '' }} />
                                <div className="flex items-center mt-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 overflow-hidden author-avatar flex items-center justify-center"><img src="/placeholder-logo.svg" alt={post.authorName} className="object-contain w-6 h-6 invert dark:invert-0" /></div>
                                    <div>
                                        <div className="font-medium text-sm text-slate-700 dark:text-slate-300">{post.authorName}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
                                    </div>
                                </div>
                            </div>
                        </article>
                     ))}
                 </div>
            </div>
        );
    }

    // --- Fallback ---
    else {
        // console.log("ModernLayout: Executing BRANCH 3 (Fallback View)");
        return <div className="p-4 text-center text-gray-500">Loading preview or no content available.</div>;
    }
}

// --- Type Definitions ---
interface HomepagePost { id: number; title: string; link: string; excerpt: string; featuredMediaUrl: string | null; authorName: string; date: string; fullContent?: { originalHtml: string; mdx: string; }; }
interface Theme { name: string; }
declare global { const THEMES: Record<ThemeKey, Theme>; }
type ThemeKey = 'modern' | 'matrix' | 'ghibli';