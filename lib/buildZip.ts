// lib/buildZip.ts (Attempting Matrix without PostCard component)
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants'; // Assuming constants.ts defines ThemeKey
import { formatDistanceToNow } from 'date-fns'; // Import date-fns here

// Define the structure for homepage post data passed to the function
interface HomepagePostData {
    id: number;
    title: string;
    link: string;
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
    mostRecentPostSlug: string;
}

// Helper function to format date (moved here for use in generated code)
function formatDateDistance(isoDate: string): string {
    try {
        return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
    } catch (e) {
        console.warn(`Error formatting date: ${isoDate}`, e);
        return isoDate; // Fallback
    }
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
        const templateDir = path.join(process.cwd(), 'templates');

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
                await fs.access(fullSourcePath);
                archive.file(fullSourcePath, { name: archivePath });
                console.log(`Added ${archivePath} from template: ${fullSourcePath}`);
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    console.error(`❌ CRITICAL ERROR: Template file not found: ${fullSourcePath}`);
                     // Reject if critical files are missing (post-card is no longer checked here)
                     if (['components/Layout.tsx', 'app/layout.tsx', 'app/globals.css', 'package.json'].includes(sourcePath) || (theme !== 'matrix' && sourcePath === 'app/page.tsx') ) {
                        reject(new Error(`Missing critical template file: ${sourcePath}. Build cannot proceed.`));
                    } else {
                         console.warn(`Non-critical template file not found, skipping: ${fullSourcePath}`);
                    }
                } else {
                    console.error(`Error accessing template file ${fullSourcePath}:`, err);
                    reject(new Error(`Error accessing template file: ${sourcePath}. Error: ${err.message}`));
                }
            }
        };

        // --- 1. Generate or Read app/page.tsx based on theme ---
        if (theme === 'matrix') {
            console.log('Generating app/page.tsx for Matrix theme (inline rendering)...');
            // ** MODIFIED: Generate inline rendering instead of using PostCard **
            const matrixHomepageContent = `// app/page.tsx (Matrix Theme - Inline Rendering)
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns'; // Need date-fns for formatting

// Data is embedded directly
const homepagePosts = ${JSON.stringify(homepagePosts, null, 2)};

// Helper function directly in the generated file
function formatDateDistance(isoDate: string): string {
    try {
        return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
    } catch (e) {
        // console.warn(\`Error formatting date: \${isoDate}\`, e);
        return isoDate; // Fallback
    }
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 border-b border-green-700 pb-2">/// LATEST TRANSMISSIONS ///</h1>
        <div className="grid gap-6">
          {homepagePosts.length > 0 ? (
            homepagePosts.map((post) => {
              const slug = post.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || \`post-\${post.id}\`;
              const postLink = \`/posts/\${slug}\`;
              // Basic HTML stripping for excerpt
              const cleanExcerpt = post.excerpt.replace(/<[^>]*>?/gm, '');
              const formattedDate = formatDateDistance(post.date);

              return (
                // Replicate PostCard structure and styling directly
                <div key={post.id} className="border border-green-700 bg-black/50 hover:bg-black/80 transition-colors p-4 rounded">
                  <div className="text-xs mb-1">
                    <span className="text-green-300">file://</span>
                    <span className="text-green-500">{slug}.mdx</span>
                  </div>

                  <Link href={postLink} className="text-lg font-bold text-green-400 hover:text-green-200 transition-colors block truncate">
                    {post.title}
                  </Link>

                  <div className="mt-2 text-sm text-green-400/80">
                    <span className="mr-4">@{post.authorName || 'unknown'}</span>
                    <span className="opacity-70">{formattedDate}</span>
                  </div>

                  <p className="mt-2 text-sm text-green-300/90 line-clamp-2">{cleanExcerpt}</p>

                  <div className="mt-3 text-xs">
                    <Link href={postLink} className="text-green-400 hover:text-green-300 border-b border-green-700 hover:border-green-400 transition-colors">
                      cat {slug}.mdx | more
                    </Link>
                  </div>
                </div>
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
            await addTemplateFile('app/page.tsx', 'app/page.tsx');

            const fallbackMdxContent = `---
title: Welcome to Your Migrated Site!
author: WP Offramp
date: ${new Date().toISOString().split('T')[0]}
---

# Welcome!

This is the homepage content for your site migrated with WP Offramp using the **${theme}** theme.

You can edit this content in the \`app/page.mdx\` file.
`;
            archive.append(Buffer.from(fallbackMdxContent, 'utf8'), { name: 'app/page.mdx' });
            console.log('Added fallback app/page.mdx.');
        }

        // --- 2. Generate Dynamic Post Page (app/posts/[slug]/page.tsx) ---
        // (Content remains the same as before)
        console.log(`Generating post page at app/posts/${mostRecentPostSlug}/page.tsx...`);
        const postPageContent = `// app/posts/${mostRecentPostSlug}/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout';

const components = {};

export async function generateStaticParams() {
  return [{ slug: '${mostRecentPostSlug}' }];
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const postSlug = params.slug;
  if (postSlug !== '${mostRecentPostSlug}') {
    return <div>Error: Post slug mismatch. Expected '${mostRecentPostSlug}', got '\${postSlug}'.</div>;
  }
  const mdxSource = \`${mostRecentPostMdx.replace(/`/g, '\\`')}\`;
  try {
    const { content, frontmatter } = await compileMDX<{
      title: string; date: string; author?: string; featuredImage?: string;
    }>({
      source: mdxSource,
      components,
      options: { parseFrontmatter: true },
    });
    return (<Layout frontmatter={frontmatter}>{content}</Layout>);
  } catch (error: any) {
    console.error('Error compiling MDX for post:', postSlug, error);
    return (<div><h1>Error Compiling Post</h1><pre>Slug: {postSlug}</pre><pre>Error: {error.message}</pre></div>);
  }
}
export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (params.slug === '${mostRecentPostSlug}') {
    return { title: '${mostRecentPostTitle.replace(/'/g, "\\'")}' };
  }
  return { title: 'Post Not Found' };
}`;
        archive.append(Buffer.from(postPageContent, 'utf8'), { name: `app/posts/${mostRecentPostSlug}/page.tsx` });

        // --- 3. Add Layout Component ---
        console.log('Adding components/Layout.tsx...');
        await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx');

        // --- 4. Conditionally Add PostCard Component ---
        // ** REMOVED THIS ENTIRE BLOCK **
        // if (theme === 'matrix') {
        //     console.log('Adding components/post-card.tsx for Matrix theme...');
        //     await addTemplateFile('components/post-card.tsx', 'components/post-card.tsx');
        // } else {
        //     console.log(`Skipping components/post-card.tsx for ${theme} theme.`);
        // }
        console.log('Skipping addTemplateFile for components/post-card.tsx entirely.');


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