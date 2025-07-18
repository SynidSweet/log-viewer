'use client'

import { useState } from 'react'
import { LogViewerDynamic as LogViewer } from '@/components/log-viewer/log-viewer-dynamic'
import { UploadLogsModalDynamic as UploadLogsModal } from '@/components/upload-logs-modal-dynamic'
import { Button } from '@/components/ui/button'
import { Upload } from '@/components/icons'
import { Project } from '@/lib/types'

interface ProjectContentProps {
  project: Project
}

export function ProjectContent({ project }: ProjectContentProps) {
  const [refresh, setRefresh] = useState(0)
  
  const handleLogsUploaded = () => {
    setRefresh(prev => prev + 1)
  }
  
  return (
    <div className="py-6 px-4 md:px-6 max-w-screen mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.description}</p>
        </div>
        
        <div className="flex gap-2">
          <UploadLogsModal 
            projectId={project.id} 
            onLogsUploaded={handleLogsUploaded}
            trigger={
              <Button className="w-full md:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logs
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Log viewer component */}
      <div className="border rounded-lg overflow-hidden flex-grow">
        <LogViewer key={`logs-${refresh}`} projectId={project.id} />
      </div>
    </div>
  )
} 