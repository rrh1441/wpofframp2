// components/themes/ModernLayout.tsx (V2 Refactored - WITH DEBUG LOGS ADDED)
"use client";

import React from "react";
// Import the HomepagePost type (ensure path is correct or define locally if needed)
import type { HomepagePost } from '@/app/api/homepage-preview/route'; // Adjust path if needed

// --- Helper Functions (from your original code) ---
function escapeRegex(string: string): string {
    // Added basic check for non-string input
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseContentManually(mdxContent: string): { content: string; data: Record<string, any> } {
  // Add a basic check for non-string input to prevent immediate errors
  if (typeof mdxContent !== 'string') {
      console.error("parseContentManually received non-string input:", mdxContent);
      return { content: '', data: {} };
  }
  const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = mdxContent.match(frontmatterPattern); // <<< This is a potential source of error if mdxContent isn't string despite outer check

  if (!match) {
    // Also ensure mdxContent is string before this match
    const titleMatch = typeof mdxContent === 'string' ? mdxContent.match(/^#\s+(.*?)(\r?\n|$)/) : null;
    return {
      content: mdxContent || '', // Ensure content is string
      data: titleMatch ? { title: titleMatch[1] } : {}
    };
  }

  const frontmatterText = match[1];
  const contentText = match[2];
  const data: Record<string, any> = {};

  // Keep your existing frontmatter parsing logic
  if (!frontmatterText.includes('\n')) {
    const props = frontmatterText.split(/\s+(?=\w+:)/);
    props.forEach(prop => {
      const keyValueMatch = prop.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s][^\s]*))/);
      if (keyValueMatch) {
        const key = keyValueMatch[1];
        const value = keyValueMatch[2] || keyValueMatch[3] || keyValueMatch[4];
        if (key && value !== undefined) {
          const cleanValue = value.replace(/\s+#\s+.*$/, '').trim();
          data[key] = cleanValue;
        }
      }
    });
  } else {
    frontmatterText.split(/\r?\n/).forEach(line => {
      const keyValueMatch = line.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*))/);
      if (keyValueMatch) {
        const key = keyValueMatch[1];
        const value = keyValueMatch[2] || keyValueMatch[3] || keyValueMatch[4];
        if (key && value !== undefined) {
          data[key] = value.trim();
        }
      }
    });
  }

  if (Object.keys(data).length === 0) {
    // Ensure contentText is string before match
    const titleMatch = typeof contentText === 'string' ? contentText.match(/^#\s+(.*?)(\r?\n|$)/) : null;
    if (titleMatch) {
      data.title = titleMatch[1];
    }
  }

  // Ensure contentText is string before split/filter
  const contentToClean = contentText || '';
  const cleanedContentArr = contentToClean.split(/\r?\n/).filter(line => {
    return !line.match(/^---\s*/) &&
           !line.match(/^\s*title:/) &&
           !line.match(/^\s*date:/) &&
           !line.match(/^\s*author:/) &&
           !line.match(/^\s*featuredImage:/i);
  });

  return { content: cleanedContentArr.join('\n'), data };
}
// --- End Helper Functions ---


// --- Define Props for V2 ---
interface ModernLayoutProps {
  posts?: HomepagePost[]; // Array of posts for homepage view
  mdxContent?: string;    // MDX string for single post view (modal)
  onClickPost?: (index: number) => void; // Callback for post clicks on homepage
}

