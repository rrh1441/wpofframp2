// lib/fetchWpContent.ts
export interface WpContent {
    title: string;
    content: string; // HTML body
    date: string;
    author: string;
    featuredImage?: string; // URL of the featured image
    error?: string; // Optional error message
    status?: number; // Optional HTTP status code for errors
  }
  
  /**
   * Fetches the most recent post from a given WordPress site URL.
   * Includes embedded data for author and featured image.
   * Handles common errors.
   */
  export async function fetchWpContent(wpUrl: string): Promise<WpContent> {
    let apiUrl = '';
    try {
      // 1. Validate and normalize the URL
      const url = new URL(wpUrl);
      apiUrl = `${url.origin}/wp-json/wp/v2/posts?per_page=1&orderby=date&order=desc&_embed=true`;
  
      // 2. Fetch data
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'WP-Offramp-Fetcher/1.0', // Be a good citizen
        },
        // Short timeout to prevent hanging on unresponsive sites
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });
  
      // 3. Handle HTTP errors
      if (!response.ok) {
        console.error(
          `WP API request failed for ${wpUrl}: ${response.status} ${response.statusText}`
        );
        if (response.status === 404) {
          return {
            error: `WordPress REST API not found at ${url.origin}. Ensure it's enabled and accessible.`,
            status: 404,
            title: '',
            content: '',
            date: '',
            author: '',
          };
        }
        return {
          error: `Failed to fetch content. WordPress site returned status: ${response.status}`,
          status: response.status,
          title: '',
          content: '',
          date: '',
          author: '',
        };
      }
  
      // 4. Parse JSON
      const posts = await response.json();
  
      // 5. Handle empty response or malformed data
      if (!Array.isArray(posts) || posts.length === 0) {
        return {
          error: 'No posts found on the WordPress site.',
          status: 404, // Treat as not found
          title: '',
          content: '',
          date: '',
          author: '',
        };
      }
  
      const post = posts[0];
  
      if (!post || !post.title?.rendered || !post.content?.rendered || !post.date) {
         console.error('Malformed post data received:', post);
         return {
           error: 'Received incomplete or malformed post data from the WordPress site.',
           status: 500,
           title: '',
           content: '',
           date: '',
           author: '',
         };
      }
  
      // 6. Extract required data, handling potential missing embedded info
      const title = post.title.rendered;
      const content = post.content.rendered;
      const date = post.date; // ISO 8601 format string
  
      // Author: Try embedded first, fallback to a default
      const author = post._embedded?.author?.[0]?.name ?? 'Unknown Author';
  
      // Featured Image: Check embedded data for a usable size
      let featuredImage: string | undefined = undefined;
      const mediaDetails = post._embedded?.['wp:featuredmedia']?.[0]?.media_details;
      if (mediaDetails?.sizes) {
        // Prefer 'large' or 'medium_large', fallback to 'full' or first available
        featuredImage =
          mediaDetails.sizes.large?.source_url ??
          mediaDetails.sizes.medium_large?.source_url ??
          mediaDetails.sizes.full?.source_url ??
          Object.values(mediaDetails.sizes)[0]?.source_url;
      }
  
  
      return {
        title,
        content,
        date,
        author,
        featuredImage,
      };
    } catch (error: any) {
      console.error(`Error fetching WP content from ${wpUrl || 'invalid URL'}:`, error);
  
      // Handle specific error types
      if (error.name === 'AbortError') {
           return { error: `Request to WordPress site timed out.`, status: 408, title: '', content: '', date: '', author: '' };
      }
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
          return { error: `Invalid WordPress URL provided.`, status: 400, title: '', content: '', date: '', author: '' };
      }
       if (error.message.includes('fetch failed') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
           return { error: `Could not connect to the WordPress site at ${wpUrl}. Check the URL and ensure the site is online.`, status: 503, title: '', content: '', date: '', author: '' };
       }
  
  
      return {
        error: `An unexpected error occurred while fetching content: ${error.message}`,
        status: 500,
        title: '',
        content: '',
        date: '',
        author: '',
      };
    }
  }