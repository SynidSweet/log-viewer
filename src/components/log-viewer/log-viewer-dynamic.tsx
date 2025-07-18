'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Loading component displayed while LogViewer is being loaded
const LogViewerLoading = () => (
  <div className="flex-1 flex">
    {/* Logs list skeleton */}
    <div className="w-96 border-r bg-muted/10 p-4 space-y-2">
      <Skeleton className="h-8 w-full mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
    
    {/* Log details skeleton */}
    <div className="flex-1 p-6 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 mt-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  </div>
)

// Dynamically import LogViewer with code splitting
export const LogViewerDynamic = dynamic(
  () => import('./index').then(mod => ({ default: mod.LogViewer })),
  {
    loading: () => <LogViewerLoading />,
    ssr: false // Disable SSR for LogViewer to ensure client-side only loading
  }
)

// Re-export the type for TypeScript compatibility
export type { LogViewerProps } from './index'