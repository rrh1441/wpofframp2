// lib/transformToMdx.ts
import OpenAI from 'openai';
import { generateMdxPrompt } from './generateMdxPrompt';
import { ThemeKey } from './constants';

// Ensure OPENAI_API_KEY is loaded from environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing environment variable OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MdxOutput {
  mdx: string; // The full MDX string including frontmatter
  mdxBody: string; // The MDX content *without* the frontmatter
  frontmatter: {
    title: string;
    date: string;
    author: string;
    featuredImage?: string;
  };
  error?: string;
  llmResponse?: string; // Optional: Include raw LLM response for debugging
}

interface TransformToMdxArgs {
  htmlContent: string;
  theme: ThemeKey;
  title: string;
  date: string;
  author: string;
  featuredImage?: string;
}

// Helper Function: Removes potential code fence wrappers (mdx, yaml, etc.)
function removeCodeFenceWrapper(content: string): string {
    // Matches ``` followed by optional language specifier, newline, content, newline, ```
    const wrapperRegex = /^```(?:\w+)?\s*\n([\s\S]*?)\n```$/m;
    const match = content.trim().match(wrapperRegex);
    if (match && match[1]) {
        // Return only the content inside the wrapper
        return match[1].trim();
    }
    // Also check if it's just ``` at start/end without language
     const simpleWrapperRegex = /^```\s*\n([\s\S]*?)\n```$/m;
     const simpleMatch = content.trim().match(simpleWrapperRegex);
     if (simpleMatch && simpleMatch[1]) {
        return simpleMatch[1].trim();
     }

    // Handle cases where the LLM might just put ``` at the very start/end
    return content
        .replace(/^```(\w+)?\s*/, '') // Remove starting ``` optionally followed by lang
        .replace(/```\s*$/, '')      // Remove ending ```
        .trim();
}

// UPDATED: Parses frontmatter after removing potential wrappers
function parseFrontmatter(fullContent: string): Record<string, any> {
  const cleanedContent = removeCodeFenceWrapper(fullContent); // Clean wrappers first
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = cleanedContent.match(frontmatterRegex);

  if (!match || !match[1]) {
    console.warn("Could not parse frontmatter from cleaned MDX content.");
    return {};
  }

  const yamlString = match[1];
  const frontmatter: Record<string, any> = {};
  const lines = yamlString.split('\n');

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex > 0) { // Ensure ':' exists and is not the first char
      const key = line.substring(0, separatorIndex).trim();
      // Get value after the first ':' and remove quotes
      const value = line.substring(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key) {
        frontmatter[key] = value;
      }
    }
  });
  return frontmatter;
}


// UPDATED: Extracts body content after removing potential wrappers and frontmatter
function extractMdxBody(fullContent: string): string {
    const cleanedContent = removeCodeFenceWrapper(fullContent); // Clean wrappers first
    const frontmatterRegex = /^---[\s\S]*?---/;
    // Remove frontmatter from the cleaned content
    return cleanedContent.replace(frontmatterRegex, '').trim();
}

export async function transformToMdx({
  htmlContent,
  theme,
  title,
  date,
  author,
  featuredImage,
}: TransformToMdxArgs): Promise<MdxOutput> {
  const prompt = generateMdxPrompt({
    htmlContent,
    theme,
    title,
    date,
    author,
    featuredImage,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert assistant specializing in converting HTML to clean, structured MDX with YAML frontmatter, following specific guidelines. Output ONLY the MDX content starting directly with the YAML frontmatter block (`---`). Do NOT wrap the output in markdown code fences like ```mdx or ```yaml.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 3500, // Slightly increased
    });

    const rawMdx = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!rawMdx) {
      console.error('LLM returned empty content.');
      // Return structure indicating error
      return { error: 'Content transformation failed: LLM returned empty content.', mdx: '', mdxBody: '', frontmatter: { title, date, author, featuredImage }, llmResponse: '(empty)' };
    }

    // Parse frontmatter from the raw (potentially wrapped) output
    const parsedFm = parseFrontmatter(rawMdx);

    // Validate essential frontmatter fields or use fallbacks
    const finalFrontmatter = {
      title: parsedFm.title || title,
      date: parsedFm.date || date,
      author: parsedFm.author || author,
      featuredImage: parsedFm.featuredImage || featuredImage,
    };

    // Extract body content using the updated function (handles wrappers)
    let mdxBody = extractMdxBody(rawMdx);
    let finalMdx = rawMdx; // Start with raw output

     // Check if the cleaned output actually starts with ---
     const cleanedForCheck = removeCodeFenceWrapper(rawMdx);

    // If parsing failed OR the cleaned content doesn't start with '---', reconstruct
    if (Object.keys(parsedFm).length === 0 || !cleanedForCheck.startsWith('---')) {
        console.warn("LLM output issue: Frontmatter missing or incorrectly formatted. Reconstructing.");
         const frontmatterString = `---
title: "${finalFrontmatter.title.replace(/"/g, '\\"')}"
date: "${finalFrontmatter.date}"
author: "${finalFrontmatter.author.replace(/"/g, '\\"')}"
${finalFrontmatter.featuredImage ? `featuredImage: "${finalFrontmatter.featuredImage}"\n` : ''}---

`;
        // The body *is* the cleaned content if we had to reconstruct FM
        mdxBody = cleanedForCheck;
        finalMdx = frontmatterString + mdxBody; // Prepend reconstructed FM
    }

    // Final check for safety: ensure body doesn't start with --- if reconstruction happened incorrectly
    if (mdxBody.startsWith('---')) {
        console.warn("Post-processing check: mdxBody unexpectedly started with '---'. Attempting removal.");
        mdxBody = mdxBody.replace(/^---[\s\S]*?---/, '').trim();
    }

    return {
      mdx: finalMdx,
      mdxBody: mdxBody,
      frontmatter: finalFrontmatter,
      llmResponse: rawMdx,
    };
  } catch (error: any) {
    console.error('Error calling LLM API:', error);
    let errorMessage = 'Content transformation failed due to an LLM API error.';
     if (error.response?.data?.error?.message) {
        errorMessage += `: ${error.response.data.error.message}`;
     } else if (error.message) {
         errorMessage += `: ${error.message}`;
     }
    // Return structure indicating error
    return { error: errorMessage, mdx: '', mdxBody: '', frontmatter: { title, date, author, featuredImage } };
  }
}