// lib/generateMdxPrompt.ts
import { THEMES, ThemeKey, isValidTheme } from './constants';

interface GenerateMdxPromptArgs {
  htmlContent: string;
  theme: ThemeKey; // Use the stricter ThemeKey type
  title: string;
  date: string;
  author: string;
  featuredImage?: string;
}

export function generateMdxPrompt({
  htmlContent,
  theme,
  title,
  date,
  author,
  featuredImage,
}: GenerateMdxPromptArgs): string {
  if (!isValidTheme(theme)) {
    console.warn(`Invalid theme provided: ${theme}. Falling back to clarity.`);
    theme = 'clarity'; // Fallback to a default theme
  }

  const basePrompt = `
You are an expert content transformation assistant. Your task is to convert the following HTML snippet from a WordPress post into clean, semantic, and valid MDX (Markdown with JSX components) suitable for a statically generated Next.js site using MDXRemote or similar libraries.

**Conversion Guidelines:**

1.  **Frontmatter:** Create a YAML frontmatter block at the very beginning of the MDX output. Include the following fields:
    - title: "${title.replace(/"/g, '\\"')}" (Escape any double quotes in the title)
    - date: "${date}" (Keep the ISO 8601 format)
    - author: "${author.replace(/"/g, '\\"')}"
    ${featuredImage ? `- featuredImage: "${featuredImage}"` : ''}

2.  **Markdown Equivalents:** Prioritize standard Markdown for elements like:
    - Headings (#, ##, ###, etc.)
    - Paragraphs (separated by blank lines)
    - Bold (**text**) and Italic (*text*)
    - Unordered lists (* or -) and Ordered lists (1., 2.)
    - Links ([link text](url))
    - Blockquotes (>)
    - Inline code (\`code\`)
    - Fenced code blocks (\`\`\`language\ncode\n\`\`\`)
    - Horizontal rules (---)

3.  **HTML Handling:**
    - **AVOID raw HTML** tags whenever a standard Markdown equivalent exists and is appropriate for the theme.
    - **Retain necessary HTML** only if it provides specific structure or functionality not achievable with standard Markdown (e.g., complex tables, specific embeds if instructed, theme-specific requirements like styled links).
    - **Clean up WordPress artifacts:** Remove excessive inline styles, unnecessary divs/spans, empty paragraphs (<p>&nbsp;</p>), WordPress-specific shortcodes (like [caption]), and plugin-specific markup unless critical for content meaning. Simplify the structure.
    - Convert basic HTML tables (<table>, <tr>, <th>, <td>) to Markdown tables if simple, otherwise keep the HTML table structure clean.

4.  **Image Handling:**
    - Convert <img> tags to Markdown images: \`![alt text](image URL)\`. Use the alt text from the HTML if available, otherwise provide a descriptive placeholder like "Image".
    - Include the \`featuredImage\` URL in the frontmatter if provided. Do not repeat the featured image in the body unless it was explicitly part of the original post's body content.

5.  **MDX Components:** Only use JSX components if explicitly instructed by the theme guidelines below (e.g., <Callout>, <div class="...">). Ensure any JSX is valid.

6.  **Whitespace:** Use appropriate Markdown whitespace for readability (e.g., blank lines between paragraphs and block elements).

7.  **Sanitization:** Ensure the output is safe and doesn't contain malicious scripts (although primarily focus on conversion, not full XSS protection).

**Theme-Specific Instructions (${THEMES[theme].name}):**
${THEMES[theme].prompt}

**HTML Content to Convert:**
\`\`\`html
${htmlContent}
\`\`\`

**Output:**
Provide *only* the complete MDX content, starting directly with the YAML frontmatter block. Do not include any introductory text or explanations before the frontmatter or after the MDX content.
`;

  return basePrompt;
}