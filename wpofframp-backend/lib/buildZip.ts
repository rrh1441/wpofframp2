/* eslint-disable no-console */
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants';

interface HomepagePostData {
  id: number;
  title: string;
  link: string;
  excerpt: string;
  featuredMediaUrl: string | null;
  authorName: string;
  date: string;
}

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
    /* stream / archive setup ----------------------------------------- */
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(c, _e, n) {
        chunks.push(c);
        n();
      },
    });
    sink.on('finish', () => resolve(Buffer.concat(chunks)));

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => reject(err));
    archive.pipe(sink);

    const templateDir = path.join(process.cwd(), 'templates');
    const copyTpl = async (src: string, dest: string, crit = false) => {
      const full = path.join(templateDir, src);
      try {
        await fs.access(full);
        archive.file(full, { name: dest });
      } catch (e: any) {
        if (crit || e.code !== 'ENOENT') reject(e);
      }
    };

    /* helpers injected into page ------------------------------------- */
    const demoPosts = homepagePosts.slice(0, 3);
    const postsJson = JSON.stringify(demoPosts, null, 2);

    const helpers = `
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

const postsData = ${postsJson};

const latestSlug = '${mostRecentPostSlug}';

const generateSlug = (t: string, id: number) =>
  (t?.replace(/[^a-z0-9]+/gi, '-').toLowerCase().substring(0, 50) || \`post-\${id}\`);

const strip = (html: string) =>
  typeof html === 'string' ? html.replace(/<[^>]*>?/gm, '') : '';

const fmt = (iso: string) => {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return iso; }
};

const siteName = (() => {
  try { return new URL(postsData[0]?.link ?? '').hostname.replace(/^www\\./, ''); }
  catch { return 'My Site'; }
})();
`;

    /* home page component -------------------------------------------- */
    let page = '';

    /* MATRIX --------------------------------------------------------- */
    if (theme === 'matrix') {
      page = `// app/page.tsx (Matrix)
${helpers}

export default function HomePage() {
  const prompt = \`visitor@matrix-site:~$ \`;

  return (
    <main className="matrix-homepage min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <header className="text-2xl font-bold mb-8">{siteName}</header>

      {postsData.map((p, i) => {
        const slug = i === 0 ? latestSlug : generateSlug(p.title, p.id);
        const isHero = i === 0;
        const link = isHero ? \`/posts/\${slug}\` : '#';

        return (
          <div key={p.id}
            className={\`theme-card matrix-card border border-green-700 bg-black/50 p-4 rounded mb-6 \${isHero ? 'matrix-card-active hover:bg-black/80 cursor-pointer' : 'opacity-70 cursor-default'}\`}>
            <div className="text-xs mb-1 truncate">
              <span className="text-green-300">file://</span>
              <span className="text-green-500">{slug}.mdx</span>
            </div>

            <h2 className="text-lg font-bold mb-2">
              <span className="text-[#4ade80] mr-2">#{i + 1}</span>
              {isHero ? <Link href={link}>{p.title}</Link> : p.title}
            </h2>

            <div className="text-sm text-green-400/80">
              <span className="mr-4">@{p.authorName || 'unknown'}</span>
              <span className="opacity-70">{fmt(p.date)}</span>
            </div>

            <p className="mt-2 text-sm text-green-300/90 line-clamp-2">{strip(p.excerpt)}</p>
            {isHero && (
              <div className="mt-3 text-xs">
                <Link href={link} className="border-b border-green-700 hover:border-green-400">
                  cat {slug}.mdx | more
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
`;
    } else {
      /* GHIBLI / MODERN ---------------------------------------------- */
      page = `// app/page.tsx (${theme})
${helpers}

export default function HomePage() {
  const t = '${theme}';
  const hero = postsData[0]!;        /* non‑null */
  const cards = postsData.slice(1);

  return (
    <main className={\`container mx-auto p-4 md:p-8 space-y-12 \${t}-homepage\`}>
      <header className="site-header text-3xl font-bold mb-8">{siteName}</header>

      {/* HERO */}
      <Link href={\`/posts/\${latestSlug}\`} className="block">
        <article className={\`\${t}-featured-card relative rounded-lg overflow-hidden aspect-video cursor-pointer\`}>
          {hero.featuredMediaUrl && (
            <Image
              src={hero.featuredMediaUrl}
              alt={hero.title || 'Featured image'}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          )}
          <div className="featured-post-gradient absolute inset-0" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white drop-shadow-lg">
            <h2 className={\`\${t}-featured-title text-3xl md:text-4xl font-bold mb-2\`}>
              {hero.title}
            </h2>
            <p className="hidden sm:block text-sm opacity-90 line-clamp-2">{strip(hero.excerpt)}</p>
            <p className="mt-2 text-xs opacity-70">By {hero.authorName || 'Unknown'} • {fmt(hero.date)}</p>
          </div>
        </article>
      </Link>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {cards.map((p) => {
          const slug = generateSlug(p.title, p.id);
          return (
            <Link key={p.id} href={\`/posts/\${slug}\`} className="block h-full">
              <article className={\`theme-card \${t}-card border rounded-lg overflow-hidden shadow-md flex flex-col h-full bg-card text-card-foreground theme-card-active hover:shadow-lg transition-shadow\`}>
                {p.featuredMediaUrl && (
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <Image
                      src={p.featuredMediaUrl}
                      alt={p.title || 'Post image'}
                      fill
                      sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="theme-card-title text-lg font-semibold mb-2 line-clamp-2 leading-tight">{p.title}</h3>
                  <p className="theme-card-excerpt text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">{strip(p.excerpt)}</p>
                  <div className="theme-card-meta text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <span>By {p.authorName || 'Unknown'}</span> • <span>{fmt(p.date)}</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
`;
    }

    archive.append(Buffer.from(page, 'utf8'), { name: 'app/page.tsx' });

    /* single post page ------------------------------------------------ */
    const postPage = `// app/posts/${mostRecentPostSlug}/page.tsx
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout';

export async function generateStaticParams() {
  return [{ slug: '${mostRecentPostSlug}' }];
}

export default async function PostPage() {
  const mdx = \`${mostRecentPostMdx.replace(/`/g, '\\`')}\`;
  const { content, frontmatter } = await compileMDX({ source: mdx, options: { parseFrontmatter: true } });
  return <Layout frontmatter={frontmatter}>{content}</Layout>;
}

export async function generateMetadata() {
  return { title: '${mostRecentPostTitle.replace(/'/g, "\\'")}' };
}
`;
    archive.append(Buffer.from(postPage, 'utf8'), {
      name: `app/posts/${mostRecentPostSlug}/page.tsx`,
    });

    /* theme CSS ------------------------------------------------------- */
    archive.file(path.join(templateDir, 'themes', theme, 'theme.css'), {
      name: 'app/theme.css',
    });

    /* copy core template assets -------------------------------------- */
    await copyTpl('components/Layout.tsx', 'components/Layout.tsx', true);

    const tplFiles: Array<[string, string, boolean?]> = [
      ['tailwind.config.ts', 'tailwind.config.ts', true],
      ['postcss.config.mjs', 'postcss.config.mjs', true],
      ['tsconfig.json', 'tsconfig.json', true],
      ['vercel.json', 'vercel.json', true],
      ['package.json', 'package.json', true],
      ['.gitignore', '.gitignore'],
      ['app/layout.tsx', 'app/layout.tsx', true],
      ['app/globals.css', 'app/globals.css', true],
    ];
    for (const [s, d, c] of tplFiles) await copyTpl(s, d, !!c);

    /* dynamic next.config.mjs ---------------------------------------- */
    const imgDomains = Array.from(
      new Set(
        homepagePosts
          .map((p) => {
            try {
              return p.featuredMediaUrl ? new URL(p.featuredMediaUrl).hostname : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean) as string[],
      ),
    );

    const nextCfg = `/** Auto‑generated */
const nextConfig = {
  images: { domains: ${JSON.stringify(imgDomains)} },
};
export default nextConfig;
`;
    archive.append(Buffer.from(nextCfg, 'utf8'), { name: 'next.config.mjs' });

    /* optional /public assets ---------------------------------------- */
    try {
      await fs.access(path.join(templateDir, 'public'));
      archive.directory(path.join(templateDir, 'public'), 'public');
    } catch {/* ignore */}
    await archive.finalize();
  });
}
