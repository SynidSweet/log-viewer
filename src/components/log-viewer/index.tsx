// components/log-viewer/index.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ProjectLog } from '@/lib/types'
import { LogItem } from './log-item'
import { LogEntryList } from './log-entry-list'
import { LogEntryListVirtualized } from './log-entry-list-virtualized'
import { LogEntryDetails, LogEntry } from './log-entry-details'
import { LogEntryFilters, EntryFilters } from './log-entry-filters'
import { useLogOperations } from './use-log-operations'
import { useDebounce } from '@/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { PerformanceProfiler } from '@/components/profiler/performance-profiler'

export interface LogViewerProps {
  projectId: string
  enableVirtualization?: boolean
}

// Regular expression to parse log lines
const LOG_PATTERN = /\[(.*?)\] \[(.*?)\] (.*?)( - (.*))?$/;

export function LogViewer({ projectId, enableVirtualization = false }: LogViewerProps) {
  const [logs, setLogs] = useState<ProjectLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<ProjectLog | null>(null)
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(-1)
  // Immediate input state for responsive UI
  const [logSearchInput, setLogSearchInput] = useState('')
  const [entrySearchInput, setEntrySearchInput] = useState('')
  
  // Debounced search values for actual filtering (300ms delay)
  const debouncedLogSearch = useDebounce(logSearchInput, 300)
  const debouncedEntrySearch = useDebounce(entrySearchInput, 300)
  
  const [logFilters, setLogFilters] = useState({
    searchText: ''
  })
  const [entryFilters, setEntryFilters] = useState<EntryFilters>({
    searchText: '',
    showLog: true,
    showInfo: true,
    showWarn: true,
    showError: true,
    showDebug: true,
    selectedTags: []
  })
  // Initialize sort order from localStorage or default to 'asc' - optimized for mount performance
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [sortOrderLoaded, setSortOrderLoaded] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())

  // Cache for parsed entries to avoid re-parsing on every render
  const parsedEntriesCache = useRef<Map<string, LogEntry[]>>(new Map())
  const timestampsCache = useRef<Map<string, number>>(new Map())

  // Use the extracted hook for log operations
  const { 
    loadingLogContent, 
    toggleReadStatus, 
    deleteLog, 
    handleSelectLog 
  } = useLogOperations({
    logs,
    setLogs,
    selectedLogId,
    setSelectedLogId,
    setSelectedLog,
    setSelectedEntryIndex
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
        setError((error as Error).message || 'Failed to load logs')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [projectId])
  
  // Update actual filter state when debounced values change
  useEffect(() => {
    setLogFilters(prev => ({ ...prev, searchText: debouncedLogSearch }))
  }, [debouncedLogSearch])
  
  useEffect(() => {
    setEntryFilters(prev => ({ ...prev, searchText: debouncedEntrySearch }))
  }, [debouncedEntrySearch])
  
  // Load sort order from localStorage asynchronously after mount to improve mount performance
  useEffect(() => {
    if (!sortOrderLoaded && typeof window !== 'undefined') {
      try {
        const savedSortOrder = window.localStorage?.getItem('logViewer.sortOrder')
        if (savedSortOrder === 'asc' || savedSortOrder === 'desc') {
          setSortOrder(savedSortOrder)
        }
      } catch (error) {
        // Handle localStorage being unavailable or throwing errors
        console.debug('localStorage unavailable:', error)
      }
      setSortOrderLoaded(true)
    }
  }, [sortOrderLoaded])
  
  // Parse the log content into entries with caching optimization - defer complex work until needed
  const parsedEntries = useMemo(() => {
    if (!selectedLog?.content) return [];
    
    // Create cache key from content hash for fast lookup
    const cacheKey = `${selectedLog.id}_${selectedLog.content.length}_${selectedLog.content.slice(0, 100)}`;
    
    // Check cache first for immediate return
    if (parsedEntriesCache.current.has(cacheKey)) {
      return parsedEntriesCache.current.get(cacheKey)!;
    }
    
    const entries: LogEntry[] = [];
    const lines = selectedLog.content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
          id: `entry_${i}`,
          timestamp,
          level: level as 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
          message,
          details,
          tags: tags.length > 0 ? tags : undefined
        });
      } else {
        // If line doesn't match pattern, add it as a raw message
        entries.push({
          id: `entry_${i}`,
          timestamp: new Date().toISOString(),
          level: 'LOG',
          message: line,
          tags: undefined
        });
      }
    }
    
    // Cache the result
    parsedEntriesCache.current.set(cacheKey, entries);
    
    // Limit cache size to prevent memory leaks
    if (parsedEntriesCache.current.size > 50) {
      const firstKey = parsedEntriesCache.current.keys().next().value;
      if (firstKey !== undefined) {
        parsedEntriesCache.current.delete(firstKey);
      }
    }
    
    return entries;
  }, [selectedLog?.content, selectedLog?.id]);
  
  // Memoize parsed timestamps with caching to avoid repeated Date parsing
  const entriesWithParsedTimestamps = useMemo(() => {
    return parsedEntries.map(entry => {
      // Use cached timestamp if available
      let timestampMs = timestampsCache.current.get(entry.timestamp);
      if (timestampMs === undefined) {
        timestampMs = new Date(entry.timestamp).getTime();
        timestampsCache.current.set(entry.timestamp, timestampMs);
        
        // Limit cache size to prevent memory leaks
        if (timestampsCache.current.size > 1000) {
          const firstKey = timestampsCache.current.keys().next().value;
          if (firstKey !== undefined) {
            timestampsCache.current.delete(firstKey);
          }
        }
      }
      
      return {
        ...entry,
        _timestampMs: timestampMs
      };
    });
  }, [parsedEntries]);

  // Separate filtering steps for better granular memoization
  const levelFilterSettings = useMemo(() => ({
    'LOG': entryFilters.showLog,
    'INFO': entryFilters.showInfo,
    'WARN': entryFilters.showWarn,
    'ERROR': entryFilters.showError,
    'DEBUG': entryFilters.showDebug
  }), [entryFilters.showLog, entryFilters.showInfo, entryFilters.showWarn, entryFilters.showError, entryFilters.showDebug]);

  // Level filtering - memoized separately to avoid re-computation when other filters change
  const levelFilteredEntries = useMemo(() => {
    return entriesWithParsedTimestamps.filter(entry => levelFilterSettings[entry.level] ?? true);
  }, [entriesWithParsedTimestamps, levelFilterSettings]);

  // Search filtering - memoized separately with optimized string operations
  const searchFilteredEntries = useMemo(() => {
    if (!entryFilters.searchText) return levelFilteredEntries;
    
    const searchTerm = entryFilters.searchText.toLowerCase();
    return levelFilteredEntries.filter(entry => {
      // Pre-compute lowercase versions for better performance
      const messageMatch = entry.message.toLowerCase().includes(searchTerm);
      if (messageMatch) return true;
      
      // Only check details if message doesn't match
      return entry.details && String(entry.details).toLowerCase().includes(searchTerm);
    });
  }, [levelFilteredEntries, entryFilters.searchText]);

  // Tag filtering - memoized separately with Set optimization
  const tagFilteredEntries = useMemo(() => {
    if (entryFilters.selectedTags.length === 0) return searchFilteredEntries;
    
    const selectedTagsSet = new Set(entryFilters.selectedTags);
    return searchFilteredEntries.filter(entry => 
      entry.tags?.some(tag => selectedTagsSet.has(tag))
    );
  }, [searchFilteredEntries, entryFilters.selectedTags]);

  // Final sorting - memoized separately to avoid re-sort when filters change but order doesn't
  const filteredEntries = useMemo(() => {
    const sorted = [...tagFilteredEntries];
    sorted.sort((a, b) => {
      return sortOrder === 'asc' ? a._timestampMs - b._timestampMs : b._timestampMs - a._timestampMs;
    });
    return sorted;
  }, [tagFilteredEntries, sortOrder]);

  // Extract all unique tags from parsed entries - optimized for mount performance with lazy loading
  const availableTags = useMemo(() => {
    // Defer tag extraction if no entries to avoid mount overhead
    if (parsedEntries.length === 0) return [];
    
    const tagSet = new Set<string>();
    
    // Use for loop for better performance than forEach
    for (let i = 0; i < parsedEntries.length; i++) {
      const entry = parsedEntries[i];
      if (entry.tags) {
        for (let j = 0; j < entry.tags.length; j++) {
          tagSet.add(entry.tags[j]);
        }
      }
    }
    
    return Array.from(tagSet).sort();
  }, [parsedEntries]);

  // Handle selecting an entry
  const handleSelectEntry = useCallback((index: number) => {
    setSelectedEntryIndex(index)
  }, [])

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => {
      const newOrder = prev === 'asc' ? 'desc' : 'asc'
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage?.setItem('logViewer.sortOrder', newOrder)
        } catch (error) {
          // Handle localStorage being unavailable or throwing errors
          console.debug('localStorage unavailable:', error)
        }
      }
      return newOrder
    })
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
    setSelectedEntryIds(new Set(filteredEntries.map(entry => entry.id)))
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
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }, [filteredEntries, selectedEntryIds])
  
  // Add keyboard shortcut for sort toggle - defer setup to improve mount performance
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    
    // Defer keyboard setup to reduce mount blocking
    const timeoutId = setTimeout(() => {
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
      
      cleanupFn = () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }, 100); // Defer by 100ms
    
    return () => {
      clearTimeout(timeoutId);
      // Also call cleanup function if it was set
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [toggleSortOrder]);
  
  // Filter logs by search text - optimized with early return
  const filteredLogs = useMemo(() => {
    if (!logFilters.searchText.trim()) return logs;
    
    const searchTerm = logFilters.searchText.toLowerCase().trim();
    return logs.filter(log => 
      log.comment.toLowerCase().includes(searchTerm)
    );
  }, [logs, logFilters.searchText]);
  
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
    <PerformanceProfiler id="LogViewer">
      <div className="flex h-full bg-white">
      {/* Log List Column (1/5) */}
      <div className="w-1/5 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <Input
            placeholder="Search logs..."
            value={logSearchInput}
            onChange={(e) => setLogSearchInput(e.target.value)}
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
                onSelectLog={handleSelectLog}
                onDeleteLog={deleteLog}
                onToggleReadStatus={toggleReadStatus}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Log Entries Column (1/5) */}
      <div className="w-1/5 border-r border-gray-200 flex flex-col overflow-hidden">
        <LogEntryFilters
          entryFilters={entryFilters}
          onFiltersChange={setEntryFilters}
          searchInput={entrySearchInput}
          onSearchInputChange={setEntrySearchInput}
          sortOrder={sortOrder}
          onSortOrderChange={toggleSortOrder}
          availableTags={availableTags}
          selectedEntryIds={selectedEntryIds}
          filteredEntries={filteredEntries}
          onSelectAllEntries={selectAllEntries}
          onClearAllSelections={clearAllSelections}
          onCopySelectedEntries={copySelectedEntries}
        />
        
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
          ) : enableVirtualization ? (
            <LogEntryListVirtualized 
              entries={filteredEntries}
              selectedIndex={selectedEntryIndex}
              onSelectEntry={handleSelectEntry}
              selectedEntryIds={selectedEntryIds}
              onToggleSelection={toggleEntrySelection}
            />
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
    </PerformanceProfiler>
  )
}