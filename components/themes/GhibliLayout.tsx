// components/themes/GhibliLayout.tsx (Updated)
"use client";

import React from "react";
import { Playfair_Display, Lora } from "next/font/google";
import Image from 'next/image';

// --- Define HomepagePost Type (Unchanged) ---
interface HomepagePost { id: number; title: string; link: string; excerpt: string; featuredMediaUrl: string | null; authorName: string; date: string; fullContent?: { originalHtml: string; mdx: string; }; }

// --- Font Setup (Unchanged) ---
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "700"], display: 'swap', });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "700"], style: ["normal", "italic"], display: 'swap', });

// --- Helper Functions (Unchanged - Strict V1 Parsing) ---
function escapeRegex(string: string): string { if (typeof string !== 'string') return ''; return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function parseContentManually(mdxContent: string): { content: string; data: Record<string, any> } { /* ... V1 Parsing Logic ... */ if (typeof mdxContent !== 'string') return { content: '', data: {} }; const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/; const match = mdxContent.match(frontmatterPattern); let contentText = mdxContent; let frontmatterText = ''; const data: Record<string, any> = {}; if (match) { frontmatterText = match[1]; contentText = match[2] || ''; if (frontmatterText) { if (!frontmatterText.includes('\n') && frontmatterText.includes(':')) { const props = frontmatterText.split(/\s+(?=\w+:)/); props.forEach(prop => { const kv = prop.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*?)(?:\s+#.*)?$)/); if (kv) { const k=kv[1], v=kv[2]??kv[3]??kv[4]; if(k&&v!==undefined) data[k]=v.replace(/\s+#\s+.*$/,'').trim(); } }); } else { frontmatterText.split(/\r?\n/).forEach(line => { const kv = line.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*))/); if (kv) { const k=kv[1], v=kv[2]??kv[3]??kv[4]; if(k&&v!==undefined) data[k]=v.trim(); } }); } } } if (Object.keys(data).length === 0 || !data.title) { const titleMatch = contentText.match(/^#\s+(.*?)(\r?\n|$)/); if (titleMatch) { data.title = titleMatch[1].trim(); } } const cleanedContent = contentText.split(/\r?\n/).filter(line => !line.match(/^---/) && !line.match(/^\s*(title|date|author|featuredImage|featuredimage):/i)).join('\n'); return { content: cleanedContent, data }; }

// --- Define Props (Unchanged) ---
interface GhibliLayoutProps { posts?: HomepagePost[]; mdxContent?: string; onClickPost?: (index: number) => void; websiteName?: string; }

// --- Main Layout Component ---
export function GhibliLayout({ posts, mdxContent, onClickPost, websiteName = "My Ghibli Site" }: GhibliLayoutProps) {

  // ========================================================================
  // === Scenario 1: Render Single Post Detail Mode (Strict V1 Replication) ===
  // ========================================================================
  if (typeof mdxContent === 'string' && mdxContent.trim()) {
    // --- Start V1 Logic Block (Unchanged from previous correct version) ---
    const { content, data } = parseContentManually(mdxContent);
    const headingLines = content.split(/\r?\n/); let foundHeading = false; const filteredLines = headingLines.filter(line => { if (!foundHeading && line.match(/^#\s+/)) { foundHeading = true; return false; } return true; }); const processedContent = filteredLines.join('\n');
    const featuredImage = data.featuredImage || data.featuredimage || ''; let finalContentForHtml = processedContent;
    if (featuredImage) { try { const url = new URL(featuredImage); const baseUrl = url.origin + url.pathname; const markdownImgRegex = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}[^)]*\\)`, 'gi'); if (markdownImgRegex.test(finalContentForHtml)) { finalContentForHtml = finalContentForHtml.replace(markdownImgRegex, ''); finalContentForHtml = finalContentForHtml.replace(/^\s*$/gm, ''); } } catch (e) { console.warn("V1 LOGIC: Could not parse featuredImage URL for regex:", featuredImage, e); const simpleImgTag = `![](${featuredImage})`; if (finalContentForHtml.includes(simpleImgTag)){ finalContentForHtml = finalContentForHtml.replace(simpleImgTag, ''); finalContentForHtml = finalContentForHtml.replace(/^\s*$/gm, ''); } } }
    return ( <div className={`ghibli-modal-content bg-gradient-to-b from-sky-100 to-blue-50 p-4 md:p-6 rounded-md w-full shadow-md border border-blue-100 ${playfair.variable} ${lora.variable}`}> {data.title && ( <div className="mb-6 w-full text-center border-b border-blue-200 pb-4"> <h1 className="text-3xl font-bold text-blue-800 mb-2" style={{fontFamily: 'var(--font-playfair), serif'}}>{data.title}</h1> {data.author && ( <p className="text-sm text-blue-600" style={{fontFamily: 'var(--font-lora), serif'}}> By <span className="font-medium italic">{data.author}</span> </p> )} {data.date && ( <p className="text-sm text-blue-500" style={{fontFamily: 'var(--font-lora), serif'}}> {new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", })} </p> )} {data.timeToRead && ( <p className="text-xs text-blue-400 mt-1">{data.timeToRead} min read</p> )} </div> )} {featuredImage && ( <div className="mb-8 flex justify-center"> <img src={featuredImage} alt={data.title || "Featured image"} className="max-w-full max-h-96 object-cover rounded-lg shadow-lg border-4 border-white" /> </div> )} <style jsx global>{` /* --- V1 Styles (Unchanged) --- */ :root { --font-playfair: ${playfair.style.fontFamily}; --font-lora: ${lora.style.fontFamily}; } .ghibli-content { color: #334155; font-family: var(--font-lora), Georgia, serif; width: 100%; max-width: 100%; line-height: 1.8; font-size: 1.05rem; } /* ... other V1 styles ... */ .ghibli-content h1, .ghibli-content h2, .ghibli-content h3, .ghibli-content h4, .ghibli-content h5, .ghibli-content h6 { color: #1e3a8a; font-family: var(--font-playfair), serif; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.3; width: 100%; position: relative; } .ghibli-content h1::after, .ghibli-content h2::after { content: ""; position: absolute; bottom: -0.5rem; left: 0; width: 100%; max-width: 60px; height: 2px; background: linear-gradient(to right, #93c5fd, transparent); } .ghibli-content p { color: #334155; margin: 1.2rem 0; line-height: 1.8; } .ghibli-content a { color: #2563eb; text-decoration-line: underline; text-decoration-style: wavy; text-decoration-color: #93c5fd; transition: all 0.3s ease; } .ghibli-content a:hover { color: #1d4ed8; text-decoration-color: #60a5fa; } .ghibli-content img { max-width: 100%; height: auto; margin: 2rem auto; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 4px solid white; display: block; } .ghibli-content ul, .ghibli-content ol { color: #334155; margin: 1.2rem 0 1.2rem 1.5rem; padding-left: 1rem; width: 100%; } .ghibli-content ul { list-style-type: disc; } .ghibli-content ol { list-style-type: decimal; } .ghibli-content li { margin: 0.5rem 0; color: #334155; padding-left: 0.25rem; } .ghibli-content blockquote { border-left: 4px solid #93c5fd; padding: 1rem 1.5rem; margin: 2rem 0; font-style: italic; color: #334155; width: 100%; background-color: rgba(224, 242, 254, 0.5); border-radius: 0 0.5rem 0.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); } .ghibli-content code:not(pre code) { background-color: #e0f2fe; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; color: #0369a1; font-size: 0.9em; } .ghibli-content pre { background-color: #f0f9ff; padding: 1.5rem; border-radius: 0.5rem; overflow-x: auto; margin: 2rem 0; border: 1px solid #bae6fd; width: 100%; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); } .ghibli-content pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: inherit !important; } .ghibli-content em { font-style: italic; color: #475569; } .ghibli-content strong { font-weight: 700; color: #1e40af; } `}</style> <div className="prose prose-sm sm:prose max-w-none w-full ghibli-content" dangerouslySetInnerHTML={{ __html: finalContentForHtml .replace( /^# (.*$)/gm, '<h1 style="color: #1e3a8a; font-family: var(--font-playfair), serif; font-weight: 700; position: relative;">$1</h1>' ) .replace( /^## (.*$)/gm, '<h2 style="color: #1e3a8a; font-family: var(--font-playfair), serif; font-weight: 700; position: relative;">$1</h2>' ) .replace( /^### (.*$)/gm, '<h3 style="color: #1e3a8a; font-family: var(--font-playfair), serif; font-weight: 700;">$1</h3>' ) .replace( /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, '<img src="$2" alt="$1" title="$3" style="max-width: 100%; height: auto; margin: 2rem auto; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 4px solid white; display: block;" />' ) .replace( /(?<!\*)\*\*(?!\*)(.*?)(?<!\*)\*\*(?!\*)/g, '<strong style="font-weight: 700; color: #1e40af;">$1</strong>' ) .replace( /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em style="font-style: italic; color: #475569;">$1</em>' ) .replace( /\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration-line: underline; text-decoration-style: wavy; text-decoration-color: #93c5fd;">$1</a>' ) .replace( /^> (.*$)/gm, '<blockquote style="border-left: 4px solid #93c5fd; padding: 1rem 1.5rem; margin: 2rem 0; font-style: italic; color: #334155; background-color: rgba(224, 242, 254, 0.5); border-radius: 0 0.5rem 0.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">$1</blockquote>' ) .replace( /^\s*[-*+] (.*$)/gm, '<li>$1</li>' ) .replace( /(<li>[\s\S]*?<\/li>\s*)+/g, '<ul>$&</ul>' ) .replace( /^(?!\s*<[h1-6ulblockquote>lipre]|^\s*$|^\s*[-*+>])(.*?)(?:\r?\n|$)/gm, '<p style="color: #334155; margin: 1.2rem 0; line-height: 1.8;">$1</p>\n' ) .replace( /<\/p>\n<p/g, '</p><p' ) .replace( /```([\s\S]*?)```/g, (m, c) => `<pre><code>${c.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>` ) .replace( /`([^`]+)`/g, '<code>$1</code>' ) }} /> </div> );
    // --- End V1 Logic Block ---
  }


  // ==================================================================
  // === Scenario 2: Render Homepage Preview Mode (Ghibli Styled) ===
  // ==================================================================
  else if (posts && posts.length > 0) {
    const featuredPost = posts[0];
    const stackedPosts = posts.slice(1, 3);

    // --- Card Rendering Function (for Homepage) ---
    const renderHomepageCard = (post: HomepagePost, index: number, isFeatured: boolean) => {
      if (!post) return null;
      const cardClass = isFeatured ? 'featured-card' : 'stacked-card';
      
      // Use 16/9 aspect ratio for the featured post to make it more banner-like
      const imageContainerClass = isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]';
      
      // Title styling based on card type
      const titleClass = isFeatured ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl';
      const excerptLines = isFeatured ? 'line-clamp-3' : 'line-clamp-2';

      return (
        <div
          key={post.id}
          className={`post-card ${cardClass} flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border border-gray-200 bg-white group`}
          onClick={() => onClickPost?.(index)}
          role="button" tabIndex={0} aria-label={`Read more about ${post.title}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickPost?.(index); }}
        >
          {/* Image Container */}
          {post.featuredMediaUrl && (
            <div className={`relative w-full ${imageContainerClass} flex-shrink-0 overflow-hidden bg-gray-100`}>
              <Image
                src={post.featuredMediaUrl}
                alt={post.title}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
                sizes={isFeatured ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
                priority={index === 0}
                unoptimized={!post.featuredMediaUrl.startsWith('/')}
              />
            </div>
          )}
          {/* Content */}
          <div className="card-content flex flex-col p-4 md:p-6">
            <h3 className={`card-title ${titleClass} font-semibold mb-2`}>{post.title}</h3>
            <div className={`card-excerpt text-sm md:text-base text-gray-600 ${excerptLines} mb-3`} dangerouslySetInnerHTML={{ __html: post.excerpt || '' }} />
            <div className="card-meta text-xs md:text-sm text-gray-500 pt-2 border-t border-gray-100">
              <span>{post.authorName}</span> | <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>
      );
    };
    // --- End Card Rendering Function ---

    return (
      <>
        {/* Separate style tag with enhanced styling for cloud pattern and gradient */}
        <style jsx global>{`
          /* Global styles for Ghibli Layout */
          :root {
            --font-playfair: ${playfair.style.fontFamily};
            --font-lora: ${lora.style.fontFamily};
          }
          
          /* Enhanced background styling for the homepage layout */
          .ghibli-homepage-layout {
            /* Base color */
            background-color: #e6f0f8; 
            /* Important: Make the gradient and pattern more visible */
            background-image: 
              linear-gradient(to bottom, rgba(230, 240, 252, 0.7) 0%, rgba(198, 218, 245, 0.8) 100%),
              url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M87.5 50c0-11.47-3.49-21.93-9.25-30.18-.88-1.29-2.55-1.7-3.83-.8l-3.72 2.5c-1 .67-1.38 1.94-.93 3 1.5 3.5 2.23 7.44 2.23 12C71.99 49.19 64.85 61 55 66.39c-.83.45-1.3 1.37-1.17 2.3l1 5.42c.23 1.27 1.4 2.17 2.67 2 .25 0 .5-.02.75-.05C76.83 72.5 87.5 62.41 87.5 50zM50 87.5c-11.47 0-21.93-3.49-30.18-9.25-1.29-.88-1.7-2.55-.8-3.83l2.5-3.72c.67-1 1.94-1.38 3-.93 3.5 1.5 7.44 2.23 12 2.23 13.38 0 24.83-7.13 30.55-17.01.45-.83 1.37-1.3 2.3-1.17l5.42 1c1.27.23 2.17 1.4 2 2.67 0 .25-.02.5-.05.75-3.33 15.57-18.09 28.76-26.74 28.76zm-3.98-13.13L41.5 70.67c-1-.67-1.38-1.94-.93-3 1.5-3.5 2.23-7.44 2.23-12 0-13.38-7.13-24.83-17.01-30.55-.83-.45-1.3-1.37-1.17-2.3l1-5.42c.23-1.27 1.4-2.17 2.67-2 .25 0 .5.02.75-.05 15.57 3.33 28.76 18.09 28.76 26.74 0 11.47-3.49 21.93-9.25 30.18-.88 1.29-2.55 1.7-3.83.8zM12.5 50c0 11.47 3.49 21.93 9.25 30.18.88 1.29 2.55 1.7 3.83.8l3.72-2.5c1-.67 1.38-1.94.93-3-1.5-3.5-2.23-7.44-2.23-12 0-13.38 7.13-24.83 17.01-30.55.83-.45 1.3-1.37-1.17-2.3l-1-5.42c-.23-1.27-1.4-2.17-2.67-2 0-.25.02-.5.05-.75C25.17 27.5 12.5 37.59 12.5 50z' fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E");
            background-attachment: fixed;
            background-repeat: repeat;
            padding: 2rem 0;
          }
          
          /* Ghibli theme styling with enhanced visuals */
          .ghibli-homepage-layout .page-header h1 { 
            font-family: var(--font-playfair), serif; 
            color: #3a5d80; 
            text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
            letter-spacing: 0.02em;
          }
          
          .ghibli-homepage-layout .page-header .divider { 
            background: linear-gradient(to right, transparent, #8cacd1, transparent);
            height: 2px; 
          }
          
          .ghibli-homepage-layout .post-card { 
            background-color: #ffffff; 
            border: 1px solid #c6d8ec; 
            transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; 
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(160, 174, 192, 0.1);
          }
          
          .ghibli-homepage-layout .post-card:hover { 
            transform: translateY(-4px); 
            box-shadow: 0 10px 25px rgba(100, 120, 140, 0.15); 
          }
          
          .ghibli-homepage-layout .featured-card {
            margin-bottom: 1.5rem;
          }
          
          .ghibli-homepage-layout .card-content { 
            font-family: var(--font-lora), serif; 
          }
          
          .ghibli-homepage-layout .card-title { 
            font-family: var(--font-playfair), serif; 
            color: #2c4a6b;
            line-height: 1.2;
          }
          
          .ghibli-homepage-layout .card-excerpt { 
            color: #4d6580; 
            line-height: 1.6;
          }
          
          .ghibli-homepage-layout .card-meta { 
            color: #7590ad; 
            border-top-color: #edf2f7; 
            font-style: italic;
          }
          
          .line-clamp-2 { 
            display: -webkit-box; 
            -webkit-line-clamp: 2; 
            -webkit-box-orient: vertical; 
            overflow: hidden; 
          }
          
          .line-clamp-3 { 
            display: -webkit-box; 
            -webkit-line-clamp: 3; 
            -webkit-box-orient: vertical; 
            overflow: hidden; 
          }
        `}</style>

        {/* Main container with enhanced Ghibli theme */}
        <div className={`ghibli-homepage-layout min-h-screen ${playfair.variable} ${lora.variable}`}>
          {/* Centered Content Container */}
          <div className="content-wrapper max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="page-header mb-8 md:mb-12 text-center">
              <h1 className="text-4xl md:text-5xl mb-4">{websiteName}</h1>
              <div className="divider h-1 w-32 mx-auto mb-6"></div>
            </div>
            
            {/* Updated Layout: Featured Post Full Width */}
            <div className="space-y-8">
              {/* Featured Post - Full Width */}
              <div className="w-full">
                {featuredPost ? renderHomepageCard(featuredPost, 0, true) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 italic">Featured post unavailable.</div>
                )}
              </div>
              
              {/* Stacked Posts - Two Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {stackedPosts.map((post, i) => (
                  <div key={post.id}>
                    {renderHomepageCard(post, i + 1, false)}
                  </div>
                ))}
                
                {/* Show placeholders if we have fewer than 2 stacked posts */}
                {stackedPosts.length === 0 && (
                  <>
                    <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 italic p-4">No additional posts.</div>
                    <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 italic p-4">No additional posts.</div>
                  </>
                )}
                
                {stackedPosts.length === 1 && (
                  <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 italic p-4">No additional posts.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===================
  // === Fallback View ===
  // ===================
  else {
    return (
      <div className={`bg-[#e6f0f8] p-6 text-center text-[#5a728a] ${lora.variable}`} style={{ fontFamily: 'var(--font-lora)' }}>
        Loading preview or no content available...
      </div>
    );
  }
}