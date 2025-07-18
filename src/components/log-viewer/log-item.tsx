// components/log-viewer/log-item.tsx
'use client'

import React from 'react'
import { ProjectLog } from '@/lib/types'
import { format } from 'date-fns'
import { Trash2, Eye, EyeOff } from '../icons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LogItemProps {
  log: ProjectLog
  isSelected: boolean
  onSelectLog: (logId: string) => void
  onDeleteLog: (logId: string) => void
  onToggleReadStatus: (logId: string, currentStatus: boolean) => void
}

export const LogItem = React.memo(function LogItem({ log, isSelected, onSelectLog, onDeleteLog, onToggleReadStatus }: LogItemProps) {
  // Memoize the formatted date to avoid recalculating on every render
  const formattedDate = React.useMemo(() => {
    return format(new Date(log.timestamp), 'MM/dd HH:mm')
  }, [log.timestamp])
  
  // Handle click on the log item
  const handleClick = React.useCallback(() => {
    onSelectLog(log.id)
  }, [log.id, onSelectLog])
  
  // Handle delete button click
  const handleDelete = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent log selection
    onDeleteLog(log.id)
  }, [log.id, onDeleteLog])
  
  // Handle toggle read status button click
  const handleToggleRead = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent log selection
    onToggleReadStatus(log.id, log.isRead)
  }, [log.id, log.isRead, onToggleReadStatus])
  
  return (
    <div 
      data-testid="log-item"
      className={`py-1.5 px-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500 shadow-sm' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">
          {formattedDate}
        </span>
        <div className="flex items-center">
          {!log.isRead && (
            <span className="mr-1.5 bg-blue-500 h-2 w-2 rounded-full" title="Unread log"></span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm font-medium truncate max-w-[80%]">
                {log.comment || 'Unnamed log'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-xs break-words">{log.comment || 'Unnamed log'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex space-x-1.5">
          <button 
            onClick={handleToggleRead}
            className="text-gray-500 hover:text-blue-500"
            title={log.isRead ? "Mark as unread" : "Mark as read"}
          >
            {log.isRead ? 
              <EyeOff className="h-3.5 w-3.5" /> : 
              <Eye className="h-3.5 w-3.5" />
            }
          </button>
          
          <button 
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-500"
            title="Delete log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if:
  // 1. The log data changes (different id, timestamp, comment, or isRead status)
  // 2. The selection state changes for THIS specific log
  // 3. The callback functions change (which they shouldn't if properly memoized in parent)
  
  return (
    prevProps.log.id === nextProps.log.id &&
    prevProps.log.timestamp === nextProps.log.timestamp &&
    prevProps.log.comment === nextProps.log.comment &&
    prevProps.log.isRead === nextProps.log.isRead &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.onSelectLog === nextProps.onSelectLog &&
    prevProps.onDeleteLog === nextProps.onDeleteLog &&
    prevProps.onToggleReadStatus === nextProps.onToggleReadStatus
  )
})