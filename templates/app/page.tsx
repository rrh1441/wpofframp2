// templates/app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import Layout from '@/components/Layout'; // Import the layout

// Import components you want to use in MDX here
// Example: import { Callout } from '@/components/Callout';
// const components = { Callout };
const components = {}; // No custom components for basic example

export default async function HomePage() {
  // Read the MDX file content
  const mdxPath = path.join(process.cwd(), 'app/page.mdx');
  let source = '';
   try {
      source = await fs.readFile(mdxPath, 'utf8');
   } catch (error) {
       console.error("Error reading MDX file:", error);
       return <div>Error loading content. MDX file not found or unreadable.</div>
   }


  // Compile the MDX source
   try {
        const { content, frontmatter } = await compileMDX<{
            title: string;
            date: string;
            author?: string;
            featuredImage?: string;
            // Add other frontmatter types here
        }>({
            source,
            components, // Pass custom components here
            options: {
                parseFrontmatter: true,
                // Add mdxOptions if needed (remark/rehype plugins)
                // mdxOptions: { remarkPlugins: [], rehypePlugins: [] },
            },
        });

        return (
            <Layout frontmatter={frontmatter}>
              {content}
            </Layout>
          );

   } catch (error) {
     console.error("Error compiling MDX:", error);
     return <div>Error compiling MDX content. Check the MDX file format and frontmatter.</div>
   }
}

// Optional: Add metadata generation based on frontmatter
// export async function generateMetadata() {
//   const mdxPath = path.join(process.cwd(), 'app/page.mdx');
//   const source = await fs.readFile(mdxPath, 'utf8');
//   const { frontmatter } = await compileMDX<{ title?: string }>({
//     source,
//     options: { parseFrontmatter: true },
//   });
//   return {
//     title: frontmatter.title || 'Migrated Page',
//   };
// }