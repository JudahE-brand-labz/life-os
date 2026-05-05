import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ShawnChat from '@/components/ShawnChat'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Personal dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex h-full" style={{ backgroundColor: '#111' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <ShawnChat />
      </body>
    </html>
  )
}
