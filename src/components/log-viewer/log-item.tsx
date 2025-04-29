// components/log-viewer/log-item.tsx
'use client'

import { LogEntry } from '@/lib/types'
import { format } from 'date-fns'

interface LogItemProps {
  log: LogEntry
  isSelected: boolean
  onClick: () => void
}

export function LogItem({ log, isSelected, onClick }: LogItemProps) {
  // Determine border color based on log level
  const borderColor = {
    LOG: 'border-green-500',
    WARN: 'border-yellow-500',
    ERROR: 'border-red-500'
  }[log.level] || 'border-gray-300'
  
  return (
    <div 
      className={`p-3 my-1 rounded-md cursor-pointer border-l-4 ${borderColor} ${
        isSelected ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="text-xs text-gray-500 mb-1">
        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
      </div>
      <div className="font-medium text-sm mb-1 break-words">
        {log.message}
      </div>
      {log.details && (
        <div className="text-xs text-gray-700 overflow-hidden text-ellipsis line-clamp-2 break-words">
          {typeof log.details === 'object' 
            ? JSON.stringify(log.details).substring(0, 100) + (JSON.stringify(log.details).length > 100 ? '...' : '')
            : String(log.details).substring(0, 100) + (String(log.details).length > 100 ? '...' : '')
          }
        </div>
      )}
    </div>
  )
}