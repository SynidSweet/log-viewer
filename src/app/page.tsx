'use client'

// app/page.tsx
import { useState, useEffect } from 'react'
import { CreateProject } from '@/components/create-project'
import { ProjectList } from '@/components/project-list'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [baseUrl, setBaseUrl] = useState('')
  
  useEffect(() => {
    // Get the base URL dynamically
    setBaseUrl(window.location.origin)
  }, [])
  
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
            POST {baseUrl ? `${baseUrl}/api/logs` : '...loading endpoint...'}
          </code>
          
          <p className="mb-2">Headers:</p>
          <pre className="bg-gray-100 p-2 rounded mb-4 overflow-auto">
{`{
  "Content-Type": "application/json"
}`}
          </pre>
          
          <p className="mb-2">Request body:</p>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
{`{
  "projectId": "your-project-id",
  "apiKey": "your-project-api-key",
  "content": "[2025-04-29, 08:40:24] [LOG] Your log message - {}",
  "comment": "Optional description of this log submission"
}`}
          </pre>
          
          <div className="mt-4 space-y-3">            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium mb-1">Log Format Examples:</p>
              <pre className="text-xs overflow-auto">
{`[2025-04-29, 08:40:24] [LOG] User logged in successfully
[2025-04-29, 08:41:12] [ERROR] Failed to process payment - {"code": 500}
[2025-04-29, 08:42:30] [WARN] Low disk space detected - {"available": "120MB"}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}