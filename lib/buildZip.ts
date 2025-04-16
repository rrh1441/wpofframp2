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

    const converter = new Writable({
      write(chunk, _encoding, done) {
        outputBuffers.push(chunk);
        done();
      },
    });

    converter.on('finish', () => {
      resolve(Buffer.concat(outputBuffers));
    });

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      reject(new Error(`Failed to create ZIP archive: ${err.message}`));
    });

    archive.pipe(converter);

    const templateDir = path.join(process.cwd(), 'templates');

    // --- Conditional Homepage ---
    let homepageContent = '';

    if (theme === 'matrix') {
      homepageContent = `
import Link from 'next/link';
import { PostCard } from '../components/post-card';

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
    } else {
      homepageContent = `
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Theme "${theme}" doesn't use a homepage layout. Open a post to view the site preview.</p>
    </main>
  );
}
`;
    }

    archive.append(homepageContent, { name: 'app/page.tsx' });

    // --- Dynamic Post Page ---
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
    archive.append(postPageContent, {
      name: `app/posts/${mostRecentPostSlug}/page.tsx`,
    });

    // --- Components ---
    const layoutTemplatePath = path.join(templateDir, 'components/Layout.tsx');
    try {
      const layoutContent = await fs.readFile(layoutTemplatePath, 'utf-8');
      archive.append(layoutContent, { name: 'components/Layout.tsx' });
    } catch (err) {
      console.warn(`Warning: Missing Layout.tsx: ${layoutTemplatePath}`, err);
    }

    if (theme === 'matrix') {
      const postCardPath = path.join(templateDir, 'components/post-card.tsx');
      try {
        await fs.access(postCardPath);
        const postCardContent = await fs.readFile(postCardPath, 'utf-8');
        archive.append(postCardContent, { name: 'components/post-card.tsx' });
      } catch (err) {
        console.error(`❌ ERROR: Missing required file for Matrix theme: ${postCardPath}`);
        return reject(err);
      }
    }

    // --- Static App Files ---
    const staticFiles = [
      'tailwind.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
      'next.config.mjs',
      'vercel.json',
      'package.json',
      '.gitignore',
      'app/layout.tsx',
      'app/globals.css',
    ];

    for (const filename of staticFiles) {
      const filePath = path.join(templateDir, filename);
      try {
        await fs.access(filePath);
        archive.file(filePath, { name: filename });
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`Template file not found: ${filePath}. Skipping.`);
        } else {
          console.error(`Error accessing ${filePath}:`, err);
        }
      }
    }

    await archive.finalize();
  });
}
