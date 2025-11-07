'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

interface MiniAppFrameProps {
  appId: string
  fallback?: React.ReactNode
}

// Component mapping - lazy loaded
const componentMap: Record<string, React.ComponentType> = {
  'todo': dynamic(() => import('@/app/apps/todo/TodoApp'), {
    loading: () => <div className="text-gray-400">Loading Todo App...</div>,
  }),
  'drawing-pad': dynamic(() => import('@/app/apps/drawing-pad/DrawingPad'), {
    loading: () => <div className="text-gray-400">Loading Drawing Pad...</div>,
  }),
}

export default function MiniAppFrame({ 
  appId, 
  fallback 
}: MiniAppFrameProps) {
  const Component = componentMap[appId]
  
  if (!Component) {
    return (
      <div className="bg-primary-800 rounded-lg border border-primary-700 p-6">
        <div className="text-red-400">App not found: {appId}</div>
      </div>
    )
  }

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

