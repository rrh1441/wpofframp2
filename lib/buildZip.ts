// lib/buildZip.ts
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants';

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

export async function buildZip({
    theme,
    homepagePosts,
    mostRecentPostMdx,
    mostRecentPostTitle,
    mostRecentPostSlug,
}: BuildZipArgs): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const outputBuffers: Buffer[] = [];
        // *** Correctly resolve templateDir relative to the current file's directory ***
        // This assumes 'templates' is in the project root relative to where buildZip.ts lives
        // If buildZip.ts is in /lib, and templates is in /templates, this needs adjustment.
        // Assuming standard structure where buildZip.ts is in /lib and templates is in /
        // const templateDir = path.resolve(__dirname, '../../templates'); // Go up from lib, then into templates
        // ** Safer Approach: Rely on process.cwd() - ASSUMING CWD is project root **
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
                await fs.access(fullSourcePath); // Check if file exists
                // Read as buffer to avoid potential encoding issues with direct piping? Maybe overkill.
                // const fileBuffer = await fs.readFile(fullSourcePath);
                // archive.append(fileBuffer, { name: archivePath });
                archive.file(fullSourcePath, { name: archivePath }); // Archiver's built-in file handling is usually robust
                console.log(`Added ${archivePath} from template: ${fullSourcePath}`);
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    console.error(`❌ CRITICAL ERROR: Template file not found: ${fullSourcePath}`);
                    // Reject if critical files are missing
                    if (['components/Layout.tsx', 'app/layout.tsx', 'app/globals.css', 'package.json'].includes(sourcePath) || (theme === 'matrix' && sourcePath === 'components/post-card.tsx') || (theme !== 'matrix' && sourcePath === 'app/page.tsx') ) {
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
            console.log('Generating app/page.tsx for Matrix theme...');
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
              const slug = post.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || \`post-\${post.id}\`;
              return (
                <PostCard
                  key={post.id}
                  slug={\`/posts/\${slug}\`}
                  title={post.title}
                  date={post.date}
                  author={post.authorName}
                  excerpt={post.excerpt.replace(/<[^>]*>?/gm, '')}
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
            // *** THIS IS THE CORRECTED BLOCK for Ghibli/Modern ***
            console.log(`Using MDX fallback app/page.tsx for ${theme} theme...`);
            // Add the template file that renders MDX
            await addTemplateFile('app/page.tsx', 'app/page.tsx');

            // Also add the corresponding MDX content file it needs
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
            // *** END OF CORRECTED BLOCK ***
        }

        // --- 2. Generate Dynamic Post Page (app/posts/[slug]/page.tsx) ---
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
      title: string;
      date: string;
      author?: string;
      featuredImage?: string;
    }>({
      source: mdxSource,
      components,
      options: { parseFrontmatter: true },
    });

    return (
      <Layout frontmatter={frontmatter}>
        {content}
      </Layout>
    );
  } catch (error: any) {
    console.error('Error compiling MDX for post:', postSlug, error);
    return (
      <div>
        <h1>Error Compiling Post</h1>
        <pre>Slug: {postSlug}</pre>
        <pre>Error: {error.message}</pre>
      </div>
    );
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (params.slug === '${mostRecentPostSlug}') {
    return {
      title: '${mostRecentPostTitle.replace(/'/g, "\\'")}',
    };
  }
  return { title: 'Post Not Found' };
}`;
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
             { src: 'vercel.json', dest: 'vercel.json' }, // Include template vercel.json IF it exists and is desired
            { src: 'package.json', dest: 'package.json' },
            { src: '.gitignore', dest: '.gitignore' },
            { src: 'app/layout.tsx', dest: 'app/layout.tsx' },
            { src: 'app/globals.css', dest: 'app/globals.css' },
        ];

        for (const file of staticFiles) {
            // Use addTemplateFile helper which includes error handling/logging
            await addTemplateFile(file.src, file.dest);
        }

        // --- Finalize Archive ---
        console.log('Finalizing ZIP archive...');
        await archive.finalize();
        console.log('ZIP archive finalized successfully.');
    });
}