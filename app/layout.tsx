import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlipTracker',
  description: 'Track your boat and outboard motor flipping business',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 min-h-screen`}>
        <Nav />
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
