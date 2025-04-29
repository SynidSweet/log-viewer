// src/components/log-viewer/log-details.tsx
'use client'

import { LogEntry } from '@/lib/types'
import { JsonTree } from './json-tree'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner' // Updated import

interface LogDetailsProps {
  log: LogEntry | null
}

export function LogDetails({ log }: LogDetailsProps) {
  if (!log) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a log to view details
      </div>
    )
  }
  
  // Check if we have extended data
  const hasExtended = log.details && 
    typeof log.details === 'object' && 
    log.details._extended
  
  const copyToClipboard = () => {
    const logText = `[${format(new Date(log.timestamp), 'yyyy-MM-dd, HH:mm:ss')}] [${log.level}] ${log.message}${
      log.details ? `\n\nDetails:\n${JSON.stringify(log.details, null, 2)}` : ''
    }`
    
    navigator.clipboard.writeText(logText)
      .then(() => {
        toast.success('Copied', {
          description: 'Log copied to clipboard'
        })
      })
      .catch(() => {
        toast.error('Error', {
          description: 'Failed to copy log to clipboard'
        })
      })
  }
  
  // Determine background color based on log level
  const levelBgColor = {
    LOG: 'bg-green-500',
    WARN: 'bg-yellow-500',
    ERROR: 'bg-red-500'
  }[log.level] || 'bg-gray-500'
  
  const levelTextColor = log.level === 'WARN' ? 'text-black' : 'text-white'
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <span className={`inline-block font-bold px-2 py-1 rounded ${levelBgColor} ${levelTextColor} mb-2`}>
          {log.level}
        </span>
        <div className="text-lg font-bold mb-2 break-words">
          {log.message}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {hasExtended ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="extended">Extended Data</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="flex-1 overflow-auto p-3 bg-gray-100 rounded-md">
              <JsonTree data={(() => {
                const regularDetails = { ...log.details }
                delete regularDetails._extended
                return regularDetails
              })()} />
            </TabsContent>
            <TabsContent value="extended" className="flex-1 overflow-auto p-3 bg-gray-100 rounded-md">
              <JsonTree data={log.details?._extended} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-auto p-3 bg-gray-100 rounded-md">
            <JsonTree data={log.details || 'No details available'} />
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <Button onClick={copyToClipboard}>Copy Log</Button>
      </div>
    </div>
  )
}