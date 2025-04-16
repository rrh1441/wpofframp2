// lib/buildZip.ts
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants'; // Assuming constants.ts defines ThemeKey

// Define the structure for homepage post data passed to the function
interface HomepagePostData {
  id: number;
  title: string;
  link: string; // Keep for potential future use
  excerpt: string;
  featuredMediaUrl: string | null;
  authorName: string;
  date: string;
}

// Define the arguments for the buildZip function
interface BuildZipArgs {
  theme: ThemeKey;
  homepagePosts: HomepagePostData[];
  mostRecentPostMdx: string;
  mostRecentPostTitle: string;
  mostRecentPostSlug: string; // Slug for the most recent post page route
}

export async function buildZip({
  theme,
  homepagePosts,
  mostRecentPostMdx,
  mostRecentPostTitle,
  mostRecentPostSlug,
}: BuildZipArgs): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const outputBuffers: Buffer[] = [];
    const templateDir = path.join(process.cwd(), 'templates'); // Base directory for template files

    // --- Stream Setup ---
    const converter = new Writable({
      write(chunk, _encoding, done) {
        outputBuffers.push(chunk);
        done();
      },
    });
    converter.on('finish', () => resolve(Buffer.concat(outputBuffers)));

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('warning', (err) => {
      console.warn('Archiver warning:', err);
    });
    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      reject(new Error(`Failed to create ZIP archive: ${err.message}`));
    });
    archive.pipe(converter);

    // --- Helper to add files from template directory ---
    const addTemplateFile = async (sourcePath: string, archivePath: string) => {
      const fullSourcePath = path.join(templateDir, sourcePath);
      try {
        await fs.access(fullSourcePath); // Check if file exists
        archive.file(fullSourcePath, { name: archivePath });
        console.log(`Added ${archivePath} from template.`);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`Template file not found, skipping: ${fullSourcePath}`);
        } else {
          console.error(`Error accessing template file ${fullSourcePath}:`, err);
          // Consider rejecting if a critical file is missing depending on the file
          // reject(new Error(`Missing critical template file: ${sourcePath}`));
        }
      }
    };

    // --- 1. Generate or Read app/page.tsx based on theme ---
    if (theme === 'matrix') {
      console.log('Generating app/page.tsx for Matrix theme...');
      // Use template literals carefully, ensuring no invisible chars
      const matrixHomepageContent = `// app/page.tsx (Matrix Theme)
import Link from 'next/link';
import { PostCard } from '../components/post-card'; // Ensure PostCard is included for Matrix

// Data is embedded directly for simplicity in the generated file
const homepagePosts = ${JSON.stringify(homepagePosts, null, 2)};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 border-b border-green-700 pb-2">/// LATEST TRANSMISSIONS ///</h1>
        <div className="grid gap-6">
          {homepagePosts.length > 0 ? (
            homepagePosts.map((post) => {
              // Basic slug generation - ensure consistency with post page generation
              const slug = post.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || \`post-\${post.id}\`;
              return (
                <PostCard
                  key={post.id}
                  slug={\`/posts/\${slug}\`} // Link to the dynamic post route
                  title={post.title}
                  date={post.date}
                  author={post.authorName}
                  // Excerpt might need cleaning if it contains HTML
                  excerpt={post.excerpt.replace(/<[^>]*>?/gm, '')} // Basic HTML stripping for excerpt
                  // featuredImage={post.featuredMediaUrl} // PostCard doesn't use featuredImage currently
                />
              );
            })
          ) : (
            <p>No posts found.</p>
          )}
        </div>
      </div>
    </main>
  );
}`;
      archive.append(Buffer.from(matrixHomepageContent, 'utf8'), { name: 'app/page.tsx' });

    } else {
      // For Modern or Ghibli, use the template page.tsx that loads page.mdx
      console.log(`Using MDX fallback app/page.tsx for ${theme} theme...`);
      const fallbackPagePath = path.join(templateDir, 'app/page.tsx'); // This template loads page.mdx
      try {
        // Read the template file content explicitly as UTF-8
        const fallbackPageContentBuffer = await fs.readFile(fallbackPagePath);
        const fallbackPageContentString = fallbackPageContentBuffer.toString('utf8');
        archive.append(Buffer.from(fallbackPageContentString, 'utf8'), { name: 'app/page.tsx' });
        console.log('Added fallback app/page.tsx from template.');

        // Also add a basic page.mdx for this fallback page to render
        const fallbackMdxContent = `---
title: Welcome to Your Migrated Site!
author: WP Offramp
date: ${new Date().toISOString().split('T')[0]}
---

# Welcome!

This is the homepage content for your site migrated with WP Offramp using the **${theme}** theme.

You can edit this content in the \`app/page.mdx\` file.

Here's some example Markdown content:

* List item one
* List item two

> A sample blockquote. Isn't Markdown neat?

Learn more about Next.js and MDX to customize your site further!
`;
        archive.append(Buffer.from(fallbackMdxContent, 'utf8'), { name: 'app/page.mdx' });
        console.log('Added fallback app/page.mdx.');

      } catch (err: any) {
        console.error(`❌ ERROR: Missing fallback template file: ${fallbackPagePath}`);
        return reject(new Error(`Missing critical fallback template file: app/page.tsx. Error: ${err.message}`));
      }
    }

    // --- 2. Generate Dynamic Post Page (app/posts/[slug]/page.tsx) ---
    console.log(`Generating post page at app/posts/${mostRecentPostSlug}/page.tsx...`);
    const postPageContent = `// app/posts/${mostRecentPostSlug}/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout'; // Make sure Layout component exists

// Define any components you want to use within MDX
// Example: import { MyCustomComponent } from '@/components/MyCustomComponent';
const components = {
  // MyCustomComponent,
};

// Since we only have one post, we pre-define its slug
export async function generateStaticParams() {
  return [{ slug: '${mostRecentPostSlug}' }];
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const postSlug = params.slug;

  // Basic check, though generateStaticParams handles this in build
  if (postSlug !== '${mostRecentPostSlug}') {
    // In a real app, you might fetch dynamically or return 404
    // For this single-post export, this indicates an issue.
    return <div>Error: Post slug mismatch. Expected '${mostRecentPostSlug}', got '\${postSlug}'.</div>;
  }

  // Embed the MDX content directly into the generated file
  // Using backticks allows multiline string content
  // Ensure backticks within the MDX content itself are escaped
  const mdxSource = \`${mostRecentPostMdx.replace(/`/g, '\\`')}\`;

  try {
    const { content, frontmatter } = await compileMDX<{
      title: string;
      date: string;
      author?: string;
      featuredImage?: string;
      // Add other expected frontmatter fields here
    }>({
      source: mdxSource,
      components,
      options: {
        parseFrontmatter: true,
        // Add any remark/rehype plugins if needed in the future
        // mdxOptions: { remarkPlugins: [], rehypePlugins: [] }
      },
    });

    return (
      // Ensure the Layout component can handle the frontmatter props
      <Layout frontmatter={frontmatter}>
        {content}
      </Layout>
    );
  } catch (error: any) {
    console.error('Error compiling MDX for post:', postSlug, error);
    return (
      <div>
        <h1>Error Compiling Post</h1>
        <p>There was an issue processing the MDX content for this post.</p>
        <pre>Slug: {postSlug}</pre>
        <pre>Error: {error.message}</pre>
      </div>
    );
  }
}

// Generate metadata for the post page using the title from build args
export async function generateMetadata({ params }: { params: { slug: string } }) {
  // In this simple case, we use the title passed during build
  // Escape single quotes for the string literal
  if (params.slug === '${mostRecentPostSlug}') {
    return {
      title: '${mostRecentPostTitle.replace(/'/g, "\\'")}',
    };
  }
  return { title: 'Post Not Found' };
}`;
    // Append the generated content as a Buffer encoded in UTF-8
    archive.append(Buffer.from(postPageContent, 'utf8'), { name: `app/posts/${mostRecentPostSlug}/page.tsx` });

    // --- 3. Add Layout Component ---
    console.log('Adding components/Layout.tsx...');
    await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx');

    // --- 4. Conditionally Add PostCard Component ---
    if (theme === 'matrix') {
      console.log('Adding components/post-card.tsx for Matrix theme...');
      await addTemplateFile('components/post-card.tsx', 'components/post-card.tsx');
    } else {
      console.log(`Skipping components/post-card.tsx for ${theme} theme.`);
    }

    // --- 5. Add Static Project Files ---
    console.log('Adding static project files...');
    const staticFiles = [
      { src: 'tailwind.config.ts', dest: 'tailwind.config.ts' },
      { src: 'postcss.config.mjs', dest: 'postcss.config.mjs' },
      { src: 'tsconfig.json', dest: 'tsconfig.json' },
      { src: 'next.config.mjs', dest: 'next.config.mjs' },
      { src: 'vercel.json', dest: 'vercel.json' },
      { src: 'package.json', dest: 'package.json' },
      { src: '.gitignore', dest: '.gitignore' },
      { src: 'app/layout.tsx', dest: 'app/layout.tsx' },
      { src: 'app/globals.css', dest: 'app/globals.css' },
    ];

    for (const file of staticFiles) {
      await addTemplateFile(file.src, file.dest);
    }

    // --- Finalize Archive ---
    console.log('Finalizing ZIP archive...');
    await archive.finalize();
    console.log('ZIP archive finalized successfully.');
  });
}