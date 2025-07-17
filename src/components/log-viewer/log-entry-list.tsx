'use client'

import { format } from 'date-fns'
import { LogEntry } from './log-entry-details'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface LogEntryListProps {
  entries: LogEntry[];
  selectedIndex: number;
  onSelectEntry: (index: number) => void;
  selectedEntryIds: Set<string>;
  onToggleSelection: (entryId: string) => void;
}

export function LogEntryList({ entries, selectedIndex, onSelectEntry, selectedEntryIds, onToggleSelection }: LogEntryListProps) {
  return (
    <div className="divide-y divide-gray-200">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`py-1.5 px-2 cursor-pointer hover:bg-gray-50 relative ${
            index === selectedIndex ? 'bg-blue-100 border-l-4 border-l-blue-500 shadow-sm' : ''
          }`}
          onClick={() => onSelectEntry(index)}
        >
          <div className="flex items-center mb-1">
            <Checkbox
              checked={selectedEntryIds.has(entry.id)}
              onCheckedChange={() => onToggleSelection(entry.id)}
              className="mr-2 h-3 w-3"
              onClick={(e) => e.stopPropagation()} // Prevent entry selection when clicking checkbox
            />
            <span 
              className={`text-[10px] px-1 py-0.5 rounded text-white font-medium mr-1.5 ${
                entry.level === 'ERROR' ? 'bg-red-500' : 
                entry.level === 'WARN' ? 'bg-yellow-500' : 
                entry.level === 'DEBUG' ? 'bg-purple-500' : 
                entry.level === 'INFO' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            >
              {entry.level}
            </span>
            <span className="text-[10px] text-gray-500">
              {format(new Date(entry.timestamp), 'HH:mm:ss')}
            </span>
          </div>
          
          <div className="text-sm font-medium line-clamp-2 pr-2">
            {entry.message}
          </div>
          
          {/* Tags badges in top-right corner */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="absolute top-1.5 right-1.5 flex flex-wrap gap-1 max-w-[40%]">
              {entry.tags.slice(0, 2).map((tag, tagIndex) => (
                <Badge 
                  key={tagIndex}
                  variant="secondary" 
                  className="text-[8px] px-1 py-0 h-4 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 2 && (
                <Badge 
                  variant="secondary" 
                  className="text-[8px] px-1 py-0 h-4 bg-gray-300 text-gray-600"
                  title={`Additional tags: ${entry.tags.slice(2).join(', ')}`}
                >
                  +{entry.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 