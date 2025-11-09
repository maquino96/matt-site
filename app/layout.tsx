import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.scss'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import DataSourceIndicator from '@/components/DataSourceIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Matt Site - Personal Profile & Blog',
    template: '%s | Matt Site'
  },
  description: 'Personal profile and blog site',
  keywords: ['blog', 'portfolio', 'personal'],
  authors: [{ name: 'Matt' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Matt Site',
  },
  themeColor: '#0f172a', // Dark background color
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ backgroundColor: '#0f172a' }}>
      <body className={inter.className} style={{ backgroundColor: '#0f172a' }}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Nav />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <Footer />
        <DataSourceIndicator />
      </body>
    </html>
  )
}

