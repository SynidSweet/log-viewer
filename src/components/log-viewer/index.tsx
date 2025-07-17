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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Filter, ChevronDown, Copy, CheckSquare, Square } from 'lucide-react'
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
    showInfo: true,
    showWarn: true,
    showError: true,
    showDebug: true,
    selectedTags: [] as string[]
  })
  // Initialize sort order from localStorage or default to 'asc'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const savedSortOrder = localStorage.getItem('logViewer.sortOrder')
      if (savedSortOrder === 'asc' || savedSortOrder === 'desc') {
        return savedSortOrder
      }
    }
    return 'asc'
  })
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagSearchTerm, setTagSearchTerm] = useState('')
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  
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
        let tags: string[] = [];
        
        if (detailsStr) {
          try {
            details = JSON.parse(detailsStr);
            // Extract _tags field if it exists and is an array
            if (details && typeof details === 'object' && Array.isArray(details._tags)) {
              tags = details._tags.filter((tag: unknown): tag is string => typeof tag === 'string');
            }
          } catch {
            details = detailsStr;
          }
        }
        
        entries.push({
          id: `entry_${entries.length}`,
          timestamp,
          level: level as 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
          message,
          details,
          tags: tags.length > 0 ? tags : undefined
        });
      } else {
        // If line doesn't match pattern, add it as a raw message
        entries.push({
          id: `entry_${entries.length}`,
          timestamp: new Date().toISOString(),
          level: 'LOG',
          message: line,
          tags: undefined
        });
      }
    }
    
    return entries;
  }, [selectedLog?.content]);
  
  // Filter log entries based on the entry filters (simplified for performance)
  const filteredEntries = useMemo(() => {
    let filtered = parsedEntries;
    
    // Level filtering
    filtered = filtered.filter(entry => {
      switch (entry.level) {
        case 'LOG': return entryFilters.showLog;
        case 'INFO': return entryFilters.showInfo;
        case 'WARN': return entryFilters.showWarn;
        case 'ERROR': return entryFilters.showError;
        case 'DEBUG': return entryFilters.showDebug;
        default: return true;
      }
    });
    
    // Search filtering (only if search term exists)
    if (entryFilters.searchText) {
      const searchTerm = entryFilters.searchText.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.message.toLowerCase().includes(searchTerm) ||
        (entry.details && String(entry.details).toLowerCase().includes(searchTerm))
      );
    }
    
    // Tag filtering (only if tags selected)
    if (entryFilters.selectedTags.length > 0) {
      filtered = filtered.filter(entry => 
        entry.tags?.some(tag => entryFilters.selectedTags.includes(tag))
      );
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
    
    return filtered;
  }, [parsedEntries, entryFilters.showLog, entryFilters.showInfo, entryFilters.showWarn, entryFilters.showError, entryFilters.showDebug, entryFilters.searchText, entryFilters.selectedTags, sortOrder]);

  // Extract all unique tags from parsed entries for the dropdown
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    parsedEntries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }, [parsedEntries]);

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!tagSearchTerm) return availableTags;
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
    );
  }, [availableTags, tagSearchTerm]);
  
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

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => {
      const newOrder = prev === 'asc' ? 'desc' : 'asc'
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('logViewer.sortOrder', newOrder)
      }
      return newOrder
    })
  }, [])

  // Tag filtering utility functions
  const toggleTag = useCallback((tag: string) => {
    setEntryFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }))
  }, [])

  const selectAllTags = useCallback(() => {
    setEntryFilters(prev => ({
      ...prev,
      selectedTags: [...availableTags]
    }))
  }, [availableTags])

  const clearAllTags = useCallback(() => {
    setEntryFilters(prev => ({
      ...prev,
      selectedTags: []
    }))
    setTagSearchTerm('')
  }, [])

  // Selection functions
  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntryIds(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(entryId)) {
        newSelection.delete(entryId)
      } else {
        newSelection.add(entryId)
      }
      return newSelection
    })
  }, [])

  const selectAllEntries = useCallback(() => {
    const allIds = new Set(filteredEntries.map(entry => entry.id))
    setSelectedEntryIds(allIds)
  }, [filteredEntries])

  const clearAllSelections = useCallback(() => {
    setSelectedEntryIds(new Set())
  }, [])

  const copySelectedEntries = useCallback(() => {
    const selectedEntries = filteredEntries.filter(entry => selectedEntryIds.has(entry.id))
    
    if (selectedEntries.length === 0) {
      toast.error('No entries selected to copy')
      return
    }

    // Format entries for copying
    const formattedEntries = selectedEntries.map(entry => {
      let output = `[${entry.timestamp}] [${entry.level}] ${entry.message}`
      if (entry.details) {
        const detailsStr = typeof entry.details === 'object' 
          ? JSON.stringify(entry.details, null, 2) 
          : String(entry.details)
        output += ` - ${detailsStr}`
      }
      return output
    }).join('\n')

    // Copy to clipboard
    navigator.clipboard.writeText(formattedEntries).then(() => {
      toast.success(`Copied ${selectedEntries.length} log entries to clipboard`)
      setSelectedEntryIds(new Set()) // Clear selection after copying
    }).catch((error) => {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    })
  }, [filteredEntries, selectedEntryIds])
  
  // Add keyboard shortcut for sort toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if the user is typing in an input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                            activeElement instanceof HTMLTextAreaElement;
      
      // Only trigger if 's' is pressed and user is not typing in an input
      if (event.key === 's' && !event.ctrlKey && !event.metaKey && !event.altKey && !isInputFocused) {
        event.preventDefault();
        toggleSortOrder();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleSortOrder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownOpen && event.target instanceof Element) {
        const dropdown = document.getElementById('tag-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setTagDropdownOpen(false);
          setTagSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagDropdownOpen]);
  
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
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filter entries..."
              value={entryFilters.searchText}
              onChange={(e) => setEntryFilters(prev => ({ ...prev, searchText: e.target.value }))}
              className="text-sm flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="flex items-center space-x-1"
              title={`Sort by timestamp ${sortOrder === 'asc' ? 'ascending' : 'descending'} (Press 's' to toggle)`}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {/* Copy Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectedEntryIds.size === filteredEntries.length ? clearAllSelections : selectAllEntries}
              className="flex items-center space-x-1 text-xs"
              disabled={filteredEntries.length === 0}
            >
              {selectedEntryIds.size === filteredEntries.length ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              <span>All</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={copySelectedEntries}
              className="flex items-center space-x-1 text-xs"
              disabled={selectedEntryIds.size === 0}
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
              {selectedEntryIds.size > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {selectedEntryIds.size}
                </Badge>
              )}
            </Button>
          </div>

          {/* Tags Filter Dropdown */}
          <div className="relative" id="tag-dropdown">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className="flex items-center space-x-2 text-xs"
              disabled={availableTags.length === 0}
            >
              <Filter className="h-3 w-3" />
              <span>Tags</span>
              {entryFilters.selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {entryFilters.selectedTags.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
            
            {tagDropdownOpen && availableTags.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                {/* Search input */}
                <div className="p-2 border-b border-gray-200">
                  <Input
                    placeholder="Search tags..."
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    className="text-xs h-7"
                  />
                </div>
                
                {/* Actions */}
                <div className="p-2 border-b border-gray-200 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTags}
                    className="text-xs h-6 px-2"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllTags}
                    className="text-xs h-6 px-2"
                  >
                    Clear All
                  </Button>
                </div>
                
                {/* Tags list */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredTags.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500">
                      {tagSearchTerm ? 'No tags match your search' : 'No tags available'}
                    </div>
                  ) : (
                    filteredTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={entryFilters.selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-xs flex-1 cursor-pointer">
                          {tag}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
                id="show-info" 
                checked={entryFilters.showInfo}
                onCheckedChange={(checked) => 
                  setEntryFilters(prev => ({ ...prev, showInfo: !!checked }))
                }
              />
              <Label htmlFor="show-info" className="text-xs">INFO</Label>
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-debug" 
                checked={entryFilters.showDebug}
                onCheckedChange={(checked) => 
                  setEntryFilters(prev => ({ ...prev, showDebug: !!checked }))
                }
              />
              <Label htmlFor="show-debug" className="text-xs">DEBUG</Label>
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
              selectedEntryIds={selectedEntryIds}
              onToggleSelection={toggleEntrySelection}
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