'use client'

import { Suspense, ComponentType } from 'react'

interface MiniAppFrameProps {
  component: ComponentType
  fallback?: React.ReactNode
}

export default function MiniAppFrame({ 
  component: Component, 
  fallback 
}: MiniAppFrameProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center h-64 bg-primary-800 rounded-lg border border-primary-700">
      <div className="text-gray-400">Loading app...</div>
    </div>
  )

  return (
    <div className="bg-primary-800 rounded-lg border border-primary-700 p-6">
      <Suspense fallback={fallback || defaultFallback}>
        <Component />
      </Suspense>
    </div>
  )
}

