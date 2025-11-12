import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.scss'
import LayoutFrame from '@/components/LayoutFrame'
import { Provider } from '@/components/ui/provider'
import React from 'react'

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
}

export const viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <LayoutFrame>
            {children}
          </LayoutFrame>
        </Provider>
      </body>
    </html>
  )
}

