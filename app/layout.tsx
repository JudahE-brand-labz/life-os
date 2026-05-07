import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ShawnChat from '@/components/ShawnChat'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ShawnProvider } from '@/components/ShawnProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Personal dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="flex h-full bg-background text-foreground">
        <ThemeProvider>
          <ShawnProvider>
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <ShawnChat />
            <ThemeToggle />
          </ShawnProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
