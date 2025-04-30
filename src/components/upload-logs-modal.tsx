'use client'

import { useState, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface UploadLogsModalProps {
  projectId: string
  onLogsUploaded: () => void
  trigger: React.ReactNode
}

export function UploadLogsModal({ projectId, onLogsUploaded, trigger }: UploadLogsModalProps) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState('')
  const [comment, setComment] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    
    const files = e.dataTransfer.files
    if (files.length === 0) return
    
    const file = files[0]
    if (file.type !== 'text/plain' && !file.name.endsWith('.log')) {
      toast.error('Please drop a valid log file (.txt or .log)')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogs(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!logs.trim()) {
      toast.error('Please enter log content')
      return
    }
    
    setIsUploading(true)
    
    try {
      // Get project to retrieve the API key
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project information')
      }
      
      const projectData = await projectResponse.json()
      const apiKey = projectData.apiKey
      
      // Upload the log with the simplified API
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          apiKey,
          content: logs,
          comment
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logs')
      }
      
      // Success
      toast.success('Log uploaded successfully')
      setLogs('')
      setComment('')
      setOpen(false)
      onLogsUploaded()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to upload logs')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Logs</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the issue or context of this log"
            />
          </div>
          
          <div 
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => textareaRef.current?.focus()}
          >
            <p className="text-sm text-gray-500 mb-2">
              Paste log text below or drag and drop a log file here
            </p>
            <Textarea
              ref={textareaRef}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="min-h-[200px] max-h-[200px] mt-2 overflow-y-auto overflow-x-hidden resize-none"
              placeholder="[2023-04-01T12:34:56Z] [LOG] User logged in"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Recommended log format: <code>[timestamp] [level] message - details</code></p>
            <p>Example: <code>[2023-04-01T12:34:56Z] [ERROR] Failed to connect - &#123;&quot;service&quot;:&quot;database&quot;&#125;</code></p>
            <p>Your logs will be parsed in the client based on this format, but you can upload any text format.</p>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Logs'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 