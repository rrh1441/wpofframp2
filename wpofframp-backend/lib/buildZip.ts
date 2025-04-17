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
  mostRecentPostSlug, // Use this slug for the first post link
}: BuildZipArgs): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const outputBuffers: Buffer[] = [];
    const templateDir = path.join(process.cwd(), 'templates');

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

    const addTemplateFile = async (sourcePath: string, archivePath: string) => {
      const fullSourcePath = path.join(templateDir, sourcePath);
      try {
        await fs.access(fullSourcePath);
        archive.file(fullSourcePath, { name: archivePath });
        console.log(`Added ${archivePath} from template: ${sourcePath}`);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.error(
            `CRITICAL ERROR: Template file not found: ${fullSourcePath}`
          );
          reject(
            new Error(
              `Missing critical template file: ${sourcePath}. Build cannot proceed.`
            )
          );
        } else {
          console.error(`Error accessing template file ${fullSourcePath}:`, err);
          reject(
            new Error(
              `Error accessing template file: ${sourcePath}. Error: ${err.message}`
            )
          );
        }
      }
    };

    console.log(`Generating app/page.tsx for theme: ${theme}...`);
    let homepageContent = '';
    // Ensure postsData is properly escaped for embedding in JS string literal
    const postsDataString = JSON.stringify(homepagePosts, null, 2)
      .replace(/\\/g, '\\\\') // Must escape backslashes for JS string literal
      .replace(/`/g, '\\`') // Escape backticks for template literal
      .replace(/\$/g, '\\$'); // Escape dollar signs for template literal

    // Define helpers that will be included *inside* the generated file's script
    const commonImportsAndHelpers = `
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// Embedded posts data
const postsData: any[] = ${postsDataString};

// Helper functions
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
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
  }
};
`;

    switch (theme) {
      case 'matrix':
        homepageContent = `// app/page.tsx (Generated for Matrix Theme)
${commonImportsAndHelpers}

export default function HomePage() {
  const hostname = "matrix-site"; // Placeholder hostname
  const promptUser = "visitor"; // Placeholder user
  const promptString = \`\${promptUser}@\${hostname}:~$\`;

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center mb-6">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300 matrix-command">ls -la /posts</div>
        </div>
        <div className="grid gap-0">
          {postsData.length > 0 ? (
            postsData.map((post, index) => {
              const isLinkActive = index === 0;
              const displaySlug = isLinkActive ? \`${mostRecentPostSlug}\` : generateSlug(post.title, post.id);
              const postLink = isLinkActive ? \`/posts/\${displaySlug}\` : '#';
              const formattedDate = formatDateDistance(post.date);
              const cleanExcerpt = stripHtml(post.excerpt);
              const WrapperComponent = isLinkActive ? Link : 'div';

              return (
                <WrapperComponent
                  key={post.id}
                  {...(isLinkActive ? { href: postLink } : {})}
                  className={\`matrix-post-item block border border-green-700 bg-black/50 p-4 rounded mb-4 \${isLinkActive ? 'hover:bg-black/80 transition-colors cursor-pointer' : 'opacity-70 cursor-default'}\`}
                >
                  <div className="text-xs mb-1 overflow-hidden whitespace-nowrap text-ellipsis">
                    <span className="text-green-300">file://</span>
                    <span className="text-green-500">{displaySlug}.mdx</span>
                  </div>
                  <div className="text-lg font-bold mb-2">
                    <span className="matrix-post-identifier mr-2">#{index + 1}</span>
                    <span className="matrix-post-title text-green-400">{post.title}</span>
                  </div>
                  <div className="matrix-post-meta text-sm text-green-400/80">
                    <span className="mr-4">@{post.authorName || 'unknown'}</span>
                    <span className="opacity-70">{formattedDate}</span>
                  </div>
                  <p className="matrix-post-excerpt mt-2 text-sm text-green-300/90 line-clamp-2">{cleanExcerpt}</p>
                  {isLinkActive && (
                    <div className="matrix-post-more mt-3 text-xs">
                      <span className="text-green-400 hover:text-green-300 border-b border-green-700 hover:border-green-400 transition-colors">
                        cat {displaySlug}.mdx | more
                      </span>
                    </div>
                  )}
                </WrapperComponent>
              );
            })
          ) : (
            <p className="text-center text-green-600">No posts found.</p>
          )}
        </div>
        <div className="mt-8 flex items-center">
          <div className="mr-2 text-green-400">{promptString}</div>
          <div className="text-green-300 matrix-cursor">_</div>
        </div>
      </div>
    </main>
  );
}`;
        break;

      case 'ghibli':
        homepageContent = `// app/page.tsx (Generated for Ghibli Theme)
${commonImportsAndHelpers}

export default function HomePage() {
  const websiteName = "My Ghibli Site"; // Placeholder name

  return (
    <main className="ghibli-homepage-layout min-h-screen">
      <div className="content-wrapper max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="page-header mb-8 md:mb-12 text-center">
          <h1 className="text-4xl md:text-5xl mb-4">{websiteName}</h1>
          <div className="divider h-1 w-32 mx-auto mb-6"></div>
        </div>
        <div className="space-y-8">
          {postsData.length > 0 ? (
            postsData.map((post, index) => {
              const isLinkActive = index === 0;
              const displaySlug = isLinkActive ? \`${mostRecentPostSlug}\` : generateSlug(post.title, post.id);
              const postLink = isLinkActive ? \`/posts/\${displaySlug}\` : '#';
              const formattedDate = formatDateDistance(post.date);
              const cleanExcerpt = stripHtml(post.excerpt);
              const isFeatured = index === 0;
              const cardClass = isFeatured ? 'ghibli-featured-card' : 'ghibli-stacked-card';
              const imageContainerClass = isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]';
              const titleClass = isFeatured ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl';
              const excerptLines = isFeatured ? 'line-clamp-3' : 'line-clamp-2';
              const WrapperComponent = isLinkActive ? Link : 'div';

              const cardInnerContent = (
                <div className={\`ghibli-card \${cardClass} flex flex-col shadow-md overflow-hidden border border-gray-200 bg-white group \${isLinkActive ? 'hover:shadow-lg transition-shadow' : 'opacity-80'}\`}>
                  {post.featuredMediaUrl && (
                    <div className={\`relative w-full \${imageContainerClass} flex-shrink-0 overflow-hidden bg-gray-100\`}>
                      <Image
                        src={post.featuredMediaUrl}
                        alt={post.title || 'Featured image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="transition-transform duration-300 group-hover:scale-105"
                        sizes={isFeatured ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
                        priority={index < 2}
                        unoptimized={!post.featuredMediaUrl.startsWith('/')}
                      />
                    </div>
                  )}
                  <div className="ghibli-card-content flex flex-col p-4 md:p-6 flex-grow">
                    <h3 className={\`ghibli-card-title \${titleClass} font-semibold mb-2\`}>{post.title}</h3>
                    <p className={\`ghibli-card-excerpt text-sm md:text-base text-gray-600 \${excerptLines} mb-3 flex-grow\`}>{cleanExcerpt}</p>
                    <div className="ghibli-card-meta text-xs md:text-sm text-gray-500 pt-2 border-t border-gray-100 mt-auto">
                      <span>{post.authorName || 'Unknown'}</span> | <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              );

              // Structure: Featured post first, then a grid for the rest
              if (isFeatured) {
                return (
                  <WrapperComponent
                    key={post.id}
                    {...(isLinkActive ? { href: postLink } : {})}
                    className={\`block w-full \${isLinkActive ? 'cursor-pointer' : 'cursor-default'}\`}
                  >
                    {cardInnerContent}
                  </WrapperComponent>
                );
              } else {
                // Only render the stacked cards (index 1 and 2)
                if (index === 1 || index === 2) {
                  return (
                    <WrapperComponent
                      key={post.id}
                      {...(isLinkActive ? { href: postLink } : {})}
                      className={\`block h-full \${isLinkActive ? 'cursor-pointer' : 'cursor-default'}\`}
                    >
                      {cardInnerContent}
                    </WrapperComponent>
                  );
                }
                return null; // Don't render posts beyond the 3rd
              }
            }).filter(Boolean) // Filter out nulls
            .reduce((acc, current, index, array) => {
                // If it's the featured post, add it directly
                if (index === 0) {
                    acc.push(current);
                }
                // If it's the first stacked post (original index 1), start the grid
                else if (index === 1) {
                    acc.push(
                        <div key="stacked-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {current}
                            {/* Placeholder for the third post if it exists */}
                            {array[2] ? null : <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500 italic p-4">No more posts.</div>}
                        </div>
                    );
                }
                // If it's the second stacked post (original index 2), add it to the grid element created by index 1
                else if (index === 2) {
                   const gridDiv = acc[acc.length - 1];
                   if (gridDiv && typeof gridDiv === 'object' && gridDiv.key === 'stacked-grid') {
                      // Add the current post to the children of the grid div
                      gridDiv.props.children.push(current);
                   }
                }
                return acc;
            }, [] as React.ReactNode[]) // Initialize accumulator as an array of React nodes

          ) : (
            <p className="text-center text-gray-500">No posts found.</p>
          )}
        </div>
      </div>
    </main>
  );
}`;
        break;

      case 'modern':
      default:
        homepageContent = `// app/page.tsx (Generated for Modern Theme)
${commonImportsAndHelpers}

export default function HomePage() {
  const websiteName = "Modern Times"; // Placeholder name
  const today = new Date();
  const formattedDateHeader = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const featuredPost = postsData.length > 0 ? postsData[0] : null;
  const otherPosts = postsData.slice(1, 3); // Only take the next 2 posts

  return (
    <main className="modern-homepage-layout bg-background dark:bg-neutral-900">
      {/* Header */}
      <div className="news-site-header mt-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center">
          <h1 className="masthead text-4xl md:text-6xl lg:text-7xl text-center mb-1">{websiteName}</h1>
          <div className="date-line text-center mb-2">{formattedDateHeader}</div>
          <div className="border-t border-b border-gray-200 dark:border-gray-700 w-full max-w-lg mx-auto py-1 my-2"></div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Featured Post */}
        {featuredPost && (
          <Link href={\`/posts/\${'${mostRecentPostSlug}'}\`} className="block modern-featured-card post-card mb-12 cursor-pointer group">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg shadow-md">
              <Image
                src={featuredPost.featuredMediaUrl || '/placeholder.svg'}
                alt={featuredPost.title || 'Featured image'}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300 group-hover:scale-105"
                priority
                unoptimized={!featuredPost.featuredMediaUrl?.startsWith('/')}
              />
              <div className="absolute inset-0 featured-post-gradient"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                <h2 className="modern-featured-title text-3xl md:text-4xl font-bold mb-3 leading-tight">{featuredPost.title}</h2>
                <p className="modern-featured-excerpt text-md text-white/90 mb-4 max-w-3xl line-clamp-2">{stripHtml(featuredPost.excerpt)}</p>
                <div className="modern-featured-meta flex items-center mt-4">
                  <div className="w-8 h-8 rounded-full bg-gray-700 mr-3 overflow-hidden author-avatar flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{(featuredPost.authorName || 'U').charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{featuredPost.authorName || 'Unknown'}</div>
                    <div className="text-xs text-white/80">{formatDateDistance(featuredPost.date)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Section Header */}
        {otherPosts.length > 0 && (
          <div className="flex items-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold modern-section-title">Latest Stories</h2>
            <div className="flex-grow ml-4 border-t border-gray-200 dark:border-gray-700"></div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {otherPosts.map((post) => {
            const cleanExcerpt = stripHtml(post.excerpt);
            const formattedDate = formatDateDistance(post.date);
            // Links are disabled for these posts - use a div
            return (
              <div key={post.id} className="modern-card post-card bg-card rounded-lg overflow-hidden border border-slate-200 dark:border-neutral-800 shadow-sm opacity-80 cursor-default">
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-neutral-800">
                  {post.featuredMediaUrl && (
                    <Image
                      src={post.featuredMediaUrl}
                      alt={post.title || 'Post image'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={!post.featuredMediaUrl.startsWith('/')}
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="modern-card-title text-lg font-bold mb-2 leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">{post.title}</h3>
                  <p className="modern-card-excerpt text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{cleanExcerpt}</p>
                  <div className="modern-card-meta flex items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 overflow-hidden author-avatar flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{(post.authorName || 'U').charAt(0)}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">{post.authorName || 'Unknown'}</span> • <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}`;
        break;
    }

    archive.append(Buffer.from(homepageContent, 'utf8'), {
      name: 'app/page.tsx',
    });
    console.log(`Added generated app/page.tsx for theme ${theme}.`);

    console.log(
      `Generating single post page at app/posts/${mostRecentPostSlug}/page.tsx...`
    );
    // Escape backticks and dollar signs for embedding MDX in template literal
    const escapedMdx = mostRecentPostMdx
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/`/g, '\\`') // Escape backticks
        .replace(/\$/g, '\\$'); // Escape dollar signs

    const postPageContent = `// app/posts/${mostRecentPostSlug}/page.tsx
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout';

const components = {}; // Define any custom MDX components here

export async function generateStaticParams() {
  return [{ slug: '${mostRecentPostSlug}' }];
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  if (params.slug !== '${mostRecentPostSlug}') {
    // In a real app, use Next.js notFound() helper
    return <div>Error: Post not found for slug '{params.slug}'.</div>;
  }

  const mdxSource = \`${escapedMdx}\`;

  try {
    const { content, frontmatter } = await compileMDX<{
      title: string; date: string; author?: string; featuredImage?: string;
    }>({
      source: mdxSource,
      components,
      options: {
        parseFrontmatter: true,
        // mdxOptions: { remarkPlugins: [], rehypePlugins: [] },
      },
    });
    return (<Layout frontmatter={frontmatter}>{content}</Layout>);
  } catch (error: any) {
    console.error('Error compiling MDX for post:', params.slug, error);
    // Provide more detailed error output for debugging
    return (
      <div>
        <h1>Error Compiling Post</h1>
        <pre>Slug: {params.slug}</pre>
        <pre>Error: {error.message}</pre>
        <details>
           <summary>Full MDX Source (for debugging)</summary>
           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#eee', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
             {mdxSource}
           </pre>
         </details>
      </div>
    );
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (params.slug === '${mostRecentPostSlug}') {
    // Escape quotes in the title for metadata
    const safeTitle = '${mostRecentPostTitle.replace(/'/g, "\\'").replace(/"/g, '\\"')}';
    return { title: safeTitle };
  }
  return { title: 'Post Not Found' };
}`;

    archive.append(Buffer.from(postPageContent, 'utf8'), {
      name: `app/posts/${mostRecentPostSlug}/page.tsx`,
    });
    console.log('Added single post page.');

    console.log('Adding standard template files...');
    await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx');

    console.log(`Adding theme-specific assets for theme: ${theme}...`);
    await addTemplateFile(`themes/${theme}/theme.css`, 'app/theme.css');

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

    const publicDir = path.join(templateDir, 'public');
    try {
      await fs.access(publicDir);
      console.log('Adding public directory contents...');
      archive.directory(publicDir, 'public');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.log('No public directory found in templates, skipping.');
      } else {
        console.error('Error accessing template public directory:', err);
        // Decide if this is critical - maybe not for basic functionality
      }
    }

    console.log('Finalizing ZIP archive...');
    await archive.finalize();
    console.log('ZIP archive finalized successfully.');
  });
}