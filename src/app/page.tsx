'use client'

// app/page.tsx
import { useState } from 'react'
import { CreateProject } from '@/components/create-project'
import { ProjectList } from '@/components/project-list'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleProjectCreated = () => {
    // Force refresh the ProjectList when a new project is created
    setRefreshKey(prevKey => prevKey + 1)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Log Viewer</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Projects</h3>
            <CreateProject onProjectCreated={handleProjectCreated} />
          </div>
          <ProjectList key={refreshKey} />
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-4">API Documentation</h3>
          <p className="mb-2">Send logs to your project using this endpoint:</p>
          <code className="block bg-gray-100 p-2 rounded mb-4">
            POST /api/logs
          </code>
          <p className="mb-2">Request body:</p>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
{`{
  "projectId": "your-project-id",
  "schemaVersion": "v1",
  "logs": "[2025-04-29, 08:40:24] [LOG] Your log message - {}"
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}