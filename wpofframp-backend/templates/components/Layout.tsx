// templates/components/Layout.tsx
import React from 'react';

// Define the expected shape of the frontmatter object
interface LayoutProps {
  frontmatter: {
    title?: string;
    date?: string;
    author?: string;
    featuredImage?: string;
    // Allow any other fields that might come from frontmatter
    [key: string]: any;
  };
  children: React.ReactNode; // To render the MDX content
}

// Basic Layout component using Tailwind Typography for styling MDX content
export default function Layout({ frontmatter, children }: LayoutProps) {
  return (
    // Apply prose class for typography, center content, add padding
    <article className="prose prose-lg mx-auto px-4 py-8 md:px-6 md:py-12">
      {/* Optional: Render a header based on frontmatter */}
      {frontmatter.title && (
        <header className="mb-8 border-b pb-4">
          <h1 className="!mb-2 text-3xl font-extrabold tracking-tight md:text-4xl"> {/* !mb-2 overrides prose */}
            {frontmatter.title}
          </h1>
          {(frontmatter.date || frontmatter.author) && (
            <div className="text-sm text-gray-500">
              {frontmatter.author && <span>By {frontmatter.author}</span>}
              {frontmatter.date && (
                <span className={frontmatter.author ? 'ml-3' : ''}>
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </header>
      )}

      {/* Render the main MDX content passed as children */}
      {children}

    </article>
  );
}