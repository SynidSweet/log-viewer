'use client'

import { format } from 'date-fns'
import { LogEntry } from './log-entry-details'

interface LogEntryListProps {
  entries: LogEntry[];
  selectedIndex: number;
  onSelectEntry: (index: number) => void;
}

export function LogEntryList({ entries, selectedIndex, onSelectEntry }: LogEntryListProps) {
  return (
    <div className="divide-y divide-gray-200">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`py-1.5 px-2 cursor-pointer hover:bg-gray-50 ${
            index === selectedIndex ? 'bg-gray-100' : ''
          }`}
          onClick={() => onSelectEntry(index)}
        >
          <div className="flex items-center mb-1">
            <span 
              className={`text-[10px] px-1 py-0.5 rounded text-white font-medium mr-1.5 ${
                entry.level === 'ERROR' ? 'bg-red-500' : 
                entry.level === 'WARN' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              {entry.level}
            </span>
            <span className="text-[10px] text-gray-500">
              {format(new Date(entry.timestamp), 'HH:mm:ss')}
            </span>
          </div>
          
          <div className="text-sm font-medium line-clamp-2">
            {entry.message}
          </div>
        </div>
      ))}
    </div>
  )
} 