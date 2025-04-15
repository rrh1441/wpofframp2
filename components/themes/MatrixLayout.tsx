// components/themes/MatrixLayout.tsx (With V2 Image Fix + Debug)
"use client";

import React from "react";
// import matter from "gray-matter"; // Keep commented if parseContentManually is used

interface Props {
  mdxContent: string;
}

// Helper function to escape strings for use in RegExp constructor
function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Keeping the parseContentManually function exactly as provided by the user
function parseContentManually(mdxContent: string): { content: string; data: Record<string, any> } {
  // ... (parseContentManually implementation remains unchanged) ...
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
  const contentText = match[2];
  const data: Record<string, any> = {};

  if (!frontmatterText.includes('\n')) {
    const props = frontmatterText.split(/\s+(?=\w+:)/);
    props.forEach(prop => {
      const keyValueMatch = prop.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|([^"\s].*?)(?:\s+#.*)?$)/);
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
    const titleMatch = contentText.match(/^#\s+(.*?)(\r?\n|$)/);
    if (titleMatch) {
      data.title = titleMatch[1];
    }
  }

  const cleanedContent = contentText.split(/\r?\n/).filter(line => {
    return !line.match(/^---\s*$/) &&
           !line.match(/^\s*title:\s+/) &&
           !line.match(/^\s*date:\s+/) &&
           !line.match(/^\s*author:\s+/) &&
           !line.match(/^\s*featuredImage:/i) &&
           !line.match(/^\s*featuredimage:/i);
  }).join('\n');

  return { content: cleanedContent, data };
}


export function MatrixLayout({ mdxContent }: Props) {
  const { content, data } = parseContentManually(mdxContent); // Use provided function

  // ============ CLEAN CONTENT ============
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.filter(line => {
    return !line.match(/^---\s*$/) &&
           !line.match(/^\s*title:\s+/) &&
           !line.match(/^\s*date:\s+/) &&
           !line.match(/^\s*author:\s+/) &&
           !line.match(/^\s*featuredImage:/i) &&
           !line.match(/^\s*featuredimage:/i);
  });
  let cleanedContent = cleanedLines.join('\n');

  // ============ REMOVE FIRST HEADING ============
  const headingLines = cleanedContent.split(/\r?\n/);
  let foundHeading = false;
  const filteredLines = headingLines.filter(line => {
    if (!foundHeading && line.match(/^#\s+/)) {
      foundHeading = true;
      return false;
    }
    return true;
  });
  const processedContent = filteredLines.join('\n');

  // Extract featured image from metadata if available
  const featuredImage = data.featuredImage || data.featuredimage || '';


  // --- CORRECTED FIX V2: Use BASE URL for matching Markdown ---
  let finalContentForHtml = processedContent;
  let baseUrlUsedForRegex: string | null = null; // For logging
  if (featuredImage) {
    const baseUrl = featuredImage.split('?')[0].split('#')[0];
    baseUrlUsedForRegex = baseUrl;

    const markdownImgRegex = new RegExp(
        `!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}\\s*\\)`,
        'gi'
    );

    const match = finalContentForHtml.match(markdownImgRegex);
    if (match) {
        console.log(`MatrixLayout: Found duplicate featured image MARKDOWN (using base URL: ${baseUrl}). Removing.`); // Updated log
        finalContentForHtml = finalContentForHtml.replace(markdownImgRegex, '');
        // Optional: Clean up potentially empty lines
        // finalContentForHtml = finalContentForHtml.replace(/^\s*$/gm, '');
    } else {
         // console.log(`MatrixLayout: Did not find Markdown image link using base URL ${baseUrl}.`); // Updated log
    }
  }
  // --- End CORRECTED FIX V2 ---


  // --- Debug Block ---
  console.log("--- DEBUG START (MatrixLayout) ---"); // Updated log
  console.log("Featured Image URL (from data):", featuredImage);
  console.log("Base URL used for Match:", baseUrlUsedForRegex || "(N/A)");
  console.log("processedContent (start):", processedContent.substring(0, 500) + "...");

  if (featuredImage && baseUrlUsedForRegex) {
      const markdownImgRegexDebug = new RegExp(
          `!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrlUsedForRegex)}\\s*\\)`,
          'gi'
      );
      console.log("Markdown Regex Used:", markdownImgRegexDebug.source);
      const matchFoundDebug = markdownImgRegexDebug.test(processedContent);
      console.log("Markdown Regex Match Found in processedContent:", matchFoundDebug);
      if (!matchFoundDebug) {
          console.log("POSSIBLE ISSUE: Markdown Regex (using base URL) did not find the image link in processedContent.");
      }
  } else if (featuredImage) {
       console.log("Could not generate base URL for regex test.");
  } else {
       console.log("No featuredImage URL found in metadata.");
  }
  console.log("finalContentForHtml (start):", finalContentForHtml.substring(0, 500) + "...");
  console.log("--- DEBUG END (MatrixLayout) ---"); // Updated log
  // --- End Debug Block ---


  return (
    <div className="bg-black p-4 md:p-6 rounded-b-md w-full">
      {/* Render metadata if available */}
      {data.title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-green-400 uppercase">{data.title}</h1>
          {data.author && (
            <p className="text-sm text-green-400">
              By <span className="font-medium">{data.author}</span>
            </p>
          )}
          {data.date && (
            <p className="text-sm text-green-400">
              {new Date(data.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {data.timeToRead && (
            <p className="text-xs text-green-300">{data.timeToRead} min read</p>
          )}
        </div>
      )}

      {/* Display the featured image if available */}
      {featuredImage && (
        <div className="mb-6">
          <img
            src={featuredImage}
            alt={data.title || "Featured image"}
            className="w-full max-h-96 object-cover border border-green-800"
          />
        </div>
      )}

      {/* Styles kept as provided */}
      <style jsx global>{`
        .matrix-content {
          color: #86efac;
          font-family: monospace;
          width: 100%;
          max-width: 100%;
        }
        /* ... other matrix styles ... */
         .matrix-content h1,
        .matrix-content h2,
        .matrix-content h3,
        .matrix-content h4,
        .matrix-content h5,
        .matrix-content h6 {
          color: #4ade80;
          font-family: monospace;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          width: 100%;
        }
        .matrix-content p {
          color: #86efac;
          margin: 1rem 0;
          line-height: 1.6;
          display: block;
          width: 100%;
          font-family: monospace;
        }
        .matrix-content a {
          color: #22c55e;
          text-decoration: underline;
          font-family: monospace;
        }
        .matrix-content a:hover {
          color: #16a34a;
        }
        .matrix-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
          border: 1px solid #166534;
          display: block;
        }
        .matrix-content ul,
        .matrix-content ol {
          color: #86efac;
          margin: 1rem 0 1rem 1.5rem;
          padding-left: 1rem;
          width: 100%;
          font-family: monospace;
        }
        .matrix-content ul {
          list-style-type: disc;
        }
        .matrix-content ol {
          list-style-type: decimal;
        }
        .matrix-content li {
          margin: 0.25rem 0;
          color: #86efac;
          display: list-item;
          font-family: monospace;
        }
        .matrix-content blockquote {
          border-left: 4px solid #166534;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #86efac;
          width: 100%;
          font-family: monospace;
        }
        .matrix-content code {
          background-color: #111;
          color: #4ade80;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .matrix-content pre {
          background-color: #111;
          padding: 1rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid #166534;
          width: 100%;
          font-family: monospace;
        }
        .matrix-content em {
          font-style: italic;
          color: #bbf7d0;
          font-family: monospace;
        }
        .matrix-content strong {
          font-weight: 700;
          color: #86efac;
          font-family: monospace;
        }
        .matrix-content br {
          display: block;
          content: "";
          margin-top: 0.5rem;
        }
      `}</style>

      {/* Use finalContentForHtml */}
      <div
        className="prose prose-invert max-w-none w-full matrix-content" // Added prose-invert for dark bg
        dangerouslySetInnerHTML={{
          __html: finalContentForHtml // Use the corrected content
            .replace(
              /^# (.*$)/gm,
              '<h1 style="color: #4ade80; font-family: monospace; font-weight: 700;">$1</h1>'
            )
            .replace(
              /^## (.*$)/gm,
              '<h2 style="color: #4ade80; font-family: monospace; font-weight: 700;">$1</h2>'
            )
            .replace(
              /^### (.*$)/gm,
              '<h3 style="color: #4ade80; font-family: monospace; font-weight: 700;">$1</h3>'
            )
            // This replace now only affects non-featured images
            .replace(
              /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,
              '<img src="$2" alt="$1" title="$3" style="max-width: 100%; display: block; margin: 1.5rem 0; border: 1px solid #166534;" />'
            )
            .replace(
              /\*\*(.*?)\*\*/g,
              '<strong style="font-weight: 700; color: #86efac; font-family: monospace;">$1</strong>'
            )
            .replace(
              /\*(.*?)\*/g,
              '<em style="font-style: italic; color: #bbf7d0; font-family: monospace;">$1</em>'
            )
            .replace(
              /\[(.*?)\]\((.*?)\)/g,
              '<a href="$2" style="color: #22c55e; text-decoration: underline; font-family: monospace;">$1</a>'
            )
            .replace(
              /^> (.*$)/gm,
              '<blockquote style="border-left: 4px solid #166534; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #86efac; font-family: monospace;">$1</blockquote>'
            )
            .replace(/(?:\r?\n){2,}(?!\s*[-*#>])/g, '</p><p style="color: #86efac; margin: 1rem 0; line-height: 1.6; font-family: monospace;">')
            .replace(/^(.*)/, '<p style="color: #86efac; margin: 1rem 0; line-height: 1.6; font-family: monospace;">$1</p>')
        }}
      />
    </div>
  );
}