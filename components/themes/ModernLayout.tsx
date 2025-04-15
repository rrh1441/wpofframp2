// components/themes/ModernLayout.tsx (With V2 Image Fix + Debug Logging)
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
    const titleMatch = contentText.match(/^#\s+(.*?)(\r?\n|$)/);
    if (titleMatch) {
      data.title = titleMatch[1];
    }
  }

  const cleanedContentArr = contentText.split(/\r?\n/).filter(line => {
    return !line.match(/^---\s*/) &&
           !line.match(/^\s*title:/) &&
           !line.match(/^\s*date:/) &&
           !line.match(/^\s*author:/) &&
           !line.match(/^\s*featuredImage:/i);
  });

  return { content: cleanedContentArr.join('\n'), data };
}


export function ModernLayout({ mdxContent }: Props) {
  const { content, data } = parseContentManually(mdxContent);

  // ============ CLEAN CONTENT ============
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.filter(line => {
    return !line.match(/^---\s*/) &&
           !line.match(/^\s*title:/) &&
           !line.match(/^\s*date:/) &&
           !line.match(/^\s*author:/) &&
           !line.match(/^\s*featuredImage:/i);
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
    // Create a base URL by removing query string and hash
    const baseUrl = featuredImage.split('?')[0].split('#')[0];
    baseUrlUsedForRegex = baseUrl; // Store for logging

    // Regex to find Markdown image link using the BASE URL
    // Allows for variations in alt text and whitespace around the URL
    const markdownImgRegex = new RegExp(
        `!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrl)}\\s*\\)`, // Match ![...]( optional-whitespace BASE_URL optional-whitespace )
        'gi'
    );

    const match = finalContentForHtml.match(markdownImgRegex);
    if (match) {
        console.log(`ModernLayout: Found duplicate featured image MARKDOWN (using base URL: ${baseUrl}). Removing.`);
        finalContentForHtml = finalContentForHtml.replace(markdownImgRegex, ''); // Remove the matched Markdown string(s)
        // Optional: Clean up potentially empty lines
        // finalContentForHtml = finalContentForHtml.replace(/^\s*$/gm, '');
    } else {
         // Log if the markdown wasn't found
         // console.log(`ModernLayout: Did not find Markdown image link using base URL ${baseUrl}.`);
         // console.log(`Markdown Regex Used: ${markdownImgRegex.source}`);
         // console.log(`Processed Content Start: ${processedContent.substring(0, 100)}`);
    }
  }
  // --- End CORRECTED FIX V2 ---


  // --- Debug Block ---
  console.log("--- DEBUG START ---");
  console.log("Featured Image URL (from data):", featuredImage);
  console.log("Base URL used for Match:", baseUrlUsedForRegex || "(N/A)"); // Log the base URL used
  console.log("processedContent (start):", processedContent.substring(0, 500) + "...");

  if (featuredImage && baseUrlUsedForRegex) { // Check if base URL was created
      const markdownImgRegexDebug = new RegExp(
          `!\\[[^\\]]*\\]\\(\\s*${escapeRegex(baseUrlUsedForRegex)}\\s*\\)`,
          'gi'
      );
      console.log("Markdown Regex Used:", markdownImgRegexDebug.source);
      const matchFoundDebug = markdownImgRegexDebug.test(processedContent); // Test against original processed content
      console.log("Markdown Regex Match Found in processedContent:", matchFoundDebug);
      if (!matchFoundDebug) {
          console.log("POSSIBLE ISSUE: Markdown Regex (using base URL) did not find the image link in processedContent.");
      }
  } else if (featuredImage) {
       console.log("Could not generate base URL for regex test.");
  } else {
       console.log("No featuredImage URL found in metadata.");
  }
  console.log("finalContentForHtml (start):", finalContentForHtml.substring(0, 500) + "..."); // Log content *after* removal attempt
  console.log("--- DEBUG END ---");
  // --- End Debug Block ---


  return (
    <div className="bg-white p-4 md:p-6 rounded-b-md w-full">
      {/* Render metadata */}
      {data.title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          {data.author && (
            <p className="text-sm">
              By <span className="font-medium">{data.author}</span>
            </p>
          )}
          {data.date && (
            <p className="text-sm">
              {new Date(data.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {data.timeToRead && (
            <p className="text-xs text-gray-500">{data.timeToRead} min read</p>
          )}
        </div>
      )}

      {/* Explicitly render featured image from metadata */}
      {featuredImage && (
        <div className="mb-6">
          <img
            src={featuredImage}
            alt={data.title || "Featured image"}
            className="w-full max-h-96 object-cover rounded-md"
          />
        </div>
      )}

      {/* Styles remain the same */}
      <style jsx global>{`
        .modern-content {
          color: #475569;
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          max-width: 100%;
        }
        /* ... other styles ... */
        .modern-content h1,
        .modern-content h2,
        .modern-content h3,
        .modern-content h4,
        .modern-content h5,
        .modern-content h6 {
          color: #334155;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          width: 100%;
        }
        .modern-content p {
          color: #475569;
          margin: 1rem 0;
          line-height: 1.6;
          display: block;
          width: 100%;
        }
        .modern-content a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .modern-content a:hover {
          color: #1d4ed8;
        }
        .modern-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
          border-radius: 0.25rem;
          display: block;
        }
        .modern-content ul,
        .modern-content ol {
          color: #475569;
          margin: 1rem 0 1rem 1.5rem;
          padding-left: 1rem;
          width: 100%;
        }
        .modern-content ul {
          list-style-type: disc;
        }
        .modern-content ol {
          list-style-type: decimal;
        }
        .modern-content li {
          margin: 0.25rem 0;
          color: #475569;
          display: list-item;
        }
        .modern-content blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #64748b;
          width: 100%;
        }
        .modern-content code {
          background-color: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .modern-content pre {
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid #e2e8f0;
          width: 100%;
        }
        .modern-content em {
          font-style: italic;
        }
        .modern-content strong {
          font-weight: 700;
          color: #334155;
        }
        .modern-content br {
          display: block;
          content: "";
          margin-top: 0.5rem;
        }
      `}</style>

      {/* Use finalContentForHtml */}
      <div
        className="prose prose-sm sm:prose max-w-none w-full modern-content"
        dangerouslySetInnerHTML={{
          __html: finalContentForHtml
            .replace(/^# (.*$)/gm, "<h1>$1</h1>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(
              /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, // This will now only affect non-featured images
              '<img src="$2" alt="$1" title="$3" style="max-width: 100%; display: block; margin: 1.5rem 0; border-radius: 0.25rem;" />'
            )
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #334155;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none; font-weight: 500;">$1</a>')
            .replace(
              /^> (.*$)/gm,
              '<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #64748b;">$1</blockquote>'
            )
            .replace(/(?:\r?\n){2,}/g, '</p><p style="color: #475569; margin: 1rem 0; line-height: 1.6;">')
            .replace(/^(?!<[h1-6>])(.*?)(?=\r?\n\r?\n|$)/, '<p style="color: #475569; margin: 1rem 0; line-height: 1.6;">$1</p>')
        }}
      />
    </div>
  );
}