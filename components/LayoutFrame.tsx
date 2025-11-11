'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import DataSourceIndicator from '@/components/DataSourceIndicator'

export default function LayoutFrame({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isEditorRoute = pathname === '/admin/editor'

  return (
    <>
      {!isEditorRoute && <Nav />}
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      {!isEditorRoute && <Footer />}
      <DataSourceIndicator />
    </>
  )
}
