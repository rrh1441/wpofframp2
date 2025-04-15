// components/post-card.tsx
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  featuredImage?: string; // Not used in this basic Matrix card
  onClick?: () => void;
}

export function PostCard({ slug, title, date, author, excerpt, onClick }: PostCardProps) {
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className="border border-green-700 bg-black/50 hover:bg-black/80 transition-colors p-4 rounded cursor-pointer"
    >
      <div className="text-xs mb-1">
        <span className="text-green-300">file://</span>
        <span className="text-green-500">{slug}.mdx</span>
      </div>

      <h2 className="text-lg font-bold hover:text-green-400 transition-colors">{title}</h2>

      <div className="mt-2 text-sm text-green-400/80">
        <span className="mr-4">@{author}</span>
        <span className="opacity-70">{formattedDate}</span>
      </div>

      <p className="mt-2 text-sm text-green-300/90 line-clamp-2">{excerpt}</p>

      <div className="mt-3 text-xs">
        <span
          className="text-green-400 hover:text-green-300 border-b border-green-700 hover:border-green-400 transition-colors"
        >
          cat {slug}.mdx | more
        </span>
      </div>
    </div>
  );
}