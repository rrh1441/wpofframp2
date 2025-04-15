import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WP Offramp',
  description: 'Leave WordPress Behind',
  generator: 'v0.dev + gemini + claude + chatgpt',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
