import fs from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import { Writable } from 'stream'
import { ThemeKey } from './constants'

// Define the structure for homepage post data passed to the function
interface HomepagePostData {
  id: number
  title: string
  link: string // Used for slug generation
  excerpt: string
  featuredMediaUrl: string | null
  authorName: string
  date: string // ISO 8601 string
}

// Define the arguments for the buildZip function
interface BuildZipArgs {
  theme: ThemeKey
  homepagePosts: HomepagePostData[] // Array of posts (only first might have MDX, but we use metadata here)
  mostRecentPostMdx: string // Full MDX for the latest post (used for the single post page)
  mostRecentPostTitle: string // Title for the single post page
  mostRecentPostSlug: string // Slug for the single post page route
}

// Helper function to generate slugs consistently
const generateSlug = (title: string, id: number): string => {
  return (
    title
      ?.replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .substring(0, 50) || `post-${id}`
  ) // Basic slug generation, ensure it matches link target
}

// Helper function for basic HTML stripping (used inside generated TSX)
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
    archive.on('warning', (err) => {
      console.warn('Archiver warning:', err)
    })
    archive.on('error', (err) => {
      console.error('Archiver error:', err)
      reject(new Error(`Failed to create ZIP archive: ${err.message}`))
    })
    archive.pipe(converter)

    // --- Helper to add files from template directory ---
    const addTemplateFile = async (sourcePath: string, archivePath: string) => {
      const fullSourcePath = path.join(templateDir, sourcePath)
      try {
        await fs.access(fullSourcePath)
        archive.file(fullSourcePath, { name: archivePath })
        console.log(`Added ${archivePath} from template: ${sourcePath}`)
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.error(
            `❌ CRITICAL ERROR: Template file not found: ${fullSourcePath}`
          )
          const criticalFiles = [
            'components/Layout.tsx',
            'app/layout.tsx', // Still need this template
            'app/globals.css',
            'package.json',
            // 'app/page.tsx' is no longer copied, it's generated
          ]
          if (criticalFiles.includes(sourcePath)) {
            reject(
              new Error(
                `Missing critical template file: ${sourcePath}. Build cannot proceed.`
              )
            )
          } else {
            console.warn(
              `Non-critical template file not found, skipping: ${fullSourcePath}`
            )
          }
        } else {
          console.error(`Error accessing template file ${fullSourcePath}:`, err)
          reject(
            new Error(
              `Error accessing template file: ${sourcePath}. Error: ${err.message}`
            )
          )
        }
      }
    }

    // --- 1. Generate app/page.tsx (Homepage) Dynamically Based on Theme ---
    console.log(`Generating app/page.tsx for theme: ${theme}...`)
    let homepageContent = ''
    const postsDataString = JSON.stringify(homepagePosts, null, 2) // Embed post data

    // Common imports and helper functions for generated page.tsx
    const commonImports = `
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

const postsData: any[] = ${postsDataString}; // Embed the data

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
  } catch (e) {
    console.warn(\`Error formatting date: \${isoDate}\`, e);
    return isoDate;
  }
};
`

    switch (theme) {
      case 'matrix':
        homepageContent = `// app/page.tsx (Generated for Matrix Theme)
${commonImports}

export default function HomePage() {
  const hostname = "matrix-site"; // Example hostname
  const promptUser = "visitor";
  const promptString = \`\${promptUser}@\${hostname}:~$\`;

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300">ls -la /posts</div>
        </div>
        <div className="grid gap-0">
          {postsData.length > 0 ? (
            postsData.map((post, index) => {
              const slug = generateSlug(post.title, post.id);
              // Only link to the most recent post page as others aren't generated
              const postLink = index === 0 ? \`/posts/\${slug}\` : '#'; // Link only first post
              const isLinkActive = index === 0;
              const formattedDate = formatDateDistance(post.date);
              const cleanExcerpt = stripHtml(post.excerpt);

              return (
                <div key={post.id} className="border border-green-700 bg-black/50 p-4 rounded mb-4 ${isLinkActive ? 'hover:bg-black/80 transition-colors cursor-pointer' : 'opacity-70 cursor-default'}">
                  <div className="text-xs mb-1 overflow-hidden whitespace-nowrap text-ellipsis">
                    <span className="text-green-300">file://</span>
                    <span className="text-green-500">{slug}.mdx</span>
                  </div>
                  <div className="text-lg font-bold mb-2">
                     <span className="text-[#4ade80] mr-2">#{index + 1}</span>
                      {isLinkActive ? (
                        <Link href={postLink} className="text-green-400 hover:text-green-200 transition-colors">
                           {post.title}
                        </Link>
                      ) : (
                         <span className="text-green-400">{post.title}</span>
                      )}
                  </div>
                  <div className="text-sm text-green-400/80">
                    <span className="mr-4">@{post.authorName || 'unknown'}</span>
                    <span className="opacity-70">{formattedDate}</span>
                  </div>
                  <p className="mt-2 text-sm text-green-300/90 line-clamp-2">{cleanExcerpt}</p>
                   {isLinkActive && (
                     <div className="mt-3 text-xs">
                       <Link href={postLink} className="text-green-400 hover:text-green-300 border-b border-green-700 hover:border-green-400 transition-colors">
                         cat {slug}.mdx | more
                       </Link>
                     </div>
                   )}
                </div>
              );
            })
          ) : (
            <p>No posts found.</p>
          )}
        </div>
        <div className="mt-8 flex items-center">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300">_</div>
        </div>
      </div>
    </main>
  );
}`
        break

      case 'ghibli':
      case 'modern': // Use similar card structure for both, styling differs via CSS
      default:
        homepageContent = `// app/page.tsx (Generated for ${theme} Theme)
${commonImports}

export default function HomePage() {
  // Basic card structure, styling primarily driven by theme.css + globals.css
  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 border-b pb-2">Latest Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {postsData.length > 0 ? (
          postsData.map((post, index) => {
            const slug = generateSlug(post.title, post.id);
            // Only link to the most recent post page as others aren't generated
            const postLink = index === 0 ? \`/posts/\${slug}\` : '#';
            const isLinkActive = index === 0;
            const formattedDate = formatDateDistance(post.date);
            const cleanExcerpt = stripHtml(post.excerpt);

            const cardContent = (
              <div className="border rounded-lg overflow-hidden shadow-md flex flex-col h-full bg-card text-card-foreground ${isLinkActive ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'opacity-80 cursor-default'}">
                {post.featuredMediaUrl && (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image
                       src={post.featuredMediaUrl}
                       alt={post.title || 'Featured image'}
                       fill
                       style={{ objectFit: 'cover' }}
                       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                       priority={index < 3} // Prioritize loading images for first few cards
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2 leading-tight">
                   {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">
                    {cleanExcerpt}
                  </p>
                  <div className="text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <span>By {post.authorName || 'Unknown'}</span> | <span>{formattedDate}</span>
                  </div>
                   {isLinkActive && (
                     <div className="mt-2 text-sm font-medium text-primary hover:underline">
                         Read More...
                     </div>
                   )}
                </div>
              </div>
            );

            return isLinkActive ? (
               <Link key={post.id} href={postLink} className="block h-full">
                 {cardContent}
               </Link>
            ) : (
               <div key={post.id} className="h-full">
                 {cardContent}
               </div>
            );
          })
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No posts found.</p>
        )}
      </div>
    </main>
  );
}`
        break
    }
    archive.append(Buffer.from(homepageContent, 'utf8'), {
      name: 'app/page.tsx',
    })
    console.log(`Added generated app/page.tsx for theme ${theme}.`)

    // --- 2. Generate Single Post Page (app/posts/[slug]/page.tsx) ---
    // This uses mostRecentPostMdx and remains the same as before
    console.log(
      `Generating single post page at app/posts/${mostRecentPostSlug}/page.tsx...`
    )
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
   title: string; date: string; author?: string; featuredImage?: string;
  }>({
   source: mdxSource,
   components,
   options: { parseFrontmatter: true },
  });
  return (<Layout frontmatter={frontmatter}>{content}</Layout>);
 } catch (error: any) {
  console.error('Error compiling MDX for post:', params.slug, error);
  return (<div><h1>Error Compiling Post</h1><pre>Slug: {params.slug}</pre><pre>Error: {error.message}</pre></div>);
 }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
 if (params.slug === '${mostRecentPostSlug}') {
  return { title: '${mostRecentPostTitle.replace(/'/g, "\\'")}' };
 }
 return { title: 'Post Not Found' };
}`
    archive.append(Buffer.from(postPageContent, 'utf8'), {
      name: `app/posts/${mostRecentPostSlug}/page.tsx`,
    })
    console.log('Added single post page.')

    // --- 3. Add Generic Layout Component ---
    console.log('Adding components/Layout.tsx...')
    await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx')

    // --- 4. Add Theme-Specific CSS ---
    console.log(`Adding theme-specific assets for theme: ${theme}...`)
    const themeCssSource = path.join(templateDir, 'themes', theme, 'theme.css')
    const themeCssDest = 'app/theme.css' // Destination within the ZIP

    try {
      await fs.access(themeCssSource)
      archive.file(themeCssSource, { name: themeCssDest })
      console.log(`Added theme CSS: ${themeCssDest} from theme '${theme}'`)
    } catch (err: any) {
      console.error(
        `❌ CRITICAL ERROR: Theme CSS not found for theme '${theme}': ${themeCssSource}`
      )
      reject(
        new Error(
          `Missing theme CSS for theme '${theme}'. Build cannot proceed.`
        )
      )
      return // Stop processing if theme CSS is missing
    }

    // --- 5. Add Static Project Files (Common to all themes) ---
    console.log('Adding static project files...')
    const staticFiles = [
      // Configs
      { src: 'tailwind.config.ts', dest: 'tailwind.config.ts' },
      { src: 'postcss.config.mjs', dest: 'postcss.config.mjs' },
      { src: 'tsconfig.json', dest: 'tsconfig.json' },
      { src: 'next.config.mjs', dest: 'next.config.mjs' },
      { src: 'vercel.json', dest: 'vercel.json' },
      { src: 'package.json', dest: 'package.json' },
      { src: '.gitignore', dest: '.gitignore' },
      // Root App files
      { src: 'app/layout.tsx', dest: 'app/layout.tsx' }, // This one imports theme.css
      { src: 'app/globals.css', dest: 'app/globals.css' }, // Base Tailwind/global styles
    ]

    for (const file of staticFiles) {
      await addTemplateFile(file.src, file.dest)
    }

    // --- 6. Add Public Assets ---
    const publicDir = path.join(templateDir, 'public')
    try {
      await fs.access(publicDir)
      console.log('Adding public directory contents...')
      archive.directory(publicDir, 'public')
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.log('No public directory found in templates, skipping.')
      } else {
        console.error('Error accessing template public directory:', err)
        reject(
          new Error(`Error accessing template public directory: ${err.message}`)
        )
      }
    }

    // --- Finalize Archive ---
    console.log('Finalizing ZIP archive...')
    await archive.finalize()
    console.log('ZIP archive finalized successfully.')
  })
}