// components/log-viewer/index.tsx
'use client'

import { useState, useEffect } from 'react'
import { LogEntry } from '@/lib/types'
import { LogItem } from './log-item'
import { LogDetails } from './log-details'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface LogViewerProps {
  projectId: string
}

export function LogViewer({ projectId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(-1)
  const [filters, setFilters] = useState({
    log: true,
    warn: true,
    error: true,
    api: true,
    searchText: ''
  })
  
  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/logs?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setLogs(data)
        }
      } catch (error) {
        console.error('Failed to fetch logs', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
    
    // Set up polling for new logs
    const intervalId = setInterval(fetchLogs, 30000) // Poll every 30 seconds
    
    return () => clearInterval(intervalId)
  }, [projectId])
  
  // Filter logs
  const filteredLogs = logs
    .filter(log => {
      // Filter by log level
      if (
        (log.level === 'LOG' && !filters.log) ||
        (log.level === 'WARN' && !filters.warn) ||
        (log.level === 'ERROR' && !filters.error)
      ) {
        return false
      }
      
      // Filter API logs
      const isApiLog = log.message.toLowerCase().includes('api')
      if (isApiLog && !filters.api) {
        return false
      }
      
      // Filter by search text
      if (filters.searchText) {
        const searchTerm = filters.searchText.toLowerCase()
        const messageMatches = log.message.toLowerCase().includes(searchTerm)
        
        let detailsString = ''
        if (log.details) {
          detailsString = typeof log.details === 'object'
            ? JSON.stringify(log.details)
            : String(log.details)
        }
        const detailsMatch = detailsString.toLowerCase().includes(searchTerm)
        
        if (!messageMatches && !detailsMatch) {
          return false
        }
      }
      
      return true
    })
    // Sort by timestamp (newest first)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  if (loading) {
    return <div>Loading logs...</div>
  }
  
  return (
    <div className="flex h-full">
      {/* Log List Panel */}
      <div className="w-1/2 p-4 border-r border-gray-200 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Filters</h3>
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="log-checkbox" 
                checked={filters.log}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, log: checked === true }))
                }
              />
              <Label htmlFor="log-checkbox">Log</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="warn-checkbox" 
                checked={filters.warn}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, warn: checked === true }))
                }
              />
              <Label htmlFor="warn-checkbox">Warn</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="error-checkbox" 
                checked={filters.error}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, error: checked === true }))
                }
              />
              <Label htmlFor="error-checkbox">Error</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="api-checkbox" 
                checked={filters.api}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, api: checked === true }))
                }
              />
              <Label htmlFor="api-checkbox">API</Label>
            </div>
          </div>
          <Input
            placeholder="Search logs..."
            value={filters.searchText}
            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
            className="mb-4"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <LogItem
                key={log.id}
                log={log}
                isSelected={index === selectedLogIndex}
                onClick={() => setSelectedLogIndex(index)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Log Details Panel */}
      <div className="w-1/2 p-4 h-full">
        <LogDetails log={selectedLogIndex >= 0 ? filteredLogs[selectedLogIndex] : null} />
      </div>
    </div>
  )
}