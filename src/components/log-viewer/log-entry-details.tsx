'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { JsonTree } from './json-tree'
import { Button } from '@/components/ui/button'
import { Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'LOG' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
}

interface LogEntryDetailsProps {
  entry: LogEntry | null;
  loading: boolean;
}

export function LogEntryDetails({ entry, loading }: LogEntryDetailsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading log content...
      </div>
    );
  }
  
  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a log entry to view details
      </div>
    )
  }
  
  // Check if we have extended data
  const hasExtended = entry.details && 
    typeof entry.details === 'object' && 
    entry.details._extended;
  
  // Regular details (without the _extended field if present)
  const regularDetails = hasExtended 
    ? { ...entry.details, _extended: undefined } 
    : entry.details;
  
  const extendedDetails = hasExtended ? entry.details._extended : null;
  
  const copyToClipboard = () => {
    const textToCopy = `[${entry.timestamp}] [${entry.level}] ${entry.message}${
      entry.details ? `\n\nDetails:\n${JSON.stringify(entry.details, null, 2)}` : ''
    }`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast.success('Log entry copied to clipboard')
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard')
      })
  }
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <div className="flex items-center">
            <span 
              className={`text-white text-xs px-2 py-1 rounded uppercase font-medium mr-2 ${
                entry.level === 'ERROR' ? 'bg-red-500' : 
                entry.level === 'WARN' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              {entry.level}
            </span>
            <span className="text-sm text-gray-500">
              {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
            </span>
          </div>
          
          <h3 className="text-base font-semibold mt-2">
            {entry.message}
          </h3>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={copyToClipboard}
          className="h-8 px-2"
        >
          <Clipboard className="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {hasExtended ? (
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="extended">Extended Data</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-2 bg-gray-50 rounded-md mt-2 overflow-auto">
              {regularDetails ? (
                <div className="overflow-x-auto">
                  <JsonTree data={regularDetails} />
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-2">No details available</div>
              )}
            </TabsContent>
            <TabsContent value="extended" className="p-2 bg-gray-50 rounded-md mt-2 overflow-auto">
              {extendedDetails ? (
                <div className="overflow-x-auto">
                  <JsonTree data={extendedDetails} />
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-2">No extended data available</div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-2 bg-gray-50 rounded-md overflow-auto h-full">
            {entry.details ? (
              <div className="overflow-x-auto">
                <JsonTree data={entry.details} />
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-2">No details available</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 