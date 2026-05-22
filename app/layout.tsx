import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpendSmart AI — Free AI Spend Audit',
  description: 'Find out if you\'re overpaying for AI tools. Get an instant free audit showing exactly where you\'re overspending and how much you could save.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SpendSmart AI — Free AI Spend Audit',
    description: 'Most startups overpay for AI tools by 30-50%. Find out in 2 minutes.',
    url: '/',
    siteName: 'SpendSmart AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpendSmart AI — Free AI Spend Audit',
    description: 'Most startups overpay for AI tools by 30-50%. Find out in 2 minutes.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}