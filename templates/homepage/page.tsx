// templates/homepage/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

/* POST_DATA_HERE */

export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Homepage</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {postsData.map((post) => (
          <div key={post.id} className="border rounded-md shadow-md p-4">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600 text-sm mb-2">{formatDistanceToNow(new Date(post.date), { addSuffix: true })}</p>
            <p className="text-gray-700 mb-2 line-clamp-3">{post.excerpt}</p>
            {post.featuredMediaUrl && (
              <div className="relative aspect-video mb-2 overflow-hidden rounded-md">
                <Image src={post.featuredMediaUrl} alt={post.title} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            {post.fullContent ? (
              <Link href={`/posts/${post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-blue-500 hover:underline">
                Read More
              </Link>
            ) : (
              <span className="text-gray-500">Summary Only</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}