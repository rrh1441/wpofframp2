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
            'app/layout.tsx',
            'app/globals.css',
            'package.json',
            'app/page.tsx',
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

    console.log(
      `Generating app/page.mdx using fetched content for theme ${theme}...`
    )
    archive.append(Buffer.from(mostRecentPostMdx, 'utf8'), {
      name: 'app/page.mdx',
    })
    console.log('Added app/page.mdx with actual content.')

    console.log(
      `Adding template app/page.tsx (loads page.mdx) for theme ${theme}...`
    )
    await addTemplateFile('app/page.tsx', 'app/page.tsx')

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

    console.log('Adding components/Layout.tsx...')
    await addTemplateFile('components/Layout.tsx', 'components/Layout.tsx')

    console.log('Skipping PostCard component addition.')

    console.log('Adding static project files...')
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
    ]

    for (const file of staticFiles) {
      await addTemplateFile(file.src, file.dest)
    }

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

    console.log('Finalizing ZIP archive...')
    await archive.finalize()
    console.log('ZIP archive finalized successfully.')
  })
}