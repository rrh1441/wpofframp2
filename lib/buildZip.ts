// lib/buildZip.ts
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants';

interface BuildZipArgs {
  theme: ThemeKey;
  homepagePosts: {
    id: number;
    title: string;
    link: string;
    excerpt: string;
    featuredMediaUrl: string | null;
    authorName: string;
    date: string;
  }[];
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
    const converter = new Writable();
    converter._write = (chunk, _encoding, done) => {
      outputBuffers.push(chunk);
      done();
    };
    converter.on('finish', () => {
      resolve(Buffer.concat(outputBuffers));
    });

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      reject(new Error(`Failed to create ZIP archive: ${err.message}`));
    });

    archive.pipe(converter);

    const templateDir = path.join(process.cwd(), 'templates');

    // --- Add Project Files ---

    // 1. Homepage (app/page.tsx)
    const homepageContent = `
import Link from 'next/link';
import { PostCard } from '@/components/post-card';

const homepagePosts = ${JSON.stringify(homepagePosts)};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden p-4 md:p-8">
      <div className="container mx-auto py-8 relative z-10">
        <h1 className="text-2xl font-bold mb-6">Latest Posts</h1>
        <div className="grid gap-6">
          {homepagePosts.map((post) => (
            <PostCard
              key={post.id}
              slug={\`/posts/\${post.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}\`}
              title={post.title}
              date={post.date}
              author={post.authorName}
              excerpt={post.excerpt}
              featuredImage={post.featuredMediaUrl}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
`;
    archive.append(homepageContent, { name: 'app/page.tsx' });

    // 2. Dynamic Post Page (app/posts/[slug]/page.tsx)
    const postPageContent = `
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
    return <div>Post not found</div>;
  }
  const mdxSource = \`${mostRecentPostMdx}\`;

  const { content, frontmatter } = await compileMDX({
    source: mdxSource,
    components,
    options: { parseFrontmatter: true },
  });

  return (
    <Layout frontmatter={frontmatter}>
      {content}
    </Layout>
  );
}

export async function generateMetadata() {
  return {
    title: '${mostRecentPostTitle}',
  };
}
`;
    archive.append(postPageContent, { name: `app/posts/${mostRecentPostSlug}/page.tsx` });

    // 3. MDX Layout Component
    const layoutTemplatePath = path.join(templateDir, 'components/Layout.tsx');
    try {
      const layoutContent = await fs.readFile(layoutTemplatePath, 'utf-8');
      archive.append(layoutContent, { name: 'components/Layout.tsx' });
    } catch (err) {
      console.warn(`Warning: Could not read template file ${layoutTemplatePath}. Skipping.`, err);
    }

    // 4. Root Layout (app/layout.tsx)
    const rootLayoutTemplatePath = path.join(templateDir, 'app/layout.tsx');
    try {
      archive.file(rootLayoutTemplatePath, { name: 'app/layout.tsx' });
    } catch (err) {
      console.warn(`Warning: Could not read template file ${rootLayoutTemplatePath}. Skipping.`, err);
    }

    // 5. Global CSS (app/globals.css)
    const globalsCssPath = path.join(templateDir, 'app/globals.css');
    try {
      archive.file(globalsCssPath, { name: 'app/globals.css' });
    } catch (err) {
      console.warn(`Warning: Could not read template file ${globalsCssPath}. Skipping.`, err);
    }

    // 6. PostCard Component
    const postCardTemplatePath = path.join(templateDir, 'components/post-card.tsx');
    try {
      const postCardContent = await fs.readFile(postCardTemplatePath, 'utf-8');
      archive.append(postCardContent, { name: 'components/post-card.tsx' });
    } catch (err) {
      console.warn(`Warning: Could not read template file ${postCardTemplatePath}. Skipping.`, err);
    }

    // 7. Config Files
    const configFiles = [
      'tailwind.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
      'next.config.mjs',
      'vercel.json',
      'package.json',
      '.gitignore',
    ];

    for (const filename of configFiles) {
      const filePath = path.join(templateDir, filename);
      try {
        await fs.access(filePath);
        archive.file(filePath, { name: filename });
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`Template file not found: ${filePath}. Skipping.`);
        } else {
          console.error(`Error accessing template file ${filePath}:`, err);
        }
      }
    }

    await archive.finalize();
  });
}