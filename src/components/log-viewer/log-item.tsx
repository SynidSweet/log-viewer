// components/log-viewer/log-item.tsx
'use client'

import { ProjectLog } from '@/lib/types'
import { format } from 'date-fns'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LogItemProps {
  log: ProjectLog
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onToggleRead: () => void
}

export function LogItem({ log, isSelected, onClick, onDelete, onToggleRead }: LogItemProps) {
  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent log selection
    onDelete()
  }
  
  // Handle toggle read status button click
  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent log selection
    onToggleRead()
  }
  
  return (
    <div 
      className={`py-1.5 px-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">
          {format(new Date(log.timestamp), 'MM/dd HH:mm')}
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
              <div className="text-xs font-medium truncate max-w-[80%]">
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
}