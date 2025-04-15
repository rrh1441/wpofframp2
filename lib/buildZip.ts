// lib/buildZip.ts
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';
import { ThemeKey } from './constants'; // Assuming constants.ts is in the same directory

interface BuildZipArgs {
  mdxContent: string; // Full MDX content including frontmatter
  theme: ThemeKey;
  // frontmatter: Record<string, any>; // Frontmatter is now included in mdxContent
}

/**
 * Generates a Buffer containing a ZIP archive of a basic
 * Next.js + Tailwind + MDX project.
 */
export async function buildZip({
  mdxContent,
  theme,
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

    // Pipe output to our buffer converter
    archive.pipe(converter);

    // --- Add Project Files ---

    const templateDir = path.join(process.cwd(), 'templates'); // Base directory for templates

    // 1. MDX Content (Main Page)
    // We assume a simple structure where the migrated post becomes the main page.
    // A slug based on the title could be generated for a more robust structure.
    archive.append(mdxContent, { name: 'app/page.mdx' }); // Changed from index.mdx to page.mdx for App Router

    // 2. Basic Layout Component (references the MDX content)
    const layoutTemplatePath = path.join(templateDir, 'components/Layout.tsx');
    try {
        const layoutContent = await fs.readFile(layoutTemplatePath, 'utf-8');
        // Basic theme customization example (could be more sophisticated)
        // const themedLayoutContent = layoutContent.replace(
        //     /className="container mx-auto px-4 py-8"/g,
        //     `className="container mx-auto px-4 py-8 theme-${theme}"` // Add a theme class
        // );
        archive.append(layoutContent, { name: 'components/Layout.tsx' });
    } catch (err) {
         console.warn(`Warning: Could not read template file ${layoutTemplatePath}. Skipping.`, err);
    }

     // 3. Root Layout (app/layout.tsx)
    const rootLayoutTemplatePath = path.join(templateDir, 'app/layout.tsx');
    try {
        archive.file(rootLayoutTemplatePath, { name: 'app/layout.tsx' });
    } catch (err) {
        console.warn(`Warning: Could not read template file ${rootLayoutTemplatePath}. Skipping.`, err);
    }

    // 4. Root Page (app/page.tsx - Renders the MDX)
    const rootPageTemplatePath = path.join(templateDir, 'app/page.tsx');
     try {
        archive.file(rootPageTemplatePath, { name: 'app/page.tsx' });
     } catch (err) {
         console.warn(`Warning: Could not read template file ${rootPageTemplatePath}. Skipping.`, err);
     }


    // 5. Global CSS (app/globals.css)
    const globalsCssPath = path.join(templateDir, 'app/globals.css');
     try {
        // Potentially add theme-specific CSS variables here if needed
        archive.file(globalsCssPath, { name: 'app/globals.css' });
     } catch (err) {
         console.warn(`Warning: Could not read template file ${globalsCssPath}. Skipping.`, err);
     }

    // 6. Config Files (tailwind, postcss, tsconfig, next, vercel, package.json, .gitignore)
    const configFiles = [
      'tailwind.config.ts',
      'postcss.config.mjs',
      'tsconfig.json',
      'next.config.mjs',
      'vercel.json', // Optional, for Vercel deployment hints
      'package.json',
      '.gitignore',
    ];

    for (const filename of configFiles) {
      const filePath = path.join(templateDir, filename);
      try {
            // Check if file exists before attempting to add
           await fs.access(filePath); // Throws if file doesn't exist
           archive.file(filePath, { name: filename });
      } catch (err: any) {
            if (err.code === 'ENOENT') {
                 console.warn(`Template file not found: ${filePath}. Skipping.`);
            } else {
                console.error(`Error accessing template file ${filePath}:`, err);
                 // Decide if this should be a fatal error
                 // reject(new Error(`Failed to access template file: ${filename}`));
                 // return;
            }
      }
    }

    // --- Finalize Archive ---
    await archive.finalize();
  });
}