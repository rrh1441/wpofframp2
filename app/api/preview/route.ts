// app/api/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWpContent, WpContent } from '@/lib/fetchWpContent';
import { transformToMdx, MdxOutput } from '@/lib/transformToMdx';
import { isValidTheme, ThemeKey } from '@/lib/constants';

export interface PreviewResult extends WpContent, MdxOutput {
  // Combines fields from both interfaces + originalHtml
  originalHtml: string;
  theme: ThemeKey; // Add the theme key to the result object
}

export async function POST(request: NextRequest) {
  let wpUrl: string | undefined;
  let theme: string | undefined;
  let themeKey: ThemeKey;

  // 1. Parse and Validate Input
  try {
    const body = await request.json();
    wpUrl = body.wpUrl;
    theme = body.theme;

    if (!wpUrl || typeof wpUrl !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid wpUrl' }, { status: 400 });
    }
    if (!theme || typeof theme !== 'string' || !isValidTheme(theme)) {
      return NextResponse.json({ error: 'Missing or invalid theme' }, { status: 400 });
    }
    themeKey = theme; // Assign the validated theme key

     try {
       new URL(wpUrl);
     } catch (_) {
       return NextResponse.json({ error: 'Invalid URL format for wpUrl' }, { status: 400 });
     }
  } catch (error) {
    console.error('[API /preview] Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  console.log(`[API /preview] Processing URL: ${wpUrl}, Theme: ${themeKey}`);

  // --- Start Preview Process ---
  try {
    // 2. Fetch WordPress Content
    console.log('[API /preview] Fetching WP content...');
    const wpData = await fetchWpContent(wpUrl);
    if (wpData.error) {
      console.error('[API /preview] Error fetching WP content:', wpData.error);
      return NextResponse.json(
        { error: wpData.error },
        { status: wpData.status || 500 }
      );
    }
    console.log(`[API /preview] Fetched content: Title - ${wpData.title}`);

    // 3. Transform HTML to MDX using LLM
    console.log('[API /preview] Transforming HTML to MDX...');
    const mdxResult = await transformToMdx({
      htmlContent: wpData.content,
      theme: themeKey,
      title: wpData.title,
      date: wpData.date,
      author: wpData.author,
      featuredImage: wpData.featuredImage,
    });

    if (mdxResult.error) {
      console.error('[API /preview] Error transforming to MDX:', mdxResult.error);
      return NextResponse.json(
        { error: `MDX transformation failed: ${mdxResult.error}` },
        { status: 500 }
      );
    }
    console.log('[API /preview] MDX transformation successful.');

    // 4. Prepare and Return Preview Data
    const resultData: PreviewResult = {
      // From WpContent
      title: wpData.title,
      content: wpData.content, // Original content is still useful
      date: wpData.date,
      author: wpData.author,
      featuredImage: wpData.featuredImage,
      // Specific fields for frontend
      originalHtml: wpData.content,
      // From MdxOutput
      mdx: mdxResult.mdx,
      frontmatter: mdxResult.frontmatter,
      // Add theme key
      theme: themeKey,
      // Clear errors if successful
      error: undefined,
      status: undefined,
    };

    return NextResponse.json(resultData, { status: 200 });

  } catch (error: any) {
    console.error('[API /preview] Unhandled error during preview process:', error);
    return NextResponse.json(
      { error: `An unexpected server error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}