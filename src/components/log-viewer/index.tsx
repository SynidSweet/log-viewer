// components/log-viewer/index.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProjectLog } from '@/lib/types'
import { LogItem } from './log-item'
import { LogEntryList } from './log-entry-list'
import { LogEntryDetails, LogEntry } from './log-entry-details'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface LogViewerProps {
  projectId: string
}

// Regular expression to parse log lines
const LOG_PATTERN = /\[(.*?)\] \[(.*?)\] (.*?)( - (.*))?$/;

// Create a cache for log content to avoid repeated fetches
const logCache: Record<string, string> = {}

export function LogViewer({ projectId }: LogViewerProps) {
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<ProjectLog | null>(null)
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(-1)
  const [loadingLogContent, setLoadingLogContent] = useState(false)
  const [logFilters, setLogFilters] = useState({
    searchText: ''
  })
  const [entryFilters, setEntryFilters] = useState({
    searchText: '',
    showLog: true,
    showWarn: true,
    showError: true
  })
  
  // Fetch logs list
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const url = `/api/projects/${projectId}/logs`
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP error ${response.status}`)
        }
        
        const result = await response.json()
        const data = result.success ? result.data : result
        setLogs(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch logs', error)
        setError((error as Error).message || 'Failed to load logs')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [projectId])
  
  // Parse the log content into entries
  const parsedEntries = useMemo(() => {
    if (!selectedLog?.content) return [];
    
    const entries: LogEntry[] = [];
    const lines = selectedLog.content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const match = line.match(LOG_PATTERN);
      if (match) {
        const [, timestamp, level, message, , detailsStr] = match;
        
        let details = undefined;
        if (detailsStr) {
          try {
            details = JSON.parse(detailsStr);
          } catch {
            details = detailsStr;
          }
        }
        
        entries.push({
          id: `entry_${entries.length}`,
          timestamp,
          level: level as 'LOG' | 'WARN' | 'ERROR',
          message,
          details
        });
      } else {
        // If line doesn't match pattern, add it as a raw message
        entries.push({
          id: `entry_${entries.length}`,
          timestamp: new Date().toISOString(),
          level: 'LOG',
          message: line,
        });
      }
    }
    
    return entries;
  }, [selectedLog?.content]);
  
  // Filter log entries based on the entry filters
  const filteredEntries = useMemo(() => {
    return parsedEntries.filter(entry => {
      // Filter by log level
      if (
        (entry.level === 'LOG' && !entryFilters.showLog) ||
        (entry.level === 'WARN' && !entryFilters.showWarn) ||
        (entry.level === 'ERROR' && !entryFilters.showError)
      ) {
        return false;
      }
      
      // Filter by search text
      if (entryFilters.searchText) {
        const searchTerm = entryFilters.searchText.toLowerCase();
        const messageMatches = entry.message.toLowerCase().includes(searchTerm);
        
        let detailsString = '';
        if (entry.details) {
          detailsString = typeof entry.details === 'object' 
            ? JSON.stringify(entry.details) 
            : String(entry.details);
        }
        const detailsMatch = detailsString.toLowerCase().includes(searchTerm);
        
        if (!messageMatches && !detailsMatch) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by timestamp (oldest first)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [parsedEntries, entryFilters]);
  
  // Fetch log content when a log is selected
  const fetchLogContent = useCallback(async (logId: string) => {
    // If we already have this log in the cache, use it
    if (logCache[logId]) {
      const selectedLogItem = logs.find(log => log.id === logId)
      if (selectedLogItem) {
        setSelectedLog({
          ...selectedLogItem,
          content: logCache[logId]
        })
        setSelectedEntryIndex(-1) // Reset entry selection
        return
      }
    }
    
    setLoadingLogContent(true)
    
    try {
      const response = await fetch(`/api/logs/${logId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      
      const response_1 = await response.json()
      // Fix: Unwrap API response structure (API returns {success: true, data: {...}})
      const logData = response_1.success ? response_1.data : response_1
      
      // Store in cache
      if (logData.content) {
        logCache[logId] = logData.content
      }
      
      setSelectedLog(logData)
      setSelectedEntryIndex(-1) // Reset entry selection
      
      // Mark as read if not already
      if (!logData.isRead) {
        markLogAsRead(logId)
      }
    } catch (error) {
      console.error('Failed to fetch log content', error)
      toast.error('Failed to load log content')
    } finally {
      setLoadingLogContent(false)
    }
  }, [logs])
  
  // Mark log as read
  const markLogAsRead = async (logId: string) => {
    try {
      const response = await fetch(`/api/logs/${logId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      })
      
      if (response.ok) {
        // Update local state
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === logId ? { ...log, isRead: true } : log
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark log as read', error)
    }
  }
  
  // Toggle read status
  const toggleReadStatus = async (logId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/logs/${logId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: !currentStatus }),
      })
      
      if (response.ok) {
        // Update local state
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === logId ? { ...log, isRead: !currentStatus } : log
          )
        )
        toast.success(`Log marked as ${!currentStatus ? 'read' : 'unread'}`)
      }
    } catch (error) {
      console.error('Failed to update read status', error)
      toast.error('Failed to update read status')
    }
  }
  
  // Delete a log
  const deleteLog = async (logId: string) => {
    try {
      const response = await fetch(`/api/logs/${logId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove from cache
        delete logCache[logId]
        
        // Update state
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
        
        if (selectedLogId === logId) {
          setSelectedLogId(null)
          setSelectedLog(null)
          setSelectedEntryIndex(-1)
        }
        
        toast.success('Log deleted successfully')
      } else {
        throw new Error('Failed to delete log')
      }
    } catch (error) {
      console.error('Failed to delete log', error)
      toast.error('Failed to delete log')
    }
  }
  
  // Handle selecting a log
  const handleSelectLog = (logId: string) => {
    setSelectedLogId(logId)
    fetchLogContent(logId)
  }
  
  // Handle selecting an entry
  const handleSelectEntry = (index: number) => {
    setSelectedEntryIndex(index)
  }
  
  // Filter logs by search text
  const filteredLogs = logs
    .filter(log => {
      // Filter by search text
      if (logFilters.searchText) {
        const searchTerm = logFilters.searchText.toLowerCase()
        const commentMatches = log.comment.toLowerCase().includes(searchTerm)
        
        if (!commentMatches) {
          return false
        }
      }
      
      return true
    })
  
  if (loading) {
    return <div className="p-4">Loading logs...</div>
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading logs: {error}</p>
        <p className="text-sm mt-2">Please try again later or contact support if the problem persists.</p>
      </div>
    )
  }
  
  return (
    <div className="flex h-full bg-white">
      {/* Log List Column (1/5) */}
      <div className="w-1/5 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <Input
            placeholder="Search logs..."
            value={logFilters.searchText}
            onChange={(e) => setLogFilters(prev => ({ ...prev, searchText: e.target.value }))}
            className="text-sm"
          />
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                isSelected={log.id === selectedLogId}
                onClick={() => handleSelectLog(log.id)}
                onDelete={() => deleteLog(log.id)}
                onToggleRead={() => toggleReadStatus(log.id, log.isRead)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Log Entries Column (1/5) */}
      <div className="w-1/5 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-3 flex-shrink-0">
          <Input
            placeholder="Filter entries..."
            value={entryFilters.searchText}
            onChange={(e) => setEntryFilters(prev => ({ ...prev, searchText: e.target.value }))}
            className="text-sm"
          />
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-log" 
                checked={entryFilters.showLog}
                onCheckedChange={(checked) => 
                  setEntryFilters(prev => ({ ...prev, showLog: !!checked }))
                }
              />
              <Label htmlFor="show-log" className="text-xs">LOG</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-warn" 
                checked={entryFilters.showWarn}
                onCheckedChange={(checked) => 
                  setEntryFilters(prev => ({ ...prev, showWarn: !!checked }))
                }
              />
              <Label htmlFor="show-warn" className="text-xs">WARN</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-error" 
                checked={entryFilters.showError}
                onCheckedChange={(checked) => 
                  setEntryFilters(prev => ({ ...prev, showError: !!checked }))
                }
              />
              <Label htmlFor="show-error" className="text-xs">ERROR</Label>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {loadingLogContent ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Loading log entries...
            </div>
          ) : !selectedLog ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              Select a log to view entries
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No entries match your filters
            </div>
          ) : (
            <LogEntryList 
              entries={filteredEntries}
              selectedIndex={selectedEntryIndex}
              onSelectEntry={handleSelectEntry}
            />
          )}
        </div>
      </div>
      
      {/* Log Entry Details Column (3/5) */}
      <div className="w-3/5 overflow-y-auto overflow-x-auto">
        <LogEntryDetails 
          entry={selectedEntryIndex >= 0 ? filteredEntries[selectedEntryIndex] : null}
          loading={loadingLogContent}
        />
      </div>
    </div>
  )
}