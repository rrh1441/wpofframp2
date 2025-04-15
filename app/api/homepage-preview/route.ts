// app/api/homepage-preview/route.ts
import { NextResponse } from 'next/server';
import { transformToMdx } from '@/lib/transformToMdx';

const fetchHomepagePreviewData = async (wpUrl: string) => {
  try {
    const apiUrl = `${wpUrl}/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=true`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WP-Offramp-Homepage-Preview/2.0',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch posts from ${apiUrl}: ${response.status}`);
      return { error: `Failed to fetch posts: ${response.status}` };
    }

    const posts = await response.json();
    if (!posts || posts.length === 0) {
      return { homepagePosts: [] };
    }

    const homepagePosts = await Promise.all(
      posts.map(async (post, index) => {
        const cardData = {
          id: post.id,
          title: post.title.rendered,
          link: post.link,
          excerpt: post.excerpt.rendered,
          featuredMediaUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          authorName: post._embedded?.author?.[0]?.name || 'Unknown Author',
          date: post.date,
        };

        if (index === 0) {
          const fullContent = post.content.rendered;
          const mdxResult = await transformToMdx({
            htmlContent: fullContent,
            theme: 'modern', // Default theme for processing, can be adjusted
            title: post.title.rendered,
            date: post.date,
            author: post._embedded?.author?.[0]?.name || 'Unknown Author',
            featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || undefined,
          });
          return { ...cardData, fullContent: { originalHtml: fullContent, mdx: mdxResult.mdx } };
        }

        return cardData;
      })
    );

    return { homepagePosts };
  } catch (error: any) {
    console.error('Error fetching homepage preview data:', error);
    return { error: error.message || 'Failed to fetch homepage preview data' };
  }
};

export async function POST(req: Request) {
  const { wpUrl } = await req.json();

  if (!wpUrl) {
    return NextResponse.json({ error: 'Missing wpUrl' }, { status: 400 });
  }

  const data = await fetchHomepagePreviewData(wpUrl);

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  return NextResponse.json(data);
}