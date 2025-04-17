// templates/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css' // Import Tailwind CSS / Base Styles
import './theme.css' // Import Theme-Specific Styles

export const metadata: Metadata = {
  title: 'My Migrated Site', // Default title, can be overridden by MDX
  description: 'Content migrated from WordPress by WP Offramp',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {/* Basic structure, you might add Header/Footer components */}
        <main>{children}</main>
      </body>
    </html>
  )
}