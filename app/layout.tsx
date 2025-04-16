import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'WP Offramp',
  description: 'Leave WordPress Behind',
  generator: 'v0.dev + gemini + claude + chatgpt',
  icons: {
    icon: '/favicon.ico', // Make sure this file exists in the /public folder
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
