'use client'

// app/page.tsx
import { useState, useEffect } from 'react'
import { CreateProject } from '@/components/create-project'
import { ProjectList } from '@/components/project-list'
import { PageSession } from '@/components/page-session'

// Main component that will be wrapped with PageSession
function HomePage() {
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
  "projectId": "your-project-id",        // Required
  "apiKey": "your-project-api-key",      // Required  
  "content": "log entries (see below)",  // Required
  "comment": "Optional description"      // Optional
}`}
          </pre>
          
          <div className="mt-4 space-y-3">            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm font-medium mb-1">Log Format:</p>
              <p className="text-xs text-gray-600 mb-2">Pattern: <code>[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE</code> or <code>[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA</code></p>
              <p className="text-xs text-gray-600 mb-2">Supported levels: <code>LOG</code>, <code>ERROR</code>, <code>INFO</code>, <code>WARN</code>, <code>DEBUG</code></p>
              <p className="text-xs text-gray-600 mb-2">The <code>- DATA</code> portion is optional. You can send multiple log entries separated by newlines.</p>
              
              <p className="text-sm font-medium mt-3 mb-1">Examples:</p>
              <pre className="text-xs overflow-auto">
{`// Simple logs without data
[2025-04-29, 08:40:24] [LOG] User logged in successfully
[2025-04-29, 08:40:25] [INFO] Cache cleared

// Logs with JSON data
[2025-04-29, 08:41:12] [ERROR] Failed to process payment - {"code": 500, "reason": "timeout"}
[2025-04-29, 08:42:30] [WARN] Low disk space detected - {"available": "120MB"}

// Multiple entries in one request
[2025-04-29, 08:43:00] [DEBUG] Starting batch process
[2025-04-29, 08:43:01] [DEBUG] Processing item 1 of 100
[2025-04-29, 08:43:02] [DEBUG] Batch completed`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export wrapped with session provider
export default function Home() {
  return (
    <PageSession>
      <HomePage />
    </PageSession>
  )
}