// components/themes/GhibliLayout.tsx (With V2 Image Fix + Debug)
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

export function GhibliLayout({ mdxContent }: Props) {
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
        console.log(`GhibliLayout: Found duplicate featured image MARKDOWN (using base URL: ${baseUrl}). Removing.`); // Updated log
        finalContentForHtml = finalContentForHtml.replace(markdownImgRegex, '');
        // Optional: Clean up potentially empty lines
        // finalContentForHtml = finalContentForHtml.replace(/^\s*$/gm, '');
    } else {
        // console.log(`GhibliLayout: Did not find Markdown image link using base URL ${baseUrl}.`); // Updated log (usually expected for Ghibli)
    }
  }
  // --- End CORRECTED FIX V2 ---


  // --- Debug Block ---
  console.log("--- DEBUG START (GhibliLayout) ---"); // Updated log
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
          // This might be expected for Ghibli if the LLM doesn't add the img to the body
          // console.log("NOTE: Markdown Regex (using base URL) did not find the image link in processedContent (potentially expected for Ghibli).");
      }
  } else if (featuredImage) {
       console.log("Could not generate base URL for regex test.");
  } else {
       console.log("No featuredImage URL found in metadata.");
  }
  console.log("finalContentForHtml (start):", finalContentForHtml.substring(0, 500) + "...");
  console.log("--- DEBUG END (GhibliLayout) ---"); // Updated log
  // --- End Debug Block ---


  return (
    <div className="bg-gradient-to-b from-sky-100 to-blue-50 p-4 md:p-6 rounded-md w-full shadow-md border border-blue-100">
      {/* Render metadata if available */}
      {data.title && (
        <div className="mb-6 w-full text-center border-b border-blue-200 pb-4">
          <h1 className="text-3xl font-bold text-blue-800 mb-2 font-serif">{data.title}</h1>
          {data.author && (
            <p className="text-sm text-blue-600">
              By <span className="font-medium italic">{data.author}</span>
            </p>
          )}
          {data.date && (
            <p className="text-sm text-blue-500">
              {new Date(data.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          {data.timeToRead && (
            <p className="text-xs text-blue-400 mt-1">{data.timeToRead} min read</p>
          )}
        </div>
      )}

      {/* Display the featured image if available */}
      {featuredImage && (
        <div className="mb-8 flex justify-center">
          <img
            src={featuredImage}
            alt={data.title || "Featured image"}
            className="max-w-full max-h-96 object-cover rounded-lg shadow-lg border-4 border-white"
          />
        </div>
      )}

      {/* Styles kept as provided */}
      <style jsx global>{`
        .ghibli-content {
          color: #334155;
          font-family: 'Noto Serif', Georgia, serif;
          width: 100%;
          max-width: 100%;
          line-height: 1.8;
          font-size: 1.05rem;
        }
        /* ... other ghibli styles ... */
        .ghibli-content h1,
        .ghibli-content h2,
        .ghibli-content h3,
        .ghibli-content h4,
        .ghibli-content h5,
        .ghibli-content h6 {
          color: #1e3a8a;
          font-family: 'Noto Serif', serif;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
          width: 100%;
          position: relative;
        }
        .ghibli-content h1::after,
        .ghibli-content h2::after {
          content: "";
          position: absolute;
          bottom: -0.5rem;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, #93c5fd, transparent);
        }
        .ghibli-content p {
          color: #334155;
          margin: 1.2rem 0;
          line-height: 1.8;
          display: block;
          width: 100%;
        }
        .ghibli-content a {
          color: #2563eb;
          text-decoration-line: underline;
          text-decoration-style: wavy;
          text-decoration-color: #93c5fd;
          transition: all 0.3s ease;
        }
        .ghibli-content a:hover {
          color: #1d4ed8;
          text-decoration-color: #60a5fa;
        }
        .ghibli-content img {
          max-width: 100%;
          height: auto;
          margin: 2rem 0;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 4px solid white;
          display: block;
        }
        .ghibli-content ul,
        .ghibli-content ol {
          color: #334155;
          margin: 1.2rem 0 1.2rem 1.5rem;
          padding-left: 1rem;
          width: 100%;
        }
        .ghibli-content ul {
          list-style-type: disc;
        }
        .ghibli-content ol {
          list-style-type: decimal;
        }
        .ghibli-content li {
          margin: 0.5rem 0;
          color: #334155;
          display: list-item;
        }
        .ghibli-content blockquote {
          border-left: 4px solid #93c5fd;
          padding: 1rem 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #334155;
          width: 100%;
          background-color: rgba(224, 242, 254, 0.5);
          border-radius: 0 0.5rem 0.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .ghibli-content code {
          background-color: #e0f2fe;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          color: #0369a1;
          font-size: 0.9em;
        }
        .ghibli-content pre {
          background-color: #f0f9ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 2rem 0;
          border: 1px solid #bae6fd;
          width: 100%;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }
        .ghibli-content em {
          font-style: italic;
          color: #475569;
        }
        .ghibli-content strong {
          font-weight: 700;
          color: #1e40af;
        }
        .ghibli-content br {
          display: block;
          content: "";
          margin-top: 0.5rem;
        }
        /* Ghibli-inspired decorative elements */
        .ghibli-content::before {
          content: "";
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z' fill='%2393c5fd' fill-opacity='0.2'/%3E%3C/svg%3E");
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          opacity: 0.1;
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Use finalContentForHtml */}
      <div
        className="prose prose-sm sm:prose max-w-none w-full ghibli-content"
        dangerouslySetInnerHTML={{
          __html: finalContentForHtml // Use the corrected content
            .replace(
              /^# (.*$)/gm,
              '<h1 style="color: #1e3a8a; font-family: \'Noto Serif\', serif; font-weight: 700; position: relative;">$1</h1>'
            )
            .replace(
              /^## (.*$)/gm,
              '<h2 style="color: #1e3a8a; font-family: \'Noto Serif\', serif; font-weight: 700; position: relative;">$1</h2>'
            )
            .replace(
              /^### (.*$)/gm,
              '<h3 style="color: #1e3a8a; font-family: \'Noto Serif\', serif; font-weight: 700;">$1</h3>'
            )
            // This replace now only affects non-featured images
            .replace(
              /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,
              '<img src="$2" alt="$1" title="$3" style="max-width: 100%; height: auto; margin: 2rem auto; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 4px solid white; display: block;" />'
            )
            .replace(
              /\*\*(.*?)\*\*/g,
              '<strong style="font-weight: 700; color: #1e40af;">$1</strong>'
            )
            .replace(
              /\*(.*?)\*/g,
              '<em style="font-style: italic; color: #475569;">$1</em>'
            )
            .replace(
              /\[(.*?)\]\((.*?)\)/g,
              '<a href="$2" style="color: #2563eb; text-decoration-line: underline; text-decoration-style: wavy; text-decoration-color: #93c5fd;">$1</a>'
            )
            .replace(
              /^> (.*$)/gm,
              '<blockquote style="border-left: 4px solid #93c5fd; padding: 1rem 1.5rem; margin: 2rem 0; font-style: italic; color: #334155; background-color: rgba(224, 242, 254, 0.5); border-radius: 0 0.5rem 0.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">$1</blockquote>'
            )
            .replace(
              /(?:\r?\n){2,}(?!\s*[-*#>])/g,
              '</p><p style="color: #334155; margin: 1.2rem 0; line-height: 1.8;">'
            )
            .replace(
              /^(.*)/,
              '<p style="color: #334155; margin: 1.2rem 0; line-height: 1.8;">$1</p>'
            )
        }}
      />
    </div>
  );
}