// app/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/db'
import { ProjectContent } from './project-content'

type Params = Promise<{ id: string }>

export default async function ProjectPage({ params }: { params: Params }) {
  const { id } = await params
  const project = await getProject(id)
  
  if (!project) {
    notFound()
  }
  
  return <ProjectContent project={project} />
}