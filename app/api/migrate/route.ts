// app/api/migrate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchWpContent } from '@/lib/fetchWpContent';
import { transformToMdx } from '@/lib/transformToMdx';
import { buildZip } from '@/lib/buildZip';
import { checkMigrationLimit, setMigrationCookie } from '@/lib/session';
import { isValidTheme, ThemeKey } from '@/lib/constants';

// Increase max duration for Vercel Hobby/Pro plans if needed (default 10s/60s)
// export const maxDuration = 60; // 60 seconds
// Note: Serverless functions have execution time limits. Complex operations might exceed them.

export async function POST(request: NextRequest) {
  console.log('Received migration request'); // Log start

  // 1. Check Rate Limit (Session Cookie)
  if (checkMigrationLimit(request)) {
    console.log('Migration limit reached for session.'); // Log limit hit
    return NextResponse.json(
      { error: 'Limited to one migration per user session during the testing phase.' },
      { status: 429 } // Too Many Requests
    );
  }

  let wpUrl: string | undefined;
  let theme: string | undefined;

  // 2. Parse and Validate Input
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

    // Basic URL validation (more robust validation might be needed)
     try {
       new URL(wpUrl);
     } catch (_) {
       return NextResponse.json({ error: 'Invalid URL format for wpUrl' }, { status: 400 });
     }


  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

   console.log(`Processing URL: ${wpUrl}, Theme: ${theme}`); // Log inputs

  // --- Start Migration Process ---
  try {
    // 3. Fetch WordPress Content
    console.log('Fetching WP content...');
    const wpData = await fetchWpContent(wpUrl);
    if (wpData.error) {
      console.error('Error fetching WP content:', wpData.error);
      return NextResponse.json(
        { error: wpData.error },
        { status: wpData.status || 500 }
      );
    }
     console.log(`Workspaceed content: Title - ${wpData.title}`);


    // 4. Transform HTML to MDX using LLM
    console.log('Transforming HTML to MDX...');
    const mdxResult = await transformToMdx({
      htmlContent: wpData.content,
      theme: theme as ThemeKey, // Cast is safe due to isValidTheme check
      title: wpData.title,
      date: wpData.date,
      author: wpData.author,
      featuredImage: wpData.featuredImage,
    });

    if (mdxResult.error) {
      console.error('Error transforming to MDX:', mdxResult.error);
      // Provide more context if possible, maybe include part of the LLM response
      const detail = mdxResult.llmResponse ? `LLM Response Snippet: ${mdxResult.llmResponse.substring(0, 100)}...` : '';
      return NextResponse.json(
        { error: `MDX transformation failed: ${mdxResult.error}. ${detail}` },
        { status: 500 }
      );
    }
     console.log('MDX transformation successful.');


    // 5. Build the ZIP Archive
    console.log('Building ZIP archive...');
    const zipBuffer = await buildZip({
      mdxContent: mdxResult.mdx,
      theme: theme as ThemeKey,
    });
     console.log('ZIP archive built successfully.');

    // 6. Prepare Response with ZIP file
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    // Sanitize title for filename
     const safeTitle = wpData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'wp_offramp_site';
     headers.set('Content-Disposition', `attachment; filename="${safeTitle}_${theme}.zip"`);

    // Create the response BEFORE setting the cookie
    const response = new NextResponse(zipBuffer, { status: 200, headers });

    // 7. Set the Migration Cookie *on the successful response*
    setMigrationCookie(response);
     console.log('Migration successful, cookie set.');

    return response;

  } catch (error: any) {
    console.error('Unhandled error during migration process:', error);
    return NextResponse.json(
      { error: `An unexpected server error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}