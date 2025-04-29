// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/db'
import { LogViewer } from '@/components/log-viewer'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id)
  
  if (!project) {
    notFound()
  }
  
  return (
    <div className="container mx-auto p-4 h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">{project.description}</p>
      </div>
      
      <div className="border rounded-lg shadow-sm p-4 h-[calc(100vh-180px)]">
        <LogViewer projectId={project.id} />
      </div>
    </div>
  )
}