// --- Main Layout Component ---
export function ModernLayout({ posts, mdxContent, onClickPost }: ModernLayoutProps) {

    // +++ ADDED LOGS HERE +++
    console.log("--- ModernLayout Render ---");
    console.log("Received props - posts:", posts ? `Array[${posts.length}]` : posts);
    // Log only beginning of mdxContent if it exists and is string
    const mdxSnippet = (typeof mdxContent === 'string') ? mdxContent.substring(0, 70) + '...' : mdxContent;
    console.log("Received props - mdxContent:", typeof mdxContent, mdxSnippet);
    // +++ END LOGS +++


    // --- Scenario 1: Render Single Post MDX View (for Modal) ---
    // Check if mdxContent is a valid string before processing
    if (typeof mdxContent === 'string' && mdxContent.trim()) {
        // +++ ADDED LOG HERE +++
        console.log("ModernLayout: Executing BRANCH 1 (Single Post / Modal View)");
        // --- Start: Existing Single Post Logic ---
        // Ensure parseContentManually is only called here
        const { content, data } = parseContentManually(mdxContent);

        // Clean content (remove frontmatter lines)
        const lines = content.split(/\r?\n/);
        // Keep original filters for V1 compatibility if needed
        const cleanedLines = lines.filter(line => {
            return !line.match(/^---\s*/) &&
                   !line.match(/^\s*title:/) &&
                   !line.match(/^\s*date:/) &&
                   !line.match(/^\s*author:/) &&
                   !line.match(/^\s*featuredImage:/i);
          });
        let cleanedContent = cleanedLines.join('\n');

        // Remove first heading
        const headingLines = cleanedContent.split(/\r?\n/);
        let foundHeading = false;
        const filteredLines = headingLines.filter(line => {
            if (!foundHeading && line.match(/^#\s+/)) { foundHeading = true; return false; }
            return true;
        });
        const processedContent = filteredLines.join('\n');

        // Extract featured image
        const featuredImage = data.featuredImage || data.featuredimage || '';

        // Remove duplicate featured image markdown link
        let finalContentForHtml = processedContent;
        if (featuredImage) {
            const baseUrl = featuredImage.split('?')[0].split('#')[0];
            if (baseUrl) { // Check if baseUrl is valid before creating RegExp
                const markdownImgRegex = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}\\s*\\)`, 'gi');
                if (markdownImgRegex.test(finalContentForHtml)) {
                     console.log(`ModernLayout (Single): Found duplicate featured image markdown for ${baseUrl}. Removing.`);
                     finalContentForHtml = finalContentForHtml.replace(markdownImgRegex, '');
                } else {
                     console.log(`ModernLayout (Single): Did not find duplicate markdown image for ${baseUrl}.`);
                }
            } else {
                console.log(`ModernLayout (Single): Could not extract valid base URL from featured image: ${featuredImage}`);
            }
        }

        // Render the single post view
        return (
            <div className="bg-white p-4 md:p-6 rounded-b-md w-full">
              {/* Render metadata */}
              {data.title && ( <div className="mb-4"> <h1 className="text-2xl font-bold">{data.title}</h1> {data.author && <p className="text-sm"> By <span className="font-medium">{data.author}</span> </p>} {data.date && <p className="text-sm">{new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>} {data.timeToRead && <p className="text-xs text-gray-500">{data.timeToRead} min read</p>} </div> )}
              {/* Explicitly render featured image from metadata */}
              {featuredImage && ( <div className="mb-6"> <img src={featuredImage} alt={data.title || "Featured image"} className="w-full max-h-96 object-cover rounded-md" /> </div> )}

              {/* === STYLES ARE DEFINED ONCE HERE (GLOBALLY) === */}
              <style jsx global>{`
                .modern-content { color: #475569; font-family: system-ui, -apple-system, sans-serif; width: 100%; max-width: 100%; }
                .modern-content h1, .modern-content h2, .modern-content h3, .modern-content h4, .modern-content h5, .modern-content h6 { color: #334155; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2; width: 100%; }
                .modern-content p { color: #475569; margin: 1rem 0; line-height: 1.6; display: block; width: 100%; }
                .modern-content a { color: #2563eb; text-decoration: none; font-weight: 500; }
                .modern-content a:hover { color: #1d4ed8; }
                /* Ensure images within content are also handled */
                .modern-content img { max-width: 100%; height: auto; margin: 1.5rem 0; border-radius: 0.25rem; display: block; }
                .modern-content ul, .modern-content ol { color: #475569; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; width: 100%; }
                .modern-content ul { list-style-type: disc; }
                .modern-content ol { list-style-type: decimal; }
                .modern-content li { margin: 0.25rem 0; color: #475569; display: list-item; }
                .modern-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #64748b; width: 100%; }
                .modern-content code:not(pre code) { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem; } /* Adjusted code selector */
                .modern-content pre { background-color: #f8fafc; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e2e8f0; width: 100%; }
                .modern-content pre code { background-color: transparent; padding: 0; border-radius: 0; font-size: inherit; } /* Style code inside pre */
                .modern-content em { font-style: italic; }
                .modern-content strong { font-weight: 700; color: #334155; }
                .modern-content br { display: block; content: ""; margin-top: 0.5rem; }
                /* Add styles for homepage cards if needed, prefix with layout class */
                .modern-homepage-layout .post-card:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); } /* Example hover */
                .modern-homepage-layout .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .modern-homepage-layout .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
              `}</style>

              {/* Render content using dangerouslySetInnerHTML and manual replacements */}
              <div
                className="prose prose-sm sm:prose max-w-none w-full modern-content"
                dangerouslySetInnerHTML={{
                  __html: finalContentForHtml
                    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                    .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,'<img src="$2" alt="$1" title="$3" style="max-width: 100%; display: block; margin: 1.5rem 0; border-radius: 0.25rem;" />')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #334155;">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none; font-weight: 500;">$1</a>')
                    .replace(/^> (.*$)/gm,'<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #64748b;">$1</blockquote>')
                    // Ensure paragraph logic is robust
                    .replace(/^(?!<[h1-6>blockquote\s]|^\s*$)(.*?)(\r?\n|$)/gm, '<p style="color: #475569; margin: 1rem 0; line-height: 1.6;">$1</p>\n') // Wrap lines not starting with specific tags or empty lines in <p>
                    .replace(/<\/p>\n<p/g, '</p><p') // Remove extra newline between paragraphs
                }}
              />
            </div>
          );
        // --- End: Existing Single Post Logic ---
    }

    // --- Scenario 2: Render Homepage View ---
    else if (posts && posts.length > 0) {
         // +++ ADDED LOG HERE +++
        console.log("ModernLayout: Executing BRANCH 2 (Homepage View)");
        return (
            // Apply the layout class for potential styling from the global style block
            <div className="modern-homepage-layout p-4 md:p-6 space-y-6">
                {/* Optional Title */}
                {/* <h2 className="text-2xl font-bold mb-4 text-center">Latest Posts</h2> */}
                {posts.map((post, index) => (
                    // --- Example Post Card ---
                    <div
                        key={post.id}
                        className="post-card border rounded-lg overflow-hidden shadow-sm transition-shadow hover:shadow-md cursor-pointer bg-white" // Added bg-white
                        data-post-index={index}
                        onClick={() => onClickPost?.(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickPost?.(index); }}
                    >
                        {post.featuredMediaUrl && (
                            <img
                                src={post.featuredMediaUrl}
                                // Use post title for alt text if available
                                alt={post.title || "Featured image"}
                                className="w-full h-48 object-cover" // Consistent image height
                            />
                        )}
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-slate-800">{post.title}</h3>
                            {/* Render excerpt using dangerouslySetInnerHTML */}
                            <div
                                className="text-sm text-slate-600 line-clamp-3 mb-3" // Use line-clamp utilities
                                dangerouslySetInnerHTML={{ __html: post.excerpt || '' }}
                            />
                            <div className="text-xs text-slate-400 mt-2"> {/* Adjusted colors */}
                                <span>By {post.authorName}</span> | <span>{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    // --- End Example Post Card ---
                ))}
                 {/* NO <style> tag needed here */}
            </div>
        );
    }

    // --- Fallback: Render nothing or a placeholder if neither prop is valid ---
    else {
         // +++ ADDED LOG HERE +++
        console.log("ModernLayout: Executing BRANCH 3 (Fallback View)");
        return <div className="p-4 text-center text-gray-500">Loading preview or no content available.</div>;
    }
}

// --- Type Definitions (Ensure consistency) ---
// Ideally import from a shared types file
interface HomepagePost {
    id: number;
    title: string;
    link: string;
    excerpt: string; // Assume HTML string
    featuredMediaUrl: string | null;
    authorName: string;
    date: string; // ISO 8601 date string
    fullContent?: {
      originalHtml: string;
      mdx: string;
    };
}

// Assuming Theme and ThemeKey are defined elsewhere correctly
interface Theme { name: string; /* other properties */ }
declare global { const THEMES: Record<ThemeKey, Theme>; } // Make sure THEMES is globally available or imported
type ThemeKey = 'modern' | 'matrix' | 'ghibli'; // Or import from constants