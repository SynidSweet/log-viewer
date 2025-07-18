'use client'

import { useState, useCallback } from 'react'
import { ProjectLog } from '@/lib/types'
import { toast } from 'sonner'

// Create a cache for log content to avoid repeated fetches
const logCache: Record<string, string> = {}

interface UseLogOperationsProps {
  logs: ProjectLog[]
  setLogs: React.Dispatch<React.SetStateAction<ProjectLog[]>>
  selectedLogId: string | null
  setSelectedLogId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedLog: React.Dispatch<React.SetStateAction<ProjectLog | null>>
  setSelectedEntryIndex: React.Dispatch<React.SetStateAction<number>>
}

export function useLogOperations({
  logs,
  setLogs,
  selectedLogId,
  setSelectedLogId,
  setSelectedLog,
  setSelectedEntryIndex
}: UseLogOperationsProps) {
  const [loadingLogContent, setLoadingLogContent] = useState(false)

  // Mark log as read
  const markLogAsRead = useCallback(async (logId: string) => {
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
    } catch {
      // Silently fail - not critical for user experience
    }
  }, [setLogs])

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
    } catch {
      toast.error('Failed to load log content')
    } finally {
      setLoadingLogContent(false)
    }
  }, [logs, setSelectedLog, setSelectedEntryIndex, markLogAsRead])
  
  // Toggle read status
  const toggleReadStatus = useCallback(async (logId: string, currentStatus: boolean) => {
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
    } catch {
      toast.error('Failed to update read status')
    }
  }, [setLogs])
  
  // Delete a log
  const deleteLog = useCallback(async (logId: string) => {
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
    } catch {
      toast.error('Failed to delete log')
    }
  }, [selectedLogId, setLogs, setSelectedLogId, setSelectedLog, setSelectedEntryIndex])
  
  // Handle selecting a log
  const handleSelectLog = useCallback((logId: string) => {
    setSelectedLogId(logId)
    fetchLogContent(logId)
  }, [fetchLogContent, setSelectedLogId])

  return {
    loadingLogContent,
    fetchLogContent,
    markLogAsRead,
    toggleReadStatus,
    deleteLog,
    handleSelectLog
  }
}