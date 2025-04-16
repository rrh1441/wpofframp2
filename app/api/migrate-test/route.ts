// app/api/migrate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildZip } from '@/lib/buildZip';
import { checkMigrationLimit, setMigrationCookie } from '@/lib/session';
import { isValidTheme, ThemeKey } from '@/lib/constants';
import { compileMDX } from 'next-mdx-remote/rsc';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('Received migration request');

  if (checkMigrationLimit(request)) {
    console.log('Migration limit reached for session.');
    return NextResponse.json(
      { error: 'Limited to one migration per user session during the testing phase.' },
      { status: 429 }
    );
  }

  let wpUrl: string | undefined;
  let theme: string | undefined;
  let homepagePosts: any[] | undefined; // Expecting the homepagePosts array

  try {
    const body = await request.json();
    wpUrl = body.wpUrl;
    theme = body.theme;
    homepagePosts = body.homepagePosts; // Extract homepagePosts

    if (!wpUrl || typeof wpUrl !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid wpUrl' }, { status: 400 });
    }
    if (!theme || typeof theme !== 'string' || !isValidTheme(theme)) {
      return NextResponse.json({ error: 'Missing or invalid theme' }, { status: 400 });
    }
    if (!homepagePosts || !Array.isArray(homepagePosts) || homepagePosts.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid homepagePosts data' }, { status: 400 });
    }

    try {
      new URL(wpUrl);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid URL format for wpUrl' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  console.log(`Processing URL: ${wpUrl}, Theme: ${theme}`);

  try {
    const mostRecentPost = homepagePosts[0];
    if (!mostRecentPost?.fullContent?.mdx) {
      return NextResponse.json({ error: 'MDX content for the most recent post is missing.' }, { status: 400 });
    }

    const zipBuffer = await buildZip({
      theme: theme as ThemeKey,
      homepagePosts: homepagePosts.map(post => ({ // Prepare card data for homepage
        id: post.id,
        title: post.title,
        link: post.link,
        excerpt: post.excerpt,
        featuredMediaUrl: post.featuredMediaUrl,
        authorName: post.authorName,
        date: post.date,
      })),
      mostRecentPostMdx: mostRecentPost.fullContent.mdx,
      mostRecentPostTitle: mostRecentPost.title,
      mostRecentPostSlug: mostRecentPost.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase(), // Basic slug generation
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    const safeTitle = wpUrl.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50) || 'wp_offramp_site';
    headers.set('Content-Disposition', `attachment; filename="${safeTitle}_${theme}.zip"`);

    const response = new NextResponse(zipBuffer, { status: 200, headers });
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