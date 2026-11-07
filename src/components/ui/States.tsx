import type { ReactNode } from 'react'
import { RefreshIcon } from '../icons'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />
}

export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          <RefreshIcon /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {children && <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>}
    </div>
  )
}
