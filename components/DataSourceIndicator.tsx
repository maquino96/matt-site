'use client'

import { useEffect, useState } from 'react'

// Check if in dev mode
const isDev = process.env.NODE_ENV === 'development'

interface SourceInfo {
  source: string
  envVar: string | undefined
}

export default function DataSourceIndicator() {
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null)

  useEffect(() => {
    if (!isDev) return

    // Fetch data source info from API
    fetch('/api/debug/data-source')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data: SourceInfo) => setSourceInfo(data))
      .catch(() => {
        // Fallback: infer from client-side env var (may not be accurate)
        setSourceInfo({
          source: process.env.NEXT_PUBLIC_DATA_SOURCE || 'filesystem',
          envVar: process.env.NEXT_PUBLIC_DATA_SOURCE,
        })
      })
  }, [])

  if (!isDev || !sourceInfo) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-primary-800 border border-primary-700 rounded-lg px-3 py-2 text-xs text-gray-300 shadow-lg">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${sourceInfo.source === 'supabase' ? 'bg-accent' : 'bg-gray-500'}`}></span>
        <span>
          Data Source: <strong className="text-accent">{sourceInfo.source}</strong>
        </span>
      </div>
      {sourceInfo.envVar && (
        <div className="text-gray-400 mt-1">
          Env: {sourceInfo.envVar}
        </div>
      )}
    </div>
  )
}

