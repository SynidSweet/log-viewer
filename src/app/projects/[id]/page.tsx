// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/db'
import { LogViewer } from '@/components/log-viewer'

type Params = Promise<{ id: string }>

export default async function ProjectPage({ params }: { params: Params }) {
  const { id } = await params
  const project = await getProject(id)
  
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