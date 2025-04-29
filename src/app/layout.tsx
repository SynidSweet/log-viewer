// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Log Viewer',
  description: 'A universal log viewer for your applications',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-primary text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Log Viewer
            </Link>
            <nav>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </nav>
          </div>
        </header>
        
        <main>
          {children}
        </main>
        
        <Toaster />
      </body>
    </html>
  )
}