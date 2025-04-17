import fs from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import { Writable } from 'stream'
import { ThemeKey } from './constants'

interface HomepagePostData {
  id: number
  title: string
  link: string
  excerpt: string
  featuredMediaUrl: string | null
  authorName: string
  date: string
}

interface BuildZipArgs {
  theme: ThemeKey
  homepagePosts: HomepagePostData[]
  mostRecentPostMdx: string
  mostRecentPostTitle: string
  mostRecentPostSlug: string
}

const generateSlug = (title: string, id: number): string => {
  return (
    title?.replace(/[^a-z0-9]+/gi, '-').toLowerCase().substring(0, 50) ||
    `post-${id}`
  )
}

const stripHtml = (html: string): string => {
  if (typeof html !== 'string') return ''
  return html.replace(/<[^>]*>?/gm, '')
}

export async function buildZip({
  theme,
  homepagePosts,
  mostRecentPostMdx,
  mostRecentPostTitle,
  mostRecentPostSlug,
}: BuildZipArgs): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const outputBuffers: Buffer[] = []
    const templateDir = path.join(process.cwd(), 'templates')

    const converter = new Writable({
      write(chunk, _encoding, done) {
        outputBuffers.push(chunk)
        done()
      },
    })
    converter.on('finish', () => resolve(Buffer.concat(outputBuffers)))

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('warning', (err) => console.warn('Archiver warning:', err))
    archive.on('error', (err) =>
      reject(new Error(`Failed to create ZIP archive: ${err.message}`)),
    )
    archive.pipe(converter)

    const addTemplateFile = async (src: string, dest: string) => {
      const fullSrc = path.join(templateDir, src)
      try {
        await fs.access(fullSrc)
        archive.file(fullSrc, { name: dest })
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          const critical = [
            'components/Layout.tsx',
            'app/layout.tsx',
            'app/globals.css',
            'package.json',
          ]
          if (critical.includes(src)) {
            reject(
              new Error(`Missing critical template file: ${src}. Aborting.`),
            )
          }
        } else reject(err)
      }
    }

    const postsDataString = JSON.stringify(homepagePosts, null, 2)

    const commonImports = `
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

const postsData: any[] = ${postsDataString};

const generateSlug = (title: string, id: number): string => {
  return (title?.replace(/[^a-z0-9]+/gi, '-').toLowerCase().substring(0, 50) || \`post-\${id}\`);
};

const stripHtml = (html: string): string => {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>?/gm, '');
};

const formatDateDistance = (isoDate: string): string => {
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch {
    return isoDate;
  }
};
`

    let homepageContent = ''

    switch (theme) {
      case 'matrix':
        homepageContent = `// app/page.tsx (Matrix)
${commonImports}

export default function HomePage() {
  const hostname = "matrix-site";
  const promptUser = "visitor";
  const promptString = \`\${promptUser}@\${hostname}:~$\`;

  return (
    <main className="matrix-homepage min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300">ls -la /posts</div>
        </div>
        <div className="grid gap-0">
          {postsData.map((post, index) => {
            const slug = generateSlug(post.title, post.id);
            const linkActive = index === 0;
            const postLink = linkActive ? \`/posts/\${slug}\` : '#';
            const dateFmt = formatDateDistance(post.date);
            const excerpt = stripHtml(post.excerpt);

            return (
              <div
                key={post.id}
                className={\`theme-card matrix-card border border-green-700 bg-black/50 p-4 rounded mb-4 \${linkActive ? 'matrix-card-active hover:bg-black/80 cursor-pointer' : 'opacity-70 cursor-default'}\`}
              >
                <div className="text-xs mb-1 overflow-hidden whitespace-nowrap text-ellipsis">
                  <span className="text-green-300">file://</span>
                  <span className="text-green-500">{slug}.mdx</span>
                </div>
                <div className="text-lg font-bold mb-2">
                  <span className="text-[#4ade80] mr-2">#{index + 1}</span>
                  {linkActive ? (
                    <Link href={postLink} className="hover:text-green-200">
                      {post.title}
                    </Link>
                  ) : (
                    <span>{post.title}</span>
                  )}
                </div>
                <div className="text-sm text-green-400/80">
                  <span className="mr-4">@{post.authorName || 'unknown'}</span>
                  <span className="opacity-70">{dateFmt}</span>
                </div>
                <p className="mt-2 text-sm text-green-300/90 line-clamp-2">
                  {excerpt}
                </p>
                {linkActive && (
                  <div className="mt-3 text-xs">
                    <Link
                      href={postLink}
                      className="text-green-400 hover:text-green-300 border-b border-green-700 hover:border-green-400"
                    >
                      cat {slug}.mdx | more
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex items-center">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300">_</div>
        </div>
      </div>
    </main>
  );
}
`
        break

      case 'ghibli':
      case 'modern':
      default:
        homepageContent = `// app/page.tsx (${theme})
${commonImports}

export default function HomePage() {
  const themeClass = '${theme}-homepage';

  if (!postsData.length) {
    return (
      <main className={\`container mx-auto p-4 md:p-8 \${themeClass}\`}>
        <p className="text-center text-muted-foreground">No posts found.</p>
      </main>
    );
  }

  const [featured, ...rest] = postsData;

  const fSlug = generateSlug(featured.title, featured.id);
  const fLink = \`/posts/\${fSlug}\`;
  const fDate = formatDateDistance(featured.date);
  const fExcerpt = stripHtml(featured.excerpt);

  return (
    <main className={\`container mx-auto p-4 md:p-8 space-y-12 \${themeClass}\`}>
      <Link href={fLink} className="block">
        <article className={\`\${theme}-featured-card relative rounded-lg overflow-hidden aspect-video cursor-pointer\`}>
          {featured.featuredMediaUrl && (
            <Image
              src={featured.featuredMediaUrl}
              alt={featured.title || 'Featured image'}
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="100vw"
            />
          )}
          <div className="featured-post-gradient absolute inset-0" />
          <div className="absolute bottom-0 w-full p-6 md:p-8 text-white drop-shadow-lg">
            <h2 className={\`\${theme}-featured-title text-3xl md:text-4xl font-bold mb-2\`}>
              {featured.title}
            </h2>
            <p className="hidden sm:block text-sm opacity-90 line-clamp-2">
              {fExcerpt}
            </p>
            <p className="mt-2 text-xs opacity-70">
              By {featured.authorName || 'Unknown'} • {fDate}
            </p>
          </div>
        </article>
      </Link>

      <section>
        <h3 className="theme-section-title text-2xl font-semibold mb-6">
          More Stories
        </h3>
        <div className="theme-post-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rest.map((post) => {
            const slug = generateSlug(post.title, post.id);
            const postLink = \`/posts/\${slug}\`;
            const d = formatDateDistance(post.date);
            const ex = stripHtml(post.excerpt);

            return (
              <Link key={post.id} href={postLink} className="block h-full">
                <div className={\`theme-card \${theme}-card border rounded-lg overflow-hidden shadow-md flex flex-col h-full bg-card text-card-foreground theme-card-active hover:shadow-lg transition-shadow\`}>
                  {post.featuredMediaUrl && (
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <Image
                        src={post.featuredMediaUrl}
                        alt={post.title || 'Featured image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="theme-card-title text-lg font-semibold mb-2 line-clamp-2 leading-tight">
                      {post.title}
                    </h4>
                    <p className="theme-card-excerpt text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">
                      {ex}
                    </p>
                    <div className="theme-card-meta text-xs text-muted-foreground mt-auto pt-2 border-t">
                      <span>By {post.authorName || 'Unknown'}</span> • <span>{d}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
`
        break
    }

    archive.append(Buffer.from(homepageContent, 'utf8'), { name: 'app/page.tsx' })

    const postPageContent = `// app/posts/${mostRecentPostSlug}/page.tsx
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout';

const components = {};

export async function generateStaticParams() {
  return [{ slug: '${mostRecentPostSlug}' }];
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  if (params.slug !== '${mostRecentPostSlug}') {
    return <div>Error: Post not found for slug '{params.slug}'.</div>;
  }

  const mdxSource = \`${mostRecentPostMdx.replace(/`/g, '\\`')}\`;

  try {
    const { content, frontmatter } = await compileMDX<{
      title: string; date: string; author?: string; featuredMedia?: string; featuredImage?: string;
    }>({
      source: mdxSource,
      components,
      options: { parseFrontmatter: true },
    });
    return <Layout frontmatter={frontmatter}>{content}</Layout>;
  } catch (error: any) {
    return (
      <div>
        <h1>Error Compiling Post</h1>
        <pre>Slug: {params.slug}</pre>
        <pre>Error: {error.message}</pre>
      </div>
    );
  }
}

export async function generateMetadata() {
  return { title: '${mostRecentPostTitle.replace(/'/g, "\\'")}' };
}
`
    archive.append(Buffer.from(postPageContent, 'utf8'), {
      name: `app/posts/${mostRecentPostSlug}/page.tsx`,
    })

    await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx')

    const themeCssSrc = path.join(templateDir, 'themes', theme, 'theme.css')
    archive.file(themeCssSrc, { name: 'app/theme.css' })

    const staticFiles = [
      ['tailwind.config.ts', 'tailwind.config.ts'],
      ['postcss.config.mjs', 'postcss.config.mjs'],
      ['tsconfig.json', 'tsconfig.json'],
      ['next.config.mjs', 'next.config.mjs'],
      ['vercel.json', 'vercel.json'],
      ['package.json', 'package.json'],
      ['.gitignore', '.gitignore'],
      ['app/layout.tsx', 'app/layout.tsx'],
      ['app/globals.css', 'app/globals.css'],
    ] as const

    for (const [src, dest] of staticFiles) await addTemplateFile(src, dest)

    const publicDir = path.join(templateDir, 'public')
    try {
      await fs.access(publicDir)
      archive.directory(publicDir, 'public')
    } catch {}

    await archive.finalize()
  })
}
