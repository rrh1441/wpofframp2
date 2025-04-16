// app/api/homepage-preview/route.ts
import { NextResponse } from 'next/server';
import { transformToMdx } from '@/lib/transformToMdx';

// --- Define types for clarity and use in frontend ---
export interface HomepagePost {
  id: number;
  title: string;
  link: string;
  excerpt: string;
  featuredMediaUrl: string | null;
  authorName: string;
  date: string;
  fullContent?: {
    originalHtml: string;
    mdx: string;
  };
}

export interface HomepagePreviewData {
  homepagePosts: HomepagePost[];
  siteName?: string | null; // Add optional siteName
  error?: string;
}
// --- End type definitions ---


const fetchHomepagePreviewData = async (wpUrl: string): Promise<HomepagePreviewData> => {
  let siteName: string | null = null;

  // --- ADDED: Attempt to fetch site details from /wp-json/ ---
  try {
    const siteInfoUrl = `${wpUrl}/wp-json/`;
    const siteInfoResponse = await fetch(siteInfoUrl, {
      headers: { 'User-Agent': 'WP-Offramp-Homepage-Preview/2.0' },
      signal: AbortSignal.timeout(5000), // Add a timeout (5 seconds)
    });
    if (siteInfoResponse.ok) {
      const siteInfo = await siteInfoResponse.json();
      if (siteInfo && typeof siteInfo.name === 'string' && siteInfo.name.trim()) {
        siteName = siteInfo.name.trim();
      }
    } else {
       console.warn(`Failed to fetch site info from ${siteInfoUrl}: ${siteInfoResponse.status}`);
    }
  } catch (error: any) {
      // Don't block post fetching if site name fetch fails
      if (error.name === 'TimeoutError') {
        console.warn(`Timeout fetching site info from ${wpUrl}/wp-json/`);
      } else {
        console.warn(`Error fetching site info from ${wpUrl}/wp-json/:`, error.message);
      }
  }
  // --- END ADDED ---


  try {
    // Fetch posts (existing logic)
    const apiUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=true`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WP-Offramp-Homepage-Preview/2.0',
      },
       signal: AbortSignal.timeout(20000), // Add a timeout (20 seconds) for posts
    });

    if (!response.ok) {
      console.error(`Failed to fetch posts from ${apiUrl}: ${response.status}`);
      // Return error but still include siteName if it was fetched
      return { error: `Failed to fetch posts: ${response.status}`, homepagePosts: [], siteName };
    }

    const posts = await response.json();
    if (!posts || posts.length === 0) {
       // Return empty posts but include siteName if fetched
      return { homepagePosts: [], siteName };
    }

    const homepagePosts = await Promise.all(
      posts.map(async (post: any, index: number): Promise<HomepagePost> => { // Added typing to post and return
        const cardData: HomepagePost = { // Use HomepagePost type
          id: post.id,
          title: post.title?.rendered ?? 'Untitled Post', // Add nullish coalescing
          link: post.link,
          excerpt: post.excerpt?.rendered ?? '', // Add nullish coalescing
          featuredMediaUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          authorName: post._embedded?.author?.[0]?.name || 'Unknown Author',
          date: post.date,
        };

        // Fetch and transform full content only for the first post (index === 0)
        if (index === 0 && post.content?.rendered) {
          try {
              const fullContent = post.content.rendered;
              const mdxResult = await transformToMdx({
                htmlContent: fullContent,
                theme: 'modern', // Keep default or adjust as needed
                title: cardData.title,
                date: cardData.date,
                author: cardData.authorName,
                featuredImage: cardData.featuredMediaUrl || undefined,
              });
               // Add fullContent property if successful
              cardData.fullContent = { originalHtml: fullContent, mdx: mdxResult.mdx };
          } catch (mdxError: any) {
               console.error(`Error transforming post ID ${post.id} to MDX:`, mdxError);
               // Keep cardData without fullContent if transformation fails
          }
        }

        return cardData;
      })
    );

    // Return successfully fetched posts AND the fetched site name
    return { homepagePosts, siteName };

  } catch (error: any) {
    console.error('Error fetching homepage preview data:', error);
     if (error.name === 'TimeoutError') {
        return { error: `Timeout fetching posts data from ${wpUrl}`, homepagePosts: [], siteName };
      }
    // Return error but still include siteName if it was fetched before the post fetch error
    return { error: error.message || 'Failed to fetch homepage preview data', homepagePosts: [], siteName };
  }
};

export async function POST(req: Request) {
  let wpUrl: string | undefined;
  try {
    const body = await req.json();
    wpUrl = body.wpUrl;

    if (!wpUrl || typeof wpUrl !== 'string') {
        return NextResponse.json({ message: 'Missing or invalid wpUrl parameter' }, { status: 400 });
    }

     // Basic URL validation/normalization (optional, but recommended)
     try {
        const urlObject = new URL(wpUrl);
        wpUrl = urlObject.origin; // Use origin to standardize
     } catch (e) {
         return NextResponse.json({ message: 'Invalid URL format provided' }, { status: 400 });
     }


  } catch (e) {
     return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }


  const data = await fetchHomepagePreviewData(wpUrl);

  // Check for specific fetch error to return 500, otherwise 200 even if posts array is empty
  if (data.error && data.error.startsWith('Failed to fetch posts')) {
     // Distinguish between actual fetch failures (500) and e.g., "no posts found" (which is handled by returning empty array)
     const status = data.error.includes('404') ? 404 : 500; // Or check other status codes
     return NextResponse.json({ message: data.error, siteName: data.siteName }, { status }); // Return siteName even on error
  } else if (data.error) {
       // Handle other errors like MDX transformation (might be a 500 or handled differently)
        console.error("API Error (Non-Post-Fetch):", data.error);
         return NextResponse.json({ message: data.error, siteName: data.siteName, homepagePosts: data.homepagePosts }, { status: 500 }); // Adjust status if needed
  }


  // Return the potentially empty posts array and the siteName
  return NextResponse.json({ homepagePosts: data.homepagePosts, siteName: data.siteName });
}