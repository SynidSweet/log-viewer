'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/lib/types'
import { EditProjectModal } from './edit-project-modal'

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.success ? data.data : data)
      }
    } catch (error) {
      console.error('Failed to fetch projects', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  if (loading) {
    return <div className="py-4">Loading projects...</div>
  }

  if (projects.length === 0) {
    return <div className="py-4">No projects found. Create one to get started.</div>
  }

  return (
    <ul className="space-y-2">
      {projects.map((project) => (
        <li key={project.id} className="flex items-center">
          <button
            onClick={() => handleProjectClick(project.id)}
            className="flex-1 text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center"
          >
            <span className="flex-1 font-medium">{project.name}</span>
          </button>
          
          <EditProjectModal 
            project={project}
            onProjectUpdated={fetchProjects}
            trigger={
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full ml-1"
                onClick={(e) => e.stopPropagation()}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </button>
            }
          />
        </li>
      ))}
    </ul>
  )
} 