// components/themes/MatrixLayout.tsx (V4 - Dynamic Prompt using websiteName)
"use client";

import React from "react";
import { formatDistanceToNow } from 'date-fns'; // Import date-fns function

// --- Define HomepagePost Type (Copied from ModernLayout example) ---
interface HomepagePost {
  id: number;
  title: string;
  link: string; // Although not directly used in card rendering, keep for consistency
  excerpt: string;
  featuredMediaUrl: string | null; // Kept in type, but not used in homepage list
  authorName: string;
  date: string;
  fullContent?: {
    originalHtml: string;
    mdx: string;
  };
}

// --- Helper Functions (Keep V1 helpers) ---
function escapeRegex(string: string): string {
    if (typeof string !== 'string') return ''; // Added safety check
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseContentManually(mdxContent: string): { content: string; data: Record<string, any> } {
  if (typeof mdxContent !== 'string' || !mdxContent) { // Added safety check
    return { content: '', data: {} };
  }
  const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = mdxContent.match(frontmatterPattern);

  if (!match) {
    const titleMatch = mdxContent.match(/^#\s+(.*?)(\r?\n|$)/);
    return {
      content: mdxContent,
      data: titleMatch ? { title: titleMatch[1] } : {}
    };
  }

  const frontmatterText = match[1];
  const contentText = match[2] || ''; // Ensure contentText is string
  const data: Record<string, any> = {};

  // Improved Frontmatter Parsing (Handles edge cases better)
  if (frontmatterText) {
      if (!frontmatterText.includes('\n') && frontmatterText.includes(':')) {
          // Try parsing single-line properties
          const props = frontmatterText.split(/\s+(?=\w+:)/);
          props.forEach(prop => {
              const keyValueMatch = prop.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*?)(?:\s+#.*)?$)/);
              if (keyValueMatch) {
                  const key = keyValueMatch[1];
                  const value = keyValueMatch[2] ?? keyValueMatch[3] ?? keyValueMatch[4]; // Use nullish coalescing
                  if (key && value !== undefined) {
                      const cleanValue = value.replace(/\s+#\s+.*$/, '').trim();
                      data[key] = cleanValue;
                  }
              }
          });
      } else {
          // Multi-line parsing
          frontmatterText.split(/\r?\n/).forEach(line => {
              const keyValueMatch = line.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*))/);
              if (keyValueMatch) {
                  const key = keyValueMatch[1];
                  const value = keyValueMatch[2] ?? keyValueMatch[3] ?? keyValueMatch[4]; // Use nullish coalescing
                  if (key && value !== undefined) {
                      data[key] = value.trim();
                  }
              }
          });
      }
  }


  // Extract title from content if not in frontmatter
  if (Object.keys(data).length === 0 || !data.title) {
    const titleMatch = contentText.match(/^#\s+(.*?)(\r?\n|$)/);
    if (titleMatch) {
      data.title = titleMatch[1];
    }
  }

  // Clean content: Remove frontmatter delimiters and known metadata lines
  const contentLines = contentText.split(/\r?\n/);
  const cleanedContentLines = contentLines.filter(line => {
    return !line.match(/^---/) && // Remove --- delimiters
           !line.match(/^\s*title:\s+/) &&
           !line.match(/^\s*date:\s+/) &&
           !line.match(/^\s*author:\s+/) &&
           !line.match(/^\s*featuredImage:/i) && // Case-insensitive check
           !line.match(/^\s*featuredimage:/i); // Case-insensitive check
  });

  const cleanedContent = cleanedContentLines.join('\n');

  return { content: cleanedContent, data };
}
// --- End Helper Functions ---


// --- Define Props ---
interface MatrixLayoutProps {
  posts?: HomepagePost[];
  mdxContent?: string;
  onClickPost?: (index: number) => void;
  websiteName?: string; // ADDED website name prop
}

// --- Main Layout Component ---
export function MatrixLayout({
    posts,
    mdxContent,
    onClickPost,
    websiteName = "The Matrix" // ADDED prop destructuring and default value
}: MatrixLayoutProps) {

    // --- Scenario 1: Render Single Post MDX View (for Modal) ---
    // This section remains unchanged
    if (typeof mdxContent === 'string' && mdxContent.trim()) {
        const { content, data } = parseContentManually(mdxContent);
        const headingLines = content.split(/\r?\n/);
        let foundHeading = false;
        const filteredLines = headingLines.filter(line => {
            if (!foundHeading && line.match(/^#\s+/)) {
                foundHeading = true;
                return false;
            }
            return true;
        });
        const processedContent = filteredLines.join('\n');
        const featuredImage = data.featuredImage || data.featuredimage || '';
        let finalContentBeforeReplacements = processedContent;
        if (featuredImage) {
            try {
                const url = new URL(featuredImage);
                const baseUrl = url.origin + url.pathname;
                const markdownImgRegex = new RegExp(
                    `!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}(?:\\?[^)]*)?(?:#[^)]*)?\\s*\\)`,
                    'gi'
                );
                if (markdownImgRegex.test(finalContentBeforeReplacements)) {
                    finalContentBeforeReplacements = finalContentBeforeReplacements.replace(markdownImgRegex, '');
                    finalContentBeforeReplacements = finalContentBeforeReplacements.replace(/^\s*$/gm, '');
                }
            } catch (e) {
                 // console.warn(`MatrixLayout (Single): Invalid featuredImage URL "${featuredImage}", skipping duplicate removal.`);
            }
        }
        const finalContentForHtml = finalContentBeforeReplacements
            .replace(/^# (.*$)/gm, '<h1 style="color: #4ade80; font-family: monospace; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2;">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 style="color: #4ade80; font-family: monospace; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2;">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 style="color: #4ade80; font-family: monospace; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2;">$1</h3>')
            .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, '<img src="$2" alt="$1" title="$3" style="max-width: 100%; display: block; margin: 1.5rem 0; border: 1px solid #166534; height: auto;" />')
            .replace(/(?<!\*)\*\*(?!\*)(.*?)(?<!\*)\*\*(?!\*)/g, '<strong style="font-weight: 700; color: #86efac; font-family: monospace;">$1</strong>')
            .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em style="font-style: italic; color: #bbf7d0; font-family: monospace;">$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #22c55e; text-decoration: underline; font-family: monospace;">$1</a>')
            .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #166534; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #86efac; font-family: monospace;">$1</blockquote>')
            .replace(/^\s*[-*+] (.*$)/gm, '<li style="margin: 0.25rem 0; color: #86efac; display: list-item; font-family: monospace;">$1</li>')
            .replace(/(<li.*>[\s\S]*?<\/li>\s*)+/g, '<ul style="color: #86efac; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; width: 100%; font-family: monospace; list-style-type: disc;">$&</ul>')
            .replace(/^(?!<[h1-6ulblockquote>li]|^\s*$|^\s*[-*+>]|^\s*---)(.*?)(\r?\n|$)/gm, '<p style="color: #86efac; margin: 1rem 0; line-height: 1.6; font-family: monospace;">$1</p>\n')
            .replace(/<\/p>\n<p/g, '</p><p')
            .replace(/<\/p>\n(?!\s*<)/g, '<br style="display: block; content: \'\'; margin-top: 0.5rem;" />')
            .replace(/```([\s\S]*?)```/g, (match, codeContent) => `<pre style="background-color: #111; color: #4ade80; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; margin: 1.5rem 0; border: 1px solid #166534; width: 100%; font-family: monospace;"><code>${codeContent.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
            .replace(/`([^`]+)`/g, '<code style="background-color: #111; color: #4ade80; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace;">$1</code>');

        return (
            <div className="bg-black p-4 md:p-6 rounded-b-md w-full matrix-single-post">
                {data.title && (
                    <div className="mb-4">
                    <h1 className="text-2xl font-bold text-green-400 uppercase font-mono">{data.title}</h1>
                    {data.author && ( <p className="text-sm text-green-400 font-mono"> By <span className="font-medium">{data.author}</span> </p> )}
                    {data.date && ( <p className="text-sm text-green-400 font-mono"> {new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} </p> )}
                    </div>
                )}
                {featuredImage && (
                    <div className="mb-6">
                    <img src={featuredImage} alt={data.title || "Featured image"} className="w-full max-h-96 object-cover border border-green-800"/>
                    </div>
                )}
                <style jsx global>{`
                    /* Global Styles (Scrollbar, Base Layout) */
                    .matrix-homepage-layout, .matrix-single-post {
                         color: #00FF00;
                         font-family: "Courier New", monospace;
                    }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: #000; }
                    ::-webkit-scrollbar-thumb { background: #0f0; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #00ff00; }

                    /* Single Post Content Styles */
                    .matrix-single-post .matrix-content { color: #86efac; font-family: monospace; width: 100%; max-width: 100%; word-wrap: break-word; }
                    .matrix-single-post .matrix-content h1,
                    .matrix-single-post .matrix-content h2,
                    .matrix-single-post .matrix-content h3 { color: #4ade80; font-family: monospace; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.2; width: 100%; }
                    .matrix-single-post .matrix-content p { color: #86efac; margin: 1rem 0; line-height: 1.6; display: block; width: 100%; font-family: monospace; }
                    .matrix-single-post .matrix-content a { color: #22c55e; text-decoration: underline; font-family: monospace; }
                    .matrix-single-post .matrix-content a:hover { color: #16a34a; }
                    .matrix-single-post .matrix-content img { max-width: 100%; height: auto; margin: 1.5rem 0; border: 1px solid #166534; display: block; }
                    .matrix-single-post .matrix-content ul,
                    .matrix-single-post .matrix-content ol { color: #86efac; margin: 1rem 0 1rem 1.5rem; padding-left: 1rem; width: 100%; font-family: monospace; list-style-type: disc; }
                    .matrix-single-post .matrix-content ol { list-style-type: decimal; }
                    .matrix-single-post .matrix-content li { margin: 0.25rem 0; color: #86efac; display: list-item; font-family: monospace; }
                    .matrix-single-post .matrix-content blockquote { border-left: 4px solid #166534; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #86efac; width: 100%; font-family: monospace; }
                    .matrix-single-post .matrix-content code:not(pre code) { background-color: #111; color: #4ade80; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem; }
                    .matrix-single-post .matrix-content pre { background-color: #111; color: #4ade80; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; margin: 1.5rem 0; border: 1px solid #166534; width: 100%; font-family: monospace; }
                    .matrix-single-post .matrix-content pre code { background-color: transparent; padding: 0; border-radius: 0; font-size: inherit; color: inherit; }
                    .matrix-single-post .matrix-content em { font-style: italic; color: #bbf7d0; font-family: monospace; }
                    .matrix-single-post .matrix-content strong { font-weight: 700; color: #86efac; font-family: monospace; }
                    .matrix-single-post .matrix-content br { display: block; content: ""; margin-top: 0.5rem; }

                    /* Homepage List View Specific Styles */
                     .matrix-homepage-layout .post-card-base {
                         border: 1px solid #15803D;
                         background-color: rgba(0, 0, 0, 0.5);
                         transition: background-color 0.2s ease-in-out;
                         padding: 1rem;
                         border-radius: 0.375rem;
                         margin-bottom: 1rem; /* Spacing between cards */
                     }
                     .matrix-homepage-layout .post-card-base:hover {
                         background-color: rgba(0, 0, 0, 0.8);
                     }
                    .matrix-homepage-layout .post-card-title {
                        color: #86efac;
                        transition: color 0.2s ease-in-out;
                        display: inline; /* Keep title inline with number */
                    }
                     .matrix-homepage-layout .post-card-title:hover {
                        color: #4ade80;
                    }
                    .matrix-homepage-layout .post-card-link {
                         color: #4ade80;
                         border-bottom: 1px solid #15803D;
                         transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
                    }
                     .matrix-homepage-layout .post-card-link:hover {
                         color: #86efac;
                         border-bottom-color: #4ade80;
                     }
                    .matrix-homepage-layout .typing-animation {
                         position: relative;
                         display: inline-block;
                    }
                    .matrix-homepage-layout .typing-animation::after {
                         content: "_";
                         position: absolute;
                         right: -10px;
                         animation: matrix-blink 1s step-end infinite;
                    }
                    @keyframes matrix-blink {
                         0%, 100% { opacity: 1; }
                         50% { opacity: 0; }
                    }

                    /* CSS for Post Number */
                    .matrix-homepage-layout .matrix-post-identifier {
                        color: #4ade80; /* Brighter green */
                        font-weight: bold;
                        /* Inherits font-size (text-lg) */
                    }
                `}</style>
                <div
                    className="w-full matrix-content"
                    dangerouslySetInnerHTML={{ __html: finalContentForHtml }}
                />
            </div>
        );
    }

    // --- Scenario 2: Render Homepage View (List of Posts) ---
    else if (posts && posts.length > 0) {
        if (posts.length < 1) {
            return <div className="matrix-homepage-layout p-4 text-center text-green-400 font-mono">No posts found to display.</div>;
        }

        // Format website name for hostname
        const hostname = websiteName.toLowerCase().replace(/\s+/g, '-');
        const promptUser = "neo"; // Or maybe derive from somewhere else if needed
        const promptString = `${promptUser}@${hostname}:~$`;

        return (
            <div className="matrix-homepage-layout bg-black p-4 md:p-6 rounded-b-md w-full font-mono">
                 {/* Terminal Prompt */}
                 <div className="flex items-center mb-6">
                    {/* MODIFIED: Use dynamic prompt string */}
                    <div className="mr-2 text-green-400">{promptString}</div>
                    <div className="typing-animation text-green-300">ls -la /posts</div>
                 </div>

                 {/* Post Card Grid */}
                 <div className="grid gap-0"> {/* Using margin on cards instead of grid gap */}
                     {posts.slice(0, 3).map((post, index) => {
                         const formattedDate = post.date ? formatDistanceToNow(new Date(post.date), { addSuffix: true }) : 'Unknown date';
                         const postSlug = post.link?.split('/').filter(Boolean).pop() || `post-${post.id}`;

                         return (
                            <div
                                key={post.id}
                                data-post-index={index}
                                onClick={() => onClickPost?.(index)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickPost?.(index); }}
                                className="post-card-base cursor-pointer group" // Base styling for the card
                            >
                                <div className="flex-1"> {/* Content takes full width now */}
                                    {/* File Path simulation */}
                                    <div className="text-xs mb-1 overflow-hidden whitespace-nowrap text-ellipsis">
                                        <span className="text-green-300">file://</span>
                                        <span className="text-green-500">{postSlug}.mdx</span>
                                    </div>

                                    {/* Added Post Number and Title */}
                                    <div className="text-lg font-bold mb-2"> {/* Wrapper for number and title */}
                                        <span className="matrix-post-identifier mr-2">#{index + 1}</span>
                                        <h2 className="post-card-title">{post.title}</h2>
                                    </div>

                                    {/* Meta */}
                                    <div className="text-sm text-green-400/80">
                                        <span className="mr-4">@{post.authorName || 'unknown'}</span>
                                        <span className="opacity-70">{formattedDate}</span>
                                    </div>

                                    {/* Excerpt */}
                                    <div className="mt-2 text-sm text-green-300/90 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.excerpt || '' }} />

                                    {/* Read More simulation */}
                                    <div className="mt-3 text-xs">
                                        <span className="post-card-link">
                                            cat {postSlug}.mdx | more
                                        </span>
                                    </div>
                                </div>
                             </div>
                         );
                     })}
                 </div>

                {/* End Prompt */}
                 <div className="mt-8 flex items-center">
                    {/* MODIFIED: Use dynamic prompt string */}
                    <div className="mr-2 text-green-400">{promptString}</div>
                    <div className="typing-animation text-green-300">_</div>
                 </div>
            </div>
        );
    }

    // --- Fallback View ---
    else {
        return <div className="bg-black p-4 text-center text-green-400 font-mono">Loading preview or no content available.</div>;
    }
}