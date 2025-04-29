// app/page.tsx
import { ProjectSection } from '@/components/project-section'

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Log Viewer</h1>
      
      <div className="mb-8">
        <ProjectSection />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Create a new project using the button above</li>
            <li>Select your project from the dropdown to view logs</li>
            <li>Use the API endpoint to send logs to your project</li>
          </ol>
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